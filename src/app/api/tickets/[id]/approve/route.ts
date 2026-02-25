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
  const {
    action,
    rating,
    qualityScore,
    punctualityScore,
    comment,
    evidencePhotos,
  } = body;

  try {
    // Validations
    if (!action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      );
    }

    if (action === 'approved' && (!rating || rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Calificación requerida (1-5) al aprobar' },
        { status: 400 }
      );
    }

    if (action === 'rejected' && !comment) {
      return NextResponse.json(
        { error: 'Comentario requerido al rechazar' },
        { status: 400 }
      );
    }

    // Fetch ticket with property info
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('*, properties(*)')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    // Verify ticket is in "Completado" status
    if (ticket.status !== 'Completado') {
      return NextResponse.json(
        { error: `Solo se pueden aprobar/rechazar tickets en estado "Completado". Estado actual: ${ticket.status}` },
        { status: 400 }
      );
    }

    // Get user email for tenant check
    const { data: authUser } = await supabase.auth.getUser();
    const userEmail = authUser.user?.email;

    // Verify user is owner or tenant (check both tenant_id and tenant_email)
    const isOwner = ticket.properties.owner_id === user.id;
    const isTenantByEmail = ticket.properties.tenant_email === userEmail;
    const isTenantById = ticket.properties.tenant_id === user.id;
    const isTenant = isTenantByEmail || isTenantById;

    if (!isOwner && !isTenant) {
      return NextResponse.json(
        { error: 'Solo el propietario o inquilino puede aprobar/rechazar el trabajo' },
        { status: 403 }
      );
    }

    // Register approval/rejection
    const { error: approvalError } = await supabase
      .from('ticket_approvals')
      .insert({
        ticket_id: ticketId,
        approved_by: user.id,
        action,
        rating: action === 'approved' ? rating : null,
        quality_score: qualityScore || null,
        punctuality_score: punctualityScore || null,
        comment: comment || null,
        evidence_photos: evidencePhotos || [],
      });

    if (approvalError) {
      console.error('Error creating approval:', approvalError);
      return NextResponse.json(
        { error: approvalError.message },
        { status: 500 }
      );
    }

    // Update ticket status
    const newStatus = action === 'approved' ? 'Resuelto' : 'Rechazado';

    const { data: updated, error: updateError } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', ticketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ticket status:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    const userName = profile?.full_name || (isOwner ? 'Propietario' : 'Inquilino');
    const userRole = isOwner ? 'OWNER' : 'TENANT';

    // Add timeline event
    const commentText =
      action === 'approved'
        ? `Trabajo aprobado con ${rating} estrellas`
        : `Trabajo rechazado: ${comment}`;

    const { error: timelineError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        user_name: userName,
        user_role: userRole,
        comment_text: commentText,
        comment_type: action === 'approved' ? 'approved' : 'rejected',
        metadata: {
          action,
          rating: action === 'approved' ? rating : null,
          quality_score: qualityScore || null,
          punctuality_score: punctualityScore || null,
          old_status: 'Completado',
          new_status: newStatus,
        },
      });

    if (timelineError) {
      console.error('Error adding timeline event:', timelineError);
    }

    // TODO: Send WhatsApp/Email notification to provider
    // This should be implemented using the existing notification system

    return NextResponse.json({
      success: true,
      ticket: updated,
      message:
        action === 'approved'
          ? 'Trabajo aprobado exitosamente. El proveedor será notificado.'
          : 'Trabajo rechazado. El proveedor será notificado para hacer correcciones.',
    });
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
