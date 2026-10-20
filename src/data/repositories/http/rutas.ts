/**
 * Rutas de la API y parámetros de los filtros.
 *
 * ÚNICO archivo que hay que ajustar cuando se conozca el `urls.py` real del
 * backend: los repositorios nunca escriben una ruta a mano. El contrato
 * propuesto está en `docs/api.md`.
 *
 * Todas terminan en `/`, como las genera Django REST Framework: sin la barra,
 * `APPEND_SLASH` responde con una redirección y los POST pierden el cuerpo.
 */

import type { FiltroServicios, FiltroSolicitudes, FiltroUsuarios } from '@/data/repositories/types';

import type { Consulta } from './cliente';

const segmento = (id: string) => encodeURIComponent(id);

export const API = {
  auth: {
    /** GET: fija la cookie `csrftoken` antes del primer POST (modo sesión). */
    csrf: 'auth/csrf/',
    login: 'auth/login/',
    logout: 'auth/logout/',
    /** GET: usuario de la sesión vigente. */
    yo: 'auth/yo/',
    /** POST: par de tokens JWT (modo `jwt`). */
    token: 'auth/token/',
    renovar: 'auth/token/refresh/',
  },
  solicitudes: {
    lista: 'solicitudes/',
    detalle: (id: string) => `solicitudes/${segmento(id)}/`,
    transiciones: (id: string) => `solicitudes/${segmento(id)}/transiciones/`,
    adjuntos: (id: string) => `solicitudes/${segmento(id)}/adjuntos/`,
    adjunto: (id: string, adjuntoId: string) =>
      `solicitudes/${segmento(id)}/adjuntos/${segmento(adjuntoId)}/`,
    archivoAdjunto: (id: string, adjuntoId: string) =>
      `solicitudes/${segmento(id)}/adjuntos/${segmento(adjuntoId)}/archivo/`,
    documento: (id: string) => `solicitudes/${segmento(id)}/documento/`,
  },
  usuarios: {
    lista: 'usuarios/',
    detalle: (id: string) => `usuarios/${segmento(id)}/`,
  },
  indicadores: {
    /** GET y PUT: metas del cuadro de mando. */
    metas: 'indicadores/metas/',
  },
  servicios: {
    lista: 'servicios/',
    detalle: (id: string) => `servicios/${segmento(id)}/`,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Filtros → parámetros de consulta (django-filter / SearchFilter de DRF)
// ─────────────────────────────────────────────────────────────────────────────

export function consultaSolicitudes(filtro: FiltroSolicitudes = {}): Consulta {
  return {
    solicitante: filtro.solicitanteId,
    estado: filtro.estados,
    servicio: filtro.servicioId,
    search: filtro.busqueda?.trim(),
  };
}

export function consultaUsuarios(filtro: FiltroUsuarios = {}): Consulta {
  return {
    rol: filtro.rol,
    activo: filtro.activo,
    search: filtro.busqueda?.trim(),
  };
}

export function consultaServicios(filtro: FiltroServicios = {}): Consulta {
  return {
    activo: filtro.soloActivos ? true : undefined,
    categoria: filtro.categoria,
    search: filtro.busqueda?.trim(),
  };
}
