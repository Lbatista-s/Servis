/**
 * Edición de una solicitud por parte del estudiante.
 *
 * Se muestra cuando la solicitud está en `borrador` o `devuelta`, es decir,
 * mientras se prepara o cuando el personal administrativo ha pedido
 * correcciones. Permite modificar tanto los campos del formulario como los
 * documentos adjuntos, y guarda a través del repositorio: el dominio vuelve a
 * validar la operación aunque la interfaz ya la haya permitido.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  Button,
  Card,
  FileChip,
  Icono,
  InlineNotification,
  SectionHeader,
  UploadZone,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import type { Actor, Adjunto, Servicio, Solicitud } from '@/domain/types';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar } from '@/hooks/useDatos';

import { CamposFormulario } from './CamposFormulario';
import { camposDe, esquemaDe, valoresIniciales } from './formularios';

export function EdicionSolicitud({
  solicitud,
  servicio,
  actor,
}: {
  solicitud: Solicitud;
  servicio: Servicio | null;
  actor: Actor;
}) {
  const campos = camposDe(solicitud.servicioId);
  const revalidar = useRevalidar();
  const avisos = useToast();

  const [adjuntos, setAdjuntos] = useState<Adjunto[]>(solicitud.adjuntos);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formulario = useForm<Record<string, string>>({
    resolver: zodResolver(esquemaDe(campos)),
    // Los valores guardados se mezclan sobre la plantilla vacía para que un
    // campo añadido al servicio después de crear la solicitud no quede sin
    // registrar en el formulario.
    defaultValues: { ...valoresIniciales(campos), ...solicitud.datosFormulario },
    mode: 'onTouched',
  });

  const obligatorios = servicio?.requisitos.filter((r) => r.obligatorio).length ?? 0;
  const requisitosCubiertos = adjuntos.length >= obligatorios;

  function agregarArchivos(archivos: readonly File[]) {
    const nuevos: Adjunto[] = archivos.map((archivo, indice) => ({
      id: `adj-${Date.now()}-${indice}`,
      nombre: archivo.name,
      tamano: archivo.size,
      tipo: archivo.type || 'application/octet-stream',
      subidoEn: new Date().toISOString(),
    }));
    setAdjuntos((actuales) => [...actuales, ...nuevos]);
  }

  async function guardar(valores: Record<string, string>) {
    setGuardando(true);
    setError(null);
    try {
      await repositorios.solicitudes.guardar(
        solicitud.id,
        { datosFormulario: valores, adjuntos },
        actor,
      );
      revalidar();
      avisos.exito(
        'Cambios guardados',
        solicitud.estado === 'devuelta'
          ? 'Cuando termines, envía la corrección para que vuelva a revisión.'
          : 'Tu borrador quedó actualizado.',
      );
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={formulario.handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
      <Card>
        <SectionHeader
          titulo={solicitud.estado === 'devuelta' ? 'Corrige tus datos' : 'Datos de la solicitud'}
        />
        {solicitud.estado === 'devuelta' ? (
          <p className="mb-4 text-base text-ink-3">
            Modifica lo que haga falta según las observaciones del personal administrativo. Los
            cambios se guardan sin enviar; la solicitud vuelve a revisión sólo cuando pulses «Enviar
            corrección».
          </p>
        ) : null}
        <CamposFormulario campos={campos} formulario={formulario} conTarjetas={false} />
      </Card>

      <Card>
        <SectionHeader titulo={`Documentos adjuntos (${adjuntos.length})`} />

        {adjuntos.length > 0 ? (
          <ul className="mb-3 flex flex-col gap-2">
            {adjuntos.map((adjunto) => (
              <li key={adjunto.id}>
                <FileChip adjunto={adjunto}>
                  <Button
                    variante="ghost"
                    tamano="icon"
                    aria-label={`Eliminar ${adjunto.nombre}`}
                    onClick={() =>
                      setAdjuntos((actuales) => actuales.filter((a) => a.id !== adjunto.id))
                    }
                  >
                    <Icono nombre="cerrar" />
                  </Button>
                </FileChip>
              </li>
            ))}
          </ul>
        ) : null}

        <UploadZone onArchivos={agregarArchivos} />

        {servicio && !requisitosCubiertos ? (
          <InlineNotification tono="aviso" className="mt-4">
            Este servicio exige {obligatorios} documento{obligatorios === 1 ? '' : 's'} obligatorio
            {obligatorios === 1 ? '' : 's'}. Has adjuntado {adjuntos.length}.
          </InlineNotification>
        ) : null}
      </Card>

      {error ? <InlineNotification tono="error">{error}</InlineNotification> : null}

      <div className="flex flex-wrap justify-end gap-2.5">
        <Button
          variante="outline"
          onClick={() => {
            formulario.reset({ ...valoresIniciales(campos), ...solicitud.datosFormulario });
            setAdjuntos(solicitud.adjuntos);
            setError(null);
          }}
          disabled={guardando}
        >
          Descartar cambios
        </Button>
        <Button type="submit" disabled={guardando}>
          <Icono nombre="verificar" />
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
