# Plan maestro · matriz de fases (fuente única)

Documento de reconciliación entre el plan maestro consolidado (numeración
externa, catorce fases) y el estado real del código en este repositorio.
Bloque estrictamente documental: no se implementó ni se corrigió código
para producir este documento. Toda observación de "corrección necesaria"
queda anotada para un bloque técnico posterior, no aplicada acá.

**Línea base verificada en el árbol actual** (no contra handoffs previos):

- Rama: `feat/noche-continuacion`.
- **HEAD: `d07fcac`** (`Margen total exige 100% de cobertura de productos;
  corrige contradicción retenida bajo cobertura parcial`).
- Árbol de trabajo limpio al momento de esta verificación.
- `npm test -- --run`: **398 passed | 1 todo (30 archivos de prueba)**.
- `npm run typecheck`: limpio.
- `npm run build`: exitoso (sólo warnings preexistentes de
  `fontkit`/`@react-pdf`, no relacionados con este repositorio).

## Advertencia: nueve de las catorce fases no tienen definición verificable en este repositorio

El plan maestro consolidado que este documento reconcilia numera catorce
fases. De esas catorce, este repositorio (código, tests, docs, handoffs,
commits) sólo permite verificar contenido real para **cinco**: fase 3, fase
5, fase 6, fase 7 y fase 8 — las que la instrucción de este bloque nombró
explícitamente. Para las fases 1, 2, 4, 9, 10, 11, 12, 13 y 14 no hay, en
este repositorio, ningún nombre, alcance ni evidencia que permita
completarlas sin inventar contenido. No se inventaron: quedan marcadas
explícitamente como **SIN DEFINICIÓN VERIFICABLE ACÁ** en la matriz de abajo,
siguiendo la misma regla de parada que rige el resto de este trabajo (no
tomar una decisión o dar por cierto un dato que no está resuelto en los
documentos existentes). Esto se registra también como decisión/dato
pendiente en `docs/decisiones-pendientes.md` (entrada 3).

## 1 · Tabla de equivalencias (numeración histórica del handoff del 21/08 vs. plan maestro)

El handoff `docs/handoff-2026-08-21-fases-4-5-6.md` (21 de agosto) usa una
numeración propia, distinta de la del plan maestro consolidado. Ningún
trabajo futuro debe cruzarlas. Verificado contra el código y contra el
contenido explícito de esta instrucción:

| Numeración del handoff 21/08 | Numeración del plan maestro | Contenido |
|---|---|---|
| "fase 4" | **Fase 5** | Plataformas y comisiones (planes, comisión efectiva, precedencia, metadatos de `ComisionPlataforma`) |
| "fase 5" | **Fase 3** | Productos dinámicos y cobertura (lista de uno a cinco productos, `cobertura_productos`, separación margen de la muestra / margen total) |
| "fase 6" | **Fase 6** | Presupuesto de arranque (piso teórico por compra vs. presupuesto de arranque por evento intermedio) |

Toda referencia futura a "fase 4/5/6" sin aclarar cuál numeración usa debe
tratarse como ambigua y resolverse contra esta tabla, no contra la memoria
de una sesión anterior.

## 2 · Matriz de estado (catorce fases)

Columnas: número normalizado · denominación · numeración histórica
equivalente · estado real (verificado contra código) · evidencia (archivo y
línea) · pruebas existentes · pruebas faltantes · riesgo · bloqueo ·
siguiente acción.

### Fase 1 — SIN DEFINICIÓN VERIFICABLE ACÁ

No hay nombre, alcance ni evidencia de esta fase en el repositorio.
**Siguiente acción:** obtener del plan maestro externo el nombre y alcance
antes de auditar o programar nada bajo este número.

### Fase 2 — SIN DEFINICIÓN VERIFICABLE ACÁ

Mismo caso que fase 1. El repositorio sí tiene trabajo histórico rotulado
"fase 2" en nombres de archivo (`configuracionRegresionFase2`,
`esperadosFase2` en `src/lib/fixtures-casos.ts`, `regresion-2-6.test.ts`),
pero esa numeración es la del código/tests de una entrega técnica anterior
(motor de cálculo base: margen por canal, envío, comisiones), **no**
necesariamente la fase 2 del plan maestro de catorce fases — no hay
confirmación de que sean la misma cosa. **Siguiente acción:** confirmar con
el plan maestro externo si "fase 2" del plan maestro corresponde a este
trabajo o a otra cosa, antes de asumir la equivalencia.

### Fase 3 — Productos dinámicos y cobertura — **COMPLETA**

- **Numeración histórica equivalente:** "fase 5" en el handoff del 21/08.
- **Estado real:** completa, incluyendo el cierre de la unificación de
  semántica de margen del bloque recién aprobado (commit `d07fcac`).
- **Evidencia:**
  - Lista de uno a cinco productos: `MAX_PRODUCTOS = 5`
    (`src/lib/calculo-diagnostico.ts:336`); `cantidad_productos`
    (`src/lib/diagnostico-form.ts:162,296`); `cantidadProductosDe()`
    (`src/lib/diagnostico-form.ts:442`).
  - Cobertura del catálogo: `coberturaProductos()`
    (`src/lib/calculo-diagnostico.ts:391`); derivado
    `cobertura_productos` (`src/lib/calculo-diagnostico.ts:156,1080`).
  - Separación margen de la muestra / margen total, con el cierre de la
    decisión pendiente #1: el margen total exige 100% explícito de
    cobertura de productos y de canales
    (`src/lib/calculo-diagnostico.ts:865-897`, commit `d07fcac`).
  - Commits: `0217583` (implementación original), `d07fcac` (cierre de
    semántica de margen).
- **Pruebas existentes:** `src/lib/producto-dinamico.test.ts` (15 casos),
  `src/lib/calculo-diagnostico.test.ts` (describe "margen ponderado por
  productos"), `src/lib/contradiccion.test.ts` (caso Titan Web al 60%).
- **Pruebas faltantes:** ninguna identificada para el alcance implementado.
- **Riesgo:** la mayoría de los diagnósticos reales de modo B (un solo
  producto, sin porcentaje declarado) van a mostrar margen total retenido
  hasta que el vendedor declare explícitamente el 100% — ver
  `docs/decisiones-pendientes.md` entrada 1 y el handoff del 22/08.
- **Bloqueo:** ninguno.
- **Siguiente acción:** ninguna pendiente; fase cerrada.

### Fase 4 — SIN DEFINICIÓN VERIFICABLE ACÁ

No hay nombre, alcance ni evidencia de esta fase en el repositorio bajo la
numeración del plan maestro. (No confundir con "fase 4" del handoff 21/08,
que corresponde a **Fase 5** del plan maestro — ver tabla de equivalencias
arriba). **Siguiente acción:** obtener del plan maestro externo el nombre y
alcance antes de auditar o programar nada bajo este número.

### Fase 5 — Plataformas y comisiones — **COMPLETA**

- **Numeración histórica equivalente:** "fase 4" en el handoff del 21/08.
- **Estado real:** completa. Auditada en ronda 1, **sin observaciones**,
  sobre el commit `c4cb51a` (confirmado en
  `docs/handoff-2026-08-21-fases-4-5-6.md:34`).
- **Evidencia:**
  - Tipo `ComisionPlataforma` con metadatos completos (plan, vigencia
    desde/hasta, país, origen, `verificado`, `provisional`):
    `src/lib/canales.ts:92-105`.
  - `COMISIONES_PLATAFORMA_DEFECTO` (Tiendanube, Shopify, WooCommerce,
    Empretienda), todas con `verificado: false`: `src/lib/canales.ts`
    (exportado y re-exportado en `src/lib/calculo-diagnostico.ts:25,47`).
  - Precedencia (verificado del cliente > liquidación verificada de
    configuración > benchmark de configuración > default de código):
    `comisionEfectivaCanal()` en `src/lib/canales.ts`.
  - Estructura para liquidación real de Mercado Libre con estado
    `"liquidacion_verificada"`: `src/lib/calculo-diagnostico.ts:611`
    (`comision_evidencia`).
- **Pruebas existentes:** `src/lib/calculo-diagnostico.test.ts` (describe
  "mix de canales y comisiones", "cargo fijo del marketplace y escala de la
  comisión verificada"), `src/lib/canales.test.ts`,
  `src/lib/regresion-2-6.test.ts`.
- **Pruebas faltantes:** ninguna identificada para el alcance implementado.
  Pendiente relacionado pero de alcance distinto: el hallazgo "plan de
  plataforma mal dimensionado" sigue bloqueado por falta de datos
  (`docs/fase3-evidencia-pendiente.md`) — no es parte de lo que fase 5
  declaró completo (metadatos de comisión), es un hallazgo comercial aparte.
- **Riesgo:** ninguno identificado; comportamiento retrocompatible
  confirmado explícitamente contra plataformas sin regla configurada
  (siguen devolviendo `null`, nunca inventan un número).
- **Bloqueo:** ninguno.
- **Siguiente acción:** ninguna pendiente; fase cerrada. Si se quiere cerrar
  también el hallazgo de plan mal dimensionado, es un bloque nuevo, no una
  reapertura de fase 5.

### Fase 6 — Presupuesto de arranque — **COMPLETA**

- **Numeración histórica equivalente:** "fase 6" en el handoff del 21/08
  (misma numeración).
- **Estado real:** completa. Implementada en `0b803af`, corregida en
  `1a1da1e` (ronda 1 de observaciones), re-auditada y **aprobada sin
  observaciones** en ronda 2 (`docs/handoff-2026-08-21-fases-4-5-6.md:39`).
- **Evidencia:**
  - Tipo `PresupuestoArranque` (`piso_teorico_compra`,
    `arranque_evento_intermedio: RangoEstimado | null`, `supuestos:
    string[]`, `confianza: "alta"|"media"|"baja"`):
    `src/lib/calculo-diagnostico.ts:197-213`.
  - `piso_teorico_compra` idéntico a `piso_mensual_un_conjunto` (ya
    existente), consumido en la UI (`diagnosticos.$id.tsx`).
  - `arranque_evento_intermedio` siempre un rango, nunca cifra única:
    `src/lib/calculo-diagnostico.ts:1012-1019`.
  - `factor_costo_evento_intermedio` (config, benchmark) con default
    `FACTOR_COSTO_EVENTO_INTERMEDIO_DEFECTO = 0,2`:
    `src/lib/calculo-diagnostico.ts:102`.
  - `confianza` nunca `"alta"`: `src/lib/calculo-diagnostico.ts:1041-1042`.
  - Cierre reciente (commit `d07fcac`): todo el bloque de
    `presupuesto_arranque` queda retenido cuando el margen total está
    retenido por cobertura parcial de productos, porque depende de
    `cpa_objetivo`.
- **Pruebas existentes:** `src/lib/presupuesto-arranque.test.ts` (8 casos).
- **Pruebas faltantes:** ninguna identificada para el alcance implementado.
- **Riesgo:** el 20% por defecto de `factor_costo_evento_intermedio` no
  tiene respaldo de datos reales de ningún cliente —
  `docs/decisiones-pendientes.md` entrada 2, sin resolver, no bloquea.
- **Bloqueo:** ninguno.
- **Siguiente acción:** ninguna pendiente; fase cerrada.

### Fase 7 — Medición y publicidad por plataforma — **PARCIAL** (inventario, sin programar)

- No hay numeración histórica equivalente confirmada: los hallazgos y
  campos de esta área se construyeron a lo largo de varias entregas
  técnicas ("entrega 2.x", "fase 3" del motor de cálculo base) sin usar
  nunca el número "7".
- **Campos existentes (`src/lib/diagnostico-form.ts`):**
  `tiene_pixel`, `facturacion_pixel`, `capi_estado` (medición);
  `inversion_meta`, `inversion_google`, `ml_inversion_product_ads`,
  `ml_ventas_product_ads`, `conjuntos_activos`, `presupuesto_diario`
  (publicidad); `frecuencia_creativos`, `formato_creativos`,
  `angulo_que_funciona`, `dolor_cliente` (contenido/creativos).
- **Cálculos existentes (`src/lib/calculo-diagnostico.ts`):**
  `delta_medicion` (líneas 845-853, desvío Pixel vs. facturación real);
  `mer_actual`, `mer_tienda_propia`, `mer_marketplace` (líneas 957-960,
  1095-1096, por perímetro, nunca cruzados); `roas_product_ads` (línea
  1097, independiente del MER); `inversion_publicitaria_total`
  (`inversionPublicitariaTotal()`); `estadoMedicion`,
  `estadoCuenta` (estructura de cuenta: conjuntos activos vs. piso
  sostenible).
- **Importación de datos:** `src/lib/meta-csv.ts` + `src/components/carga-csv-meta.tsx`
  — parser del CSV exportado de Meta Ads Manager, precarga
  `conjuntos_activos`/`presupuesto_diario`, wireado en
  `diagnosticos.nuevo.tsx:954-980`.
- **Hallazgos existentes (`src/lib/propuesta.ts`):** `medicion` (línea 72),
  `mer_bajo` (línea 82), `estructura_cuenta` (línea 122), `creativos`
  (línea 212), `angulo` (línea 228), `product_ads` (línea 239).
- **Consolidación de ahorro publicitario:** `src/lib/ahorro-publicitario.ts`
  (`consolidarAhorroPublicitario`, toma el máximo entre gasto no rentable y
  sobrefragmentación, nunca la suma).
- **Pruebas existentes:** `src/lib/ahorro-publicitario.test.ts`,
  `src/lib/fase3-bugfixes.test.ts`, partes de
  `src/lib/calculo-diagnostico.test.ts` (describe "impactos económicos:
  ahorro publicitario tipado"), `src/lib/meta-csv.test.ts`.
- **Qué falta concretamente (no implementado, sólo inventariado):**
  - Ninguna plataforma de pauta más allá de Meta, Google (combinados en un
    solo pool) y Mercado Libre Product Ads. No hay TikTok Ads, Google
    Shopping/Performance Max desagregado, ni ningún otro canal pago.
  - El hallazgo "plan de plataforma mal dimensionado" sigue explícitamente
    bloqueado por falta de datos (`docs/fase3-evidencia-pendiente.md`): no
    hay costo de plan actual, costo de alternativa, límite de uso ni
    ahorro verificable relevados.
  - No hay importación de CSV para Google Ads ni para Mercado Libre
    (`meta-csv.ts` es exclusivamente de Meta).
  - No hay desglose de creativos individuales (hook rate, CTR por pieza):
    `umbrales_creativos` existe en `ConfiguracionCalculo` pero no se
    encontró un cálculo que lo consuma con datos por creativo individual
    más allá del hallazgo cualitativo de contenido.
- **Riesgo:** al declararse "parcial" sin inventario, se podría suponer que
  falta más o menos de lo que realmente falta; este inventario es la base
  para decidir qué programar.
- **Bloqueo:** el hallazgo de plan mal dimensionado depende de datos que
  hoy no se relevan en el formulario.
- **Siguiente acción:** con este inventario, decidir con Matías el alcance
  real de "fase 7" del plan maestro antes de programar nada — no se
  implementó nada en este bloque.

### Fase 8 — Retención, carrito y recompra — **PARCIAL** (inventario, sin programar)

- No hay numeración histórica equivalente confirmada.
- **Campos existentes (`src/lib/diagnostico-form.ts`):**
  `carritos_abandonados`, `recuperacion_carrito`, `retargeting_abandono`
  (líneas 203-205); `ml_tiene_clips` (línea 223, triestado, Mercado Libre).
- **Cálculos existentes:** cascada de funnel con tramo de carrito
  (`src/lib/funnel.ts`: `agregados_carrito`, `p_carrito_dado_visita`,
  `p_checkout_dado_carrito`); fuga `funnel_carrito`
  (`src/lib/propuesta.ts:167`).
- **Hallazgos existentes:** `sin_retargeting`
  (`src/lib/propuesta.ts:192`, sólo con `recuperacion_carrito: false` Y
  `retargeting_abandono: false` explícitos, nunca por ausencia de dato);
  `clips_ml` (línea 203, triestado, resuelto según
  `docs/fase3-evidencia-pendiente.md`).
- **Pruebas existentes:** `src/lib/fase3-bugfixes.test.ts`, partes de
  `src/lib/calculo-diagnostico.test.ts` (describe "hallazgos que dependen
  de booleanos sin responder").
- **Qué falta concretamente (no implementado, sólo inventariado):**
  - **Recompra: no existe ningún campo, cálculo ni hallazgo.** No hay
    frecuencia de compra, tasa de clientes recurrentes, LTV, cohortes ni
    nada que mida si un cliente vuelve a comprar. Es la brecha más grande
    de esta fase.
  - **Retención más allá del carrito abandonado:** no hay campos de
    email marketing, programas de fidelización, ni segmentación de
    clientes recurrentes vs. nuevos.
  - El carrito abandonado sólo se mide como parte del funnel de conversión
    (agregar al carrito → checkout → compra) y como un hallazgo booleano de
    retargeting; no hay valorización económica separada de "recuperación de
    carrito" como palanca propia (el tramo `funnel_carrito` valoriza la
    conversión completa del tramo, no específicamente la recuperación de
    carritos abandonados vía email/retargeting).
- **Riesgo:** si el plan maestro asume que "retención" ya tiene alguna
  cobertura de recompra/LTV, ese supuesto es incorrecto — no existe nada en
  el código.
- **Bloqueo:** ninguno técnico; es simplemente alcance no implementado
  todavía.
- **Siguiente acción:** con este inventario, decidir con Matías el alcance
  real de "fase 8" del plan maestro (en particular si recompra/LTV entra en
  esta fase o es una fase separada) antes de programar nada — no se
  implementó nada en este bloque.

### Fases 9 a 14 — SIN DEFINICIÓN VERIFICABLE ACÁ

No hay nombre, alcance ni evidencia de estas seis fases en el repositorio.
`docs/cola-nocturna.md` menciona, sin numeración ni alcance documentado,
"mayorista/mixto, retención y rediseño integral" como trabajo futuro
mencionado por Matías en una sesión anterior (20 de agosto) — es posible
que alguna de estas fases corresponda a ese contenido, pero no hay forma de
confirmarlo desde este repositorio sin el texto del plan maestro. **No se
asume la equivalencia.** **Siguiente acción:** obtener del plan maestro
externo el nombre y alcance de cada una antes de auditar o programar nada
bajo estos números.

## 3 · Campos y derivados implementados que ningún documento de producto describe todavía

Verificado: ninguno de estos aparece en `docs/motor-documental-v1.md` (el
único documento de producto de este repositorio que describe el modelo de
datos del expediente) ni en ningún otro documento que no sea un handoff de
sesión (los handoffs son bitácoras de trabajo, no documentación de
producto).

| Campo/derivado | Definido en | Descrito en un documento de producto |
|---|---|---|
| `cantidad_productos` | `src/lib/diagnostico-form.ts:162` | No |
| `cobertura_productos` | `src/lib/calculo-diagnostico.ts:156,391` | No |
| `PresupuestoArranque` (`piso_teorico_compra`, `arranque_evento_intermedio`, `supuestos`, `confianza`) | `src/lib/calculo-diagnostico.ts:197-213` | No |
| `ComisionPlataforma` (plan, vigencia, país, origen, `verificado`, `provisional`) | `src/lib/canales.ts:92-105` | No |
| `Contradiccion.origen_margen` / `Contradiccion.confianza_base` | `src/lib/contradiccion.ts:33,39,46` | No |

**Siguiente acción recomendada (no ejecutada en este bloque):** incorporar
estos cinco elementos a `docs/motor-documental-v1.md` (o al documento de
producto que corresponda) en un bloque documental posterior, ya que hoy
sólo constan en handoffs de sesión y en el propio código.

## 4 · Observaciones

### La regla de dispersión (fase de escenarios a 90 días) es inalcanzable con las curvas por defecto

`UMBRAL_DISPERSION_90D_DEFECTO = 2,5` (`src/lib/escenarios-90d.ts:93`). Con
las rampas aprobadas por defecto, el cociente potencial/conservador de
contribución converge a **≈1,57**
(`src/lib/fixtures-correccion-producto.ts:106`: `(0,5+0,85+1)/(0,25+0,5+0,75)
≈ 1,5667`), muy por debajo del umbral. La regla sólo dispara si alguien
reconfigura las rampas de forma más agresiva (el caso de prueba con
cociente 5,0 en `src/lib/fixtures-correccion-producto.ts:127` usa rampas
reconfiguradas, no las aprobadas). **Funciona como red de seguridad ante una
reconfiguración futura, no como una protección activa hoy.** Que ningún
documento ni persona la lea como una protección vigente contra dispersión
alta con la configuración actual — con las curvas aprobadas, nunca se
activa.

### Los fixtures canónicos quedaron con 60% de cobertura de productos

`casoSnakeStore` y `casoTitanWebB1` (`src/lib/fixtures-casos.ts`) declaran
sólo 60% de cobertura de productos a propósito (captura real, catálogo
parcialmente relevado) — con la corrección de la fase 3 (unificación de
semántica de margen), esto significa que `margen_contribucion` (total)
queda retenido para ambos casos; sólo `margen_muestra` se calcula. Existen
variantes explícitas con 100% de cobertura para lo que necesite margen
total calculado: `casoSnakeStoreCoberturaCompleta`,
`casoTitanWebB1CoberturaCompleta`,
`casoTitanWebB1AntesDeCanalesCoberturaCompleta`
(`src/lib/fixtures-casos.ts:107-136`). **Toda prueba futura que necesite
margen total calculado debe usar explícitamente una de estas variantes, no
`casoSnakeStore`/`casoTitanWebB1` a secas** — usarlos sin la variante
`CoberturaCompleta` para probar algo que depende de margen total ahora
produce `null` por diseño, no un bug.

---

*(Este documento reemplaza a los handoffs de sesión como fuente de estado
por fase. Los handoffs siguen siendo bitácoras válidas de lo que se hizo en
cada sesión, pero el estado consolidado por fase vive acá. Se actualiza cada
vez que una fase cambia de estado, verificado contra el código en ese
momento — no contra el handoff que originó el cambio.)*
