import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract ticket ID from params
    const { id: ticketId } = await params;

    // Parse request body
    const body = await request.json();
    const { 
      title,
      description, 
      priority, 
      category, 
      status,
      images 
    } = body;

    // Create authenticated Supabase client
    const authResult = await createAuthenticatedClient(request);
    if (authResult.error) {
      return authResult.error;
    }
    const { supabase, user } = authResult;

    // Get user role from JWT metadata
    const userRole = getUserRole(user);

    // Query ticket to get its property_id
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, property_id')
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

    // Authorization check
    const isAdmin = userRole.toLowerCase() === 'admin';
    const isOwner = property.owner_id === user.id;
    const isTenant = property.tenant_email === user.email;

    if (!isAdmin && !isOwner && !isTenant) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this ticket' }, 
        { status: 403 }
      );
    }

    // Build update object with only provided fields
    const updates: {
      title?: string;
      description?: string;
      priority?: string;
      category?: string;
      status?: string;
      media_urls?: string[];
    } = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category;
    if (status !== undefined) updates.status = status;

    // Handle image uploads if provided
    if (images && Array.isArray(images) && images.length > 0) {
      // Get current media_urls
      const { data: currentTicket } = await supabase
        .from('tickets')
        .select('media_urls')
        .eq('id', ticketId)
        .single();

      const currentMediaUrls = currentTicket?.media_urls || [];
      const newMediaUrls: string[] = [];
      const uploadErrors: string[] = [];

      // Upload new images to ticket-images bucket
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        try {
          // Validate image data exists
          if (!image) {
            uploadErrors.push(`Image ${i + 1}: No data provided`);
            continue;
          }

          // Assuming images come as base64 or file data
          const fileName = `${ticketId}/${Date.now()}-${randomUUID()}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ticket-images')
            .upload(fileName, image);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            uploadErrors.push(`Image ${i + 1}: ${uploadError.message}`);
            continue;
          }

          if (uploadData) {
            newMediaUrls.push(uploadData.path);
          }
        } catch (uploadErr) {
          const errorMsg = uploadErr instanceof Error ? uploadErr.message : 'Unknown error';
          console.error('Error processing image upload:', uploadErr);
          uploadErrors.push(`Image ${i + 1}: ${errorMsg}`);
        }
      }

      // Append new URLs to existing ones
      updates.media_urls = [...currentMediaUrls, ...newMediaUrls];

      // If all images failed to upload, return an error
      if (images.length > 0 && newMediaUrls.length === 0) {
        return NextResponse.json(
          { 
            error: 'Failed to upload images', 
            details: uploadErrors 
          }, 
          { status: 500 }
        );
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
