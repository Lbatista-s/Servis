/**
 * Barra lateral: la marca, que lleva al inicio del rol, y la navegación
 * (`Menu` de Ant Design). La cuenta, la configuración y el cierre de sesión
 * viven en el menú de perfil de la barra superior.
 */

import { Badge, Menu, type MenuProps } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { Icono, Logotipo } from '@/components/ui';
import { useUsuarioActual } from '@/features/auth/authStore';
import { useSolicitudes } from '@/hooks/useDatos';
import { COLORES_MARCA } from '@/theme/tokens';

import { claveActiva, NAVEGACION_POR_ROL } from './navegacion';
import { INICIO_POR_ROL } from './rutas';

export function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
  const usuario = useUsuarioActual();
  const ubicacion = useLocation();

  // Contadores de los distintivos de navegación: la bandeja para el personal,
  // las solicitudes propias para el estudiante. Sólo se consulta la que aplica.
  const esEstudiante = usuario?.rol === 'estudiante';
  const { datos: pendientes } = useSolicitudes(
    { estados: ['enviada', 'en_revision', 'corregida'] },
    usuario !== null && !esEstudiante,
  );
  const { datos: propias } = useSolicitudes({ solicitanteId: usuario?.id }, esEstudiante);

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
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full w-sidebar shrink-0 flex-col overflow-y-auto bg-chrome"
    >
      {/* Marca: vuelve a la pantalla de inicio del rol */}
      <div className="mb-2 border-b border-white/10 px-2 pb-3 pt-3">
        <Link
          to={INICIO_POR_ROL[usuario.rol]}
          onClick={onNavegar}
          aria-label="SERVIS — ir al inicio"
          className="flex flex-col gap-1.5 rounded px-2 py-2 transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Logotipo formato="compacto" version="negativo" alto={50} />
          <span className="text-2xs uppercase tracking-wider text-white/90">
            Área de Ingenierías
          </span>
        </Link>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[claveActiva(ubicacion.pathname, elementos)]}
        items={items}
        style={{ borderInlineEnd: 'none' }}
      />
    </nav>
  );
}
