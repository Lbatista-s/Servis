/**
 * Pantalla 11 — Gestión del catálogo de servicios.
 *
 * El interruptor de activación pasa por la regla de negocio: un servicio sin
 * requisitos no puede activarse, y el intento devuelve un error explicativo.
 */

import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  Icono,
  Loading,
  PageHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  Table,
  TableWrapper,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { ETIQUETA_CATEGORIA, type Servicio } from '@/domain/types';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar, useServicios } from '@/hooks/useDatos';

export function ServiciosPage() {
  const { datos: servicios, cargando } = useServicios();
  const revalidar = useRevalidar();
  const avisos = useToast();
  const [procesando, setProcesando] = useState<string | null>(null);

  const lista = servicios ?? [];
  const activos = lista.filter((s) => s.activo).length;

  async function alternar(servicio: Servicio, siguiente: boolean) {
    setProcesando(servicio.id);
    try {
      await repositorios.servicios.cambiarActivacion(servicio.id, siguiente);
      revalidar();
      avisos.exito(
        siguiente ? 'Servicio activado' : 'Servicio desactivado',
        `«${servicio.nombre}» ${siguiente ? 'ya aparece' : 'dejó de aparecer'} en el catálogo.`,
      );
    } catch (fallo) {
      // Aquí se materializa la regla: activar sin requisitos es imposible.
      avisos.error('No se pudo cambiar el estado', mensajeDeError(fallo));
    } finally {
      setProcesando(null);
    }
  }

  if (cargando) return <Loading mensaje="Cargando el catálogo…" />;

  return (
    <>
      <PageHeader
        titulo="Gestión del catálogo"
        subtitulo={`${lista.length} servicios configurados · ${activos} activos · Plantillas y requisitos`}
      >
        <Tooltip contenido="El alta de servicios se habilitará en la fase de integración">
          <span>
            <Button tamano="sm" disabled>
              <Icono nombre="mas" />
              Nuevo servicio
            </Button>
          </span>
        </Tooltip>
      </PageHeader>

      <Card sinRelleno>
        <TableWrapper>
          <Table>
            <Thead>
              <Tr>
                <Th>Servicio</Th>
                <Th>Categoría</Th>
                <Th>Requisitos</Th>
                <Th>Plantilla</Th>
                <Th>Activo</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {lista.map((servicio) => (
                <Tr key={servicio.id}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-lg"
                        style={{ backgroundColor: servicio.color }}
                      >
                        {servicio.icono}
                      </span>
                      <span className="font-medium">{servicio.nombre}</span>
                    </span>
                  </Td>
                  <Td className="text-ink-3">{ETIQUETA_CATEGORIA[servicio.categoria]}</Td>
                  <Td>
                    <Badge tono={servicio.requisitos.length === 0 ? 'red' : 'gray'} sinPunto>
                      {servicio.requisitos.length} requisito
                      {servicio.requisitos.length === 1 ? '' : 's'}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5 text-ink-2">
                      <Icono nombre="documento" className="h-3.5 w-3.5 text-primary" />
                      {servicio.plantilla}
                    </span>
                  </Td>
                  <Td>
                    <Switch
                      checked={servicio.activo}
                      disabled={procesando === servicio.id}
                      onCheckedChange={(valor) => alternar(servicio, valor)}
                      aria-label={`${servicio.activo ? 'Desactivar' : 'Activar'} ${servicio.nombre}`}
                    />
                  </Td>
                  <Td>
                    <span className="flex gap-1.5">
                      <Tooltip contenido="Editar servicio">
                        <Button
                          variante="outline"
                          tamano="icon"
                          aria-label={`Editar ${servicio.nombre}`}
                        >
                          <Icono nombre="editar" />
                        </Button>
                      </Tooltip>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variante="ghost" tamano="sm">
                            Ver requisitos
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <p className="mb-2 text-base font-semibold text-ink">
                            Requisitos de «{servicio.nombre}»
                          </p>
                          {servicio.requisitos.length === 0 ? (
                            <p className="text-base text-ink-3">
                              Este servicio no tiene requisitos definidos, por lo que no puede
                              activarse.
                            </p>
                          ) : (
                            <ul className="flex flex-col gap-1.5">
                              {servicio.requisitos.map((requisito) => (
                                <li
                                  key={requisito.id}
                                  className="flex items-start gap-2 text-base text-ink-2"
                                >
                                  <Icono
                                    nombre="verificar"
                                    className="mt-1 h-3 w-3 shrink-0 text-primary"
                                  />
                                  <span>
                                    {requisito.descripcion}
                                    {requisito.obligatorio ? null : (
                                      <span className="text-ink-3"> (opcional)</span>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </PopoverContent>
                      </Popover>
                    </span>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableWrapper>
      </Card>
    </>
  );
}
