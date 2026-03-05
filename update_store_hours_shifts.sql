-- Ejecutar en el SQL Editor de Supabase
ALTER TABLE public.store_hours
ADD COLUMN IF NOT EXISTS shifts jsonb DEFAULT '[]'::jsonb;

-- Migración de datos existentes a formato de 2 turnos por defecto (Almuerzo y Cena)
-- Si ya tenían horarios, esto los va a reescribir con un ejemplo de dos turnos, podés modificarlo luego en el panel
UPDATE public.store_hours
SET shifts = '[
  {
    "id": 1,
    "name": "Almuerzo",
    "open_days": [0, 1, 2, 3, 4, 5, 6],
    "delivery_start_time": "12:00:00",
    "delivery_end_time": "15:00:00",
    "pickup_start_time": "11:30:00",
    "pickup_end_time": "15:00:00"
  },
  {
    "id": 2,
    "name": "Cena",
    "open_days": [0, 1, 2, 3, 4, 5, 6],
    "delivery_start_time": "20:00:00",
    "delivery_end_time": "23:59:00",
    "pickup_start_time": "19:30:00",
    "pickup_end_time": "23:59:00"
  }
]'::jsonb
WHERE id = 1;

-- Ya no necesitamos las columnas viejas, vamos a dejarlas por retrocompatibilidad por ahora
-- o podríamos borrarlas. En este caso no las borramos por seguridad.
