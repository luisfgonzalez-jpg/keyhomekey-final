import { NextResponse } from 'next/server';

/**
 * WhatsApp Business Cloud API Webhook
 * 
 * This endpoint handles:
 * 1. GET requests - Webhook verification from Meta
 * 2. POST requests - Incoming messages and status updates from WhatsApp
 * 
 * Setup instructions:
 * 1. Set WHATSAPP_WEBHOOK_VERIFY_TOKEN in your environment variables
 * 2. Configure the webhook URL in Meta Developer Console:
 *    https://your-domain.com/api/whatsapp/webhook
 * 3. Use the same verify token when configuring the webhook in Meta
 */

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
}

interface WhatsAppMessageStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: WhatsAppMessage[];
      statuses?: WhatsAppMessageStatus[];
    };
    field: string;
  }>;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

/**
 * GET handler - Webhook verification
 * Meta will send a GET request to verify the webhook URL
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract verification parameters
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');
    
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    // Check if verification token is configured
    if (!verifyToken) {
      console.error('❌ WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured');
      return NextResponse.json(
        { error: 'Webhook verify token not configured' },
        { status: 500 }
      );
    }
    
    // Verify the request
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ WhatsApp webhook verified successfully');
      // Return the challenge to complete verification
      return new NextResponse(challenge, { status: 200 });
    }
    
    console.error('❌ WhatsApp webhook verification failed - Invalid token or mode');
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 }
    );
  } catch (error) {
    console.error('❌ Error in webhook verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Incoming messages and status updates
 * WhatsApp will send POST requests with message data
 */
export async function POST(request: Request) {
  try {
    const body: WhatsAppWebhookPayload = await request.json();
    
    // Validate webhook payload structure
    if (body.object !== 'whatsapp_business_account') {
      console.warn('⚠️ Received non-WhatsApp webhook payload');
      return NextResponse.json({ success: true }, { status: 200 });
    }
    
    // Process each entry in the webhook payload
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const value = change.value;
        
        // Handle incoming messages
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            await handleIncomingMessage(message, value);
          }
        }
        
        // Handle message status updates (sent, delivered, read, failed)
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            await handleMessageStatus(status);
          }
        }
      }
    }
    
    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Still return 200 to prevent WhatsApp from retrying
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Handle incoming WhatsApp messages
 */
async function handleIncomingMessage(
  message: WhatsAppMessage,
  value: WhatsAppWebhookEntry['changes'][0]['value']
) {
  console.log('📨 Incoming WhatsApp message:', {
    from: message.from,
    messageId: message.id,
    type: message.type,
    timestamp: message.timestamp,
  });
  
  // Extract message text
  const messageText = message.text?.body || '';
  
  // Get sender information
  const senderName = value.contacts?.[0]?.profile?.name || 'Unknown';
  
  console.log(`Message from ${senderName} (${message.from}): ${messageText}`);
  
  // TODO: Implement your business logic here
  // Examples:
  // - Store message in database
  // - Create a ticket or task
  // - Send automated response
  // - Notify staff members
  // - Update ticket status based on provider responses
  
  // For now, just log the message
  // You can add custom logic based on your requirements
}

/**
 * Handle message status updates
 */
async function handleMessageStatus(status: WhatsAppMessageStatus) {
  console.log('📊 Message status update:', {
    messageId: status.id,
    status: status.status,
    timestamp: status.timestamp,
    recipientId: status.recipient_id,
  });
  
  // TODO: Implement your business logic here
  // Examples:
  // - Update message delivery status in database
  // - Notify user if message failed
  // - Track message analytics
}
