
import { ROLES } from '../../../app/session'
import { apiClient } from '../../../shared/api/apiClient'

/**
 * Catálogo de accesos y módulos organizados por rol,
 * siguiendo el patrón de servicio del sistema.
 */
const ACCESOS = {
  [ROLES.ADMIN]: [
    {
      id: 'admin-usuarios',
      path: '/admin/usuarios',
      etiqueta: 'Gestión de Usuarios',
      descripcion:
        'Consulta, registra y edita información de funcionarios, actualiza documentos de identidad y asigna o modifica roles en el sistema.',
      icono: 'usuarios',
      activo: true,
      botonTexto: 'Gestionar Usuarios →',
    },
    {
      id: 'admin-personal',
      path: '/construccion',
      etiqueta: 'Personal y Cuadrillas',
      descripcion:
        'Registro y administración de trabajadores y conductores, control de licencias y organización de cuadrillas de recolección y barrido.',
      icono: 'personal',
      activo: false,
      botonTexto: 'Conocer módulo →',
    },
    {
      id: 'admin-territorio',
      path: '/construccion',
      etiqueta: 'Territorio y Rutas',
      descripcion:
        'Administración de la división territorial de Buenaventura y configuración de las rutas de recolección.',
      icono: 'territorio',
      activo: false,
      botonTexto: 'Conocer módulo →',
    },
    {
      id: 'admin-flota',
      path: '/construccion',
      etiqueta: 'Programación y Flota',
      descripcion:
        'Planificación de las jornadas de recolección y administración de los vehículos asignados al servicio.',
      icono: 'flota',
      activo: false,
      botonTexto: 'Conocer módulo →',
    },
    {
      id: 'admin-monitoreo',
      path: '/construccion',
      etiqueta: 'Monitoreo GPS e Incidencias',
      descripcion:
        'Seguimiento de las operaciones de recolección, control de recorridos y registro de novedades durante la prestación del servicio.',
      icono: 'monitoreo',
      activo: false,
      botonTexto: 'Conocer módulo →',
    },
  ],
}

/**
 * Retorna la configuración y accesos correspondientes al rol.
 */
export function resumenPorRol(rol) {
  const rolClave = rol || ROLES.ADMIN

  return {
    accesos: ACCESOS[rolClave] || ACCESOS[ROLES.ADMIN] || [],
  }
}

/**
 * Carga las métricas del Dashboard de Administrador
 * desde el backend de Tura Limpia.
 */
export async function cargarMetricasAdmin() {
  const resumen = await apiClient('/dashboard/resumen')

  return {
    usuariosTotal: resumen.total,
    usuariosActivos: resumen.activos,
    usuariosInactivos: resumen.inactivos,

    // Pendientes de implementar en sus respectivos módulos.
    flotaOperativa: '—',
    rutasHoy: '—',
  }
}
