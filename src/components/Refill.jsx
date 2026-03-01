import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Droplet } from 'lucide-react';

const CocaGlass = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Glass Contour */}
        <path d="M6 4c0-1 1-1 1-1h10s1 0 1 1c0 2-1 3-1 5 0 2 1 4 1 7 0 3-1 5-2 6-1 1-1 1-1 1H9s0 0-1-1c-1-1-2-3-2-6 0-3 1-5 1-7 0-2-1-3-1-5Z" />
        {/* Ice Cubes */}
        <rect x="9" y="8" width="3" height="3" rx="1" transform="rotate(15 9 8)" opacity="0.5" />
        <rect x="13" y="11" width="3" height="3" rx="1" transform="rotate(-10 13 11)" opacity="0.5" />
        {/* Straw */}
        <path d="M13 3L15 1M15 1L19 2" strokeWidth="1" />
        <path d="M13 8V3" strokeWidth="1" />
    </svg>
);

const Effervescence = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(40)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute bg-white/10 rounded-full"
                style={{
                    width: Math.random() * 8 + 2,
                    height: Math.random() * 8 + 2,
                    left: `${Math.random() * 100}%`,
                    bottom: `-20px`,
                }}
                animate={{
                    y: [0, -1000],
                    x: [0, (Math.random() - 0.5) * 50],
                    opacity: [0, 0.4, 0],
                    scale: [1, 1.5, 1],
                }}
                transition={{
                    duration: 5 + Math.random() * 10,
                    repeat: Infinity,
                    delay: Math.random() * 10,
                    ease: "linear"
                }}
            />
        ))}
    </div>
);

const Refill = () => {
    return (
        <section className="py-24 px-4 w-full bg-[#0a0502] relative overflow-hidden border-y border-white/5">
            {/* Background Drink Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a0c04] to-[#0a0502] opacity-80"></div>

            <Effervescence />

            {/* Background Aggressive Patterns */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #F26513 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-96 h-96 bg-cdh-orange rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>

            <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-16">

                <div className="w-full md:w-1/2">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="font-black text-6xl md:text-8xl leading-none tracking-tighter uppercase flex flex-col"
                    >
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Refill</span>
                        <span className="text-cdh-orange flex items-center gap-2">Ilimitado <Sparkles className="w-10 h-10 text-cdh-gold animate-pulse" /></span>
                    </motion.div>

                    <motion.p
                        className="mt-6 text-xl text-gray-400 font-medium max-w-lg"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Tu vaso nunca está vacío. Servite las veces que quieras y acompaña tu smash con el mejor sabor.
                    </motion.p>

                    <motion.div
                        className="mt-10 flex flex-wrap gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        {[
                            { name: 'Coca-Cola', color: 'border-red-600/30' },
                            { name: 'Coca-Cola Zero', color: 'border-white/10' },
                            { name: 'Sprite Zero', color: 'border-green-600/30' },
                            { name: 'Fanta Zero', color: 'border-cdh-orange/30' }
                        ].map((soda, i) => (
                            <span key={i} className={`px-5 py-2.5 rounded-full bg-black/40 border ${soda.color} text-white font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm hover:scale-105 transition-all text-sm`}>
                                <CocaGlass className="w-3.5 h-3.5 text-cdh-orange" />
                                {soda.name}
                            </span>
                        ))}
                    </motion.div>
                </div>

                <motion.div
                    className="w-full md:w-1/2 relative"
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                    <div className="relative aspect-square max-w-md mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cdh-orange to-cdh-gold rounded-3xl transform rotate-6 opacity-10"></div>
                        <div className="absolute inset-0 bg-gradient-to-bl from-black/80 to-[#1a0c04]/60 rounded-3xl transform -rotate-3 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden">
                            <div className="text-9xl font-black text-white/5 transform -rotate-45 absolute scale-150">REFILL</div>
                            <div className="relative z-10 w-48 h-64 border-4 border-white/20 rounded-b-3xl rounded-t-lg bg-gradient-to-b from-transparent to-red-900/40 relative overflow-hidden backdrop-blur-md">
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 bg-cdh-orange opacity-80"
                                    animate={{ height: ['20%', '90%', '20%'] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Droplet className="w-16 h-16 text-white/50" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default Refill;
