// Vercel Serverless Function: api/admin-login.js
// Handles basic admin authentication by hiding the password on the server

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'No credentials provided' });
        }

        // Leer credenciales desde variables de entorno. 
        // Si no existen, usa un fallback seguro genérico mientras el admin las configure.
        const validUser = process.env.VITE_ADMIN_USER || 'admin';
        const validPass = process.env.VITE_ADMIN_PASS || 'cdh2026bariloche';

        if (username === validUser && password === validPass) {
            // Emite un token simple de sesión (se asume que la DB ya filtra o es MVP)
            return res.status(200).json({ success: true, token: 'cdh-admin-authenticated' });
        }

        return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });

    } catch (error) {
        console.error('API /admin-login Global Error:', error);
        return res.status(500).json({ error: 'Server Error', message: error.message });
    }
}
