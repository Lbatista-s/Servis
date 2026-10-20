/** Presentación de valores, metas, estados y tendencias del cuadro de mando. */

import type {
  DefinicionIndicador,
  DireccionTendencia,
  EstadoIndicador,
  Tendencia,
  Unidad,
} from '@/domain/indicadores';
import type { TonoBadge } from '@/components/ui';

const NUMERO = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 1 });

export function formatearValor(valor: number | null, unidad: Unidad): string {
  if (valor === null) return '—';
  const numero = NUMERO.format(valor);
  if (unidad === '%') return `${numero} %`;
  if (unidad === 'días') return `${numero} ${valor === 1 ? 'día' : 'días'}`;
  return `${numero} ${unidad}`;
}

/** `≥ 85 %`, `≤ 5 días`: la meta con el sentido en que se cumple. */
export function formatearMeta(meta: number, definicion: DefinicionIndicador): string {
  return `${definicion.sentido === 'mayor' ? '≥' : '≤'} ${formatearValor(meta, definicion.unidad)}`;
}

export const ETIQUETA_ESTADO_INDICADOR: Record<EstadoIndicador, string> = {
  cumple: 'Cumple',
  alerta: 'En alerta',
  incumple: 'No cumple',
  sin_datos: 'Sin datos',
};

export const TONO_ESTADO_INDICADOR: Record<EstadoIndicador, TonoBadge> = {
  cumple: 'green',
  alerta: 'amber',
  incumple: 'red',
  sin_datos: 'gray',
};

/** Token de color del estado, para marcas (puntos, bordes) y no para texto. */
export const COLOR_ESTADO_INDICADOR: Record<EstadoIndicador, string> = {
  cumple: 'success.DEFAULT',
  alerta: 'warning.DEFAULT',
  incumple: 'danger.DEFAULT',
  sin_datos: 'neutral.DEFAULT',
};

export const ETIQUETA_TENDENCIA: Record<DireccionTendencia, string> = {
  mejora: 'Mejora',
  empeora: 'Empeora',
  estable: 'Estable',
};

export function describirTendencia(tendencia: Tendencia | null, unidad: Unidad): string {
  if (!tendencia) return 'Sin comparación';
  if (tendencia.direccion === 'estable') return 'Estable';
  const signo = tendencia.diferencia > 0 ? '+' : '−';
  const magnitud = formatearValor(Math.abs(tendencia.diferencia), unidad).replace(' %', ' pp');
  return `${ETIQUETA_TENDENCIA[tendencia.direccion]} (${signo}${magnitud})`;
}
