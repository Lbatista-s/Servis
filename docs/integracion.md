# Conectar el backend de Django

Estos son los pasos para pasar el frontend de la API simulada (`VITE_API_MOCK=true`) a la API real de Django (`VITE_API_MOCK=false`).

El frontend ya habla HTTP en todo momento; hoy le responde un servidor simulado (MSW, en `src/mocks/`) con el mismo contrato:

- **Repositorios HTTP:** `src/data/repositories/http/` implementa todos los repositorios.
- **Sesión:** maneja sesión de Django o JWT, CSRF, paginación y errores.
- **Archivos:** sube los adjuntos y descarga los documentos.
- **Notificaciones y recuperación de contraseña:** ya consumen sus endpoints.

Ninguna pantalla cambia. Con `VITE_API_MOCK=false`, MSW y los datos simulados ni siquiera se descargan.

## 1. Comparar la API real con el contrato

Abre el `urls.py` y los serializers del backend junto a [api.md](./api.md). Por cada diferencia, ajusta **solo** uno de estos archivos:

| Diferencia                                                               | Dónde se ajusta                                                                                                                   |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Una ruta se llama distinto (`requests/` en vez de `solicitudes/`)        | `API` en `src/data/repositories/http/rutas.ts`                                                                                    |
| Un filtro se llama distinto (`?status=` en vez de `?estado=`)            | `consultaSolicitudes()` y sus vecinas, en el mismo archivo                                                                        |
| Un campo del JSON se llama distinto (`created_at` en vez de `creada_en`) | `aSolicitud()` y compañía, en `src/data/repositories/http/mapeadores.ts`                                                          |
| Las credenciales se llaman distinto (`email`/`password`)                 | `desdeCredenciales()` en `mapeadores.ts`                                                                                          |
| Los servicios usan id numérico en vez de la clave (`pasantia`)           | Pedir al backend que exponga la clave como `id` (ver `api.md` → Servicio); sin ella los formularios por servicio no se encuentran |
| El backend no tiene un endpoint (p. ej. el documento PDF)                | Pedirlo al equipo del backend con la sección correspondiente de `api.md`                                                          |

Las pruebas usan el contrato en dos sitios:

- `src/data/repositories/http/http.test.ts`, con ejemplos de JSON.
- La API simulada (`src/mocks/handlers.ts`), contra la que corren las pruebas de interfaz y `src/mocks/apiSimulada.test.ts`.

Si cambias rutas o campos, ajusta los dos para que sigan reflejando al backend real y corre `npm test`. Mantener la API simulada al día permite seguir trabajando en el frontend sin depender del servidor.

## 2. Probar en local

1. Levanta Django: `python manage.py runserver` (puerto 8000).
2. Crea `.env.local` en el frontend:
   ```dotenv
   VITE_API_MOCK=false
   VITE_API_AUTH=sesion        # o jwt
   VITE_API_PROXY=http://localhost:8000
   ```
3. Ejecuta `npm run dev`. Vite reenvía `/api/*` a Django.
4. Recorre el flujo:
   - Iniciar sesión.
   - Crear una solicitud con adjunto y enviarla.
   - Revisarla desde el personal administrativo y completarla.
   - Ver el documento en el visor y descargarlo.
   - Revisar la campana de notificaciones de ambos usuarios.
   - Cerrar sesión.
5. Si Django rechaza los POST con «CSRF verification failed», falta `http://localhost:5173` en `CSRF_TRUSTED_ORIGINS`.

## 3. Publicar el backend

Ver [api.md → Ajustes de Django](./api.md#ajustes-de-django-para-el-despliegue).

Resumen para Render:

- **Build:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **Start:** `gunicorn <proyecto>.wsgi`
- **Base de datos:** PostgreSQL en Neon o Supabase (`DATABASE_URL`).
- **Archivos** (adjuntos y PDF): almacenamiento externo.

## 4. Conectar Vercel

1. En `vercel.json`, añade la regla de `/api` **antes** de la que envía todo a `index.html`:
   ```json
   "rewrites": [
     { "source": "/api/:path*", "destination": "https://servis-api.onrender.com/api/:path*" },
     { "source": "/(.*)", "destination": "/index.html" }
   ]
   ```
2. En Vercel, en **Settings → Environment Variables**:
   - `VITE_API_MOCK=false`
   - `VITE_API_AUTH=sesion` (o `jwt`)

   Puedes activarlas solo en **Preview** para probar antes de pasarlas a **Production**.

3. Vuelve a desplegar: las variables `VITE_*` se leen al compilar.

## Qué cambia en la interfaz con `VITE_API_MOCK=false`

- Desaparece el aviso «Entorno con datos simulados» del acceso; las cuentas y contraseñas son las de Django.
- Configuración muestra la URL de la API y ya no ofrece «Restablecer datos simulados».
- El documento de salida es el PDF oficial del servidor, en lugar del PDF de muestra.
- Todo lo demás es igual: si el servidor rechaza la sesión (401), la aplicación vuelve al acceso con «Tu sesión expiró», como ya ocurre con la API simulada.
