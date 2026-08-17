/**
 * Armazón de las pantallas autenticadas.
 *
 * En escritorio la barra lateral es fija; por debajo de `lg` se convierte en un
 * panel deslizante que se cierra al navegar.
 */

import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { cn } from '@/lib/utils';

import { DevRoleSwitcher } from './DevRoleSwitcher';
import { Sidebar } from './Sidebar';
import { TITULOS } from './navegacion';
import { Topbar } from './Topbar';

/** Resuelve el título de la barra superior, admitiendo rutas con parámetros. */
function titulosDe(ruta: string): { titulo: string; subtitulo: string } {
  if (TITULOS[ruta]) return TITULOS[ruta];
  if (ruta.startsWith('/solicitudes/nueva')) {
    return { titulo: 'Nueva solicitud', subtitulo: 'Completa el formulario por pasos' };
  }
  if (ruta.startsWith('/solicitudes/')) {
    return { titulo: 'Detalle de la solicitud', subtitulo: 'Seguimiento del trámite' };
  }
  if (ruta.startsWith('/bandeja/')) {
    return { titulo: 'Revisión de solicitud', subtitulo: 'Acciones del personal administrativo' };
  }
  return { titulo: 'SERVIS', subtitulo: 'Servicios institucionales' };
}

export function AppLayout() {
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { titulo, subtitulo } = titulosDe(ubicacion.pathname);

  // El panel lateral se cierra automáticamente al cambiar de pantalla.
  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <DevRoleSwitcher />

      <div className="flex min-h-0 flex-1">
        {/* Barra lateral fija en escritorio */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Panel deslizante en pantallas estrechas */}
        {menuAbierto ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Cerrar navegación"
              className="absolute inset-0 bg-ink/50"
              onClick={() => setMenuAbierto(false)}
            />
            <div className="absolute inset-y-0 left-0 animate-overlay-in">
              <Sidebar onNavegar={() => setMenuAbierto(false)} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar titulo={titulo} subtitulo={subtitulo} onAbrirMenu={() => setMenuAbierto(true)} />
          <main className={cn('flex-1 overflow-y-auto bg-canvas p-4 lg:p-7')}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
