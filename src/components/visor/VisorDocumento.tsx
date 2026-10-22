/**
 * Visor de documentos integrado: muestra un PDF o una imagen dentro de la
 * aplicación, con paginación, zoom, descarga e impresión.
 *
 * Los documentos oficiales los genera el backend; el frontend sólo los
 * muestra. Para otros tipos de archivo ofrece la descarga.
 */

import { Modal } from 'antd';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { Button, EmptyState, EstadoError, Icono, Loading } from '@/components/ui';
import { descargarBlob, imprimirBlob } from '@/lib/descargas';

const PaginasPdf = lazy(() => import('./PaginasPdf'));

const ZOOM_MINIMO = 0.5;
const ZOOM_MAXIMO = 2;
const PASO_ZOOM = 0.25;
/** Ancho de la página al 100 %, si el diálogo lo permite. */
const ANCHO_BASE = 760;

export interface VisorDocumentoProps {
  abierto: boolean;
  nombre: string;
  archivo: Blob | null;
  cargando: boolean;
  error: string | null;
  onCerrar: () => void;
  onReintentar: () => void;
}

type TipoVista = 'pdf' | 'imagen' | 'otro';

function tipoDe(archivo: Blob, nombre: string): TipoVista {
  if (archivo.type === 'application/pdf' || /\.pdf$/i.test(nombre)) return 'pdf';
  if (archivo.type.startsWith('image/')) return 'imagen';
  return 'otro';
}

/** Ancho disponible del contenedor, actualizado al redimensionar. */
function useAnchoDisponible() {
  const ref = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(ANCHO_BASE);
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(([entrada]) => {
      if (entrada) setAncho(Math.floor(entrada.contentRect.width));
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);
  return { ref, ancho };
}

function VistaImagen({ archivo, nombre, zoom }: { archivo: Blob; nombre: string; zoom: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const creada = URL.createObjectURL(archivo);
    setUrl(creada);
    return () => URL.revokeObjectURL(creada);
  }, [archivo]);
  if (!url) return null;
  return (
    <img
      src={url}
      alt={nombre}
      className="mx-auto block h-auto shadow-md"
      style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
    />
  );
}

export function VisorDocumento({
  abierto,
  nombre,
  archivo,
  cargando,
  error,
  onCerrar,
  onReintentar,
}: VisorDocumentoProps) {
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pdfIlegible, setPdfIlegible] = useState(false);
  const { ref, ancho } = useAnchoDisponible();

  // Cada documento nuevo empieza en la primera página y al 100 %.
  useEffect(() => {
    setPagina(1);
    setPaginas(0);
    setZoom(1);
    setPdfIlegible(false);
  }, [archivo]);

  const tipo = archivo ? tipoDe(archivo, nombre) : null;
  const conZoom = tipo === 'pdf' || tipo === 'imagen';
  const anchoPagina = Math.round(Math.min(ancho - 32, ANCHO_BASE) * zoom);

  function cambiarZoom(delta: number) {
    setZoom((actual) => Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, actual + delta)));
  }

  let contenido;
  if (cargando) {
    contenido = <Loading mensaje="Obteniendo el documento…" />;
  } else if (error) {
    contenido = (
      <EstadoError
        titulo="No se pudo obtener el documento"
        mensaje={error}
        onReintentar={onReintentar}
      />
    );
  } else if (!archivo) {
    contenido = null;
  } else if (tipo === 'pdf' && !pdfIlegible) {
    contenido = (
      <Suspense fallback={<Loading mensaje="Preparando el visor…" />}>
        <PaginasPdf
          archivo={archivo}
          pagina={pagina}
          ancho={anchoPagina}
          onCargado={setPaginas}
          onError={() => setPdfIlegible(true)}
        />
      </Suspense>
    );
  } else if (tipo === 'imagen') {
    contenido = <VistaImagen archivo={archivo} nombre={nombre} zoom={zoom} />;
  } else {
    contenido = (
      <EmptyState
        icono="documento"
        titulo={pdfIlegible ? 'No se pudo mostrar el PDF' : 'Vista previa no disponible'}
        descripcion="Descarga el archivo para abrirlo con otra aplicación."
      />
    );
  }

  return (
    <Modal
      open={abierto}
      onCancel={onCerrar}
      title={<span className="block truncate pr-8">{nombre}</span>}
      width={880}
      centered
      destroyOnHidden
      footer={null}
    >
      <div
        role="toolbar"
        aria-label="Controles del visor"
        className="flex flex-wrap items-center gap-2 border-b border-line py-2"
      >
        {tipo === 'pdf' && paginas > 0 ? (
          <div className="flex items-center gap-1">
            <Button
              variante="ghost"
              tamano="icon"
              aria-label="Página anterior"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              <Icono nombre="chevron" className="rotate-180" />
            </Button>
            <span
              className="min-w-[96px] text-center text-sm tabular-nums text-ink-2"
              aria-live="polite"
            >
              Página {pagina} de {paginas}
            </span>
            <Button
              variante="ghost"
              tamano="icon"
              aria-label="Página siguiente"
              disabled={pagina >= paginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              <Icono nombre="chevron" />
            </Button>
          </div>
        ) : null}

        {conZoom && archivo && !pdfIlegible ? (
          <div className="flex items-center gap-1">
            <Button
              variante="ghost"
              tamano="icon"
              aria-label="Reducir"
              disabled={zoom <= ZOOM_MINIMO}
              onClick={() => cambiarZoom(-PASO_ZOOM)}
            >
              <Icono nombre="menos" />
            </Button>
            <span className="min-w-[48px] text-center text-sm tabular-nums text-ink-2">
              {Math.round(zoom * 100)} %
            </span>
            <Button
              variante="ghost"
              tamano="icon"
              aria-label="Ampliar"
              disabled={zoom >= ZOOM_MAXIMO}
              onClick={() => cambiarZoom(PASO_ZOOM)}
            >
              <Icono nombre="mas" />
            </Button>
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {conZoom && archivo && !pdfIlegible ? (
            <Button variante="outline" tamano="sm" onClick={() => imprimirBlob(archivo)}>
              <Icono nombre="imprimir" />
              Imprimir
            </Button>
          ) : null}
          <Button
            variante="primary"
            tamano="sm"
            disabled={!archivo}
            onClick={() => archivo && descargarBlob(archivo, nombre)}
          >
            <Icono nombre="descargar" />
            Descargar
          </Button>
        </div>
      </div>

      <div
        ref={ref}
        className="max-h-[70vh] min-h-[320px] overflow-auto bg-canvas p-4"
        aria-busy={cargando}
      >
        {contenido}
      </div>
    </Modal>
  );
}
