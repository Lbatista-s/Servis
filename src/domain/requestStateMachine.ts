/**
 * Máquina de estados del ciclo de vida de una solicitud.
 *
 * La tabla `TRANSICIONES` es la única fuente de verdad: cualquier cambio de
 * estado que no aparezca aquí es imposible por construcción. El grafo se
 * declara `as const` para que TypeScript conserve los literales y detecte en
 * tiempo de compilación cualquier estado inexistente.
 */

import { ESTADOS_FINALES, type EstadoSolicitud, type Rol } from './types';

/** Longitud mínima de la justificación al rechazar (regla de negocio). */
export const LONGITUD_MINIMA_JUSTIFICACION = 30;

/** Longitud mínima del motivo al devolver una solicitud para corrección. */
export const LONGITUD_MINIMA_MOTIVO_DEVOLUCION = 10;

export interface Transicion {
  readonly desde: EstadoSolicitud;
  readonly hacia: EstadoSolicitud;
  /** Roles autorizados a ejecutar esta transición. */
  readonly actores: readonly Rol[];
  /** Etiqueta de la acción tal como se muestra al usuario. */
  readonly accion: string;
  /** Si es `true`, la transición no se puede ejecutar sin comentario. */
  readonly requiereComentario: boolean;
  /** Longitud mínima exigida al comentario cuando es obligatorio. */
  readonly longitudMinimaComentario: number;
}

/**
 * Tabla de transiciones válidas. Refleja literalmente la especificación
 * funcional del sistema; ninguna otra combinación está permitida.
 */
export const TRANSICIONES: readonly Transicion[] = [
  // ── borrador → (estudiante) ──
  {
    desde: 'borrador',
    hacia: 'enviada',
    actores: ['estudiante'],
    accion: 'Enviar solicitud',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },
  {
    desde: 'borrador',
    hacia: 'cancelada',
    actores: ['estudiante'],
    accion: 'Cancelar solicitud',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },

  // ── enviada → (personal administrativo) ──
  {
    desde: 'enviada',
    hacia: 'en_revision',
    actores: ['personal_administrativo'],
    accion: 'Tomar en revisión',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },
  {
    desde: 'enviada',
    hacia: 'cancelada',
    actores: ['personal_administrativo'],
    accion: 'Cancelar solicitud',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },

  // ── en_revision → (personal administrativo / coordinador) ──
  {
    desde: 'en_revision',
    hacia: 'aprobada',
    actores: ['personal_administrativo', 'coordinador'],
    accion: 'Aprobar solicitud',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },
  {
    desde: 'en_revision',
    hacia: 'rechazada',
    actores: ['personal_administrativo', 'coordinador'],
    accion: 'Rechazar solicitud',
    // Todo rechazo exige justificación obligatoria de al menos 30 caracteres.
    requiereComentario: true,
    longitudMinimaComentario: LONGITUD_MINIMA_JUSTIFICACION,
  },
  {
    desde: 'en_revision',
    hacia: 'devuelta',
    actores: ['personal_administrativo', 'coordinador'],
    accion: 'Devolver para corrección',
    // Toda devolución exige indicar el motivo.
    requiereComentario: true,
    longitudMinimaComentario: LONGITUD_MINIMA_MOTIVO_DEVOLUCION,
  },

  // ── devuelta → (estudiante) ──
  {
    desde: 'devuelta',
    hacia: 'corregida',
    actores: ['estudiante'],
    accion: 'Enviar corrección',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },
  {
    desde: 'devuelta',
    hacia: 'cancelada',
    actores: ['estudiante'],
    accion: 'Cancelar solicitud',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },

  // ── corregida → (personal administrativo) ──
  {
    desde: 'corregida',
    hacia: 'en_revision',
    actores: ['personal_administrativo'],
    accion: 'Retomar revisión',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },
  {
    desde: 'corregida',
    hacia: 'cancelada',
    actores: ['personal_administrativo'],
    accion: 'Cancelar solicitud',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },

  // ── aprobada → (personal administrativo) ──
  {
    desde: 'aprobada',
    hacia: 'completada',
    actores: ['personal_administrativo'],
    accion: 'Marcar como completada',
    requiereComentario: false,
    longitudMinimaComentario: 0,
  },

  // ── rechazada, completada y cancelada son estados finales ──
];

/** Indica si un estado es terminal (sin transiciones de salida). */
export function esEstadoFinal(estado: EstadoSolicitud): boolean {
  return ESTADOS_FINALES.includes(estado);
}

/** Devuelve todas las transiciones que parten de `estado`. */
export function transicionesDesde(estado: EstadoSolicitud): readonly Transicion[] {
  return TRANSICIONES.filter((t) => t.desde === estado);
}

/** Estados a los que se puede llegar desde `estado`, sin considerar el rol. */
export function estadosSiguientes(estado: EstadoSolicitud): readonly EstadoSolicitud[] {
  return transicionesDesde(estado).map((t) => t.hacia);
}

/** Localiza la transición `desde → hacia`, o `undefined` si no existe. */
export function obtenerTransicion(
  desde: EstadoSolicitud,
  hacia: EstadoSolicitud,
): Transicion | undefined {
  return TRANSICIONES.find((t) => t.desde === desde && t.hacia === hacia);
}

/** `true` si la transición existe en la tabla, con independencia del actor. */
export function esTransicionValida(desde: EstadoSolicitud, hacia: EstadoSolicitud): boolean {
  return obtenerTransicion(desde, hacia) !== undefined;
}

/** `true` si la transición existe y además el rol está autorizado a ejecutarla. */
export function puedeTransicionar(
  desde: EstadoSolicitud,
  hacia: EstadoSolicitud,
  rol: Rol,
): boolean {
  const transicion = obtenerTransicion(desde, hacia);
  return transicion !== undefined && transicion.actores.includes(rol);
}

/**
 * Acciones que un rol concreto puede ejecutar sobre una solicitud en un estado
 * dado. Es lo que la interfaz usa para decidir qué botones mostrar, de modo que
 * la UI nunca ofrece una acción que el dominio vaya a rechazar.
 */
export function accionesDisponibles(estado: EstadoSolicitud, rol: Rol): readonly Transicion[] {
  return transicionesDesde(estado).filter((t) => t.actores.includes(rol));
}
