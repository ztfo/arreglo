# Payment System Integration & Usage-Based Billing

## Executive Summary

This document outlines the implementation of a comprehensive payment system for Arreglo that provides users with a seamless experience by offering a permanent OpenAI API key while implementing usage-based billing. Users receive 3 free arrangements before being charged $0.50 per additional arrangement through Stripe integration.

## Business Model Overview

### Current State
- Users must provide their own OpenAI API keys (until backend is live). After backend launch, keys are managed server-side.
- No revenue generation for the plugin
- Barrier to entry for users without API keys
- No usage tracking or analytics monetization

### Proposed Model
- **Freemium Approach**: 3 free arrangements per user
- **Pay-per-Use**: $0.50 per arrangement after free tier
- **Permanent API Key**: Arreglo provides OpenAI access
- **Seamless UX**: Users don't need to manage API keys
- **Usage Tracking**: Comprehensive analytics and usage monitoring

### Revenue Projections
Assuming adoption metrics:
- **Month 1-3**: 1,000 users (3,000 free arrangements)
- **Month 4-6**: 2,000 users, 20% conversion (400 paying arrangements/month)
- **Month 7-12**: 5,000 users, 25% conversion (1,250 paying arrangements/month)
- **Year 1 Revenue**: ~$4,500 (conservative estimate)

## Technical Architecture

### System Components

#### 1. User Management System
```typescript
interface User {
    id: string;
    figmaUserId: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
    subscriptionStatus: 'free' | 'pay-per-use';
    stripeCustomerId?: string;
}
```

#### 2. Usage Tracking
```typescript
interface UsageRecord {
    id: string;
    userId: string;
    arrangementId: string;
    timestamp: Date;
    cost: number; // 0 for free tier, 0.50 for paid
    stripePaymentIntentId?: string;
    aiModel: 'gpt-4' | 'gpt-4-turbo';
    tokenUsage: number;
    processingTime: number;
    success: boolean;
    error?: string;
}
```

#### 3. Payment Processing
```typescript
interface PaymentIntent {
    id: string;
    userId: string;
    amount: number; // in cents (50 for $0.50)
    currency: 'usd';
    status: 'pending' | 'succeeded' | 'failed';
    stripePaymentIntentId: string;
    metadata: {
        arrangementCount: number;
        userEmail?: string;
    };
}
```

### Database Schema (Supabase)

#### Users Table
```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    figma_user_id TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pay-per-use')),
    stripe_customer_id TEXT,
    free_arrangements_used INTEGER DEFAULT 0,
    total_arrangements INTEGER DEFAULT 0,
    last_arrangement_at TIMESTAMP WITH TIME ZONE
);
```

#### Usage Records Table
```sql
CREATE TABLE usage_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    arrangement_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cost DECIMAL(10,2) DEFAULT 0.00,
    stripe_payment_intent_id TEXT,
    ai_model TEXT,
    token_usage INTEGER,
    processing_time INTEGER,
    success BOOLEAN DEFAULT false,
    error TEXT,
    arrangement_data JSONB,
    song_data JSONB
);
```

#### Payment Intents Table
```sql
CREATE TABLE payment_intents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Architecture

#### 1. User Service
```typescript
class UserService {
    static async createUser(figmaUserId: string, email?: string): Promise<User>;
    static async getUser(figmaUserId: string): Promise<User | null>;
    static async updateUser(userId: string, updates: Partial<User>): Promise<User>;
    static async getUserUsage(userId: string): Promise<UsageRecord[]>;
    static async checkFreeArrangements(userId: string): Promise<boolean>;
    static async incrementUsage(userId: string, cost: number): Promise<UsageRecord>;
}
```

#### 2. Payment Service
```typescript
class PaymentService {
    static async createPaymentIntent(userId: string, amount: number): Promise<PaymentIntent>;
    static async confirmPayment(paymentIntentId: string): Promise<boolean>;
    static async processArrangementPayment(userId: string): Promise<PaymentIntent>;
    static async handleWebhook(stripeEvent: Stripe.Event): Promise<void>;
    static async refundPayment(paymentIntentId: string): Promise<boolean>;
}
```

#### 3. Arrangement Service
```typescript
class ArrangementService {
    static async generateArrangement(userId: string, songData: SongData): Promise<ArrangementData>;
    static async validateUserAccess(userId: string): Promise<boolean>;
    static async processPaymentForArrangement(userId: string): Promise<void>;
    static async recordUsage(userId: string, arrangement: ArrangementData): Promise<void>;
}
```

## Implementation Plan

### Phase 1: Backend Infrastructure (Weeks 1-2)

#### 1.1 Supabase Setup
- **Database Schema**: Create users, usage_records, payment_intents tables
- **Row Level Security**: Implement proper RLS policies
- **API Functions**: Create Edge Functions for payment processing
- **Environment Variables**: Secure storage of API keys

#### 1.2 Stripe Integration
- **Account Setup**: Configure Stripe account with proper settings
- **Webhook Configuration**: Set up webhooks for payment confirmations
- **Payment Flow**: Implement payment intent creation and confirmation
- **Error Handling**: Comprehensive error handling for payment failures

#### 1.3 OpenAI API Integration
- **Centralized API Key**: Store OpenAI API key securely
- **Usage Monitoring**: Track token usage and costs
- **Rate Limiting**: Implement appropriate rate limiting
- **Fallback Mechanisms**: Handle API failures gracefully

### Phase 2: User Management (Weeks 3-4)

#### 2.1 User Registration
- **Figma User ID**: Use Figma's user identification
- **Email Collection**: Optional email for receipts and notifications
- **Usage Tracking**: Initialize free arrangement counter
- **Stripe Customer**: Create Stripe customer records

#### 2.2 Usage Tracking
- **Arrangement Counter**: Track free vs. paid arrangements
- **Cost Calculation**: Calculate costs based on usage
- **Analytics**: Comprehensive usage analytics
- **Billing History**: Store payment and usage history

### Phase 3: Payment Flow (Weeks 5-6)

#### 3.1 Pre-Payment Check
- **Usage Validation**: Check if user has free arrangements remaining
- **Payment Required**: Determine if payment is needed
- **Cost Calculation**: Calculate exact cost for arrangement
- **User Notification**: Inform user of payment requirement

#### 3.2 Payment Processing
- **Stripe Elements**: Implement Stripe payment form
- **Payment Intent**: Create and confirm payment intents
- **Loading States**: Show payment processing status
- **Error Handling**: Handle payment failures gracefully

#### 3.3 Post-Payment Processing
- **Arrangement Generation**: Generate arrangement after payment
- **Usage Recording**: Record successful arrangement creation
- **Receipt Generation**: Send receipt to user
- **Analytics Tracking**: Track payment success/failure

### Phase 4: UI/UX Implementation (Weeks 7-8)

#### 4.1 Payment Modal
```typescript
interface PaymentModal {
    show: boolean;
    amount: number;
    arrangementCount: number;
    userEmail?: string;
    onPaymentSuccess: () => void;
    onPaymentFailure: (error: string) => void;
    onCancel: () => void;
}
```

#### 4.2 Usage Dashboard
```typescript
interface UsageDashboard {
    freeArrangementsUsed: number;
    totalArrangements: number;
    currentMonthSpending: number;
    paymentHistory: PaymentRecord[];
    nextPaymentAmount: number;
}
```

#### 4.3 Settings Integration
- **Payment Method**: Manage saved payment methods
- **Billing History**: View past charges and arrangements
- **Usage Statistics**: Display usage analytics
- **Account Management**: Update email and preferences

### Phase 5: Testing & Deployment (Weeks 9-10)

#### 5.1 Testing Strategy
- **Unit Tests**: Test all payment and user management functions
- **Integration Tests**: Test full payment flow
- **Stripe Testing**: Use Stripe test cards for payment testing
- **Load Testing**: Ensure system handles concurrent users

#### 5.2 Security Audit
- **API Key Security**: Ensure secure storage of sensitive keys
- **Payment Security**: Audit payment processing for vulnerabilities
- **Data Protection**: Ensure user data is properly protected
- **Compliance**: Verify PCI compliance requirements

## User Experience Flow

### First-Time User Journey

#### 1. Plugin Installation
- User installs Arreglo from Figma Community
- Plugin automatically creates user account using Figma ID
- User sees welcome message about 3 free arrangements

#### 2. First Arrangement
- User creates first arrangement (free)
- System shows "2 free arrangements remaining"
- Normal arrangement generation process

#### 3. Free Tier Exhaustion
- User creates third arrangement (free)
- System shows "This is your last free arrangement"
- User creates fourth arrangement attempt

#### 4. Payment Flow
- Modal appears: "You've used your 3 free arrangements"
- Payment form with Stripe Elements
- Clear pricing: "$0.50 per arrangement"
- Option to save payment method

#### 5. Post-Payment Experience
- Arrangement generates immediately after payment
- Receipt sent to email (if provided)
- Usage counter shows paid arrangements

### Returning User Journey

#### 1. Plugin Load
- System checks user's usage status
- Displays current arrangement count
- Shows remaining free arrangements (if any)

#### 2. Arrangement Creation
- If free arrangements available: normal flow
- If payment required: payment modal appears
- Saved payment method allows one-click payment

#### 3. Usage Tracking
- Real-time usage display
- Monthly spending tracker
- Arrangement history

## UI/UX Design Specifications

### Payment Modal Design
```css
.payment-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.payment-content {
    background: #1a1a1a;
    border-radius: 12px;
    padding: 32px;
    max-width: 400px;
    width: 90%;
    color: white;
}

.payment-header {
    text-align: center;
    margin-bottom: 24px;
}

.payment-price {
    font-size: 2rem;
    font-weight: bold;
    color: #E7D494;
    margin-bottom: 8px;
}

.payment-description {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 24px;
}

.stripe-elements {
    margin-bottom: 24px;
}

.payment-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}
```

### Usage Dashboard Design
```css
.usage-dashboard {
    background: #1a1a1a;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
}

.usage-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
}

.usage-stat {
    text-align: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #E7D494;
}

.stat-label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
    margin-top: 4px;
}
```

### Settings Integration
```typescript
interface PaymentSettings {
    paymentMethods: Stripe.PaymentMethod[];
    defaultPaymentMethod?: string;
    billingEmail?: string;
    receiptPreferences: {
        email: boolean;
        inApp: boolean;
    };
    usageNotifications: {
        freeArrangementsLow: boolean;
        monthlySpending: boolean;
    };
}
```

## Business Logic

### Pricing Strategy

#### Current Pricing
- **Free Tier**: 3 arrangements per user (lifetime)
- **Pay-per-Use**: $0.50 per arrangement
- **No Subscription**: Simple pay-as-you-go model

#### Pricing Rationale
- **OpenAI API Cost**: ~$0.10-0.20 per arrangement
- **Stripe Fees**: ~$0.03 per transaction
- **Infrastructure**: ~$0.05 per arrangement
- **Profit Margin**: ~$0.15-0.25 per arrangement

#### Future Pricing Options
- **Monthly Subscription**: $9.99/month for unlimited arrangements
- **Bulk Pricing**: 10 arrangements for $4.00 (20% discount)
- **Team Pricing**: Special rates for teams/organizations

### Revenue Optimization

#### Conversion Strategies
- **Free Tier Value**: Ensure free arrangements provide real value
- **Frictionless Payment**: One-click payment for returning users
- **Value Communication**: Clear benefits of paid arrangements
- **Usage Visibility**: Show arrangement count and value

#### Retention Strategies
- **Quality Focus**: Ensure paid arrangements are high quality
- **Usage Analytics**: Help users see value in their arrangements
- **Feature Expansion**: Add premium features for paid users
- **Community Building**: Create community around paid users

## Technical Implementation Details

### Supabase Edge Functions

#### Payment Processing Function
```typescript
// /functions/process-payment/index.ts
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_KEY') || ''
);

export async function processArrangementPayment(userId: string) {
    // Check user's free arrangements
    const { data: user } = await supabase
        .from('users')
        .select('free_arrangements_used')
        .eq('id', userId)
        .single();

    if (user.free_arrangements_used < 3) {
        throw new Error('User still has free arrangements available');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: 50, // $0.50 in cents
        currency: 'usd',
        metadata: {
            userId,
            service: 'arrangement_generation'
        }
    });

    // Store payment intent
    await supabase
        .from('payment_intents')
        .insert({
            user_id: userId,
            amount: 50,
            stripe_payment_intent_id: paymentIntent.id
        });

    return paymentIntent;
}
```

#### Arrangement Generation Function
```typescript
// /functions/generate-arrangement/index.ts
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY')
});

export async function generateArrangement(userId: string, songData: SongData) {
    // Validate user access
    const hasAccess = await validateUserAccess(userId);
    if (!hasAccess) {
        throw new Error('Payment required for arrangement generation');
    }

    // Generate arrangement
    const arrangement = await callOpenAI(songData);
    
    // Record usage
    await recordUsage(userId, arrangement);
    
    return arrangement;
}

async function validateUserAccess(userId: string): Promise<boolean> {
    const { data: user } = await supabase
        .from('users')
        .select('free_arrangements_used')
        .eq('id', userId)
        .single();

    // Check if user has free arrangements
    if (user.free_arrangements_used < 3) {
        return true;
    }

    // Check for recent successful payment
    const { data: recentPayment } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(1);

    return recentPayment && recentPayment.length > 0;
}
```

### Stripe Webhook Handler
```typescript
// /functions/stripe-webhook/index.ts
export async function handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
            break;
        case 'payment_intent.payment_failed':
            await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
            break;
    }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    // Update payment intent status
    await supabase
        .from('payment_intents')
        .update({ status: 'succeeded' })
        .eq('stripe_payment_intent_id', paymentIntent.id);

    // User can now generate arrangement
    console.log(`Payment succeeded for user: ${paymentIntent.metadata.userId}`);
}
```

## Security & Compliance

### Data Protection
- **PCI Compliance**: Stripe handles all payment data
- **User Data**: Minimal user data collection
- **API Keys**: Secure storage in Supabase secrets
- **Encryption**: All sensitive data encrypted at rest

### Privacy Considerations
- **Data Minimization**: Only collect necessary user data
- **Consent**: Clear consent for data collection
- **Retention**: Automatic data deletion after inactivity
- **Transparency**: Clear privacy policy

### Security Measures
- **API Rate Limiting**: Prevent abuse and excessive usage
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries
- **Authentication**: Secure user authentication

## Monitoring & Analytics

### Key Metrics
- **User Acquisition**: New users per day/week/month
- **Conversion Rate**: Free to paid user conversion
- **Revenue**: Monthly/quarterly revenue tracking
- **Usage Patterns**: Arrangement generation patterns
- **Churn Rate**: User retention and churn analysis

### Monitoring Tools
- **Supabase Analytics**: Database performance and usage
- **Stripe Dashboard**: Payment processing metrics
- **Custom Analytics**: User behavior and engagement
- **Error Tracking**: System errors and failures

### Alerts & Notifications
- **Payment Failures**: Alert on payment processing issues
- **High Usage**: Alert on unusual usage patterns
- **System Errors**: Alert on system failures
- **Revenue Milestones**: Celebrate revenue achievements

## Launch Strategy

### Soft Launch (Phase 1)
- **Beta Users**: Launch to existing power users
- **Feedback Collection**: Gather feedback on payment flow
- **Bug Fixes**: Address any issues before public launch
- **Performance Monitoring**: Monitor system performance

### Public Launch (Phase 2)
- **Announcement**: Announce new payment system
- **User Communication**: Explain changes and benefits
- **Support Documentation**: Update help documentation
- **Marketing**: Promote improved user experience

### Post-Launch (Phase 3)
- **Usage Monitoring**: Monitor adoption and usage
- **Optimization**: Optimize based on user behavior
- **Feature Expansion**: Add new features based on feedback
- **Scaling**: Scale infrastructure as needed

## Risk Assessment

### Technical Risks
1. **Payment Processing Failures**: Stripe API failures or network issues
2. **OpenAI API Costs**: Higher than expected API costs
3. **System Overload**: High usage overwhelming system
4. **Data Loss**: Database failures or corruption

### Mitigation Strategies
1. **Redundancy**: Multiple payment processing options
2. **Cost Monitoring**: Real-time cost tracking and alerts
3. **Scaling**: Auto-scaling infrastructure
4. **Backups**: Regular database backups

### Business Risks
1. **Low Conversion**: Users not converting to paid
2. **High Churn**: Users leaving after payment
3. **Competitive Pressure**: Competitors offering free services
4. **Regulatory Changes**: Payment processing regulations

### Mitigation Strategies
1. **Value Optimization**: Continuously improve arrangement quality
2. **User Engagement**: Build community and engagement
3. **Differentiation**: Focus on unique value proposition
4. **Compliance**: Stay updated on regulatory requirements

## Success Metrics

### Financial Metrics
- **Monthly Recurring Revenue**: Target $500/month by month 6
- **Average Revenue Per User**: Target $2.50/user/month
- **Customer Acquisition Cost**: < $5 per paying user
- **Lifetime Value**: Target $25 per user

### User Metrics
- **Free to Paid Conversion**: Target 15% conversion rate
- **User Retention**: 80% retention after first payment
- **Arrangement Quality**: 4.5+ star rating average
- **Payment Success Rate**: 98%+ successful payments

### Technical Metrics
- **System Uptime**: 99.9% uptime target
- **Payment Processing Time**: < 3 seconds average
- **API Response Time**: < 2 seconds average
- **Error Rate**: < 0.1% error rate

## Future Enhancements

### Premium Features
- **Advanced AI Models**: Access to GPT-4 Turbo or future models
- **Unlimited Arrangements**: Monthly subscription option
- **Priority Support**: Fast support for paying users
- **Advanced Analytics**: Detailed arrangement analytics

### Team Features
- **Team Billing**: Centralized billing for teams
- **Shared Arrangements**: Team arrangement sharing
- **Usage Analytics**: Team usage analytics
- **Bulk Pricing**: Volume discounts for teams

### Integration Features
- **DAW Integration**: Direct export to DAWs
- **Cloud Storage**: Arrangement cloud storage
- **Collaboration**: Real-time collaboration features
- **API Access**: Developer API for integrations

## Conclusion

The implementation of a usage-based payment system with Stripe integration will transform Arreglo from a free tool requiring user API keys into a professional service that provides value while generating revenue. The freemium model with 3 free arrangements provides users with sufficient value to understand the product while creating a natural conversion point to paid usage.

The technical architecture leverages Supabase for backend services and Stripe for payment processing, ensuring security, scalability, and reliability. The implementation plan spreads development over 10 weeks with comprehensive testing and security considerations.

Success depends on maintaining high arrangement quality, providing a frictionless payment experience, and continuously optimizing based on user feedback and behavior. The risk mitigation strategies address potential technical and business challenges while the monitoring and analytics framework ensures continuous improvement.

This system positions Arreglo for sustainable growth while providing users with a superior experience compared to managing their own API keys. 