import type { EstadoSolicitud } from '@/domain/types';

/** Qué se espera del estudiante en cada estado que requiere su atención. */
export const ACCION_PENDIENTE: Partial<Record<EstadoSolicitud, string>> = {
  devuelta: 'Corrige y vuelve a enviar',
  borrador: 'Completa y envía',
};
