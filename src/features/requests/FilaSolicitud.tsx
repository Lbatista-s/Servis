/** Fila de una solicitud del estudiante, enlazada a su detalle. */

import { Link } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import { Icono, StatusBadge } from '@/components/ui';
import type { Solicitud } from '@/domain/types';
import { formatearFecha } from '@/lib/format';

export function FilaSolicitud({
  solicitud,
  icono,
  nombreServicio,
  accion,
}: {
  solicitud: Solicitud;
  icono: string;
  nombreServicio: string;
  /** Qué debe hacer el estudiante, si la solicitud espera algo de él. */
  accion?: string;
}) {
  return (
    <Link
      to={RUTAS.detalleSolicitud(solicitud.id)}
      className="flex items-center gap-3.5 border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-canvas-2 text-xl"
      >
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-md font-semibold text-ink">{nombreServicio}</span>
        <span className="block text-sm text-ink-3">
          {solicitud.id} · {formatearFecha(solicitud.creadaEn)}
          {accion ? <span className="font-semibold text-primary-dark"> · {accion}</span> : null}
        </span>
      </span>
      <StatusBadge estado={solicitud.estado} />
      <Icono nombre="chevron" className="h-3.5 w-3.5 text-ink-4" />
    </Link>
  );
}
