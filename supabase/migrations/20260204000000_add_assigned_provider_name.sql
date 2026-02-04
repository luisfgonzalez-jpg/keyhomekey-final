-- Add assigned_provider_name column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS assigned_provider_name TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_provider_name 
ON tickets(assigned_provider_name);

-- Add comment
COMMENT ON COLUMN tickets.assigned_provider_name 
IS 'Full name of assigned provider (internal or external)';
