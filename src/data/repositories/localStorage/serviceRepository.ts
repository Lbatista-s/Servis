/** Implementación del repositorio de servicios sobre `localStorage`. */

import { validarActivacionServicio } from '@/domain/businessRules';
import type { Servicio } from '@/domain/types';
import type {
  DatosNuevoServicio,
  FiltroServicios,
  IServiceRepository,
} from '@/data/repositories/types';
import { ErrorRepositorio } from '@/data/repositories/types';

import { actualizarAlmacen, leerAlmacen, resolver } from './almacen';

function aplicaFiltro(servicio: Servicio, filtro: FiltroServicios): boolean {
  if (filtro.soloActivos && !servicio.activo) return false;
  if (filtro.categoria && servicio.categoria !== filtro.categoria) return false;
  if (filtro.busqueda) {
    const termino = filtro.busqueda.trim().toLowerCase();
    if (
      termino.length > 0 &&
      !servicio.nombre.toLowerCase().includes(termino) &&
      !servicio.descripcion.toLowerCase().includes(termino)
    ) {
      return false;
    }
  }
  return true;
}

/** Identificador legible derivado del nombre (`Carta de pasantía` → `carta-de-pasantia`). */
function idDesdeNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export class RepositorioServiciosLocal implements IServiceRepository {
  listar(filtro: FiltroServicios = {}): Promise<Servicio[]> {
    return resolver(leerAlmacen().servicios.filter((s) => aplicaFiltro(s, filtro)));
  }

  obtener(id: string): Promise<Servicio | null> {
    return resolver(leerAlmacen().servicios.find((s) => s.id === id) ?? null);
  }

  crear(datos: DatosNuevoServicio): Promise<Servicio> {
    try {
      const creado = actualizarAlmacen((almacen) => {
        // Un servicio nuevo no puede nacer activo sin requisitos definidos.
        const provisional: Servicio = { ...datos, id: idDesdeNombre(datos.nombre) };
        const validacion = validarActivacionServicio(provisional, datos.activo);
        if (!validacion.ok) {
          throw new ErrorRepositorio('REGLA_DE_NEGOCIO', validacion.error.mensaje);
        }

        if (almacen.servicios.some((s) => s.id === provisional.id)) {
          throw new ErrorRepositorio(
            'CONFLICTO',
            `Ya existe un servicio con el nombre «${datos.nombre}».`,
          );
        }

        const servicio = validacion.valor;
        return [{ ...almacen, servicios: [...almacen.servicios, servicio] }, servicio];
      });
      return resolver(creado);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  actualizar(id: string, cambios: Partial<DatosNuevoServicio>): Promise<Servicio> {
    try {
      const actualizado = actualizarAlmacen((almacen) => {
        const indice = almacen.servicios.findIndex((s) => s.id === id);
        const actual = almacen.servicios[indice];
        if (indice === -1 || !actual) {
          throw new ErrorRepositorio('NO_ENCONTRADO', `No existe el servicio ${id}.`);
        }

        const siguiente: Servicio = { ...actual, ...cambios };

        // Si el resultado queda activo, debe seguir cumpliendo la regla de
        // requisitos: quitar todos los requisitos a un servicio activo no vale.
        const validacion = validarActivacionServicio(siguiente, siguiente.activo);
        if (!validacion.ok) {
          throw new ErrorRepositorio('REGLA_DE_NEGOCIO', validacion.error.mensaje);
        }

        const servicios = [...almacen.servicios];
        servicios[indice] = validacion.valor;
        return [{ ...almacen, servicios }, validacion.valor];
      });
      return resolver(actualizado);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  cambiarActivacion(id: string, activo: boolean): Promise<Servicio> {
    try {
      const actualizado = actualizarAlmacen((almacen) => {
        const indice = almacen.servicios.findIndex((s) => s.id === id);
        const actual = almacen.servicios[indice];
        if (indice === -1 || !actual) {
          throw new ErrorRepositorio('NO_ENCONTRADO', `No existe el servicio ${id}.`);
        }

        const validacion = validarActivacionServicio(actual, activo);
        if (!validacion.ok) {
          throw new ErrorRepositorio('REGLA_DE_NEGOCIO', validacion.error.mensaje);
        }

        const servicios = [...almacen.servicios];
        servicios[indice] = validacion.valor;
        return [{ ...almacen, servicios }, validacion.valor];
      });
      return resolver(actualizado);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
