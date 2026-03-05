import fs from 'fs';

let content = fs.readFileSync('./src/components/admin/PromosModule.jsx', 'utf8');

// 1. Add Supabase import
content = content.replace(
    `import { fetchOnlineCatalog, fetchOnlineCategories } from '../../services/fudoService';`,
    `import { fetchOnlineCatalog, fetchOnlineCategories } from '../../services/fudoService';\nimport { supabase } from '../../services/supabaseClient';`
);

// 2. Replace Load Initial Data useEffect (Lines 46-79)
const initialDataRegex = /\/\/ Load Initial Data[\s\S]*?loadFudoData\(\);\n    \}, \[\]\);/m;
const newInitialData = `// Load Initial Data
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
                applicableCategories: c.applicable_categories,
                applicableProducts: c.applicable_products,
                applicableDelivery: c.applicable_delivery,
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
    }, []);`;
content = content.replace(initialDataRegex, newInitialData);

// 3. Codes Handlers (handleCreateOrEditPromo, togglePromoStatus, deletePromo)
const savePromosRegex = /const savePromos = \(updatedPromos\) => {[\s\S]*?};\n/m;
content = content.replace(savePromosRegex, '');

content = content.replace(/const handleCreateOrEditPromo = \(e\) => {/, 'const handleCreateOrEditPromo = async (e) => {');

const promoDataRegex = /const promoData = {[\s\S]*?isSingleUse\n        };/m;
const newPromoData = `const isAll = selectedProducts.length === catalog.length;

        const promoDB = {
            code: newCode.toUpperCase().trim(),
            type: newType,
            value: parseFloat(newValue),
            applicable_categories: null,
            applicable_products: isAll ? null : selectedProducts,
            applicable_delivery: applicableDelivery,
            valid_from: validFrom || null,
            valid_until: validUntil || null,
            is_single_use: isSingleUse
        };`;

content = content.replace(/const isAll = selectedProducts\.length === catalog\.length;[\s\S]*?isSingleUse\n        };/m, newPromoData);

const promoSaveActionRegex = /if \(editingPromoId\) {[\s\S]*?setEditingPromoId\(null\);/m;
const newPromoSaveAction = `if (editingPromoId) {
            const { error } = await supabase.from('promos_codes').update(promoDB).eq('id', editingPromoId);
            if (error) { alert('Error actualizando: ' + error.message); return; }
        } else {
            const { error } = await supabase.from('promos_codes').insert([promoDB]);
            if (error) { alert('Error creando: ' + error.message); return; }
        }

        loadPromosData();
        setNewCode('');
        setPromoName('');
        setIsSingleUse(false);
        resetSharedForm();
        setIsCreatingPromo(false);
        setEditingPromoId(null);`;
content = content.replace(promoSaveActionRegex, newPromoSaveAction);

const togglePromoRegex = /const togglePromoStatus = \(id\) => {[\s\S]*?};/m;
const newTogglePromo = `const togglePromoStatus = async (id, currentStatus) => {
        await supabase.from('promos_codes').update({ is_active: !currentStatus }).eq('id', id);
        loadPromosData();
    };`;
content = content.replace(togglePromoRegex, newTogglePromo);
// Also update the onClick in UI for togglePromo
content = content.replace(/onClick=\{\(\) => togglePromoStatus\(promo\.id\)\}/g, "onClick={() => togglePromoStatus(promo.id, promo.isActive)}");

const deletePromoRegex = /const deletePromo = \(id\) => {[\s\S]*?};/m;
const newDeletePromo = `const deletePromo = async (id) => {
        if (window.confirm('¿Eliminar este código de descuento?')) {
            await supabase.from('promos_codes').delete().eq('id', id);
            loadPromosData();
        }
    };`;
content = content.replace(deletePromoRegex, newDeletePromo);

// 4. Auto Discounts Handlers
const saveAutoRegex = /const saveAuto = \(updatedAuto\) => {[\s\S]*?};\n/m;
content = content.replace(saveAutoRegex, '');

content = content.replace(/const handleCreateOrEditAuto = \(e\) => {/, 'const handleCreateOrEditAuto = async (e) => {');

const autoDataRegex = /const autoData = {[\s\S]*?validUntil \|\| null\n        };/m;
const newAutoData = `const isAll = selectedProducts.length === catalog.length;

        const autoDB = {
            internal_name: newAutoName.trim(),
            type: newType,
            value: parseFloat(newValue),
            applicable_categories: null,
            applicable_products: isAll ? null : selectedProducts,
            applicable_delivery: applicableDelivery,
            valid_from: validFrom || null,
            valid_until: validUntil || null
        };`;
content = content.replace(/const isAll = selectedProducts\.length === catalog\.length;[\s\S]*?validUntil \|\| null\n        };/m, newAutoData);

const autoSaveActionRegex = /if \(editingAutoId\) {[\s\S]*?setEditingAutoId\(null\);/m;
const newAutoSaveAction = `if (editingAutoId) {
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
        setEditingAutoId(null);`;
content = content.replace(autoSaveActionRegex, newAutoSaveAction);

const toggleAutoRegex = /const toggleAutoStatus = \(id\) => {[\s\S]*?};/m;
const newToggleAuto = `const toggleAutoStatus = async (id, currentStatus) => {
        await supabase.from('promos_auto').update({ is_active: !currentStatus }).eq('id', id);
        loadPromosData();
    };`;
content = content.replace(toggleAutoRegex, newToggleAuto);
content = content.replace(/onClick=\{\(\) => toggleAutoStatus\(auto\.id\)\}/g, "onClick={() => toggleAutoStatus(auto.id, auto.isActive)}");

const deleteAutoRegex = /const deleteAuto = \(id\) => {[\s\S]*?};/m;
const newDeleteAuto = `const deleteAuto = async (id) => {
        if (window.confirm('¿Eliminar este descuento automático?')) {
            await supabase.from('promos_auto').delete().eq('id', id);
            loadPromosData();
        }
    };`;
content = content.replace(deleteAutoRegex, newDeleteAuto);


// 5. Banners Handlers (Promoted Products)
const saveBannersRegex = /const saveBanners = \(updatedBanners\) => {[\s\S]*?};\n/m;
content = content.replace(saveBannersRegex, '');

content = content.replace(/const handleCreateOrEditBanner = \(e\) => {/, 'const handleCreateOrEditBanner = async (e) => {');

const bannerDataRegex = /const bannerData = {[\s\S]*?endDate \|\| null\n        };/m;
const newBannerData = `const bannerDB = {
            product_id: product.id.toString(),
            product_name: product.name,
            banner_name: bannerName.trim(),
            image_url: bannerImage.trim() || product.imageUrl || '',
            start_date: startDate || null,
            end_date: endDate || null
        };`;
content = content.replace(bannerDataRegex, newBannerData);

const bannerSaveActionRegex = /if \(editingBannerId\) {[\s\S]*?setEditingBannerId\(null\);/m;
const newBannerSaveAction = `if (editingBannerId) {
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
        setEditingBannerId(null);`;
content = content.replace(bannerSaveActionRegex, newBannerSaveAction);

const toggleBannerRegex = /const toggleBannerStatus = \(id\) => {[\s\S]*?};/m;
const newToggleBanner = `const toggleBannerStatus = async (id, currentStatus) => {
        await supabase.from('promos_banners').update({ is_active: !currentStatus }).eq('id', id);
        loadPromosData();
    };`;
content = content.replace(toggleBannerRegex, newToggleBanner);
content = content.replace(/onClick=\{\(\) => toggleBannerStatus\(banner\.id\)\}/g, "onClick={() => toggleBannerStatus(banner.id, banner.isActive)}");

const deleteBannerRegex = /const deleteBanner = \(id\) => {[\s\S]*?};/m;
const newDeleteBanner = `const deleteBanner = async (id) => {
        if (window.confirm('¿Dejar de promocionar este producto?')) {
            await supabase.from('promos_banners').delete().eq('id', id);
            loadPromosData();
        }
    };`;
content = content.replace(deleteBannerRegex, newDeleteBanner);

// Remove promoName UI from Codes tab
// promoName state can also be removed, but just removing the input field is safer for this script
const promoNameUIRegex = /<div>\s*<label className="block text-xs text-gray-400 uppercase font-bold mb-1">Nombre Interno \(Opcional\)[\s\S]*?<\/div>/m;
content = content.replace(promoNameUIRegex, '');

fs.writeFileSync('./src/components/admin/PromosModule.jsx', content, 'utf8');
console.log('PromosModule refactored successfully.');
