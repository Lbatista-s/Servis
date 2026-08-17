/** Implementación del repositorio de usuarios sobre `localStorage`. */

import type { Usuario } from '@/domain/types';
import type {
  DatosNuevoUsuario,
  FiltroUsuarios,
  IUserRepository,
} from '@/data/repositories/types';
import { ErrorRepositorio } from '@/data/repositories/types';

import { actualizarAlmacen, leerAlmacen, resolver } from './almacen';

function aplicaFiltro(usuario: Usuario, filtro: FiltroUsuarios): boolean {
  if (filtro.rol && usuario.rol !== filtro.rol) return false;
  if (filtro.activo !== undefined && usuario.activo !== filtro.activo) return false;
  if (filtro.busqueda) {
    const termino = filtro.busqueda.trim().toLowerCase();
    if (
      termino.length > 0 &&
      !usuario.nombre.toLowerCase().includes(termino) &&
      !usuario.correo.toLowerCase().includes(termino)
    ) {
      return false;
    }
  }
  return true;
}

/** Sufijo aleatorio para los identificadores de usuarios creados en la sesión. */
function nuevoSufijo(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

/** Iniciales a partir del nombre completo, como en el prototipo (dos letras). */
function calcularIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export class RepositorioUsuariosLocal implements IUserRepository {
  listar(filtro: FiltroUsuarios = {}): Promise<Usuario[]> {
    return resolver(leerAlmacen().usuarios.filter((u) => aplicaFiltro(u, filtro)));
  }

  obtener(id: string): Promise<Usuario | null> {
    return resolver(leerAlmacen().usuarios.find((u) => u.id === id) ?? null);
  }

  obtenerPorCorreo(correo: string): Promise<Usuario | null> {
    const normalizado = correo.trim().toLowerCase();
    return resolver(
      leerAlmacen().usuarios.find((u) => u.correo.toLowerCase() === normalizado) ?? null,
    );
  }

  crear(datos: DatosNuevoUsuario): Promise<Usuario> {
    try {
      const creado = actualizarAlmacen((almacen) => {
        const duplicado = almacen.usuarios.some(
          (u) => u.correo.toLowerCase() === datos.correo.trim().toLowerCase(),
        );
        if (duplicado) {
          throw new ErrorRepositorio(
            'CONFLICTO',
            `Ya existe un usuario con el correo ${datos.correo}.`,
          );
        }

        const usuario: Usuario = {
          ...datos,
          id: `usr-${nuevoSufijo()}`,
          iniciales: datos.iniciales || calcularIniciales(datos.nombre),
          ultimoAcceso: new Date().toISOString(),
        };

        return [{ ...almacen, usuarios: [...almacen.usuarios, usuario] }, usuario];
      });
      return resolver(creado);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  actualizar(id: string, cambios: Partial<DatosNuevoUsuario>): Promise<Usuario> {
    try {
      const actualizado = actualizarAlmacen((almacen) => {
        const indice = almacen.usuarios.findIndex((u) => u.id === id);
        const actual = almacen.usuarios[indice];
        if (indice === -1 || !actual) {
          throw new ErrorRepositorio('NO_ENCONTRADO', `No existe el usuario ${id}.`);
        }

        const siguiente: Usuario = { ...actual, ...cambios };
        const usuarios = [...almacen.usuarios];
        usuarios[indice] = siguiente;
        return [{ ...almacen, usuarios }, siguiente];
      });
      return resolver(actualizado);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  cambiarActivacion(id: string, activo: boolean): Promise<Usuario> {
    return this.actualizar(id, { activo });
  }
}
