/**
 * Reglas de negocio de SERVIS.
 *
 * Funciones puras que validan y aplican cambios sobre las entidades del
 * dominio. No lanzan excepciones para los errores esperables: devuelven un
 * `Resultado` discriminado, de modo que la interfaz pueda mostrar el mensaje
 * exacto sin envolver todo en try/catch.
 */

import {
  accionesDisponibles,
  esEstadoFinal,
  obtenerTransicion,
  type Transicion,
} from './requestStateMachine';
import type { Actor, EntradaHistorial, EstadoSolicitud, Servicio, Solicitud } from './types';
import { ETIQUETA_ESTADO } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Resultado y errores
// ─────────────────────────────────────────────────────────────────────────────

export type CodigoError =
  | 'TRANSICION_INVALIDA'
  | 'ROL_NO_AUTORIZADO'
  | 'NO_ES_PROPIETARIO'
  | 'COMENTARIO_REQUERIDO'
  | 'COMENTARIO_MUY_CORTO'
  | 'SOLICITUD_INMUTABLE'
  | 'APROBACION_SIN_REVISION'
  | 'SERVICIO_SIN_REQUISITOS'
  | 'ADJUNTOS_FALTANTES';

export interface ErrorDominio {
  readonly codigo: CodigoError;
  readonly mensaje: string;
}

export type Resultado<T> =
  { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly error: ErrorDominio };

const exito = <T>(valor: T): Resultado<T> => ({ ok: true, valor });

const fallo = <T>(codigo: CodigoError, mensaje: string): Resultado<T> => ({
  ok: false,
  error: { codigo, mensaje },
});

// ─────────────────────────────────────────────────────────────────────────────
// Invariantes sobre solicitudes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Una solicitud en estado final ya no admite modificaciones. En particular,
 * una solicitud `completada` es inmutable.
 */
export function puedeModificarse(solicitud: Solicitud): boolean {
  return !esEstadoFinal(solicitud.estado);
}

/**
 * Comprueba que la solicitud haya pasado en algún momento por `en_revision`.
 * La tabla de transiciones ya lo garantiza, pero se valida de forma explícita
 * como red de seguridad frente a datos importados o migrados.
 */
export function haPasadoPorRevision(solicitud: Solicitud): boolean {
  return (
    solicitud.estado === 'en_revision' ||
    solicitud.historial.some((entrada) => entrada.estadoNuevo === 'en_revision')
  );
}

/** Sólo el estudiante propietario puede ejecutar las acciones de estudiante. */
function esPropietario(solicitud: Solicitud, actor: Actor): boolean {
  return solicitud.solicitanteId === actor.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validación de una transición concreta
// ─────────────────────────────────────────────────────────────────────────────

export interface OpcionesTransicion {
  /** Comentario o justificación asociada al cambio de estado. */
  comentario?: string;
  /** Fecha de la acción; inyectable para que las pruebas sean deterministas. */
  ahora?: Date;
  /** Generador de identificadores; inyectable por el mismo motivo. */
  generarId?: () => string;
}

/**
 * Valida una transición sin aplicarla. Es lo que usan los formularios para
 * mostrar errores antes de que el usuario confirme.
 */
export function validarTransicion(
  solicitud: Solicitud,
  hacia: EstadoSolicitud,
  actor: Actor,
  opciones: OpcionesTransicion = {},
): Resultado<Transicion> {
  const desde = solicitud.estado;

  // Una solicitud en estado final es inmutable.
  if (esEstadoFinal(desde)) {
    return fallo(
      'SOLICITUD_INMUTABLE',
      `La solicitud está ${ETIQUETA_ESTADO[desde].toLowerCase()} y ya no admite cambios.`,
    );
  }

  const transicion = obtenerTransicion(desde, hacia);
  if (!transicion) {
    return fallo(
      'TRANSICION_INVALIDA',
      `No es posible pasar de «${ETIQUETA_ESTADO[desde]}» a «${ETIQUETA_ESTADO[hacia]}».`,
    );
  }

  if (!transicion.actores.includes(actor.rol)) {
    return fallo(
      'ROL_NO_AUTORIZADO',
      `Tu rol no está autorizado para ejecutar la acción «${transicion.accion}».`,
    );
  }

  // Las acciones propias del estudiante sólo las ejecuta el propietario.
  if (actor.rol === 'estudiante' && !esPropietario(solicitud, actor)) {
    return fallo(
      'NO_ES_PROPIETARIO',
      'Sólo el estudiante que creó la solicitud puede realizar esta acción.',
    );
  }

  // Una aprobación exige que la solicitud haya pasado por revisión.
  if (hacia === 'aprobada' && !haPasadoPorRevision(solicitud)) {
    return fallo(
      'APROBACION_SIN_REVISION',
      'La solicitud no puede aprobarse sin haber pasado por revisión.',
    );
  }

  // Justificaciones obligatorias (rechazo y devolución).
  if (transicion.requiereComentario) {
    const comentario = (opciones.comentario ?? '').trim();
    if (comentario.length === 0) {
      return fallo(
        'COMENTARIO_REQUERIDO',
        `La acción «${transicion.accion}» exige indicar el motivo.`,
      );
    }
    if (comentario.length < transicion.longitudMinimaComentario) {
      return fallo(
        'COMENTARIO_MUY_CORTO',
        `El motivo debe tener al menos ${transicion.longitudMinimaComentario} caracteres ` +
          `(actualmente tiene ${comentario.length}).`,
      );
    }
  }

  return exito(transicion);
}

// ─────────────────────────────────────────────────────────────────────────────
// Aplicación de la transición
// ─────────────────────────────────────────────────────────────────────────────

let contadorHistorial = 0;

function idHistorialPorDefecto(): string {
  contadorHistorial += 1;
  return `hist-${Date.now().toString(36)}-${contadorHistorial}`;
}

/**
 * Aplica una transición y devuelve una **nueva** solicitud. Nunca muta la
 * original y siempre añade una entrada inmutable al historial con el autor, la
 * fecha, el estado anterior, el nuevo y el comentario.
 */
export function aplicarTransicion(
  solicitud: Solicitud,
  hacia: EstadoSolicitud,
  actor: Actor,
  opciones: OpcionesTransicion = {},
): Resultado<Solicitud> {
  const validacion = validarTransicion(solicitud, hacia, actor, opciones);
  if (!validacion.ok) return validacion;

  const ahora = opciones.ahora ?? new Date();
  const generarId = opciones.generarId ?? idHistorialPorDefecto;
  const comentario = opciones.comentario?.trim();

  const entrada: EntradaHistorial = Object.freeze({
    id: generarId(),
    solicitudId: solicitud.id,
    autorId: actor.id,
    autorNombre: actor.nombre,
    fecha: ahora.toISOString(),
    estadoAnterior: solicitud.estado,
    estadoNuevo: hacia,
    comentario: comentario && comentario.length > 0 ? comentario : null,
  });

  return exito({
    ...solicitud,
    estado: hacia,
    actualizadaEn: ahora.toISOString(),
    // La fecha de envío se fija la primera vez que la solicitud sale de borrador.
    enviadaEn:
      hacia === 'enviada' && solicitud.enviadaEn === null
        ? ahora.toISOString()
        : solicitud.enviadaEn,
    historial: Object.freeze([...solicitud.historial, entrada]),
  });
}

/**
 * Valida la edición de los datos de una solicitud (formulario o adjuntos).
 * Una solicitud en estado final no puede modificarse.
 */
export function validarEdicion(solicitud: Solicitud, actor: Actor): Resultado<Solicitud> {
  if (!puedeModificarse(solicitud)) {
    return fallo(
      'SOLICITUD_INMUTABLE',
      `La solicitud está ${ETIQUETA_ESTADO[solicitud.estado].toLowerCase()} y ya no admite cambios.`,
    );
  }
  if (actor.rol === 'estudiante' && !esPropietario(solicitud, actor)) {
    return fallo(
      'NO_ES_PROPIETARIO',
      'Sólo el estudiante que creó la solicitud puede modificarla.',
    );
  }
  return exito(solicitud);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reglas del catálogo de servicios
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un servicio no puede activarse sin requisitos definidos. Desactivarlo
 * siempre está permitido.
 */
export function validarActivacionServicio(
  servicio: Servicio,
  activar: boolean,
): Resultado<Servicio> {
  if (activar && servicio.requisitos.length === 0) {
    return fallo(
      'SERVICIO_SIN_REQUISITOS',
      'No se puede activar un servicio sin requisitos definidos.',
    );
  }
  return exito({ ...servicio, activo: activar });
}

/**
 * Comprueba que se hayan adjuntado tantos documentos como requisitos
 * obligatorios declare el servicio antes de permitir el envío.
 */
export function validarRequisitosCubiertos(
  solicitud: Solicitud,
  servicio: Servicio,
): Resultado<Solicitud> {
  const obligatorios = servicio.requisitos.filter((r) => r.obligatorio).length;
  if (solicitud.adjuntos.length < obligatorios) {
    return fallo(
      'ADJUNTOS_FALTANTES',
      `Este servicio exige ${obligatorios} documento(s) obligatorio(s); ` +
        `has adjuntado ${solicitud.adjuntos.length}.`,
    );
  }
  return exito(solicitud);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades para la interfaz
// ─────────────────────────────────────────────────────────────────────────────

/** Acciones que el actor puede ejecutar ahora mismo sobre la solicitud. */
export function accionesPara(solicitud: Solicitud, actor: Actor): readonly Transicion[] {
  if (actor.rol === 'estudiante' && !esPropietario(solicitud, actor)) return [];
  return accionesDisponibles(solicitud.estado, actor.rol);
}
