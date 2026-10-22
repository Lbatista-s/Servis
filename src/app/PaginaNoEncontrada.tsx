/** Página 404: la ruta no existe. Ofrece volver a la pantalla inicial del usuario. */

import { ButtonLink, EmptyState, Icono, Logotipo } from '@/components/ui';
import { useTema } from '@/theme/temaStore';

export function PaginaNoEncontrada() {
  const modo = useTema((estado) => estado.modo);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6 py-12">
      <Logotipo formato="compacto" alto={48} version={modo === 'oscuro' ? 'negativo' : 'color'} />
      <div className="w-full max-w-lg rounded-lg border border-line bg-surface">
        <EmptyState
          icono="🧭"
          titulo="No encontramos esta página"
          descripcion="Es posible que el enlace esté mal escrito o que la página ya no exista."
        >
          <ButtonLink to="/">
            <Icono nombre="inicio" />
            Volver al inicio
          </ButtonLink>
        </EmptyState>
      </div>
    </main>
  );
}
