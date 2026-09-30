/**
 * Inicio del administrador del sistema.
 *
 * Una página de inicio y no un cuadro de mando: el administrador mantiene la
 * plataforma (cuentas y catálogo), no dirige la estrategia del Área. Muestra
 * el estado de lo que administra y lo que necesita su intervención.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import { ButtonLink, Card, Icono, Loading, type NombreIcono } from '@/components/ui';
import { useUsuarioActual } from '@/features/auth/authStore';
import { NuevoUsuarioDialog } from '@/features/user-management/NuevoUsuarioDialog';
import { useServicios, useUsuarios } from '@/hooks/useDatos';
import { contar } from '@/lib/texto';

export function InicioAdministrador() {
  const usuario = useUsuarioActual();
  const usuarios = useUsuarios();
  const servicios = useServicios();

  if (!usuario) return null;
  if (usuarios.cargando || servicios.cargando) return <Loading mensaje="Cargando el sistema…" />;

  const cuentas = usuarios.datos ?? [];
  const catalogo = servicios.datos ?? [];
  const inactivas = cuentas.filter((u) => !u.activo);
  const serviciosInactivos = catalogo.filter((s) => !s.activo);
  const sinRequisitos = catalogo.filter((s) => s.requisitos.length === 0);
  const nombrePila = usuario.nombre.split(' ')[0] ?? usuario.nombre;

  const pendientes: { texto: string; a: string }[] = [
    ...(sinRequisitos.length > 0
      ? [
          {
            texto: `${contar(sinRequisitos.length, 'servicio', 'servicios')} sin requisitos: no se pueden activar hasta definirlos.`,
            a: RUTAS.servicios,
          },
        ]
      : []),
    ...(serviciosInactivos.length > 0
      ? [
          {
            texto: `${contar(serviciosInactivos.length, 'servicio inactivo', 'servicios inactivos')} en el catálogo.`,
            a: RUTAS.servicios,
          },
        ]
      : []),
    ...(inactivas.length > 0
      ? [
          {
            texto: `${contar(inactivas.length, 'cuenta desactivada', 'cuentas desactivadas')}.`,
            a: RUTAS.usuarios,
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-ink">¡Hola, {nombrePila}!</h1>
          <p className="mt-1 text-md text-ink-3">
            Administras las cuentas y el catálogo de servicios de SERVIS.
          </p>
        </div>
        <NuevoUsuarioDialog />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Acceso
          icono="usuarios"
          titulo="Gestión de usuarios"
          detalle={`${contar(cuentas.length - inactivas.length, 'cuenta activa', 'cuentas activas')} · ${contar(inactivas.length, 'desactivada', 'desactivadas')}`}
          a={RUTAS.usuarios}
          accion="Gestionar usuarios"
        />
        <Acceso
          icono="cuadricula"
          titulo="Catálogo de servicios"
          detalle={`${contar(catalogo.length - serviciosInactivos.length, 'servicio activo', 'servicios activos')} · ${contar(serviciosInactivos.length, 'inactivo', 'inactivos')}`}
          a={RUTAS.servicios}
          accion="Gestionar catálogo"
        />
      </div>

      <Card>
        <h2 className="mb-3 text-md font-semibold text-ink">Requiere tu atención</h2>
        {pendientes.length === 0 ? (
          <p className="text-base text-ink-3">Todo en orden: no hay nada pendiente.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pendientes.map((pendiente) => (
              <li key={pendiente.texto}>
                <Link
                  to={pendiente.a}
                  className="flex items-center justify-between gap-3 rounded border-l-[3px] border-l-warning bg-warning-light px-3.5 py-2.5 text-base text-ink transition-opacity hover:opacity-80"
                >
                  <span className="text-ink">{pendiente.texto}</span>
                  <Icono nombre="chevron" className="h-3.5 w-3.5 shrink-0 text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Acceso({
  icono,
  titulo,
  detalle,
  a,
  accion,
}: {
  icono: NombreIcono;
  titulo: string;
  detalle: ReactNode;
  a: string;
  accion: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary-dark">
          <Icono nombre={icono} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
          <p className="mt-0.5 text-base text-ink-3">{detalle}</p>
          <ButtonLink to={a} variante="outline" tamano="sm" className="mt-3">
            {accion}
            <Icono nombre="chevron" />
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
