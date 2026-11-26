import React, { useState, useEffect, useMemo } from 'react'
import {
  listarVehiculos,
  cambiarEstadoVehiculo,
  obtenerMensajeVehiculo,
} from '../services/vehiculosService'
import VehiculosFilterBar from '../components/VehiculosFilterBar'
import VehiculosTable from '../components/VehiculosTable'
import VehiculoFormModal from '../components/VehiculoFormModal'
import VehiculoDetalleModal from '../components/VehiculoDetalleModal'
import './VehiculosPage.css'

/**
 * Página principal del Módulo de Gestión de Vehículos.
 * Permite supervisar la flota de recolección y aseo, registrar nuevas unidades,
 * editar especificaciones técnicas y cambiar estados operativos y administrativos.
 */
function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([])
  const [totalServidor, setTotalServidor] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroOperativo, setFiltroOperativo] = useState('todos')
  const [filtroActivo, setFiltroActivo] = useState('todos')

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState(false)
  const [vehiculoAEditar, setVehiculoAEditar] = useState(null)
  const [vehiculoADetalle, setVehiculoADetalle] = useState(null)

  // Estados de acción y notificación
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null)
  const [notificacion, setNotificacion] = useState(null)

  // Paginación
  const [offset, setOffset] = useState(0)
  const limit = 50

  // Cargar lista de vehículos
  const cargarFlota = async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const data = await listarVehiculos({ offset, limit })
      setVehiculos(data.items || [])
      setTotalServidor(data.total || (data.items ? data.items.length : 0))
    } catch (err) {
      setErrorCarga(obtenerMensajeVehiculo(err))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarFlota()
  }, [offset])

  // Mostrar mensaje de notificación temporal
  const mostrarNotificacion = (mensaje, tipo = 'exito') => {
    setNotificacion({ mensaje, tipo })
    setTimeout(() => {
      setNotificacion(null)
    }, 4000)
  }

  // Filtrado de vehículos en cliente
  const vehiculosFiltrados = useMemo(() => {
    return vehiculos.filter((item) => {
      // Filtro de búsqueda textual
      if (busqueda.trim()) {
        const query = busqueda.trim().toLowerCase()
        const coincidePlaca = item.placa?.toLowerCase().includes(query)
        const coincideInterno = item.num_interno?.toLowerCase().includes(query)
        const coincideMarca = item.marca?.toLowerCase().includes(query)
        const coincideModelo = item.modelo?.toLowerCase().includes(query)
        const coincideTipo = item.tipo?.toLowerCase().includes(query)

        if (!coincidePlaca && !coincideInterno && !coincideMarca && !coincideModelo && !coincideTipo) {
          return false
        }
      }

      // Filtro de estado operativo
      if (filtroOperativo !== 'todos') {
        if (item.estado_operativo?.toLowerCase() !== filtroOperativo) {
          return false
        }
      }

      // Filtro de activación administrativa
      if (filtroActivo !== 'todos') {
        if (filtroActivo === 'activos' && !item.is_active) return false
        if (filtroActivo === 'inactivos' && item.is_active) return false
      }

      return true
    })
  }, [vehiculos, busqueda, filtroOperativo, filtroActivo])

  // Métricas rápidas calculadas sobre la flota actual
  const metricas = useMemo(() => {
    const total = vehiculos.length
    const operativos = vehiculos.filter(
      (v) => v.estado_operativo === 'operativo' && v.is_active
    ).length
    const enMantenimiento = vehiculos.filter(
      (v) => v.estado_operativo === 'en_mantenimiento'
    ).length
    const capacidadTotal = vehiculos
      .filter((v) => v.is_active)
      .reduce((acc, curr) => acc + (Number(curr.capacidad_ton) || 0), 0)

    return {
      total,
      operativos,
      enMantenimiento,
      capacidadTotal: capacidadTotal.toFixed(1),
    }
  }, [vehiculos])

  // Cambiar activación administrativa (is_active)
  const handleToggleEstado = async (vehiculo) => {
    const nuevoEstado = !vehiculo.is_active
    setCambiandoEstadoId(vehiculo.id_vehiculo)

    try {
      await cambiarEstadoVehiculo(vehiculo.id_vehiculo, nuevoEstado)
      // Actualizar estado local
      setVehiculos((prev) =>
        prev.map((v) =>
          v.id_vehiculo === vehiculo.id_vehiculo
            ? { ...v, is_active: nuevoEstado }
            : v
        )
      )
      mostrarNotificacion(
        `Vehículo ${vehiculo.num_interno} ${nuevoEstado ? 'activado' : 'desactivado'} en el sistema`
      )
    } catch (err) {
      mostrarNotificacion(obtenerMensajeVehiculo(err), 'error')
    } finally {
      setCambiandoEstadoId(null)
    }
  }

  const handleNuevo = () => {
    setVehiculoAEditar(null)
    setModalFormAbierto(true)
  }

  const handleEditar = (vehiculo) => {
    setVehiculoAEditar(vehiculo)
    setModalFormAbierto(true)
  }

  const handleVerDetalle = (vehiculo) => {
    setVehiculoADetalle(vehiculo)
  }

  return (
    <div className="vehiculos-page">
      <div className="vehiculos-container">
        {/* Notificación flotante tipo toast */}
        {notificacion && (
          <div className={`vehiculos-toast vehiculos-toast--${notificacion.tipo}`} role="alert">
            <span className="vehiculos-toast-icon">
              {notificacion.tipo === 'exito' ? '✓' : '⚠️'}
            </span>
            <span className="vehiculos-toast-msg">{notificacion.mensaje}</span>
            <button
              type="button"
              className="vehiculos-toast-close"
              onClick={() => setNotificacion(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Encabezado Principal */}
        <header className="vehiculos-header">
          <div className="vehiculos-header__text">
            <div className="vehiculos-header__badge">
              <span className="vehiculos-header__dot" />
              Gestión Operativa de Flota
            </div>
            <h1>Parque Automotor de Aseo</h1>
            <p>
              Supervisa y administra los camiones compactadores, volquetas y vehículos de recolección
              asignados al servicio en Buenaventura.
            </p>
          </div>
        </header>

        {/* Tarjetas de Métricas Rápidas */}
        <section className="vehiculos-stats-grid">
          <div className="vehiculo-kpi-card">
            <div className="vehiculo-kpi-header">
              <span className="vehiculo-kpi-label">Total de Flota</span>
              <span className="vehiculo-kpi-icon vehiculo-kpi-icon--blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
            </div>
            <div className="vehiculo-kpi-body">
              <span className="vehiculo-kpi-value">{cargando ? '...' : metricas.total}</span>
              <span className="vehiculo-kpi-sub">Vehículos en registro</span>
            </div>
          </div>

          <div className="vehiculo-kpi-card">
            <div className="vehiculo-kpi-header">
              <span className="vehiculo-kpi-label">Flota Operativa</span>
              <span className="vehiculo-kpi-icon vehiculo-kpi-icon--green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
            </div>
            <div className="vehiculo-kpi-body">
              <span className="vehiculo-kpi-value vehiculo-kpi-value--green">
                {cargando ? '...' : metricas.operativos}
              </span>
              <span className="vehiculo-kpi-sub">Listos para ruta</span>
            </div>
          </div>

          <div className="vehiculo-kpi-card">
            <div className="vehiculo-kpi-header">
              <span className="vehiculo-kpi-label">En Mantenimiento</span>
              <span className="vehiculo-kpi-icon vehiculo-kpi-icon--amber">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </span>
            </div>
            <div className="vehiculo-kpi-body">
              <span className="vehiculo-kpi-value vehiculo-kpi-value--amber">
                {cargando ? '...' : metricas.enMantenimiento}
              </span>
              <span className="vehiculo-kpi-sub">Taller o revisión técnica</span>
            </div>
          </div>

          <div className="vehiculo-kpi-card">
            <div className="vehiculo-kpi-header">
              <span className="vehiculo-kpi-label">Capacidad de Carga</span>
              <span className="vehiculo-kpi-icon vehiculo-kpi-icon--cyan">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </span>
            </div>
            <div className="vehiculo-kpi-body">
              <span className="vehiculo-kpi-value">
                {cargando ? '...' : metricas.capacidadTotal} <small>Ton</small>
              </span>
              <span className="vehiculo-kpi-sub">Capacidad activa en flota</span>
            </div>
          </div>
        </section>

        {/* Sección de Filtros y Tabla */}
        <section className="vehiculos-table-section">
          <VehiculosFilterBar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            filtroOperativo={filtroOperativo}
            onFiltroOperativoChange={setFiltroOperativo}
            filtroActivo={filtroActivo}
            onFiltroActivoChange={setFiltroActivo}
            onNuevoClick={handleNuevo}
            totalResultados={vehiculosFiltrados.length}
          />

          {/* Error de Carga con botón de reintento */}
          {errorCarga ? (
            <div className="vehiculos-error-banner" role="alert">
              <span className="vehiculos-error-icon">⚠️</span>
              <div>
                <strong>Error al cargar la flota de vehículos</strong>
                <p>{errorCarga}</p>
              </div>
              <button
                type="button"
                className="vehiculos-btn-reintentar"
                onClick={cargarFlota}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <VehiculosTable
              vehiculos={vehiculosFiltrados}
              cargando={cargando}
              onVerDetalle={handleVerDetalle}
              onEditar={handleEditar}
              onToggleEstado={handleToggleEstado}
              cambiandoEstadoId={cambiandoEstadoId}
            />
          )}

          {/* Paginación */}
          {totalServidor > limit && (
            <div className="vehiculos-pagination">
              <span className="vehiculos-pagination-info">
                Mostrando {offset + 1} &ndash; {Math.min(offset + limit, totalServidor)} de {totalServidor} vehículos
              </span>
              <div className="vehiculos-pagination-controls">
                <button
                  type="button"
                  className="vehiculos-page-btn"
                  disabled={offset === 0}
                  onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                >
                  &larr; Anterior
                </button>
                <button
                  type="button"
                  className="vehiculos-page-btn"
                  disabled={offset + limit >= totalServidor}
                  onClick={() => setOffset((prev) => prev + limit)}
                >
                  Siguiente &rarr;
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Modales */}
        <VehiculoFormModal
          abierto={modalFormAbierto}
          vehiculoAEditar={vehiculoAEditar}
          onCerrar={() => {
            setModalFormAbierto(false)
            setVehiculoAEditar(null)
          }}
          onGuardadoExitoso={(mensaje) => {
            mostrarNotificacion(mensaje)
            cargarFlota()
          }}
        />

        <VehiculoDetalleModal
          vehiculo={vehiculoADetalle}
          onCerrar={() => setVehiculoADetalle(null)}
          onEditar={(v) => {
            setVehiculoADetalle(null)
            handleEditar(v)
          }}
        />

        <footer className="vehiculos-footer">
          Tura Limpia &copy; {new Date().getFullYear()} &mdash; Universidad del
          Pacífico &amp; Pazífico Limpio S.A.S. E.S.P. &bull; Módulo de Gestión de Flota
        </footer>
      </div>
    </div>
  )
}

export default VehiculosPage
