/**
 * Implementación del repositorio de solicitudes sobre `localStorage`.
 *
 * Las reglas de negocio no se reimplementan aquí: se delegan en `src/domain`.
 * Este módulo sólo traduce entre el dominio y el almacenamiento, y convierte
 * los errores de dominio en `ErrorRepositorio` para que la interfaz reciba
 * siempre el mismo tipo de fallo venga de donde venga.
 */

import { aplicarTransicion, validarEdicion } from '@/domain/businessRules';
import type { OpcionesTransicion } from '@/domain/businessRules';
import type { Actor, EstadoSolicitud, Solicitud } from '@/domain/types';
import type {
  CambiosSolicitud,
  DatosNuevaSolicitud,
  FiltroSolicitudes,
  IRequestRepository,
} from '@/data/repositories/types';
import { ErrorRepositorio } from '@/data/repositories/types';

import { actualizarAlmacen, leerAlmacen, resolver } from './almacen';

/**
 * Genera el siguiente identificador correlativo con el prefijo del prototipo
 * (`SRV-1042`). Se calcula sobre los identificadores existentes para que
 * reiniciar la demostración no produzca colisiones.
 */
function siguienteId(solicitudes: readonly Solicitud[]): string {
  const maximo = solicitudes.reduce((acumulado, solicitud) => {
    const numero = Number.parseInt(solicitud.id.replace('SRV-', ''), 10);
    return Number.isNaN(numero) ? acumulado : Math.max(acumulado, numero);
  }, 1034);
  return `SRV-${maximo + 1}`;
}

function aplicaFiltro(solicitud: Solicitud, filtro: FiltroSolicitudes): boolean {
  if (filtro.solicitanteId && solicitud.solicitanteId !== filtro.solicitanteId) return false;
  if (filtro.estados && !filtro.estados.includes(solicitud.estado)) return false;
  if (filtro.servicioId && solicitud.servicioId !== filtro.servicioId) return false;
  if (filtro.busqueda) {
    const termino = filtro.busqueda.trim().toLowerCase();
    if (termino.length > 0 && !solicitud.id.toLowerCase().includes(termino)) return false;
  }
  return true;
}

export class RepositorioSolicitudesLocal implements IRequestRepository {
  listar(filtro: FiltroSolicitudes = {}): Promise<Solicitud[]> {
    const solicitudes = leerAlmacen()
      .solicitudes.filter((solicitud) => aplicaFiltro(solicitud, filtro))
      // Más recientes primero, como en la bandeja del prototipo.
      .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
    return resolver(solicitudes);
  }

  obtener(id: string): Promise<Solicitud | null> {
    return resolver(leerAlmacen().solicitudes.find((s) => s.id === id) ?? null);
  }

  crear(datos: DatosNuevaSolicitud, actor: Actor): Promise<Solicitud> {
    const creada = actualizarAlmacen((almacen) => {
      const ahora = new Date().toISOString();
      const id = siguienteId(almacen.solicitudes);

      const solicitud: Solicitud = {
        id,
        servicioId: datos.servicioId,
        solicitanteId: datos.solicitanteId,
        estado: 'borrador',
        creadaEn: ahora,
        actualizadaEn: ahora,
        enviadaEn: null,
        datosFormulario: datos.datosFormulario,
        adjuntos: datos.adjuntos ?? [],
        historial: [
          Object.freeze({
            id: `${id}-h0`,
            solicitudId: id,
            autorId: actor.id,
            autorNombre: actor.nombre,
            fecha: ahora,
            estadoAnterior: null,
            estadoNuevo: 'borrador' as EstadoSolicitud,
            comentario: null,
          }),
        ],
        comentarioInterno: '',
        asignadaA: null,
        prioridad: 'normal',
      };

      return [{ ...almacen, solicitudes: [solicitud, ...almacen.solicitudes] }, solicitud];
    });

    return resolver(creada);
  }

  guardar(id: string, cambios: CambiosSolicitud, actor: Actor): Promise<Solicitud> {
    try {
      const guardada = actualizarAlmacen((almacen) => {
        const indice = almacen.solicitudes.findIndex((s) => s.id === id);
        const actual = almacen.solicitudes[indice];
        if (indice === -1 || !actual) {
          throw new ErrorRepositorio('NO_ENCONTRADO', `No existe la solicitud ${id}.`);
        }

        const permitido = validarEdicion(actual, actor);
        if (!permitido.ok) {
          throw new ErrorRepositorio('REGLA_DE_NEGOCIO', permitido.error.mensaje);
        }

        const actualizada: Solicitud = {
          ...actual,
          ...(cambios.datosFormulario !== undefined
            ? { datosFormulario: cambios.datosFormulario }
            : {}),
          ...(cambios.adjuntos !== undefined ? { adjuntos: cambios.adjuntos } : {}),
          ...(cambios.comentarioInterno !== undefined
            ? { comentarioInterno: cambios.comentarioInterno }
            : {}),
          ...(cambios.asignadaA !== undefined ? { asignadaA: cambios.asignadaA } : {}),
          actualizadaEn: new Date().toISOString(),
        };

        const solicitudes = [...almacen.solicitudes];
        solicitudes[indice] = actualizada;
        return [{ ...almacen, solicitudes }, actualizada];
      });

      return resolver(guardada);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  transicionar(
    id: string,
    hacia: EstadoSolicitud,
    actor: Actor,
    opciones: OpcionesTransicion = {},
  ): Promise<Solicitud> {
    try {
      const resultado = actualizarAlmacen((almacen) => {
        const indice = almacen.solicitudes.findIndex((s) => s.id === id);
        const actual = almacen.solicitudes[indice];
        if (indice === -1 || !actual) {
          throw new ErrorRepositorio('NO_ENCONTRADO', `No existe la solicitud ${id}.`);
        }

        // Toda la validación vive en el dominio; aquí sólo se persiste.
        const transicion = aplicarTransicion(actual, hacia, actor, opciones);
        if (!transicion.ok) {
          throw new ErrorRepositorio('REGLA_DE_NEGOCIO', transicion.error.mensaje);
        }

        const actualizada =
          hacia === 'en_revision' ? { ...transicion.valor, asignadaA: actor.id } : transicion.valor;

        const solicitudes = [...almacen.solicitudes];
        solicitudes[indice] = actualizada;
        return [{ ...almacen, solicitudes }, actualizada];
      });

      return resolver(resultado);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  eliminar(id: string): Promise<void> {
    try {
      actualizarAlmacen((almacen) => {
        const existe = almacen.solicitudes.some((s) => s.id === id);
        if (!existe) {
          throw new ErrorRepositorio('NO_ENCONTRADO', `No existe la solicitud ${id}.`);
        }
        return [
          { ...almacen, solicitudes: almacen.solicitudes.filter((s) => s.id !== id) },
          undefined,
        ];
      });
      return resolver(undefined);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
