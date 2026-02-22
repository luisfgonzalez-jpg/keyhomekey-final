import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const ticketId = params.id;

  try {
    // Verify the user is the assigned provider for this ticket
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('*, providers(user_id)')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    if (!ticket.providers || ticket.providers.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Solo el proveedor asignado puede aceptar este ticket' },
        { status: 403 }
      );
    }

    if (ticket.status !== 'Asignado') {
      return NextResponse.json(
        { error: `El ticket debe estar en estado "Asignado". Estado actual: ${ticket.status}` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('tickets')
      .update({ status: 'En progreso' })
      .eq('id', ticketId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
