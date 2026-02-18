-- Migration: Add Ticket Approval System
-- Description: Adds ticket_approvals table and new status columns to tickets table

-- 1. Create ticket_approvals table
CREATE TABLE IF NOT EXISTS ticket_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected')),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  quality_score INTEGER CHECK (quality_score IS NULL OR (quality_score >= 1 AND quality_score <= 5)),
  punctuality_score INTEGER CHECK (punctuality_score IS NULL OR (punctuality_score >= 1 AND punctuality_score <= 5)),
  comment TEXT,
  evidence_photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_ticket_approvals_ticket ON ticket_approvals(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_approvals_created ON ticket_approvals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_approvals_approved_by ON ticket_approvals(approved_by);

-- 2. Add new columns to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS evidence_photos TEXT[];

-- 3. Enable Row Level Security for ticket_approvals
ALTER TABLE ticket_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view approvals for tickets they're involved in
CREATE POLICY "Users can view approvals on their tickets"
  ON ticket_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN providers prov ON t.assigned_provider_id = prov.id
      WHERE t.id = ticket_approvals.ticket_id
      AND (
        p.owner_id = auth.uid() OR
        p.tenant_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        prov.user_id = auth.uid() OR
        auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'ADMIN')
      )
    )
  );

-- Policy: Only owners and tenants can create approvals
CREATE POLICY "Property owners and tenants can create approvals"
  ON ticket_approvals FOR INSERT
  WITH CHECK (
    auth.uid() = approved_by AND
    EXISTS (
      SELECT 1 FROM tickets t
      LEFT JOIN properties p ON t.property_id = p.id
      WHERE t.id = ticket_approvals.ticket_id
      AND (
        p.owner_id = auth.uid() OR
        p.tenant_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- 4. Configure Realtime for ticket_approvals
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_approvals;

-- 5. Create function to get provider average rating
CREATE OR REPLACE FUNCTION get_provider_rating(provider_user_id UUID)
RETURNS TABLE (
  avg_rating NUMERIC,
  total_reviews BIGINT,
  avg_quality NUMERIC,
  avg_punctuality NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(ta.rating), 1) as avg_rating,
    COUNT(*) as total_reviews,
    ROUND(AVG(ta.quality_score), 1) as avg_quality,
    ROUND(AVG(ta.punctuality_score), 1) as avg_punctuality
  FROM ticket_approvals ta
  JOIN tickets t ON ta.ticket_id = t.id
  JOIN providers p ON t.assigned_provider_id = p.id
  WHERE p.user_id = provider_user_id
    AND ta.action = 'approved'
    AND ta.rating IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
