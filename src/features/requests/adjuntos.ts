/** Conversión de archivos seleccionados en adjuntos de una solicitud. */

import { registrarArchivo } from '@/data/archivos';
import type { Adjunto } from '@/domain/types';

/**
 * Adjuntos a partir de los archivos elegidos en la zona de carga. El contenido
 * queda registrado con el identificador provisional; el repositorio lo sube
 * (o lo conserva, en modo local) al guardar la solicitud.
 */
export function adjuntosDesde(archivos: readonly File[]): Adjunto[] {
  const ahora = new Date();
  return archivos.map((archivo, indice) => {
    const adjunto: Adjunto = {
      id: `adj-${ahora.getTime()}-${indice}`,
      nombre: archivo.name,
      tamano: archivo.size,
      tipo: archivo.type || 'application/octet-stream',
      subidoEn: ahora.toISOString(),
    };
    registrarArchivo(adjunto.id, archivo);
    return adjunto;
  });
}
