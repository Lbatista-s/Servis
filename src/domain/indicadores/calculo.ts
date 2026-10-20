/**
 * Cálculo de los indicadores del cuadro de mando a partir de los datos del
 * sistema. Es puro: recibe las entidades y el intervalo, y no toca ni la red ni
 * el almacenamiento, así que el mismo código sirve con datos locales o de la API.
 */

import type { EstadoSolicitud, Rol, Servicio, Solicitud, Usuario } from '../types';

import { diasHabilesEntre, restarDias } from './calendario';
import { definicionDe, type IdIndicador, type Metas, type Sentido } from './definiciones';

export interface ContextoIndicadores {
  solicitudes: readonly Solicitud[];
  servicios: readonly Servicio[];
  usuarios: readonly Usuario[];
  /** Inicio del período (incluido). */
  desde: Date;
  /** Fin del período (excluido); para el período actual, «ahora». */
  hasta: Date;
}

export interface Medicion {
  /** `null` cuando no hay datos suficientes para calcularlo. */
  valor: number | null;
  /** Tamaño de la población medida (solicitudes, personas o servicios). */
  muestra: number;
}

/** Roles que tramitan solicitudes: el «personal» de los indicadores. */
const ROLES_PERSONAL: readonly Rol[] = ['personal_administrativo', 'coordinador'];
const ESTADOS_ABIERTOS: readonly EstadoSolicitud[] = [
  'enviada',
  'en_revision',
  'devuelta',
  'corregida',
  'aprobada',
];

// ─────────────────────────────────────────────────────────────────────────────
// Lectura del historial
// ─────────────────────────────────────────────────────────────────────────────

/** Primera vez que la solicitud llegó a alguno de los estados. */
function fechaDe(solicitud: Solicitud, estados: readonly EstadoSolicitud[]): Date | null {
  const entrada = solicitud.historial.find((e) => estados.includes(e.estadoNuevo));
  return entrada ? new Date(entrada.fecha) : null;
}

function fechaEnvio(solicitud: Solicitud): Date | null {
  return solicitud.enviadaEn ? new Date(solicitud.enviadaEn) : fechaDe(solicitud, ['enviada']);
}

const fechaResolucion = (s: Solicitud) => fechaDe(s, ['completada', 'rechazada']);

/** Estado de la solicitud en un instante dado, según su historial. */
function estadoEn(solicitud: Solicitud, instante: Date): EstadoSolicitud | null {
  let estado: EstadoSolicitud | null = null;
  for (const entrada of solicitud.historial) {
    if (new Date(entrada.fecha) >= instante) break;
    estado = entrada.estadoNuevo;
  }
  return estado;
}

const dentro = (fecha: Date | null, { desde, hasta }: ContextoIndicadores): fecha is Date =>
  fecha !== null && fecha >= desde && fecha < hasta;

const porcentaje = (parte: number, total: number): Medicion => ({
  valor: total > 0 ? (parte / total) * 100 : null,
  muestra: total,
});

const promedio = (valores: readonly number[]): Medicion => ({
  valor: valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : null,
  muestra: valores.length,
});

/** Factor para expresar un total del período «por cada 30 días». */
const por30Dias = ({ desde, hasta }: ContextoIndicadores) =>
  Math.max(1, (hasta.getTime() - desde.getTime()) / (30 * 24 * 60 * 60 * 1000));

function diasEstimados(contexto: ContextoIndicadores, servicioId: string): number | null {
  return contexto.servicios.find((s) => s.id === servicioId)?.diasEstimados ?? null;
}

const personalActivo = (c: ContextoIndicadores) =>
  c.usuarios.filter((u) => u.activo && ROLES_PERSONAL.includes(u.rol));

// ─────────────────────────────────────────────────────────────────────────────
// Indicadores
// ─────────────────────────────────────────────────────────────────────────────

const CALCULOS: Record<IdIndicador, (contexto: ContextoIndicadores) => Medicion> = {
  entregaATiempo(c) {
    let aTiempo = 0;
    let total = 0;
    for (const s of c.solicitudes) {
      const completada = fechaDe(s, ['completada']);
      const envio = fechaEnvio(s);
      const plazo = diasEstimados(c, s.servicioId);
      if (!dentro(completada, c) || !envio || plazo === null) continue;
      total += 1;
      if (diasHabilesEntre(envio, completada) <= plazo) aTiempo += 1;
    }
    return porcentaje(aTiempo, total);
  },

  tiempoCiclo(c) {
    const duraciones: number[] = [];
    for (const s of c.solicitudes) {
      const resuelta = fechaResolucion(s);
      const envio = fechaEnvio(s);
      if (dentro(resuelta, c) && envio) duraciones.push(diasHabilesEntre(envio, resuelta));
    }
    return promedio(duraciones);
  },

  resolucionPrimera(c) {
    const resueltas = c.solicitudes.filter((s) => dentro(fechaResolucion(s), c));
    const sinDevolucion = resueltas.filter(
      (s) => !s.historial.some((e) => e.estadoNuevo === 'devuelta'),
    );
    return porcentaje(sinDevolucion.length, resueltas.length);
  },

  productividad(c) {
    const resueltas = c.solicitudes.filter((s) => dentro(fechaResolucion(s), c)).length;
    const personas = personalActivo(c).length;
    return {
      valor: personas > 0 ? resueltas / personas / por30Dias(c) : null,
      muestra: resueltas,
    };
  },

  papelEvitado(c) {
    const enviadas = c.solicitudes.filter((s) => dentro(fechaEnvio(s), c));
    const hojas = enviadas.reduce(
      (total, s) => total + 1 + s.adjuntos.length + (s.documento ? 1 : 0),
      0,
    );
    return { valor: enviadas.length > 0 ? hojas / por30Dias(c) : null, muestra: enviadas.length };
  },

  tiempoAtencion(c) {
    const esperas: number[] = [];
    for (const s of c.solicitudes) {
      const revision = fechaDe(s, ['en_revision']);
      const envio = fechaEnvio(s);
      if (dentro(revision, c) && envio) esperas.push(diasHabilesEntre(envio, revision));
    }
    return promedio(esperas);
  },

  colaAlDia(c) {
    let abiertas = 0;
    let vencidas = 0;
    for (const s of c.solicitudes) {
      const estado = estadoEn(s, c.hasta);
      const envio = fechaEnvio(s);
      const plazo = diasEstimados(c, s.servicioId);
      if (!estado || !ESTADOS_ABIERTOS.includes(estado) || !envio || plazo === null) continue;
      abiertas += 1;
      if (diasHabilesEntre(envio, c.hasta) > plazo) vencidas += 1;
    }
    // Una cola vacía está al día: 0 % vencidas es un dato, no la falta de él.
    return { valor: abiertas > 0 ? (vencidas / abiertas) * 100 : 0, muestra: abiertas };
  },

  expedientesCompletos(c) {
    const enviadas = c.solicitudes.filter((s) => dentro(fechaEnvio(s), c));
    const completas = enviadas.filter((s) => {
      const servicio = c.servicios.find((x) => x.id === s.servicioId);
      const obligatorios = servicio?.requisitos.filter((r) => r.obligatorio).length ?? 0;
      return s.adjuntos.length >= obligatorios;
    });
    return porcentaje(completas.length, enviadas.length);
  },

  catalogoEnLinea(c) {
    return porcentaje(c.servicios.filter((s) => s.activo).length, c.servicios.length);
  },

  equipoInvolucrado(c) {
    const personal = personalActivo(c);
    const participantes = personal.filter((persona) =>
      c.solicitudes.some((s) =>
        s.historial.some((e) => e.autorId === persona.id && dentro(new Date(e.fecha), c)),
      ),
    );
    return porcentaje(participantes.length, personal.length);
  },

  adopcion(c) {
    const estudiantes = c.usuarios.filter((u) => u.activo && u.rol === 'estudiante');
    const usuarios = estudiantes.filter((estudiante) =>
      c.solicitudes.some(
        (s) => s.solicitanteId === estudiante.id && dentro(new Date(s.creadaEn), c),
      ),
    );
    return porcentaje(usuarios.length, estudiantes.length);
  },
};

export function calcularIndicador(id: IdIndicador, contexto: ContextoIndicadores): Medicion {
  return CALCULOS[id](contexto);
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluación frente a la meta
// ─────────────────────────────────────────────────────────────────────────────

export type EstadoIndicador = 'cumple' | 'alerta' | 'incumple' | 'sin_datos';

/** Margen, sobre la meta, dentro del cual un incumplimiento es sólo «alerta». */
export const TOLERANCIA = 0.1;

export function evaluar(valor: number | null, meta: number, sentido: Sentido): EstadoIndicador {
  if (valor === null) return 'sin_datos';
  if (sentido === 'mayor') {
    if (valor >= meta) return 'cumple';
    return valor >= meta * (1 - TOLERANCIA) ? 'alerta' : 'incumple';
  }
  if (valor <= meta) return 'cumple';
  return valor <= meta * (1 + TOLERANCIA) ? 'alerta' : 'incumple';
}

export type DireccionTendencia = 'mejora' | 'empeora' | 'estable';

export interface Tendencia {
  direccion: DireccionTendencia;
  /** Diferencia con el período anterior, en la unidad del indicador. */
  diferencia: number;
}

export function tendencia(
  actual: number | null,
  anterior: number | null,
  sentido: Sentido,
): Tendencia | null {
  if (actual === null || anterior === null) return null;
  const diferencia = actual - anterior;
  // Variaciones de menos del 2 % del valor anterior se consideran estables.
  if (Math.abs(diferencia) <= Math.abs(anterior) * 0.02 + 1e-9) {
    return { direccion: 'estable', diferencia };
  }
  const mejora = sentido === 'mayor' ? diferencia > 0 : diferencia < 0;
  return { direccion: mejora ? 'mejora' : 'empeora', diferencia };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cuadro completo
// ─────────────────────────────────────────────────────────────────────────────

export interface ResultadoIndicador {
  id: IdIndicador;
  medicion: Medicion;
  anterior: Medicion | null;
  meta: number;
  estado: EstadoIndicador;
  tendencia: Tendencia | null;
}

export interface DatosCuadro {
  solicitudes: readonly Solicitud[];
  servicios: readonly Servicio[];
  usuarios: readonly Usuario[];
}

/**
 * Calcula todos los indicadores del período de `dias` que termina en `ahora`
 * y los compara con el período anterior de la misma duración.
 */
export function calcularCuadro(
  datos: DatosCuadro,
  metas: Metas,
  dias: number,
  ahora: Date,
  ids: readonly IdIndicador[],
): ResultadoIndicador[] {
  const desde = restarDias(ahora, dias);
  const actual: ContextoIndicadores = { ...datos, desde, hasta: ahora };
  const previo: ContextoIndicadores = { ...datos, desde: restarDias(desde, dias), hasta: desde };

  return ids.map((id) => {
    const definicion = definicionDe(id);
    const medicion = calcularIndicador(id, actual);
    const anterior = definicion.instantaneo ? null : calcularIndicador(id, previo);
    return {
      id,
      medicion,
      anterior,
      meta: metas[id],
      estado: evaluar(medicion.valor, metas[id], definicion.sentido),
      tendencia: tendencia(medicion.valor, anterior?.valor ?? null, definicion.sentido),
    };
  });
}

export interface PuntoSerie {
  /** Primer día del mes, en ISO. */
  mes: string;
  valor: number | null;
}

/** Valor del indicador en cada uno de los últimos `meses` meses naturales. */
export function serieMensual(
  id: IdIndicador,
  datos: DatosCuadro,
  ahora: Date,
  meses = 6,
): PuntoSerie[] {
  const puntos: PuntoSerie[] = [];
  for (let atras = meses - 1; atras >= 0; atras -= 1) {
    const desde = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - atras, 1));
    const finMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - atras + 1, 1));
    const hasta = finMes < ahora ? finMes : ahora;
    puntos.push({
      mes: desde.toISOString(),
      valor: calcularIndicador(id, { ...datos, desde, hasta }).valor,
    });
  }
  return puntos;
}
