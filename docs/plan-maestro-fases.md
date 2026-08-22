# Plan maestro · matriz de fases (fuente única)

Documento de reconciliación entre el plan maestro consolidado (numeración
externa, catorce fases) y el estado real del código en este repositorio.
Bloque estrictamente documental: no se implementó ni se corrigió código
para producir este documento. Toda observación de "corrección necesaria"
queda anotada para un bloque técnico posterior, no aplicada acá.

**Fuentes incorporadas al repositorio en este bloque** (ya no dependen de
un archivo suelto pasado por chat):

- `docs/plan-maestro-consolidado-2026-08-21.md` — plan maestro consolidado
  de catorce fases, recibido de Matías el 2026-08-22, reproducido tal cual.
- `docs/especificacion-visual-pdfs-fases-11-13.md` — especificación visual
  de los tres PDF (diagnóstico, proyección, propuesta), material de
  referencia para las fases 11 a 13, recibida el mismo día.

**Línea base verificada en el árbol actual** (no contra handoffs previos ni
contra la línea base de 366 pruebas del plan maestro consolidado, que
corresponde a un HEAD anterior, `c4cb51a`):

- Rama: `feat/noche-continuacion`.
- **HEAD: `d07fcac`** (`Margen total exige 100% de cobertura de productos;
  corrige contradicción retenida bajo cobertura parcial`).
- Árbol de trabajo limpio al momento de esta verificación.
- `npm test -- --run`: **398 passed | 1 todo (30 archivos de prueba)**.
- `npm run typecheck`: limpio.
- `npm run build`: exitoso (sólo warnings preexistentes de
  `fontkit`/`@react-pdf`, no relacionados con este repositorio).

Con la incorporación del plan maestro consolidado, las catorce fases quedan
con nombre y alcance verificable. La matriz de abajo reconcilia cada una
contra el código real de este HEAD — no contra el HEAD `c4cb51a` que el plan
maestro usó como línea base, ni contra el texto del plan sin verificar.
Queda cerrada la decisión pendiente #3 (`docs/decisiones-pendientes.md`).

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

### Fase 1 — Baseline, fixtures y gobernanza — **COMPLETA**

- **Denominación del plan maestro:** "Baseline, fixtures y gobernanza".
- **Estado real:** completa, consistente con el plan maestro consolidado
  (`docs/plan-maestro-consolidado-2026-08-21.md`, sección 4).
- **Evidencia:**
  - Casos de regresión compartidos (Snake Store, Titan Web B1, estado
    intermedio antes de canales): `src/lib/fixtures-casos.ts:37-129`.
  - Titan Web B2 deliberadamente sin datos inventados:
    `casoTitanWebB2Pendiente` (`src/lib/fixtures-casos.ts:142-145`) y el
    `it.todo` correspondiente en `src/lib/regresion-2-6.test.ts` (sigue
    intacto en este HEAD).
  - Reglas de ausencia y triestado (cero/false/null tratados como hechos
    distintos, nunca intercambiables): `EstadoCanal = "declarado" |
    "ausente" | "no_aplica"` (`src/lib/canales.ts:32`); patrón repetido en
    `envioNetoVendedor()`, `componentePonderado()`, `hayInversionPublicitaria()`
    (`src/lib/calculo-diagnostico.ts`).
  - Compatibilidad con datos legados: `montosNetosDeDescuento()` respeta
    `base_montos === "neto"` de diagnósticos guardados antes del campo
    triestado (`src/lib/calculo-diagnostico.ts:457-461`); `envioNetoVendedor()`
    interpreta el campo legado `costo_envio_promedio` como neto.
  - Handoffs de sesión versionados en `docs/handoff-*.md` (bitácora, no
    fuente de estado — ese rol ahora lo cumple este documento).
- **Pruebas existentes:** `src/lib/regresion-2-6.test.ts`,
  `src/lib/entrega-2-5.test.ts`, y prácticamente toda la suite depende de
  estos fixtures compartidos (30 archivos, 398 pruebas).
- **Pruebas faltantes:** ninguna identificada para el alcance declarado.
- **Riesgo:** ninguno nuevo.
- **Bloqueo:** Titan Web B2 sigue bloqueado por datos externos (envío neto
  y liquidación real), tal como el plan maestro lo declara — no es un
  bloqueo de esta fase, es la razón por la que el `it.todo` sigue abierto.
- **Siguiente acción:** ninguna pendiente; fase cerrada.

### Fase 2 — Corrección económica y canales — **COMPLETA**

- **Denominación del plan maestro:** "Corrección económica y canales".
- **Estado real:** completa. El plan maestro la cerró el 21/08 sobre
  `c4cb51a`; desde entonces, la regla de contradicción de margen (parte de
  esta fase) se enriqueció sin reabrir el resto del alcance (ver bloque del
  22/08, commit `d07fcac`).
- **Evidencia:**
  - Envío por pedido/ticket, triestado, compatibilidad legada:
    `envioNetoVendedor()`, `faltaEnvioCobrado()`
    (`src/lib/calculo-diagnostico.ts:405-423`).
  - Financiación y descuentos (participación, netos, anti doble descuento):
    `costoFinanciacion()`, `costoDescuento()`, `participacionesIncompatibles()`
    (`src/lib/calculo-diagnostico.ts:468-529`).
  - Mix de canales, comisión por canal, cero contaminación tienda/marketplace:
    `margenDeCanal()` (`src/lib/calculo-diagnostico.ts:667-833`),
    `comisionEfectivaCanal()` (`src/lib/canales.ts`).
  - Product Ads incorporado a inversión y MER por perímetro:
    `inversionProductAds()`, `mer_tienda_propia`/`mer_marketplace`
    (`src/lib/calculo-diagnostico.ts:538-542,1095-1096`, nunca cruzados).
  - Cascada de funnel sin doble conteo: `src/lib/funnel.ts`.
  - Contradicción de margen: `src/lib/contradiccion.ts` — enriquecida el
    22/08 con `origen_margen`/`confianza_base` (commit `d07fcac`) sin
    cambiar umbrales ni la regla de cambio de signo.
  - Precisión decimal: `DECIMALES_TASA = 4`, `redondear()`
    (`src/lib/dinero.ts:12,53`).
- **Pruebas existentes:** `src/lib/calculo-diagnostico.test.ts`,
  `src/lib/canales.test.ts`, `src/lib/funnel.test.ts`,
  `src/lib/dinero.test.ts`, `src/lib/contradiccion.test.ts`,
  `src/lib/entrega-2-5.test.ts`, `src/lib/regresion-2-6.test.ts`.
- **Pruebas faltantes:** ninguna identificada para el alcance declarado.
- **Riesgo:** ninguno nuevo desde el cierre del 21/08, más allá de lo ya
  documentado en las entradas 1 y 3 de la contradicción (bloque del 22/08).
- **Bloqueo:** ninguno.
- **Siguiente acción:** ninguna pendiente; fase cerrada.

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

### Fase 4 — Evidencia, notas y hallazgos — **MAYORMENTE COMPLETA**

- **Denominación del plan maestro:** "Evidencia, notas y hallazgos". (No
  confundir con "fase 4" del handoff 21/08, que corresponde a **Fase 5**
  del plan maestro — ver tabla de equivalencias arriba).
- **Estado real:** mayormente completa, igual que declara el plan maestro
  consolidado.
- **Evidencia:**
  - Evidencia estructurada por estado (verificado/declarado/estimado/no
    disponible/no aplica): `export type Evidencia<T>`
    (`src/documents/domain/types.ts:13`).
  - Estados ausente/no aplica por canal: `EstadoCanal`
    (`src/lib/canales.ts:32`).
  - Notas visibles, filtrando vacíos: `notasVisibles()`
    (`src/lib/diagnostico-form.ts:393`).
  - Contradicción: `src/lib/contradiccion.ts` (ver fase 2).
  - Creativos evaluados por contenido, no por completitud:
    `evaluarEstadoCreativos()` (`src/lib/calculo-diagnostico.ts:126-139`).
  - Clips de Mercado Libre con campo triestado (`ml_tiene_clips`),
    resuelto y documentado en `docs/fase3-evidencia-pendiente.md`.
  - Financiación/descuento sólo con evidencia completa (participación Y
    costo, nunca uno solo): `componentePonderado()`
    (`src/lib/calculo-diagnostico.ts:432-446`).
- **Pruebas existentes:** `src/lib/fase3-bugfixes.test.ts`,
  `src/lib/vista-diagnostico.test.ts`, partes de
  `src/lib/calculo-diagnostico.test.ts`.
- **Pruebas faltantes:** ninguna identificada para el alcance implementado.
- **Riesgo:** ninguno nuevo.
- **Bloqueo:** el hallazgo "plan de plataforma mal dimensionado" sigue
  bloqueado por falta de datos (costo del plan actual, costo de
  alternativa, límite de uso, ahorro verificable) —
  `docs/fase3-evidencia-pendiente.md`. Es el único pendiente de esta fase,
  y coincide exactamente con lo que declara el plan maestro consolidado.
- **Siguiente acción:** relevar esos cuatro datos en el formulario antes de
  reactivar el hallazgo — no forma parte de este bloque documental.

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

### Fase 9 — Mayorista y Mixto — **PENDIENTE**

- **Denominación del plan maestro:** "Mayorista y Mixto".
- **Estado real:** pendiente, sin cambios desde el 21/08. Corresponde al
  trabajo que `docs/cola-nocturna.md` menciona sin numeración ni alcance
  como "mayorista-mixto" — confirmado ahora que es la fase 9.
- **Evidencia de lo poco que existe:** sólo un *placeholder* de tipo y un
  valor hardcodeado, sin ninguna lógica de negocio detrás:
  `modalidad: { minorista: boolean; mayorista: boolean }`
  (`src/documents/domain/types.ts:257-258`),
  consumido como `modalidad: { minorista: true, mayorista: false }` fijo
  (`src/documents/domain/build-context.ts:417`) — no depende de ningún
  dato del formulario, es un valor constante.
- **Qué falta concretamente:** todo lo que el plan maestro pide — precios y
  escalas mayoristas, pedido mínimo, costos B2B, condiciones de pago,
  funnel de cuentas, recompra, capacidad, concentración, adquisición
  (Mayorista); canales activables, variables compartidas una sola vez,
  comparabilidad, anti-canibalización (Mixto). No existe ningún campo en
  `src/lib/diagnostico-form.ts` para pedido mínimo, precio por escala,
  condiciones de pago B2B ni concentración de cartera.
- **Pruebas existentes:** ninguna (no hay lógica que probar).
- **Pruebas faltantes:** todas — dependen del alcance que se defina.
- **Riesgo:** ninguno técnico nuevo; el riesgo es puramente de alcance.
- **Bloqueo:** comercial — el plan maestro es explícito: hace falta
  definir qué servicios B2B vende Velocentum antes de programar esta fase.
- **Siguiente acción:** no programar nada hasta esa definición comercial.

### Fase 10 — Motor de escenarios a 90 días — **TÉCNICAMENTE COMPLETA**

- **Denominación del plan maestro:** "Motor de escenarios a 90 días".
- **Estado real:** técnicamente completa, tal como declara el plan maestro.
- **Evidencia:**
  - Tres escenarios (conservador/base/potencial), detalle mensual,
    separación acumulado 90 días vs. ritmo mensual del día 90:
    `calcularEscenarios90d()` (`src/lib/escenarios-90d.ts`).
  - Curvas por magnitud, verificadas exactamente contra el plan maestro:
    `RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO` — conservador 25/50/75,
    base 40/70/100, potencial 50/85/100
    (`src/lib/escenarios-90d.ts:51-55`);
    `RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO` — conservador 50/75/100, base
    75/100/100, potencial 85/100/100 (`src/lib/escenarios-90d.ts:70-74`).
  - Retención por evidencia/margen/envío: `contradiccionSinConfirmarBloqueaProyeccion()`
    (`src/lib/escenarios-90d.ts:291-295`).
  - Límites y supuestos visibles en cada línea (`ValorPublicable<T>` con
    `supuestos: string[]`).
- **Pruebas existentes:** `src/lib/escenarios-90d.test.ts`,
  `src/documents/domain/escenarios-90d.test.ts`,
  `src/lib/fixtures-correccion-producto.ts`,
  `src/lib/fixtures-impactos-manual.ts`.
- **Pruebas faltantes:** ninguna a nivel de motor. El plan maestro señala
  una falta de **producto**, no de código: validar el lenguaje y los
  escenarios con 2-3 casos reales antes de integrarlo — no hay evidencia en
  este repositorio de que ese piloto se haya hecho.
- **Riesgo:** ninguno técnico nuevo.
- **Bloqueo:** ninguno técnico; el piloto con casos reales es un paso de
  producto, no de código.
- **Siguiente acción:** ninguna de código pendiente; considerar el piloto
  de validación con 2-3 casos reales antes de apoyarse en el lenguaje de
  escenarios frente a un cliente.

### Fase 11 — Documento de diagnóstico — **FUNCIONAL / VISUAL PENDIENTE**

- **Denominación del plan maestro:** "Documento de diagnóstico".
- **Estado real:** funcional (motor → plantilla → render → PDF completo),
  visual pendiente — coincide con el plan maestro.
- **Evidencia funcional:**
  - Plantilla versionada: `src/documents/templates/velocentum-v1/diagnostico.ts`.
  - Modelo documental: `DocumentContextV1` (`src/documents/domain/types.ts`).
  - Render web y PDF: `src/documents/renderers/web/document-renderer.tsx`,
    `src/documents/renderers/pdf/document.tsx`.
  - Guardrails de redacción (frases prohibidas, sin placeholders/`NaN`):
    `src/documents/templates/velocentum-v1/copy-guardrails.test.ts`.
  - Descarga: wireado en las rutas de `src/routes/_authenticated/`.
  - Regla "no debe mostrar escenarios/paquete/precio" ya respetada
    estructuralmente: `diagnostico.ts` no referencia `scenarios` ni
    `comercial` en ningún bloque (verificado por grep).
- **Evidencia de lo visual pendiente:** el render PDF ya usa formato
  horizontal 16:9 (`PAGE_SIZE: [number, number] = [960, 540]`,
  `src/documents/renderers/pdf/document.tsx:22`), pero el tema
  (`VELOCENTUM_LIGHT_V1`, `src/documents/theme/velocentum-light-v1.ts:5-16`)
  no usa todavía la paleta de la especificación visual
  (`docs/especificacion-visual-pdfs-fases-11-13.md`): `primary: "#2A1EC9"`
  y `accent: "#7B5CFF"` en el tema actual vs. `#3B2EF5` (primario) y
  `#7A6BFF` (primario suave) en la especificación aprobada; `ink: "#0F0A2E"`
  vs. `#0D0B2D` (navy); `border: "#E8E7F2"` vs. `#D9D3FF`/`#E9E5FF`. En
  cambio, `background: "#FAF9FF"`, `surfaceSoft: "#F2EFFF"`,
  `success: "#20A464"`, `warning: "#FBBF24"`, `risk: "#D64A4A"` y la
  tipografía (Satoshi/Inter) **ya coinciden exactamente** con la
  especificación — no es un rediseño desde cero, es un ajuste de paleta.
  No existe un perfil A4 separado (sólo el de pantalla 16:9).
- **Pruebas existentes:** `src/documents/build-document.test.ts`,
  `src/documents/domain/build-context.test.ts`,
  `src/documents/renderers/pdf/document.test.tsx`,
  `src/documents/renderers/web/document-renderer.test.tsx`,
  `src/documents/theme/velocentum-light-v1.test.ts`.
- **Pruebas faltantes:** QA visual página por página (criterio de
  aceptación de la especificación, sección 10) — no automatizado hoy.
- **Riesgo:** ninguno funcional; el riesgo es puramente de que el
  documento actual no transmite todavía la identidad visual aprobada.
- **Bloqueo:** ninguno técnico.
- **Siguiente acción:** con la especificación ya versionada
  (`docs/especificacion-visual-pdfs-fases-11-13.md`), el bloque técnico de
  fase 11 debe devolver primero los cinco puntos que la propia
  especificación pide antes de tocar código (inventario de componentes,
  estructura de datos por componente, wireframes, estrategia 16:9/A4,
  criterios de prueba) — no implementar directamente.

### Fase 12 — Documento de proyección — **FUNCIONAL / VISUAL PENDIENTE**

- **Denominación del plan maestro:** "Documento de proyección".
- **Estado real:** funcional, visual pendiente — mismo diagnóstico que
  fase 11, comparten el mismo tema y el mismo renderer.
- **Evidencia:**
  - Plantilla versionada con escenarios y tabla mensual:
    `src/documents/templates/velocentum-v1/proyeccion-90d.ts:23-66`
    (`buildScenarios`, bloque `"scenarios"` con eyebrow "Escenarios").
  - Contribución como cifra dominante, facturación como contexto
    secundario: `src/documents/domain/resumen-comercial.ts`
    (`redaccionRangoContribucion`, "nunca la misma cifra").
- **Pruebas existentes:** `src/documents/domain/escenarios-90d.test.ts`,
  `src/documents/domain/resumen-comercial.test.ts`,
  `src/documents/templates/velocentum-v1/copy-guardrails.test.ts`
  (casos de proyección a 90 días).
- **Pruebas faltantes:** las mismas que fase 11 (QA visual).
- **Riesgo:** ninguno funcional nuevo.
- **Bloqueo:** ninguno técnico.
- **Siguiente acción:** se resuelve en el mismo bloque técnico que fase 11
  (comparten tema y renderer); no es un bloque separado de trabajo visual.

### Fase 13 — Propuesta comercial y rediseño visual — **PARCIAL**

- **Denominación del plan maestro:** "Propuesta comercial y rediseño
  visual".
- **Estado real:** parcial, coincide con el plan maestro.
- **Evidencia funcional construida:**
  - Plantilla de propuesta: `src/documents/templates/velocentum-v1/propuesta.ts`.
  - Salida combinada proyección + propuesta: `src/documents/templates/velocentum-v1/composicion.ts`.
- **Evidencia de lo pendiente funcional:** existe el tipo que exige
  selección manual (`SeleccionComercial`, con `aprobadaManualmente: true`
  literal — `src/documents/domain/types.ts:210-222`), pero no hay ningún
  flujo ni interfaz que lo complete: `buildDocumentContext()` fija
  `comercial: null` de forma incondicional
  (`src/documents/domain/build-context.ts:479`). El sistema no inventa
  precios porque **no hay forma de cargar ninguno todavía**, ni siquiera
  manualmente.
- **Evidencia de lo pendiente visual:** mismo diagnóstico de paleta que
  fase 11 (tema compartido). No hay perfil A4 diferenciado del de pantalla
  16:9. No se encontró rediseño de la interfaz de la herramienta (fuera de
  documentos) hacia el sistema visual aprobado.
- **Pruebas existentes:** `src/documents/templates/velocentum-v1/templates.test.ts`,
  `src/documents/renderers/pdf/filename.test.ts`,
  `src/documents/renderers/pdf/format.test.ts`.
- **Pruebas faltantes:** todo lo relacionado con el selector manual de
  servicios/paquete/precio (no existe UI que probar); QA visual de la
  interfaz de la herramienta.
- **Riesgo:** ninguna propuesta real puede llevar precio hoy sin editar el
  dato a mano fuera del flujo normal — el selector manual es un vacío
  funcional real, no sólo visual.
- **Bloqueo:** ninguno técnico; el selector manual depende de decidir la
  UX de carga (quién completa `SeleccionComercial` y dónde).
- **Siguiente acción:** dos bloques separados — (a) construir el selector
  manual de servicios/paquete/precio (funcional, no visual); (b) aplicar el
  sistema visual aprobado a los tres PDF y a la interfaz (comparte alcance
  con fases 11/12 para la parte de documentos).

### Fase 14 — QA final, integración y publicación — **PENDIENTE**

- **Denominación del plan maestro:** "QA final, integración y
  publicación".
- **Estado real:** pendiente, sin ningún avance — coincide con el plan
  maestro. Confirmado: no existe ningún framework de pruebas E2E en este
  repositorio (`grep` de `playwright`/`cypress`/`e2e` sin resultados en
  `package.json` ni en el árbol de archivos).
- **Evidencia:** el orden que pide el plan maestro (QA numérico, QA visual,
  E2E, piloto, seguridad/compatibilidad/rollback, PR a `main`, publicación
  controlada) no tiene ningún paso iniciado en este repositorio más allá
  del QA numérico que ya cubre la suite de 398 pruebas (que corresponde a
  fases anteriores, no a un QA final consolidado).
- **Pruebas existentes:** ninguna de integración/E2E.
- **Pruebas faltantes:** todas las de esta fase.
- **Riesgo:** ninguno nuevo; es la fase de cierre, depende de que 3, 6, 7,
  8, 9, 11, 12 y 13 avancen primero.
- **Bloqueo:** depende de que las fases de producto (7, 8, 9) y de diseño
  (11, 12, 13) avancen antes de tener sentido.
- **Siguiente acción:** ninguna todavía — es, por diseño del propio plan
  maestro, la última fase.

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
