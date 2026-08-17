/** Zona de carga y ficha de archivo adjunto. */

import { useRef, type ChangeEvent, type ReactNode } from 'react';

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
  onArchivos?: (archivos: FileList) => void;
  className?: string;
  titulo?: string;
  ayuda?: string;
  disabled?: boolean;
}) {
  const entrada = useRef<HTMLInputElement>(null);

  function manejarCambio(evento: ChangeEvent<HTMLInputElement>) {
    if (evento.target.files && evento.target.files.length > 0) {
      onArchivos?.(evento.target.files);
    }
    // Permite volver a seleccionar el mismo archivo.
    evento.target.value = '';
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => entrada.current?.click()}
        className={cn(
          'w-full rounded-lg border-2 border-dashed border-line-2 bg-surface-2 px-6 py-8 text-center',
          'transition-all hover:border-primary hover:bg-primary-light',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line-2 disabled:hover:bg-surface-2',
          className,
        )}
      >
        <Icono nombre="subir" className="mx-auto mb-3 h-8 w-8 text-primary" />
        <span className="block text-md font-semibold text-ink">{titulo}</span>
        <span className="mt-1 block text-sm text-ink-3">{ayuda}</span>
      </button>
      <input
        ref={entrada}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={manejarCambio}
      />
    </>
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
