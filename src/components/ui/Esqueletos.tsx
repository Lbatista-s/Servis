/**
 * Estados de carga con la forma de lo que va a aparecer, en lugar de un
 * indicador giratorio: la pantalla no salta cuando llegan los datos.
 *
 * Se anuncian una sola vez a los lectores de pantalla (`role="status"`) y el
 * dibujo se oculta (`aria-hidden`).
 */

import { Skeleton } from 'antd';

import { Card } from './Card';

function Anuncio({ mensaje }: { mensaje: string }) {
  return (
    <span role="status" className="sr-only">
      {mensaje}
    </span>
  );
}

function Encabezado({ conAccion = false }: { conAccion?: boolean }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="w-full max-w-md">
        <Skeleton.Input active size="large" block />
        <Skeleton.Input active size="small" className="!mt-2 !w-2/3" block />
      </div>
      {conAccion ? <Skeleton.Button active /> : null}
    </div>
  );
}

/** Encabezado y una tabla: bandeja, usuarios, servicios. */
export function EsqueletoTabla({
  mensaje = 'Cargando…',
  filas = 6,
  conEncabezado = true,
  conMetricas = false,
}: {
  mensaje?: string;
  filas?: number;
  conEncabezado?: boolean;
  conMetricas?: boolean;
}) {
  return (
    <div>
      <Anuncio mensaje={mensaje} />
      <div aria-hidden="true">
        {conEncabezado ? <Encabezado conAccion /> : null}
        {conMetricas ? (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Card key={i}>
                <Skeleton active title={false} paragraph={{ rows: 2 }} />
              </Card>
            ))}
          </div>
        ) : null}
        <Card>
          {Array.from({ length: filas }, (_, i) => (
            <Skeleton
              key={i}
              active
              avatar={{ size: 'small' }}
              title={false}
              paragraph={{ rows: 1, width: '100%' }}
              className="py-2"
            />
          ))}
        </Card>
      </div>
    </div>
  );
}

/** Rejilla de tarjetas: catálogo, inicios. */
export function EsqueletoTarjetas({
  mensaje = 'Cargando…',
  cantidad = 6,
  conEncabezado = true,
}: {
  mensaje?: string;
  cantidad?: number;
  conEncabezado?: boolean;
}) {
  return (
    <div>
      <Anuncio mensaje={mensaje} />
      <div aria-hidden="true">
        {conEncabezado ? <Encabezado /> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cantidad }, (_, i) => (
            <Card key={i}>
              <Skeleton active avatar={{ shape: 'square' }} paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Detalle con columna lateral: solicitud del estudiante o de la bandeja. */
export function EsqueletoDetalle({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div>
      <Anuncio mensaje={mensaje} />
      <div aria-hidden="true">
        <Skeleton.Input active size="small" className="!mb-4 !w-48" />
        <Encabezado conAccion />
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            <Card>
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </div>
          <div className="flex flex-col gap-5">
            <Card>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
            <Card>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Bloque genérico dentro de una pantalla ya dibujada (pestañas, paneles). */
export function EsqueletoBloque({
  mensaje = 'Cargando…',
  filas = 4,
}: {
  mensaje?: string;
  filas?: number;
}) {
  return (
    <div>
      <Anuncio mensaje={mensaje} />
      <Card aria-hidden="true">
        <Skeleton active paragraph={{ rows: filas }} />
      </Card>
    </div>
  );
}
