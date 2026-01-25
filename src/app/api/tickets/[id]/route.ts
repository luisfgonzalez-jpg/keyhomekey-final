import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Type definitions
interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

interface AuthSuccess {
  supabase: SupabaseClient;
  user: AuthenticatedUser;
  error?: undefined;
}

interface AuthError {
  error: NextResponse;
  supabase?: undefined;
  user?: undefined;
}

interface MediaInfo {
  url: string;
  name: string;
  type: string;
  size: number;
}

/**
 * Creates an authenticated Supabase client using the Bearer token from request headers
 * Returns the client and authenticated user, or an error response if authentication fails
 */
async function createAuthenticatedClient(request: NextRequest): Promise<AuthSuccess | AuthError> {
  // Read token from Authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return { error: NextResponse.json({ error: 'No authorization token provided' }, { status: 401 }) };
  }

  // Create Supabase client with the user's JWT token for RLS enforcement
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  // Validate token with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    console.error('Auth error:', authError);
    return { error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }

  return { supabase, user };
}

/**
 * PATCH /api/tickets/[id]
 * Update ticket details - only owner or admin can edit
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    
    // Create authenticated Supabase client
    const authResult = await createAuthenticatedClient(request);
    if (authResult.error) {
      return authResult.error;
    }
    const { supabase, user } = authResult;

    // Parse request body
    const body = await request.json();
    const { 
      description, 
      priority, 
      category,
      title,
      newMediaPaths,
      newMediaInfo 
    } = body;

    // Get existing ticket to verify ownership
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select(`
        *,
        properties!inner (
          owner_id
        )
      `)
      .eq('id', ticketId)
      .single();

    if (fetchError || !existingTicket) {
      console.error('Error fetching ticket:', fetchError);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    const isOwner = existingTicket.properties?.owner_id === user.id;
    const userRole = (user.user_metadata?.role || user.app_metadata?.role || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'No autorizado para editar este ticket' }, 
        { status: 403 }
      );
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;

    // Handle new media uploads - append to existing media
    if (newMediaPaths && Array.isArray(newMediaPaths) && newMediaPaths.length > 0) {
      const existingMediaUrls = existingTicket.media_urls || [];
      const existingMediaInfo = existingTicket.media_info || [];
      
      updates.media_urls = [...existingMediaUrls, ...newMediaPaths];
      
      if (newMediaInfo && Array.isArray(newMediaInfo)) {
        updates.media_info = [...existingMediaInfo, ...newMediaInfo];
      }
    }

    // Update ticket in database
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error: unknown) {
    console.error('Error in PATCH /api/tickets/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
