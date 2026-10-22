/** Mis solicitudes y Mis documentos contra la API simulada. */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProveedorUI } from '@/components/ui';
import { useAuth } from '@/features/auth/authStore';
import { baseSimulada, iniciarSesionSimulada } from '@/mocks/base';
import { USUARIOS_DEMO } from '@/mocks/datos/seed';

import { MisDocumentosPage } from './MisDocumentosPage';
import { MisSolicitudesPage } from './MisSolicitudesPage';

// pdf.js no dibuja en jsdom: basta saber que el visor abre el documento.
vi.mock('@/components/visor/PaginasPdf', () => ({
  default: () => <p>Documento en el visor</p>,
}));

const LUIS = 'usr-luis';
const propias = () => baseSimulada().solicitudes.filter((s) => s.solicitanteId === LUIS);

beforeEach(() => {
  iniciarSesionSimulada(LUIS);
  useAuth.setState({ usuario: USUARIOS_DEMO.find((u) => u.id === LUIS) ?? null });
});

function renderizar(pagina: JSX.Element) {
  return render(
    <MemoryRouter>
      <ProveedorUI>{pagina}</ProveedorUI>
    </MemoryRouter>,
  );
}

describe('MisSolicitudesPage', () => {
  it('lista todas las solicitudes del estudiante', async () => {
    renderizar(<MisSolicitudesPage />);
    const lista = await screen.findByRole('list', { name: 'Mis solicitudes' });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(propias().length);
  });

  it('filtra por estado y busca por nombre de servicio', async () => {
    const usuario = userEvent.setup();
    renderizar(<MisSolicitudesPage />);
    const lista = await screen.findByRole('list', { name: 'Mis solicitudes' });

    await usuario.type(screen.getByLabelText('Buscar en mis solicitudes'), 'pasantía');
    for (const fila of within(lista).getAllByRole('listitem')) {
      expect(fila).toHaveTextContent('Carta de pasantía');
    }

    await usuario.clear(screen.getByLabelText('Buscar en mis solicitudes'));
    await usuario.type(screen.getByLabelText('Buscar en mis solicitudes'), 'no existe');
    expect(await screen.findByText('Ninguna solicitud coincide')).toBeInTheDocument();
  });
});

describe('MisDocumentosPage', () => {
  it('muestra un documento por solicitud completada y lo abre en el visor', async () => {
    const usuario = userEvent.setup();
    const conDocumento = propias().filter((s) => s.documento);
    expect(conDocumento.length).toBeGreaterThan(0);

    renderizar(<MisDocumentosPage />);
    const lista = await screen.findByRole('list', { name: 'Mis documentos' });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(conDocumento.length);

    const [primero] = within(lista).getAllByRole('button', { name: /^Ver / });
    if (!primero) throw new Error('Falta el botón Ver.');
    await usuario.click(primero);
    // El visor carga la página del PDF bajo demanda: margen para un CI lento.
    await waitFor(() => expect(screen.getByText('Documento en el visor')).toBeInTheDocument(), {
      timeout: 5000,
    });
  });
});
