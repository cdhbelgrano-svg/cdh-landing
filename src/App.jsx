import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Checkout from './pages/Checkout'
import CheckoutReturn from './pages/CheckoutReturn'

// Admin Components
import AdminLayout from './components/admin/AdminLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import PromosModule from './components/admin/PromosModule'
import ClientesModule from './components/admin/ClientesModule'
import EnviosModule from './components/admin/EnviosModule'
import PaymentsModule from './components/admin/PaymentsModule'
import StoreHoursModule from './components/admin/StoreHoursModule'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/:status" element={<CheckoutReturn />} />

        {/* Admin Public Routes */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin Private Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="promos" element={<PromosModule />} />
          <Route path="clientes" element={<ClientesModule />} />
          <Route path="envios" element={<EnviosModule />} />
          <Route path="pagos" element={<PaymentsModule />} />
          <Route path="horarios" element={<StoreHoursModule />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
