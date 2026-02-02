-- Create providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    phone TEXT NOT NULL,
    specialty TEXT NOT NULL,
    department TEXT NOT NULL,
    municipality TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_specialty CHECK (specialty IN ('Plomería', 'Eléctrico', 'Electrodomésticos', 'Cerrajería', 'Otros'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_providers_location_specialty 
ON public.providers(department, municipality, specialty, is_active);

-- Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active providers
CREATE POLICY "Anyone can view active providers"
ON public.providers
FOR SELECT
USING (is_active = true);

-- Policy: Admins can insert providers
CREATE POLICY "Admins can insert providers"
ON public.providers
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'ADMIN'
    )
);

-- Policy: Admins can update providers
CREATE POLICY "Admins can update providers"
ON public.providers
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'ADMIN'
    )
);

-- Policy: Admins can delete providers
CREATE POLICY "Admins can delete providers"
ON public.providers
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'ADMIN'
    )
);

-- Add column to tickets table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'assigned_provider_id'
    ) THEN
        ALTER TABLE public.tickets 
        ADD COLUMN assigned_provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_tickets_assigned_provider 
        ON public.tickets(assigned_provider_id);
    END IF;
END $$;

-- Add column for external providers if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'external_providers'
    ) THEN
        ALTER TABLE public.tickets 
        ADD COLUMN external_providers JSONB;
    END IF;
END $$;
