/** Rutas de la aplicación y su autorización por rol. */

import type { Rol } from '@/domain/types';

export const RUTAS = {
  login: '/login',
  recuperar: '/recuperar',
  inicio: '/inicio',
  catalogo: '/catalogo',
  nuevaSolicitud: (servicioId: string) => `/solicitudes/nueva/${servicioId}`,
  detalleSolicitud: (id: string) => `/solicitudes/${id}`,
  bandeja: '/bandeja',
  detalleBandeja: (id: string) => `/bandeja/${id}`,
  reportes: '/reportes',
  usuarios: '/admin/usuarios',
  servicios: '/admin/servicios',
} as const;

/**
 * Pantalla inicial de cada rol tras iniciar sesión. También es el destino al
 * que se redirige a quien intenta entrar en una ruta que no le corresponde.
 */
export const INICIO_POR_ROL: Record<Rol, string> = {
  estudiante: RUTAS.inicio,
  personal_administrativo: RUTAS.bandeja,
  // El coordinador trabaja sobre la misma bandeja que el personal administrativo.
  coordinador: RUTAS.bandeja,
  administrador: RUTAS.usuarios,
};

/** Roles con acceso al área administrativa de solicitudes. */
export const ROLES_BANDEJA: readonly Rol[] = ['personal_administrativo', 'coordinador'];
