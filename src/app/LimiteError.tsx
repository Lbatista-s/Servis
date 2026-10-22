/**
 * Límite de errores: si una pantalla falla al renderizar, muestra un aviso con
 * la opción de reintentar en lugar de dejar la aplicación en blanco.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button, EmptyState, Icono } from '@/components/ui';

interface Props {
  children: ReactNode;
  /** Al cambiar (p. ej. la ruta), el límite se restablece. */
  claveReinicio?: string;
}

interface Estado {
  error: Error | null;
}

export class LimiteError extends Component<Props, Estado> {
  state: Estado = { error: null };

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Punto único donde conectar un servicio de monitoreo (Sentry, etc.).
    console.error('Error no controlado en la interfaz:', error, info.componentStack);
  }

  componentDidUpdate(previas: Props) {
    if (this.state.error && previas.claveReinicio !== this.props.claveReinicio) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="py-10">
        <EmptyState
          icono="alerta"
          titulo="Algo salió mal"
          descripcion="Ocurrió un error inesperado al mostrar esta pantalla. Puedes reintentar o volver al inicio."
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => this.setState({ error: null })}>
              <Icono nombre="rotar" />
              Reintentar
            </Button>
            <Button variante="outline" onClick={() => window.location.assign('/')}>
              <Icono nombre="inicio" />
              Ir al inicio
            </Button>
          </div>
        </EmptyState>
      </div>
    );
  }
}
