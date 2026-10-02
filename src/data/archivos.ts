/**
 * Archivos elegidos por el usuario que todavía no se han enviado.
 *
 * La interfaz trabaja con `Adjunto` (metadatos) para no depender del origen de
 * los datos. El contenido (`File`) se registra aquí con el identificador
 * provisional del adjunto: el repositorio HTTP lo sube al guardar y el local lo
 * conserva en memoria durante la sesión para poder descargarlo.
 */

const pendientes = new Map<string, File>();

export function registrarArchivo(adjuntoId: string, archivo: File): void {
  pendientes.set(adjuntoId, archivo);
}

export function archivoRegistrado(adjuntoId: string): File | undefined {
  return pendientes.get(adjuntoId);
}

export function olvidarArchivo(adjuntoId: string): void {
  pendientes.delete(adjuntoId);
}
