import React, { useState, useEffect, useRef } from 'react';
import { Search, Mail, Phone, MapPin, Edit3, Save, X, PlusCircle, Download, Upload } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

function ClientesModule() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({ email: '', name: '', phone: '', address: '' });
    const [formError, setFormError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('last_order_date', { ascending: false });

        if (error) {
            console.error('Error cargando clientes:', error);
        } else {
            setCustomers(data || []);
        }
        setLoading(false);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const filteredCustomers = customers.filter(c =>
        (c.name && c.name.toLowerCase().includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm)) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    const openModal = (customer = null) => {
        setFormError('');
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                email: customer.email,
                name: customer.name || '',
                phone: customer.phone || '',
                address: customer.address || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({ email: '', name: '', phone: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleSave = async () => {
        if (!formData.email.trim() || !formData.name.trim()) {
            setFormError('El correo electrónico y el nombre son oblicatorios.');
            return;
        }

        setIsSaving(true);
        try {
            // Upsert in Supabase
            // If editingCustomer, total_orders and last_order_date stay the same due to partial update unless overridden
            // Since email is PK, upserting by email updates existing or creates new.
            const payload = {
                email: formData.email.trim().toLowerCase(),
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim()
            };

            const { error } = await supabase.from('customers').upsert(payload);

            if (error) throw error;

            await loadCustomers();
            closeModal();
        } catch (err) {
            console.error(err);
            setFormError('Ocurrió un error al guardar el cliente.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- CSV Export/Import Feature ---
    const handleExportCSV = () => {
        if (customers.length === 0) {
            alert("No hay clientes para exportar.");
            return;
        }

        const headers = ["email", "name", "phone", "address", "total_orders", "last_order_date"];
        const rows = customers.map(c => [
            c.email,
            c.name ? `"${c.name}"` : "",
            c.phone || "",
            c.address ? `"${c.address}"` : "",
            c.total_orders || 0,
            c.last_order_date || ""
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `clientes_cdh_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSVClick = () => {
        fileInputRef.current.click();
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split("\n").filter(line => line.trim() !== "");
            if (lines.length < 2) {
                alert("El archivo CSV está vacío o no tiene el formato correcto.");
                return;
            }

            const header = lines[0].split(",");
            const emailIdx = header.indexOf("email");
            const nameIdx = header.indexOf("name");
            const phoneIdx = header.indexOf("phone");
            const addressIdx = header.indexOf("address");

            if (emailIdx === -1) {
                alert("El CSV debe contener al menos la columna 'email'.");
                return;
            }

            let importCount = 0;
            const recordsToUpsert = [];

            for (let i = 1; i < lines.length; i++) {
                // Regex to split CSV properly handling quotes
                const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (row.length > emailIdx) {
                    const email = row[emailIdx].replace(/"/g, "").trim().toLowerCase();
                    if (!email) continue;

                    const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].replace(/"/g, "").trim() : "Cliente";
                    const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].replace(/"/g, "").trim() : "";
                    const address = addressIdx !== -1 && row[addressIdx] ? row[addressIdx].replace(/"/g, "").trim() : "";

                    recordsToUpsert.push({ email, name, phone, address });
                    importCount++;
                }
            }

            if (recordsToUpsert.length > 0) {
                // Batch Upsert
                const { error } = await supabase.from('customers').upsert(recordsToUpsert);
                if (error) {
                    alert(`Error importando clientes: ${error.message}`);
                } else {
                    alert(`¡Se importaron/actualizaron ${importCount} clientes correctamente!`);
                    loadCustomers();
                }
            }

            // reset input
            e.target.value = null;
        };
        reader.readAsText(file);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase text-white tracking-wider flex items-center gap-3">
                        Módulo de Clientes
                        <span className="bg-cdh-orange/20 text-cdh-orange text-xs py-1 px-3 rounded-full border border-cdh-orange/30">
                            CRM
                        </span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Gestioná la base de datos de compradores, exportá contactos para campañas.
                    </p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={handleImportCSVClick}
                        className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg border border-white/10 transition-colors"
                    >
                        <Upload size={16} /> <span className="hidden md:inline">Importar CSV</span>
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg border border-white/10 transition-colors"
                    >
                        <Download size={16} /> <span className="hidden md:inline">Exportar CSV</span>
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-cdh-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-[0_0_15px_rgba(242,101,19,0.3)]"
                    >
                        <PlusCircle size={16} /> <span className="hidden md:inline">Nuevo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Fila de búsqueda */}
            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10 flex items-center gap-3 mb-6">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="bg-transparent border-none text-white focus:outline-none flex-1 text-sm font-medium"
                />
            </div>

            {/* Tabla */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/50 border-b border-white/10 text-xs text-gray-400 uppercase tracking-widest">
                                <th className="p-4 font-bold">Cliente</th>
                                <th className="p-4 font-bold">Contacto</th>
                                <th className="p-4 font-bold">Dirección</th>
                                <th className="p-4 font-bold text-center">Compras</th>
                                <th className="p-4 font-bold text-center">Última Compra</th>
                                <th className="p-4 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center p-8 text-gray-500">Cargando base de clientes...</td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center p-8 text-gray-500">No se encontraron clientes.</td>
                                </tr>
                            ) : (
                                filteredCustomers.map((c) => (
                                    <tr key={c.email} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-white uppercase text-sm">{c.name}</p>
                                        </td>
                                        <td className="p-4 space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                                <Mail size={12} className="text-cdh-orange" /> {c.email}
                                            </div>
                                            {c.phone && (
                                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                                    <Phone size={12} className="text-cdh-orange" /> {c.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-gray-300 max-w-[200px] truncate">
                                            {c.address ? (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-gray-500 flex-shrink-0" /> <span className="truncate">{c.address}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                                                {c.total_orders}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-xs text-gray-300">
                                            {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('es-AR') : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => openModal(c)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Editar Cliente"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Crear/Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                        <div className="bg-black/50 p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-black text-white uppercase tracking-wider">
                                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {formError && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-xs font-bold text-center">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email (Identificador único)</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!!editingCustomer} // Cannot edit email once created, it's the PK
                                    className={`w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-cdh-orange transition-colors ${editingCustomer ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-cdh-orange transition-colors"
                                    placeholder="Lucas Martínez"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-cdh-orange transition-colors"
                                        placeholder="2944 123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dirección Frecuente</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-cdh-orange transition-colors"
                                        placeholder="San Martin 123"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/50 p-4 border-t border-white/10 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-xl font-black text-sm text-white bg-cdh-orange hover:bg-orange-600 uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(242,101,19,0.3)] disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? 'Guardando...' : <><Save size={16} /> Guardar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClientesModule;
