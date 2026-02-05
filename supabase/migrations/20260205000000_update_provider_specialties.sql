-- Update providers table to support all specialties
-- Drop old constraint
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS valid_specialty;

-- Add new constraint with all specialties
ALTER TABLE public.providers ADD CONSTRAINT valid_specialty CHECK (specialty IN (
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
