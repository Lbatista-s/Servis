/** Tarjetas y encabezados de sección. */

import { Card as AntCard, type CardProps as AntCardProps } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { COLORES } from '@/theme/tokens';

/** Fondos admitidos. Se aplican en línea porque el de Ant Design tiene prioridad. */
const FONDO = {
  superficie: undefined,
  suave: { background: COLORES.surface[2] },
  institucional: {
    background: `linear-gradient(135deg, ${COLORES.shell.DEFAULT}, ${COLORES.shell.gradient})`,
    borderColor: 'transparent',
  },
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
      {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
    </div>
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
        'rounded-r border-l-[3px] border-primary bg-primary-light px-4 py-3 text-base text-ink-2',
        '[&_strong]:text-primary-dark',
        className,
      )}
    >
      {children}
    </div>
  );
}
