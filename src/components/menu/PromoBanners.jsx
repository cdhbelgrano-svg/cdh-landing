import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabaseClient';

function PromoBanners({ openProductModal, products }) {
    const [currentBanner, setCurrentBanner] = useState(0);
    const [dynamicBanners, setDynamicBanners] = useState([]);

    useEffect(() => {
        const fetchBanners = async () => {
            const { data: banners } = await supabase
                .from('promos_banners')
                .select('*')
                .eq('is_active', true);

            if (banners) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const active = banners.filter(b => {
                    if (b.start_date) {
                        const start = new Date(b.start_date + 'T00:00:00');
                        if (now < start) return false;
                    }

                    if (b.end_date) {
                        const end = new Date(b.end_date + 'T00:00:00');
                        if (now > end) return false;
                    }

                    return true;
                });

                setDynamicBanners(active.map(b => ({
                    id: b.id,
                    productId: b.product_id,
                    productName: b.product_name,
                    bannerName: b.banner_name,
                    imageUrl: b.image_url,
                    isActive: b.is_active,
                    startDate: b.start_date,
                    endDate: b.end_date
                })));
            }
        };

        fetchBanners();
    }, []);

    const defaultBanners = [
        {
            id: 'promo-1',
            tag: 'HOY',
            tagBg: 'bg-red-600',
            title: 'Promo\nFinde',
            btnText: 'Ver más',
            bgClass: 'from-[#d98452] to-[#a6562d]',
            textClass: 'text-white',
            btnClass: 'bg-white text-[#d98452] hover:bg-gray-100',
            bgDeco: <div className="absolute right-0 top-0 w-32 h-32 bg-white/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
        },
        {
            id: 'promo-2',
            tag: 'TOP',
            tagBg: 'bg-cdh-gold text-black',
            title: 'Los Más\nPedidos',
            btnText: 'Explorar',
            bgClass: 'from-[#2a2a2a] to-[#111111] border border-cdh-gold/30',
            textClass: 'text-cdh-gold',
            btnClass: 'bg-cdh-gold text-black hover:bg-yellow-600',
            bgDeco: <div className="absolute right-0 bottom-0 w-40 h-40 bg-cdh-gold/10 rounded-full -mr-10 -mb-10 blur-2xl"></div>
        },
        {
            id: 'promo-3',
            tag: '% OFF',
            tagBg: 'bg-green-600',
            title: 'Ofertas\nExclusivas',
            btnText: 'Aprovechar',
            bgClass: 'from-[#5F2E20] to-[#2b1008] border border-cdh-orange/20',
            textClass: 'text-white',
            btnClass: 'bg-transparent border-2 border-cdh-orange text-white hover:bg-cdh-orange',
            bgDeco: <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)]"></div>
        }
    ];

    const mappedDynamicBanners = dynamicBanners.map((db, idx) => {
        // Find product to check if it has an image in Fudo or if we should use a generic style
        const product = products?.find(p => p.id === db.productId);

        return {
            id: `dyn-${db.id}`,
            tag: db.bannerName ? db.bannerName.toUpperCase() : 'DESTACADO',
            tagBg: 'bg-cdh-orange',
            title: db.productName,
            btnText: 'Míralo',
            bgClass: idx % 2 === 0 ? 'from-[#5F2E20] to-[#2b1008] border border-cdh-orange/20' : 'from-[#2a2a2a] to-[#111111] border border-cdh-gold/30',
            textClass: idx % 2 === 0 ? 'text-white' : 'text-cdh-gold',
            btnClass: 'bg-cdh-orange text-white hover:bg-orange-600',
            bgDeco: db.imageUrl ? (
                <div className="absolute inset-0 w-full h-full">
                    <img src={db.imageUrl} alt={db.productName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                </div>
            ) : (
                <div className="absolute right-0 bottom-0 w-40 h-40 bg-cdh-orange/10 rounded-full -mr-10 -mb-10 blur-2xl"></div>
            ),
            onClick: () => {
                if (openProductModal && product) {
                    openProductModal(product);
                }
            }
        };
    });

    const banners = mappedDynamicBanners.length > 0 ? mappedDynamicBanners : defaultBanners;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [banners.length]);

    return (
        <div className="mb-6 relative rounded-xl overflow-hidden aspect-[26/6] md:aspect-[26/4]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentBanner}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className={`absolute inset-0 w-full h-full bg-gradient-to-br ${banners[currentBanner].bgClass} p-4 md:p-6 flex flex-col justify-center cursor-pointer shadow-xl`}
                >
                    {banners[currentBanner].bgDeco}
                    <span className={`${banners[currentBanner].tagBg} text-[9px] md:text-[10px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm inline-block self-start mb-1 md:mb-2 relative z-10 whitespace-pre-line`}>
                        {banners[currentBanner].tag}
                    </span>
                    <h3 className={`text-lg md:text-3xl font-black ${banners[currentBanner].textClass} uppercase tracking-tight mb-1 relative z-10 leading-tight w-2/3 md:w-3/4 drop-shadow-md line-clamp-2`}>
                        {banners[currentBanner].title}
                    </h3>
                    <button
                        onClick={banners[currentBanner].onClick}
                        className={`absolute bottom-3 right-3 md:bottom-4 md:right-4 font-black px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs shadow-lg transition-colors z-10 ${banners[currentBanner].btnClass}`}
                    >
                        {banners[currentBanner].btnText}
                    </button>
                </motion.div>
            </AnimatePresence>

            {/* Carousel Indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
                {banners.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentBanner(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentBanner === idx ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70 w-1.5'}`}
                        aria-label={`Ir al banner ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default PromoBanners;
