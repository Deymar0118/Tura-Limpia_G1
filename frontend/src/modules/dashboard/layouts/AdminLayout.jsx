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

  // Verifica si el usuario autenticado tiene rol de administrador o gerente
  const sesion = getSession()
  const esAutorizado = typeof requiereRol === 'function'
    ? requiereRol([ROLES.ADMIN, ROLES.GERENTE])
    : (
        sesion?.rol === ROLES.ADMIN ||
        sesion?.rol === ROLES.GERENTE ||
        sesion?.rol === 'admin' ||
        sesion?.rol === 'gerente' ||
        sesion?.rol === 'administrador'
      )

  // Si el usuario no tiene rol administrativo/gerencial (ej. ciudadano), no se muestra la barra administrativa
  if (!esAutorizado) {
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
