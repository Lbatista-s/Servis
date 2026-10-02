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
  cuadroMando: '/cuadro-de-mando',
  /** Antigua ruta de reportes; redirige al cuadro de mando. */
  reportes: '/reportes',
  inicioAdmin: '/admin',
  usuarios: '/admin/usuarios',
  servicios: '/admin/servicios',
} as const;

/** Patrones con parámetros para React Router, derivados de las mismas rutas. */
export const PATRONES = {
  nuevaSolicitud: RUTAS.nuevaSolicitud(':servicioId'),
  detalleSolicitud: RUTAS.detalleSolicitud(':id'),
  detalleBandeja: RUTAS.detalleBandeja(':id'),
} as const;

/** Prefijos de las rutas con parámetros, para reconocerlas sin repetir cadenas. */
export const PREFIJOS = {
  nuevaSolicitud: RUTAS.nuevaSolicitud(''),
  detalleSolicitud: RUTAS.detalleSolicitud(''),
  detalleBandeja: RUTAS.detalleBandeja(''),
} as const;

/**
 * Pantalla inicial de cada rol tras iniciar sesión. También es el destino al
 * que se redirige a quien intenta entrar en una ruta que no le corresponde.
 */
export const INICIO_POR_ROL: Record<Rol, string> = {
  estudiante: RUTAS.inicio,
  // El personal trabaja la cola del día: su inicio es la bandeja.
  personal_administrativo: RUTAS.bandeja,
  // El coordinador dirige: su inicio es el cuadro de mando integral.
  coordinador: RUTAS.cuadroMando,
  administrador: RUTAS.inicioAdmin,
};

/** Roles con acceso al área administrativa de solicitudes. */
export const ROLES_BANDEJA: readonly Rol[] = ['personal_administrativo', 'coordinador'];
