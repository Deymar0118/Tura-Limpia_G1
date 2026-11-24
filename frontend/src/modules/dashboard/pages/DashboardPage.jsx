import { requiereRol, ROLES } from '../../../app/session'
import AdminDashboardPage from './AdminDashboardPage'
import CiudadanoDashboardPage from './CiudadanoDashboardPage'

/**
 * Componente principal del Dashboard.
 * Evalúa el rol del usuario autenticado y delega a la página correspondiente.
 */
function DashboardPage() {
  if (requiereRol([ROLES.ADMIN])) {
    return <AdminDashboardPage />
  }

  return <CiudadanoDashboardPage />
}

export default DashboardPage