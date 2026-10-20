/**
 * Alta de un servicio del catálogo, con validación de Zod y React Hook Form.
 *
 * Aplica la regla del dominio antes de enviar: sin requisitos el servicio no
 * puede activarse, así que el interruptor se deshabilita y se crea inactivo.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, InputNumber, Modal, Select, Switch } from 'antd';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Button,
  Field,
  FieldHint,
  FieldLabel,
  Icono,
  InlineNotification,
  Input,
  Textarea,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { ETIQUETA_CATEGORIA, type CategoriaServicio } from '@/domain/types';
import { useRevalidar } from '@/hooks/useDatos';
import { mensajeDeError } from '@/lib/errores';

const CATEGORIAS = Object.keys(ETIQUETA_CATEGORIA) as CategoriaServicio[];

/** Marcas visuales del catálogo: emoji y fondo del recuadro, como en el prototipo. */
const ICONOS = [
  { icono: '📄', color: '#FEF3C7' },
  { icono: '🎓', color: '#F3E8FF' },
  { icono: '🔄', color: '#DBEAFE' },
  { icono: '📝', color: '#F0FDF4' },
  { icono: '💳', color: '#FEF3E8' },
  { icono: '🪪', color: '#FFF1F2' },
  { icono: '🌐', color: '#DCFCE7' },
] as const;

const esquemaServicio = z.object({
  nombre: z.string().trim().min(3, 'Escribe un nombre de al menos 3 caracteres.'),
  descripcion: z.string().trim().min(10, 'Describe el servicio en al menos 10 caracteres.'),
  categoria: z.enum(CATEGORIAS as [CategoriaServicio, ...CategoriaServicio[]]),
  icono: z.string(),
  diasEstimados: z
    .number({ message: 'Indica los días hábiles.' })
    .int('Debe ser un número entero.')
    .min(1, 'Al menos 1 día hábil.')
    .max(60, 'Como máximo 60 días hábiles.'),
  requisitos: z.array(
    z.object({
      descripcion: z.string().trim().min(3, 'Describe el requisito.'),
      obligatorio: z.boolean(),
    }),
  ),
  activo: z.boolean(),
});

type DatosServicio = z.infer<typeof esquemaServicio>;

const VALORES_INICIALES: DatosServicio = {
  nombre: '',
  descripcion: '',
  categoria: 'academico',
  icono: ICONOS[0].icono,
  diasEstimados: 5,
  requisitos: [{ descripcion: '', obligatorio: true }],
  activo: false,
};

export function NuevoServicioDialog() {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revalidar = useRevalidar();
  const avisos = useToast();

  const formulario = useForm<DatosServicio>({
    resolver: zodResolver(esquemaServicio),
    defaultValues: VALORES_INICIALES,
  });
  const requisitos = useFieldArray({ control: formulario.control, name: 'requisitos' });
  const errores = formulario.formState.errors;
  const sinRequisitos = requisitos.fields.length === 0;

  function cerrar() {
    setAbierto(false);
    setError(null);
    formulario.reset(VALORES_INICIALES);
  }

  async function crear(datos: DatosServicio) {
    setError(null);
    try {
      const marca = ICONOS.find((i) => i.icono === datos.icono) ?? ICONOS[0];
      const creado = await repositorios.servicios.crear({
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim(),
        categoria: datos.categoria,
        icono: marca.icono,
        color: marca.color,
        diasEstimados: datos.diasEstimados,
        requisitos: datos.requisitos.map((r, i) => ({
          id: `r${i + 1}`,
          descripcion: r.descripcion.trim(),
          obligatorio: r.obligatorio,
        })),
        // La plantilla del documento de salida la asigna el backend.
        plantilla: '',
        activo: datos.activo && datos.requisitos.length > 0,
      });
      revalidar('servicios');
      avisos.exito(
        'Servicio creado',
        creado.activo
          ? `«${creado.nombre}» ya aparece en el catálogo.`
          : `«${creado.nombre}» quedó inactivo; actívalo cuando esté listo.`,
      );
      cerrar();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  }

  return (
    <>
      <Button tamano="sm" onClick={() => setAbierto(true)}>
        <Icono nombre="mas" />
        Nuevo servicio
      </Button>

      <Modal
        open={abierto}
        onCancel={cerrar}
        title="Nuevo servicio"
        footer={null}
        width={640}
        destroyOnHidden
      >
        <p className="mb-5 text-base text-ink-3">
          Alta de un trámite en el catálogo del Área de Ingenierías.
        </p>

        <form onSubmit={formulario.handleSubmit(crear)} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field error={errores.nombre?.message}>
              <FieldLabel requerido>Nombre</FieldLabel>
              <Controller
                control={formulario.control}
                name="nombre"
                render={({ field }) => (
                  <Input placeholder="Ej. Constancia de estudios" {...field} />
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="icono-servicio">Icono</FieldLabel>
              <Controller
                control={formulario.control}
                name="icono"
                render={({ field }) => (
                  <Select
                    id="icono-servicio"
                    className="min-w-[88px]"
                    value={field.value}
                    onChange={field.onChange}
                    options={ICONOS.map(({ icono }) => ({
                      value: icono,
                      label: <span className="text-lg">{icono}</span>,
                    }))}
                  />
                )}
              />
            </Field>
          </div>

          <Field error={errores.descripcion?.message}>
            <FieldLabel requerido>Descripción</FieldLabel>
            <Controller
              control={formulario.control}
              name="descripcion"
              render={({ field }) => (
                <Textarea placeholder="Qué obtiene el estudiante y para qué sirve." {...field} />
              )}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="categoria-servicio" requerido>
                Categoría
              </FieldLabel>
              <Controller
                control={formulario.control}
                name="categoria"
                render={({ field }) => (
                  <Select
                    id="categoria-servicio"
                    value={field.value}
                    onChange={field.onChange}
                    options={CATEGORIAS.map((c) => ({ value: c, label: ETIQUETA_CATEGORIA[c] }))}
                  />
                )}
              />
            </Field>
            <Field error={errores.diasEstimados?.message}>
              <FieldLabel htmlFor="dias-servicio" requerido>
                Tiempo estimado (días hábiles)
              </FieldLabel>
              <Controller
                control={formulario.control}
                name="diasEstimados"
                render={({ field }) => (
                  <InputNumber
                    id="dias-servicio"
                    className="!w-full"
                    min={1}
                    max={60}
                    value={field.value}
                    onChange={(valor) => field.onChange(valor ?? Number.NaN)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </Field>
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2 text-base font-semibold text-ink">Requisitos</legend>
            {sinRequisitos ? (
              <p className="mb-2 text-sm text-ink-3">
                Sin requisitos, el servicio se crea inactivo.
              </p>
            ) : null}
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {requisitos.fields.map((campo, indice) => (
                <li key={campo.id} className="flex items-start gap-2">
                  <Field
                    className="flex-1"
                    error={errores.requisitos?.[indice]?.descripcion?.message}
                  >
                    <Controller
                      control={formulario.control}
                      name={`requisitos.${indice}.descripcion`}
                      render={({ field }) => (
                        <Input
                          aria-label={`Requisito ${indice + 1}`}
                          placeholder="Ej. Copia de la cédula"
                          {...field}
                        />
                      )}
                    />
                  </Field>
                  <Controller
                    control={formulario.control}
                    name={`requisitos.${indice}.obligatorio`}
                    render={({ field }) => (
                      <Checkbox
                        className="mt-1.5 whitespace-nowrap"
                        checked={field.value}
                        onChange={(evento) => field.onChange(evento.target.checked)}
                      >
                        Obligatorio
                      </Checkbox>
                    )}
                  />
                  <Button
                    variante="ghost"
                    tamano="icon"
                    aria-label={`Quitar requisito ${indice + 1}`}
                    onClick={() => {
                      requisitos.remove(indice);
                      if (requisitos.fields.length === 1) formulario.setValue('activo', false);
                    }}
                  >
                    <Icono nombre="cerrar" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              variante="outline"
              tamano="sm"
              className="mt-2"
              onClick={() => requisitos.append({ descripcion: '', obligatorio: true })}
            >
              <Icono nombre="mas" />
              Añadir requisito
            </Button>
          </fieldset>

          <Field>
            <div className="flex items-center gap-2.5">
              <Controller
                control={formulario.control}
                name="activo"
                render={({ field }) => (
                  <Switch
                    id="activo-servicio"
                    checked={field.value && !sinRequisitos}
                    disabled={sinRequisitos}
                    onChange={field.onChange}
                  />
                )}
              />
              <FieldLabel htmlFor="activo-servicio">Publicar en el catálogo al crearlo</FieldLabel>
            </div>
            <FieldHint>Un servicio sin requisitos no puede activarse.</FieldHint>
          </Field>

          {error ? <InlineNotification tono="error">{error}</InlineNotification> : null}

          <div className="mt-2 flex justify-end gap-2">
            <Button variante="outline" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={formulario.formState.isSubmitting}>
              <Icono nombre="verificar" />
              Crear servicio
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
