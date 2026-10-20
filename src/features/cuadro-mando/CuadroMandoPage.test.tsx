/**
 * Prueba de interfaz del cuadro de mando sobre la API simulada y su historial
 * de seis meses.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProveedorUI } from '@/components/ui';
import { MISION } from '@/domain/indicadores';
import type { Usuario } from '@/domain/types';
import { useAuth } from '@/features/auth/authStore';
import { iniciarSesionSimulada } from '@/mocks/base';
import { USUARIOS_DEMO } from '@/mocks/datos/seed';

import { CuadroMandoPage } from './CuadroMandoPage';

function entrarComo(id: string) {
  const usuario = USUARIOS_DEMO.find((u) => u.id === id) as Usuario;
  iniciarSesionSimulada(id);
  useAuth.setState({ usuario });
  return render(
    <MemoryRouter>
      <ProveedorUI>
        <CuadroMandoPage />
      </ProveedorUI>
    </MemoryRouter>,
  );
}

const mapa = () => screen.getByRole('list', { name: 'Mapa estratégico' });

describe('CuadroMandoPage', () => {
  it('presenta la misión y las cuatro perspectivas del mapa estratégico', async () => {
    entrarComo('usr-axell');

    await waitFor(() => expect(mapa()).toBeInTheDocument());
    expect(within(mapa()).getByText(MISION)).toBeInTheDocument();
    for (const perspectiva of [
      'Estudiante',
      'Recursos',
      'Procesos internos',
      'Aprendizaje y crecimiento',
    ]) {
      expect(within(mapa()).getByRole('listitem', { name: perspectiva })).toBeInTheDocument();
    }
    // Una fila por indicador en el scorecard.
    expect(screen.getAllByRole('button', { name: /^Ver detalle de / })).toHaveLength(11);
  });

  it('sólo el coordinador puede editar las metas', async () => {
    entrarComo('usr-ricardo');
    await waitFor(() => expect(mapa()).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Editar metas/ })).not.toBeInTheDocument();
  });

  it('al cambiar una meta, el estado del indicador se reevalúa', async () => {
    const usuario = userEvent.setup();
    entrarComo('usr-axell');
    const ficha = () => within(mapa()).getByRole('button', { name: /^Catálogo digitalizado:/ });

    // 9 de 11 servicios activos frente a una meta del 100 %.
    await waitFor(() => expect(ficha()).toHaveAccessibleName(/No cumple/));

    await usuario.click(screen.getByRole('button', { name: /Editar metas/ }));
    const dialogo = await screen.findByRole('dialog');
    const campo = within(dialogo).getByLabelText(/Catálogo digitalizado/);
    await usuario.clear(campo);
    await usuario.type(campo, '80');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar metas' }));

    await waitFor(() => expect(ficha()).toHaveAccessibleName(/, Cumple\./));
  });
});
