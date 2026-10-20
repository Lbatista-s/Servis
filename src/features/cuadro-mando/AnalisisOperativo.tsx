/**
 * Análisis operativo: el seguimiento del día a día de la cola (volumen por
 * servicio, distribución por estado, carga del personal).
 *
 * Es la antigua pantalla de reportes. Kaplan y Norton distinguen este tablero
 * operativo del cuadro de mando estratégico, así que vive en su propia pestaña.
 * Las cifras se calculan sobre las solicitudes reales, no valores codificados.
 */

import {
  AvatarUsuario,
  BarChart,
  Card,
  Loading,
  Progress,
  Separator,
  SectionHeader,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import { ESTADOS, type EstadoSolicitud, type Solicitud } from '@/domain/types';
import { useIndiceServicios, useIndiceUsuarios, useSolicitudes } from '@/hooks/useDatos';

/** Días transcurridos entre el envío y la resolución de una solicitud. */
function diasDeResolucion(solicitud: Solicitud): number | null {
  const resolucion = solicitud.historial.find((entrada) =>
    ['aprobada', 'rechazada', 'completada'].includes(entrada.estadoNuevo),
  );
  if (!resolucion || !solicitud.enviadaEn) return null;

  const transcurrido =
    new Date(resolucion.fecha).getTime() - new Date(solicitud.enviadaEn).getTime();
  return transcurrido / (1000 * 60 * 60 * 24);
}

export function AnalisisOperativo() {
  const { datos: solicitudes, cargando } = useSolicitudes();
  const servicios = useIndiceServicios();
  const usuarios = useIndiceUsuarios();

  if (cargando) return <Loading mensaje="Calculando métricas…" />;

  const lista = solicitudes ?? [];
  const total = lista.length;

  // Tasa de aprobación sobre las solicitudes ya resueltas.
  const resueltas = lista.filter((s) => ['aprobada', 'rechazada', 'completada'].includes(s.estado));
  const favorables = resueltas.filter((s) => s.estado !== 'rechazada').length;
  const tasaAprobacion =
    resueltas.length > 0 ? Math.round((favorables / resueltas.length) * 100) : 0;

  const tiempos = lista.map(diasDeResolucion).filter((d): d is number => d !== null);
  const tiempoPromedio =
    tiempos.length > 0 ? (tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(1) : '—';

  const pendientes = lista.filter((s) =>
    ['enviada', 'en_revision', 'devuelta', 'corregida'].includes(s.estado),
  ).length;

  // Solicitudes por servicio, de mayor a menor.
  const porServicio = [...servicios.values()]
    .map((servicio) => ({
      etiqueta: servicio.nombre,
      valor: lista.filter((s) => s.servicioId === servicio.id).length,
    }))
    .filter((dato) => dato.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  // Distribución por estado, omitiendo los estados sin ninguna solicitud.
  const porEstado = ESTADOS.map((estado) => ({
    estado,
    cantidad: lista.filter((s) => s.estado === estado).length,
  })).filter((dato) => dato.cantidad > 0);

  const maximoEstado = Math.max(1, ...porEstado.map((d) => d.cantidad));

  // Responsables ordenados por número de intervenciones en el historial.
  const intervenciones = new Map<string, number>();
  for (const solicitud of lista) {
    for (const entrada of solicitud.historial) {
      const autor = usuarios.get(entrada.autorId);
      if (!autor || autor.rol === 'estudiante') continue;
      intervenciones.set(entrada.autorId, (intervenciones.get(entrada.autorId) ?? 0) + 1);
    }
  }
  const responsables = [...intervenciones.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([usuarioId, cantidad]) => ({ usuario: usuarios.get(usuarioId), cantidad }));

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard etiqueta="Total de solicitudes" valor={total} detalle="En el sistema" />
        <StatCard
          etiqueta="Tiempo promedio de respuesta"
          valor={
            <>
              {tiempoPromedio}{' '}
              <span className="text-2xl font-normal">{tiempoPromedio === '—' ? '' : 'días'}</span>
            </>
          }
          detalle={`Sobre ${tiempos.length} solicitud(es) resueltas`}
        />
        <StatCard
          etiqueta="Tasa de aprobación"
          valor={`${tasaAprobacion}%`}
          tono="success"
          detalle={`${favorables} de ${resueltas.length} resueltas`}
        />
        <StatCard
          etiqueta="Pendientes de acción"
          valor={pendientes}
          tono="warning"
          detalle={pendientes > 0 ? 'Acción requerida' : 'Sin pendientes'}
          detalleNegativo={pendientes > 0}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <SectionHeader titulo="Solicitudes por servicio" />
          {porServicio.length === 0 ? (
            <p className="text-base text-ink-3">Todavía no hay solicitudes registradas.</p>
          ) : (
            <BarChart datos={porServicio} sufijo="solicitudes" />
          )}
        </Card>

        <Card>
          <SectionHeader titulo="Distribución por estado" />
          <ul className="flex flex-col gap-2">
            {porEstado.map(({ estado, cantidad }) => (
              <li key={estado} className="flex items-center gap-2.5 text-base">
                <span className="w-28 shrink-0">
                  <StatusBadge estado={estado as EstadoSolicitud} />
                </span>
                <span className="flex-1" aria-hidden="true">
                  <Progress valor={(cantidad / maximoEstado) * 100} />
                </span>
                <span className="w-7 text-right font-semibold">{cantidad}</span>
              </li>
            ))}
          </ul>

          <Separator />

          <SectionHeader titulo="Responsables más activos" />
          {responsables.length === 0 ? (
            <p className="text-base text-ink-3">Sin intervenciones registradas.</p>
          ) : (
            <ul>
              {responsables.map(({ usuario, cantidad }) =>
                usuario ? (
                  <li
                    key={usuario.id}
                    className="flex items-center gap-2.5 border-b border-line py-2 text-base last:border-b-0"
                  >
                    <AvatarUsuario usuario={usuario} tamano="md" />
                    <span>
                      <span className="block font-medium">{usuario.nombre}</span>
                      <span className="block text-xs text-ink-3">
                        {cantidad} {cantidad === 1 ? 'intervención' : 'intervenciones'}
                      </span>
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
