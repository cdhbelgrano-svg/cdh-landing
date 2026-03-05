-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla base
CREATE TABLE IF NOT EXISTS public.store_hours (
    id int4 PRIMARY KEY DEFAULT 1,
    delivery_start_time time DEFAULT '20:00:00',
    delivery_end_time time DEFAULT '23:59:00',
    pickup_start_time time DEFAULT '19:30:00',
    pickup_end_time time DEFAULT '23:59:00',
    is_open_today boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Insertar fila inicial
INSERT INTO public.store_hours (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 3. Agregar los campos nuevos necesarios para la funcionalidad actual
ALTER TABLE public.store_hours
ADD COLUMN IF NOT EXISTS open_days jsonb DEFAULT '[0, 1, 2, 3, 4, 5, 6]'::jsonb;

ALTER TABLE public.store_hours
ADD COLUMN IF NOT EXISTS shifts jsonb DEFAULT '[]'::jsonb;

-- 4. Agregar columnas a orders (si no existen) para los horarios programados
do $$
begin
  if not exists (select * from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'scheduled_for') then
    alter table public.orders add column scheduled_for timestamp with time zone;
  end if;
  
  if not exists (select * from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'scheduled_time_str') then
    alter table public.orders add column scheduled_time_str text;
  end if;
end $$;
