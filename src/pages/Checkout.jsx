import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Store, CreditCard, Banknote, CheckCircle, X, Mail } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import heroBg from '../assets/hero-bg.jpg';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();

    // Recibimos los items y la modalidad por state, o los cargamos de localStorage si se refrescó la página
    const [cartItems] = useState(() => {
        if (location.state?.cartItems) return location.state.cartItems;
        const saved = localStorage.getItem('cdh_cart');
        return saved ? JSON.parse(saved) : [];
    });

    const [deliveryMode, setDeliveryMode] = useState(() => {
        if (location.state?.deliveryMode) return location.state.deliveryMode;
        const saved = localStorage.getItem('cdh_delivery_mode');
        return saved ? saved : 'retiro';
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(price);
    };

    const [customerFirstName, setCustomerFirstName] = useState('');
    const [customerLastName, setCustomerLastName] = useState('');
    const [customerPhonePrefix, setCustomerPhonePrefix] = useState('+54');
    const [customerPhoneLocal, setCustomerPhoneLocal] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerNotes, setCustomerNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo'); // 'efectivo' | 'mercadopago'
    const [isSubmitting, setIsSubmitting] = useState(false);

    // -- Scheduling State --
    const [storeHours, setStoreHours] = useState(null);
    const [scheduleMode, setScheduleMode] = useState('immediato'); // 'immediato' | 'programado'
    const [scheduledTime, setScheduledTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [isStoreOpen, setIsStoreOpen] = useState(true);

    // -- Google Maps & Delivery API State --
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });
    const [deliverySettings, setDeliverySettings] = useState(null);
    const [deliveryCost, setDeliveryCost] = useState(0);
    const [deliveryError, setDeliveryError] = useState('');
    const autocompleteRef = React.useRef(null);

    const [paymentSettings, setPaymentSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: dData } = await supabase.from('delivery_settings').select('*').eq('id', 1).single();
            if (dData) setDeliverySettings(dData);

            const { data: pData } = await supabase.from('payment_settings').select('*').eq('id', 1).single();
            if (pData) setPaymentSettings(pData);

            const { data: hData } = await supabase.from('store_hours').select('*').eq('id', 1).single();
            if (hData) setStoreHours(hData);
        };
        fetchSettings();
    }, []);

    // Generate time slots based on store hours
    useEffect(() => {
        if (!storeHours) return;

        const now = new Date();
        const currentDay = now.getDay();

        const generateSlotsForShift = (startStr, endStr) => {
            const slots = [];
            let current = new Date(now);
            const [sHours, sMins] = startStr.split(':');
            current.setHours(parseInt(sHours, 10), parseInt(sMins, 10), 0, 0);

            const end = new Date(now);
            const [eHours, eMins] = endStr.split(':');
            end.setHours(parseInt(eHours, 10), parseInt(eMins, 10), 0, 0);

            if (end < current) end.setDate(end.getDate() + 1);

            while (current <= end) {
                if (current.getTime() > now.getTime() + 1000 * 60 * 30) {
                    const timeStr = current.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
                    slots.push(timeStr);
                }
                current.setMinutes(current.getMinutes() + 15);
            }
            return slots;
        };

        let isOpen = false;
        let allSlots = [];
        const shifts = storeHours.shifts || [];

        if (storeHours.is_open_today) {
            shifts.forEach(shift => {
                if (shift.is_active === false) return;
                const shiftDays = shift.open_days || [];
                if (shiftDays.includes(currentDay)) {
                    const startTime = deliveryMode === 'envio' ? shift.delivery_start_time : shift.pickup_start_time;
                    const endTime = deliveryMode === 'envio' ? shift.delivery_end_time : shift.pickup_end_time;

                    if (startTime && endTime) {
                        const shiftSlots = generateSlotsForShift(startTime, endTime);
                        allSlots = [...allSlots, ...shiftSlots];

                        const sTime = new Date(now);
                        const [sH, sM] = startTime.split(':');
                        sTime.setHours(parseInt(sH, 10), parseInt(sM, 10), 0, 0);

                        const eTime = new Date(now);
                        const [eH, eM] = endTime.split(':');
                        eTime.setHours(parseInt(eH, 10), parseInt(eM, 10), 0, 0);
                        if (eTime < sTime) eTime.setDate(eTime.getDate() + 1);

                        if (now >= sTime && now <= eTime) {
                            isOpen = true;
                        }
                    }
                }
            });
        }

        // Deduplicate and sort slots
        allSlots = [...new Set(allSlots)].sort();

        setIsStoreOpen(isOpen);

        if (!isOpen) {
            setScheduleMode('programado');
        } else {
            setScheduleMode('immediato');
            setScheduledTime('');
        }

        setAvailableSlots(allSlots);
        if (allSlots.length > 0 && !isOpen) {
            setScheduledTime(allSlots[0]); // Seleccionar primero automátcamente
        }
    }, [storeHours, deliveryMode]);

    const handlePlaceChanged = () => {
        if (!autocompleteRef.current) return;
        const place = autocompleteRef.current.getPlace();

        if (!place.geometry) {
            setCustomerAddress(place.name || '');
            return;
        }

        const address = place.formatted_address || place.name;
        setCustomerAddress(address);

        if (deliverySettings && deliverySettings.is_active) {
            calculateDeliveryCost(address);
        }
    };

    /**
     * Calcula el costo de envío dependiendo de la dirección ingresada.
     * 1. Primero intenta usar la API de PedidosYa (si está activa y configurada).
     * 2. Si PedidosYa falla o no está activo, usa Google Maps Distance Matrix como respaldo
     *    escalonando el precio por cada kilómetro adicional a la base.
     */
    const calculateDeliveryCost = async (destinationAddress) => {
        setDeliveryError('');
        setDeliveryCost(0);

        if (!window.google) return;

        let destLat = null;
        let destLng = null;
        // Extraemos lat, lng de Google Places
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place && place.geometry && place.geometry.location) {
                destLat = place.geometry.location.lat();
                destLng = place.geometry.location.lng();
            }
        }

        // 1. Intentar PedidosYa Logistics si está activo
        if (deliverySettings?.peya_active && deliverySettings?.peya_token && destLat && destLng) {
            try {
                const response = await fetch('/api/peya-estimate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originLat: deliverySettings.origin_lat || -41.1334722,
                        originLng: deliverySettings.origin_lng || -71.3102778,
                        destinationAddressStr: destinationAddress,
                        destLat: destLat,
                        destLng: destLng,
                        peyaToken: deliverySettings.peya_token
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.price) {
                        setDeliveryCost(data.price);
                        return; // Éxito con PeYa, no seguimos con el fallback
                    }
                } else {
                    console.warn("PeYa Estimate API call failed. Status:", response.status);
                }
            } catch (err) {
                console.error("Error contactando PeYa API, aplicando fallback a Distance Matrix", err);
            }
        }

        // 2. Fallback: Distancia propia con Google Maps
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix({
            origins: [deliverySettings?.origin_address || '24 de Septiembre 210, San Carlos de Bariloche, Río Negro, Argentina'],
            destinations: [destinationAddress],
            travelMode: window.google.maps.TravelMode.DRIVING,
        }, (response, status) => {
            if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
                const distanceMeters = response.rows[0].elements[0].distance.value;
                const distanceKm = distanceMeters / 1000;

                if (distanceKm > deliverySettings.max_distance_km) {
                    setDeliveryError(`La dirección excede nuestro radio máximo de envío (${deliverySettings.max_distance_km}km). Distancia: ${distanceKm.toFixed(1)}km`);
                } else {
                    const price = deliverySettings.base_price + (Math.floor(distanceKm) * deliverySettings.price_per_km);
                    setDeliveryCost(price);
                }
            } else {
                setDeliveryError('No pudimos calcular la distancia a esta dirección. Por favor, verificá que esté correcta.');
            }
        });
    };

    // -- OTP Verification State --
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    // -- Promo Code State --
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoError, setPromoError] = useState('');

    /**
     * Maneja la lógica de validación y aplicación de cupones de descuento.
     * Revisa: existencia, estado activo, restricciones de email,
     * fechas de vigencia, límites de 1 solo uso, modalidad de entrega permitida,
     * y método de pago (Efectivo/Online) permitido.
     */
    const handleApplyPromo = async () => {
        setPromoError('');
        if (!promoCodeInput.trim()) return;

        const { data: promoData, error } = await supabase
            .from('promos_codes')
            .select('*')
            .eq('code', promoCodeInput.trim().toUpperCase())
            .single();

        if (error || !promoData || !promoData.is_active) {
            setPromoError('Código inválido o inactivo.');
            return;
        }

        const promo = {
            id: promoData.id,
            code: promoData.code,
            type: promoData.type,
            value: Number(promoData.value),
            isActive: promoData.is_active,
            validFrom: promoData.valid_from,
            validUntil: promoData.valid_until,
            isSingleUse: promoData.is_single_use,
            usageCount: promoData.usage_count,
            applicableCategories: promoData.applicable_categories,
            applicableProducts: promoData.applicable_products,
            applicableDelivery: promoData.applicable_delivery,
            applicablePayment: promoData.applicable_payment,
            emailRestriction: promoData.email_restriction
        };

        // Check Email Restriction 
        if (promo.emailRestriction) {
            const currentEmail = customerEmail.trim().toLowerCase();
            if (!currentEmail) {
                setPromoError('Ingresá tu correo electrónico en el formulario para validar este código.');
                return;
            }
            if (currentEmail !== promo.emailRestriction.trim().toLowerCase()) {
                setPromoError(`Este código solo es válido para un usuario específico.`);
                return;
            }
        }

        // Check dates
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (promo.validFrom) {
            if (now < new Date(promo.validFrom + 'T00:00:00')) {
                setPromoError('Este código aún no es válido.');
                return;
            }
        }
        if (promo.validUntil) {
            if (now > new Date(promo.validUntil + 'T00:00:00')) {
                setPromoError('Este código ha expirado.');
                return;
            }
        }

        // Check Single Use
        if (promo.isSingleUse && promo.usageCount >= 1) {
            setPromoError('Este código es de un solo uso y ya fue utilizado.');
            return;
        }

        // Check Delivery Mode
        if (promo.applicableDelivery && promo.applicableDelivery.length > 0) {
            if (!promo.applicableDelivery.includes(deliveryMode)) {
                setPromoError(`Este código solo es válido para ${promo.applicableDelivery.join(' y ')}.`);
                return;
            }
        }

        // Check Payment Method
        if (promo.applicablePayment && promo.applicablePayment.length > 0) {
            let currentPayment = paymentMethod;
            // Map mercadopago internal state to 'online' rule
            if (currentPayment === 'mercadopago') currentPayment = 'online';

            if (!promo.applicablePayment.includes(currentPayment)) {
                setPromoError(`Este código solo es válido pagando en ${promo.applicablePayment.join(' o ')}.`);
                return;
            }
        }

        // Apply promo
        setAppliedPromo(promo);
        setPromoCodeInput('');
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
    };

    // Save mode to localStorage and validate applied promo against delivery mode & payment method
    useEffect(() => {
        if (appliedPromo) {
            let removed = false;
            // Check delivery
            if (appliedPromo.applicableDelivery && appliedPromo.applicableDelivery.length > 0) {
                if (!appliedPromo.applicableDelivery.includes(deliveryMode)) {
                    setAppliedPromo(null);
                    setPromoError(`El código fue removido porque no aplica para ${deliveryMode}.`);
                    removed = true;
                }
            }

            // Check payment
            if (!removed && appliedPromo.applicablePayment && appliedPromo.applicablePayment.length > 0) {
                let currentPayment = paymentMethod;
                if (currentPayment === 'mercadopago') currentPayment = 'online';

                if (!appliedPromo.applicablePayment.includes(currentPayment)) {
                    setAppliedPromo(null);
                    setPromoError(`El código fue removido porque no aplica para pago ${currentPayment === 'online' ? 'Online' : 'en Efectivo'}.`);
                }
            }
        }
        localStorage.setItem('cdh_delivery_mode', deliveryMode);
    }, [deliveryMode, paymentMethod, appliedPromo]);

    // Check availability of payment methods based on delivery mode
    const isEfectivoActive = paymentSettings ? (deliveryMode === 'envio' ? paymentSettings.delivery_cash_active !== false : paymentSettings.pickup_cash_active !== false) : true;
    const isMpActive = paymentSettings ? (paymentSettings.mp_active && (deliveryMode === 'envio' ? paymentSettings.delivery_mp_active !== false : paymentSettings.pickup_mp_active !== false)) : false;

    // Auto-select a valid payment method if the current one becomes unavailable
    useEffect(() => {
        if (!isEfectivoActive && paymentMethod === 'efectivo') {
            if (isMpActive) setPaymentMethod('mercadopago');
        }
        if (!isMpActive && paymentMethod === 'mercadopago') {
            if (isEfectivoActive) setPaymentMethod('efectivo');
        }
    }, [deliveryMode, isEfectivoActive, isMpActive]);

    // Si entran directo a /checkout sin carrito, los devolvemos al menú
    useEffect(() => {
        if (!cartItems || cartItems.length === 0) {
            navigate('/menu');
        }
    }, [cartItems, navigate]);

    if (!cartItems || cartItems.length === 0) return null;

    // Calculate Totals
    /**
     * Calcula el subtotal, el descuento exacto (si aplica), el envío y el total.
     * Si hay un cupón, revisa producto por producto y categoría por categoría 
     * para saber a qué porción del subtotal se le puede aplicar el % o monto fijo de descuento.
     */
    const calculateTotals = () => {
        let subtotal = 0;
        let applicableSubtotal = 0;

        cartItems.forEach(item => {
            subtotal += item.totalPrice;
            // Check if item qualifies for discount
            if (appliedPromo) {
                const noCats = !appliedPromo.applicableCategories || appliedPromo.applicableCategories.length === 0;
                const noProds = !appliedPromo.applicableProducts || appliedPromo.applicableProducts.length === 0;

                let applies = false;
                if (noCats && noProds) {
                    applies = true;
                } else {
                    if (!noCats && appliedPromo.applicableCategories.includes(item.product.productCategoryId)) {
                        applies = true;
                    }
                    if (!noProds && appliedPromo.applicableProducts.includes(item.product.id)) {
                        applies = true;
                    }
                }

                if (applies) {
                    applicableSubtotal += item.totalPrice;
                }
            }
        });

        let discount = 0;
        if (appliedPromo && applicableSubtotal > 0) {
            if (appliedPromo.type === 'percentage') {
                discount = applicableSubtotal * (appliedPromo.value / 100);
            } else {
                discount = Math.min(appliedPromo.value, applicableSubtotal);
            }
        }

        const activeDeliveryCost = deliveryMode === 'envio' ? deliveryCost : 0;
        const finalTotal = Math.max(0, subtotal - discount) + activeDeliveryCost;

        return {
            subtotal,
            discount,
            delivery: activeDeliveryCost,
            total: finalTotal
        };
    };

    const { subtotal, discount, delivery, total } = calculateTotals();

    /**
     * Valida los datos mínimos del cliente (Nombre, Mail, etc.) y la zona de envío.
     * Si todo está OK, llama a la API `/api/send-otp` para mandar el mail con el código numérico de 6 dígitos.
     */
    const handleRequestOtp = async () => {
        setIsSubmitting(true);
        if (!isEfectivoActive && !isMpActive) {
            alert('Lo sentimos, no hay métodos de pago habilitados para tu envío. Por favor, revisá las opciones de entrega.');
            setIsSubmitting(false);
            return;
        }

        if (scheduleMode === 'programado' && !scheduledTime) {
            alert('Por favor, seleccioná un horario para programar tu pedido.');
            setIsSubmitting(false);
            return;
        }

        if (scheduleMode === 'programado' && availableSlots.length === 0) {
            alert('Lo sentimos, no hay cupos horarios disponibles para programar hoy o ya cerramos por el día.');
            setIsSubmitting(false);
            return;
        }

        if (!customerFirstName.trim() || !customerLastName.trim() || !customerPhoneLocal.trim() || !customerEmail.trim()) {
            alert('Por favor, completá tu nombre, apellido, teléfono circular y correo electrónico para continuar.');
            setIsSubmitting(false);
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            alert('Por favor, ingresá un correo electrónico válido.');
            setIsSubmitting(false);
            return;
        }

        if (appliedPromo && appliedPromo.emailRestriction) {
            if (customerEmail.trim().toLowerCase() !== appliedPromo.emailRestriction.trim().toLowerCase()) {
                alert('El código de descuento aplicado no corresponde a tu email actual. Por favor, remové el código o usá el email original.');
                setIsSubmitting(false);
                return;
            }
        }

        if (deliveryMode === 'envio') {
            if (!customerAddress.trim()) {
                alert('Por favor, ingresá una dirección de envío válida.');
                setIsSubmitting(false);
                return;
            }
            if (deliveryError) {
                alert('La dirección indicada está fuera de la zona de cobertura.');
                setIsSubmitting(false);
                return;
            }
            if (deliverySettings && !deliverySettings.is_active) {
                alert('Los envíos están pausados temporalmente. Por favor, elegí la opción de Retiro.');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: customerEmail, customerName: `${customerFirstName.trim()} ${customerLastName.trim()}` })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setShowOtpModal(true);
            } else {
                alert(data.message || 'No se pudo enviar el correo.');
            }
        } catch (e) {
            console.error('Error enviando OTP:', e);
            alert('Error de conexión al enviar el código.');
        } finally {
            setIsSendingOtp(false);
            setIsSubmitting(false); // Reset submitting state after OTP request
        }
    };

    /**
     * Se ejecuta cuando el cliente ingresa el código numérico que recibió por correo.
     * Crea el objeto Order final, prepara el payload estricto de Fudo, y lo envía 
     * todo junto a la API serverless `/api/create-order` donde se procesa.
     * Si el método es Mercado Pago, luego solicita la preferencia y redirige.
     */
    const handleConfirmPedido = async () => {
        // Validation was already checked before sending OTP
        if (!otpCode || otpCode.length !== 6) {
            alert('Por favor ingresá el código de 6 dígitos que te enviamos.');
            return;
        }

        setIsSubmitting(true);

        // format items
        const formattedItems = cartItems.map(item => ({
            quantity: item.quantity,
            name: item.product.name,
            mods: item.modifiersText || ''
        }));

        const fullName = `${customerFirstName.trim()} ${customerLastName.trim()}`;
        const localNum = customerPhoneLocal.replace(/\D/g, '');
        let finalPhone = customerPhonePrefix + localNum;
        if (customerPhonePrefix === '+54') {
            finalPhone = '+549' + localNum;
        }

        let scheduledDateForDb = null;
        if (scheduleMode === 'programado' && scheduledTime) {
            const now = new Date();
            const [sH, sM] = scheduledTime.split(':');
            now.setHours(sH, sM, 0, 0);
            // Si el horario elegido es de "madrugada" y pedimos en la tarde (ej, programar para 00:30)
            if (now.getTime() < new Date().getTime()) {
                now.setDate(now.getDate() + 1);
            }
            scheduledDateForDb = now.toISOString();
        }

        const newOrder = {
            id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString(),
            customer: { name: fullName, phone: finalPhone, email: customerEmail.trim() },
            delivery: { method: deliveryMode, address: deliveryMode === 'envio' ? customerAddress.trim() : '', cost: deliveryCost },
            payment: paymentMethod === 'efectivo' ? 'Efectivo' : 'MercadoPago',
            status: 'pendiente',
            scheduled_for: scheduledDateForDb,
            scheduled_time_str: scheduleMode === 'programado' ? scheduledTime : null,
            comments: customerNotes.trim(),
            items: formattedItems,
            subtotal: subtotal,
            deliveryCost: delivery,
            total: total,
            discountApplied: appliedPromo ? `${appliedPromo.code} (-${formatPrice(discount)})` : null,
        };

        // Construir el payload para Fudo (formato extricto de la API)
        const fudoItems = cartItems.map(item => ({
            quantity: item.quantity,
            price: item.product.price, // Precio unitario base
            product: { id: item.product.id },
            comment: item.modifiersText ? item.modifiersText : undefined
        }));

        const fudoPayload = {
            order: {
                customer: {
                    name: fullName,
                    phone: finalPhone
                },
                payment: {
                    paymentMethod: { id: paymentMethod === 'efectivo' ? 1 : 2 }, // Asumimos ID 1 Efectivo, 2 Otros
                    total: total
                },
                type: deliveryMode === 'envio' ? 'delivery' : 'pickup',
                typeOptions: deliveryMode === 'envio' ? { address: customerAddress.trim() } : {},
                items: fudoItems,
                comment: scheduleMode === 'programado' ? `¡PROGRAMADO PARA LAS ${scheduledTime}hs! - ${customerNotes.trim()}` : (customerNotes.trim() ? customerNotes.trim() : undefined)
            }
        };

        if (discount > 0) {
            fudoPayload.order.discounts = [
                { amount: discount }
            ];
        }

        try {
            // ENVIAR A VERCEL API
            try {
                // Determine base URL, works for local relative path if served together or deployed
                const apiResponse = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderDB: newOrder,
                        fudoPayload,
                        email: customerEmail,
                        otpCode: otpCode
                    })
                });

                if (!apiResponse.ok) {
                    const errorText = await apiResponse.text();
                    throw new Error(`Error en API Serverless: ${errorText}`);
                }
                const result = await apiResponse.json();
                console.log("Pedido creado y guardado en DB (Vercel API):", result);

                // Auto-disparar PedidosYa si está activo
                if (deliveryMode === 'envio' && deliverySettings?.peya_active) {
                    try {
                        console.log("Solicitando PeYa automáticamente para la orden:", result.orderId);
                        const peyaRes = await fetch('/api/peya-create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: result.orderId })
                        });

                        if (!peyaRes.ok) {
                            console.warn("PeYa Auto-Dispatch falló. El Administrador puede reintentar manualmente.");
                        } else {
                            console.log("Moto de PedidosYa solicitada correctamente en automático.");
                        }
                    } catch (peyaErr) {
                        console.error("Error de red solicitando PeYa automáticamente:", peyaErr);
                    }
                }

            } catch (apiErr) {
                console.error("Fallo la creación del pedido mediante API Serverless:", apiErr);
                throw apiErr; // Mandamos al catch global
            }

            // Note: Since we use Serverless API, the promo usage count should ideally be incremented there.
            // For now we will update it via Supabase directly if a promo was used.
            if (appliedPromo) {
                await supabase.rpc('increment_promo_usage', { promo_id: appliedPromo.id });
                // We'll define this RPC or just use an update
                const newCount = (appliedPromo.usageCount || 0) + 1;
                await supabase.from('promos_codes').update({ usage_count: newCount }).eq('id', appliedPromo.id);
            }

            // Dispatch a custom event to update admin dashboard if open in another tab
            window.dispatchEvent(new Event('storage'));

            // MANEJO DE MERCADO PAGO
            if (paymentMethod === 'mercadopago') {
                try {
                    const mpResponse = await fetch('/api/mp-create-preference', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderData: newOrder })
                    });

                    if (!mpResponse.ok) {
                        throw new Error('No se pudo generar el pago con M.Pago.');
                    }

                    const mpResult = await mpResponse.json();

                    // Redirigir al cliente
                    window.location.href = mpResult.init_point;
                    return; // Terminamos aquí

                } catch (mpErr) {
                    console.error("Error de MercadoPago:", mpErr);
                    alert("Hubo un problema abriendo Mercado Pago. Nos comunicaremos con vos a la brevedad.");
                    // Si falla, limpiar y volver a menu como preventivo
                    setTimeout(() => {
                        navigate('/menu', { state: { clearCart: true } });
                    }, 1000);
                }
            } else {
                // Temporary Success Alert (can be improved to a modal later if requested)
                alert(`¡Pedido Confirmado! Tu número de orden es ${newOrder.id}.\nEn breve lo estaremos preparando.`);

                // En un flujo real acá limpiaríamos el carrito y volveríamos al home o a un success tracking page
                // Por ahora vamos a simular limpiando y yendo al menu
                setTimeout(() => {
                    navigate('/menu', { state: { clearCart: true } });
                }, 1000);
            }

        } catch (e) {
            console.error('Error saving order', e);
            alert('Ocurrió un error al procesar tu pedido.');
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-cdh-black text-white relative flex flex-col items-center"
            style={{
                backgroundImage: `url(${heroBg})`,
                backgroundSize: 'cover',
                backgroundAttachment: 'fixed',
                backgroundPosition: 'center'
            }}
        >
            <div className="absolute inset-0 bg-cdh-black/95 z-0"></div>

            <div className="relative z-10 w-full max-w-lg px-4 py-4 flex flex-col min-h-screen">

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <button onClick={() => navigate(-1)} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black uppercase tracking-wider flex-1 text-center">Finalizar Pedido</h1>
                    <div className="w-8"></div> {/* Spacer for centering */}
                </div>

                {/* Form Sections */}
                <div className="flex-1 space-y-4">

                    {/* Delivery Info */}
                    <div className="bg-[#111] border border-white/5 rounded-xl p-4 shadow-xl">
                        <h2 className="text-xs font-bold text-gray-400 border-b border-white/10 pb-2 mb-3 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-cdh-orange/20 text-cdh-orange flex items-center justify-center text-[10px]">1</span>
                            Entrega
                        </h2>

                        {/* Modality Toggle */}
                        <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/5 mb-3">
                            <button
                                onClick={() => setDeliveryMode('envio')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${deliveryMode === 'envio' ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-gray-400 hover:text-white'}`}
                            >
                                <MapPin size={14} className={deliveryMode === 'envio' ? 'text-cdh-orange' : ''} />
                                Envío
                            </button>
                            <button
                                onClick={() => setDeliveryMode('retiro')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${deliveryMode === 'retiro' ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Store size={14} className={deliveryMode === 'retiro' ? 'text-cdh-orange' : ''} />
                                Retiro
                            </button>
                        </div>

                        {deliveryMode === 'envio' && (
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Dirección de Entrega (Requerido)</label>
                                {isLoaded ? (
                                    <Autocomplete
                                        onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                                        onPlaceChanged={handlePlaceChanged}
                                        options={{ componentRestrictions: { country: 'ar' } }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Buscá tu calle y número..."
                                            value={customerAddress}
                                            onChange={(e) => {
                                                setCustomerAddress(e.target.value);
                                                setDeliveryCost(0);
                                                setDeliveryError('');
                                            }}
                                            className={`w-full bg-[#1a1a1a] border ${isSubmitting && !customerAddress.trim() ? 'border-red-500' : 'border-white/10'} rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cdh-orange transition-colors`}
                                        />
                                    </Autocomplete>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Cargando mapa..."
                                        disabled
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-2.5 px-3 text-xs text-white opacity-50 cursor-not-allowed"
                                    />
                                )}
                                {deliveryError && (
                                    <p className="text-red-400 text-[10px] mt-1 font-bold">{deliveryError}</p>
                                )}
                                {deliveryCost > 0 && !deliveryError && (
                                    <p className="text-green-400 text-[10px] mt-1 font-bold">Costo de envío sumado: {formatPrice(deliveryCost)}</p>
                                )}
                                {deliverySettings && !deliverySettings.is_active && (
                                    <p className="text-yellow-400 text-[10px] mt-1 font-bold">Los envíos están pausados temporalmente.</p>
                                )}
                            </div>
                        )}
                        {deliveryMode === 'retiro' && (
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-center">
                                <p className="text-xs text-gray-300">Retirás tu pedido por nuestro local en:</p>
                                <p className="font-bold text-white text-[10px] mt-0.5">
                                    {deliverySettings ? deliverySettings.origin_address : '24 de Septiembre 210, San Carlos de Bariloche, Río Negro, Argentina'}
                                </p>
                            </div>
                        )}

                        {/* Horario de Entrega / Programación */}
                        <div className="mt-4 pt-3 border-t border-white/10">
                            <label className="block text-[11px] font-bold text-gray-500 mb-2">Momento de entrega</label>

                            {!isStoreOpen && storeHours && scheduleMode === 'programado' && availableSlots.length > 0 && (
                                <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px] text-yellow-500 font-bold">
                                    El local está cerrado en este momento. Solo podés programar tu pedido para hoy más tarde.
                                </div>
                            )}

                            {!isStoreOpen && storeHours && availableSlots.length === 0 && (
                                <div className="mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-500 font-bold">
                                    El local está cerrado y no hay turnos de programación disponibles por hoy.
                                </div>
                            )}

                            <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/5 mb-2">
                                <button
                                    onClick={() => { if (isStoreOpen) { setScheduleMode('immediato'); setScheduledTime(''); } }}
                                    disabled={!isStoreOpen}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${scheduleMode === 'immediato' ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                    Inmediato
                                </button>
                                <button
                                    onClick={() => {
                                        setScheduleMode('programado');
                                        if (availableSlots.length > 0 && !scheduledTime) setScheduledTime(availableSlots[0]);
                                    }}
                                    disabled={availableSlots.length === 0}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${scheduleMode === 'programado' ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                    Programar Hoy
                                </button>
                            </div>

                            {scheduleMode === 'programado' && availableSlots.length > 0 && (
                                <div>
                                    <select
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-cdh-orange transition-colors cursor-pointer"
                                    >
                                        <option value="" disabled>Seleccioná un horario</option>
                                        {availableSlots.map(time => (
                                            <option key={time} value={time}>{time} hs</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Data */}
                    <div className="bg-[#111] border border-white/5 rounded-xl p-4 shadow-xl">
                        <h2 className="text-xs font-bold text-gray-400 border-b border-white/10 pb-2 mb-3 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-cdh-orange/20 text-cdh-orange flex items-center justify-center text-[10px]">2</span>
                            Tus Datos
                        </h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Lucas"
                                        value={customerFirstName}
                                        onChange={(e) => setCustomerFirstName(e.target.value)}
                                        className={`w-full bg-[#1a1a1a] border ${isSubmitting && !customerFirstName.trim() ? 'border-red-500' : 'border-white/10'} rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cdh-orange transition-colors`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Martínez"
                                        value={customerLastName}
                                        onChange={(e) => setCustomerLastName(e.target.value)}
                                        className={`w-full bg-[#1a1a1a] border ${isSubmitting && !customerLastName.trim() ? 'border-red-500' : 'border-white/10'} rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cdh-orange transition-colors`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Teléfono (WhatsApp)</label>
                                <div className="flex gap-2">
                                    <select
                                        value={customerPhonePrefix}
                                        onChange={(e) => setCustomerPhonePrefix(e.target.value)}
                                        className="w-[80px] bg-[#1a1a1a] border border-white/10 rounded-lg py-2.5 px-2 text-xs text-white focus:outline-none focus:border-cdh-orange transition-colors cursor-pointer text-center appearance-none shrink-0"
                                    >
                                        <option value="+54">🇦🇷 +54</option>
                                        <option value="+598">🇺🇾 +598</option>
                                        <option value="+56">🇨🇱 +56</option>
                                        <option value="+55">🇧🇷 +55</option>
                                        <option value="+591">🇧🇴 +591</option>
                                        <option value="+595">🇵🇾 +595</option>
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+34">🇪🇸 +34</option>
                                    </select>
                                    <input
                                        type="tel"
                                        placeholder="Ej: 2944 123456"
                                        pattern="[0-9]{8,15}"
                                        value={customerPhoneLocal}
                                        onChange={(e) => setCustomerPhoneLocal(e.target.value)}
                                        className={`flex-1 bg-[#1a1a1a] border ${isSubmitting && !customerPhoneLocal.trim() ? 'border-red-500' : 'border-white/10'} rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cdh-orange transition-colors`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    placeholder="Ej: nombre@email.com"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    className={`w-full bg-[#1a1a1a] border ${isSubmitting && !customerEmail.trim() ? 'border-red-500' : 'border-white/10'} rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cdh-orange transition-colors`}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Aclaraciones sobre tu pedido (Opcional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ej: La hamburguesa sin tomate, timbre 4B..."
                                    value={customerNotes}
                                    onChange={(e) => setCustomerNotes(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cdh-orange transition-colors resize-none custom-scrollbar"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-[#111] border border-white/5 rounded-xl p-4 shadow-xl">
                        <h2 className="text-xs font-bold text-gray-400 border-b border-white/10 pb-2 mb-3 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-cdh-orange/20 text-cdh-orange flex items-center justify-center text-[10px]">3</span>
                            Medio de Pago
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {isEfectivoActive && (
                                <button
                                    onClick={() => setPaymentMethod('efectivo')}
                                    className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${paymentMethod === 'efectivo' ? 'border-cdh-orange bg-cdh-orange/10' : 'border-white/5 bg-[#1a1a1a] hover:bg-white/5'}`}
                                >
                                    <Banknote size={18} className={paymentMethod === 'efectivo' ? 'text-cdh-orange' : 'text-gray-500'} />
                                    <div className="text-left flex-1">
                                        <p className="text-xs font-bold text-white">Efectivo</p>
                                        <p className="text-[10px] text-gray-500">Pagás al recibir/retirar</p>
                                    </div>
                                    {paymentMethod === 'efectivo' && <CheckCircle size={16} className="text-cdh-orange" />}
                                </button>
                            )}

                            {isMpActive && (
                                <button
                                    onClick={() => setPaymentMethod('mercadopago')}
                                    className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${paymentMethod === 'mercadopago' ? 'border-[#009EE3] bg-[#009EE3]/10' : 'border-white/5 bg-[#1a1a1a] hover:bg-white/5'}`}
                                >
                                    <CreditCard size={18} className={paymentMethod === 'mercadopago' ? 'text-[#009EE3]' : 'text-gray-500'} />
                                    <div className="text-left flex-1">
                                        <p className="text-xs font-bold text-white">Online (Tarjetas y más)</p>
                                        <p className="text-[10px] text-gray-500">Mercado Pago / Saldo</p>
                                    </div>
                                    {paymentMethod === 'mercadopago' && <CheckCircle size={16} className="text-[#009EE3]" />}
                                </button>
                            )}

                            {!isEfectivoActive && !isMpActive && (
                                <div className="col-span-full p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                                    <p className="text-xs font-bold text-red-400">No hay métodos de pago habilitados para esta modalidad.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-[#111] border border-white/5 rounded-xl p-4 shadow-xl">
                        <h2 className="text-xs font-bold text-gray-400 border-b border-white/10 pb-2 mb-3 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-cdh-orange/20 text-cdh-orange flex items-center justify-center text-[10px]">4</span>
                            Resumen de Pedido
                        </h2>

                        <div className="space-y-2.5 mb-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                            {cartItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <div className="flex-1 pr-3">
                                        <p className="font-bold text-white">{item.quantity}x {item.product.name}</p>
                                        {item.modifiersText && (
                                            <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{item.modifiersText}</p>
                                        )}
                                    </div>
                                    <span className="font-black text-white whitespace-nowrap">{formatPrice(item.totalPrice)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Promo Code Input */}
                        <div className="mt-4 border-t border-white/10 pt-4">
                            {!appliedPromo ? (
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Código de Descuento</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="EJEMPLO123"
                                            value={promoCodeInput}
                                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                                            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-cdh-orange uppercase transition-colors"
                                        />
                                        <button
                                            onClick={handleApplyPromo}
                                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                    {promoError && <p className="text-[10px] text-red-400">{promoError}</p>}
                                </div>
                            ) : (
                                <div className="bg-cdh-orange/10 border border-cdh-orange/20 rounded-lg p-3 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-cdh-orange font-bold uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle size={10} /> Cupón Aplicado
                                        </span>
                                        <span className="text-white font-black text-sm">{appliedPromo.code}</span>
                                    </div>
                                    <button
                                        onClick={handleRemovePromo}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer Fixed Action */}
                <div className="mt-5 bg-[#111] p-4 rounded-xl border border-white/10 sticky bottom-4 shadow-2xl">
                    <div className="flex flex-col gap-1 mb-3">
                        {discount > 0 && (
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                        )}
                        {discount > 0 && (
                            <div className="flex justify-between items-center text-xs text-cdh-orange font-bold">
                                <span>Descuento ({appliedPromo.code})</span>
                                <span>-{formatPrice(discount)}</span>
                            </div>
                        )}
                        {delivery > 0 && (
                            <div className="flex justify-between items-center text-xs text-green-400 font-bold">
                                <span>Delivery</span>
                                <span>{formatPrice(delivery)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm font-black text-white mt-1 pt-2 border-t border-white/10">
                            <span className="text-gray-400 uppercase tracking-widest text-[11px] font-bold">Total a pagar</span>
                            <span className="text-xl font-black text-cdh-gold">
                                {formatPrice(total)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleRequestOtp}
                        disabled={isSendingOtp || (!isEfectivoActive && !isMpActive)}
                        className={`w-full text-white text-sm font-black uppercase tracking-wider py-3 rounded-lg transition-all flex justify-center items-center gap-2 ${(!isEfectivoActive && !isMpActive) ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-cdh-orange hover:bg-orange-600 shadow-[0_0_15px_rgba(242,101,19,0.3)] disabled:opacity-50 disabled:cursor-not-allowed'}`}
                    >
                        {isSendingOtp ? 'Enviando Código...' : 'Verificar e Ingresar'}
                    </button>
                </div>
            </div>

            {/* OTP Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-cdh-orange/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-cdh-orange/20 rounded-full flex items-center justify-center text-cdh-orange mb-4">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-xl font-black uppercase text-white tracking-wider mb-2">Verifica tu Email</h3>
                            <p className="text-sm text-gray-400 mb-6">Hemos enviado un código de 6 dígitos a <br /><strong className="text-white">{customerEmail}</strong></p>

                            <input
                                type="text"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="000000"
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-4 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-cdh-orange uppercase transition-colors mb-6 font-mono"
                            />

                            <button
                                onClick={handleConfirmPedido}
                                disabled={isSubmitting || otpCode.length !== 6}
                                className="w-full bg-cdh-orange hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(242,101,19,0.3)]"
                            >
                                {isSubmitting ? 'Confirmando...' : 'Confirmar Pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Checkout;
