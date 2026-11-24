import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { requiereRol, ROLES, getSession } from '../../../app/session'
import AdminSidebar from '../components/AdminSidebar'
import './AdminLayout.css'

/**
 * Layout principal para la administración de Tura Limpia.
 * Mantiene la barra lateral izquierda persistente únicamente para roles administrativos.
 */
function AdminLayout() {
  // Inicia comprimida por defecto al iniciar sesión o cargar la página
  const [colapsado, setColapsado] = useState(true)

  // Verifica si el usuario autenticado tiene rol de administrador
  const sesion = getSession()
  const esAdmin = typeof requiereRol === 'function'
    ? requiereRol([ROLES.ADMIN])
    : (sesion?.rol === ROLES.ADMIN || sesion?.rol === 'administrador')

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
