import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Send, FileText, CheckCircle, AlertCircle } from 'lucide-react';

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
                        Buscamos talento con actitud, pasión por el buen servicio y ritmo para sumarse a la crew de CDH.<br /><br />
                        Si creés que tenés lo necesario para ser parte de la mejor smash de la ciudad, dejanos tus datos y nos pondremos en contacto.
                    </p>
                </motion.div>

                <motion.div
                    className="w-full lg:w-7/12"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="bg-[#111] p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden w-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cdh-orange rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>

                        <form
                            onSubmit={handleSubmit}
                            action="https://forminit.com/f/nuvtjaoigzj"
                            method="POST"
                            className="relative z-10"
                        >
                            <input type="hidden" name="_subject" value="Nueva Postulación desde la Web CDH" />

                            {/* Row 1: Name (Full) */}
                            <div className="mb-3">
                                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Nombre Completo *</label>
                                <input name="fi-sender-fullName" required type="text" className="w-full px-3 py-2 rounded-lg bg-black border border-white/10 text-white focus:outline-none focus:border-cdh-orange transition-colors text-xs" placeholder="Tu nombre" />
                            </div>

                            {/* Row 2: Date (4) + Phone (8) */}
                            <div className="grid grid-cols-12 gap-3 mb-3">
                                <div className="col-span-12 md:col-span-4">
                                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Fecha Nac. *</label>
                                    <input name="fi-date-nacimiento" required type="date" className="w-full px-3 py-2 rounded-lg bg-black border border-white/10 text-white focus:outline-none focus:border-cdh-orange transition-colors text-xs h-[38px]" />
                                </div>
                                <div className="col-span-12 md:col-span-8">
                                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Teléfono *</label>
                                    <div className="flex gap-1 h-[38px]">
                                        <select
                                            name="fi-sender-phone-prefix"
                                            className="w-[80px] h-full px-2 rounded-lg bg-black border border-white/10 text-white focus:outline-none focus:border-cdh-orange transition-colors text-[10px] font-bold cursor-pointer appearance-none"
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
                                        <input
                                            name="fi-sender-phone-local"
                                            required
                                            type="tel"
                                            pattern="[0-9]{10,15}"
                                            className="flex-1 h-full px-3 rounded-lg bg-black border border-white/10 text-white focus:outline-none focus:border-cdh-orange transition-colors text-xs"
                                            placeholder="Número local"
                                            title="Tu número sin el prefijo país"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Email (8) + Puesto (4) */}
                            <div className="grid grid-cols-12 gap-3 mb-3">
                                <div className="col-span-12 md:col-span-8">
                                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Email *</label>
                                    <input name="fi-sender-email" required type="email" className="w-full px-3 py-2 rounded-lg bg-black border border-white/10 text-white focus:outline-none focus:border-cdh-orange transition-colors text-xs h-[38px]" placeholder="tu@email.com" />
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Puesto *</label>
                                    <select name="fi-select-puesto" className="w-full px-3 py-2 rounded-lg bg-black border border-white/10 text-white focus:outline-none focus:border-cdh-orange transition-colors appearance-none text-xs cursor-pointer h-[38px]">
                                        <option>Cocinero / Ayudante</option>
                                        <option>Atención / Caja</option>
                                        <option>Encargado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">Mensaje (Opcional)</label>
                                <textarea name="fi-text-mensaje" rows="2" className="w-full px-3 py-2 rounded-lg bg-black border border-white/10 text-white focus:outline-none focus:border-cdh-orange transition-colors resize-none text-xs" placeholder="Breve presentación..."></textarea>
                            </div>

                            <div className="mb-4">
                                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">CV (PDF, máx 5MB) *</label>
                                <div className="relative">
                                    <input
                                        name="fi-file-cv"
                                        required
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    />
                                    <div className="w-full px-3 py-2 rounded-lg bg-black border border-dashed border-white/20 text-gray-400 flex items-center justify-between group-hover:border-cdh-orange transition-colors">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="w-3.5 h-3.5 shrink-0 text-cdh-orange" />
                                            <span className="text-[10px] truncate">{fileName || "Elegir PDF..."}</span>
                                        </div>
                                        <span className="text-[9px] font-bold bg-white/5 px-2 py-0.5 rounded uppercase">Subir</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                className={`w-full group relative flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-white rounded-lg transition-all shadow-xl
                                    ${status === 'success' ? 'bg-green-600' :
                                        status === 'error' ? 'bg-red-600' :
                                            'bg-cdh-orange hover:bg-cdh-orange/90 active:scale-95'}`}
                            >
                                {status === 'sending' ? (
                                    <span className="animate-pulse text-xs uppercase tracking-widest">Enviando...</span>
                                ) : status === 'success' ? (
                                    <><CheckCircle className="w-4 h-4" /> <span className="text-xs uppercase">¡Enviado!</span></>
                                ) : status === 'error' ? (
                                    <><AlertCircle className="w-4 h-4" /> <span className="text-xs uppercase">Error. Reintentar</span></>
                                ) : (
                                    <><span className="text-xs uppercase tracking-widest">Enviar Postulación</span> <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>

                            {status === 'success' && (
                                <p className="text-center text-green-500 text-[9px] mt-2 font-medium uppercase tracking-tighter">
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

