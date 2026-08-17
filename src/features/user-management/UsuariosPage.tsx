/** Pantalla 10 — Gestión de usuarios. */

import { useState } from 'react';

import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Icono,
  Input,
  Loading,
  PageHeader,
  RoleBadge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { ETIQUETA_ROL, ROLES, type Rol } from '@/domain/types';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar, useUsuarios } from '@/hooks/useDatos';
import { tiempoRelativo } from '@/lib/format';

import { NuevoUsuarioDialog } from './NuevoUsuarioDialog';

const TODOS = 'todos';

export function UsuariosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState<Rol | typeof TODOS>(TODOS);
  const [activo, setActivo] = useState<'todos' | 'activos' | 'inactivos'>(TODOS);

  const { datos: usuarios, cargando } = useUsuarios({
    ...(rol !== TODOS ? { rol } : {}),
    ...(activo !== 'todos' ? { activo: activo === 'activos' } : {}),
    ...(busqueda ? { busqueda } : {}),
  });

  const revalidar = useRevalidar();
  const avisos = useToast();
  const lista = usuarios ?? [];

  async function alternarActivacion(usuarioId: string, nombre: string, siguiente: boolean) {
    try {
      await repositorios.usuarios.cambiarActivacion(usuarioId, siguiente);
      revalidar();
      avisos.exito(
        siguiente ? 'Usuario activado' : 'Usuario desactivado',
        `${nombre} ${siguiente ? 'puede volver a acceder' : 'ya no puede acceder'} al sistema.`,
      );
    } catch (fallo) {
      avisos.error('No se pudo actualizar el usuario', mensajeDeError(fallo));
    }
  }

  return (
    <>
      <PageHeader
        titulo="Gestión de usuarios"
        subtitulo={`${lista.length} usuario${lista.length === 1 ? '' : 's'} · Área de Ingenierías`}
      >
        <Button variante="outline" tamano="sm">
          <Icono nombre="descargar" />
          Exportar
        </Button>
        <NuevoUsuarioDialog />
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Icono
            nombre="buscar"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <Input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre o correo…"
            aria-label="Buscar usuario"
            className="pl-[38px]"
          />
        </div>

        <Select value={rol} onValueChange={(valor) => setRol(valor as Rol | typeof TODOS)}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por rol">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los roles</SelectItem>
            {ROLES.map((clave) => (
              <SelectItem key={clave} value={clave}>
                {ETIQUETA_ROL[clave]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={activo}
          onValueChange={(valor) => setActivo(valor as 'todos' | 'activos' | 'inactivos')}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="inactivos">Inactivos</SelectItem>
          </SelectContent>
        </Select>

        <Badge tono="gray" sinPunto className="px-2.5 py-1.5 text-sm">
          {lista.length} registro{lista.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {cargando ? (
        <Loading mensaje="Cargando usuarios…" />
      ) : lista.length === 0 ? (
        <Card>
          <EmptyState
            icono="👤"
            titulo="No hay usuarios que coincidan"
            descripcion="Ajusta los filtros o el término de búsqueda."
          />
        </Card>
      ) : (
        <Card sinRelleno>
          <TableWrapper>
            <Table>
              <Thead>
                <Tr>
                  <Th>Usuario</Th>
                  <Th>Correo</Th>
                  <Th>Rol</Th>
                  <Th>Estado</Th>
                  <Th>Último acceso</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {lista.map((usuario) => (
                  <Tr key={usuario.id}>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <Avatar
                          nombre={usuario.nombre}
                          iniciales={usuario.iniciales}
                          color={usuario.colorAvatar}
                        />
                        <span className="font-medium">{usuario.nombre}</span>
                      </span>
                    </Td>
                    <Td className="text-ink-3">{usuario.correo}</Td>
                    <Td>
                      <RoleBadge rol={usuario.rol} />
                    </Td>
                    <Td>
                      <Badge tono={usuario.activo ? 'green' : 'gray'}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Td>
                    <Td className="text-ink-3">{tiempoRelativo(usuario.ultimoAcceso)}</Td>
                    <Td>
                      <span className="flex gap-1.5">
                        <Tooltip contenido="Editar usuario">
                          <Button
                            variante="ghost"
                            tamano="icon"
                            aria-label={`Editar ${usuario.nombre}`}
                          >
                            <Icono nombre="editar" />
                          </Button>
                        </Tooltip>
                        <Tooltip contenido={usuario.activo ? 'Desactivar' : 'Activar'}>
                          <Button
                            variante="ghost"
                            tamano="icon"
                            aria-label={`${usuario.activo ? 'Desactivar' : 'Activar'} ${usuario.nombre}`}
                            onClick={() =>
                              alternarActivacion(usuario.id, usuario.nombre, !usuario.activo)
                            }
                          >
                            <Icono nombre={usuario.activo ? 'cerrar' : 'verificar'} />
                          </Button>
                        </Tooltip>
                      </span>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableWrapper>
        </Card>
      )}
    </>
  );
}
