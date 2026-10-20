/** Vistas rápidas de la bandeja (`?vista=`) contra la API simulada. */

import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProveedorUI } from '@/components/ui';
import { ESTADOS_FINALES } from '@/domain/types';
import { useAuth } from '@/features/auth/authStore';
import { baseSimulada, iniciarSesionSimulada } from '@/mocks/base';
import { USUARIOS_DEMO } from '@/mocks/datos/seed';

import { BandejaPage } from './BandejaPage';

const RICARDO = 'usr-ricardo';

beforeEach(() => {
  iniciarSesionSimulada(RICARDO);
  useAuth.setState({ usuario: USUARIOS_DEMO.find((u) => u.id === RICARDO) ?? null });
});

function renderizar(ubicacion: string) {
  render(
    <MemoryRouter initialEntries={[ubicacion]}>
      <ProveedorUI>
        <BandejaPage />
      </ProveedorUI>
    </MemoryRouter>,
  );
}

/** Identificadores de las filas de la tabla. */
async function idsEnTabla(): Promise<string[]> {
  const tabla = await screen.findByRole('table');
  await waitFor(() => expect(within(tabla).queryAllByText(/^SRV-/).length).toBeGreaterThan(0));
  return within(tabla)
    .getAllByText(/^SRV-/)
    .map((celda) => celda.textContent ?? '');
}

describe('BandejaPage: vistas rápidas', () => {
  it('«Asignadas a mí» sólo muestra las abiertas asignadas al usuario', async () => {
    renderizar('/bandeja?vista=asignadas');
    expect(await screen.findByRole('heading', { name: 'Asignadas a mí' })).toBeInTheDocument();

    const esperadas = baseSimulada()
      .solicitudes.filter((s) => s.asignadaA === RICARDO && !ESTADOS_FINALES.includes(s.estado))
      .map((s) => s.id)
      .sort();
    expect((await idsEnTabla()).sort()).toEqual(esperadas);
    // La vista sustituye al selector de estado y se puede quitar.
    expect(screen.getByRole('link', { name: /Vista: Asignadas a mí/ })).toHaveAttribute(
      'href',
      '/bandeja',
    );
  });

  it('«Devueltas» sólo muestra solicitudes devueltas', async () => {
    renderizar('/bandeja?vista=devueltas');
    const esperadas = baseSimulada()
      .solicitudes.filter((s) => s.estado === 'devuelta')
      .map((s) => s.id)
      .sort();
    expect((await idsEnTabla()).sort()).toEqual(esperadas);
  });
});
