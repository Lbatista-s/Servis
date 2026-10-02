/** Definición de rutas y proveedores globales. */

import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ProveedorUI } from '@/components/ui';
import { DetalleBandejaPage } from '@/features/admin-inbox/DetalleBandejaPage';
import { BandejaPage } from '@/features/admin-inbox/BandejaPage';
import { useAuth } from '@/features/auth/authStore';
import { LoginPage } from '@/features/auth/LoginPage';
import { RecuperarPage } from '@/features/auth/RecuperarPage';
import { RequireRole } from '@/features/auth/RequireRole';
import { InicioAdministrador } from '@/features/admin/InicioAdministrador';
import { CatalogoPage } from '@/features/catalog/CatalogoPage';
import { CuadroMandoPage } from '@/features/cuadro-mando/CuadroMandoPage';
import { DetalleSolicitudPage } from '@/features/requests/DetalleSolicitudPage';
import { NuevaSolicitudPage } from '@/features/requests/NuevaSolicitudPage';
import { PanelEstudiante } from '@/features/requests/PanelEstudiante';
import { ServiciosPage } from '@/features/service-management/ServiciosPage';
import { UsuariosPage } from '@/features/user-management/UsuariosPage';

import { AppLayout } from './AppLayout';
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProveedorUI>
    </BrowserRouter>
  );
}
