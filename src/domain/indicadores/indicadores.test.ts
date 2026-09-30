/** Pruebas del cuadro de mando: calendario laboral, indicadores, evaluación y tendencia. */

import { describe, expect, it } from 'vitest';

import { crearEntradaHistorial, crearSolicitud } from '@/test/factories';
import type { EstadoSolicitud, Servicio, Solicitud, Usuario } from '@/domain/types';

import {
  calcularCuadro,
  calcularIndicador,
  diasHabilesEntre,
  evaluar,
  ID_INDICADORES,
  INDICADORES,
  METAS_POR_DEFECTO,
  serieMensual,
  sumarDiasHabiles,
  tendencia,
  type ContextoIndicadores,
} from './index';

// Lunes 7 de septiembre de 2026, 10:00 en Santo Domingo (14:00 UTC).
const LUNES = '2026-09-07T14:00:00.000Z';
const dia = (n: number) => new Date(new Date(LUNES).getTime() + n * 86_400_000).toISOString();

const SERVICIO: Servicio = {
  id: 'carnet',
  nombre: 'Carnet',
  descripcion: '',
  icono: '🪪',
  color: '',
  categoria: 'identidad',
  requisitos: [
    { id: 'r1', descripcion: 'Foto', obligatorio: true },
    { id: 'r2', descripcion: 'Cédula', obligatorio: true },
  ],
  plantilla: '',
  activo: true,
  diasEstimados: 3,
};

function usuario(id: string, rol: Usuario['rol'], activo = true): Usuario {
  return {
    id,
    nombre: id,
    correo: `${id}@intec.edu.do`,
    rol,
    iniciales: 'XX',
    colorAvatar: 'blue',
    activo,
    ultimoAcceso: LUNES,
  };
}

const USUARIOS = [
  usuario('est-1', 'estudiante'),
  usuario('est-2', 'estudiante'),
  usuario('per-1', 'personal_administrativo'),
  usuario('per-2', 'personal_administrativo'),
  usuario('coo-1', 'coordinador'),
  usuario('baja', 'personal_administrativo', false),
];

/** Solicitud que recorre `pasos` ([estado, día, autor]) desde un borrador del día 0. */
function recorrido(
  id: string,
  pasos: [EstadoSolicitud, number, string?][],
  extra: Partial<Solicitud> = {},
): Solicitud {
  const historial = [
    crearEntradaHistorial({ id: `${id}-0`, solicitudId: id, fecha: dia(0), autorId: 'est-1' }),
    ...pasos.map(([estado, n, autor], i) =>
      crearEntradaHistorial({
        id: `${id}-${i + 1}`,
        solicitudId: id,
        fecha: dia(n),
        autorId: autor ?? 'per-1',
        estadoAnterior: i === 0 ? 'borrador' : (pasos[i - 1]?.[0] ?? 'borrador'),
        estadoNuevo: estado,
      }),
    ),
  ];
  const envio = pasos.find(([estado]) => estado === 'enviada');
  return crearSolicitud({
    id,
    servicioId: 'carnet',
    solicitanteId: 'est-1',
    creadaEn: dia(0),
    enviadaEn: envio ? dia(envio[1]) : null,
    estado: pasos.at(-1)?.[0] ?? 'borrador',
    historial,
    adjuntos: [],
    ...extra,
  });
}

const adjuntos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `a${i}`,
    nombre: 'x.pdf',
    tamano: 1,
    tipo: 'application/pdf',
    subidoEn: LUNES,
  }));

// A tiempo: enviada el lunes y completada el miércoles (2 días hábiles).
const A_TIEMPO = recorrido(
  'A',
  [
    ['enviada', 0, 'est-1'],
    ['en_revision', 1],
    ['aprobada', 2, 'coo-1'],
    ['completada', 2],
  ],
  { adjuntos: adjuntos(2), documento: { nombre: 'a.pdf', generadoEn: dia(2) } },
);
// Tarde y con devolución: completada 8 días naturales (6 hábiles) después.
const TARDE = recorrido(
  'B',
  [
    ['enviada', 0, 'est-1'],
    ['en_revision', 3],
    ['devuelta', 3],
    ['corregida', 4, 'est-1'],
    ['en_revision', 7],
    ['aprobada', 8],
    ['completada', 8],
  ],
  { adjuntos: adjuntos(1) },
);
const RECHAZADA = recorrido('C', [
  ['enviada', 0, 'est-1'],
  ['en_revision', 1],
  ['rechazada', 1],
]);
// Sigue abierta y ya superó sus 3 días hábiles.
const VENCIDA = recorrido('D', [
  ['enviada', 0, 'est-1'],
  ['en_revision', 1],
]);

const contexto = (
  solicitudes: Solicitud[],
  desde = dia(-1),
  hasta = dia(10),
): ContextoIndicadores => ({
  solicitudes,
  servicios: [SERVICIO, { ...SERVICIO, id: 'objetos', activo: false }],
  usuarios: USUARIOS,
  desde: new Date(desde),
  hasta: new Date(hasta),
});

const valor = (id: (typeof ID_INDICADORES)[number], c: ContextoIndicadores) =>
  calcularIndicador(id, c).valor;

describe('calendario laboral', () => {
  it('no cuenta sábados ni domingos', () => {
    // Del viernes 10:00 al lunes 10:00 transcurre un solo día hábil.
    expect(diasHabilesEntre('2026-09-04T14:00:00Z', '2026-09-07T14:00:00Z')).toBeCloseTo(1);
    expect(diasHabilesEntre(LUNES, dia(7))).toBeCloseTo(5);
    expect(diasHabilesEntre(dia(2), dia(1))).toBe(0);
  });

  it('suma días hábiles saltando el fin de semana', () => {
    // Del viernes 10:00, dos días hábiles después es el martes 10:00.
    expect(sumarDiasHabiles(new Date('2026-09-04T14:00:00Z'), 2).toISOString()).toBe(
      '2026-09-08T14:00:00.000Z',
    );
  });
});

describe('indicadores', () => {
  const todas = contexto([A_TIEMPO, TARDE, RECHAZADA, VENCIDA]);

  it('cumplimiento del plazo: sólo las completadas dentro de los días estimados', () => {
    expect(valor('entregaATiempo', todas)).toBe(50);
    expect(calcularIndicador('entregaATiempo', todas).muestra).toBe(2);
  });

  it('tiempo de ciclo: promedio de días hábiles hasta completar o rechazar', () => {
    // A: 2 días, B: 6 días (8 naturales con un fin de semana), C: 1 día.
    expect(valor('tiempoCiclo', todas)).toBeCloseTo(3);
  });

  it('resolución sin devoluciones', () => {
    expect(valor('resolucionPrimera', todas)).toBeCloseTo((2 / 3) * 100);
  });

  it('tiempo hasta la revisión: la primera vez que se toma', () => {
    // A: 1, B: 3, C: 1, D: 1 días hábiles.
    expect(valor('tiempoAtencion', todas)).toBeCloseTo(1.5);
  });

  it('solicitudes vencidas: abiertas al cierre que superan su plazo', () => {
    expect(valor('colaAlDia', todas)).toBe(100);
    // Al día siguiente del envío todavía estaba en plazo.
    expect(valor('colaAlDia', contexto([VENCIDA], dia(-1), dia(1.5)))).toBe(0);
    // Sin nada abierto, la cola está al día.
    expect(calcularIndicador('colaAlDia', contexto([A_TIEMPO]))).toEqual({ valor: 0, muestra: 0 });
  });

  it('expedientes completos: adjuntos frente a requisitos obligatorios', () => {
    expect(valor('expedientesCompletos', todas)).toBe(25);
  });

  it('productividad y papel se normalizan a 30 días', () => {
    const c = contexto([A_TIEMPO, TARDE, RECHAZADA], dia(0), dia(30));
    // 3 resueltas entre 3 personas activas en 30 días (la cuenta de baja no cuenta).
    expect(valor('productividad', c)).toBeCloseTo(1);
    // A: 1 + 2 adjuntos + documento; B: 1 + 1; C: 1.
    expect(valor('papelEvitado', c)).toBeCloseTo(7);
  });

  it('capacidades: catálogo, personal que participa y adopción', () => {
    expect(valor('catalogoEnLinea', todas)).toBe(50);
    // Participan per-1 y coo-1 de 3 personas activas.
    expect(valor('equipoInvolucrado', todas)).toBeCloseTo((2 / 3) * 100);
    // Sólo est-1 creó solicitudes, de 2 estudiantes activos.
    expect(valor('adopcion', todas)).toBe(50);
  });

  it('sin población no hay dato', () => {
    const vacio = contexto([]);
    expect(valor('entregaATiempo', vacio)).toBeNull();
    expect(valor('tiempoCiclo', vacio)).toBeNull();
  });
});

describe('evaluación frente a la meta', () => {
  it.each([
    [90, 85, 'mayor', 'cumple'],
    [80, 85, 'mayor', 'alerta'],
    [70, 85, 'mayor', 'incumple'],
    [4, 5, 'menor', 'cumple'],
    [5.4, 5, 'menor', 'alerta'],
    [7, 5, 'menor', 'incumple'],
    [null, 5, 'menor', 'sin_datos'],
  ] as const)('%s con meta %s (%s) → %s', (v, meta, sentido, esperado) => {
    expect(evaluar(v, meta, sentido)).toBe(esperado);
  });

  it('la tendencia depende del sentido del indicador', () => {
    expect(tendencia(80, 70, 'mayor')?.direccion).toBe('mejora');
    expect(tendencia(80, 70, 'menor')?.direccion).toBe('empeora');
    expect(tendencia(70.5, 70, 'mayor')?.direccion).toBe('estable');
    expect(tendencia(80, null, 'mayor')).toBeNull();
  });
});

describe('cuadro completo', () => {
  it('cada indicador tiene definición, meta por defecto y relaciones válidas', () => {
    expect(INDICADORES.map((i) => i.id)).toEqual([...ID_INDICADORES]);
    for (const indicador of INDICADORES) {
      expect(METAS_POR_DEFECTO[indicador.id]).toBe(indicador.metaPorDefecto);
      for (const destino of indicador.contribuyeA) expect(ID_INDICADORES).toContain(destino);
    }
  });

  it('compara con el período anterior de igual duración', () => {
    const datos = {
      solicitudes: [A_TIEMPO, TARDE],
      servicios: [SERVICIO],
      usuarios: USUARIOS,
    };
    const [entrega] = calcularCuadro(datos, METAS_POR_DEFECTO, 5, new Date(dia(10)), [
      'entregaATiempo',
    ]);
    // Período actual (días 5–10): sólo B, tarde. Anterior (0–5): sólo A, a tiempo.
    expect(entrega?.medicion.valor).toBe(0);
    expect(entrega?.anterior?.valor).toBe(100);
    expect(entrega?.tendencia?.direccion).toBe('empeora');
    expect(entrega?.estado).toBe('incumple');
  });

  it('los indicadores instantáneos no tienen tendencia', () => {
    const datos = { solicitudes: [], servicios: [SERVICIO], usuarios: USUARIOS };
    const [catalogo] = calcularCuadro(datos, METAS_POR_DEFECTO, 30, new Date(dia(10)), [
      'catalogoEnLinea',
    ]);
    expect(catalogo?.anterior).toBeNull();
    expect(catalogo?.tendencia).toBeNull();
  });

  it('la serie mensual tiene un punto por mes, del más antiguo al actual', () => {
    const datos = { solicitudes: [A_TIEMPO], servicios: [SERVICIO], usuarios: USUARIOS };
    const serie = serieMensual('entregaATiempo', datos, new Date('2026-09-30T12:00:00Z'), 6);
    expect(serie.map((p) => p.mes.slice(0, 7))).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ]);
    expect(serie.at(-1)?.valor).toBe(100);
    expect(serie[0]?.valor).toBeNull();
  });
});
