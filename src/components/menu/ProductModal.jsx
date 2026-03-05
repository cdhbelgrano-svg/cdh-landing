import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

function ProductModal({
    selectedProduct,
    closeProductModal,
    selectedModifiers,
    handleModifierChange,
    itemQuantity,
    setItemQuantity,
    handleAddToCart,
    calculateActiveTotal,
    formatPrice,
    getProductModifiers,
    editingCartItemId
}) {
    if (!selectedProduct) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end lg:items-stretch justify-center lg:justify-end bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProductModal}
        >
            <motion.div
                className="relative w-full lg:w-[450px] h-[90vh] lg:h-full bg-[#111] border-t lg:border-t-0 lg:border-l border-white/10 lg:rounded-none rounded-t-3xl shadow-2xl flex flex-col"
                initial={{ y: "100%", x: 0 }}
                animate={{ y: 0, x: 0 }}
                exit={{ y: "100%", x: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle for mobile */}
                <div className="w-full flex justify-center pt-3 pb-2 lg:hidden">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                </div>

                {/* Close button */}
                <button
                    onClick={closeProductModal}
                    className="absolute top-4 right-4 z-20 p-2 text-white bg-black/50 hover:bg-cdh-orange rounded-full transition-all backdrop-blur-md border border-white/10 shadow-lg"
                >
                    <X size={20} />
                </button>

                <div className="overflow-y-auto flex-1 custom-scrollbar pb-24">
                    {selectedProduct.image && (
                        <div className="w-full h-48 lg:h-64 relative flex-shrink-0">
                            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent"></div>
                        </div>
                    )}

                    <div className={`p-5 lg:p-6 ${!selectedProduct.image ? 'pt-12' : ''}`}>
                        <h2 className="text-2xl font-black text-white mb-2 leading-tight uppercase">{selectedProduct.name}</h2>
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{selectedProduct.description}</p>
                        <div className="text-xl font-bold text-cdh-gold mb-6 border-b border-white/5 pb-4 flex items-center gap-3">
                            {selectedProduct.originalPrice ? (
                                <>
                                    <span className="text-gray-500 text-lg line-through decoration-red-500/50">{formatPrice(selectedProduct.originalPrice)}</span>
                                    <span className="text-cdh-orange">{formatPrice(selectedProduct.price)}</span>
                                    <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest ml-auto font-black shadow-[0_0_10px_rgba(239,68,68,0.2)]">Auto Promo</span>
                                </>
                            ) : (
                                <span>{formatPrice(selectedProduct.price)}</span>
                            )}
                        </div>

                        {/* Modifiers Section */}
                        {getProductModifiers(selectedProduct).length > 0 ? (
                            <div className="space-y-6">
                                {getProductModifiers(selectedProduct).map(group => (
                                    <div key={group.id} className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                                        <div className="bg-[#222] p-4 flex justify-between items-center border-b border-white/5">
                                            <h4 className="font-bold text-white text-sm uppercase">{group.name}</h4>
                                            <span className="text-[10px] text-cdh-orange bg-cdh-orange/10 px-2 py-1 rounded font-bold uppercase border border-cdh-orange/20">
                                                {group.min > 0 ? `Elegí al menos ${group.min}` : 'Opcional'}
                                            </span>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {group.options && group.options.map(option => {
                                                const isSelected = (selectedModifiers[group.id] || []).includes(option.id);
                                                return (
                                                    <label key={option.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type={"checkbox"}
                                                                name={`group-${group.id}`}
                                                                checked={isSelected}
                                                                onChange={() => handleModifierChange(group.id, option.id, group.max)}
                                                                className={`w-5 h-5 accent-cdh-orange bg-black border-white/20 cursor-pointer ${group.max === 1 ? 'rounded-full' : 'rounded-md'}`}
                                                            />
                                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{option.name}</span>
                                                        </div>
                                                        {option.price > 0 && (
                                                            <span className="text-cdh-gold font-bold text-xs opacity-80 group-hover:opacity-100">+{formatPrice(option.price)}</span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                            {(!group.options || group.options.length === 0) && (
                                                <span className="text-xs text-gray-500 italic p-2 block">No hay opciones disponibles.</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 text-center">
                                <p className="text-gray-400 text-sm">Este producto no tiene opciones adicionales.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Bottom Actions inside Panel/Modal */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#111]/90 backdrop-blur-xl border-t border-white/10 z-10 flex items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-[#1a1a1a] rounded-xl border border-white/10 h-14">
                        <button
                            className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            onClick={() => setItemQuantity(Math.max((editingCartItemId ? 0 : 1), itemQuantity - 1))}
                        >
                            -
                        </button>
                        <span className="w-8 text-center font-bold text-white">{itemQuantity}</span>
                        <button
                            className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            onClick={() => setItemQuantity(itemQuantity + 1)}
                        >
                            +
                        </button>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={handleAddToCart}
                        className={`flex-1 h-14 font-bold rounded-xl flex items-center px-6 transition-colors shadow-lg ${itemQuantity === 0 ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30 justify-center' : 'bg-cdh-orange text-white hover:bg-orange-600 justify-between'}`}
                    >
                        {itemQuantity === 0 ? (
                            <span className="uppercase tracking-wider">Eliminar</span>
                        ) : (
                            <>
                                <span className="uppercase tracking-wider">{editingCartItemId ? 'Actualizar' : 'Agregar'}</span>
                                <span className="font-black">{formatPrice(calculateActiveTotal())}</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default ProductModal;
