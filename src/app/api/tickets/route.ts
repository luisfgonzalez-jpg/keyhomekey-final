// /app/api/tickets/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { searchExternalProviders } from '@/lib/googleProviderSearch';
import type { ExternalProvider } from '@/type/googleProvider';

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
      mediaPaths,
      mediaInfo,
      reported_by_email,
      reporter,
    } = await request.json();

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
          media_info: mediaInfo, // 👈 IMPORTANTE: guardar info detallada
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // ---------------------------------------------------------------------
    // Buscar proveedor interno y externos
    // ---------------------------------------------------------------------
    let whatsappNumber = KEYHOME_WHATSAPP;
    let providerLabel = 'KeyhomeKey';
    let externalProviders: ExternalProvider[] = [];

    // Obtener propiedad para matching
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (property) {
      try {
        // Buscar proveedor interno en la base de datos
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
          console.log(`✅ Internal provider found: ${providerLabel}`);
        } else {
          console.log('ℹ️ No internal provider found, searching external providers...');
        }

        // Buscar proveedores externos via Google (siempre, para tener opciones adicionales)
        try {
          externalProviders = await searchExternalProviders({
            category,
            location: {
              department: property.department,
              municipality: property.municipality,
            },
            description,
          });

          // Guardar proveedores externos en el ticket como metadata
          if (externalProviders.length > 0) {
            try {
              await supabase
                .from('tickets')
                .update({
                  external_providers: externalProviders,
                })
                .eq('id', ticket.id);
              
              console.log(`✅ Stored ${externalProviders.length} external providers in ticket metadata`);
            } catch (updateErr) {
              console.warn('⚠️ Could not store external providers in database. Column may not exist.', updateErr);
            }
          }
        } catch (extErr) {
          console.error('Error searching external providers:', extErr);
        }
      } catch (err) {
        console.error('Error finding provider:', err);
      }
    }

    // ---------------------------------------------------------------------
    // Enviar notificación por WhatsApp con texto + adjuntos (si existen)
    // ---------------------------------------------------------------------
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

      // Texto
      await sendWhatsAppMessage({
        messaging_product: 'whatsapp',
        to: normalizedTo,
        type: 'text',
        text: { body: message },
      });

      // Media
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
    } catch (notifyError) {
      console.error('No se pudo enviar WhatsApp:', notifyError);
    }

    return NextResponse.json({ 
      success: true, 
      ticket,
      externalProviders: externalProviders.length > 0 ? externalProviders : undefined,
      internalProviderFound: providerLabel !== 'KeyhomeKey',
    });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}