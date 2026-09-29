/** Línea de tiempo del historial de una solicitud, sobre `Timeline` de Ant Design. */

import { Timeline as AntTimeline } from 'antd';
import type { ReactNode } from 'react';

import { COLORES } from '@/theme/tokens';

export type EstadoPunto = 'completado' | 'activo' | 'pendiente';

const COLOR_PUNTO: Record<EstadoPunto, string> = {
  completado: COLORES.success.DEFAULT,
  activo: COLORES.primary.DEFAULT,
  // Ant Design dibuja hueco el punto gris: indica un hito que aún no ocurre.
  pendiente: 'gray',
};

export interface HitoTimeline {
  clave: string;
  estado: EstadoPunto;
  titulo: ReactNode;
  cuando?: ReactNode;
  descripcion?: ReactNode;
  /** Comentario del autor, mostrado en cursiva dentro de un recuadro. */
  comentario?: string | null;
}

export function Timeline({
  hitos,
  className,
}: {
  hitos: readonly HitoTimeline[];
  className?: string;
}) {
  return (
    <AntTimeline
      className={className}
      items={hitos.map((hito) => ({
        key: hito.clave,
        color: COLOR_PUNTO[hito.estado],
        content: <ContenidoHito hito={hito} />,
      }))}
    />
  );
}

function ContenidoHito({ hito }: { hito: HitoTimeline }) {
  const pendiente = hito.estado === 'pendiente';
  return (
    <div className="min-w-0">
      <p className={pendiente ? 'text-base font-semibold text-ink-3' : 'text-base font-semibold'}>
        {hito.titulo}
      </p>
      {hito.cuando ? <p className="mt-px text-xs text-ink-3">{hito.cuando}</p> : null}
      {hito.descripcion ? <p className="mt-1 text-sm text-ink-2">{hito.descripcion}</p> : null}
      {hito.comentario ? (
        <p className="mt-1.5 rounded border border-line bg-surface-2 px-3 py-2.5 text-sm italic text-ink-2">
          «{hito.comentario}»
        </p>
      ) : null}
    </div>
  );
}
