-- 1. Habilitar RLS en las tablas de promociones (si no están habilitadas)
ALTER TABLE public.promos_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos_auto ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas para permitir todo al rol 'anon' (Dashboard Admin)
-- Nota: En un entorno real, esto se restringiría con autenticación.
CREATE POLICY "Permitir todo a anon en promos_banners" ON public.promos_banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon en promos_codes" ON public.promos_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a anon en promos_auto" ON public.promos_auto FOR ALL USING (true) WITH CHECK (true);

-- 3. Configurar Storage para Banners
-- Crear el bucket 'banners' si no existe (ya debería existir pero por seguridad)
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Iniciar políticas de Storage para el bucket 'banners'
-- Permitir lectura pública
CREATE POLICY "Lectura pública de banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Permitir subida/edición (INSERT, UPDATE, DELETE) para anon
CREATE POLICY "Subida libre de banners para anon"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Edición libre de banners para anon"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners');

CREATE POLICY "Borrado libre de banners para anon"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners');
