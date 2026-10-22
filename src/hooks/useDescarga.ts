/**
 * Descarga de archivos desde los repositorios (adjuntos y documentos), con
 * estado de carga por archivo y aviso si falla. Para verlos sin descargarlos,
 * `useVisorDocumento`.
 */

import { useCallback, useState } from 'react';

import { useToast } from '@/components/ui';
import { descargarBlob } from '@/lib/descargas';
import { mensajeDeError } from '@/lib/errores';

interface Descarga {
  /** Identificador del elemento, para mostrar su estado de carga. */
  clave: string;
  nombre: string;
  obtener: () => Promise<Blob>;
}

export function useDescarga() {
  const avisos = useToast();
  const [pendiente, setPendiente] = useState<string | null>(null);

  const descargar = useCallback(
    async ({ clave, nombre, obtener }: Descarga) => {
      setPendiente(clave);
      try {
        const blob = await obtener();
        descargarBlob(blob, nombre);
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
