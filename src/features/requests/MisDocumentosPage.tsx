/**
 * Mis documentos: los documentos emitidos en las solicitudes completadas del
 * estudiante, para verlos en el visor o descargarlos.
 */

import { Link } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  EsqueletoTarjetas,
  EstadoError,
  Icono,
  PageHeader,
} from '@/components/ui';
import { repositorios } from '@/data';
import { useUsuarioActual } from '@/features/auth/authStore';
import { useIndiceServicios, useSolicitudes } from '@/hooks/useDatos';
import { useDescarga } from '@/hooks/useDescarga';
import { useVisorDocumento } from '@/hooks/useVisorDocumento';
import { formatearFecha } from '@/lib/format';

export function MisDocumentosPage() {
  const usuario = useUsuarioActual();
  const {
    datos: solicitudes,
    cargando,
    error,
    recargar,
  } = useSolicitudes({ solicitanteId: usuario?.id });
  const servicios = useIndiceServicios();
  const { ver, visor } = useVisorDocumento();
  const { descargar, pendiente } = useDescarga();

  const conDocumento = (solicitudes ?? [])
    .flatMap((s) => (s.documento ? [{ solicitud: s, documento: s.documento }] : []))
    .sort((a, b) => b.documento.generadoEn.localeCompare(a.documento.generadoEn));

  return (
    <>
      <PageHeader
        titulo="Mis documentos"
        subtitulo="Los documentos que SERVIS emitió al completar tus solicitudes."
      />

      {cargando ? (
        <EsqueletoTarjetas mensaje="Cargando tus documentos…" conEncabezado={false} />
      ) : error ? (
        <EstadoError mensaje={error} onReintentar={recargar} />
      ) : conDocumento.length === 0 ? (
        <Card>
          <EmptyState
            icono="carpeta"
            titulo="Aún no tienes documentos"
            descripcion="Cuando una de tus solicitudes se complete, su documento aparecerá aquí."
          >
            <ButtonLink to={RUTAS.misSolicitudes} variante="outline">
              Ver mis solicitudes
            </ButtonLink>
          </EmptyState>
        </Card>
      ) : (
        <ul
          aria-label="Mis documentos"
          className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3"
        >
          {conDocumento.map(({ solicitud, documento }) => {
            const servicio = servicios.get(solicitud.servicioId);
            const obtener = () => repositorios.solicitudes.descargarDocumento(solicitud.id);
            return (
              <li key={solicitud.id}>
                <Card className="h-full">
                  <div className="flex items-start gap-3">
                    <Icono nombre="documento" className="mt-0.5 h-4 w-4 text-ink-3" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {servicio?.nombre ?? solicitud.servicioId}
                      </p>
                      <p className="truncate text-sm text-ink-3" title={documento.nombre}>
                        {documento.nombre}
                      </p>
                      <p className="text-xs text-ink-3">
                        Emitido el {formatearFecha(documento.generadoEn)} ·{' '}
                        <Link
                          to={RUTAS.detalleSolicitud(solicitud.id)}
                          className="text-primary-dark underline hover:text-primary"
                        >
                          {solicitud.id}
                        </Link>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variante="outline"
                      tamano="sm"
                      className="flex-1"
                      aria-label={`Ver ${documento.nombre}`}
                      onClick={() => ver({ nombre: documento.nombre, obtener })}
                    >
                      <Icono nombre="ojo" />
                      Ver
                    </Button>
                    <Button
                      variante="ghost"
                      tamano="sm"
                      aria-label={`Descargar ${documento.nombre}`}
                      disabled={pendiente === solicitud.id}
                      onClick={() =>
                        descargar({ clave: solicitud.id, nombre: documento.nombre, obtener })
                      }
                    >
                      <Icono nombre="descargar" />
                      Descargar
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      {visor}
    </>
  );
}
