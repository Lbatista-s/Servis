/**
 * Pantalla 5 — Nueva solicitud (formulario por pasos).
 *
 * Tres pasos: datos del servicio, documentos y revisión. La solicitud se crea
 * como borrador y sólo pasa a `enviada` en el último paso, mediante la
 * transición del dominio.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  Breadcrumb,
  Button,
  Card,
  FileChip,
  Icono,
  InlineNotification,
  Loading,
  NoteBlock,
  SectionHeader,
  Steps,
  UploadZone,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import type { Adjunto } from '@/domain/types';
import { useActor } from '@/features/auth/authStore';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar, useServicio } from '@/hooks/useDatos';
import { cn } from '@/lib/utils';

import { CamposFormulario } from './CamposFormulario';
import { camposDe, esquemaDe, formatearValorCampo, valoresIniciales } from './formularios';

const PASOS = ['Datos del servicio', 'Documentos', 'Revisión y envío'] as const;

export function NuevaSolicitudPage() {
  const { servicioId } = useParams<{ servicioId: string }>();
  const { datos: servicio, cargando } = useServicio(servicioId);
  const actor = useActor();
  const navegar = useNavigate();
  const revalidar = useRevalidar();
  const avisos = useToast();

  const [paso, setPaso] = useState(0);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const campos = camposDe(servicioId ?? '');
  const formulario = useForm<Record<string, string>>({
    resolver: zodResolver(esquemaDe(campos)),
    defaultValues: valoresIniciales(campos),
    mode: 'onTouched',
  });

  if (cargando) return <Loading mensaje="Cargando el servicio…" />;
  if (!servicio) return <Navigate to={RUTAS.catalogo} replace />;
  if (!actor) return null;

  const obligatorios = servicio.requisitos.filter((r) => r.obligatorio);
  const requisitosCubiertos = adjuntos.length >= obligatorios.length;

  /** Avanza sólo si los campos del paso actual son válidos. */
  async function siguientePaso() {
    if (paso === 0) {
      const valido = await formulario.trigger();
      if (!valido) return;
    }
    setPaso((actual) => Math.min(PASOS.length - 1, actual + 1));
  }

  function agregarArchivos(archivos: FileList) {
    const nuevos: Adjunto[] = Array.from(archivos).map((archivo, indice) => ({
      id: `adj-${Date.now()}-${indice}`,
      nombre: archivo.name,
      tamano: archivo.size,
      tipo: archivo.type || 'application/octet-stream',
      subidoEn: new Date().toISOString(),
    }));
    setAdjuntos((actuales) => [...actuales, ...nuevos]);
  }

  /** Crea el borrador y, si se pide, lo envía a revisión en la misma acción. */
  async function guardar(enviar: boolean) {
    if (!servicio || !actor) return;
    setEnviando(true);
    setErrorEnvio(null);

    try {
      const creada = await repositorios.solicitudes.crear(
        {
          servicioId: servicio.id,
          solicitanteId: actor.id,
          datosFormulario: formulario.getValues(),
          adjuntos,
        },
        actor,
      );

      if (enviar) {
        await repositorios.solicitudes.transicionar(creada.id, 'enviada', actor);
        avisos.exito('Solicitud enviada', `Tu solicitud ${creada.id} fue enviada para revisión.`);
      } else {
        avisos.exito(
          'Borrador guardado',
          `Tu solicitud ${creada.id} quedó guardada como borrador.`,
        );
      }

      revalidar();
      navegar(RUTAS.detalleSolicitud(creada.id));
    } catch (fallo) {
      setErrorEnvio(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  const valores = formulario.watch();

  return (
    <>
      <Breadcrumb
        migas={[
          { etiqueta: 'Inicio', a: RUTAS.inicio },
          { etiqueta: 'Catálogo', a: RUTAS.catalogo },
          { etiqueta: servicio.nombre },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:items-start">
        <div>
          <div className="mb-6 flex items-center gap-3 rounded-md border border-primary-light-2 bg-primary-light px-4 py-3.5">
            <span aria-hidden="true" className="text-3xl">
              {servicio.icono}
            </span>
            <div>
              <p className="font-semibold text-ink">{servicio.nombre}</p>
              <p className="text-sm text-ink-3">
                Completa el formulario y adjunta los documentos requeridos para procesar tu
                solicitud.
              </p>
            </div>
          </div>

          <Steps pasos={PASOS} actual={paso} className="mb-7" />

          {/* ── Paso 1: datos del servicio ── */}
          {paso === 0 ? <CamposFormulario campos={campos} formulario={formulario} /> : null}

          {/* ── Paso 2: documentos ── */}
          {paso === 1 ? (
            <Card>
              <SectionHeader titulo="Documentos adjuntos" />
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

              {!requisitosCubiertos ? (
                <InlineNotification tono="aviso" className="mt-4">
                  Este servicio exige {obligatorios.length} documento
                  {obligatorios.length === 1 ? '' : 's'} obligatorio
                  {obligatorios.length === 1 ? '' : 's'}. Has adjuntado {adjuntos.length}.
                </InlineNotification>
              ) : (
                <InlineNotification tono="exito" className="mt-4">
                  Los documentos obligatorios están cubiertos.
                </InlineNotification>
              )}
            </Card>
          ) : null}

          {/* ── Paso 3: revisión ── */}
          {paso === 2 ? (
            <div className="flex flex-col gap-4">
              <Card>
                <SectionHeader titulo="Revisa los datos antes de enviar" />
                <dl className="grid gap-3 sm:grid-cols-2">
                  {campos.map((campo) => (
                    <div key={campo.nombre} className={cn(campo.anchoCompleto && 'sm:col-span-2')}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                        {campo.etiqueta}
                      </dt>
                      <dd className="mt-0.5 text-base text-ink">
                        {formatearValorCampo(campo, valores[campo.nombre]) || (
                          <span className="text-ink-4">Sin completar</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card>
                <SectionHeader titulo={`Documentos (${adjuntos.length})`} />
                {adjuntos.length === 0 ? (
                  <p className="text-base text-ink-3">No has adjuntado ningún documento.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {adjuntos.map((adjunto) => (
                      <li key={adjunto.id}>
                        <FileChip adjunto={adjunto} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {!requisitosCubiertos ? (
                <InlineNotification tono="aviso">
                  Puedes guardar el borrador, pero no enviar la solicitud hasta adjuntar los{' '}
                  {obligatorios.length} documento{obligatorios.length === 1 ? '' : 's'} obligatorio
                  {obligatorios.length === 1 ? '' : 's'}.
                </InlineNotification>
              ) : null}

              {errorEnvio ? (
                <InlineNotification tono="error">{errorEnvio}</InlineNotification>
              ) : null}
            </div>
          ) : null}

          {/* Acciones */}
          <div className="mt-5 flex flex-wrap justify-end gap-2.5">
            {paso > 0 ? (
              <Button variante="ghost" onClick={() => setPaso((actual) => actual - 1)}>
                ← Anterior
              </Button>
            ) : null}

            <Button variante="outline" onClick={() => guardar(false)} disabled={enviando}>
              Guardar como borrador
            </Button>

            {paso < PASOS.length - 1 ? (
              <Button onClick={siguientePaso}>
                Siguiente
                <Icono nombre="chevron" />
              </Button>
            ) : (
              <Button onClick={() => guardar(true)} disabled={enviando || !requisitosCubiertos}>
                <Icono nombre="verificar" />
                {enviando ? 'Enviando…' : 'Enviar solicitud'}
              </Button>
            )}
          </div>
        </div>

        {/* Panel lateral */}
        <aside className="flex flex-col gap-3.5 xl:sticky xl:top-0">
          <Card>
            <SectionHeader titulo="Requisitos del servicio" />
            <ul className="flex flex-col gap-2">
              {servicio.requisitos.map((requisito, indice) => {
                const cubierto = indice < adjuntos.length;
                return (
                  <li key={requisito.id} className="flex items-start gap-2 text-base">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        cubierto ? 'bg-success text-white' : 'bg-canvas-3',
                      )}
                    >
                      {cubierto ? <Icono nombre="verificar" className="h-2.5 w-2.5" /> : null}
                    </span>
                    <span className={cn(!requisito.obligatorio && 'text-ink-3')}>
                      {requisito.descripcion}
                      {requisito.obligatorio ? null : ' (opcional)'}
                    </span>
                  </li>
                );
              })}
            </ul>

            <NoteBlock className="mt-4">
              <strong>Nota:</strong> los documentos deben ser legibles y estar vigentes. Tiempo
              estimado de respuesta: {servicio.diasEstimados} días hábiles.
            </NoteBlock>
          </Card>

          <Card className="bg-surface-2">
            <p className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-ink-3">
              Estado de tu solicitud
            </p>
            <ul className="flex flex-col gap-1.5 text-base">
              <EstadoPreparacion
                cumplido={formulario.formState.isValid}
                texto="Datos del formulario completados"
              />
              <EstadoPreparacion
                cumplido={adjuntos.length > 0}
                texto={`${adjuntos.length} documento${adjuntos.length === 1 ? '' : 's'} adjunto${adjuntos.length === 1 ? '' : 's'}`}
              />
              <EstadoPreparacion
                cumplido={requisitosCubiertos}
                texto={
                  requisitosCubiertos
                    ? 'Requisitos obligatorios cubiertos'
                    : `${obligatorios.length - adjuntos.length} requisito(s) pendiente(s)`
                }
              />
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}

function EstadoPreparacion({ cumplido, texto }: { cumplido: boolean; texto: string }) {
  return (
    <li className={cn('flex items-center gap-2', cumplido ? 'text-ink' : 'text-warning')}>
      <span
        aria-hidden="true"
        className={cn('h-2 w-2 shrink-0 rounded-full', cumplido ? 'bg-success' : 'bg-warning')}
      />
      {texto}
    </li>
  );
}
