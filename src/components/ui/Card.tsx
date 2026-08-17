/** Tarjetas y encabezados de sección. */

import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Variante compacta (`card-sm` en el prototipo): radio y relleno menores. */
  compacta?: boolean;
  /** Elimina el relleno interior; útil para tarjetas que envuelven una tabla. */
  sinRelleno?: boolean;
}

export function Card({ compacta, sinRelleno, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border border-line bg-surface',
        compacta ? 'rounded-md' : 'rounded-lg',
        sinRelleno ? 'overflow-hidden p-0' : compacta ? 'p-4' : 'p-5',
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeader({
  titulo,
  children,
  className,
}: {
  titulo: ReactNode;
  /** Acciones alineadas a la derecha del encabezado. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      <h2 className="text-md font-semibold text-ink">{titulo}</h2>
      {children}
    </div>
  );
}

export function PageHeader({
  titulo,
  subtitulo,
  children,
  className,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="text-4xl font-bold text-ink">{titulo}</h1>
        {subtitulo ? <p className="mt-1 text-md text-ink-3">{subtitulo}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

/** Bloque de nota con el filete rojo institucional a la izquierda. */
export function NoteBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-r border-l-[3px] border-primary bg-primary-light px-4 py-3 text-base text-ink-2',
        '[&_strong]:text-primary',
        className,
      )}
    >
      {children}
    </div>
  );
}
