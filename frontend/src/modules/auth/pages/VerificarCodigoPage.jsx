import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getEmailToken } from '../../../shared/api/apiClient'
import RobotLogin from '../../../shared/assets/Robot_verificacion.png'
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
    <div className="verify-page">
      <main className="verify-layout">
        <section className="verify-visual" aria-label="Ilustración de verificación de correo">
          <img
            className="verify-visual__image"
            src={RobotLogin}
            alt="Robot ecológico sosteniendo un correo electrónico"
          />
        </section>

        <section className="verify-panel" aria-labelledby="verify-title">
          <div className="verify-card">
            <div className="verify-card__icon" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <rect x="7" y="10" width="30" height="24" rx="4" stroke="currentColor" strokeWidth="3" />
                <path d="m9 13 13 10 13-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h1 id="verify-title" className="verify-card__title">
              Confirma tu correo electrónico
            </h1>
            <p className="verify-card__subtitle">
              Hemos enviado un código de verificación a tu correo electrónico.
              Por favor, ingrésalo a continuación para activar tu cuenta en Tura Limpia.
              {emailRegistrado && (
                <span className="verify-card__email">{emailRegistrado}</span>
              )}
            </p>

            <form className="verify-form" onSubmit={handleSubmit} noValidate>
              <label className="verify-form__label">Código de verificación</label>

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
                <div className="verify-alert" role="alert">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="verify-submit"
                disabled={cargando || codigo.length < 6}
              >
                {cargando ? 'Verificando código...' : 'Confirmar código'}
              </button>
            </form>

            <p className="verify-help">
              ¿No recibiste el correo? Revisa tu carpeta de spam o correo no deseado.
              Si todavía no lo encuentras,{' '}
              <Link to="/registro">intenta registrarte nuevamente</Link>.
            </p>

            <Link to="/registro" className="verify-back">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M11 4 6 9l5 5M6.5 9H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver al registro
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}