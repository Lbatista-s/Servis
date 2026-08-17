/** Distintivos: genéricos, de estado de solicitud y de rol. */

import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { ETIQUETA_ESTADO, ETIQUETA_ROL, type EstadoSolicitud, type Rol } from '@/domain/types';
import { cn } from '@/lib/utils';

const variantesBadge = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
  {
    variants: {
      tono: {
        gray: 'bg-neutral-light text-neutral',
        blue: 'bg-info-light text-info',
        amber: 'bg-warning-light text-warning',
        orange: 'bg-warning-soft text-warning',
        green: 'bg-success-light text-success',
        red: 'bg-danger-light text-danger',
        emerald: 'bg-emerald-light text-emerald',
        sky: 'bg-sky-light text-sky',
      },
    },
    defaultVariants: { tono: 'gray' },
  },
);

/** Color del punto que precede al texto, en el mismo tono que el distintivo. */
const PUNTO: Record<NonNullable<VariantProps<typeof variantesBadge>['tono']>, string> = {
  gray: 'bg-neutral',
  blue: 'bg-info',
  amber: 'bg-warning',
  orange: 'bg-warning',
  green: 'bg-success',
  red: 'bg-danger',
  emerald: 'bg-emerald',
  sky: 'bg-sky',
};

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof variantesBadge> {
  children: ReactNode;
  /** Oculta el punto de color que lleva el distintivo por defecto. */
  sinPunto?: boolean;
}

export function Badge({ tono, sinPunto, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(variantesBadge({ tono }), className)} {...props}>
      {sinPunto ? null : (
        <span className={cn('h-[5px] w-[5px] shrink-0 rounded-full', PUNTO[tono ?? 'gray'])} />
      )}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado de solicitud
// ─────────────────────────────────────────────────────────────────────────────

/** Estilos por estado, calcados de la sección «STATUS BADGE MAP» del prototipo. */
const ESTILO_ESTADO: Record<EstadoSolicitud, { contenedor: string; punto: string }> = {
  borrador: {
    contenedor: 'border border-dashed border-neutral-dashed bg-neutral-light text-neutral-ink',
    punto: 'bg-neutral-ink',
  },
  enviada: { contenedor: 'bg-info-light text-info', punto: 'bg-info' },
  en_revision: { contenedor: 'bg-warning-light text-warning', punto: 'bg-warning' },
  devuelta: { contenedor: 'bg-warning-soft text-warning', punto: 'bg-warning' },
  corregida: { contenedor: 'bg-sky-light text-sky', punto: 'bg-sky' },
  aprobada: { contenedor: 'bg-success-light text-success', punto: 'bg-success' },
  rechazada: { contenedor: 'bg-danger-light text-danger', punto: 'bg-danger' },
  completada: { contenedor: 'bg-emerald-light text-emerald', punto: 'bg-emerald' },
  cancelada: { contenedor: 'bg-neutral-light text-neutral line-through', punto: 'bg-neutral' },
};

export function StatusBadge({ estado, className }: { estado: EstadoSolicitud; className?: string }) {
  const estilo = ESTILO_ESTADO[estado];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
        estilo.contenedor,
        className,
      )}
      data-estado={estado}
    >
      <span className={cn('h-[5px] w-[5px] shrink-0 rounded-full', estilo.punto)} />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rol
// ─────────────────────────────────────────────────────────────────────────────

const TONO_ROL: Record<Rol, NonNullable<VariantProps<typeof variantesBadge>['tono']>> = {
  estudiante: 'blue',
  personal_administrativo: 'orange',
  coordinador: 'amber',
  administrador: 'red',
};

export function RoleBadge({ rol, className }: { rol: Rol; className?: string }) {
  return (
    <Badge tono={TONO_ROL[rol]} sinPunto className={className}>
      {ETIQUETA_ROL[rol]}
    </Badge>
  );
}
