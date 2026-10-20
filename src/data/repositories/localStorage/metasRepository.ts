/** Metas del cuadro de mando guardadas en el almacén local. */

import type { IMetasRepository } from '@/data/repositories/types';
import { ErrorRepositorio } from '@/data/repositories/types';
import { puedeEditarMetas } from '@/domain/businessRules';
import type { Metas } from '@/domain/indicadores/definiciones';
import type { Actor } from '@/domain/types';

import { actualizarAlmacen, leerAlmacen, resolver } from './almacen';

export class RepositorioMetasLocal implements IMetasRepository {
  obtener(): Promise<Metas> {
    return resolver({ ...leerAlmacen().metas });
  }

  guardar(metas: Metas, actor: Actor): Promise<Metas> {
    if (!puedeEditarMetas(actor)) {
      return Promise.reject(
        new ErrorRepositorio('PROHIBIDO', 'Sólo el coordinador puede cambiar las metas.'),
      );
    }
    const guardadas = actualizarAlmacen((almacen) => {
      const siguientes = { ...almacen.metas, ...metas };
      return [{ ...almacen, metas: siguientes }, siguientes];
    });
    return resolver({ ...guardadas });
  }
}
