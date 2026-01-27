-- Add tenant_id column to properties table
-- This allows properties to have an optional foreign key reference to an authenticated tenant user

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id);

-- Add comment to document the column
COMMENT ON COLUMN properties.tenant_id IS 'References authenticated tenant user. NULL if tenant not registered or using legacy text-based tenant info.';

-- Update RLS policies to include tenant_id check for viewing properties
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their properties" ON properties;

-- Recreate policy with tenant_id check
CREATE POLICY "Users can view their properties"
  ON properties FOR SELECT
  USING (
    owner_id = auth.uid() OR 
    tenant_id = auth.uid() OR
    tenant_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Update RLS policies for tickets to include tenant_id check
-- This is handled in ticket_comments migration, but we ensure property access is correct
