/** Indicador de pasos del formulario de nueva solicitud, sobre `Steps` de Ant Design. */

import { Steps as AntSteps } from 'antd';

export interface StepsProps {
  pasos: readonly string[];
  /** Índice del paso activo, empezando en 0. */
  actual: number;
  className?: string;
}

export function Steps({ pasos, actual, className }: StepsProps) {
  return (
    <div className={className} aria-label={`Paso ${actual + 1} de ${pasos.length}`} role="group">
      <AntSteps
        current={actual}
        size="small"
        responsive
        items={pasos.map((paso) => ({ title: paso }))}
      />
    </div>
  );
}
