# Handoff — Bloque Visual 3 (2026-08-28)

## 1 · Rama, HEAD local y remoto, commit candidato exacto

Rama: `feat/noche-continuacion`.
HEAD de partida: `82bb66ebcb57c7da466c828b4b13acdd3d9894cd`.
Commit candidato de la ronda 1 (auditado, APROBADO CON CORRECCIONES):
`4961d6e841fa96205a4b336fafd01e2302381647`.
Commit candidato final (ronda 2, APROBADO, pusheado):
`a7a5ad18fff27fa8ddf3ae5b2bfa32d5a394f732`.
HEAD local = HEAD remoto tras el push (verificado): `a7a5ad1...`.
Todos los artefactos del ZIP se generaron desde `git worktree` limpios
en el commit candidato correspondiente (`4961d6e` para los PDFs/rasters/
web/estados/exportacion/roadmap iniciales; el único archivo que cambió
entre `4961d6e` y `a7a5ad1` fue `docs/funcional/contrato-bloque-3.md`,
re-copiado al ZIP tras la corrección).

## 2 · `git status --short`

Limpio antes y después del push. Verificado en cada paso de la
secuencia (PASO 0, tras cada sub-paso del PASO 2, antes de cada commit).

## 3 · `git diff --stat` contra `82bb66e`

36 archivos modificados/creados en el commit candidato final (35 en el
commit `4961d6e` + 1 en `a7a5ad1`): 26 archivos del renombrado ítem 1,
7 archivos del funnel (ítem 3), `docs/funcional/contrato-bloque-3.md`
(secciones 14 y 15), `docs/visual/matriz-hallazgos.md` (fila R-09),
`docs/prompts/bloque-visual-3.md` (nuevo), y 2 archivos de test nuevos
(`funnel-web-r09.test.ts`, `bloque-visual-3-verificacion.test.ts`).
`src/lib/`, fixtures canónicos y el motor: **fuera del diff**,
verificado con `git diff --stat 82bb66e -- src/lib/` (vacío) en cada
ronda de auditoría.

## 4 · Aislamiento: archivos tocados, qué se tocó de v1 y prueba de que su salida no cambió

De v1 se tocaron dos archivos, ambos forzados mecánicamente por el
renombrado del ítem 1: `src/documents/templates/velocentum-v1/blocks.ts`
(1 línea: `!== "calculado"` → `!== "disponible"`) y
`src/documents/templates/velocentum-v1/templates.test.ts` (2 líneas,
literal esperado en una aserción). Ningún cambio de comportamiento.

Prueba de que v1 no cambió: generé los 36 PDFs de revisión de
`src/documents/renderers/pdf/generar-pdfs-escenarios-demo.test.ts`
(seis escenarios × tres documentos × dos perfiles) desde un `git
worktree` limpio en `82bb66e` y desde el árbol con el renombrado
aplicado, y comparé el TEXTO extraído (pdfjs, `getTextContent()`) de
cada página — **idéntico en las 36 combinaciones**. El hash SHA-256
crudo de los mismos PDFs difiere entre corridas de procesos distintos
(confirmado corriendo el mismo commit dos veces: hash distinto pese a
cero cambios) — es metadata no determinista de `@react-pdf/renderer`
(no relacionada con este bloque), por eso la comparación correcta es de
texto, no de hash crudo. La auditoría independiente reprodujo este
mismo procedimiento por su cuenta (36/36 texto idéntico, 36/36 hash
distinto) y lo confirmó como método correcto.

## 5 · Resultado del PASO 0 y del inventario del PASO 1

PASO 0: HEAD `82bb66e` confirmado, suite 765 passed + 1 todo (766)
confirmada tras una re-corrida limpia (la primera corrida dio 764 + 1
timeout por presión de memoria del sistema — ambiental, no código;
confirmado cerrando aplicaciones y re-corriendo limpio), typecheck y
build limpios.

PASO 1 (checkpoint no bloqueante, reportado y continuado): inventario
completo de las 26+ ocurrencias del literal `"calculado"` como estado
del Eje 2 en `src/documents/`, con exclusión explícita documentada del
decoy `EstadoFunnel` (`src/lib/funnel.ts`, mismo literal, concepto
distinto — desglose de tramo, no disponibilidad); datos del motor
disponibles para R-09 (funnel: sí, vía `derivados.funnel`, no wireado
a `DocumentContextV1` todavía; retención: no, sólo `fugas` ya mapeadas
a hallazgos); confirmación de que R-07 no puede ampliarse sin tocar el
motor (prohibido en este bloque); páginas donde renderizan roadmap,
`restrictions-grouped`, propuesta cualitativa y fortalezas.

## 6 · Ítem 1: puntos renombrados, pruebas actualizadas, verificación de que cada aserción sigue fallando al revertir

26 archivos, reemplazo mecánico del literal `"calculado"` → `"disponible"`
donde representa el estado del Eje 2 de `ValorPublicable`/`ValorV2`
(tipos, call sites de producción, aserciones de test). Verificado con
`grep -rn '"calculado"' src/documents/` → cero ocurrencias reales tras
el cambio (sólo el propio test V1 que busca el string, y un comentario
explicativo del decoy, ambos excluidos del escaneo del propio test).
`src/lib/funnel.ts`, `funnel.test.ts`, `entrega-2-5.test.ts`,
`calculo-diagnostico.test.ts` (el decoy) quedaron sin tocar — diff
vacío contra `82bb66e`, confirmado por la auditoría.

Verificación de que cada aserción sigue fallando al revertir: el
renombrado es un swap 1:1 del literal esperado en cada `toBe`/
`toMatchObject`/`toEqual` — revertir cualquiera de los 26 archivos al
literal `"calculado"` anterior haría que las aserciones de tipo
`estado: "disponible"` fallaran (comparación de string exacta), y el
tipo `ValorPublicable` ya no acepta `"calculado"` como valor válido
(error de TypeScript en compilación) — doble red, tipo y test.

## 7 · Ítems 3 y 4: qué se construyó de R-09/R-07, qué quedó documentado y por qué

**R-09, decisión tomada explícitamente por el usuario (dos preguntas
respondidas a mitad de sesión):**
- **Funnel — construido.** `funnelWebDocumento` (`domain/build-context.ts`)
  traduce `resultado.derivados.funnel` (ya calculado por el motor) a un
  bloque tabular nuevo, sin derivar ni estimar ninguna tasa. Bloque `funnel`
  nuevo en `DocumentBlockV2`, renderizado en ambos renderers reutilizando
  el patrón `metric-grid`/`CardGrid` ya aprobado — sin gráfico nuevo.
  `null` (bloque ausente) cuando el motor marca `no_aplica`/`sin_datos`/
  `error`; `no_aplica` en una conversión con denominador cero (mismo
  criterio DHB-1).
- **Retención — sin resolver, documentado.** El motor no expone un
  derivado estructurado análogo al del funnel; sólo dos `Fuga` ya
  mapeadas a `hallazgos` (visibles hoy en otra sección). Documentado en
  `contrato-bloque-3.md` sección 14 y en la fila R-09 de
  `matriz-hallazgos.md`, mismo criterio que R-07: no se fabrica un
  componente para exponer algo que el motor no expone estructurado.
- **Estado final: R-09 PARCIALMENTE RESUELTO** (no "resuelto" a secas).

**R-07:** sin cambios de código — confirmado en `docs/funcional/contrato-bloque-3.md`
sección 6 que `medicion`/`cuenta`/`creativos` no pueden resolverse sin
tocar `src/lib/calculo-diagnostico.ts` (prohibido en este bloque, sección
4). Queda como estaba, documentado, no ampliado.

**R-04 (iconografía):** verificado que ya estaba resuelto en código
(`IconCircle` en `scenarios` y `channel-comparison`, ambos renderers,
exactamente las dos superficies autorizadas por
`contrato-composicion-v2.md` sección 6.4) — no se tocó código, no se
extendió a superficies nuevas.

## 8 · Inspección página por página de las piezas nuevas

Inspección visual real (rasters a 150dpi, `pdftoppm`) sobre PDFs
generados desde el commit candidato: funnel (caso 1, diagnóstico
pantalla e impresión), roadmap con selección confirmada (caso
"confirmada", propuesta) y con selección pendiente (caso 1, propuesta),
`restrictions-grouped` (caso "confirmada", propuesta), propuesta
cualitativa DHB-2 (caso 4, margen negativo, propuesta). Sin texto
solapado, cortado ni fuera de página; sin encabezado con cuerpo vacío;
comparativa antes/después de la página 3 del diagnóstico (caso
5-todo-sano, perfil pantalla) confirma que sólo se insertó el bloque
funnel, sin alterar el resto de la composición. La auditoría
independiente repitió esta inspección por su cuenta, en las dos rondas,
con hallazgo idéntico (contenido idéntico pixel a pixel entre rondas,
dado que el código no cambió entre `4961d6e` y `a7a5ad1`).

## 9 · Conteo de pruebas sin doble suma

Línea base: 765 passed + 1 todo (766) — confirmada limpia tras cerrar
apps para descartar flakiness ambiental.
Nuevas: `funnel-web-r09.test.ts` (5 casos de dominio) + 6 de
`bloque-visual-3-verificacion.test.ts` (V1: 1, V2: 3, V4: 2) = 11.
**Total final: 776 passed + 1 todo (777).** Typecheck limpio. Build
exitoso (únicos warnings: `IMPORT_IS_UNDEFINED` de `fontkit`,
preexistentes, no relacionados con este bloque).

## 10 · Conteo de páginas documento por documento contra el Bloque 3, con toda diferencia explicada

376 → 380 páginas totales (54 combinaciones), delta +4. Ver sección 15
de `docs/funcional/contrato-bloque-3.md` para la tabla completa: los 4
documentos `diagnostico` que ganaron una página
(`1-marketplace-fuerte-tienda-floja/diagnostico-pantalla`,
`2-margen-alto-volumen-bajo/diagnostico-impresion`,
`3-margen-fino-volumen-alto/diagnostico-impresion`,
`5-todo-sano/diagnostico-impresion`), y por qué (el bloque funnel nuevo
empuja el resto de la sección a una página adicional en esos casos
específicos). Las 50 combinaciones restantes no cambiaron de conteo.
Este fue el único hallazgo real de la ronda 1 de auditoría (criterio
16 incompleto) — corregido y re-verificado en la ronda 2.

## 11 · Auditoría interna: HEAD por ronda, veredicto, confirmación de push posterior al APROBADO

**Ronda 1** — agente de solo lectura, sin contexto de la sesión de
implementación, contra `4961d6e` (worktree limpio
`/private/tmp/bloque-visual-3-candidato`). Veredicto: **APROBADO CON
CORRECCIONES**. Único hallazgo real: criterio 16 (reconciliación de
páginas) sin documentar en el HEAD auditado, con causa identificada
correctamente por el propio auditor (376→380, +4, los mismos 4
documentos que confirmé después). Hallazgos no bloqueantes: una
observación preexistente del algoritmo de roadmap (no de este diff) y
una nota de proceso sobre el ZIP (generándose en paralelo, fuera de los
20 criterios).

Corrección aplicada por mí (nunca por el auditor): sección 15 nueva en
`contrato-bloque-3.md`, commit `a7a5ad1`.

**Ronda 2** — mismo agente, resumido con el nuevo HEAD, auditoría
COMPLETA (no sólo el delta) contra `a7a5ad1`. Veredicto: **APROBADO**.
Los 20 criterios re-verificados desde cero (suite, typecheck, build,
regeneración de los 54 PDFs, re-inspección visual). Único señalamiento:
un desliz de redacción trivial en mi propia sección 15 ("siete" en vez
de "cuatro" tipo/perfil) — no bloqueante, el propio auditor indicó que
no ameritaba una tercera ronda (máximo permitido por el prompt). Se
dejó sin corregir para pushear exactamente el HEAD que fue auditado,
sin introducir un cambio no auditado después del veredicto final;
queda anotado acá para una futura pasada de copy.

Push a `feat/noche-continuacion` ejecutado por mí (agente principal),
después del veredicto APROBADO de la ronda 2, nunca por el agente
auditor — mismo criterio que la sección 5.6 del plan maestro exige.
Verificado `git log origin/feat/noche-continuacion -1` = HEAD local =
`a7a5ad18fff27fa8ddf3ae5b2bfa32d5a394f732`.

## 12 · Los 20 criterios de aceptación, uno por uno, con veredicto; decisiones pendientes nuevas y lo que quedó sin resolver

Los 20 criterios: **20/20 en verde** al cierre de la ronda 2 (ver
sección 11 y el reporte completo del auditor, con evidencia por
criterio, en el historial de esta sesión).

**Decisiones pendientes nuevas:** ninguna que requiera intervención
humana inmediata — las dos decisiones de producto de este bloque
(forma del funnel, tratamiento de retención) ya se resolvieron
explícitamente con el usuario a mitad de la sesión, vía preguntas
directas, y quedan documentadas en `contrato-bloque-3.md` sección 14.

**Lo que quedó sin resolver, para un bloque futuro:**
- Retención (mitad de R-09): requiere que el motor exponga un derivado
  estructurado nuevo (fuera de alcance de este bloque, que prohíbe
  tocar `src/lib/`), o una decisión de diseño explícita sobre re-empaquetar
  hallazgos ya visibles sin agregar información — el usuario prefirió no
  fabricarlo.
- R-07 (medicion/cuenta/creativos): mismo motivo, requiere tocar el motor.
- Desliz de redacción trivial en `contrato-bloque-3.md` sección 15
  ("siete" → debería decir "cuatro").

**Criterios de promoción de v2 sobre v1:** sin cambios respecto del
Bloque 3 Funcional, siguen vigentes y verificables (sección 8 del
contrato). **Ninguna promoción ejecutada.** No se integró a `main`, no
se publicó, no se desplegó, no se avanzó a la fase 14 ni a staging.
