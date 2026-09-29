/** Historial de una solicitud, renderizado como línea de tiempo. */

import { Timeline, type HitoTimeline } from '@/components/ui';
import { esEstadoFinal } from '@/domain/requestStateMachine';
import { ETIQUETA_ESTADO, type EntradaHistorial, type Solicitud } from '@/domain/types';
import { formatearFechaHora } from '@/lib/format';

/** Descripción legible de cada hito, en función del estado alcanzado. */
function descripcionDe(entrada: EntradaHistorial): string {
  switch (entrada.estadoNuevo) {
    case 'borrador':
      return 'La solicitud fue creada.';
    case 'enviada':
      return 'La solicitud fue enviada para revisión.';
    case 'en_revision':
      return `El personal administrativo está revisando la solicitud.`;
    case 'devuelta':
      return 'La solicitud fue devuelta para corrección.';
    case 'corregida':
      return 'El estudiante envió las correcciones solicitadas.';
    case 'aprobada':
      return 'La solicitud fue aprobada.';
    case 'rechazada':
      return 'La solicitud fue rechazada.';
    case 'completada':
      return 'El trámite se completó y el documento está disponible.';
    case 'cancelada':
      return 'La solicitud fue cancelada.';
    default:
      return '';
  }
}

export function HistorialTimeline({ solicitud }: { solicitud: Solicitud }) {
  const entradas = solicitud.historial;
  const finalizada = esEstadoFinal(solicitud.estado);

  const hitos: HitoTimeline[] = entradas.map((entrada, indice) => ({
    clave: entrada.id,
    // El último hito de una solicitud viva es el estado actual.
    estado: indice === entradas.length - 1 && !finalizada ? 'activo' : 'completado',
    titulo: ETIQUETA_ESTADO[entrada.estadoNuevo],
    cuando: `${formatearFechaHora(entrada.fecha)} · ${entrada.autorNombre}`,
    descripcion: descripcionDe(entrada),
    comentario: entrada.comentario,
  }));

  // Hito pendiente: sólo mientras la solicitud siga en curso.
  if (!finalizada) {
    hitos.push({
      clave: 'pendiente',
      estado: 'pendiente',
      titulo: siguienteHito(solicitud),
      cuando: 'Pendiente',
    });
  }

  return <Timeline hitos={hitos} />;
}

/** Texto del siguiente hito esperable según el estado actual. */
function siguienteHito(solicitud: Solicitud): string {
  switch (solicitud.estado) {
    case 'borrador':
      return 'Pendiente de envío';
    case 'enviada':
      return 'Pendiente de revisión';
    case 'en_revision':
      return 'Pendiente de aprobación';
    case 'devuelta':
      return 'Pendiente de corrección';
    case 'corregida':
      return 'Pendiente de nueva revisión';
    case 'aprobada':
      return 'Pendiente de emisión del documento';
    default:
      return 'Pendiente';
  }
}
