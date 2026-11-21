import { getRol } from '../../../app/session'
import AdminDashboardPage from './AdminDashboardPage'

/**
 * Componente principal del Dashboard.
 * Evalúa el rol del usuario autenticado y delega a la página correspondiente.
 */
function DashboardPage() {
  const rol = getRol()

  // Por el momento nos enfocamos en el rol Administrador
  if (rol === 'admin') return <AdminDashboardPage />

  // Fallback por defecto mientras se implementan los otros roles
  return <AdminDashboardPage />
}

export default DashboardPage
