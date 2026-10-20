/** Ficha completa de un indicador: definición, fórmula, relaciones, iniciativa y evolución. */

import { Drawer } from 'antd';

import { Sobretitulo } from '@/components/ui';
import {
  definicionDe,
  INDICADORES,
  PERSPECTIVAS,
  serieMensual,
  type DatosCuadro,
  type IdIndicador,
  type ResultadoIndicador,
} from '@/domain/indicadores';

import { EstadoIndicadorBadge } from './EstadoIndicadorBadge';
import { describirTendencia, formatearMeta, formatearValor } from './formato';
import { SerieIndicador } from './SerieIndicador';

export function DetalleIndicador({
  resultado,
  datos,
  ahora,
  onCerrar,
}: {
  resultado: ResultadoIndicador | null;
  datos: DatosCuadro | null;
  ahora: Date;
  onCerrar: () => void;
}) {
  const definicion = resultado ? definicionDe(resultado.id) : null;

  return (
    <Drawer
      open={resultado !== null}
      onClose={onCerrar}
      size={560}
      title={definicion?.objetivo}
      destroyOnHidden
    >
      {resultado && definicion ? (
        <Contenido resultado={resultado} datos={datos} ahora={ahora} />
      ) : null}
    </Drawer>
  );
}

function Contenido({
  resultado,
  datos,
  ahora,
}: {
  resultado: ResultadoIndicador;
  datos: DatosCuadro | null;
  ahora: Date;
}) {
  const definicion = definicionDe(resultado.id);
  const perspectiva = PERSPECTIVAS.find((p) => p.id === definicion.perspectiva);
  const impulsadoPor = INDICADORES.filter((i) => i.contribuyeA.includes(resultado.id));
  const nombres = (ids: readonly IdIndicador[]) => ids.map((id) => definicionDe(id).objetivo);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-3">
          {perspectiva?.nombre} · Indicador{' '}
          {definicion.tipo === 'resultado' ? 'de resultado' : 'inductor'}
        </p>
        <p className="mt-1 text-md font-semibold text-ink">{definicion.nombre}</p>
        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <p className="text-5xl font-bold text-ink">
              {formatearValor(resultado.medicion.valor, definicion.unidad)}
            </p>
            <p className="text-sm text-ink-3">
              Meta {formatearMeta(resultado.meta, definicion)} · n = {resultado.medicion.muestra}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 pb-1">
            <EstadoIndicadorBadge estado={resultado.estado} />
            <span className="text-sm text-ink-2">
              {definicion.instantaneo
                ? 'Situación actual'
                : `${describirTendencia(resultado.tendencia, definicion.unidad)} frente al período anterior`}
            </span>
          </div>
        </div>
      </div>

      <section>
        <Sobretitulo>Qué mide</Sobretitulo>
        <p className="text-base text-ink-2">{definicion.descripcion}</p>
        <p className="mt-3 rounded bg-surface-2 px-3 py-2 font-mono text-sm text-ink-2">
          {definicion.formula}
        </p>
      </section>

      <section>
        <Sobretitulo>Evolución de los últimos 6 meses</Sobretitulo>
        {definicion.instantaneo || !datos ? (
          <p className="text-base text-ink-3">
            Se mide sobre la situación actual del catálogo, así que no tiene serie histórica.
          </p>
        ) : (
          <SerieIndicador
            serie={serieMensual(resultado.id, datos, ahora)}
            meta={resultado.meta}
            definicion={definicion}
          />
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <Sobretitulo>Lo impulsan</Sobretitulo>
          <p className="text-base text-ink-2">
            {impulsadoPor.length > 0
              ? nombres(impulsadoPor.map((i) => i.id)).join(', ')
              : 'Es un objetivo de base del mapa.'}
          </p>
        </div>
        <div>
          <Sobretitulo>Impulsa a</Sobretitulo>
          <p className="text-base text-ink-2">
            {definicion.contribuyeA.length > 0
              ? nombres(definicion.contribuyeA).join(', ')
              : 'Contribuye directamente a la misión.'}
          </p>
        </div>
      </section>

      <section>
        <Sobretitulo>Iniciativa estratégica</Sobretitulo>
        <p className="text-base text-ink-2">{definicion.iniciativa}</p>
      </section>
    </div>
  );
}
