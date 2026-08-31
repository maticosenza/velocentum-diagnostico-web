# Assets de marca — procedencia y reglas

17 SVG copiados **sin modificar** desde la biblioteca oficial aprobada,
`~/Desktop/BV4_BRANDING_CONFIRMADO/assets/` (manifiestos `ASSET_MANIFEST.txt`
y `ASSETS_CONFIRMADOS.txt`, versión 2026-08-30). Copiados el 2026-08-31,
BV4 F1 etapa 4. Verificados byte a byte contra el origen con `cmp`: cero
diferencias.

El paquete anterior "Velocentum_Brand_Assets_V2_Board_Exact" **queda
retirado y no se usa**: sus versiones de `bars` y `target` eran más pobres
(845 vs 3289 bytes y 624 vs 1180). `crystal-v-short-b.svg` **no se copió**:
DH-6/DH-8 lo retiraron del uso principal en favor de `isotipo-approved.svg`.

Los PNG **no entran al repositorio**: `isotipo-approved-2048.png` es preview
y QA. En el render determinista de PDF va siempre el SVG.

## Reglas heredadas de los manifiestos, que rigen acá

- **Estos archivos no se modifican para pruebas.** Una variante nueva entra
  sólo tras aprobación de Matías.
- **El isotipo es identidad y no se fragmenta.**
- SVG es el maestro; el PNG es preview.

## Inventario

| Archivo | Función |
|---|---|
| `isotipo-approved.svg` | **Isotipo vigente.** Identidad: navegación, firma, lockup, avatar, portadas y cierres |
| `objects/prism.svg` | Análisis y diagnóstico |
| `objects/bars.svg` | Proyección, medición y resultados |
| `objects/target.svg` | Foco, prioridades y conversión |
| `objects/lightning.svg` | Adquisición, ejecución y activación |
| `fragments/fragment-cluster-system.svg` | Piezas por integrar: transiciones y condiciones de lectura |
| `scroll/scroll-axis.svg` | Progreso de etapas y roadmap 30/60/90 |
| `pills/{strategy,acquisition,content,analysis,web,design}.svg` | Capacidades |
| `treatments/{solid,outline,graded,translucent}.svg` | Tratamientos |

## DH-7 — excepción semántica del Prisma, y su extensión al isotipo

`objects/prism.svg` conserva su **espectro multicolor**: `#7C5CFF` (violeta),
`#7DFF6A` (verde), `#50C9FF` (cyan) y `#FFE76D` (amarillo). Es una excepción
deliberada y **encapsulada en el asset**: esos colores NO se convierten en
tokens del tema y NO reaparecen en ningún otro componente.

Extensión del 2026-08-31, mismo criterio: `isotipo-approved.svg` usa **35
tonos propios de facetado, ninguno de la paleta vinculante**, y
`objects/bars.svg` usa 15 fuera de paleta. Material interno del asset: no
genera tokens.

## Verificación técnica (2026-08-31, con lectura real de cada archivo)

| Archivo | Bytes | viewBox | feGaussianBlur | Gradientes | path/polygon | Hex únicos | Fuera de paleta | Raster |
|---|---:|---|:---:|---:|---:|---:|---:|:---:|
| `fragments/fragment-cluster-system.svg` | 1239 | 280 240 | no | 1 | 0/16 | 4 | 2 | no |
| `isotipo-approved.svg` | 4089 | 220 210 | **sí** | 6 | 31/0 | 35 | 35 | no |
| `objects/bars.svg` | 3289 | 300 280 | **sí** | 4 | 15/0 | 17 | 15 | no |
| `objects/lightning.svg` | 857 | 220 260 | **sí** | 1 | 3/0 | 5 | 3 | no |
| `objects/prism.svg` | 1298 | 520 260 | **sí** | 2 | 5/1 | 8 | 6 | no |
| `objects/target.svg` | 1180 | 260 260 | **sí** | 1 | 2/0 | 4 | 2 | no |
| `pills/acquisition.svg` | 511 | 300 72 | no | 0 | 0/0 | 3 | 0 | no |
| `pills/analysis.svg` | 509 | 300 72 | no | 0 | 0/0 | 3 | 0 | no |
| `pills/content.svg` | 509 | 300 72 | no | 0 | 0/0 | 3 | 0 | no |
| `pills/design.svg` | 507 | 300 72 | no | 0 | 0/0 | 3 | 0 | no |
| `pills/strategy.svg` | 510 | 300 72 | no | 0 | 0/0 | 3 | 0 | no |
| `pills/web.svg` | 503 | 300 72 | no | 0 | 0/0 | 3 | 0 | no |
| `scroll/scroll-axis.svg` | 1091 | 420 620 | no | 0 | 2/0 | 3 | 0 | no |
| `treatments/graded.svg` | 491 | 220 180 | no | 1 | 2/0 | 2 | 0 | no |
| `treatments/outline.svg` | 264 | 220 180 | no | 0 | 1/0 | 1 | 0 | no |
| `treatments/solid.svg` | 1755 | 220 180 | **sí** | 3 | 1/8 | 9 | 7 | no |
| `treatments/translucent.svg` | 258 | 220 180 | no | 0 | 1/0 | 1 | 0 | no |

---

## 4.1 bis — Verificaciones obligatorias

### (a) Filtros SVG — el prompt dice cinco; son **seis**

`isotipo-approved`, `objects/prism`, `objects/bars`, `objects/target`,
`objects/lightning` **y `treatments/solid`** contienen `feGaussianBlur`. El
manifiesto y el prompt de F1 listan sólo los cinco primeros. La lectura de
los archivos encuentra el sexto.

**El render en PDF no coincide con el del navegador, y la causa es más dura
que "soporte limitado".** `@react-pdf/primitives` 4.x declara exactamente 31
primitivas —`Canvas, Checkbox, Circle, ClipPath, Defs, Document, Ellipse,
FieldSet, G, Image, ImageBackground, Line, LinearGradient, Link, List,
Marker, Note, Page, Path, Polygon, Polyline, RadialGradient, Rect, Select,
Stop, Svg, Text, TextInput, TextInstance, Tspan, View`— y **ninguna es de
filtro**: no existen `Filter` ni `FeGaussianBlur`. El desenfoque no es
representable en PDF con esta biblioteca, en ninguna forma.

La comparación lado a lado está en **`docs/bv4-f1-assets-pdf-vs-navegador.png`**,
generada por `scripts/lamina-assets-pdf.mjs`. El lado PDF es una
transcripción mecánica del mismo SVG a primitivas de react-pdf hecha por
`scripts/render-marca-pdf.mjs`, que no redibuja nada y registra cada
descarte en `marca-descartes.json`.

**Aparecieron dos incompatibilidades más, independientes del filtro:**

1. **`stroke="url(#gradiente)"` no se resuelve en react-pdf**: el trazo sale
   negro sólido. Afecta a `objects/prism.svg` (el haz espectral, dos veces),
   `objects/bars.svg` (`#inner`, tres veces) e `isotipo-approved.svg`
   (`#iso-edge`, dos veces). Los `fill="url(#gradiente)"` sí funcionan.
2. **Los 6 `pills/*.svg` y `scroll/scroll-axis.svg` traen `<text>` vivo con
   `font-family="Arial"`.** react-pdf lanza
   `Font family not registered: Arial` y **aborta el render entero**. Además
   ignora `text-anchor`, `letter-spacing` y `font-weight` dentro de `<Svg>`,
   y `pills/*` usan el glifo `◉` (U+25C9), que no está en las built-in.

**Defecto encontrado en un asset, visible en el navegador:**
`objects/prism.svg` trae
`<path d="M250 28L250 218M164 218L250 122 337 218" stroke="#fff" stroke-opacity=".18"/>`
**sin declarar `fill`**. El valor inicial de `fill` en SVG es `black`, así que
el navegador rellena de negro el triángulo que esos subtrazos encierran — el
bloque oscuro dentro del prisma. Es casi seguro no intencional. Los otros
casos sin `fill` (`bars`, `scroll-axis`, dos líneas del propio `prism`) son
trazos rectos que no encierran área y no se ven.

**Se reporta; no se decide.** Ni la variante sin filtro, ni la corrección del
`fill`, ni qué hacer con el texto de las pills son decisiones de esta fase.

### (b) Encuadre del isotipo — `viewBox` 220 × 210, no cuadrado

Geometría medida sobre un render a 5 px por unidad de `viewBox`, leyendo el
canal alfa (`scripts/lamina-isotipo.mjs`):

| Dato | Valor |
|---|---|
| Caja de tinta real | x [11,4 – 206,4] · y [15,2 – 200,0] → **195,2 × 185,0** |
| Centro de tinta | (108,9 · 107,6) — el centro del `viewBox` es (110 · 105) |
| Aire del asset | izq 11,4 · der 13,6 · sup 15,2 · inf 10,0 |
| Radio máximo desde el centro de tinta | **131,25** |

Dos encuadres, los dos **sin editar el asset**: se cambia el `viewBox` del
envoltorio y `preserveAspectRatio` queda en `xMidYMid meet`, así que el
glifo **nunca se deforma**.

- **Encuadre A — favicon y avatar cuadrado.** `viewBox="-4.1 -5.4 226 226"`.
  Cuadrado centrado en la **tinta** (no en el `viewBox`), con 8% de aire por
  lado sobre el eje mayor. El glifo ocupa el 86% del lado. Ningún trazo toca
  el borde.
- **Encuadre B — avatar circular sin recorte.** `viewBox="-31.1 -32.4 280 280"`.
  El círculo inscripto (radio 140) contiene el radio máximo de tinta
  (131,25) con 6,7% de margen: un recorte circular no corta nada. El glifo
  ocupa el 70% del lado.

A muestra el glifo más grande pero un recorte circular le comería las
puntas; B nunca recorta pero lo deja más chico. **Cuál usar en cada
superficie es decisión de Matías** — la lámina
`docs/bv4-f1-isotipo-test.png` muestra los dos, a 32 y 64 px, en círculo y
en cuadrado redondeado, sobre claro y sobre `ink`.

### (c) Colores fuera de paleta — DH-7

`isotipo-approved.svg` usa **35 tonos únicos y ninguno pertenece a la paleta
vinculante**: el asset no toca `#FF4B8D`, `#FF85B8`, `#D92F6E`, `#0E0E13`,
`#1A1A23` ni `#FFFFFF`. `objects/bars.svg` usa 17 tonos, de los cuales 15
quedan fuera de paleta (los otros dos son `#FF4B8D` y `#FFF`); el manifiesto
dice "16" porque cuenta sólo los hexadecimales de seis dígitos y `bars`
tiene además un `#FFF` abreviado.

Se aplica la excepción de encapsulamiento de DH-7, igual que con el espectro
del Prisma: **material interno del asset, no genera tokens.** Ninguno de esos
tonos entra a `velocentum-crystal/v1` ni reaparece en ningún componente.

## Gate DH-6 — estado

**Pendiente de veredicto humano.** La lámina comparativa está en
`docs/bv4-f1-isotipo-test.png`: 16/24/32 px en color, monocromo sobre claro y
monocromo sobre oscuro, cada uno a tamaño real y ampliado 7× píxel a píxel,
más las composiciones tipo avatar. **F1 no declara el resultado.** Hasta el
veredicto de Matías, todo uso del isotipo queda marcado provisional.
