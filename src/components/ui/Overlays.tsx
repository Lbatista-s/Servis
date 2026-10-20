/**
 * Información contextual sobre `Tooltip` de Ant Design.
 *
 * Para menús y ventanas emergentes las pantallas usan directamente `Dropdown`
 * y `Popover` de Ant Design: su API ya es declarativa y no necesita envoltorio.
 */

import { Tooltip as AntTooltip } from 'antd';
import type { ReactElement, ReactNode } from 'react';

export function Tooltip({
  contenido,
  children,
  lado = 'top',
}: {
  contenido: ReactNode;
  /** El disparador debe ser un único elemento capaz de recibir foco. */
  children: ReactElement;
  lado?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <AntTooltip title={contenido} placement={lado} mouseEnterDelay={0.3}>
      {children}
    </AntTooltip>
  );
}
