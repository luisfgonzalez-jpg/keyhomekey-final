-- Fix providers specialty constraint to match frontend specialties
-- Drop the old constraint
ALTER TABLE public.providers 
DROP CONSTRAINT IF EXISTS valid_specialty;

-- Add new constraint with all 14 specialties
ALTER TABLE public.providers 
ADD CONSTRAINT valid_specialty CHECK (specialty IN (
  'Plomería',
  'Eléctrico',
  'Carpintería',
  'Pintura',
  'Cerrajería',
  'Jardinería',
  'Limpieza',
  'Aire Acondicionado',
  'Gas',
  'Albañilería',
  'Herrería',
  'Vidriería',
  'Electrodomésticos',
  'Otros'
));

-- Add a comment to track when this constraint was updated
COMMENT ON CONSTRAINT valid_specialty ON public.providers IS 'Updated to include all 14 specialties (2026-02-22)';
