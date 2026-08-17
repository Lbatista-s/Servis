/** Barra superior: título de la pantalla, búsqueda, avisos y menú de usuario. */

import { useNavigate } from 'react-router-dom';

import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icono,
} from '@/components/ui';
import { ETIQUETA_ROL } from '@/domain/types';
import { useAuth, useUsuarioActual } from '@/features/auth/authStore';

import { RUTAS } from './rutas';

export function Topbar({
  titulo,
  subtitulo,
  onAbrirMenu,
}: {
  titulo: string;
  subtitulo: string;
  /** Abre la navegación lateral en pantallas estrechas. */
  onAbrirMenu: () => void;
}) {
  const usuario = useUsuarioActual();
  const cerrarSesion = useAuth((estado) => estado.cerrarSesion);
  const navegar = useNavigate();

  function salir() {
    cerrarSesion();
    navegar(RUTAS.login, { replace: true });
  }

  return (
    <header className="flex h-topbar shrink-0 items-center gap-3 border-b border-line bg-surface px-4 shadow-s1 lg:gap-4 lg:px-7">
      <button
        type="button"
        aria-label="Abrir navegación"
        onClick={onAbrirMenu}
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded border border-line text-ink-2 lg:hidden"
      >
        <Icono nombre="cuadricula" />
      </button>

      <div className="min-w-0">
        <p className="truncate text-xl font-semibold text-ink">{titulo}</p>
        <p className="truncate text-sm text-ink-3">{subtitulo}</p>
      </div>

      <div className="flex-1" />

      {/* Búsqueda global: decorativa en esta fase, igual que en el prototipo. */}
      <div
        aria-hidden="true"
        className="hidden h-[34px] w-56 items-center gap-2 rounded border border-line bg-canvas px-3 text-base text-ink-3 xl:flex"
      >
        <Icono nombre="buscar" className="h-3.5 w-3.5 opacity-50" />
        <span>Buscar en SERVIS…</span>
      </div>

      <button
        type="button"
        aria-label="Notificaciones"
        className="relative hidden h-[34px] w-[34px] shrink-0 items-center justify-center rounded border border-line bg-surface text-ink-2 transition-colors hover:border-line-2 hover:bg-canvas sm:flex"
      >
        <Icono nombre="campana" />
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-surface bg-primary"
        />
      </button>

      {usuario ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 transition-colors hover:border-line-2 hover:bg-canvas"
            >
              <Avatar
                nombre={usuario.nombre}
                iniciales={usuario.iniciales}
                color={usuario.colorAvatar}
                tamano="sm"
              />
              <span className="hidden text-base font-medium text-ink sm:inline">
                {usuario.nombre}
              </span>
              <Icono nombre="chevronAbajo" className="h-3 w-3 text-ink-3" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{ETIQUETA_ROL[usuario.rol]}</DropdownMenuLabel>
            <DropdownMenuItem disabled className="text-ink-3">
              {usuario.correo}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={salir}>
              <Icono nombre="salir" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </header>
  );
}
