import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Send, FileText, CheckCircle, AlertCircle, User, Calendar, Phone, Mail, MessageSquare } from 'lucide-react';

const Jobs = () => {
    const [status, setStatus] = useState(null); // 'sending', 'success', 'error'
    const [fileName, setFileName] = useState("");

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== "application/pdf") {
                alert("Por favor, subí tu CV en formato PDF.");
                e.target.value = "";
                setFileName("");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert("El archivo es muy pesado (máximo 5MB).");
                e.target.value = "";
                setFileName("");
                return;
            }
            setFileName(file.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        const formData = new FormData(e.target);

        // Construct strict E.164 phone: prefix + (9 if AR) + number
        const prefix = formData.get('fi-sender-phone-prefix');
        const localNumber = formData.get('fi-sender-phone-local').replace(/\D/g, '');

        let finalPhone = prefix + localNumber;
        if (prefix === '+54') {
            finalPhone = '+549' + localNumber;
        }

        formData.set('fi-sender-phone', finalPhone);
        formData.delete('fi-sender-phone-prefix');
        formData.delete('fi-sender-phone-local');

        try {
            const response = await fetch("https://forminit.com/f/nuvtjaoigzj", {
                method: "POST",
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                setStatus('success');
                e.target.reset();
                setFileName("");
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <section id="trabajo" className="py-24 px-4 w-full bg-[#0a0a0a] relative overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">

                <motion.div
                    className="w-full lg:w-5/12"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-3 mb-4 text-cdh-orange">
                        <Briefcase className="w-6 h-6" />
                        <h3 className="text-sm font-bold tracking-[0.2em] uppercase">Búsqueda Activa</h3>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black uppercase text-white mb-6">
                        Trabajá con <span className="text-cdh-orange">Nosotros</span>
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        Buscamos talento con actitud, pasión por el buen servicio y ritmo para sumarse al equipo de CDH.<br /><br />
                        Buscamos mentes creativas, paladares exigentes y manos diestras en la cocina. Si compartís nuestra pasión por la perfección y querés formar parte de un equipo que desafía los límites del sabor, dejanos tus datos.
                    </p>
                </motion.div>

                <motion.div
                    className="w-full lg:w-7/12"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="bg-[#111] p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden w-full max-w-lg mx-auto lg:ml-auto">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cdh-orange rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>

                        <form
                            onSubmit={handleSubmit}
                            action="https://forminit.com/f/nuvtjaoigzj"
                            method="POST"
                            className="relative z-10 flex flex-col gap-3"
                        >
                            <input type="hidden" name="_subject" value="Nueva Postulación desde la Web CDH" />

                            {/* Row 1: Name */}
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px] pointer-events-none" />
                                <input name="fi-sender-fullName" required type="text" className="w-full pl-11 pr-4 py-3 rounded-full bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="Nombre Completo *" />
                            </div>

                            {/* Row 2: Date + Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="relative flex items-center md:col-span-5">
                                    <Calendar className="absolute left-4 text-gray-500 w-[18px] h-[18px] pointer-events-none z-10" />
                                    <input name="fi-date-nacimiento" required type="text" onFocus={(e) => (e.target.type = "date")} onBlur={(e) => { if (!e.target.value) e.target.type = "text" }} className="w-full pl-11 pr-4 py-3 rounded-full bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] appearance-none" placeholder="Fecha Nacimiento *" />
                                </div>
                                <div className="flex gap-2 md:col-span-7">
                                    <select
                                        name="fi-sender-phone-prefix"
                                        className="w-[90px] px-2 py-3 rounded-full bg-[#111] border border-cdh-darkwood text-white text-sm focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer appearance-none text-center shrink-0"
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
                                    <div className="relative flex-1 min-w-0">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px] pointer-events-none" />
                                        <input
                                            name="fi-sender-phone-local"
                                            required
                                            type="tel"
                                            pattern="[0-9]{8,15}"
                                            className="w-full pl-11 pr-4 py-3 rounded-full bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                                            placeholder="Tu número *"
                                            title="Tu número sin el prefijo país"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Email + Puesto */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="relative md:col-span-7">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px] pointer-events-none" />
                                    <input name="fi-sender-email" required type="email" className="w-full pl-11 pr-4 py-3 rounded-full bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" placeholder="tu@email.com *" />
                                </div>
                                <div className="relative flex items-center md:col-span-5">
                                    <Briefcase className="absolute left-4 text-gray-500 w-[18px] h-[18px] pointer-events-none z-10" />
                                    <select name="fi-select-puesto" defaultValue="" className="w-full pl-11 pr-4 py-3 rounded-full bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] appearance-none cursor-pointer">
                                        <option value="" disabled hidden>Puesto deseado *</option>
                                        <option value="Cocinero / Ayudante">Cocinero / Ayudante</option>
                                        <option value="Atención / Caja">Atención / Caja</option>
                                        <option value="Encargado">Encargado</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 4: Mensaje */}
                            <div className="relative">
                                <MessageSquare className="absolute left-4 top-4 text-gray-500 w-[18px] h-[18px] pointer-events-none" />
                                <textarea name="fi-text-mensaje" rows="2" className="w-full pl-11 pr-4 py-3 rounded-3xl bg-[#111] border border-cdh-darkwood text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cdh-gold focus:ring-1 focus:ring-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] resize-none" placeholder="Breve presentación (Opcional)"></textarea>
                            </div>

                            {/* Row 5: CV */}
                            <div className="relative">
                                <input
                                    name="fi-file-cv"
                                    required
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    title="Sube tu CV en PDF"
                                />
                                <div className="w-full pl-11 pr-4 py-3 rounded-full bg-[#111] border border-dashed border-cdh-darkwood text-gray-400 flex items-center justify-between group-hover:border-cdh-gold transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-cdh-gold w-[18px] h-[18px] pointer-events-none" />
                                        <span className="truncate text-sm">{fileName || "Subir CV (PDF, máx 5MB) *"}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-black bg-cdh-gold px-3 py-1 rounded-full uppercase">Explorar</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                className="group relative inline-flex items-center justify-center w-full px-8 py-3.5 mt-1 font-bold text-black bg-cdh-gold overflow-hidden rounded-full transition-all hover:scale-[1.02] disabled:opacity-80 disabled:hover:scale-100 shadow-xl"
                            >
                                {status === 'sending' ? (
                                    <span className="flex items-center gap-2 text-sm uppercase tracking-wide">Enviando...</span>
                                ) : status === 'success' ? (
                                    <span className="flex items-center gap-2 text-sm uppercase tracking-wide"><CheckCircle className="w-[18px] h-[18px]" /> ¡Postulación Enviada!</span>
                                ) : status === 'error' ? (
                                    <span className="flex items-center gap-2 text-sm uppercase tracking-wide text-red-900"><AlertCircle className="w-[18px] h-[18px]" /> Error. Reintentar</span>
                                ) : (
                                    <span className="flex items-center gap-2 text-sm uppercase tracking-wide">Enviar <Send className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" /></span>
                                )}
                            </button>

                            {status === 'success' && (
                                <p className="text-center text-green-500 text-xs mt-1 font-medium tracking-wide">
                                    Revisá tu mail para confirmar si es tu primer envío.
                                </p>
                            )}
                        </form>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default Jobs;

