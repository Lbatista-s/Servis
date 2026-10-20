/**
 * Pantalla 3 — Inicio del estudiante.
 *
 * Una página de inicio y no un cuadro de mando: el estudiante no gestiona
 * estrategia (eso es del coordinador, según Kaplan y Norton), sólo necesita
 * saber qué hacer ahora. Por eso ordena sus trámites por la acción que piden:
 * primero lo que requiere su atención, después lo que está en curso, los
 * documentos listos para descargar y, al final, el historial.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Icono,
  Loading,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { repositorios } from '@/data';
import type { EstadoSolicitud, Solicitud } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';
import { useIndiceServicios, useSolicitudes } from '@/hooks/useDatos';
import { useDescarga } from '@/hooks/useDescarga';
import { formatearFecha } from '@/lib/format';
import { contar } from '@/lib/texto';

const REQUIEREN_ATENCION: readonly EstadoSolicitud[] = ['devuelta', 'borrador'];
const EN_CURSO: readonly EstadoSolicitud[] = ['enviada', 'en_revision', 'corregida', 'aprobada'];
const HISTORIAL_VISIBLE = 5;

/** Qué se espera del estudiante en cada estado que requiere su atención. */
const ACCION_PENDIENTE: Partial<Record<EstadoSolicitud, string>> = {
  devuelta: 'Corrige y vuelve a enviar',
  borrador: 'Completa y envía',
};

export function PanelEstudiante() {
  const usuario = useUsuarioActual();
  const { datos: solicitudes, cargando } = useSolicitudes({ solicitanteId: usuario?.id });
  const servicios = useIndiceServicios();
  const [historialCompleto, setHistorialCompleto] = useState(false);

  if (!usuario) return null;
  if (cargando) return <Loading mensaje="Cargando tus solicitudes…" />;

  const lista = solicitudes ?? [];
  const pendientes = lista.filter((s) => REQUIEREN_ATENCION.includes(s.estado));
  const enCurso = lista.filter((s) => EN_CURSO.includes(s.estado));
  const cerradas = lista.filter(
    (s) => !REQUIEREN_ATENCION.includes(s.estado) && !EN_CURSO.includes(s.estado),
  );
  const documentos = cerradas.filter((s) => s.documento).slice(0, 3);
  const historial = historialCompleto ? cerradas : cerradas.slice(0, HISTORIAL_VISIBLE);

  const nombrePila = usuario.nombre.split(' ')[0] ?? usuario.nombre;
  const fila = (solicitud: Solicitud) => (
    <li key={solicitud.id}>
      <FilaSolicitud
        solicitud={solicitud}
        icono={servicios.get(solicitud.servicioId)?.icono ?? '📄'}
        nombreServicio={servicios.get(solicitud.servicioId)?.nombre ?? solicitud.servicioId}
        accion={ACCION_PENDIENTE[solicitud.estado]}
      />
    </li>
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-ink">¡Hola, {nombrePila}! 👋</h1>
          <p className="mt-1 text-md text-ink-3">
            {pendientes.length > 0 ? (
              <>
                Tienes{' '}
                <strong className="text-primary-dark">
                  {contar(pendientes.length, 'solicitud', 'solicitudes')}
                </strong>{' '}
                que {pendientes.length === 1 ? 'requiere' : 'requieren'} tu atención.
              </>
            ) : enCurso.length > 0 ? (
              `Tienes ${contar(enCurso.length, 'trámite', 'trámites')} en curso. Te avisaremos cuando cambien.`
            ) : (
              '¿Qué necesitas tramitar hoy?'
            )}
          </p>
        </div>
        <ButtonLink to={RUTAS.catalogo}>
          <Icono nombre="mas" />
          Nueva solicitud
        </ButtonLink>
      </div>

      {lista.length === 0 ? (
        <Card>
          <EmptyState
            icono="📄"
            titulo="Todavía no tienes solicitudes"
            descripcion="Explora el catálogo y elige el servicio que necesitas tramitar."
          >
            <ButtonLink to={RUTAS.catalogo}>Ver catálogo de servicios</ButtonLink>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            {pendientes.length > 0 ? (
              <section aria-labelledby="titulo-atencion">
                <SectionHeader titulo={<span id="titulo-atencion">Requiere tu atención</span>} />
                <Card sinRelleno className="border-primary-light-2">
                  <ul>{pendientes.map(fila)}</ul>
                </Card>
              </section>
            ) : null}

            <section aria-labelledby="titulo-en-curso">
              <SectionHeader titulo={<span id="titulo-en-curso">En curso</span>} />
              <Card sinRelleno>
                {enCurso.length === 0 ? (
                  <p className="px-4 py-5 text-base text-ink-3">No tienes trámites en curso.</p>
                ) : (
                  <ul>{enCurso.map(fila)}</ul>
                )}
              </Card>
            </section>

            {cerradas.length > 0 ? (
              <section aria-labelledby="titulo-historial">
                <SectionHeader titulo={<span id="titulo-historial">Historial</span>}>
                  {cerradas.length > HISTORIAL_VISIBLE ? (
                    <Button
                      variante="ghost"
                      tamano="sm"
                      onClick={() => setHistorialCompleto((actual) => !actual)}
                      aria-expanded={historialCompleto}
                    >
                      {historialCompleto ? 'Ver menos' : `Ver todo (${cerradas.length})`}
                    </Button>
                  ) : null}
                </SectionHeader>
                <Card sinRelleno>
                  <ul>{historial.map(fila)}</ul>
                </Card>
              </section>
            ) : null}
          </div>

          <aside className="flex flex-col gap-4">
            <Card>
              <SectionHeader titulo="Documentos listos" />
              <DocumentosListos solicitudes={documentos} />
            </Card>

            <Card fondo="institucional">
              <p className="text-md font-semibold text-white">¿Necesitas ayuda?</p>
              <p className="mb-3.5 mt-1.5 text-sm text-white/90">
                Consulta el catálogo de servicios disponibles o contacta al Área de Ingenierías.
              </p>
              <ButtonLink to={RUTAS.catalogo} variante="outline">
                <Icono nombre="cuadricula" />
                Ver catálogo
              </ButtonLink>
            </Card>
          </aside>
        </div>
      )}
    </>
  );
}

/** Los últimos documentos emitidos, con descarga directa. */
function DocumentosListos({ solicitudes }: { solicitudes: readonly Solicitud[] }) {
  const { descargar, pendiente } = useDescarga();

  if (solicitudes.length === 0) {
    return (
      <p className="py-2 text-sm text-ink-3">
        Aquí aparecerán los documentos de tus solicitudes completadas.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {solicitudes.map((solicitud) =>
        solicitud.documento ? (
          <li key={solicitud.id}>
            <Button
              variante="outline"
              className="w-full justify-start"
              disabled={pendiente === solicitud.id}
              onClick={() =>
                descargar({
                  clave: solicitud.id,
                  nombre: solicitud.documento?.nombre ?? `${solicitud.id}.pdf`,
                  obtener: () => repositorios.solicitudes.descargarDocumento(solicitud.id),
                })
              }
            >
              <Icono nombre="descargar" />
              <span className="truncate">{solicitud.documento.nombre}</span>
            </Button>
          </li>
        ) : null,
      )}
    </ul>
  );
}

function FilaSolicitud({
  solicitud,
  icono,
  nombreServicio,
  accion,
}: {
  solicitud: Solicitud;
  icono: string;
  nombreServicio: string;
  /** Qué debe hacer el estudiante, si la solicitud espera algo de él. */
  accion?: string;
}) {
  return (
    <Link
      to={RUTAS.detalleSolicitud(solicitud.id)}
      className="flex items-center gap-3.5 border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-canvas-2 text-xl"
      >
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-md font-semibold text-ink">{nombreServicio}</span>
        <span className="block text-sm text-ink-3">
          {solicitud.id} · {formatearFecha(solicitud.creadaEn)}
          {accion ? <span className="font-semibold text-primary-dark"> · {accion}</span> : null}
        </span>
      </span>
      <StatusBadge estado={solicitud.estado} />
      <Icono nombre="chevron" className="h-3.5 w-3.5 text-ink-4" />
    </Link>
  );
}
