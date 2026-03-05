-- Agregar columnas de reglas de pago a la tabla existente
ALTER TABLE public.payment_settings
ADD COLUMN pickup_cash_active boolean DEFAULT true,
ADD COLUMN pickup_mp_active boolean DEFAULT true,
ADD COLUMN delivery_cash_active boolean DEFAULT true,
ADD COLUMN delivery_mp_active boolean DEFAULT true;

-- Forzar valores iniciales por defecto en la fila existente (id = 1) si están en null
UPDATE public.payment_settings
SET pickup_cash_active = true,
    pickup_mp_active = true,
    delivery_cash_active = true,
    delivery_mp_active = true
WHERE id = 1;
