/**
 * Documento de salida de una solicitud completada.
 *
 * El nombre del archivo es el mismo venga del servidor o de la generación de
 * muestra local, para que la interfaz no dependa del origen.
 */

import type { Documento } from './types';

/** `Carta de pasantía` + `SRV-1042` → `carta-de-pasantia-SRV-1042.pdf`. */
export function nombreDocumento(solicitudId: string, nombreServicio: string): string {
  const base = nombreServicio
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'documento'}-${solicitudId}.pdf`;
}

export function crearDocumento(
  solicitudId: string,
  nombreServicio: string,
  ahora: Date = new Date(),
): Documento {
  return { nombre: nombreDocumento(solicitudId, nombreServicio), generadoEn: ahora.toISOString() };
}
