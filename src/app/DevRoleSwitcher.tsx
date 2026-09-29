/**
 * Selector rápido de rol heredado del prototipo.
 *
 * Sólo se monta en modo desarrollo (`import.meta.env.DEV`); en la compilación
 * de producción el componente no renderiza nada y el empaquetador lo descarta.
 */

import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import { ETIQUETA_ROL, ROLES, type Rol } from '@/domain/types';
import { useAuth, useUsuarioActual } from '@/features/auth/authStore';
import { useUsuarios } from '@/hooks/useDatos';

import { INICIO_POR_ROL } from './rutas';

export function DevRoleSwitcher() {
  const usuario = useUsuarioActual();
  const iniciarSesionComo = useAuth((estado) => estado.iniciarSesionComo);
  const { datos: usuarios } = useUsuarios({ activo: true });
  const navegar = useNavigate();

  if (!import.meta.env.DEV || !usuario) return null;

  /** Primer usuario activo con el rol solicitado. */
  function usuarioDe(rol: Rol) {
    return (usuarios ?? []).find((u) => u.rol === rol);
  }

  async function cambiarA(rol: Rol) {
    const destino = usuarioDe(rol);
    if (!destino) return;
    const exito = await iniciarSesionComo(destino.id);
    if (exito) navegar(INICIO_POR_ROL[rol], { replace: true });
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b-2 border-primary bg-ink px-4">
      <span className="text-sm font-bold uppercase tracking-widest text-white/90">
        ▸ Servis · desarrollo
      </span>
      <span aria-hidden="true" className="h-5 w-px bg-white/15" />

      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Cambiar de rol (sólo desarrollo)"
      >
        {ROLES.map((rol) => {
          const disponible = usuarioDe(rol);
          const activo = usuario?.rol === rol;
          return (
            <Button
              key={rol}
              size="small"
              shape="round"
              type={activo ? 'primary' : 'default'}
              ghost={!activo}
              disabled={!disponible}
              onClick={() => cambiarA(rol)}
              aria-pressed={activo}
            >
              {ETIQUETA_ROL[rol]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
