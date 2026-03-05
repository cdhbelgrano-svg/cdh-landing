import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Vercel Serverless Function: api/fudo-webhook.js
// Handles incoming webhooks from Fudo to update order status in Supabase
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST' });
    }

    try {
        const payload = req.body;
        console.log("Webhook payload received from Fudo:", JSON.stringify(payload));

        // Basic payload validation. Fudo might send { event: 'order.updated', order: { id: ..., status: ... } }
        // Adjust the parsing based on actual Fudo webhook structure.
        const fudoOrderId = payload?.order?.id || payload?.id;
        const fudoStatus = payload?.order?.status || payload?.status;

        if (!fudoOrderId || !fudoStatus) {
            console.error("Payload from Fudo is missing ID or Status", payload);
            return res.status(400).json({ error: 'Bad Request', message: 'Missing order ID or status in payload' });
        }

        // Map Fudo status to internal status
        let internalStatus = 'pendiente';
        const fStatus = fudoStatus.toLowerCase();

        if (fStatus === 'preparation' || fStatus === 'cooking' || fStatus === 'accepted') {
            internalStatus = 'preparacion';
        } else if (fStatus === 'ready' || fStatus === 'done' || fStatus === 'dispatched') {
            internalStatus = 'listo';
        } else if (fStatus === 'closed' || fStatus === 'delivered' || fStatus === 'paid') {
            internalStatus = 'entregado';
        } else if (fStatus === 'canceled' || fStatus === 'rejected') {
            internalStatus = 'cancelado';
        } else {
            internalStatus = fStatus; // Fallback
        }

        // Update Supabase
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const fudoIdStr = typeof fudoOrderId === 'number' ? fudoOrderId.toString() : fudoOrderId;

        // 1. Fetch current order to see if status changed and get customer info
        const { data: orderData, error: fetchError } = await supabase
            .from('orders')
            .select('customer, status, id')
            .eq('fudo_id', fudoIdStr)
            .single();

        if (fetchError || !orderData) {
            console.error('Order not found for Fudo ID:', fudoIdStr);
        }

        // 2. Update status in Database
        const { error: dbError } = await supabase
            .from('orders')
            .update({
                status: internalStatus,
                fudo_status: fudoStatus
            })
            .eq('fudo_id', fudoIdStr);

        if (dbError) {
            console.error('Supabase Error updating from webhook:', dbError);
            throw new Error(`Error actualizando pedido: ${dbError.message}`);
        }

        // 3. Send email notification if status changed to something important
        if (orderData && orderData.status !== internalStatus && orderData.customer?.email) {
            const customerEmail = orderData.customer.email;
            const customerName = orderData.customer.name || 'Cliente';
            const orderId = orderData.id;

            let statusMessage = '';
            let statusEmoji = '';
            if (internalStatus === 'preparacion') {
                statusMessage = '¡Tu pedido ya está en preparación en la cocina! 🍳';
                statusEmoji = '🍔';
            } else if (internalStatus === 'listo') {
                statusMessage = '¡Tu pedido está listo! Ya puedes pasar a retirarlo o está en camino si pediste delivery. 🛵';
                statusEmoji = '✅';
            } else if (internalStatus === 'entregado') {
                statusMessage = '¡Tu pedido ha sido marcado como entregado! Esperamos que lo disfrutes mucho. 🎉';
                statusEmoji = '🍽️';
            } else if (internalStatus === 'cancelado') {
                statusMessage = 'Lamentablemente tu pedido ha sido cancelado. Contáctanos por WhatsApp si hubo un error. ❌';
                statusEmoji = '😔';
            }

            if (statusMessage) {
                const resendApiKey = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
                const resend = new Resend(resendApiKey);

                try {
                    await resend.emails.send({
                        from: 'La Casa de la Hamburguesa <onboarding@resend.dev>', // Usar dominio de prueba de Resend
                        to: [customerEmail],
                        subject: `Actualización de tu pedido #${orderId} ${statusEmoji}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; background-color: #111; color: white; padding: 40px; text-align: center; border-radius: 10px;">
                                <h1 style="color: #f26513; text-transform: uppercase;">La Casa de la Hamburguesa</h1>
                                <p style="font-size: 18px; color: #fff;">Hola ${customerName},</p>
                                <div style="background-color: #222; border: 1px solid #333; padding: 20px; font-size: 16px; margin: 20px auto; width: fit-content; border-radius: 8px;">
                                    ${statusMessage}
                                </div>
                                <p style="font-size: 14px; color: #888;">Orden #${orderId}</p>
                            </div>
                        `
                    });
                    console.log(`Email de estado ${internalStatus} enviado a ${customerEmail}`);
                } catch (emailErr) {
                    console.error('Error enviando email de estado:', emailErr);
                }
            }
        }

        // Fudo expects 200 OK
        return res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error) {
        console.error('API /fudo-webhook Global Error:', error);
        return res.status(500).json({ error: 'Server Error', message: error.message });
    }
}
