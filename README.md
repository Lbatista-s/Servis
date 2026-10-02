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
`SERVIS_HiFi_Prototipo.html`, que se conserva en el repositorio como referencia de diseño.

## Documentación

| Documento                                            | Para qué sirve                                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Este `README.md`                                     | Visión general: instalación, roles de prueba, pantallas, modelo de dominio, estructura, persistencia, despliegue y pruebas. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                 | Convenciones del equipo: ramas, commits, comprobaciones antes de un PR y dónde va cada cosa.                                |
| [`docs/cuadro-de-mando.md`](docs/cuadro-de-mando.md) | El cuadro de mando integral (Kaplan y Norton): fundamento, indicadores, fórmulas, metas y por qué cada rol ve lo que ve.    |
| [`docs/api.md`](docs/api.md)                         | Contrato de la API REST que espera el frontend, para el equipo del backend de Django.                                       |
| [`docs/integracion.md`](docs/integracion.md)         | Pasos para conectar el backend: dónde ajustar rutas y campos, proxy de Vite, rewrite de Vercel y variables de entorno.      |

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
| Formularios   | React Hook Form + Zod                            |
| Datos         | Repositorios intercambiables: `local` o `http`   |
| Documentos    | jsPDF (PDF de muestra en modo local)             |
| Pruebas       | Vitest + React Testing Library                   |
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
- `src/components/ui/Logotipo.tsx` es el logotipo en vector: logo comercial oficial de INTEC más el
  hexágono de SERVIS (125 %), según la regla de logos auxiliares del manual.
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

## Roles de prueba

Con los datos de demostración (`VITE_DATA_SOURCE=local`, el valor por defecto) la autenticación
está **simulada**: la contraseña no se verifica. En la pantalla de acceso, el desplegable
**«Acceder como»** fija la cuenta activa y, con ella, el rol. En modo desarrollo hay además una
barra superior que permite saltar entre roles sin volver a iniciar sesión.

Con la API real (`VITE_DATA_SOURCE=http`) el correo y la contraseña los valida Django, y
desaparecen el desplegable y la barra de roles.

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

| #   | Ruta                             | Pantalla                                      | Rol                                                         |
| --- | -------------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| 1   | `/login`                         | Inicio de sesión                              | Público                                                     |
| 2   | `/recuperar`                     | Recuperar contraseña                          | Público                                                     |
| 3   | `/inicio`                        | Inicio del estudiante                         | Estudiante                                                  |
| 4   | `/catalogo`                      | Catálogo de servicios                         | Estudiante                                                  |
| 5   | `/solicitudes/nueva/:servicioId` | Nueva solicitud (formulario por pasos)        | Estudiante                                                  |
| 6   | `/solicitudes/:id`               | Detalle y seguimiento                         | Estudiante                                                  |
| 7   | `/bandeja`                       | Bandeja administrativa                        | Personal administrativo · Coordinador                       |
| 8   | `/bandeja/:id`                   | Detalle con acciones de revisión              | Personal administrativo · Coordinador                       |
| 9   | `/cuadro-de-mando`               | Cuadro de mando integral y análisis operativo | Coordinador (inicio, edita metas) · Personal administrativo |
| 10  | `/admin/usuarios`                | Gestión de usuarios                           | Administrador                                               |
| 11  | `/admin/servicios`               | Gestión del catálogo                          | Administrador                                               |
| 12  | `/admin`                         | Inicio del administrador                      | Administrador                                               |

Cada rol entra en su pantalla. El coordinador entra al cuadro de mando integral (Kaplan y Norton)
y el personal administrativo a la bandeja. El estudiante y el administrador entran a una página de
inicio simple. El porqué, los indicadores, sus fórmulas y sus metas están en
[`docs/cuadro-de-mando.md`](docs/cuadro-de-mando.md).

La antigua ruta `/reportes` redirige a `/cuadro-de-mando`, donde los reportes viven ahora como la
pestaña «Análisis operativo».

Las rutas están protegidas por el componente `<RequireRole>`. Un rol no autorizado no ve un error:
se le redirige a la pantalla inicial que le corresponde.

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
- Un servicio no puede activarse sin requisitos definidos.
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
  app/                    Router, armazón, barra lateral y superior, navegación y rutas por rol
  domain/                 Lógica pura, sin React ni almacenamiento
    types.ts              Entidades, roles y estados
    requestStateMachine.ts  Transiciones válidas del ciclo de vida
    businessRules.ts      Reglas de negocio (justificaciones, permisos, metas…)
    documentos.ts         Nombre del documento de salida
    indicadores/          Cuadro de mando: definiciones, calendario laboral y cálculo
  data/
    seed.ts               Datos de demostración del prototipo (SRV-1035 a SRV-1042)
    seedHistorial.ts      Historial cerrado de 6 meses para el cuadro de mando (SRV-09xx)
    schema.ts             Versionado del esquema y migraciones
    archivos.ts           Archivos adjuntos pendientes de subir
    repositories/
      types.ts            Contratos: solicitudes, usuarios, servicios, autenticación y metas
      localStorage/       Implementación local (demostración)
      http/               API de Django: cliente, rutas, mapeadores y repositorios
    index.ts              Factoría según VITE_DATA_SOURCE
  features/
    auth/                 Acceso, recuperación y sesión
    catalog/              Catálogo de servicios
    requests/             Inicio y solicitudes del estudiante, acciones de dominio
    admin-inbox/          Bandeja administrativa y revisión
    cuadro-mando/         Cuadro de mando integral y análisis operativo
    admin/                Inicio del administrador
    user-management/      Gestión de usuarios
    service-management/   Gestión del catálogo
    settings/             Configuración y datos de demostración
  components/ui/          Envoltorios finos de Ant Design con la API en español
  theme/                  Tokens de la línea gráfica (claro y oscuro) y tema de Ant Design
  hooks/                  Acceso a datos, descargas y utilidades de React
  lib/                    Formato, filtros, descargas y utilidades sin React
  test/                   Configuración y fábricas de prueba
docs/                     Documentación funcional y técnica (ver «Documentación»)
```

---

## Persistencia

> **Por defecto la persistencia es `localStorage`.** El backend de Django vive en otro repositorio;
> el frontend ya está preparado para conectarse a él (ver más abajo).

Los datos viven en el navegador bajo la clave `servis:datos`. Esto es deliberado: el objetivo de
esta entrega es demostrar el sistema funcionando, no desplegar infraestructura.

Ahora bien, la persistencia está **desacoplada de la interfaz** para que añadir un backend no
obligue a tocar ni una pantalla:

- Todos los métodos de repositorio son **asíncronos** (`Promise<T>`), aunque hoy resuelvan de
  inmediato. Las firmas no cambiarán al pasar a HTTP.
- Ningún componente accede a `localStorage`: una regla de ESLint lo prohíbe fuera de
  `src/data/repositories/localStorage/`. La interfaz consume hooks (`useSolicitudes`,
  `useServicios`, `useUsuarios`) o el propio repositorio.
- El esquema está versionado (`SERVIS_SCHEMA_VERSION`, hoy **v3**) con una cadena de migraciones,
  de modo que un cambio de estructura no rompa los datos ya guardados.
- Al primer arranque el almacén se siembra con:
  - las solicitudes del prototipo, `SRV-1035` a `SRV-1042`;
  - un historial cerrado de unas 90 solicitudes de los seis meses anteriores (`SRV-09xx`), que
    alimenta las tendencias del cuadro de mando;
  - los usuarios del equipo, el catálogo de 11 servicios y las metas iniciales del cuadro de mando.

### Conexión con el backend (Django)

La implementación HTTP (`src/data/repositories/http/`) está completa y probada contra un servidor
simulado. Cubre:

- autenticación por sesión de Django con CSRF, o por JWT;
- conversión `snake_case` ↔ `camelCase` y paginación de DRF;
- subida de adjuntos y descarga del documento de salida (la carta de pasantía, etc.).

Activarla es cambiar `VITE_DATA_SOURCE=local` por `VITE_DATA_SOURCE=http`: la factoría de
`src/data/index.ts` elige la implementación y ninguna pantalla cambia.

- [`docs/api.md`](docs/api.md): contrato de la API que espera el frontend, para el equipo del
  backend (rutas, JSON, errores, autenticación y generación de PDF con WeasyPrint).
- [`docs/integracion.md`](docs/integracion.md): pasos del día de la conexión. Las rutas se ajustan
  en `http/rutas.ts` y los nombres de campos en `http/mapeadores.ts`; también cubre el proxy de
  Vite, el rewrite de Vercel y las variables de entorno.

En modo local, al completar una solicitud se genera en el navegador un **PDF de muestra** (sin
validez oficial) con los datos de la solicitud, para poder demostrar el flujo completo.

### Restablecer los datos de demostración

En la barra lateral, **Configuración → Restablecer datos de demostración** devuelve el sistema a su
estado inicial. Conviene usarlo antes de una presentación para partir de datos limpios.

---

## Despliegue en Vercel

El proyecto es una aplicación de una sola página completamente estática, así que no necesita
servidor propio. `vercel.json` deja la configuración lista:

1. En [vercel.com](https://vercel.com) → **Add New… → Project** e importar `Lbatista-s/Servis`.
2. Seleccionar la rama que se quiere desplegar.
3. **Deploy.** No hay que tocar los ajustes de compilación ni añadir variables de entorno: la
   fuente de datos por defecto ya es `local`.

La clave está en las **reescrituras** declaradas en `vercel.json`: sin ellas, recargar `/bandeja` o
abrir un enlace directo a `/solicitudes/SRV-1042` devolvería 404, porque Vercel buscaría un archivo
en esa ruta en lugar de dejar que React Router resuelva la navegación.

Cada `push` genera un despliegue de vista previa con su propia URL, útil para compartir una rama en
revisión sin tocar la principal.

> **Sobre el selector rápido de rol:** sólo se monta en modo desarrollo, por lo que **no aparece en
> el despliegue de Vercel**. Para cambiar de rol en la demostración se usa el desplegable
> «Acceder como» de la pantalla de acceso, cerrando sesión antes desde la barra lateral.

> **Con backend:** para usar la API de Django hacen falta un rewrite de `/api` en `vercel.json` y
> las variables `VITE_DATA_SOURCE` y `VITE_API_AUTH`. Los pasos están en
> [`docs/integracion.md`](docs/integracion.md).

> **Sobre los datos:** al vivir en `localStorage`, cada visitante tiene su propia copia sembrada en
> su navegador. Los cambios de una persona no se ven en el dispositivo de otra. Es suficiente para
> la demostración y desaparecerá al conectar el backend real.

---

## Pruebas

```bash
npm test
```

Son 175 pruebas, que cubren:

- **Máquina de estados**: las 81 combinaciones de estados frente a la tabla de la especificación,
  la autorización por rol y las transiciones que exigen comentario.
- **Reglas de negocio**: justificación de 30 caracteres, motivo de devolución, aprobación sin
  revisión, inmutabilidad de los estados finales, activación de servicios, propiedad de la
  solicitud y permiso para editar las metas.
- **Repositorios locales**: sembrado, migraciones del esquema, filtros, autenticación simulada,
  adjuntos, documento de salida y metas.
- **Capa HTTP**: contra un `fetch` simulado, conversión de claves, paginación, errores, sesión con
  CSRF, JWT con renovación, subida de adjuntos, descarga de documentos y metas.
- **Cuadro de mando**: calendario laboral, cada indicador, evaluación frente a la meta, tendencia,
  serie mensual y el historial de demostración.
- **Interfaz**: el flujo crítico completo (crear → enviar → revisar → aprobar → completar), la
  botonera de acciones, la accesibilidad de los campos, el tema y el cuadro de mando, con React
  Testing Library.

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
