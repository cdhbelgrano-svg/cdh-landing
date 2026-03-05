import React, { useState, useEffect } from 'react';
import { CreditCard, Save, Loader2, CheckCircle, ShieldCheck, MapPin, Store, Calendar, HelpCircle, History } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

function PaymentsModule() {
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'history'

    // -- Settings State --
    const [settings, setSettings] = useState({
        mp_active: false,
        mp_public_key: '',
        mp_access_token: '',
        pickup_cash_active: true,
        pickup_mp_active: true,
        delivery_cash_active: true,
        delivery_mp_active: true
    });
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // -- History State --
    const [orders, setOrders] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (activeTab === 'settings') {
            fetchSettings();
        } else {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchSettings = async () => {
        setLoadingSettings(true);
        const { data, error } = await supabase.from('payment_settings').select('*').eq('id', 1).single();
        if (data) {
            setSettings({
                mp_active: data.mp_active || false,
                mp_public_key: data.mp_public_key || '',
                mp_access_token: data.mp_access_token || '',
                pickup_cash_active: data.pickup_cash_active !== false,
                pickup_mp_active: data.pickup_mp_active !== false,
                delivery_cash_active: data.delivery_cash_active !== false,
                delivery_mp_active: data.delivery_mp_active !== false
            });
        }
        setLoadingSettings(false);
    };

    const fetchOrders = async () => {
        setLoadingHistory(true);
        // Traer órdenes más recientes primero
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
        if (data) {
            setOrders(data);
        }
        setLoadingHistory(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);

        const { error } = await supabase
            .from('payment_settings')
            .upsert({
                id: 1,
                ...settings,
                updated_at: new Date().toISOString()
            });

        setSaving(false);
        if (error) {
            console.error('Error saving payment settings:', error);
            alert('Error al guardar configuración de pagos.');
        } else {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    // Helper to get status pill color mapping based on db status (pendiente, preparación, en_camino, entregado, cancelado)
    // We infer payment status: Efectivo is mostly paid at 'entregado' or pending otherwise. 
    // Mercado Pago creates orders already paid if successful, we assume 'pendiente' or valid if they exist.
    const renderStatus = (order) => {
        if (order.status === 'cancelado') return <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-1 rounded-full text-[10px] font-bold uppercase">Cancelada</span>;
        if (order.status === 'entregado') return <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full text-[10px] font-bold uppercase">Concluido / Pagado</span>;

        // Efectivo and not delivered
        if (order.payment.toLowerCase().includes('efectivo')) {
            return <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded-full text-[10px] font-bold uppercase">A cobrar {order.delivery.method === 'envio' ? 'en destino' : 'en local'}</span>;
        }

        // MP payment - if order is in system it means payment passed API
        return <span className="bg-[#009EE3]/20 text-[#009EE3] border border-[#009EE3]/30 px-2 py-1 rounded-full text-[10px] font-bold uppercase">Pagado Online</span>;
    };


    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header and Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <CreditCard className="text-cdh-orange" size={32} /> Pagos
                </h1>

                {activeTab === 'settings' && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full md:w-auto bg-cdh-orange hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg flex justify-center items-center gap-2 transition-all shadow-[0_0_15px_rgba(242,101,19,0.3)] disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                )}
            </div>

            <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/5 shadow-xl inline-flex w-full md:w-[400px]">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-gray-400 hover:text-white'}`}
                >
                    <ShieldCheck size={16} /> Configuración de Pagos
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-gray-400 hover:text-white'}`}
                >
                    <History size={16} /> Historial Operaciones
                </button>
            </div>

            {saveSuccess && activeTab === 'settings' && (
                <div className="bg-green-500/20 text-green-400 border border-green-500/30 p-4 rounded-xl flex items-center gap-3 animate-in fade-in-0 duration-300">
                    <CheckCircle size={20} />
                    <span className="font-bold text-sm">¡Configuración guardada exitosamente!</span>
                </div>
            )}

            {/* Content: SEC 1 - Settings */}
            {activeTab === 'settings' && (
                loadingSettings ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-cdh-orange w-8 h-8" /></div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* Reglas por Modalidad */}
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                            <div className="border-b border-white/10 p-6 bg-gradient-to-r from-cdh-orange/10 to-transparent flex items-center gap-4">
                                <div className="w-12 h-12 bg-cdh-orange/20 border border-cdh-orange/30 rounded-xl flex items-center justify-center shadow-lg">
                                    <ShieldCheck size={24} className="text-cdh-orange" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Reglas por Modalidad</h2>
                                    <p className="text-sm text-gray-400">Restricciones de Checkout</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Envío a Domicilio Rules */}
                                <div className="bg-[#111] border border-white/5 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                                        <MapPin size={16} className="text-cdh-orange" /> Envíos a Domicilio
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Permitir pago en <strong>Efectivo</strong></span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.delivery_cash_active}
                                                    onChange={(e) => setSettings({ ...settings, delivery_cash_active: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Permitir pago con <strong>Mercado Pago</strong></span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.delivery_mp_active}
                                                    onChange={(e) => setSettings({ ...settings, delivery_mp_active: e.target.checked })}
                                                    disabled={!settings.mp_active}
                                                />
                                                <div className={`w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer ${!settings.mp_active ? 'opacity-50' : 'peer-checked:after:translate-x-full peer-checked:after:border-white cursor-pointer hover:bg-white/20 peer-checked:bg-[#009EE3]'} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                                            </label>
                                        </div>
                                        {!settings.mp_active && <p className="text-[10px] text-yellow-500 font-bold">*Debes activar Mercado Pago globalmente a la derecha para usar esto.</p>}
                                    </div>
                                </div>

                                {/* Retiro en Local Rules */}
                                <div className="bg-[#111] border border-white/5 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                                        <Store size={16} className="text-cdh-orange" /> Retiro en Local
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Permitir pago en <strong>Efectivo</strong></span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.pickup_cash_active}
                                                    onChange={(e) => setSettings({ ...settings, pickup_cash_active: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Permitir pago con <strong>Mercado Pago</strong></span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.pickup_mp_active}
                                                    onChange={(e) => setSettings({ ...settings, pickup_mp_active: e.target.checked })}
                                                    disabled={!settings.mp_active}
                                                />
                                                <div className={`w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer ${!settings.mp_active ? 'opacity-50' : 'peer-checked:after:translate-x-full peer-checked:after:border-white cursor-pointer hover:bg-white/20 peer-checked:bg-[#009EE3]'} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuración Mercado Pago General */}
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                            <div className="border-b border-white/10 p-6 bg-gradient-to-r from-[#009EE3]/10 to-transparent flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#009EE3] rounded-xl flex items-center justify-center shadow-lg">
                                    <CreditCard size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Mercado Pago</h2>
                                    <p className="text-sm text-gray-400">Checkout Pro Global</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Toggle de Estado Global */}
                                <div className="flex flex-col gap-2 p-4 bg-[#111] border border-white/5 rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Activar M.Pago</h3>
                                            <p className="text-xs text-gray-500">Habilita procesar pagos online.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.mp_active}
                                                onChange={(e) => setSettings({ ...settings, mp_active: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#009EE3]"></div>
                                        </label>
                                    </div>
                                    {!settings.mp_active && <p className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 p-2 rounded w-full">Al apagar esto se deshabilita M.Pago en todas las modalidades (Retiro y Envío).</p>}
                                </div>

                                {/* Credenciales */}
                                <div className="space-y-4 border-t border-white/5 pt-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Credenciales de API</h3>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex justify-between">
                                            Public Key
                                            <span className={settings.mp_public_key ? 'text-[#009EE3]' : 'text-gray-600'}>
                                                {settings.mp_public_key ? '✓ Configurada' : 'Vacía'}
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: APP_USR-xxx-xxx-xxx"
                                            value={settings.mp_public_key}
                                            onChange={(e) => setSettings({ ...settings, mp_public_key: e.target.value })}
                                            className="w-full bg-[#111] border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#009EE3] transition-colors font-mono"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Identifica de forma pública a la aplicación en el frontend.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex justify-between">
                                            Access Token (Privado)
                                            <span className={settings.mp_access_token ? 'text-[#009EE3]' : 'text-gray-600'}>
                                                {settings.mp_access_token ? '✓ Configurado' : 'Vacío'}
                                            </span>
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Ej: APP_USR-123456789-xxx-xxx"
                                            value={settings.mp_access_token}
                                            onChange={(e) => setSettings({ ...settings, mp_access_token: e.target.value })}
                                            className="w-full bg-[#111] border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#009EE3] transition-colors font-mono"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Clave privada para cobrar. NUNCA la compartas a terceros.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* Content: SEC 2 - History */}
            {activeTab === 'history' && (
                loadingHistory ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-cdh-orange w-8 h-8" /></div>
                ) : (
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                        <div className="border-b border-white/10 p-4 sm:p-6 bg-gradient-to-r from-gray-500/10 to-transparent">
                            <h2 className="text-xl font-black text-white uppercase tracking-wide">Últimos Pagos y Operaciones</h2>
                            <p className="text-sm text-gray-400">Las 50 órdenes más recientes procesadas por el sistema web.</p>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            {orders.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 uppercase font-bold text-xs">
                                    No hay operaciones registradas todavía.
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-black/40 border-b border-white/10 text-[11px] uppercase tracking-widest text-gray-400">
                                            <th className="p-4 font-bold">Fecha</th>
                                            <th className="p-4 font-bold hidden sm:table-cell">Orden</th>
                                            <th className="p-4 font-bold">Cliente</th>
                                            <th className="p-4 font-bold">Medio</th>
                                            <th className="p-4 font-bold text-right">Monto Base</th>
                                            <th className="p-4 font-bold">Estado Real</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-xs text-gray-300">
                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <Calendar size={12} className="text-gray-500" />
                                                        {formatDate(order.created_at)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-xs font-mono font-bold text-gray-400 hidden sm:table-cell">{order.id}</td>
                                                <td className="p-4 text-xs font-bold text-white capitalize">{order.customer?.name || '---'}</td>
                                                <td className="p-4">
                                                    <span className="flex items-center gap-2 text-xs font-bold uppercase">
                                                        {order.payment.toLowerCase().includes('mercadopago') ? (
                                                            <><CreditCard size={14} className="text-[#009EE3]" /> M.Pago</>
                                                        ) : (
                                                            <><ShieldCheck size={14} className="text-green-500" /> Efectivo</>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm font-black text-right text-cdh-gold">
                                                    ${(order.total || 0).toLocaleString('es-AR')}
                                                </td>
                                                <td className="p-4">
                                                    {renderStatus(order)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

export default PaymentsModule;
