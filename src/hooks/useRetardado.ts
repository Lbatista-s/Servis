import { useEffect, useState } from 'react';

/**
 * Devuelve `valor` cuando lleva `ms` milisegundos sin cambiar. Evita una
 * consulta al servidor por cada tecla de una búsqueda.
 */
export function useRetardado<T>(valor: T, ms = 300): T {
  const [retardado, setRetardado] = useState(valor);
  useEffect(() => {
    const temporizador = setTimeout(() => setRetardado(valor), ms);
    return () => clearTimeout(temporizador);
  }, [valor, ms]);
  return retardado;
}
