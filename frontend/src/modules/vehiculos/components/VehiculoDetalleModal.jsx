import React from 'react'

/**
 * Modal para visualizar la ficha técnica completa de un vehículo.
 * Incluye campos operativos, de especificaciones y de auditoría.
 */
function VehiculoDetalleModal({ vehiculo, onCerrar, onEditar }) {
  if (!vehiculo) return null

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'No registrada'
    try {
      const fecha = new Date(fechaStr)
      if (isNaN(fecha.getTime())) return fechaStr
      return fecha.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return fechaStr
    }
  }

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return 'Nunca'
    try {
      const fecha = new Date(fechaStr)
      if (isNaN(fecha.getTime())) return fechaStr
      return fecha.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return fechaStr
    }
  }

  const obtenerClaseBadgeOperativo = (estado) => {
    const normalizado = String(estado || '').toLowerCase()
    if (normalizado === 'operativo') return 'vehiculo-badge--operativo'
    if (normalizado === 'en_mantenimiento' || normalizado === 'mantenimiento') {
      return 'vehiculo-badge--mantenimiento'
    }
    if (normalizado === 'fuera_de_servicio') return 'vehiculo-badge--fuera'
    return 'vehiculo-badge--neutral'
  }

  const ciudadPlaca = (vehiculo.ciudad_matricula || 'COLOMBIA').trim().toUpperCase()

  return (
    <div className="vehiculos-modal-overlay" onClick={onCerrar}>
      <div className="vehiculos-modal-dialog vehiculos-modal-dialog--detalle" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="vehiculos-modal-header">
          <div className="vehiculos-modal-header__info">
            <span className="vehiculos-modal-tag">Ficha Técnica</span>
            <h2>Vehículo {vehiculo.num_interno}</h2>
          </div>
          <button
            type="button"
            className="vehiculos-modal-close"
            onClick={onCerrar}
            title="Cerrar detalle"
            aria-label="Cerrar detalle"
          >
            ✕
          </button>
        </div>

        {/* Tarjeta Principal de Identificación */}
        <div className="vehiculo-detalle-banner">
          <div className="vehiculo-detalle-placa-box">
            <span className="vehiculo-detalle-colombia">COLOMBIA</span>
            <span className="vehiculo-detalle-placa">{vehiculo.placa}</span>
            <span className="vehiculo-detalle-ciudad" title={ciudadPlaca}>
              {ciudadPlaca}
            </span>
          </div>

          <div className="vehiculo-detalle-banner-meta">
            <h3>
              {vehiculo.marca} {vehiculo.modelo}
              {vehiculo.anio_modelo ? ` (${vehiculo.anio_modelo})` : ''}
            </h3>
            <p className="vehiculo-detalle-tipo">{vehiculo.tipo}</p>

            <div className="vehiculo-detalle-badges">
              <span className={`vehiculo-badge ${obtenerClaseBadgeOperativo(vehiculo.estado_operativo)}`}>
                Estado: {String(vehiculo.estado_operativo || '').replace(/_/g, ' ')}
              </span>
              <span className={`vehiculo-badge ${vehiculo.is_active ? 'vehiculo-badge--operativo' : 'vehiculo-badge--fuera'}`}>
                {vehiculo.is_active ? 'Habilitado en Sistema' : 'Desactivado Administrativamente'}
              </span>
            </div>
          </div>
        </div>

        {/* Grilla de Especificaciones */}
        <div className="vehiculo-detalle-grid">
          <div className="vehiculo-detalle-item">
            <span className="vehiculo-detalle-label">Número Interno</span>
            <span className="vehiculo-detalle-value">{vehiculo.num_interno}</span>
          </div>

          <div className="vehiculo-detalle-item">
            <span className="vehiculo-detalle-label">Capacidad de Carga</span>
            <span className="vehiculo-detalle-value">{vehiculo.capacidad_ton} Toneladas</span>
          </div>

          <div className="vehiculo-detalle-item">
            <span className="vehiculo-detalle-label">Marca</span>
            <span className="vehiculo-detalle-value">{vehiculo.marca}</span>
          </div>

          <div className="vehiculo-detalle-item">
            <span className="vehiculo-detalle-label">Modelo / Referencia</span>
            <span className="vehiculo-detalle-value">{vehiculo.modelo}</span>
          </div>

          <div className="vehiculo-detalle-item">
            <span className="vehiculo-detalle-label">Año del Vehículo</span>
            <span className="vehiculo-detalle-value">{vehiculo.anio_modelo ?? 'No registrado'}</span>
          </div>

          <div className="vehiculo-detalle-item">
            <span className="vehiculo-detalle-label">Ubicación de Matrícula</span>
            <span className="vehiculo-detalle-value">{vehiculo.ciudad_matricula || 'No registrada'}</span>
          </div>

          <div className="vehiculo-detalle-item">
            <span className="vehiculo-detalle-label">Fecha de Adquisición</span>
            <span className="vehiculo-detalle-value">{formatearFecha(vehiculo.fecha_adquisicion)}</span>
          </div>

          <div className="vehiculo-detalle-item">
            <span className="vehiculo-detalle-label">ID del Sistema (UUID)</span>
            <span className="vehiculo-detalle-value vehiculo-detalle-value--mono">{vehiculo.id_vehiculo}</span>
          </div>
        </div>

        {/* Sección de Auditoría */}
        <div className="vehiculo-detalle-auditoria">
          <h4>Registro y Auditoría</h4>
          <div className="vehiculo-auditoria-row">
            <span>Fecha de creación:</span>
            <strong>{formatearFechaHora(vehiculo.created_at)}</strong>
          </div>
          <div className="vehiculo-auditoria-row">
            <span>Última modificación:</span>
            <strong>{formatearFechaHora(vehiculo.updated_at)}</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="vehiculos-modal-footer">
          <button
            type="button"
            className="vehiculos-btn-cancelar"
            onClick={onCerrar}
          >
            Cerrar
          </button>

          <button
            type="button"
            className="vehiculos-btn-guardar"
            onClick={() => {
              onCerrar()
              onEditar(vehiculo)
            }}
          >
            Editar Vehículo
          </button>
        </div>
      </div>
    </div>
  )
}

export default VehiculoDetalleModal
