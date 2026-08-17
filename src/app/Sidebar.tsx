/** Barra lateral: marca, navegación por rol, configuración y usuario activo. */

import { NavLink, useNavigate } from 'react-router-dom';

import {
  Avatar,
  Icono,
  Tooltip,
} from '@/components/ui';
import { useAuth, useUsuarioActual } from '@/features/auth/authStore';
import { ConfiguracionDialog } from '@/features/settings/ConfiguracionDialog';
import { useSolicitudes } from '@/hooks/useDatos';
import { ETIQUETA_ROL } from '@/domain/types';
import { cn } from '@/lib/utils';

import { NAVEGACION_POR_ROL } from './navegacion';
import { RUTAS } from './rutas';

export function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
  const usuario = useUsuarioActual();
  const cerrarSesion = useAuth((estado) => estado.cerrarSesion);
  const navegar = useNavigate();

  // Contadores de los distintivos de navegación.
  const { datos: pendientes } = useSolicitudes({ estados: ['enviada', 'en_revision', 'corregida'] });
  const { datos: propias } = useSolicitudes(
    usuario?.rol === 'estudiante' ? { solicitanteId: usuario.id } : { solicitanteId: '—' },
  );

  if (!usuario) return null;

  const contadores = {
    solicitudesPendientes: pendientes?.length ?? 0,
    misSolicitudesActivas: (propias ?? []).filter(
      (s) => s.estado === 'devuelta' || s.estado === 'en_revision',
    ).length,
  };

  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full w-sidebar shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] bg-shell"
    >
      {/* Marca */}
      <div className="mb-2 flex items-center gap-2.5 border-b border-white/[0.07] px-4 pb-4 pt-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary">
          <Icono nombre="documento" className="h-5 w-5 text-white" />
        </span>
        <span className="flex flex-col">
          <span className="text-lg font-bold leading-tight text-white">SERVIS</span>
          <span className="text-2xs uppercase tracking-wider text-white/40">INTEC · Ingenierías</span>
        </span>
      </div>

      <p className="px-4 pb-1 pt-3 text-2xs font-semibold uppercase tracking-widest text-white/[0.28]">
        Principal
      </p>

      <ul className="flex flex-col">
        {NAVEGACION_POR_ROL[usuario.rol].map((elemento) => {
          const contador = elemento.contador ? contadores[elemento.contador] : 0;
          return (
            <li key={elemento.a}>
              <NavLink
                to={elemento.a}
                onClick={onNavegar}
                className={({ isActive }) =>
                  cn(
                    'relative mx-2 my-px flex items-center gap-2.5 rounded border border-transparent',
                    'py-2.5 pl-3.5 pr-3 text-base font-medium transition-all',
                    isActive
                      ? 'border-primary/30 bg-primary/[0.15] text-white'
                      : 'text-white/55 hover:bg-white/[0.06] hover:text-white/85',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute -left-2 top-1/2 h-3/5 w-[3px] -translate-y-1/2 rounded-r-sm bg-primary"
                      />
                    ) : null}
                    <Icono nombre={elemento.icono} className={cn(isActive ? 'opacity-100' : 'opacity-80')} />
                    <span className="flex-1">{elemento.etiqueta}</span>
                    {contador > 0 ? (
                      <span className="min-w-[18px] rounded-full bg-primary px-1.5 text-center text-2xs font-bold text-white">
                        {contador}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>

      <p className="px-4 pb-1 pt-5 text-2xs font-semibold uppercase tracking-widest text-white/[0.28]">
        Sistema
      </p>
      <div className="mx-2">
        <ConfiguracionDialog />
      </div>

      {/* Usuario activo */}
      <div className="mt-auto border-t border-white/[0.07] p-2 pt-3">
        <div className="flex items-center gap-2.5 rounded px-2 py-2.5">
          <Avatar
            nombre={usuario.nombre}
            iniciales={usuario.iniciales}
            color={usuario.colorAvatar}
            tamano="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white">{usuario.nombre}</p>
            <p className="truncate text-xs text-white/40">{ETIQUETA_ROL[usuario.rol]}</p>
          </div>
          <Tooltip contenido="Cerrar sesión">
            <button
              type="button"
              aria-label="Cerrar sesión"
              onClick={() => {
                cerrarSesion();
                navegar(RUTAS.login, { replace: true });
              }}
              className="rounded-sm p-1 text-white/60 opacity-60 transition-opacity hover:opacity-100"
            >
              <Icono nombre="salir" />
            </button>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}
