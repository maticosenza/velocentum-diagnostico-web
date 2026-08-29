# Handoff final — Fase 14.1 (ronda correctiva)

Prompt original: `docs/prompts/fase-14-1.md` (guardado verbatim,
ejecutado desde `7d3883a`).

Esta ronda tuvo dos entregas: una parcial (C-1/C-2/Y1, commit `b9b10d9`,
auditada y pusheada como `c6c2c9a`) mientras C-3 quedaba pendiente de
que Matías confirmara dónde corre la app en producción; y esta,
final, con C-3/C-4/Y2/Y3 ya resueltos tras su decisión (vía cliente:
dos pasadas en el navegador). Este documento reemplaza el handoff
parcial anterior.

## 1 · Rama, HEAD y commit candidato

- Rama: `feat/noche-continuacion`.
- Commit candidato auditado (alcance completo): `6f20fde` (padre:
  `c6c2c9a`, que a su vez es hijo de `7d3883a`, el HEAD ya aprobado y
  pusheado de Fase 14).
- Este handoff se agrega como commit nuevo, encima de `6f20fde`.

## 2 · `git status --short`

Vacío — árbol de trabajo limpio al momento de la auditoría (y sigue
limpio salvo este mismo archivo de handoff, agregado después del
veredicto APROBADO).

## 3 · `git diff --stat` contra `7d3883a` (todo el alcance de 14.1)

```
 docs/fase-14/handoff-fase-14-1.md                  | (este archivo)
 docs/fase-14/investigacion-c3.md                   | 194 ++++++++++++++++
 docs/prompts/fase-14-1.md                          | 123 ++++++++++
 docs/visual/auditoria-visual-2026-08-23.md         | 102 ++++++++-
 docs/visual/contrato-composicion-v2.md             |  67 +++++-
 src/documents/fase-14-1-y1.test.ts                 | 254 +++++++++++++++++++++
 src/documents/fase-14-1-y2-y3.test.ts              | 164 +++++++++++++
 src/documents/fase-14-x2-x3-x6-activo.test.ts      |  20 +-
 src/documents/renderers/pdf-v2/export-client.ts    |  53 ++---
 src/documents/renderers/pdf-v2/exportacion.test.ts |   2 +-
 .../renderers/pdf-v2/generar-pdfs-bloque-3.test.ts |   4 +-
 src/documents/renderers/pdf-v2/paginacion.ts       |  75 ++++--
 src/documents/renderers/pdf-v2/pdfjs-worker.d.ts   |   9 +
 .../velocentum-v2/ronda-2.1-correcciones.test.ts   |   2 +-
 .../velocentum-v2/ronda-2.2-correcciones.test.ts   |   2 +-
 .../velocentum-v2/ronda-2.2.1-correcciones.test.ts |   2 +-
 .../velocentum-v2/ronda-2.2.3-correcciones.test.ts |   2 +-
 src/lib/fixtures-escenarios-demo.test.ts           |   4 +
 18 files changed, ~1150 insertions(+), ~69 deletions(-)
```

Cero archivos de `templates/velocentum-v2/`, `renderers/pdf-v2/document.tsx`,
`renderers/web-v2/` ni `src/documents/domain/` — confirmado por la
auditoría interna: esta ronda no tocó composición.

## 4 · C-1: umbral de ocupación a 50%

`docs/visual/contrato-composicion-v2.md` sección 5.1: umbral general
único de 50% (antes 70% pantalla / 65% impresión), decisión humana de
Matías (vía a de E-19), justificada con la distribución real (mediana
52,7%, banda 50-60% la más liviana del histograma, 45% descartado por
permisivo). **Conteo de páginas bajo el umbral nuevo: 102 de 218
páginas evaluables (47%)** — verificado tres veces de forma
independiente: mi propia medición, la de la auditoría interna de la
ronda C-1/C-2/Y1, y la de la auditoría interna de esta ronda final
(las tres coinciden exactamente). Reconciliación de la lista de
excepciones (5.8/5.8.1): ninguna de las 32 páginas documentadas supera
el 50% — confirmado por medición real sobre páginas reales del corpus,
no por afirmación.

## 5 · C-2: E-19 resuelto, E-20 reclasificado, E-21 nuevo

`docs/visual/auditoria-visual-2026-08-23.md`: E-19 marcado **RESUELTO**
(decisión tomada, umbral en 50%); E-20 **RECLASIFICADO** de "corrección
obligatoria de fase 14" a "criterio de entrada de un futuro rediseño
de paginación" (sin fecha, sin corrección asignada); **E-21** (nuevo):
el modelo una-sección-por-página de `@react-pdf/renderer` (confirmado
en código, `renderers/pdf-v2/document.tsx`, `model.sections.map(...)`)
es la causa estructural común de E-19 y E-20. Texto histórico original
preservado sin editar, con nota de resolución agregada al principio de
cada uno. Conteo final de identificadores: 41 (E-01 a E-21 = 21; C-01 a
C-08 = 8; R-01 a R-12 = 12) — verificado aritméticamente correcto.

## 6 · C-3: dos pasadas en el navegador (decisión humana de Matías)

**Investigación previa** (`docs/fase-14/investigacion-c3.md`, ronda
parcial): tres opciones con costo, sin recomendación — confirmado por
la auditoría interna que el documento no inclina la decisión hacia
ninguna vía. **Decisión de Matías: vía cliente** — dos pasadas en el
navegador, por tener cero incógnitas de arquitectura de servidor y
cero infraestructura nueva; el costo de UX (el botón de descarga tarda
más porque renderiza el PDF dos veces) se consideró aceptable dado que
un documento se genera una vez por prospecto.

**Implementación** (`src/documents/renderers/pdf-v2/paginacion.ts`,
`export-client.ts`):

1. `renderToBuffer` (Node-only) reemplazado por `pdf(...).toBlob()` —
   la MISMA función interna que usan los dos builds de
   `@react-pdf/renderer` (verificado por la auditoría interna leyendo
   el código fuente: `renderToStream` llama `pdf(element).toBuffer()`
   internamente, la misma llamada que `toBlob()` hace antes de envolver
   en `Blob` — bytes idénticos garantizados por construcción, no por
   coincidencia).
2. El worker de `pdfjs` se importa de forma ESTÁTICA
   (`pdfjs-dist/legacy/build/pdf.worker.mjs`) y se asigna a
   `globalThis.pdfjsWorker`, en vez de resolverse con
   `createRequire`/`require.resolve` (Node puro — el bug real que
   encontró el ítem 5 de Fase 14: "Module 'node:module' has been
   externalized"). Mismo principio que `theme/fuentes/registrar-fuentes.ts`
   ya aplicó a las fuentes.
3. La descarga desde el navegador (`export-client.ts`) ahora llama
   `renderPdfV2ConDosPasadas` directo — ya no hay pipeline separado
   "de una pasada" para la interfaz.
4. Bug real encontrado y corregido durante la implementación: `pdfjs`
   transfiere la ownership del `ArrayBuffer` que recibe — pasar el
   buffer sin copiar lo dejaba "detached" para cualquier uso posterior
   (hash, descarga). Corregido con una copia defensiva en
   `textoPorPagina` (restaurando un `new Uint8Array(buffer)` que el
   código original ya tenía y que se había quitado por error al
   simplificar) — encontrado por un test cross-proceso propio antes de
   llegar a la interfaz real, no en producción.

## 7 · C-4: revalidación por flujo real

Repetido el ítem 5 de Fase 14 con el pipeline nuevo: Snake Store y
Titan Web B1 (los mismos dos diagnósticos reales ya guardados), los
tres documentos, los dos perfiles, interruptor en `"v2"`. Ocho PDFs
descargados reales (`interfaz/pdfs-descargados/` del ZIP), sin ningún
error de consola — "Warning: Setting up fake worker." confirma que el
fix del worker funciona, cero rastro de "node:module"/"createRequire"/
"externalized". Propuesta bloqueada correctamente en los dos casos
(sin selección comercial confirmada), mismo mensaje literal que antes
de esta ronda — capturado en pantalla
(`interfaz/titan-web-bloqueo-exportacion-propuesta.jpg`).

## 8 · Y1, Y2, Y3: resultado de las pruebas y de la comparación por hash

- **Y1** (`fase-14-1-y1.test.ts`, 3 tests, sin cambios respecto de la
  ronda anterior — 0 líneas de diff, confirmado por la auditoría
  interna): umbral 50% verificado en la documentación y por medición
  real.
- **Y2** (`fase-14-1-y2-y3.test.ts`, 14 tests): **8 comparaciones
  SHA-256 — todas iguales** — entre `renderDocumentModelV2ToBlob`
  (interfaz) y `renderPdfV2ConDosPasadas` (pipeline) para Snake Store y
  Titan Web B1, diagnóstico y proyección 90 días, pantalla e
  impresión. Para propuesta (bloqueada en los dos casos): 4
  comparaciones confirman que las dos rutas lanzan el mismo mensaje
  literal — no hay bytes que hashear porque no hay PDF, el criterio
  real es "bloquean igual".
- **Y3**: 2 tests confirman que el texto "(CONTINUACIÓN)" (mayúscula,
  por `textTransform`) aparece en el PDF generado por la interfaz para
  mayorista/mixto, proyección 90 días, impresión — los casos que
  realmente ejercitan el mecanismo de dos pasadas (verificado antes de
  escribir la prueba: `intentos > 1`, marcadores reales).
- Evidencia completa en `interfaz/comparacion-hash.txt` del ZIP.

## 9 · Conteo de páginas contra `7d3883a` — sin regresiones

**Identidad byte a byte, no sólo conteo de páginas igual.** Los 54
PDFs regenerados desde un worktree limpio del candidato `6f20fde` son
byte a byte idénticos (`diff -rq`, cero diferencias) a los 54 PDFs de
Fase 14 (`7d3883a`) — confirmado de forma independiente por mí y por
la auditoría interna (que además comparó contra el ZIP ya pusheado de
Fase 14, `velocentum-fase-14-revision.zip`, con el mismo resultado).
Los 54 renders web también resultaron idénticos byte a byte. Dado que
el contenido es idéntico, el conteo de páginas (380 totales, mismo
desglose por caso) es trivialmente idéntico — no hay ninguna
diferencia que explicar.

## 10 · Integración: interruptor y v1

`src/documents/motor-activo.ts`: `MOTOR_DOCUMENTAL_ACTIVO = "v1"` —
**0 líneas de diff** contra `7d3883a`. `build-document.ts` y
`documentos.$id.$slug.tsx` también sin cambios. Ningún archivo de
`renderers/pdf/` ni `renderers/web/` (v1) aparece en el diff completo
de esta ronda. v1 permanece completamente intacto y es la ruta activa
por defecto.

## 11 · Suite, typecheck, build

- Línea base de esta ronda (heredada de Fase 14 + C-1/C-2/Y1, ya
  auditada y pusheada): 805 passed + 1 todo.
- Nuevas de esta ronda final: 14 tests (Y2/Y3, `fase-14-1-y2-y3.test.ts`).
- **Total final: 819 passed + 1 todo** — confirmado por dos auditorías
  internas independientes corriendo la suite completa ellas mismas.
- Typecheck (`npx tsc --noEmit`): limpio.
- Build (`npm run build`): exitoso, `.output/server/wrangler.json`
  generado sin errores (único warning es el de `fontkit`, preexistente
  y ajeno a esta ronda).

## 12 · Auditoría interna, veredicto, push

Dos rondas de auditoría interna de solo lectura en esta fase completa:

1. **Ronda parcial** (C-1/C-2/Y1 únicamente, alcance explícitamente
   reducido por instrucción de Matías), contra HEAD `b9b10d9`:
   APROBADO en una sola pasada, con una observación no bloqueante
   (`fixtures-escenarios-demo.test.ts` técnicamente dentro del diff de
   `src/lib/`, allowlist inocua). Pusheada como `c6c2c9a`.
2. **Ronda final** (alcance completo, C-1 a C-4 y Y1-Y3), contra HEAD
   `6f20fde`: **APROBADO**, con una corrección no bloqueante señalada
   (este mismo handoff, que en el candidato auditado seguía en su
   versión "parcial" desactualizada) — corregida acá, en este commit,
   sin volver a auditar porque el cambio es puramente documental y no
   toca ningún criterio de aceptación numerado (los 8 ya cumplían con
   evidencia verificada independientemente por el auditor: código
   fuente de `@react-pdf/renderer` leído línea por línea, 54 PDFs
   regenerados y comparados por `diff -rq` contra dos fuentes
   independientes, suite corrida por el propio auditor).

Push: hecho por mí (el agente principal), nunca por el auditor,
únicamente después de este veredicto APROBADO. HEAD local y remoto
verificados coincidentes tras el push.

**Restricciones finales, confirmadas cumplidas:** el reemplazo sigue
inactivo (`"v1"`), v1 no fue eliminado, no se tocó base de datos,
migraciones, secretos ni producción, no se integró a `main`, no se
publicó, no se desplegó, no se avanzó a staging, y no se amplió el
alcance más allá de lo pedido. Fin de Fase 14.1.
