/**
 * Sesión activa.
 *
 * Delegada en `repositorios.auth`: en modo local la autenticación es simulada
 * (basta un correo de una cuenta activa); en modo `http` la valida Django. El
 * usuario se persiste para no pedir acceso en cada recarga, y en modo `http`
 * se vuelve a confirmar con el servidor al arrancar (`verificarSesion`).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { alCaducarSesion, fuenteActiva, repositorios } from '@/data';
import type { Actor, Rol, Usuario } from '@/domain/types';
import { mensajeDeError } from '@/hooks/useAsync';

interface EstadoAutenticacion {
  usuario: Usuario | null;
  cargando: boolean;
  error: string | null;
  iniciarSesion: (correo: string, contrasena?: string) => Promise<boolean>;
  /** Cambio rápido de cuenta; sólo existe en el modo de demostración. */
  iniciarSesionComo: (usuarioId: string) => Promise<boolean>;
  cerrarSesion: () => void;
  /** Confirma con el servidor que la sesión persistida sigue vigente. */
  verificarSesion: () => Promise<void>;
  limpiarError: () => void;
}

export const useAuth = create<EstadoAutenticacion>()(
  persist(
    (set, get) => ({
      usuario: null,
      cargando: false,
      error: null,

      async iniciarSesion(correo, contrasena = '') {
        set({ cargando: true, error: null });
        try {
          const usuario = await repositorios.auth.iniciarSesion(correo, contrasena);
          set({ usuario, cargando: false, error: null });
          return true;
        } catch (fallo) {
          set({ cargando: false, error: mensajeDeError(fallo) });
          return false;
        }
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
        void repositorios.auth.cerrarSesion();
      },

      async verificarSesion() {
        if (fuenteActiva() !== 'http' || !get().usuario) return;
        try {
          const usuario = await repositorios.auth.usuarioActual();
          set({ usuario });
        } catch {
          // Sin conexión no se descarta la sesión: el servidor decidirá en la
          // siguiente petición.
        }
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

// Si el servidor rechaza la sesión a mitad de uso, se vuelve al acceso.
alCaducarSesion(() => {
  if (useAuth.getState().usuario) {
    useAuth.setState({ usuario: null, error: 'Tu sesión expiró. Vuelve a iniciar sesión.' });
  }
});

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
