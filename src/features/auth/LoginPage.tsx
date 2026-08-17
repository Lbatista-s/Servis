/**
 * Pantalla 1 — Inicio de sesión.
 *
 * La autenticación es simulada: no hay contraseña real. El selector de usuario
 * fija la cuenta activa y, con ella, el rol; el campo de contraseña se conserva
 * por fidelidad con el prototipo y para que la pantalla no cambie cuando exista
 * autenticación de verdad.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { INICIO_POR_ROL, RUTAS } from '@/app/rutas';
import {
  Avatar,
  Button,
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
} from '@/components/ui';
import { ETIQUETA_ROL } from '@/domain/types';
import { useServicios, useUsuarios } from '@/hooks/useDatos';

import { AuthLayout } from './AuthLayout';
import { useAuth, useUsuarioActual } from './authStore';

const esquemaAcceso = z.object({
  correo: z
    .string()
    .min(1, 'Indica tu correo institucional.')
    .email('El formato del correo no es válido.')
    .refine((valor) => valor.trim().toLowerCase().endsWith('@intec.edu.do'), {
      message: 'Debes usar tu correo institucional del INTEC (@intec.edu.do).',
    }),
});

type DatosAcceso = z.infer<typeof esquemaAcceso>;

export function LoginPage() {
  const usuario = useUsuarioActual();
  const { iniciarSesion, cargando, error, limpiarError } = useAuth();
  const { datos: usuarios } = useUsuarios({ activo: true });
  const { datos: servicios } = useServicios({ soloActivos: true });
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const formulario = useForm<DatosAcceso>({
    resolver: zodResolver(esquemaAcceso),
    defaultValues: { correo: 'l.batista@intec.edu.do' },
  });

  const correoActual = formulario.watch('correo');

  // Cualquier cambio en el formulario descarta el error del intento anterior.
  useEffect(() => {
    limpiarError();
  }, [correoActual, limpiarError]);

  // Si ya hay sesión, se entra directamente al panel del rol.
  if (usuario) {
    const destino = (ubicacion.state as { desde?: string } | null)?.desde;
    return <Navigate to={destino ?? INICIO_POR_ROL[usuario.rol]} replace />;
  }

  async function enviar(datos: DatosAcceso) {
    const exito = await iniciarSesion(datos.correo);
    if (!exito) return;

    const cuenta = (usuarios ?? []).find(
      (u) => u.correo.toLowerCase() === datos.correo.trim().toLowerCase(),
    );
    const destino =
      (ubicacion.state as { desde?: string } | null)?.desde ??
      (cuenta ? INICIO_POR_ROL[cuenta.rol] : RUTAS.inicio);
    navegar(destino, { replace: true });
  }

  return (
    <AuthLayout
      titular="Tramita tus servicios"
      destacado="cuando y donde los necesites."
      descripcion="La plataforma digital del Área de Ingenierías de INTEC para gestionar solicitudes académicas y administrativas de forma eficiente y trazable."
      estadisticas={[
        { valor: String(servicios?.length ?? 0), etiqueta: 'Servicios digitalizados' },
        { valor: '100%', etiqueta: 'Seguimiento en línea' },
        { valor: '0', etiqueta: 'Papeles requeridos' },
      ]}
    >
      <h1 className="text-5xl font-bold text-ink">Iniciar sesión</h1>
      <p className="mb-8 mt-1.5 text-md text-ink-3">
        Usa tu correo institucional INTEC para acceder.
      </p>

      <form onSubmit={formulario.handleSubmit(enviar)} noValidate>
        <Field error={formulario.formState.errors.correo?.message} className="mb-4">
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

        <Field className="mb-4">
          <FieldLabel htmlFor="clave">Contraseña</FieldLabel>
          <div className="relative">
            <Icono
              nombre="candado"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <Input
              id="clave"
              type="password"
              autoComplete="current-password"
              defaultValue="demostracion"
              className="pl-[38px]"
            />
          </div>
          <FieldHint>
            Autenticación simulada: en esta fase la contraseña no se verifica.
          </FieldHint>
        </Field>

        {/* Selector de cuenta de demostración: fija el rol activo. */}
        <Field className="mb-5">
          <FieldLabel htmlFor="cuenta">Acceder como</FieldLabel>
          <Select
            value={correoActual}
            onValueChange={(valor) =>
              formulario.setValue('correo', valor, { shouldValidate: true })
            }
          >
            <SelectTrigger id="cuenta" aria-label="Seleccionar cuenta de demostración">
              <SelectValue placeholder="Selecciona una cuenta" />
            </SelectTrigger>
            <SelectContent>
              {(usuarios ?? []).map((cuenta) => (
                <SelectItem key={cuenta.id} value={cuenta.correo}>
                  <span className="flex items-center gap-2">
                    <Avatar
                      nombre={cuenta.nombre}
                      iniciales={cuenta.iniciales}
                      color={cuenta.colorAvatar}
                      tamano="md"
                    />
                    <span>
                      {cuenta.nombre}
                      <span className="text-ink-3"> · {ETIQUETA_ROL[cuenta.rol]}</span>
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {error ? (
          <InlineNotification tono="error" className="mb-5">
            {error}
          </InlineNotification>
        ) : null}

        <div className="mb-6 flex items-center justify-end">
          <Link
            to={RUTAS.recuperar}
            className="rounded-xs text-sm text-primary underline hover:text-primary-hover"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" tamano="lg" className="w-full" disabled={cargando}>
          <Icono nombre="chevron" />
          {cargando ? 'Accediendo…' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-3">
        Al acceder, aceptas los términos de uso institucional del INTEC.
      </p>
    </AuthLayout>
  );
}
