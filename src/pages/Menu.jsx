import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOnlineCatalog, fetchOnlineCategories } from '../services/fudoService';
import { supabase } from '../services/supabaseClient';
import { X, ShoppingCart, Store, Bike, Plus, Search } from 'lucide-react';
import heroBg from '../assets/hero-bg.jpg';
import cdhLogo from '../assets/ico/CDH.png';
import PromoBanners from '../components/menu/PromoBanners';
import CategoryNav from '../components/menu/CategoryNav';
import ProductCard from '../components/menu/ProductCard';
import ProductModal from '../components/menu/ProductModal';
import CartDrawer from '../components/menu/CartDrawer';
import { AlertCircle } from 'lucide-react';

function Menu() {
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [autoDiscounts, setAutoDiscounts] = useState([]);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [storeHours, setStoreHours] = useState(null);
    const location = useLocation();

    // Load from localStorage if available
    const [deliveryMode, setDeliveryMode] = useState(() => {
        const saved = localStorage.getItem('cdh_delivery_mode');
        return saved ? saved : 'retiro';
    });

    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('cdh_cart');
        return saved ? JSON.parse(saved) : [];
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for active product
    const [selectedModifiers, setSelectedModifiers] = useState({});
    const [itemQuantity, setItemQuantity] = useState(1);
    const [editingCartItemId, setEditingCartItemId] = useState(null);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cdh_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        localStorage.setItem('cdh_delivery_mode', deliveryMode);
    }, [deliveryMode]);

    // Handle clearCart coming from Checkout
    useEffect(() => {
        if (location.state?.clearCart) {
            setCartItems([]);
            localStorage.removeItem('cdh_cart');
            // Remove state to prevent clearing again on re-render
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        const loadMenuData = async () => {
            setIsLoading(true);
            try {
                // Fetch categories and products
                const [cats, catalog] = await Promise.all([
                    fetchOnlineCategories(),
                    fetchOnlineCatalog()
                ]);

                setCategories(cats);
                setProducts(catalog.products);
                setAllProducts(catalog.allProducts);

                // Set initial active category
                if (cats.length > 0) {
                    setActiveCategoryId(cats[0].id);
                }

                // Load active Auto Discounts
                const { data: autos } = await supabase
                    .from('promos_auto')
                    .select('*')
                    .eq('is_active', true);

                // Load store hours
                const { data: hData } = await supabase
                    .from('store_hours')
                    .select('*')
                    .eq('id', 1)
                    .single();
                if (hData) setStoreHours(hData);

                if (autos) {
                    setAutoDiscounts(autos.map(a => ({
                        id: a.id,
                        name: a.internal_name,
                        type: a.type,
                        value: Number(a.value),
                        isActive: a.is_active,
                        validFrom: a.valid_from,
                        validUntil: a.valid_until,
                        applicableCategories: a.applicable_categories,
                        applicableProducts: a.applicable_products,
                        applicableDelivery: a.applicable_delivery
                    })));
                }
            } catch (error) {
                console.error('Error cargando el menú:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMenuData();
    }, []);

    // Filter products based on active category or search query
    const filteredProducts = products.map(product => {
        const p = { ...product };
        let bestPrice = p.price;

        const currentDeliveryMode = localStorage.getItem('cdh_delivery_mode') || 'retiro';
        const activeAutoDiscounts = autoDiscounts.filter(d => {
            if (!d.isActive) return false;
            const now = new Date();
            if (d.validFrom && new Date(d.validFrom + 'T00:00:00') > now) return false;
            if (d.validUntil && new Date(d.validUntil + 'T23:59:59') < now) return false;
            if (d.applicableDelivery && d.applicableDelivery.length > 0) {
                if (!d.applicableDelivery.includes(currentDeliveryMode)) return false;
            }
            return true;
        });

        activeAutoDiscounts.forEach(discount => {
            let applies = false;
            const noCats = !discount.applicableCategories || discount.applicableCategories.length === 0;
            const noProds = !discount.applicableProducts || discount.applicableProducts.length === 0;

            if (noCats && noProds) {
                applies = true;
            } else {
                if (!noCats && discount.applicableCategories.includes(p.productCategoryId)) {
                    applies = true;
                }
                if (!noProds && discount.applicableProducts.includes(p.id)) {
                    applies = true;
                }
            }

            if (applies) {
                let currentDiscounted = p.price;
                if (discount.type === 'percentage') {
                    currentDiscounted = p.price * (1 - discount.value / 100);
                } else if (discount.type === 'fixed') {
                    currentDiscounted = Math.max(0, p.price - discount.value);
                }
                if (currentDiscounted < bestPrice) {
                    bestPrice = currentDiscounted;
                }
            }
        });

        if (bestPrice < p.price) {
            p.originalPrice = p.price;
            p.price = bestPrice;
        }
        return p;
    }).filter((product) => {
        // Exlude products from hidden categories like 'Adiciones'
        const isVisibleCategory = categories.some(c => c.id === product.productCategoryId);
        if (!isVisibleCategory) return false;

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            return (
                product.name.toLowerCase().includes(query) ||
                (product.description && product.description.toLowerCase().includes(query))
            );
        }
        return product.productCategoryId === activeCategoryId;
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(price);
    };

    // Calculate if store is currently open
    const isStoreOpen = () => {
        if (!storeHours) return true; // Default to open while loading
        if (!storeHours.is_open_today) return false;

        const now = new Date();
        const currentDay = now.getDay();

        if (!storeHours.shifts || storeHours.shifts.length === 0) return false;

        return storeHours.shifts.some(shift => {
            if (shift.is_active === false) return false;
            const shiftDays = shift.open_days || [];
            if (!shiftDays.includes(currentDay)) return false;

            const startTime = deliveryMode === 'envio' ? shift.delivery_start_time : shift.pickup_start_time;
            const endTime = deliveryMode === 'envio' ? shift.delivery_end_time : shift.pickup_end_time;

            if (!startTime || !endTime) return false;

            const sTime = new Date(now);
            const [sH, sM] = startTime.split(':');
            sTime.setHours(parseInt(sH, 10), parseInt(sM, 10), 0, 0);

            const eTime = new Date(now);
            const [eH, eM] = endTime.split(':');
            eTime.setHours(parseInt(eH, 10), parseInt(eM, 10), 0, 0);

            if (eTime < sTime) eTime.setDate(eTime.getDate() + 1);

            return now >= sTime && now <= eTime;
        });
    };

    const storeOpenStatus = isStoreOpen();
    const isCompletelyClosedForDay = storeHours && (!storeHours.is_open_today || !storeHours.shifts || storeHours.shifts.length === 0 || !storeHours.shifts.some(s => s.is_active !== false && (s.open_days || []).includes(new Date().getDay())));

    // Calculate today's hours for display
    const getTodaysHours = () => {
        if (!storeHours) return null;
        const now = new Date();
        const currentDay = now.getDay();

        let deliveryHours = [];
        let pickupHours = [];

        if (storeHours.is_open_today && storeHours.shifts) {
            storeHours.shifts.forEach(shift => {
                if (shift.is_active === false) return;
                const shiftDays = shift.open_days || [];
                if (shiftDays.includes(currentDay)) {
                    const formatTime = (timeStr) => {
                        if (!timeStr) return '';
                        const [h, m] = timeStr.split(':');
                        return `${h}:${m}`;
                    };

                    if (shift.delivery_start_time && shift.delivery_end_time) {
                        deliveryHours.push(`${formatTime(shift.delivery_start_time)} a ${formatTime(shift.delivery_end_time)}`);
                    }
                    if (shift.pickup_start_time && shift.pickup_end_time) {
                        pickupHours.push(`${formatTime(shift.pickup_start_time)} a ${formatTime(shift.pickup_end_time)}`);
                    }
                }
            });
        }

        return {
            delivery: deliveryHours.length > 0 ? deliveryHours.join(', ') : 'Cerrado',
            pickup: pickupHours.length > 0 ? pickupHours.join(', ') : 'Cerrado'
        };
    };

    const todaysHoursTexts = getTodaysHours();

    // Helper to get modifiers mapped from embedded productGroups
    const getProductModifiers = (product) => {
        if (!product || !product.productGroups) return [];

        return product.productGroups.map(group => {
            const mappedOptions = group.productGroupProducts.map(option => {
                const fullOptionData = allProducts.find(p => p.id === option.productId);
                return {
                    id: option.productId,
                    name: fullOptionData ? fullOptionData.name : 'Desconocido',
                    price: option.price, // The price comes nested from the mapping in Fudo
                    maxQuantity: option.maxQuantity
                };
            });

            return {
                id: group.id,
                name: group.name,
                min: group.minQuantity || 0,
                max: group.maxQuantity || 99,
                options: mappedOptions
            };
        });
    };

    // Feature Logic: Modifier Selection
    const handleModifierChange = (groupId, optionId, groupMax) => {
        setSelectedModifiers(prev => {
            const currentSelected = prev[groupId] || [];

            if (groupMax === 1) {
                // Radio button visually, but behaves like a togglable checkbox to allow deselection
                if (currentSelected.includes(optionId)) {
                    return { ...prev, [groupId]: [] };
                } else {
                    return { ...prev, [groupId]: [optionId] };
                }
            } else {
                // Checkbox behavior
                if (currentSelected.includes(optionId)) {
                    return { ...prev, [groupId]: currentSelected.filter(id => id !== optionId) };
                } else {
                    if (currentSelected.length < groupMax) {
                        return { ...prev, [groupId]: [...currentSelected, optionId] };
                    }
                    return prev;
                }
            }
        });
    };

    // Calculate total price for active modal item
    const calculateActiveTotal = () => {
        if (!selectedProduct) return 0;
        let total = selectedProduct.price;

        const modifiers = getProductModifiers(selectedProduct);
        modifiers.forEach(group => {
            const selectedOptIds = selectedModifiers[group.id] || [];
            selectedOptIds.forEach(optId => {
                const opt = group.options.find(o => o.id === optId);
                if (opt) total += opt.price || 0;
            });
        });

        return total * itemQuantity;
    };

    // Add To Cart Logic
    const handleAddToCart = () => {
        if (!selectedProduct) return;

        if (editingCartItemId && itemQuantity === 0) {
            setCartItems(prev => prev.filter(i => i.id !== editingCartItemId));
            closeProductModal();
            return;
        }

        // Validation for required modifiers
        const modifiers = getProductModifiers(selectedProduct);
        let isValid = true;
        let missingGroup = "";

        for (const group of modifiers) {
            const selected = selectedModifiers[group.id] || [];
            if (group.min > 0 && selected.length < group.min) {
                isValid = false;
                missingGroup = group.name;
                break;
            }
        }

        if (!isValid) {
            alert(`Por favor elegí al menos una opción en: ${missingGroup}`);
            return;
        }

        // Build cart item
        const cartItem = {
            id: editingCartItemId || Date.now().toString(),
            product: selectedProduct,
            quantity: itemQuantity,
            modifiers: { ...selectedModifiers },
            totalPrice: calculateActiveTotal(),
            modifiersText: modifiers.map(g => {
                const sel = selectedModifiers[g.id] || [];
                const selOpts = sel.map(id => g.options.find(o => o.id === id)?.name).filter(Boolean);
                return selOpts.length > 0 ? `${selOpts.join(', ')}` : null;
            }).filter(Boolean).join(' | ')
        };

        if (editingCartItemId) {
            setCartItems(prev => prev.map(item => item.id === editingCartItemId ? cartItem : item));
        } else {
            setCartItems(prev => [...prev, cartItem]);
        }

        closeProductModal();
    };

    const removeModifierFromCartItem = (cartItemId, groupId, optionId) => {
        setCartItems(prev => prev.map(item => {
            if (item.id !== cartItemId) return item;

            const newModifiers = { ...item.modifiers };
            if (newModifiers[groupId]) {
                newModifiers[groupId] = newModifiers[groupId].filter(id => id !== optionId);
            }

            // Recalculate price
            let newTotal = item.product.price;
            const itemModifiers = getProductModifiers(item.product);
            itemModifiers.forEach(g => {
                const selIds = newModifiers[g.id] || [];
                selIds.forEach(id => {
                    const opt = g.options.find(o => o.id === id);
                    if (opt) newTotal += (opt.price || 0);
                });
            });

            return { ...item, modifiers: newModifiers, totalPrice: newTotal * item.quantity };
        }));
    };

    const openProductModal = (product) => {
        setSelectedProduct(product);
        const existingCartItem = cartItems.find(item => item.product.id === product.id);

        if (existingCartItem) {
            setSelectedModifiers(existingCartItem.modifiers);
            setItemQuantity(existingCartItem.quantity);
            setEditingCartItemId(existingCartItem.id);
        } else {
            setSelectedModifiers({});
            setItemQuantity(1);
            setEditingCartItemId(null);
        }
    };

    const closeProductModal = () => {
        setSelectedProduct(null);
        setEditingCartItemId(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cdh-black flex flex-col items-center justify-center text-white selection:bg-cdh-orange selection:text-white">
                <h2 className="text-3xl md:text-5xl font-normal text-cdh-orange capitalize drop-shadow-[0_0_15px_rgba(242,101,19,0.3)]" style={{ fontFamily: '"Rockwell", serif' }}>
                    Cargando menú...
                </h2>
                <div className="mt-8 w-12 h-12 border-4 border-cdh-orange outline-none rounded-full border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-cdh-black text-white pb-28 relative"
            style={{
                backgroundImage: `url(${heroBg})`,
                backgroundSize: 'cover',
                backgroundAttachment: 'fixed',
                backgroundPosition: 'center'
            }}
        >
            {/* Dark overlay over wood to keep premium dark aesthetic */}
            <div className="absolute inset-0 bg-cdh-black/90 z-0"></div>

            <div className="relative z-10 flex flex-col min-h-screen">

                {/* Compact Header Section */}
                <div className="bg-[#111]/95 backdrop-blur-md sticky top-0 z-30 border-b border-white/5 pt-4 pb-3 shadow-xl">
                    <div className="max-w-7xl mx-auto px-4 w-full">

                        {/* Top: Logo & Location */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <Link to="/" className="w-11 h-11 rounded-full border border-cdh-orange flex items-center justify-center overflow-hidden ring-2 ring-cdh-orange/20 bg-cdh-black/50 hover:border-white transition-colors cursor-pointer shadow-lg p-0.5">
                                    <img src={cdhLogo} alt="LCDH" className="w-full h-full object-contain rounded-full bg-white/5" />
                                </Link>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Entregar en</span>
                                    <span className="text-sm font-bold text-white flex items-center gap-1">
                                        <span className="text-cdh-orange">📍</span> La Casa De la Hamburguesa Belgrano | 24 de septiembre 210, Bariloche
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Store Status Indicator */}
                        {storeHours && (
                            <div className="flex bg-[#1a1a1a] border border-white/5 rounded-lg p-3 mb-4 items-center justify-between shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${storeOpenStatus ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'} animate-pulse`}></div>
                                    <span className={`text-xs md:text-sm font-black uppercase tracking-wider ${storeOpenStatus ? 'text-green-500' : 'text-red-500'}`}>
                                        {storeOpenStatus ? 'Abierto Ahora' : 'Cerrado Ahora'}
                                    </span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Horarios de Hoy</span>
                                    <span className="text-[10px] md:text-xs text-gray-300">
                                        <span className="text-cdh-orange font-bold">Retiro:</span> {todaysHoursTexts?.pickup} <span className="text-white/20 mx-1">|</span> <span className="text-cdh-orange font-bold">Envío:</span> {todaysHoursTexts?.delivery}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Search & Modality Toggle Row (Desktop separates them, Mobile stacks them) */}
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            {/* Modality Toggle */}
                            <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/5 w-full md:w-80 flex-shrink-0">
                                <button
                                    onClick={() => setDeliveryMode('envio')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${deliveryMode === 'envio' ? 'bg-[#222] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Bike size={16} className={deliveryMode === 'envio' ? 'text-cdh-orange' : ''} />
                                    Envío
                                </button>
                                <button
                                    onClick={() => setDeliveryMode('retiro')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${deliveryMode === 'retiro' ? 'bg-[#222] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Store size={16} className={deliveryMode === 'retiro' ? 'text-cdh-orange' : ''} />
                                    Retiro
                                </button>
                            </div>

                            {/* Search Bar (Visual) */}
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar hamburguesas, bebidas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cdh-orange/50 transition-colors"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 max-w-7xl mx-auto w-full px-4 pt-4 pb-6">

                    {/* Store Closed Banner */}
                    {!storeOpenStatus && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex items-start gap-3 shadow-lg">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="text-red-400 font-black text-sm uppercase tracking-wide">El local está cerrado</h3>
                                {isCompletelyClosedForDay ? (
                                    <p className="text-xs text-red-300 mt-1 leading-relaxed">
                                        Hoy no abrimos el local, por lo que no estamos tomando pedidos. ¡Te esperamos mañana!
                                    </p>
                                ) : (
                                    <p className="text-xs text-red-300 mt-1 leading-relaxed">
                                        En este momento no estamos tomando pedidos para entrega inmediata. ¡Pero podés armar tu carrito igual y <strong>programar tu pedido</strong> para más tarde en el Checkout!
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Banners Promocionales (Carousel) */}
                    <PromoBanners openProductModal={openProductModal} products={allProducts} />

                    {/* Categories Horizontal Carousel */}
                    <CategoryNav
                        categories={categories}
                        activeCategoryId={activeCategoryId}
                        setActiveCategoryId={setActiveCategoryId}
                    />

                    {/* General Catalog - Responsive Grid of Compact Horizontal Cards */}
                    <div>
                        <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wide">
                            {categories.find(c => c.id === activeCategoryId)?.name || 'Catálogo'}
                        </h3>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCategoryId + '-' + searchQuery}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.25 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
                            >
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        openProductModal={openProductModal}
                                        cartQuantity={cartItems.filter(item => item.product.id === product.id).reduce((acc, curr) => acc + curr.quantity, 0)}
                                        formatPrice={formatPrice}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-20 bg-[#111] rounded-2xl border border-white/5 mt-4">
                                <p className="text-gray-500 text-sm md:text-base">No hay productos disponibles en esta categoría.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Modal / Action Sheet for Mobile, Right Panel for Desktop */}
            <AnimatePresence>
                {selectedProduct && (
                    <ProductModal
                        selectedProduct={selectedProduct}
                        closeProductModal={closeProductModal}
                        selectedModifiers={selectedModifiers}
                        handleModifierChange={handleModifierChange}
                        itemQuantity={itemQuantity}
                        setItemQuantity={setItemQuantity}
                        handleAddToCart={handleAddToCart}
                        calculateActiveTotal={calculateActiveTotal}
                        formatPrice={formatPrice}
                        getProductModifiers={getProductModifiers}
                        editingCartItemId={editingCartItemId}
                    />
                )}
            </AnimatePresence>

            {/* Cart Drawer */}
            <CartDrawer
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
                cartItems={cartItems}
                setCartItems={setCartItems}
                formatPrice={formatPrice}
                getProductModifiers={getProductModifiers}
                removeModifierFromCartItem={removeModifierFromCartItem}
                deliveryMode={deliveryMode}
            />

            {/* Floating Action Button (Cart) */}
            <AnimatePresence>
                {cartItems.length > 0 && !isCartOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCartOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 md:w-16 md:h-16 bg-cdh-orange rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(242,101,19,0.5)] z-40 text-white border-2 border-[#111]"
                    >
                        <ShoppingCart size={24} className="md:w-7 md:h-7" />
                        <div className="absolute -top-1 -right-1 bg-white text-cdh-orange text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-[#111]">
                            {cartItems.length}
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

        </div>
    );
}

export default Menu;
