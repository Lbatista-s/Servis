# SERVIS

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
| Pruebas       | Vitest + React Testing Library                   |
| Calidad       | ESLint + Prettier                                |

Los componentes de interfaz son de Ant Design, configurados con la paleta del manual de identidad
de INTEC: Rojo INTEC `#E4002B` como color de acción, Vino `#93070A` para lo seleccionado y los
estados de interacción, y Gris `#63666A` para el marco de la aplicación (barra lateral y superior).
Tipografía: Montserrat para títulos y Open Sans para el texto.

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

| Comando              | Descripción                                       |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo en `localhost:5173`        |
| `npm run build`      | Comprobación de tipos y compilación de producción |
| `npm run preview`    | Sirve la compilación de producción                |
| `npm run typecheck`  | Sólo comprobación de tipos                        |
| `npm run lint`       | ESLint (falla con cualquier advertencia)          |
| `npm run format`     | Formatea el código con Prettier                   |
| `npm test`           | Ejecuta la batería de pruebas                     |
| `npm run test:watch` | Pruebas en modo observación                       |

---

## Roles de prueba

La autenticación está **simulada**: no hay contraseñas reales. En la pantalla de acceso, el
desplegable **«Acceder como»** fija la cuenta activa y, con ella, el rol. En modo desarrollo hay
además una barra superior que permite saltar entre roles sin volver a iniciar sesión.

| Correo                    | Nombre           | Rol                       | Pantalla inicial  |
| ------------------------- | ---------------- | ------------------------- | ----------------- |
| `l.batista@intec.edu.do`  | Luis Batista     | Estudiante                | `/inicio`         |
| `a.leon@intec.edu.do`     | Adán León        | Estudiante                | `/inicio`         |
| `g.jimeno@intec.edu.do`   | Gerald Jimeno    | Estudiante                | `/inicio`         |
| `a.garcia@intec.edu.do`   | Ana García       | Estudiante                | `/inicio`         |
| `r.almanzar@intec.edu.do` | Ricardo Almanzar | Personal administrativo   | `/bandeja`        |
| `c.perez@intec.edu.do`    | Carmen Pérez     | Personal administrativo   | `/bandeja`        |
| `a.feliz@intec.edu.do`    | Axell Feliz      | Coordinador               | `/bandeja`        |
| `e.lopez@intec.edu.do`    | Edwin López      | Administrador del sistema | `/admin/usuarios` |

`m.torres@intec.edu.do` (Miguel Torres) existe pero está **desactivado**, para poder demostrar el
bloqueo de acceso de cuentas inactivas.

---

## Pantallas

| #   | Ruta                             | Pantalla                               | Rol                                   |
| --- | -------------------------------- | -------------------------------------- | ------------------------------------- |
| 1   | `/login`                         | Inicio de sesión                       | Público                               |
| 2   | `/recuperar`                     | Recuperar contraseña                   | Público                               |
| 3   | `/inicio`                        | Panel del estudiante                   | Estudiante                            |
| 4   | `/catalogo`                      | Catálogo de servicios                  | Estudiante                            |
| 5   | `/solicitudes/nueva/:servicioId` | Nueva solicitud (formulario por pasos) | Estudiante                            |
| 6   | `/solicitudes/:id`               | Detalle y seguimiento                  | Estudiante                            |
| 7   | `/bandeja`                       | Bandeja administrativa                 | Personal administrativo · Coordinador |
| 8   | `/bandeja/:id`                   | Detalle con acciones de revisión       | Personal administrativo · Coordinador |
| 9   | `/reportes`                      | Reportes y métricas                    | Personal administrativo · Coordinador |
| 10  | `/admin/usuarios`                | Gestión de usuarios                    | Administrador                         |
| 11  | `/admin/servicios`               | Gestión del catálogo                   | Administrador                         |

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
  app/                    Router, layout raíz, navegación y guardas de rol
  domain/                 Tipos, máquina de estados y reglas de negocio (puro, sin React)
  data/
    seed.ts               Datos de demostración del prototipo
    schema.ts             Versionado del esquema y migraciones
    repositories/
      types.ts            Interfaces IRequestRepository, IUserRepository, IServiceRepository
      localStorage/       Implementación actual
      http/               Stubs listos para la API real
    index.ts              Factoría según VITE_DATA_SOURCE
  features/
    auth/                 Acceso, recuperación y sesión
    catalog/              Catálogo de servicios
    requests/             Solicitudes del estudiante y acciones de dominio
    admin-inbox/          Bandeja administrativa y revisión
    reports/              Reportes y métricas
    user-management/      Gestión de usuarios
    service-management/   Gestión del catálogo
    settings/             Configuración y datos de demostración
  components/ui/          Envoltorios finos de Ant Design con la API en español
  theme/                  Tokens de la línea gráfica y tema de Ant Design
  hooks/                  Acceso a datos y utilidades de React
  lib/                    Formato y utilidades sin dependencias de React
  test/                   Configuración y fábricas de prueba
```

---

## Persistencia

> **La persistencia actual es `localStorage`.** No hay base de datos ni backend en esta fase.

Los datos viven en el navegador bajo la clave `servis:datos`. Esto es deliberado: el objetivo de
esta entrega es demostrar el sistema funcionando, no desplegar infraestructura.

Ahora bien, la persistencia está **desacoplada de la interfaz** para que añadir un backend no
obligue a tocar ni una pantalla:

- Todos los métodos de repositorio son **asíncronos** (`Promise<T>`), aunque hoy resuelvan de
  inmediato. Las firmas no cambiarán al pasar a HTTP.
- Ningún componente accede a `localStorage`: una regla de ESLint lo prohíbe fuera de
  `src/data/repositories/localStorage/`. La interfaz consume hooks (`useSolicitudes`,
  `useServicios`, `useUsuarios`) o el propio repositorio.
- El esquema está versionado (`SERVIS_SCHEMA_VERSION`) con una cadena de migraciones, de modo que
  un cambio de estructura no rompa los datos ya guardados.
- Al primer arranque el almacén se siembra con los datos del prototipo: solicitudes `SRV-1035` a
  `SRV-1042`, los usuarios del equipo y el catálogo de 11 servicios.

### Cómo migrar a un backend real

1. Completar los métodos de `src/data/repositories/http/`. Cada uno ya documenta la ruta sugerida
   de la API (`GET /solicitudes`, `POST /solicitudes/:id/transiciones`, …) y las clases implementan
   exactamente las mismas interfaces que las de `localStorage`.
2. Configurar `VITE_API_BASE_URL` en `.env`.
3. Cambiar `VITE_DATA_SOURCE=local` por `VITE_DATA_SOURCE=http`.

No hay ningún cuarto paso: la factoría de `src/data/index.ts` selecciona la implementación y los
componentes no se enteran del cambio.

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

> **Sobre los datos:** al vivir en `localStorage`, cada visitante tiene su propia copia sembrada en
> su navegador. Los cambios de una persona no se ven en el dispositivo de otra. Es suficiente para
> la demostración y desaparecerá al conectar el backend real.

---

## Pruebas

```bash
npm test
```

Cubren:

- **Máquina de estados** — las 81 combinaciones de estados frente a la tabla de la especificación,
  la autorización por rol y las transiciones que exigen comentario.
- **Reglas de negocio** — justificación de 30 caracteres, motivo de devolución, aprobación sin
  revisión, inmutabilidad de los estados finales, activación de servicios y propiedad de la
  solicitud.
- **Capa de repositorio** — sembrado, migración del esquema, filtros, persistencia entre instancias
  y propagación de los errores de dominio.
- **Integración** — el flujo crítico completo (crear → enviar → revisar → aprobar → completar), la
  devolución con corrección, el rechazo con justificación, y la botonera de acciones renderizada
  con React Testing Library.

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
   implementaron los cuatro que exige la especificación; el coordinador comparte la bandeja con el
   personal administrativo.
2. Tres solicitudes estaban asignadas a personas que la propia lista de usuarios define como
   personal administrativo o coordinador. Se reasignaron a estudiantes y se incorporó a Ana García
   para mantener la coherencia de roles.
3. El prototipo usaba la clave `revision` para el estado; el dominio usa `en_revision`, conforme a
   la especificación funcional.
