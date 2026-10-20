/**
 * Armazón de las pantallas autenticadas.
 *
 * En escritorio la barra lateral es fija; por debajo de `lg` se convierte en un
 * panel deslizante que se cierra al navegar.
 */

import { Drawer, Layout } from 'antd';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { ESTRUCTURA } from '@/theme/tokens';

import { DevRoleSwitcher } from './DevRoleSwitcher';
import { Sidebar } from './Sidebar';
import { titulosDe } from './navegacion';
import { Topbar } from './Topbar';

export function AppLayout() {
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { titulo, subtitulo } = titulosDe(ubicacion.pathname);

  // El panel lateral se cierra automáticamente al cambiar de pantalla.
  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <DevRoleSwitcher />

      <Layout hasSider className="min-h-0 flex-1">
        {/* Barra lateral fija en escritorio. El `!` hace falta porque el
            `display` de Ant Design (hashPriority alto) ganaría a Tailwind. */}
        <Layout.Sider width={ESTRUCTURA.barraLateral} className="!hidden lg:!block">
          <Sidebar />
        </Layout.Sider>

        {/* Panel deslizante en pantallas estrechas */}
        <Drawer
          placement="left"
          open={menuAbierto}
          onClose={() => setMenuAbierto(false)}
          closable={false}
          size={ESTRUCTURA.barraLateral}
          styles={{ body: { padding: 0 } }}
          aria-label="Navegación"
        >
          <Sidebar onNavegar={() => setMenuAbierto(false)} />
        </Drawer>

        <Layout className="min-w-0">
          <Topbar titulo={titulo} subtitulo={subtitulo} onAbrirMenu={() => setMenuAbierto(true)} />
          <Layout.Content className="overflow-y-auto p-4 lg:p-7">
            <Outlet />
          </Layout.Content>
        </Layout>
      </Layout>
    </div>
  );
}
