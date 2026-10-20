/** Zona de carga (`Upload.Dragger` de Ant Design) y ficha de archivo adjunto. */

import { Upload } from 'antd';
import type { ReactNode } from 'react';

import type { Adjunto } from '@/domain/types';
import { formatearFecha, formatearTamano } from '@/lib/format';
import { cn } from '@/lib/utils';

import { Icono } from './Icons';

export function UploadZone({
  onArchivos,
  className,
  titulo = 'Arrastra archivos aquí o haz clic para seleccionar',
  ayuda = 'PDF, JPG, PNG · Máximo 5 MB por archivo',
  disabled,
}: {
  onArchivos?: (archivos: File[]) => void;
  className?: string;
  titulo?: string;
  ayuda?: string;
  disabled?: boolean;
}) {
  return (
    <Upload.Dragger
      className={className}
      multiple
      disabled={disabled}
      showUploadList={false}
      // Los archivos no se suben a ningún servidor: se entregan a la pantalla.
      beforeUpload={(archivo, lote) => {
        // Se notifica una sola vez por selección, con el lote completo.
        if (archivo === lote[lote.length - 1]) onArchivos?.(lote);
        return false;
      }}
    >
      <Icono nombre="subir" className="mx-auto mb-3 h-8 w-8 text-primary" />
      <span className="block text-md font-semibold text-ink">{titulo}</span>
      <span className="mt-1 block text-sm text-ink-3">{ayuda}</span>
    </Upload.Dragger>
  );
}

export function FileChip({
  adjunto,
  children,
  className,
}: {
  adjunto: Adjunto;
  /** Acciones alineadas a la derecha (ver, descargar, eliminar…). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded border border-line bg-surface px-3.5 py-2.5',
        className,
      )}
    >
      <span className="text-lg" aria-hidden="true">
        📎
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-ink">{adjunto.nombre}</p>
        <p className="text-xs text-ink-3">
          {formatearTamano(adjunto.tamano)} · Subido el {formatearFecha(adjunto.subidoEn)}
        </p>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-1.5">{children}</div> : null}
    </div>
  );
}
