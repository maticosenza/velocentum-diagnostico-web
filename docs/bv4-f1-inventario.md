# BV4 · F1 Foundation — Inventario (etapa 1)

Relevamiento sin cambios de código, sobre la rama local `feat/bv4-rebranding`
(base `831ef34`), ejecutado el 2026-08-31. Cierra los `[NV]` de la auditoría
aprobada `rebranding-primera-entrega-v2.md` y alimenta las etapas 2 a 6.

Todo lo que sigue está verificado leyendo el repositorio. Donde el dato
contradice a la auditoría aprobada, se dice explícitamente y se deja la
corrección con su origen.

---

## 0 · Corrección de la auditoría aprobada, §1

La sección 1 de `rebranding-primera-entrega-v2.md` lista, marcados `[V]`
("verificado directamente por el auditor"), los colores del tema documental
`velocentum-light/v1`. **Cinco de los once hexes son incorrectos y faltan tres
tokens.** Los valores reales, leídos de
`src/documents/theme/velocentum-light-v1.ts`, son los de la tabla de §1.1 de
este inventario. Corrección aprobada por Matías el 2026-08-31: los valores
verificados acá son los correctos.

| Token | Auditoría §1 dice | Valor real en el repo |
|---|---|---|
| primary | `#2A1EC9` | **`#3B2EF5`** |
| accent | `#7B5CFF` | **`#7A6BFF`** |
| ink | `#0F0A2E` | **`#0D0B2D`** |
| muted | `#6B6880` | **`#55546B`** |
| border | `#E8E7F2` | **`#D9D3FF`** |
| primaryBright | *(ausente)* | **`#4B39FF`** |
| text | *(ausente)* | **`#171437`** |
| borderSoft | *(ausente)* | **`#E9E5FF`** |
| background / surface / surfaceSoft / success / warning / risk | correctos | `#FAF9FF` · `#FFFFFF` · `#F2EFFF` · `#20A464` · `#FBBF24` · `#D64A4A` |

También son incorrectos los pares de contraste web que la auditoría cita como
"patrón a replicar": dice `#168653` / `#a86600` / `#b43232`; los reales, en
`src/documents/renderers/web/document-renderer.css:99-101`, son
**`--vdoc-success-ink: #157a4c`**, **`--vdoc-warning-ink: #92400e`**,
**`--vdoc-risk-ink: #b23636`**.

**Origen del error, identificado:** el auditor tomó los valores de
`src/styles.css` —la hoja de la interfaz de la herramienta, no del tema
documental— donde dos comentarios nombran hexes: `src/styles.css:76`
`/* Azul Velocentum #2A1EC9 */` junto a `--primary`, y `src/styles.css:163`
`--violet: oklch(0.58 0.19 288); /* #7B5CFF */`. Son exactamente los dos hexes
mal atribuidos.

Agravante verificado: **esos dos comentarios tampoco describen bien su propio
valor.** Convertidos a OKLCH, `#2A1EC9` es `oklch(0.410 0.241 271.3)` mientras
`styles.css` declara `oklch(0.371 0.239 285)` —14° de matiz de diferencia—, y
`#7B5CFF` es `oklch(0.598 0.230 285.9)` frente a `oklch(0.58 0.19 288)`
declarado. Los comentarios hexadecimales de `src/styles.css` no son
autoritativos para ningún color, ni de la UI ni del tema documental. La única
fuente de verdad de la paleta documental es
`src/documents/theme/velocentum-light-v1.ts`.

Confirmación cruzada independiente: `src/assets/marca/simbolo-violeta.svg`
usa `fill="#3B2EF5"`, el primary real.

---

## 1 · Interior de `renderers/pdf-v2/`

Archivos: `document.tsx` (79 828 bytes), `paginacion.ts`, `exportacion.ts`,
`export-client.ts`, `gate-exportacion.ts`, `pdfjs-worker.d.ts`, más tres
archivos de test.

### 1.1 Consumo del tema centralizado

`document.tsx:20` importa `VELOCENTUM_LIGHT_V1` desde `../../theme` y lo fija
en un `const theme` de módulo (línea 47). Uso real, contado sobre el archivo:

| Token del tema | Usos en `document.tsx` |
|---|---|
| `surface` | 25 |
| `primary` | 23 |
| `muted` | 16 |
| `ink` | 11 |
| `border` | 8 |
| `text` | 6 |
| `surfaceSoft` | 4 |
| `accent` | 4 |
| `risk` | 3 |
| `background` | 3 |
| `warning` | 2 |
| `primaryBright` | 2 |
| `success`, `borderSoft` | **0** |

Dos de los catorce tokens (`success`, `borderSoft`) no se usan nunca en
pdf-v2. `success` en particular no tiene ninguna superficie en el PDF: el
estado "saludable" no se pinta.

### 1.2 Escala tipográfica real, por perfil

Definida en `PROFILES_V2` (`document.tsx:121-166`). No hay ninguna otra
escala: todos los `fontSize` de la hoja de estilos derivan de estos ocho
valores o de un literal puntual.

| Rol | `pantalla` | `impresion` |
|---|---|---|
| `titulo` | 22 | 18 |
| `subtitulo` | 10 | 9,5 |
| `label` | 9 | 9,5 |
| `valor` | 17 | 15 |
| `valorGrande` | 30 | 24 |
| `badge` | 8 | 8 |
| `nota` | 8,5 | 9 |
| `pie` | 8 | 8 |

Fuera de la escala, con tamaño literal: `coverTitleFontSize` (46 / 30),
`transitionTitleFontSize` (38 / 26) y `coverSubtitle` (15 fijo, línea 263).

Observación que sostiene E-26: el rango útil del cuerpo del documento va de 8
a 17 pt en `pantalla` y de 8 a 15 pt en `impresion` — nueve y siete puntos de
recorrido para ocho roles distintos. `valorGrande` (30 / 24), el único valor
con peso real de titular, se usa en **tres** estilos y ninguno es el bloque
`metric-grid`: `commercialSummaryNumber` (469), `commercialSummaryRange`
(470, `valorGrande - 6`) y `scenarioMetricValuePrimary` (452,
`valorGrande - 12`).

### 1.3 Hexes fuera del tema

Diecisiete literales. Nueve están centralizados en `V2_CONTRAST_TOKENS`
(`document.tsx:55-65`), introducidos en la ronda 2.1 para resolver C4 y
verificados por el test P4; los otros ocho están sueltos en la hoja de
estilos.

| Hex | Dónde | Para qué |
|---|---|---|
| `#1C173E` | `V2_CONTRAST_TOKENS.darkCardBackground`, usado en `cardDark` (357) | fondo de tarjeta oscura |
| `#FBEAEA` | `altaBadgeBackground` (57), `badgeAlta` (361) | fondo de badge "alta" |
| `#992D2D` | `altaBadgeText` (58) | texto de badge "alta"; el comentario de 399-401 registra que `theme.colors.risk` sobre `#FBEAEA` no llegaba a contraste |
| `#C8C2FF` | `onDarkCard` (59), `eyebrowDark` (211) | texto sobre oscuro |
| `#D5D1E0` | `onDarkCardBody` (60), `itemBodyDark` (428) | cuerpo sobre oscuro |
| `#DEDCEA` | `onDarkCardBodyAlt` (61), `coverSubtitle` (263) | cuerpo alterno sobre oscuro |
| `#39345A` | `cardDark.borderColor` (357) | borde de tarjeta oscura |
| `#C8C4D5` | `cardLabelDark` (364) | label sobre oscuro |
| `#CBC7D8` | línea 278 | texto sobre oscuro |
| `#D8D4FF` | línea 301 | texto sobre oscuro |
| `#CEC9FF` | `amountDark` (430) | cifra sobre oscuro |
| `#B8B4C8` | `footerDark` (240) | pie sobre oscuro |
| `#8A6417` + `#FEF3D6` | `badgeMedia` (405) | badge "media"; par de contraste calculado, `theme.colors.warning` no alcanzaba |
| `#FFFFFF` | uno suelto | idéntico a `theme.colors.surface` |

Patrón: **doce de los diecisiete literales existen para resolver el modo
oscuro**, que el tema no tiene. `DocumentTheme` declara catorce tokens todos
pensados para superficie clara; cada vez que pdf-v2 pinta sobre `ink` tiene
que inventar el par de contraste a mano. Es el hueco de tokens más grande del
motor y lo que la etapa 2 debe cubrir con `surfaceDark` / `borderDark` y los
pares funcionales sobre oscuro.

Los comentarios de las líneas 399-407 dejan asentado que estos valores no se
eligieron a ojo sino calculando contraste (ronda 2.1, corrección C4).

### 1.4 Estructura de página, `pantalla` vs `impresion`

Cinco `<Page>` en el archivo: portada clara (1568) y oscura (1620),
transición clara (1668) y oscura (1680), y contenido (1742).

| | `pantalla` | `impresion` |
|---|---|---|
| Tamaño | `[960, 540]` (16:9 apaisado) | `"A4"` (595,28 × 841,89 pt, retrato) |
| Padding H / top / bottom | 54 / 84 / 48 | 48 / 78 / 46 |
| Portada | oscura, gradiente a sangre completa (`coverGradientLayer`, 1622), símbolo a 46 px | clara, acento **contenido** de 200 × 160 pt anclado a la derecha (`coverAccentBounded`, 1570), símbolo a 40 px |
| Transición | fondo violeta a sangre + cinco líneas diagonales al 16% de opacidad (1687) | banda clara de 220 pt de alto (`transitionBandLight`) |
| Contenido | bandas de acento de 8 pt | ídem |
| `colsMetricGrid` | **3** | **2** |
| `colsFindings` | **2** | **1** |
| `colsScenarios` | **3** | **1** |
| `colsServices` | **2** | **1** |
| `monthlyStacked` | `false` (tabla, `monthlyColMinWidth` 95) | `true` (apilada, 110) |

La regla de impresión ya está implementada y documentada en el propio archivo:
`IMPRESION_ACCENT_GEOMETRY` (170-177) fija áreas de acento conocidas en
tiempo de compilación para que el test P3 verifique que nunca superan el 25%
de la superficie de página. El colapso a una columna en `impresion` está
justificado en comentario (ronda 2.1, C2): tres tarjetas de escenario no
entran en una fila de A4 sin colisionar.

Esto es lo que acota E-28: **el apaisado no es de columna única.** Sí lo son,
en los dos perfiles y por construcción, cinco bloques que no pasan por la
grilla: `roadmap` (1423), `restrictions` (1496) y `restrictions-grouped`
(1507), armados como `View` apilados; y `commercial-offer` (1461) y
`methodology` (1518), hijos directos de `cardGrid`, que es
`{ flexDirection: "column", gap: 10 }` (310).

### 1.5 Iconografía y assets embebidos

**No hay ningún raster embebido**: cero `<Image>`, cero `data:image`, cero
base64 en `document.tsx`. Todo lo gráfico es vectorial, dibujado con las
primitivas de `@react-pdf/renderer` (`Circle`, `Defs`, `Line`,
`LinearGradient`, `Rect`, `Stop`, `Svg`, importadas en 3-18; `Path` y `G`
llegan indirectamente por `SimboloVelocentum`).

Inventario gráfico real:

- **`IconCircle`** (700-735): cinco íconos en `<Svg width={12} height={12}
  viewBox="0 0 12 12">` — `conservador`, `base`, `potencial`, `tienda`,
  `marketplace`. Consumidos en 956, 1195 y 1203.
- **`PrioridadBadge`** (753-760): glifos tipográficos `▲` / `●` / `▽`
  (`ICONOS_PRIORIDAD`, `src/documents/semantica-v2/etiquetas.ts:21`).
- **`PersonalityGlyph`** (695) y **`HeadingRule`** (678).
- **`SimboloVelocentum`** importado de `../pdf/marca` (22), usado tres veces:
  pie a 12 px (1541), portada clara a 40 px (1597), portada oscura a 46 px
  (1632).
- Tres capas `<Svg>` de gradiente y textura: 1570 (acento A4), 1622
  (gradiente de portada), 1687 (diagonales de transición).

Esto contradice E-27 tal como se levantó: **iconografía hay**. Lo que la
evidencia del artefacto muestra es iconografía de 12 pt sobre una página de
960 × 540 — subdimensionada, no ausente.

### 1.6 Otros archivos del motor

- `paginacion.ts` — render en dos pasadas, autorizado expresamente por la
  auditoría externa de la ronda 2.2.3 con siete límites no negociables
  (L1-L7). La pasada 1 mide parseando con `pdfjs` la salida real; la pasada 2
  es la que se entrega. No se toca en BV4.
- `gate-exportacion.ts` — `verificarExportacionPermitidaV2(model)`: bloquea la
  exportación de una propuesta si falta el bloque `commercial-offer` o si
  viene `pendiente: true`. Es el "candado" de E-23.

---

## 2 · Renderer web v2

**Ruta:** `src/documents/renderers/web-v2/` — `document-renderer.tsx` (28 523
bytes), `document-renderer.css` (13 551 bytes), dos tests.

**Perfiles:** `export type PerfilWebV2 = "pantalla" | "impresion"` (línea 32).
El componente es
`DocumentWebRendererV2({ model, className, profile = "pantalla" })` (782), y
aplica el perfil como clase `vdoc2--${profile}` y atributo `data-profile`,
más dos variables calculadas: `--vdoc2-card-shadow`
(`colorProfundidadTarjeta(profile)`) y `--vdoc2-texture-line`.

**Tokens que consume:** dieciséis custom properties propias, declaradas en
`:root` (líneas 11-27) — catorce de color, que **duplican como literales los
catorce de `VELOCENTUM_LIGHT_V1`** (`--v2-primary: #3b2ef5`,
`--v2-accent: #7a6bff`, `--v2-ink: #0d0b2d`, `--v2-muted: #55546b`,
`--v2-border: #d9d3ff`, etc.), más `--v2-heading-font` y `--v2-body-font`.

Tres huecos verificados, todos relevantes para la etapa 2:

1. **No replica el par de contraste web.** El renderer v1 sí lo tiene
   (`--vdoc-success-ink: #157a4c`, `--vdoc-warning-ink: #92400e`,
   `--vdoc-risk-ink: #b23636`); web-v2 no tiene ningún `*-ink` funcional.
   Ese es el patrón que la etapa 2 debe replicar en el tema nuevo.
2. **No tiene ninguna declaración `@font-face`.** El v1 tiene nueve, que
   autoalojan Satoshi (woff2) e Inter (ttf). web-v2 usa pila del sistema:
   `--v2-body-font: "Inter", system-ui, -apple-system, sans-serif`. En la
   práctica, si el navegador no tiene Inter instalada, cae a `system-ui` — el
   documento web v2 **no se ve con la tipografía de marca**, a diferencia del
   PDF v2.
3. **Duplica el tema como literales**, con el comentario "CSS no puede
   importar el objeto TS del tema". Cualquier cambio de tema exige tocar dos
   archivos que nada garantiza que sigan sincronizados.

**Comentario de cabecera desactualizado, a corregir en F2/F3:** las líneas
1-9 del CSS afirman que este renderer es un prototipo "no para integrarse a
ninguna pantalla real (fuera de alcance de este bloque)". Es falso desde el
Bloque Visual 3: `src/routes/_authenticated/documentos.$id.$slug.tsx:25`
lo importa y la línea 218 lo renderiza como
`<DocumentWebRendererV2 model={resuelto.model} />`. Es la pantalla real de
documento de la herramienta.

**Detalle a resolver en F3, registrado acá:** esa única invocación **no pasa
la prop `profile`**, así que la pantalla de documento siempre renderiza en
`pantalla`. No hay ninguna vía en la UI para ver el documento en `impresion`,
aunque el renderer lo soporta.

---

## 3 · `src/styles.css` y rutas de la herramienta

### 3.1 Adjudicación real de cada hoja de estilos

Hay exactamente tres CSS en el repositorio, y cada uno tiene un consumidor
único y verificable:

| Hoja | Importada por | Alcance real |
|---|---|---|
| `src/styles.css` (201 líneas) | `src/routes/__root.tsx:12` (`import appCss from "../styles.css?url"`) | **toda la interfaz de la herramienta**, y sólo eso |
| `src/documents/renderers/web/document-renderer.css` (15 595 b) | `renderers/web/document-renderer.tsx:10` | documento web **v1** — cadena de rollback, no se toca |
| `src/documents/renderers/web-v2/document-renderer.css` (13 551 b) | `renderers/web-v2/document-renderer.tsx:29` | documento web **v2** — pantalla real de documento |

Ninguna hoja importa a otra. El tema documental (`velocentum-light/v1`) **no
alcanza a `src/styles.css`**: la UI y los documentos son dos sistemas de color
separados, sin ningún punto de contacto. La reserva que la auditoría dejaba
abierta ("adjudicación exacta a la herramienta se confirma en Foundation")
queda cerrada acá.

### 3.2 Tokens que existen en `src/styles.css`

Tailwind v4 con `@theme inline`. Todos los colores en `oklch`, por regla
declarada en el comentario de cabecera ("All colors MUST use oklch format").

- **Bloque shadcn/ui estándar** (`:root`, 69-94 + `.dark`, 100-140):
  `background`, `foreground`, `card(-foreground)`, `popover(-foreground)`,
  `primary(-foreground)`, `secondary(-foreground)`, `muted(-foreground)`,
  `accent(-foreground)`, `destructive(-foreground)`, `border`, `input`,
  `ring`, `radius` y cinco `chart-*`, más el juego `sidebar-*`.
- **Tokens de estado propios del producto:** `--estado-verde`,
  `--estado-amarillo`, `--estado-rojo`, `--estado-sin-datos`, con valor claro
  y oscuro. Son el equivalente de UI de `success`/`warning`/`risk` del tema
  documental, con otros nombres y otros valores.
- **Tokens propios de Velocentum** (162-166): `--violet`,
  `--violet-foreground`, `--violet-soft`, `--surface`, registrados en un
  segundo `@theme inline` como `--color-violet`, `--color-violet-soft`,
  `--color-violet-foreground`, `--color-surface`.
- **Un solo token tipográfico:** `--font-sans: "Inter Tight", "Helvetica
  Neue", Arial, sans-serif`, aplicado a `html` en `@layer base`.
- Reglas de base: sólo dos pesos en la UI (400 y 500 — `b`, `strong` y
  `h1..h6` forzados a `font-weight: 500`), `font-size: 14px` en `body`,
  `font-variant-numeric: tabular-nums` en `table` y `[data-tabular]`.

**No existe ningún rol monoespaciado.** Es el hueco que la etapa 3 (Geist
Mono) viene a llenar: hoy no hay token, ni familia, ni uso.

**Hallazgo tipográfico, verificado:** `"Inter Tight"` no se carga en ninguna
parte del proyecto — no hay `@font-face` para ella en `styles.css`, no está
en `src/assets/fuentes/`, y no hay ningún `<link>` a Google Fonts (el
proyecto no usa CDN de fuentes). La interfaz cae siempre al primer fallback
disponible: **Helvetica Neue en macOS, Arial en el resto**. La UI no está
tipografiada con ninguna fuente de marca.

### 3.3 Colores hardcodeados fuera de tokens

El barrido sobre `src/components/` y `src/routes/` (todos los `.tsx`) da un
resultado limpio, y conviene dejarlo asentado porque cambia el riesgo de F2:

- **Cero literales hexadecimales de color** aplicados.
- **Cero utilidades Tailwind de color arbitrario** (`bg-[#...]`, etc.).
- **Una sola** utilidad de paleta cruda fuera de los tokens semánticos:
  `text-amber-600` en `src/routes/_authenticated/diagnosticos.nuevo.tsx:832`.
- `src/components/ui/chart.tsx:51` contiene `#ccc` y `#fff`, pero **no son
  colores aplicados**: son selectores de atributo
  (`[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50`) que
  justamente sobrescriben los defaults de recharts con tokens del tema.
- Uso de los tokens propios: `text-violet` ×10, `bg-violet-soft` ×5,
  `border-violet` ×4, `bg-violet` ×1.

**Consecuencia para F2:** migrar la UI al tema nuevo es un cambio de valores
de token en `src/styles.css`, no una cacería de literales por los
componentes. Riesgo bajo y superficie concentrada. La única excepción real es
`text-amber-600`.

### 3.4 Rutas

Siete: `__root.tsx`, `auth.tsx`, `_authenticated/route.tsx`,
`_authenticated/index.tsx`, `_authenticated/diagnosticos.nuevo.tsx`,
`_authenticated/diagnosticos.$id.tsx`,
`_authenticated/documentos.$id.$slug.tsx`. El favicon se declara en
`__root.tsx:109` (`{ rel: "icon", href: "/favicon.png", type: "image/png" }`).

---

## 4 · Fuentes presentes

### 4.1 Archivos en `src/assets/fuentes/`

Veinticinco archivos de fuente, más dos licencias.

| Familia | Formato | Archivos | Pesos |
|---|---|---|---|
| Inter | TTF estático 18pt | 5 | Regular, Medium, SemiBold, Bold, ExtraBold — **sin itálicas** |
| Satoshi | OTF | 10 | Light, Regular, Medium, Bold, Black × normal + itálica |
| Satoshi | WOFF2 | 10 | los mismos diez |

Licencias commiteadas: `src/assets/fuentes/inter/LICENSE.txt` (SIL Open Font
License 1.1) y `src/assets/fuentes/satoshi/LICENSE.txt` (ITF Free Font
License 2.0, Fontshare — permite embeber en PDF siempre que la fuente no
pueda extraerse ni usarse independientemente del documento).

### 4.2 Registro para PDF

`src/documents/theme/fuentes/registrar-fuentes.ts`. Los OTF/TTF están
embebidos como data URI base64 en dos archivos generados:
`satoshi-datos.generated.ts` (654 672 b) e `inter-datos.generated.ts`
(2 292 505 b). Motivo documentado en la cabecera: el pipeline de `fontkit`
por ruta (`fontkit.open`/`openSync`) no está disponible en el entorno
serverless/edge de despliegue (se ve como advertencia `IMPORT_IS_UNDEFINED`
en cada build); un data URI se resuelve en memoria, sin tocar el filesystem.

`registrarFuentesVelocentum()` es idempotente. Registra diez combinaciones de
Satoshi (300/400/500/700/900 × normal + italic) y cinco de Inter
(400/500/600/700/800, todas normal).

**Advertencia operativa registrada en el propio archivo, que la etapa 3 debe
respetar:** `@react-pdf/renderer` **no** degrada al peso o estilo más cercano
si falta una combinación exacta — lanza `"Could not resolve font for …"` en
tiempo de ejecución. Cualquier estilo nuevo debe pedir una combinación que
esté en `PESOS_SATOSHI`/`PESOS_INTER`, o el render falla en producción, no en
desarrollo. Al sumar Geist Mono hay que declarar explícitamente cada peso que
se vaya a usar.

Los WOFF2 de Satoshi no pasan por este registro: los consume el CSS de web v1
en sus nueve `@font-face`.

### 4.3 Cobertura de glyphs — verificación real, no supuesta

Corrida con `fontkit.openSync` + `hasGlyphForCodePoint` sobre **los 25
archivos**, para los quince glyphs exigidos
`á é í ó ú ü ñ ¿ ¡ · — † × % $`:

- **25 de 25 archivos tienen los quince glyphs.** Ninguna ausencia.
- **25 de 25 declaran la feature OpenType `tnum`** (cifras tabulares
  disponibles). Ninguno declara `onum`.
- Recuento de glyphs por archivo: Inter 2 926 en los cinco; Satoshi 504 en
  los veinte.

Esta es la línea de base contra la que la etapa 3 debe medir Geist Mono.

---

## 5 · Logos, favicon y assets de marca ya presentes en el repo

### 5.1 SVG

Exactamente cuatro, todos en `src/assets/marca/`, y son los únicos `.svg` del
repositorio fuera de `node_modules`:

| Archivo | Bytes | Contenido |
|---|---|---|
| `simbolo-violeta.svg` | 489 | "V" de dos paths, `viewBox="0 0 40 40"`, `fill="#3B2EF5"` |
| `simbolo-blanco.svg` | 491 | el mismo símbolo en blanco |
| `wordmark-violeta.svg` | 2 698 | "VELOCENTUM" en 10 paths |
| `wordmark-blanco.svg` | 2 698 | el mismo wordmark en blanco |

Los dos símbolos se autodescriben como "editable vector reconstruction of the
blue Velocentum symbol": son reconstrucciones, no el original de marca.

### 5.2 Reimplementación para PDF

`src/documents/renderers/pdf/marca.tsx` reimplementa ambos como primitivas
`<Svg>`/`<Path>` de react-pdf, con el color como prop en vez de hardcodeado.
La razón está en su cabecera: **react-pdf no puede importar un `.svg` como
imagen de forma directa y confiable en este entorno**, así que se copian los
datos `d`/`transform` de los SVG fuente. `marca.test.ts` compara los paths
del componente contra los archivos de `src/assets/marca/` para que nunca
diverjan.

Este es el antecedente directo del que parte la etapa 4: **el repositorio ya
tiene un mecanismo probado para llevar un SVG de marca a PDF, y no es
"importar el archivo".**

### 5.3 Consumo actual

- PDF v1 y PDF v2: vía `SimboloVelocentum` (pdf-v2 lo usa en pie y en las dos
  portadas, a 12/40/46 px).
- Web v1: `renderers/web/document-renderer.tsx:9` importa
  `@/assets/marca/simbolo-blanco.svg`.
- Web v2: **no usa ningún asset de marca.**
- El wordmark existe como componente y como SVG, pero **ningún renderer lo
  invoca**: está escrito y probado, sin consumidor.

### 5.4 Favicon

`public/favicon.png` — PNG 64 × 64, RGBA, 5 014 bytes. Declarado en
`src/routes/__root.tsx:109`. No hay `.ico`, ni `apple-touch-icon`, ni
`site.webmanifest`, ni variantes de tamaño.

---

## 6 · Hallazgo verificado que condiciona la etapa 4

`@react-pdf/renderer` 4.6.1 apoya su árbol SVG en `@react-pdf/primitives`,
que declara **treinta y un primitivas** y las exporta enteras:

`Canvas, Checkbox, Circle, ClipPath, Defs, Document, Ellipse, FieldSet, G,
Image, ImageBackground, Line, LinearGradient, Link, List, Marker, Note, Page,
Path, Polygon, Polyline, RadialGradient, Rect, Select, Stop, Svg, Text,
TextInput, TextInstance, Tspan, View`.

**No existe ninguna primitiva de filtro**: ni `Filter`, ni `FeGaussianBlur`,
ni equivalente. El contrato maestro y el prompt de F1 dicen que "react-pdf
soporta filtros SVG de forma limitada"; lo verificado es más fuerte —
**no los soporta en absoluto en esta versión**.

Consecuencia directa para la etapa 4.1 bis (a): los cinco assets con
`feGaussianBlur` (`isotipo-approved`, `prism`, `bars`, `target`,
`lightning`) no pueden renderizarse en PDF con su desenfoque. Se deja
asentado como hallazgo verificado; **la decisión sobre qué hacer es de
Matías**, y la comparación PDF vs navegador se produce en la etapa 4 como
artefacto para esa decisión.

---

## 7 · Qué queda apuntado para las etapas siguientes

| # | Apunte | Etapa |
|---|---|---|
| 1 | El tema no tiene tokens de modo oscuro: doce literales de pdf-v2 existen sólo por eso | 2 |
| 2 | El patrón de par de contraste web (`--vdoc-*-ink`) está en v1 y falta en web-v2 | 2 |
| 3 | `success` y `borderSoft` no se usan en pdf-v2 | 2 |
| 4 | No existe ningún rol mono en el repositorio | 3 |
| 5 | react-pdf exige declarar cada peso: no degrada, lanza excepción | 3 |
| 6 | react-pdf 4.6.1 no tiene primitiva de filtro; los cinco assets con `feGaussianBlur` no pueden desenfocarse en PDF | 4 |
| 7 | El camino probado de SVG a PDF es reimplementar paths, no importar el archivo (`marca.tsx` + `marca.test.ts`) | 4 y 5 |
| 8 | El wordmark existe y nadie lo usa; el favicon es un PNG 64×64 sin variantes | 4 y 5 |
| 9 | `"Inter Tight"` está declarada en la UI y no se carga: la interfaz usa Helvetica Neue / Arial | F2 |
| 10 | La UI es token-based casi por completo; sólo `text-amber-600` queda fuera | F2 |
| 11 | La pantalla de documento nunca pasa `profile`: `impresion` es inalcanzable desde la UI | F3 |
| 12 | El comentario de cabecera de web-v2 ("no para integrarse a ninguna pantalla real") es falso desde el Bloque Visual 3 | F3 |
