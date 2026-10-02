/** Datos del cuadro de mando: entidades, metas y el cálculo del período elegido. */

import { useMemo, useState } from 'react';

import {
  calcularCuadro,
  ID_INDICADORES,
  PERIODOS,
  type DatosCuadro,
  type IdPeriodo,
  type Metas,
  type ResultadoIndicador,
} from '@/domain/indicadores';
import { useMetas, useServicios, useSolicitudes, useUsuarios } from '@/hooks/useDatos';

export interface CuadroMando {
  cargando: boolean;
  error: string | null;
  datos: DatosCuadro | null;
  metas: Metas | null;
  resultados: ResultadoIndicador[];
  ahora: Date;
}

export function useCuadroMando(periodo: IdPeriodo): CuadroMando {
  const solicitudes = useSolicitudes();
  const servicios = useServicios();
  const usuarios = useUsuarios();
  const metas = useMetas();

  // «Ahora» se fija al abrir la pantalla para que el período no se desplace
  // entre renderizados.
  const [ahora] = useState(() => new Date());
  const dias = PERIODOS.find((p) => p.id === periodo)?.dias ?? 90;

  const datos = useMemo<DatosCuadro | null>(
    () =>
      solicitudes.datos && servicios.datos && usuarios.datos
        ? { solicitudes: solicitudes.datos, servicios: servicios.datos, usuarios: usuarios.datos }
        : null,
    [solicitudes.datos, servicios.datos, usuarios.datos],
  );

  const resultados = useMemo(
    () =>
      datos && metas.datos ? calcularCuadro(datos, metas.datos, dias, ahora, ID_INDICADORES) : [],
    [datos, metas.datos, dias, ahora],
  );

  return {
    cargando: solicitudes.cargando || servicios.cargando || usuarios.cargando || metas.cargando,
    error: solicitudes.error ?? servicios.error ?? usuarios.error ?? metas.error,
    datos,
    metas: metas.datos,
    resultados,
    ahora,
  };
}
