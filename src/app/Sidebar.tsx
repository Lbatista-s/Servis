/** Barra lateral: marca, navegación por rol (`Menu` de Ant Design), configuración y usuario. */

import { Badge, Menu, type MenuProps } from 'antd';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { AvatarUsuario, Icono, Logotipo, Tooltip } from '@/components/ui';
import { ETIQUETA_ROL } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';
import { ConfiguracionDialog } from '@/features/settings/ConfiguracionDialog';
import { useSolicitudes } from '@/hooks/useDatos';
import { COLORES_MARCA } from '@/theme/tokens';

import { claveActiva, NAVEGACION_POR_ROL } from './navegacion';
import { useCerrarSesion } from './useCerrarSesion';

const CLAVE_CONFIGURACION = 'configuracion';

export function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
  const usuario = useUsuarioActual();
  const salir = useCerrarSesion();
  const ubicacion = useLocation();
  const [configuracionAbierta, setConfiguracionAbierta] = useState(false);

  // Contadores de los distintivos de navegación.
  const { datos: pendientes } = useSolicitudes({
    estados: ['enviada', 'en_revision', 'corregida'],
  });
  const { datos: propias } = useSolicitudes(
    usuario?.rol === 'estudiante' ? { solicitanteId: usuario.id } : { solicitanteId: '—' },
  );

  if (!usuario) return null;

  const contadores = {
    solicitudesPendientes: pendientes?.length ?? 0,
    // Sólo lo que exige acción del estudiante, para que el distintivo coincida
    // con el mensaje del panel.
    misSolicitudesActivas: (propias ?? []).filter(
      (s) => s.estado === 'devuelta' || s.estado === 'borrador',
    ).length,
  };

  const elementos = NAVEGACION_POR_ROL[usuario.rol];

  const items: MenuProps['items'] = [
    {
      type: 'group',
      key: 'principal',
      label: 'Principal',
      children: elementos.map((elemento) => {
        const contador = elemento.contador ? contadores[elemento.contador] : 0;
        return {
          key: elemento.a,
          icon: <Icono nombre={elemento.icono} />,
          label: (
            <Link to={elemento.a} onClick={onNavegar}>
              {elemento.etiqueta}
            </Link>
          ),
          extra:
            contador > 0 ? (
              <Badge
                count={contador}
                size="small"
                color="#FFFFFF"
                // Distintivo blanco con cifra en Vino: se lee igual en ambos temas.
                style={{ color: COLORES_MARCA.vino, fontWeight: 700, boxShadow: 'none' }}
              />
            ) : undefined,
        };
      }),
    },
    {
      type: 'group',
      key: 'sistema',
      label: 'Sistema',
      children: [
        {
          key: CLAVE_CONFIGURACION,
          icon: <Icono nombre="engranaje" />,
          label: 'Configuración',
          onClick: () => setConfiguracionAbierta(true),
        },
      ],
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full w-sidebar shrink-0 flex-col overflow-y-auto bg-chrome"
    >
      {/* Marca */}
      <div className="mb-2 flex flex-col gap-1.5 border-b border-white/10 px-4 pb-4 pt-5">
        <Logotipo formato="compacto" version="negativo" alto={50} />
        <span className="text-2xs uppercase tracking-wider text-white/90">Área de Ingenierías</span>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[claveActiva(ubicacion.pathname, elementos)]}
        items={items}
        style={{ borderInlineEnd: 'none' }}
      />

      <ConfiguracionDialog
        abierto={configuracionAbierta}
        onCerrar={() => setConfiguracionAbierta(false)}
      />

      {/* Usuario activo */}
      <div className="mt-auto border-t border-white/10 p-2 pt-3">
        <div className="flex items-center gap-2.5 rounded px-2 py-2.5">
          <AvatarUsuario usuario={usuario} tamano="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white">{usuario.nombre}</p>
            <p className="truncate text-xs text-white/90">{ETIQUETA_ROL[usuario.rol]}</p>
          </div>
          <Tooltip contenido="Cerrar sesión">
            <button
              type="button"
              aria-label="Cerrar sesión"
              onClick={salir}
              className="rounded-sm p-1 text-white/90 transition-opacity hover:text-white"
            >
              <Icono nombre="salir" />
            </button>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}
