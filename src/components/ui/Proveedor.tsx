/**
 * Proveedor único de la interfaz: tema de Ant Design, idioma y avisos.
 *
 * `hashPriority="high"` hace que los estilos de Ant Design no queden anulados
 * por el reinicio base de Tailwind (preflight), que de otro modo pisaría, por
 * ejemplo, el fondo de los botones primarios.
 */

import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntApp, ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import type { ReactNode } from 'react';

import { temaAntd } from '@/theme/antd';

// Nombres de meses y días del selector de fecha en español.
dayjs.locale('es');

export function ProveedorUI({ children }: { children: ReactNode }) {
  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={temaAntd} locale={esES}>
        <AntApp component={false}>{children}</AntApp>
      </ConfigProvider>
    </StyleProvider>
  );
}
