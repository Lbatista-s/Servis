/**
 * Guardas de ruta.
 *
 * `RequireAuth` exige sesión iniciada; `RequireRole` exige además que el rol
 * activo figure entre los permitidos. A quien no cumple no se le muestra un
 * error: se le devuelve a la pantalla inicial de su propio rol.
 */

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { INICIO_POR_ROL, RUTAS } from '@/app/rutas';
import type { Rol } from '@/domain/types';

import { useUsuarioActual } from './authStore';

export function RequireAuth({ children }: { children: ReactNode }) {
  const usuario = useUsuarioActual();
  const ubicacion = useLocation();

  if (!usuario) {
    // Se recuerda el destino para volver a él tras iniciar sesión.
    return <Navigate to={RUTAS.login} state={{ desde: ubicacion.pathname }} replace />;
  }

  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: readonly Rol[]; children: ReactNode }) {
  const usuario = useUsuarioActual();
  const ubicacion = useLocation();

  if (!usuario) {
    return <Navigate to={RUTAS.login} state={{ desde: ubicacion.pathname }} replace />;
  }

  if (!roles.includes(usuario.rol)) {
    return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />;
  }

  return <>{children}</>;
}
