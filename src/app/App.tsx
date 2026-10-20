/** Definición de rutas y proveedores globales. */

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { Loading, ProveedorUI } from '@/components/ui';
import { useAuth } from '@/features/auth/authStore';
import { RequireRole } from '@/features/auth/RequireRole';

/**
 * Cada pantalla se descarga al visitarla por primera vez: el paquete inicial
 * sólo lleva el armazón, el acceso y lo que comparten todas.
 */
const pagina = <K extends string>(
  cargar: () => Promise<Record<K, React.ComponentType>>,
  nombre: K,
) => lazy(() => cargar().then((modulo) => ({ default: modulo[nombre] })));

const LoginPage = pagina(() => import('@/features/auth/LoginPage'), 'LoginPage');
const RecuperarPage = pagina(() => import('@/features/auth/RecuperarPage'), 'RecuperarPage');
const PanelEstudiante = pagina(
  () => import('@/features/requests/PanelEstudiante'),
  'PanelEstudiante',
);
const MisSolicitudesPage = pagina(
  () => import('@/features/requests/MisSolicitudesPage'),
  'MisSolicitudesPage',
);
const MisDocumentosPage = pagina(
  () => import('@/features/requests/MisDocumentosPage'),
  'MisDocumentosPage',
);
const CatalogoPage = pagina(() => import('@/features/catalog/CatalogoPage'), 'CatalogoPage');
const NuevaSolicitudPage = pagina(
  () => import('@/features/requests/NuevaSolicitudPage'),
  'NuevaSolicitudPage',
);
const DetalleSolicitudPage = pagina(
  () => import('@/features/requests/DetalleSolicitudPage'),
  'DetalleSolicitudPage',
);
const BandejaPage = pagina(() => import('@/features/admin-inbox/BandejaPage'), 'BandejaPage');
const DetalleBandejaPage = pagina(
  () => import('@/features/admin-inbox/DetalleBandejaPage'),
  'DetalleBandejaPage',
);
const CuadroMandoPage = pagina(
  () => import('@/features/cuadro-mando/CuadroMandoPage'),
  'CuadroMandoPage',
);
const InicioAdministrador = pagina(
  () => import('@/features/admin/InicioAdministrador'),
  'InicioAdministrador',
);
const UsuariosPage = pagina(
  () => import('@/features/user-management/UsuariosPage'),
  'UsuariosPage',
);
const ServiciosPage = pagina(
  () => import('@/features/service-management/ServiciosPage'),
  'ServiciosPage',
);

import { AppLayout } from './AppLayout';
import { LimiteError } from './LimiteError';
import { PaginaNoEncontrada } from './PaginaNoEncontrada';
import { RaizRedirect } from './RaizRedirect';
import { PATRONES, ROLES_BANDEJA, RUTAS } from './rutas';

export function App() {
  // Con la API real, la sesión guardada se confirma con el servidor al abrir.
  const verificarSesion = useAuth((estado) => estado.verificarSesion);
  useEffect(() => {
    void verificarSesion();
  }, [verificarSesion]);

  return (
    <BrowserRouter>
      <ProveedorUI>
        <Rutas />
      </ProveedorUI>
    </BrowserRouter>
  );
}

function Rutas() {
  const ubicacion = useLocation();
  return (
    <LimiteError claveReinicio={ubicacion.pathname}>
      <Suspense fallback={<Loading mensaje="Cargando…" />}>
        <Routes>
          {/* Públicas */}
          <Route path={RUTAS.login} element={<LoginPage />} />
          <Route path={RUTAS.recuperar} element={<RecuperarPage />} />

          {/* Autenticadas */}
          <Route element={<AppLayout />}>
            <Route
              path={RUTAS.inicio}
              element={
                <RequireRole roles={['estudiante']}>
                  <PanelEstudiante />
                </RequireRole>
              }
            />
            <Route
              path={RUTAS.catalogo}
              element={
                <RequireRole roles={['estudiante']}>
                  <CatalogoPage />
                </RequireRole>
              }
            />
            <Route
              path={RUTAS.misSolicitudes}
              element={
                <RequireRole roles={['estudiante']}>
                  <MisSolicitudesPage />
                </RequireRole>
              }
            />
            <Route
              path={RUTAS.misDocumentos}
              element={
                <RequireRole roles={['estudiante']}>
                  <MisDocumentosPage />
                </RequireRole>
              }
            />
            <Route
              path={PATRONES.nuevaSolicitud}
              element={
                <RequireRole roles={['estudiante']}>
                  <NuevaSolicitudPage />
                </RequireRole>
              }
            />
            <Route
              path={PATRONES.detalleSolicitud}
              element={
                <RequireRole roles={['estudiante']}>
                  <DetalleSolicitudPage />
                </RequireRole>
              }
            />

            <Route
              path={RUTAS.bandeja}
              element={
                <RequireRole roles={ROLES_BANDEJA}>
                  <BandejaPage />
                </RequireRole>
              }
            />
            <Route
              path={PATRONES.detalleBandeja}
              element={
                <RequireRole roles={ROLES_BANDEJA}>
                  <DetalleBandejaPage />
                </RequireRole>
              }
            />
            <Route
              path={RUTAS.cuadroMando}
              element={
                <RequireRole roles={ROLES_BANDEJA}>
                  <CuadroMandoPage />
                </RequireRole>
              }
            />
            <Route path={RUTAS.reportes} element={<Navigate to={RUTAS.cuadroMando} replace />} />

            <Route
              path={RUTAS.inicioAdmin}
              element={
                <RequireRole roles={['administrador']}>
                  <InicioAdministrador />
                </RequireRole>
              }
            />

            <Route
              path={RUTAS.usuarios}
              element={
                <RequireRole roles={['administrador']}>
                  <UsuariosPage />
                </RequireRole>
              }
            />
            <Route
              path={RUTAS.servicios}
              element={
                <RequireRole roles={['administrador']}>
                  <ServiciosPage />
                </RequireRole>
              }
            />
          </Route>

          {/* La raíz lleva a cada rol a su pantalla inicial. */}
          <Route path="/" element={<RaizRedirect />} />
          <Route path="*" element={<PaginaNoEncontrada />} />
        </Routes>
      </Suspense>
    </LimiteError>
  );
}
