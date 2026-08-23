# Contrato de composición — Bloque Visual 2 (v2, prototipo funcional)

Escrito ANTES de programar nada, tal como exige el PASO 2 del prompt
"BLOQUE VISUAL 2 — PROTOTIPO FUNCIONAL PARA DOS ESCENARIOS". Verificado
contra `feat/noche-continuacion`, HEAD de partida
`8851e0f49baaf7cff8b74609cb996018f6aa094e`.

Alcance: sólo `1-marketplace-fuerte-tienda-floja` (s1) y
`4-roas-bueno-margen-negativo` (s4), sólo `diagnostico` /
`proyeccion_90d` / `propuesta`. v2 es un espacio nuevo y paralelo
(`src/documents/semantica-v2/`, `src/documents/templates/velocentum-v2/`,
`src/documents/renderers/pdf-v2/`, `src/documents/renderers/web-v2/`) que
consume el mismo `DocumentContextV1` que ya produce
`buildDocumentContext` (`src/documents/domain/build-context.ts`) para
estos dos escenarios. Cero cambios en dominio, `src/lib/`, fixtures, v1 o
tests existentes.

Cada regla de abajo cita el hallazgo (E-xx/C-xx/R-xx) que ataca y la
decisión que la autoriza (D1-D8, decisión 5 del resumen de
`docs/visual/contrato-estados.md` sección 6). Todo lo que exceda eso está
marcado **DECISIÓN PENDIENTE** explícitamente — no se resuelve acá.

## 0 · Decisiones de producto que este contrato NO toca

Repetido a propósito, porque son las que más se prestan a resolverse "sin
querer" al escribir código:

- **Decisión 1** (separar `retenido` de `evidencia_faltante`): v2 sigue
  usando los 3 estados que YA existen en `ValorPublicable` (`calculado`,
  `retenido`, `no_aplica`). No se agrega un cuarto estado.
- **Decisión 2** (inversión $0 → `no_aplica` vs `retenido` para E-05): E-05
  queda exactamente como refutado en Bloque Visual 1. v2 no cambia ningún
  criterio de clasificación — eso vive en el dominio, que v2 no toca.
- **Decisión 3** ("propuesta cualitativa sin promesas económicas" cuando el
  margen es negativo): v2 NO inventa copy cualitativo nuevo. El tratamiento
  de E-10/D5 (sección 5 abajo) es puramente visual (color/ícono/fondo
  distintos para el hallazgo `margen_negativo`), no contenido nuevo.
- **Decisión 4** (¿debe renderizarse el Eje 1, `Evidencia<T>`/
  `context.evidencia`?): v2 no renderiza `context.evidencia` en ningún
  bloque, igual que v1.
- **Decisión 6** (completar roadmap vs. eliminar la sección): v2 mantiene
  el bloque `roadmap` estructuralmente idéntico a v1 (sección presente,
  vacía porque `context.roadmap` siempre es `[]` desde el dominio). No se
  elimina la sección ni se inventan etapas.
- **Decisión 7** (¿s4 es el escenario oficial de "estados extremos" o hace
  falta uno adicional?): v2 usa s1 y s4 porque el prompt gobernante así lo
  exige, sin sentar postura sobre si eso resuelve la decisión 7 a futuro.

**Decisión 5** ("Unificar la capa de presentación entre PDF y web, o
aceptar que son dos productos separados") SÍ es el mandato explícito de
este bloque — la capa semántica compartida de la sección 1 es la
implementación de "unificar", no una decisión nueva.

## 1 · Capa semántica compartida (`src/documents/semantica-v2/`)

Regla dura, sin excepciones: **ningún renderer v2 escribe un string de
estado, una etiqueta o un número formateado a mano.** Todo pasa por este
módulo. Esto es lo que hace que "paridad PDF/web" sea estructuralmente
cierta en vez de una coincidencia a mantener a mano (ataca E-17 en su
causa raíz: "no existe ninguna capa compartida").

### 1.1 `estado.ts` — texto de estado con motivo real

Tipo de entrada: `ValorV2` (definido en `templates/velocentum-v2/types.ts`,
ver sección 3), que preserva el `ValorPublicable<number>` completo (no lo
colapsa a `PublishedNumber | null` como hace v1's `publishValue` — esa
colapsada es justamente la causa de E-04: una vez que el motivo real se
descarta, el renderer no tiene de dónde sacarlo).

Copy D4 literal (Eje 2, `docs/visual/auditoria-visual-2026-08-23.md`
sección D4 — no reformulado):

| Estado de `ValorV2` | Copy D4 exacto | Motivo real |
|---|---|---|
| `calculado` | (sin texto de estado — ver nota abajo) | — |
| `retenido` | "No se muestra hasta validar: [motivo]" | `motivos.join(" ")`, sustituido literalmente en el corchete |
| `no_aplica` | "Este cálculo no corresponde a este caso" | `motivo`, mostrado como línea secundaria — D4 no trae corchete para este estado, así que no se altera el string principal |

**Nota sobre `calculado` y "Calculado con los datos disponibles":** D4
define ese copy para el estado `disponible` del Eje 2. Mostrarlo como
texto visible junto a CADA número calculado del documento (docenas de
valores por documento) es ruidoso y no aporta nada que el usuario no vea
ya por la presencia del número mismo + la etiqueta de confianza que v1 ya
muestra ("Confianza alta/media/baja", que v2 conserva). Decisión de
composición (no de producto, dentro del mandato de este bloque): el copy
"Calculado con los datos disponibles" se expone como **tooltip/`title`**
en el renderer web (mismo patrón que v1 ya usa para supuestos en
`PublishedNumberView`) para trazabilidad completa bajo demanda, y no se
repite como texto siempre visible. El PDF no tiene tooltip; ahí el
indicador visible es la etiqueta de confianza, igual que hoy.

Nunca se produce el string "Sin datos" ni "Retenido" a secas en ningún
renderer v2 — arregla E-04 y la mitad de E-17 correspondiente a ese punto.

### 1.2 `formato.ts` — formato numérico único

Reemplaza la doble implementación (`renderers/pdf/format.ts` vs.
`renderers/web/format.ts`, hoy divergentes — E-14) por una sola función
usada por ambos renderers v2:

| Formato | Regla | Ejemplo |
|---|---|---|
| `money` | Sin decimales, separador de miles `.`, prefijo `$ ` | `$ 15.000.000` |
| `percent` | SIEMPRE 1 decimal fijo (nunca 0, nunca 2 — elimina la inconsistencia 1-vs-2-decimales entre PDF e impresión de hoy) | `-7,0%` |
| `ratio` | 1 decimal fijo + sufijo `×` (signo de multiplicación, no `x` latino — unifica el símbolo entre PDF y web) | `15,0×` |
| `number` | Sin decimales | `1.500` |

Marca de supuesto (†): se agrega SIEMPRE que `supuestos.length > 0`,
idéntica en PDF y web (hoy sólo el web la resuelve con nota — ver E-13,
sección 5).

### 1.3 `etiquetas.ts` — traducciones centralizadas

Un solo lugar para: `LABELS_CAPA`, `LABELS_PRIORIDAD` (nueva — v1 muestra
`prioridad` cruda en el PDF, ver E-15), `LABELS_MAGNITUD`,
`LABELS_CONFIANZA`, `LABELS_UNIDAD_COMERCIAL`, `LABELS_ESCENARIO`,
`LABELS_ORIGEN_SUPUESTO`. Copiados/consolidados desde las versiones hoy
duplicadas en `renderers/pdf/document.tsx` y
`renderers/web/document-renderer.tsx` (arregla E-15 y contribuye a E-17).

### 1.4 `balanceo.ts` — grillas sin huérfanos (R-02)

```
filasBalanceadas(n: number, colsNominal: number): number[]
```

Devuelve la cantidad de ítems por fila (ej. `[4, 3]` para `n=7`,
`colsNominal=3`). Algoritmo: probar primero `colsNominal`; si
`n % colsNominal === 1` y `n > colsNominal` (huérfano de un solo ítem en
la última fila), probar `colsNominal + 1`; si esa combinación no deja
huérfano (`n % (colsNominal+1) !== 1` o cubre todo en una fila), usarla;
si tampoco alcanza, probar `colsNominal - 1` con la misma condición;
default a `colsNominal` si ninguna alternativa mejora (nunca reduce por
debajo de `colsNominal - 1` ni sube por encima de `colsNominal + 1`, para
no romper el ancho de tarjeta del perfil). Con `n=7`, `colsNominal=3`:
`7%3=1` → huérfano → probar 4: `7%4=3`, sin huérfano → filas `[4,3]`.
Cubierto por tests unitarios directos (`balanceo.test.ts`) con varios `n`
(incluido 7, y casos ya balanceados como 9 con nominal 3 → `[3,3,3]` sin
cambios).

## 2 · Composición por perfil

### 2.1 Escala tipográfica completa (R-03, residual de C-01)

Valores concretos en pt, por rol y por perfil (hoy sólo existían
`baseFontSize`/`titleFontSize` globales — `PROFILES` en
`renderers/pdf/document.tsx:99-142`):

| Rol | Pantalla (960×540) | Impresión (A4) |
|---|---|---|
| Título de sección | 22 | 18 |
| Subtítulo / eyebrow | 10 | 9.5 |
| Label de campo | 9 | 9.5 |
| Valor (metric-grid, tabla) | 17 | 15 |
| Valor grande (cifra comercial, headline) | 30 | 24 |
| Badge / tag | 8 | 8 |
| Nota / supuesto | 8.5 | 9 |
| Pie de página | 8 | 8 |

Impresión sube label/nota (lectura de cerca en papel) y baja
título/valor/valor-grande respecto de pantalla (columna más angosta) —
igual criterio que v1 ya aplicaba a `baseFontSize`, ahora completo para
los 8 roles en vez de sólo 2.

Web v2 usa los tokens de **pantalla** (no hay perfil A4 en web — C-08
sigue fuera de alcance, ninguna previsualización A4 en pantalla).

### 2.2 Grilla y balanceo (R-01/R-02)

Toda grilla de tarjetas (metric-grid, findings, escenarios, servicios,
oferta comercial) calcula sus filas con `filasBalanceadas(items.length,
colsNominal)` en vez de depender de `flexWrap` puro. `colsNominal`:
metric-grid 3, findings 2 (tarjetas más anchas, con texto), escenarios ver
2.5 abajo, servicios/oferta comercial 2.

Umbral de ocupación ≥70% (R-01): se aplica al DISEÑO de agrupación —
ninguna sección de v2 queda con un solo bloque corto solo en una página
completa (evitado agrupando contenido relacionado en la misma sección en
vez de partirlo). Verificado por inspección visual de los rásters v2 en
el PASO 3, no por medición automática de píxeles (no hay forma confiable
de medir alto renderizado real desde un test unitario con
`@react-pdf/renderer`).

**Corrección de la auditoría interna, ronda 1:** la primera versión del
PASO 3 dejaba "Calidad de evidencia" (3 barras) y "Lo que importa"
(cifra destacada) como secciones propias, cada una muy por debajo del
umbral. Se corrigió agrupándolas: cobertura entra en la misma sección que
la foto actual (diagnóstico) o junto al resumen comercial (proyección),
y "Comparación entre canales" pasa a ir ANTES de la grilla de 9 métricas
en vez de después, para no quedar sola en una página de continuación.

**Residuo conocido, no forzado (precisado en la ronda 2 de auditoría):**
en el perfil pantalla (960×540, más bajo que A4), cuando el punto de
partida combina cobertura y/o comparación de canales con las 9 métricas
completas (caso multicanal con ambos MER calculables, como s1), el
contenido combinado supera la altura de una página y una o más filas de
la grilla de métricas se corren a una página de continuación con
ocupación baja (~20-25%): en `proyeccion-90d.ts` es 1 fila (3 tarjetas,
porque cobertura ya se fue con el resumen comercial en la página
anterior); en `diagnostico.ts` son 2 filas (6 tarjetas, porque cobertura
comparte la misma sección que las métricas). En el perfil impresión (A4,
más alto) el mismo contenido entra completo en una sola página sin
residuo en ambos casos. No se fuerza un rediseño de grilla adicional para
eliminar este caso específico del perfil pantalla — documentado como
pendiente técnico menor, no bloqueante (ningún texto se corta ni se
solapa, la página sólo queda con más aire del deseado).

### 2.3 Residual de C-01 (bleed, tabla sin repetir encabezado)

- Portada y transición siguen a sangre completa en ambos perfiles (marca,
  no error — sin cambios respecto de v1).
- Ningún bloque de CONTENIDO va a sangre en A4: todo respeta
  `pagePaddingH/Top/Bottom`, igual que ya hace v1 (ese residual de C-01 ya
  estaba bien; se mantiene).
- Tabla mensual de escenarios: repite la fila de encabezado si el
  contenido de un escenario se parte entre páginas, y nunca corta a mitad
  de fila. Implementación real (no sólo documentada): cada fila de mes es
  su propio `View wrap={false}`, y el header de la tabla se define como
  componente reutilizable que se vuelve a insertar al reabrir la tabla en
  una página nueva — ver sección 4.4.

### 2.4 D2/R-12 — tabla mensual con ancho mínimo (ataca E-01 de raíz)

Ancho mínimo de columna: **110pt en impresión, 95pt en pantalla**, con
salto de línea permitido en el header si el texto no entra en una sola
línea (`flexWrap: "wrap"` en el `Text` del header, nunca concatenado sin
espacio). Encabezados con las 3 magnitudes rotuladas exactamente igual
que D2 exige y que ya usa el HTML de v1: "Contribución incremental",
"Facturación proyectada", "Facturación incremental", "Ahorro
publicitario" — 4 columnas de dato + "Mes", 5 en total (mismo contenido
que v1, ancho mínimo nuevo).

### 2.5 Tarjetas de escenario a ancho completo cuando no entran (R-11, ataca E-01/E-02 de raíz)

**Causa raíz real de E-02, confirmada por lectura de código en PASO 1**
(no sólo por el warning de consola): `renderers/pdf/document.tsx:586`
pone `wrap={false}` en cada tarjeta de escenario dentro de un `cardGrid`
de 3 columnas. Cuando el contenido de la tarjeta (tabla mensual + hasta 6
palancas + restricciones) mide más que una página completa,
`@react-pdf/renderer` no puede partirla (por el `wrap={false}`) ni
ubicarla junto a las otras dos en la misma fila, así que cada tarjeta
termina en su propia página, y el perfil pantalla deja además una página
residual sólo con el encabezado repetido (mecanismo interno de paginación
de la librería ante un nodo no divisible más alto que el área
disponible).

Corrección v2: el bloque de escenarios calcula, para cada tarjeta, si su
contenido es "corto" (sin tabla mensual Y sin palancas — como pasa en s4,
donde `mensual` y `levers` vienen vacíos porque no hay datos de funnel) o
"largo" (con tabla mensual y/o palancas — como en s1). Las tarjetas
cortas usan la grilla de 3 columnas de siempre (`filasBalanceadas`,
mismo comportamiento que hoy para s4, que ya no tenía el problema). Las
tarjetas largas se renderizan **una por fila, a ancho completo**, cada una
con su propia tabla mensual (ancho de columna generoso, sección 2.4) y sin
`wrap={false}` en el contenedor externo (el contenido interno sí puede
partirse entre páginas si hace falta, con el encabezado de tabla
repetido, sección 2.3) — así ninguna tarjeta se ve forzada a cruzar un
salto de página completo de golpe.

### 2.6 Palancas con magnitud y período explícitos (E-03)

Las palancas de cada escenario se agrupan PRIMERO por magnitud
(`facturacion_incremental` / `contribucion_incremental` /
`ahorro_publicitario`, mismas 3 que ya distingue el dominio), con un
subtítulo de grupo usando `LABELS_MAGNITUD`. El monto de cada palanca
siempre lleva su período como calificador explícito: **"ritmo mensual al
día 90"** (la magnitud que hoy expone `LineaImpacto90d.palancas` es
`ritmoMensualDia90`, no un acumulado — dato ya correcto en el dominio, D3
aprobado; el defecto es sólo de presentación, confirmado en Bloque Visual
1). Grupos sin palancas no se muestran.

### 2.7 Severidad con color + ícono + texto (E-11, D4)

Para hallazgos, en AMBOS renderers: alta = ícono ▲ + rojo (`theme.colors.risk`)
+ texto "ALTA"; media = ícono ● + ámbar (`theme.colors.warning`) + texto
"MEDIA"; baja = ícono ▽ + gris (`theme.colors.muted`) + texto "BAJA". Hoy
sólo el web diferencia por color (`.vdoc-tag--alta` etc.); el PDF usa el
mismo badge visual sin importar prioridad (`document.tsx:535`). v2 iguala
ambos.

### 2.8 Agrupación de retenciones por motivo real (E-06)

En vez de una tarjeta por cada combinación magnitud×acumulado/ritmo×escenario
(hasta 19 tarjetas casi idénticas hoy), v2 agrupa las restricciones de
tipo "retenido" por el motivo LITERAL (`detalle`, que ya es
`motivos.join(" ")` desde el dominio — ver `blocks.ts:retainedRestriction`
de v1). Todas las líneas que comparten el mismo motivo textual se listan
juntas bajo una sola tarjeta con ese motivo como título y la lista de
"qué está retenido" (las etiquetas) como viñetas. Reduce N tarjetas a M
(M = motivos distintos realmente presentes).

### 2.9 Tratamiento visual del margen negativo (E-10, D5 primera exigencia)

El hallazgo con `id === "margen_negativo"` (si está presente en
`context.hallazgos` — lo agrega `mapearHallazgos` en `src/lib/propuesta.ts`,
ya con `prioridad: "alta"` forzada) se identifica por ese id exacto y
recibe una tarjeta con tratamiento distinto: fondo de acento
(`theme.colors.risk` al 10% de opacidad o equivalente), ícono de alerta
propio (▲ grande), sin el badge de prioridad genérico de la sección 2.7
(ya es evidente por el tratamiento). Sin copy nuevo — sólo estilo, tal
como exige la decisión 3 (sección 0) al no resolverse.

### 2.10 Supuestos con nota resuelta en la misma composición (E-13)

Cualquier valor con `assumptions.length > 0` (marca †) tiene, en la MISMA
página/composición donde aparece, la lista de "Supuestos" visible. v1 ya
lo hace en el web (`ScenariosBlock`, `item.assumptions`); el PDF nunca
renderiza `item.assumptions` (`pdf/document.tsx`, caso `"scenarios"` no
tiene ningún `<Text>` para supuestos, sólo palancas y restricciones). v2
lo agrega también al PDF.

### 2.11 Numeración/iconografía en listas (R-04)

Índices "01/02/03..." en findings (v1 web ya lo tiene,
`FindingsBlock`, `document-renderer.tsx:192-194`; v1 PDF no lo tiene,
`document.tsx:530-549` — E-17 lo señala). v2 lo agrega también en PDF, y
lo extiende a servicios y roadmap en ambos renderers.

### 2.12 Portada con gradiente (R-05)

En vez de dos bloques sólidos superpuestos (`coverAccent` +
`coverAccentSoft`, dos `View` con `backgroundColor` planos), v2 usa un
único degradé lineal `primary → primaryBright` en la franja de acento
(`@react-pdf/renderer` soporta `<LinearGradient>` dentro de `<Defs>`/`<Svg>`
o, más simple y compatible, dos paradas de color con `backgroundColor`
más una capa `opacity` intermedia calculada — v2 implementa con `Svg`/
`LinearGradient` de `@react-pdf/renderer`, disponible en la versión ya
instalada). Web usa `background: linear-gradient(...)` en CSS directamente.

### 2.13 Wordmark único (R-06)

Un solo tratamiento: isotipo + wordmark en caja mixta "Velocentum" (no
mayúscula sostenida "VELOCENTUM"), igual en portada y en pie de página,
en ambos renderers.

### 2.14 Máximo una transición por documento (R-08)

v2 revisa las plantillas: `diagnostico` v1 ya usa 1 sola `transitionSection`
(`diagnostic-transition`); `proyeccion-90d` v1 usa 1 (`projection-transition`);
`propuesta` v1 usa 1 (`proposal-transition`). Ninguna excede el máximo hoy
— v2 mantiene 1 por documento sin agregar transiciones nuevas.

### 2.15 Comparación entre canales (R-10)

Nuevo bloque `channel-comparison`, sólo cuando `merTienda` Y
`merMarketplace` son ambos `calculado` (los dos MER calculables
simultáneamente): muestra ambos lado a lado con una barra comparativa
horizontal (proporcional al mayor de los dos), en vez de dos tarjetas
sueltas dentro de metric-grid. Cuando sólo uno es calculable, no se
muestra el bloque (metric-grid ya cubre ese caso individualmente). En s1
(multicanal — D7: nunca llamarlo "mixto") ambos MER son calculables, así
que el bloque aparece; en s4 sólo hay MER tienda (`merMarketplace`
retenido según los datos demostrativos), así que no aparece — comportamiento
esperado, no un bug.

### 2.16 Puente diagnóstico↔propuesta (C-07)

Nuevo bloque `bridge-note`, sólo en `propuesta`, construido con datos ya
existentes en el contexto (montos de `context.hallazgos` con
`capa === "servicio"` y el `resumenComercial`, sin inventar ninguna
cifra): una frase que conecta explícitamente las fugas mensuales
identificadas con la cifra acumulada a 90 días, ej.: "Estas prioridades
mensuales, sostenidas 90 días bajo el escenario conservador, son la base
de la contribución incremental proyectada arriba." Si `resumenComercial`
es `null` o su cifra principal está retenida, el bloque no se muestra
(nunca una frase sin datos detrás).

### 2.17 Orden de hallazgos (E-12)

El constructor v2 de `findings` ordena por `prioridad` (alta > media >
baja) y, dentro de cada prioridad, por `monto` descendente (montos nulos
al final de su grupo de prioridad). Implementado en
`templates/velocentum-v2/blocks.ts`, no en el dominio.

### 2.18 E-08 acotado: `findings` con variante

Única excepción de alcance permitida por el prompt gobernante: el
constructor v2 de `findings` recibe `variante: "diagnostico" | "propuesta"`.
En `"diagnostico"` muestra todos los hallazgos (mismo comportamiento que
v1). En `"propuesta"` muestra sólo los hallazgos con
`capa === "servicio"` (ya vinculados a un paquete vía `servicioId`), con
el título de sección "Prioridades que resolvemos en este paquete" en vez
de "Prioridades que orientan la propuesta". No toca `context.hallazgos`
ni ningún archivo de dominio — el filtro vive enteramente en
`templates/velocentum-v2/blocks.ts`.

## 3 · Tipos v2 (resumen — ver `templates/velocentum-v2/types.ts` para el detalle)

`ValorV2<T>` preserva el `ValorPublicable<T>` completo (estado + motivo
real), en vez de colapsar a `PublishedNumber | null` como v1 — necesario
para que `estado.ts` pueda mostrar el motivo real (sección 1.1). Los
bloques v2 (`DocumentBlockV2`) son estructuralmente similares a los de v1
pero con los campos adicionales que exige este contrato: `periodo`
explícito en palancas, `motivoAgrupado` en restricciones agrupadas,
`esCorta`/tarjeta ancha en escenarios, etc. `DocumentModelV2`/
`DocumentSectionV2` son análogos a los de v1 (mismo patrón de
`sections[].blocks[]`).

## 4 · Verificación

PASO 3 genera los 12 PDFs v2 (2 escenarios × 3 documentos × 2 perfiles) y
los 6 renders web v2 (2 escenarios × 3 documentos), rasteriza los PDFs e
inspecciona ambas salidas antes de dar nada por bueno. Cualquier
violación de este contrato encontrada en esa inspección se corrige en el
código y se vuelve a generar/inspeccionar. Lo que quede pendiente por
límite de tiempo o criterio razonable se documenta con motivo concreto en
el handoff final — nunca se fuerza un veredicto positivo falso.
## 5 · Correcciones de la ronda 2.1 (2026-08-23)

La auditoría visual humana del prototipo entregado en el Bloque Visual 2 dio
**APROBADO CON CORRECCIONES** (7 aprobados, 8 aprobados con reserva, 5 no
aprobados de los 20 criterios). Esta sección documenta, para cada
corrección C1-C10 exigida por esa auditoría, el umbral o la regla que
pasa a formar parte del contrato — no reemplaza las secciones 1-4
anteriores, las extiende donde corresponde.

### 5.1 Umbral de ocupación por perfil (sustituye el "≥70%" único de la sección 2.2)

**≥70% del alto útil en pantalla, ≥65% en A4** (antes un solo umbral de
70% sin distinguir perfil). Donde una sección no llegue sin inventar
contenido, se documenta el caso puntual con motivo (ver 5.7) y se deja
así — nunca se rellena con contenido inventado.

### 5.2 C1 — Tabla mensual apilada en impresión (ataca E-01/R-12 residual)

La tabla horizontal de 5 columnas (Mes + 4 magnitudes) no entra en el
ancho de tarjeta de A4 incluso con el mínimo de columna de la sección
2.4 (110pt × 5 = 550pt > ~475pt de ancho de tarjeta disponible). En
impresión (`PROFILES_V2.impresion.monthlyStacked = true`) la tabla se
apila en formato etiqueta/valor por mes: un bloque por mes, con las 4
magnitudes como filas "etiqueta — valor", sin bajar la tipografía del
mínimo del contrato ni eliminar ninguna magnitud (D2 se mantiene: las 4
etiquetas siguen literalmente iguales). Pantalla no cambia (sigue con la
tabla horizontal de 5 columnas, que sí entra en su ancho de tarjeta).

### 5.3 C2 — Una tarjeta de escenario por fila en impresión (ataca E-01/E-06 residual)

`PROFILES_V2.impresion.colsScenarios` pasa de 2 a **1**. Causa real
encontrada: con `colsNominal=2` y `n=3` (las tres tarjetas de escenario),
`filasBalanceadas` producía huérfano con el nominal (`[2,1]`) y
"resolvía" saltando a `colsNominal+1=3` (`[3]`, una sola fila con las
tres) — sin ningún límite de ancho de tarjeta en ese salto, lo que
colisiona directamente en A4. Con `colsScenarios=1`, `filasBalanceadas`
devuelve `[1,1,1]` (una tarjeta por fila) sin tocar `balanceo.ts` (R-02,
ya verificado, no se reabre). Pantalla no cambia (`colsScenarios=3`
sigue sin colisión, confirmado en Bloque Visual 2 y de nuevo en esta
ronda).

### 5.4 C3 — Ningún elemento de tono oscuro va a sangre completa en A4 (ataca C-01 residual (a))

Antes: portada, transición y toda sección de tono "dark" (resumen
comercial, cierres) llenaban el 98-99% de la página A4 en tinta oscura.
Ahora, sólo en el perfil impresión:

- **Portada**: fondo claro; el degradado (R-05) queda contenido en un
  bloque de 200×160pt anclado arriba a la derecha (`coverAccentBounded`)
  en vez de cubrir el 45% de la altura de página.
- **Transición**: fondo claro; el mensaje va dentro de una tarjeta
  redondeada de ancho `transitionTitleWidth + 48` (no a ancho completo)
  en vez de llenar la página entera.
- **Contenido de tono oscuro** (resumen comercial, cierres): se aplana a
  fondo claro (`pageSoft`) con una franja de acento de 8pt de alto en la
  parte superior de la página (`impresionAccentBand`), y todo el
  contenido interno se renderiza como si fuera claro (texto oscuro sobre
  tarjetas claras).

Área de cada acento contenido, verificada contra la superficie de A4
(595,28 × 841,89pt = 501.158,7pt², redondeado): portada ~6,4%
(200×160pt), transición ~20,5% (ancho real de la banda, `transitionTitleWidth
+ 48`), contenido ~0,95% (franja de 8pt de alto) — los tres muy por
debajo del 25% exigido (test P3, corregido tras auditoría interna ronda
1: la cifra de portada decía "~5,0%" por error de redacción, el cálculo
real con `IMPRESION_ACCENT_GEOMETRY` da 6,4%). Pantalla no cambia:
conserva el tratamiento a sangre completa ya aprobado.

**Nota de implementación real**: un primer intento marcó la franja de
contenido (`impresionAccentBand`) con la prop `fixed` de
`@react-pdf/renderer`; combinado con tarjetas `wrap={false}` en el
mismo flujo, causó que el primer bloque de contenido de la página se
renderizara vacío (mismo patrón de bug ya reportado al cierre del
Bloque Visual 2 para `fixed` dentro de contenido con wrap). Se revirtió
a una `View` absoluta sin `fixed` — la franja sólo se repite en la
primera página de una sección que se parte entre páginas, trade-off
aceptado y documentado acá.

### 5.5 C4 — Contraste calculado, nunca color fijo sin verificar (ataca C4(a) y C4(b))

Regla dura nueva: **ningún color de texto es fijo independientemente del
fondo real sobre el que se renderiza.** Todo color de texto que puede
aparecer sobre más de un fondo (tarjeta clara vs. tarjeta oscura, página
clara vs. página oscura) tiene una variante explícita por modo,
verificada por cálculo de contraste WCAG (test P4), no a ojo:

- **estado retenido/no_aplica** (antes: todo el párrafo en
  `theme.colors.warning`, 1,67:1 sobre superficie clara — el defecto
  C4(b) exacto): el texto pasa a un color de cuerpo compliant por modo
  (`theme.colors.text` claro / `#DEDCEA` oscuro); el ámbar queda
  exclusivamente como acento de borde izquierdo (`estadoBox`), nunca
  como color de párrafo.
- **badge ALTA** (antes: `theme.colors.risk` sobre `#FBEAEA`, 3,66:1):
  pasa a `#992D2D` sobre el mismo fondo, 6,52:1.
- **índice de hallazgo/servicio** (antes: `theme.colors.accent` fijo
  sobre tarjeta clara, 3,91:1): pasa a `theme.colors.primary` en modo
  claro (7,25:1) / `#C8C2FF` en modo oscuro (10,16:1 sobre la tarjeta
  oscura real, no sobre el fondo de página).
- **kicker y statement del resumen comercial** (antes: color fijo
  pensado sólo para la tarjeta oscura de siempre — `theme.colors.muted`
  sobre `#1C173E` daba 2,31:1, el defecto C4(a) exacto, "gris apagado
  sobre fondo navy"): ambos pasan a variantes por modo, verificadas
  contra el fondo real de la tarjeta en cada caso.

Los valores exactos usados están centralizados en
`V2_CONTRAST_TOKENS` (`renderers/pdf-v2/document.tsx`) para que el test
P4 verifique los mismos literales que usan los estilos reales, sin
duplicar números que puedan divergir.

### 5.6 C5 — Identidad del escenario repetida ante una posible continuación (ataca C-01 residual (b))

Causa real: `@react-pdf/renderer` no tiene un mecanismo nativo para
"repetir el nombre del escenario sólo en la página donde continúa" —
la reserva de repetición de encabezados de Bloque Visual 2 se cumplía
para el header de sección pero no para la identidad de la tarjeta. Como
no hay forma de saber en tiempo de composición dónde va a caer el corte
de página, la solución adoptada es la única que garantiza corrección
por construcción: el nombre del escenario (`scenarioKicker`) se antepone
a CADA subsección que podría empezar una página nueva si la tarjeta se
parte (tabla mensual, bloque de palancas, bloque de supuestos) — no sólo
al header inicial. Esto es una pequeña redundancia visual cuando no hay
corte real (el nombre aparece 3-4 veces en una tarjeta que cabe entera
en una página), pero garantiza que cualquier página que empiece a mitad
de tarjeta muestre la identidad del escenario, sin excepción. Toda tabla
mensual partida también repite su encabezado de columnas por fila
(`MonthlyTableHeader`, sin cambios de esta ronda) o, en el modo apilado
de impresión (5.2), cada mes ya lleva su propio rótulo — no hay
encabezado compartido que perder.

### 5.7 C6 — MER tienda/marketplace no se repiten cuando hay comparación entre canales (ataca R-10 defecto introducido)

`dedupeMetricGridV2(metrics, channelComparison)` (`blocks.ts`): cuando
`channel-comparison` está presente, filtra `merTienda`/`merMarketplace`
de los ítems de `metric-grid` antes de construir el bloque — se aplica
en `diagnostico.ts` y `proyeccion-90d.ts` (las dos plantillas que usan
ambos bloques), a nivel de plantilla, sin tocar el dominio. El
componente de comparación en sí no se modifica.

### 5.8 C7 — Excepciones documentadas de ocupación

Ver sección 2.2 para el residuo ya documentado en Bloque Visual 2 (fila
de continuación de `metric-grid` en pantalla, ahora medido contra el
umbral dual de 5.1). Lista cerrada de páginas de baja ocupación
verificadas en esta ronda, con motivo puntual — ninguna se rellena con
contenido inventado:

- **`diagnostico`/`proyeccion-90d`, sección "línea de base", perfil
  pantalla, caso multicanal (s1)**: la fila de continuación de
  `metric-grid` (3-6 tarjetas según el documento) queda con ~15-25% de
  ocupación — residuo ya documentado en Bloque Visual 2, sección 2.2,
  ahora con la cantidad de tarjetas actualizada tras C6 (dedup de MER:
  7 métricas en vez de 9, balanceadas 4+3 por `filasBalanceadas`).
- **`propuesta`, sección "Alcance" (`services`)**: cuando los servicios
  no tienen `alcance` cargado (título de una línea, sin bullets), la
  página queda con baja ocupación incluso después de C8 (que ya evita
  el espacio reservado vacío) — no hay más contenido disponible en el
  contexto sin inventarlo.
- **`propuesta`, sección "Propuesta comercial" sin selección confirmada
  (D1, `commercial-offer.pendiente === true`)**: el aviso "Selección
  comercial pendiente" es una sola oración por diseño — expandirlo
  requeriría inventar contenido, que D1 prohíbe explícitamente.

### 5.9 C8 — Ninguna tarjeta reserva espacio vacío

`cardRow` (PDF) y `.vdoc2-card-grid`/`.vdoc2-findings`/
`.vdoc2-scenario-grid`/`.vdoc2-metric-grid` (web) pasan de `alignItems:
stretch` (default de Yoga/CSS Grid en el eje cruzado de una fila) a
`alignItems: flex-start` / `align-items: start`. Causa real: sin esto,
todas las tarjetas de una fila se estiraban a la altura de la más alta,
dejando espacio en blanco reservado en las tarjetas con menos contenido
(el caso reportado: tarjetas de servicio sin `alcance`). Con el cambio,
cada tarjeta se compacta a su altura real.

### 5.10 C9 — Wordmark único (texto, nunca el logotipo SVG en minúscula)

La portada usaba el componente `WordmarkVelocentum` de `renderers/pdf/marca.tsx`
(v1, compartido, con letras en minúscula bakeadas en el path SVG) mientras
el pie de página usaba texto plano "Velocentum" en caja mixta — dos
tratamientos del mismo wordmark. Sin tocar `marca.tsx` (v1, fuera de
alcance), v2 deja de usar `WordmarkVelocentum` en la portada y usa el
mismo texto plano "Velocentum" (caja mixta, mismo `fontFamily`/peso que
el pie) en portada y pie, en ambos perfiles. El símbolo (`SimboloVelocentum`,
el isotipo, no el wordmark) se sigue reutilizando sin cambios — no es
texto, no está sujeto a "un solo tratamiento". Web ya usaba texto plano
en ambos lugares, sin cambios.

### 5.11 C10 — Portada con los cuatro campos

El bloque `cover` gana dos campos nuevos: `documentKind` (tipo de
documento, vía `LABELS_TIPO_DOCUMENTO`) y `version` (tomada del
identificador de plantilla ya existente: `templateId.split("/").pop()`,
ej. `"velocentum-diagnostico/v2"` → `"v2"` — nunca un valor inventado).
Los cuatro campos (cliente, tipo de documento, fecha, versión) se
muestran en columna (antes: cliente y fecha en fila con
`justify-content: space-between`) — con 4 campos en vez de 2, una fila
con un nombre de cliente largo rompía el espaciado; en columna cada
campo tiene su ancho disponible completo, verificado con el test de
estrés P10 (nombre de 106 caracteres).

