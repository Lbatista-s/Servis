/**
 * Selector rápido de rol heredado del prototipo.
 *
 * Sólo se monta en modo desarrollo (`import.meta.env.DEV`) y con datos locales:
 * en la compilación de producción no renderiza nada, y contra la API real no
 * se puede cambiar de cuenta sin credenciales.
 */

import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import { fuenteActiva } from '@/data';
import { ETIQUETA_ROL, ROLES, type Rol } from '@/domain/types';
import { useAuth, useUsuarioActual } from '@/features/auth/authStore';
import { useUsuarios } from '@/hooks/useDatos';

import { INICIO_POR_ROL } from './rutas';

export function DevRoleSwitcher() {
  const usuario = useUsuarioActual();
  const iniciarSesionComo = useAuth((estado) => estado.iniciarSesionComo);
  const disponible = import.meta.env.DEV && fuenteActiva() === 'local';
  const { datos: usuarios } = useUsuarios({ activo: true }, disponible);
  const navegar = useNavigate();

  if (!disponible || !usuario) return null;

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
    <div className="flex h-11 shrink-0 items-center gap-3 border-b-2 border-primary bg-black px-4">
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
              // Sobre la franja negra: texto blanco también en el tema oscuro.
              className={activo ? undefined : '!border-white/40 !text-white'}
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
