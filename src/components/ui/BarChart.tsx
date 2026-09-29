/**
 * Gráfico de barras horizontales de la pantalla de reportes, con `Progress`
 * de Ant Design para cada barra.
 *
 * Se apoya en una lista de definición para que el contenido siga siendo
 * comprensible con un lector de pantalla, sin depender de la representación
 * visual de las barras.
 */

import { Progress } from 'antd';

import { cn } from '@/lib/utils';
import { cv } from '@/theme/css';

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
      {datos.map((dato) => (
        <div key={dato.etiqueta} className="flex items-center gap-3">
          <dt className="w-28 shrink-0 truncate text-right text-sm text-ink-2 sm:w-44">
            {dato.etiqueta}
          </dt>
          <div className="flex-1" aria-hidden="true">
            <Progress
              percent={Math.round((dato.valor / maximo) * 100)}
              showInfo={false}
              size={['100%', 14]}
              strokeColor={cv('primary')}
              railColor={cv('canvas.3')}
            />
          </div>
          <dd className="w-8 shrink-0 text-right text-sm font-semibold text-ink-2">
            {dato.valor}
            {sufijo ? <span className="sr-only"> {sufijo}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
