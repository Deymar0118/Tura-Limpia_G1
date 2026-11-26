
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { getSession, ETIQUETA_ROL } from '../../../app/session'
import { cerrarSesion } from '../../auth/services/authService'
import TuraLimpiaLogo from '../../../shared/assets/TuraLimpiaLogo.png'
import './AdminSidebar.css'

/**
 * Barra lateral izquierda (Sidebar) para el panel de administración.
 * Permanece visible y persistente en todas las rutas administrativas.
 * Permite contraerse o expandirse con suavidad.
 */
function AdminSidebar({ colapsado, onToggle }) {
  const navigate = useNavigate()
  const sesion = getSession()
  const [avisoConstruccion, setAvisoConstruccion] = useState(null)

  const nombreUsuario =
    sesion?.nombre || sesion?.nombre_usuario || 'Usuario'

  // Los roles de la sesión se almacenan en un arreglo: sesion.roles.
  const rolesUsuario = Array.isArray(sesion?.roles)
    ? sesion.roles
    : []

  // Convertir los códigos de rol en etiquetas legibles.
  const rolUsuario = rolesUsuario.length > 0
    ? rolesUsuario
        .map((rol) => ETIQUETA_ROL[String(rol).toLowerCase()] || rol)
        .join(', ')
    : 'Sin rol asignado'

  const handleCerrarSesion = async () => {
    try {
      await cerrarSesion()
    } catch {
      // Ignorar fallos de red al cerrar sesión localmente
    } finally {
      navigate('/login', { replace: true })
    }
  }

  // Lista de funciones de administración para la barra lateral.
  const enlacesNav = [
    {
      to: '/dashboard',
      etiqueta: 'Panel Principal',
      enConstruccion: false,
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      ),
    },
    {
      to: '/admin/usuarios',
      etiqueta: 'Gestión de Usuarios',
      enConstruccion: true,
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      to: '/construccion/personal',
      etiqueta: 'Personal y Cuadrillas',
      enConstruccion: true,
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      to: '/construccion/rutas',
      etiqueta: 'Territorio y Rutas',
      enConstruccion: true,
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      ),
    },
    {
      to: '/admin/vehiculos',
      etiqueta: 'Gestión de Vehículos',
      enConstruccion: false,
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      to: '/construccion/monitoreo',
      etiqueta: 'Monitoreo GPS e Incidencias',
      enConstruccion: true,
      icono: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
  ]

  const handleItemClick = (e, enlace) => {
    if (enlace.enConstruccion) {
      e.preventDefault()
      setAvisoConstruccion(
        `La sección "${enlace.etiqueta}" se encuentra actualmente en construcción.`
      )

      setTimeout(() => {
        setAvisoConstruccion(null)
      }, 3500)

      return
    }

    // En pantallas móviles, cerrar el menú al seleccionar un enlace.
    if (
      typeof window !== 'undefined' &&
      window.innerWidth <= 768 &&
      !colapsado
    ) {
      onToggle()
    }
  }

  return (
    <aside
      className={`admin-sidebar ${
        colapsado ? 'admin-sidebar--collapsed' : ''
      }`}
    >
      {/* Cabecera del Sidebar */}
      <div className="admin-sidebar__header">
        <div className="admin-sidebar__brand">
          <img
            src={TuraLimpiaLogo}
            alt="Logo Tura Limpia"
            className="admin-sidebar__logo"
          />

          {!colapsado && (
            <div className="admin-sidebar__brand-text">
              <span className="admin-sidebar__title">
                Tura Limpia
              </span>
              <span className="admin-sidebar__sub">
                Administración
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="admin-sidebar__toggle-btn"
          onClick={onToggle}
          title={
            colapsado
              ? 'Expandir barra lateral'
              : 'Contraer barra lateral'
          }
          aria-label={
            colapsado
              ? 'Expandir barra lateral'
              : 'Contraer barra lateral'
          }
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`admin-sidebar__toggle-icon ${
              colapsado
                ? 'admin-sidebar__toggle-icon--rotated'
                : ''
            }`}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Enlaces de Navegación */}
      <nav
        className="admin-sidebar__nav"
        aria-label="Menú de Navegación Administrativa"
      >
        {!colapsado && (
          <span className="admin-sidebar__section-tag">
            Funciones del Sistema
          </span>
        )}

        <ul className="admin-sidebar__menu">
          {enlacesNav.map((enlace) => (
            <li
              key={enlace.to}
              className="admin-sidebar__item"
            >
              <NavLink
                to={enlace.to}
                onClick={(e) => handleItemClick(e, enlace)}
                className={({ isActive }) =>
                  `admin-sidebar__link ${
                    isActive && !enlace.enConstruccion
                      ? 'admin-sidebar__link--active'
                      : ''
                  }`
                }
                title={colapsado ? enlace.etiqueta : undefined}
              >
                <span className="admin-sidebar__icon">
                  {enlace.icono}
                </span>

                {!colapsado && (
                  <span className="admin-sidebar__label-wrap">
                    <span className="admin-sidebar__label">
                      {enlace.etiqueta}
                    </span>

                    {enlace.enConstruccion && (
                      <span className="admin-sidebar__badge-dev">
                        Pronto
                      </span>
                    )}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Pie del Sidebar: Usuario y Logout */}
      <div className="admin-sidebar__footer">
        <div className="admin-sidebar__user">
          <div className="admin-sidebar__avatar">
            {nombreUsuario.charAt(0).toUpperCase()}
          </div>

          {!colapsado && (
            <div className="admin-sidebar__user-details">
              <span
                className="admin-sidebar__user-name"
                title={nombreUsuario}
              >
                {nombreUsuario}
              </span>

              <span className="admin-sidebar__user-role">
                {rolUsuario}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="admin-sidebar__logout-btn"
          onClick={handleCerrarSesion}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>

          {!colapsado && <span>Cerrar Sesión</span>}
        </button>
      </div>

      {/* Toast Flotante "En Construcción" */}
      {avisoConstruccion && (
        <div
          className="admin-sidebar__toast"
          role="alert"
        >
          <span className="admin-sidebar__toast-icon">
            🚧
          </span>

          <div className="admin-sidebar__toast-content">
            <strong>Módulo en Construcción</strong>
            <p>{avisoConstruccion}</p>
          </div>

          <button
            type="button"
            className="admin-sidebar__toast-close"
            onClick={() => setAvisoConstruccion(null)}
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      )}
    </aside>
  )
}

export default AdminSidebar
