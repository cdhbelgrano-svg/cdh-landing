import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Vercel Serverless Function: api/send-otp.js
// Genera un código OTP de 6 dígitos, lo guarda en Supabase, y lo envía por correo vía Resend

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST' });
    }

    try {
        const { email, customerName } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing Data', message: 'Email is required' });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const resendApiKey = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
        const resend = new Resend(resendApiKey);

        // 1. Generar código OTP (6 dígitos numéricos)
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Expira en 10 minutos
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // 2. Guardar OTP en base de datos
        const { error: dbError } = await supabase.from('otps').insert([{
            email: email.toLowerCase().trim(),
            code: code,
            expires_at: expiresAt.toISOString()
        }]);

        if (dbError) {
            console.error('Supabase Error guardando OTP:', dbError);
            throw new Error('No se pudo generar el código temporal.');
        }

        // 3. Enviar correo usando Resend
        // Mientras el dominio no esté verificado en Resend, el "from" debe ser onboarding@resend.dev
        // y solo llegará al correo asociado a la cuenta de Resend (modo prueba).
        const nameDisplay = customerName ? customerName.split(' ')[0] : 'Cliente';

        try {
            const { data, error } = await resend.emails.send({
                from: 'La Casa de la Hamburguesa <onboarding@resend.dev>',
                to: [email.toLowerCase().trim()],
                subject: 'Tu código de verificación para comprar',
                html: `
                    <div style="font-family: Arial, sans-serif; background-color: #111; color: white; padding: 40px; text-align: center; border-radius: 10px;">
                        <h1 style="color: #f26513; text-transform: uppercase;">La Casa de la Hamburguesa</h1>
                        <p style="font-size: 16px; color: #ccc;">Hola ${nameDisplay}, usa el siguiente código para confirmar tu pedido:</p>
                        <div style="background-color: #222; border: 2px dashed #f26513; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px auto; width: fit-content; border-radius: 8px;">
                            ${code}
                        </div>
                        <p style="font-size: 14px; color: #888;">Este código expira en 10 minutos. Si no fuiste tú, por favor ignora este correo.</p>
                    </div>
                `
            });

            if (error) {
                console.error('Error enviando email con Resend:', error);
                throw new Error('Fallo la conexión con el servidor de correos.');
            }

            return res.status(200).json({ success: true, message: 'Código enviado correctamente' });

        } catch (emailErr) {
            console.error('API Error: Resend send', emailErr);
            throw new Error('No se pudo enviar el correo.');
        }

    } catch (error) {
        console.error('API /send-otp Global Error:', error);
        return res.status(500).json({ error: 'Server Error', message: error.message });
    }
}
