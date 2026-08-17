/**
 * Hooks de acceso a datos.
 *
 * Los componentes consumen estos hooks y nunca los repositorios directamente.
 * Tras cualquier mutación se llama a `revalidar()`, lo que refresca todas las
 * consultas activas: es un caché mínimo pero suficiente para la demostración, y
 * sustituible por React Query sin tocar las pantallas.
 */

import { create } from 'zustand';

import { repositorios } from '@/data';
import type { FiltroServicios, FiltroSolicitudes, FiltroUsuarios } from '@/data/repositories/types';
import type { Servicio, Solicitud, Usuario } from '@/domain/types';

import { useAsync, type EstadoAsincrono } from './useAsync';

/** Contador global de revalidación: al incrementarse, todo se vuelve a leer. */
interface EstadoRevalidacion {
  version: number;
  revalidar: () => void;
}

export const useRevalidacion = create<EstadoRevalidacion>((set) => ({
  version: 0,
  revalidar: () => set((estado) => ({ version: estado.version + 1 })),
}));

/** Acción para invalidar el caché después de una mutación. */
export function useRevalidar(): () => void {
  return useRevalidacion((estado) => estado.revalidar);
}

// ─────────────────────────────────────────────────────────────────────────────
// Solicitudes
// ─────────────────────────────────────────────────────────────────────────────

export function useSolicitudes(filtro: FiltroSolicitudes = {}): EstadoAsincrono<Solicitud[]> {
  const version = useRevalidacion((estado) => estado.version);
  // El filtro se serializa para comparar por valor y no por identidad de objeto,
  // que cambiaría en cada render.
  const clave = JSON.stringify(filtro);
  return useAsync(() => repositorios.solicitudes.listar(filtro), [clave, version]);
}

export function useSolicitud(id: string | undefined): EstadoAsincrono<Solicitud | null> {
  const version = useRevalidacion((estado) => estado.version);
  return useAsync(
    () => (id ? repositorios.solicitudes.obtener(id) : Promise.resolve(null)),
    [id, version],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Servicios
// ─────────────────────────────────────────────────────────────────────────────

export function useServicios(filtro: FiltroServicios = {}): EstadoAsincrono<Servicio[]> {
  const version = useRevalidacion((estado) => estado.version);
  const clave = JSON.stringify(filtro);
  return useAsync(() => repositorios.servicios.listar(filtro), [clave, version]);
}

export function useServicio(id: string | undefined): EstadoAsincrono<Servicio | null> {
  const version = useRevalidacion((estado) => estado.version);
  return useAsync(
    () => (id ? repositorios.servicios.obtener(id) : Promise.resolve(null)),
    [id, version],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Usuarios
// ─────────────────────────────────────────────────────────────────────────────

export function useUsuarios(filtro: FiltroUsuarios = {}): EstadoAsincrono<Usuario[]> {
  const version = useRevalidacion((estado) => estado.version);
  const clave = JSON.stringify(filtro);
  return useAsync(() => repositorios.usuarios.listar(filtro), [clave, version]);
}

/**
 * Índice de usuarios por identificador, para resolver nombres sin lanzar una
 * consulta por cada fila de una tabla.
 */
export function useIndiceUsuarios(): Map<string, Usuario> {
  const { datos } = useUsuarios();
  return new Map((datos ?? []).map((usuario) => [usuario.id, usuario]));
}

/** Índice de servicios por identificador, con el mismo propósito. */
export function useIndiceServicios(): Map<string, Servicio> {
  const { datos } = useServicios();
  return new Map((datos ?? []).map((servicio) => [servicio.id, servicio]));
}
