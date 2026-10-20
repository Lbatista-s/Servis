/**
 * Hooks de acceso a datos, sobre TanStack Query.
 *
 * Los componentes consumen estos hooks y nunca los repositorios directamente
 * para leer. Cada consulta tiene una clave que empieza por su recurso
 * (`['solicitudes', …]`), de modo que tras una escritura basta con invalidar
 * ese recurso: `useRevalidar()('solicitudes')`.
 */

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { repositorios } from '@/data';
import type { FiltroServicios, FiltroSolicitudes, FiltroUsuarios } from '@/data/repositories/types';
import type { Metas } from '@/domain/indicadores/definiciones';
import type { Notificacion, Servicio, Solicitud, Usuario } from '@/domain/types';
import { mensajeDeError } from '@/lib/errores';

import { RECURSOS, type Recurso } from './clienteConsultas';

export interface EstadoAsincrono<T> {
  datos: T | null;
  /** Primera carga (sin datos todavía). Las recargas en segundo plano no cuentan. */
  cargando: boolean;
  error: string | null;
  /** Vuelve a ejecutar la consulta. */
  recargar: () => void;
}

/** Adapta el resultado de `useQuery` a la forma que usan las pantallas. */
function estado<T>(consulta: UseQueryResult<T>, porDefecto: T | null = null): EstadoAsincrono<T> {
  return {
    datos: consulta.data ?? porDefecto,
    cargando: consulta.isLoading,
    error: consulta.error ? mensajeDeError(consulta.error) : null,
    recargar: () => void consulta.refetch(),
  };
}

/**
 * Invalida la caché tras una escritura. Sin argumentos, todos los recursos;
 * con ellos, sólo los indicados.
 */
export function useRevalidar(): (...recursos: Recurso[]) => void {
  const cliente = useQueryClient();
  return useCallback(
    (...recursos: Recurso[]) => {
      const afectados = new Set(recursos.length > 0 ? recursos : RECURSOS);
      // Las notificaciones salen del historial: cambian con las solicitudes.
      if (afectados.has('solicitudes')) afectados.add('notificaciones');
      for (const recurso of afectados) {
        void cliente.invalidateQueries({ queryKey: [recurso] });
      }
    },
    [cliente],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Solicitudes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `habilitado = false` no consulta nada y devuelve una lista vacía. Al cambiar
 * el filtro se sigue mostrando el resultado anterior hasta que llega el nuevo.
 */
export function useSolicitudes(
  filtro: FiltroSolicitudes = {},
  habilitado = true,
): EstadoAsincrono<Solicitud[]> {
  const consulta = useQuery({
    queryKey: ['solicitudes', 'lista', filtro],
    queryFn: () => repositorios.solicitudes.listar(filtro),
    enabled: habilitado,
    placeholderData: keepPreviousData,
  });
  return estado(consulta, habilitado ? null : []);
}

export function useSolicitud(id: string | undefined): EstadoAsincrono<Solicitud | null> {
  return estado(
    useQuery({
      queryKey: ['solicitudes', 'detalle', id],
      queryFn: () => repositorios.solicitudes.obtener(id ?? ''),
      enabled: Boolean(id),
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Servicios
// ─────────────────────────────────────────────────────────────────────────────

export function useServicios(filtro: FiltroServicios = {}): EstadoAsincrono<Servicio[]> {
  return estado(
    useQuery({
      queryKey: ['servicios', 'lista', filtro],
      queryFn: () => repositorios.servicios.listar(filtro),
      placeholderData: keepPreviousData,
    }),
  );
}

export function useServicio(id: string | undefined): EstadoAsincrono<Servicio | null> {
  return estado(
    useQuery({
      queryKey: ['servicios', 'detalle', id],
      queryFn: () => repositorios.servicios.obtener(id ?? ''),
      enabled: Boolean(id),
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Usuarios
// ─────────────────────────────────────────────────────────────────────────────

export function useUsuarios(filtro: FiltroUsuarios = {}): EstadoAsincrono<Usuario[]> {
  return estado(
    useQuery({
      queryKey: ['usuarios', 'lista', filtro],
      queryFn: () => repositorios.usuarios.listar(filtro),
      placeholderData: keepPreviousData,
    }),
  );
}

/**
 * Índice de usuarios por identificador, para resolver nombres sin lanzar una
 * consulta por cada fila de una tabla.
 */
export function useIndiceUsuarios(): Map<string, Usuario> {
  const { datos } = useUsuarios();
  return useMemo(() => new Map((datos ?? []).map((usuario) => [usuario.id, usuario])), [datos]);
}

/** Índice de servicios por identificador, con el mismo propósito. */
export function useIndiceServicios(): Map<string, Servicio> {
  const { datos } = useServicios();
  return useMemo(() => new Map((datos ?? []).map((servicio) => [servicio.id, servicio])), [datos]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cuadro de mando
// ─────────────────────────────────────────────────────────────────────────────

export function useMetas(): EstadoAsincrono<Metas> {
  return estado(useQuery({ queryKey: ['metas'], queryFn: () => repositorios.metas.obtener() }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Notificaciones
// ─────────────────────────────────────────────────────────────────────────────

/** Se consultan de nuevo cada minuto mientras la aplicación está abierta. */
export function useNotificaciones(): EstadoAsincrono<Notificacion[]> {
  return estado(
    useQuery({
      queryKey: ['notificaciones'],
      queryFn: () => repositorios.notificaciones.listar(),
      refetchInterval: 60_000,
    }),
  );
}
