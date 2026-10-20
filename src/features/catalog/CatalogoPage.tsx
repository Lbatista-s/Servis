/** Pantalla 4 — Catálogo de servicios. */

import { useState } from 'react';
import { Link } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  Badge,
  CampoBusqueda,
  EmptyState,
  Icono,
  Loading,
  PageHeader,
  SelectorFiltro,
} from '@/components/ui';
import { ETIQUETA_CATEGORIA, type CategoriaServicio } from '@/domain/types';
import { useServicios } from '@/hooks/useDatos';
import { opcionesConTodos, TODOS, type ConTodos } from '@/lib/filtros';
import { contar } from '@/lib/texto';

export function CatalogoPage() {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<ConTodos<CategoriaServicio>>(TODOS);

  const { datos: servicios, cargando } = useServicios({
    soloActivos: true,
    ...(categoria !== TODOS ? { categoria } : {}),
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
        <CampoBusqueda
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar servicio…"
          etiqueta="Buscar servicio"
        />

        <SelectorFiltro
          valor={categoria}
          onCambio={setCategoria}
          etiqueta="Filtrar por categoría"
          opciones={opcionesConTodos('Todas las categorías', ETIQUETA_CATEGORIA)}
        />

        <Badge tono="gray" sinPunto>
          {contar(lista.length, 'servicio')}
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
                      {contar(servicio.requisitos.length, 'requisito')}
                      {obligatorios > 0 ? ` · ${contar(obligatorios, 'obligatorio')}` : ''}
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
