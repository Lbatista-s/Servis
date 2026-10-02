/**
 * Evolución mensual de un indicador frente a su meta: una sola serie (sin
 * leyenda; el título la nombra), línea de 2 px con marcadores anillados, la
 * meta como referencia rotulada y un tooltip por mes. Debajo, los mismos
 * datos en una tabla para lectores de pantalla.
 */

import { useState } from 'react';

import type { DefinicionIndicador, PuntoSerie } from '@/domain/indicadores';
import { cv } from '@/theme/css';

import { formatearMeta, formatearValor } from './formato';

const ANCHO = 520;
const ALTO = 210;
const MARGEN = { arriba: 22, derecha: 30, abajo: 28, izquierda: 44 };

const MES = new Intl.DateTimeFormat('es-DO', { month: 'short', year: '2-digit', timeZone: 'UTC' });

/** Tope del eje: 100 para porcentajes; si no, un número redondo sobre el máximo. */
function topeEje(maximo: number, esPorcentaje: boolean): number {
  if (esPorcentaje) return 100;
  if (maximo <= 0) return 1;
  const magnitud = 10 ** Math.floor(Math.log10(maximo));
  const paso = [1, 2, 2.5, 5, 10].find((f) => f * magnitud >= maximo / 4) ?? 10;
  return Math.ceil((maximo * 1.1) / (paso * magnitud)) * paso * magnitud;
}

export function SerieIndicador({
  serie,
  meta,
  definicion,
}: {
  serie: readonly PuntoSerie[];
  meta: number;
  definicion: DefinicionIndicador;
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const esPorcentaje = definicion.unidad === '%';
  const valores = serie.flatMap((p) => (p.valor === null ? [] : [p.valor]));
  const tope = topeEje(Math.max(meta, ...valores), esPorcentaje);

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const x = (i: number) =>
    MARGEN.izquierda + (serie.length > 1 ? (i / (serie.length - 1)) * anchoUtil : anchoUtil / 2);
  const y = (v: number) => MARGEN.arriba + altoUtil - (v / tope) * altoUtil;
  const divisiones = [0, 0.25, 0.5, 0.75, 1].map((f) => f * tope);

  // La línea se corta en los meses sin datos en lugar de inventar un valor.
  const tramos: string[] = [];
  let tramo = '';
  serie.forEach((punto, i) => {
    if (punto.valor === null) {
      if (tramo) tramos.push(tramo);
      tramo = '';
      return;
    }
    tramo += `${tramo ? 'L' : 'M'}${x(i)},${y(punto.valor)}`;
  });
  if (tramo) tramos.push(tramo);

  const colorSerie = cv('apoyo');
  const puntoActivo = activo === null ? null : serie[activo];

  return (
    <figure className="m-0">
      <div className="relative">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Evolución mensual de ${definicion.nombre}. Meta ${formatearMeta(meta, definicion)}.`}
          onMouseLeave={() => setActivo(null)}
        >
          {divisiones.map((valor) => (
            <g key={valor}>
              <line
                x1={MARGEN.izquierda}
                x2={ANCHO - MARGEN.derecha}
                y1={y(valor)}
                y2={y(valor)}
                stroke={cv('line')}
                strokeWidth={1}
              />
              <text
                x={MARGEN.izquierda - 8}
                y={y(valor)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill={cv('ink.3')}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {Math.round(valor * 10) / 10}
              </text>
            </g>
          ))}

          {/* Meta: referencia rotulada, en tinta tenue y no en un color de serie. */}
          <line
            x1={MARGEN.izquierda}
            x2={ANCHO - MARGEN.derecha}
            y1={y(meta)}
            y2={y(meta)}
            stroke={cv('ink.3')}
            strokeWidth={1.5}
          />
          <text
            x={ANCHO - MARGEN.derecha}
            y={y(meta) - 6}
            textAnchor="end"
            fontSize={11}
            fontWeight={600}
            fill={cv('ink.2')}
          >
            Meta {formatearMeta(meta, definicion)}
          </text>

          {tramos.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke={colorSerie}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {activo !== null ? (
            <line
              x1={x(activo)}
              x2={x(activo)}
              y1={MARGEN.arriba}
              y2={MARGEN.arriba + altoUtil}
              stroke={cv('line.2')}
              strokeWidth={1}
            />
          ) : null}

          {serie.map((punto, i) =>
            punto.valor === null ? null : (
              <circle
                key={punto.mes}
                cx={x(i)}
                cy={y(punto.valor)}
                r={activo === i ? 5.5 : 4}
                fill={colorSerie}
                stroke={cv('surface')}
                strokeWidth={2}
              />
            ),
          )}

          {serie.map((punto, i) => (
            <text
              key={`eje-${punto.mes}`}
              x={x(i)}
              y={ALTO - 8}
              textAnchor="middle"
              fontSize={11}
              fill={cv('ink.3')}
            >
              {MES.format(new Date(punto.mes))}
            </text>
          ))}

          {/* Zonas de captura más anchas que la marca, una por mes. */}
          {serie.map((punto, i) => (
            <rect
              key={`zona-${punto.mes}`}
              x={x(i) - anchoUtil / serie.length / 2}
              y={MARGEN.arriba}
              width={anchoUtil / serie.length}
              height={altoUtil}
              fill="transparent"
              onMouseEnter={() => setActivo(i)}
            />
          ))}
        </svg>

        {puntoActivo && activo !== null ? (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded border border-line bg-surface px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: `${(x(activo) / ANCHO) * 100}%` }}
          >
            <span className="block font-semibold text-ink">
              {MES.format(new Date(puntoActivo.mes))}
            </span>
            <span className="block tabular-nums text-ink-2">
              {formatearValor(puntoActivo.valor, definicion.unidad)}
            </span>
          </div>
        ) : null}
      </div>

      <figcaption className="sr-only">
        <table>
          <caption>Valores mensuales de {definicion.nombre}</caption>
          <tbody>
            {serie.map((punto) => (
              <tr key={punto.mes}>
                <th scope="row">{MES.format(new Date(punto.mes))}</th>
                <td>{formatearValor(punto.valor, definicion.unidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
