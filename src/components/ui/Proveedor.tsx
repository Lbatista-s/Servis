/**
 * Proveedor único de la interfaz: tema (claro u oscuro), idioma y avisos.
 *
 * - Publica las variables CSS de la paleta, que usan Tailwind y los estilos en
 *   línea, y marca el documento con `data-theme` según el tema activo.
 * - `hashPriority="high"` hace que los estilos de Ant Design no queden
 *   anulados por el reinicio base de Tailwind (preflight), que de otro modo
 *   pisaría, por ejemplo, el fondo de los botones primarios.
 */

import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntApp, ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useEffect, useMemo, type ReactNode } from 'react';

import { crearTemaAntd } from '@/theme/antd';
import { variablesCss } from '@/theme/css';
import { useTema } from '@/theme/temaStore';

// Nombres de meses y días del selector de fecha en español.
dayjs.locale('es');

const HOJA_VARIABLES = variablesCss();

export function ProveedorUI({ children }: { children: ReactNode }) {
  const modo = useTema((estado) => estado.modo);
  const temaAntd = useMemo(() => crearTemaAntd(modo), [modo]);

  useEffect(() => {
    document.documentElement.dataset.theme = modo;
  }, [modo]);

  return (
    <StyleProvider hashPriority="high">
      <style>{HOJA_VARIABLES}</style>
      <ConfigProvider theme={temaAntd} locale={esES}>
        <AntApp component={false}>{children}</AntApp>
      </ConfigProvider>
    </StyleProvider>
  );
}
