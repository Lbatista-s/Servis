/** Alta de usuario, con validación de Zod y React Hook Form. */

import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Select } from 'antd';
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
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { ETIQUETA_ROL, ROLES, type ColorAvatar } from '@/domain/types';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar } from '@/hooks/useDatos';
import { iniciales } from '@/lib/utils';

const esquemaUsuario = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio.')
    .refine((valor) => valor.trim().split(/\s+/).length >= 2, {
      message: 'Indica nombre y apellido.',
    }),
  correo: z
    .string()
    .min(1, 'El correo es obligatorio.')
    .email('El formato del correo no es válido.')
    .refine((valor) => valor.trim().toLowerCase().endsWith('@intec.edu.do'), {
      message: 'Debe ser un correo institucional del INTEC (@intec.edu.do).',
    }),
  rol: z.enum(ROLES),
  matricula: z.string().optional(),
  carrera: z.string().optional(),
});

type DatosUsuario = z.infer<typeof esquemaUsuario>;

/** Paleta rotatoria para asignar color de avatar a cada usuario nuevo. */
const COLORES: readonly ColorAvatar[] = ['blue', 'green', 'amber', 'purple', 'teal', 'red'];

export function NuevoUsuarioDialog() {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revalidar = useRevalidar();
  const avisos = useToast();

  const formulario = useForm<DatosUsuario>({
    resolver: zodResolver(esquemaUsuario),
    defaultValues: { nombre: '', correo: '', rol: 'estudiante', matricula: '', carrera: '' },
  });

  const rolSeleccionado = formulario.watch('rol');

  async function crear(datos: DatosUsuario) {
    setError(null);
    try {
      await repositorios.usuarios.crear({
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim().toLowerCase(),
        rol: datos.rol,
        iniciales: iniciales(datos.nombre),
        colorAvatar: COLORES[Math.floor(Math.random() * COLORES.length)] ?? 'blue',
        activo: true,
        ...(datos.rol === 'estudiante'
          ? { matricula: datos.matricula?.trim(), carrera: datos.carrera?.trim() }
          : {}),
      });

      revalidar();
      avisos.exito('Usuario creado', `${datos.nombre} ya puede acceder al sistema.`);
      formulario.reset();
      setAbierto(false);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  }

  return (
    <>
      <Button tamano="sm" onClick={() => setAbierto(true)}>
        <Icono nombre="mas" />
        Crear usuario
      </Button>

      <Modal
        open={abierto}
        onCancel={() => setAbierto(false)}
        title="Crear usuario"
        footer={null}
        destroyOnHidden
      >
        <p className="mb-5 text-base text-ink-3">Alta de una cuenta en el Área de Ingenierías.</p>

        <form onSubmit={formulario.handleSubmit(crear)} noValidate className="flex flex-col gap-4">
          <Field error={formulario.formState.errors.nombre?.message}>
            <FieldLabel requerido>Nombre completo</FieldLabel>
            <Controller
              control={formulario.control}
              name="nombre"
              render={({ field }) => <Input placeholder="Ej. Ana García" {...field} />}
            />
          </Field>

          <Field error={formulario.formState.errors.correo?.message}>
            <FieldLabel requerido>Correo institucional</FieldLabel>
            <Controller
              control={formulario.control}
              name="correo"
              render={({ field }) => (
                <Input type="email" placeholder="a.garcia@intec.edu.do" {...field} />
              )}
            />
            <FieldHint>Debe pertenecer al dominio @intec.edu.do.</FieldHint>
          </Field>

          <Field error={formulario.formState.errors.rol?.message}>
            <FieldLabel htmlFor="rol-nuevo" requerido>
              Rol
            </FieldLabel>
            <Controller
              control={formulario.control}
              name="rol"
              render={({ field }) => (
                <Select
                  id="rol-nuevo"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={ROLES.map((clave) => ({ value: clave, label: ETIQUETA_ROL[clave] }))}
                />
              )}
            />
          </Field>

          {/* Datos académicos: sólo tienen sentido para estudiantes. */}
          {rolSeleccionado === 'estudiante' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Matrícula</FieldLabel>
                <Controller
                  control={formulario.control}
                  name="matricula"
                  render={({ field }) => <Input placeholder="Ej. 2022-0219" {...field} />}
                />
              </Field>
              <Field>
                <FieldLabel>Carrera</FieldLabel>
                <Controller
                  control={formulario.control}
                  name="carrera"
                  render={({ field }) => (
                    <Input placeholder="Ej. Ingeniería de Software" {...field} />
                  )}
                />
              </Field>
            </div>
          ) : null}

          {error ? <InlineNotification tono="error">{error}</InlineNotification> : null}

          <div className="mt-2 flex justify-end gap-2">
            <Button variante="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={formulario.formState.isSubmitting}>
              <Icono nombre="verificar" />
              Crear usuario
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
