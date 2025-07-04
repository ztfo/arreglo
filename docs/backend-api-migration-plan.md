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
1. **Supabase Edge Functions** (Recommended)
   - Serverless
   - Built-in auth integration
   - Good for our existing Supabase setup

2. **Vercel Functions**
   - Serverless
   - Easy deployment
   - Good TypeScript support

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
**Supabase Edge Function Example:**
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
```env
# Backend Environment Variables
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
```

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
  // Return your backend URL
  return process.env.NODE_ENV === 'production' 
    ? 'https://your-production-backend.com'
    : 'https://your-dev-backend.com';
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

### Backend Deployment
1. **Development Environment**
   - Deploy to staging backend
   - Test with development version of plugin

2. **Production Environment**
   - Deploy to production backend
   - Update plugin manifest with production URLs
   - Test thoroughly before Figma store update

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
- Set up Supabase Edge Functions
- Implement API endpoints
- Add rate limiting and usage tracking

### Week 3: Plugin Migration
- Remove API key management
- Update API layer to use backend
- Test integration

### Week 4: Testing & Deployment
- End-to-end testing
- Deploy to production
- Submit plugin update to Figma store

## Next Steps

1. **Choose Backend Platform** (Supabase Edge Functions recommended)
2. **Set up development environment**
3. **Implement basic backend API**
4. **Test with current plugin**
5. **Begin plugin modifications**

## Questions for Refinement

1. **Rate Limiting**: What should the free tier limits be?
2. **Revenue Model**: Freemium vs. subscription vs. pay-per-use?
3. **User Authentication**: Anonymous vs. required login?
4. **Error Handling**: How to handle backend downtime gracefully?
5. **Monitoring**: What metrics are most important to track?

---

*This document will be updated as we refine the implementation approach and make technical decisions.* 