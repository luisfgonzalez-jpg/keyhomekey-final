import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const ticketId = params.id;
  const body = await request.json();
  const { evidencePhotos } = body;

  try {
    // Fetch ticket with provider info
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('*, providers(user_id)')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    // Check if provider is assigned and verify user is the assigned provider
    if (!ticket.assigned_provider_id) {
      return NextResponse.json(
        { error: 'No hay proveedor asignado a este ticket' },
        { status: 400 }
      );
    }

    if (!ticket.providers || ticket.providers.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Solo el proveedor asignado puede marcar el ticket como completado' },
        { status: 403 }
      );
    }

    // Verify ticket is in "En progreso" status
    if (ticket.status !== 'En progreso') {
      return NextResponse.json(
        { error: `El ticket debe estar en estado "En progreso". Estado actual: ${ticket.status}` },
        { status: 400 }
      );
    }

    // Update ticket to "Completado"
    const { data: updated, error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'Completado',
        completed_at: new Date().toISOString(),
        evidence_photos: evidencePhotos || [],
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    const userName = profile?.name || 'Proveedor';

    // Add timeline event
    const { error: timelineError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        user_name: userName,
        user_role: 'PROVIDER',
        comment_text: 'Trabajo marcado como completado',
        comment_type: 'status_change',
        metadata: {
          old_status: 'En progreso',
          new_status: 'Completado',
          evidence_count: evidencePhotos?.length || 0,
        },
      });

    if (timelineError) {
      console.error('Error adding timeline event:', timelineError);
    }

    // TODO: Send WhatsApp/Email notification to property owner/tenant
    // This should be implemented using the existing notification system

    return NextResponse.json({
      success: true,
      ticket: updated,
      message: 'Ticket marcado como completado. El propietario/inquilino será notificado.',
    });
  } catch (error) {
    console.error('Error completing ticket:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
