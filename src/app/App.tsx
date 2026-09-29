/** Definición de rutas y proveedores globales. */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ProveedorUI } from '@/components/ui';
import { DetalleBandejaPage } from '@/features/admin-inbox/DetalleBandejaPage';
import { BandejaPage } from '@/features/admin-inbox/BandejaPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RecuperarPage } from '@/features/auth/RecuperarPage';
import { RequireRole } from '@/features/auth/RequireRole';
import { CatalogoPage } from '@/features/catalog/CatalogoPage';
import { ReportesPage } from '@/features/reports/ReportesPage';
import { DetalleSolicitudPage } from '@/features/requests/DetalleSolicitudPage';
import { NuevaSolicitudPage } from '@/features/requests/NuevaSolicitudPage';
import { PanelEstudiante } from '@/features/requests/PanelEstudiante';
import { ServiciosPage } from '@/features/service-management/ServiciosPage';
import { UsuariosPage } from '@/features/user-management/UsuariosPage';

import { AppLayout } from './AppLayout';
import { RaizRedirect } from './RaizRedirect';
import { ROLES_BANDEJA, RUTAS } from './rutas';

export function App() {
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
              path="/solicitudes/nueva/:servicioId"
              element={
                <RequireRole roles={['estudiante']}>
                  <NuevaSolicitudPage />
                </RequireRole>
              }
            />
            <Route
              path="/solicitudes/:id"
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
              path="/bandeja/:id"
              element={
                <RequireRole roles={ROLES_BANDEJA}>
                  <DetalleBandejaPage />
                </RequireRole>
              }
            />
            <Route
              path={RUTAS.reportes}
              element={
                <RequireRole roles={ROLES_BANDEJA}>
                  <ReportesPage />
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
