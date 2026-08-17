/**
 * Gráfico de barras horizontales de la pantalla de reportes.
 *
 * Se apoya en una lista de definición para que el contenido siga siendo
 * comprensible con un lector de pantalla, sin depender de la representación
 * visual de las barras.
 */

import { cn } from '@/lib/utils';

export interface BarraDato {
  etiqueta: string;
  valor: number;
}

export function BarChart({
  datos,
  className,
  sufijo = '',
}: {
  datos: readonly BarraDato[];
  className?: string;
  /** Texto añadido tras el valor en la lectura accesible (p. ej. «solicitudes»). */
  sufijo?: string;
}) {
  const maximo = Math.max(1, ...datos.map((d) => d.valor));

  return (
    <dl className={cn('flex flex-col gap-3', className)}>
      {datos.map((dato) => {
        const porcentaje = Math.round((dato.valor / maximo) * 100);
        return (
          <div key={dato.etiqueta} className="flex items-center gap-3">
            <dt className="w-28 shrink-0 truncate text-right text-sm text-ink-2 sm:w-44">
              {dato.etiqueta}
            </dt>
            <div className="h-[22px] flex-1 overflow-hidden rounded-full bg-canvas-3">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${porcentaje}%` }}
                aria-hidden="true"
              />
            </div>
            <dd className="w-8 shrink-0 text-right text-sm font-semibold text-ink-2">
              {dato.valor}
              {sufijo ? <span className="sr-only"> {sufijo}</span> : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
