/** Tarjetas y encabezados de sección. */

import { Card as AntCard, type CardProps as AntCardProps } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { cv } from '@/theme/css';

/** Fondos admitidos. Se aplican en línea porque el de Ant Design tiene prioridad; siguen al tema. */
const FONDO = {
  superficie: undefined,
  suave: { background: cv('surface.2') },
} satisfies Record<string, CSSProperties | undefined>;

export interface CardProps extends Omit<AntCardProps, 'variant'> {
  /** Variante compacta: relleno menor. */
  compacta?: boolean;
  /** Elimina el relleno interior; útil para tarjetas que envuelven una tabla o lista. */
  sinRelleno?: boolean;
  fondo?: keyof typeof FONDO;
}

export function Card({
  compacta,
  sinRelleno,
  fondo = 'superficie',
  style,
  styles,
  ...props
}: CardProps) {
  const relleno = sinRelleno ? 0 : compacta ? 16 : 20;
  return (
    <AntCard
      variant="outlined"
      style={{ ...FONDO[fondo], ...style }}
      styles={{ ...styles, body: { padding: relleno, ...(sinRelleno && { overflow: 'hidden' }) } }}
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
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}

/** Rótulo pequeño en mayúsculas que encabeza un bloque dentro de una tarjeta. */
export function Sobretitulo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3', className)}>
      {children}
    </p>
  );
}

/**
 * Nota con el filete rojo institucional a la izquierda. Se mantiene propia:
 * `Alert` de Ant Design no admite el filete de la línea gráfica.
 */
export function NoteBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // Nota neutra: un filete a la izquierda basta para separarla del resto.
        'border-l-2 border-line-2 bg-surface-2 px-4 py-3 text-base text-ink-2',
        '[&_strong]:text-ink',
        className,
      )}
    >
      {children}
    </div>
  );
}
