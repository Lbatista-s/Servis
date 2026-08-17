/** Avisos en línea, estados vacíos, separador y barra de progreso. */

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Icono, type NombreIcono } from './Icons';

// ─────────────────────────────────────────────────────────────────────────────
// Aviso en línea
// ─────────────────────────────────────────────────────────────────────────────

export type TonoNotificacion = 'exito' | 'aviso' | 'info' | 'error';

const ESTILO_NOTIFICACION: Record<
  TonoNotificacion,
  { contenedor: string; icono: string; nombreIcono: NombreIcono }
> = {
  exito: {
    contenedor: 'bg-success-light text-[#14532D]',
    icono: 'text-success',
    nombreIcono: 'verificar',
  },
  aviso: {
    contenedor: 'bg-warning-light text-[#78350F]',
    icono: 'text-warning',
    nombreIcono: 'campana',
  },
  info: { contenedor: 'bg-info-light text-[#1E3A8A]', icono: 'text-info', nombreIcono: 'campana' },
  error: {
    contenedor: 'bg-danger-light text-[#7F1D1D]',
    icono: 'text-danger',
    nombreIcono: 'cerrar',
  },
};

export function InlineNotification({
  tono = 'info',
  children,
  className,
}: {
  tono?: TonoNotificacion;
  children: ReactNode;
  className?: string;
}) {
  const estilo = ESTILO_NOTIFICACION[tono];
  return (
    <div
      // Los errores se anuncian de inmediato; el resto, cuando el lector esté libre.
      role={tono === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-md px-4 py-3.5 text-base',
        estilo.contenedor,
        className,
      )}
    >
      <Icono nombre={estilo.nombreIcono} className={cn('mt-px h-4 w-4', estilo.icono)} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado vacío
// ─────────────────────────────────────────────────────────────────────────────

export function EmptyState({
  icono = '📭',
  titulo,
  descripcion,
  children,
  className,
}: {
  icono?: string;
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-6 py-14 text-center', className)}>
      <div className="text-4xl" aria-hidden="true">
        {icono}
      </div>
      <p className="text-md font-semibold text-ink">{titulo}</p>
      {descripcion ? <p className="max-w-md text-base text-ink-3">{descripcion}</p> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Separador y progreso
// ─────────────────────────────────────────────────────────────────────────────

export const Separator = forwardRef<
  ElementRef<typeof SeparatorPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(function Separator({ className, orientation = 'horizontal', decorative = true, ...props }, ref) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      className={cn(
        'shrink-0 bg-line',
        orientation === 'horizontal' ? 'my-5 h-px w-full' : 'mx-2 h-full w-px',
        className,
      )}
      {...props}
    />
  );
});

export function Progress({
  valor,
  etiqueta,
  className,
}: {
  /** Porcentaje entre 0 y 100. */
  valor: number;
  etiqueta?: string;
  className?: string;
}) {
  const acotado = Math.max(0, Math.min(100, valor));
  return (
    <ProgressPrimitive.Root
      value={acotado}
      aria-label={etiqueta}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-canvas-3', className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-primary transition-transform duration-500"
        style={{ transform: `translateX(-${100 - acotado}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

/** Indicador de carga discreto, en español y accesible. */
export function Loading({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 py-12 text-base text-ink-3"
    >
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-line-2 border-t-primary"
      />
      {mensaje}
    </div>
  );
}
