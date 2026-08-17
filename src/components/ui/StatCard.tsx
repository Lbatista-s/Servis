/** Tarjeta de métrica usada en los paneles y en reportes. */

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Icono, type NombreIcono } from './Icons';

export interface StatCardProps {
  etiqueta: string;
  valor: ReactNode;
  /** Texto secundario bajo el valor (variación, aclaración…). */
  detalle?: ReactNode;
  /** Pinta el detalle en rojo, para variaciones desfavorables. */
  detalleNegativo?: boolean;
  icono?: NombreIcono;
  /** Clase de fondo del recuadro del icono (token de Tailwind). */
  fondoIcono?: string;
  /** Clase de color del valor principal. */
  colorValor?: string;
  className?: string;
}

export function StatCard({
  etiqueta,
  valor,
  detalle,
  detalleNegativo,
  icono,
  fondoIcono = 'bg-canvas-2',
  colorValor = 'text-ink',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn('flex flex-col gap-2 rounded-lg border border-line bg-surface p-5', className)}
    >
      {icono ? (
        <span
          className={cn('mb-1 flex h-9 w-9 items-center justify-center rounded', fondoIcono)}
          aria-hidden="true"
        >
          <Icono nombre={icono} className="h-[18px] w-[18px] text-ink-2" />
        </span>
      ) : null}
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-3">{etiqueta}</p>
      <p className={cn('text-6xl font-bold leading-none', colorValor)}>{valor}</p>
      {detalle ? (
        <p className={cn('text-sm', detalleNegativo ? 'text-danger' : 'text-success')}>{detalle}</p>
      ) : null}
    </div>
  );
}
