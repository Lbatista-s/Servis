/** Pantalla 6 — Detalle y seguimiento de una solicitud (vista del estudiante). */

import { Navigate, useParams } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  AvatarUsuario,
  Breadcrumb,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  EsqueletoDetalle,
  EstadoError,
  FileChip,
  Icono,
  InlineNotification,
  ListaDatos,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { repositorios } from '@/data';
import { puedeEditarEstudiante } from '@/domain/businessRules';
import { esEstadoFinal } from '@/domain/requestStateMachine';
import { useActor, useUsuarioActual } from '@/features/auth/authStore';
import { useServicio, useSolicitud } from '@/hooks/useDatos';
import { useDescarga } from '@/hooks/useDescarga';
import { useVisorDocumento } from '@/hooks/useVisorDocumento';
import { formatearFecha } from '@/lib/format';

import { AccionesSolicitud } from './AccionesSolicitud';
import { EdicionSolicitud } from './EdicionSolicitud';
import { camposDe, formatearValorCampo } from './formularios';
import { HistorialTimeline } from './HistorialTimeline';

export function DetalleSolicitudPage() {
  const { id } = useParams<{ id: string }>();
  const { datos: solicitud, cargando, error, recargar } = useSolicitud(id);
  const { datos: servicio } = useServicio(solicitud?.servicioId);
  const usuario = useUsuarioActual();
  const actor = useActor();
  const { descargar, pendiente } = useDescarga();
  const { ver, visor } = useVisorDocumento();

  if (cargando) return <EsqueletoDetalle mensaje="Cargando la solicitud…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />;

  if (!solicitud) {
    return (
      <EmptyState
        icono="buscar"
        titulo="No encontramos esa solicitud"
        descripcion="Es posible que haya sido eliminada o que el enlace sea incorrecto."
      >
        <ButtonLink to={RUTAS.inicio}>Volver al inicio</ButtonLink>
      </EmptyState>
    );
  }

  // Un estudiante sólo puede ver sus propias solicitudes.
  if (usuario?.rol === 'estudiante' && solicitud.solicitanteId !== usuario.id) {
    return <Navigate to={RUTAS.inicio} replace />;
  }

  const campos = camposDe(solicitud.servicioId);
  // El dominio decide si esta solicitud es editable ahora mismo por este actor.
  const editable = actor !== null && puedeEditarEstudiante(solicitud, actor);
  const { documento } = solicitud;
  const obtenerDocumento = () => repositorios.solicitudes.descargarDocumento(solicitud.id);
  const verDocumento = () =>
    documento ? ver({ nombre: documento.nombre, obtener: obtenerDocumento }) : undefined;
  const descargarDocumento = () =>
    documento
      ? descargar({ clave: 'documento', nombre: documento.nombre, obtener: obtenerDocumento })
      : undefined;
  const ultimoComentario = [...solicitud.historial]
    .reverse()
    .find((entrada) => entrada.comentario && entrada.estadoNuevo === solicitud.estado);

  return (
    <>
      <Breadcrumb
        migas={[
          { etiqueta: 'Inicio', a: RUTAS.inicio },
          { etiqueta: 'Mis solicitudes', a: RUTAS.misSolicitudes },
          { etiqueta: `#${solicitud.id}` },
        ]}
      />

      <PageHeader
        titulo={servicio?.nombre ?? solicitud.servicioId}
        subtitulo={
          <span className="flex flex-wrap items-center gap-1.5">
            #{solicitud.id} · Creada el {formatearFecha(solicitud.creadaEn)}
            {usuario ? (
              <>
                {' · '}
                <AvatarUsuario usuario={usuario} tamano="xs" />
                {usuario.nombre}
              </>
            ) : null}
          </span>
        }
      >
        <StatusBadge estado={solicitud.estado} />
        {documento ? (
          <Button variante="outline" tamano="sm" onClick={verDocumento}>
            <Icono nombre="ojo" />
            Ver documento
          </Button>
        ) : null}
      </PageHeader>

      {/* Aviso destacado cuando la solicitud exige acción del estudiante. */}
      {solicitud.estado === 'devuelta' && ultimoComentario ? (
        <InlineNotification tono="aviso" className="mb-5">
          <strong className="block font-semibold">Tu solicitud requiere corrección</strong>
          {ultimoComentario.comentario}
        </InlineNotification>
      ) : null}

      {solicitud.estado === 'rechazada' && ultimoComentario ? (
        <InlineNotification tono="error" className="mb-5">
          <strong className="block font-semibold">Motivo del rechazo</strong>
          {ultimoComentario.comentario}
        </InlineNotification>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-start">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionHeader titulo="Historial de la solicitud" />
            <HistorialTimeline solicitud={solicitud} />
          </Card>

          {/* Mientras el estudiante puede corregir, los datos son editables; el
              resto del tiempo se muestran como registro de lo enviado. */}
          {editable && actor ? (
            <EdicionSolicitud solicitud={solicitud} servicio={servicio} actor={actor} />
          ) : (
            <Card>
              <SectionHeader titulo="Datos enviados" />
              <ListaDatos
                vacio="Sin completar"
                datos={campos.map((campo) => ({
                  etiqueta: campo.etiqueta,
                  valor: formatearValorCampo(campo, solicitud.datosFormulario[campo.nombre]),
                  anchoCompleto: campo.anchoCompleto,
                }))}
              />
            </Card>
          )}

          {actor && !esEstadoFinal(solicitud.estado) ? (
            <Card>
              <SectionHeader titulo="Acciones disponibles" />
              <AccionesSolicitud solicitud={solicitud} actor={actor} />
            </Card>
          ) : null}
        </div>

        <aside className="flex flex-col gap-3.5">
          {/* En modo edición los adjuntos se gestionan dentro del formulario,
              así que aquí se omiten para no mostrarlos dos veces. */}
          {editable ? null : (
            <Card>
              <SectionHeader titulo={`Documentos adjuntos (${solicitud.adjuntos.length})`} />
              {solicitud.adjuntos.length === 0 ? (
                <p className="text-base text-ink-3">No hay documentos adjuntos.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {solicitud.adjuntos.map((adjunto) => (
                    <li key={adjunto.id}>
                      <FileChip adjunto={adjunto}>
                        <Button
                          variante="ghost"
                          tamano="icon"
                          aria-label={`Ver ${adjunto.nombre}`}
                          onClick={() =>
                            ver({
                              nombre: adjunto.nombre,
                              obtener: () =>
                                repositorios.solicitudes.descargarAdjunto(solicitud.id, adjunto.id),
                            })
                          }
                        >
                          <Icono nombre="ojo" />
                        </Button>
                      </FileChip>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card className={documento ? undefined : 'opacity-60'}>
            <SectionHeader titulo="Documento generado" />
            {documento ? (
              <div className="flex items-center gap-2">
                <Button variante="outline" className="min-w-0 flex-1" onClick={verDocumento}>
                  <Icono nombre="ojo" />
                  <span className="truncate">{documento.nombre}</span>
                </Button>
                <Button
                  variante="ghost"
                  tamano="icon"
                  aria-label={`Descargar ${documento.nombre}`}
                  onClick={descargarDocumento}
                  disabled={pendiente === 'documento'}
                >
                  <Icono nombre="descargar" />
                </Button>
              </div>
            ) : (
              <p className="text-base text-ink-3">
                Disponible una vez que tu solicitud sea aprobada y completada.
              </p>
            )}
          </Card>

          {servicio ? (
            <Card>
              <SectionHeader titulo="Tiempo estimado" />
              <p className="font-display text-2xl font-bold tabular-nums text-ink">
                {servicio.diasEstimados} días hábiles
              </p>
              <p className="text-sm text-ink-3">para {servicio.nombre.toLowerCase()}</p>
            </Card>
          ) : null}
        </aside>
      </div>
      {visor}
    </>
  );
}
