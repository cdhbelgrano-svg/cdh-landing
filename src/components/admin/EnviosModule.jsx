import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, MapPin, Navigation } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLoadScript, GoogleMap, Marker, Circle, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
};

function EnviosModule() {
    const [settings, setSettings] = useState({
        base_price: 5000,
        price_per_km: 1000,
        max_distance_km: 10,
        is_active: true,
        origin_address: '24 de Septiembre 210, San Carlos de Bariloche, Río Negro, Argentina',
        origin_lat: -41.1334722,
        origin_lng: -71.3102778,
        peya_active: false,
        peya_token: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const autocompleteRef = useRef(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        setLoading(true);
        const { data, error } = await supabase
            .from('delivery_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!error && data) {
            setSettings({
                base_price: data.base_price,
                price_per_km: data.price_per_km,
                max_distance_km: data.max_distance_km,
                is_active: data.is_active,
                origin_address: data.origin_address || '24 de Septiembre 210, San Carlos de Bariloche, Río Negro, Argentina',
                origin_lat: data.origin_lat || -41.1334722,
                origin_lng: data.origin_lng || -71.3102778,
                peya_active: data.peya_active || false,
                peya_token: data.peya_token || ''
            });
        }
        setLoading(false);
    };

    const handlePlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                setSettings({
                    ...settings,
                    origin_address: place.formatted_address || place.name,
                    origin_lat: place.geometry.location.lat(),
                    origin_lng: place.geometry.location.lng()
                });
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        const { error } = await supabase
            .from('delivery_settings')
            .upsert({ id: 1, ...settings });

        if (error) {
            setMessage('Error al guardar: ' + error.message);
        } else {
            setMessage('¡Configuración guardada con éxito!');
        }
        setSaving(false);
    };

    if (loading) return <div className="text-gray-500">Cargando configuración...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-2xl font-black uppercase text-white tracking-wider flex items-center gap-3">
                    Configuración de Envíos
                    <span className="bg-cdh-orange/20 text-cdh-orange text-xs py-1 px-3 rounded-full border border-cdh-orange/30">
                        MAPS API
                    </span>
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    Gestioná la tarifa base, el extra por kilómetro y el límite de envíos.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start max-w-7xl">
                {/* Configuration Panel */}
                <div className="bg-[#1a1a1a] p-5 rounded-xl border border-white/10 w-full">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Estado del Delivery</label>
                                <div className="flex flex-col gap-1">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.is_active}
                                            onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cdh-orange"></div>
                                        <span className="ml-3 text-sm font-medium text-white">{settings.is_active ? 'Activo' : 'Pausado'}</span>
                                    </label>
                                    <p className="text-[10px] text-gray-500">Si lo pausás, solo Retiro en Local.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">PedidosYa Logistics</label>
                                <div className="flex flex-col gap-1">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.peya_active}
                                            onChange={(e) => setSettings({ ...settings, peya_active: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF004D]"></div>
                                        <span className="ml-3 text-sm font-medium text-white">{settings.peya_active ? 'Automático' : 'Apagado'}</span>
                                    </label>
                                    <p className="text-[10px] text-gray-500">Intenta cotizar con PeYa. Si falla usa el Mapa.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Dirección de Partida (Local)</label>
                                {isLoaded ? (
                                    <Autocomplete
                                        onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                                        onPlaceChanged={handlePlaceChanged}
                                        options={{ componentRestrictions: { country: 'ar' } }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Buscá tu sucursal..."
                                            value={settings.origin_address}
                                            onChange={(e) => setSettings({ ...settings, origin_address: e.target.value })}
                                            className="w-full bg-[#111] border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-cdh-orange transition-colors"
                                        />
                                    </Autocomplete>
                                ) : (
                                    <input
                                        type="text"
                                        disabled
                                        placeholder="Cargando mapas..."
                                        className="w-full bg-[#111] border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white opacity-50 cursor-not-allowed"
                                    />
                                )}
                                <p className="text-[10px] text-gray-500 mt-1">Desde este punto se medirá la distancia al cliente usando Google Maps.</p>
                            </div>

                            {settings.peya_active && (
                                <div>
                                    <label className="block text-xs font-bold text-[#FF004D] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        PeYa Logistics Token
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Ingresá el token de PedidosYa..."
                                        value={settings.peya_token}
                                        onChange={(e) => setSettings({ ...settings, peya_token: e.target.value })}
                                        className="w-full bg-[#111] border border-[#FF004D]/30 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#FF004D] transition-colors"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Necesario para generar estimaciones y solicitar repartidores.</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <MapPin size={14} /> Tarifa Base (AR$)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-bold">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={settings.base_price}
                                        onChange={(e) => setSettings({ ...settings, base_price: Number(e.target.value) })}
                                        className="w-full bg-[#111] border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-cdh-orange transition-colors"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">El monto fijo por envío.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Navigation size={14} /> Extra por Km
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-bold">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={settings.price_per_km}
                                        onChange={(e) => setSettings({ ...settings, price_per_km: Number(e.target.value) })}
                                        className="w-full bg-[#111] border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-cdh-orange transition-colors"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Costo que se suma por CADA km.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Distancia Máxima (Km)</label>
                            <input
                                type="number"
                                value={settings.max_distance_km}
                                onChange={(e) => setSettings({ ...settings, max_distance_km: Number(e.target.value) })}
                                className="w-full bg-[#111] border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-cdh-orange transition-colors"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Límite operativo. Si excede esto, se rechaza.</p>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-lg text-sm font-bold flex items-center gap-2 ${message.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                <AlertCircle size={16} /> {message}
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-cdh-orange hover:bg-orange-600 text-white font-black py-3 rounded-lg transition-colors uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(242,101,19,0.3)] disabled:opacity-50 text-sm"
                        >
                            {saving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                        </button>

                        <div className="bg-[#111] p-3 rounded-lg border border-white/5 text-[11px] text-gray-400 mt-2 leading-relaxed">
                            <strong>Simulador Mental:</strong> a 4.5km paga {settings.base_price} + (4.5 x {settings.price_per_km}) = AR$ {(settings.base_price + (4.5 * settings.price_per_km)).toLocaleString('es-AR')}.
                        </div>
                    </div>
                </div>

                {/* Map Visualization */}
                <div className="bg-[#1a1a1a] p-5 rounded-xl border border-white/10 w-full">
                    <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
                        <MapPin size={16} className="text-cdh-orange" /> Visualización de Cobertura
                    </h2>
                    {isLoaded ? (
                        <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg relative">
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={{ lat: settings.origin_lat, lng: settings.origin_lng }}
                                zoom={12}
                                options={{
                                    disableDefaultUI: true,
                                    zoomControl: true,
                                    styles: [
                                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                        {
                                            featureType: "administrative.locality",
                                            elementType: "labels.text.fill",
                                            stylers: [{ color: "#d59563" }],
                                        },
                                        {
                                            featureType: "poi",
                                            elementType: "labels.text.fill",
                                            stylers: [{ color: "#d59563" }],
                                        },
                                        {
                                            featureType: "poi.park",
                                            elementType: "geometry",
                                            stylers: [{ color: "#263c3f" }],
                                        },
                                        {
                                            featureType: "poi.park",
                                            elementType: "labels.text.fill",
                                            stylers: [{ color: "#6b9a76" }],
                                        },
                                        {
                                            featureType: "road",
                                            elementType: "geometry",
                                            stylers: [{ color: "#38414e" }],
                                        },
                                        {
                                            featureType: "road",
                                            elementType: "geometry.stroke",
                                            stylers: [{ color: "#212a37" }],
                                        },
                                        {
                                            featureType: "road",
                                            elementType: "labels.text.fill",
                                            stylers: [{ color: "#9ca5b3" }],
                                        },
                                        {
                                            featureType: "road.highway",
                                            elementType: "geometry",
                                            stylers: [{ color: "#746855" }],
                                        },
                                        {
                                            featureType: "road.highway",
                                            elementType: "geometry.stroke",
                                            stylers: [{ color: "#1f2835" }],
                                        },
                                        {
                                            featureType: "road.highway",
                                            elementType: "labels.text.fill",
                                            stylers: [{ color: "#f3d19c" }],
                                        },
                                        {
                                            featureType: "transit",
                                            elementType: "geometry",
                                            stylers: [{ color: "#2f3948" }],
                                        },
                                        {
                                            featureType: "transit.station",
                                            elementType: "labels.text.fill",
                                            stylers: [{ color: "#d59563" }],
                                        },
                                        {
                                            featureType: "water",
                                            elementType: "geometry",
                                            stylers: [{ color: "#17263c" }],
                                        },
                                        {
                                            featureType: "water",
                                            elementType: "labels.text.fill",
                                            stylers: [{ color: "#515c6d" }],
                                        },
                                        {
                                            featureType: "water",
                                            elementType: "labels.text.stroke",
                                            stylers: [{ color: "#17263c" }],
                                        },
                                    ]
                                }}
                            >
                                <Marker position={{ lat: settings.origin_lat, lng: settings.origin_lng }} />
                                <Circle
                                    center={{ lat: settings.origin_lat, lng: settings.origin_lng }}
                                    radius={settings.max_distance_km * 1000}
                                    options={{
                                        strokeColor: "#F26513",
                                        strokeOpacity: 0.8,
                                        strokeWeight: 2,
                                        fillColor: "#F26513",
                                        fillOpacity: 0.20,
                                    }}
                                />
                            </GoogleMap>

                            <div className="absolute top-4 left-4 bg-[#111]/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 text-xs font-bold text-white shadow-xl">
                                Radio de alcance: <span className="text-cdh-orange">{settings.max_distance_km} Km</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-[460px] bg-[#111] rounded-xl border border-white/10 flex items-center justify-center">
                            <span className="text-gray-500 font-bold animate-pulse text-sm">Cargando mapa...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EnviosModule;
