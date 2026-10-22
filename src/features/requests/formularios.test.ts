import { describe, expect, it } from 'vitest';

import { SERVICIOS_DEMO } from '@/mocks/datos/seed';

import { camposDe, esquemaDe, formatearValorCampo, valoresIniciales } from './formularios';

describe('formularios por servicio', () => {
  it('todos los servicios sembrados tienen formulario propio salvo el de inglés', () => {
    const genericos = SERVICIOS_DEMO.filter(
      (s) => camposDe(s.id) === camposDe('servicio-sin-formulario'),
    ).map((s) => s.id);
    expect(genericos).toEqual(['ingles']);
  });

  it('los campos de lista sólo aceptan sus opciones', () => {
    const esquema = esquemaDe(camposDe('carneton'));
    const base = { ...valoresIniciales(camposDe('carneton')), telefono: '809-555-0100' };

    expect(esquema.safeParse({ ...base, vehiculoElectrico: 'Sí' }).success).toBe(true);
    expect(esquema.safeParse({ ...base, vehiculoElectrico: 'Tal vez' }).success).toBe(false);
    // Obligatorio: vacío no vale.
    expect(esquema.safeParse({ ...base, vehiculoElectrico: '' }).success).toBe(false);
  });

  it('cada lista declara al menos dos opciones', () => {
    for (const servicio of SERVICIOS_DEMO) {
      for (const campo of camposDe(servicio.id)) {
        if (campo.tipo === 'lista') expect(campo.opciones?.length ?? 0).toBeGreaterThan(1);
      }
    }
  });

  it('muestra la opción elegida tal cual', () => {
    const [taller] = camposDe('talleres');
    if (!taller) throw new Error('Falta el campo del taller.');
    expect(formatearValorCampo(taller, 'Fitness: Zumba')).toBe('Fitness: Zumba');
  });
});
