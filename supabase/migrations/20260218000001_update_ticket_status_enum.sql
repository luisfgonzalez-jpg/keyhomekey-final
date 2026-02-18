-- Migration: Update Ticket Status Enum
-- Description: Updates ticket status values to support new approval workflow
-- 
-- IMPORTANT: This migration updates the ticket status values.
-- The new status workflow is:
-- Pendiente → Asignado → En progreso → Completado → Resuelto/Rechazado
--
-- Old statuses:
-- - Pendiente
-- - En proceso  
-- - Completado
--
-- New statuses:
-- - Pendiente (ticket created, not assigned)
-- - Asignado (provider assigned, not started)
-- - En progreso (provider working)
-- - Completado (provider finished, awaiting approval)
-- - Resuelto (approved by owner/tenant)
-- - Rechazado (rejected by owner/tenant, needs correction)

-- Note: If using an ENUM type, you may need to:
-- 1. Check if status is stored as VARCHAR or ENUM
-- 2. If VARCHAR, no changes needed - just update application logic
-- 3. If ENUM, run ALTER TYPE commands (cannot be done in transaction)

-- For now, assuming status is VARCHAR (most common in Supabase)
-- Update any existing "En proceso" to "En progreso" for consistency
UPDATE tickets 
SET status = 'En progreso' 
WHERE status = 'En proceso';

-- Add comment documenting valid status values
COMMENT ON COLUMN tickets.status IS 'Valid values: Pendiente, Asignado, En progreso, Completado, Resuelto, Rechazado';
