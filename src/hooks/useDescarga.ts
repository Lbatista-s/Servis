/**
 * Descarga de archivos desde los repositorios (adjuntos y documentos), con
 * estado de carga por archivo y aviso si falla.
 */

import { useCallback, useState } from 'react';

import { useToast } from '@/components/ui';
import { abrirBlob, descargarBlob } from '@/lib/descargas';

import { mensajeDeError } from './useAsync';

interface Descarga {
  /** Identificador del elemento, para mostrar su estado de carga. */
  clave: string;
  nombre: string;
  obtener: () => Promise<Blob>;
  /** `abrir` lo muestra en una pestaña nueva en lugar de guardarlo. */
  modo?: 'descargar' | 'abrir';
}

export function useDescarga() {
  const avisos = useToast();
  const [pendiente, setPendiente] = useState<string | null>(null);

  const descargar = useCallback(
    async ({ clave, nombre, obtener, modo = 'descargar' }: Descarga) => {
      setPendiente(clave);
      try {
        const blob = await obtener();
        if (modo === 'abrir') abrirBlob(blob);
        else descargarBlob(blob, nombre);
      } catch (fallo) {
        avisos.error(`No se pudo obtener «${nombre}»`, mensajeDeError(fallo));
      } finally {
        setPendiente(null);
      }
    },
    [avisos],
  );

  return { descargar, pendiente };
}
