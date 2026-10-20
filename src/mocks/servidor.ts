/** API simulada para las pruebas (Node). */

import { setupServer } from 'msw/node';

import { handlers } from './handlers';

export const servidorSimulado = setupServer(...handlers);
