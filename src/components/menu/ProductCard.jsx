import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

function ProductCard({ product, openProductModal, cartQuantity, formatPrice }) {
    const [imgLoaded, setImgLoaded] = React.useState(false);

    return (
        <div
            onClick={() => openProductModal(product)}
            className="bg-[#111] border border-white/5 rounded-xl p-2.5 flex items-center gap-3 cursor-pointer hover:bg-[#1a1a1a] hover:border-cdh-orange/20 transition-all group shadow-md"
        >
            {/* Extremely Compact Image Left */}
            <div className="w-20 h-20 rounded-lg bg-[#0a0a0a] overflow-hidden flex-shrink-0 relative">
                {product.image ? (
                    <>
                        {!imgLoaded && (
                            <div className="absolute inset-0 bg-white/5 animate-pulse rounded-lg"></div>
                        )}
                        <motion.img
                            src={product.image}
                            alt={product.name}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: imgLoaded ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            onLoad={() => setImgLoaded(true)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-cdh-orange/20 text-lg font-black uppercase">{product.name.substring(0, 2)}</div>
                )}
            </div>

            {/* Info Middle */}
            <div className="flex-1 min-w-0 py-1 flex flex-col h-full justify-between">
                <div>
                    <h4 className="text-sm md:text-base font-bold text-white leading-tight truncate group-hover:text-cdh-orange transition-colors">
                        {product.name}
                    </h4>
                    {product.description && (
                        <p className="text-gray-400 text-[11px] md:text-xs line-clamp-1 md:line-clamp-2 mt-0.5 mb-1 leading-tight">
                            {product.description}
                        </p>
                    )}
                </div>
                <div className="text-cdh-gold font-bold text-sm flex items-center justify-between gap-2">
                    {product.originalPrice ? (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-semibold text-xs line-through decoration-red-500/50">{formatPrice(product.originalPrice)}</span>
                            <span className="text-cdh-orange">{formatPrice(product.price)}</span>
                        </div>
                    ) : (
                        <span>{formatPrice(product.price)}</span>
                    )}
                </div>
            </div>

            {/* Add Button Right */}
            <div className="relative flex-shrink-0">
                {cartQuantity > 0 && (
                    <div className="absolute -top-2 -right-2 bg-white text-cdh-orange text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-cdh-orange z-10 p-0.5">
                        {cartQuantity}
                    </div>
                )}
                <div className="w-8 h-8 rounded-full bg-white/5 text-cdh-orange flex items-center justify-center group-hover:bg-cdh-orange group-hover:text-white transition-colors border border-white/5">
                    <Plus size={18} />
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
