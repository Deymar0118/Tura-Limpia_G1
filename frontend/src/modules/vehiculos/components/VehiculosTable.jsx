import React from 'react'

/**
 * Tabla responsiva para visualizar la flota de vehículos de Tura Limpia.
 */
function VehiculosTable({
  vehiculos,
  cargando,
  onVerDetalle,
  onEditar,
  onToggleEstado,
  cambiandoEstadoId,
}) {
  // Renderizar estado operativo con badge de color
  const renderBadgeOperativo = (estado) => {
    const normalizado = String(estado || '').toLowerCase()
    switch (normalizado) {
      case 'operativo':
        return <span className="vehiculo-badge vehiculo-badge--operativo">Operativo</span>
      case 'en_mantenimiento':
      case 'mantenimiento':
        return <span className="vehiculo-badge vehiculo-badge--mantenimiento">En Mantenimiento</span>
      case 'fuera_de_servicio':
        return <span className="vehiculo-badge vehiculo-badge--fuera">Fuera de Servicio</span>
      default:
        return <span className="vehiculo-badge vehiculo-badge--neutral">{estado || 'Sin estado'}</span>
    }
  }

  if (cargando) {
    return (
      <div className="vehiculos-table-loading">
        <div className="vehiculos-spinner" />
        <p>Cargando flota de vehículos...</p>
      </div>
    )
  }

  if (!vehiculos || vehiculos.length === 0) {
    return (
      <div className="vehiculos-table-empty">
        <div className="vehiculos-table-empty__icon">🚛</div>
        <h3>No se encontraron vehículos</h3>
        <p>No hay vehículos registrados o no coinciden con los filtros aplicados.</p>
      </div>
    )
  }

  return (
    <div className="vehiculos-table-wrapper">
      <table className="vehiculos-table">
        <thead>
          <tr>
            <th>N° Interno / Placa</th>
            <th>Tipo</th>
            <th>Marca y Modelo</th>
            <th>Capacidad</th>
            <th>Estado Operativo</th>
            <th>Activación</th>
            <th className="vehiculos-th-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehiculos.map((vehiculo) => {
            const estaCambiando = cambiandoEstadoId === vehiculo.id_vehiculo

            return (
              <tr key={vehiculo.id_vehiculo} className={!vehiculo.is_active ? 'vehiculos-tr--inactivo' : ''}>
                {/* N° Interno y Placa */}
                <td>
                  <div className="vehiculo-identificador-col">
                    <div className="vehiculo-identificador">
                      <span className="vehiculo-num-interno">{vehiculo.num_interno}</span>
                      <span
                        className="vehiculo-placa-badge"
                        title={
                          vehiculo.ciudad_matricula
                            ? `Matriculado en ${vehiculo.ciudad_matricula}`
                            : 'Placa del vehículo'
                        }
                      >
                        {vehiculo.placa}
                      </span>
                    </div>
                    {vehiculo.ciudad_matricula && (
                      <span className="vehiculo-ciudad-sub">
                        Matrícula: {vehiculo.ciudad_matricula}
                      </span>
                    )}
                  </div>
                </td>

                {/* Tipo de Vehículo */}
                <td>
                  <span className="vehiculo-tipo-tag">{vehiculo.tipo}</span>
                </td>

                {/* Marca y Modelo */}
                <td>
                  <div className="vehiculo-marca-modelo">
                    <span className="vehiculo-marca">{vehiculo.marca}</span>
                    <span className="vehiculo-modelo">
                      {vehiculo.modelo}
                      {vehiculo.anio_modelo ? ` · ${vehiculo.anio_modelo}` : ''}
                    </span>
                  </div>
                </td>

                {/* Capacidad en Toneladas */}
                <td>
                  <span className="vehiculo-capacidad">
                    <strong>{Number(vehiculo.capacidad_ton || 0).toFixed(1)}</strong> Ton
                  </span>
                </td>

                {/* Estado Operativo */}
                <td>{renderBadgeOperativo(vehiculo.estado_operativo)}</td>

                {/* Activación Administrativa (is_active) */}
                <td>
                  <label
                    className="vehiculo-switch"
                    title={vehiculo.is_active ? 'Desactivar vehículo' : 'Activar vehículo'}
                  >
                    <input
                      type="checkbox"
                      role="switch"
                      aria-checked={Boolean(vehiculo.is_active)}
                      aria-label={`Estado administrativo del vehículo ${vehiculo.num_interno}`}
                      checked={Boolean(vehiculo.is_active)}
                      disabled={estaCambiando}
                      onChange={() => onToggleEstado(vehiculo)}
                    />
                    <span className="vehiculo-switch-slider" />
                  </label>
                  <span className="vehiculo-switch-label">
                    {vehiculo.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                {/* Acciones */}
                <td className="vehiculos-td-actions">
                  <div className="vehiculos-actions-group">
                    <button
                      type="button"
                      className="vehiculo-btn-action vehiculo-btn-action--view"
                      onClick={() => onVerDetalle(vehiculo)}
                      title={`Ver ficha técnica de ${vehiculo.num_interno}`}
                      aria-label={`Ver ficha técnica del vehículo ${vehiculo.num_interno}`}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Ver
                    </button>

                    <button
                      type="button"
                      className="vehiculo-btn-action vehiculo-btn-action--edit"
                      onClick={() => onEditar(vehiculo)}
                      title={`Editar datos de ${vehiculo.num_interno}`}
                      aria-label={`Editar datos del vehículo ${vehiculo.num_interno}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default VehiculosTable
