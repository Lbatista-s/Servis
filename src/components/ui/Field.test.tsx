/** Accesibilidad de los controles de formulario dentro de `Field`. */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DateInput, Field, FieldHint, FieldLabel, Input } from './Field';
import { ProveedorUI } from './Proveedor';

function conProveedor(contenido: React.ReactNode) {
  return render(<ProveedorUI>{contenido}</ProveedorUI>);
}

describe('Field', () => {
  it.each([
    ['la entrada de texto', <Input key="i" />],
    ['el selector de fecha', <DateInput key="d" value="" onChange={() => undefined} />],
  ])('asocia la etiqueta y el error a %s', (_, control) => {
    conProveedor(
      <Field error="La fecha de inicio es obligatoria.">
        <FieldLabel requerido>Fecha de inicio</FieldLabel>
        {control}
      </Field>,
    );

    const campo = screen.getByLabelText(/Fecha de inicio/);
    expect(campo.tagName).toBe('INPUT');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('La fecha de inicio es obligatoria.');
  });

  it('describe el selector de fecha con su ayuda cuando no hay error', () => {
    conProveedor(
      <Field>
        <FieldLabel>Fecha de fin</FieldLabel>
        <DateInput value="" onChange={() => undefined} />
        <FieldHint>Opcional.</FieldHint>
      </Field>,
    );

    const campo = screen.getByLabelText('Fecha de fin');
    // El selector de Ant Design declara `aria-invalid="false"` cuando es válido.
    expect(campo).not.toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Opcional.');
  });
});
