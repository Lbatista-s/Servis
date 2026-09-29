/** Barra superior: título de la pantalla, búsqueda, avisos y menú de usuario. */

import { Badge, Button, Dropdown, Input, Layout } from 'antd';
import { AvatarUsuario, Icono, SelectorTema } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ETIQUETA_ROL } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';

import { useCerrarSesion } from './useCerrarSesion';

/**
 * Botones sobre el marco gris: contorno y texto blancos en ambos temas. Van
 * con prioridad porque Ant Design fija sus propios colores de botón.
 */
const BOTON_MARCO = '!border-white/60 !bg-transparent !text-white hover:!bg-white/10';

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
  const salir = useCerrarSesion();

  return (
    <Layout.Header
      // Mismo gris que la barra lateral: el marco de la aplicación es uno solo.
      className="flex shrink-0 items-center gap-3 shadow-s1 lg:gap-4"
      // El encabezado de Ant Design hereda un alto de línea igual a su altura.
      style={{ lineHeight: 'normal', paddingInline: 16 }}
    >
      <Button
        className={cn('lg:hidden', BOTON_MARCO)}
        aria-label="Abrir navegación"
        onClick={onAbrirMenu}
        icon={<Icono nombre="cuadricula" />}
      />

      <div className="min-w-0">
        <p className="truncate font-display text-xl font-semibold text-white">{titulo}</p>
        <p className="truncate text-sm text-white/90">{subtitulo}</p>
      </div>

      <div className="flex-1" />

      {/* Búsqueda global: decorativa en esta fase, igual que en el prototipo. */}
      <div aria-hidden="true" className="hidden w-56 xl:block">
        <Input
          readOnly
          tabIndex={-1}
          variant="borderless"
          placeholder="Buscar en SERVIS…"
          prefix={<Icono nombre="buscar" className="h-3.5 w-3.5 text-white" />}
          className="[&_input::placeholder]:!text-white/90"
          style={{ background: 'rgba(255,255,255,.14)' }}
        />
      </div>

      <SelectorTema />

      <Badge dot offset={[-6, 6]} className="hidden sm:inline-block">
        <Button
          className={BOTON_MARCO}
          aria-label="Notificaciones"
          icon={<Icono nombre="campana" />}
        />
      </Badge>

      {usuario ? (
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              {
                type: 'group',
                key: 'cuenta',
                label: ETIQUETA_ROL[usuario.rol],
                children: [{ key: 'correo', label: usuario.correo, disabled: true }],
              },
              { type: 'divider' },
              {
                key: 'salir',
                icon: <Icono nombre="salir" />,
                label: 'Cerrar sesión',
                onClick: salir,
              },
            ],
          }}
        >
          <Button
            shape="round"
            className={cn('flex shrink-0 items-center gap-2 pl-1', BOTON_MARCO)}
          >
            <AvatarUsuario usuario={usuario} tamano="sm" />
            <span className="hidden text-base font-medium sm:inline">{usuario.nombre}</span>
            <Icono nombre="chevronAbajo" className="h-3 w-3" />
          </Button>
        </Dropdown>
      ) : null}
    </Layout.Header>
  );
}
