/**
 * Mapa estratégico (Kaplan y Norton): la misión arriba y, debajo, una banda
 * por perspectiva con sus objetivos. Se lee de abajo arriba: el aprendizaje
 * habilita los procesos, que sostienen el uso de los recursos y el valor para
 * el estudiante, que cumplen la misión.
 */

import { Fragment } from 'react';

import {
  definicionDe,
  INDICADORES,
  MISION,
  PERSPECTIVAS,
  type IdIndicador,
  type ResultadoIndicador,
} from '@/domain/indicadores';
import { cv } from '@/theme/css';

import { COLOR_ESTADO_INDICADOR, ETIQUETA_ESTADO_INDICADOR, formatearValor } from './formato';

export function MapaEstrategico({
  resultados,
  onElegir,
}: {
  resultados: readonly ResultadoIndicador[];
  onElegir: (id: IdIndicador) => void;
}) {
  const porId = new Map(resultados.map((r) => [r.id, r]));

  return (
    <div className="flex flex-col gap-2" role="list" aria-label="Mapa estratégico">
      <div className="rounded-md bg-chrome px-4 py-3 text-center" role="listitem">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Misión</p>
        <p className="mt-0.5 text-base font-semibold text-white">{MISION}</p>
      </div>

      {PERSPECTIVAS.map((perspectiva) => (
        <Fragment key={perspectiva.id}>
          <Flecha />
          <section
            role="listitem"
            aria-label={perspectiva.nombre}
            className="grid gap-3 rounded-md border border-line bg-surface-2 p-3 md:grid-cols-[190px_1fr] md:items-center"
          >
            <div>
              <h3 className="text-base font-semibold text-ink">{perspectiva.nombre}</h3>
              <p className="text-xs text-ink-3">{perspectiva.pregunta}</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {INDICADORES.filter((i) => i.perspectiva === perspectiva.id).map((indicador) => {
                const resultado = porId.get(indicador.id);
                return (
                  <li key={indicador.id}>
                    <FichaObjetivo
                      id={indicador.id}
                      resultado={resultado}
                      onElegir={() => onElegir(indicador.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        </Fragment>
      ))}

      <Leyenda />
    </div>
  );
}

function FichaObjetivo({
  id,
  resultado,
  onElegir,
}: {
  id: IdIndicador;
  resultado: ResultadoIndicador | undefined;
  onElegir: () => void;
}) {
  const definicion = definicionDe(id);
  const estado = resultado?.estado ?? 'sin_datos';
  const impulsa = definicion.contribuyeA.map((destino) => definicionDe(destino).objetivo);

  return (
    <button
      type="button"
      onClick={onElegir}
      className="flex h-full w-full items-start gap-2.5 rounded border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-line-2 hover:bg-canvas"
      style={{ borderLeft: `4px solid ${cv(COLOR_ESTADO_INDICADOR[estado])}` }}
      aria-label={`${definicion.objetivo}: ${formatearValor(resultado?.medicion.valor ?? null, definicion.unidad)}, ${ETIQUETA_ESTADO_INDICADOR[estado]}. Ver detalle.`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{definicion.objetivo}</span>
        <span className="block text-xs text-ink-3">{definicion.nombre}</span>
        {impulsa.length > 0 ? (
          <span className="mt-1 block text-xs text-ink-3">Impulsa: {impulsa.join(', ')}</span>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-md font-bold text-ink">
          {formatearValor(resultado?.medicion.valor ?? null, definicion.unidad)}
        </span>
        <span className="block text-xs text-ink-3">{ETIQUETA_ESTADO_INDICADOR[estado]}</span>
      </span>
    </button>
  );
}

/** Flecha de causa-efecto entre bandas: la de abajo impulsa a la de arriba. */
function Flecha() {
  return (
    <div className="flex justify-center text-ink-4" aria-hidden="true">
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
        <path d="M8 0 16 12H0z" />
      </svg>
    </div>
  );
}

function Leyenda() {
  return (
    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3" aria-label="Leyenda">
      {(['cumple', 'alerta', 'incumple', 'sin_datos'] as const).map((estado) => (
        <li key={estado} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: cv(COLOR_ESTADO_INDICADOR[estado]) }}
          />
          {ETIQUETA_ESTADO_INDICADOR[estado]}
        </li>
      ))}
      <li>▲ La perspectiva de abajo impulsa a la de arriba</li>
    </ul>
  );
}
