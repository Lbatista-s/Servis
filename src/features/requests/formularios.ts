/**
 * Definición de los formularios dinámicos por servicio.
 *
 * Cada servicio declara sus campos y a partir de ellos se construye tanto la
 * interfaz como el esquema de validación de Zod. Añadir un servicio nuevo es
 * añadir una entrada aquí, sin tocar la pantalla.
 */

import { z, type ZodTypeAny } from 'zod';

export type TipoCampo = 'texto' | 'fecha' | 'correo' | 'telefono' | 'area';

export interface CampoFormulario {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  obligatorio: boolean;
  placeholder?: string;
  /** Título de la tarjeta en la que se agrupa el campo. */
  seccion: string;
  /** El campo ocupa el ancho completo de la cuadrícula. */
  anchoCompleto?: boolean;
}

/** Campos usados cuando un servicio no declara los suyos. */
const CAMPOS_GENERICOS: readonly CampoFormulario[] = [
  {
    nombre: 'motivo',
    etiqueta: 'Motivo de la solicitud',
    tipo: 'area',
    obligatorio: true,
    placeholder: 'Explica con claridad el motivo de tu solicitud…',
    seccion: 'Datos de la solicitud',
    anchoCompleto: true,
  },
  {
    nombre: 'periodo',
    etiqueta: 'Período académico',
    tipo: 'texto',
    obligatorio: true,
    placeholder: 'Ej. 2026-1',
    seccion: 'Datos de la solicitud',
  },
  {
    nombre: 'telefono',
    etiqueta: 'Teléfono de contacto',
    tipo: 'telefono',
    obligatorio: false,
    placeholder: '+1 (809) 000-0000',
    seccion: 'Datos de la solicitud',
  },
];

export const CAMPOS_POR_SERVICIO: Record<string, readonly CampoFormulario[]> = {
  pasantia: [
    {
      nombre: 'empresa',
      etiqueta: 'Nombre de la empresa',
      tipo: 'texto',
      obligatorio: true,
      placeholder: 'Ej. Industrias Dominicanas S.A.',
      seccion: 'Información de la empresa',
    },
    {
      nombre: 'rnc',
      etiqueta: 'RNC / Identificador fiscal',
      tipo: 'texto',
      obligatorio: false,
      placeholder: 'Ej. 1-02-15671-3',
      seccion: 'Información de la empresa',
    },
    {
      nombre: 'cargo',
      etiqueta: 'Cargo o posición',
      tipo: 'texto',
      obligatorio: true,
      placeholder: 'Ej. Pasante de desarrollo de software',
      seccion: 'Información de la empresa',
    },
    {
      nombre: 'departamento',
      etiqueta: 'Departamento',
      tipo: 'texto',
      obligatorio: false,
      placeholder: 'Ej. Ingeniería y Sistemas',
      seccion: 'Información de la empresa',
    },
    {
      nombre: 'fechaInicio',
      etiqueta: 'Fecha de inicio',
      tipo: 'fecha',
      obligatorio: true,
      seccion: 'Información de la empresa',
    },
    {
      nombre: 'fechaFin',
      etiqueta: 'Fecha de fin estimada',
      tipo: 'fecha',
      obligatorio: false,
      seccion: 'Información de la empresa',
    },
    {
      nombre: 'supervisorNombre',
      etiqueta: 'Nombre del supervisor',
      tipo: 'texto',
      obligatorio: true,
      placeholder: 'Ej. Ing. Jorge Martínez',
      seccion: 'Datos del supervisor',
    },
    {
      nombre: 'supervisorCorreo',
      etiqueta: 'Correo electrónico',
      tipo: 'correo',
      obligatorio: false,
      placeholder: 'supervisor@empresa.com.do',
      seccion: 'Datos del supervisor',
    },
    {
      nombre: 'supervisorTelefono',
      etiqueta: 'Teléfono',
      tipo: 'telefono',
      obligatorio: false,
      placeholder: '+1 (809) 000-0000',
      seccion: 'Datos del supervisor',
    },
    {
      nombre: 'supervisorCargo',
      etiqueta: 'Cargo del supervisor',
      tipo: 'texto',
      obligatorio: false,
      placeholder: 'Ej. Gerente de Ingeniería',
      seccion: 'Datos del supervisor',
    },
  ],

  cambio: [
    {
      nombre: 'carreraActual',
      etiqueta: 'Carrera actual',
      tipo: 'texto',
      obligatorio: true,
      seccion: 'Datos del cambio',
    },
    {
      nombre: 'carreraDestino',
      etiqueta: 'Carrera de destino',
      tipo: 'texto',
      obligatorio: true,
      seccion: 'Datos del cambio',
    },
    {
      nombre: 'motivo',
      etiqueta: 'Motivo del cambio',
      tipo: 'area',
      obligatorio: true,
      placeholder: 'Explica los motivos académicos o profesionales del cambio…',
      seccion: 'Datos del cambio',
      anchoCompleto: true,
    },
  ],

  reingreso: [
    {
      nombre: 'periodoBaja',
      etiqueta: 'Período de la baja',
      tipo: 'texto',
      obligatorio: true,
      placeholder: 'Ej. 2025-3',
      seccion: 'Datos del reingreso',
    },
    {
      nombre: 'periodoReingreso',
      etiqueta: 'Período de reingreso solicitado',
      tipo: 'texto',
      obligatorio: true,
      placeholder: 'Ej. 2026-2',
      seccion: 'Datos del reingreso',
    },
    {
      nombre: 'motivo',
      etiqueta: 'Motivo de la interrupción',
      tipo: 'area',
      obligatorio: true,
      seccion: 'Datos del reingreso',
      anchoCompleto: true,
    },
  ],

  grado: [
    {
      nombre: 'modalidad',
      etiqueta: 'Modalidad',
      tipo: 'texto',
      obligatorio: true,
      placeholder: 'Grado o posgrado',
      seccion: 'Datos del grado',
    },
    {
      nombre: 'periodo',
      etiqueta: 'Período de grado',
      tipo: 'texto',
      obligatorio: true,
      placeholder: 'Ej. 2026-1',
      seccion: 'Datos del grado',
    },
    {
      nombre: 'creditosAprobados',
      etiqueta: 'Créditos aprobados',
      tipo: 'texto',
      obligatorio: true,
      seccion: 'Datos del grado',
    },
  ],

  carnet: [
    {
      nombre: 'motivo',
      etiqueta: 'Motivo de la solicitud',
      tipo: 'texto',
      obligatorio: true,
      placeholder: 'Primera emisión, reposición por pérdida…',
      seccion: 'Datos del carnet',
    },
    {
      nombre: 'tipoSangre',
      etiqueta: 'Tipo de sangre',
      tipo: 'texto',
      obligatorio: false,
      placeholder: 'Ej. O+',
      seccion: 'Datos del carnet',
    },
  ],

  objetos: [
    {
      nombre: 'objeto',
      etiqueta: 'Objeto perdido',
      tipo: 'texto',
      obligatorio: true,
      placeholder: 'Describe el objeto con el mayor detalle posible',
      seccion: 'Datos del reporte',
    },
    {
      nombre: 'lugar',
      etiqueta: 'Último lugar donde lo viste',
      tipo: 'texto',
      obligatorio: true,
      seccion: 'Datos del reporte',
    },
    {
      nombre: 'fecha',
      etiqueta: 'Fecha del extravío',
      tipo: 'fecha',
      obligatorio: true,
      seccion: 'Datos del reporte',
    },
  ],
};

/** Devuelve los campos de un servicio, con reserva genérica. */
export function camposDe(servicioId: string): readonly CampoFormulario[] {
  return CAMPOS_POR_SERVICIO[servicioId] ?? CAMPOS_GENERICOS;
}

/** Agrupa los campos por sección conservando el orden de declaración. */
export function agruparPorSeccion(
  campos: readonly CampoFormulario[],
): { seccion: string; campos: CampoFormulario[] }[] {
  const grupos: { seccion: string; campos: CampoFormulario[] }[] = [];
  for (const campo of campos) {
    const existente = grupos.find((g) => g.seccion === campo.seccion);
    if (existente) existente.campos.push(campo);
    else grupos.push({ seccion: campo.seccion, campos: [campo] });
  }
  return grupos;
}

/** Construye el esquema de validación a partir de la definición de campos. */
export function esquemaDe(campos: readonly CampoFormulario[]) {
  const forma: Record<string, ZodTypeAny> = {};

  for (const campo of campos) {
    // El tipo se ensancha a ZodTypeAny porque cada `refine` devuelve un
    // ZodEffects, no un ZodString.
    let regla: ZodTypeAny = z.string();

    if (campo.tipo === 'correo') {
      // El correo sólo se valida si trae contenido: puede ser opcional.
      regla = z
        .string()
        .refine((valor) => valor.trim() === '' || z.string().email().safeParse(valor).success, {
          message: 'El formato del correo no es válido.',
        });
    }

    if (campo.obligatorio) {
      regla = regla.refine((valor: string) => valor.trim().length > 0, {
        message: `«${campo.etiqueta}» es obligatorio.`,
      });
    }

    forma[campo.nombre] = regla;
  }

  return z.object(forma);
}

/** Valores iniciales vacíos para todos los campos del servicio. */
export function valoresIniciales(campos: readonly CampoFormulario[]): Record<string, string> {
  return Object.fromEntries(campos.map((campo) => [campo.nombre, '']));
}

/**
 * Presenta el valor de un campo tal como debe leerlo el usuario.
 *
 * Las fechas se guardan como `AAAA-MM-DD` (formato del control nativo) y se
 * muestran como `DD/MM/AAAA`. Se formatean partiendo la cadena en lugar de
 * construir un `Date`, porque interpretarlas como UTC desplazaría el día en la
 * zona horaria de Santo Domingo.
 */
export function formatearValorCampo(campo: CampoFormulario, valor: string | undefined): string {
  const texto = valor?.trim() ?? '';
  if (texto === '') return '';

  if (campo.tipo === 'fecha' && /^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [anio, mes, dia] = texto.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  return texto;
}
