-- update_peya_settings.sql
-- Ejecutar en Supabase SQL Editor para añadir configuración de PedidosYa en tabla de envíos

ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS peya_active boolean NOT NULL DEFAULT false;
ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS peya_token text;
