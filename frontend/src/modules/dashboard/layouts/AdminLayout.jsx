import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { getRol, ROLES } from '../../../app/session'
import AdminSidebar from '../components/AdminSidebar'
import './AdminLayout.css'

/**
 * Layout principal para la administración de Tura Limpia.
 * Mantiene la barra lateral izquierda persistente únicamente para roles administrativos.
 */
function AdminLayout() {
  // Inicia comprimida por defecto al iniciar sesión o cargar la página
  const [colapsado, setColapsado] = useState(true)
  const rol = String(getRol() || '').trim().toLowerCase()
  const esAdmin = rol === ROLES.ADMIN || rol === 'administrador'

  // Si el usuario no es administrador (ej. ciudadano), no se muestra la barra administrativa
  if (!esAdmin) {
    return <Outlet />
  }

  const handleToggle = () => {
    setColapsado((prev) => !prev)
  }

  return (
    <div className="admin-layout">
      {/* Barra lateral desplegable/colapsable a la izquierda */}
      <AdminSidebar colapsado={colapsado} onToggle={handleToggle} />

      {/* Área de contenido dinámico principal */}
      <div className={`admin-layout__content ${colapsado ? 'admin-layout__content--collapsed' : ''}`}>
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
