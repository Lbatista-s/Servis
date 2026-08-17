/**
 * Sesión activa.
 *
 * La autenticación es simulada a propósito: el prototipo no contempla
 * contraseñas reales y el sistema todavía no tiene backend. El selector de la
 * pantalla de acceso fija el usuario y, con él, el rol activo. La forma del
 * store no cambiará cuando exista autenticación real: bastará con que
 * `iniciarSesion` llame a la API en lugar de al repositorio local.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { repositorios } from '@/data';
import type { Actor, Rol, Usuario } from '@/domain/types';

interface EstadoAutenticacion {
  usuario: Usuario | null;
  cargando: boolean;
  error: string | null;
  iniciarSesion: (correo: string) => Promise<boolean>;
  iniciarSesionComo: (usuarioId: string) => Promise<boolean>;
  cerrarSesion: () => void;
  limpiarError: () => void;
}

export const useAuth = create<EstadoAutenticacion>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: false,
      error: null,

      async iniciarSesion(correo) {
        set({ cargando: true, error: null });
        const usuario = await repositorios.usuarios.obtenerPorCorreo(correo);

        if (!usuario) {
          set({ cargando: false, error: 'No existe ningún usuario con ese correo institucional.' });
          return false;
        }
        if (!usuario.activo) {
          set({
            cargando: false,
            error: 'Esta cuenta está desactivada. Contacta al administrador del sistema.',
          });
          return false;
        }

        set({ usuario, cargando: false, error: null });
        return true;
      },

      async iniciarSesionComo(usuarioId) {
        set({ cargando: true, error: null });
        const usuario = await repositorios.usuarios.obtener(usuarioId);

        if (!usuario) {
          set({ cargando: false, error: 'El usuario seleccionado ya no existe.' });
          return false;
        }

        set({ usuario, cargando: false, error: null });
        return true;
      },

      cerrarSesion() {
        set({ usuario: null, error: null });
      },

      limpiarError() {
        set({ error: null });
      },
    }),
    {
      name: 'servis:sesion',
      // Sólo se persiste el usuario; los estados de carga y error son efímeros.
      partialize: (estado) => ({ usuario: estado.usuario }),
    },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Selectores auxiliares
// ─────────────────────────────────────────────────────────────────────────────

/** Convierte la sesión en el `Actor` que espera la capa de dominio. */
export function useActor(): Actor | null {
  const usuario = useAuth((estado) => estado.usuario);
  if (!usuario) return null;
  return { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
}

export function useUsuarioActual(): Usuario | null {
  return useAuth((estado) => estado.usuario);
}

export function useRol(): Rol | null {
  return useAuth((estado) => estado.usuario?.rol ?? null);
}
