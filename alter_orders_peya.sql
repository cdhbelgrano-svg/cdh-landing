-- Ejecutar en Supabase para añadir columnas a orders para soportar PedidosYa Logistics
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS peya_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS peya_status text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS peya_tracking_url text;
