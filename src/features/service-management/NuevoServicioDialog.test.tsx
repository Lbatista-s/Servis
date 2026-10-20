/** Alta de un servicio desde el diálogo, contra la API simulada. */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProveedorUI } from '@/components/ui';
import { baseSimulada, iniciarSesionSimulada } from '@/mocks/base';

import { NuevoServicioDialog } from './NuevoServicioDialog';

beforeEach(() => {
  iniciarSesionSimulada('usr-edwin');
});

async function abrir() {
  const usuario = userEvent.setup();
  render(
    <ProveedorUI>
      <NuevoServicioDialog />
    </ProveedorUI>,
  );
  await usuario.click(screen.getByRole('button', { name: /Nuevo servicio/ }));
  const dialogo = await screen.findByRole('dialog');
  return { usuario, dialogo };
}

describe('NuevoServicioDialog', () => {
  it('valida los campos antes de enviar', async () => {
    const { usuario, dialogo } = await abrir();
    await usuario.click(within(dialogo).getByRole('button', { name: /Crear servicio/ }));
    expect(
      await within(dialogo).findByText('Escribe un nombre de al menos 3 caracteres.'),
    ).toBeInTheDocument();
    expect(within(dialogo).getByText('Describe el requisito.')).toBeInTheDocument();
  });

  it('crea el servicio activo con sus requisitos', async () => {
    const { usuario, dialogo } = await abrir();
    await usuario.type(within(dialogo).getByLabelText(/^Nombre/), 'Constancia de estudios');
    await usuario.type(
      within(dialogo).getByLabelText(/^Descripción/),
      'Certifica la inscripción vigente del estudiante.',
    );
    await usuario.type(within(dialogo).getByLabelText('Requisito 1'), 'Copia de la cédula');
    await usuario.click(within(dialogo).getByRole('switch'));
    await usuario.click(within(dialogo).getByRole('button', { name: /Crear servicio/ }));

    await waitFor(() =>
      expect(baseSimulada().servicios.find((s) => s.id === 'constancia-de-estudios')).toMatchObject(
        { activo: true, requisitos: [{ descripcion: 'Copia de la cédula', obligatorio: true }] },
      ),
    );
  });

  it('sin requisitos no permite publicarlo', async () => {
    const { usuario, dialogo } = await abrir();
    await usuario.click(within(dialogo).getByRole('button', { name: 'Quitar requisito 1' }));
    expect(within(dialogo).getByRole('switch')).toBeDisabled();
    expect(
      within(dialogo).getByText('Sin requisitos, el servicio se crea inactivo.'),
    ).toBeVisible();
  });
});
