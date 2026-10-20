/**
 * Alta y edición de un servicio del catálogo, con validación de Zod y React
 * Hook Form.
 *
 * Los requisitos se eligen del catálogo de documentos de SERVIS
 * (`SelectorDocumentos`). Un servicio puede no pedir ningún documento, como
 * los talleres a la carta de INTEC, que sólo piden datos.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { InputNumber, Modal, Select, Switch } from 'antd';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  Tooltip,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { ETIQUETA_CATEGORIA, type CategoriaServicio, type Servicio } from '@/domain/types';
import { useDocumentos, useRevalidar } from '@/hooks/useDatos';
import { mensajeDeError } from '@/lib/errores';

import { SelectorDocumentos } from './SelectorDocumentos';

const CATEGORIAS = Object.keys(ETIQUETA_CATEGORIA) as CategoriaServicio[];

/** Marcas visuales del catálogo: emoji y fondo del recuadro, como en el prototipo. */
const ICONOS: readonly { icono: string; color: string }[] = [
  { icono: '📄', color: '#FEF3C7' },
  { icono: '🎓', color: '#F3E8FF' },
  { icono: '🔄', color: '#DBEAFE' },
  { icono: '📝', color: '#F0FDF4' },
  { icono: '💳', color: '#FEF3E8' },
  { icono: '🪪', color: '#FFF1F2' },
  { icono: '🌐', color: '#DCFCE7' },
];

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
  requisitos: z.array(z.object({ id: z.string(), obligatorio: z.boolean() })),
  activo: z.boolean(),
});

type DatosServicio = z.infer<typeof esquemaServicio>;

function valoresDe(servicio?: Servicio): DatosServicio {
  return servicio
    ? {
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        categoria: servicio.categoria,
        icono: servicio.icono,
        diasEstimados: servicio.diasEstimados,
        requisitos: servicio.requisitos.map(({ id, obligatorio }) => ({ id, obligatorio })),
        activo: servicio.activo,
      }
    : {
        nombre: '',
        descripcion: '',
        categoria: 'academico',
        icono: ICONOS[0]?.icono ?? '📄',
        diasEstimados: 5,
        requisitos: [],
        activo: false,
      };
}

/**
 * Formulario del servicio dentro de un `Modal`. Con `servicio` lo edita; sin
 * él, crea uno nuevo. Se monta al abrirse, así que parte siempre de los datos
 * vigentes.
 */
function FormularioServicio({ servicio, onCerrar }: { servicio?: Servicio; onCerrar: () => void }) {
  const editando = Boolean(servicio);
  const [error, setError] = useState<string | null>(null);
  const revalidar = useRevalidar();
  const avisos = useToast();
  const { datos: catalogo } = useDocumentos();

  const formulario = useForm<DatosServicio>({
    resolver: zodResolver(esquemaServicio),
    defaultValues: valoresDe(servicio),
  });
  const errores = formulario.formState.errors;

  // Los servicios sembrados usan emojis fuera de la lista: se conserva el suyo.
  const iconos =
    servicio && !ICONOS.some((i) => i.icono === servicio.icono)
      ? [{ icono: servicio.icono, color: servicio.color }, ...ICONOS]
      : ICONOS;

  async function guardar(datos: DatosServicio) {
    setError(null);
    const marca = iconos.find((i) => i.icono === datos.icono) ?? iconos[0];
    const nombreDe = (id: string) => catalogo?.find((d) => d.id === id)?.nombre ?? id;
    const comunes = {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      categoria: datos.categoria,
      icono: marca?.icono ?? datos.icono,
      color: marca?.color ?? '#FEF3C7',
      diasEstimados: datos.diasEstimados,
      // El servidor toma la descripción del catálogo; se envía igualmente
      // para que la respuesta optimista no dependa de ello.
      requisitos: datos.requisitos.map((r) => ({ ...r, descripcion: nombreDe(r.id) })),
    };
    try {
      if (servicio) {
        const actualizado = await repositorios.servicios.actualizar(servicio.id, comunes);
        avisos.exito(
          'Servicio actualizado',
          `Los cambios de «${actualizado.nombre}» ya se aplican.`,
        );
      } else {
        const creado = await repositorios.servicios.crear({
          ...comunes,
          // La plantilla del documento de salida la asigna el backend.
          plantilla: '',
          activo: datos.activo,
        });
        avisos.exito(
          'Servicio creado',
          creado.activo
            ? `«${creado.nombre}» ya aparece en el catálogo.`
            : `«${creado.nombre}» quedó inactivo; actívalo cuando esté listo.`,
        );
      }
      revalidar('servicios');
      onCerrar();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  }

  return (
    <>
      <p className="mb-5 text-base text-ink-3">
        {editando
          ? 'Los cambios se aplican a las solicitudes nuevas; las ya enviadas conservan sus documentos.'
          : 'Alta de un trámite en el catálogo del Área de Ingenierías.'}
      </p>

      <form onSubmit={formulario.handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field error={errores.nombre?.message}>
            <FieldLabel requerido>Nombre</FieldLabel>
            <Controller
              control={formulario.control}
              name="nombre"
              render={({ field }) => <Input placeholder="Ej. Constancia de estudios" {...field} />}
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
                  options={iconos.map(({ icono }) => ({
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
          <legend className="mb-2 text-base font-semibold text-ink">Documentos requeridos</legend>
          <Controller
            control={formulario.control}
            name="requisitos"
            render={({ field }) => (
              <SelectorDocumentos valor={field.value} onCambio={field.onChange} />
            )}
          />
        </fieldset>

        {editando ? null : (
          <Field>
            <div className="flex items-center gap-2.5">
              <Controller
                control={formulario.control}
                name="activo"
                render={({ field }) => (
                  <Switch id="activo-servicio" checked={field.value} onChange={field.onChange} />
                )}
              />
              <FieldLabel htmlFor="activo-servicio">Publicar en el catálogo al crearlo</FieldLabel>
            </div>
            <FieldHint>Si no, se crea inactivo y se activa más tarde desde el catálogo.</FieldHint>
          </Field>
        )}

        {error ? <InlineNotification tono="error">{error}</InlineNotification> : null}

        <div className="mt-2 flex justify-end gap-2">
          <Button variante="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={formulario.formState.isSubmitting}>
            <Icono nombre="verificar" />
            {editando ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </div>
      </form>
    </>
  );
}

function ServicioDialog({
  abierto,
  servicio,
  onCerrar,
}: {
  abierto: boolean;
  servicio?: Servicio;
  onCerrar: () => void;
}) {
  return (
    <Modal
      open={abierto}
      onCancel={onCerrar}
      title={servicio ? `Editar «${servicio.nombre}»` : 'Nuevo servicio'}
      footer={null}
      width={680}
      destroyOnHidden
    >
      <FormularioServicio servicio={servicio} onCerrar={onCerrar} />
    </Modal>
  );
}

export function NuevoServicioDialog() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button tamano="sm" onClick={() => setAbierto(true)}>
        <Icono nombre="mas" />
        Nuevo servicio
      </Button>
      <ServicioDialog abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}

export function EditarServicioDialog({ servicio }: { servicio: Servicio }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Tooltip contenido="Editar servicio">
        <Button
          variante="outline"
          tamano="icon"
          aria-label={`Editar ${servicio.nombre}`}
          onClick={() => setAbierto(true)}
        >
          <Icono nombre="editar" />
        </Button>
      </Tooltip>
      <ServicioDialog abierto={abierto} servicio={servicio} onCerrar={() => setAbierto(false)} />
    </>
  );
}
