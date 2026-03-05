import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, CheckCircle, Clock, Package, MoreVertical, Bike, Store, Trash2, Truck, X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

function OrdersModule() {
    const [orders, setOrders] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const loadOrders = async () => {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error loading orders:', error);
            return;
        }
        if (data) {
            setOrders(data.map(o => ({
                id: o.id,
                date: o.created_at,
                customer: o.customer,
                delivery: o.delivery,
                payment: o.payment,
                status: o.status,
                total: Number(o.total),
                items: o.items,
                fudoId: o.fudo_id,
                fudoStatus: o.fudo_status,
                peyaOrderId: o.peya_order_id,
                peyaStatus: o.peya_status,
                peyaTrackingUrl: o.peya_tracking_url
            })));
        }
    };

    // Load orders from Supabase and listen for real-time updates
    useEffect(() => {
        loadOrders();

        const subscription = supabase
            .channel('orders-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                loadOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const updateOrderStatus = async (orderId, newStatus) => {
        // Optimistic update
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        if (error) {
            console.error('Error updating order:', error);
            loadOrders(); // Revert on error
        }
    };

    const deleteOrder = async (orderId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
            // Optimistic update
            setOrders(orders.filter(o => o.id !== orderId));

            const { error } = await supabase.from('orders').delete().eq('id', orderId);
            if (error) {
                console.error('Error deleting order:', error);
                loadOrders(); // Revert on error
            }
        }
    };

    const handleRequestPeya = async (orderId) => {
        if (!window.confirm('¿Deseas solicitar un repartidor de PedidosYa para esta orden?')) return;

        try {
            const response = await fetch('/api/peya-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
            const data = await response.json();

            if (response.ok) {
                alert('¡Repartidor de PedidosYa solicitado con éxito!');
                loadOrders();
            } else {
                alert('Error al solicitar repartidor: ' + (data.error || 'Error desconocido'));
                console.error(data);
            }
        } catch (err) {
            alert('Error contactando al servidor interno.');
            console.error(err);
        }
    };

    const handleCancelPeya = async (orderId) => {
        if (!window.confirm('¿Deseas CANCELAR el envío con PedidosYa? El cadete ya no vendrá.')) return;

        try {
            const response = await fetch('/api/peya-cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
            const data = await response.json();

            if (response.ok) {
                alert('Envío de PedidosYa cancelado.');
                loadOrders();
            } else {
                alert('Error al cancelar envío: ' + (data.error || 'Error desconocido'));
                console.error(data);
            }
        } catch (err) {
            alert('Error contactando al servidor interno.');
            console.error(err);
        }
    };

    // Derived counts
    const counts = {
        pendientes: orders.filter(o => o.status === 'pendiente').length,
        preparacion: orders.filter(o => o.status === 'preparacion').length,
        listos: orders.filter(o => o.status === 'listo').length,
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        const matchesSearch =
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

    const getStatusBadge = (status) => {
        const styles = {
            pendiente: 'bg-red-500/20 text-red-400 border-red-500/30',
            preparacion: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            listo: 'bg-green-500/20 text-green-400 border-green-500/30',
            entregado: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
        const labels = {
            pendiente: 'Pendiente',
            preparacion: 'En Preparación',
            listo: 'Listo p/ Entregar',
            entregado: 'Entregado'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header & Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <h1 className="text-3xl font-black text-white uppercase tracking-wider">Gestión de Pedidos</h1>

                <div className="flex gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 hide-scrollbar">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4 min-w-[140px]">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Pendientes</p>
                            <p className="text-2xl font-black text-white">{counts.pendientes}</p>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4 min-w-[140px]">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                            <Package size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Preparación</p>
                            <p className="text-2xl font-black text-white">{counts.preparacion}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {['all', 'pendiente', 'preparacion', 'listo', 'entregado'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors ${filterStatus === status ? 'bg-cdh-orange text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'}`}
                        >
                            {status === 'all' ? 'Todos' : status}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por ID o Cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cdh-orange"
                    />
                </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="xl:col-span-2 py-12 text-center border border-dashed border-white/10 rounded-xl">
                        <p className="text-gray-500 uppercase tracking-widest text-sm font-bold">No hay pedidos que coincidan con la búsqueda.</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="bg-[#1a1a1a] border border-white/5 rounded-xl flex flex-col hover:border-white/20 transition-colors shadow-lg">

                            {/* Card Header */}
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-black text-white">{order.id}</h3>
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <Clock size={14} /> {formatTime(order.date)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Col: Items */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider border-b border-white/10 pb-1">Detalle del Pedido</h4>
                                    <ul className="space-y-2">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="text-sm border-l-2 border-cdh-orange/50 pl-2">
                                                <div className="text-white font-bold">{item.quantity}x {item.name}</div>
                                                {item.mods && <div className="text-xs text-gray-500 uppercase">{item.mods}</div>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Right Col: Info */}
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider border-b border-white/10 pb-1">Cliente</h4>
                                        <p className="text-sm font-bold text-white">{order.customer.name}</p>
                                        <p className="text-sm text-cdh-orange">{order.customer.phone}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider border-b border-white/10 pb-1">Entrega</h4>
                                        <p className="text-sm text-white flex items-center gap-2">
                                            {order.delivery.method === 'envio' ? <Bike size={16} className="text-gray-400" /> : <Store size={16} className="text-gray-400" />}
                                            <span className="capitalize">{order.delivery.method}</span>
                                        </p>
                                        {order.delivery.address && <p className="text-sm text-gray-400 mt-0.5">{order.delivery.address}</p>}

                                        {/* PeYa Actions for Delivery */}
                                        {order.delivery.method === 'envio' && (
                                            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                                {!order.peyaOrderId ? (
                                                    <button
                                                        onClick={() => handleRequestPeya(order.id)}
                                                        className="w-full bg-[#FF004D]/10 hover:bg-[#FF004D]/20 text-[#FF004D] border border-[#FF004D]/30 transition-colors rounded-lg py-1.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                                                    >
                                                        <Truck size={14} /> Solicitar PeYa
                                                    </button>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between bg-white/[0.03] p-2 rounded-lg border border-white/5">
                                                            <div className="flex items-center gap-1.5">
                                                                <Truck size={14} className="text-cdh-orange" />
                                                                <span className="text-xs font-bold text-gray-300">Rider {order.peyaStatus === 'CONFIRMED' ? 'Confirmado' : order.peyaStatus}</span>
                                                            </div>
                                                            {order.peyaTrackingUrl && (
                                                                <a href={order.peyaTrackingUrl} target="_blank" rel="noreferrer" className="text-[10px] text-cdh-orange hover:underline font-bold uppercase">
                                                                    Seguir
                                                                </a>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleCancelPeya(order.id)}
                                                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 transition-colors rounded-lg py-1.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                                                        >
                                                            <X size={14} /> Cancelar PeYa
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-3 border-t border-white/5 bg-black/20 flex flex-wrap gap-2 justify-between items-center rounded-b-xl">
                                <span className="font-black text-cdh-gold pl-2">Total: ${order.total.toLocaleString('es-AR')}</span>
                                <div className="flex gap-2">
                                    <select
                                        className="bg-[#222] border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cdh-orange"
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                    >
                                        <option value="pendiente">Pendiente</option>
                                        <option value="preparacion">En Preparación</option>
                                        <option value="listo">Listo p/ Entregar</option>
                                        <option value="entregado">Entregado</option>
                                    </select>
                                    <button
                                        onClick={() => deleteOrder(order.id)}
                                        className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                                        title="Eliminar Pedido"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default OrdersModule;
