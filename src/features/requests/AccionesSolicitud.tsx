/**
 * Botonera de acciones sobre una solicitud.
 *
 * Los botones se derivan de la máquina de estados: sólo aparecen las
 * transiciones que el dominio permitiría al actor actual, de modo que la
 * interfaz nunca ofrece una acción que después vaya a ser rechazada. Las
 * transiciones que exigen justificación abren un diálogo con validación.
 */

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  Field,
  FieldHint,
  FieldLabel,
  Icono,
  InlineNotification,
  Textarea,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { accionesPara } from '@/domain/businessRules';
import type { Transicion } from '@/domain/requestStateMachine';
import type { Actor, EstadoSolicitud, Solicitud } from '@/domain/types';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar } from '@/hooks/useDatos';

import type { ButtonProps } from '@/components/ui';

/** Aspecto de cada acción, para que el color comunique la consecuencia. */
const ESTILO_ACCION: Partial<
  Record<
    EstadoSolicitud,
    { variante: ButtonProps['variante']; icono: 'verificar' | 'cerrar' | 'rotar' | 'chevron' }
  >
> = {
  enviada: { variante: 'primary', icono: 'chevron' },
  en_revision: { variante: 'primary', icono: 'chevron' },
  aprobada: { variante: 'success', icono: 'verificar' },
  rechazada: { variante: 'danger', icono: 'cerrar' },
  devuelta: { variante: 'warning', icono: 'rotar' },
  corregida: { variante: 'primary', icono: 'chevron' },
  completada: { variante: 'success', icono: 'verificar' },
  cancelada: { variante: 'outline', icono: 'cerrar' },
};

export function AccionesSolicitud({
  solicitud,
  actor,
  onCompletado,
}: {
  solicitud: Solicitud;
  actor: Actor;
  onCompletado?: () => void;
}) {
  const acciones = accionesPara(solicitud, actor);
  const [transicionActiva, setTransicionActiva] = useState<Transicion | null>(null);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const revalidar = useRevalidar();
  const avisos = useToast();

  if (acciones.length === 0) return null;

  async function ejecutar(transicion: Transicion, texto?: string) {
    setProcesando(true);
    setError(null);
    try {
      await repositorios.solicitudes.transicionar(solicitud.id, transicion.hacia, actor, {
        comentario: texto,
      });
      revalidar();
      setTransicionActiva(null);
      setComentario('');
      avisos.exito(`${transicion.accion} — ${solicitud.id}`, 'El historial quedó registrado.');
      onCompletado?.();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setProcesando(false);
    }
  }

  function activar(transicion: Transicion) {
    setError(null);
    if (transicion.requiereComentario) {
      setComentario('');
      setTransicionActiva(transicion);
    } else {
      void ejecutar(transicion);
    }
  }

  const longitud = comentario.trim().length;
  const minimo = transicionActiva?.longitudMinimaComentario ?? 0;
  const comentarioValido = longitud >= minimo;

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {acciones.map((transicion) => {
          const estilo = ESTILO_ACCION[transicion.hacia] ?? {
            variante: 'outline' as const,
            icono: 'chevron' as const,
          };
          return (
            <Button
              key={transicion.hacia}
              variante={estilo.variante}
              disabled={procesando}
              onClick={() => activar(transicion)}
            >
              <Icono nombre={estilo.icono} />
              {transicion.accion}
            </Button>
          );
        })}
      </div>

      {error && !transicionActiva ? (
        <InlineNotification tono="error" className="mt-3">
          {error}
        </InlineNotification>
      ) : null}

      {/* Diálogo para las transiciones que exigen justificación. */}
      <Dialog
        open={transicionActiva !== null}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setTransicionActiva(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          {transicionActiva ? (
            <>
              <DialogHeader
                titulo={transicionActiva.accion}
                descripcion={`Solicitud ${solicitud.id}`}
              />

              <DialogBody>
                <InlineNotification tono="aviso">
                  Esta acción notificará al estudiante y quedará registrada de forma permanente en
                  el historial de la solicitud.
                </InlineNotification>

                <Field error={error ?? undefined}>
                  <FieldLabel requerido>
                    {transicionActiva.hacia === 'rechazada'
                      ? 'Motivo del rechazo'
                      : 'Motivo de la devolución'}
                  </FieldLabel>
                  <Textarea
                    value={comentario}
                    onChange={(evento) => setComentario(evento.target.value)}
                    placeholder="Describe con claridad el motivo para que el estudiante pueda tomar acción si aplica…"
                    className="min-h-24"
                    autoFocus
                  />
                  <FieldHint>
                    Mínimo {minimo} caracteres ({longitud} escritos). Este texto será visible para
                    el estudiante.
                  </FieldHint>
                </Field>
              </DialogBody>

              <DialogFooter>
                <Button variante="outline" onClick={() => setTransicionActiva(null)}>
                  Cancelar
                </Button>
                <Button
                  variante={transicionActiva.hacia === 'rechazada' ? 'danger' : 'warning'}
                  disabled={!comentarioValido || procesando}
                  onClick={() => ejecutar(transicionActiva, comentario)}
                >
                  <Icono nombre={transicionActiva.hacia === 'rechazada' ? 'cerrar' : 'rotar'} />
                  {procesando
                    ? 'Procesando…'
                    : `Confirmar ${transicionActiva.accion.toLowerCase()}`}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
