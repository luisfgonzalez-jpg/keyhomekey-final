import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const ticketId = params.id;

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener comentarios con verificación de acceso (RLS se encarga)
    const { data: comments, error } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, comments });
  } catch (error: unknown) {
    console.error('Error in GET /api/tickets/[id]/comments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const ticketId = params.id;
    const body = await request.json();
    const { comment_text, media_urls = [], comment_type = 'comment' } = body;

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener info del usuario
    const { data: profile } = await supabase
      .from('users_profiles')
      .select('name, role')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Crear comentario
    const { data: newComment, error: insertError } = await supabase
      .from('ticket_comments')
      .insert([{
        ticket_id: ticketId,
        user_id: user.id,
        user_name: profile.name,
        user_role: profile.role,
        comment_text,
        comment_type,
        media_urls,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Obtener información del ticket y notificar a otros usuarios
    const { data: ticket } = await supabase
      .from('tickets')
      .select(`
        *,
        properties (
          owner_id,
          tenant_email,
          tenant_phone,
          address
        ),
        providers (
          phone,
          name
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticket) {
      // Enviar notificaciones WhatsApp (solo a quienes NO escribieron el comentario)
      const notifications = [];
      
      // Notificar al proveedor si existe y no es quien comentó
      if (ticket.assigned_provider_id && profile.role !== 'PROVIDER' && ticket.providers?.phone) {
        notifications.push(
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/whatsapp/notify`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': process.env.INTERNAL_API_KEY || ''
            },
            body: JSON.stringify({
              to: ticket.providers.phone,
              message: `💬 Nuevo comentario en ticket #${ticketId.substring(0, 8)}\nDe: ${profile.name} (${profile.role})\n"${comment_text}"\n\nVer ticket: ${process.env.NEXT_PUBLIC_SITE_URL || ''}/tickets/${ticketId}`
            })
          })
        );
      }

      // Notificar al inquilino si no es quien comentó
      if (profile.role !== 'TENANT' && ticket.properties?.tenant_phone) {
        notifications.push(
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/whatsapp/notify`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': process.env.INTERNAL_API_KEY || ''
            },
            body: JSON.stringify({
              to: ticket.properties.tenant_phone,
              message: `💬 Nuevo comentario en ticket #${ticketId.substring(0, 8)}\nDe: ${profile.name} (${profile.role})\n"${comment_text}"\n\nVer ticket: ${process.env.NEXT_PUBLIC_SITE_URL || ''}/tickets/${ticketId}`
            })
          })
        );
      }

      // Ejecutar notificaciones en paralelo sin bloquear respuesta
      Promise.all(notifications).catch(err => console.error('Error sending notifications:', err));
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: unknown) {
    console.error('Error in POST /api/tickets/[id]/comments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
