# Contrato de la API de SERVIS

Es la API REST que espera el frontend cuando se ejecuta con `VITE_DATA_SOURCE=http`. Está pensada para Django REST Framework (DRF) y se deriva de lo que la interfaz ya usa.

**Si el backend ya existe con otra forma**, no hace falta cambiarlo para cumplir este documento. Del lado del frontend basta con ajustar:

- `src/data/repositories/http/rutas.ts`: rutas y nombres de los filtros.
- `src/data/repositories/http/mapeadores.ts`: nombres de campos del JSON.

Los pasos del día de la conexión están en [integracion.md](./integracion.md).

## Convenciones

| Aspecto         | Convención                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raíz            | `/api/`. El navegador la pide a su mismo origen y un proxy (Vite en desarrollo, rewrite de Vercel en producción) la reenvía a Django.                     |
| Barra final     | **Todas las rutas terminan en `/`**, como las genera DRF. Sin la barra, `APPEND_SLASH` responde con una redirección y los POST pierden el cuerpo.         |
| JSON            | Claves en `snake_case`. El frontend las convierte a `camelCase`. Los valores de enumeraciones (`en_revision`, `personal_administrativo`) viajan tal cual. |
| Identificadores | Pueden ser numéricos o texto; el frontend los trata como texto.                                                                                           |
| Fechas          | ISO 8601 con zona (`2026-07-02T10:00:00Z`). Campos de fecha del formulario: `AAAA-MM-DD`.                                                                 |
| Listas          | Arreglo simple **o** paginación de DRF (`count`, `next`, `previous`, `results`). El frontend recorre todas las páginas.                                   |
| Borrado         | `204 No Content`.                                                                                                                                         |

### Errores

El cuerpo sigue el formato de DRF. El frontend muestra el primer mensaje que encuentra, en este orden:

1. `{"detail": "…"}`
2. `{"non_field_errors": ["…"]}`
3. `{"<campo>": ["…"]}`

| Estado | Cuándo                                                                        | Qué hace el frontend                                                                  |
| ------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 400    | Validación o regla de negocio (transición inválida, servicio sin requisitos…) | Muestra el mensaje.                                                                   |
| 401    | Sin sesión o sesión caducada                                                  | Cierra la sesión y vuelve al acceso. Con JWT, antes intenta renovar el token una vez. |
| 403    | Autenticado pero sin permiso                                                  | Muestra «No tienes permiso…».                                                         |
| 404    | No existe                                                                     | En `GET` de detalle se interpreta como «no encontrado».                               |
| 409    | Conflicto (correo duplicado…)                                                 | Muestra el mensaje.                                                                   |
| 5xx    | Error del servidor                                                            | Mensaje genérico.                                                                     |

> Con `SessionAuthentication`, DRF responde **403** (no 401) cuando no hay sesión. Así la sesión caducada no se detecta. Conviene que la vista de autenticación devuelva 401, o definir `authenticate_header` en una subclase.

## Autenticación

El frontend admite dos modos, que se eligen con `VITE_API_AUTH`.

### `sesion` (por defecto): sesión de Django + CSRF

| Método y ruta       | Cuerpo                     | Respuesta                                                                                                       |
| ------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `GET auth/csrf/`    | —                          | `204`. Fija la cookie `csrftoken` (vista con `@ensure_csrf_cookie`).                                            |
| `POST auth/login/`  | `{"correo", "contrasena"}` | `200` con el **usuario**, o `401` con `detail` si las credenciales no son válidas o la cuenta está desactivada. |
| `POST auth/logout/` | —                          | `204`                                                                                                           |
| `GET auth/yo/`      | —                          | `200` con el usuario de la sesión, o `401`.                                                                     |

- Toda petición `POST`, `PATCH`, `PUT` o `DELETE` lleva la cabecera `X-CSRFToken` con el valor de la cookie `csrftoken`.
- Las peticiones van con `credentials: 'include'`.

### `jwt`: `djangorestframework-simplejwt`

| Método y ruta              | Cuerpo                     | Respuesta                                  |
| -------------------------- | -------------------------- | ------------------------------------------ |
| `POST auth/token/`         | `{"correo", "contrasena"}` | `{"access", "refresh"}`                    |
| `POST auth/token/refresh/` | `{"refresh"}`              | `{"access"}` (y `refresh` si hay rotación) |
| `GET auth/yo/`             | —                          | Usuario                                    |

- Las peticiones llevan `Authorization: Bearer <access>`.
- Los nombres de las credenciales están en `desdeCredenciales()` de `mapeadores.ts`. simplejwt usa por defecto `username`/`password`: cámbialos ahí si hace falta.

## Recursos

### Usuario

```json
{
  "id": 7,
  "nombre": "Luis Batista",
  "correo": "l.batista@intec.edu.do",
  "rol": "estudiante",
  "activo": true,
  "matricula": "2021-0456",
  "carrera": "Ingeniería de Software",
  "semestre": "8.° · 2026-1",
  "ultimo_acceso": "2026-07-02T10:00:00Z",
  "iniciales": "LB",
  "color_avatar": "blue"
}
```

- `rol` puede ser `estudiante`, `personal_administrativo`, `coordinador` o `administrador`.
- `matricula`, `carrera` y `semestre` solo aplican a estudiantes.
- `iniciales` y `color_avatar` son opcionales: si faltan, el frontend los calcula. `color_avatar` puede ser `red`, `blue`, `green`, `amber`, `purple` o `teal`.

| Método y ruta                                | Uso                                                 |
| -------------------------------------------- | --------------------------------------------------- |
| `GET usuarios/?rol=&activo=&search=&correo=` | Lista filtrada                                      |
| `GET usuarios/{id}/`                         | Detalle                                             |
| `POST usuarios/`                             | Crear (mismos campos, sin `id` ni `ultimo_acceso`)  |
| `PATCH usuarios/{id}/`                       | Editar; también `{"activo": false}` para desactivar |

### Servicio

```json
{
  "id": "pasantia",
  "nombre": "Carta de pasantía",
  "descripcion": "Carta dirigida a la empresa…",
  "icono": "📄",
  "color": "bg-canvas",
  "categoria": "academico",
  "requisitos": [
    { "id": 1, "descripcion": "Carta de aceptación de la empresa", "obligatorio": true }
  ],
  "plantilla": "carta-pasantia.html",
  "activo": true,
  "dias_estimados": 3
}
```

- **`id` es la clave del servicio, no un número**: `pasantia`, `cambio`, `reingreso`, `grado`, `carnet`, `objetos`… El frontend elige el formulario de cada servicio por esa clave (`CAMPOS_POR_SERVICIO` en `src/features/requests/formularios.ts`). Con un id numérico, todos mostrarían el formulario genérico. En Django hay dos opciones:
  - `clave = models.SlugField(primary_key=True)`;
  - o conservar el `id` numérico y exponer la clave como `id` en el serializer, aceptando `servicio_id` con `SlugRelatedField(slug_field="clave")`.
- `categoria` puede ser `academico`, `administrativo` o `identidad`.
- `icono` y `color` son opcionales y solo afectan a la presentación.

| Método y ruta                                   | Uso                                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `GET servicios/?activo=true&categoria=&search=` | Catálogo. Conviene que sea público (`AllowAny`): la pantalla de acceso muestra cuántos servicios hay. |
| `GET servicios/{id}/`                           | Detalle                                                                                               |
| `POST servicios/`                               | Crear                                                                                                 |
| `PATCH servicios/{id}/`                         | Editar; `{"activo": true}` debe fallar con 400 si el servicio no tiene requisitos                     |

> Los campos del formulario de cada servicio están definidos hoy en el frontend (`src/features/requests/formularios.ts`) y se envían en `datos_formulario` con esos mismos nombres, en `camelCase`. Para la carta de pasantía, por ejemplo: `empresa`, `rnc`, `cargo`, `departamento`, `fechaInicio`, `fechaFin`, `supervisorNombre`…

### Solicitud

```json
{
  "id": 1042,
  "servicio_id": "pasantia",
  "solicitante_id": 7,
  "estado": "en_revision",
  "creada_en": "2026-07-02T10:00:00Z",
  "actualizada_en": "2026-07-03T09:00:00Z",
  "enviada_en": "2026-07-02T11:00:00Z",
  "datos_formulario": { "empresa": "TechCorp Solutions S.R.L.", "fechaInicio": "2026-08-01" },
  "adjuntos": [
    {
      "id": 9,
      "nombre": "cv.pdf",
      "tamano": 120394,
      "tipo": "application/pdf",
      "subido_en": "2026-07-02T10:00:00Z"
    }
  ],
  "historial": [
    {
      "id": 1,
      "autor_id": 7,
      "autor_nombre": "Luis Batista",
      "fecha": "2026-07-02T10:00:00Z",
      "estado_anterior": null,
      "estado_nuevo": "borrador",
      "comentario": null
    }
  ],
  "comentario_interno": "",
  "asignada_a": 12,
  "prioridad": "normal",
  "documento": null
}
```

- `estado` puede ser `borrador`, `enviada`, `en_revision`, `devuelta`, `corregida`, `aprobada`, `rechazada`, `completada` o `cancelada`.
- `historial` es de solo lectura: lo escribe el servidor en cada transición.
- `comentario_interno` no debe enviarse al rol `estudiante`.
- `prioridad` puede ser `normal` o `alta`.
- `documento` vale `null` hasta que la solicitud se completa. Después es `{"nombre": "carta-de-pasantia-1042.pdf", "generado_en": "…"}`.
- **Las claves de `datos_formulario` no se convierten** a ningún formato: se guardan y se devuelven tal cual (por ejemplo `fechaInicio`).

| Método y ruta                                                     | Cuerpo                                                 | Uso                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `GET solicitudes/?solicitante=&estado=&estado=&servicio=&search=` | —                                                      | Lista. `estado` puede repetirse. Un estudiante solo debe recibir las suyas.                                     |
| `GET solicitudes/{id}/`                                           | —                                                      | Detalle                                                                                                         |
| `POST solicitudes/`                                               | `{"servicio_id", "datos_formulario"}`                  | Crea en `borrador`. El solicitante sale de la sesión.                                                           |
| `PATCH solicitudes/{id}/`                                         | `datos_formulario`, `comentario_interno`, `asignada_a` | Editar (solo en estados editables)                                                                              |
| `DELETE solicitudes/{id}/`                                        | —                                                      | Eliminar                                                                                                        |
| `POST solicitudes/{id}/transiciones/`                             | `{"hacia": "devuelta", "comentario": "Falta el CV."}`  | Cambio de estado. Devuelve la solicitud actualizada; `400` si la transición no es válida para ese estado y rol. |

Las transiciones válidas y quién puede ejecutarlas están en `src/domain/requestStateMachine.ts` y en el README (sección «Transiciones válidas»). El servidor debe aplicar las mismas reglas:

- `devuelta` y `rechazada` exigen comentario.
- Al pasar a `en_revision`, la solicitud se asigna a quien la toma.
- Al pasar a `completada`, se genera el documento (ver abajo).

### Adjuntos

| Método y ruta                                         | Cuerpo                                       | Uso                                          |
| ----------------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `POST solicitudes/{id}/adjuntos/`                     | `multipart/form-data` con el campo `archivo` | Sube un archivo. Devuelve el adjunto.        |
| `DELETE solicitudes/{id}/adjuntos/{adjunto_id}/`      | —                                            | Quita un adjunto                             |
| `GET solicitudes/{id}/adjuntos/{adjunto_id}/archivo/` | —                                            | Contenido del archivo, con su `Content-Type` |

Límites que ya anuncia la interfaz: PDF, JPG o PNG, máximo 5 MB por archivo.

### Documento de salida (carta de pasantía, etc.)

| Método y ruta                     | Uso                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `GET solicitudes/{id}/documento/` | El PDF (`Content-Type: application/pdf`). `404` si la solicitud no está completada. |

Implementación sugerida en Django:

1. Una plantilla HTML por servicio (`templates/documentos/carta-pasantia.html`), con el membrete de INTEC y variables del estudiante y de `datos_formulario`.
2. Al ejecutar la transición a `completada`, renderizar la plantilla y convertirla a PDF con **WeasyPrint** (`HTML(string=html).write_pdf()`).
3. Guardar el PDF en un `FileField` (`documento`) con almacenamiento externo (`django-storages`: S3, Supabase Storage o Cloudinary). El disco de Render se borra en cada despliegue.
4. Servirlo en `GET solicitudes/{id}/documento/`, comprobando que quien lo pide es el solicitante o personal administrativo.

Si una carta requiere la firma real de una autoridad, el personal puede subir el PDF firmado antes de completar la solicitud en lugar de generarlo. Para el frontend el endpoint es el mismo.

### Metas del cuadro de mando

| Método y ruta            | Cuerpo          | Uso                                                                                                                 |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GET indicadores/metas/` | —               | Metas vigentes, p. ej. `{"entrega_a_tiempo": 85, "tiempo_ciclo": 5, …}`. Las que falten toman su valor por defecto. |
| `PUT indicadores/metas/` | El mismo objeto | Guarda las metas. Solo el **coordinador**; los demás reciben `403`.                                                 |

- Las claves son los identificadores de los indicadores en `snake_case`. La lista completa está en `src/domain/indicadores/definiciones.ts` y en [cuadro-de-mando.md](./cuadro-de-mando.md).
- Hoy los indicadores se calculan en el cliente a partir de `GET solicitudes/`, `servicios/` y `usuarios/`. Si el volumen crece, conviene un endpoint agregado (`GET indicadores/?periodo=90`) que devuelva los valores ya calculados con las mismas fórmulas.

## Ajustes de Django para el despliegue

```python
ALLOWED_HOSTS = ["servis-api.onrender.com"]
CSRF_TRUSTED_ORIGINS = [
    "https://*.vercel.app",          # producción y previews de Vercel
    "http://localhost:5173",         # desarrollo con el proxy de Vite
]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

- Con el proxy (recomendado), el navegador no hace peticiones de otro origen, así que **no hace falta CORS**.
- Si en cambio se llama a Django directamente (`VITE_API_BASE_URL=https://servis-api.onrender.com/api`), hacen falta `django-cors-headers` con `CORS_ALLOW_CREDENTIALS = True` y los orígenes de Vercel. Además, las cookies necesitan `SameSite=None; Secure`.
