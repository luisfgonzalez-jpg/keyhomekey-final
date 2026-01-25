-- Fix RLS policies to avoid querying auth.users table
-- This migration replaces policies that query auth.users with JWT-based checks

-- Drop existing policies that query auth.users table
DROP POLICY IF EXISTS "Users can view comments on their tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Users can create comments on their tickets" ON ticket_comments;

-- Policy: Ver comentarios si eres parte del ticket
-- Uses auth.jwt() to get email instead of querying auth.users
CREATE POLICY "Users can view comments on their tickets"
  ON ticket_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN providers prov ON t.assigned_provider_id = prov.id
      WHERE t.id = ticket_comments.ticket_id
      AND (
        p.owner_id = auth.uid() OR
        p.tenant_email = auth.jwt() ->> 'email' OR
        prov.user_id = auth.uid()
      )
    )
  );

-- Policy: Crear comentarios si eres parte del ticket
-- Uses auth.jwt() to get email instead of querying auth.users
CREATE POLICY "Users can create comments on their tickets"
  ON ticket_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN providers prov ON t.assigned_provider_id = prov.id
      WHERE t.id = ticket_comments.ticket_id
      AND (
        p.owner_id = auth.uid() OR
        p.tenant_email = auth.jwt() ->> 'email' OR
        prov.user_id = auth.uid()
      )
    )
  );

-- Note: The UPDATE and DELETE policies only check user_id = auth.uid()
-- so they don't need to be modified as they don't query auth.users
