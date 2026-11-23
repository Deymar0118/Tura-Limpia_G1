
import {
  apiClient,
  clearAuthTokens,
  setAuthTokens,
  clearEmailToken,
  setEmailToken,
  getRefreshToken,
} from '../../../shared/api/apiClient'
import { clearSession, setSession } from '../../../app/session'

async function autenticar(ruta, body) {
  const tokens = await apiClient(ruta, {
    metodo: 'POST',
    body,
  })

  setAuthTokens(tokens)

  try {
    const usuario = await apiClient('/auth/me')
    setSession(usuario)
    return { tokens, usuario }
  } catch (error) {
    clearAuthTokens()
    throw error
  }
}

export function iniciarSesion({ email, password }) {
  return autenticar('/auth/login', {
    email,
    password,
  })
}

export async function cerrarSesion() {
  const refreshToken = getRefreshToken()

  if (refreshToken) {
    try {
      await apiClient('/auth/logout', {
        metodo: 'POST',
        body: { refresh_token: refreshToken },
      })
    } catch {

    }
  }

  clearAuthTokens()
  clearSession()
}

export async function registrarUsuario({ nombre, email, password}) {
  const respuesta = await apiClient('/auth/registro', {
    metodo: 'POST',
    body: {
      nombre,
      email,
      password,
    },
  })

  if (respuesta?.email_token) {
    setEmailToken(respuesta.email_token)
  }
  return respuesta
}

export async function verificarCodigo({ codigo }) {
  const resultado = await autenticar('/auth/verificar-codigo', {codigo })
  clearEmailToken()
  return resultado
}

export function obtenerMensajeAuth(error) {
  if (Array.isArray(error?.detail)) {
    return error.detail.map((item) => item.msg).join('. ')
  }

  return error?.detail || error?.message || 'No se pudo completar la operación'
}

export function solicitarRecuperacion({ email }) {
  return apiClient('/auth/recuperar-contrasena', {
    metodo: 'POST',
    body: { email },
  })
}

export function restablecerContrasena({ token, password }) {
  return apiClient('/auth/restablecer-contrasena', {
    metodo: 'POST',
    body: { token, password },
  })
}
