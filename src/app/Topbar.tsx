/** Barra superior: título de la pantalla, búsqueda, avisos y menú de usuario. */

import { Badge, Button, Dropdown, Input, Layout } from 'antd';
import { AvatarUsuario, Icono } from '@/components/ui';
import { ETIQUETA_ROL } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';

import { useCerrarSesion } from './useCerrarSesion';

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
      className="flex shrink-0 items-center gap-3 border-b border-line shadow-s1 lg:gap-4"
      // El encabezado de Ant Design hereda un alto de línea igual a su altura.
      style={{ lineHeight: 'normal', paddingInline: 16 }}
    >
      <Button
        className="lg:hidden"
        aria-label="Abrir navegación"
        onClick={onAbrirMenu}
        icon={<Icono nombre="cuadricula" />}
      />

      <div className="min-w-0">
        <p className="truncate font-display text-xl font-semibold text-ink">{titulo}</p>
        <p className="truncate text-sm text-ink-3">{subtitulo}</p>
      </div>

      <div className="flex-1" />

      {/* Búsqueda global: decorativa en esta fase, igual que en el prototipo. */}
      <div aria-hidden="true" className="hidden w-56 xl:block">
        <Input
          readOnly
          tabIndex={-1}
          placeholder="Buscar en SERVIS…"
          prefix={<Icono nombre="buscar" className="h-3.5 w-3.5 text-ink-3" />}
        />
      </div>

      <Badge dot offset={[-6, 6]} className="hidden sm:inline-block">
        <Button aria-label="Notificaciones" icon={<Icono nombre="campana" />} />
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
          <Button shape="round" className="flex shrink-0 items-center gap-2 pl-1">
            <AvatarUsuario usuario={usuario} tamano="sm" />
            <span className="hidden text-base font-medium text-ink sm:inline">
              {usuario.nombre}
            </span>
            <Icono nombre="chevronAbajo" className="h-3 w-3 text-ink-3" />
          </Button>
        </Dropdown>
      ) : null}
    </Layout.Header>
  );
}
