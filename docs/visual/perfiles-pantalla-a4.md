# Perfiles pantalla / A4 — estado real verificado (D6)

Verificado contra `feat/noche-continuacion`, HEAD `e5080e20b2be491c3f45ad9846fc07441e68c103`.

**Actualización al cierre del bloque (2026-08-23):** este documento ya
reflejaba, desde la primera versión, que C-01 estaba parcialmente refutada
(ver sección 2 más abajo). Al cierre del bloque, C-01 se reescribió
formalmente en `docs/visual/auditoria-visual-2026-08-23.md` (sección d)
para conservar sólo los tres problemas residuales verificables (bleed en
A4, tabla sin repetir encabezado, escala tipográfica incompleta) y se
reasignó del Bloque Visual 1 al Bloque Visual 2. Además se agregó **C-08
(no existe previsualización A4)** — ver sección 1.1 nueva, más abajo —
como hallazgo separado de C-01: son dos problemas distintos (C-01 es sobre
si el perfil A4 existe; C-08 es sobre si se puede VER sin descargar el
PDF).

## 1 · Estado real, archivo y línea

### Renderer PDF (`@react-pdf/renderer`) — SÍ tiene dos perfiles distintos

`src/documents/renderers/pdf/document.tsx:99-142`, constante `PROFILES`:

```ts
export const PROFILES: Record<PdfProfile, ProfileTokens> = {
  pantalla: {
    pageSize: [960, 540],
    pagePaddingH: 54, pagePaddingTop: 84, pagePaddingBottom: 48,
    baseFontSize: 10, titleFontSize: 25, titleMaxWidth: 720,
    cardWidthGrid: "31.8%", cardWidthWide: "48.8%",
    ...
  },
  impresion: {
    pageSize: "A4",
    pagePaddingH: 48, pagePaddingTop: 78, pagePaddingBottom: 46,
    baseFontSize: 11, titleFontSize: 20, titleMaxWidth: 460,
    cardWidthGrid: "48.8%", cardWidthWide: "100%",
    ...
  },
};
```

`pageSize` es literalmente distinto por perfil: `[960, 540]` puntos
(16:9, apaisado) para `pantalla`; el string `"A4"` (que `@react-pdf/renderer`
resuelve internamente a 595.28 × 841.89pt, vertical) para `impresion`. Esto
se pasa directo a `<Page size={PROFILES[profile].pageSize}>` en los tres
componentes de página (`CoverPage:784`, `TransitionPage:817`,
`ContentPage:837`).

Los tokens de composición TAMBIÉN difieren, no sólo el tamaño de página:
la grilla de tarjetas pasa de 3 columnas (`cardWidthGrid: "31.8%"`,
pantalla) a 2 columnas (`"48.8%"`, impresión); las tarjetas "anchas" pasan
de media página (`"48.8%"`) a página completa (`"100%"`); el cuerpo
tipográfico crece de 10 a 11pt; el título de sección BAJA de 25 a 20pt
(no es un escalado proporcional simple en ninguna dirección).

**Con esta evidencia, la afirmación de la auditoría externa — "el tamaño
de página del renderer PDF es una constante única [960,540]" — queda
REFUTADA.** Hay dos valores de `pageSize` distintos, seleccionados por
`profile`, con tokens de composición propios cada uno.

**Matiz necesario, no cubierto por un simple sí/no:** los dos perfiles
comparten el MISMO árbol de componentes (`makeStyles(profile)`,
`renderBlock`, `ContentPage`, etc. — un solo módulo, parametrizado por
`PROFILES[profile]`), no dos jerarquías de componentes independientes.
Es "un layout propio" en el sentido de que produce columnas, tamaños de
página y escalas tipográficas genuinamente distintos (confirmado arriba),
pero es "el mismo código" en el sentido de que no hay una implementación
A4 separada línea por línea de la de pantalla — toda la lógica de qué se
dibuja vive en un solo lugar, sólo los NÚMEROS cambian según el perfil.
Si D6 exige "perfiles de composición independientes" en el sentido de
"parámetros de composición propios por perfil", esto ya se cumple. Si
exige "código de layout completamente separado", no se cumple — hoy no
existe.

**No se encontró ningún mecanismo de "tabla que repite encabezado al
continuar" en ningún perfil** — ni pantalla ni impresión. La tabla mensual
de escenarios (`document.tsx:623-648`) imprime el encabezado una sola vez
por escenario; si `@react-pdf/renderer` corta la tabla entre páginas
(overflow, ver E-01/E-02 en la matriz), no hay ningún `fixed` ni
repetición de encabezado configurada.

**Ambas portadas y transiciones (`CoverPage`, `TransitionPage`) son a
sangre completa (bleed) en AMBOS perfiles hoy** — `coverAccent`/
`coverAccentSoft` usan `position: "absolute"` con `top:0, bottom:0,
right:0` (`document.tsx:213-229`), sin margen, cubriendo el borde de la
página en pantalla e impresión por igual. Si "sin páginas a sangre
completa" (regla dura pedida más abajo) se adopta como regla nueva para
A4, es un cambio respecto del comportamiento actual, no una confirmación
de algo que ya se respeta.

### Renderer web (HTML/CSS) — NO tiene ningún perfil

`src/documents/renderers/web/document-renderer.tsx:12-15`:

```ts
export type DocumentWebRendererProps = {
  model: DocumentModel;
  className?: string;
};
```

No hay ningún campo `profile` en las props del renderer web. `DocumentWebRenderer`
siempre renderiza la misma composición HTML — no existe una variante "A4"
del HTML en ningún lado del código. La pantalla de vista previa
(`src/routes/_authenticated/documentos.$id.$slug.tsx:198-202`) monta
`<DocumentWebRenderer model={model} />` sin pasar ningún perfil; el
selector de perfil (`ETIQUETA_PERFIL`, líneas 26-29 de esa misma ruta)
sólo existe para el dropdown de "Descargar PDF" — la vista previa en
pantalla del navegador **nunca muestra el perfil A4**, sólo el PDF
descargado lo tiene.

El CSS de impresión del renderer web SÍ existe
(`src/documents/renderers/web/document-renderer.css:751-775`):

```css
@page {
  size: 13.333in 7.5in;
  margin: 0;
}

@media print {
  .vdoc { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .vdoc-section { min-height: 7.5in; padding: 0.65in; break-after: page; }
  .vdoc-section:last-of-type { break-after: auto; }
}
```

**Esto CONFIRMA exactamente la segunda mitad de la afirmación de la
auditoría externa** — el `@page` sí declara `13.333in × 7.5in` (que es
960×540px a 72dpi, la MISMA proporción 16:9 de `pantalla`, no A4). Esta
hoja de estilos es para el comando "Imprimir" nativo del navegador sobre
la vista previa HTML — un mecanismo COMPLETAMENTE DISTINTO de la
generación de PDF real (`@react-pdf/renderer`, que no usa CSS en absoluto:
usa el objeto `StyleSheet` de `document.tsx`). Imprimir la vista previa web
hoy produce páginas con forma 16:9, nunca A4 — sin importar qué perfil
elija el usuario en el dropdown de descarga (que ni siquiera afecta a esta
vista).

### C-08 · No existe previsualización A4 (nuevo, agregado al cierre)

Con todo lo de arriba: el renderer PDF sí tiene un perfil `impresion` A4
real (ver sección 1). Pero **no hay ninguna manera de verlo sin descargar
el PDF.** La vista previa en pantalla (`DocumentWebRenderer`, sin campo
`profile`) siempre muestra la composición de `pantalla`; su impresión de
navegador reproduce las dimensiones de 16:9, nunca A4 (`@page: 13.333in
7.5in`, arriba). El único selector de perfil de toda la interfaz es el
dropdown de "Descargar PDF" — no hay ningún modo "vista previa A4" en
pantalla. Para comprobar cómo se ve el perfil `impresion` hoy, la única vía
es descargarlo y abrirlo con un lector de PDF.

## 2 · V3 — veredicto

**V3: "No existe una maquetación A4 propia separada de la 16:9."**

- Para el **renderer PDF** (el que efectivamente se descarga y se
  distribuye a clientes): **REFUTADO** — existe un perfil `impresion` con
  tamaño de página A4 real y tokens de composición propios (grilla,
  tipografía, anchos de tarjeta), aunque implementado sobre el mismo árbol
  de componentes que `pantalla`, no como código separado.
- Para el **renderer web** (la vista previa en pantalla y su impresión de
  navegador): **CONFIRMADO** — no existe ningún perfil, ni A4 ni ninguno
  otro; la vista previa siempre es una sola composición, y su hoja de
  impresión reproduce las dimensiones de `pantalla` (16:9), nunca A4.

La afirmación de la auditoría externa, tal como está redactada, mezcla
ambos renderers bajo una sola frase ("el renderer PDF... y el CSS...") — es
parcialmente correcta y parcialmente incorrecta según a cuál de los dos
renderers se aplique. C-01 queda así: confirmado para el renderer web,
refutado para el renderer PDF.

## 3 · Estrategia bajo D6 (documental — nada de esto está implementado)

D6: "Pantalla y A4 comparten contenido y reglas semánticas, pero usan
perfiles de composición independientes."

### Qué ya se comparte hoy (y debería seguir compartiéndose)

- El `DocumentModel`/`DocumentContextV1` completo: un solo árbol de
  secciones y bloques por documento, sin ninguna bifurcación por perfil —
  confirmado, `createPdfDocumentElement(model, profile)` recibe el MISMO
  `model` sin importar el perfil (`document.tsx:885-890`).
- Los tokens de marca (`VELOCENTUM_LIGHT_V1`, colores, radios) — no varían
  por `PROFILES`.
- El copy/las reglas semánticas (D4, capa, prioridad, magnitud) — viven en
  el modelo, no en el renderer.

### Qué ya se separa hoy (parcialmente) y qué falta separar

| Dimensión | ¿Ya se separa por perfil? | Evidencia |
|---|---|---|
| Tamaño de página | Sí | `PROFILES.{pantalla,impresion}.pageSize` |
| Columnas de grilla | Sí | `cardWidthGrid` 3 vs. 2 columnas |
| Escala tipográfica | Parcial — sólo `baseFontSize`/`titleFontSize` a nivel global, no hay una escala completa por tipo de texto (labels, valores, notas) | `PROFILES.*.baseFontSize/titleFontSize` únicamente |
| Paginación (salto de página, tablas que repiten encabezado) | No | Ningún mecanismo encontrado en ningún perfil |
| Tratamiento de fondos (bleed vs. con margen) | No — ambos perfiles son a sangre completa en portada/transición | `coverAccent`/`coverAccentSoft` idénticos en estructura para los dos perfiles |
| Vista previa en pantalla del perfil A4 | No existe — el renderer web no tiene perfiles | `DocumentWebRendererProps` sin campo `profile` |

### Reglas duras pedidas para A4 — contraste con el estado actual

- **"Sin páginas a sangre completa":** HOY se incumple en portada y
  transición, en ambos perfiles (ver arriba). Adoptar esta regla para A4
  específicamente exigiría una rama de estilo nueva que no existe.
- **"Tablas que repiten encabezado al continuar":** HOY no existe en
  ningún perfil. `@react-pdf/renderer` no lo hace automáticamente; haría
  falta implementarlo explícitamente (fuera de alcance de este bloque
  documental).
- **"Cuerpos tipográficos adecuados a papel":** parcialmente atendido
  (`baseFontSize: 11` en impresión vs. `10` en pantalla), pero sin una
  escala tipográfica completa por rol de texto (label/valor/nota/badge)
  documentada ni verificada contra un estándar de legibilidad en papel.

Todo lo anterior (paginación de tablas, tratamiento de fondos, escala
tipográfica completa) requiere una decisión de diseño que corresponde al
Bloque Visual 2, no a este documento — se deja marcado como insumo, no
como propuesta cerrada.
