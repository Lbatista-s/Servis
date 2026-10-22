/**
 * Tarjeta de métrica: etiqueta, cifra y, opcionalmente, una aclaración.
 *
 * La cifra va siempre en el color del texto; el `tono` sólo marca la etiqueta
 * con un pequeño cuadro de color, para que el estado se distinga sin teñir
 * el panel entero.
 */

import { cn } from '@/lib/utils';

const MARCA_TONO = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

export interface StatCardProps {
  etiqueta: string;
  valor: React.ReactNode;
  /** Texto secundario bajo el valor (variación, aclaración…). */
  detalle?: React.ReactNode;
  /** Pinta el detalle en rojo, para variaciones desfavorables. */
  detalleNegativo?: boolean;
  tono?: keyof typeof MARCA_TONO;
  className?: string;
}

export function StatCard({
  etiqueta,
  valor,
  detalle,
  detalleNegativo,
  tono,
  className,
}: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-line bg-surface px-5 py-4', className)}>
      <p className="flex items-center gap-2 text-sm font-medium text-ink-3">
        {tono ? (
          <span
            aria-hidden="true"
            className={cn('h-2 w-2 shrink-0 rounded-xs', MARCA_TONO[tono])}
          />
        ) : null}
        {etiqueta}
      </p>
      <p className="mt-1.5 font-display text-[28px] font-bold leading-tight tabular-nums text-ink">
        {valor}
      </p>
      {detalle ? (
        <p className={cn('mt-1 text-sm', detalleNegativo ? 'text-danger' : 'text-ink-3')}>
          {detalle}
        </p>
      ) : null}
    </div>
  );
}
