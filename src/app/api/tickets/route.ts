// /app/api/tickets/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
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

    // Aquí puedes agregar lógica de WhatsApp si la tienes

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}