import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cdhLogo from '../../assets/ico/CDH.png';
import { Lock } from 'lucide-react';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Check if already logged in
    useEffect(() => {
        if (localStorage.getItem('admin_token') === 'true') {
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('admin_token', 'true');
                navigate('/admin');
            } else {
                setError(data.message || 'Usuario o contraseña incorrectos.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Error de conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cdh-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cdh-orange to-transparent"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-cdh-orange/20 blur-[80px] rounded-full"></div>

                <div className="flex flex-col items-center mb-8 relative z-10">
                    <div className="w-20 h-20 rounded-full border border-white/10 bg-black/50 p-1 mb-4 shadow-lg ring-1 ring-white/5">
                        <img src={cdhLogo} alt="Logo CDH" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-wider text-center flex items-center gap-2">
                        <Lock className="text-cdh-orange" size={20} />
                        Acceso Admin
                    </h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" htmlFor="username">Usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cdh-orange transition-colors"
                            placeholder="Ingrese su usuario"
                            autoComplete="username"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cdh-orange transition-colors"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cdh-orange hover:bg-orange-600 disabled:opacity-50 text-white font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(242,101,19,0.3)] mt-4"
                    >
                        {isLoading ? 'Autenticando...' : 'Ingresar al Panel'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-600">
                    La Casa de la Hamburguesa © 2026<br />
                    San Carlos de Bariloche
                </div>
            </div>
        </div>
    );
}

export default Login;
