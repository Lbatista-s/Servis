/** Botón para alternar entre el tema claro y el oscuro. */

import { Button, Tooltip } from 'antd';

import { cn } from '@/lib/utils';
import { useTema } from '@/theme/temaStore';

import { Icono } from './Icons';

export function SelectorTema({ className }: { className?: string }) {
  const { modo, alternar } = useTema();
  const oscuro = modo === 'oscuro';
  const etiqueta = oscuro ? 'Usar tema claro' : 'Usar tema oscuro';

  return (
    <Tooltip title={etiqueta}>
      <Button
        type="text"
        onClick={alternar}
        aria-label={etiqueta}
        aria-pressed={oscuro}
        // Va sobre el marco gris: el icono en blanco se lee en ambos temas.
        className={cn('!text-white hover:!bg-white/10', className)}
        icon={<Icono nombre={oscuro ? 'sol' : 'luna'} />}
      />
    </Tooltip>
  );
}
