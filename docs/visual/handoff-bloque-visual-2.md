# Handoff — Bloque Visual 2: Prototipo funcional v2 (s1 + s4)

Informe de cierre para revisión humana y auditoría externa. Rama `feat/noche-continuacion`,
generado el 2026-08-23. Todos los datos de este documento fueron verificados de forma
independiente (no sólo reportados por el agente que ejecutó la implementación) antes de
escribirse acá: se corrió `git status`, `git rev-parse`, `git diff --stat`, `git log`,
`gh pr list` y `npm test` directamente contra el estado real del repositorio al momento de
escribir este documento.

## 1 · Rama y HEAD completo

- Rama actual: `feat/noche-continuacion`
- HEAD completo local: `f8db5608a538c6a3db2194c9fd30948d97d5b25e`
- HEAD completo remoto (`origin/feat/noche-continuacion`): `f8db5608a538c6a3db2194c9fd30948d97d5b25e`
- Coinciden exactamente.

## 2 · Salida de `git status --short`

```
(vacío — árbol de trabajo limpio)
```

## 3 · `git diff --stat` contra `57aa8795623bf110a5b2dc6747b2046e128f8596`

21 archivos modificados, 4352 inserciones(+), 4 eliminaciones(-):

```
 docs/visual/auditoria-visual-2026-08-23.md                  |  16 +-
 docs/visual/contrato-composicion-v2.md                      | 407 +++++++++
 src/documents/renderers/pdf-v2/document.tsx                 | 989 +++++++++++++++++++++
 src/documents/renderers/web-v2/document-renderer.css        | 425 +++++++++
 src/documents/renderers/web-v2/document-renderer.tsx        | 629 +++++++++++++
 src/documents/semantica-v2/balanceo.test.ts                 |  40 +
 src/documents/semantica-v2/balanceo.ts                      |  44 +
 src/documents/semantica-v2/estado.test.ts                   |  73 ++
 src/documents/semantica-v2/estado.ts                        |  53 ++
 src/documents/semantica-v2/etiquetas.ts                     |  65 ++
 src/documents/semantica-v2/formato.test.ts                  |  34 +
 src/documents/semantica-v2/formato.ts                       |  41 +
 src/documents/templates/velocentum-v2/blocks.ts              | 312 +++++++
 src/documents/templates/velocentum-v2/contrato-v2.test.ts    | 306 +++++++
 src/documents/templates/velocentum-v2/diagnostico.ts         |  57 ++
 src/documents/templates/velocentum-v2/index.ts                |   6 +
 src/documents/templates/velocentum-v2/propuesta.ts            |  74 ++
 src/documents/templates/velocentum-v2/proyeccion-90d.ts       |  76 ++
 src/documents/templates/velocentum-v2/shared.ts                | 139 +++
 src/documents/templates/velocentum-v2/test-fixtures.ts         | 394 ++++++++
 src/documents/templates/velocentum-v2/types.ts                 | 176 ++++
 21 files changed, 4352 insertions(+), 4 deletions(-)
```

## 4 · Lista de archivos y confirmación de aislamiento

**Modificado (1):**
- `docs/visual/auditoria-visual-2026-08-23.md` — únicamente la marca histórico/vigente de
  C-01 (ver sección 5), aplicada en el commit `8851e0f`, previo a este cierre.

**Nuevos (20):**
- `docs/visual/contrato-composicion-v2.md`
- `src/documents/renderers/pdf-v2/document.tsx`
- `src/documents/renderers/web-v2/document-renderer.tsx`
- `src/documents/renderers/web-v2/document-renderer.css`
- `src/documents/semantica-v2/balanceo.ts` + `balanceo.test.ts`
- `src/documents/semantica-v2/estado.ts` + `estado.test.ts`
- `src/documents/semantica-v2/etiquetas.ts`
- `src/documents/semantica-v2/formato.ts` + `formato.test.ts`
- `src/documents/templates/velocentum-v2/blocks.ts`
- `src/documents/templates/velocentum-v2/contrato-v2.test.ts`
- `src/documents/templates/velocentum-v2/diagnostico.ts`
- `src/documents/templates/velocentum-v2/index.ts`
- `src/documents/templates/velocentum-v2/propuesta.ts`
- `src/documents/templates/velocentum-v2/proyeccion-90d.ts`
- `src/documents/templates/velocentum-v2/shared.ts`
- `src/documents/templates/velocentum-v2/test-fixtures.ts`
- `src/documents/templates/velocentum-v2/types.ts`

**Confirmación de aislamiento** (verificada por `git diff --stat` — ningún archivo de estas
rutas aparece en el diff — y por dos rondas de auditoría interna de solo lectura, sección 12):

- **v1** (`src/documents/templates/velocentum-v1/`, `src/documents/renderers/pdf/`,
  `src/documents/renderers/web/`): **no modificado**.
- **Dominio** (`src/documents/domain/`, incluido `types.ts`): **no modificado**.
- **`src/lib/`** (completo, incluido `fixtures-escenarios-demo.ts`): **no modificado**.
- **Fixtures canónicos**: **no modificados**. v2 usa fixtures propias
  (`templates/velocentum-v2/test-fixtures.ts`), exclusivas de su propia suite de pruebas —
  el prompt original de este bloque autoriza explícitamente construir un contexto de prueba
  propio dentro del espacio v2, sin tocar las fixtures demo del motor real.
- **Pruebas preexistentes**: **no modificadas** — ningún `.test.ts`/`.test.tsx` fuera de las
  carpetas `*-v2/` nuevas aparece en el diff.
- **Snapshots**: no existen snapshots en este repositorio; ninguno pudo verse afectado.

## 5 · Resultado del criterio de entrada C-01 y commit relacionado

El commit `8851e0f49baaf7cff8b74609cb996018f6aa094e` (paso 0.3, previo a la implementación de
este cierre) ya había marcado sin ambigüedad la versión original de C-01 en
`docs/visual/auditoria-visual-2026-08-23.md` como `⚠ HISTÓRICO / SUPERADO — no es la versión
vigente` (línea 257) y la reformulación de cierre del Bloque Visual 1 como
`✅ VERSIÓN VIGENTE` (línea 429). Verificado por lectura directa: la distinción es clara para
un lector nuevo. No fue necesaria ninguna corrección adicional en este cierre.

## 6 · Reproducción de E-01 y E-02 en v1 (línea de base "antes")

Generados los 12 PDFs con v1 tal cual estaba (sin ningún cambio de código), rasterizados
página por página e inspeccionados directamente.

**E-01 — solapamiento en tabla de escenarios: REPRODUCIDO**
- `1-marketplace-fuerte-tienda-floja`, `proyeccion_90d`, perfil **pantalla**: páginas 6, 7 y 8
  (una tarjeta de escenario por página; números superpuestos, p. ej. "$5.761.835" solapado con
  "$15.488.804"; encabezados de columna concatenados sin separación, p. ej.
  "CONTRIBUCIÓNFACT. PROYECTADAINCREMENTAL").
- Mismo escenario, perfil **impresión**: páginas 6 y 7 (mismo patrón de solapamiento numérico,
  ancho de columna insuficiente en A4).
- `4-roas-bueno-margen-negativo`: **NO reproducido** en ningún perfil. Causa: sin datos de
  funnel, sus tres escenarios no generan tabla mensual (`mensual: []`) ni palancas
  (`palancas: []`), las tarjetas quedan cortas y las tres entran en la grilla sin acercarse al
  límite de una página.
- **Causa real**: grilla de 3 columnas con `wrap={false}` en cada tarjeta de escenario
  (`pdf/document.tsx`); cuando el contenido de una tarjeta (tabla mensual de 3 meses + hasta 6
  palancas + restricciones) supera el alto disponible de página, `@react-pdf/renderer` no
  puede partirla y la fuerza en su propia página, produciendo el solapamiento visible.

**E-02 — página con encabezado y cuerpo vacío: REPRODUCIDO, un solo caso**
- `1-marketplace-fuerte-tienda-floja`, `proyeccion_90d`, perfil **pantalla únicamente**: página
  9 de 10 — encabezado "ESCENARIOS / Qué puede ocurrir en 90 días, mes a mes" repetido, cuerpo
  completamente vacío.
- No reproducido en el mismo documento perfil impresión (8 páginas totales, sin página vacía),
  ni en s4 en ningún perfil.
- **Causa real**: efecto colateral de cómo `@react-pdf/renderer` resuelve la paginación de un
  nodo `wrap={false}` más alto que el área disponible — al forzar cada tarjeta larga a su
  propia página, deja además, específicamente en el perfil pantalla, una página residual con
  sólo el encabezado repetido.

Evidencia conservada: 12 rásters completos de v1 (91 páginas), ver sección de rutas más abajo.

## 7 · Ruta y resumen del contrato de composición v2

Ruta: `docs/visual/contrato-composicion-v2.md` (407 líneas).

Resumen:
- **Sección 0**: qué decisiones NO resuelve (1, 2, 3, 4, 6 — quedan explícitamente pendientes)
  y qué sí resuelve (decisión 5, unificación de la capa semántica).
- **Sección 1 — capa semántica compartida**: `estado.ts` (texto de estado con copy D4 literal
  + motivo real, nunca "Sin datos"), `formato.ts` (formato numérico único: money sin
  decimales, percent 1 decimal fijo, ratio con sufijo "×", number sin decimales),
  `etiquetas.ts` (traducciones centralizadas de capa/prioridad/confianza/magnitud),
  `balanceo.ts` (grillas sin filas huérfanas, algoritmo documentado y testeado).
- **Sección 2 — composición por perfil**: escala tipográfica de 8 roles × 2 perfiles (R-03);
  grilla y balanceo (R-01/R-02); ancho mínimo de columna en tabla mensual (D2/R-12); tarjetas
  de escenario a ancho completo cuando su contenido es "largo" (R-11, ataca E-01/E-02 de
  raíz); palancas agrupadas por magnitud con período explícito (E-03); severidad con
  ícono+color+texto (E-11); retenciones agrupadas por motivo real (E-06); tratamiento visual
  distinto para el hallazgo de margen negativo sin copy cualitativo nuevo (E-10); nota de
  supuestos resuelta en la misma composición (E-13); numeración 01/02/03 (R-04); portada con
  degradado (R-05); wordmark único en portada y pie (R-06); máximo una transición por
  documento (R-08); bloque de comparación entre canales (R-10); bloque puente
  diagnóstico↔propuesta (C-07); orden de hallazgos por prioridad y monto (E-12); excepción
  acotada de `findings` por variante diagnóstico/propuesta (E-08/C-07).
- **Sección 3**: tipos v2 (`ValorV2` preserva el `ValorPublicable` completo, a diferencia del
  `PublishedNumber` recortado de v1).
- **Sección 4**: mecanismo de verificación de cada regla.

## 8 · Conteo de pruebas, typecheck y build

- Pruebas originales (preexistentes, sin modificar): **596** (595 + 1 todo).
- Pruebas nuevas de v2: **47**, en 4 archivos —
  `semantica-v2/balanceo.test.ts` (7), `semantica-v2/formato.test.ts` (6),
  `semantica-v2/estado.test.ts` (4), `templates/velocentum-v2/contrato-v2.test.ts` (30,
  incluye `it.each` sobre las 12 combinaciones escenario×documento×perfil).
- **Total verificado de forma independiente al escribir este informe**:
  `npm test` → **642 passed | 1 todo (643 total)**, 46 archivos, todos en verde.
  (642 − 47 = 595, cuadra exactamente con el conteo original.)
- **Typecheck** (`npm run typecheck`): limpio, sin errores.
- **Build** (`npm run build`): exitoso. Únicos warnings: de `@react-pdf/font`/`fontkit` sobre
  imports de Node no disponibles en el bundle de browser — preexistentes, no relacionados con
  este bloque.
- Ninguna expectativa, snapshot ni prueba preexistente fue modificada (confirmado por diff).

## 9 · Estado individual de cada hallazgo en alcance

| ID | Estado | Evidencia / motivo |
|---|---|---|
| E-01 | Resuelto | Tarjetas largas a ancho completo elimina el solapamiento verificado en 12/12 PDFs v2 rasterizados e inspeccionados |
| E-02 | Resuelto | Misma corrección de causa raíz (elimina el `wrap={false}` forzado en tarjetas largas); sin páginas vacías en 12/12 PDFs v2 |
| E-03 | Resuelto | Palancas agrupadas por magnitud (`etiquetas.ts`) con período explícito ("ritmo mensual al día 90") en cada monto |
| E-04 (mitad renderer) | Resuelto | `textoEstadoV2` nunca colapsa a "Sin datos"; verificado con grep sobre los 12 PDF + 6 HTML v2, cero coincidencias |
| E-06 | Resuelto | Restricciones agrupadas por motivo textual real (`buildRestrictionsGroupedV2`), no por combinación cartesiana magnitud×período×escenario |
| E-10 | Resuelto (alcance acotado) | Tarjeta de margen negativo con tratamiento visual distinto (borde/fondo, ícono, sin badge genérico), sin inventar copy de negocio nuevo — la decisión pendiente 3 (tratamiento cualitativo) sigue explícitamente abierta |
| E-11 | Resuelto | Severidad con ícono (▲/●/▽) + color + texto en PDF y web — nunca sólo color |
| E-12 | Resuelto | Hallazgos ordenados por prioridad y luego monto descendente, con test dedicado en `contrato-v2.test.ts` |
| E-13 | Resuelto | Toda marca † tiene su nota de supuestos en la misma composición, en ambos renderers; se detectó y corrigió un gap real (resumen comercial de la propuesta llevaba † sin nota resuelta) antes de cerrar |
| E-14 | Resuelto | Formato numérico único (`formato.ts`) consumido por ambos renderers — percent siempre 1 decimal, sin la divergencia 1-vs-2-decimales de v1 |
| E-15 | Resuelto | Etiquetas de capa/prioridad/confianza/magnitud centralizadas en `etiquetas.ts`, sin texto crudo en ningún renderer |
| E-17 | Resuelto (dentro del alcance de este bloque) | Capa semántica compartida implementada (decisión 5); verificada con test automatizado de paridad + verificación cruzada manual de 4 valores concretos entre PDF y web |
| C-01 (residual) | Resuelto con reserva documentada | Escala tipográfica completa y ancho mínimo de columna resueltos; la repetición de encabezado de tabla al partirse entre páginas no tiene garantía de código — un intento con la prop `fixed` de `@react-pdf/renderer` produjo un bug real (contenido de tarjeta renderizado vacío) y se revirtió a `wrap={false}` por fila, que garantiza que ninguna fila se corta a la mitad pero no repite el encabezado si la tabla llega a partirse; en los 12 PDFs generados esto nunca se manifestó |
| C-07 | Resuelto | Bloque puente (`bridge-note`) conecta hallazgos de capa "servicio" con la contribución proyectada, sólo cuando ambos son calculables — nunca una frase sin datos detrás |
| R-01 | Resuelto con residuo documentado | Secciones de una sola pieza reagrupadas con contenido relacionado; residuo aceptado: en perfil pantalla, el caso multicanal denso (comparación de canales + 9 métricas) deja 1-2 filas de métrica en una página de continuación con ~20-25% de ocupación; no se manifiesta en perfil impresión (A4); confirmado por la auditoría en su segunda ronda |
| R-02 | Resuelto | `filasBalanceadas` evita filas huérfanas, cubierto por 7 pruebas unitarias directas con distintos valores de n |
| R-03 | Resuelto | Escala tipográfica de 8 roles, valores distintos por perfil, mínimo de 7pt verificado por test |
| R-04 | Resuelto | Numeración 01/02/03 en hallazgos, roadmap y servicios, en ambos renderers |
| R-05 | Resuelto | Portada con degradado real (`LinearGradient`/`Svg` en PDF, `linear-gradient()` en CSS web), no bandas sólidas superpuestas |
| R-06 | Resuelto | Wordmark "Velocentum" en caja mixta, mismo tratamiento en portada y pie, en ambos renderers y perfiles |
| R-08 | Resuelto | Máximo 1 sección "transition" por documento en las 3 plantillas v2 |
| R-10 | Resuelto | Bloque `channel-comparison`, sólo cuando ambos MER (tienda y marketplace) son calculables simultáneamente — presente en s1, ausente en s4 (comportamiento esperado) |
| R-11 | Resuelto | Misma corrección que E-01/E-02: tarjetas largas a ancho completo, densidad mejorada en pantalla (16:9) |
| R-12 | Resuelto | Tabla mensual con las 3 magnitudes rotuladas por separado, nunca bajo la misma etiqueta — verificado por test |

## 10 · Paridad semántica PDF ↔ web

- **Automatizada**: `contrato-v2.test.ts` construye un modelo real (`proyeccion_90d`, fixture
  multicanal), renderiza a PDF (`renderToBuffer` + extracción de texto real vía `pdfjs-dist`,
  no un match sobre el buffer crudo) y a HTML (`renderToStaticMarkup`), y verifica que la
  cifra de contribución incremental del escenario conservador aparece formateada idéntica en
  ambos. Se agregó además un caso de estrés (monto de 10 dígitos) sobre el mismo mecanismo.
- **Manual, sobre los 12 PDFs y 6 HTMLs reales**: verificación cruzada de 4 valores concretos —
  un monto de hallazgo (`$ 1.769.692`), dos ratios de comparación de canales (`10,0×` /
  `35,0×`), un porcentaje de margen (`-7,0%`) y el texto completo de un estado retenido
  ("No se muestra hasta validar: Faltan ventas atribuidas o inversión de Product Ads.") —
  los cinco idénticos carácter por carácter entre PDF y web.
- **Cantidad de valores comparados**: 1 caso automatizado + 1 caso de estrés automatizado + 4
  valores manuales sobre los artefactos reales.
- **Divergencias residuales**: **ninguna**. Es estructural, no casualidad: ambos renderers
  consumen exclusivamente `semantica-v2/` (`textoEstadoV2`, `formatearNumero`, `etiquetas.ts`)
  — ningún renderer define texto de estado o formato por su cuenta, confirmado también por la
  auditoría interna en ambas rondas.

## 11 · Evaluación individual de los 20 criterios de aceptación

**Funcionales**
1. APROBADO — 596 pruebas originales pasan sin haber sido modificadas (642−47=595, cuadra).
2. APROBADO — typecheck limpio.
3. APROBADO — build exitoso.
4. APROBADO — cero archivos de v1 en el diff.
5. APROBADO — cero archivos de `src/lib/`, dominio, migraciones, base o producción en el diff.
6. APROBADO — las 47 pruebas nuevas verifican reglas reales del contrato (contra modelo, PDF y
   HTML realmente renderizados), no describen el resultado obtenido.

**Visuales** (sobre los 12 PDFs de v2, ambos perfiles y escenarios, confirmado por 2 rondas de
auditoría independiente)
7. APROBADO — sin texto solapado/cortado/fuera de página en ninguna muestra.
8. APROBADO — sin páginas con encabezado y cuerpo vacío.
9. APROBADO CON RESERVA — encabezado no se corta a mitad de fila; la repetición de encabezado
   al continuar entre páginas no tiene garantía de código (ver ítem C-01, sección 9) — nunca se
   manifestó en los 12 PDFs generados, pero no se puede afirmar cumplimiento sin reserva sobre
   un caso que no llegó a ejercitarse.
10. APROBADO — sin tinta plena excesiva en A4 (verificado por inspección visual; el contrato
    aclara explícitamente que no hay medición automática de píxeles).
11. APROBADO — contraste suficiente, incluida una corrección de ronda 1 de auditoría (texto
    sobre fondo oscuro en sección de cobertura reagrupada), confirmada en ronda 2.
12. APROBADO — alineaciones, márgenes y padding consistentes dentro de cada perfil.
13. APROBADO — estados se entienden sin depender del color (ícono + texto en severidad; copy
    D4 completo en retenido/no_aplica).
14. APROBADO — retenido/no_aplica con presentación propia, ninguno se muestra como cero.
15. APROBADO — nombres largos y montos grandes no rompen la composición; verificado con test de
    estrés dedicado (nombre de cliente de 106 caracteres, montos de 9-10 dígitos), en PDF
    (ambos perfiles) y web.
16. APROBADO — los tres documentos comparten sistema visual y se distinguen por eyebrow/título.

**De paridad**
17. APROBADO — verificado automatizada y manualmente (sección 10), cero divergencias.

**De disciplina**
18. APROBADO — ningún hallazgo fuera de alcance fue modificado (confirmado por 2 rondas de
    auditoría independiente y por `git diff --stat`).
19. APROBADO — ninguna decisión pendiente 1/2/3/4/6 fue resuelta de oficio (documentado
    explícitamente en `contrato-composicion-v2.md` sección 0, verificado en código).
20. APROBADO — ninguna cifra/servicio/precio/resultado inventado; todos los montos provienen de
    `DocumentContextV1` construido desde fixtures reales o de `test-fixtures.ts` propio de v2,
    rotulado como tal y usado sólo dentro de la suite de pruebas.

**Resultado: 18/20 aprobados sin reserva; 1/20 (criterio 9) aprobado con reserva documentada
honesta; los 20 fueron evaluados individualmente, ninguno agrupado ni omitido.**

## 12 · Veredicto de la auditoría interna

- **Veredicto final: APROBADO.**
- **Rondas: 2** (dentro del máximo de 2 permitido).
- **Ronda 1** — veredicto APROBADO CON CORRECCIONES. Un agente fresco de solo lectura, sin
  contexto previo de la implementación, encontró que "Calidad de evidencia", "Lo que importa"
  y "Comparación entre canales" quedaban como secciones de una sola pieza con 60-75% de la
  página vacía, violando el umbral R-01 documentado en el propio contrato. Señaló además, de
  forma informativa y no bloqueante, la falta de un caso de estrés para nombres/montos
  extremos (criterio 15).
- **Correcciones aplicadas entre rondas**: reagrupación de cobertura con contenido relacionado
  (foto actual en diagnóstico, resumen comercial en proyección); reordenamiento de
  "comparación entre canales" para que no quede sola en una página de continuación; corrección
  de un bug de contraste introducido por el propio fix (texto de cobertura con color navy
  hardcodeado, ilegible sobre el nuevo fondo oscuro); agregado del test de estrés del
  criterio 15; documentación explícita del residuo conocido de R-01 sin forzar un rediseño
  adicional no justificado.
- **Ronda 2** — veredicto APROBADO, sin objeciones bloqueantes. Confirmó que la mejora de
  ocupación de página es real y sustancial, que el residuo documentado es preciso, que no hay
  regresión de contraste, y que el test de estrés alcanza para cerrar la observación
  informativa. Único señalamiento, opcional y no bloqueante: precisar en el contrato que el
  residuo mueve 2 filas en diagnóstico pero 1 fila en proyección — **corregido** en
  `contrato-composicion-v2.md` (líneas 192-202) antes de cerrar.
- **Pendientes que no pudieron resolverse dentro de las 2 rondas**: la repetición de
  encabezado de tabla al partirse entre páginas (sin garantía de código, ver C-01 en sección
  9); el residuo de ocupación R-01 en el caso multicanal denso de perfil pantalla (aceptado
  explícitamente, no bloqueante, no se manifiesta en A4).

## 13 · Decisiones pendientes, riesgos y todo lo que quedó sin resolver

**Decisiones pendientes nuevas surgidas durante el bloque**: ninguna. No se identificó ninguna
decisión de producto nueva que no estuviera ya cubierta por D1-D8 o por las decisiones
pendientes 1-7 ya registradas en `docs/visual/contrato-estados.md`.

**Riesgos y gaps sin resolver, documentados con motivo (ninguno bloqueante para revisión
humana)**:
1. **C-01 residual / criterio 9** — repetición de encabezado de tabla al partirse entre
   páginas: sin garantía de código. `@react-pdf/renderer` no tiene un primitivo nativo para
   "repetir encabezado sólo cuando esta tabla específica se parte"; usar `fixed` (pensado para
   repetirse en cada página del documento, no localmente) causó un bug de renderizado real.
   Implementarlo bien requeriría lógica de paginación consciente del contenido, fuera del
   alcance razonable de este bloque.
2. **Residuo de ocupación R-01** en perfil pantalla, caso multicanal denso: aceptado
   explícitamente, documentado en el contrato, confirmado por la auditoría en su segunda
   ronda. Consecuencia de la altura fija de 960×540 frente a contenido genuinamente extenso;
   no se manifiesta en perfil impresión (A4).
3. **Decisiones pendientes 1, 2, 3, 4 y 6** del registro de decisiones: siguen exactamente
   como estaban, sin resolver de oficio, documentadas explícitamente en
   `contrato-composicion-v2.md` sección 0.
4. **Decisión 7** (si s4 es el escenario oficial de "estados extremos"): usado como referencia
   de trabajo tal como indica el prompt del bloque, sin sentar postura sobre si eso la resuelve
   a futuro — sigue siendo una decisión de producto, no técnica.

## Rutas exactas de artefactos

- **12 PDF v2**: `/private/tmp/claude-501/-Users-maticosenza-Documents-velocentum-diagnostico-web-local/6e45b2ff-e1f8-4d3a-a583-b22297115c4d/scratchpad/bv2/v2-pdfs/{1-marketplace-fuerte-tienda-floja,4-roas-bueno-margen-negativo}/{diagnostico,proyeccion_90d,propuesta}-{pantalla,impresion}.pdf`
- **Rásters v1 (línea de base "antes")**: `.../scratchpad/bv2/v1-raster/` (91 páginas)
- **Rásters v2 (verificación)**: `.../scratchpad/bv2/v2-raster/`
- **Renders web v2 (HTML estático)**: `.../scratchpad/bv2/v2-web/*.html` (6 archivos)
- **Montajes comparativos v1 ↔ v2**: `.../scratchpad/bv2/montajes/*.png` (12 archivos, uno por
  escenario × documento × perfil)
- **Contrato de composición**: `docs/visual/contrato-composicion-v2.md`
- **Informe de auditoría**: no se generó un archivo de auditoría separado — los hallazgos y
  correcciones de las 2 rondas quedan documentados en este handoff (secciones 11 y 12) y en el
  propio `contrato-composicion-v2.md` (residuo de R-01 corregido a partir de la observación de
  ronda 2). Los agentes de auditoría corrieron en modo efímero de solo lectura, sin persistir
  su transcripción como archivo del repositorio.

Nota: todas las rutas de scratchpad son artefactos locales de esta sesión de trabajo, no
forman parte del repositorio ni fueron commiteadas — son evidencia de verificación, no
entregables versionados.

## Confirmaciones de cierre

- **Commit y push del bloque de implementación**: sí — commit `f8db5608a538c6a3db2194c9fd30948d97d5b25e`
  ("Bloque Visual 2: prototipo v2 (capa semántica compartida + PDF + web) sobre s1/s4"),
  pusheado a `origin/feat/noche-continuacion`.
- **HEAD local**: `f8db5608a538c6a3db2194c9fd30948d97d5b25e`
- **HEAD remoto**: `f8db5608a538c6a3db2194c9fd30948d97d5b25e` (coinciden)
- **PR abierta para esta rama**: no existe (`gh pr list --head feat/noche-continuacion` →
  lista vacía, verificado al momento de escribir este informe).
- **Avance al Bloque Visual 3 o a fase 14**: no se avanzó — confirmado.
- **Integración a main, publicación o despliegue**: ninguna de las tres — confirmado. Todo el
  trabajo permanece en `feat/noche-continuacion`, sin tocar `main`, sin publish, sin deploy.
