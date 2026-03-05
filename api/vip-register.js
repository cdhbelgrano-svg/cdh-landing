import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST' });
    }

    try {
        const { firstName, lastName, phone, email } = req.body;

        if (!firstName || !lastName || !phone || !email) {
            return res.status(400).json({ error: 'Faltan datos', message: 'Todos los campos son obligatorios.' });
        }

        // Validate email does not contain '+'
        if (email.includes('+')) {
            return res.status(400).json({ error: 'Email inválido', message: 'No se permiten correos con el símbolo "+".' });
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const resendApiKey = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
        const resend = new Resend(resendApiKey);

        const cleanEmail = email.toLowerCase().trim();

        // 1. Check if the email is already registered
        const { data: existingUser, error: checkError } = await supabase
            .from('vip_customers')
            .select('id')
            .eq('email', cleanEmail)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Email duplicado', message: 'Este correo electrónico ya está registrado.' });
        }

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Error verificando usuario:', checkError);
            throw new Error('Error al verificar el usuario en la base de datos.');
        }

        // 2. Insert into vip_customers
        const { error: insertError } = await supabase
            .from('vip_customers')
            .insert([{
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone: phone.trim(),
                email: cleanEmail
            }]);

        if (insertError) {
            console.error('Error insertando VIP:', insertError);
            throw new Error('No se pudo registrar el usuario. Intentá de nuevo.');
        }

        // 3. Generate unique promo code
        const namePart = firstName.trim().toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5);
        const phonePart = phone.replace(/\D/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
        const promoCodeString = `${namePart}${phonePart}_10%OFF`;

        // Expires in 30 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // 4. Insert Promo Code
        const { error: promoError } = await supabase
            .from('promos_codes')
            .insert([{
                code: promoCodeString,
                type: 'percentage',
                value: 10,
                is_active: true,
                valid_from: new Date().toISOString(),
                valid_until: expiresAt.toISOString(),
                is_single_use: true,
                usage_count: 0,
                email_restriction: cleanEmail
            }]);

        if (promoError) {
            console.error('Error creando promo code:', promoError);
            // Even if promo fails to save, we shouldn't fully crash without noticing, but let's throw.
            throw new Error('Error al generar el cupón de descuento.');
        }

        // 5. Send Resend Email
        try {
            const { error: emailError } = await resend.emails.send({
                from: 'La Casa de la Hamburguesa <onboarding@resend.dev>',
                to: [cleanEmail],
                subject: 'Tu Cupón VIP de 10% OFF 🍔',
                html: `
                    <div style="font-family: Arial, sans-serif; background-color: #111; color: white; padding: 40px; text-align: center; border-radius: 10px;">
                        <h1 style="color: #f26513; text-transform: uppercase;">¡Bienvenido/a a la familia, ${firstName}!</h1>
                        <p style="font-size: 16px; color: #ccc;">Gracias por registrarte en La Casa de la Hamburguesa.</p>
                        <p style="font-size: 16px; color: #ccc;">Como regalo de bienvenida, acá tenés tu código de un solo uso para obtener <strong>10% de descuento</strong> en tu próxima compra por la web:</p>
                        
                        <div style="background-color: #222; border: 2px dashed #f26513; padding: 20px; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 30px auto; width: fit-content; border-radius: 8px; color: #f26513;">
                            ${promoCodeString}
                        </div>
                        
                        <p style="font-size: 14px; color: #888; margin-top: 30px;">
                            <strong>Importante:</strong><br>
                            Este cupón es válido por 30 días, se puede usar solo una vez, y <strong>solo es válido si hacés el pedido con este mismo correo electrónico</strong> (${cleanEmail}).
                        </p>
                        <p style="font-size: 14px; color: #888;">¡Exclusivo en pedidos web!</p>
                    </div>
                `
            });

            if (emailError) {
                console.error('Error enviando email con Resend:', emailError);
                // We don't throw here because they are saved, but we return an alert.
                return res.status(200).json({ success: true, message: 'Usuario registrado, pero hubo un error enviando el email.', promoCode: promoCodeString });
            }

            return res.status(200).json({ success: true, message: '¡Registro exitoso! Cupón enviado por email.' });

        } catch (emailErr) {
            console.error('API Error: Resend send', emailErr);
            return res.status(200).json({ success: true, message: 'Usuario registrado. No se pudo enviar el correo, pero este es tu código: ' + promoCodeString });
        }

    } catch (error) {
        console.error('API /vip-register Global Error:', error);
        return res.status(500).json({ error: 'Server Error', message: error.message });
    }
}
