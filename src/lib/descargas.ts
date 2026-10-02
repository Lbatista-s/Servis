/** Entrega al usuario un archivo recibido como `Blob`. */

/** Guarda el archivo con el nombre indicado. */
export function descargarBlob(blob: Blob, nombre: string): void {
  abrirEnlace(blob, (enlace) => {
    enlace.download = nombre;
  });
}

/** Abre el archivo en una pestaña nueva (vista previa de PDF e imágenes). */
export function abrirBlob(blob: Blob): void {
  abrirEnlace(blob, (enlace) => {
    enlace.target = '_blank';
    enlace.rel = 'noopener';
  });
}

function abrirEnlace(blob: Blob, configurar: (enlace: HTMLAnchorElement) => void): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  configurar(enlace);
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // El navegador necesita la URL mientras abre el archivo; se libera después.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
