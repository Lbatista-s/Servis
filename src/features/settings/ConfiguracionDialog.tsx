/**
 * Configuración del sistema.
 *
 * Contiene el botón para restablecer los datos de demostración, pensado para
 * dejar el sistema limpio antes de una presentación.
 */

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  Icono,
  InlineNotification,
  Separator,
  useToast,
} from '@/components/ui';
import { fuenteActiva, repositorios, SERVIS_SCHEMA_VERSION } from '@/data';
import { useRevalidar } from '@/hooks/useDatos';

export function ConfiguracionDialog() {
  const [abierto, setAbierto] = useState(false);
  const [restableciendo, setRestableciendo] = useState(false);
  const revalidar = useRevalidar();
  const avisos = useToast();

  async function restablecer() {
    setRestableciendo(true);
    try {
      await repositorios.restablecerDemo();
      revalidar();
      setAbierto(false);
      avisos.exito(
        'Datos restablecidos',
        'El sistema volvió a los datos de demostración iniciales.',
      );
    } catch {
      avisos.error('No se pudieron restablecer los datos', 'Inténtalo de nuevo.');
    } finally {
      setRestableciendo(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="my-px flex w-full items-center gap-2.5 rounded border border-transparent py-2.5 pl-3.5 pr-3 text-base font-medium text-white/55 transition-all hover:bg-white/[0.06] hover:text-white/85"
        >
          <Icono nombre="engranaje" className="opacity-80" />
          <span>Configuración</span>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader
          titulo="Configuración"
          descripcion="Ajustes del entorno de demostración de SERVIS."
        />

        <DialogBody>
          <dl className="grid grid-cols-2 gap-3 rounded-md bg-surface-2 p-4 text-base">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                Fuente de datos
              </dt>
              <dd className="mt-0.5 text-ink">
                {fuenteActiva() === 'local' ? 'Almacenamiento local' : 'API remota'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                Versión del esquema
              </dt>
              <dd className="mt-0.5 text-ink">v{SERVIS_SCHEMA_VERSION}</dd>
            </div>
          </dl>

          <Separator className="my-1" />

          <div>
            <p className="text-md font-semibold text-ink">Datos de demostración</p>
            <p className="mt-1 text-base text-ink-3">
              Devuelve el sistema a su estado inicial: las 8 solicitudes de ejemplo, el catálogo
              completo de servicios y los usuarios del equipo.
            </p>
          </div>

          <InlineNotification tono="aviso">
            Se descartarán todas las solicitudes creadas y los cambios realizados durante esta
            sesión. La acción no se puede deshacer.
          </InlineNotification>
        </DialogBody>

        <DialogFooter>
          <Button variante="outline" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
          <Button variante="danger" onClick={restablecer} disabled={restableciendo}>
            <Icono nombre="rotar" />
            {restableciendo ? 'Restableciendo…' : 'Restablecer datos de demostración'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
