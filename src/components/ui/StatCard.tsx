/** Tarjeta de métrica usada en los paneles y en reportes, con `Statistic` de Ant Design. */

import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { cv } from '@/theme/css';

import { Icono, type NombreIcono } from './Icons';

/** Color del valor principal; sigue al tema y supera 4,5:1 sobre la tarjeta en ambos. */
const COLOR_VALOR = {
  ink: cv('ink'),
  info: cv('info'),
  success: cv('success'),
  warning: cv('warning'),
  danger: cv('danger'),
} as const;

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
  tono?: keyof typeof COLOR_VALOR;
  className?: string;
}

export function StatCard({
  etiqueta,
  valor,
  detalle,
  detalleNegativo,
  icono,
  fondoIcono = 'bg-canvas-2',
  tono = 'ink',
  className,
}: StatCardProps) {
  return (
    <Card variant="outlined" className={className} styles={{ body: { padding: 20 } }}>
      {icono ? (
        <span
          className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded', fondoIcono)}
          aria-hidden="true"
        >
          <Icono nombre={icono} className="h-[18px] w-[18px] text-ink-2" />
        </span>
      ) : null}
      <Statistic
        title={
          <span className="text-sm font-semibold uppercase tracking-wide text-ink-3">
            {etiqueta}
          </span>
        }
        valueRender={() => valor}
        styles={{
          content: {
            color: COLOR_VALOR[tono],
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.1,
            fontFamily: 'Montserrat, "Open Sans", sans-serif',
          },
        }}
      />
      {detalle ? (
        <p className={cn('mt-2 text-sm', detalleNegativo ? 'text-danger' : 'text-success')}>
          {detalle}
        </p>
      ) : null}
    </Card>
  );
}
