/** Entrega al usuario un archivo recibido como `Blob`. */

/** Guarda el archivo con el nombre indicado. */
export function descargarBlob(blob: Blob, nombre: string): void {
  abrirEnlace(blob, (enlace) => {
    enlace.download = nombre;
  });
}

/**
 * Abre el diálogo de impresión del navegador con el archivo (PDF o imagen),
 * cargándolo en un marco oculto para no salir de la aplicación.
 */
export function imprimirBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const marco = document.createElement('iframe');
  marco.style.position = 'fixed';
  marco.style.width = '0';
  marco.style.height = '0';
  marco.style.border = '0';
  marco.src = url;
  marco.onload = () => {
    marco.contentWindow?.focus();
    marco.contentWindow?.print();
    // El diálogo de impresión es modal en la mayoría de navegadores; se
    // limpia con margen para no cortarlo.
    setTimeout(() => {
      marco.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  };
  document.body.appendChild(marco);
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
