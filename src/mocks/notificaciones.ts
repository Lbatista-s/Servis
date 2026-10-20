/**
 * Notificaciones de la API simulada, derivadas del historial de las
 * solicitudes: no se guardan aparte, sólo qué ha leído cada usuario.
 */

import { ETIQUETA_ROL, type Notificacion, type Usuario } from '@/domain/types';

import type { BaseSimulada } from './base';

/** Cuántas leídas se devuelven como máximo (las sin leer, siempre todas). */
const LIMITE_LEIDAS = 20;

const PARA_ESTUDIANTE: Partial<Record<string, (id: string) => string>> = {
  devuelta: (id) => `${id} fue devuelta para corrección`,
  aprobada: (id) => `${id} fue aprobada`,
  rechazada: (id) => `${id} fue rechazada`,
  completada: (id) => `${id} está completada: tu documento está listo`,
};

const PARA_PERSONAL: Partial<Record<string, (id: string, estudiante: string) => string>> = {
  enviada: (id, estudiante) => `Nueva solicitud ${id} de ${estudiante}`,
  corregida: (id, estudiante) => `${estudiante} corrigió la solicitud ${id}`,
};

export function notificacionesDe(base: BaseSimulada, usuario: Usuario): Notificacion[] {
  if (usuario.rol === 'administrador') return [];
  const leidas = new Set(base.leidas[usuario.id] ?? []);
  const nombreServicio = (id: string) => base.servicios.find((s) => s.id === id)?.nombre ?? id;
  const nombreUsuario = (id: string) => base.usuarios.find((u) => u.id === id)?.nombre ?? id;

  const avisos: Notificacion[] = [];
  for (const solicitud of base.solicitudes) {
    const propia = solicitud.solicitanteId === usuario.id;
    if (usuario.rol === 'estudiante' && !propia) continue;

    for (const entrada of solicitud.historial) {
      // Nadie recibe aviso de lo que hizo él mismo.
      if (entrada.autorId === usuario.id) continue;
      const titulo =
        usuario.rol === 'estudiante'
          ? PARA_ESTUDIANTE[entrada.estadoNuevo]?.(solicitud.id)
          : PARA_PERSONAL[entrada.estadoNuevo]?.(
              solicitud.id,
              nombreUsuario(solicitud.solicitanteId),
            );
      if (!titulo) continue;
      avisos.push({
        id: entrada.id,
        solicitudId: solicitud.id,
        titulo,
        detalle:
          usuario.rol === 'estudiante'
            ? `${nombreServicio(solicitud.servicioId)} · ${entrada.autorNombre} (${ETIQUETA_ROL[rolDe(base, entrada.autorId)]})`
            : nombreServicio(solicitud.servicioId),
        fecha: entrada.fecha,
        leida: leidas.has(entrada.id),
      });
    }
  }
  avisos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const leidasRecientes = new Set(
    avisos
      .filter((n) => n.leida)
      .slice(0, LIMITE_LEIDAS)
      .map((n) => n.id),
  );
  return avisos.filter((n) => !n.leida || leidasRecientes.has(n.id));
}

function rolDe(base: BaseSimulada, usuarioId: string) {
  return base.usuarios.find((u) => u.id === usuarioId)?.rol ?? 'personal_administrativo';
}

export function marcarLeidas(base: BaseSimulada, usuarioId: string, ids: readonly string[]): void {
  const actuales = new Set(base.leidas[usuarioId] ?? []);
  for (const id of ids) actuales.add(id);
  base.leidas[usuarioId] = [...actuales];
}
