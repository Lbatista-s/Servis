/**
 * Prueba de integración de interfaz: la botonera de acciones y el diálogo de
 * justificación, sobre repositorios reales respaldados por localStorage.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ToastProvider, TooltipProvider } from '@/components/ui';
import { repositorios } from '@/data';
import { restablecerAlmacen } from '@/data/repositories/localStorage';
import type { Actor, Solicitud } from '@/domain/types';

import { AccionesSolicitud } from './AccionesSolicitud';

const ESTUDIANTE: Actor = { id: 'usr-luis', nombre: 'Luis Batista', rol: 'estudiante' };
const PERSONAL: Actor = {
  id: 'usr-ricardo',
  nombre: 'Ricardo Almanzar',
  rol: 'personal_administrativo',
};

function renderizar(solicitud: Solicitud, actor: Actor) {
  return render(
    <TooltipProvider>
      <ToastProvider>
        <AccionesSolicitud solicitud={solicitud} actor={actor} />
      </ToastProvider>
    </TooltipProvider>,
  );
}

/** SRV-1042 está en revisión en los datos de demostración. */
async function solicitudEnRevision(): Promise<Solicitud> {
  const solicitud = await repositorios.solicitudes.obtener('SRV-1042');
  if (!solicitud) throw new Error('Falta SRV-1042 en los datos de demostración.');
  return solicitud;
}

beforeEach(() => {
  localStorage.clear();
  restablecerAlmacen();
});

describe('AccionesSolicitud', () => {
  it('ofrece al personal sólo las transiciones válidas desde «en revisión»', async () => {
    renderizar(await solicitudEnRevision(), PERSONAL);

    expect(screen.getByRole('button', { name: /Aprobar solicitud/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rechazar solicitud/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Devolver para corrección/ })).toBeInTheDocument();

    // «Marcar como completada» sólo existe desde el estado `aprobada`.
    expect(screen.queryByRole('button', { name: /Marcar como completada/ })).toBeNull();
  });

  it('no ofrece ninguna acción al estudiante sobre una solicitud en revisión', async () => {
    const { container } = renderizar(await solicitudEnRevision(), ESTUDIANTE);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('mantiene deshabilitada la confirmación hasta alcanzar los 30 caracteres', async () => {
    const usuario = userEvent.setup();
    renderizar(await solicitudEnRevision(), PERSONAL);

    await usuario.click(screen.getByRole('button', { name: /Rechazar solicitud/ }));

    const dialogo = await screen.findByRole('dialog');
    const confirmar = within(dialogo).getByRole('button', { name: /Confirmar rechazar/i });
    expect(confirmar).toBeDisabled();

    // Con una justificación corta sigue bloqueado.
    await usuario.type(within(dialogo).getByRole('textbox'), 'Faltan documentos.');
    expect(confirmar).toBeDisabled();

    // Al superar el mínimo, se habilita.
    await usuario.type(
      within(dialogo).getByRole('textbox'),
      ' La carta carece de firma del responsable.',
    );
    expect(confirmar).toBeEnabled();
  });

  it('persiste el rechazo con su justificación en el historial', async () => {
    const usuario = userEvent.setup();
    renderizar(await solicitudEnRevision(), PERSONAL);

    await usuario.click(screen.getByRole('button', { name: /Rechazar solicitud/ }));
    const dialogo = await screen.findByRole('dialog');

    const justificacion =
      'La carta de aceptación no está en papel membretado y carece de firma responsable.';
    await usuario.type(within(dialogo).getByRole('textbox'), justificacion);
    await usuario.click(within(dialogo).getByRole('button', { name: /Confirmar rechazar/i }));

    await waitFor(async () => {
      const actualizada = await repositorios.solicitudes.obtener('SRV-1042');
      expect(actualizada?.estado).toBe('rechazada');
      expect(actualizada?.historial.at(-1)?.comentario).toBe(justificacion);
      expect(actualizada?.historial.at(-1)?.autorId).toBe(PERSONAL.id);
    });
  });

  it('ejecuta sin diálogo las transiciones que no exigen justificación', async () => {
    const usuario = userEvent.setup();
    renderizar(await solicitudEnRevision(), PERSONAL);

    await usuario.click(screen.getByRole('button', { name: /Aprobar solicitud/ }));

    await waitFor(async () => {
      const actualizada = await repositorios.solicitudes.obtener('SRV-1042');
      expect(actualizada?.estado).toBe('aprobada');
    });
  });
});
