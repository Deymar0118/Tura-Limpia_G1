import React from 'react'

/**
 * Barra de búsqueda y filtros rápidos para el listado de vehículos.
 */
function VehiculosFilterBar({
  busqueda,
  onBusquedaChange,
  filtroOperativo,
  onFiltroOperativoChange,
  filtroActivo,
  onFiltroActivoChange,
  onNuevoClick,
  totalResultados,
}) {
  return (
    <div className="vehiculos-filter-bar">
      <div className="vehiculos-filter-bar__inputs">
        {/* Campo de Búsqueda */}
        <div className="vehiculos-search-box" role="search">
          <svg
            className="vehiculos-search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="vehiculos-search-input"
            placeholder="Buscar por placa, N° interno, marca, año o ciudad..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            aria-label="Buscar vehículos por placa, número interno, marca, año o ciudad de matrícula"
          />
          {busqueda && (
            <button
              type="button"
              className="vehiculos-search-clear"
              onClick={() => onBusquedaChange('')}
              title="Limpiar búsqueda"
              aria-label="Limpiar campo de búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro por Estado Operativo */}
        <div className="vehiculos-filter-select-wrap">
          <label htmlFor="filtro-operativo" className="vehiculos-filter-label">
            Estado Operativo:
          </label>
          <select
            id="filtro-operativo"
            className="vehiculos-filter-select"
            value={filtroOperativo}
            onChange={(e) => onFiltroOperativoChange(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="operativo">Operativo</option>
            <option value="en_mantenimiento">En Mantenimiento</option>
            <option value="fuera_de_servicio">Fuera de Servicio</option>
          </select>
        </div>

        {/* Filtro por Estado Administrativo */}
        <div className="vehiculos-filter-select-wrap">
          <label htmlFor="filtro-activo" className="vehiculos-filter-label">
            Habilitación:
          </label>
          <select
            id="filtro-activo"
            className="vehiculos-filter-select"
            value={filtroActivo}
            onChange={(e) => onFiltroActivoChange(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="activos">Solo Activos</option>
            <option value="inactivos">Solo Desactivados</option>
          </select>
        </div>
      </div>

      <div className="vehiculos-filter-bar__actions">
        <span className="vehiculos-counter-tag">
          {totalResultados} {totalResultados === 1 ? 'vehículo' : 'vehículos'}
        </span>

        <button
          type="button"
          className="vehiculos-btn-nuevo"
          onClick={onNuevoClick}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Registrar Vehículo
        </button>
      </div>
    </div>
  )
}

export default VehiculosFilterBar
