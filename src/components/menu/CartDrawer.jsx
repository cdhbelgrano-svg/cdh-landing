import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function CartDrawer({
    isCartOpen,
    setIsCartOpen,
    cartItems,
    setCartItems,
    formatPrice,
    getProductModifiers,
    removeModifierFromCartItem,
    deliveryMode
}) {
    const navigate = useNavigate();

    const handleGoToCheckout = () => {
        setIsCartOpen(false);
        navigate('/checkout', {
            state: {
                cartItems,
                deliveryMode
            }
        });
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsCartOpen(false)}
                >
                    <motion.div
                        className="relative w-full md:w-[400px] h-full bg-[#111] border-l border-white/10 shadow-2xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", ease: "circOut", duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                            <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                                <ShoppingCart className="text-cdh-orange" />
                                Tu Pedido
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            {cartItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                                    <ShoppingCart size={48} className="text-cdh-orange opacity-40" />
                                    <p>Tu carrito está vacío.<br />¡Encontrá algo rico para agregar!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 flex flex-col gap-2 relative group">
                                            <div className="flex justify-between items-start pr-6">
                                                <div className="flex-1 pr-4">
                                                    <h4 className="font-bold text-white uppercase text-sm">{item.quantity}x {item.product.name}</h4>
                                                </div>
                                                <div className="font-bold text-cdh-gold whitespace-nowrap pl-2">{formatPrice(item.product.price * item.quantity)}</div>
                                            </div>
                                            <button
                                                onClick={() => setCartItems(prev => prev.filter(c => c.id !== item.id))}
                                                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>

                                            {/* Render individually selected options */}
                                            <div className="space-y-1 mt-1">
                                                {getProductModifiers(item.product).map(group => {
                                                    const selectedIds = item.modifiers[group.id] || [];
                                                    if (selectedIds.length === 0) return null;

                                                    return selectedIds.map(optId => {
                                                        const opt = group.options.find(o => o.id === optId);
                                                        if (!opt) return null;
                                                        return (
                                                            <div key={`${group.id}-${opt.id}`} className="flex justify-between items-center text-xs text-gray-400 pl-2">
                                                                <span className="truncate flex-1">{opt.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    {opt.price > 0 && <span className="text-gray-500">+{formatPrice(opt.price * item.quantity)}</span>}
                                                                    <button
                                                                        onClick={() => removeModifierFromCartItem(item.id, group.id, opt.id)}
                                                                        className="text-gray-600 hover:text-white transition-colors p-1"
                                                                        aria-label="Quitar opcional"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="p-5 bg-[#1a1a1a] border-t border-white/10 flex flex-col gap-4">

                                <div className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-white/5">
                                    <span className="text-gray-400 uppercase tracking-widest text-xs font-bold">Total a pagar</span>
                                    <span className="text-2xl font-black text-white">
                                        {formatPrice(cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0))}
                                    </span>
                                </div>
                                <button
                                    onClick={handleGoToCheckout}
                                    className="w-full bg-cdh-orange hover:bg-orange-600 text-white font-black uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(242,101,19,0.3)] flex justify-center items-center gap-2"
                                >
                                    Ir al Checkout
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default CartDrawer;
