import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Constants for user defaults
const DEFAULT_USER_ROLE = 'TENANT' as const;

// Type definitions
interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

interface MediaInfo {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface TicketUpdate {
  updated_at: string;
  description?: string;
  priority?: string;
  category?: string;
  title?: string;
  media_urls?: string[];
  media_info?: MediaInfo[];
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

/**
 * Extracts user role from JWT user object
 * Falls back to TENANT if metadata not available
 */
function getUserRole(user: AuthenticatedUser): string {
  const userMeta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};
  return (userMeta.role as string) || 
         (appMeta.role as string) || 
         DEFAULT_USER_ROLE;
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
 * Update ticket details - owner, tenant, or admin can edit
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract ticket ID from params
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

    // Get user role from JWT metadata
    const userRole = getUserRole(user);

    // Query ticket to get its property_id and existing data
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, property_id, media_urls, media_info')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Error fetching ticket:', ticketError);
      return NextResponse.json(
        { error: ticketError?.message || 'Ticket not found' }, 
        { status: ticketError?.code === 'PGRST116' ? 404 : 500 }
      );
    }

    // Query property to get owner_id and tenant_email
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('owner_id, tenant_email')
      .eq('id', ticket.property_id)
      .single();

    if (propertyError || !property) {
      console.error('Error fetching property:', propertyError);
      return NextResponse.json(
        { error: 'Property not found' }, 
        { status: 404 }
      );
    }

    // Authorization check: admin, owner, or tenant
    const isAdmin = userRole.toUpperCase() === 'ADMIN';
    const isOwner = property.owner_id === user.id;
    const isTenant = property.tenant_email === user.email;

    if (!isAdmin && !isOwner && !isTenant) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this ticket' }, 
        { status: 403 }
      );
    }

    // Build update object with only provided fields
    const updates: TicketUpdate = {
      updated_at: new Date().toISOString()
    };

    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;

    // Handle new media uploads - append to existing media
    if (newMediaPaths && Array.isArray(newMediaPaths) && newMediaPaths.length > 0) {
      const existingMediaUrls = ticket.media_urls || [];
      const existingMediaInfo = ticket.media_info || [];
      
      updates.media_urls = [...existingMediaUrls, ...newMediaPaths];
      
      if (newMediaInfo && Array.isArray(newMediaInfo)) {
        updates.media_info = [...existingMediaInfo, ...newMediaInfo];
      }
    }

    // Update ticket with new values
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update(updates)
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

    return NextResponse.json({ 
      success: true, 
      ticket: updatedTicket 
    });
  } catch (error: unknown) {
    console.error('Error in PATCH /api/tickets/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
