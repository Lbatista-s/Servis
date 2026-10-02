/** Pruebas de las utilidades compartidas por varias pantallas. */

import { describe, expect, it } from 'vitest';

import { claveActiva, NAVEGACION_POR_ROL, titulosDe } from '@/app/navegacion';
import { INICIO_POR_ROL, RUTAS } from '@/app/rutas';
import { ETIQUETA_ESTADO } from '@/domain/types';

import { correoInstitucional, esCorreoInstitucional } from './esquemas';
import { opcionesConTodos, TODOS } from './filtros';
import { contar } from './texto';

describe('contar', () => {
  it('usa el singular sólo para una unidad', () => {
    expect(contar(1, 'requisito')).toBe('1 requisito');
    expect(contar(0, 'requisito')).toBe('0 requisitos');
    expect(contar(3, 'requisito')).toBe('3 requisitos');
  });

  it('admite plurales irregulares', () => {
    expect(contar(2, 'solicitud', 'solicitudes')).toBe('2 solicitudes');
  });
});

describe('opcionesConTodos', () => {
  it('antepone la opción que no filtra y conserva el orden de las etiquetas', () => {
    const opciones = opcionesConTodos('Todos los estados', ETIQUETA_ESTADO);
    expect(opciones[0]).toEqual({ value: TODOS, label: 'Todos los estados' });
    expect(opciones[1]).toEqual({ value: 'borrador', label: 'Borrador' });
    expect(opciones).toHaveLength(Object.keys(ETIQUETA_ESTADO).length + 1);
  });

  it('acepta un Map cuando las opciones vienen de datos', () => {
    const opciones = opcionesConTodos('Todos', new Map([['pasantia', 'Carta de pasantía']]));
    expect(opciones[1]).toEqual({ value: 'pasantia', label: 'Carta de pasantía' });
  });
});

describe('correo institucional', () => {
  it('reconoce el dominio sin importar mayúsculas ni espacios', () => {
    expect(esCorreoInstitucional('  L.Batista@INTEC.edu.do ')).toBe(true);
    expect(esCorreoInstitucional('l.batista@gmail.com')).toBe(false);
  });

  it('usa los mensajes personalizados de cada formulario', () => {
    const esquema = correoInstitucional({
      requerido: 'Falta el correo.',
      dominio: 'Otro dominio.',
    });
    expect(esquema.safeParse('').error?.issues[0]?.message).toBe('Falta el correo.');
    expect(esquema.safeParse('a@gmail.com').error?.issues[0]?.message).toBe('Otro dominio.');
    expect(esquema.safeParse('a@intec.edu.do').success).toBe(true);
  });
});

describe('navegación', () => {
  it('resuelve el título de las rutas con parámetros', () => {
    expect(titulosDe(RUTAS.detalleBandeja('SRV-1042')).titulo).toBe('Revisión de solicitud');
    expect(titulosDe(RUTAS.nuevaSolicitud('pasantia')).titulo).toBe('Nueva solicitud');
    expect(titulosDe(RUTAS.detalleSolicitud('SRV-1042')).titulo).toBe('Detalle de la solicitud');
  });

  it('marca en el menú la sección de la que depende cada pantalla de detalle', () => {
    const estudiante = NAVEGACION_POR_ROL.estudiante;
    expect(claveActiva(RUTAS.nuevaSolicitud('pasantia'), estudiante)).toBe(RUTAS.catalogo);
    expect(claveActiva(RUTAS.detalleSolicitud('SRV-1042'), estudiante)).toBe(RUTAS.inicio);
    expect(
      claveActiva(RUTAS.detalleBandeja('SRV-1042'), NAVEGACION_POR_ROL.personal_administrativo),
    ).toBe(RUTAS.bandeja);
  });

  it('el inicio del administrador no se marca en sus subsecciones', () => {
    const administrador = NAVEGACION_POR_ROL.administrador;
    expect(claveActiva(RUTAS.inicioAdmin, administrador)).toBe(RUTAS.inicioAdmin);
    expect(claveActiva(RUTAS.usuarios, administrador)).toBe(RUTAS.usuarios);
  });

  it('cada rol entra en su pantalla: cuadro de mando, bandeja o página de inicio', () => {
    expect(INICIO_POR_ROL.coordinador).toBe(RUTAS.cuadroMando);
    expect(INICIO_POR_ROL.personal_administrativo).toBe(RUTAS.bandeja);
    expect(INICIO_POR_ROL.estudiante).toBe(RUTAS.inicio);
    expect(INICIO_POR_ROL.administrador).toBe(RUTAS.inicioAdmin);
  });
});
