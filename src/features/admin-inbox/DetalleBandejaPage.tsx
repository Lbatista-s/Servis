/** Pantalla 8 — Detalle de solicitud con acciones de revisión. */

import { Checkbox } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  Breadcrumb,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  FieldHint,
  FileChip,
  Icono,
  InlineNotification,
  ListaDatos,
  Loading,
  NoteBlock,
  SectionHeader,
  Sobretitulo,
  StatusBadge,
  Textarea,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { esEstadoFinal } from '@/domain/requestStateMachine';
import { useActor } from '@/features/auth/authStore';
import { AccionesSolicitud } from '@/features/requests/AccionesSolicitud';
import { camposDe, formatearValorCampo } from '@/features/requests/formularios';
import { HistorialTimeline } from '@/features/requests/HistorialTimeline';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar, useServicio, useSolicitud, useIndiceUsuarios } from '@/hooks/useDatos';
import { useDescarga } from '@/hooks/useDescarga';
import { formatearFecha } from '@/lib/format';

export function DetalleBandejaPage() {
  const { id } = useParams<{ id: string }>();
  const { datos: solicitud, cargando } = useSolicitud(id);
  const { datos: servicio } = useServicio(solicitud?.servicioId);
  const usuarios = useIndiceUsuarios();
  const actor = useActor();
  const { descargar, pendiente } = useDescarga();

  if (cargando) return <Loading mensaje="Cargando la solicitud…" />;

  if (!solicitud) {
    return (
      <EmptyState
        icono="🔍"
        titulo="No encontramos esa solicitud"
        descripcion="Es posible que haya sido eliminada o que el enlace sea incorrecto."
      >
        <ButtonLink to={RUTAS.bandeja}>Volver a la bandeja</ButtonLink>
      </EmptyState>
    );
  }

  const estudiante = usuarios.get(solicitud.solicitanteId);
  const campos = camposDe(solicitud.servicioId);
  const finalizada = esEstadoFinal(solicitud.estado);

  return (
    <>
      <Breadcrumb
        migas={[
          { etiqueta: 'Bandeja', a: RUTAS.bandeja },
          { etiqueta: `#${solicitud.id} — ${servicio?.nombre ?? solicitud.servicioId}` },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-start">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ink">
                  {servicio?.nombre ?? solicitud.servicioId}
                </h1>
                <p className="mt-1 text-base text-ink-3">
                  Solicitud #{solicitud.id} · Recibida el{' '}
                  {formatearFecha(solicitud.enviadaEn ?? solicitud.creadaEn)}
                </p>
              </div>
              <StatusBadge estado={solicitud.estado} />
            </div>

            {/* Datos del estudiante */}
            <div className="mb-4 rounded-md border border-line bg-surface-2 p-4">
              <Sobretitulo>Datos del estudiante</Sobretitulo>
              <ListaDatos
                datos={[
                  {
                    etiqueta: 'Nombre',
                    valor: estudiante ? <strong>{estudiante.nombre}</strong> : null,
                  },
                  { etiqueta: 'Matrícula', valor: estudiante?.matricula },
                  { etiqueta: 'Carrera', valor: estudiante?.carrera },
                  { etiqueta: 'Semestre', valor: estudiante?.semestre },
                  { etiqueta: 'Correo', valor: estudiante?.correo },
                ]}
              />
            </div>

            {/* Datos del formulario */}
            <div className="mb-4">
              <ListaDatos
                datos={campos.map((campo) => ({
                  etiqueta: campo.etiqueta,
                  valor: formatearValorCampo(campo, solicitud.datosFormulario[campo.nombre]),
                  anchoCompleto: campo.anchoCompleto,
                }))}
              />
            </div>

            <SectionHeader titulo={`Documentos adjuntos (${solicitud.adjuntos.length})`} />
            {solicitud.adjuntos.length === 0 ? (
              <p className="text-base text-ink-3">El estudiante no adjuntó documentos.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {solicitud.adjuntos.map((adjunto) => (
                  <li key={adjunto.id}>
                    <FileChip adjunto={adjunto}>
                      {(['abrir', 'descargar'] as const).map((modo) => (
                        <Button
                          key={modo}
                          variante="ghost"
                          tamano="icon"
                          aria-label={`${modo === 'abrir' ? 'Ver' : 'Descargar'} ${adjunto.nombre}`}
                          disabled={pendiente === adjunto.id}
                          onClick={() =>
                            descargar({
                              clave: adjunto.id,
                              nombre: adjunto.nombre,
                              modo,
                              obtener: () =>
                                repositorios.solicitudes.descargarAdjunto(solicitud.id, adjunto.id),
                            })
                          }
                        >
                          <Icono nombre={modo === 'abrir' ? 'ojo' : 'descargar'} />
                        </Button>
                      ))}
                    </FileChip>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <ComentarioInterno
            solicitudId={solicitud.id}
            valorInicial={solicitud.comentarioInterno}
          />

          <Card>
            <SectionHeader titulo="Acción sobre la solicitud" />
            {finalizada ? (
              <InlineNotification tono="info">
                La solicitud está {solicitud.estado} y ya no admite más acciones. Su historial queda
                como registro permanente.
              </InlineNotification>
            ) : (
              <>
                <NoteBlock className="mb-4">
                  <strong>Importante:</strong> esta acción notificará al estudiante por correo y
                  dentro de la plataforma. No se puede deshacer.
                </NoteBlock>
                {actor ? <AccionesSolicitud solicitud={solicitud} actor={actor} /> : null}
              </>
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-3.5">
          <Card>
            <SectionHeader titulo="Historial" />
            <HistorialTimeline solicitud={solicitud} />
          </Card>

          {servicio ? (
            <Card fondo="suave">
              <Sobretitulo>Checklist de revisión</Sobretitulo>
              <ChecklistRevision requisitos={servicio.requisitos.map((r) => r.descripcion)} />
              <FieldHint className="mt-3">
                Lista de apoyo para el revisor. No se guarda con la solicitud.
              </FieldHint>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}

/** Observación visible sólo para el equipo administrativo. */
function ComentarioInterno({
  solicitudId,
  valorInicial,
}: {
  solicitudId: string;
  valorInicial: string;
}) {
  const [texto, setTexto] = useState(valorInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actor = useActor();
  const revalidar = useRevalidar();
  const avisos = useToast();

  // Si la solicitud se recarga desde el almacén, se refresca el campo.
  useEffect(() => {
    setTexto(valorInicial);
  }, [valorInicial]);

  async function guardar() {
    if (!actor) return;
    setGuardando(true);
    setError(null);
    try {
      await repositorios.solicitudes.guardar(solicitudId, { comentarioInterno: texto }, actor);
      revalidar();
      avisos.exito('Comentario guardado', 'La observación interna quedó registrada.');
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card>
      <SectionHeader titulo="Comentario interno" />
      <Textarea
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder="Escribe una observación visible sólo para el equipo administrativo…"
        aria-label="Comentario interno"
      />
      <FieldHint className="mt-1.5">Este comentario NO es visible para el estudiante.</FieldHint>

      {error ? (
        <InlineNotification tono="error" className="mt-3">
          {error}
        </InlineNotification>
      ) : null}

      <div className="mt-3 flex justify-end">
        <Button variante="outline" tamano="sm" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar comentario'}
        </Button>
      </div>
    </Card>
  );
}

function ChecklistRevision({ requisitos }: { requisitos: readonly string[] }) {
  const [marcados, setMarcados] = useState<Set<number>>(new Set());

  function alternar(indice: number, marcado: boolean) {
    setMarcados((actuales) => {
      const siguiente = new Set(actuales);
      if (marcado) siguiente.add(indice);
      else siguiente.delete(indice);
      return siguiente;
    });
  }

  const elementos = ['Identidad del estudiante verificada', ...requisitos];

  return (
    <ul className="flex flex-col gap-2">
      {elementos.map((texto, indice) => (
        <li key={texto}>
          <Checkbox
            checked={marcados.has(indice)}
            onChange={(evento) => alternar(indice, evento.target.checked)}
          >
            {texto}
          </Checkbox>
        </li>
      ))}
    </ul>
  );
}
