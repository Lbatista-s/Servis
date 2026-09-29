/** Conversión de archivos seleccionados en adjuntos de una solicitud. */

import type { Adjunto } from '@/domain/types';

/**
 * Adjuntos a partir de los archivos elegidos en la zona de carga. Todavía no
 * se suben a ningún servidor: se conservan sus metadatos en la solicitud.
 */
export function adjuntosDesde(archivos: readonly File[]): Adjunto[] {
  const ahora = new Date();
  return archivos.map((archivo, indice) => ({
    id: `adj-${ahora.getTime()}-${indice}`,
    nombre: archivo.name,
    tamano: archivo.size,
    tipo: archivo.type || 'application/octet-stream',
    subidoEn: ahora.toISOString(),
  }));
}
