/**
 * Pruebas del visor de documentos. jsdom no puede dibujar con pdf.js, así que
 * la página del PDF se sustituye por un doble que anuncia tres páginas.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ProveedorUI } from '@/components/ui';
import { useVisorDocumento } from '@/hooks/useVisorDocumento';

import { VisorDocumento, type VisorDocumentoProps } from './VisorDocumento';

vi.mock('./PaginasPdf', () => ({
  default: function PaginasPdfDoble({
    pagina,
    onCargado,
  }: {
    pagina: number;
    onCargado: (paginas: number) => void;
  }) {
    useEffect(() => onCargado(3), [onCargado]);
    return <p>Contenido de la página {pagina}</p>;
  },
}));

const pdf = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

/**
 * La página del PDF se carga bajo demanda (`lazy`): en un ejecutor de CI lento
 * puede tardar más que el segundo que espera `findBy` por defecto.
 */
const CARGA_DIFERIDA = { timeout: 5000 };

function renderizar(props: Partial<VisorDocumentoProps> = {}) {
  return render(
    <ProveedorUI>
      <VisorDocumento
        abierto
        nombre="carta_pasantia.pdf"
        archivo={pdf}
        cargando={false}
        error={null}
        onCerrar={() => {}}
        onReintentar={() => {}}
        {...props}
      />
    </ProveedorUI>,
  );
}

describe('VisorDocumento', () => {
  it('pagina el PDF y limita el zoom', async () => {
    const usuario = userEvent.setup();
    renderizar();

    expect(
      await screen.findByText('Contenido de la página 1', undefined, CARGA_DIFERIDA),
    ).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await usuario.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByText('Contenido de la página 2')).toBeInTheDocument();

    for (let i = 0; i < 4; i += 1) {
      await usuario.click(screen.getByRole('button', { name: 'Ampliar' }));
    }
    expect(screen.getByText('200 %')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ampliar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Imprimir/ })).toBeInTheDocument();
  });

  it('muestra las imágenes directamente', () => {
    // jsdom no implementa las URL de objeto; en este archivo basta un doble.
    URL.createObjectURL = () => 'blob:imagen';
    URL.revokeObjectURL = () => {};
    renderizar({
      nombre: 'cedula.png',
      archivo: new Blob(['png'], { type: 'image/png' }),
    });
    expect(screen.getByRole('img', { name: 'cedula.png' })).toBeInTheDocument();
  });

  it('ofrece sólo la descarga para otros tipos de archivo', () => {
    renderizar({
      nombre: 'notas.docx',
      archivo: new Blob(['docx'], { type: 'application/msword' }),
    });
    expect(screen.getByText('Vista previa no disponible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Descargar/ })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /Imprimir/ })).toBeNull();
  });

  it('muestra el error y permite reintentar', async () => {
    const usuario = userEvent.setup();
    const onReintentar = vi.fn();
    renderizar({ archivo: null, error: 'El servidor no respondió.', onReintentar });

    expect(screen.getByText('El servidor no respondió.')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(onReintentar).toHaveBeenCalledOnce();
  });
});

describe('useVisorDocumento', () => {
  function Pantalla({ obtener }: { obtener: () => Promise<Blob> }) {
    const { ver, visor } = useVisorDocumento();
    return (
      <ProveedorUI>
        <button type="button" onClick={() => ver({ nombre: 'carta.pdf', obtener })}>
          Abrir
        </button>
        {visor}
      </ProveedorUI>
    );
  }

  it('obtiene el archivo y lo abre en el visor', async () => {
    const usuario = userEvent.setup();
    const obtener = vi.fn(() => Promise.resolve(pdf));
    render(<Pantalla obtener={obtener} />);

    await usuario.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(
      await screen.findByText('Contenido de la página 1', undefined, CARGA_DIFERIDA),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'carta.pdf' })).toBeInTheDocument();
  });

  it('vuelve a pedir el archivo al reintentar', async () => {
    const usuario = userEvent.setup();
    const obtener = vi
      .fn<() => Promise<Blob>>()
      .mockRejectedValueOnce(new Error('Sin conexión'))
      .mockResolvedValueOnce(pdf);
    render(<Pantalla obtener={obtener} />);

    await usuario.click(screen.getByRole('button', { name: 'Abrir' }));
    await usuario.click(await screen.findByRole('button', { name: /Reintentar/ }));
    await waitFor(
      () => expect(screen.getByText('Contenido de la página 1')).toBeInTheDocument(),
      CARGA_DIFERIDA,
    );
    expect(obtener).toHaveBeenCalledTimes(2);
  });
});
