import React from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { ShoppingBag, Tag, LogOut, Users, Map, CreditCard, Clock } from 'lucide-react';

function AdminLayout() {
    // Simple check for MVP: exists 'admin_token' in localStorage
    const isAuthenticated = localStorage.getItem('admin_token') === 'true';

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
    };

    return (
        <div className="min-h-screen bg-[#111] text-white flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-[#1a1a1a] border-r border-white/10 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-black text-cdh-orange uppercase tracking-wider">CDH Admin</h2>
                    <p className="text-xs text-gray-500 mt-1">Panel de Control</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-cdh-orange/10 text-cdh-orange font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-bold'}`}
                    >
                        <ShoppingBag size={20} />
                        <span>Pedidos</span>
                    </NavLink>
                    <NavLink
                        to="/admin/promos"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-cdh-orange/10 text-cdh-orange font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-bold'}`}
                    >
                        <Tag size={20} />
                        <span>Promociones</span>
                    </NavLink>
                    <NavLink
                        to="/admin/clientes"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-cdh-orange/10 text-cdh-orange font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-bold'}`}
                    >
                        <Users size={20} />
                        <span>Clientes</span>
                    </NavLink>
                    <NavLink
                        to="/admin/envios"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-cdh-orange/10 text-cdh-orange font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-bold'}`}
                    >
                        <Map size={20} />
                        <span>Envíos</span>
                    </NavLink>
                    <NavLink
                        to="/admin/pagos"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-cdh-orange/10 text-cdh-orange font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-bold'}`}
                    >
                        <CreditCard size={20} />
                        <span>Pagos</span>
                    </NavLink>
                    <NavLink
                        to="/admin/horarios"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-cdh-orange/10 text-cdh-orange font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-bold'}`}
                    >
                        <Clock size={20} />
                        <span>Horarios</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-bold">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-[#1a1a1a] border-b border-white/10 p-4 flex justify-between items-center">
                    <h2 className="text-lg font-black text-cdh-orange uppercase">CDH Admin</h2>
                    <button onClick={handleLogout} className="p-2 text-red-400">
                        <LogOut size={20} />
                    </button>
                </header>

                {/* Render active module */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-cdh-black">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;
