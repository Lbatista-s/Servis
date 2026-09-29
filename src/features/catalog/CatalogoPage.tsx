/** Pantalla 4 — Catálogo de servicios. */

import { Select } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import { Badge, EmptyState, Icono, Input, Loading, PageHeader } from '@/components/ui';
import { ETIQUETA_CATEGORIA, type CategoriaServicio } from '@/domain/types';
import { useServicios } from '@/hooks/useDatos';

const TODAS = 'todas';

export function CatalogoPage() {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<CategoriaServicio | typeof TODAS>(TODAS);

  const { datos: servicios, cargando } = useServicios({
    soloActivos: true,
    ...(categoria !== TODAS ? { categoria } : {}),
    ...(busqueda ? { busqueda } : {}),
  });

  const lista = servicios ?? [];

  return (
    <>
      <PageHeader
        titulo="Catálogo de servicios"
        subtitulo="Selecciona un servicio para iniciar tu solicitud."
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-64">
          <Input
            type="search"
            allowClear
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar servicio…"
            aria-label="Buscar servicio"
            prefix={<Icono nombre="buscar" className="text-ink-3" />}
          />
        </div>

        <Select
          value={categoria}
          onChange={(valor: CategoriaServicio | typeof TODAS) => setCategoria(valor)}
          aria-label="Filtrar por categoría"
          className="w-full sm:w-48"
          options={[
            { value: TODAS, label: 'Todas las categorías' },
            ...(Object.keys(ETIQUETA_CATEGORIA) as CategoriaServicio[]).map((clave) => ({
              value: clave,
              label: ETIQUETA_CATEGORIA[clave],
            })),
          ]}
        />

        <Badge tono="gray" sinPunto>
          {lista.length} servicio{lista.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {cargando ? (
        <Loading mensaje="Cargando el catálogo…" />
      ) : lista.length === 0 ? (
        <EmptyState
          icono="🔍"
          titulo="No encontramos servicios"
          descripcion="Prueba con otro término de búsqueda o cambia la categoría seleccionada."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((servicio) => {
            const obligatorios = servicio.requisitos.filter((r) => r.obligatorio).length;
            return (
              <li key={servicio.id}>
                <Link
                  to={RUTAS.nuevaSolicitud(servicio.id)}
                  className="flex h-full flex-col gap-2.5 rounded-lg border border-line bg-surface p-5 transition-all hover:-translate-y-px hover:border-primary hover:shadow-s3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md text-2xl"
                      style={{ backgroundColor: servicio.color }}
                    >
                      {servicio.icono}
                    </span>
                    <span className="text-md font-semibold text-ink">{servicio.nombre}</span>
                  </div>

                  <p className="text-sm leading-relaxed text-ink-3">{servicio.descripcion}</p>

                  <div className="mt-auto flex items-center justify-between border-t border-line pt-2.5">
                    <span className="flex items-center gap-1.5 text-xs text-ink-3">
                      <Icono nombre="documento" className="h-3 w-3" />
                      {servicio.requisitos.length} requisito
                      {servicio.requisitos.length === 1 ? '' : 's'}
                      {obligatorios > 0
                        ? ` · ${obligatorios} obligatorio${obligatorios === 1 ? '' : 's'}`
                        : ''}
                    </span>
                    {/* Toda la tarjeta es el enlace: esto sólo lo señala visualmente. */}
                    <span className="rounded bg-primary px-3 py-1 text-sm font-semibold text-white">
                      Solicitar
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
