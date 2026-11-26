import { apiClient } from '../../../shared/api/apiClient'

/**
 * Servicio para la gestión de vehículos de recolección y aseo en Tura Limpia.
 * Conecta con los endpoints de FastAPI bajo el prefijo /vehiculos.
 */

const BASE_URL = '/vehiculos'

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
 * Lista vehículos con paginación offset y limit.
 * @param {Object} params - { offset: number, limit: number }
 * @returns {Promise<{ items: Array, total: number, offset: number, limit: number }>}
 */
export async function listarVehiculos({ offset = 0, limit = 50 } = {}) {
  return apiClient(`${BASE_URL}/`, {
    metodo: 'GET',
    query: { offset, limit },
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
