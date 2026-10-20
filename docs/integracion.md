# Conectar el backend de Django

Estos son los pasos para pasar el frontend de los datos de demostración (`local`) a la API real (`http`).

El frontend ya está preparado:

- **Repositorios HTTP:** `src/data/repositories/http/` implementa todos los repositorios.
- **Sesión:** maneja sesión de Django o JWT, CSRF, paginación y errores.
- **Archivos:** sube los adjuntos y descarga los documentos.

Ninguna pantalla cambia.

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

Las pruebas `src/data/repositories/http/http.test.ts` usan el JSON del contrato. Si cambias rutas o campos, actualízalas con ejemplos del backend real y corre `npm test`.

## 2. Probar en local

1. Levanta Django: `python manage.py runserver` (puerto 8000).
2. Crea `.env.local` en el frontend:
   ```dotenv
   VITE_DATA_SOURCE=http
   VITE_API_AUTH=sesion        # o jwt
   VITE_API_PROXY=http://localhost:8000
   ```
3. Ejecuta `npm run dev`. Vite reenvía `/api/*` a Django.
4. Recorre el flujo:
   - Iniciar sesión.
   - Crear una solicitud con adjunto y enviarla.
   - Revisarla desde el personal administrativo y completarla.
   - Descargar el documento.
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
   - `VITE_DATA_SOURCE=http`
   - `VITE_API_AUTH=sesion` (o `jwt`)

   Puedes activarlas solo en **Preview** para probar antes de pasarlas a **Production**.

3. Vuelve a desplegar: las variables `VITE_*` se leen al compilar.

## Qué cambia en la interfaz con `http`

- El acceso pide correo y contraseña reales.
  - Desaparecen el selector «Acceder como» y el aviso de contraseña simulada.
  - En desarrollo desaparece también la barra para cambiar de rol.
- Configuración ya no ofrece «Restablecer datos de demostración».
- Si el servidor rechaza la sesión (401), la aplicación vuelve al acceso con «Tu sesión expiró».
- El documento de salida es el PDF oficial del servidor, en lugar del PDF de muestra que se genera en el navegador.
