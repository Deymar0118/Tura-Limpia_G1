import { useNavigate } from 'react-router-dom'
import { getUsuario, ETIQUETA_ROL } from '../../../app/session'
import { cerrarSesion } from '../../auth/services/authService'
import './CiudadanoDashboardPage.css'

function obtenerInicial(texto) {
  const limpio = typeof texto === 'string' ? texto.trim() : ''
  return limpio ? limpio.charAt(0).toUpperCase() : 'C'
}

function formatearEtiquetaRol(rol) {
  return ETIQUETA_ROL[rol] || rol
}

function CiudadanoDashboardPage() {
  const navigate = useNavigate()
  const usuario = getUsuario()

  const nombreUsuario = usuario?.nombre || 'Ciudadano'
  const emailUsuario = usuario?.email ?? null
  const rolesUsuario = Array.isArray(usuario?.roles) ? usuario.roles : []
  const estaActivo = Boolean(usuario?.isActive)
  const inicialNombre = obtenerInicial(nombreUsuario)

  const handleCerrarSesion = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className="ciudadano-dash-page">
      {/* Header con avatar de inicial, roles y cerrar sesión */}
      <header className="ciudadano-topbar">
        <div className="ciudadano-topbar__brand">
          <span className="ciudadano-topbar__badge">Tura Limpia</span>
          <span className="ciudadano-topbar__subtitle">Portal Ciudadano</span>
        </div>

        <div className="ciudadano-topbar__user-area">
          <div className="ciudadano-avatar" aria-hidden="true">
            {inicialNombre}
          </div>

          <div className="ciudadano-topbar__meta">
            <span className="ciudadano-topbar__name">{nombreUsuario}</span>

            <div className="ciudadano-roles-list" aria-label="Roles del usuario">
              {rolesUsuario.length > 0 ? (
                rolesUsuario.map((rol) => (
                  <span key={rol} className="ciudadano-role-pill">
                    {formatearEtiquetaRol(rol)}
                  </span>
                ))
              ) : (
                <span className="ciudadano-role-pill ciudadano-role-pill--muted">
                  Sin rol en sesión
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCerrarSesion}
            className="ciudadano-logout-btn"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="ciudadano-dash-container">
        {/* Banner de Bienvenida */}
        <section className="ciudadano-welcome-banner">
          <div className="ciudadano-welcome-text">
            <div className="ciudadano-welcome-badge">
              <span className="ciudadano-welcome-dot" />
              Módulo en diseño
            </div>

            <h1>Bienvenido, {nombreUsuario}</h1>

            <p>
              Tu espacio ciudadano en Tura Limpia se encuentra actualmente en etapa
              de diseño. Pronto podrás consultar horarios de recolección y realizar
              seguimientos en Buenaventura.
            </p>
          </div>
        </section>

        {/* Información del Usuario y Aviso de Módulo en Diseño */}
        <section className="ciudadano-info-section">
          <div className="ciudadano-profile-card">
            <div className="ciudadano-profile-card__top">
              <div className="ciudadano-profile-avatar-lg" aria-hidden="true">
                {inicialNombre}
              </div>

              <div>
                <h2 className="ciudadano-section-title">Información del Usuario</h2>
                <p className="ciudadano-section-subtitle">
                  Datos básicos asociados a tu sesión actual
                </p>
              </div>
            </div>

            <dl className="ciudadano-user-grid">
              <div className="ciudadano-user-item">
                <dt>Nombre</dt>
                <dd>{nombreUsuario}</dd>
              </div>

              {emailUsuario && (
                <div className="ciudadano-user-item">
                  <dt>Correo electrónico</dt>
                  <dd>{emailUsuario}</dd>
                </div>
              )}

              <div className="ciudadano-user-item">
                <dt>Roles asignados</dt>
                <dd>
                  {rolesUsuario.length > 0
                    ? rolesUsuario.map(formatearEtiquetaRol).join(', ')
                    : 'Sin rol en sesión'}
                </dd>
              </div>

              <div className="ciudadano-user-item">
                <dt>Estado de cuenta</dt>
                <dd>
                  <span
                    className={`ciudadano-status-tag ${
                      estaActivo
                        ? 'ciudadano-status-tag--active'
                        : 'ciudadano-status-tag--inactive'
                    }`}
                  >
                    {estaActivo ? 'Activa' : 'Inactiva'}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="ciudadano-design-notice" role="status">
              <strong>Vista en diseño:</strong> Las funciones interactivas para
              ciudadanos aún están en construcción y no muestran métricas ni
              indicadores operativos en esta etapa.
            </div>
          </div>
        </section>

        <footer className="ciudadano-dash-footer">
          Tura Limpia &copy; {new Date().getFullYear()} &mdash; Universidad del
          Pacífico &amp; Pazífico Limpio S.A.S. E.S.P. &bull; Buenaventura
        </footer>
      </main>
    </div>
  )
}

export default CiudadanoDashboardPage