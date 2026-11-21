import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSession } from '../../../app/session'
import { cargarMetricasAdmin } from '../services/dashboardService'
import './AdminDashboardPage.css'

function AdminDashboardPage() {
  const sesion = getSession()

  const [metricas, setMetricas] = useState(null)
  const [cargandoMetricas, setCargandoMetricas] = useState(true)

  const nombreUsuario =
    sesion?.nombre || sesion?.nombre_usuario || 'Administrador'

  useEffect(() => {
    let activo = true

    cargarMetricasAdmin()
      .then((datos) => {
        if (!activo) return
        setMetricas(datos)
      })
      .catch(() => {
        if (!activo) return
        setMetricas(null)
      })
      .finally(() => {
        if (!activo) return
        setCargandoMetricas(false)
      })

    return () => {
      activo = false
    }
  }, [])

  return (
    <div className="admin-dash-page">
      <main className="admin-dash-container">
        {/* Banner Institucional de Bienvenida */}
        <section className="admin-welcome-banner">
          <div className="admin-welcome-text">
            <div className="admin-welcome-badge">
              <span className="admin-welcome-dot" />
              Sistema Operativo Conectado
            </div>

            <h1>Bienvenido, {nombreUsuario}</h1>

            <p>
              Supervisa en tiempo real las operaciones de recolección y aseo en Buenaventura.
              Utiliza la barra lateral izquierda para acceder a los módulos de gestión.
            </p>
          </div>
        </section>

        {/* Sección de Métricas y Estadísticas Rápidas */}
        <section className="admin-stats-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Resumen Operativo</h2>
            <p className="admin-section-subtitle">
              Estado general de usuarios, personal y cobertura en Buenaventura
            </p>
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Total Usuarios</span>
                <span className="admin-stat-icon-wrap admin-stat-icon-wrap--blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
              </div>
              <div className="admin-stat-body">
                <span className="admin-stat-value">
                  {cargandoMetricas ? '...' : metricas?.usuariosTotal ?? 0}
                </span>
                <span className="admin-stat-tag admin-stat-tag--neutral">Registrados</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Usuarios Activos</span>
                <span className="admin-stat-icon-wrap admin-stat-icon-wrap--green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
              </div>
              <div className="admin-stat-body">
                <span className="admin-stat-value admin-stat-value--green">
                  {cargandoMetricas ? '...' : metricas?.usuariosActivos ?? 0}
                </span>
                <span className="admin-stat-tag admin-stat-tag--green">Habilitados</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Suspendidos / Inactivos</span>
                <span className="admin-stat-icon-wrap admin-stat-icon-wrap--red">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </span>
              </div>
              <div className="admin-stat-body">
                <span className="admin-stat-value admin-stat-value--red">
                  {cargandoMetricas ? '...' : metricas?.usuariosInactivos ?? 0}
                </span>
                <span className="admin-stat-tag admin-stat-tag--red">Sin acceso</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Flota en Servicio</span>
                <span className="admin-stat-icon-wrap admin-stat-icon-wrap--amber">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </span>
              </div>
              <div className="admin-stat-body">
                <span className="admin-stat-value">
                  {cargandoMetricas ? '...' : metricas?.flotaOperativa ?? '0 / 0'}
                </span>
                <span className="admin-stat-tag admin-stat-tag--amber">Compactadores</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Rutas del Día</span>
                <span className="admin-stat-icon-wrap admin-stat-icon-wrap--blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                  </svg>
                </span>
              </div>
              <div className="admin-stat-body">
                <span className="admin-stat-value">
                  {cargandoMetricas ? '...' : metricas?.rutasHoy ?? 0}
                </span>
                <span className="admin-stat-tag admin-stat-tag--blue">Programadas</span>
              </div>
            </div>
          </div>
        </section>

        {/* Acceso Rápido Directo al Módulo Prioritario */}
        <section className="admin-quick-access-section">
          <div className="admin-quick-card">
            <div className="admin-quick-card__info">
              <div className="admin-quick-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h3 className="admin-quick-card__title">Gestión de Usuarios y Roles</h3>
                <p className="admin-quick-card__desc">
                  Consulta, registra funcionarios, actualiza documentos de identidad y gestiona roles en el sistema.
                </p>
              </div>
            </div>
            <Link to="/admin/usuarios" className="admin-quick-card__btn">
              Ir a Gestión de Usuarios &rarr;
            </Link>
          </div>
        </section>

        <footer className="admin-dash-footer">
          Tura Limpia &copy; {new Date().getFullYear()} &mdash; Universidad del
          Pacífico &amp; Pazífico Limpio S.A.S. E.S.P. &bull; Buenaventura
        </footer>
      </main>
    </div>
  )
}

export default AdminDashboardPage
