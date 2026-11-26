import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import LandingPage from './modules/landing/pages/LandingPage'
import AuthPage from './modules/auth/pages/AuthPage'
import AdminLayout from './modules/dashboard/layouts/AdminLayout'
import { VerificarCodigoPage } from './modules/auth/pages/VerificarCodigoPage'
import DashboardPage from './modules/dashboard/pages/DashboardPage'
import VehiculosPage from './modules/vehiculos/pages/VehiculosPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<AuthPage initialTab="login" />} />
        <Route path="/registro" element={<AuthPage initialTab="registro" />} />
        <Route path="/verificar-codigo" element={<VerificarCodigoPage />} />
        <Route path="/" element={<LandingPage />} />

        {/* Rutas Administrativas con Barra Lateral Izquierda Persistente */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin/usuarios" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin/vehiculos" element={<VehiculosPage />} />
          <Route path="/construccion/flota" element={<Navigate to="/admin/vehiculos" replace />} />
          <Route path="/construccion/:modulo" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
