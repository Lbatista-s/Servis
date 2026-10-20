# Cuadro de mando integral de SERVIS

Este documento explica cómo se aplica el _Balanced Scorecard_ de Robert S. Kaplan y David P. Norton a SERVIS. Cubre:

- qué dice el marco;
- cómo se adaptó a un área académica;
- qué mide cada indicador;
- por qué no todos los roles tienen un cuadro de mando.

La implementación vive en:

- `src/domain/indicadores/`: definiciones, calendario laboral y cálculo, puros y probados.
- `src/features/cuadro-mando/`: la pantalla.

## 1. El marco de Kaplan y Norton

### Qué es

El cuadro de mando integral es un **sistema de gestión estratégica**. Traduce la misión y la estrategia de la organización en un conjunto coherente de **objetivos** y **medidas**, repartidos en cuatro perspectivas:

| Perspectiva               | Pregunta que responde                     |
| ------------------------- | ----------------------------------------- |
| Financiera                | ¿Cómo nos ven quienes nos financian?      |
| Cliente                   | ¿Cómo nos ven nuestros clientes?          |
| Procesos internos         | ¿En qué procesos debemos sobresalir?      |
| Aprendizaje y crecimiento | ¿Cómo seguimos mejorando y creando valor? |

### Qué debe tener

1. **Objetivos, indicadores, metas e iniciativas** en cada perspectiva. El objetivo dice qué se quiere lograr; el indicador, cómo se mide; la meta, qué nivel se espera; y la iniciativa, qué acción lo impulsa.
2. **Equilibrio entre indicadores de resultado e inductores.** Los de resultado son rezagados: dicen lo que ya pasó. Los inductores son adelantados: anticipan los resultados. Un cuadro solo con resultados llega tarde.
3. **Relaciones causa-efecto**, representadas en el **mapa estratégico** (_Strategy Maps_, 2004). El aprendizaje habilita los procesos, los procesos crean valor para el cliente, y el cliente cumple la misión.
4. **Pocos indicadores**, los vitales. Unos pocos por perspectiva, cada uno comparado con su meta.
5. **Revisión periódica.** Es un instrumento para gestionar la estrategia, no para vigilar la operación del día.

### Adaptación al sector público y educativo

Kaplan y Norton advierten que en las organizaciones públicas y sin fines de lucro el éxito no se mide en dinero. Por eso:

- la **misión se coloca arriba** del mapa;
- el **cliente o ciudadano** sube por encima de la perspectiva financiera, o queda a su nivel;
- lo financiero se reinterpreta como la **administración responsable de los recursos**.

### Cuadro de mando frente a tablero operativo

En _The Execution Premium_ (2008), Kaplan y Norton separan dos herramientas:

- **El cuadro de mando** gestiona la **estrategia**, con indicadores revisados por período.
- **El tablero operativo** vigila **el día a día**: la cola, los volúmenes.

Mezclarlos diluye ambos.

## 2. Cómo se aplica en SERVIS

### Qué tiene cada rol

| Rol                     | Qué recibe                                                                                                            | Por qué                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Coordinador             | **Cuadro de mando integral** como pantalla de inicio. Puede **editar las metas**.                                     | Dirige el Área: es quien gestiona la estrategia y, según el marco, quien fija las metas.                |
| Personal administrativo | La **bandeja** como inicio. Consulta el cuadro de mando, sin editarlo.                                                | Su trabajo es la cola del día (operativo). Conocer los indicadores alinea su trabajo con la estrategia. |
| Estudiante              | **Página de inicio simple**: lo que requiere su atención, lo que está en curso, sus documentos listos y su historial. | No gestiona estrategia: necesita saber qué hacer ahora. Un cuadro de mando no le aporta nada.           |
| Administrador           | **Página de inicio simple**: estado de las cuentas y del catálogo, y lo que requiere intervención.                    | Mantiene la plataforma; no dirige el Área.                                                              |

### Separación entre estrategia y operación

La pantalla del cuadro tiene dos pestañas:

- **Cuadro de mando integral:** misión, mapa estratégico y scorecard.
- **Análisis operativo:** los antiguos reportes, con volumen por servicio, distribución por estado y carga del personal.

### Misión

> Tramitar los servicios académicos y administrativos del Área de Ingenierías de forma ágil, trazable y sin papel.

### Perspectivas

En el orden del sector público:

1. **Estudiante** (cliente): ¿qué valor recibe el estudiante?
2. **Recursos** (la financiera, adaptada): ¿usamos bien los recursos del Área?
3. **Procesos internos**: ¿en qué procesos debemos sobresalir?
4. **Aprendizaje y crecimiento**: ¿qué capacidades sostienen la mejora? Recoge los capitales humano, de información y organizacional de _Strategy Maps_.

### Indicadores

Todos se calculan con los datos reales del sistema: solicitudes, su historial de estados, servicios y usuarios. Los tiempos se miden en **días hábiles** (sin sábados ni domingos, hora de Santo Domingo), igual que los plazos que promete el catálogo.

| Perspectiva | Objetivo                  | Indicador                       | Fórmula                                                                       | Tipo      | Meta inicial | Iniciativa                              |
| ----------- | ------------------------- | ------------------------------- | ----------------------------------------------------------------------------- | --------- | ------------ | --------------------------------------- |
| Estudiante  | Entregar a tiempo         | Cumplimiento del plazo          | Completadas dentro de los días estimados del servicio ÷ completadas × 100     | Resultado | ≥ 85 %       | Alertas de vencimiento en la bandeja    |
| Estudiante  | Respuesta ágil            | Tiempo medio de ciclo           | Promedio de días hábiles de _enviada_ a _completada_ o _rechazada_            | Resultado | ≤ 5 días     | Plantillas de documento por servicio    |
| Estudiante  | Resolver a la primera     | Resolución sin devoluciones     | Resueltas que nunca pasaron por _devuelta_ ÷ resueltas × 100                  | Resultado | ≥ 80 %       | Guía de requisitos en el formulario     |
| Recursos    | Productividad del equipo  | Resoluciones por persona        | Resueltas ÷ personal activo, cada 30 días                                     | Resultado | ≥ 6          | Asignación equilibrada de la cola       |
| Recursos    | Trámite sin papel         | Hojas de papel evitadas         | Σ (1 formulario + adjuntos + documento emitido), cada 30 días                 | Resultado | ≥ 45 hojas   | Documento de salida digital             |
| Procesos    | Atender sin demora        | Tiempo hasta la revisión        | Promedio de días hábiles de _enviada_ a _en revisión_                         | Inductor  | ≤ 1 día      | Aviso de nuevas solicitudes al personal |
| Procesos    | Cola al día               | Solicitudes vencidas            | Abiertas al cierre que superan su plazo ÷ abiertas × 100                      | Inductor  | ≤ 10 %       | Revisión diaria de vencidas             |
| Procesos    | Expedientes completos     | Envíos con requisitos completos | Enviadas con adjuntos ≥ requisitos obligatorios ÷ enviadas × 100              | Inductor  | ≥ 95 %       | Validación de requisitos al enviar      |
| Aprendizaje | Catálogo digitalizado     | Servicios disponibles en línea  | Servicios activos ÷ servicios del catálogo × 100 (situación actual)           | Inductor  | ≥ 100 %      | Completar fichas y requisitos           |
| Aprendizaje | Equipo involucrado        | Personal que participa          | Personal activo con intervenciones en el período ÷ personal activo × 100      | Inductor  | ≥ 80 %       | Capacitación del personal               |
| Aprendizaje | Adopción de la plataforma | Estudiantes que usan SERVIS     | Estudiantes activos con solicitudes en el período ÷ estudiantes activos × 100 | Inductor  | ≥ 60 %       | Difusión en el Área                     |

**Supuestos:**

- «Personal» son los roles personal administrativo y coordinador.
- El papel evitado es una **estimación**: una hoja por formulario, una por documento adjunto y una por documento emitido.
- «Solicitudes vencidas» es una foto al cierre del período. Con la cola vacía vale 0 %.

### Relaciones causa-efecto (mapa estratégico)

- Catálogo digitalizado → Expedientes completos → Resolver a la primera
- Catálogo digitalizado → Adopción → Trámite sin papel
- Equipo involucrado → Atender sin demora → Respuesta ágil y Productividad
- Equipo involucrado → Cola al día → Entregar a tiempo

En la pantalla, cada ficha del mapa indica qué objetivo impulsa. El detalle de cada indicador muestra también qué objetivos lo impulsan.

### Estado, tendencia y períodos

- **Estado frente a la meta:**
  - **Cumple:** alcanza la meta.
  - **En alerta:** incumple por menos del 10 %.
  - **No cumple:** peor que eso.
  - **Sin datos:** no hay población que medir.
  - Cada estado se muestra con color **y** etiqueta, nunca solo con color.
- **Tendencia:** compara con el período anterior de igual duración. Las variaciones de menos del 2 % cuentan como estables. Los indicadores de situación actual no tienen tendencia.
- **Períodos:** últimos 30 días, trimestre (90 días) y semestre (180 días).
- **Detalle de cada indicador:** definición, fórmula, tamaño de la muestra, relaciones, iniciativa y su evolución de los últimos 6 meses frente a la meta.

### Metas

- Las fija el coordinador desde «Editar metas». La regla está en `puedeEditarMetas()` del dominio, y el repositorio la vuelve a comprobar.
- En modo local se guardan con el resto de los datos. Con la API se leen y guardan en `GET` y `PUT indicadores/metas/` (ver `docs/api.md`).
- Los valores iniciales se calibraron con los datos de demostración para que el cuadro muestre una mezcla realista de estados.

### Datos de demostración

Para que las tendencias tengan sentido, se generan unas 90 solicitudes **cerradas** en los seis meses anteriores (`SRV-0901` en adelante), con `src/data/seedHistorial.ts`:

- se construyen recorriendo la máquina de estados real;
- el generador usa una semilla fija, así que siempre produce lo mismo;
- incluyen resoluciones a tiempo y tarde, devoluciones, rechazos y cancelaciones.

Las 8 solicitudes del prototipo no cambian. Como el historial está cerrado, la bandeja, que por defecto muestra las «Abiertas», sigue mostrando solo el trabajo pendiente.

## 3. Fuentes

- Kaplan, R. S. y Norton, D. P. (1992). «The Balanced Scorecard — Measures that Drive Performance». _Harvard Business Review_, 70(1).
- Kaplan, R. S. y Norton, D. P. (1996). _The Balanced Scorecard: Translating Strategy into Action_. Harvard Business School Press.
- Kaplan, R. S. y Norton, D. P. (1996). «Using the Balanced Scorecard as a Strategic Management System». _Harvard Business Review_, 74(1).
- Kaplan, R. S. y Norton, D. P. (2004). _Strategy Maps: Converting Intangible Assets into Tangible Outcomes_. Harvard Business School Press.
- Kaplan, R. S. y Norton, D. P. (2008). _The Execution Premium: Linking Strategy to Operations for Competitive Advantage_. Harvard Business Press.
- Kaplan, R. S. (2001). «Strategic Performance Measurement and Management in Nonprofit Organizations». _Nonprofit Management and Leadership_, 11(3).
