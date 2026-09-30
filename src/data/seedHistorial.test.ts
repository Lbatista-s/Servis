/** Pruebas del historial de demostración del cuadro de mando. */

import { describe, expect, it } from 'vitest';

import { esEstadoFinal, esTransicionValida } from '@/domain/requestStateMachine';

import { construirHistorialDemo } from './seedHistorial';

const AHORA = new Date('2026-09-30T15:00:00.000Z');
const historial = construirHistorialDemo(AHORA);

describe('historial de demostración', () => {
  it('es reproducible con la misma fecha y semilla', () => {
    expect(construirHistorialDemo(AHORA)).toEqual(historial);
    expect(construirHistorialDemo(AHORA, 7)).not.toEqual(historial);
  });

  it('sólo contiene solicitudes cerradas de los seis meses anteriores', () => {
    expect(historial.length).toBeGreaterThanOrEqual(80);
    const limite = AHORA.getTime() - 181 * 86_400_000;
    for (const solicitud of historial) {
      expect(solicitud.id).toMatch(/^SRV-09\d\d$/);
      expect(esEstadoFinal(solicitud.estado)).toBe(true);
      expect(new Date(solicitud.creadaEn).getTime()).toBeGreaterThan(limite);
      expect(new Date(solicitud.actualizadaEn).getTime()).toBeLessThan(AHORA.getTime());
    }
  });

  it('recorre transiciones válidas en orden cronológico', () => {
    for (const solicitud of historial) {
      for (let i = 1; i < solicitud.historial.length; i += 1) {
        const anterior = solicitud.historial[i - 1];
        const actual = solicitud.historial[i];
        if (!anterior || !actual) continue;
        expect(esTransicionValida(anterior.estadoNuevo, actual.estadoNuevo)).toBe(true);
        expect(actual.fecha >= anterior.fecha).toBe(true);
      }
    }
  });

  it('mezcla los casos que el cuadro necesita medir', () => {
    const estados = new Set(historial.map((s) => s.estado));
    expect(estados).toEqual(new Set(['completada', 'rechazada', 'cancelada']));
    expect(historial.some((s) => s.historial.some((e) => e.estadoNuevo === 'devuelta'))).toBe(true);
    for (const s of historial) {
      expect(s.documento !== null).toBe(s.estado === 'completada');
    }
  });
});
