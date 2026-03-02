import React from 'react';
import { motion } from 'framer-motion';
import { Mountain, Beer, ChevronRight } from 'lucide-react';
import patagonia1 from '../assets/Patagonia-1.jpg';
import patagonia2 from '../assets/Patagonia-2.jpg';

const Patagonia = () => {
    const varieties = [
        {
            name: 'Amber Lager',
            desc: 'Cerveza equilibrada, con maltas caramelo que le dan un aroma a lúpulo suave.',
            ibu: '14.5',
            abv: '4.5%',
            color: 'text-[#D98452]'
        },
        {
            name: '24/7 (IPA)',
            desc: 'Obsesionate con esta IPA cítrica y refrescante. Un aroma intenso frutal.',
            ibu: '35',
            abv: '4.5%',
            color: 'text-[#D98452]'
        },
        {
            name: 'Lager del Sur',
            desc: 'Una rubia fresca y ligera, inspirada en las raíces patagónicas. Fácil de tomar.',
            ibu: '18',
            abv: '5.2%',
            color: 'text-[#D98452]'
        }
    ];

    return (
        <section className="py-16 px-4 w-full bg-[#13261D] relative overflow-hidden border-y border-white/5 selection:bg-[#D98452] selection:text-white">
            {/* Background Texture & Color Overlays */}
            <div className="absolute inset-0 bg-[#000000] opacity-30 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#13261D] via-transparent to-[#000000] opacity-60"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col-reverse lg:flex-row items-center gap-12">

                    {/* Visual Section - Symmetrical & Clean */}
                    <div className="w-full lg:w-1/2 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="relative grid grid-cols-2 gap-4"
                        >
                            <div className="space-y-4">
                                <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden border-2 border-white/10 shadow-2xl relative group">
                                    <img
                                        src={patagonia1}
                                        alt="Cerveza Patagonia 1"
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#592418]/60 to-transparent"></div>
                                </div>
                                <div className="aspect-[4/2] bg-[#592418]/20 rounded-2xl border border-white/5 flex items-center justify-center backdrop-blur-sm shadow-inner shadow-black/40">
                                    <Mountain className="w-8 h-8 text-[#D98452] opacity-50" />
                                </div>
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="aspect-[4/2] bg-[#D98452]/10 rounded-2xl border border-white/5 flex items-center justify-center backdrop-blur-sm shadow-inner shadow-black/40">
                                    <Beer className="w-8 h-8 text-[#592418] opacity-50" />
                                </div>
                                <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden border-2 border-white/10 shadow-2xl relative group">
                                    <img
                                        src={patagonia2}
                                        alt="Cerveza Patagonia 2"
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#13261D]/60 to-transparent"></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Content Section */}
                    <div className="w-full lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-block px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#D98452] text-[10px] font-black uppercase tracking-widest mb-4">
                                Sabores de la Montaña
                            </span>
                            <h2 className="text-5xl md:text-7xl font-black text-white leading-none uppercase tracking-tighter">
                                Cerveza Tirada<br />
                                <span className="text-[#D98452]">Patagonia</span>
                            </h2>
                            <p className="mt-6 text-lg text-gray-300 font-medium leading-relaxed max-w-lg">
                                La frescura original directo de la canilla. Disfrutá el espíritu patagónico en cada sorbo.
                            </p>
                        </motion.div>

                        <div className="mt-8 space-y-4">
                            {varieties.map((beer, i) => (
                                <motion.div
                                    key={beer.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
                                    className="p-5 rounded-xl bg-[#000000]/20 border border-white/5 hover:border-[#D98452]/50 transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-xl font-black uppercase tracking-tight ${beer.color} flex items-center gap-2`}>
                                            {beer.name}
                                        </h4>
                                        <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                                            <span>IBU: <span className="text-white">{beer.ibu}</span></span>
                                            <span>ABV: <span className="text-white">{beer.abv}</span></span>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">{beer.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Accent Shapes */}
            <div className="absolute top-20 right-10 w-48 h-48 bg-[#D98452] rounded-full filter blur-[100px] opacity-10"></div>
            <div className="absolute bottom-20 left-10 w-64 h-64 bg-[#592418] rounded-full filter blur-[120px] opacity-10"></div>
        </section>
    );
};

export default Patagonia;
