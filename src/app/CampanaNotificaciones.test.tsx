/** Prueba de la campana de notificaciones contra la API simulada. */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProveedorUI } from '@/components/ui';
import { useAuth } from '@/features/auth/authStore';
import { iniciarSesionSimulada } from '@/mocks/base';
import { USUARIOS_DEMO } from '@/mocks/datos/seed';

import { CampanaNotificaciones } from './CampanaNotificaciones';

function entrarComo(id: string) {
  iniciarSesionSimulada(id);
  useAuth.setState({ usuario: USUARIOS_DEMO.find((u) => u.id === id) ?? null });
  render(
    <MemoryRouter initialEntries={['/bandeja']}>
      <ProveedorUI>
        <CampanaNotificaciones />
        <Routes>
          <Route path="/bandeja" element={<p>Bandeja</p>} />
          <Route path="/bandeja/:id" element={<p>Detalle de la solicitud</p>} />
        </Routes>
      </ProveedorUI>
    </MemoryRouter>,
  );
}

describe('CampanaNotificaciones', () => {
  it('anuncia los avisos sin leer y lleva a la solicitud al elegir uno', async () => {
    const usuario = userEvent.setup();
    entrarComo('usr-ricardo');

    const campana = await screen.findByRole('button', { name: /Notificaciones, \d+ sin leer/ });
    const pendientes = Number(/(\d+) sin leer/.exec(campana.getAttribute('aria-label') ?? '')?.[1]);
    await usuario.click(campana);

    const lista = await screen.findByRole('list');
    const [primero] = within(lista).getAllByRole('button', { name: /sin leer/ });
    if (!primero) throw new Error('Debería haber avisos sin leer.');
    await usuario.click(primero);

    expect(await screen.findByText('Detalle de la solicitud')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: new RegExp(`Notificaciones, ${pendientes - 1} sin`) }),
      ).toBeInTheDocument(),
    );
  });

  it('marca todas como leídas', async () => {
    const usuario = userEvent.setup();
    entrarComo('usr-ricardo');

    await usuario.click(
      await screen.findByRole('button', { name: /Notificaciones, \d+ sin leer/ }),
    );
    await usuario.click(await screen.findByRole('button', { name: 'Marcar todas como leídas' }));
    expect(await screen.findByRole('button', { name: 'Notificaciones' })).toBeInTheDocument();
  });
});
