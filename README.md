# SERVIS

[![Integración continua](https://github.com/Lbatista-s/Servis/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Lbatista-s/Servis/actions/workflows/ci.yml)

**Sistema de Emisión y Registro Virtual de Servicios Institucionales**
Área de Ingenierías · Instituto Tecnológico de Santo Domingo (INTEC)
Código de proyecto: `SRV-IDS-2026-01`

SERVIS digitaliza y centraliza las solicitudes de servicios académicos y administrativos del Área
de Ingenierías, sustituyendo un proceso manual basado en correos y papeleo. Los estudiantes crean
solicitudes digitales, adjuntan los documentos requeridos y siguen el estado de su trámite en
línea; el personal administrativo las revisa, aprueba, rechaza o devuelve para corrección, con
trazabilidad completa de cada acción.

Esta aplicación es la implementación en React del prototipo de alta fidelidad
`docs/prototipo/SERVIS_HiFi_Prototipo.html`, que se conserva en el repositorio como referencia de diseño.

## Documentación

| Documento                                            | Para qué sirve                                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Este `README.md`                                     | Visión general: instalación, cuentas de prueba, pantallas, modelo de dominio, estructura, datos, despliegue y pruebas.   |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                 | Convenciones del equipo: ramas, commits, comprobaciones antes de un PR y dónde va cada cosa.                             |
| [`docs/cuadro-de-mando.md`](docs/cuadro-de-mando.md) | El cuadro de mando integral (Kaplan y Norton): fundamento, indicadores, fórmulas, metas y por qué cada rol ve lo que ve. |
| [`docs/api.md`](docs/api.md)                         | Contrato de la API REST que espera el frontend, para el equipo del backend de Django.                                    |
| [`docs/servicios-intec.md`](docs/servicios-intec.md) | Correspondencia de cada servicio con los formularios del Centro de Servicio de INTEC: campos, documentos y exclusiones.  |
| [`docs/integracion.md`](docs/integracion.md)         | Pasos para conectar el backend: dónde ajustar rutas y campos, proxy de Vite, rewrite de Vercel y variables de entorno.   |

---

## Stack técnico

| Capa          | Tecnología                                       |
| ------------- | ------------------------------------------------ |
| Interfaz      | React 18 + TypeScript en modo `strict`           |
| Empaquetado   | Vite 5                                           |
| Componentes   | Ant Design 6 con el tema institucional de SERVIS |
| Estilos       | Tailwind CSS para maquetación, mismos tokens     |
| Enrutamiento  | React Router v6                                  |
| Estado global | Zustand (con `persist` para la sesión)           |
| Datos remotos | TanStack Query sobre repositorios HTTP           |
| API simulada  | Mock Service Worker (MSW) hasta tener backend    |
| Formularios   | React Hook Form + Zod                            |
| Documentos    | Visor con react-pdf (pdf.js)                     |
| Pruebas       | Vitest + React Testing Library + MSW             |
| Calidad       | ESLint + Prettier                                |

Los componentes de interfaz son de Ant Design, configurados con la paleta del manual de identidad
de INTEC: Rojo INTEC `#E4002B` como color de acción, Vino `#93070A` para lo seleccionado y los
estados de interacción, y Gris INTEC para bordes y texto secundario. El marco de la aplicación
(barra lateral y superior) usa el Gris INTEC sombreado `#2B2C2E` (Gris `#63666A` al 43 % con negro)
en ambos temas, para que el logo comercial y el texto blanco destaquen. Tipografía: Montserrat para
títulos y Open Sans para el texto.

- `src/theme/tokens.ts` define las paletas **clara y oscura** (mismas claves) y es la única fuente
  de color. `src/theme/css.ts` las publica como variables CSS, que usan Tailwind y los estilos en
  línea; `src/theme/antd.ts` genera el tema de Ant Design de cada modo.
- El tema arranca en claro y se cambia con el botón sol/luna de la barra superior o del acceso; la
  elección se recuerda en el navegador.
- `src/components/ui/Logotipo.tsx` es el logotipo en vector, según el «Modelo de logos auxiliares»
  del manual: logo comercial oficial de INTEC, hexágono de SERVIS al 125 % apoyado en su lado
  superior derecho y nombre a la derecha del logo de INTEC (Vino en fondos claros, blanco en el
  marco). Una prueba comprueba la geometría.
- Todo par de texto y fondo de ambas paletas supera 4,5:1; lo comprueba `src/theme/tema.test.tsx`.

---

## Instalación y ejecución

Requiere **Node.js 20 o superior**.

```bash
git clone https://github.com/Lbatista-s/Servis.git
cd Servis
npm install
cp .env.example .env      # opcional: los valores por defecto ya funcionan
npm run dev               # http://localhost:5173
```

### Comandos disponibles

| Comando                | Descripción                                       |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo en `localhost:5173`        |
| `npm run build`        | Comprobación de tipos y compilación de producción |
| `npm run preview`      | Sirve la compilación de producción                |
| `npm run typecheck`    | Sólo comprobación de tipos                        |
| `npm run lint`         | ESLint (falla con cualquier advertencia)          |
| `npm run lint:fix`     | ESLint con corrección automática                  |
| `npm run format`       | Formatea el código con Prettier                   |
| `npm run format:check` | Comprueba el formato sin modificar nada           |
| `npm test`             | Ejecuta la batería de pruebas                     |
| `npm run test:watch`   | Pruebas en modo observación                       |
| `npm run test:ui`      | Pruebas con la interfaz web de Vitest             |

---

## Cuentas de prueba

Mientras no esté conectado el backend, la API la responde un **servidor simulado** (ver
[Datos y API](#datos-y-api)). Todas sus cuentas usan la contraseña **`servis2026`**, y una
contraseña incorrecta se rechaza igual que lo hará Django. La pantalla de acceso lo indica y ofrece
rellenar el formulario con una cuenta de cada rol.

| Correo                    | Nombre           | Rol                       | Pantalla inicial   |
| ------------------------- | ---------------- | ------------------------- | ------------------ |
| `l.batista@intec.edu.do`  | Luis Batista     | Estudiante                | `/inicio`          |
| `a.leon@intec.edu.do`     | Adán León        | Estudiante                | `/inicio`          |
| `g.jimeno@intec.edu.do`   | Gerald Jimeno    | Estudiante                | `/inicio`          |
| `a.garcia@intec.edu.do`   | Ana García       | Estudiante                | `/inicio`          |
| `r.almanzar@intec.edu.do` | Ricardo Almanzar | Personal administrativo   | `/bandeja`         |
| `c.perez@intec.edu.do`    | Carmen Pérez     | Personal administrativo   | `/bandeja`         |
| `a.feliz@intec.edu.do`    | Axell Feliz      | Coordinador               | `/cuadro-de-mando` |
| `e.lopez@intec.edu.do`    | Edwin López      | Administrador del sistema | `/admin`           |

`m.torres@intec.edu.do` (Miguel Torres) existe pero está **desactivado**, para poder demostrar el
bloqueo de acceso de cuentas inactivas.

---

## Pantallas

| #   | Ruta                             | Pantalla                                                      | Rol                                                         |
| --- | -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `/login`                         | Inicio de sesión                                              | Público                                                     |
| 2   | `/recuperar`                     | Recuperar contraseña (`POST auth/recuperar/`)                 | Público                                                     |
| 3   | `/inicio`                        | Inicio del estudiante                                         | Estudiante                                                  |
| 4   | `/catalogo`                      | Catálogo de servicios                                         | Estudiante                                                  |
| 5   | `/solicitudes/nueva/:servicioId` | Nueva solicitud (formulario por pasos)                        | Estudiante                                                  |
| 6   | `/solicitudes/:id`               | Detalle y seguimiento                                         | Estudiante                                                  |
| 6b  | `/solicitudes`                   | Mis solicitudes (búsqueda y filtro)                           | Estudiante                                                  |
| 6c  | `/documentos`                    | Mis documentos (visor y descarga)                             | Estudiante                                                  |
| 7   | `/bandeja`                       | Bandeja; vistas `?vista=pendientes`, `asignadas`, `devueltas` | Personal administrativo · Coordinador                       |
| 8   | `/bandeja/:id`                   | Detalle con acciones de revisión                              | Personal administrativo · Coordinador                       |
| 9   | `/cuadro-de-mando`               | Cuadro de mando integral y análisis operativo                 | Coordinador (inicio, edita metas) · Personal administrativo |
| 10  | `/admin/usuarios`                | Gestión de usuarios                                           | Administrador                                               |
| 11  | `/admin/servicios`               | Catálogo: alta, edición y documentos pedidos                  | Administrador                                               |
| 12  | `/admin`                         | Inicio del administrador                                      | Administrador                                               |

Cada rol entra en su pantalla. El coordinador entra al cuadro de mando integral (Kaplan y Norton)
y el personal administrativo a la bandeja. El estudiante y el administrador entran a una página de
inicio simple. El porqué, los indicadores, sus fórmulas y sus metas están en
[`docs/cuadro-de-mando.md`](docs/cuadro-de-mando.md).

La antigua ruta `/reportes` redirige a `/cuadro-de-mando`, donde los reportes viven ahora como la
pestaña «Análisis operativo». Cualquier otra ruta desconocida muestra una página 404.

Las rutas están protegidas por el componente `<RequireRole>`. Un rol no autorizado no ve un error:
se le redirige a la pantalla inicial que le corresponde.

En todas las pantallas:

- **Barra superior:** tema claro u oscuro, **notificaciones** (contador de no leídas y enlace a la
  solicitud) y el **menú de perfil**, único control de la cuenta: nombre, rol, correo,
  Configuración y Cerrar sesión.
- **Barra lateral:** la navegación del rol por grupos (el personal tiene accesos directos con
  contador a las solicitudes pendientes, asignadas a él y devueltas). El logotipo lleva a la
  pantalla de inicio y al pie está el contacto del Área de Ingenierías.
- **Documentos:** los adjuntos y los documentos emitidos se abren en un **visor integrado** con
  paginación, zoom, descarga e impresión.
- **Exportar CSV** en la bandeja (lo que se ve, con los filtros aplicados) y en el cuadro de mando.
- Mientras cargan, las pantallas muestran un esqueleto con su forma; si una consulta falla,
  ofrecen «Reintentar».

---

## Modelo de dominio

### Roles

`estudiante` · `personal_administrativo` · `coordinador` · `administrador`

### Estados del ciclo de vida

`borrador` · `enviada` · `en_revision` · `devuelta` · `corregida` · `aprobada` · `rechazada` ·
`completada` · `cancelada`

### Transiciones válidas

| Estado actual | Estados siguientes permitidos       | Actor                                 |
| ------------- | ----------------------------------- | ------------------------------------- |
| `borrador`    | `enviada`, `cancelada`              | Estudiante                            |
| `enviada`     | `en_revision`, `cancelada`          | Personal administrativo               |
| `en_revision` | `aprobada`, `rechazada`, `devuelta` | Personal administrativo · Coordinador |
| `devuelta`    | `corregida`, `cancelada`            | Estudiante                            |
| `corregida`   | `en_revision`, `cancelada`          | Personal administrativo               |
| `aprobada`    | `completada`                        | Personal administrativo               |
| `rechazada`   | — (final)                           | —                                     |
| `completada`  | — (final)                           | —                                     |
| `cancelada`   | — (final)                           | —                                     |

La tabla vive en `src/domain/requestStateMachine.ts` y es la única fuente de verdad: cualquier
transición que no figure en ella es imposible. Una prueba recorre las 81 combinaciones posibles de
estados para verificarlo.

### Reglas de negocio codificadas

- Todo rechazo exige una justificación de al menos **30 caracteres**.
- Toda devolución exige indicar el motivo.
- Una solicitud no puede aprobarse sin haber pasado por `en_revision`.
- Cada cambio de estado genera automáticamente una entrada **inmutable** en el historial, con
  autor, fecha, estado anterior, estado nuevo y comentario.
- Una solicitud `completada` no puede modificarse (igual que `rechazada` y `cancelada`).
- Sólo el estudiante propietario puede ejecutar las acciones de estudiante sobre su solicitud.
- El estudiante puede modificar los datos y los documentos de su solicitud **sólo** mientras está
  en `borrador` o `devuelta`: mientras el expediente está en manos del personal administrativo
  (`enviada`, `en_revision`, `corregida`) los datos quedan congelados, para que cambiarlos no
  invalide el trabajo del revisor.

Toda esta lógica es pura y vive en `src/domain/`: no importa React, no toca el almacenamiento y se
prueba sin renderizar nada.

---

## Estructura de carpetas

El código se organiza por funcionalidad, no por tipo de archivo.

```
src/
  app/                    Router, armazón, barras, notificaciones, 404, límites de error y rutas por rol
  config/entorno.ts       Variables VITE_* validadas con Zod
  domain/                 Lógica pura, sin React ni almacenamiento
    types.ts              Entidades, roles y estados
    requestStateMachine.ts  Transiciones válidas del ciclo de vida
    businessRules.ts      Reglas de negocio (justificaciones, permisos, metas…)
    documentos.ts         Nombre del documento de salida
    indicadores/          Cuadro de mando: definiciones, calendario laboral y cálculo
  data/
    archivos.ts           Archivos adjuntos pendientes de subir
    repositories/
      types.ts            Contratos: solicitudes, usuarios, servicios, metas, notificaciones y auth
      http/               API de Django: cliente, rutas, mapeadores y repositorios
    index.ts              Instancia única de los repositorios
  mocks/                  API simulada (MSW): handlers, estado, cuentas y datos sembrados
    datos/                Solicitudes del prototipo (SRV-1035 a 1042) e historial de 6 meses (SRV-09xx)
  features/
    auth/                 Acceso, recuperación y sesión
    catalog/              Catálogo de servicios
    requests/             Inicio y solicitudes del estudiante, acciones de dominio
    admin-inbox/          Bandeja administrativa y revisión
    cuadro-mando/         Cuadro de mando integral y análisis operativo
    admin/                Inicio del administrador
    user-management/      Gestión de usuarios
    service-management/   Gestión del catálogo
    settings/             Configuración y restablecimiento de los datos simulados
  components/ui/          Envoltorios finos de Ant Design con la API en español, esqueletos de carga
  components/visor/       Visor de PDF e imágenes (react-pdf, cargado bajo demanda)
  theme/                  Tokens de la línea gráfica (claro y oscuro) y tema de Ant Design
  hooks/                  Consultas (TanStack Query), visor, descargas y utilidades de React
  lib/                    Formato, filtros, CSV, descargas y utilidades sin React
  test/                   Configuración y fábricas de prueba
docs/                     Documentación funcional y técnica (ver «Documentación»)
```

---

## Datos y API

La aplicación habla **siempre** con una API REST a través de los repositorios HTTP
(`src/data/repositories/http/`), con el contrato de [`docs/api.md`](docs/api.md). El backend de
Django vive en otro repositorio y aún no está conectado, así que mientras tanto la API la responde
un **servidor simulado**:

- Es [Mock Service Worker](https://mswjs.io) (`src/mocks/`): un _service worker_ que intercepta las
  peticiones a `/api` y responde como lo hará Django REST Framework (`snake_case`, paginación,
  sesión con CSRF o JWT, errores 400/401/403/404/409).
- Aplica las mismas reglas que el dominio (`src/domain/`), así que una acción inválida se rechaza
  igual que en el servidor real.
- Guarda sus datos en el navegador (`servis:api-simulada`): cada visitante tiene su propia copia, y
  los cambios sobreviven a una recarga pero no se comparten entre dispositivos.
- Se siembra con las solicitudes del prototipo (`SRV-1035` a `SRV-1042`), un historial cerrado de
  unas 90 solicitudes de los seis meses anteriores (`SRV-09xx`) para las tendencias del cuadro de
  mando, los usuarios del equipo, el catálogo de 12 servicios y las metas iniciales.
- Al completar una solicitud genera un **PDF de muestra** (marcado «MUESTRA», sin validez oficial).
- **Configuración → Restablecer datos simulados** (en el menú de perfil) vuelve al estado inicial;
  conviene usarlo antes de una presentación.

Se controla con `VITE_API_MOCK` (por defecto `true`). Con `false`, el servidor simulado, MSW y jsPDF
**no se descargan**: las peticiones van al backend real y ninguna pantalla cambia.

Las consultas pasan por **TanStack Query** (`src/hooks/useDatos.ts`): caché por recurso,
reintentos ante fallos de red, filtros resueltos en el servidor y revalidación precisa tras cada
escritura. Ningún componente toca `localStorage`; una regla de ESLint lo impide fuera de
`src/mocks/`.

### Generación de documentos PDF

Los documentos oficiales (la carta de pasantía, etc.) **los genera el backend** al completar la
solicitud: es un documento institucional que no puede depender del navegador. El frontend sólo los
**muestra** en el visor integrado y permite descargarlos o imprimirlos. El reparto completo está en
[`docs/api.md`](docs/api.md#quién-genera-y-quién-muestra-los-pdf).

### Conexión con el backend (Django)

- [`docs/api.md`](docs/api.md): contrato de la API para el equipo del backend (rutas, JSON,
  errores, autenticación, notificaciones, recuperación de contraseña y generación de PDF).
- [`docs/integracion.md`](docs/integracion.md): pasos del día de la conexión. Las rutas se ajustan
  en `http/rutas.ts` y los nombres de campos en `http/mapeadores.ts`; también cubre el proxy de
  Vite, el rewrite de Vercel y las variables de entorno.

---

## Despliegue en Vercel

El proyecto es una aplicación de una sola página completamente estática, así que no necesita
servidor propio. `vercel.json` deja la configuración lista:

1. En [vercel.com](https://vercel.com) → **Add New… → Project** e importar `Lbatista-s/Servis`.
2. Seleccionar la rama que se quiere desplegar.
3. **Deploy.** No hay que tocar los ajustes de compilación. Mientras no haya backend conviene
   declarar `VITE_API_MOCK=true` en **Settings → Environment Variables** (es también el valor por
   defecto), para que quede explícito qué API usa cada entorno.

La clave está en las **reescrituras** declaradas en `vercel.json`: sin ellas, recargar `/bandeja` o
abrir un enlace directo a `/solicitudes/SRV-1042` devolvería 404, porque Vercel buscaría un archivo
en esa ruta en lugar de dejar que React Router resuelva la navegación.

Cada `push` genera un despliegue de vista previa con su propia URL, útil para compartir una rama en
revisión sin tocar la principal.

> **Con backend:** para usar la API de Django hacen falta un rewrite de `/api` en `vercel.json` y
> las variables `VITE_API_MOCK=false` y `VITE_API_AUTH`. Los pasos están en
> [`docs/integracion.md`](docs/integracion.md).

> **Sobre los datos simulados:** viven en el navegador de cada visitante, así que los cambios de
> una persona no se ven en el dispositivo de otra. Desaparece al conectar el backend real.

---

## Pruebas

```bash
npm test
```

Son 213 pruebas, que cubren:

- **Máquina de estados**: las 81 combinaciones de estados frente a la tabla de la especificación,
  la autorización por rol y las transiciones que exigen comentario.
- **Reglas de negocio**: justificación de 30 caracteres, motivo de devolución, aprobación sin
  revisión, inmutabilidad de los estados finales, activación de servicios, propiedad de la
  solicitud y permiso para editar las metas.
- **API simulada** (a través de los repositorios HTTP, como la aplicación): acceso y contraseña,
  filtros, permisos por rol, adjuntos, documento de salida, usuarios, servicios, metas,
  notificaciones y recuperación de contraseña.
- **Capa HTTP**: contra un `fetch` simulado, conversión de claves, paginación, errores, sesión con
  CSRF, JWT con renovación, subida de adjuntos, descarga de documentos y metas.
- **Cuadro de mando**: calendario laboral, cada indicador, evaluación frente a la meta, tendencia,
  serie mensual y el historial sembrado.
- **Interfaz**, con React Testing Library contra la API simulada: el flujo crítico completo
  (crear → enviar → revisar → aprobar → completar), la botonera de acciones, el visor de
  documentos, la campana, el alta de servicios, la barra lateral, la página 404, el límite de
  errores, la accesibilidad de los campos, el tema y el cuadro de mando.

La integración continua (`.github/workflows/ci.yml`) ejecuta en cada push el formato, ESLint, los
tipos, las pruebas y la compilación.

---

## Equipo

**Proyecto de Ingeniería de Software · INTEC**

- Luis Enrique Batista Schrils
- Adán Roberto León Nicasio
- Gerald Junior Jimeno Liriano
- Ricardo José Almanzar Capestany
- Axell Feliz Rodríguez

**Asesor:** Prof. Edwin López

---

## Notas sobre el prototipo

Al trasladar el prototipo se resolvieron tres inconsistencias de sus datos de ejemplo, que se
documentan aquí para que la comparación sea transparente:

1. El prototipo tenía **3 roles** en su barra de navegación pero **4** en su lista de usuarios. Se
   implementaron los cuatro que exige la especificación. El coordinador comparte la bandeja con el
   personal administrativo, pero su pantalla inicial es el cuadro de mando integral.
2. Tres solicitudes estaban asignadas a personas que la propia lista de usuarios define como
   personal administrativo o coordinador. Se reasignaron a estudiantes y se incorporó a Ana García
   para mantener la coherencia de roles.
3. El prototipo usaba la clave `revision` para el estado; el dominio usa `en_revision`, conforme a
   la especificación funcional.
