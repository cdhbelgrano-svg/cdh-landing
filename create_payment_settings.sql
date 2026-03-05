-- Ejecutar en SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS public.payment_settings (
    id int4 PRIMARY KEY DEFAULT 1,
    mp_active boolean DEFAULT false,
    mp_public_key text DEFAULT '',
    mp_access_token text DEFAULT '',
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Insertar fila base 1 si no existe
INSERT INTO public.payment_settings (id, mp_active, mp_public_key, mp_access_token)
VALUES (1, false, '', '')
ON CONFLICT (id) DO NOTHING;

-- Dar permisos anónimos temporales para lectura/escritura (o usar RLS si está configurado en el proyecto)
-- Si no usás RLS en las otras tablas, esto no es necesario.
-- ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all" ON public.payment_settings FOR ALL USING (true);
