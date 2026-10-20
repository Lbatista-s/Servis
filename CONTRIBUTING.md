# Guía de colaboración

Convenciones del equipo de SERVIS. Son pocas a propósito: la idea es que nadie tenga que releer
este archivo dos veces.

## Ramas

- **`main`** — rama estable. Siempre debe compilar y pasar las pruebas. No se trabaja directamente
  sobre ella.
- **`feat/<nombre>`** — trabajo nuevo. Ejemplo: `feat/exportar-reportes`.
- **`fix/<nombre>`** — corrección de errores. Ejemplo: `fix/validacion-correo`.
- **`chore/<nombre>`** — tareas de mantenimiento: dependencias, configuración, documentación.

Una rama, un tema. Si al terminar el nombre de la rama ya no describe lo que hiciste, conviene
partirla en dos.

```bash
git checkout main
git pull origin main
git checkout -b feat/mi-funcionalidad
```

## Commits

Se usa [Conventional Commits](https://www.conventionalcommits.org/es/):

```
<tipo>: <descripción en imperativo y en español>
```

| Tipo       | Cuándo                                       |
| ---------- | -------------------------------------------- |
| `feat`     | Funcionalidad nueva                          |
| `fix`      | Corrección de un error                       |
| `test`     | Añadir o corregir pruebas                    |
| `refactor` | Cambio interno sin alterar el comportamiento |
| `style`    | Formato, sin efecto sobre la lógica          |
| `docs`     | Documentación                                |
| `chore`    | Configuración, dependencias, herramientas    |

Ejemplos:

```
feat: añadir exportación de reportes a XLSX
fix: corregir la validación del correo institucional
test: cubrir la transición de devolución a corregida
```

Commits atómicos: uno por cambio con sentido propio. Un commit gigante al final del día es difícil
de revisar y aún más difícil de revertir.

## Antes de abrir un pull request

Ejecuta las cinco comprobaciones que corre también la integración continua, en el mismo orden:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Si `format:check` falla, `npm run format` lo arregla.

Si alguna falla, arréglala antes de pedir revisión. GitHub Actions ejecuta lo mismo en cada push,
así que no hay forma de saltárselo.

## Pull requests

- Título con el mismo formato que los commits.
- En la descripción: qué cambia y por qué. Si toca la interfaz, adjunta una captura.
- Al menos una revisión de otro integrante antes de fusionar.
- Fusiona con _squash_ para que el historial de `main` quede legible.

## Dónde va cada cosa

El proyecto se organiza por funcionalidad, no por tipo de archivo. Antes de crear un archivo,
piensa a qué parte del sistema pertenece:

- **Regla de negocio o del ciclo de vida** → `src/domain/`. Código puro, sin React, con su prueba.
- **Indicador del cuadro de mando** → `src/domain/indicadores/` (definición y cálculo) y su
  explicación en `docs/cuadro-de-mando.md`.
- **Lectura o escritura de datos** → `src/data/repositories/`. Nunca desde un componente.
- **Ruta de la API o nombre de un campo del JSON** → sólo `src/data/repositories/http/rutas.ts` y
  `mapeadores.ts`; el contrato está en `docs/api.md`.
- **Pantalla o componente de una funcionalidad** → `src/features/<funcionalidad>/`.
- **Componente reutilizable en varias pantallas** → `src/components/ui/`.
- **Utilidad sin dependencias de React** → `src/lib/`.
- **Documentación funcional o técnica** → `docs/`, enlazada desde la sección «Documentación» del
  `README.md`.

## Reglas que la herramienta hace cumplir

Estas no son sugerencias: ESLint falla la compilación si se incumplen.

- **Nada de `any`** en código de producción.
- **Ningún componente accede a `localStorage`.** Sólo puede hacerlo
  `src/data/repositories/localStorage/`. Todo lo demás pasa por los repositorios o los hooks.

Y una que no detecta ninguna herramienta, pero rompe la interfaz en silencio:

- **Sobre componentes de Ant Design, las utilidades de visibilidad de Tailwind llevan `!`**
  (`lg:!hidden`, `!hidden sm:!inline-block`). Ant Design se configura con prioridad alta
  (`hashPriority="high"`) y su `display` gana a una utilidad normal: el elemento no se oculta.

## Estilo

- Interfaz y comentarios en **español formal**, coherentes con el resto del sistema.
- Comentarios sólo donde la lógica no sea evidente: explican el _por qué_, no repiten el _qué_.
- El formato lo decide Prettier (`npm run format`); no discutimos sobre comas.
- Los colores salen de `src/theme/tokens.ts`, la única fuente de la paleta clara y oscura; Tailwind
  y Ant Design los toman de ahí. Si necesitas un valor hexadecimal suelto en un componente,
  probablemente falte un token. Todo par de texto y fondo debe superar 4,5:1
  (`src/theme/tema.test.tsx` lo comprueba).
