# Inventario de componentes (bloques de documento)

Verificado contra `feat/noche-continuacion`, HEAD `e5080e20b2be491c3f45ad9846fc07441e68c103`.
Fuente de tipos: `src/documents/templates/velocentum-v1/types.ts` (`DocumentBlock`,
14 variantes). Cada bloque tiene UN constructor puro en
`src/documents/templates/velocentum-v1/blocks.ts` (o directamente en
`shared.ts` para los de estructura fija), UN renderer PDF
(`src/documents/renderers/pdf/document.tsx`, función `renderBlock` +
componentes de página dedicados) y UN renderer web
(`src/documents/renderers/web/document-renderer.tsx`, un componente
`XBlock` por tipo).

**Plantillas:** `diagnostico.ts` (kind `diagnostico`), `proyeccion-90d.ts`
(kind `proyeccion_90d`), `propuesta.ts` (kind `propuesta`), `composicion.ts`
(kind `proyeccion_propuesta`, combina proyección + propuesta bajo una sola
portada).

**Perfiles:** sólo existen para el renderer PDF (`PdfProfile = "pantalla" |
"impresion"`, `src/documents/renderers/pdf/document.tsx:36`). El renderer
web (`DocumentWebRendererProps`, `src/documents/renderers/web/document-renderer.tsx:12-15`)
NO tiene ningún parámetro de perfil: siempre renderiza una única
composición. Todo bloque que se muestra en PDF se muestra en AMBOS
perfiles (`pantalla` e `impresion`) — ningún tipo de bloque es exclusivo de
un perfil; lo que cambia por perfil son los tokens de tamaño/columnas
(`PROFILES`, `document.tsx:99-142`), no qué bloques aparecen.

## Tabla de bloques

| Bloque | Constructor | PDF (línea) | Web (línea) | Plantillas que lo usan | Campos del modelo que consume |
|---|---|---|---|---|---|
| `cover` | `shared.ts:coverSection` (32-52) | `document.tsx` `CoverPage` (774-801), `case "cover"` en `renderBlock` devuelve `null` (750) — se renderiza aparte, no por `renderBlock` | `document-renderer.tsx` `CoverBlock` (111-128) | diagnostico, proyeccion-90d, propuesta, composicion (las cuatro) | `context.cliente.nombre`, `context.diagnostico.fecha`, título/subtítulo fijos por plantilla |
| `coverage` | `shared.ts:coverageSection` (54-72) | `case "coverage"` (487-510) | `CoverageBlock` (130-152) | diagnostico, proyeccion-90d (propuesta y composicion NO la usan) | `context.cobertura.{general,canales,productos,confianza}` |
| `metric-grid` | `blocks.ts:buildMetricGrid` (56-78) | `case "metric-grid"` (511-522) | `MetricGridBlock` (154-170) | diagnostico, proyeccion-90d (propuesta y composicion NO) | `context.actual.{facturacion,ticket,pedidos,margenTotal,margenMuestra,inversionTotal,merTienda,merMarketplace,roasProductAds}` (9 métricas fijas, `METRIC_DEFINITIONS`, `blocks.ts:12-26`) |
| `shipping` | `blocks.ts:buildShipping` (80-125) | `case "shipping"` (523-529) | `ShippingBlock` (172-184) | diagnostico, proyeccion-90d | `context.envio` (política + costo neto) |
| `findings` | `blocks.ts:buildFindings` (127-158) | `case "findings"` (530-549) | `FindingsBlock` (186-218) | diagnostico, propuesta, composicion — **las tres**, todas sobre `context.hallazgos` sin distinción (ver E-08 en la matriz) | `context.hallazgos[]` completo (id, titulo, capa, prioridad, confianza, magnitud, monto) |
| `scenarios` | `blocks.ts:buildScenarios` (160-239) | `case "scenarios"` (582-663) | `ScenariosBlock` (266-402) | proyeccion-90d, composicion (vía `projection.sections`) | `context.escenarios90d[]` (3 escenarios, cada uno con 3 magnitudes × {acumulado90d, ritmoMensualDia90}, mensual[3], palancas[], supuestos[], restricciones[]) |
| `commercial-summary` | `blocks.ts:buildCommercialSummary` (241-281) | `case "commercial-summary"` (550-581) | `CommercialSummaryBlock` (228-264) | proyeccion-90d, propuesta (composicion NO — usa las secciones de `projection.sections` que sí la incluyen) | `context.resumenComercial` (cifraPrincipal, rango, dispersión, redacción) |
| `roadmap` | `shared.ts:roadmapSection` (169-177) | `case "roadmap"` (664-680) | `RoadmapBlock` (404-423) | proyeccion-90d, propuesta | `context.roadmap[]` — **siempre vacío hoy**: `build-context.ts` fija `roadmap: []` incondicional, así que este bloque nunca produce contenido en ningún documento generado desde el motor real (ver E-18, agregado al cierre del bloque en `docs/visual/auditoria-visual-2026-08-23.md` sección d) |
| `services` | inline en `propuesta.ts`/`composicion.ts` (no hay constructor propio en `blocks.ts`) | `case "services"` (681-691) | `ServicesBlock` (425-438) | propuesta, composicion | `context.servicios[]` (deduplicado desde `hallazgo.servicio` en `build-context.ts:hallazgosDocumento`, texto libre — ver V2/C-03) |
| `commercial-offer` | `blocks.ts:buildCommercialOffer` (283-319) | `case "commercial-offer"` (692-721) | `CommercialOfferBlock` (475-499) | propuesta, composicion | `context.comercial` (escalera de niveles, decisión comercial 7) |
| `restrictions` | `shared.ts:restrictionSection` / `riskSection` / `missingDataSection` / `scalingConditionsSection` (84-138) — cuatro constructores distintos, mismo tipo de bloque | `case "restrictions"` (722-735) | `RestrictionsBlock` (501-522) | diagnostico (risk + missing, dos secciones separadas), proyeccion-90d (restrictionSection genérica + scalingConditions), propuesta (restrictionSection genérica), composicion (restrictionSection genérica, id renombrado a `proposal-restrictions`) | `context.restricciones[]` + restricciones agregadas por cada bloque (`metrics.restrictions`, `findings.restrictions`, etc., vía `mergeRestrictions`) |
| `methodology` | `shared.ts:methodologySection` (179-188) | `case "methodology"` (736-747) | `MethodologyBlock` (524-538) | diagnostico, proyeccion-90d | `context.metodologia[]` |
| `transition` | `shared.ts:transitionSection` (74-82) | `TransitionPage` dedicada (803-823), `case "transition"` en `renderBlock` devuelve `null` (748) | `DocumentBlockView` inline (567-572) | diagnostico, proyeccion-90d, propuesta, composicion | `label` fijo por plantilla |
| `next-step` | `shared.ts:nextStepSection` (159-167) o inline en `propuesta.ts`/`composicion.ts` | `TransitionPage` dedicada (803-823, comparte componente con `transition`), `case "next-step"` en `renderBlock` devuelve `null` (749) | `DocumentBlockView` inline (573-579) | diagnostico, proyeccion-90d, propuesta, composicion | `label` fijo por plantilla |

## Bloques compartidos entre los tres documentos — causa raíz de E-08

`findings` es el único bloque que aparece en **diagnóstico, propuesta y
composicion** simultáneamente, y en los tres casos el constructor es el
mismo (`buildFindings(context)`, `blocks.ts:127`) sobre el mismo
`context.hallazgos` — sin ningún parámetro que diferencie "esto es para
justificar un diagnóstico" de "esto es para justificar una propuesta". Los
tres templates llaman literalmente la misma función con el mismo argumento:

- `diagnostico.ts:38` — `const findings = buildFindings(context);`
- `propuesta.ts:13` — `const findings = buildFindings(context);`
- `composicion.ts:19` — `const findings = buildFindings(context);`

Esto es estructural, no un descuido de una sola plantilla: **cualquier
propuesta o composición va a repetir exactamente los mismos hallazgos, en
el mismo orden y con los mismos montos, que el diagnóstico del mismo
diagnóstico**, porque no existe ningún mecanismo de selección/resumen entre
capas. Ver E-08 en la matriz de hallazgos.

`commercial-summary` es compartido entre proyección y propuesta (ambos
llaman `buildCommercialSummary(context)` sobre `context.resumenComercial`),
pero eso es intencional y ya documentado (`resumen-comercial.ts:1-20`): es
la MISMA cifra dominante en ambos documentos por diseño, no un artefacto.

`restrictions` se comparte de forma parcial: el array de origen
(`context.restricciones` + lo agregado por cada bloque vía
`mergeRestrictions`) es el mismo, pero cada plantilla lo particiona
distinto (diagnóstico separa riesgos/faltantes; proyección agrega
condiciones para escalar; composicion renombra el id de sección) — no
produce duplicación visual idéntica entre documentos, a diferencia de
`findings`.
