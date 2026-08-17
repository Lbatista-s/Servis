/** Pantalla 8 — Detalle de solicitud con acciones de revisión. */

import { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  Breadcrumb,
  Button,
  Card,
  CheckboxField,
  EmptyState,
  FieldHint,
  FileChip,
  Icono,
  InlineNotification,
  Loading,
  NoteBlock,
  SectionHeader,
  StatusBadge,
  Textarea,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { esEstadoFinal } from '@/domain/requestStateMachine';
import { useActor } from '@/features/auth/authStore';
import { AccionesSolicitud } from '@/features/requests/AccionesSolicitud';
import { camposDe } from '@/features/requests/formularios';
import { HistorialTimeline } from '@/features/requests/HistorialTimeline';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar, useServicio, useSolicitud, useIndiceUsuarios } from '@/hooks/useDatos';
import { formatearFecha } from '@/lib/format';

export function DetalleBandejaPage() {
  const { id } = useParams<{ id: string }>();
  const { datos: solicitud, cargando } = useSolicitud(id);
  const { datos: servicio } = useServicio(solicitud?.servicioId);
  const usuarios = useIndiceUsuarios();
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
          <a href={RUTAS.bandeja}>Volver a la bandeja</a>
        </Button>
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
                Datos del estudiante
              </p>
              <dl className="grid gap-2.5 text-base sm:grid-cols-2">
                <Dato etiqueta="Nombre" valor={estudiante?.nombre} destacado />
                <Dato etiqueta="Matrícula" valor={estudiante?.matricula} />
                <Dato etiqueta="Carrera" valor={estudiante?.carrera} />
                <Dato etiqueta="Semestre" valor={estudiante?.semestre} />
                <Dato etiqueta="Correo" valor={estudiante?.correo} />
              </dl>
            </div>

            {/* Datos del formulario */}
            <dl className="mb-4 grid gap-2.5 text-base sm:grid-cols-2">
              {campos.map((campo) => (
                <Dato
                  key={campo.nombre}
                  etiqueta={campo.etiqueta}
                  valor={solicitud.datosFormulario[campo.nombre]}
                />
              ))}
            </dl>

            <SectionHeader titulo={`Documentos adjuntos (${solicitud.adjuntos.length})`} />
            {solicitud.adjuntos.length === 0 ? (
              <p className="text-base text-ink-3">El estudiante no adjuntó documentos.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {solicitud.adjuntos.map((adjunto) => (
                  <li key={adjunto.id}>
                    <FileChip adjunto={adjunto}>
                      <Button variante="ghost" tamano="icon" aria-label={`Ver ${adjunto.nombre}`}>
                        <Icono nombre="ojo" />
                      </Button>
                      <Button
                        variante="ghost"
                        tamano="icon"
                        aria-label={`Descargar ${adjunto.nombre}`}
                      >
                        <Icono nombre="descargar" />
                      </Button>
                    </FileChip>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <ComentarioInterno solicitudId={solicitud.id} valorInicial={solicitud.comentarioInterno} />

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
            <Card className="bg-surface-2">
              <p className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-ink-3">
                Checklist de revisión
              </p>
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

function Dato({
  etiqueta,
  valor,
  destacado,
}: {
  etiqueta: string;
  valor?: string;
  destacado?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">{etiqueta}</dt>
      <dd className={destacado ? 'mt-0.5 font-semibold text-ink' : 'mt-0.5 text-ink'}>
        {valor?.trim() || <span className="text-ink-4">—</span>}
      </dd>
    </div>
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

  return (
    <ul className="flex flex-col gap-2">
      <li>
        <CheckboxField
          id="check-identidad"
          checked={marcados.has(-1)}
          onCheckedChange={(valor) =>
            setMarcados((actuales) => {
              const siguiente = new Set(actuales);
              if (valor) siguiente.add(-1);
              else siguiente.delete(-1);
              return siguiente;
            })
          }
        >
          Identidad del estudiante verificada
        </CheckboxField>
      </li>
      {requisitos.map((requisito, indice) => (
        <li key={requisito}>
          <CheckboxField
            id={`check-${indice}`}
            checked={marcados.has(indice)}
            onCheckedChange={(valor) =>
              setMarcados((actuales) => {
                const siguiente = new Set(actuales);
                if (valor) siguiente.add(indice);
                else siguiente.delete(indice);
                return siguiente;
              })
            }
          >
            {requisito}
          </CheckboxField>
        </li>
      ))}
    </ul>
  );
}
