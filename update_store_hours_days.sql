-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.store_hours
ADD COLUMN IF NOT EXISTS open_days jsonb DEFAULT '[0, 1, 2, 3, 4, 5, 6]'::jsonb;
