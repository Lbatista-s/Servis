/** Distintivos genéricos, de estado de solicitud y de rol, sobre `Tag` de Ant Design. */

import { Tag } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

import { ETIQUETA_ESTADO, ETIQUETA_ROL, type EstadoSolicitud, type Rol } from '@/domain/types';
import { COLORES } from '@/theme/tokens';

export type TonoBadge = 'gray' | 'blue' | 'amber' | 'orange' | 'green' | 'red' | 'emerald' | 'sky';

/** Fondo, texto y punto de cada tono. Todos los pares superan 4,5:1. */
const TONO: Record<TonoBadge, { fondo: string; texto: string }> = {
  gray: { fondo: COLORES.neutral.light, texto: COLORES.neutral.DEFAULT },
  blue: { fondo: COLORES.info.light, texto: COLORES.info.DEFAULT },
  amber: { fondo: COLORES.warning.light, texto: COLORES.warning.DEFAULT },
  orange: { fondo: COLORES.warning.soft, texto: COLORES.warning.DEFAULT },
  green: { fondo: COLORES.success.light, texto: COLORES.success.DEFAULT },
  red: { fondo: COLORES.danger.light, texto: COLORES.danger.DEFAULT },
  emerald: { fondo: COLORES.emerald.light, texto: COLORES.emerald.DEFAULT },
  sky: { fondo: COLORES.sky.light, texto: COLORES.sky.DEFAULT },
};

/**
 * Forma de píldora del prototipo. Va en línea porque `Tag` fija margen,
 * relleno y radio con más prioridad que las utilidades de Tailwind.
 */
const FORMA: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  margin: 0,
  paddingInline: 10,
  borderRadius: 9999,
  fontSize: 11,
  lineHeight: '18px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

function Punto({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-[5px] w-[5px] shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

export interface BadgeProps {
  children: ReactNode;
  tono?: TonoBadge;
  /** Oculta el punto de color que lleva el distintivo por defecto. */
  sinPunto?: boolean;
  className?: string;
}

export function Badge({ tono = 'gray', sinPunto, className, children }: BadgeProps) {
  const { fondo, texto } = TONO[tono];
  return (
    <Tag
      variant="filled"
      className={className}
      style={{ ...FORMA, background: fondo, color: texto }}
    >
      {sinPunto ? null : <Punto color={texto} />}
      {children}
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado de solicitud
// ─────────────────────────────────────────────────────────────────────────────

const TONO_ESTADO: Record<EstadoSolicitud, TonoBadge> = {
  borrador: 'gray',
  enviada: 'blue',
  en_revision: 'amber',
  devuelta: 'orange',
  corregida: 'sky',
  aprobada: 'green',
  rechazada: 'red',
  completada: 'emerald',
  cancelada: 'gray',
};

/** Detalles propios de algunos estados, calcados del prototipo. */
const EXTRA_ESTADO: Partial<Record<EstadoSolicitud, CSSProperties>> = {
  borrador: { border: `1px dashed ${COLORES.neutral.dashed}` },
  cancelada: { textDecoration: 'line-through' },
};

export function StatusBadge({
  estado,
  className,
}: {
  estado: EstadoSolicitud;
  className?: string;
}) {
  const { fondo, texto } = TONO[TONO_ESTADO[estado]];
  return (
    <Tag
      variant="filled"
      className={className}
      style={{ ...FORMA, background: fondo, color: texto, ...EXTRA_ESTADO[estado] }}
      data-estado={estado}
    >
      <Punto color={texto} />
      {ETIQUETA_ESTADO[estado]}
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rol
// ─────────────────────────────────────────────────────────────────────────────

const TONO_ROL: Record<Rol, TonoBadge> = {
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
