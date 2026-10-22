/**
 * Pantalla 2 — Recuperar contraseña.
 *
 * Pide a la API el correo de recuperación. La respuesta es la misma exista o no
 * la cuenta, así que la confirmación tampoco revela si el correo está
 * registrado.
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

import { repositorios } from '@/data';
import { mensajeDeError } from '@/lib/errores';
import { correoInstitucional, EJEMPLO_CORREO } from '@/lib/esquemas';

import { AuthLayout } from './AuthLayout';

const esquemaRecuperacion = z.object({
  correo: correoInstitucional(),
});

type DatosRecuperacion = z.infer<typeof esquemaRecuperacion>;

export function RecuperarPage() {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formulario = useForm<DatosRecuperacion>({
    resolver: zodResolver(esquemaRecuperacion),
    defaultValues: { correo: '' },
  });

  async function enviar({ correo }: DatosRecuperacion) {
    setError(null);
    try {
      await repositorios.auth.solicitarRecuperacion(correo);
      setEnviado(true);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  }

  const enviando = formulario.formState.isSubmitting;

  return (
    <AuthLayout
      titular="Recupera tu acceso"
      descripcion="Te enviaremos un enlace al correo institucional registrado. El enlace expira en 30 minutos."
    >
      <ButtonLink to={RUTAS.login} variante="ghost" tamano="sm" className="mb-5 -ml-3">
        ← Volver al inicio de sesión
      </ButtonLink>

      <h1 className="text-5xl font-bold text-ink">Recuperar contraseña</h1>
      <p className="mb-8 mt-1.5 text-md text-ink-3">
        Introduce tu correo institucional y te enviaremos las instrucciones.
      </p>

      <form onSubmit={formulario.handleSubmit(enviar)} noValidate>
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

        {enviado ? (
          <InlineNotification tono="exito" className="!mb-5">
            <strong className="block font-semibold">Instrucciones enviadas</strong>
            Si el correo existe en el sistema, recibirás el enlace en los próximos minutos. No
            olvides verificar la carpeta de spam.
          </InlineNotification>
        ) : null}

        {error ? (
          <InlineNotification tono="error" className="!mb-5">
            {error}
          </InlineNotification>
        ) : null}

        <Button type="submit" tamano="lg" block disabled={enviando}>
          {enviando ? 'Enviando…' : enviado ? 'Enviar de nuevo' : 'Enviar instrucciones'}
        </Button>
      </form>
    </AuthLayout>
  );
}
