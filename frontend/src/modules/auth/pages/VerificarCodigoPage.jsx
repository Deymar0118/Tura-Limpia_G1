import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getEmailToken } from '../../../shared/api/apiClient'
import { obtenerMensajeAuth, verificarCodigo } from '../services/authService'
import { OtpInput } from '../components/OtpInput'
import './VerificarCodigoPage.css'

export function VerificarCodigoPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const emailRegistrado = location.state?.email || ''

  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getEmailToken()) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (codigo.length < 6) {
      setError('Ingresa los 6 dígitos enviados a tu correo.')
      return
    }

    setError('')
    setCargando(true)

    try {
      await verificarCodigo({ codigo })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(obtenerMensajeAuth(err))
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="tl-auth-layout">
      <aside className="tl-auth-showcase" aria-hidden="true">
        <div className="tl-showcase-badge tl-badge-tl">
          <span className="tl-pin-dot" />
          Optimización de rutas
        </div>
        <div className="tl-showcase-badge tl-badge-tr">
          <span className="tl-pin-dot" />
          Mapa de puntos críticos
        </div>

        <div className="tl-showcase-center">
          <div className="tl-security-card">
            <div className="tl-shield-ring">
              <svg
                viewBox="0 0 24 24"
                width="36"
                height="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <p className="tl-security-title">Verificación en dos pasos</p>
            <p className="tl-security-sub">
              Protegemos el acceso operativo a la plataforma ambiental de Buenaventura.
            </p>
          </div>

          <div className="tl-status-pills">
            <span className="tl-pill-active">Código enviado</span>
            <span className="tl-pill-muted">Validación pendiente</span>
          </div>
        </div>

        <div className="tl-showcase-badge tl-badge-bl">
          <span className="tl-pin-dot" />
          Telemetría de flota
        </div>
        <div className="tl-showcase-badge tl-badge-br">
          <span className="tl-pin-dot" />
          Registro de incidencias
        </div>
      </aside>

      <section className="tl-auth-panel">
        <header className="tl-auth-topbar">
          <div className="tl-brand-tagline">
            <span className="tl-status-dot" />
            <span>Por una Buenaventura más Limpia</span>
          </div>
          <Link to="/soporte" className="tl-support-btn">
            Soporte Asistencial
          </Link>
        </header>

        <div className="tl-auth-content">
          <Link to="/login" className="tl-back-link">
            <span>&lsaquo;</span> Volver al registro
          </Link>

          <div className="tl-verify-badge">Paso final de registro</div>

          <h1 className="tl-auth-title">Verifica tu correo</h1>
          <p className="tl-auth-subtitle">
            Hemos enviado un código de 6 dígitos{' '}
            {emailRegistrado ? (
              <>
                a <strong className="tl-highlight-email">{emailRegistrado}</strong>.
              </>
            ) : (
              'a tu bandeja de entrada.'
            )}
          </p>

          <form className="tl-verify-form" onSubmit={handleSubmit} noValidate>
            <label className="tl-field-label">Código de verificación</label>

            <OtpInput
              length={6}
              value={codigo}
              onChange={(val) => {
                setCodigo(val)
                if (error) setError('')
              }}
              disabled={cargando}
            />

            {error && (
              <div className="tl-alert-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="tl-submit-btn"
              disabled={cargando || codigo.length < 6}
            >
              {cargando ? 'Verificando código...' : 'Confirmar y continuar'}
            </button>
          </form>

          <p className="tl-helper-note">
            ¿No recibiste el correo? Revisa tu carpeta de spam o{' '}
            <Link to="/login" className="tl-inline-link">
              intenta registrarte nuevamente
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}