/** Alta de usuario, con validación de Zod y React Hook Form. */

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  Field,
  FieldHint,
  FieldLabel,
  Icono,
  InlineNotification,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { ETIQUETA_ROL, ROLES, type ColorAvatar, type Rol } from '@/domain/types';
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
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button tamano="sm">
          <Icono nombre="mas" />
          Crear usuario
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader
          titulo="Crear usuario"
          descripcion="Alta de una cuenta en el Área de Ingenierías."
        />

        <form onSubmit={formulario.handleSubmit(crear)} noValidate>
          <DialogBody>
            <Field error={formulario.formState.errors.nombre?.message}>
              <FieldLabel requerido>Nombre completo</FieldLabel>
              <Input placeholder="Ej. Ana García" {...formulario.register('nombre')} />
            </Field>

            <Field error={formulario.formState.errors.correo?.message}>
              <FieldLabel requerido>Correo institucional</FieldLabel>
              <Input
                type="email"
                placeholder="a.garcia@intec.edu.do"
                {...formulario.register('correo')}
              />
              <FieldHint>Debe pertenecer al dominio @intec.edu.do.</FieldHint>
            </Field>

            <Field error={formulario.formState.errors.rol?.message}>
              <FieldLabel htmlFor="rol-nuevo" requerido>
                Rol
              </FieldLabel>
              <Select
                value={rolSeleccionado}
                onValueChange={(valor) =>
                  formulario.setValue('rol', valor as Rol, { shouldValidate: true })
                }
              >
                <SelectTrigger id="rol-nuevo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((clave) => (
                    <SelectItem key={clave} value={clave}>
                      {ETIQUETA_ROL[clave]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Datos académicos: sólo tienen sentido para estudiantes. */}
            {rolSeleccionado === 'estudiante' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Matrícula</FieldLabel>
                  <Input placeholder="Ej. 2022-0219" {...formulario.register('matricula')} />
                </Field>
                <Field>
                  <FieldLabel>Carrera</FieldLabel>
                  <Input
                    placeholder="Ej. Ingeniería de Software"
                    {...formulario.register('carrera')}
                  />
                </Field>
              </div>
            ) : null}

            {error ? <InlineNotification tono="error">{error}</InlineNotification> : null}
          </DialogBody>

          <DialogFooter>
            <Button variante="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={formulario.formState.isSubmitting}>
              <Icono nombre="verificar" />
              Crear usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
