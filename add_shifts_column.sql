-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.store_hours
ADD COLUMN IF NOT EXISTS shifts jsonb DEFAULT '[]'::jsonb;
