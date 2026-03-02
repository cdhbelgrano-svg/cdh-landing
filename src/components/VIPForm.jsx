import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, CheckCircle, User, Loader2, Mail } from 'lucide-react';

const VIPForm = () => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', phonePrefix: '+54', phoneLocal: '', email: '' });
    const [status, setStatus] = useState('idle'); // idle | submitting | success | error

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación explícita de campos obligatorios
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phoneLocal.trim() || !formData.email.trim()) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
            return;
        }

        setStatus('submitting');

        const formspreeEndpoint = "https://formspree.io/f/xlgwkgpd";

        const localNumber = formData.phoneLocal.replace(/\D/g, '');
        let finalPhone = formData.phonePrefix + localNumber;
        if (formData.phonePrefix === '+54') {
            finalPhone = '+549' + localNumber;
        }

        const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: finalPhone,
            email: formData.email
        };

        try {
            const response = await fetch(formspreeEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setStatus('success');

                // Redirigir a WhatsApp con el mensaje gatillo
                const waPhone = "5492944161917"; // Número del local
                const triggerWord = "CUPONWEB10"; // Palabra clave para la respuesta automática

                // Formato tipo "tarjeta de contacto" para facilitar el guardado
                const waMessage = `Hola! Quiero mi 10% de descuento. 🍔👇
                
*NUEVO CONTACTO VIP:*
👤 Nombre: ${formData.firstName} ${formData.lastName}
📧 Email: ${formData.email}
🎟️ Código: ${triggerWord}`;

                const encodedMessage = encodeURIComponent(waMessage);

                setTimeout(() => {
                    window.open(`https://wa.me/${waPhone}?text=${encodedMessage}`, '_blank');
                    setFormData({ firstName: '', lastName: '', phonePrefix: '+54', phoneLocal: '', email: '' });
                    setStatus('idle');
                }, 1500); // Pequeña pausa para que vean el "¡Cupón en camino!"

            } else {
                setStatus('error');
                setTimeout(() => setStatus('idle'), 5000);
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <section className="py-24 px-4 w-full bg-cdh-black relative border-y border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cdh-gold rounded-full mix-blend-screen filter blur-[100px] opacity-10"></div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-6xl font-black uppercase text-white mb-4 shadow-cdh-gold">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cdh-gold to-yellow-200">VIP</span> Access
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">Suscribite a nuestra comunidad y recibí como regalo de bienvenida un <strong>10% DE DESCUENTO</strong> para tu próxima compra online. Te enviamos el cupón directo a tu WhatsApp.</p>
                </motion.div>

                <motion.form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 max-w-md mx-auto"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Nombre *"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-full bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Apellido *"
                                required
                                className="w-full px-6 py-4 rounded-full bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <select
                            name="phonePrefix"
                            value={formData.phonePrefix}
                            onChange={handleChange}
                            className="w-[100px] px-3 py-4 rounded-full bg-[#111] border border-cdh-darkwood text-white focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer appearance-none text-center"
                        >
                            <option value="+54">🇦🇷 +54</option>
                            <option value="+598">🇺🇾 +598</option>
                            <option value="+56">🇨🇱 +56</option>
                            <option value="+55">🇧🇷 +55</option>
                            <option value="+591">🇧🇴 +591</option>
                            <option value="+595">🇵🇾 +595</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+34">🇪🇸 +34</option>
                        </select>
                        <div className="relative flex-1">
                            <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                            <input
                                type="tel"
                                name="phoneLocal"
                                value={formData.phoneLocal}
                                onChange={handleChange}
                                placeholder="Tu número *"
                                pattern="[0-9]{8,15}"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-full bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                                title="Ingresa tu número sin el prefijo de país"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email *"
                            required
                            className="w-full pl-12 pr-4 py-4 rounded-full bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'submitting' || status === 'success'}
                        className="group relative inline-flex items-center justify-center w-full px-8 py-4 mt-2 font-bold text-black bg-cdh-gold overflow-hidden rounded-full transition-all hover:scale-[1.02] disabled:opacity-80 disabled:hover:scale-100"
                    >
                        {status === 'submitting' && (
                            <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</span>
                        )}
                        {status === 'success' && (
                            <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> ¡Bienvenido a la familia!</span>
                        )}
                        {status === 'error' && (
                            <span className="flex items-center gap-2 text-red-900">Hubo un error. Intenta de nuevo.</span>
                        )}
                        {status === 'idle' && (
                            <span className="relative flex items-center gap-2 uppercase tracking-wide">Quiero mi 10% OFF <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" /></span>
                        )}
                    </button>
                </motion.form>

                <p className="text-xs text-gray-600 mt-6">* Prometemos no ser spammeros. Te enviamos el descuento (válido solo para pedidos por la web) y seguimos siendo amigos.</p>
            </div>
        </section>
    );
};

export default VIPForm;
