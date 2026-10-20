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
      within(dialogo).getByRole('switch', {
        name: 'Pedir «Documento de identidad (cédula o pasaporte)»',
      }),
    );
    await usuario.click(within(dialogo).getByRole('switch', { name: /Publicar en el catálogo/ }));
    await usuario.click(within(dialogo).getByRole('button', { name: /Crear servicio/ }));

    await waitFor(() =>
      expect(baseSimulada().servicios.find((s) => s.id === 'constancia-de-estudios')).toMatchObject(
        {
          activo: true,
          requisitos: [
            {
              id: 'documento-identidad',
              descripcion: 'Documento de identidad (cédula o pasaporte)',
              obligatorio: true,
            },
          ],
        },
      ),
    );
  });

  it('permite publicar un servicio que no pide documentos', async () => {
    const { usuario, dialogo } = await abrirNuevo();
    await usuario.type(within(dialogo).getByLabelText(/^Nombre(?! del)/), 'Taller de oratoria');
    await usuario.type(
      within(dialogo).getByLabelText(/^Descripción/),
      'Taller grupal de oratoria en modalidad virtual.',
    );
    await usuario.click(within(dialogo).getByRole('switch', { name: /Publicar en el catálogo/ }));
    await usuario.click(within(dialogo).getByRole('button', { name: /Crear servicio/ }));

    await waitFor(() =>
      expect(baseSimulada().servicios.find((s) => s.id === 'taller-de-oratoria')).toMatchObject({
        activo: true,
        requisitos: [],
      }),
    );
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
      within(dialogo).getByRole('switch', {
        name: 'Pedir «Documento de identidad (cédula o pasaporte)»',
      }),
    ).not.toBeChecked();
  });

  it('añade un documento, cambia otro a obligatorio y guarda', async () => {
    const { usuario, dialogo } = await abrirEdicion('pasantia');
    await usuario.click(
      within(dialogo).getByRole('switch', {
        name: 'Pedir «Documento de identidad (cédula o pasaporte)»',
      }),
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
        {
          id: 'documento-identidad',
          descripcion: 'Documento de identidad (cédula o pasaporte)',
          obligatorio: true,
        },
      ]),
    );
  });

  it('guarda un servicio publicado aunque deje de pedir documentos', async () => {
    const { usuario, dialogo } = await abrirEdicion('ingles');
    await usuario.click(
      within(dialogo).getByRole('switch', {
        name: 'Pedir «Documento de identidad (cédula o pasaporte)»',
      }),
    );
    await usuario.click(within(dialogo).getByRole('button', { name: /Guardar cambios/ }));
    await waitFor(() => expect(servicio('ingles')).toMatchObject({ activo: true, requisitos: [] }));
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
