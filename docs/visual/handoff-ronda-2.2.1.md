# Handoff — Ronda de correcciones 2.2.1 (sobre el prototipo v2)

## 1. Resumen ejecutivo

Esta ronda corrige 5 defectos reales detectados sobre el HEAD anterior
(`8d685ed`, ya con el fix crítico de paginación de D-5 aplicado):

1. **Corrección 1** — páginas de continuación de una tarjeta de
   escenario partida entre páginas sin ninguna identidad de escenario.
2. **Corrección 2** — tarjetas de escenario que caben enteras en una
   página repetían igual su propio nombre (regresión de D-2).
3. **Corrección 3** — las páginas de transición/cierre en perfil
   pantalla seguían siendo un bloque de color liso sin dirección de
   arte (D-5 sin aplicar ahí).
4. **Corrección 4** — 4 montajes comparativos antes/después publicados.
5. **Corrección 5** — el conteo de páginas citado en
   `informe-cobertura-2-2.md` ("409 páginas", "158 en impresión") no se
   reproducía contra ningún commit real; corregido a los valores
   verificados (313 páginas, 152 en impresión).

Las Correcciones 1 y 2 se implementaron con una regla **estática**
(sin depender de ningún mecanismo interno de paginación de
`@react-pdf/renderer`), después de que un primer intento con el
`render`-prop de react-pdf rompiera el texto del encabezado en las
tarjetas cortas — hallazgo real de esta ronda, documentado en la
sección 10. La regla final fue calibrada y verificada contra **dos**
documentos reales distintos (no uno), tras encontrar que la primera
versión daba un falso positivo en uno y la segunda un falso negativo en
el otro.

Suite completa: **688 pasan, 1 todo (689 total)** — los 681 anteriores
sin tocar, más 7 pruebas nuevas (R1–R3, ver sección 7). Typecheck y
`vite build` limpios. 313 páginas en los 48 PDFs, idéntico antes y
después de esta ronda (cero crecimiento).

## 2. Corrección 1 — identidad en la página de continuación

**Síntoma reportado:** en 5 documentos demostrativos, perfil pantalla,
una tarjeta de escenario larga (tabla mensual + palancas + supuestos)
se parte entre dos páginas físicas y la página que retoma el contenido
(típicamente el bloque de Supuestos) no lleva ninguna mención al
escenario al que pertenece.

**Verificación de alcance real:** el hallazgo original acota el defecto
a "perfil pantalla", pero al reproducir con datos equivalentes se
confirmó que **también ocurre en impresión** cuando algo más (una
grilla de tarjetas cortas, o una tarjeta larga anterior que ya ocupó
casi toda su página) reduce el espacio disponible antes de que empiece
la tarjeta larga siguiente — ver sección 10 para el detalle completo de
cómo se calibró la regla contra ambos perfiles.

**Fix:** `ScenarioCard` (`src/documents/renderers/pdf-v2/document.tsx`)
ahora antepone `{nombre} (continuación)` al bloque de Supuestos cuando
la tarjeta es larga, tiene tabla mensual y supuestos, **y** se dan las
condiciones donde el contenido excede una página (pantalla siempre;
impresión sólo si hay tarjetas cortas antes o si no es la primera
tarjeta larga de la sección — ver regla completa y su justificación en
el comentario de código y en la sección 10).

**Verificado:** sobre los 48 PDFs regenerados, las 40 páginas que
contienen el bloque "Supuestos —" llevan identidad de escenario en el
100% de los casos (script ad hoc, ver sección 8). Prueba nueva R1
(`ronda-2.2.1-correcciones.test.ts`) lo fija con dos fixtures: el
existente (`buildMulticanalContext`, una sola tarjeta larga) y uno
nuevo (`buildTresEscenariosLargosContext`, las tres tarjetas largas sin
ninguna corta) que reproduce el patrón "en cascada" observado en el
escenario demostrativo real 1 (marketplace fuerte, tienda floja).

## 3. Corrección 2 — cero repetición en tarjetas que caben enteras

**Síntoma reportado:** tarjetas de escenario que entran enteras en una
página (no continúan) repetían igual su propio nombre una segunda vez
dentro del cuerpo de la tarjeta (regresión de D-2, que ya se había
marcado como resuelta en la ronda 2.2).

**Causa raíz:** el código anterior mostraba el marcador de forma
incondicional cuando la tarjeta era "larga" (`full`), sin verificar si
realmente continuaba en otra página. Toda tarjeta larga que fuera larga
por definición (tener tabla mensual) mostraba el marcador aunque
entrara entera.

**Fix:** mismo mecanismo que la Corrección 1 — el marcador sólo se
pinta cuando la regla estática determina que la tarjeta realmente
continúa (ver sección 10). Se eliminaron los otros dos puntos donde
antes se repetía el nombre (antes de la tabla mensual, antes de las
palancas) porque la evidencia real muestra que el quiebre nunca ocurre
ahí — el header siempre queda en la misma página que esos dos bloques.

**Verificado:** sobre los 48 PDFs, cada combinación caso/perfil/escenario
(48 en total) da 1 ocurrencia (no continúa) o 2 (header +
continuación), nunca 0 ni 3+. Confirmado visualmente en el montaje 3
(sección 5): "BASE" ya no repite su nombre encima de su propia tabla
mensual.

## 4. Corrección 3 — transición/cierre con dirección de arte en pantalla

**Síntoma reportado:** las páginas de transición y de cierre, en
perfil pantalla, seguían siendo un bloque de color violeta a sangre
completa con una sola línea de texto — D-5 (dirección de arte) nunca
se había aplicado ahí, sólo a portada y contenido.

**Fix:** `TransitionPage` (perfil pantalla) ahora incluye:
- Un acento contenido con líneas diagonales reales (`Svg` anidado en un
  `View` de tamaño fijo — mismo patrón ya verificado de
  `coverAccentBounded`, nunca `position: absolute` directo sobre una
  `Page` con contenido `wrap`-sensible, para no repetir el hallazgo
  real de la ronda anterior).
- El motivo línea + puntos (D-5, contrato 6.7) bajo el título, en una
  variante clara (`HeadingRule` con prop `light`) porque el color por
  defecto (violeta sobre fondo violeta) sería invisible.

El fondo violeta a sangre completa se conserva (C3 sólo exige fondo
claro en A4/impresión, no en pantalla).

**Verificado:** prueba nueva R3 confirma ≥5 trazos vectoriales
(`setStrokeRGBColor`) y el motivo de puntos en toda página de
transición del documento de prueba, en pantalla. Confirmado
visualmente en el montaje 4 (sección 5).

## 5. Corrección 4 — 4 montajes comparativos (antes/después, s1 y s4)

Publicados en `scratchpad-2.2.1/montajes/` (ver sección 9 para rutas
completas), cada uno con dos filas (s1 arriba, s4 abajo), "ANTES (ronda
2.1, commit `89b2b7b`)" contra "DESPUÉS (ronda 2.2.1, HEAD de esta
ronda)":

1. **Portada** — diagnóstico, impresión, p1.
2. **Contenido/hallazgos** — diagnóstico, impresión, p4.
3. **Escenarios** — proyección 90d, pantalla: s1 p6 (continuación de
   CONSERVADOR — muestra el defecto D-2 original de la ronda 2.1 y la
   corrección aplicada) y s4 p5 (las 3 tarjetas cortas).
4. **Transición/cierre** — pantalla: s1 diagnóstico p4 y s4 proyección
   p4 — el antes/después de la Corrección 3.

La línea base "antes" se generó desde un `git worktree` limpio en el
commit `89b2b7b` (ronda 2.1), no desde memoria ni desde un paquete de
una sesión anterior (no estaba disponible en este entorno).

## 6. Corrección 5 — conteo de páginas corregido

`informe-cobertura-2-2.md` citaba "409 páginas rasterizadas" y "158 en
perfil impresión" para los 48 PDFs de la ronda 2.2. Ninguno de los dos
números se reprodujo al regenerar los 48 PDFs desde un commit real:

| Punto de referencia | Total | Impresión | Pantalla |
|---|---|---|---|
| `9923df6` (ronda 2.2, con el bug de paginación de D-5 todavía activo) | 451 | — | — |
| `8d685ed` (HEAD antes de esta ronda, bug ya revertido) | 313 | 152 | 161 |
| HEAD final de esta ronda (2.2.1) | 313 | 152 | 161 |

El número documentado (409) no coincide con ninguno de los dos
extremos reales — probablemente se tomó en un punto intermedio no
reproducible ahora. Se corrigieron `informe-cobertura-2-2.md` (tabla de
conteo por documento, total de páginas, cobertura de tinta) y
`contrato-composicion-v2.md` (referencia cruzada a la cobertura de
tinta) con los valores verificados y una nota explícita de la
corrección. La tabla de conteo por documento del informe también tenía
un error puntual (`propuesta-impresion` de s1/s4: citaba 7/5, el valor
real y estable es 6/4).

**Conclusión relevante para esta ronda:** las Correcciones 1 a 3 no
agregaron ni quitaron una sola página (313 = 313, comparación exacta
antes/después de esta ronda específica).

## 7. Pruebas nuevas (R1–R3)

Archivo `src/documents/templates/velocentum-v2/ronda-2.2.1-correcciones.test.ts`,
7 pruebas, ninguna prueba preexistente tocada:

- **R1** (Corrección 1): la página que retoma el bloque de Supuestos de
  una tarjeta partida incluye el nombre del escenario (2 casos: fixture
  existente con 1 tarjeta larga, fixture nuevo con 3 tarjetas largas en
  cascada, ambos en pantalla e impresión).
- **R2** (Correcciones 1+2): ninguna tarjeta que quepa entera repite su
  nombre — mayorista, mixto y margen-negativo (los tres, sin ninguna
  tarjeta larga), ambos perfiles.
- **R3** (Corrección 3): toda página de transición en pantalla dibuja
  ≥5 trazos vectoriales y el motivo de línea+puntos; el fondo sigue
  siendo un relleno de color real (no blanco).

681 pruebas anteriores + 7 nuevas = 688, más 1 `todo` preexistente =
689. Ninguna se modificó, relajó ni eliminó.

## 8. Verificación automatizada sobre los 48 PDFs regenerados

- **Barrido de texto** (pdfjs, las 313 páginas): cero
  `undefined`/`NaN`/`null`/`[object Object]`.
- **Identidad de escenario**: las 40 páginas con el bloque "Supuestos —"
  llevan identidad en el 100% de los casos.
- **Repetición de nombre**: las 48 combinaciones caso/perfil/escenario
  dan 1 o 2 ocurrencias, nunca 0 ni 3+.
- **Cobertura de tinta A4** (152 páginas impresión, 150dpi): máximo
  observado 14,1% — muy por debajo del 25% de C3/D-5.
- **Conteo de páginas**: 313 = 313 antes/después de esta ronda
  específica (ver sección 6).

## 9. Generación y rutas

- **48 PDFs**: `scratchpad-2.2.1/v2-pdfs/<caso>/<tipo>-<perfil>.pdf` —
  8 casos (1/2/3/4/5/6, mayorista, mixto) × 3 tipos × 2 perfiles.
- **313 rásters** (150dpi): `scratchpad-2.2.1/v2-raster/`.
- **24 renders web**: `scratchpad-2.2.1/v2-web/<caso>__<tipo>.html`.
- **4 montajes**: `scratchpad-2.2.1/montajes/{1-portada,2-contenido,3-escenarios,4-cierre}.png`.
- Generado con `createPdfDocumentElementV2` + `renderToBuffer` +
  `DocumentWebRendererV2`, sobre contextos construidos con el motor
  real (`calcularDiagnostico` + `buildDocumentContext`) para los 6
  escenarios demostrativos, y `buildMayoristaContext`/
  `buildMixtoContext` (commiteadas) para mayorista/mixto. El script de
  generación fue efímero, fuera de `src/`, no commiteado (mismo
  criterio que la ronda 2.2).
- Línea base "antes" (ronda 2.1, `89b2b7b`) generada en
  `git worktree add /tmp/worktree-2.1-baseline 89b2b7b`, ya eliminado
  al cierre de esta ronda.

## 10. Decisiones técnicas e intentos descartados

**Intento 1 (descartado): `render`-prop de react-pdf con comparación de
`subPageNumber`.** La API existe (`@react-pdf/renderer` expone
`subPageNumber`/`subPageTotalPages` en el `render` prop de `Text`/`View`,
resuelto una vez por página física tras la partición del documento) y
en teoría permite detectar si un nodo cayó en una página distinta a la
de otro nodo anterior. Se implementó: el encabezado grababa su
`subPageNumber` como efecto lateral y cada subsección candidata a
continuación lo comparaba. **Resultado real, verificado generando el
PDF con `vite-node` sobre el pipeline real completo (no un script
aislado):** el texto del encabezado desaparecía por completo en las
tarjetas cortas (`CardGrid` con `wrap={false}` anidado en varios
niveles) — reproducido de punta a punta, no fue un artefacto de
transpilación de un script suelto. Se descartó: el único uso de
`render` que ya existía en este código (número de página del pie de
página) siempre lo combina con `fixed`; un `render` sin `fixed` no está
probado en este árbol de componentes y rompe contenido real.

**Intento 2 (descartado, falso positivo real):** regla estática "toda
tarjeta larga con tabla mensual y supuestos, en cualquier perfil". Al
generar el documento demostrativo real "1-marketplace-fuerte-tienda-floja"
en impresión, el escenario CONSERVADOR entra solo en su propia página
A4 (no continúa) — pero la regla igual mostraba el marcador, un falso
positivo real, exactamente lo que la Corrección 2 prohíbe.

**Intento 3 (descartado, falso negativo real):** "sólo si hay tarjetas
cortas antes Y es la primera tarjeta larga". Corrigió el caso anterior,
pero en el mismo documento BASE y POTENCIAL (2da y 3ra tarjeta larga)
sí continúan entre páginas — el encabezado "BASE" queda al final de la
página de CONSERVADOR, separado del resto de su contenido — y esta
regla los dejaba sin marcador.

**Regla final (adoptada):** el marcador aparece cuando la tarjeta es
larga, tiene tabla mensual y supuestos, **y** (perfil es pantalla, **o**
hay tarjetas cortas antes en la misma sección, **o** no es la primera
tarjeta larga). Verificada contra los dos documentos reales anteriores
simultáneamente (ningún falso positivo, ningún falso negativo) y contra
los 48 PDFs completos (sección 8). Sin ningún mecanismo interno de
paginación — pura evaluación de datos conocidos antes de renderizar.

**Otras dos guardas de seguridad, ya documentadas en rondas previas y
respetadas sin cambios en ésta:** `Svg` nunca `position: absolute`
directo sobre una `Page` con contenido `wrap`-sensible (hallazgo real
de la ronda 2.2); ningún elemento `fixed` combinado con `wrap={false}`
en contenido de tarjetas (hallazgo real del cierre del Bloque Visual
2). El nuevo acento de la Corrección 3 sigue el patrón ya verificado de
`coverAccentBounded` (Svg anidado en un `View` de tamaño fijo).

## 11. Hallazgo fuera de alcance (no corregido, documentado para más adelante)

Durante la inspección visual se observó que el glifo de personalidad
(`PersonalityGlyph`, D-5, contrato 6.5 — el carácter "◆" para
`diagnostico`) se renderiza como un glifo incorrecto ("Æ" o similar) en
al menos un visor/rasterizador (`pdftoppm`/poppler, confirmado
visualmente, no sólo en la extracción de texto de `pdfjs`). Es
anterior a esta ronda (introducido en D-5, ronda 2.2 — no aparece en la
línea base de la ronda 2.1) y no forma parte de ninguna de las 5
Correcciones de este prompt. No se tocó, para no ampliar el alcance sin
autorización. Queda documentado acá para una futura ronda.

## 12. Estado final y pendientes

- Suite: 688 pasan + 1 todo (689). Typecheck limpio. `vite build`
  limpio (únicos warnings: `fontkit`/`browser-module`, preexistentes,
  no relacionados con esta ronda).
- 313 páginas en los 48 PDFs, sin cambio respecto al HEAD anterior a
  esta ronda.
- Archivos modificados: `src/documents/renderers/pdf-v2/document.tsx`,
  `src/documents/templates/velocentum-v2/test-fixtures.ts` (nuevo
  fixture `buildTresEscenariosLargosContext`),
  `docs/visual/contrato-composicion-v2.md`,
  `docs/visual/informe-cobertura-2-2.md`. Archivo nuevo:
  `src/documents/templates/velocentum-v2/ronda-2.2.1-correcciones.test.ts`.
- Pendiente para una próxima ronda: el glifo de personalidad mal
  renderizado (sección 11).
