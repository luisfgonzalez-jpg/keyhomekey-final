# Resend Email Service Setup Guide

This guide explains how to configure email sending for KeyHomeKey using Resend.

## Quick Start (Development)

For local development and testing:

```bash
# .env.local
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=delivered@resend.dev
```

## Production Setup

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up or log in
3. Navigate to **API Keys** in the dashboard
4. Create a new API key and copy it

### Step 2: Verify Your Domain

**Option A: Use Your Own Domain (Recommended)**

1. Go to [Resend Domains](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter your domain (e.g., `keyhomekey.com`)
4. Copy the DNS records provided
5. Add these records to your domain DNS provider:
   - **TXT record** for SPF verification
   - **CNAME records** for DKIM authentication
6. Wait for verification (check status in Resend dashboard)
7. Once verified, you can use emails like:
   - `noreply@keyhomekey.com`
   - `support@keyhomekey.com`
   - `notifications@keyhomekey.com`

**Option B: Use Resend Subdomain (Free Plan)**

1. In Resend dashboard, go to **Domains**
2. Click **"Use Resend subdomain"**
3. You'll get a subdomain like `yourusername.resend.dev`
4. Use emails like `noreply@yourusername.resend.dev`

### Step 3: Configure Environment Variables

**Vercel (Production):**
```bash
vercel env add RESEND_API_KEY
# Enter your API key

vercel env add RESEND_FROM_EMAIL
# Enter: KeyHomeKey <noreply@yourdomain.com>
```

**Local Development:**
```bash
# .env.local
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=delivered@resend.dev
```

### Step 4: Test Your Configuration

1. **Using the API endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/send-email \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@example.com",
       "subject": "Test Email",
       "template": "invitation",
       "variables": {
         "event": "Test Event",
         "date": "2026-01-28",
         "location": "Online",
         "link": "https://example.com"
       }
     }'
   ```

2. **Check the logs:**
   - Look for `✅ Email sent successfully`
   - Verify the "From" address matches your configuration
   - Check for any warnings about unverified domains

## Common Issues and Solutions

### Issue: HTTP 400 - Invalid from address

**Cause:** The sender email is not verified in Resend.

**Solution:**
1. Verify your domain in [Resend Domains](https://resend.com/domains)
2. Or use `delivered@resend.dev` for development/testing
3. Update `RESEND_FROM_EMAIL` environment variable

### Issue: HTTP 401 - Unauthorized

**Cause:** Invalid or missing Resend API key.

**Solution:**
1. Check that `RESEND_API_KEY` is set in your environment
2. Verify the API key is correct in [Resend API Keys](https://resend.com/api-keys)
3. Regenerate a new API key if needed

### Issue: Emails not arriving

**Possible causes:**
1. **Spam folder**: Check recipient's spam/junk folder
2. **Invalid recipient**: Verify email address format
3. **Rate limits**: Check your Resend account limits
4. **DNS not propagated**: Wait for DNS records to propagate (up to 48 hours)

**Solution:**
- Check Resend dashboard logs for delivery status
- Use Resend test mode with `delivered@resend.dev` to verify configuration
- Review application logs for error messages

### Issue: Warning about RESEND_FROM_EMAIL not configured

**Cause:** The `RESEND_FROM_EMAIL` environment variable is not set.

**Impact:** 
- Development: Uses `delivered@resend.dev` (works fine)
- Production: May cause issues if not configured properly

**Solution:**
1. For development, this warning is safe to ignore
2. For production, set `RESEND_FROM_EMAIL` with a verified domain:
   ```bash
   RESEND_FROM_EMAIL=KeyHomeKey <noreply@keyhomekey.com>
   ```

## Email Templates

KeyHomeKey includes three pre-built email templates:

### 1. `tenantWelcome`
Welcome email sent to new tenants with property details and setup instructions.

**Required variables:**
- `tenantName` - Tenant's name
- `propertyAddress` - Property address
- `propertyType` - Type of property
- `city` - City name
- `department` - Department/state
- `ownerName` - Property owner's name
- `ownerPhone` - Owner's phone number
- `contractStart` - Contract start date
- `contractEnd` - Contract end date
- `loginUrl` - Link to access the platform

### 2. `tenantInvitation`
Property invitation email for new tenants.

**Required variables:**
- `propertyAddress` - Property address
- `ownerName` - Property owner's name
- `ownerContact` - Owner's contact information

### 3. `invitation`
General invitation template for any type of invitation.

**Required variables:**
- `event` - Event name
- `date` - Event date
- `location` - Event location
- `link` - Acceptance link

## Best Practices

1. **Use Environment Variables**: Never hardcode email addresses in your code
2. **Verify Domains Early**: Domain verification can take time, do it before production deployment
3. **Monitor Logs**: Regularly check Resend dashboard for email delivery status
4. **Test Before Deploy**: Always test email functionality before deploying to production
5. **Use Different Emails**: Consider using different sender emails for different purposes:
   - `noreply@yourdomain.com` - System notifications
   - `support@yourdomain.com` - Support emails
   - `notifications@yourdomain.com` - User notifications

## Rate Limits

Resend has the following rate limits:

- **Free Plan**: 3,000 emails/month, 100 emails/day
- **Pro Plan**: 50,000 emails/month
- **Business Plan**: Custom limits

Monitor your usage in the Resend dashboard to avoid hitting limits.

## Security Considerations

1. **API Key Protection**: 
   - Never commit API keys to version control
   - Use environment variables for all sensitive data
   - Rotate API keys periodically

2. **Email Validation**:
   - The API validates email format before sending
   - Invalid emails are rejected with HTTP 400

3. **Authorization**:
   - The API only accepts same-origin requests
   - Add additional authorization if needed for your use case

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)
- [API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Resend Status Page](https://status.resend.com/)

## Support

If you encounter issues not covered in this guide:

1. Check the [Resend Documentation](https://resend.com/docs)
2. Review your application logs for detailed error messages
3. Visit the Resend dashboard for email delivery status
4. Contact Resend support at [support@resend.com](mailto:support@resend.com)
