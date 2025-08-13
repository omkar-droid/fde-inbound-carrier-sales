# HappyRobot Platform Integration Guide

## Overview
This guide explains how to integrate the FDE Inbound Carrier Sales system with the HappyRobot platform for automated call handling.

## Prerequisites
- HappyRobot platform account
- API access credentials
- Webhook endpoint for call events

## Integration Architecture

```
Carrier Call → HappyRobot → AI Agent → Our API → Load Matching → Negotiation → Transfer
```

## HappyRobot Agent Configuration

### 1. Agent Setup
1. Log into HappyRobot platform
2. Create a new inbound agent
3. Configure the agent with the following settings:

**Agent Name:** `FDE Inbound Carrier Sales Agent`

**Agent Type:** `Inbound`

**Language:** `English`

**Voice:** `Professional, Friendly`

### 2. Call Flow Configuration

#### Initial Greeting
```
"Thank you for calling our freight brokerage. I'm here to help you find the perfect load. 
To get started, I'll need your MC number for verification. What's your MC number?"
```

#### MC Number Collection
- Use speech recognition to capture MC number
- Validate format (6 digits)
- Call our API to verify with FMCSA

#### Load Search Flow
```
"Great! I found your information. Now, let me help you find a load. 
Where are you looking to pick up from?"
```

#### Load Presentation
```
"I found a great load for you: [Load Details]
- Origin: [Origin]
- Destination: [Destination] 
- Pickup: [Date/Time]
- Delivery: [Date/Time]
- Equipment: [Type]
- Rate: $[Amount]
- Distance: [Miles]

Would you like to hear more details about this load?"
```

#### Price Negotiation
```
"The listed rate is $[Amount]. What rate would work for you?"
```

**Negotiation Logic:**
- Accept if within 10% of listed rate
- Counter with 5% increase if below 10%
- Maximum 3 rounds of negotiation
- Transfer to sales rep if no agreement after 3 rounds

#### Call Transfer
```
"Perfect! I'll transfer you to our sales representative to finalize the booking. 
Please hold while I connect you."
```

### 3. API Integration Points

#### Load Search API Call
```javascript
// When carrier provides origin/destination
const searchParams = {
  origin: carrierOrigin,
  destination: carrierDestination,
  equipment_type: carrierEquipment
};

const response = await fetch('/api/loads/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.API_KEY
  },
  body: JSON.stringify(searchParams)
});
```

#### Carrier Verification API Call
```javascript
// When MC number is provided
const verifyParams = {
  mc_number: mcNumber
};

const response = await fetch('/api/carriers/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.API_KEY
  },
  body: JSON.stringify(verifyParams)
});
```

#### Call Classification API Call
```javascript
// After call ends
const classificationParams = {
  call_transcript: fullTranscript,
  final_price: agreedPrice,
  negotiation_rounds: negotiationCount
};

const response = await fetch('/api/calls/classify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.API_KEY
  },
  body: JSON.stringify(classificationParams)
});
```

### 4. Webhook Configuration

Configure webhooks in HappyRobot to send call events to our API:

**Webhook URL:** `https://your-domain.com/api/calls/webhook`

**Events to capture:**
- Call started
- Call ended
- Transfer initiated
- Agent responses

### 5. Environment Variables

Add these to your HappyRobot agent configuration:

```env
API_BASE_URL=https://your-domain.com
API_KEY=your-secret-api-key
FMCSA_API_KEY=your-fmcsa-api-key
SALES_REP_EXTENSION=1001
```

## Call Flow Logic

### 1. Call Reception
```
1. Answer call
2. Greet carrier
3. Request MC number
4. Verify MC number via API
5. If invalid, politely decline and end call
6. If valid, proceed to load search
```

### 2. Load Matching
```
1. Ask for origin location
2. Ask for destination location
3. Ask for equipment type preference
4. Search loads via API
5. Present best matching load
6. If no matches, apologize and end call
```

### 3. Load Presentation
```
1. Present load details clearly
2. Ask if interested
3. If yes, proceed to pricing
4. If no, offer alternative loads
5. If no alternatives, end call politely
```

### 4. Price Negotiation
```
Round 1:
- Present listed rate
- Ask for carrier's rate
- If within 10%, accept
- If below 10%, counter with 5% increase

Round 2:
- Present counter offer
- Ask for new rate
- If within 5%, accept
- If still low, counter with 2% increase

Round 3:
- Present final offer
- If accepted, proceed to transfer
- If declined, transfer to sales rep
```

### 5. Call Transfer
```
1. Confirm agreement
2. Collect key information
3. Transfer to sales representative
4. Log call data for analytics
```

## Data Extraction

### Call Data to Capture
- MC number
- Origin/destination preferences
- Equipment type
- Negotiation history
- Final agreed price
- Call duration
- Transfer status

### Sentiment Analysis
- Positive keywords: "interested", "accept", "good", "deal"
- Negative keywords: "no", "reject", "too expensive"
- Neutral keywords: "maybe", "think about it"

## Error Handling

### API Failures
- Retry failed API calls up to 3 times
- Use fallback responses if API unavailable
- Log all errors for debugging

### Invalid Input
- Handle unclear speech gracefully
- Ask for clarification when needed
- Provide helpful prompts

### System Errors
- Graceful degradation
- Transfer to human operator if needed
- Log all system errors

## Testing

### Test Scenarios
1. **Valid MC, Successful Load Match**
   - MC: 123456
   - Origin: Los Angeles
   - Destination: Phoenix
   - Expected: Load presented, negotiation, transfer

2. **Invalid MC**
   - MC: 999999
   - Expected: Polite decline, call end

3. **No Load Match**
   - Origin: Remote location
   - Destination: Another remote location
   - Expected: Apology, call end

4. **Price Negotiation**
   - Listed rate: $1200
   - Carrier offer: $1000
   - Expected: Counter offer, negotiation

### Test Data
Use the sample loads in `data/loads.json` for testing.

## Monitoring

### Key Metrics to Track
- Call success rate
- Average call duration
- Negotiation success rate
- Transfer rate
- API response times
- Error rates

### Alerts
- API downtime
- High error rates
- Low success rates
- Long response times

## Security Considerations

### API Security
- Use HTTPS for all API calls
- Implement API key authentication
- Rate limit API requests
- Validate all input data

### Data Privacy
- Encrypt sensitive data
- Log minimal personal information
- Comply with data protection regulations
- Secure webhook endpoints

## Deployment Checklist

- [ ] HappyRobot agent configured
- [ ] API endpoints deployed and tested
- [ ] Webhooks configured
- [ ] Environment variables set
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Error handling tested
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team training completed

## Support

For technical support:
- Check API documentation
- Review error logs
- Test with sample data
- Contact development team

For HappyRobot platform issues:
- Check HappyRobot documentation
- Contact HappyRobot support
- Review agent configuration
- Test call flows
