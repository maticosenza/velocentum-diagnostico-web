# Wireframes — diagnóstico, proyección, propuesta (pantalla y A4)

Wireframes en ASCII, página/sección por sección, basados en el orden real
de secciones de cada plantilla (`src/documents/templates/velocentum-v1/{diagnostico,proyeccion-90d,propuesta}.ts`,
verificado contra el código de esta rama). No son mockups de diseño — son
la estructura de contenido, para que el Bloque Visual 2 tenga un punto de
partida acordado. Todo lo que exceda las decisiones D1–D8 se marca
**DECISIÓN PENDIENTE**.

Convención: cajas anchas (`┌──────────────┐` de ancho completo) representan
el perfil `pantalla` (16:9, apaisado); cajas angostas de dos columnas
representan el perfil `impresion` (A4, vertical) — ver
`docs/visual/perfiles-pantalla-a4.md` para las diferencias reales de
tokens entre ambos.

---

## 1 · Diagnóstico (`diagnostico.ts`)

Secciones reales, en orden: `cover` → `coverage` → `current-state`
(metric-grid + shipping) → `transition` → `findings` → `risks` →
`immediate-priorities` → `missing-data` → `methodology` → `next-step`.

### Perfil pantalla (16:9)

```
┌─────────────────────────────── PÁGINA 1 — PORTADA ────────────────────────────────┐
│ [símbolo Velocentum]                                                              │
│                                                                                    │
│   {nombre del cliente}                                                            │
│   DIAGNÓSTICO E-COMMERCE                                                          │
│   Una lectura ejecutiva basada en la evidencia disponible.                        │
│                                                          [wordmark Velocentum]     │
│                                              {cliente}          {fecha}           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────── PÁGINA 2 — COBERTURA ──────────────────────────────┐
│ CALIDAD DE EVIDENCIA                                                              │
│ Qué tan completa es la lectura                              [Confianza: ALTA]     │
│                                                                                    │
│  Cobertura general    ▓▓▓▓▓▓▓▓▓▓ 100%                                             │
│  Cobertura de canales ▓▓▓▓▓▓▓▓▓▓ 100%                                             │
│  Cobertura de productos ▓▓▓▓▓░░░░ 60%                                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────── PÁGINA 3 — FOTO ACTUAL (3 columnas) ────────────────────────┐
│ PUNTO DE PARTIDA                                                                  │
│ Foto actual: economía, canales y publicidad                                       │
│                                                                                    │
│  ┌─Facturación──┐ ┌─Ticket────────┐ ┌─Pedidos───────┐                            │
│  │ $ 24.681.357 │ │ $ 12.000      │ │ 2.057         │                            │
│  │ Confianza med.│ │ Confianza alta│ │ Confianza med.│                            │
│  └───────────────┘ └───────────────┘ └───────────────┘                            │
│  ┌─Margen total──┐ ┌─Inversión─────┐ ┌─MER tienda────┐   (hasta 9 tarjetas fijas, │
│  │ 37,2%         │ │ $ 500.000     │ │ 12,4x         │    METRIC_DEFINITIONS —    │
│  └───────────────┘ └───────────────┘ └───────────────┘    ver R-02: 7 u 8 ítems   │
│  ┌─Envío neto────┐                                          desbalancean la grilla │
│  │ $ 3.500       │                                          de a 3)               │
│  └───────────────┘                                                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── PÁGINA 4 — TRANSICIÓN (fondo violeta) ─────────────────┐
│ VELOCENTUM / SIGUIENTE                                                            │
│ De los datos a las prioridades                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────── PÁGINA 5 — HALLAZGOS (título no siempre coincide, R-09) ────────────┐
│ DIAGNÓSTICO                                                                       │
│ Funnel, retención y hallazgos priorizados                                         │
│                                                                                    │
│  01  [PRIORIDAD ALTA] [SERVICIO]                                                  │
│      Pocas visitas llegan a agregar al carrito                                    │
│      Impacto estimado: $ 1.769.692                            [Confianza media]   │
│  02  [PRIORIDAD MEDIA] [CONTEXTO]                                                  │
│      Comisiones de la plataforma y del marketplace                                │
│                                                                 [Confianza media]   │
│  (orden = orden de inserción de mapearHallazgos, NO por severidad — ver E-12)     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────── PÁGINA 6 — RIESGOS / PRIORIDADES / FALTANTES ───────────────────┐
│ (tres secciones separadas, cada una omitida si no tiene ítems:                    │
│  "Riesgos y contradicciones", "Prioridades inmediatas" ⊆ hallazgos alta,          │
│  "Datos faltantes" — mismas restricciones repartidas por bloquea.length)          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── PÁGINA 7 — METODOLOGÍA / PRÓXIMO PASO ─────────────────┐
│ Metodología y supuestos (si hay `context.metodologia`, hoy siempre vacío)          │
│ ─────────────────────────────────────────────────────────────────────────────    │
│ PRÓXIMO PASO (fondo violeta)                                                      │
│ Validar los hallazgos priorizados y definir con qué se arranca.                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Perfil impresión (A4) — mismo contenido, grilla de 2 columnas, tipografía de papel

```
┌──────────────────┐
│  PORTADA (A4)     │   Misma estructura, franjas de acento reescaladas
│  vertical          │   (`coverTitleWidth: 300` en vez de 500), tarjeta
└──────────────────┘   de wordmark más chica.

┌──────────────────┐
│ FOTO ACTUAL       │   2 columnas en vez de 3 (cardWidthGrid 48.8% vs
│ ┌────┐ ┌────┐     │   31.8%) — 9 métricas fijas en 2 columnas = 5 filas
│ │Fact│ │Tick│     │   en vez de 3, página más alta, más scroll/páginas
│ └────┘ └────┘     │   en papel que en pantalla.
│ ┌────┐ ┌────┐     │
│ │Ped.│ │Marg│     │
│ └────┘ └────┘     │
│  ...               │
└──────────────────┘
```

**No existe hoy** ningún diagnóstico en perfil impresión en la evidencia
auditada (los 4 diagnósticos auditados son todos `pantalla` — ver
`docs/visual/auditoria-visual-2026-08-23.md`, sección a). El wireframe de
A4 arriba se deriva del código (`PROFILES.impresion`), no de un PDF real
inspeccionado.

---

## 2 · Proyección a 90 días (`proyeccion-90d.ts`)

Secciones reales, en orden: `cover` → `commercial-summary` → `coverage` →
`projection-baseline` → `restrictions` → `transition` → `scenarios` →
`methodology` → `roadmap` → `scaling-conditions` → `next-step`.

```
┌─────────────────────────────── PÁGINA 1 — PORTADA ────────────────────────────────┐
│ Plan de crecimiento a 90 días                                                     │
│ Escenarios condicionados por evidencia, capacidad y rentabilidad.                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────── PÁGINA 2 — CIFRA DOMINANTE (fondo navy) ──────────────────────┐
│ LO QUE IMPORTA                                                                    │
│ CONTRIBUCIÓN INCREMENTAL A 90 DÍAS · ESCENARIO CONSERVADOR                        │
│                                                                                    │
│         $ 4.200.000                                                              │
│                                                                                    │
│ Con los datos disponibles y bajo estos supuestos, existe un rango de              │
│ contribución incremental potencial de $ 4.200.000 a $ 6.100.000 durante los       │
│ próximos 90 días.                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────── PÁGINA 3 — COBERTURA / LÍNEA DE BASE ───────────────────────────┐
│ (coverage + metric-grid + shipping, misma estructura que el diagnóstico)          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────── PÁGINA 4 — RESTRICCIONES ──────────────────────────────────┐
│ (restrictionSection genérica, no separada en riesgos/faltantes como el diagnóstico)│
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── PÁGINA 5 — TRANSICIÓN ─────────────────────────────────┐
│ Tres meses, una secuencia medible                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────── PÁGINAS 6-8 — ESCENARIOS (3 cards, una por escenario) ──────────┐
│ ESCENARIOS                                                                        │
│ Qué puede ocurrir en 90 días, mes a mes                                           │
│                                                                                    │
│  ┌─ CONSERVADOR ─────────────────────────── [Confianza alta] ──┐                 │
│  │ Contribución incremental acumulada 90d:      $ 4.200.000     │  ← D2: acumulado│
│  │ Facturación incremental acumulada 90d:       $ 5.800.000     │  ← D2: acumulado│
│  │ Ahorro publicitario acumulado 90d:           Retenido        │  ← D2: acumulado│
│  │                                                                │
│  │ Detalle mensual (D2: tres magnitudes, tres columnas propias): │
│  │  Mes │ Contribución │ Fact. proyectada │ Fact. incremental │ Ahorro │          │
│  │   1  │  $ 900.000   │   $ 5.100.000    │    $ 400.000      │ Reten. │          │
│  │   2  │  $ 1.500.000 │   $ 5.600.000    │    $ 900.000      │ Reten. │          │
│  │   3  │  $ 1.800.000 │   $ 5.900.000    │    $ 1.200.000    │ Reten. │          │
│  │                                                                │
│  │ Palancas — ESTADO ACTUAL, sin etiqueta de magnitud (E-03/V1): │
│  │  Fuga por navegación: $ 300.000   ← esto es ritmo mes 90, no  │
│  │  Fuga por carrito: $ 250.000        acumulado — mismo formato │
│  │  Fuga por sobrefragmentación: $ 80.000  que las cifras de     │
│  │                                          arriba, sin decir cuál│
│  │                                          magnitud es cada una  │
│  │ Supuestos: rampa conservadora 25/50/75% ...                   │
│  └────────────────────────────────────────────────────────────────┘
│  (BASE y POTENCIAL: misma estructura, sólo si `escenarioPuedeMostrarse`)          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────── PÁGINAS 9-11 — METODOLOGÍA / ROADMAP / ESCALAMIENTO / PASO ──────┐
│ (roadmap siempre vacío hoy — `context.roadmap` nunca se puebla desde el motor)     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Nota agregada al cierre (E-01/E-02):** el wireframe de arriba muestra el
contenido pretendido de una tarjeta de escenario con su tabla mensual y
palancas — en la evidencia auditada, ese contenido se solapaba (E-01) y en
algún caso dejaba una página con encabezado sin cuerpo (E-02). Antes de
tocar el renderer para corregir esto en el Bloque Visual 2, hay que
regenerar el PDF y confirmar que el defecto sigue existiendo con el código
actual — ver la condición de entrada obligatoria en
`docs/visual/auditoria-visual-2026-08-23.md`, sección d.

### Estado explícito: proyección íntegramente retenida

Cuando NINGUNA de las tres magnitudes de NINGÚN escenario es calculable
(ej. facturación sin declarar, o `contradiccionSinConfirmarBloqueaProyeccion`
activa):

```
┌────────────────── PÁGINA 2 — CIFRA DOMINANTE (fondo navy) ────────────────────────┐
│ RANGO DE CONTRIBUCIÓN INCREMENTAL A 90 DÍAS                                       │
│                                                                                    │
│         [Sin datos]  –  [Sin datos]      ← E-04, ver contrato-estados.md          │
│                                                                                    │
│         (sin redacción: `statement` es null cuando `ambosCalculados` es false)    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────── PÁGINAS 6-8 — ESCENARIOS ───────────────────────────────────────┐
│  ┌─ CONSERVADOR ─────────────────────────── [Confianza alta] ──┐  ← E-07: badge   │
│  │ Contribución incremental acumulada 90d:      Retenido        │    de confianza │
│  │ Facturación incremental acumulada 90d:       Retenido        │    NO refleja   │
│  │ Ahorro publicitario acumulado 90d:           Retenido        │    que las tres │
│  │                                                                │    líneas están │
│  │ (`mensual: []` cuando TODO retenido → `mensualDocumento`      │    retenidas    │
│  │  devuelve array vacío, la tabla mensual entera desaparece)     │                 │
│  │                                                                │
│  │ El presupuesto liberado por consolidación de pauta puede      │  ← nota fija,   │
│  │ reinvertirse...                                                │    sin condición│
│  └────────────────────────────────────────────────────────────────┘  (ver E-07)   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Si TODAS las magnitudes de TODOS los escenarios visibles quedan retenidas,
`buildScenarios` igual produce un bloque no vacío (cada escenario visible
sigue generando una card, aunque sin cifras) — el bloque de escenarios NO
desaparece del documento sólo por estar todo retenido; lo que desaparece
es la tabla mensual de CADA escenario individualmente
(`mensual: mes.length > 0 ? [...] : []`, condicionado a que al menos una
línea de ese escenario sea calculable).

---

## 3 · Propuesta (`propuesta.ts`)

Secciones reales, en orden: `cover` → `commercial-summary` →
`proposal-context` (findings) → `transition` → `services` →
`commercial-offer` → `restrictions` (genérica) → `roadmap` → `next-step`.

```
┌─────────────────────────────── PÁGINA 1 — PORTADA ────────────────────────────────┐
│ Propuesta de trabajo                                                              │
│ Una intervención alineada con las prioridades validadas.                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────── PÁGINA 2 — CONTRIBUCIÓN INCREMENTAL (idéntica a proyección) ──────┐
│ (mismo bloque `commercial-summary`, misma cifra que la proyección — ver C-07:     │
│  ninguna página explica la relación entre esta cifra a 90 días y los montos       │
│  mensuales del diagnóstico)                                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────── PÁGINA 3 — "POR QUÉ AHORA" (idéntico al diagnóstico, E-08) ─────────┐
│ Prioridades que orientan la propuesta                                             │
│  01 [PRIORIDAD ALTA] [SERVICIO] Pocas visitas llegan a agregar al carrito         │
│     Impacto estimado: $ 1.769.692                                                 │
│  (MISMOS 7 hallazgos, mismo orden, mismos montos que la página 5 del              │
│   diagnóstico — buildFindings(context) llamado con el mismo context en ambas      │
│   plantillas, ver inventario-componentes.md)                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── PÁGINA 4 — TRANSICIÓN ─────────────────────────────────┐
│ (label fijo por plantilla — no auditado explícitamente en el apéndice)            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────── PÁGINA 5 — SERVICIOS ("Qué vamos a trabajar") ───────────────┐
│  ┌─ Meta Ads ──────────┐  ┌─ Desarrollo y ──────┐  ┌─ Desarrollo y optimi- ┐      │
│  │ (alcance a validar) │  │ optimización web    │  │ zación web y Meta Ads │      │
│  │                      │  │ (alcance a validar) │  │ (alcance a validar)   │      │
│  └──────────────────────┘  └──────────────────────┘  └────────────────────────┘   │
│  ← E-09/V2: tres tarjetas para dos servicios reales del catálogo cerrado,         │
│    porque `servicio` es texto libre y "Desarrollo y optimización web y Meta       │
│    Ads" nunca se separa contra el catálogo de seis                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────── PÁGINA 6 — PAQUETE SELECCIONADO (comercial-offer) ──────────────┐
│  ┌─ IMPULSO ────────────────┐  ┌─ TRACCIÓN ──────────────┐  ┌─ ESCALA ─────────┐  │
│  │ Precio a definir          │  │ Precio a definir         │  │ Precio a definir  │  │
│  │ - Meta Ads — 1 campaña    │  │ (acumulativo sobre       │  │ (acumulativo)      │  │
│  │   activa                  │  │  IMPULSO)                │  │                    │  │
│  └────────────────────────────┘  └───────────────────────────┘  └───────────────────┘ │
│  (escalera de hasta 3 niveles, decisión comercial 7 — nunca un paquete único)      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────── PÁGINA 7 — RESTRICCIONES / ROADMAP / PRÓXIMO PASO ───────────────┐
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Estado explícito: propuesta SIN selección comercial (D1)

**Comportamiento real hoy, verificado en código — no cumple D1:**

```
┌──────────── PÁGINA 6 — "PAQUETE SELECCIONADO" ────────────────────────────────────┐
│                                                                                    │
│           (la sección NO EXISTE: `createModel` filtra toda sección con            │
│            `blocks.length === 0`, y `buildCommercialOffer` devuelve               │
│            `{ block: null }` cuando `context.comercial` es null — la página        │
│            completa desaparece, sin ningún mensaje)                                │
│                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

`src/documents/templates/velocentum-v1/shared.ts:190-204` (`contentSection`)
filtra bloques `null`; `src/documents/templates/velocentum-v1/shared.ts:4-30`
(`createModel`) filtra secciones con `blocks.length === 0`. El resultado es
que la sección "Propuesta comercial / Paquete seleccionado" **no aparece
en absoluto** — ni vacía, ni con un aviso. No hay ningún string "Selección
comercial pendiente" en ningún archivo de este repositorio (verificado por
búsqueda). Y el botón "Descargar PDF"
(`src/routes/_authenticated/documentos.$id.$slug.tsx:128-164`) no tiene
ninguna condición sobre `model.kind`/`context.comercial` — genera y
descarga el PDF de propuesta igual, sin selección confirmada (C-04, V4,
V5).

**Wireframe propuesto para cumplir D1 (DECISIÓN PENDIENTE — no aprobado,
sólo ilustrativo de lo que D1 pide):**

```
┌──────────── PÁGINA 6 — "PAQUETE SELECCIONADO" (estado pendiente) ─────────────────┐
│  ⚠ SELECCIÓN COMERCIAL PENDIENTE                                                  │
│  Todavía no hay un paquete confirmado para este cliente. Esta vista previa        │
│  interna puede compartirse para revisión, pero el PDF de propuesta para           │
│  cliente queda bloqueado hasta confirmar una selección.                           │
│                                                                                    │
│  [Botón "Descargar PDF" deshabilitado/oculto en esta pantalla]                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Copy exacto, tratamiento visual del aviso (¿banner, restricción, bloque
propio?), y el mecanismo real de deshabilitar la descarga (deshabilitar el
botón vs. deshabilitarlo sólo para `kind === "propuesta"` vs. un chequeo en
`downloadDocumentModelPdf`) — **todo DECISIÓN PENDIENTE**, a resolver y
aprobar en el Bloque Visual 2. Este wireframe es un punto de partida, no
una propuesta cerrada.

---

## 4 · Estado explícito: diagnóstico con margen negativo (D5)

```
┌────────────────────── PÁGINA 3 — FOTO ACTUAL ─────────────────────────────────────┐
│  ┌─Margen total──┐                                                               │
│  │ −7,0%         │   ← el dato crudo está a la vista (correcto, D5 exige "no      │
│  │ Confianza alta │      ocultar el problema"), pero es visualmente IDÉNTICO a    │
│  └───────────────┘      cualquier otra tarjeta — no hay alerta distinta acá       │
│                          (misma tarjeta `metric-grid`, mismo componente).         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────── PÁGINA 5 — HALLAZGOS ────────────────────────────────────────────┐
│  01  [PRIORIDAD ALTA] [RECOMENDACIÓN]                                             │
│      Margen de contribución negativo                                              │
│      Cada venta genera pérdida antes de contar la publicidad: ninguna             │
│      optimización de pauta lo resuelve. Hay que revisar costo de producto,        │
│      envío, comisiones o precio.                                                  │
│      (SIEMPRE el hallazgo #01 — implementado, ver commit e5080e2. Capa            │
│       "recomendación": ninguno de los seis servicios del catálogo resuelve        │
│       un problema de estructura de costos, por diseño.)                           │
│  02  [PRIORIDAD MEDIA] [CONTEXTO] Comisiones de la plataforma...                  │
│      (hallazgos que NO dependen del margen siguen apareciendo con normalidad,     │
│       D5 tercera exigencia — confirmado)                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

El escenario real de la evidencia (s4-roas-bueno-margen-negativo) no tiene
datos de funnel cargados, así que sus únicos dos hallazgos son
`margen_negativo` y `comisiones` — no hay en la evidencia auditada un caso
que combine margen negativo CON fugas de funnel simultáneamente para
verificar visualmente la retención en cascada de proyecciones (ver
`docs/visual/matriz-hallazgos.md`, nota sobre E-10). **Decisión pendiente 7
(`docs/visual/contrato-estados.md` sección 6):** si `s4` se mantiene como
el único escenario de "estados extremos" o si hace falta uno adicional que
combine ambas condiciones para poder verificar esto.

**E-10, ajustado a "parcialmente resuelto" al cierre de este bloque**
(`docs/visual/auditoria-visual-2026-08-23.md` sección d): el wireframe de
arriba ya refleja esto — el hallazgo `margen_negativo` está primero y con
prioridad alta (correcto), pero la tarjeta es visualmente idéntica a
cualquier otra de prioridad alta (pendiente, Bloque Visual 2).

---

## 5 · Estado explícito: diagnóstico sano, con sección de "fortalezas" (R-07)

**No existe ningún bloque, sección ni componente "fortalezas" en el código
hoy** — verificado, cero coincidencias de "fortaleza"/"strengths" en
`src/documents`. R-07 es una recomendación (no una decisión aprobada): el
siguiente wireframe es puramente ilustrativo de la brecha que R-07 señala,
no una propuesta de diseño cerrada.

```
┌────────────────── PÁGINA 5 — HALLAZGOS (escenario "todo sano") ───────────────────┐
│  01 [PRIORIDAD ALTA] Pocas visitas llegan a agregar al carrito  $ 3.562.500       │
│  02 [PRIORIDAD ALTA] Carritos que no llegan al checkout          $ 3.420.000       │
│  03 [PRIORIDAD ALTA] Checkouts iniciados que no terminan...      $ 2.850.000       │
│                                                                                    │
│     (39% de la facturación mensual marcado "ALTA" en un negocio con margen        │
│      57% y MER 25x — sin una sola línea que diga "esto ya funciona bien":         │
│      no existe ningún bloque que lo permita hoy)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──── (HIPOTÉTICO, NO IMPLEMENTADO) — "Qué ya funciona" ────────────────────────────┐
│  Margen de contribución: 57,0% — muy por encima del punto de equilibrio.          │
│  MER actual: 25,0x — el negocio recupera la inversión publicitaria con holgura.   │
│  (contenido, estructura, capa/tono visual: DECISIÓN PENDIENTE — Bloque Visual 2)  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Nota: desde el bloque de corrección de incoherencias (commit `e5080e2`, ya
en HEAD), la prioridad de estas tres fugas para un negocio con economía en
verde y fugas individualmente por debajo del 15% de la facturación ya BAJA
de "alta" a "media" — el ejemplo de "39% en alta" de R-07 corresponde al
estado ANTERIOR a esa corrección. Verificado: con los datos reales de
`5-todo-sano`, las tres fugas hoy quedan en "media", no "alta" (ver
`src/documents/correccion-incoherencias-escenarios.test.ts`, describe "2").
La sección de fortalezas explícita sigue sin existir de todos modos — R-07
no se resuelve solamente con el cambio de prioridad, que es un tema
distinto (ver `docs/loop-nocturno-2026-08-22-escenarios.md`, incoherencia
2).
