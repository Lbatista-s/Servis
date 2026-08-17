/** Línea de tiempo del historial de una solicitud. */

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type EstadoPunto = 'completado' | 'activo' | 'pendiente';

const PUNTO: Record<EstadoPunto, string> = {
  completado: 'border-success bg-success',
  activo: 'border-primary bg-primary',
  pendiente: 'border-line-2 bg-surface',
};

export interface TimelineItemProps {
  estado: EstadoPunto;
  titulo: ReactNode;
  cuando?: ReactNode;
  descripcion?: ReactNode;
  /** Comentario del autor, mostrado en cursiva dentro de un recuadro. */
  comentario?: string | null;
  /** Último elemento: no dibuja la línea vertical de continuación. */
  ultimo?: boolean;
}

export function TimelineItem({
  estado,
  titulo,
  cuando,
  descripcion,
  comentario,
  ultimo,
}: TimelineItemProps) {
  return (
    <li className={cn('relative flex gap-3', ultimo ? 'pb-0' : 'pb-5')}>
      {/* Línea vertical que conecta con el siguiente hito. */}
      {ultimo ? null : (
        <span aria-hidden="true" className="absolute bottom-0 left-[6px] top-4 w-[1.5px] bg-line" />
      )}
      <span
        aria-hidden="true"
        className={cn(
          'relative z-10 mt-[3px] h-[13px] w-[13px] shrink-0 rounded-full border-2',
          PUNTO[estado],
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-base font-semibold', estado === 'pendiente' ? 'text-ink-3' : 'text-ink')}>
          {titulo}
        </p>
        {cuando ? (
          <p className={cn('mt-px text-xs', estado === 'pendiente' ? 'text-ink-4' : 'text-ink-3')}>
            {cuando}
          </p>
        ) : null}
        {descripcion ? <p className="mt-1 text-sm text-ink-2">{descripcion}</p> : null}
        {comentario ? (
          <p className="mt-1.5 rounded border border-line bg-surface-2 px-3 py-2.5 text-sm italic text-ink-2">
            «{comentario}»
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function Timeline({ children, className }: { children: ReactNode; className?: string }) {
  return <ol className={cn('flex list-none flex-col', className)}>{children}</ol>;
}
