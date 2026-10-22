/** Avisos en línea, estados vacíos, separador, progreso y carga, sobre Ant Design. */

import { Alert, Divider, Empty, Progress as AntProgress, Spin } from 'antd';
import type { ReactNode } from 'react';

import { cv } from '@/theme/css';

import { Button } from './Button';
import { Icono } from './Icons';

// ─────────────────────────────────────────────────────────────────────────────
// Aviso en línea
// ─────────────────────────────────────────────────────────────────────────────

export type TonoNotificacion = 'exito' | 'aviso' | 'info' | 'error';

const TIPO_ALERTA = {
  exito: 'success',
  aviso: 'warning',
  info: 'info',
  error: 'error',
} as const satisfies Record<TonoNotificacion, string>;

export function InlineNotification({
  tono = 'info',
  children,
  className,
}: {
  tono?: TonoNotificacion;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Alert
      type={TIPO_ALERTA[tono]}
      showIcon
      title={children}
      className={className}
      // Los errores se anuncian de inmediato; el resto, cuando el lector esté libre.
      role={tono === 'error' ? 'alert' : 'status'}
    />
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
    <Empty
      className={className}
      style={{ paddingBlock: 40, paddingInline: 24 }}
      image={
        <span className="text-4xl" aria-hidden="true">
          {icono}
        </span>
      }
      styles={{ image: { height: 'auto', marginBottom: 8 } }}
      description={
        <span className="flex flex-col items-center gap-1">
          <span className="text-md font-semibold text-ink">{titulo}</span>
          {descripcion ? (
            <span className="max-w-md text-base text-ink-3">{descripcion}</span>
          ) : null}
        </span>
      }
    >
      {children}
    </Empty>
  );
}

/**
 * Estado de error de una consulta, con la acción de reintentar. Sustituye al
 * contenido que no se pudo cargar; nunca deja la pantalla en blanco.
 */
export function EstadoError({
  titulo = 'No se pudo cargar la información',
  mensaje,
  onReintentar,
  className,
}: {
  titulo?: string;
  mensaje?: string | null;
  onReintentar?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={className}>
      <EmptyState icono="⚠️" titulo={titulo} descripcion={mensaje ?? undefined}>
        {onReintentar ? (
          <Button onClick={onReintentar}>
            <Icono nombre="rotar" />
            Reintentar
          </Button>
        ) : null}
      </EmptyState>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Separador y progreso
// ─────────────────────────────────────────────────────────────────────────────

/** Línea divisoria horizontal. `margen` es la separación vertical en píxeles. */
export function Separator({ margen = 20 }: { margen?: number }) {
  return <Divider style={{ marginBlock: margen }} />;
}

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
  return (
    <AntProgress
      percent={Math.max(0, Math.min(100, valor))}
      showInfo={false}
      size="small"
      strokeColor={cv('primary')}
      railColor={cv('canvas.3')}
      aria-label={etiqueta}
      className={className}
    />
  );
}

/** Indicador de carga discreto, en español y accesible. */
export function Loading({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2.5 py-12 text-base text-ink-3"
    >
      <Spin size="small" />
      {mensaje}
    </div>
  );
}
