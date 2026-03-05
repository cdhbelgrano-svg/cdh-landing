import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { orderData } = req.body;

        if (!orderData || !orderData.items) {
            return res.status(400).json({ error: 'Faltan datos de la orden.' });
        }

        // 1. Obtener Credenciales de la BD
        const { data: configData, error: configError } = await supabase
            .from('payment_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (configError || !configData || !configData.mp_active || !configData.mp_access_token) {
            return res.status(400).json({ error: 'Mercado Pago no está configurado o está inactivo.' });
        }

        // 2. Inicializar Cliente MP
        const client = new MercadoPagoConfig({
            accessToken: configData.mp_access_token,
            options: { timeout: 5000 }
        });

        // 3. Mapear items al formato requerido por MP
        const mpItems = orderData.items.map(item => ({
            id: item.product?.id || `item_${Math.random()}`,
            title: item.product?.name || item.name || 'Hamburguesa',
            description: item.modifiersText || '',
            quantity: item.quantity,
            unit_price: Number(item.product?.price || item.price || 0),
            currency_id: 'ARS'
        }));

        // Si hay costo de envío, lo agregamos como un ítem más
        if (orderData.deliveryCost > 0) {
            mpItems.push({
                id: 'delivery_fee',
                title: 'Costo de Envío',
                description: 'Costo de entrega a domicilio',
                quantity: 1,
                unit_price: Number(orderData.deliveryCost),
                currency_id: 'ARS'
            });
        }

        // Si hay descuento, lo restamos (MP requiere que la suma de ítems dé el total, podemos enviar un item negativo o ajustar el valor)
        // Ojo: Mercado Pago a veces no saca items con valor negativo, la mejor forma es prorratear o aplicar un cupón en MP si es posible.
        // Como M.Pago no acepta unit_price negativo para Items, lo ponemos como un track de descuento y restamos al envío/items
        let totalSumaItems = mpItems.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0);

        // Forma segura si es descuento global, crear un Item compensatorio total
        // Alternativamente, si tenemos el `orderData.total` exacto final:
        let discount = 0;
        if (orderData.discountApplied) {
            const match = orderData.discountApplied.match(/-([0-9.,]+)/);
            if (match) discount = Number(match[1].replace(/\./g, '').replace(',', '.'));
        }

        // Si hay descuento, ajustamos el precio total (simplificado: enviamos un item Custom de descuento si es necesario, 
        // pero como unit_price no puede ser negativo, en Vercel solemos reducir el precio del item principal o envío).
        // Para no complicar con errores de MP, reduciremos al vuelo el total prorrateado.

        // Mejor opción para no arrastrar error de MP (total !== suma de items):
        // En vez de enviar detalle de items por separado si hay descuento complicado, 
        // a veces es más seguro mandar UNA sola línea "Pedido Completo" si hay descuentos.
        const orderTotal = Number(orderData.total);
        let finalItems = mpItems;

        if (discount > 0) {
            finalItems = [{
                id: 'cdh_order_discounted',
                title: 'Pedido La Casa de la Hamburguesa',
                description: 'Pedido Total con Descuentos aplicados',
                quantity: 1,
                unit_price: orderTotal,
                currency_id: 'ARS'
            }];
        }

        // 4. Crear la Preferencia
        const preference = new Preference(client);

        // Asumimos que la URL base es donde está hosteado
        const host = req.headers.host || 'localhost:5173';
        const protocol = host.includes('localhost') ? 'http://' : 'https://';
        const baseUrl = `${protocol}${host}`;

        const apiResponse = await preference.create({
            body: {
                payment_methods: {
                    excluded_payment_types: [
                        { id: 'ticket' } // Excluir Rapipago/PagoFácil (tardan en acreditar)
                    ],
                    installments: 1 // Forzar 1 cuota si no querés ofrecer cuotas en comida
                },
                items: finalItems,
                payer: {
                    name: orderData.customer?.name,
                    email: orderData.customer?.email
                },
                back_urls: {
                    success: `${baseUrl}/checkout/success`,
                    pending: `${baseUrl}/checkout/pending`,
                    failure: `${baseUrl}/checkout/failure`
                },
                auto_return: 'approved',
                external_reference: orderData.id // Enviamos nuestro número de orden para identificarlo después
            }
        });

        // Retornamos el init_point para que el front redirija
        return res.status(200).json({
            init_point: apiResponse.init_point,
            id: apiResponse.id
        });

    } catch (error) {
        console.error('Error generando preferencia de MercadoPago:', error);
        return res.status(500).json({ error: 'Error del servidor al procesar el pago', details: error.message });
    }
}
