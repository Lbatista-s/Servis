/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * `true` (por defecto): la API la responde el servidor simulado de MSW.
   * `false`: las peticiones van al backend real.
   */
  readonly VITE_API_MOCK?: 'true' | 'false';
  /** Raíz de la API (por defecto `/api`). */
  readonly VITE_API_BASE_URL?: string;
  /** Autenticación de la API: `sesion` (cookie + CSRF, por defecto) o `jwt`. */
  readonly VITE_API_AUTH?: 'sesion' | 'jwt';
  /** Sólo desarrollo: destino del proxy de `/api` (el servidor de Django). */
  readonly VITE_API_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
