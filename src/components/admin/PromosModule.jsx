import React, { useState, useEffect } from 'react';
import { Tag, Plus, Check, X, Trash2, Percent, DollarSign, Image as ImageIcon, Calendar, Edit2, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchOnlineCatalog, fetchOnlineCategories } from '../../services/fudoService';
import { supabase } from '../../services/supabaseClient';

function PromosModule() {
    const [activeTab, setActiveTab] = useState('banners'); // 'banners' | 'codes' | 'auto'

    // -- Global Fudo Data --
    const [catalog, setCatalog] = useState([]);
    const [categories, setCategories] = useState([]);

    // -- Banners State (Promoted Products) --
    const [promotedProducts, setPromotedProducts] = useState([]);
    const [isCreatingBanner, setIsCreatingBanner] = useState(false);
    const [editingBannerId, setEditingBannerId] = useState(null);
    const [bannerName, setBannerName] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [bannerImage, setBannerImage] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // -- Shared Form State (Codes & Auto) --
    const [newType, setNewType] = useState('percentage');
    const [newValue, setNewValue] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState([]);
    const [applicableDelivery, setApplicableDelivery] = useState(['envio', 'retiro']);
    const [applicablePayment, setApplicablePayment] = useState(['efectivo', 'online']);
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');

    // -- Codes State --
    const [promos, setPromos] = useState([]);
    const [isCreatingPromo, setIsCreatingPromo] = useState(false);
    const [editingPromoId, setEditingPromoId] = useState(null);
    const [newCode, setNewCode] = useState('');
    const [promoName, setPromoName] = useState('');
    const [isSingleUse, setIsSingleUse] = useState(false);
    const [emailRestriction, setEmailRestriction] = useState('');

    // -- Auto Discounts State --
    const [autoDiscounts, setAutoDiscounts] = useState([]);
    const [isCreatingAuto, setIsCreatingAuto] = useState(false);
    const [editingAutoId, setEditingAutoId] = useState(null);
    const [newAutoName, setNewAutoName] = useState('');

    // Load Initial Data
    const loadPromosData = async () => {
        // Load Codes
        const { data: codes } = await supabase.from('promos_codes').select('*').order('created_at', { ascending: false });
        if (codes) {
            setPromos(codes.map(c => ({
                id: c.id,
                code: c.code,
                type: c.type,
                value: Number(c.value),
                isActive: c.is_active,
                validFrom: c.valid_from,
                validUntil: c.valid_until,
                isSingleUse: c.is_single_use,
                usageCount: c.usage_count,
                emailRestriction: c.email_restriction,
                applicableCategories: c.applicable_categories,
                applicableProducts: c.applicable_products,
                applicableDelivery: c.applicable_delivery,
                applicablePayment: c.applicable_payment || ['efectivo', 'online'],
                createdAt: c.created_at
            })));
        }

        // Load Auto Discounts
        const { data: autos } = await supabase.from('promos_auto').select('*').order('created_at', { ascending: false });
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
                applicableDelivery: a.applicable_delivery,
                applicablePayment: a.applicable_payment || ['efectivo', 'online'],
                createdAt: a.created_at
            })));
        }

        // Load Promoted Products
        const { data: banners } = await supabase.from('promos_banners').select('*').order('created_at', { ascending: false });
        if (banners) {
            setPromotedProducts(banners.map(b => ({
                id: b.id,
                productId: b.product_id,
                productName: b.product_name,
                bannerName: b.banner_name,
                imageUrl: b.image_url,
                isActive: b.is_active,
                startDate: b.start_date,
                endDate: b.end_date,
                createdAt: b.created_at
            })));
        }
    };

    useEffect(() => {
        loadPromosData();

        // Load Fudo Data
        const loadFudoData = async () => {
            try {
                const [catsData, catalogData] = await Promise.all([
                    fetchOnlineCategories(),
                    fetchOnlineCatalog()
                ]);
                setCategories(catsData || []);
                setCatalog(catalogData.products || []);
            } catch (error) {
                console.error("Error loading Fudo data", error);
            }
        };
        loadFudoData();
    }, []);

    // Helper to reset shared form
    const resetSharedForm = () => {
        setNewType('percentage');
        setNewValue('');
        setSelectedProducts(catalog.map(p => p.id));
        setExpandedCategories([]);
        setApplicableDelivery(['envio', 'retiro']);
        setApplicablePayment(['efectivo', 'online']);
        setValidFrom('');
        setValidUntil('');
        setEmailRestriction('');
    };

    // -- Codes Handlers --
    const handleCreateOrEditPromo = async (e) => {
        e.preventDefault();
        if (!newCode.trim() || !newValue) return;

        if (selectedProducts.length === 0) {
            alert('Debes seleccionar al menos un producto.');
            return;
        }

        const isAll = selectedProducts.length === catalog.length;

        const promoDB = {
            code: newCode.toUpperCase().trim(),
            type: newType,
            value: parseFloat(newValue),
            applicable_categories: null,
            applicable_products: isAll ? null : selectedProducts,
            applicable_delivery: applicableDelivery,
            applicable_payment: applicablePayment,
            valid_from: validFrom || null,
            valid_until: validUntil || null,
            is_single_use: isSingleUse,
            email_restriction: emailRestriction.trim() || null
        };

        if (editingPromoId) {
            const { error } = await supabase.from('promos_codes').update(promoDB).eq('id', editingPromoId);
            if (error) { alert('Error actualizando: ' + error.message); return; }
        } else {
            const { error } = await supabase.from('promos_codes').insert([promoDB]);
            if (error) { alert('Error creando: ' + error.message); return; }
        }

        loadPromosData();
        setNewCode('');
        setIsSingleUse(false);
        resetSharedForm();
        setIsCreatingPromo(false);
        setEditingPromoId(null);
    };

    const handleEditPromoClick = (promo) => {
        setActiveTab('codes');
        setIsCreatingPromo(true);
        setEditingPromoId(promo.id);

        setNewCode(promo.code);
        setNewType(promo.type);
        setNewValue(promo.value.toString());

        const isAll = !promo.applicableCategories && !promo.applicableProducts;
        if (isAll) {
            setSelectedProducts(catalog.map(p => p.id));
        } else {
            let ids = new Set(promo.applicableProducts || []);
            if (promo.applicableCategories) {
                catalog.forEach(p => {
                    if (promo.applicableCategories.includes(p.productCategoryId)) {
                        ids.add(p.id);
                    }
                });
            }
            setSelectedProducts(Array.from(ids));
        }

        setExpandedCategories([]);
        setApplicableDelivery(promo.applicableDelivery || ['envio', 'retiro']);
        setApplicablePayment(promo.applicablePayment || ['efectivo', 'online']);
        setValidFrom(promo.validFrom || '');
        setValidUntil(promo.validUntil || '');
        setIsSingleUse(promo.isSingleUse || false);
        setEmailRestriction(promo.emailRestriction || '');
    };

    const togglePromoStatus = async (id, currentStatus) => {
        await supabase.from('promos_codes').update({ is_active: !currentStatus }).eq('id', id);
        loadPromosData();
    };

    const deletePromo = async (id) => {
        if (window.confirm('¿Eliminar este código de descuento?')) {
            await supabase.from('promos_codes').delete().eq('id', id);
            loadPromosData();
        }
    };

    // -- Auto Discounts Handlers --

    const handleCreateOrEditAuto = async (e) => {
        e.preventDefault();
        if (!newAutoName.trim() || !newValue) return;

        if (selectedProducts.length === 0) {
            alert('Debes seleccionar al menos un producto.');
            return;
        }

        const isAll = selectedProducts.length === catalog.length;

        const autoDB = {
            internal_name: newAutoName.trim(),
            type: newType,
            value: parseFloat(newValue),
            applicable_categories: null,
            applicable_products: isAll ? null : selectedProducts,
            applicable_delivery: applicableDelivery,
            applicable_payment: applicablePayment,
            valid_from: validFrom || null,
            valid_until: validUntil || null
        };

        if (editingAutoId) {
            const { error } = await supabase.from('promos_auto').update(autoDB).eq('id', editingAutoId);
            if (error) { alert('Error actualizando: ' + error.message); return; }
        } else {
            const { error } = await supabase.from('promos_auto').insert([autoDB]);
            if (error) { alert('Error creando: ' + error.message); return; }
        }

        loadPromosData();
        setNewAutoName('');
        resetSharedForm();
        setIsCreatingAuto(false);
        setEditingAutoId(null);
    };

    const handleEditAutoClick = (auto) => {
        setActiveTab('auto');
        setIsCreatingAuto(true);
        setEditingAutoId(auto.id);

        setNewAutoName(auto.name);
        setNewType(auto.type);
        setNewValue(auto.value.toString());

        const isAll = !auto.applicableCategories && !auto.applicableProducts;
        if (isAll) {
            setSelectedProducts(catalog.map(p => p.id));
        } else {
            let ids = new Set(auto.applicableProducts || []);
            if (auto.applicableCategories) {
                catalog.forEach(p => {
                    if (auto.applicableCategories.includes(p.productCategoryId)) {
                        ids.add(p.id);
                    }
                });
            }
            setSelectedProducts(Array.from(ids));
        }

        setExpandedCategories([]);
        setApplicableDelivery(auto.applicableDelivery || ['envio', 'retiro']);
        setApplicablePayment(auto.applicablePayment || ['efectivo', 'online']);
        setValidFrom(auto.validFrom || '');
        setValidUntil(auto.validUntil || '');
    };

    const toggleAutoStatus = async (id, currentStatus) => {
        await supabase.from('promos_auto').update({ is_active: !currentStatus }).eq('id', id);
        loadPromosData();
    };

    const deleteAuto = async (id) => {
        if (window.confirm('¿Eliminar este descuento automático?')) {
            await supabase.from('promos_auto').delete().eq('id', id);
            loadPromosData();
        }
    };


    // -- Shared Product Tree Toggle Handlers --
    const toggleCategoryExpanded = (catId) => {
        setExpandedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const toggleProductSelected = (prodId) => {
        setSelectedProducts(prev =>
            prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
        );
    };

    const toggleDeliveryMode = (mode) => {
        setApplicableDelivery(prev =>
            prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
        );
    };

    const toggleCategorySelected = (catId) => {
        const catProducts = catalog.filter(p => p.productCategoryId === catId).map(p => p.id);
        const allSelected = catProducts.every(id => selectedProducts.includes(id));

        if (allSelected) {
            // Deselect all
            setSelectedProducts(prev => prev.filter(id => !catProducts.includes(id)));
        } else {
            // Select all
            setSelectedProducts(prev => {
                const newSet = new Set([...prev, ...catProducts]);
                return Array.from(newSet);
            });
        }
    };

    const isAllSelected = catalog.length > 0 && selectedProducts.length === catalog.length;

    const toggleAllSelected = () => {
        if (isAllSelected) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(catalog.map(p => p.id));
        }
    };

    // -- Banners Handlers --

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);

            // Validate file size (optional, e.g., max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('La imagen pesa más de 2MB. Por favor, sube una imagen más ligera.');
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('banners')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage.from('banners').getPublicUrl(filePath);

            if (data?.publicUrl) {
                setBannerImage(data.publicUrl);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error subiendo imagen: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateOrEditBanner = async (e) => {
        e.preventDefault();
        if (!selectedProductId) {
            alert('Debes seleccionar un producto del catálogo.');
            return;
        }

        const product = catalog.find(p => p.id.toString() === selectedProductId);
        if (!product) return;

        const bannerDB = {
            product_id: product.id.toString(),
            product_name: product.name,
            banner_name: bannerName.trim(),
            image_url: bannerImage.trim() || product.imageUrl || '',
            start_date: startDate || null,
            end_date: endDate || null
        };

        if (editingBannerId) {
            const { error } = await supabase.from('promos_banners').update(bannerDB).eq('id', editingBannerId);
            if (error) { alert('Error actualizando: ' + error.message); return; }
        } else {
            const { error } = await supabase.from('promos_banners').insert([bannerDB]);
            if (error) { alert('Error creando: ' + error.message); return; }
        }

        loadPromosData();
        setSelectedProductId('');
        setBannerName('');
        setStartDate('');
        setEndDate('');
        setBannerImage('');
        setIsCreatingBanner(false);
        setEditingBannerId(null);
    };

    const handleEditBannerClick = (banner) => {
        setActiveTab('banners');
        setIsCreatingBanner(true);
        setEditingBannerId(banner.id);

        setBannerName(banner.bannerName || '');
        setSelectedProductId(banner.productId.toString());
        setBannerImage(banner.imageUrl || '');
        setStartDate(banner.startDate || '');
        setEndDate(banner.endDate || '');
    };

    const toggleBannerStatus = async (id, currentStatus) => {
        await supabase.from('promos_banners').update({ is_active: !currentStatus }).eq('id', id);
        loadPromosData();
    };

    const deleteBanner = async (id) => {
        if (window.confirm('¿Dejar de promocionar este producto?')) {
            await supabase.from('promos_banners').delete().eq('id', id);
            loadPromosData();
        }
    };

    const renderDatesAndDelivery = () => (
        <div className="space-y-3">
            <div>
                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">Vigencia</label>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="date"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-cdh-orange text-xs"
                        style={{ colorScheme: 'dark' }}
                    />
                    <input
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-cdh-orange text-xs"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Opcional. Dejar vacío para que no caduque.</p>
            </div>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-3">
                {/* Method of Delivery */}
                <div>
                    <label className="block text-xs text-white font-bold mb-2">Aplica para método de entrega</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${applicableDelivery.includes('envio') ? 'bg-cdh-orange' : 'bg-black border border-white/20 group-hover:border-white/40'}`}>
                                {applicableDelivery.includes('envio') && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Envío a Domicilio</span>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={applicableDelivery.includes('envio')}
                                onChange={() => toggleDeliveryMode('envio')}
                            />
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${applicableDelivery.includes('retiro') ? 'bg-cdh-orange' : 'bg-black border border-white/20 group-hover:border-white/40'}`}>
                                {applicableDelivery.includes('retiro') && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Retiro en Local</span>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={applicableDelivery.includes('retiro')}
                                onChange={() => toggleDeliveryMode('retiro')}
                            />
                        </label>
                    </div>
                </div>

                <div className="w-full h-px bg-white/10 my-1"></div>

                {/* Method of Payment */}
                <div>
                    <label className="block text-xs text-white font-bold mb-1">Aplica para método de pago</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${applicablePayment.includes('efectivo') ? 'bg-cdh-orange' : 'bg-black border border-white/20 group-hover:border-white/40'}`}>
                                {applicablePayment.includes('efectivo') && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Efectivo</span>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={applicablePayment.includes('efectivo')}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setApplicablePayment([...applicablePayment, 'efectivo']);
                                    } else {
                                        setApplicablePayment(applicablePayment.filter(type => type !== 'efectivo'));
                                    }
                                }}
                            />
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${applicablePayment.includes('online') ? 'bg-cdh-orange' : 'bg-black border border-white/20 group-hover:border-white/40'}`}>
                                {applicablePayment.includes('online') && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Pago Online</span>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={applicablePayment.includes('online')}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setApplicablePayment([...applicablePayment, 'online']);
                                    } else {
                                        setApplicablePayment(applicablePayment.filter(type => type !== 'online'));
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProductTree = () => (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 font-sans h-full shadow-inner flex flex-col max-h-[500px] lg:max-h-full">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Productos Disponibles</h3>
                <button
                    type="button"
                    onClick={toggleAllSelected}
                    className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-white transition-colors"
                >
                    {isAllSelected ? "Ninguno" : "Todos"}
                    <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${isAllSelected ? 'bg-cdh-orange border-cdh-orange text-white shadow-[0_0_10px_rgba(242,101,19,0.5)]' : 'bg-black/50 border-white/10 text-transparent hover:bg-white/5'}`}>
                        <Check size={10} strokeWidth={4} />
                    </div>
                </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {categories.map(cat => {
                    const catProducts = catalog.filter(p => p.productCategoryId === cat.id);
                    if (catProducts.length === 0) return null;

                    const selectedCount = catProducts.filter(p => selectedProducts.includes(p.id)).length;
                    const totalCount = catProducts.length;
                    const isExpanded = expandedCategories.includes(cat.id);

                    return (
                        <div key={cat.id} className="overflow-hidden bg-black/30 rounded-lg border border-white/5">
                            <div
                                className="flex items-center justify-between p-3 cursor-pointer group hover:bg-white/5 transition-colors"
                                onClick={() => toggleCategoryExpanded(cat.id)}
                            >
                                <div
                                    className="font-bold text-sm text-gray-200 flex items-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCategorySelected(cat.id);
                                    }}
                                >
                                    <span className="group-hover:text-white transition-colors">{cat.name}</span>
                                    <span className="text-cdh-orange font-black text-xs bg-cdh-orange/10 px-1.5 py-0.5 rounded">({selectedCount}/{totalCount})</span>
                                </div>
                                <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-3 pt-0 space-y-2 bg-black/20">
                                    {catProducts.map(prod => {
                                        const isProdSelected = selectedProducts.includes(prod.id);
                                        return (
                                            <label key={prod.id} className="flex items-center gap-2 cursor-pointer group w-fit">
                                                <input
                                                    type="checkbox"
                                                    checked={isProdSelected}
                                                    onChange={() => toggleProductSelected(prod.id)}
                                                    className="w-3.5 h-3.5 accent-cdh-orange rounded bg-black/50 border-white/20 cursor-pointer"
                                                />
                                                <span className={`text-xs transition-colors ${isProdSelected ? 'font-bold text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{prod.name}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <Tag className="text-cdh-orange" size={32} />
                    Promociones
                </h1>

                {/* Tabs */}
                <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/5 w-full md:w-auto overflow-hidden">
                    <button
                        onClick={() => setActiveTab('banners')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all ${activeTab === 'banners' ? 'bg-[#222] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white'}`}
                    >
                        <ImageIcon size={14} className={activeTab === 'banners' ? 'text-cdh-orange' : ''} />
                        Banners
                    </button>
                    <button
                        onClick={() => setActiveTab('auto')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all ${activeTab === 'auto' ? 'bg-[#222] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Zap size={14} className={activeTab === 'auto' ? 'text-cdh-orange' : ''} />
                        Automáticos
                    </button>
                    <button
                        onClick={() => setActiveTab('codes')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all ${activeTab === 'codes' ? 'bg-[#222] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Percent size={14} className={activeTab === 'codes' ? 'text-cdh-orange' : ''} />
                        Códigos
                    </button>
                </div>
            </div>

            {/* TAB: BANNERS (Productos Promocionados) */}
            {activeTab === 'banners' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Productos Destacados</h2>
                        <button
                            onClick={() => setIsCreatingBanner(!isCreatingBanner)}
                            className="bg-cdh-orange hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(242,101,19,0.3)] whitespace-nowrap"
                        >
                            {isCreatingBanner ? <X size={20} /> : <Plus size={20} />}
                            <span className="hidden sm:inline">{isCreatingBanner ? 'Cancelar' : 'Destacar Producto'}</span>
                            <span className="sm:hidden">{isCreatingBanner ? 'Cancelar' : 'Nuevo'}</span>
                        </button>
                    </div>

                    {isCreatingBanner && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-[#1a1a1a] border border-cdh-orange/30 rounded-xl p-8 shadow-2xl w-full max-w-4xl max-h-[105vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200" style={{ transform: 'scale(0.90)' }}>
                                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">Destacar en Banner</h2>
                                    <button onClick={() => setIsCreatingBanner(false)} type="button" className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateOrEditBanner} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Nombre de la Campaña</label>
                                        <input
                                            type="text"
                                            value={bannerName}
                                            onChange={(e) => setBannerName(e.target.value)}
                                            placeholder="Ej: Promo CyberMonday"
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cdh-orange"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Producto del Catálogo</label>
                                        <select
                                            value={selectedProductId}
                                            onChange={(e) => setSelectedProductId(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cdh-orange"
                                            required
                                        >
                                            <option value="">Selecciona un producto...</option>
                                            {catalog.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Imagen (Subir Archivo o URL)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={bannerImage}
                                                onChange={(e) => setBannerImage(e.target.value)}
                                                placeholder="URL de imagen"
                                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cdh-orange"
                                                disabled={isUploading}
                                            />
                                            <label className={`bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-4 flex items-center justify-center cursor-pointer transition-colors text-xs font-bold text-white shrink-0 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                                                {isUploading ? 'Subiendo...' : 'Subir'}
                                            </label>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Recomendado: Formato panorámico ancho (ej: 800x300px o proporción 26:6).</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Mostrar Desde (Opcional)</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cdh-orange"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Mostrar Hasta (Opcional)</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cdh-orange"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>

                                    <div className="md:col-span-2 mt-2">
                                        <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-wider py-3 rounded-lg hover:bg-gray-200 transition-colors">
                                            {editingBannerId ? 'Guardar Cambios' : 'Guardar Promoción'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-x-auto shadow-lg custom-scrollbar">
                        {promotedProducts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 uppercase font-bold text-sm">
                                No hay productos promocionados activos.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-black/40 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                                        <th className="p-4 font-bold">Producto</th>
                                        <th className="p-4 font-bold">Vigencia</th>
                                        <th className="p-4 font-bold text-center">Mostrar</th>
                                        <th className="p-4 font-bold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotedProducts.map(banner => (
                                        <tr key={banner.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 font-bold text-white">
                                                {banner.bannerName && <div className="text-xs text-gray-400 font-bold mb-1">{banner.bannerName}</div>}
                                                <div className="flex items-center gap-3">
                                                    {banner.imageUrl ? (
                                                        <img src={banner.imageUrl} alt={banner.productName} className="w-10 h-10 object-cover rounded bg-white/5" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center shrink-0">
                                                            <ImageIcon size={20} className="text-gray-500" />
                                                        </div>
                                                    )}
                                                    <span>{banner.productName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-400">
                                                {!banner.startDate && !banner.endDate ? 'Siempre Activo' : (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : 'Ayer'} - {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : 'Siempre'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => toggleBannerStatus(banner.id, banner.isActive)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${banner.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                                                >
                                                    {banner.isActive ? 'Activo' : 'Oculto'}
                                                </button>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleEditBannerClick(banner)}
                                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteBanner(banner.id)}
                                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: AUTO DISCOUNTS */}
            {activeTab === 'auto' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Descuentos Automáticos</h2>
                            <p className="text-xs text-gray-400 mt-1">Se aplican directamente al precio en el menú.</p>
                        </div>
                        <button
                            onClick={() => {
                                setIsCreatingAuto(!isCreatingAuto);
                                if (isCreatingAuto) {
                                    setEditingAutoId(null);
                                    resetSharedForm();
                                    setNewAutoName('');
                                }
                            }}
                            className="bg-cdh-orange hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(242,101,19,0.3)] whitespace-nowrap"
                        >
                            {isCreatingAuto ? <X size={20} /> : <Plus size={20} />}
                            <span className="hidden sm:inline">{isCreatingAuto ? 'Cancelar' : 'Nuevo Automático'}</span>
                            <span className="sm:hidden">{isCreatingAuto ? 'Cancelar' : 'Nuevo'}</span>
                        </button>
                    </div>

                    {/* Creation Form (Auto) */}
                    {isCreatingAuto && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                            <div className="bg-[#1a1a1a] border border-cdh-orange/30 rounded-xl p-4 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200" style={{ transform: 'scale(1)' }}>
                                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                                    <h2 className="text-lg font-bold text-white uppercase tracking-wider flex-1">
                                        {editingAutoId ? 'Editar Descuento Automático' : 'Crear Descuento Automático'}
                                    </h2>
                                    <button onClick={() => setIsCreatingAuto(false)} type="button" className="text-gray-400 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-lg shrink-0">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateOrEditAuto} className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                                    {/* Left Column: Data */}
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">Nombre (Uso Interno)</label>
                                            <input
                                                type="text"
                                                value={newAutoName}
                                                onChange={(e) => setNewAutoName(e.target.value)}
                                                placeholder="Ej: Promo CyberMonday"
                                                className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-cdh-orange text-sm"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">Tipo</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewType('percentage')}
                                                        className={`p-2 rounded-md border flex justify-center items-center transition-colors ${newType === 'percentage' ? 'bg-cdh-orange/20 border-cdh-orange text-cdh-orange' : 'bg-black/50 border-white/10 text-gray-400 hover:text-white'}`}
                                                    >
                                                        <Percent size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewType('fixed')}
                                                        className={`p-2 rounded-md border flex justify-center items-center transition-colors ${newType === 'fixed' ? 'bg-cdh-orange/20 border-cdh-orange text-cdh-orange' : 'bg-black/50 border-white/10 text-gray-400 hover:text-white'}`}
                                                    >
                                                        <DollarSign size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">Valor</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={newValue}
                                                    onChange={(e) => setNewValue(e.target.value)}
                                                    placeholder="10"
                                                    className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-cdh-orange text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {renderDatesAndDelivery()}
                                    </div>

                                    {/* Right Column: Products */}
                                    <div className="h-full">
                                        {renderProductTree()}
                                    </div>

                                    {/* Full Width Action */}
                                    <div className="lg:col-span-2 pt-3 border-t border-white/10 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingAuto(false)}
                                            className="px-5 py-2.5 text-gray-400 hover:text-white font-bold text-sm transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-cdh-orange hover:bg-orange-600 text-white font-black px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(242,101,19,0.3)] min-w-[160px] text-sm uppercase tracking-wider"
                                        >
                                            {editingAutoId ? 'Guardar Cambios' : 'Crear Descuento'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Auto Discounts List */}
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-x-auto shadow-lg custom-scrollbar">
                        {autoDiscounts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 uppercase font-bold text-sm">
                                No hay descuentos automáticos creados.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-black/40 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                                        <th className="p-4 font-bold">Nombre</th>
                                        <th className="p-4 font-bold">Valor</th>
                                        <th className="p-4 font-bold">Reglas</th>
                                        <th className="p-4 font-bold text-center">Estado</th>
                                        <th className="p-4 font-bold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {autoDiscounts.map(auto => (
                                        <tr key={auto.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors relative group">
                                            <td className="p-4">
                                                <span className="font-bold text-white text-sm md:text-base">
                                                    {auto.name}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-cdh-orange whitespace-nowrap">
                                                {auto.type === 'percentage' ? `${auto.value}% OFF` : `$${auto.value} OFF`}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-[10px] md:text-xs text-gray-400 space-y-1">
                                                    {(auto.validFrom || auto.validUntil) && (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-300">Vigencia:</span>
                                                            <span>{auto.validFrom ? new Date(auto.validFrom).toLocaleDateString() : 'Siempre'} - {auto.validUntil ? new Date(auto.validUntil).toLocaleDateString() : 'Siempre'}</span>
                                                        </div>
                                                    )}
                                                    {auto.applicableCategories && auto.applicableCategories.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-gray-300">Cat:</span>
                                                            <span className="bg-white/5 px-1 py-0.5 rounded">{auto.applicableCategories.length} cat.</span>
                                                        </div>
                                                    )}
                                                    {auto.applicableProducts && auto.applicableProducts.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-gray-300">Prod:</span>
                                                            <span className="bg-white/5 px-1 py-0.5 rounded">{auto.applicableProducts.length} prod.</span>
                                                        </div>
                                                    )}
                                                    {auto.applicableDelivery && auto.applicableDelivery.length > 0 && auto.applicableDelivery.length < 2 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-gray-300">Entrega:</span>
                                                            <span className="bg-white/5 px-1 py-0.5 rounded capitalize">{auto.applicableDelivery.join(', ')}</span>
                                                        </div>
                                                    )}
                                                    {auto.applicablePayment && auto.applicablePayment.length > 0 && auto.applicablePayment.length < 2 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-gray-300">Pago:</span>
                                                            <span className="bg-white/5 px-1 py-0.5 rounded capitalize">{auto.applicablePayment.join(', ')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {/* Toggle Switch Design for Claro On/Off */}
                                                <button
                                                    onClick={() => toggleAutoStatus(auto.id, auto.isActive)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${auto.isActive ? 'bg-cdh-orange' : 'bg-gray-600'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${auto.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                                <div className={`text-[10px] font-bold mt-1 ${auto.isActive ? 'text-cdh-orange' : 'text-gray-500'}`}>
                                                    {auto.isActive ? 'ACTIVO' : 'INACTIVO'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditAutoClick(auto)}
                                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteAuto(auto.id)}
                                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: CODES (Códigos de Descuento) */}
            {activeTab === 'codes' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Códigos Activos</h2>
                        <button
                            onClick={() => {
                                setIsCreatingPromo(!isCreatingPromo);
                                if (isCreatingPromo) {
                                    setEditingPromoId(null);
                                    resetSharedForm();
                                    setNewCode('');
                                    setPromoName('');
                                    setIsSingleUse(false);
                                }
                            }}
                            className="bg-cdh-orange hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(242,101,19,0.3)] whitespace-nowrap"
                        >
                            {isCreatingPromo ? <X size={20} /> : <Plus size={20} />}
                            <span className="hidden sm:inline">{isCreatingPromo ? 'Cancelar' : 'Nuevo Código'}</span>
                            <span className="sm:hidden">{isCreatingPromo ? 'Cancelar' : 'Nuevo'}</span>
                        </button>
                    </div>

                    {/* Creation Form (Codes) */}
                    {isCreatingPromo && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                            <div className="bg-[#1a1a1a] border border-cdh-orange/30 rounded-xl p-4 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200" style={{ transform: 'scale(1)' }}>
                                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                                    <h2 className="text-lg font-bold text-white uppercase tracking-wider flex-1">
                                        {editingPromoId ? 'Editar Cupón de Descuento' : 'Crear Cupón de Descuento'}
                                    </h2>
                                    <button onClick={() => setIsCreatingPromo(false)} type="button" className="text-gray-400 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-lg shrink-0">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateOrEditPromo} className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                                    {/* Left Column: Data */}
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">Nombre (Uso Interno)</label>
                                                <input
                                                    type="text"
                                                    value={promoName}
                                                    onChange={(e) => setPromoName(e.target.value)}
                                                    placeholder="Ej: Promo CyberMonday"
                                                    className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-cdh-orange text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">Código (Ej: VERANO20)</label>
                                                <input
                                                    type="text"
                                                    value={newCode}
                                                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                                    placeholder="EJEMPLO123"
                                                    className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-cdh-orange uppercase text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">Tipo</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewType('percentage')}
                                                        className={`p-2 rounded-md border flex justify-center items-center transition-colors ${newType === 'percentage' ? 'bg-cdh-orange/20 border-cdh-orange text-cdh-orange' : 'bg-black/50 border-white/10 text-gray-400 hover:text-white'}`}
                                                    >
                                                        <Percent size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewType('fixed')}
                                                        className={`p-2 rounded-md border flex justify-center items-center transition-colors ${newType === 'fixed' ? 'bg-cdh-orange/20 border-cdh-orange text-cdh-orange' : 'bg-black/50 border-white/10 text-gray-400 hover:text-white'}`}
                                                    >
                                                        <DollarSign size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">Valor</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={newValue}
                                                    onChange={(e) => setNewValue(e.target.value)}
                                                    placeholder="10"
                                                    className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-cdh-orange text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {renderDatesAndDelivery()}

                                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-3">
                                            <div className="flex flex-col gap-1.5">
                                                <div>
                                                    <label className="block text-xs text-white font-bold mb-0.5">Restricción por Email (Opcional)</label>
                                                    <p className="text-[10px] text-gray-500 leading-tight">Solo este correo podrá usar el cupón en el Checkout.</p>
                                                </div>
                                                <input
                                                    type="email"
                                                    value={emailRestriction}
                                                    onChange={(e) => setEmailRestriction(e.target.value)}
                                                    placeholder="ejemplo@correo.com"
                                                    className="w-full bg-black/50 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-cdh-orange text-sm"
                                                />
                                            </div>
                                            <div className="w-full h-px bg-white/10 my-1"></div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <label className="block text-xs text-white font-bold mb-0.5">Límite de Uso</label>
                                                    <p className="text-[10px] text-gray-500 leading-tight">Cupón de 1 solo uso globalmente.</p>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                                                    <div className={`w-10 h-5 rounded-full transition-colors relative ${isSingleUse ? 'bg-cdh-orange' : 'bg-black/50 group-hover:bg-white/10 border border-white/20'}`}>
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isSingleUse ? 'left-5' : 'left-0.5'}`}></div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={isSingleUse}
                                                        onChange={(e) => setIsSingleUse(e.target.checked)}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Products */}
                                    <div className="h-full">
                                        {renderProductTree()}
                                    </div>

                                    {/* Full Width Action */}
                                    <div className="lg:col-span-2 pt-3 border-t border-white/10 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingPromo(false)}
                                            className="px-5 py-2.5 text-gray-400 hover:text-white font-bold text-sm transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-cdh-orange hover:bg-orange-600 text-white font-black px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(242,101,19,0.3)] min-w-[160px] text-sm uppercase tracking-wider"
                                        >
                                            {editingPromoId ? 'Guardar Cambios' : 'Crear Cupón'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Promos List */}
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-x-auto shadow-lg custom-scrollbar">
                        {promos.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 uppercase font-bold text-sm">
                                No hay códigos de descuento creados.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-black/40 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                                        <th className="p-4 font-bold">Código</th>
                                        <th className="p-4 font-bold">Descuento</th>
                                        <th className="p-4 font-bold">Reglas</th>
                                        <th className="p-4 font-bold text-center">Usos</th>
                                        <th className="p-4 font-bold text-center">Estado</th>
                                        <th className="p-4 font-bold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promos.map(promo => (
                                        <tr key={promo.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors relative group">
                                            <td className="p-4">
                                                {promo.name && <div className="text-xs text-gray-400 font-bold mb-1">{promo.name}</div>}
                                                <span className="font-black text-white text-base md:text-lg tracking-widest bg-black/50 px-2 py-1 rounded border border-white/5 whitespace-nowrap">
                                                    {promo.code}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-cdh-orange whitespace-nowrap">
                                                {promo.type === 'percentage' ? `${promo.value}% OFF` : `$${promo.value} OFF`}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-[10px] md:text-xs text-gray-400 space-y-1 mt-1">
                                                    {(promo.validFrom || promo.validUntil) && (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-300">Vigencia:</span>
                                                            <span>{promo.validFrom ? new Date(promo.validFrom).toLocaleDateString() : 'Siempre'} - {promo.validUntil ? new Date(promo.validUntil).toLocaleDateString() : 'Siempre'}</span>
                                                        </div>
                                                    )}
                                                    {promo.applicableCategories && promo.applicableCategories.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-gray-300">Cat:</span>
                                                            <span className="bg-white/5 px-1 py-0.5 rounded">{promo.applicableCategories.length} cat.</span>
                                                        </div>
                                                    )}
                                                    {promo.applicableProducts && promo.applicableProducts.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-gray-300">Prod:</span>
                                                            <span className="bg-white/5 px-1 py-0.5 rounded">{promo.applicableProducts.length} prod.</span>
                                                        </div>
                                                    )}
                                                    {promo.applicableDelivery && promo.applicableDelivery.length > 0 && promo.applicableDelivery.length < 2 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-gray-300">Entrega:</span>
                                                            <span className="bg-white/5 px-1 py-0.5 rounded capitalize">{promo.applicableDelivery.join(', ')}</span>
                                                        </div>
                                                    )}
                                                    {promo.applicablePayment && promo.applicablePayment.length > 0 && promo.applicablePayment.length < 2 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-gray-300">Pago:</span>
                                                            <span className="bg-white/5 px-1 py-0.5 rounded capitalize">{promo.applicablePayment.join(', ')}</span>
                                                        </div>
                                                    )}
                                                    {promo.isSingleUse && (
                                                        <span className="inline-block bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[9px] mt-1 font-bold border border-red-500/30 mr-1">1 USO MAX</span>
                                                    )}
                                                    {promo.emailRestriction && (
                                                        <span className="inline-block bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[9px] mt-1 font-bold border border-blue-500/30 truncate max-w-[120px]" title={promo.emailRestriction}>
                                                            SOLO: {promo.emailRestriction}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-bold text-white">
                                                {promo.usageCount || 0}
                                            </td>
                                            <td className="p-4 text-center">
                                                {/* Toggle Switch Design for Claro On/Off */}
                                                <button
                                                    onClick={() => togglePromoStatus(promo.id, promo.isActive)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${promo.isActive ? 'bg-cdh-orange' : 'bg-gray-600'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promo.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                                <div className={`text-[10px] font-bold mt-1 ${promo.isActive ? 'text-cdh-orange' : 'text-gray-500'}`}>
                                                    {promo.isActive ? 'ACTIVO' : 'INACTIVO'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditPromoClick(promo)}
                                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deletePromo(promo.id)}
                                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

export default PromosModule;
