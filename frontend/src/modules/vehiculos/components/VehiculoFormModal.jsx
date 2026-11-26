import React, { useState, useEffect } from 'react'
import {
  registrarVehiculo,
  actualizarVehiculo,
  obtenerMensajeVehiculo,
} from '../services/vehiculosService'

/**
 * Modal para registrar un nuevo vehículo o editar uno existente.
 * Aplica las validaciones estipuladas en el contrato de API del backend.
 */
function VehiculoFormModal({
  abierto,
  vehiculoAEditar,
  onCerrar,
  onGuardadoExitoso,
}) {
  const esEdicion = Boolean(vehiculoAEditar)

  // Estado del formulario
  const [formData, setFormData] = useState({
    tipo: 'Compactador',
    placa: '',
    num_interno: '',
    marca: '',
    modelo: '',
    capacidad_ton: '',
    estado_operativo: 'operativo',
    fecha_adquisicion: new Date().toISOString().split('T')[0],
  })

  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorServidor, setErrorServidor] = useState(null)

  // Opciones de tipo de vehículos sugeridas
  const TIPOS_VEHICULO = [
    'Compactador',
    'Volqueta',
    'Camión Barredor',
    'Camión Recolector',
    'Motocarro',
    'Camioneta de Supervisión',
  ]

  // Cargar datos al abrir en modo edición
  useEffect(() => {
    if (vehiculoAEditar) {
      setFormData({
        tipo: vehiculoAEditar.tipo || 'Compactador',
        placa: vehiculoAEditar.placa || '',
        num_interno: vehiculoAEditar.num_interno || '',
        marca: vehiculoAEditar.marca || '',
        modelo: vehiculoAEditar.modelo || '',
        capacidad_ton: vehiculoAEditar.capacidad_ton ?? '',
        estado_operativo: vehiculoAEditar.estado_operativo || 'operativo',
        fecha_adquisicion: vehiculoAEditar.fecha_adquisicion || '',
      })
    } else {
      setFormData({
        tipo: 'Compactador',
        placa: '',
        num_interno: '',
        marca: '',
        modelo: '',
        capacidad_ton: '',
        estado_operativo: 'operativo',
        fecha_adquisicion: new Date().toISOString().split('T')[0],
      })
    }
    setErrores({})
    setErrorServidor(null)
  }, [vehiculoAEditar, abierto])

  if (!abierto) return null

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'placa') {
      // Normalizar: mayúsculas, sin espacios, máximo 6 caracteres
      const limpia = value.toUpperCase().replace(/\s/g, '').slice(0, 6)
      setFormData((prev) => ({ ...prev, [name]: limpia }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Limpiar error del campo
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }))
    }
    setErrorServidor(null)
  }

  const validarFormulario = () => {
    const nuevosErrores = {}
    const REGEX_PLACA = /^[A-Z]{3}[0-9]{3}$/

    if (!formData.placa.trim()) {
      nuevosErrores.placa = 'La placa es obligatoria.'
    } else if (!REGEX_PLACA.test(formData.placa.trim())) {
      nuevosErrores.placa = 'Debe tener 3 letras y 3 números (ej. ABC123).'
    }

    if (!formData.num_interno.trim()) {
      nuevosErrores.num_interno = 'El número interno es obligatorio (ej. V-001).'
    }

    if (!formData.marca.trim()) {
      nuevosErrores.marca = 'La marca es obligatoria.'
    }

    if (!formData.modelo.trim()) {
      nuevosErrores.modelo = 'El modelo es obligatorio.'
    }

    const capacidad = parseFloat(formData.capacidad_ton)
    if (isNaN(capacidad) || capacidad <= 0) {
      nuevosErrores.capacidad_ton = 'Debe ser un número mayor a 0 (ej. 8.0).'
    }

    if (!formData.fecha_adquisicion) {
      nuevosErrores.fecha_adquisicion = 'La fecha de adquisición es obligatoria.'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validarFormulario()) return

    setGuardando(true)
    setErrorServidor(null)

    try {
      const payload = {
        tipo: formData.tipo.trim(),
        placa: formData.placa.trim(),
        num_interno: formData.num_interno.trim(),
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        capacidad_ton: parseFloat(formData.capacidad_ton),
        estado_operativo: formData.estado_operativo,
        fecha_adquisicion: formData.fecha_adquisicion,
      }

      if (esEdicion) {
        // Enviar solo campos para actualización
        await actualizarVehiculo(vehiculoAEditar.id_vehiculo, payload)
      } else {
        await registrarVehiculo(payload)
      }

      onGuardadoExitoso(esEdicion ? 'Vehículo actualizado con éxito' : 'Vehículo registrado con éxito')
      onCerrar()
    } catch (err) {
      setErrorServidor(obtenerMensajeVehiculo(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="vehiculos-modal-overlay" onClick={onCerrar}>
      <div className="vehiculos-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div className="vehiculos-modal-header">
          <div className="vehiculos-modal-header__info">
            <span className="vehiculos-modal-tag">Gestión de Flota</span>
            <h2>{esEdicion ? `Editar Vehículo ${vehiculoAEditar.num_interno}` : 'Registrar Nuevo Vehículo'}</h2>
          </div>
          <button
            type="button"
            className="vehiculos-modal-close"
            onClick={onCerrar}
            title="Cerrar modal"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Alerta de Error del Servidor */}
        {errorServidor && (
          <div className="vehiculos-alert-error" role="alert">
            <span className="vehiculos-alert-icon">⚠️</span>
            <span>{errorServidor}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="vehiculos-form">
          <div className="vehiculos-form-grid">
            {/* Placa */}
            <div className="vehiculos-form-group">
              <label htmlFor="placa">
                Placa <span className="vehiculos-required">*</span>
              </label>
              <input
                type="text"
                id="placa"
                name="placa"
                className={`vehiculos-input ${errores.placa ? 'vehiculos-input--error' : ''}`}
                placeholder="ABC123"
                value={formData.placa}
                onChange={handleChange}
                maxLength={6}
                autoFocus={!esEdicion}
              />
              {errores.placa ? (
                <span className="vehiculos-error-text">{errores.placa}</span>
              ) : (
                <span className="vehiculos-helper-text">Formato colombiano: 3 letras y 3 números.</span>
              )}
            </div>

            {/* Número Interno */}
            <div className="vehiculos-form-group">
              <label htmlFor="num_interno">
                Número Interno <span className="vehiculos-required">*</span>
              </label>
              <input
                type="text"
                id="num_interno"
                name="num_interno"
                className={`vehiculos-input ${errores.num_interno ? 'vehiculos-input--error' : ''}`}
                placeholder="V-001"
                value={formData.num_interno}
                onChange={handleChange}
                maxLength={20}
              />
              {errores.num_interno && (
                <span className="vehiculos-error-text">{errores.num_interno}</span>
              )}
            </div>

            {/* Tipo de Vehículo */}
            <div className="vehiculos-form-group">
              <label htmlFor="tipo">
                Tipo de Vehículo <span className="vehiculos-required">*</span>
              </label>
              <select
                id="tipo"
                name="tipo"
                className="vehiculos-select"
                value={formData.tipo}
                onChange={handleChange}
              >
                {TIPOS_VEHICULO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Capacidad en Toneladas */}
            <div className="vehiculos-form-group">
              <label htmlFor="capacidad_ton">
                Capacidad (Toneladas) <span className="vehiculos-required">*</span>
              </label>
              <input
                type="number"
                id="capacidad_ton"
                name="capacidad_ton"
                step="0.1"
                min="0.1"
                className={`vehiculos-input ${errores.capacidad_ton ? 'vehiculos-input--error' : ''}`}
                placeholder="8.0"
                value={formData.capacidad_ton}
                onChange={handleChange}
              />
              {errores.capacidad_ton && (
                <span className="vehiculos-error-text">{errores.capacidad_ton}</span>
              )}
            </div>

            {/* Marca */}
            <div className="vehiculos-form-group">
              <label htmlFor="marca">
                Marca <span className="vehiculos-required">*</span>
              </label>
              <input
                type="text"
                id="marca"
                name="marca"
                className={`vehiculos-input ${errores.marca ? 'vehiculos-input--error' : ''}`}
                placeholder="Chevrolet, Hino, Mercedes-Benz..."
                value={formData.marca}
                onChange={handleChange}
                maxLength={50}
              />
              {errores.marca && (
                <span className="vehiculos-error-text">{errores.marca}</span>
              )}
            </div>

            {/* Modelo */}
            <div className="vehiculos-form-group">
              <label htmlFor="modelo">
                Modelo <span className="vehiculos-required">*</span>
              </label>
              <input
                type="text"
                id="modelo"
                name="modelo"
                className={`vehiculos-input ${errores.modelo ? 'vehiculos-input--error' : ''}`}
                placeholder="FRR, Atego, 500 Series..."
                value={formData.modelo}
                onChange={handleChange}
                maxLength={50}
              />
              {errores.modelo && (
                <span className="vehiculos-error-text">{errores.modelo}</span>
              )}
            </div>

            {/* Estado Operativo */}
            <div className="vehiculos-form-group">
              <label htmlFor="estado_operativo">
                Estado Operativo <span className="vehiculos-required">*</span>
              </label>
              <select
                id="estado_operativo"
                name="estado_operativo"
                className="vehiculos-select"
                value={formData.estado_operativo}
                onChange={handleChange}
              >
                <option value="operativo">Operativo</option>
                <option value="en_mantenimiento">En Mantenimiento</option>
                <option value="fuera_de_servicio">Fuera de Servicio</option>
              </select>
            </div>

            {/* Fecha de Adquisición */}
            <div className="vehiculos-form-group">
              <label htmlFor="fecha_adquisicion">
                Fecha de Adquisición <span className="vehiculos-required">*</span>
              </label>
              <input
                type="date"
                id="fecha_adquisicion"
                name="fecha_adquisicion"
                className={`vehiculos-input ${errores.fecha_adquisicion ? 'vehiculos-input--error' : ''}`}
                value={formData.fecha_adquisicion}
                onChange={handleChange}
              />
              {errores.fecha_adquisicion && (
                <span className="vehiculos-error-text">{errores.fecha_adquisicion}</span>
              )}
            </div>
          </div>

          {/* Footer del Formulario */}
          <div className="vehiculos-modal-footer">
            <button
              type="button"
              className="vehiculos-btn-cancelar"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="vehiculos-btn-guardar"
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <span className="vehiculos-btn-spinner" />
                  Guardando...
                </>
              ) : esEdicion ? (
                'Actualizar Vehículo'
              ) : (
                'Registrar Vehículo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehiculoFormModal
