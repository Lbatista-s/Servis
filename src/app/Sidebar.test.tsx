import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProveedorUI } from '@/components/ui';
import { useAuth } from '@/features/auth/authStore';
import { clienteConsultas } from '@/hooks/clienteConsultas';
import { baseSimulada, iniciarSesionSimulada } from '@/mocks/base';
import { USUARIOS_DEMO } from '@/mocks/datos/seed';

import { Sidebar } from './Sidebar';

/** Monta la barra y espera a que terminen sus consultas (los contadores). */
async function renderizarComo(id: string, ubicacion = '/catalogo') {
  iniciarSesionSimulada(id);
  useAuth.setState({ usuario: USUARIOS_DEMO.find((u) => u.id === id) ?? null });
  render(
    <MemoryRouter initialEntries={[ubicacion]}>
      <ProveedorUI>
        <Sidebar />
      </ProveedorUI>
    </MemoryRouter>,
  );
  await waitFor(() => expect(clienteConsultas.isFetching()).toBe(0));
}

describe('Sidebar', () => {
  it.each([
    ['usr-luis', '/inicio'],
    ['usr-ricardo', '/bandeja'],
    ['usr-axell', '/cuadro-de-mando'],
    ['usr-edwin', '/admin'],
  ])('el logotipo lleva al inicio del rol (%s → %s)', async (id, destino) => {
    await renderizarComo(id);
    expect(screen.getByRole('link', { name: 'SERVIS — ir al inicio' })).toHaveAttribute(
      'href',
      destino,
    );
  });

  it('sólo contiene la navegación: la cuenta vive en la barra superior', async () => {
    await renderizarComo('usr-luis');
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
    expect(screen.queryByText('Configuración')).toBeNull();
  });

  it('agrupa la navegación del estudiante en Principal y Mis trámites', async () => {
    await renderizarComo('usr-luis');
    expect(screen.getByText('Mis trámites')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute(
      'href',
      '/solicitudes',
    );
    expect(screen.getByRole('link', { name: 'Mis documentos' })).toHaveAttribute(
      'href',
      '/documentos',
    );
  });

  it('ofrece al personal las vistas rápidas de la bandeja con sus contadores', async () => {
    await renderizarComo('usr-ricardo');
    const abiertas = (s: { estado: string }) =>
      !['completada', 'rechazada', 'cancelada'].includes(s.estado);
    const asignadas = baseSimulada().solicitudes.filter(
      (s) => s.asignadaA === 'usr-ricardo' && abiertas(s),
    ).length;
    expect(asignadas).toBeGreaterThan(0);

    const enlace = screen.getByRole('link', { name: 'Asignadas a mí' });
    expect(enlace).toHaveAttribute('href', '/bandeja?vista=asignadas');
    const fila = enlace.closest('li');
    if (!fila) throw new Error('Falta la fila del menú.');
    expect(within(fila).getByText(String(asignadas))).toBeInTheDocument();
  });

  it('marca la vista rápida activa según la consulta', async () => {
    await renderizarComo('usr-ricardo', '/bandeja?vista=devueltas');
    const activa = screen.getByRole('link', { name: 'Devueltas' }).closest('li');
    expect(activa).toHaveClass('ant-menu-item-selected');
    expect(
      screen.getByRole('link', { name: 'Todas las solicitudes' }).closest('li'),
    ).not.toHaveClass('ant-menu-item-selected');
  });

  it('muestra el contacto del Área y el aviso de datos simulados', async () => {
    await renderizarComo('usr-edwin');
    const ayuda = screen.getByRole('complementary', { name: 'Ayuda' });
    expect(within(ayuda).getByRole('link', { name: 'servicios.ing@intec.edu.do' })).toHaveAttribute(
      'href',
      'mailto:servicios.ing@intec.edu.do',
    );
    expect(within(ayuda).getByText('Datos simulados')).toBeInTheDocument();
  });
});
