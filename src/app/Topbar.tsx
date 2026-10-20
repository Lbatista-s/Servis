/**
 * Barra superior: título de la pantalla, tema, avisos y el menú de perfil,
 * que es el único control de la cuenta (configuración y cierre de sesión).
 */

import { Button, Dropdown, Layout } from 'antd';
import { useState } from 'react';

import { AvatarUsuario, Icono, SelectorTema } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ETIQUETA_ROL } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';
import { ConfiguracionDialog } from '@/features/settings/ConfiguracionDialog';

import { CampanaNotificaciones } from './CampanaNotificaciones';
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
  const [configuracionAbierta, setConfiguracionAbierta] = useState(false);

  return (
    <Layout.Header
      // Mismo gris que la barra lateral: el marco de la aplicación es uno solo.
      className="flex shrink-0 items-center gap-3 shadow-s1 lg:gap-4"
      // El encabezado de Ant Design hereda un alto de línea igual a su altura.
      style={{ lineHeight: 'normal', paddingInline: 16 }}
    >
      {/* Sobre componentes de Ant Design, las utilidades de visibilidad llevan
          `!`: con `hashPriority="high"` su `display` ganaría a Tailwind. */}
      <Button
        className={cn('lg:!hidden', BOTON_MARCO)}
        aria-label="Abrir navegación"
        onClick={onAbrirMenu}
        icon={<Icono nombre="cuadricula" />}
      />

      <div className="min-w-0">
        <p className="truncate font-display text-xl font-semibold text-white">{titulo}</p>
        <p className="truncate text-sm text-white/90">{subtitulo}</p>
      </div>

      <div className="flex-1" />

      <SelectorTema />

      {/* El administrador no participa en el flujo de solicitudes: no recibe avisos. */}
      {usuario && usuario.rol !== 'administrador' ? (
        <CampanaNotificaciones className={BOTON_MARCO} />
      ) : null}

      {usuario ? (
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              {
                key: 'cuenta',
                disabled: true,
                className: '!cursor-default',
                label: (
                  <span className="block py-0.5">
                    <span className="block font-semibold text-ink">{usuario.nombre}</span>
                    <span className="block text-sm text-ink-3">{ETIQUETA_ROL[usuario.rol]}</span>
                    <span className="block text-sm text-ink-3">{usuario.correo}</span>
                  </span>
                ),
              },
              { type: 'divider' },
              {
                key: 'configuracion',
                icon: <Icono nombre="engranaje" />,
                label: 'Configuración',
                onClick: () => setConfiguracionAbierta(true),
              },
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
            aria-label={`Cuenta de ${usuario.nombre}`}
            className={cn('flex shrink-0 items-center gap-2 pl-1', BOTON_MARCO)}
          >
            <AvatarUsuario usuario={usuario} tamano="sm" />
            <span className="hidden text-base font-medium sm:inline">{usuario.nombre}</span>
            <Icono nombre="chevronAbajo" className="h-3 w-3" />
          </Button>
        </Dropdown>
      ) : null}

      <ConfiguracionDialog
        abierto={configuracionAbierta}
        onCerrar={() => setConfiguracionAbierta(false)}
      />
    </Layout.Header>
  );
}
