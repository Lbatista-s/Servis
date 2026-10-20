/** Pruebas de la página 404 y del límite de errores. */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ProveedorUI } from '@/components/ui';

import { LimiteError } from './LimiteError';
import { PaginaNoEncontrada } from './PaginaNoEncontrada';

const envolver = (contenido: React.ReactNode) =>
  render(
    <MemoryRouter>
      <ProveedorUI>{contenido}</ProveedorUI>
    </MemoryRouter>,
  );

describe('página 404', () => {
  it('explica que la página no existe y ofrece volver al inicio', () => {
    envolver(<PaginaNoEncontrada />);
    expect(screen.getByText('No encontramos esta página')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al inicio/ })).toHaveAttribute('href', '/');
  });
});

describe('límite de errores', () => {
  it('sustituye la pantalla que falla por un aviso con reintento', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let fallar = true;
    function Inestable() {
      if (fallar) throw new Error('fallo de render');
      return <p>Contenido recuperado</p>;
    }

    envolver(
      <LimiteError>
        <Inestable />
      </LimiteError>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal');

    fallar = false;
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(screen.getByText('Contenido recuperado')).toBeInTheDocument();
  });
});
