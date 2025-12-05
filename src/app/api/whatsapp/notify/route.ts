import { NextResponse } from 'next/server';

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
 * Normalizes a phone number by:
 * 1. Removing all non-digit characters
 * 2. Prepending Colombia country code (57) if not already present
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Prepend 57 if not already present
  if (!digits.startsWith('57')) {
    return `57${digits}`;
  }
  
  return digits;
}

export async function POST(request: Request) {
  try {
    // 1. Validate internal API key
    const apiKey = request.headers.get('x-api-key');
    const internalApiKey = process.env.INTERNAL_API_KEY;

    if (!internalApiKey) {
      console.error('❌ INTERNAL_API_KEY not configured in environment');
      return NextResponse.json(
        { success: false, error: { message: 'Server configuration error' } },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== internalApiKey) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // 2. Validate required environment variables for WhatsApp API
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !whatsappPhoneNumberId) {
      console.error('❌ WhatsApp API credentials not configured');
      return NextResponse.json(
        { success: false, error: { message: 'WhatsApp API not configured' } },
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
