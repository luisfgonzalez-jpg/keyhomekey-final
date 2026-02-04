# Google Custom Search API Setup Guide

This guide explains how to configure Google Custom Search API for external provider search functionality in KeyHomeKey.

## Overview

KeyHomeKey uses Google Custom Search API to find external service providers when no internal providers are available. This feature is **optional** - the application will work without it, but external provider search will return a "not configured" message.

## Prerequisites

- A Google Account
- Access to Google Cloud Console
- A domain or website to associate with your Custom Search Engine

## Step-by-Step Setup

### 1. Create a Google Custom Search Engine

1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click **"Add"** or **"Get Started"** to create a new search engine
3. Fill in the required information:
   - **Search engine name**: KeyHomeKey Provider Search (or any name you prefer)
   - **What to search**: Select "Search the entire web"
   - **Search settings**: 
     - Enable "Image search" (optional)
     - Enable "Safe search" (recommended)
4. Click **"Create"**
5. On the next page, copy your **Search Engine ID** (also called CX)
   - It looks like: `a1b2c3d4e5f6g7h8i:j9k0l1m2n3o`
   - Save this for later - you'll need it for `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`

### 2. Get Google Custom Search API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one:
   - Click the project dropdown at the top
   - Click **"New Project"**
   - Enter a name like "KeyHomeKey" and click **"Create"**
3. Enable the Custom Search API:
   - Go to **APIs & Services > Library**
   - Search for "Custom Search API"
   - Click on it and press **"Enable"**
4. Create API credentials:
   - Go to **APIs & Services > Credentials**
   - Click **"Create Credentials"** > **"API Key"**
   - A dialog will show your new API key
   - Copy the API key - you'll need it for `GOOGLE_CUSTOM_SEARCH_API_KEY`
5. (Recommended) Restrict your API key:
   - Click on the API key name to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "Custom Search API" from the list
   - Under "Application restrictions", you can:
     - Add your production domain (e.g., `*.vercel.app`)
     - Add your production IP addresses
   - Click **"Save"**

### 3. Configure Environment Variables

#### For Local Development

Add these variables to your `.env.local` file:

```bash
# Google Custom Search (optional - for external provider search)
GOOGLE_CUSTOM_SEARCH_API_KEY=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i:j9k0l1m2n3o

# Optional: Enable debug logging (shows detailed search queries and results)
GOOGLE_SEARCH_DEBUG=true
```

**Note**: The API key above is an example. Use your actual API key from Google Cloud Console.

#### For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to **Settings > Environment Variables**
3. Add the following variables:
   - Name: `GOOGLE_CUSTOM_SEARCH_API_KEY`
   - Value: Your Google API key
   - Environment: Production, Preview, Development (select all that apply)
4. Add the search engine ID:
   - Name: `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`
   - Value: Your Search Engine ID (CX)
   - Environment: Production, Preview, Development
5. Click **"Save"**
6. Redeploy your application for the changes to take effect

#### For Other Hosting Platforms

Add the environment variables to your hosting platform's configuration:

- **Heroku**: Use the Heroku CLI or Dashboard > Settings > Config Vars
- **AWS**: Add to your environment configuration (ECS, Lambda, etc.)
- **Digital Ocean**: Add to App Platform environment variables
- **Railway**: Add to your project variables

### 4. Test Your Configuration

#### Test Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the ticket creation page
3. Select a category that requires a service provider
4. If no internal providers are available, the external provider search should automatically run
5. Check the console logs (if `GOOGLE_SEARCH_DEBUG=true`) to see the search query and results

#### Test with cURL

You can also test the Google Search endpoint directly:

```bash
curl -X POST http://localhost:3000/api/providers/google-search \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Plomeria",
    "location": "Bogotá",
    "municipality": "Chapinero"
  }'
```

Expected response:
```json
{
  "success": true,
  "providers": [
    {
      "name": "Plomería Express Bogotá",
      "snippet": "Servicios de plomería 24/7 en Bogotá...",
      "link": "https://example.com",
      "source": "google"
    }
  ]
}
```

## Troubleshooting

### "API key not configured" Error

**Symptoms**: External provider search returns "API not configured"

**Solutions**:
- Verify `GOOGLE_CUSTOM_SEARCH_API_KEY` is set in your environment variables
- Check that the API key doesn't have extra spaces or quotes
- Restart your development server after adding the variable
- For Vercel, redeploy after adding environment variables

### "Invalid API key" Error

**Symptoms**: 400 or 403 error from Google API

**Solutions**:
- Verify your API key is correct (copy again from Google Cloud Console)
- Check that the Custom Search API is enabled in your Google Cloud project
- If using API restrictions, verify your domain/IP is allowed
- Ensure you haven't exceeded your API quota (see Usage Limits below)

### "Invalid search engine ID" Error

**Symptoms**: Search returns no results or "invalid CX" error

**Solutions**:
- Verify `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` is correct
- Go to [Programmable Search Engine](https://programmablesearchengine.google.com/) and copy the ID again
- Ensure your search engine is set to "Search the entire web"

### No Results Returned

**Symptoms**: API works but returns empty results

**Solutions**:
- Try different search terms or categories
- Verify your search engine is configured to search the entire web (not just specific sites)
- Check that Safe Search isn't blocking all results
- Try searching for common terms like "plumber" or "electrician" to test

### Rate Limit Exceeded

**Symptoms**: "User rate limit exceeded" error

**Solutions**:
- Google Custom Search API has a free tier limit of 100 queries per day
- To increase quota:
  1. Go to [Google Cloud Console > APIs & Services > Custom Search API](https://console.cloud.google.com/apis/api/customsearch.googleapis.com)
  2. Click "Quotas"
  3. Request a quota increase (may require billing account)
- Consider caching search results to reduce API calls
- Implement a fallback to manual provider entry when quota is exceeded

## Usage Limits and Costs

### Free Tier
- **100 queries per day** at no charge
- Suitable for testing and low-volume usage

### Paid Tier
- **$5 per 1,000 queries** (after free 100)
- Up to **10,000 queries per day** maximum
- Requires a billing account in Google Cloud Console

### Recommendations
- For production use with moderate traffic, expect to stay within the free tier
- Monitor usage in Google Cloud Console > APIs & Services > Dashboard
- Set up billing alerts if you enable paid tier
- Consider implementing caching to reduce redundant searches

## Advanced Configuration

### Customizing Search Results

You can customize the search behavior in `/src/app/api/providers/google-search/route.ts`:

```typescript
// Adjust the number of results returned
const resultsPerPage = 5; // Default is 10

// Modify search query format
const searchQuery = `${category} ${municipality} ${department} provider`;

// Add language preference
const language = 'es'; // Spanish results preferred
```

### Search Engine Settings

In the [Programmable Search Engine Console](https://programmablesearchengine.google.com/):

1. Click on your search engine
2. Go to "Setup" > "Basics"
3. Adjust settings:
   - **Language**: Set to Spanish if searching primarily in Spanish
   - **Region**: Set to Colombia for more relevant results
   - **SafeSearch**: Enable to filter inappropriate content
4. Go to "Setup" > "Advanced" to:
   - Add synonyms for better matching
   - Exclude specific sites if needed
   - Enable autocomplete

## Integration with KeyHomeKey

### How It Works

1. User creates a ticket and selects a category (e.g., "Plomería")
2. System checks for internal providers in that category
3. If no internal providers found AND Google API is configured:
   - Calls `/api/providers/google-search` endpoint
   - Passes category, location, and municipality
   - Returns list of external providers
4. User can select an external provider or enter one manually
5. Provider name is saved with the ticket

### Fallback Behavior

If Google Custom Search API is **not configured**:
- External provider search will return a clear message: "API not configured"
- Users can still manually enter external provider information
- System continues to work normally with internal providers
- No errors are thrown - graceful degradation

## Security Best Practices

1. **Never commit API keys to version control**
   - Use `.env.local` for local development
   - Add `.env.local` to `.gitignore` (already configured)

2. **Restrict your API key**
   - Limit to specific APIs (Custom Search API only)
   - Restrict by domain or IP in production

3. **Monitor API usage**
   - Set up usage alerts in Google Cloud Console
   - Review logs regularly for suspicious activity

4. **Rotate keys periodically**
   - Generate new API keys every 6-12 months
   - Delete old keys after rotation

## Support and Resources

### Official Documentation
- [Custom Search API Documentation](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine Help](https://support.google.com/programmable-search/)
- [Google Cloud Console](https://console.cloud.google.com/)

### KeyHomeKey Resources
- See `/src/app/api/providers/google-search/route.ts` for implementation details
- Check `test-google-search.sh` for testing script
- Refer to `EXTERNAL_PROVIDER_SEARCH.md` for feature overview

### Getting Help
- Check Google Cloud Console > Support for API-specific issues
- Review logs in Vercel or your hosting platform for application errors
- Enable `GOOGLE_SEARCH_DEBUG=true` for detailed logging during development

## Quick Reference

| Variable | Where to Get It | Required |
|----------|----------------|----------|
| `GOOGLE_CUSTOM_SEARCH_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) > Credentials | Yes (for feature) |
| `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` | [Programmable Search](https://programmablesearchengine.google.com/) | Yes (for feature) |
| `GOOGLE_SEARCH_DEBUG` | Set manually (true/false) | No (dev only) |

### Quick Test Command

```bash
# Test if your configuration is working
curl -X POST http://localhost:3000/api/providers/google-search \
  -H "Content-Type: application/json" \
  -d '{"category":"Plomeria","location":"Bogotá"}'
```

## Conclusion

Google Custom Search integration is an optional but valuable feature for KeyHomeKey. It enables automatic discovery of external service providers when internal providers aren't available. Follow this guide to set it up correctly, and refer to the troubleshooting section if you encounter any issues.

For production deployment, remember to add the environment variables to your hosting platform and test thoroughly before going live.
