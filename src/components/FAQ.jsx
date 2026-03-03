import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Car, WheatOff, Clock, Map as MapIcon, Phone, Mail, ExternalLink, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import pedidosYaIco from '../assets/ico/pedidosya.ico';
import rappiIco from '../assets/ico/Rappi.ico';

const FAQ = () => {
    const [placeData, setPlaceData] = useState({
        isOpen: null,
        openingHours: [],
        address: "24 de Septiembre 210, Bariloche",
        phone: "+54 294 416-9171",
        loading: true
    });
    const [showAllHours, setShowAllHours] = useState(false);

    useEffect(() => {
        const fetchPlaceDetails = async () => {
            try {
                const placeId = 'ChIJw6TZZxJ7GpYR_nKUxBKBvE0';
                const apiKey = 'AIzaSyDGuUmVLjJC7i2W3BsEjoi31wz7_fkDJfc';

                const response = await fetch(`/api/places/v1/places/${placeId}?languageCode=es-419`, {
                    method: 'GET',
                    headers: {
                        'X-Goog-Api-Key': apiKey,
                        'X-Goog-FieldMask': 'regularOpeningHours,shortFormattedAddress,nationalPhoneNumber'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setPlaceData({
                        isOpen: data.regularOpeningHours?.openNow ?? null,
                        openingHours: data.regularOpeningHours?.weekdayDescriptions || [],
                        address: data.shortFormattedAddress || "24 de Septiembre 210, Bariloche",
                        phone: data.nationalPhoneNumber || "+54 294 416-9171",
                        loading: false
                    });
                } else {
                    setPlaceData(prev => ({ ...prev, loading: false }));
                }
            } catch (error) {
                console.error("Error fetching FAQ place data:", error);
                setPlaceData(prev => ({ ...prev, loading: false }));
            }
        };

        fetchPlaceDetails();
    }, []);

    const todayIndex = (new Date().getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 (Google pattern usually Mon-Sun)
    // However, Google weekdayDescriptions often start with Lunes or Domingo depending on locale.
    // Let's find it by name for safety.
    const todayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date());
    const todayHours = placeData.openingHours.find(day => day.toLowerCase().includes(todayName.toLowerCase())) || "Abierto 12:00 – 00:00";

    return (
        <section className="py-24 px-4 w-full bg-cdh-black relative border-t border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col gap-8"
                    >
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-5xl font-black uppercase text-white">Data Clave</h2>
                                {!placeData.loading && placeData.isOpen !== null && (
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${placeData.isOpen ? 'bg-green-500/20 text-green-500 border border-green-500/50' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>
                                        {placeData.isOpen ? '● Abierto' : '○ Cerrado'}
                                    </span>
                                )}
                            </div>
                            <div className="w-20 h-1 bg-cdh-orange"></div>
                        </div>

                        {/* Ubicación */}
                        <div className="flex gap-4 group">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                className="w-10 h-10 rounded-full bg-cdh-darkwood flex border border-cdh-orange/30 items-center justify-center shrink-0 group-hover:border-cdh-orange transition-colors"
                            >
                                <MapPin className="w-4 h-4 text-cdh-orange" />
                            </motion.div>
                            <div>
                                <h4 className="text-lg font-bold text-white mb-0.5 uppercase flex items-center gap-2">
                                    Ubicación
                                    <a href="https://www.google.com/maps/place/?q=place_id:ChIJw6TZZxJ7GpYR_nKUxBKBvE0" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors">
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </h4>
                                <p className="text-gray-400 text-sm">{placeData.address}</p>
                            </div>
                        </div>

                        {/* Horarios Colapsables */}
                        <div className="flex gap-4 group">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="w-10 h-10 rounded-full bg-cdh-darkwood flex border border-cdh-orange/30 items-center justify-center shrink-0 group-hover:border-cdh-orange transition-colors"
                            >
                                <Clock className="w-4 h-4 text-cdh-orange" />
                            </motion.div>
                            <div className="flex-grow">
                                <div
                                    className="flex items-center justify-between cursor-pointer group"
                                    onClick={() => setShowAllHours(!showAllHours)}
                                >
                                    <h4 className="text-lg font-bold text-white uppercase">Horarios</h4>
                                    <span className="text-cdh-orange hover:text-white transition-colors">
                                        {showAllHours ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </span>
                                </div>

                                <div className="mt-1">
                                    {placeData.loading ? (
                                        <p className="text-gray-500 text-sm animate-pulse">Cargando...</p>
                                    ) : (
                                        <>
                                            <p className="text-cdh-gold font-bold text-sm">
                                                Hoy: {todayHours.split(': ')[1] || todayHours}
                                                <span className="ml-2 font-normal text-gray-500 text-xs">(actualizado)</span>
                                            </p>

                                            <AnimatePresence>
                                                {showAllHours && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden mt-3 pt-3 border-t border-white/5 space-y-1"
                                                    >
                                                        {placeData.openingHours.map((desc, i) => (
                                                            <p key={i} className={`text-xs ${desc.toLowerCase().includes(todayName.toLowerCase()) ? "text-cdh-gold font-bold" : "text-gray-500"}`}>
                                                                {desc}
                                                            </p>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Estacionamiento (Re-agregado) */}
                        <div className="flex gap-4 group">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                className="w-10 h-10 rounded-full bg-cdh-darkwood flex border border-cdh-orange/30 items-center justify-center shrink-0 group-hover:border-cdh-orange transition-colors"
                            >
                                <Car className="w-4 h-4 text-cdh-orange" />
                            </motion.div>
                            <div>
                                <h4 className="text-lg font-bold text-white mb-0.5 uppercase">Estacionamiento</h4>
                                <p className="text-gray-400 text-sm">Gratis, aca el estacionamiento no es medido. Vení con tiempo y disfrutá.</p>
                            </div>
                        </div>

                        {/* Opciones Sin TACC */}
                        <div className="flex gap-4 group">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="w-10 h-10 rounded-full bg-cdh-darkwood flex border border-cdh-orange/30 items-center justify-center shrink-0 group-hover:border-cdh-orange transition-colors"
                            >
                                <WheatOff className="w-4 h-4 text-cdh-orange" />
                            </motion.div>
                            <div>
                                <h4 className="text-lg font-bold text-white mb-0.5 uppercase">Opciones Sin TACC</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Podes pedir cualquiera de nuestras burgers con pan Sin TACC.
                                    <br />
                                    <span className="text-cdh-gold/80 italic text-[11px] block mt-1 leading-tight">
                                        * Al no contar con una cocina exclusiva, existe riesgo de contaminación cruzada.
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* ROW: Contacto y Apps */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4">
                            {/* Columna Contacto */}
                            <div className="flex flex-col gap-4">
                                <h4 className="text-3xl font-black text-white uppercase tracking-tight">Contacto</h4>
                                <div className="flex flex-col gap-5 mt-2">
                                    <a href={`tel:${placeData.phone.replace(/\s+/g, '')}`} className="flex items-center gap-4 group cursor-pointer w-fit">
                                        <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center group-hover:bg-cdh-orange/10 group-hover:border-cdh-orange transition-all duration-300 shadow-xl">
                                            <Phone className="w-5 h-5 text-cdh-orange group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Llamadas</p>
                                            <p className="text-white text-xl tracking-wide font-medium group-hover:text-cdh-orange transition-colors">{placeData.phone}</p>
                                        </div>
                                    </a>

                                    <a href="mailto:cdhbelgrano@gmail.com" className="flex items-center gap-4 group cursor-pointer w-fit">
                                        <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center group-hover:bg-cdh-gold/10 group-hover:border-cdh-gold transition-all duration-300 shadow-xl">
                                            <Mail className="w-5 h-5 text-cdh-gold group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Email</p>
                                            <p className="text-white text-base font-medium group-hover:text-cdh-gold transition-colors">cdhbelgrano@gmail.com</p>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            {/* Columna APPS */}
                            <div className="flex flex-col gap-4">
                                <h4 className="text-3xl font-black text-white uppercase tracking-tight">Apps</h4>
                                <div className="flex flex-col gap-5 mt-2">
                                    <a
                                        href="https://www.pedidosya.com.ar/restaurantes/bariloche/la-casa-de-la-hamburguesa-barrio-belgrano-d2ef7a33-8999-4a8c-9b72-e0b717b859d7-menu?__cf_chl_tk=Ge5vtr.Hjbo7WKCRZSIYzECFUt_BQa.MQT5.GxGr5eU-1772475064-1.0.1.1-DrTZXXE2v_5wbWnRVeR2jyAGK1iGyHqNlrmnUUs5ftY"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 group cursor-pointer w-fit"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center transition-all duration-300 shadow-xl overflow-hidden group-hover:border-[#ea044e]">
                                            <img src={pedidosYaIco} alt="Pedidos Ya" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Tienda Online</p>
                                            <p className="text-white text-base font-bold tracking-wide group-hover:text-[#ea044e] transition-colors">PedidosYa</p>
                                        </div>
                                    </a>

                                    <a
                                        href="https://www.rappi.com.ar/restaurantes/delivery/64707-la-casa-de-la-hamburguesa?utm_source=app&utm_medium=deeplink&utm_campaign=share"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 group cursor-pointer w-fit"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center transition-all duration-300 shadow-xl overflow-hidden group-hover:border-[#ff441f]">
                                            <img src={rappiIco} alt="Rappi" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Tienda Online</p>
                                            <p className="text-white text-base font-bold tracking-wide group-hover:text-[#ff441f] transition-colors">Rappi</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Enhanced Map Integration */}
                    <div className="relative h-full min-h-[400px]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-[#111] relative group"
                        >
                            <iframe
                                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDGuUmVLjJC7i2W3BsEjoi31wz7_fkDJfc&q=place_id:ChIJw6TZZxJ7GpYR_nKUxBKBvE0&language=es&region=AR`}
                                width="100%"
                                height="100%"
                                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(110%) grayscale(20%)' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </motion.div>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full px-8 flex justify-center pointer-events-auto">
                            <a
                                href="https://www.google.com/maps/place/?q=place_id:ChIJw6TZZxJ7GpYR_nKUxBKBvE0"
                                target="_blank"
                                rel="noreferrer"
                                className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform whitespace-nowrap cursor-pointer pointer-events-auto"
                            >
                                <MapPin className="w-4 h-4" />
                                ABRIR EN GOOGLE MAPS
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FAQ;
