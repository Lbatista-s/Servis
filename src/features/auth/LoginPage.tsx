/**
 * Pantalla 1 — Inicio de sesión.
 *
 * Con la API real (`VITE_DATA_SOURCE=http`) el correo y la contraseña los
 * valida Django. En el modo de demostración la contraseña no se comprueba y un
 * selector permite entrar con cualquiera de las cuentas de ejemplo.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Input as AntInput, Select } from 'antd';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { INICIO_POR_ROL, RUTAS } from '@/app/rutas';
import {
  AvatarUsuario,
  Button,
  Field,
  FieldHint,
  FieldLabel,
  Icono,
  InlineNotification,
  Input,
} from '@/components/ui';
import { fuenteActiva } from '@/data';
import { ETIQUETA_ROL } from '@/domain/types';
import { useServicios, useUsuarios } from '@/hooks/useDatos';

import { correoInstitucional, EJEMPLO_CORREO } from '@/lib/esquemas';

import { AuthLayout } from './AuthLayout';
import { useAuth, useUsuarioActual } from './authStore';

const DEMOSTRACION = fuenteActiva() === 'local';

const esquemaAcceso = z.object({
  correo: correoInstitucional(),
  contrasena: DEMOSTRACION ? z.string() : z.string().min(1, 'Escribe tu contraseña.'),
});

type DatosAcceso = z.infer<typeof esquemaAcceso>;

export function LoginPage() {
  const usuario = useUsuarioActual();
  const { iniciarSesion, cargando, error, limpiarError } = useAuth();
  const { datos: usuarios } = useUsuarios({ activo: true }, DEMOSTRACION);
  const { datos: servicios } = useServicios({ soloActivos: true });
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const formulario = useForm<DatosAcceso>({
    resolver: zodResolver(esquemaAcceso),
    defaultValues: DEMOSTRACION
      ? { correo: 'l.batista@intec.edu.do', contrasena: 'demostracion' }
      : { correo: '', contrasena: '' },
  });

  const correoActual = formulario.watch('correo');

  // Cambiar el correo descarta el error del intento anterior. Al montar no se
  // borra: puede traer el aviso de que la sesión expiró.
  const correoInicial = useRef(correoActual);
  useEffect(() => {
    if (correoActual !== correoInicial.current) limpiarError();
  }, [correoActual, limpiarError]);

  // Si ya hay sesión, se entra directamente al panel del rol.
  if (usuario) {
    const destino = (ubicacion.state as { desde?: string } | null)?.desde;
    return <Navigate to={destino ?? INICIO_POR_ROL[usuario.rol]} replace />;
  }

  async function enviar(datos: DatosAcceso) {
    const exito = await iniciarSesion(datos.correo, datos.contrasena);
    if (!exito) return;

    const cuenta = useAuth.getState().usuario;
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
        // Contra la API real el catálogo puede exigir sesión: sin dato, la
        // cifra se omite en lugar de mostrar un cero engañoso.
        ...(servicios?.length
          ? [{ valor: String(servicios.length), etiqueta: 'Servicios digitalizados' }]
          : []),
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

        <Field error={formulario.formState.errors.contrasena?.message} className="mb-4">
          <FieldLabel htmlFor="clave" requerido={!DEMOSTRACION}>
            Contraseña
          </FieldLabel>
          <Controller
            control={formulario.control}
            name="contrasena"
            render={({ field }) => (
              <AntInput.Password
                id="clave"
                autoComplete="current-password"
                prefix={<Icono nombre="candado" className="text-ink-3" />}
                {...field}
              />
            )}
          />
          {DEMOSTRACION ? (
            <FieldHint>Modo de demostración: la contraseña no se verifica.</FieldHint>
          ) : null}
        </Field>

        {/* Selector de cuenta de demostración: fija el rol activo. */}
        {DEMOSTRACION ? (
          <Field className="mb-5">
            <FieldLabel htmlFor="cuenta">Acceder como</FieldLabel>
            <Select
              id="cuenta"
              className="w-full"
              aria-label="Seleccionar cuenta de demostración"
              placeholder="Selecciona una cuenta"
              value={correoActual}
              onChange={(valor: string) =>
                formulario.setValue('correo', valor, { shouldValidate: true })
              }
              options={(usuarios ?? []).map((cuenta) => ({
                value: cuenta.correo,
                label: (
                  <span className="flex items-center gap-2">
                    <AvatarUsuario usuario={cuenta} tamano="md" />
                    <span>
                      {cuenta.nombre}
                      <span className="text-ink-3"> · {ETIQUETA_ROL[cuenta.rol]}</span>
                    </span>
                  </span>
                ),
              }))}
            />
          </Field>
        ) : null}

        {error ? (
          <InlineNotification tono="error" className="mb-5">
            {error}
          </InlineNotification>
        ) : null}

        <div className="mb-6 flex items-center justify-end">
          <Link
            to={RUTAS.recuperar}
            className="rounded-xs text-sm text-primary-dark underline hover:text-primary"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" tamano="lg" block disabled={cargando}>
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
