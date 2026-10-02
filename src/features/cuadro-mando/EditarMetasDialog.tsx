/**
 * Edición de las metas del cuadro de mando. Kaplan y Norton las asignan a la
 * dirección, así que sólo el coordinador abre este diálogo (el repositorio lo
 * vuelve a comprobar).
 */

import { InputNumber, Modal } from 'antd';
import { useEffect, useState } from 'react';

import { Button, InlineNotification, useToast } from '@/components/ui';
import { repositorios } from '@/data';
import {
  INDICADORES,
  METAS_POR_DEFECTO,
  PERSPECTIVAS,
  type IdIndicador,
  type Metas,
} from '@/domain/indicadores';
import type { Actor } from '@/domain/types';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar } from '@/hooks/useDatos';

export function EditarMetasDialog({
  abierto,
  metas,
  actor,
  onCerrar,
}: {
  abierto: boolean;
  metas: Metas;
  actor: Actor;
  onCerrar: () => void;
}) {
  const [borrador, setBorrador] = useState<Metas>(metas);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revalidar = useRevalidar();
  const avisos = useToast();

  // Cada apertura parte de las metas vigentes.
  useEffect(() => {
    if (abierto) {
      setBorrador(metas);
      setError(null);
    }
  }, [abierto, metas]);

  const cambiar = (id: IdIndicador, valor: number | null) =>
    setBorrador((actual) => ({ ...actual, [id]: valor ?? 0 }));

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      await repositorios.metas.guardar(borrador, actor);
      revalidar();
      onCerrar();
      avisos.exito('Metas actualizadas', 'El cuadro de mando se evalúa ya con las nuevas metas.');
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={abierto}
      onCancel={onCerrar}
      title="Metas del cuadro de mando"
      width={640}
      destroyOnHidden
      footer={
        <div className="flex flex-wrap justify-between gap-2">
          <Button variante="ghost" onClick={() => setBorrador({ ...METAS_POR_DEFECTO })}>
            Restablecer valores iniciales
          </Button>
          <div className="flex gap-2">
            <Button variante="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar metas'}
            </Button>
          </div>
        </div>
      }
    >
      <p className="mb-4 text-base text-ink-3">
        Cada indicador se evalúa contra su meta: cumple si la alcanza, queda en alerta si está a
        menos del 10 % de ella y no cumple en otro caso.
      </p>

      <div className="flex flex-col gap-5">
        {PERSPECTIVAS.map((perspectiva) => (
          <fieldset key={perspectiva.id}>
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-3">
              {perspectiva.nombre}
            </legend>
            <div className="flex flex-col gap-2">
              {INDICADORES.filter((i) => i.perspectiva === perspectiva.id).map((indicador) => {
                const idCampo = `meta-${indicador.id}`;
                return (
                  <div
                    key={indicador.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[1fr_130px_80px]"
                  >
                    <label
                      htmlFor={idCampo}
                      className="col-span-2 text-base text-ink sm:col-span-1"
                    >
                      <span className="block font-medium">{indicador.objetivo}</span>
                      <span className="block text-xs text-ink-3">{indicador.nombre}</span>
                    </label>
                    <InputNumber
                      id={idCampo}
                      className="w-full"
                      min={0}
                      max={indicador.unidad === '%' ? 100 : undefined}
                      step={indicador.unidad === 'días' ? 0.5 : 1}
                      value={borrador[indicador.id]}
                      onChange={(valor) => cambiar(indicador.id, valor)}
                      prefix={indicador.sentido === 'mayor' ? '≥' : '≤'}
                    />
                    <span className="text-sm text-ink-3">{indicador.unidad}</span>
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error ? (
        <InlineNotification tono="error" className="mt-4">
          {error}
        </InlineNotification>
      ) : null}
    </Modal>
  );
}
