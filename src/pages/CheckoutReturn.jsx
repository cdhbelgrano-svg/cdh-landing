import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import heroBg from '../assets/hero-bg.jpg';

function CheckoutReturn({ status }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const payment_id = searchParams.get('payment_id');
    const external_reference = searchParams.get('external_reference'); // Es el Order ID nuestro

    const [isUpdating, setIsUpdating] = useState(true);

    useEffect(() => {
        const updateOrder = async () => {
            if (!external_reference) {
                setIsUpdating(false);
                return;
            }

            try {
                // Determine MP specific status to save into our DB
                let newPaymentStatus = 'Pendiente MP';
                if (status === 'success') newPaymentStatus = 'Pagado (Mercado Pago)';
                if (status === 'failure') newPaymentStatus = 'Pago Rechazado';
                if (status === 'pending') newPaymentStatus = 'Pago Pendiente';

                // We ideally only update payment status to not override the global order status (which is flow: pendiente -> preparacion)
                // If it failed, maybe we want to cancel the order or let the store handle it.
                // For now, let's just update the payment field string and status to 'acreditado' if success.
                // Depending on the current schema, we could update `payment` field or a new one.
                const updateData = {
                    payment: newPaymentStatus
                };

                // If payment failed, maybe change order status to "cancelado" or leave "pendiente" for retrying.
                // If succeeded, leave as "pendiente" so the kitchen prepares it.

                await supabase.from('orders')
                    .update(updateData)
                    .eq('id', external_reference);

                // Disparar evento de storage para refrescar Dashboard admin
                window.dispatchEvent(new Event('storage'));
            } catch (err) {
                console.error("Error actualizando orden tras Mercado Pago:", err);
            } finally {
                setIsUpdating(false);
                // Limpiar el carrito si todo salió bien
                if (status === 'success' || status === 'pending') {
                    localStorage.removeItem('cdh_cart');
                }
            }
        };

        updateOrder();
    }, [status, external_reference]);

    if (isUpdating) {
        return (
            <div className="min-h-screen bg-cdh-black text-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-cdh-orange" />
            </div>
        );
    }

    const renderContent = () => {
        if (status === 'success') {
            return (
                <>
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/30">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-wider mb-2 text-white">¡Pago Exitoso!</h1>
                    <p className="text-gray-400 mb-6 text-center text-sm">
                        Tu pago <strong>#{(payment_id || '').slice(-6)}</strong> se procesó correctamente.<br />
                        Orden <strong>{external_reference}</strong> en preparación.
                    </p>
                </>
            );
        }

        if (status === 'pending') {
            return (
                <>
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-6 border border-yellow-500/30">
                        <Clock size={40} />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-wider mb-2 text-white">Pago Pendiente</h1>
                    <p className="text-gray-400 mb-6 text-center text-sm">
                        Estamos esperando que Mercado Pago confirme la acreditación.<br />
                        Orden <strong>{external_reference}</strong> registrada.
                    </p>
                </>
            );
        }

        return (
            <>
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/30">
                    <XCircle size={40} />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-wider mb-2 text-white">Pago Rechazado</h1>
                <p className="text-gray-400 mb-6 text-center text-sm">
                    No pudimos procesar el cobro en Mercado Pago.<br />
                    Comunicate con nosotros al WhatsApp para solucionarlo.
                </p>
            </>
        );
    };

    return (
        <div
            className="min-h-screen bg-cdh-black text-white relative flex flex-col items-center justify-center"
            style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}
        >
            <div className="absolute inset-0 bg-cdh-black/95 z-0"></div>

            <div className="relative z-10 w-full max-w-sm px-4 py-8 flex flex-col items-center bg-[#111] border border-white/10 rounded-2xl shadow-2xl">
                {renderContent()}

                <button
                    onClick={() => navigate('/menu')}
                    className="w-full bg-cdh-orange hover:bg-orange-600 text-white font-black uppercase py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(242,101,19,0.3)] mt-2"
                >
                    Volver al Menú <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}

export default CheckoutReturn;
