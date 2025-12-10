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

### Required for WhatsApp Notifications

- `WHATSAPP_TOKEN` - Your WhatsApp Business Cloud API access token
- `WHATSAPP_PHONE_NUMBER_ID` - Your WhatsApp Business phone number ID
- `INTERNAL_API_KEY` - Internal API key for securing backend endpoints (use a strong random string)
- `WHATSAPP_DEFAULT_TO` - (Optional) Default WhatsApp number for fallback notifications (e.g., `573103055424`)

### Local Development

Create a `.env.local` file in the root directory with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Email Notifications
RESEND_API_KEY=your-resend-key

# Retel AI Provider Matching
RETEL_API_KEY=your-retel-key

# WhatsApp Business Cloud API
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
INTERNAL_API_KEY=your-strong-random-string
WHATSAPP_DEFAULT_TO=573103055424
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Vercel Environment Variables

When deploying to Vercel, add the following environment variables in your project settings:

1. **Supabase**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Email Notifications**
   - `RESEND_API_KEY`

3. **Retel AI Provider Matching**
   - `RETEL_API_KEY`
   - `RETEL_API_URL` (optional)

4. **WhatsApp Business Cloud API**
   - `WHATSAPP_TOKEN` (Your Meta WhatsApp Business access token)
   - `WHATSAPP_PHONE_NUMBER_ID` (Your WhatsApp Business phone number ID)
   - `INTERNAL_API_KEY` (A strong random string for securing backend API endpoints)
   - `WHATSAPP_DEFAULT_TO` (optional, fallback WhatsApp number)

#### How to Get WhatsApp Business Cloud API Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select an existing app
3. Add the "WhatsApp" product to your app
4. Navigate to WhatsApp > API Setup
5. Find your:
   - **Phone Number ID** (WHATSAPP_PHONE_NUMBER_ID)
   - **Access Token** (WHATSAPP_TOKEN) - Generate a permanent token
6. Test your setup using the provided test number

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
