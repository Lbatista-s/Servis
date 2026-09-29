/**
 * Configuración del sistema.
 *
 * Contiene el botón para restablecer los datos de demostración, pensado para
 * dejar el sistema limpio antes de una presentación. Se abre desde el menú
 * lateral, que controla su visibilidad.
 */

import { Descriptions, Modal } from 'antd';
import { useState } from 'react';

import { Button, Icono, InlineNotification, Separator, useToast } from '@/components/ui';
import { fuenteActiva, repositorios, SERVIS_SCHEMA_VERSION } from '@/data';
import { useRevalidar } from '@/hooks/useDatos';

export function ConfiguracionDialog({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const [restableciendo, setRestableciendo] = useState(false);
  const revalidar = useRevalidar();
  const avisos = useToast();

  async function restablecer() {
    setRestableciendo(true);
    try {
      await repositorios.restablecerDemo();
      revalidar();
      onCerrar();
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
    <Modal
      open={abierto}
      onCancel={onCerrar}
      title="Configuración"
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button variante="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button variante="danger" onClick={restablecer} disabled={restableciendo}>
            <Icono nombre="rotar" />
            {restableciendo ? 'Restableciendo…' : 'Restablecer datos de demostración'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-base text-ink-3">Ajustes del entorno de demostración de SERVIS.</p>

      <Descriptions
        bordered
        size="small"
        column={2}
        items={[
          {
            key: 'fuente',
            label: 'Fuente de datos',
            children: fuenteActiva() === 'local' ? 'Almacenamiento local' : 'API remota',
          },
          { key: 'esquema', label: 'Versión del esquema', children: `v${SERVIS_SCHEMA_VERSION}` },
        ]}
      />

      <Separator margen={16} />

      <p className="text-md font-semibold text-ink">Datos de demostración</p>
      <p className="mb-4 mt-1 text-base text-ink-3">
        Devuelve el sistema a su estado inicial: las 8 solicitudes de ejemplo, el catálogo completo
        de servicios y los usuarios del equipo.
      </p>

      <InlineNotification tono="aviso">
        Se descartarán todas las solicitudes creadas y los cambios realizados durante esta sesión.
        La acción no se puede deshacer.
      </InlineNotification>
    </Modal>
  );
}
