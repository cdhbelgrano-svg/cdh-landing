-- delivery_setup.sql
-- Ejecutá este script en tu Supabase SQL Editor para crear la configuración de envíos

CREATE TABLE IF NOT EXISTS public.delivery_settings (
    id integer PRIMARY KEY DEFAULT 1,
    base_price integer NOT NULL DEFAULT 5000,
    price_per_km integer NOT NULL DEFAULT 1000,
    max_distance_km integer NOT NULL DEFAULT 10,
    is_active boolean NOT NULL DEFAULT true
);

-- Habilitar RLS
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

-- Crear políticas (lectura pública, escritura solo para el admin/anónimo en este caso para MVP, luego podés restringir)
CREATE POLICY "Enable read access for all users" ON public.delivery_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON public.delivery_settings
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON public.delivery_settings
    FOR INSERT WITH CHECK (true);

-- Insertar valores por defecto para que no esté vacía
INSERT INTO public.delivery_settings (id, base_price, price_per_km, max_distance_km, is_active)
VALUES (1, 5000, 1000, 10, true)
ON CONFLICT (id) DO NOTHING;
