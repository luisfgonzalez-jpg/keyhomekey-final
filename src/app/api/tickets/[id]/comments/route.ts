import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

    // Read token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Validate token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const body = await request.json();
    const { comment_text, media_urls = [], comment_type = 'comment' } = body;

    // Read token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Validate token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get user info from JWT/session (no database query needed)
    // Use email as name fallback if name not in metadata
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario';
    const userRole = user.user_metadata?.role || user.app_metadata?.role || 'TENANT';

    // Crear comentario
    const { data: newComment, error: insertError } = await supabase
      .from('ticket_comments')
      .insert([{
        ticket_id: ticketId,
        user_id: user.id,
        user_name: userName,
        user_role: userRole,
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
      // Función para crear el mensaje de notificación
      const createNotificationMessage = (role: string) => {
        return `💬 Nuevo comentario en ticket #${ticketId.substring(0, 8)}\nDe: ${userName} (${role})\n"${comment_text}"\n\nVer ticket: ${process.env.NEXT_PUBLIC_SITE_URL || ''}/tickets/${ticketId}`;
      };

      // Base URL para las notificaciones
      const notifyApiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/whatsapp/notify`;
      const apiHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INTERNAL_API_KEY || ''
      };

      // Enviar notificaciones WhatsApp (solo a quienes NO escribieron el comentario)
      const notifications = [];
      
      // Notificar al proveedor si existe y no es quien comentó
      if (ticket.assigned_provider_id && userRole !== 'PROVIDER' && ticket.providers?.phone) {
        notifications.push(
          fetch(notifyApiUrl, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({
              to: ticket.providers.phone,
              message: createNotificationMessage(userRole)
            })
          })
        );
      }

      // Notificar al inquilino si no es quien comentó
      if (userRole !== 'TENANT' && ticket.properties?.tenant_phone) {
        notifications.push(
          fetch(notifyApiUrl, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({
              to: ticket.properties.tenant_phone,
              message: createNotificationMessage(userRole)
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
