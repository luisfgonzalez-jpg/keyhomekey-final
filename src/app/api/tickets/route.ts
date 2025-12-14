import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

const DEFAULT_WHATSAPP = process.env.KEYHOME_WHATSAPP || '573103055424';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      propertyId,
      category,
      description,
      priority,
      mediaPaths = [],
      reported_by_email = '',
      reporter = 'Propietario',
    } = body;

    if (!propertyId) {
      return NextResponse.json({ success: false, error: { message: 'propertyId is required' } }, { status: 400 });
    }

    const supabase = await createClient();

    // 1) Crear el ticket
    const { data: ticketData, error: insertErr } = await supabase
      .from('tickets')
      .insert([
        {
          property_id: propertyId,
          category,
          description,
          priority,
          reporter,
          reported_by_email,
          status: 'Pendiente',
          media_urls: mediaPaths.length > 0 ? mediaPaths : null,
        },
      ])
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting ticket:', insertErr);
      return NextResponse.json({ success: false, error: insertErr }, { status: 500 });
    }

    // 2) Obtener propiedad para matching
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    // 3) Buscar proveedor
    let whatsappNumber = DEFAULT_WHATSAPP;
    let providerLabel = 'KeyhomeKey';

    if (property) {
      try {
        const { data: providers } = await supabase
          .from('providers')
          .select('name, phone, specialty, department, municipality, is_active')
          .eq('department', property.department)
          .eq('municipality', property.municipality)
          .eq('specialty', category)
          .eq('is_active', true)
          .limit(1);

        if (providers && providers.length > 0) {
          const provider = providers[0] as any;
          providerLabel = provider.name || 'Proveedor';
          if (provider.phone) {
            const digits = String(provider.phone).replace(/\D/g, '');
            whatsappNumber = digits.startsWith('57') ? digits : `57${digits}`;
          }
        }
      } catch (err) {
        console.error('Error finding provider:', err);
      }
    }

    // 4) Construir texto
    const text = `Nuevo ticket de ${reporter}.\n\nInmueble: ${property?.address || ''} - ${property?.municipality || ''}, ${property?.department || ''}\nCategoría: ${category}\nPrioridad: ${priority}\nDescripción: ${description}\n\nAsignado a: ${providerLabel}.`;

    // 5) Llamada a WhatsApp Business API (Meta)
    const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const WA_TOKEN = process.env.WHATSAPP_TOKEN;

    let waResponse = null;

    if (WA_PHONE_ID && WA_TOKEN) {
      try {
        // Validar formato del número de teléfono (debe incluir código de país)
        // El número debe ser solo dígitos y tener al menos 11 caracteres (código país + número)
        const isValidPhone = whatsappNumber && /^\d{11,15}$/.test(whatsappNumber);
        
        if (!isValidPhone) {
          console.warn('⚠️ Invalid phone number format - skipping WhatsApp notification');
          // No continuar con el envío si el número es inválido
        } else {
          const url = `https://graph.facebook.com/v16.0/${WA_PHONE_ID}/messages`;
          const payload = {
            messaging_product: 'whatsapp',
            to: whatsappNumber,
            type: 'text',
            text: { body: text },
          };

          console.log('📤 Sending WhatsApp message...');

          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${WA_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          waResponse = await resp.json();

          // Verificar el estado de la respuesta
          if (resp.ok && waResponse.messages && waResponse.messages.length > 0) {
            const messageId = waResponse.messages[0]?.id;
            console.log('✅ WhatsApp message sent successfully. Message ID:', messageId || 'N/A');
          } else if (waResponse.error) {
            // Manejar errores específicos de la API de WhatsApp
            console.error('❌ WhatsApp API error:', {
              code: waResponse.error?.code,
              message: waResponse.error?.message,
              type: waResponse.error?.type,
              error_data: waResponse.error?.error_data,
              fbtrace_id: waResponse.error?.fbtrace_id
            });
          } else {
            console.error('❌ WhatsApp API returned unexpected response:', {
              status: resp.status,
              statusText: resp.statusText,
              response: waResponse
            });
          }
        }
      } catch (err) {
        console.error('❌ Error calling WhatsApp API:', err);
        if (err instanceof Error) {
          console.error('Error details:', {
            message: err.message,
            stack: err.stack
          });
        }
      }
    } else {
      console.warn('⚠️ WhatsApp env vars not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_TOKEN)');
    }

    return NextResponse.json({ success: true, ticket: ticketData, whatsapp: waResponse });
  } catch (error: any) {
    console.error('Unexpected error in /api/tickets:', error);
    return NextResponse.json({ success: false, error: { message: error.message || 'Internal error' } }, { status: 500 });
  }
}
