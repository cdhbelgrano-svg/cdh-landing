import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ error: 'Falta orderId' });
    }

    try {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order || !order.peya_order_id) {
            return res.status(404).json({ error: 'Orden no encontrada o no tiene envío de PeYa asignado' });
        }

        const { data: settings, error: settingsError } = await supabase
            .from('delivery_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (settingsError || !settings || !settings.peya_token) {
            return res.status(400).json({ error: 'Falta token de PeYa' });
        }

        // Ejecutamos la cancelación en PeYa Courier API
        // Usualmente: POST /v2/shippings/{referenceId}/cancel
        const peyaId = order.peya_order_id;

        const response = await fetch(`https://courier-api.pedidosya.com/v2/shippings/${peyaId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': settings.peya_token
            }
        });

        const data = response.status === 204 ? {} : await response.json().catch(() => ({}));

        if (!response.ok && response.status !== 204) {
            console.error('PeYa Cancel Error:', data);
            return res.status(response.status).json({
                error: 'Error cancelando en PedidosYa',
                details: data
            });
        }

        // Limpiamos el ID en Supabase
        await supabase
            .from('orders')
            .update({
                peya_order_id: null,
                peya_status: 'CANCELLED',
                peya_tracking_url: null
            })
            .eq('id', orderId);

        return res.status(200).json({ success: true, message: 'Envío de PedidosYa Cancelado exitosamente' });

    } catch (error) {
        console.error('Error cancelando envío PeYa:', error);
        return res.status(500).json({ error: 'Fallo interno', details: error.message });
    }
}
