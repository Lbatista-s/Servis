import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProveedorUI } from '@/components/ui';
import { useAuth } from '@/features/auth/authStore';
import { clienteConsultas } from '@/hooks/clienteConsultas';
import { iniciarSesionSimulada } from '@/mocks/base';
import { USUARIOS_DEMO } from '@/mocks/datos/seed';

import { Sidebar } from './Sidebar';

/** Monta la barra y espera a que terminen sus consultas (los contadores). */
async function renderizarComo(id: string) {
  iniciarSesionSimulada(id);
  useAuth.setState({ usuario: USUARIOS_DEMO.find((u) => u.id === id) ?? null });
  render(
    <MemoryRouter initialEntries={['/catalogo']}>
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
});
