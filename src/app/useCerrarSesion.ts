/** Cierra la sesión y lleva a la pantalla de acceso sin dejar historial. */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/authStore';

import { RUTAS } from './rutas';

export function useCerrarSesion(): () => void {
  const cerrarSesion = useAuth((estado) => estado.cerrarSesion);
  const navegar = useNavigate();

  return useCallback(() => {
    cerrarSesion();
    navegar(RUTAS.login, { replace: true });
  }, [cerrarSesion, navegar]);
}
