import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import './AdminLayout.css'

/**
 * Layout principal para la administración de Tura Limpia.
 * Mantiene la barra lateral izquierda persistente en todas las vistas.
 */
function AdminLayout() {
  const [colapsado, setColapsado] = useState(false)

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
