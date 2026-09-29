/** Barra lateral: marca, navegación por rol (`Menu` de Ant Design), configuración y usuario. */

import { Badge, Menu, type MenuProps } from 'antd';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Avatar, Icono, Tooltip } from '@/components/ui';
import { ETIQUETA_ROL } from '@/domain/types';
import { useAuth, useUsuarioActual } from '@/features/auth/authStore';
import { ConfiguracionDialog } from '@/features/settings/ConfiguracionDialog';
import { useSolicitudes } from '@/hooks/useDatos';
import { COLORES } from '@/theme/tokens';

import { NAVEGACION_POR_ROL, type ElementoNavegacion } from './navegacion';
import { RUTAS } from './rutas';

const CLAVE_CONFIGURACION = 'configuracion';

/** Entrada del menú que corresponde a la ruta actual, incluidas las de detalle. */
function claveActiva(ruta: string, elementos: readonly ElementoNavegacion[]): string {
  if (ruta.startsWith('/solicitudes/nueva')) return RUTAS.catalogo;
  if (ruta.startsWith('/solicitudes/')) return RUTAS.inicio;
  return elementos.find((e) => ruta === e.a || ruta.startsWith(`${e.a}/`))?.a ?? '';
}

export function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
  const usuario = useUsuarioActual();
  const cerrarSesion = useAuth((estado) => estado.cerrarSesion);
  const navegar = useNavigate();
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
                style={{ color: COLORES.primary.dark, fontWeight: 700, boxShadow: 'none' }}
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
      className="flex h-full w-sidebar shrink-0 flex-col overflow-y-auto bg-shell"
    >
      {/* Marca */}
      <div className="mb-2 flex items-center gap-2.5 border-b border-white/[0.07] px-4 pb-4 pt-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary">
          <Icono nombre="documento" className="h-5 w-5 text-white" />
        </span>
        <span className="flex flex-col">
          <span className="font-display text-lg font-bold leading-tight text-white">SERVIS</span>
          <span className="text-2xs uppercase tracking-wider text-white/60">
            INTEC · Ingenierías
          </span>
        </span>
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
            <p className="truncate text-xs text-white/60">{ETIQUETA_ROL[usuario.rol]}</p>
          </div>
          <Tooltip contenido="Cerrar sesión">
            <button
              type="button"
              aria-label="Cerrar sesión"
              onClick={() => {
                cerrarSesion();
                navegar(RUTAS.login, { replace: true });
              }}
              className="rounded-sm p-1 text-white/70 transition-opacity hover:text-white"
            >
              <Icono nombre="salir" />
            </button>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}
