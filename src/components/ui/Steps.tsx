/** Indicador de pasos del formulario de nueva solicitud. */

import { cn } from '@/lib/utils';

import { Icono } from './Icons';

export interface StepsProps {
  pasos: readonly string[];
  /** Índice del paso activo, empezando en 0. */
  actual: number;
  className?: string;
}

export function Steps({ pasos, actual, className }: StepsProps) {
  return (
    <ol
      className={cn('flex flex-wrap items-center gap-y-3', className)}
      aria-label={`Paso ${actual + 1} de ${pasos.length}`}
    >
      {pasos.map((paso, indice) => {
        const completado = indice < actual;
        const activo = indice === actual;

        return (
          <li key={paso} className="flex flex-1 items-center gap-2">
            <div className="flex shrink-0 items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  completado && 'bg-primary text-white',
                  activo && 'bg-primary text-white shadow-ring-primary',
                  !completado && !activo && 'bg-canvas-3 text-ink-3',
                )}
              >
                {completado ? <Icono nombre="verificar" className="h-3.5 w-3.5" /> : indice + 1}
              </span>
              <span
                className={cn(
                  'hidden text-base font-semibold sm:inline',
                  completado || activo ? 'text-ink' : 'text-ink-3',
                )}
                aria-current={activo ? 'step' : undefined}
              >
                {paso}
              </span>
            </div>
            {indice < pasos.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn('mx-2.5 h-[1.5px] flex-1', completado ? 'bg-primary' : 'bg-line')}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
