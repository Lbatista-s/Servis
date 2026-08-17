/**
 * Pantalla 2 — Recuperar contraseña.
 *
 * No envía nada todavía: confirma en pantalla, sin revelar si el correo existe
 * en el sistema (buena práctica y coherente con el texto del prototipo).
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { RUTAS } from '@/app/rutas';
import { Button, Field, FieldLabel, Icono, InlineNotification, Input } from '@/components/ui';

import { AuthLayout } from './AuthLayout';

const esquemaRecuperacion = z.object({
  correo: z
    .string()
    .min(1, 'Indica tu correo institucional.')
    .email('El formato del correo no es válido.')
    .refine((valor) => valor.trim().toLowerCase().endsWith('@intec.edu.do'), {
      message: 'Debes usar tu correo institucional del INTEC (@intec.edu.do).',
    }),
});

type DatosRecuperacion = z.infer<typeof esquemaRecuperacion>;

export function RecuperarPage() {
  const [enviado, setEnviado] = useState(false);

  const formulario = useForm<DatosRecuperacion>({
    resolver: zodResolver(esquemaRecuperacion),
    defaultValues: { correo: '' },
  });

  return (
    <AuthLayout
      titular="Recupera tu acceso de forma"
      destacado="segura y rápida."
      descripcion="Te enviaremos instrucciones al correo institucional registrado en el sistema SERVIS. El enlace expira en 30 minutos."
      estadisticas={[
        { valor: '30', etiqueta: 'Minutos de validez' },
        { valor: 'TLS', etiqueta: 'Cifrado seguro' },
      ]}
    >
      <Button variante="ghost" tamano="sm" asChild className="mb-5 -ml-3">
        <Link to={RUTAS.login}>← Volver al inicio de sesión</Link>
      </Button>

      <h1 className="text-5xl font-bold text-ink">Recuperar contraseña</h1>
      <p className="mb-8 mt-1.5 text-md text-ink-3">
        Introduce tu correo institucional y te enviaremos las instrucciones.
      </p>

      <form onSubmit={formulario.handleSubmit(() => setEnviado(true))} noValidate>
        <Field error={formulario.formState.errors.correo?.message} className="mb-5">
          <FieldLabel requerido>Correo institucional</FieldLabel>
          <div className="relative">
            <Icono
              nombre="correo"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <Input
              type="email"
              autoComplete="username"
              placeholder="tu.nombre@intec.edu.do"
              className="pl-[38px]"
              {...formulario.register('correo')}
            />
          </div>
        </Field>

        <InlineNotification tono={enviado ? 'exito' : 'info'} className="mb-5">
          <strong className="block font-semibold">
            {enviado ? 'Instrucciones enviadas' : 'Revisa tu bandeja'}
          </strong>
          Si el correo existe en el sistema, recibirás el enlace en los próximos minutos. No olvides
          verificar la carpeta de spam.
        </InlineNotification>

        <Button type="submit" tamano="lg" className="w-full">
          Enviar instrucciones
        </Button>
      </form>
    </AuthLayout>
  );
}
