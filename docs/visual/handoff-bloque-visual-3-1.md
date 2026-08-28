# Handoff — Bloque Visual 3.1, ronda correctiva (2026-08-28)

## 1 · Rama, HEAD local y remoto, commit candidato

Rama: `feat/noche-continuacion`.
HEAD de partida (línea base auditada externamente, "APROBADO CON
CORRECCIONES"): `cb8b378a4573db750a615e0c5a4f4bb7b27d9c30`.
Commit candidato (única ronda, auditado internamente y pusheado):
`f18ff1f6a29db4b691a03ba237a7b73ee3d42267`.
HEAD local = HEAD remoto tras el push (verificado con
`git rev-parse HEAD` y `git rev-parse origin/feat/noche-continuacion`):
`f18ff1f6a29db4b691a03ba237a7b73ee3d42267` en ambos.

Todos los artefactos de este ZIP se generaron desde un `git worktree`
limpio en `f18ff1f` (nunca del árbol de trabajo); el conteo de páginas
contra la línea base (sección 9) se generó desde un segundo `git
worktree` limpio en `cb8b378`.

## 2 · `git status --short`

Limpio antes del commit candidato, limpio después. Verificado en cada
paso de la secuencia (PASO 0, tras implementar, antes y después del
commit, antes y después del push).

## 3 · `git diff --stat` contra `cb8b378`

```
 docs/funcional/contrato-bloque-3.md                | 108 ++++++++++++-
 docs/visual/contrato-composicion-v2.md             |  15 ++
 src/documents/renderers/pdf-v2/document.tsx        |  60 +++++---
 .../renderers/web-v2/document-renderer.tsx         |  61 +++++---
 .../renderers/web-v2/generar-web-bloque-3.test.ts  | 167 +++++++++++++++++++++
 .../bloque-visual-3-1-verificacion.test.ts         | 146 ++++++++++++++++++
 .../templates/velocentum-v2/diagnostico.ts         |  18 ++-
 src/lib/fixtures-escenarios-demo.test.ts           |   5 +
 8 files changed, 525 insertions(+), 55 deletions(-)
```

Ocho archivos: dos renderers v2 (PDF/web, C-2), un template v2
(`diagnostico.ts`, orden de bloques, C-1), dos archivos de test nuevos
(el generador web de C-3 y la verificación W1-W3), dos documentos
(`contrato-bloque-3.md` sección 16 y `contrato-composicion-v2.md`
sección 5.8 ampliada, más la corrección C-4 de redacción), y un archivo
de test existente con 5 líneas agregadas (allowlist, ver sección 4).

## 4 · Aislamiento

`src/lib/` y `src/documents/domain/`: **fuera del diff**, salvo un único
archivo — `src/lib/fixtures-escenarios-demo.test.ts`, 5 líneas
agregadas a un `Set` de nombres de archivo permitidos para importar
`fixtures-escenarios-demo` (ver el propio archivo, líneas 35-42): los
dos generadores/verificadores nuevos de esta ronda
(`generar-web-bloque-3.test.ts`, `bloque-visual-3-1-verificacion.test.ts`)
importan esa fixture, así que la prueba de aislamiento existente
(`fixtures-escenarios-demo.test.ts`, "ningún archivo fuera de la lista
permitida importa...") los hubiera bloqueado sin este agregado — decisión
consciente, mismo criterio que el resto del archivo, no acoplamiento
silencioso. Cero cambios de comportamiento.

`src/documents/templates/velocentum-v1/`: **fuera del diff**, confirmado
con `git diff cb8b378 -- src/documents/templates/velocentum-v1/` vacío.

`src/documents/domain/build-context.ts`, `src/documents/templates/velocentum-v2/blocks.ts`
(los dos archivos que construyen los DATOS del funnel/fortalezas):
**fuera del diff** — confirmado con
`git diff cb8b378 -- src/documents/domain/ src/documents/templates/velocentum-v2/blocks.ts`
vacío. Este candidato reordena bloques y cambia CÓMO se renderizan
(C-1/C-2), nunca QUÉ datos exponen.

El motor (`src/lib/calculo-diagnostico.ts` y el resto de `src/lib/`
salvo la línea de arriba): sin tocar.

## 5 · Resultado del PASO 0

Rama `feat/noche-continuacion`, HEAD `cb8b378` confirmado. `git status
--short` limpio. Suite: 776 passed + 1 todo (777) — igual a la línea
base declarada por el handoff de cierre del Bloque Visual 3. Typecheck
limpio (`npx tsc --noEmit`, sin salida). Build exitoso (`npx vite
build`, únicos warnings: `IMPORT_IS_UNDEFINED` de `fontkit`,
preexistentes, no relacionados con este bloque).

## 6 · C-1 a C-4: estado y evidencia

**C-1 · RESUELTA.** Causa real: `fortalezas` era el último bloque de la
sección "current-state" (`diagnostico.ts`); en el caso con una sola
fortaleza y `channelComparison` presente (dedup C6 activo → `metric-grid`
cabe sin fila de continuación propia), no quedaba ningún bloque grande
después para absorberla si la sección no cabía completa en la página
anterior. Corrección: `metrics` pasa al final del orden de bloques
(`blocks: [coverage, channelComparison, fortalezas, shipping, funnel,
metrics]`). Evidencia: `rasters/1-marketplace-fuerte-tienda-floja/diagnostico-pantalla-3.png`
(la fortaleza "Economía" ahora comparte página con la tabla del funnel
completa y el inicio de metric-grid) y `-4.png` (fila de continuación de
metric-grid, el residuo ya aceptado — ver sección 5.8 del contrato de
composición, ampliada esta ronda). Comparativa antes/después en
`comparativas/1-marketplace-fuerte-tienda-floja-diagnostico-pantalla/`.
Falseado: revertir el orden de bloques reproduce el defecto original
exacto (167 caracteres de texto en la página aislada) — prueba W1 en
`bloque-visual-3-1-verificacion.test.ts`.

Efecto colateral transparente, documentado, NO un defecto nuevo: mover
`metrics` al final también hace que el mismo residuo ya aceptado
(fila de continuación de `metric-grid`, 3 tarjetas MER tienda/MER
marketplace/ROAS Product Ads, ~15-25% de ocupación) se manifieste como
página propia en tres casos más — `2-margen-alto-volumen-bajo`,
`3-margen-fino-volumen-alto`, `5-todo-sano`, perfil pantalla (ninguno
usa `channelComparison`, así que el dedup C6 no reduce `metric-grid`).
Verificado por inspección visual directa de los tres — contenido
idéntico a la excepción ya aceptada, sin texto cortado ni superposición.
Ver `contrato-composicion-v2.md` sección 5.8 y `comparativas/2-margen-alto-volumen-bajo-diagnostico-pantalla/`.

**C-2 · RESUELTA.** Causa real: `renderBlock` (PDF) y `FunnelBlock`
(web) reutilizaban literalmente el mismo `CardGrid`/`vdoc2-metric-grid`
que `metric-grid`, sin título propio — un lector no podía distinguir una
etapa del funnel de una tarjeta de métrica. Corrección: el funnel pasa a
la tabla simple ya aprobada (mismos estilos `monthlyTable*` que el
detalle mensual de escenarios en PDF; `vdoc2-table-wrap`/
`vdoc2-monthly-table` en web), con encabezado "Funnel de conversión:
tienda propia" y columnas Etapa/Valor/Conversión desde la etapa
anterior. Cero derivación de datos nueva (`git diff cb8b378 --
src/documents/domain/ .../blocks.ts` vacío, sección 4). Evidencia:
`rasters/1-marketplace-fuerte-tienda-floja/diagnostico-pantalla-4.png`
(PDF) y `web/1-marketplace-fuerte-tienda-floja/diagnostico-pantalla.html`
(web, inspeccionado en Chrome con captura de pantalla durante la
sesión). Falseado: revertir el renderer reproduce el `vdoc2-metric-grid`
compartido — prueba W2.

**C-3 · RESUELTA.** Ver sección 7.

**C-4 · RESUELTA.** `docs/funcional/contrato-bloque-3.md` sección 15,
antes/después: "El delta completo está concentrado en cuatro documentos
`diagnostico` — los únicos **siete** tipo/perfil que tienen la sección..."
→ "...los únicos **cuatro** tipo/perfil que tienen la sección..." (la
tabla de esa misma sección siempre tuvo cuatro filas; el texto decía
"siete" desde la ronda anterior, dejado sin tocar a propósito para
pushear exactamente el HEAD auditado — ver handoff del Bloque Visual 3,
sección 11).

## 7 · Causa de C-3

`web/` traía 27 renders (9 casos × 3 documentos × 1 perfil) en vez de 54
(× 2 perfiles). **Causa inferida, no probada directamente**: el script
que generó el `web/` del ZIP anterior nunca se incorporó al repositorio
(no hay commit que lo pruebe), así que no hay forma de auditar
retroactivamente qué hizo. La inferencia se apoya en que 27 es
exactamente la mitad de 54 — la firma exacta de haber iterado un solo
perfil — y en que el renderer web (a diferencia del PDF) es HTML
continuo sin paginación real: "impresión" sólo cambia una clase CSS
(`vdoc2--impresion`, ancho A4) y dos custom properties de sombra/textura
(`profile` en `document-renderer.tsx`), no la composición estructural,
lo que hace fácil asumir "no agrega nada real" y omitirlo — aunque
`c-08-perfil-a4.test.ts` (preexistente, sin tocar en esta ronda) ya
probaba que los dos perfiles producen HTML distinto para el mismo
modelo. Corrección: `src/documents/renderers/web-v2/generar-web-bloque-3.test.ts`,
generador hermano del de PDFs, incorporado al repo (mismo criterio que
`generar-pdfs-bloque-3.test.ts`), que itera los dos perfiles
explícitamente y verifica en dos pruebas automatizadas: (1) que produce
exactamente 54 renders HTML válidos, y (2) que pantalla e impresión
producen HTML distinto para cada caso/documento (no el mismo contenido
duplicado). Verificado generando los 54 a disco
(`VELOCENTUM_BLOQUE3_WEB_QA_DIR=...`) y contando: 54 archivos `.html`,
27 pantalla + 27 impresión.

## 8 · Conteo de pruebas sin doble suma

Línea base (cierre del Bloque Visual 3, `cb8b378`): **776 passed + 1
todo (777)**.

Nuevas de esta ronda:
- `generar-web-bloque-3.test.ts`: 2 (los 54 renders válidos; pantalla ≠
  impresión).
- `bloque-visual-3-1-verificacion.test.ts`: 11 — W1 (8, una por cada
  caso real con `fortalezas` no vacío — dos casos sin fortalezas se
  saltean sin fallar, no suman al conteo de aserciones activas pero sí
  al conteo de `it()`), W2 (2), W3 (1, referencia).

**Total: 776 + 13 = 789 passed + 1 todo (790).** Confirmado corriendo
`npx vitest run` completo desde el worktree limpio del candidato: `Test
Files 62 passed (62)`, `Tests 789 passed | 1 todo (790)`. Typecheck
limpio. Build exitoso (mismos warnings preexistentes de `fontkit`).

## 9 · Conteo de páginas documento por documento contra `cb8b378`

54 PDFs regenerados desde un `git worktree` limpio en `cb8b378` (antes)
y comparados con `pdfinfo` contra los 54 generados desde el worktree
limpio del candidato `f18ff1f` (después). **380 → 380 páginas totales,
delta neto 0**, con movimiento real en tres documentos (6 combinaciones
perfil, ambas explicadas por el mismo mecanismo — ver
`contrato-bloque-3.md` sección 16 para el detalle completo):

| Documento | Antes | Después | Delta |
|---|---|---|---|
| `2-margen-alto-volumen-bajo/diagnostico-pantalla` | 6 | 7 | +1 |
| `2-margen-alto-volumen-bajo/diagnostico-impresion` | 6 | 5 | −1 |
| `3-margen-fino-volumen-alto/diagnostico-pantalla` | 6 | 7 | +1 |
| `3-margen-fino-volumen-alto/diagnostico-impresion` | 6 | 5 | −1 |
| `5-todo-sano/diagnostico-pantalla` | 6 | 7 | +1 |
| `5-todo-sano/diagnostico-impresion` | 6 | 5 | −1 |

Pantalla +1: efecto colateral de C-1 descrito en la sección 6 (la fila
de continuación de `metric-grid`, ya aceptada para el caso multicanal,
ahora también abre página propia en estos tres). Impresión −1: la tabla
del funnel (C-2) ocupa menos alto que el `CardGrid` de cuatro tarjetas +
tarjeta "Conversión global" que reemplaza, así que el perfil que apila
más agresivamente ahorra una página. Las 48 combinaciones restantes
(incluidas las 4 páginas nuevas de la ronda anterior) no cambiaron de
conteo. Ninguna página nueva o desplazada tiene texto solapado, cortado
ni queda con encabezado sin contenido — verificado por inspección
visual directa y por la auditoría interna (sección 10).

## 10 · Auditoría interna

**Ronda única** — agente de solo lectura, sin contexto de la sesión de
implementación, en un `git worktree` propio, contra `f18ff1f`. Verificó
los 12 criterios de aceptación uno por uno con comandos reales (no
lectura pasiva de código): regeneró los 54 PDFs del candidato y de la
línea base de forma independiente, rasterizó e inspeccionó visualmente
las páginas de C-1/C-2 y un barrido adicional de 3 casos al azar,
corrió la suite completa, typecheck y build, verificó determinismo
comparando texto extraído (`pdftotext -layout`) de dos corridas
independientes de los 54 PDFs (0 diferencias), confirmó la tabla de
reconciliación de páginas de la sección 9 como exacta (no sólo
plausible), y confirmó el aislamiento de v1/motor.

**Veredicto: APROBADO.** Sin correcciones pendientes, sin hallazgos
nuevos, sin regresiones. Texto completo del informe en el historial de
esta sesión.

Push a `feat/noche-continuacion` ejecutado por el agente principal,
después del veredicto APROBADO, nunca por el agente auditor (mismo
criterio que la sección 5.6 del plan maestro exige). Verificado
`git rev-parse HEAD` = `git rev-parse origin/feat/noche-continuacion` =
`f18ff1f6a29db4b691a03ba237a7b73ee3d42267` tras el push.

## Restricciones vigentes

Sin cambios: v2 no está conectada a la interfaz ni al botón de
exportación real; no se integró a `main`; no se publicó; no se
desplegó; no se avanzó a la fase 14 ni a staging; no se promovió v2
sobre v1 (sus criterios de promoción, sección 8 del contrato funcional,
siguen sin ejecutarse en este bloque).
