-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.store_hours (
    id int4 PRIMARY KEY DEFAULT 1,
    delivery_start_time time DEFAULT '20:00:00',
    delivery_end_time time DEFAULT '23:59:00',
    pickup_start_time time DEFAULT '19:30:00',
    pickup_end_time time DEFAULT '23:59:00',
    is_open_today boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Insertar fila base 1 si no existe
INSERT INTO public.store_hours (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Agregar scheduled_for y scheduled_time_str a orders (si no existe)
do $$
begin
  if not exists (select * from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'scheduled_for') then
    alter table public.orders add column scheduled_for timestamp with time zone;
  end if;
  
  if not exists (select * from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'scheduled_time_str') then
    alter table public.orders add column scheduled_time_str text;
  end if;
end $$;
