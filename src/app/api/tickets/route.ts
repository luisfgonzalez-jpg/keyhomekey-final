// /app/api/tickets/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { EXTERNAL_PROVIDER_ID } from '@/components/ProviderSelector';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const whatsappToken = process.env.WHATSAPP_TOKEN;
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const KEYHOME_WHATSAPP = process.env.KEYHOME_WHATSAPP || process.env.KEYHOME_WHATSAPP_NUMBER || '573202292534';

type MediaAttachment = {
  url: string;
  type: 'image' | 'video' | 'document';
  caption?: string;
  filename?: string;
};

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('57')) return `57${digits}`;
  return digits;
}

async function sendWhatsAppMessage(payload: Record<string, any>) {
  if (!whatsappToken || !whatsappPhoneNumberId) {
    console.warn('WhatsApp credentials missing; skipping notification');
    return;
  }

  const whatsappApiUrl = `https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`;

  const resp = await fetch(whatsappApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${whatsappToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await resp.json();
  if (!resp.ok || json.error) {
    console.error('WhatsApp send error:', json.error || json);
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Faltan variables de entorno de Supabase (URL o SERVICE_ROLE_KEY).' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      propertyId,
      category,
      description,
      priority,
      assigned_provider_id,
      assigned_provider_name,
      is_external_provider,
      mediaPaths,
      mediaInfo,
      reported_by_email,
      reporter,
    } = await request.json();

    // Create ticket with assigned provider from the start
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([
        {
          property_id: propertyId,
          category,
          description,
          priority,
          status: 'Pendiente',
          reporter,
          reported_by_email,
          media_urls: mediaPaths,
          media_info: mediaInfo,
          assigned_provider_id: assigned_provider_id !== EXTERNAL_PROVIDER_ID ? assigned_provider_id : null,
          assigned_provider_name,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Ticket created with ID:', ticket.id);
    console.log('📋 Provider info:', { 
      assigned_provider_id, 
      assigned_provider_name, 
      is_external_provider 
    });

    // Get property info for WhatsApp message
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    // Determine WhatsApp recipient
    let whatsappNumber = KEYHOME_WHATSAPP;
    let providerLabel = assigned_provider_name || 'KeyhomeKey';

    // Send to internal provider if one was selected (not external)
    if (!is_external_provider && assigned_provider_id && assigned_provider_id !== EXTERNAL_PROVIDER_ID) {
      // Get phone number for internal provider
      try {
        const { data: provider } = await supabase
          .from('providers')
          .select('phone')
          .eq('id', assigned_provider_id)
          .single();
        
        if (provider?.phone) {
          const digits = String(provider.phone).replace(/\D/g, '');
          whatsappNumber = digits.startsWith('57') ? digits : `57${digits}`;
          console.log(`✅ Sending WhatsApp to internal provider: ${providerLabel} (${whatsappNumber})`);
        }
      } catch (providerErr) {
        console.warn('⚠️ Could not fetch provider phone, using KeyhomeKey number:', providerErr);
      }
    } else if (is_external_provider) {
      console.log('ℹ️ External provider selected, sending notification to KeyhomeKey');
      providerLabel = assigned_provider_name || 'Proveedor Externo';
    }

    // Send WhatsApp notification
    try {
      const normalizedTo = normalizePhoneNumber(whatsappNumber);

      const message = `Nuevo ticket registrado\n\n` +
        `Categoría: ${category}\n` +
        `Prioridad: ${priority}\n` +
        `Inmueble: ${property?.address || propertyId}\n` +
        `Ubicación: ${property?.municipality || ''}, ${property?.department || ''}\n` +
        `Descripción: ${description}\n` +
        `Reportado por: ${reporter}${reported_by_email ? ` (${reported_by_email})` : ''}\n` +
        `Asignado a: ${providerLabel}`;

      const mediaPayload: MediaAttachment[] = [];

      if (Array.isArray(mediaPaths) && mediaPaths.length > 0) {
        const signedResults = await Promise.all(
          mediaPaths.map(async (path: string) => {
            const { data, error: signedError } = await supabase
              .storage
              .from('tickets-media')
              .createSignedUrl(path, 60 * 60); // 1h

            if (signedError || !data?.signedUrl) {
              console.error('Error creando URL firmada para WhatsApp', signedError);
              return null;
            }

            return data.signedUrl;
          })
        );

        signedResults.forEach((signedUrl, index) => {
          if (!signedUrl) return;
          const info = mediaInfo?.[index];
          const mime = info?.type || '';
          const type: MediaAttachment['type'] = mime.startsWith('video')
            ? 'video'
            : mime.startsWith('image')
            ? 'image'
            : 'document';

          mediaPayload.push({
            url: signedUrl,
            type,
            caption: info?.name,
            filename: info?.name,
          });
        });
      }

      // Send text message
      await sendWhatsAppMessage({
        messaging_product: 'whatsapp',
        to: normalizedTo,
        type: 'text',
        text: { body: message },
      });

      // Send media attachments
      for (const media of mediaPayload) {
        const basePayload: Record<string, any> = {
          messaging_product: 'whatsapp',
          to: normalizedTo,
          type: media.type,
        };

        if (media.type === 'image') {
          basePayload.image = { link: media.url, caption: media.caption };
        } else if (media.type === 'video') {
          basePayload.video = { link: media.url, caption: media.caption };
        } else {
          basePayload.document = { link: media.url, caption: media.caption, filename: media.filename };
        }

        await sendWhatsAppMessage(basePayload);
      }

      console.log('✅ WhatsApp notification sent successfully');
    } catch (notifyError) {
      console.error('⚠️ Could not send WhatsApp notification:', notifyError);
    }

    // Return ticket with provider name
    const ticketWithProvider = {
      ...ticket,
      assigned_provider_name: providerLabel,
    };

    return NextResponse.json({ 
      success: true, 
      ticket: ticketWithProvider,
    });
  } catch (error: any) {
    console.error('❌ Error creating ticket:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}