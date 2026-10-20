/**
 * Página de un PDF dibujada con pdf.js (`react-pdf`).
 *
 * Se carga bajo demanda desde `VisorDocumento`: pdf.js pesa lo suyo y sólo
 * hace falta cuando alguien abre un documento.
 */

import { useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Loading } from '@/components/ui';

// El análisis del PDF corre en un worker propio, servido como archivo estático.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function PaginasPdf({
  archivo,
  pagina,
  ancho,
  onCargado,
  onError,
}: {
  archivo: Blob;
  pagina: number;
  /** Ancho de la página en píxeles (ya incluye el zoom). */
  ancho: number;
  onCargado: (paginas: number) => void;
  onError: () => void;
}) {
  // `react-pdf` recarga el documento si cambia la identidad de `file`.
  const file = useMemo(() => archivo, [archivo]);

  return (
    <Document
      file={file}
      onLoadSuccess={({ numPages }) => onCargado(numPages)}
      onLoadError={onError}
      loading={<Loading mensaje="Abriendo el documento…" />}
      error={null}
      className="flex justify-center"
    >
      <Page
        pageNumber={pagina}
        width={ancho}
        loading={<Loading mensaje="Dibujando la página…" />}
        className="shadow-md"
      />
    </Document>
  );
}
