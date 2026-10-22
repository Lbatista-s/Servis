/**
 * Barra lateral: la marca, que lleva al inicio del rol; la navegación por
 * grupos (`Menu` de Ant Design), y al pie el contacto del Área. La cuenta, la
 * configuración y el cierre de sesión viven en el menú de perfil de la barra
 * superior.
 */

import { Badge, Menu, type MenuProps } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { Icono, Logotipo, Tooltip } from '@/components/ui';
import { entorno } from '@/config/entorno';
import { ESTADOS_FINALES } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';
import { useSolicitudes } from '@/hooks/useDatos';
import { COLORES_MARCA } from '@/theme/tokens';

import { CONTACTO_AREA } from './contacto';
import { claveActiva, elementosDe, NAVEGACION_POR_ROL, type ClaveContador } from './navegacion';
import { INICIO_POR_ROL } from './rutas';

export function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
  const usuario = useUsuarioActual();
  const ubicacion = useLocation();

  // Contadores de los distintivos. El personal comparte la consulta sin
  // filtros de la bandeja (la misma caché); el estudiante, la de las suyas.
  const esEstudiante = usuario?.rol === 'estudiante';
  const veBandeja = usuario?.rol === 'personal_administrativo' || usuario?.rol === 'coordinador';
  const { datos: todas } = useSolicitudes({}, veBandeja);
  const { datos: propias } = useSolicitudes({ solicitanteId: usuario?.id }, esEstudiante);

  if (!usuario) return null;

  const bandeja = todas ?? [];
  const contadores: Record<ClaveContador, number> = {
    // Sólo lo que exige acción del estudiante, para que el distintivo coincida
    // con el mensaje del panel.
    misSolicitudesActivas: (propias ?? []).filter(
      (s) => s.estado === 'devuelta' || s.estado === 'borrador',
    ).length,
    solicitudesPendientes: bandeja.filter((s) =>
      (['enviada', 'en_revision', 'corregida'] as const).includes(
        s.estado as 'enviada' | 'en_revision' | 'corregida',
      ),
    ).length,
    asignadasAMi: bandeja.filter(
      (s) => s.asignadaA === usuario.id && !ESTADOS_FINALES.includes(s.estado),
    ).length,
    devueltas: bandeja.filter((s) => s.estado === 'devuelta').length,
  };

  const grupos = NAVEGACION_POR_ROL[usuario.rol];

  const items: MenuProps['items'] = grupos.map((grupo) => ({
    type: 'group' as const,
    key: grupo.titulo,
    label: grupo.titulo,
    children: grupo.elementos.map((elemento) => {
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
  }));

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
          <Logotipo formato="compacto" version="negativo" alto={92} />
          <span className="text-2xs uppercase tracking-wider text-white/90">
            Área de Ingenierías
          </span>
        </Link>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[claveActiva(ubicacion.pathname, ubicacion.search, elementosDe(grupos))]}
        items={items}
        style={{ borderInlineEnd: 'none' }}
      />

      <BloqueAyuda />
    </nav>
  );
}

/** Contacto del Área al pie de la barra y, con la API simulada, su aviso. */
function BloqueAyuda() {
  return (
    <aside
      aria-label="Ayuda"
      className="mt-auto border-t border-white/10 px-4 pb-4 pt-3 text-xs text-white/90"
    >
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white">
        <Icono nombre="ayuda" className="h-3.5 w-3.5" />
        ¿Necesitas ayuda?
      </p>
      <a
        href={`mailto:${CONTACTO_AREA.correo}`}
        className="block break-all rounded-xs !text-white underline decoration-white/40 underline-offset-2 hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        {CONTACTO_AREA.correo}
      </a>
      <dl className="m-0 mt-1.5">
        {CONTACTO_AREA.horario.map(({ dias, horas }) => (
          <div key={dias} className="flex gap-1.5 whitespace-nowrap">
            <dt className="w-16 shrink-0 text-white/80">{dias}</dt>
            <dd className="m-0 tabular-nums">{horas}</dd>
          </div>
        ))}
      </dl>
      {entorno().apiSimulada ? (
        <Tooltip contenido="Mientras no esté conectado el backend, los datos son de ejemplo y se guardan en este navegador.">
          <span
            tabIndex={0}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/30 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warning" />
            Datos simulados
          </span>
        </Tooltip>
      ) : null}
    </aside>
  );
}
