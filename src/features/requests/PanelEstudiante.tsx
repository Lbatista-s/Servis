/**
 * Pantalla 3 — Inicio del estudiante.
 *
 * Una página de inicio y no un cuadro de mando: el estudiante no gestiona
 * estrategia (eso es del coordinador, según Kaplan y Norton), sólo necesita
 * saber qué hacer ahora. Por eso ordena sus trámites por la acción que piden:
 * primero lo que requiere su atención, después lo que está en curso, los
 * documentos listos para descargar y, al final, el historial.
 */

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
  SectionHeader,
} from '@/components/ui';
import { repositorios } from '@/data';
import type { EstadoSolicitud, Solicitud } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';
import { useIndiceServicios, useSolicitudes } from '@/hooks/useDatos';
import { useVisorDocumento } from '@/hooks/useVisorDocumento';
import { contar } from '@/lib/texto';

import { ACCION_PENDIENTE } from './accionPendiente';
import { FilaSolicitud } from './FilaSolicitud';

const REQUIEREN_ATENCION: readonly EstadoSolicitud[] = ['devuelta', 'borrador'];
const EN_CURSO: readonly EstadoSolicitud[] = ['enviada', 'en_revision', 'corregida', 'aprobada'];
const HISTORIAL_VISIBLE = 5;

export function PanelEstudiante() {
  const usuario = useUsuarioActual();
  const {
    datos: solicitudes,
    cargando,
    error,
    recargar,
  } = useSolicitudes({ solicitanteId: usuario?.id });
  const servicios = useIndiceServicios();

  if (!usuario) return null;
  if (cargando) return <EsqueletoTarjetas mensaje="Cargando tus solicitudes…" cantidad={3} />;
  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />;

  const lista = solicitudes ?? [];
  const pendientes = lista.filter((s) => REQUIEREN_ATENCION.includes(s.estado));
  const enCurso = lista.filter((s) => EN_CURSO.includes(s.estado));
  const cerradas = lista.filter(
    (s) => !REQUIEREN_ATENCION.includes(s.estado) && !EN_CURSO.includes(s.estado),
  );
  const documentos = cerradas.filter((s) => s.documento).slice(0, 3);
  const historial = cerradas.slice(0, HISTORIAL_VISIBLE);

  const nombrePila = usuario.nombre.split(' ')[0] ?? usuario.nombre;
  const fila = (solicitud: Solicitud) => (
    <li key={solicitud.id}>
      <FilaSolicitud
        solicitud={solicitud}
        nombreServicio={servicios.get(solicitud.servicioId)?.nombre ?? solicitud.servicioId}
        accion={ACCION_PENDIENTE[solicitud.estado]}
      />
    </li>
  );

  return (
    <>
      <PageHeader
        titulo={`Hola, ${nombrePila}`}
        subtitulo={
          <>
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
          </>
        }
      >
        <ButtonLink to={RUTAS.catalogo}>
          <Icono nombre="mas" />
          Nueva solicitud
        </ButtonLink>
      </PageHeader>

      {lista.length === 0 ? (
        <Card>
          <EmptyState
            icono="documento"
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
                    <ButtonLink to={RUTAS.misSolicitudes} variante="ghost" tamano="sm">
                      Ver todo ({cerradas.length})
                    </ButtonLink>
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
              <SectionHeader titulo="Documentos listos">
                <ButtonLink to={RUTAS.misDocumentos} variante="ghost" tamano="sm">
                  Ver todos
                </ButtonLink>
              </SectionHeader>
              <DocumentosListos solicitudes={documentos} />
            </Card>
          </aside>
        </div>
      )}
    </>
  );
}

/** Los últimos documentos emitidos; se abren en el visor, que permite descargarlos. */
function DocumentosListos({ solicitudes }: { solicitudes: readonly Solicitud[] }) {
  const { ver, visor } = useVisorDocumento();

  if (solicitudes.length === 0) {
    return (
      <p className="py-2 text-sm text-ink-3">
        Aquí aparecerán los documentos de tus solicitudes completadas.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {solicitudes.map((solicitud) =>
          solicitud.documento ? (
            <li key={solicitud.id}>
              <Button
                variante="outline"
                className="w-full justify-start"
                onClick={() =>
                  ver({
                    nombre: solicitud.documento?.nombre ?? `${solicitud.id}.pdf`,
                    obtener: () => repositorios.solicitudes.descargarDocumento(solicitud.id),
                  })
                }
              >
                <Icono nombre="ojo" />
                <span className="truncate">{solicitud.documento.nombre}</span>
              </Button>
            </li>
          ) : null,
        )}
      </ul>
      {visor}
    </>
  );
}
