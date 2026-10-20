/**
 * Configuración del sistema.
 *
 * Muestra contra qué API trabaja la aplicación. Mientras responde el servidor
 * simulado, permite devolver sus datos al estado inicial, por ejemplo antes de
 * una presentación.
 */

import { Descriptions, Modal } from 'antd';
import { useState } from 'react';

import { Button, Icono, InlineNotification, Separator, useToast } from '@/components/ui';
import { entorno } from '@/config/entorno';
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
  const { apiSimulada, apiBaseUrl } = entorno();

  async function restablecer() {
    setRestableciendo(true);
    try {
      // Import dinámico: con la API real, el servidor simulado no se empaqueta.
      const { restablecerApiSimulada } = await import('@/mocks/base');
      restablecerApiSimulada({ conservarSesion: true });
      revalidar();
      onCerrar();
      avisos.exito('Datos restablecidos', 'El sistema volvió a los datos simulados iniciales.');
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
            Cerrar
          </Button>
          {apiSimulada ? (
            <Button variante="danger" onClick={restablecer} disabled={restableciendo}>
              <Icono nombre="rotar" />
              {restableciendo ? 'Restableciendo…' : 'Restablecer datos simulados'}
            </Button>
          ) : null}
        </div>
      }
    >
      <Descriptions
        bordered
        size="small"
        column={1}
        items={[
          {
            key: 'api',
            label: 'Origen de los datos',
            children: apiSimulada ? 'API simulada (en el navegador)' : `API ${apiBaseUrl}`,
          },
        ]}
      />

      {apiSimulada ? (
        <>
          <Separator margen={16} />

          <p className="text-md font-semibold text-ink">Datos simulados</p>
          <p className="mb-4 mt-1 text-base text-ink-3">
            Mientras no esté conectado el backend, la API la responde un servidor simulado que
            guarda los datos en este navegador. Restablecerlo recupera las 8 solicitudes de ejemplo,
            el historial de seis meses del cuadro de mando y sus metas, el catálogo completo de
            servicios y los usuarios del equipo.
          </p>

          <InlineNotification tono="aviso">
            Se descartarán las solicitudes creadas y los cambios hechos en este navegador. La acción
            no se puede deshacer.
          </InlineNotification>
        </>
      ) : null}
    </Modal>
  );
}
