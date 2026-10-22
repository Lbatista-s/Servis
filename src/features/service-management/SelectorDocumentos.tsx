/**
 * Documentos que pide un servicio, elegidos del catálogo de SERVIS.
 *
 * Cada documento del catálogo tiene un interruptor para pedirlo o no en este
 * servicio y, si se pide, si es obligatorio u opcional. El administrador puede
 * añadir al catálogo un documento que todavía no exista.
 */

import { Segmented, Switch } from 'antd';
import { useState } from 'react';

import { Button, EsqueletoBloque, EstadoError, Icono, Input, useToast } from '@/components/ui';
import { repositorios } from '@/data';
import { useDocumentos, useRevalidar } from '@/hooks/useDatos';
import { mensajeDeError } from '@/lib/errores';
import { cn } from '@/lib/utils';

export interface DocumentoElegido {
  id: string;
  obligatorio: boolean;
}

export function SelectorDocumentos({
  valor,
  onCambio,
}: {
  valor: readonly DocumentoElegido[];
  onCambio: (documentos: DocumentoElegido[]) => void;
}) {
  const { datos: catalogo, cargando, error, recargar } = useDocumentos();
  const revalidar = useRevalidar();
  const avisos = useToast();
  const [filtro, setFiltro] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [anadiendo, setAnadiendo] = useState(false);
  // Los que el servicio ya pedía al abrir van primero. El orden se fija una
  // vez para que un documento no salte de sitio al activarlo o desactivarlo.
  const [pedidosAlAbrir] = useState(() => valor.map((d) => d.id));

  const elegido = (id: string) => valor.find((d) => d.id === id);
  const termino = filtro.trim().toLowerCase();
  const posicion = (id: string) => {
    const indice = pedidosAlAbrir.indexOf(id);
    return indice === -1 ? Number.MAX_SAFE_INTEGER : indice;
  };
  const visibles = (catalogo ?? [])
    .filter((d) => d.nombre.toLowerCase().includes(termino))
    .sort((a, b) => posicion(a.id) - posicion(b.id));

  function alternar(id: string, pedir: boolean) {
    onCambio(pedir ? [...valor, { id, obligatorio: true }] : valor.filter((d) => d.id !== id));
  }

  function cambiarObligatorio(id: string, obligatorio: boolean) {
    onCambio(valor.map((d) => (d.id === id ? { ...d, obligatorio } : d)));
  }

  async function anadirAlCatalogo() {
    setAnadiendo(true);
    try {
      const documento = await repositorios.documentos.crear(nuevo);
      revalidar('documentos');
      // Quien lo añade lo hace para pedirlo en este servicio.
      onCambio([...valor, { id: documento.id, obligatorio: true }]);
      setNuevo('');
      avisos.exito('Documento añadido', `«${documento.nombre}» ya está en el catálogo de SERVIS.`);
    } catch (fallo) {
      avisos.error('No se pudo añadir el documento', mensajeDeError(fallo));
    } finally {
      setAnadiendo(false);
    }
  }

  if (cargando) return <EsqueletoBloque mensaje="Cargando el catálogo de documentos…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-3">
          {valor.length === 0
            ? 'Este servicio no pide ningún documento.'
            : `Pide ${valor.length} de ${catalogo?.length ?? 0} documentos del catálogo.`}
        </p>
        <Input
          type="search"
          aria-label="Buscar en el catálogo de documentos"
          placeholder="Buscar documento…"
          prefix={<Icono nombre="buscar" className="text-ink-3" />}
          value={filtro}
          onChange={(evento) => setFiltro(evento.target.value)}
          className="!w-56"
        />
      </div>

      <ul
        aria-label="Catálogo de documentos"
        className="m-0 flex max-h-72 list-none flex-col gap-1.5 overflow-y-auto p-0 pr-1"
      >
        {visibles.map((documento) => {
          const actual = elegido(documento.id);
          return (
            <li
              key={documento.id}
              className={cn(
                'flex flex-wrap items-center gap-x-3 gap-y-2 rounded border px-3 py-2',
                actual ? 'border-primary-light-2 bg-primary-light' : 'border-line',
              )}
            >
              <Switch
                size="small"
                checked={Boolean(actual)}
                onChange={(pedir) => alternar(documento.id, pedir)}
                aria-label={`Pedir «${documento.nombre}»`}
              />
              <span className={cn('min-w-0 flex-1 text-base', actual ? 'text-ink' : 'text-ink-3')}>
                {documento.nombre}
              </span>
              {actual ? (
                <Segmented
                  size="small"
                  aria-label={`«${documento.nombre}»: obligatorio u opcional`}
                  value={actual.obligatorio ? 'obligatorio' : 'opcional'}
                  onChange={(opcion) => cambiarObligatorio(documento.id, opcion === 'obligatorio')}
                  options={[
                    { value: 'obligatorio', label: 'Obligatorio' },
                    { value: 'opcional', label: 'Opcional' },
                  ]}
                />
              ) : null}
            </li>
          );
        })}
        {visibles.length === 0 ? (
          <li className="py-3 text-center text-sm text-ink-3">
            Ningún documento coincide con «{filtro}».
          </li>
        ) : null}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Nombre del documento nuevo"
          placeholder="¿Falta un documento? Ej. Certificado médico"
          value={nuevo}
          onChange={(evento) => setNuevo(evento.target.value)}
          onPressEnter={(evento) => {
            evento.preventDefault();
            if (nuevo.trim().length >= 3) void anadirAlCatalogo();
          }}
          className="min-w-0 flex-1"
        />
        <Button
          variante="outline"
          tamano="sm"
          disabled={nuevo.trim().length < 3 || anadiendo}
          onClick={() => void anadirAlCatalogo()}
        >
          <Icono nombre="mas" />
          {anadiendo ? 'Añadiendo…' : 'Añadir al catálogo'}
        </Button>
      </div>
    </div>
  );
}
