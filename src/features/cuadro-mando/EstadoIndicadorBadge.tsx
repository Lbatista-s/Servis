/** Estado de un indicador frente a su meta: color, punto y etiqueta (nunca sólo color). */

import { Badge } from '@/components/ui';
import type { EstadoIndicador } from '@/domain/indicadores';

import { ETIQUETA_ESTADO_INDICADOR, TONO_ESTADO_INDICADOR } from './formato';

export function EstadoIndicadorBadge({ estado }: { estado: EstadoIndicador }) {
  return <Badge tono={TONO_ESTADO_INDICADOR[estado]}>{ETIQUETA_ESTADO_INDICADOR[estado]}</Badge>;
}
