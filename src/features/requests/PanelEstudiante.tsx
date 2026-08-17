/** Pantalla 3 — Panel del estudiante. */

import { Link } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  Button,
  Card,
  EmptyState,
  Icono,
  Loading,
  SectionHeader,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import type { Solicitud } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';
import { useIndiceServicios, useSolicitudes } from '@/hooks/useDatos';
import { formatearFecha, tiempoRelativo } from '@/lib/format';

export function PanelEstudiante() {
  const usuario = useUsuarioActual();
  const { datos: solicitudes, cargando } = useSolicitudes({ solicitanteId: usuario?.id });
  const servicios = useIndiceServicios();

  if (!usuario) return null;
  if (cargando) return <Loading mensaje="Cargando tus solicitudes…" />;

  const lista = solicitudes ?? [];
  const enCurso = lista.filter((s) =>
    ['enviada', 'en_revision', 'corregida'].includes(s.estado),
  ).length;
  const requierenCorreccion = lista.filter((s) => s.estado === 'devuelta').length;
  const aprobadas = lista.filter((s) => s.estado === 'aprobada').length;
  const completadas = lista.filter((s) => s.estado === 'completada').length;
  const pendientesAtencion = requierenCorreccion + lista.filter((s) => s.estado === 'borrador').length;

  const nombrePila = usuario.nombre.split(' ')[0] ?? usuario.nombre;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-ink">¡Hola, {nombrePila}! 👋</h1>
          <p className="mt-1 text-md text-ink-3">
            {pendientesAtencion > 0 ? (
              <>
                Tienes{' '}
                <strong className="text-primary">
                  {pendientesAtencion} solicitud{pendientesAtencion === 1 ? '' : 'es'}
                </strong>{' '}
                que {pendientesAtencion === 1 ? 'requiere' : 'requieren'} tu atención.
              </>
            ) : (
              'No tienes solicitudes pendientes de atención.'
            )}
          </p>
        </div>
        <Button asChild>
          <Link to={RUTAS.catalogo}>
            <Icono nombre="mas" />
            Nueva solicitud
          </Link>
        </Button>
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          etiqueta="En curso"
          valor={enCurso}
          icono="documento"
          fondoIcono="bg-warning-light"
          colorValor="text-warning"
          detalle="En proceso de revisión"
        />
        <StatCard
          etiqueta="Requieren corrección"
          valor={requierenCorreccion}
          icono="rotar"
          fondoIcono="bg-warning-soft"
          colorValor="text-warning"
          detalle={requierenCorreccion > 0 ? 'Acción requerida' : 'Sin pendientes'}
          detalleNegativo={requierenCorreccion > 0}
        />
        <StatCard
          etiqueta="Aprobadas"
          valor={aprobadas}
          icono="verificar"
          fondoIcono="bg-success-light"
          colorValor="text-success"
          detalle="Listas para completarse"
        />
        <StatCard
          etiqueta="Completadas"
          valor={completadas}
          icono="descargar"
          fondoIcono="bg-emerald-light"
          detalle="Documentos disponibles"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section aria-labelledby="titulo-solicitudes">
          <SectionHeader titulo={<span id="titulo-solicitudes">Mis solicitudes</span>}>
            <Button variante="ghost" tamano="sm" asChild>
              <Link to={RUTAS.catalogo}>Ver catálogo →</Link>
            </Button>
          </SectionHeader>

          <Card sinRelleno>
            {lista.length === 0 ? (
              <EmptyState
                icono="📄"
                titulo="Todavía no tienes solicitudes"
                descripcion="Explora el catálogo y elige el servicio que necesitas tramitar."
              >
                <Button asChild>
                  <Link to={RUTAS.catalogo}>Ver catálogo de servicios</Link>
                </Button>
              </EmptyState>
            ) : (
              <ul>
                {lista.map((solicitud) => (
                  <li key={solicitud.id}>
                    <FilaSolicitud
                      solicitud={solicitud}
                      icono={servicios.get(solicitud.servicioId)?.icono ?? '📄'}
                      nombreServicio={
                        servicios.get(solicitud.servicioId)?.nombre ?? solicitud.servicioId
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <aside className="flex flex-col gap-4">
          <Card>
            <SectionHeader titulo="Notificaciones" />
            <Notificaciones solicitudes={lista} />
          </Card>

          <Card className="bg-gradient-to-br from-shell to-shell-gradient">
            <p className="text-md font-semibold text-white">¿Necesitas ayuda?</p>
            <p className="mb-3.5 mt-1.5 text-sm text-white/60">
              Consulta el catálogo de servicios disponibles o contacta al Área de Ingenierías.
            </p>
            <Button variante="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link to={RUTAS.catalogo}>
                <Icono nombre="cuadricula" />
                Ver catálogo
              </Link>
            </Button>
          </Card>
        </aside>
      </div>
    </>
  );
}

function FilaSolicitud({
  solicitud,
  icono,
  nombreServicio,
}: {
  solicitud: Solicitud;
  icono: string;
  nombreServicio: string;
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
        </span>
      </span>
      <StatusBadge estado={solicitud.estado} />
      <Icono nombre="chevron" className="h-3.5 w-3.5 text-ink-4" />
    </Link>
  );
}

/** Deriva los avisos del historial real en lugar de mostrarlos codificados. */
function Notificaciones({ solicitudes }: { solicitudes: readonly Solicitud[] }) {
  const eventos = solicitudes
    .flatMap((solicitud) =>
      solicitud.historial
        .filter((entrada) => ['devuelta', 'aprobada', 'completada', 'rechazada'].includes(entrada.estadoNuevo))
        .map((entrada) => ({ solicitud, entrada })),
    )
    .sort((a, b) => b.entrada.fecha.localeCompare(a.entrada.fecha))
    .slice(0, 3);

  if (eventos.length === 0) {
    return <p className="py-4 text-center text-sm text-ink-3">No tienes avisos recientes.</p>;
  }

  const ESTILO: Record<string, { fondo: string; borde: string; titulo: string }> = {
    devuelta: { fondo: 'bg-primary-light', borde: 'border-l-primary', titulo: 'Solicitud devuelta' },
    aprobada: { fondo: 'bg-success-light', borde: 'border-l-success', titulo: 'Solicitud aprobada' },
    completada: {
      fondo: 'bg-emerald-light',
      borde: 'border-l-emerald',
      titulo: 'Documento disponible',
    },
    rechazada: { fondo: 'bg-danger-light', borde: 'border-l-danger', titulo: 'Solicitud rechazada' },
  };

  return (
    <ul className="flex flex-col gap-2.5">
      {eventos.map(({ solicitud, entrada }) => {
        const estilo = ESTILO[entrada.estadoNuevo] ?? {
          fondo: 'bg-canvas',
          borde: 'border-l-line-2',
          titulo: 'Actualización',
        };
        return (
          <li key={entrada.id}>
            <Link
              to={RUTAS.detalleSolicitud(solicitud.id)}
              className={`block rounded border-l-[3px] p-3 transition-opacity hover:opacity-80 ${estilo.fondo} ${estilo.borde}`}
            >
              <span className="block text-base font-semibold text-ink">{estilo.titulo}</span>
              <span className="mt-0.5 block text-sm text-ink-3">
                #{solicitud.id} — {entrada.comentario ?? 'Consulta el detalle de la solicitud.'}
              </span>
              <span className="mt-1 block text-xs text-ink-4">{tiempoRelativo(entrada.fecha)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
