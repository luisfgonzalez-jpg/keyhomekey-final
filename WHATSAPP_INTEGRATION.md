# WhatsApp Business Cloud API Integration

## Overview

This document describes the WhatsApp notification system integrated into KeyhomeKey for notifying providers about new tickets.

## Architecture

### Backend API Endpoint
- **Path**: `/api/whatsapp/notify`
- **Method**: POST
- **Purpose**: Send WhatsApp messages via Meta's WhatsApp Business Cloud API

### Authentication
The endpoint supports two authentication methods:

1. **API Key Authentication** (for server-to-server calls)
   - Header: `x-api-key: YOUR_INTERNAL_API_KEY`
   
2. **Same-Origin Requests** (for frontend calls)
   - Automatically authorized based on origin/referer headers

## Request Format

```json
{
  "to": "3103055424",
  "message": "Your message text here"
}
```

### Fields
- `to` (string, required): Phone number to send to (will be normalized with Colombia country code if needed)
- `message` (string, required): Text message to send

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "messageId": "wamid.xxx...",
    "to": "573103055424"
  }
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

## Phone Number Normalization

The API automatically normalizes phone numbers:
- Removes all non-digit characters
- Prepends Colombia country code (57) if not present
- Example: `310 305 5424` → `573103055424`

## Integration in Ticket Creation Flow

When a ticket is created (`src/app/page.tsx`):

1. **Find Provider**: System searches for a matching provider
   - First tries to match by location + specialty
   - Falls back to any provider in the same location
   - Checks Retel AI for external providers

2. **Create Ticket**: Ticket is saved to Supabase

3. **Upload Media**: Any attached files are uploaded to storage

4. **Assign Provider**: Provider information is saved to ticket

5. **Send WhatsApp Notification**:
   - If provider found → Send notification to provider
   - If no provider → Send notification to KeyhomeKey center
   - Failure doesn't block ticket creation (error is logged)

## Environment Variables

### Required
- `WHATSAPP_TOKEN`: Your WhatsApp Business Cloud API access token
- `WHATSAPP_PHONE_NUMBER_ID`: Your WhatsApp Business phone number ID
- `INTERNAL_API_KEY`: Strong random string for API authentication

### Optional
- `WHATSAPP_DEFAULT_TO`: Default fallback phone number (e.g., `573103055424`)

## Setup Instructions

### 1. Get WhatsApp Business Credentials

1. Visit [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select existing app
3. Add "WhatsApp" product to your app
4. Go to WhatsApp > API Setup
5. Copy the following:
   - **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - Generate a permanent **Access Token** → `WHATSAPP_TOKEN`

### 2. Generate Internal API Key

Generate a strong random string for the internal API key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

### 3. Configure Environment Variables

#### Local Development (.env.local)
```bash
WHATSAPP_TOKEN=your_whatsapp_business_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
INTERNAL_API_KEY=your_generated_random_string
WHATSAPP_DEFAULT_TO=573103055424
```

#### Vercel Deployment
Add these variables in your Vercel project settings:
1. Go to Project Settings → Environment Variables
2. Add each variable for Production, Preview, and Development environments

### 4. Test the Integration

#### Test the API Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/whatsapp/notify \
  -H "Content-Type: application/json" \
  -d '{"to": "3103055424", "message": "Test message"}'
```

#### Test via Ticket Creation
1. Log in to the application
2. Create a new ticket
3. Check console logs for WhatsApp notification status
4. Verify message received on WhatsApp

## Error Handling

The system handles errors gracefully:

- **Invalid Credentials**: Returns 401 Unauthorized
- **Missing Environment Variables**: Returns 500 with error message
- **WhatsApp API Errors**: Logged to console, doesn't block ticket creation
- **Network Errors**: Logged to console, doesn't block ticket creation

## Security Considerations

1. **API Key Protection**: Never expose `INTERNAL_API_KEY` or `WHATSAPP_TOKEN` in client-side code
2. **Same-Origin Policy**: Frontend calls are validated by origin/referer headers
3. **Rate Limiting**: Consider implementing rate limiting for production use
4. **Phone Number Validation**: Numbers are normalized but not validated for format

## Monitoring and Logging

The system logs the following events:

- ✅ Successful message send with provider details
- ❌ WhatsApp API errors with error details
- ⚠️ Missing credentials or configuration errors
- 📞 Provider matching results (Retel AI vs Local)

## Common Issues and Solutions

### Issue: "WhatsApp API credentials not configured"
**Solution**: Ensure `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set in environment variables

### Issue: "Unauthorized" (401)
**Solution**: Check that `INTERNAL_API_KEY` matches in both environment variables and request header (for server-to-server calls)

### Issue: Messages not being sent
**Solution**: 
1. Check WhatsApp Business API status on Meta dashboard
2. Verify phone number is verified and approved
3. Check console logs for error details

### Issue: "Invalid phone number"
**Solution**: Ensure phone numbers include proper digits (system auto-adds country code)

## API Rate Limits

WhatsApp Business Cloud API has rate limits:
- **Free tier**: ~1000 conversations per month
- **Paid tier**: Higher limits based on your plan

Monitor your usage in the Meta Business Manager dashboard.

## Future Improvements

Potential enhancements:
- [ ] Add support for WhatsApp templates (for marketing messages)
- [ ] Implement message status tracking (delivered, read, etc.)
- [ ] Add support for media messages (images, documents)
- [ ] Implement retry logic for failed messages
- [ ] Add message queueing for high volume
- [ ] Support for other countries (currently Colombia-focused)

## Support

For issues or questions:
- Check Meta's [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- Review application logs for error details
- Contact KeyhomeKey support team
