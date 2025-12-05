import { NextResponse } from 'next/server';

// Colombia country code for phone number normalization
const COLOMBIA_COUNTRY_CODE = '57';

interface WhatsAppNotifyRequest {
  to: string;
  message: string;
}

interface WhatsAppAPIResponse {
  messages?: { id: string }[];
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Validates the request is authorized.
 * Authorization can be via:
 * 1. API key in x-api-key header (for server-to-server calls)
 * 2. Same-origin request (for frontend calls within the application)
 */
function isAuthorized(request: Request): boolean {
  const apiKey = request.headers.get('x-api-key');
  const internalApiKey = process.env.INTERNAL_API_KEY;

  // If API key is provided and matches, authorize
  if (apiKey && internalApiKey && apiKey === internalApiKey) {
    return true;
  }

  // For same-origin requests (frontend calls), check the origin/referer header
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Allow requests where origin or referer matches the host
  if (host) {
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host === host) {
          return true;
        }
      } catch {
        // Invalid origin URL, continue to check referer
      }
    }

    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host === host) {
          return true;
        }
      } catch {
        // Invalid referer URL
      }
    }
  }

  return false;
}

/**
 * Normalizes a phone number by:
 * 1. Removing all non-digit characters
 * 2. Prepending Colombia country code if not already present
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Prepend country code if not already present
  if (!digits.startsWith(COLOMBIA_COUNTRY_CODE)) {
    return `${COLOMBIA_COUNTRY_CODE}${digits}`;
  }
  
  return digits;
}

export async function POST(request: Request) {
  try {
    // 1. Validate authorization (API key or same-origin request)
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // 2. Validate required environment variables for WhatsApp API
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !whatsappPhoneNumberId) {
      console.error('❌ WhatsApp API credentials not configured (WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing)');
      return NextResponse.json(
        { success: false, error: { message: 'WhatsApp API credentials not configured' } },
        { status: 500 }
      );
    }

    // 3. Parse and validate request body
    const body: WhatsAppNotifyRequest = await request.json();
    const { to, message } = body;

    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Missing or invalid "to" field' } },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Missing or invalid "message" field' } },
        { status: 400 }
      );
    }

    // 4. Normalize phone number
    const normalizedPhone = normalizePhoneNumber(to);

    // 5. Call WhatsApp Business Cloud API
    const whatsappApiUrl = `https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`;

    const whatsappResponse = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: {
          body: message,
        },
      }),
    });

    const responseData: WhatsAppAPIResponse = await whatsappResponse.json();

    // 6. Handle WhatsApp API errors
    if (!whatsappResponse.ok || responseData.error) {
      console.error('❌ WhatsApp API error:', responseData.error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: responseData.error?.message || 'WhatsApp API request failed',
          },
        },
        { status: whatsappResponse.status || 500 }
      );
    }

    // 7. Success response
    console.log('✅ WhatsApp message sent successfully:', responseData.messages?.[0]?.id);
    return NextResponse.json({
      success: true,
      data: {
        messageId: responseData.messages?.[0]?.id,
        to: normalizedPhone,
      },
    });
  } catch (error: unknown) {
    console.error('❌ Unexpected error in WhatsApp notify API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: { message: errorMessage } },
      { status: 500 }
    );
  }
}
