/**
 * Pantalla 1 — Inicio de sesión.
 *
 * El correo y la contraseña los valida la API. Mientras responde el servidor
 * simulado, un aviso indica la contraseña común y permite rellenar el
 * formulario con una cuenta de cada rol.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Input as AntInput } from 'antd';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { INICIO_POR_ROL, RUTAS } from '@/app/rutas';
import { Button, Field, FieldLabel, Icono, InlineNotification, Input } from '@/components/ui';
import { entorno } from '@/config/entorno';
import { ETIQUETA_ROL } from '@/domain/types';
import { useServicios } from '@/hooks/useDatos';
import { correoInstitucional, EJEMPLO_CORREO } from '@/lib/esquemas';
import { CONTRASENA_SIMULADA, CUENTAS_SIMULADAS } from '@/mocks/cuentas';

import { AuthLayout } from './AuthLayout';
import { useAuth, useUsuarioActual } from './authStore';

const esquemaAcceso = z.object({
  correo: correoInstitucional(),
  contrasena: z.string().min(1, 'Escribe tu contraseña.'),
});

type DatosAcceso = z.infer<typeof esquemaAcceso>;

export function LoginPage() {
  const usuario = useUsuarioActual();
  const { iniciarSesion, cargando, error, limpiarError } = useAuth();
  const { datos: servicios } = useServicios({ soloActivos: true });
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const formulario = useForm<DatosAcceso>({
    resolver: zodResolver(esquemaAcceso),
    defaultValues: { correo: '', contrasena: '' },
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

  function usarCuenta(correo: string) {
    formulario.setValue('correo', correo, { shouldValidate: true });
    formulario.setValue('contrasena', CONTRASENA_SIMULADA, { shouldValidate: true });
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

      {entorno().apiSimulada ? (
        <InlineNotification tono="info" className="!mb-6">
          <p className="font-semibold">Entorno con datos simulados</p>
          <p className="font-normal">
            Todas las cuentas usan la contraseña{' '}
            <code className="font-mono font-semibold">{CONTRASENA_SIMULADA}</code>. Elige una para
            rellenar el formulario:
          </p>
          <ul className="mt-2 flex list-none p-0 flex-wrap gap-1.5">
            {CUENTAS_SIMULADAS.map((cuenta) => (
              <li key={cuenta.correo}>
                <button
                  type="button"
                  onClick={() => usarCuenta(cuenta.correo)}
                  className="rounded-sm border border-line bg-surface px-2 py-0.5 text-xs font-medium text-ink-2 hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {ETIQUETA_ROL[cuenta.rol]}
                </button>
              </li>
            ))}
          </ul>
        </InlineNotification>
      ) : null}

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
          <FieldLabel htmlFor="clave" requerido>
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
        </Field>

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
