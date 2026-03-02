import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import heroBg from '../assets/hero-bg.jpg';
import logoHero from '../assets/logo-hero.png';

const Hero = () => {
    const { scrollY } = useScroll();
    const yParallax = useTransform(scrollY, [0, 500], [0, 100]);

    return (
        <section className="relative min-h-[90vh] md:min-h-screen w-full flex items-center justify-center overflow-hidden bg-cdh-black pt-20 pb-32 z-10">

            {/* STABILIZED BACKGROUND LAYER */}
            <div className="absolute inset-0 z-0 overflow-hidden select-none">

                {/* Smooth Ken Burns + Breathing (Optimized) */}
                <motion.div
                    initial={{ scale: 1.03 }}
                    animate={{
                        scale: [1.03, 1.01, 1.03],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ y: yParallax, willChange: 'transform' }}
                    className="w-full h-full absolute inset-0"
                >
                    <img
                        src={heroBg}
                        alt="Background Burger"
                        className="w-full h-full object-cover opacity-55 brightness-65 contrast-100"
                        onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=2071&auto=format&fit=crop";
                            e.target.className = "w-full h-full object-cover opacity-30 grayscale brightness-50";
                        }}
                    />
                </motion.div>

                {/* Constant Overlays (Optimized) */}
                <div className="absolute inset-0 bg-gradient-to-t from-cdh-black via-cdh-black/40 to-cdh-black/20 z-10"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,black_100%)] opacity-40 z-10 pointer-events-none"></div>
            </div>

            <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-6xl mx-auto w-full">

                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-8"
                >
                    <h2 className="text-3xl md:text-4xl font-normal tracking-wider text-cdh-orange drop-shadow-[0_0_15px_rgba(242,101,19,0.3)] capitalize" style={{ fontFamily: '"Rockwell", serif' }}>Sucursal Belgrano</h2>
                </motion.div>

                <motion.div
                    className="flex flex-col items-center justify-center text-center space-y-0 text-white mb-8 drop-shadow-2xl"
                    initial={{ opacity: 0, scale: 0.85, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <img
                        src={logoHero}
                        alt="La Casa de la Hamburguesa Bariloche Logo"
                        className="w-[300px] md:w-[450px] lg:w-[600px] h-auto object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)]"
                    />
                </motion.div>

                <motion.h3
                    className="text-6xl md:text-[80px] leading-tight font-normal text-cdh-orange capitalize mb-12 max-w-4xl drop-shadow-[0_0_15px_rgba(242,101,19,0.3)]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    style={{ fontFamily: '"Ventography", cursive' }}
                >
                    Sabor insuperable
                </motion.h3>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.4 }}
                >
                    <motion.a
                        href="https://menu.fu.do/lacasadelahamburguesabelgrano"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative inline-flex items-center justify-center px-10 py-5 font-black text-white bg-cdh-orange overflow-hidden rounded-full shadow-[0_0_40px_-10px_rgba(242,101,19,0.6)] transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
                        <span className="relative flex items-center gap-3 text-xl md:text-2xl uppercase tracking-widest">
                            Pedir Ahora
                            <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                        </span>
                    </motion.a>
                </motion.div>
            </div>

            <motion.div
                className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
            >
                <div className="w-[30px] h-[50px] border-2 border-white/20 rounded-full flex justify-center p-1.5 opacity-60">
                    <motion.div
                        animate={{ y: [0, 15, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-1.5 h-1.5 bg-cdh-orange rounded-full"
                    />
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
