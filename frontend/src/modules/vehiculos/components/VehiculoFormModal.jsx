import React, { useState, useEffect } from 'react'
import {
  registrarVehiculo,
  actualizarVehiculo,
  obtenerMensajeVehiculo,
  REGLAS_VEHICULO,
} from '../services/vehiculosService'

/**
 * Modal para registrar un nuevo vehículo o editar uno existente.
 * Aplica las validaciones estipuladas en el Contrato de API v1.1 del backend.
 */
function VehiculoFormModal({
  abierto,
  vehiculoAEditar,
  onCerrar,
  onGuardadoExitoso,
}) {
  const esEdicion = Boolean(vehiculoAEditar)
  const anioMaximo = REGLAS_VEHICULO.obtenerAnioMaximo()

  // Estado del formulario
  const [formData, setFormData] = useState({
    tipo: 'Compactador',
    placa: '',
    num_interno: '',
    marca: '',
    modelo: '',
    anio_modelo: '',
    ciudad_matricula: '',
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
        anio_modelo: vehiculoAEditar.anio_modelo ?? '',
        ciudad_matricula: vehiculoAEditar.ciudad_matricula || '',
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
        anio_modelo: '',
        ciudad_matricula: '',
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

    const ciudadLimpia = formData.ciudad_matricula.trim()
    if (!ciudadLimpia) {
      nuevosErrores.ciudad_matricula = 'La ciudad de matrícula es obligatoria.'
    } else if (
      ciudadLimpia.length < REGLAS_VEHICULO.CIUDAD_MIN_LEN ||
      ciudadLimpia.length > REGLAS_VEHICULO.CIUDAD_MAX_LEN
    ) {
      nuevosErrores.ciudad_matricula = `Debe tener entre ${REGLAS_VEHICULO.CIUDAD_MIN_LEN} y ${REGLAS_VEHICULO.CIUDAD_MAX_LEN} caracteres.`
    }

    if (!formData.num_interno.trim()) {
      nuevosErrores.num_interno = 'El número interno es obligatorio (ej. V-001).'
    }

    if (!formData.marca.trim()) {
      nuevosErrores.marca = 'La marca es obligatoria.'
    } else if (formData.marca.trim().length < 2) {
      nuevosErrores.marca = 'La marca debe tener al menos 2 caracteres.'
    }

    if (!formData.modelo.trim()) {
      nuevosErrores.modelo = 'El modelo o referencia es obligatorio.'
    }

    const anioTexto = String(formData.anio_modelo ?? '').trim()
    const anioNum = Number(anioTexto)
    if (!anioTexto) {
      nuevosErrores.anio_modelo = 'El año del vehículo es obligatorio.'
    } else if (
      !Number.isInteger(anioNum) ||
      anioNum < REGLAS_VEHICULO.ANIO_MINIMO ||
      anioNum > anioMaximo
    ) {
      nuevosErrores.anio_modelo = `Ingresa un año entre ${REGLAS_VEHICULO.ANIO_MINIMO} y ${anioMaximo}.`
    }

    const capacidad = parseFloat(formData.capacidad_ton)
    if (
      isNaN(capacidad) ||
      capacidad <= 0 ||
      capacidad > REGLAS_VEHICULO.CAPACIDAD_MAXIMA_TON
    ) {
      nuevosErrores.capacidad_ton = `Debe ser mayor a 0 y máximo ${REGLAS_VEHICULO.CAPACIDAD_MAXIMA_TON} toneladas.`
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
      const payloadCompleto = {
        tipo: formData.tipo.trim(),
        placa: formData.placa.trim(),
        num_interno: formData.num_interno.trim(),
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        anio_modelo: parseInt(String(formData.anio_modelo).trim(), 10),
        ciudad_matricula: formData.ciudad_matricula.trim(),
        capacidad_ton: parseFloat(formData.capacidad_ton),
        estado_operativo: formData.estado_operativo,
        fecha_adquisicion: formData.fecha_adquisicion,
      }

      if (esEdicion) {
        // Enviar únicamente los campos modificados según el Contrato API v1.1
        const cambios = {}
        Object.entries(payloadCompleto).forEach(([clave, valor]) => {
          const valorOriginal = vehiculoAEditar[clave]
          if (clave === 'capacidad_ton' || clave === 'anio_modelo') {
            if (Number(valorOriginal) !== valor) cambios[clave] = valor
          } else if ((valorOriginal ?? '') !== valor) {
            cambios[clave] = valor
          }
        })

        if (Object.keys(cambios).length === 0) {
          setErrorServidor('Modifica al menos un campo antes de actualizar.')
          setGuardando(false)
          return
        }

        await actualizarVehiculo(vehiculoAEditar.id_vehiculo, cambios)
      } else {
        await registrarVehiculo(payloadCompleto)
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

            {/* Ciudad de Matrícula */}
            <div className="vehiculos-form-group">
              <label htmlFor="ciudad_matricula">
                Ubicación de Matrícula <span className="vehiculos-required">*</span>
              </label>
              <input
                type="text"
                id="ciudad_matricula"
                name="ciudad_matricula"
                className={`vehiculos-input ${errores.ciudad_matricula ? 'vehiculos-input--error' : ''}`}
                placeholder="Buenaventura, Cali, Bogotá..."
                value={formData.ciudad_matricula}
                onChange={handleChange}
                maxLength={100}
              />
              {errores.ciudad_matricula ? (
                <span className="vehiculos-error-text">{errores.ciudad_matricula}</span>
              ) : (
                <span className="vehiculos-helper-text">Municipio o ciudad donde está matriculado.</span>
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

            {/* Modelo / Referencia */}
            <div className="vehiculos-form-group">
              <label htmlFor="modelo">
                Modelo / Referencia <span className="vehiculos-required">*</span>
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

            {/* Año del Vehículo */}
            <div className="vehiculos-form-group">
              <label htmlFor="anio_modelo">
                Año del Vehículo <span className="vehiculos-required">*</span>
              </label>
              <input
                type="number"
                id="anio_modelo"
                name="anio_modelo"
                step="1"
                min={REGLAS_VEHICULO.ANIO_MINIMO}
                max={anioMaximo}
                className={`vehiculos-input ${errores.anio_modelo ? 'vehiculos-input--error' : ''}`}
                placeholder={`Ej. ${anioMaximo - 1}`}
                value={formData.anio_modelo}
                onChange={handleChange}
              />
              {errores.anio_modelo ? (
                <span className="vehiculos-error-text">{errores.anio_modelo}</span>
              ) : (
                <span className="vehiculos-helper-text">
                  Entre {REGLAS_VEHICULO.ANIO_MINIMO} y {anioMaximo}.
                </span>
              )}
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
                max={REGLAS_VEHICULO.CAPACIDAD_MAXIMA_TON}
                className={`vehiculos-input ${errores.capacidad_ton ? 'vehiculos-input--error' : ''}`}
                placeholder="8.0"
                value={formData.capacidad_ton}
                onChange={handleChange}
              />
              {errores.capacidad_ton ? (
                <span className="vehiculos-error-text">{errores.capacidad_ton}</span>
              ) : (
                <span className="vehiculos-helper-text">
                  Máximo {REGLAS_VEHICULO.CAPACIDAD_MAXIMA_TON} toneladas.
                </span>
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
