/**
 * Autenticación simulada sobre los usuarios locales.
 *
 * No hay contraseñas: basta con que el correo pertenezca a una cuenta activa.
 * La sesión la conserva el store de autenticación, así que aquí no se guarda
 * nada.
 */

import type { IAuthRepository } from '@/data/repositories/types';
import { ErrorRepositorio } from '@/data/repositories/types';
import type { Usuario } from '@/domain/types';

import { leerAlmacen, resolver } from './almacen';

export class RepositorioAuthLocal implements IAuthRepository {
  iniciarSesion(correo: string, _contrasena: string): Promise<Usuario> {
    const buscado = correo.trim().toLowerCase();
    const usuario = leerAlmacen().usuarios.find((u) => u.correo.toLowerCase() === buscado);

    if (!usuario) {
      return Promise.reject(
        new ErrorRepositorio(
          'NO_AUTENTICADO',
          'No existe ningún usuario con ese correo institucional.',
        ),
      );
    }
    if (!usuario.activo) {
      return Promise.reject(
        new ErrorRepositorio(
          'NO_AUTENTICADO',
          'Esta cuenta está desactivada. Contacta al administrador del sistema.',
        ),
      );
    }
    return resolver(usuario);
  }

  cerrarSesion(): Promise<void> {
    return resolver(undefined);
  }

  /** Sin servidor no hay sesión que consultar: manda la persistida en el store. */
  usuarioActual(): Promise<Usuario | null> {
    return resolver(null);
  }
}
