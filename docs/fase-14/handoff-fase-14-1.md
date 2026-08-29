# Handoff parcial — Fase 14.1 (ronda correctiva)

Prompt original: `docs/prompts/fase-14-1.md` (guardado verbatim,
ejecutado desde `7d3883a`).

**Este handoff es PARCIAL a propósito, por instrucción explícita de
Matías**: C-1, C-2 e Y1 están cerrados y auditados; C-3, C-4, Y2 e Y3
quedan pendientes, bloqueados por una decisión de arquitectura que
Matías necesita confirmar (dónde corre realmente la app en
producción) y que él mismo pidió dejar pendiente.

## 1 · Rama, HEAD y commit candidato

- Rama: `feat/noche-continuacion`.
- Commit candidato auditado: `b9b10d9` (padre: `7d3883a`, el HEAD ya
  aprobado y pusheado de Fase 14).
- Este handoff se agrega como commit nuevo, encima de `b9b10d9`.

## 2 · Qué está cerrado (C-1, C-2, Y1) — auditado, APROBADO

**C-1 — umbral de ocupación a 50%.**
`docs/visual/contrato-composicion-v2.md` sección 5.1: el umbral
general pasa de "≥70% pantalla / ≥65% impresión" a **≥50% único para
ambos perfiles** — decisión humana de Matías (vía a de E-19),
justificada (mediana real 52,7%, banda 50-60% la más liviana del
histograma, 45% descartado por permisivo). Verificado dos veces contra
artefactos reales generados desde un worktree limpio del candidato: mi
propia medición (218 páginas evaluables, 102 bajo 50%, 47%) y la
medición independiente de la auditoría interna (muestra de 80 páginas
sobre los casos "confirmada" y "4-roas-bueno-margen-negativo",
reproduce las cifras citadas en la documentación). La lista de
excepciones (5.8/5.8.1) se reconcilió: **ninguna de las 32 páginas de
excepción documentadas (16 de E-20 + 16 de "Alcance"/services)
supera el 50% nuevo** — confirmado por medición real, no por
afirmación, y las 32 claves fueron verificadas como páginas reales del
corpus (no strings inventados), según la instrumentación de cobertura
que corrió la auditoría.

**C-2 — reclasificación E-19/E-20 + hallazgo nuevo E-21.**
`docs/visual/auditoria-visual-2026-08-23.md`: E-19 pasa a **RESUELTO**
(decisión tomada, umbral en 50%); E-20 pasa de "corrección obligatoria
de fase 14" a **RECLASIFICADO** como "criterio de entrada de un futuro
rediseño de paginación" (sin fecha, sin corrección asignada); se
registra **E-21** (nuevo): el modelo una-sección-por-página de
`@react-pdf/renderer` (confirmado en código,
`renderers/pdf-v2/document.tsx`, `model.sections.map(...)`) es la
causa estructural común de E-19 y E-20 — no una tercera categoría
independiente. El texto histórico original de E-19/E-20 se preservó
sin editar (mismo criterio de no-reescritura que ya usa el documento),
con una nota de resolución agregada al principio de cada uno. Conteo
final de identificadores: 41 (E-01 a E-21 = 21; C-01 a C-08 = 8; R-01 a
R-12 = 12) — verificado aritméticamente correcto.

**Y1 — test que verifica el umbral y la reconciliación.**
`src/documents/fase-14-1-y1.test.ts` (nuevo, 3 tests): confirma que la
documentación declara 50%, confirma que E-19/E-20/E-21 están
registrados como corresponde, y mide ocupación real (pdfjs, mismo
método declarado) sobre las 32 páginas de excepción para confirmar que
ninguna gradúa del 50%. La auditoría interna verificó que el test no
es tautológico (si el umbral interno bajara a 0, el test fallaría) y
que las 32 claves corresponden a páginas reales.

**Suite, typecheck, build:** 805 passed + 1 todo (802 de Fase 14 + 3
de Y1, ninguna prueba existente relajada — el único test pre-existente
tocado, `fixtures-escenarios-demo.test.ts`, sólo agrega una entrada de
allowlist, mismo patrón ya usado y ya señalado como desviación no
bloqueante en la ronda anterior). Typecheck limpio. Build exitoso.

**Auditoría interna:** corrida contra el HEAD candidato `b9b10d9`, con
alcance explícitamente reducido a C-1/C-2/Y1 (C-3/C-4/Y2/Y3 excluidos
de la evaluación, sólo confirmados como "no fingidos resueltos" —
`motor-activo.ts` sigue en `"v1"`, ninguna función de servidor de PDF
nueva en el diff). **Veredicto: APROBADO**, una sola ronda, sin
correcciones necesarias.

## 3 · Qué queda pendiente (C-3, C-4, Y2, Y3) y por qué

**C-3 — mover la descarga de PDF a una función de servidor: NO
implementado, por decisión explícita de Matías** ("dejámelo
pendiente, necesito confirmar dónde corre la app en producción y no lo
tengo ahora"). Investigación completa, sin implementar nada, en
`docs/fase-14/investigacion-c3.md`:

- El pipeline de dos pasadas no depende del filesystem en sí — la
  atadura real es que `paginacion.ts` resuelve el script del worker de
  `pdfjs-dist` con `require.resolve` (Node puro). El mismo proyecto ya
  resolvió un problema idéntico con las fuentes (`registrar-fuentes.ts`:
  fuentes embebidas como data URI en vez de leídas por ruta, porque "el
  entorno de despliegue serverless/edge de este proyecto" no tiene
  filesystem en runtime — cita textual del propio comentario del
  código, no una inferencia mía). El mismo patrón (import estático del
  worker) destraba el problema, sea cual sea la vía elegida.
- Tres opciones reales, con costo, sin recomendación (tabla completa
  en la sección 4 del documento de investigación): (1) servidor
  (Cloudflare Workers, confirmado como target de producción por el
  propio build — `wrangler.json` generado) — el más directo si
  funciona, pero con incógnitas (límites de CPU, ramas Node-only de
  `pdfjs-dist`) que no se pueden verificar sin desplegar, prohibido
  esta ronda; (2) servicio externo con Node real — sortea las
  incógnitas de Workers, pero es infraestructura nueva a mantener,
  costo alto; (3) cliente (navegador) — hacer las dos pasadas en el
  browser, mismo patrón ya probado hoy con una pasada, sin ninguna
  pregunta de arquitectura de servidor, costo de UX (más lento) no de
  arquitectura.
- Ni v1 ni v2 generan PDF del lado del servidor hoy — confirmado por
  grep completo de `src/routes/` y `src/lib/*.functions.ts`. C-3 no es
  "mover algo que ya funciona en el servidor" — es hacerlo funcionar
  ahí por primera vez.

**C-4 (revalidar por flujo real con hash) — pendiente, depende de
C-3.** No se puede repetir la validación del ítem 5 con comparación
por hash hasta que exista una descarga server-side con la que
comparar.

**Y2 (hash PDF interfaz vs pipeline) — pendiente, depende de C-3.** Sin
descarga server-side, no hay nada que hashear contra el pipeline de
dos pasadas.

**Y3 (marca de continuación en PDFs de la interfaz) — pendiente,
depende de C-3.** Mismo motivo: la interfaz sigue descargando con el
pipeline de una sola pasada (`export-client.ts`, sin cambios en esta
ronda), así que no hay manera de verificar la marca de continuación
"también en los PDFs generados por el camino de la interfaz" sin
primero resolver C-3.

**El interruptor sigue en `"v1"`, inactivo.** v1 intacto. No se avanzó
a `main`, no se publicó, no se desplegó, no se avanzó a staging.

## 4 · Próximo paso

Cuando Matías confirme dónde corre la app en producción (Cloudflare
Workers vía el `wrangler.json` que genera el build, u otra cosa), la
sección 4 de `docs/fase-14/investigacion-c3.md` da las tres opciones
con su costo para elegir una y recién ahí implementar C-3, seguido de
C-4/Y2/Y3 y una ronda de auditoría final que si corresponde cierre
Fase 14.1 por completo.
