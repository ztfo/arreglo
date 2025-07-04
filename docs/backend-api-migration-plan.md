# Backend API Migration Plan

## Overview
This document outlines the plan to migrate the Arreglo Figma plugin from requiring user-provided API keys to using a centralized backend service. This will improve user experience by eliminating the need for users to manage their own API keys while allowing us to control costs and usage.

## Current State Analysis

### Current Architecture
- **Plugin**: Direct API calls to OpenAI/Anthropic from Figma plugin
- **API Keys**: Stored locally in `figma.clientStorage`
- **Configuration**: User manages their own API keys via settings modal
- **Cost**: Users pay for their own API usage

### Key Files Currently Handling API Keys
- `src/core/config.ts` - API key storage and retrieval
- `src/core/types.ts` - `ApiConfig` interface definition
- `src/core/api/index.ts` - Main API orchestration
- `src/core/api/openai.ts` - Direct OpenAI API calls
- `src/core/api/anthropic.ts` - Direct Anthropic API calls
- `src/ui/components/Settings.ts` - API key management UI
- `src/ui/index.html` - Settings modal with API key inputs
- `manifest.json` - Network access to OpenAI/Anthropic domains

## Target Architecture

### New Backend Service
```
User → Figma Plugin → Backend API → OpenAI/Anthropic → Response
```

### Backend Technology Stack Options
1. **Vercel API Routes** (Recommended - since you already use Vercel)
   - Serverless functions
   - Easy deployment with your existing Vercel setup
   - Excellent TypeScript support
   - Built-in environment variable management
   - Good performance and caching options
   - Automatic HTTPS and global CDN
   - Simple integration with your existing workflow
   - Edge runtime support for better performance

2. **Supabase Edge Functions**
   - Serverless
   - Built-in auth integration
   - Good for our existing Supabase setup
   - Can be used in combination with Vercel

3. **Netlify Functions**
   - Serverless
   - Simple deployment

## Implementation Plan

### Phase 1: Backend Service Setup

#### 1.1 Create Backend API Structure
```typescript
// Backend API Endpoints
POST /api/generate-arrangement
POST /api/analyze-image
GET /api/user-usage (optional)
POST /api/track-usage (optional)
```

#### 1.2 Backend Service Implementation

**Vercel API Routes (Recommended):**
```typescript
// api/generate-arrangement.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { songData, userId } = await request.json();
    
    // Rate limiting check
    const canProceed = await checkRateLimit(userId);
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You have reached your daily limit.' },
        { status: 429 }
      );
    }
    
    // Generate arrangement using our API key
    const arrangement = await generateArrangementWithOpenAI(songData);
    
    // Track usage
    await trackUsage(userId, 'arrangement_generation', 5); // 5 cents cost
    
    return NextResponse.json({ arrangement });
  } catch (error) {
    console.error('Error generating arrangement:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate arrangement' },
      { status: 500 }
    );
  }
}

async function generateArrangementWithOpenAI(songData: any): Promise<string> {
  const prompt = createArrangementPrompt(songData);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });
  
  return response.choices[0].message.content || '';
}

async function checkRateLimit(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!rateLimit) {
    await supabase
      .from('rate_limits')
      .insert({ user_id: userId, daily_arrangements: 1, last_reset_date: today });
    return true;
  }
  
  // Reset if new day
  if (rateLimit.last_reset_date !== today) {
    await supabase
      .from('rate_limits')
      .update({ 
        daily_arrangements: 1,
        daily_image_analyses: 0,
        last_reset_date: today 
      })
      .eq('user_id', userId);
    return true;
  }
  
  // Check limits (5 arrangements per day for free users)
  const MAX_DAILY_ARRANGEMENTS = 5;
  if (rateLimit.daily_arrangements >= MAX_DAILY_ARRANGEMENTS) {
    return false;
  }
  
  // Increment usage
  await supabase
    .from('rate_limits')
    .update({ daily_arrangements: rateLimit.daily_arrangements + 1 })
    .eq('user_id', userId);
  
  return true;
}

async function trackUsage(userId: string, actionType: string, costCents: number) {
  await supabase
    .from('usage_logs')
    .insert({
      user_id: userId,
      action_type: actionType,
      cost_cents: costCents,
      metadata: { timestamp: new Date().toISOString() }
    });
}
```

```typescript
// api/analyze-image.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { base64Image, userId } = await request.json();
    
    // Rate limiting check for image analysis
    const canProceed = await checkImageAnalysisRateLimit(userId);
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for image analysis.' },
        { status: 429 }
      );
    }
    
    const trackNames = await analyzeImageWithOpenAI(base64Image);
    
    // Track usage
    await trackUsage(userId, 'image_analysis', 2); // 2 cents cost
    
    return NextResponse.json({ trackNames });
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

async function analyzeImageWithOpenAI(base64Image: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze this DAW screenshot and extract all track/instrument names. Return them as a comma-separated list."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  });

  const extractedText = response.choices[0].message.content || '';
  return extractedText.split(',').map((name: string) => name.trim());
}
```

**Alternative: Supabase Edge Function Example:**
```typescript
// supabase/functions/generate-arrangement/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { songData, userId } = await req.json();
    
    // Rate limiting check
    const canProceed = await checkRateLimit(userId);
    if (!canProceed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: corsHeaders }
      );
    }
    
    // Generate arrangement using our API key
    const arrangement = await generateArrangement(songData);
    
    // Track usage
    await trackUsage(userId, 'arrangement_generation');
    
    return new Response(
      JSON.stringify({ arrangement }),
      { headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
```

#### 1.3 Environment Variables Setup

**Vercel Environment Variables:**
```env
# Add these to your Vercel project settings
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
```

**For local development (.env.local):**
```env
# For local testing
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
```

**Vercel Deployment Setup:**
1. Add environment variables in Vercel dashboard
2. Configure for both Production and Preview environments
3. Set up domain for your API (e.g., `api.yourdomain.com` or use default vercel.app)

### Phase 2: Plugin Code Modifications

#### 2.1 Remove API Key Management
**Files to Modify:**
- `src/core/config.ts` - Remove API key functions
- `src/core/types.ts` - Update `ApiConfig` interface
- `src/ui/components/Settings.ts` - Remove API key inputs
- `src/ui/index.html` - Remove API key form fields

**Updated Types:**
```typescript
// src/core/types.ts
export interface ApiConfig {
  // Remove API key properties
  PREFERRED_API: 'anthropic' | 'openai';
  DATA_COLLECTION_CONSENT: boolean;
  // Add new properties if needed
  BACKEND_URL?: string;
}
```

#### 2.2 Update API Layer
**New API Implementation:**
```typescript
// src/core/api/backend.ts
export async function generateArrangement(songData: SongData): Promise<string> {
  const userId = await getUserId();
  const backendUrl = getBackendUrl();
  
  const response = await fetch(`${backendUrl}/api/generate-arrangement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
    body: JSON.stringify({ songData, userId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate arrangement');
  }
  
  const data = await response.json();
  return data.arrangement;
}

export async function analyzeImage(base64Image: string): Promise<string[]> {
  const userId = await getUserId();
  const backendUrl = getBackendUrl();
  
  const response = await fetch(`${backendUrl}/api/analyze-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
    body: JSON.stringify({ base64Image, userId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to analyze image');
  }
  
  const data = await response.json();
  return data.trackNames;
}

function getBackendUrl(): string {
  // Return your Vercel backend URL
  return process.env.NODE_ENV === 'production' 
    ? 'https://your-vercel-app.vercel.app'  // or your custom domain
    : 'https://your-vercel-app-preview.vercel.app';
}

async function getUserId(): Promise<string> {
  // Get user ID from Figma or generate anonymous ID
  return figma.currentUser?.id || await getAnonymousUserId();
}
```

#### 2.3 Update Main Plugin Code
```typescript
// src/code.ts - Updated message handler
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-arrangement') {
    try {
      // No need to check for API keys or config
      const arrangement = await generateArrangement(msg.songData);
      figma.ui.postMessage({
        type: 'success',
        message: arrangement
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message: error.message
      });
    }
  }
  
  if (msg.type === 'analyze-image') {
    try {
      const trackNames = await analyzeImage(msg.base64Image);
      figma.ui.postMessage({
        type: 'image-analyzed',
        trackNames
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message: error.message
      });
    }
  }
};
```

#### 2.4 Update Manifest
```json
// manifest.json
{
  "networkAccess": {
    "allowedDomains": [
      "https://your-backend.com",
      "https://cdnjs.cloudflare.com",
      "https://ka-f.fontawesome.com"
    ]
  }
}
```

### Phase 3: Usage Tracking & Rate Limiting

#### 3.1 Database Schema (Supabase)
```sql
-- Usage tracking table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'arrangement_generation', 'image_analysis'
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  cost_cents INTEGER -- Track API costs
);

-- Rate limiting table
CREATE TABLE rate_limits (
  user_id TEXT PRIMARY KEY,
  daily_arrangements INTEGER DEFAULT 0,
  daily_image_analyses INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE
);
```

#### 3.2 Rate Limiting Implementation
```typescript
// Backend rate limiting
async function checkRateLimit(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!rateLimit) {
    // Create new rate limit record
    await supabase
      .from('rate_limits')
      .insert({ user_id: userId, daily_arrangements: 0 });
    return true;
  }
  
  // Reset if new day
  if (rateLimit.last_reset_date !== today) {
    await supabase
      .from('rate_limits')
      .update({ 
        daily_arrangements: 0,
        daily_image_analyses: 0,
        last_reset_date: today 
      })
      .eq('user_id', userId);
    return true;
  }
  
  // Check limits (e.g., 5 arrangements per day for free users)
  const MAX_DAILY_ARRANGEMENTS = 5;
  return rateLimit.daily_arrangements < MAX_DAILY_ARRANGEMENTS;
}
```

### Phase 4: Cost Management

#### 4.1 Cost Tracking
```typescript
// Track API costs per request
async function trackUsage(userId: string, actionType: string, costCents: number) {
  await supabase
    .from('usage_logs')
    .insert({
      user_id: userId,
      action_type: actionType,
      cost_cents: costCents,
      metadata: { timestamp: new Date().toISOString() }
    });
}
```

#### 4.2 Cost Estimation
- **OpenAI GPT-4o**: ~$0.005 per arrangement (1000 tokens)
- **Anthropic Claude**: ~$0.015 per arrangement (1000 tokens)
- **Image Analysis**: ~$0.002 per image

#### 4.3 Revenue Model Options
1. **Freemium**: 3-5 free arrangements, then payment required
2. **Subscription**: Monthly unlimited usage
3. **Pay-per-use**: Small fee per arrangement

### Phase 5: UI Updates

#### 5.1 Remove Settings Modal Content
```html
<!-- Remove from src/ui/index.html -->
<!-- API key inputs no longer needed -->
<div class="modal-body">
  <div class="form-group">
    <label for="preferredApi">Preferred AI Model:</label>
    <select id="preferredApi">
      <option value="openai">OpenAI GPT-4o</option>
      <option value="anthropic">Anthropic Claude</option>
    </select>
  </div>
  <!-- Remove API key inputs -->
</div>
```

#### 5.2 Add Usage Display (Optional)
```html
<!-- Add usage counter to UI -->
<div class="usage-counter">
  <small>Arrangements today: <span id="usageCount">0</span>/5</small>
</div>
```

## Testing Strategy

### Phase 1 Testing
- [ ] Backend API responds correctly to arrangement requests
- [ ] Backend API handles image analysis
- [ ] Rate limiting works as expected
- [ ] Error handling is robust

### Phase 2 Testing  
- [ ] Plugin connects to backend successfully
- [ ] No API key prompts appear
- [ ] Arrangement generation works end-to-end
- [ ] Image analysis works end-to-end

### Phase 3 Testing
- [ ] Usage tracking records correctly
- [ ] Rate limits are enforced
- [ ] User experience is smooth when limits are hit

## Deployment Strategy

### Backend Deployment (Vercel)
1. **Development Environment**
   - Create new Vercel project or use existing one
   - Deploy to preview environment: `vercel --prod=false`
   - Add environment variables in Vercel dashboard
   - Test with development version of plugin

2. **Production Environment**
   - Deploy to production: `vercel --prod`
   - Verify environment variables are set for production
   - Update plugin manifest with production URLs
   - Test thoroughly before Figma store update

**Vercel-Specific Setup:**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Initialize Vercel project
vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Plugin Deployment
1. **Version the plugin** (e.g., v2.0.0)
2. **Update plugin description** to mention no API keys needed
3. **Submit to Figma store** for review

## Risk Assessment

### Technical Risks
- **Backend downtime**: Plugin becomes unusable
- **API rate limits**: OpenAI/Anthropic might rate limit our backend
- **Cost explosion**: Unexpected high usage could be expensive

### Mitigation Strategies
- **Monitoring**: Set up backend monitoring and alerts
- **Caching**: Cache similar requests to reduce API calls
- **Graceful degradation**: Provide helpful error messages
- **Cost caps**: Set daily/monthly spending limits

## Success Metrics

### User Experience
- [ ] Zero API key configuration needed
- [ ] Faster time-to-first-arrangement
- [ ] Reduced support requests about API keys

### Technical
- [ ] 99.9% backend uptime
- [ ] <2 second response times
- [ ] Successful rate limiting without user frustration

### Business
- [ ] Track daily/monthly active users
- [ ] Monitor API costs vs. any revenue
- [ ] Measure user retention improvement

## Timeline Estimate

### Week 1-2: Backend Development
- Set up Vercel API routes project
- Implement API endpoints (`/api/generate-arrangement`, `/api/analyze-image`)
- Add rate limiting and usage tracking
- Configure environment variables in Vercel
- Set up Supabase database tables

### Week 3: Plugin Migration
- Remove API key management
- Update API layer to use backend
- Test integration

### Week 4: Testing & Deployment
- End-to-end testing
- Deploy to production
- Submit plugin update to Figma store

## Vercel Backend Project Structure

```
arreglo-backend/
├── api/
│   ├── generate-arrangement.ts
│   ├── analyze-image.ts
│   └── user-usage.ts (optional)
├── lib/
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── supabase.ts
│   ├── rate-limiting.ts
│   └── usage-tracking.ts
├── types/
│   └── index.ts
├── package.json
├── tsconfig.json
├── vercel.json
└── .env.local
```

**Example vercel.json:**
```json
{
  "functions": {
    "api/generate-arrangement.ts": {
      "maxDuration": 30
    },
    "api/analyze-image.ts": {
      "maxDuration": 30
    }
  }
}
```

**Example package.json:**
```json
{
  "name": "arreglo-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vercel dev",
    "build": "tsc",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "openai": "^4.24.0",
    "@anthropic-ai/sdk": "^0.17.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "@vercel/node": "^3.0.0"
  }
}
```

## Next Steps

1. **Set up Vercel backend project** (Recommended approach)
2. **Configure environment variables in Vercel**
3. **Set up Supabase database tables**
4. **Implement and test basic backend API**
5. **Begin plugin modifications**

## Questions for Refinement

1. **Rate Limiting**: What should the free tier limits be?
2. **Revenue Model**: Freemium vs. subscription vs. pay-per-use?
3. **User Authentication**: Anonymous vs. required login?
4. **Error Handling**: How to handle backend downtime gracefully?
5. **Monitoring**: What metrics are most important to track?

---

*This document will be updated as we refine the implementation approach and make technical decisions.* 