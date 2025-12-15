This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

This project requires the following environment variables to be set:

### Required for Supabase

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Required for Email Notifications

- `RESEND_API_KEY` - Your Resend API key for sending emails

### Required for Retel AI Provider Matching

- `RETEL_API_KEY` - Your Retel AI API key for external provider matching
- `RETEL_API_URL` - (Optional) Custom Retel AI API URL. Defaults to `https://api.retel.ai/v1/providers/search`

### Required for Google Provider Search

- `GOOGLE_CUSTOM_SEARCH_API_KEY` - Your Google Custom Search API key for searching external providers
- `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` - Your Google Custom Search Engine ID

See the [Google Custom Search Setup Guide](#google-custom-search-setup) below for detailed instructions.

### Required for WhatsApp Business Integration

- `WHATSAPP_TOKEN` - Your WhatsApp Business API access token
- `WHATSAPP_PHONE_NUMBER_ID` - Your WhatsApp Business phone number ID
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` - A custom token for webhook verification (you create this)
- `INTERNAL_API_KEY` - (Optional) API key for internal server-to-server calls

See the [WhatsApp Business Setup Guide](#whatsapp-business-setup) below for detailed instructions.

### Local Development

Create a `.env.local` file in the root directory with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RESEND_API_KEY=your-resend-key
RETEL_API_KEY=your-retel-key
GOOGLE_CUSTOM_SEARCH_API_KEY=your-google-api-key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-search-engine-id
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
INTERNAL_API_KEY=your-internal-api-key
```

You can use the `.env.example` file as a template.

## WhatsApp Business Setup

This application integrates with WhatsApp Business Cloud API to send notifications to service providers and receive messages. Follow these steps to set up the integration:

### Prerequisites

1. A Meta Business account ([create one here](https://business.facebook.com/))
2. A Meta Developer account ([create one here](https://developers.facebook.com/))
3. A verified phone number for WhatsApp Business

### Step 1: Create a Meta Business App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click on "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in your app details:
   - **App Name**: e.g., "KeyHomeKey Notifications"
   - **App Contact Email**: Your business email
   - **Business Account**: Select or create your business account
5. Click "Create App"

### Step 2: Add WhatsApp to Your App

1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set up" to add WhatsApp to your app
3. You'll be taken to the WhatsApp setup page

### Step 3: Get Your API Credentials

1. **Phone Number ID**:
   - Go to WhatsApp → API Setup in your app dashboard
   - You'll see a test phone number provided by Meta
   - Copy the **Phone number ID** (not the phone number itself)
   - Note: For production, you'll need to add your own phone number

2. **Access Token**:
   - On the same page, you'll see a temporary access token
   - **Important**: This token expires in 24 hours
   - For production, you need to generate a permanent token:
     - Go to your app's System Users in Business Settings
     - Create a system user or select an existing one
     - Generate a new access token
     - Select your WhatsApp Business app
     - Select the `whatsapp_business_messaging` permission
     - Generate and securely save the token

3. **Add to Environment Variables**:
   ```bash
   WHATSAPP_TOKEN=your-permanent-access-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
   ```

### Step 4: Configure Webhook

The webhook allows your application to receive incoming messages and delivery status updates.

1. **Create a Verify Token**:
   - Generate a random string (e.g., `openssl rand -base64 32`)
   - Add it to your environment variables:
     ```bash
     WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-random-verify-token
     ```

2. **Configure in Meta Developer Console**:
   - Go to WhatsApp → Configuration in your app dashboard
   - Under "Webhook", click "Edit"
   - Enter your webhook URL: `https://your-domain.com/api/whatsapp/webhook`
   - Enter the same verify token you created above
   - Click "Verify and Save"

3. **Subscribe to Webhook Events**:
   - After verification, click "Manage"
   - Subscribe to the following webhook fields:
     - `messages` - To receive incoming messages
     - `message_status` - To receive delivery and read receipts
   - Click "Done"

### Step 5: Test Your Integration

1. **Send a Test Message**:
   ```bash
   curl -X POST https://your-domain.com/api/whatsapp/notify \
     -H "Content-Type: application/json" \
     -d '{
       "to": "573103055424",
       "message": "Test message from KeyHomeKey"
     }'
   ```

2. **Verify Message Delivery**:
   - Check WhatsApp on the recipient's phone
   - Check your application logs for confirmation

3. **Test Incoming Messages**:
   - Send a message to your WhatsApp Business number
   - Check your application logs to see the webhook payload

### Step 6: Production Setup

For production deployment:

1. **Add Your Own Phone Number**:
   - You cannot use Meta's test number in production
   - Go to WhatsApp → API Setup
   - Click "Add phone number"
   - Verify your business phone number
   - Update `WHATSAPP_PHONE_NUMBER_ID` with your number's ID

2. **Business Verification**:
   - Complete Meta Business Verification
   - This is required to send messages to users who haven't messaged you first

3. **Message Templates**:
   - For messages outside the 24-hour window, you need approved templates
   - Go to WhatsApp → Message Templates
   - Create and submit templates for approval
   - Update your code to use template messages when needed

4. **Rate Limits**:
   - Start with 250 conversations per day (unverified business)
   - Increase to 1,000 after phone number verification
   - Can be increased further based on quality rating

### API Endpoints

The application provides two WhatsApp-related endpoints:

1. **POST `/api/whatsapp/notify`** - Send messages
   ```typescript
   {
     "to": "573103055424",  // Phone number with country code
     "message": "Your message text"
   }
   ```

2. **POST/GET `/api/whatsapp/webhook`** - Receive messages and status updates
   - Automatically handles incoming messages
   - Logs delivery status updates
   - Extend `handleIncomingMessage()` for custom business logic

### Troubleshooting

**Webhook verification fails:**
- Ensure `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches the token in Meta console
- Check that your webhook URL is publicly accessible (not localhost)
- Verify your application is running

**Messages not sending:**
- Check that `WHATSAPP_TOKEN` is a valid permanent token (not expired)
- Verify `WHATSAPP_PHONE_NUMBER_ID` is correct
- Ensure the recipient's phone number is in the correct format (country code + number)
- Check application logs for error messages

**Messages not being received:**
- Verify webhook is properly configured and verified
- Check that you've subscribed to `messages` webhook field
- Look for webhook POST requests in your server logs
- Test with Meta's webhook testing tool in the developer console

### Resources

- [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp)
- [Cloud API Quick Start](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)

## Google Custom Search Setup

This application can search for external service providers using Google's Custom Search API. When a ticket is created, the system will:
1. Search internal providers in the database
2. Search external providers via Google based on category and location
3. Store external provider suggestions in the ticket metadata

**⚠️ Important**: This feature requires a database schema update. See [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) for migration instructions.

### Prerequisites

1. A Google Cloud Platform account ([create one here](https://console.cloud.google.com/))
2. Billing enabled on your Google Cloud project (Custom Search API has a free tier)

### Step 1: Enable Google Custom Search API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Library**
4. Search for "Custom Search API"
5. Click on **Custom Search API** and click **Enable**

### Step 2: Create API Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API key**
3. Copy the generated API key
4. (Recommended) Click **Restrict key** to add restrictions:
   - Under "API restrictions", select "Restrict key"
   - Choose "Custom Search API" from the dropdown
   - Click **Save**
5. Add to your environment variables:
   ```bash
   GOOGLE_CUSTOM_SEARCH_API_KEY=your-generated-api-key
   ```

### Step 3: Create a Programmable Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click **Get started** or **Add** to create a new search engine
3. Configure your search engine:
   - **Sites to search**: Enter `www.google.com` or leave blank to search the entire web
   - **Name**: e.g., "KeyHomeKey Provider Search"
   - **Language**: Spanish (or your preferred language)
4. Click **Create**
5. After creation, click on your search engine to edit it
6. Enable **Search the entire web** (if not already enabled)
7. Copy the **Search engine ID** (looks like: `a1b2c3d4e5f6g7h8i`)
8. Add to your environment variables:
   ```bash
   GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-search-engine-id
   ```

### Step 4: Configure Search Parameters (Optional)

To improve search results for Colombian service providers:

1. In your Programmable Search Engine settings, go to **Setup** → **Advanced**
2. Under **Sites to search**, you can add specific sites:
   - `paginasamarillas.com.co` - Colombian yellow pages
   - `olx.com.co` - Classified ads
   - `locanto.com.co` - Local services
3. Adjust **SafeSearch** settings as needed

### Step 5: Test Your Integration

1. **Test the API endpoint directly**:
   ```bash
   curl -X POST https://your-domain.com/api/providers/google-search \
     -H "Content-Type: application/json" \
     -d '{
       "category": "Plomería",
       "location": {
         "department": "Cundinamarca",
         "municipality": "Bogotá"
       },
       "description": "Fuga de agua en cocina"
     }'
   ```

2. **Create a ticket and check the response**:
   - The response will include `externalProviders` array with Google search results
   - Check your application logs for search queries and results

### Pricing and Limits

**Google Custom Search API Pricing:**
- **Free tier**: 100 search queries per day
- **Paid tier**: $5 per 1,000 queries (after free tier)
- [View detailed pricing](https://developers.google.com/custom-search/v1/overview#pricing)

**Best Practices:**
- Cache search results when possible
- Only search when internal providers are not found (optional)
- Monitor your usage in Google Cloud Console

### API Endpoints

The application provides the following endpoints for provider search:

1. **POST `/api/providers/google-search`** - Search external providers
   ```typescript
   {
     "category": "Plomería",        // Service category
     "location": {
       "department": "Cundinamarca",
       "municipality": "Bogotá"
     },
     "description": "Optional description for context"
   }
   ```
   
   Response:
   ```typescript
   {
     "success": true,
     "providers": [
       {
         "name": "Provider name",
         "description": "Provider description",
         "url": "https://provider-website.com",
         "source": "google",
         "location": "Bogotá, Cundinamarca"
       }
     ],
     "searchQuery": "plomería en Bogotá Cundinamarca Colombia servicios profesionales"
   }
   ```

2. **POST `/api/tickets`** - Create ticket (automatically searches providers)
   - Searches internal providers first
   - Then searches external providers via Google
   - Returns both internal and external provider matches
   - Stores external providers in ticket metadata

### Troubleshooting

**API returns 403 Forbidden:**
- Check that Custom Search API is enabled in Google Cloud Console
- Verify API key restrictions allow Custom Search API
- Ensure billing is enabled on your Google Cloud project

**No results returned:**
- Verify Search Engine ID is correct
- Check that "Search the entire web" is enabled
- Try different search queries or keywords
- Review search engine settings in Programmable Search Engine console

**Rate limit exceeded:**
- You've exceeded the free tier limit (100 queries/day)
- Consider implementing caching
- Upgrade to paid tier if needed

**Invalid Search Engine ID:**
- Ensure you copied the correct Search Engine ID from the Programmable Search Engine console
- ID should be alphanumeric (no special characters)

### Resources

- [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp)
- [Cloud API Quick Start](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Google Custom Search API Documentation](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine](https://programmablesearchengine.google.com/)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Vercel Environment Variables

When deploying to Vercel, add the following environment variables in your project settings:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `RESEND_API_KEY`
4. `RETEL_API_KEY`
5. `GOOGLE_CUSTOM_SEARCH_API_KEY`
6. `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`
7. `WHATSAPP_TOKEN`
8. `WHATSAPP_PHONE_NUMBER_ID`
9. `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
10. `INTERNAL_API_KEY`

**Important for WhatsApp Integration on Vercel:**
- After deployment, update your webhook URL in the Meta Developer Console to point to your Vercel domain
- Example: `https://your-app.vercel.app/api/whatsapp/webhook`
- Re-verify the webhook with Meta

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
