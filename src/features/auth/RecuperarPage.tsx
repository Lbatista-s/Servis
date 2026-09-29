/**
 * Pantalla 2 — Recuperar contraseña.
 *
 * No envía nada todavía: confirma en pantalla, sin revelar si el correo existe
 * en el sistema (buena práctica y coherente con el texto del prototipo).
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { RUTAS } from '@/app/rutas';
import {
  Button,
  ButtonLink,
  Field,
  FieldLabel,
  Icono,
  InlineNotification,
  Input,
} from '@/components/ui';

import { correoInstitucional, EJEMPLO_CORREO } from '@/lib/esquemas';

import { AuthLayout } from './AuthLayout';

const esquemaRecuperacion = z.object({
  correo: correoInstitucional(),
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
      <ButtonLink to={RUTAS.login} variante="ghost" tamano="sm" className="mb-5 -ml-3">
        ← Volver al inicio de sesión
      </ButtonLink>

      <h1 className="text-5xl font-bold text-ink">Recuperar contraseña</h1>
      <p className="mb-8 mt-1.5 text-md text-ink-3">
        Introduce tu correo institucional y te enviaremos las instrucciones.
      </p>

      <form onSubmit={formulario.handleSubmit(() => setEnviado(true))} noValidate>
        <Field error={formulario.formState.errors.correo?.message} className="mb-5">
          <FieldLabel requerido>Correo institucional</FieldLabel>
          <Controller
            control={formulario.control}
            name="correo"
            render={({ field }) => (
              <Input
                type="email"
                autoComplete="username"
                placeholder={EJEMPLO_CORREO}
                prefix={<Icono nombre="correo" className="text-ink-3" />}
                {...field}
              />
            )}
          />
        </Field>

        <InlineNotification tono={enviado ? 'exito' : 'info'} className="mb-5">
          <strong className="block font-semibold">
            {enviado ? 'Instrucciones enviadas' : 'Revisa tu bandeja'}
          </strong>
          Si el correo existe en el sistema, recibirás el enlace en los próximos minutos. No olvides
          verificar la carpeta de spam.
        </InlineNotification>

        <Button type="submit" tamano="lg" block>
          Enviar instrucciones
        </Button>
      </form>
    </AuthLayout>
  );
}
