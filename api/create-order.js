import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function: api/create-order.js
// Handles secure creation of an order in Fudo and Supabase
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST' });
    }

    try {
        const { orderDB, fudoPayload, email, otpCode } = req.body;

        if (!orderDB || !fudoPayload || !email || !otpCode) {
            return res.status(400).json({ error: 'Missing Data', message: 'orderDB, fudoPayload, email, and otpCode are required' });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Validar OTP
        const { data: otpData, error: otpError } = await supabase
            .from('otps')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .eq('code', otpCode)
            .single();

        if (otpError || !otpData) {
            return res.status(401).json({ error: 'Invalid OTP', message: 'El código ingresado es incorrecto.' });
        }

        if (new Date(otpData.expires_at) < new Date()) {
            return res.status(401).json({ error: 'Expired OTP', message: 'El código ha expirado. Por favor solicita uno nuevo.' });
        }

        // Borrar OTP usado
        await supabase.from('otps').delete().eq('id', otpData.id);

        // 2. Upsert Customer (CRM)
        // Buscamos si existe para sumar 1 a total_orders
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('total_orders')
            .eq('email', email.toLowerCase().trim())
            .single();

        const currentOrders = existingCustomer ? existingCustomer.total_orders : 0;

        const { error: customerError } = await supabase.from('customers').upsert({
            email: email.toLowerCase().trim(),
            name: orderDB.customer?.name || 'Cliente',
            phone: orderDB.customer?.phone || '',
            address: orderDB.delivery?.address || '',
            total_orders: currentOrders + 1,
            last_order_date: new Date().toISOString()
        });

        if (customerError) {
            console.error('API Error: Supabase Customer Upsert', customerError);
            // We don't throw here to avoid blocking the order, but we log it
        }

        // 3. Authenticate with Fudo
        const clientId = process.env.VITE_FUDO_CLIENT_ID || process.env.FUDO_CLIENT_ID;
        const clientSecret = process.env.VITE_FUDO_CLIENT_SECRET || process.env.FUDO_CLIENT_SECRET;

        let fudoToken = null;
        try {
            const authResponse = await fetch('https://integrations.fu.do/fudo/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, clientSecret })
            });

            if (!authResponse.ok) throw new Error('Falla en la auth de Fudo');
            const authData = await authResponse.json();
            fudoToken = authData.token || authData.access_token;
        } catch (authErr) {
            console.error('API Error: Fudo Auth', authErr);
            throw new Error('No se pudo autenticar con Fudo');
        }

        // 2. Send Order to Fudo
        let fudoOrderId = null;
        let fudoStatus = null;

        try {
            const fudoOrderResponse = await fetch('https://integrations.fu.do/fudo/orders', {
                method: 'POST',
                headers: {
                    'Fudo-External-App-Authorization': `Bearer ${fudoToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fudoPayload)
            });

            if (fudoOrderResponse.ok) {
                const fudoCreatedData = await fudoOrderResponse.json();
                fudoOrderId = fudoCreatedData.id || fudoCreatedData.order?.id;
                fudoStatus = 'pendiente';
            } else {
                const errData = await fudoOrderResponse.text();
                console.error('Fudo API Error al crear orden:', errData);
                // Si Fudo falla, igualmente guardamos en BD pero marcamos el error si queremos o solo no establecemos ID
            }
        } catch (orderErr) {
            console.error('API Error: Al crear order en Fudo', orderErr);
        }

        // 5. Save to Supabase

        const newOrderRecord = {
            id: orderDB.id,
            customer: orderDB.customer,
            delivery: orderDB.delivery,
            payment: orderDB.payment,
            status: orderDB.status || 'pendiente',
            total: orderDB.total,
            items: orderDB.items,
            fudo_id: fudoOrderId,
            fudo_status: fudoStatus,
            scheduled_for: orderDB.scheduled_for,
            scheduled_time_str: orderDB.scheduled_time_str,
            comments: orderDB.comments,
            created_at: new Date().toISOString()
        };

        const { error: dbError } = await supabase.from('orders').insert([newOrderRecord]);

        if (dbError) {
            console.error('Supabase Error:', dbError);
            throw new Error(`Error guardando pedido: ${dbError.message}`);
        }

        return res.status(200).json({ success: true, orderId: orderDB.id, fudoId: fudoOrderId });

    } catch (error) {
        console.error('API /create-order Global Error:', error);
        return res.status(500).json({ error: 'Server Error', message: error.message });
    }
}
