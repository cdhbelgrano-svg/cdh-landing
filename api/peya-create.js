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
        // 1. Obtener la orden de Supabase
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        if (order.delivery_mode !== 'envio') {
            return res.status(400).json({ error: 'La orden no es de envío' });
        }

        if (order.peya_order_id) {
            return res.status(400).json({ error: 'La orden ya tiene un cadete de PeYa asignado' });
        }

        // 2. Obtener la config de envíos (para lat, lng, origin address y PeYa token)
        const { data: settings, error: settingsError } = await supabase
            .from('delivery_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (settingsError || !settings || !settings.peya_token) {
            return res.status(400).json({ error: 'Falta configuración o Token de PedidosYa en el sistema' });
        }

        // 3. Obtener el cliente de la orden (para el nombre y cel)
        // La tabla orders puede tener los details dentro de un sub-JSON, asumiendo lo que mandamos en create-order
        let customerData = order.customer_info;
        if (!customerData) {
            // Hacemos query a customers si no está embebido
            if (order.customer_id) {
                const { data: c } = await supabase.from('customers').select('*').eq('id', order.customer_id).single();
                if (c) customerData = { name: c.first_name + ' ' + c.last_name, phone: c.phone, address: c.address };
            } else {
                return res.status(400).json({ error: 'No se encontraron datos del cliente para el envío' });
            }
        }

        // Validamos info mínima
        const destAddressStr = customerData?.address || order.shipping_address;
        if (!destAddressStr) return res.status(400).json({ error: 'La orden no tiene dirección de envío' });

        // Asumimos que como ya pasó por Google Maps al crear, deberíamos tener idealmente las coordenadas. 
        // Si no, la API de Courier V2 de PeYa a veces acepta solo la direccion en 'addressStreet' + 'city'. 
        // Intentaremos pasar lo posible. Para un sistema de producción es ideal guardar destLat/destLng en la tabla orders.
        // Aquí pasaremos addressStreet.

        // 4. Crear el envío en PedidosYa
        const payload = {
            referenceId: `CDH-${order.id}`,
            isTest: process.env.NODE_ENV !== 'production', // Para pruebas en desarrollo
            deliveryTime: new Date(Date.now() + 15 * 60000).toISOString(), // Ej: Pedir para dentro de 15 mins
            volume: 1, // Tamaño apróx
            weight: 1,
            items: [
                {
                    categoryId: 1, // Id genérico de PeYa (Comida)
                    value: order.total,
                    description: "Hamburguesas CDH",
                    volume: 1,
                    weight: 1
                }
            ],
            waypoints: [
                {
                    type: "PICK_UP",
                    addressStreet: settings.origin_address,
                    city: "San Carlos de Bariloche",
                    latitude: settings.origin_lat,
                    longitude: settings.origin_lng,
                    name: "La Casa de la Hamburguesa",
                    phone: "+5492944000000" // Cambiar por tu tel del local
                },
                {
                    type: "DROP_OFF",
                    addressStreet: destAddressStr,
                    city: "San Carlos de Bariloche",
                    name: customerData.name || "Cliente",
                    phone: customerData.phone || "+5492944000000"
                }
            ]
        };

        const response = await fetch('https://courier-api.pedidosya.com/v2/shippings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': settings.peya_token
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('PeYa Create Error:', data);
            return res.status(response.status).json({
                error: 'Error solicitando moto a PedidosYa',
                details: data
            });
        }

        // 5. Guardar el ID de PeYa en la orden en Supabase
        const peyaOrderId = data.id || data.shippingId || data.referenceId || "PEYA-MOCK-ID";
        const peyaTrackingUrl = data.trackingUrl || data.shareTrackingUrl || null;

        await supabase
            .from('orders')
            .update({
                peya_order_id: peyaOrderId,
                peya_status: 'CONFIRMED',
                peya_tracking_url: peyaTrackingUrl
            })
            .eq('id', orderId);

        return res.status(200).json({
            success: true,
            message: 'Motoquero solicitado con éxito',
            peyaInfo: data
        });

    } catch (error) {
        console.error('Error interno creando envío PeYa:', error);
        return res.status(500).json({ error: 'Fallo interno del servidor', details: error.message });
    }
}
