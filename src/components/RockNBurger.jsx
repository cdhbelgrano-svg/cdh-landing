import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Music, Heart, MessageCircle } from 'lucide-react';

import rock1 from '../assets/rock-1.jpg';
import rock2 from '../assets/rock-2.jpg';
import rock3 from '../assets/rock-3.jpg';
import rock4 from '../assets/rock-4.jpg';
import rock5 from '../assets/rock-5.jpg';
import rock6 from '../assets/rock-6.jpg';

const RockNBurger = () => {
    // Array of imported images
    const rockImages = [
        { id: 1, url: rock1 },
        { id: 2, url: rock2 },
        { id: 3, url: rock3 },
        { id: 4, url: rock4 },
        { id: 5, url: rock5 },
        { id: 6, url: rock6 }
    ].map((img, i) => ({
        ...img,
        likes: `${(Math.random() * 2 + 0.5).toFixed(1)}k`,
        comments: Math.floor(Math.random() * 100 + 20),
        span: i === 0 ? 'md:col-span-2 md:row-span-2' : 'col-span-1 row-span-1',
        displayClass: i === 5 ? 'block md:hidden' : 'block'
    }));

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <section id="experiencia" className="py-24 px-6 w-full bg-[#050505] relative border-y border-white/5 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-cdh-gold rounded-full mix-blend-screen filter blur-[180px] opacity-5 -translate-y-1/2 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto mb-16 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-4 text-cdh-orange">
                        <Music className="w-6 h-6" />
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase">Vibras Únicas</h2>
                        <Music className="w-6 h-6" />
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black uppercase text-white mb-6">
                        ROCK N' <span className="text-cdh-gold drop-shadow-[0_0_15px_rgba(233,167,72,0.6)]">BURGER</span>
                    </h3>
                    <p className="max-w-xl mx-auto text-gray-400 text-sm md:text-base leading-relaxed">
                        Explorá nuestra cultura. Música, amigos y las mejores burgers de Bariloche en un solo lugar.
                    </p>
                </motion.div>
            </div>

            {/* Bento Grid Layout */}
            <motion.div
                className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
            >
                {rockImages.map((item) => (
                    <motion.div
                        key={item.id}
                        variants={itemVariants}
                        className={`group relative rounded-2xl overflow-hidden bg-[#111] border border-white/5 cursor-pointer shadow-xl will-change-transform ${item.span} ${item.displayClass}`}
                    >
                        <img
                            src={item.url}
                            alt={`Rock photo ${item.id}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                            onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400&auto=format&fit=crop";
                                e.target.className = "w-full h-full object-cover opacity-10 grayscale";
                            }}
                        />

                        {/* Hover Overlay - Instagram Style */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-4 text-white font-bold text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Heart className="w-4 h-4 fill-current text-cdh-orange" />
                                    <span>{item.likes}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MessageCircle className="w-4 h-4 fill-current" />
                                    <span>{item.comments}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-white/80 uppercase tracking-widest font-black">
                                <Instagram className="w-3 h-3" />
                                <span>@cdhbelgrano</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <div className="mt-16 text-center px-4">
                <motion.a
                    href="https://instagram.com/cdhbelgrano"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 border border-white/10 hover:border-cdh-orange px-8 py-4 rounded-full text-white font-bold text-sm uppercase tracking-wider transition-all hover:bg-cdh-orange shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <Instagram className="w-5 h-5" />
                    Seguinos en Instagram
                </motion.a>
            </div>
        </section>
    );
};

export default RockNBurger;
