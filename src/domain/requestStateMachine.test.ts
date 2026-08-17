import { describe, expect, it } from 'vitest';

import {
  accionesDisponibles,
  esEstadoFinal,
  esTransicionValida,
  estadosSiguientes,
  LONGITUD_MINIMA_JUSTIFICACION,
  obtenerTransicion,
  puedeTransicionar,
  TRANSICIONES,
} from './requestStateMachine';
import { ESTADOS, ROLES, type EstadoSolicitud, type Rol } from './types';

/**
 * Tabla escrita a mano a partir de la especificación funcional. Se declara de
 * forma independiente a la implementación para que la prueba compare contra el
 * requisito y no contra el propio código.
 */
const TABLA_ESPERADA: Record<EstadoSolicitud, { siguientes: EstadoSolicitud[]; actores: Rol[] }> = {
  borrador: { siguientes: ['enviada', 'cancelada'], actores: ['estudiante'] },
  enviada: { siguientes: ['en_revision', 'cancelada'], actores: ['personal_administrativo'] },
  en_revision: {
    siguientes: ['aprobada', 'rechazada', 'devuelta'],
    actores: ['personal_administrativo', 'coordinador'],
  },
  devuelta: { siguientes: ['corregida', 'cancelada'], actores: ['estudiante'] },
  corregida: { siguientes: ['en_revision', 'cancelada'], actores: ['personal_administrativo'] },
  aprobada: { siguientes: ['completada'], actores: ['personal_administrativo'] },
  rechazada: { siguientes: [], actores: [] },
  completada: { siguientes: [], actores: [] },
  cancelada: { siguientes: [], actores: [] },
};

describe('máquina de estados — grafo de transiciones', () => {
  it('expone exactamente los estados siguientes definidos en la especificación', () => {
    for (const estado of ESTADOS) {
      expect([...estadosSiguientes(estado)].sort()).toEqual(
        [...TABLA_ESPERADA[estado].siguientes].sort(),
      );
    }
  });

  it('rechaza toda combinación de estados que no figure en la tabla', () => {
    // Se recorre el producto cartesiano completo (9 × 9 = 81 combinaciones).
    let comprobadas = 0;
    for (const desde of ESTADOS) {
      for (const hacia of ESTADOS) {
        const permitida = TABLA_ESPERADA[desde].siguientes.includes(hacia);
        expect(
          esTransicionValida(desde, hacia),
          `transición ${desde} → ${hacia} debería ser ${permitida ? 'válida' : 'inválida'}`,
        ).toBe(permitida);
        comprobadas += 1;
      }
    }
    expect(comprobadas).toBe(ESTADOS.length * ESTADOS.length);
  });

  it('no permite que un estado transicione hacia sí mismo', () => {
    for (const estado of ESTADOS) {
      expect(esTransicionValida(estado, estado)).toBe(false);
    }
  });

  it('marca rechazada, completada y cancelada como estados finales', () => {
    expect(esEstadoFinal('rechazada')).toBe(true);
    expect(esEstadoFinal('completada')).toBe(true);
    expect(esEstadoFinal('cancelada')).toBe(true);

    for (const estado of [
      'borrador',
      'enviada',
      'en_revision',
      'devuelta',
      'corregida',
      'aprobada',
    ] as const) {
      expect(esEstadoFinal(estado)).toBe(false);
    }
  });

  it('los estados finales no tienen ninguna transición de salida', () => {
    for (const estado of ['rechazada', 'completada', 'cancelada'] as const) {
      expect(estadosSiguientes(estado)).toHaveLength(0);
      for (const rol of ROLES) {
        expect(accionesDisponibles(estado, rol)).toHaveLength(0);
      }
    }
  });

  it('no declara transiciones duplicadas', () => {
    const claves = TRANSICIONES.map((t) => `${t.desde}→${t.hacia}`);
    expect(new Set(claves).size).toBe(claves.length);
  });
});

describe('máquina de estados — autorización por rol', () => {
  it('asigna a cada transición únicamente los actores de la especificación', () => {
    for (const estado of ESTADOS) {
      for (const hacia of TABLA_ESPERADA[estado].siguientes) {
        const transicion = obtenerTransicion(estado, hacia);
        expect(transicion).toBeDefined();
        expect([...(transicion?.actores ?? [])].sort()).toEqual(
          [...TABLA_ESPERADA[estado].actores].sort(),
        );
      }
    }
  });

  it('impide que un rol no autorizado ejecute una transición válida', () => {
    // El estudiante no puede tomar en revisión una solicitud enviada.
    expect(esTransicionValida('enviada', 'en_revision')).toBe(true);
    expect(puedeTransicionar('enviada', 'en_revision', 'estudiante')).toBe(false);
    expect(puedeTransicionar('enviada', 'en_revision', 'personal_administrativo')).toBe(true);

    // El personal administrativo no envía la solicitud del estudiante.
    expect(puedeTransicionar('borrador', 'enviada', 'personal_administrativo')).toBe(false);
    expect(puedeTransicionar('borrador', 'enviada', 'estudiante')).toBe(true);
  });

  it('el coordinador sólo actúa sobre solicitudes en revisión', () => {
    expect(
      accionesDisponibles('en_revision', 'coordinador')
        .map((t) => t.hacia)
        .sort(),
    ).toEqual(['aprobada', 'devuelta', 'rechazada']);
    expect(accionesDisponibles('enviada', 'coordinador')).toHaveLength(0);
    expect(accionesDisponibles('aprobada', 'coordinador')).toHaveLength(0);
  });

  it('el administrador del sistema no participa en el flujo de solicitudes', () => {
    for (const estado of ESTADOS) {
      expect(accionesDisponibles(estado, 'administrador')).toHaveLength(0);
    }
  });
});

describe('máquina de estados — comentarios obligatorios', () => {
  it('exige justificación de 30 caracteres para rechazar', () => {
    const rechazo = obtenerTransicion('en_revision', 'rechazada');
    expect(rechazo?.requiereComentario).toBe(true);
    expect(rechazo?.longitudMinimaComentario).toBe(LONGITUD_MINIMA_JUSTIFICACION);
    expect(LONGITUD_MINIMA_JUSTIFICACION).toBe(30);
  });

  it('exige motivo para devolver una solicitud', () => {
    const devolucion = obtenerTransicion('en_revision', 'devuelta');
    expect(devolucion?.requiereComentario).toBe(true);
    expect(devolucion?.longitudMinimaComentario).toBeGreaterThan(0);
  });

  it('no exige comentario en las transiciones restantes', () => {
    const conComentario = TRANSICIONES.filter((t) => t.requiereComentario).map(
      (t) => `${t.desde}→${t.hacia}`,
    );
    expect(conComentario.sort()).toEqual(['en_revision→devuelta', 'en_revision→rechazada']);
  });
});
