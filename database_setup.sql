-- Tabla para almacenar clientes (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    total_orders INTEGER DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS genérico
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.customers FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile." ON public.customers FOR UPDATE USING (true);

-- Tabla para almacenar códigos OTP temporales
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS otps_email_idx ON public.otps(email);

-- Habilitar RLS genérico
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public otps are viewable by everyone." ON public.otps FOR SELECT USING (true);
CREATE POLICY "Users can insert otps." ON public.otps FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete otps." ON public.otps FOR DELETE USING (true);
