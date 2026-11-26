import { apiClient } from '../../../shared/api/apiClient'

/**
 * Servicio para la gestión de vehículos de recolección y aseo en Tura Limpia.
 * Conecta con los endpoints de FastAPI bajo el prefijo /vehiculos.
 */

const BASE_URL = '/vehiculos'

/**
 * Constantes con los estados operativos permitidos según el contrato de la API.
 */
export const ESTADOS_OPERATIVOS = Object.freeze({
  OPERATIVO: 'operativo',
  EN_MANTENIMIENTO: 'en_mantenimiento',
  FUERA_DE_SERVICIO: 'fuera_de_servicio',
})

/**
 * Reglas de validación del modelo de vehículo según el Contrato API v1.1.
 */
export const REGLAS_VEHICULO = Object.freeze({
  ANIO_MINIMO: 1980,
  obtenerAnioMaximo: () => new Date().getFullYear() + 1,
  CAPACIDAD_MAXIMA_TON: 20,
  CIUDAD_MIN_LEN: 2,
  CIUDAD_MAX_LEN: 100,
})

/**
 * Extrae y formatea un mensaje de error legible del backend.
 */
export function obtenerMensajeVehiculo(error) {
  if (Array.isArray(error?.detail)) {
    return error.detail.map((item) => item.msg || JSON.stringify(item)).join('. ')
  }
  return error?.detail || error?.message || 'Ocurrió un error al procesar la solicitud'
}

/**
 * Lista vehículos con paginación offset y limit sanitizados.
 * @param {Object} params - { offset: number, limit: number }
 * @returns {Promise<{ items: Array, total: number, offset: number, limit: number }>}
 */
export async function listarVehiculos({ offset = 0, limit = 50 } = {}) {
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0)
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))

  return apiClient(`${BASE_URL}/`, {
    metodo: 'GET',
    query: { offset: safeOffset, limit: safeLimit },
  })
}

/**
 * Consulta un vehículo por su identificador único (UUID).
 * @param {string} idVehiculo
 */
export async function obtenerVehiculo(idVehiculo) {
  return apiClient(`${BASE_URL}/${idVehiculo}`, {
    metodo: 'GET',
  })
}

/**
 * Registra un nuevo vehículo en la flota.
 * @param {Object} datos - Campos del vehículo (tipo, placa, num_interno, marca, modelo, capacidad_ton, estado_operativo, fecha_adquisicion)
 */
export async function registrarVehiculo(datos) {
  return apiClient(`${BASE_URL}/`, {
    metodo: 'POST',
    body: datos,
  })
}

/**
 * Actualiza parcialmente los datos de un vehículo existente.
 * Solo envía los campos modificados.
 * @param {string} idVehiculo
 * @param {Object} datos
 */
export async function actualizarVehiculo(idVehiculo, datos) {
  return apiClient(`${BASE_URL}/${idVehiculo}`, {
    metodo: 'PUT',
    body: datos,
  })
}

/**
 * Activa o desactiva administrativamente un vehículo.
 * @param {string} idVehiculo
 * @param {boolean} isActive
 */
export async function cambiarEstadoVehiculo(idVehiculo, isActive) {
  return apiClient(`${BASE_URL}/${idVehiculo}/estado`, {
    metodo: 'PATCH',
    body: { is_active: isActive },
  })
}
