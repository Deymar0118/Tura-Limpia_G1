import { clearQueryCache, setQueryCacheScope } from '../shared/api/queryCache'

const SESSION_KEY = 'turalimpia.session'

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  GERENTE: 'gerente',
  PLANIFICADOR:"planificador",
  TRABAJADOR: 'trabajador',
  CIUDADANO: 'ciudadano',
})

export const ETIQUETA_ROL = Object.freeze({
  admin: 'Administrador',
  gerente: 'Gerente',
  planificador: "Planificador",
  trabajador: 'Trabajador',
  ciudadano: 'Ciudadano',
})

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setSession(session) {
  if (session) {
    saveSession(session)
  } else {
    clearSession()
  }

  return session
}

export function saveSession(sesion, { actualizarCache = true } = {}) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion))

  if (actualizarCache) {
    setQueryCacheScope(sesion?.email || 'anon')
  }
}

export function updateSession(cambios) {
  const actual = getSession() || {}
  saveSession({ ...actual, ...cambios }, { actualizarCache: false })
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  clearQueryCache()
  setQueryCacheScope('anon')
}

export function getRoles() {
  const roles = getSession()?.roles
  return Array.isArray(roles) ? roles : []
}

export function requiereRol(rolesPermitidos = []) {
  const rolesUsuario = getRoles()
  if (!Array.isArray(rolesPermitidos) || rolesPermitidos.length === 0) {
    return false
  }
  return rolesPermitidos.some((rol) => rolesUsuario.includes(rol))
}

export function getUsuario() {
  const sesion = getSession()
  if (!sesion) return null

  return {
    nombre: sesion.nombre ?? null,
    email: sesion.email ?? null,
    roles: Array.isArray(sesion.roles) ? sesion.roles : [],
    isActive: Boolean(sesion.is_active),
  }
}

if (typeof localStorage !== 'undefined') {
  setQueryCacheScope(getSession()?.email || 'anon')
}


