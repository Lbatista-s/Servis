/** Pantalla 6 — Detalle y seguimiento de una solicitud (vista del estudiante). */

import { Navigate, useParams } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  Avatar,
  Breadcrumb,
  Button,
  Card,
  EmptyState,
  FileChip,
  Icono,
  InlineNotification,
  Loading,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { puedeEditarEstudiante } from '@/domain/businessRules';
import { esEstadoFinal } from '@/domain/requestStateMachine';
import { useActor, useUsuarioActual } from '@/features/auth/authStore';
import { useServicio, useSolicitud } from '@/hooks/useDatos';
import { formatearFecha } from '@/lib/format';

import { AccionesSolicitud } from './AccionesSolicitud';
import { EdicionSolicitud } from './EdicionSolicitud';
import { camposDe, formatearValorCampo } from './formularios';
import { HistorialTimeline } from './HistorialTimeline';

export function DetalleSolicitudPage() {
  const { id } = useParams<{ id: string }>();
  const { datos: solicitud, cargando } = useSolicitud(id);
  const { datos: servicio } = useServicio(solicitud?.servicioId);
  const usuario = useUsuarioActual();
  const actor = useActor();

  if (cargando) return <Loading mensaje="Cargando la solicitud…" />;

  if (!solicitud) {
    return (
      <EmptyState
        icono="🔍"
        titulo="No encontramos esa solicitud"
        descripcion="Es posible que haya sido eliminada o que el enlace sea incorrecto."
      >
        <Button asChild>
          <a href={RUTAS.inicio}>Volver al inicio</a>
        </Button>
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
  const ultimoComentario = [...solicitud.historial]
    .reverse()
    .find((entrada) => entrada.comentario && entrada.estadoNuevo === solicitud.estado);

  return (
    <>
      <Breadcrumb
        migas={[
          { etiqueta: 'Inicio', a: RUTAS.inicio },
          { etiqueta: 'Mis solicitudes', a: RUTAS.inicio },
          { etiqueta: `#${solicitud.id}` },
        ]}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">
            {servicio?.nombre ?? solicitud.servicioId}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-base text-ink-3">
            #{solicitud.id} · Creada el {formatearFecha(solicitud.creadaEn)}
            {usuario ? (
              <>
                {' · '}
                <Avatar
                  nombre={usuario.nombre}
                  iniciales={usuario.iniciales}
                  color={usuario.colorAvatar}
                  tamano="xs"
                />
                {usuario.nombre}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge estado={solicitud.estado} />
          {solicitud.estado === 'completada' ? (
            <Button variante="outline" tamano="sm">
              <Icono nombre="descargar" />
              Descargar documento
            </Button>
          ) : null}
        </div>
      </div>

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
              <dl className="grid gap-3 sm:grid-cols-2">
                {campos.map((campo) => (
                  <div key={campo.nombre}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                      {campo.etiqueta}
                    </dt>
                    <dd className="mt-0.5 text-base text-ink">
                      {formatearValorCampo(campo, solicitud.datosFormulario[campo.nombre]) || (
                        <span className="text-ink-4">Sin completar</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
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
                        <Button variante="ghost" tamano="icon" aria-label={`Ver ${adjunto.nombre}`}>
                          <Icono nombre="ojo" />
                        </Button>
                      </FileChip>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card className={solicitud.estado === 'completada' ? undefined : 'opacity-60'}>
            <SectionHeader titulo="Documento generado" />
            {solicitud.estado === 'completada' ? (
              <Button variante="outline" className="w-full">
                <Icono nombre="descargar" />
                {servicio?.plantilla ?? 'documento.docx'}
              </Button>
            ) : (
              <p className="py-4 text-center text-base text-ink-3">
                <span aria-hidden="true" className="mb-2 block text-3xl">
                  📋
                </span>
                Disponible una vez que tu solicitud sea aprobada y completada.
              </p>
            )}
          </Card>

          {servicio ? (
            <Card>
              <SectionHeader titulo="Tiempo estimado" />
              <div className="flex items-center gap-2.5 rounded bg-warning-light p-3">
                <span aria-hidden="true" className="text-2xl">
                  ⏱
                </span>
                <div>
                  <p className="text-base font-semibold text-ink">
                    {servicio.diasEstimados} días hábiles
                  </p>
                  <p className="text-sm text-ink-3">para {servicio.nombre.toLowerCase()}</p>
                </div>
              </div>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}
