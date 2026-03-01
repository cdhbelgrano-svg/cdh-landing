import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Import local images
import smashImg from '../assets/burger-smash.jpg';
import francesaImg from '../assets/burger-francesa.jpg';
import argentinaImg from '../assets/burger-argentina.jpg';
import italianaImg from '../assets/burger-italiana.jpg';
import menuImg from '../assets/menu.jpeg';

const MenuPreview = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const burgers = [
        {
            name: "Smash Burger",
            desc: "Doble medallón smash, doble cheddar, panceta crocante y nuestro pan artesanal.",
            price: "$20.300",
            img: smashImg
        },
        {
            name: "Hamburguesa Francesa",
            desc: "Medallón de alta calidad, queso azul intenso, cebolla caramelizada y rúcula fresca.",
            price: "$19.400",
            img: francesaImg
        },
        {
            name: "Hamburguesa Italiana",
            desc: "Medallón premium, mozzarella hilada, tomates secos hidrolatados y pesto de albahaca fresca.",
            price: "$19.400",
            img: italianaImg
        },
        {
            name: "Hamburguesa Argentina",
            desc: "El clásico nacional: medallón de pura carne Argentina, huevo frito, jamón y queso, cheddar y panceta.",
            price: "$18.100",
            img: argentinaImg
        }
    ];

    return (
        <section id="menu" className="py-16 px-6 w-full bg-[#0a0a0a] relative border-y border-white/5 overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cdh-orange rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-xs font-bold tracking-[0.3em] text-cdh-gold uppercase mb-3">Nuestras Estrellas</h2>
                    <h3 className="text-4xl md:text-5xl font-black uppercase text-white mb-4">
                        Puro <span className="text-cdh-orange drop-shadow-[0_0_15px_rgba(242,101,19,0.5)]">Sabor</span>
                    </h3>
                    <p className="max-w-xl mx-auto text-gray-400 text-sm md:text-base">
                        Blend secreto, pan artesanal y ese punto justo de costra.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {burgers.map((burger, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                            className="group bg-[#111] rounded-[1.75rem] overflow-hidden border border-white/5 hover:border-cdh-orange/30 transition-all duration-500 flex flex-col h-full shadow-lg will-change-transform"
                        >
                            <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
                                <img
                                    src={burger.img}
                                    alt={burger.name}
                                    loading="eager"
                                    className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-1000 opacity-95 group-hover:opacity-100 uppercase"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-20"></div>
                                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-white/10 text-cdh-gold font-black uppercase tracking-wider text-xs shadow-xl">
                                    {burger.price}
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                                <h4 className="text-lg font-black uppercase text-white mb-2 group-hover:text-cdh-orange transition-colors">
                                    {burger.name}
                                </h4>
                                <p className="text-gray-400 text-xs leading-relaxed mb-4 flex-grow line-clamp-3">
                                    {burger.desc}
                                </p>
                                <div className="w-full h-px bg-gradient-to-r from-cdh-orange/10 via-transparent to-transparent"></div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="mt-10 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="inline-flex items-center justify-center px-6 py-3 font-bold text-black bg-white hover:bg-cdh-gold overflow-hidden rounded-full transition-all hover:scale-105 uppercase tracking-widest text-[10px]"
                    >
                        Ver Menú Completo
                    </button>
                </motion.div>

            </div>

            {/* Menu Image Modal */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <motion.div
                            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-cdh-orange/80 rounded-full transition-all backdrop-blur-md border border-white/10 shadow-lg"
                            >
                                <X size={28} />
                            </button>

                            <img
                                src={menuImg}
                                alt="Menú Completo La Casa de la Hamburguesa"
                                className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default MenuPreview;
