/**
 * Campana de la barra superior: cuántos avisos quedan sin leer y, al
 * pulsarla, la lista con enlace a cada solicitud.
 */

import { Badge, Button, Popover } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icono, Loading } from '@/components/ui';
import { repositorios } from '@/data';
import type { Notificacion } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';
import { useNotificaciones, useRevalidar } from '@/hooks/useDatos';
import { tiempoRelativo } from '@/lib/format';
import { cn } from '@/lib/utils';

import { RUTAS } from './rutas';

export function CampanaNotificaciones({ className }: { className?: string }) {
  const usuario = useUsuarioActual();
  const { datos, cargando, error, recargar } = useNotificaciones();
  const revalidar = useRevalidar();
  const navegar = useNavigate();
  const [abierta, setAbierta] = useState(false);

  const avisos = datos ?? [];
  const sinLeer = avisos.filter((n) => !n.leida).length;

  async function abrir(aviso: Notificacion) {
    setAbierta(false);
    navegar(
      usuario?.rol === 'estudiante'
        ? RUTAS.detalleSolicitud(aviso.solicitudId)
        : RUTAS.detalleBandeja(aviso.solicitudId),
    );
    if (!aviso.leida) {
      await repositorios.notificaciones.marcarLeida(aviso.id).catch(() => undefined);
      revalidar('notificaciones');
    }
  }

  async function leerTodas() {
    await repositorios.notificaciones.marcarTodasLeidas().catch(() => undefined);
    revalidar('notificaciones');
  }

  const panel = (
    <div className="w-[min(360px,calc(100vw-32px))]">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <p className="text-md font-semibold text-ink">Notificaciones</p>
        {sinLeer > 0 ? (
          <button
            type="button"
            onClick={() => void leerTodas()}
            className="rounded-xs text-sm text-primary-dark underline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Marcar todas como leídas
          </button>
        ) : null}
      </div>

      {cargando ? (
        <Loading mensaje="Cargando avisos…" />
      ) : error ? (
        <p className="py-6 text-center text-sm text-ink-3">
          No se pudieron cargar los avisos.{' '}
          <button type="button" className="text-primary-dark underline" onClick={recargar}>
            Reintentar
          </button>
        </p>
      ) : avisos.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-3">No tienes notificaciones.</p>
      ) : (
        <ul className="-mx-2 m-0 max-h-[60vh] list-none overflow-y-auto p-0 pt-1">
          {avisos.map((aviso) => (
            <li key={aviso.id}>
              <button
                type="button"
                onClick={() => void abrir(aviso)}
                className="flex w-full gap-2.5 rounded px-2 py-2 text-left hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    aviso.leida ? 'bg-transparent' : 'bg-primary',
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-base text-ink',
                      aviso.leida ? 'font-normal' : 'font-semibold',
                    )}
                  >
                    {aviso.titulo}
                    {aviso.leida ? null : <span className="sr-only"> (sin leer)</span>}
                  </span>
                  <span className="block truncate text-sm text-ink-3">{aviso.detalle}</span>
                  <span className="block text-xs text-ink-3">{tiempoRelativo(aviso.fecha)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      open={abierta}
      onOpenChange={setAbierta}
      content={panel}
      arrow={false}
    >
      <Badge count={sinLeer} size="small" offset={[-4, 4]} overflowCount={9}>
        <Button
          className={className}
          aria-label={sinLeer > 0 ? `Notificaciones, ${sinLeer} sin leer` : 'Notificaciones'}
          aria-haspopup="dialog"
          aria-expanded={abierta}
          icon={<Icono nombre="campana" />}
        />
      </Badge>
    </Popover>
  );
}
