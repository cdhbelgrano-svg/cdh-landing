import React, { useState, useEffect } from 'react';
import { Clock, Save, Loader2, CheckCircle, Store, MapPin, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

function StoreHoursModule() {
    const [settings, setSettings] = useState({
        is_open_today: true,
        shifts: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase.from('store_hours').select('*').eq('id', 1).single();
            if (data) {
                setSettings({
                    is_open_today: data.is_open_today !== false,
                    shifts: data.shifts || []
                });
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);

        const { error } = await supabase
            .from('store_hours')
            .upsert({
                id: 1,
                is_open_today: settings.is_open_today,
                shifts: settings.shifts,
                updated_at: new Date().toISOString()
            });

        setSaving(false);
        if (error) {
            console.error('Error saving store hours:', error);
            alert('Error al guardar configuración de horarios.');
        } else {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const addShift = () => {
        const newId = settings.shifts.length > 0 ? Math.max(...settings.shifts.map(s => s.id)) + 1 : 1;
        const newShift = {
            id: newId,
            name: `Turno ${newId}`,
            is_active: true,
            open_days: [0, 1, 2, 3, 4, 5, 6],
            delivery_start_time: '20:00:00',
            delivery_end_time: '23:59:00',
            pickup_start_time: '19:30:00',
            pickup_end_time: '23:59:00'
        };
        setSettings(prev => ({ ...prev, shifts: [...prev.shifts, newShift] }));
    };

    const removeShift = (id) => {
        setSettings(prev => ({ ...prev, shifts: prev.shifts.filter(s => s.id !== id) }));
    };

    const updateShift = (id, field, value) => {
        setSettings(prev => ({
            ...prev,
            shifts: prev.shifts.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const toggleDayForShift = (shiftId, dayId) => {
        setSettings(prev => ({
            ...prev,
            shifts: prev.shifts.map(s => {
                if (s.id === shiftId) {
                    const prevDays = s.open_days || [];
                    const isSelected = prevDays.includes(dayId);
                    const newDays = isSelected
                        ? prevDays.filter(d => d !== dayId)
                        : [...prevDays, dayId].sort();
                    return { ...s, open_days: newDays };
                }
                return s;
            })
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-cdh-orange w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                    <Clock className="text-cdh-orange" size={32} /> Horarios y Turnos
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-cdh-orange hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(242,101,19,0.3)] disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {saveSuccess && (
                <div className="bg-green-500/20 text-green-400 border border-green-500/30 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle size={20} />
                    <span className="font-bold text-sm">¡Configuración guardada exitosamente!</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Main Switch */}
                <div className="md:col-span-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${settings.is_open_today ? 'bg-green-500' : 'bg-red-500'}`}>
                                <Store size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-wide">
                                    {settings.is_open_today ? 'Tienda Abierta Hoy' : 'Tienda Cerrada Fijo Hoy'}
                                </h2>
                                <p className="text-sm text-gray-400 max-w-md">
                                    Si apagás esto, la tienda indicará que está cerrada durante todo el día impidiendo pedidos "Inmediatos". Solo se podrán programar pedidos si hay turnos de todas formas.
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.is_open_today}
                                onChange={(e) => setSettings({ ...settings, is_open_today: e.target.checked })}
                            />
                            <div className="w-14 h-8 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                    {!settings.is_open_today && (
                        <div className="bg-red-500/10 border-t border-red-500/20 p-4 flex items-center gap-3 text-red-400">
                            <AlertTriangle size={20} />
                            <p className="text-sm font-bold">Atención: Cierre maestro activado. El local figurará cerrado en este momento.</p>
                        </div>
                    )}
                </div>

                {/* Shifts Header */}
                <div className="md:col-span-2 flex justify-between items-end mt-4">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-wider">Turnos de Trabajo</h2>
                        <p className="text-sm text-gray-400">Agregá o quitá turnos, y definí qué días están activos.</p>
                    </div>
                    <button
                        onClick={addShift}
                        className="bg-[#222] hover:bg-[#333] border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} className="text-cdh-orange" /> Agregar Turno
                    </button>
                </div>

                {/* Shifts List */}
                {settings.shifts.length === 0 ? (
                    <div className="md:col-span-2 bg-[#1a1a1a] border border-white/10 rounded-xl p-8 text-center text-gray-500">
                        No hay turnos configurados. La tienda no estará abierta hasta que configures uno.
                    </div>
                ) : (
                    settings.shifts.map((shift, index) => (
                        <div key={shift.id} className="md:col-span-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
                            {/* Shift Header */}
                            <div className={`bg-[#222] border-b border-white/5 p-4 flex items-center justify-between gap-4 transition-opacity ${shift.is_active === false ? 'opacity-50' : ''}`}>
                                <div className="flex-1 max-w-sm flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0" title={shift.is_active !== false ? "Desactivar Turno" : "Activar Turno"}>
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={shift.is_active !== false}
                                            onChange={(e) => updateShift(shift.id, 'is_active', e.target.checked)}
                                        />
                                        <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cdh-orange"></div>
                                    </label>
                                    <input
                                        type="text"
                                        value={shift.name}
                                        onChange={(e) => updateShift(shift.id, 'name', e.target.value)}
                                        placeholder="Nombre del turno (ej. Almuerzo)"
                                        className="w-full bg-transparent border-b border-white/20 text-white font-black text-lg focus:outline-none focus:border-cdh-orange px-1 py-1"
                                        disabled={shift.is_active === false}
                                    />
                                </div>
                                <button
                                    onClick={() => removeShift(shift.id)}
                                    className="text-red-500/60 hover:text-red-500 bg-red-500/10 p-2 rounded-lg transition-colors"
                                    title="Eliminar Turno"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Open Days Selector */}
                            <div className="p-4 md:p-6 border-b border-white/5">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                    Días de Atención para este Turno
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 1, name: 'Lunes', short: 'L' },
                                        { id: 2, name: 'Martes', short: 'M' },
                                        { id: 3, name: 'Miérc', short: 'X' },
                                        { id: 4, name: 'Jueves', short: 'J' },
                                        { id: 5, name: 'Viernes', short: 'V' },
                                        { id: 6, name: 'Sábado', short: 'S' },
                                        { id: 0, name: 'Domingo', short: 'D' }
                                    ].map(day => {
                                        const isSelected = (shift.open_days || []).includes(day.id);
                                        return (
                                            <button
                                                key={day.id}
                                                onClick={() => toggleDayForShift(shift.id, day.id)}
                                                className={`flex-1 min-w-[3rem] py-2 rounded-lg border-2 text-xs md:text-sm font-black transition-all ${isSelected
                                                    ? 'bg-cdh-orange text-white border-cdh-orange shadow-[0_0_10px_rgba(242,101,19,0.3)]'
                                                    : 'bg-[#111] text-gray-500 border-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                <span className="md:hidden">{day.short}</span>
                                                <span className="hidden md:inline">{day.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Hours Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 bg-[#111]">
                                {/* Delivery Hours */}
                                <div className="p-6 md:border-r border-b md:border-b-0 border-white/5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MapPin size={16} className="text-cdh-orange" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-wide">Envío a Domicilio</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Apertura</label>
                                            <input
                                                type="time"
                                                value={shift.delivery_start_time}
                                                onChange={(e) => updateShift(shift.id, 'delivery_start_time', e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-cdh-orange text-sm font-mono font-bold"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cierre</label>
                                            <input
                                                type="time"
                                                value={shift.delivery_end_time}
                                                onChange={(e) => updateShift(shift.id, 'delivery_end_time', e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-cdh-orange text-sm font-mono font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pickup Hours */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Store size={16} className="text-cdh-orange" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-wide">Retiro por Local</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Apertura</label>
                                            <input
                                                type="time"
                                                value={shift.pickup_start_time}
                                                onChange={(e) => updateShift(shift.id, 'pickup_start_time', e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-cdh-orange text-sm font-mono font-bold"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cierre</label>
                                            <input
                                                type="time"
                                                value={shift.pickup_end_time}
                                                onChange={(e) => updateShift(shift.id, 'pickup_end_time', e.target.value)}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-cdh-orange text-sm font-mono font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default StoreHoursModule;
