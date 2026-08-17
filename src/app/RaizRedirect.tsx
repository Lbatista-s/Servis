/** Envía a cada usuario a la pantalla inicial de su rol, o al acceso. */

import { Navigate } from 'react-router-dom';

import { useUsuarioActual } from '@/features/auth/authStore';

import { INICIO_POR_ROL, RUTAS } from './rutas';

export function RaizRedirect() {
  const usuario = useUsuarioActual();
  return <Navigate to={usuario ? INICIO_POR_ROL[usuario.rol] : RUTAS.login} replace />;
}
