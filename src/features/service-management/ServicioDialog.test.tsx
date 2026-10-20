/** Alta y edición de servicios contra la API simulada. */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProveedorUI } from '@/components/ui';
import { baseSimulada, iniciarSesionSimulada } from '@/mocks/base';

import { EditarServicioDialog, NuevoServicioDialog } from './ServicioDialog';

beforeEach(() => {
  iniciarSesionSimulada('usr-edwin');
});

const servicio = (id: string) => {
  const encontrado = baseSimulada().servicios.find((s) => s.id === id);
  if (!encontrado) throw new Error(`Falta el servicio ${id}.`);
  return encontrado;
};

async function abrirNuevo() {
  const usuario = userEvent.setup();
  render(
    <ProveedorUI>
      <NuevoServicioDialog />
    </ProveedorUI>,
  );
  await usuario.click(screen.getByRole('button', { name: /Nuevo servicio/ }));
  const dialogo = await screen.findByRole('dialog');
  await within(dialogo).findByRole('list', { name: 'Catálogo de documentos' });
  return { usuario, dialogo };
}

async function abrirEdicion(id: string) {
  const usuario = userEvent.setup();
  render(
    <ProveedorUI>
      <EditarServicioDialog servicio={servicio(id)} />
    </ProveedorUI>,
  );
  await usuario.click(screen.getByRole('button', { name: `Editar ${servicio(id).nombre}` }));
  const dialogo = await screen.findByRole('dialog');
  await within(dialogo).findByRole('list', { name: 'Catálogo de documentos' });
  return { usuario, dialogo };
}

describe('Nuevo servicio', () => {
  it('valida los campos antes de enviar', async () => {
    const { usuario, dialogo } = await abrirNuevo();
    await usuario.click(within(dialogo).getByRole('button', { name: /Crear servicio/ }));
    expect(
      await within(dialogo).findByText('Escribe un nombre de al menos 3 caracteres.'),
    ).toBeInTheDocument();
  });

  it('crea el servicio activo con documentos del catálogo', async () => {
    const { usuario, dialogo } = await abrirNuevo();
    await usuario.type(within(dialogo).getByLabelText(/^Nombre(?! del)/), 'Constancia de estudios');
    await usuario.type(
      within(dialogo).getByLabelText(/^Descripción/),
      'Certifica la inscripción vigente del estudiante.',
    );
    await usuario.click(
      within(dialogo).getByRole('switch', { name: 'Pedir «Documento de identidad»' }),
    );
    await usuario.click(within(dialogo).getByRole('switch', { name: /Publicar en el catálogo/ }));
    await usuario.click(within(dialogo).getByRole('button', { name: /Crear servicio/ }));

    await waitFor(() =>
      expect(baseSimulada().servicios.find((s) => s.id === 'constancia-de-estudios')).toMatchObject(
        {
          activo: true,
          requisitos: [
            { id: 'documento-identidad', descripcion: 'Documento de identidad', obligatorio: true },
          ],
        },
      ),
    );
  });

  it('sin documentos no permite publicarlo', async () => {
    const { dialogo } = await abrirNuevo();
    expect(within(dialogo).getByRole('switch', { name: /Publicar en el catálogo/ })).toBeDisabled();
  });
});

describe('Editar servicio', () => {
  it('muestra activados los documentos que ya pide', async () => {
    const { dialogo } = await abrirEdicion('pasantia');
    expect(
      within(dialogo).getByRole('switch', {
        name: 'Pedir «Datos completos del supervisor inmediato»',
      }),
    ).toBeChecked();
    expect(
      within(dialogo).getByRole('switch', { name: 'Pedir «Documento de identidad»' }),
    ).not.toBeChecked();
  });

  it('añade un documento, cambia otro a obligatorio y guarda', async () => {
    const { usuario, dialogo } = await abrirEdicion('pasantia');
    await usuario.click(
      within(dialogo).getByRole('switch', { name: 'Pedir «Documento de identidad»' }),
    );
    const supervisor = within(dialogo).getByRole('radiogroup', {
      name: '«Datos completos del supervisor inmediato»: obligatorio u opcional',
    });
    await usuario.click(within(supervisor).getByText('Obligatorio'));
    await usuario.click(within(dialogo).getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(servicio('pasantia').requisitos).toEqual([
        {
          id: 'carta-aceptacion',
          descripcion: 'Carta de aceptación de la empresa en papel membretado',
          obligatorio: true,
        },
        {
          id: 'datos-supervisor',
          descripcion: 'Datos completos del supervisor inmediato',
          obligatorio: true,
        },
        { id: 'documento-identidad', descripcion: 'Documento de identidad', obligatorio: true },
      ]),
    );
  });

  it('no deja un servicio publicado sin documentos', async () => {
    const { usuario, dialogo } = await abrirEdicion('ingles');
    await usuario.click(
      within(dialogo).getByRole('switch', { name: 'Pedir «Documento de identidad»' }),
    );
    expect(within(dialogo).getByText(/debe pedir al menos un documento/)).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: /Guardar cambios/ })).toBeDisabled();
  });

  it('añade un documento nuevo al catálogo y lo pide en el servicio', async () => {
    const { usuario, dialogo } = await abrirEdicion('pasantia');
    await usuario.type(
      within(dialogo).getByLabelText('Nombre del documento nuevo'),
      'Certificado médico',
    );
    await usuario.click(within(dialogo).getByRole('button', { name: /Añadir al catálogo/ }));

    expect(
      await within(dialogo).findByRole('switch', { name: 'Pedir «Certificado médico»' }),
    ).toBeChecked();
    expect(baseSimulada().documentos.some((d) => d.id === 'certificado-medico')).toBe(true);
  });
});
