/**
 * Botón del sistema sobre el `Button` de Ant Design.
 *
 * Conserva las seis variantes semánticas de SERVIS. Ant Design sólo trae
 * primario y peligro como colores de botón; éxito y advertencia se obtienen
 * con un `ConfigProvider` anidado que cambia el color primario, así los
 * estados de hover y foco los calcula la propia librería.
 */

import { Button as AntButton, ConfigProvider, type ButtonProps as AntButtonProps } from 'antd';
import { forwardRef, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { COLORES } from '@/theme/tokens';

export type VarianteBoton = 'primary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';
export type TamanoBoton = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends Omit<
  AntButtonProps,
  'type' | 'size' | 'variant' | 'color' | 'htmlType'
> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  /** Tipo HTML. Por defecto `button`, para evitar envíos accidentales. */
  type?: 'button' | 'submit' | 'reset';
}

const TAMANO: Record<TamanoBoton, AntButtonProps['size']> = {
  sm: 'small',
  md: 'middle',
  lg: 'large',
  icon: 'middle',
};

function propsDeVariante(variante: VarianteBoton): Pick<AntButtonProps, 'type' | 'danger'> {
  switch (variante) {
    case 'outline':
      return { type: 'default' };
    case 'ghost':
      return { type: 'text' };
    default:
      return { type: 'primary' };
  }
}

/**
 * Relleno de las variantes semánticas. Se toma siempre del tema claro: son
 * rellenos saturados con texto blanco, y los tonos claros que el tema oscuro
 * usa para *texto* de éxito, advertencia o error no servirían como fondo.
 */
const PRIMARIO_ALTERNATIVO: Partial<Record<VarianteBoton, string>> = {
  success: COLORES.success.DEFAULT,
  warning: COLORES.warning.DEFAULT,
  danger: COLORES.danger.DEFAULT,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variante = 'primary', tamano = 'md', type = 'button', children, icon, ...props },
  ref,
) {
  // En el tamaño «icon» el único contenido es el icono.
  const soloIcono = tamano === 'icon';
  const boton = (
    <AntButton
      ref={ref}
      htmlType={type}
      size={TAMANO[tamano]}
      icon={soloIcono ? (icon ?? children) : icon}
      {...propsDeVariante(variante)}
      {...props}
    >
      {soloIcono ? null : children}
    </AntButton>
  );

  const primario = PRIMARIO_ALTERNATIVO[variante];
  return primario ? (
    <ConfigProvider theme={{ token: { colorPrimary: primario } }}>{boton}</ConfigProvider>
  ) : (
    boton
  );
});

/**
 * Enlace con aspecto de botón. Renderiza un `<a>` real (accesible y con
 * «abrir en otra pestaña») pero navega con React Router, sin recargar.
 */
export function ButtonLink({
  to,
  children,
  variante = 'primary',
  tamano = 'md',
  className,
}: {
  to: string;
  children: ReactNode;
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  className?: string;
}) {
  const navegar = useNavigate();

  function alPulsar(evento: MouseEvent<HTMLElement>) {
    // Respeta los atajos del navegador para abrir en otra pestaña.
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0) return;
    evento.preventDefault();
    navegar(to);
  }

  return (
    <AntButton
      href={to}
      onClick={alPulsar}
      size={TAMANO[tamano]}
      className={className}
      {...propsDeVariante(variante)}
    >
      {children}
    </AntButton>
  );
}
