/**
 * Abre documentos y adjuntos en el visor integrado.
 *
 * Devuelve `ver`, que pide el archivo al repositorio y lo muestra, y el
 * elemento `visor`, que la pantalla debe renderizar una vez.
 */

import { useCallback, useRef, useState, type ReactNode } from 'react';

import { VisorDocumento } from '@/components/visor/VisorDocumento';
import { mensajeDeError } from '@/lib/errores';

interface Documento {
  nombre: string;
  obtener: () => Promise<Blob>;
}

interface Estado {
  nombre: string;
  archivo: Blob | null;
  cargando: boolean;
  error: string | null;
}

export function useVisorDocumento(): { ver: (documento: Documento) => void; visor: ReactNode } {
  const [estado, setEstado] = useState<Estado | null>(null);
  const actual = useRef<Documento | null>(null);

  const cargar = useCallback(async (documento: Documento) => {
    actual.current = documento;
    setEstado({ nombre: documento.nombre, archivo: null, cargando: true, error: null });
    try {
      const archivo = await documento.obtener();
      // Si entretanto se abrió otro documento, esta respuesta ya no interesa.
      if (actual.current !== documento) return;
      setEstado({ nombre: documento.nombre, archivo, cargando: false, error: null });
    } catch (fallo) {
      if (actual.current !== documento) return;
      setEstado({
        nombre: documento.nombre,
        archivo: null,
        cargando: false,
        error: mensajeDeError(fallo),
      });
    }
  }, []);

  const ver = useCallback((documento: Documento) => void cargar(documento), [cargar]);

  const cerrar = useCallback(() => {
    actual.current = null;
    setEstado(null);
  }, []);

  const visor = (
    <VisorDocumento
      abierto={estado !== null}
      nombre={estado?.nombre ?? ''}
      archivo={estado?.archivo ?? null}
      cargando={estado?.cargando ?? false}
      error={estado?.error ?? null}
      onCerrar={cerrar}
      onReintentar={() => actual.current && void cargar(actual.current)}
    />
  );

  return { ver, visor };
}
