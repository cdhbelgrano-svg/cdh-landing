-- MASTER DATABASE SETUP FOR LA CASA DE LA HAMBURGUESA
-- Run this script in Supabase SQL Editor to set up the entire database from scratch or update existing tables.

-----------------------------------------------------------
-- 1. EXTENSIONS
-----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------------------
-- 2. TABLES
-----------------------------------------------------------

-- 2.1. Store Hours & Shifts
CREATE TABLE IF NOT EXISTS public.store_hours (
    id int4 PRIMARY KEY DEFAULT 1,
    delivery_start_time time DEFAULT '20:00:00',
    delivery_end_time time DEFAULT '23:59:00',
    pickup_start_time time DEFAULT '19:30:00',
    pickup_end_time time DEFAULT '23:59:00',
    is_open_today boolean DEFAULT true,
    open_days jsonb DEFAULT '[0, 1, 2, 3, 4, 5, 6]'::jsonb,
    shifts jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2.2. Delivery Settings
CREATE TABLE IF NOT EXISTS public.delivery_settings (
    id integer PRIMARY KEY DEFAULT 1,
    base_price integer NOT NULL DEFAULT 5000,
    price_per_km integer NOT NULL DEFAULT 1000,
    max_distance_km integer NOT NULL DEFAULT 10,
    is_active boolean NOT NULL DEFAULT true,
    origin_address text DEFAULT '24 de Septiembre 210, San Carlos de Bariloche, Río Negro, Argentina',
    origin_lat float8 DEFAULT -41.1334722,
    origin_lng float8 DEFAULT -71.3102778,
    peya_active boolean DEFAULT false,
    peya_token text DEFAULT '',
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2.3. Payment Settings
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id int4 PRIMARY KEY DEFAULT 1,
    mp_active boolean DEFAULT false,
    mp_public_key text DEFAULT '',
    mp_access_token text DEFAULT '',
    pickup_cash_active boolean DEFAULT true,
    pickup_mp_active boolean DEFAULT true,
    delivery_cash_active boolean DEFAULT true,
    delivery_mp_active boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2.4. Customers (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    total_orders INTEGER DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5. OTPs (Security)
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 2.6. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- ORD-XXXX
    customer JSONB,
    delivery JSONB,
    payment TEXT,
    status TEXT DEFAULT 'pendiente',
    total NUMERIC,
    items JSONB,
    fudo_id TEXT,
    fudo_status TEXT,
    peya_order_id TEXT,
    peya_status TEXT,
    peya_tracking_url TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    scheduled_time_str TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7. Promotions: Discount Codes
CREATE TABLE IF NOT EXISTS public.promos_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- percentage / fixed
    value NUMERIC NOT NULL,
    applicable_categories JSONB DEFAULT '[]'::jsonb,
    applicable_products JSONB DEFAULT '[]'::jsonb,
    applicable_delivery JSONB DEFAULT '[]'::jsonb,
    applicable_payment JSONB DEFAULT '[]'::jsonb,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_single_use BOOLEAN DEFAULT false,
    email_restriction TEXT,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.8. Promotions: Auto Discounts
CREATE TABLE IF NOT EXISTS public.promos_auto (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    internal_name TEXT NOT NULL,
    type TEXT NOT NULL, -- percentage / fixed
    value NUMERIC NOT NULL,
    applicable_categories JSONB DEFAULT '[]'::jsonb,
    applicable_products JSONB DEFAULT '[]'::jsonb,
    applicable_delivery JSONB DEFAULT '[]'::jsonb,
    applicable_payment JSONB DEFAULT '[]'::jsonb,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.9. Promotions: Banners
CREATE TABLE IF NOT EXISTS public.promos_banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id TEXT,
    product_name TEXT,
    banner_name TEXT,
    image_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------------
-- 3. INITIAL DATA (SINGULAR ROWS)
-----------------------------------------------------------
INSERT INTO public.store_hours (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.delivery_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-----------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-----------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos_banners ENABLE ROW LEVEL SECURITY;

-- Setup simple global policies for public/anon access
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Global Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Global Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-----------------------------------------------------------
-- 5. STORAGE SETUP
-----------------------------------------------------------

-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'banners'
CREATE POLICY "Public Read Banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admin Upload Banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');
CREATE POLICY "Admin Update Banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners');
CREATE POLICY "Admin Delete Banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners');

-----------------------------------------------------------
-- 6. INDEXES
-----------------------------------------------------------
CREATE INDEX IF NOT EXISTS otps_email_idx ON public.otps(email);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS promos_codes_code_idx ON public.promos_codes(code);
