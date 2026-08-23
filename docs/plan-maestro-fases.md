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

### Fase 8 — Retención, carrito y recompra — **PARCIAL, mapeo de hallazgos implementado (2026-08-23)**

- No hay numeración histórica equivalente confirmada.
- **Decisión comercial que la desbloqueó:** entrada 4 de
  `docs/decisiones-pendientes.md` (retención acotada a integraciones
  nativas de recuperación de carrito/recompra por email y WhatsApp).
- **Campos nuevos (`src/lib/diagnostico-form.ts`):** `retencion_canal_email`,
  `retencion_canal_whatsapp`, `retencion_canal_retargeting`,
  `retencion_secuencia_contactos`, `retencion_usa_cupon`,
  `retencion_cupon_pct`, `retencion_recuperacion_pct_actual`;
  `recompra_compradores_unicos`, `recompra_tasa_actual_pct`,
  `recompra_ventana_dias`, `recompra_ticket_segunda_compra`,
  `recompra_tiene_secuencia_postventa`, `recompra_costo_campana_mensual`
  (agregado 2026-08-23, corrección de deuda: antes recompra reutilizaba el
  cupón también como costo de campaña; son dos costos distintos — el cupón
  es descuento sobre el precio, la campaña es inversión en comunicación —
  y ahora se restan por separado). Todos opcionales, sólo cargados si
  aportan a un cálculo.
- **Fugas nuevas (`src/lib/calculo-diagnostico.ts`):** `recuperacion_carrito`
  y `recompra`, con impactos tipados `contribucion_incremental`. Base =
  total de carritos abandonados/compradores únicos (sin restar los ya
  recuperados); mejora = tasa objetivo (config, sin default de código:
  `recuperacion_carrito_esperada`/`recompra_esperada`) menos tasa actual.
  Regla del cupón: se descarta si la contribución post-descuento no sigue
  siendo positiva. Ninguna de las dos fugas existe (ni como no calculable)
  si no hay ningún dato del tema cargado — mismo criterio que
  `gasto_no_rentable` sin inversión publicitaria.
- **Mapeo de hallazgos (`src/lib/propuesta.ts`):** reemplaza al viejo
  `sin_retargeting` (un solo booleano) por el encadenamiento aprobado —
  `retencion_subir_plan` (recomendación) + `retencion_recuperacion_carrito`
  (servicio) cuando el plan no tiene carrito nativo;
  `retencion_recuperacion_carrito` (servicio) directo cuando sí lo tiene;
  `retencion_capacidad_desconocida` (contexto, sin recomendación de plan)
  cuando no se sabe; `retencion_carrito_fuera_de_alcance` (contexto, sin
  servicio) para WooCommerce. `recompra` como hallazgo separado, capa
  servicio sólo si los cinco datos mínimos permiten valorizarla.
- **Catálogo de servicios (`SERVICIOS`, `src/lib/propuesta.ts`):**
  reconciliado EXACTAMENTE al texto de la decisión comercial 5 (2026-08-23):
  "Meta Ads", "Google Ads", "Product Ads", "Desarrollo y optimización web",
  "Planificación y creación de contenido", "Diseño de marca". Las dos
  últimas correcciones de nombre ("Product Ads en Mercado Libre" → "Product
  Ads"; "Planificación de contenido" → "Planificación y creación de
  contenido") cerraron la deuda cosmética que había quedado documentada en
  la entrada 5 de `docs/decisiones-pendientes.md`.
- **Pruebas existentes:** `src/lib/retencion-fase8.test.ts` (25 casos:
  fugas, regla del cupón, costo de campaña separado del cupón,
  encadenamiento de hallazgos, casos límite de Mercado
  Libre/WooCommerce/capacidad desconocida).
- **Qué falta todavía:**
  - **Recompra sigue sin frecuencia de compra histórica, LTV ni cohortes**
    — este bloque agregó la valorización de UNA mejora de tasa de recompra
    puntual, no un motor de LTV/cohortes completo.
  - No hay UI para email marketing/fidelización más allá de los campos
    cargados; sigue siendo relevamiento de datos, no una integración real
    con ninguna plataforma de email/WhatsApp.
  - La fórmula de recuperación de carrito sigue sin un campo propio de
    costo de campaña (sólo tiene cupón): el texto original de fase 8
    mencionaba "incentivo y costos de campaña" para las dos fugas, pero la
    corrección de deuda de 2026-08-23 sólo pidió separarlo para recompra.
    Si en algún momento se necesita lo mismo para recuperación de carrito,
    es un campo nuevo análogo.
- **Riesgo:** ninguno nuevo más allá de lo ya documentado en las entradas
  4-7 de `docs/decisiones-pendientes.md`.
- **Bloqueo:** ninguno técnico.
- **Siguiente acción:** fase 9 (mayorista) implementada en un bloque
  posterior (ver esa sección más abajo) — detección del canal mayorista
  por plataforma y mapeo de hallazgos, mismo criterio que acá.

### Fase 9 — Mayorista y Mixto — **PARCIAL, motor de cálculo y mapeo de hallazgos implementados (2026-08-22)**

- **Denominación del plan maestro:** "Mayorista y Mixto".
- **Decisión comercial que la desbloqueó:** entrada 6 de
  `docs/decisiones-pendientes.md` — el mismo catálogo de seis servicios,
  aplicado a otro objetivo; no hay servicios B2B nuevos.
- **Arquitectura:** mayorista es un CANAL COMBINABLE (`venta_mayorista_activa`),
  no un tipo de diagnóstico separado. `venta_minorista_activa` es `true`
  por defecto (compatibilidad total con diagnósticos existentes);
  Minorista/Mayorista/Mixto (`modalidadComercial()`, `src/lib/mayorista.ts`)
  se derivan de la combinación de ambos, nunca se cargan directamente.
- **Módulo nuevo (`src/lib/mayorista.ts`):** motor de cálculo paralelo e
  independiente del engine minorista (`calculo-diagnostico.ts`) — usa su
  propia fórmula de piso de precio (cost-plus con componentes nombrados),
  distinta de `margenDeCanal()`. Nunca suma con `oportunidad_total` ni con
  las tres magnitudes de `impacto-economico.ts`: sus salidas son economía
  unitaria y estado de cartera, no fugas mensuales de la misma naturaleza.
  Expuesto en `derivados.mayorista` (`null` si el canal no está activo,
  mismo criterio que una fuga sin datos).
- **Fórmula del piso de precio (literal, tal como se definió):**
  costos variables = costo del producto + logística B2B + comisión
  comercial + costo de financiación + impuestos y cobranza (los cinco son
  necesarios: uno faltante retiene todo el cálculo, nunca se asume cero);
  precio mínimo = costos variables / (1 - margen objetivo); descuento
  máximo viable = 1 - (precio mínimo / precio minorista de referencia).
- **Otras salidas:** margen de contribución real (con el precio
  efectivamente cobrado), pedido mínimo rentable, contribución por pedido
  (con el ticket de recompra), facturación recurrente de la cartera actual,
  cuentas necesarias para un objetivo, capacidad máxima de facturación
  (antes de romper stock/servicio), recupero del CAC en meses.
- **Regla dura respetada:** cartera actual (hecho) y escenario de
  activación (leads → cuentas nuevas, proyección) son campos
  completamente separados en `MayoristaDerivado`, nunca combinados en una
  cifra. El escenario de activación sólo proyecta una cantidad si hay una
  tasa de cierre en configuración (`mayorista_tasa_cierre_esperada`, sin
  default de código — mismo criterio que `recuperacion_carrito_esperada`);
  sin esa config, documenta el funnel declarado (leads, cotizaciones,
  tiempo de cierre) sin afirmar una cifra.
- **Detección de canal por plataforma:** usa
  `CAPACIDADES_PLATAFORMA_DEFECTO.canal_mayorista` (ya relevado, fase 6);
  `planConCanalMayoristaDe()` (nuevo, `src/lib/canales.ts`) sugiere el
  primer plan de la plataforma que sí lo ofrece, mismo criterio que
  `planConCarritoNativoDe()` de fase 8.
- **Mapeo de hallazgos (`src/lib/propuesta.ts`):** canal no disponible
  (recomendación de plan + servicio "Desarrollo y optimización web");
  capacidad desconocida (contexto, sin recomendar plan); riesgo de
  canibalización si el precio mayorista es visible al cliente minorista
  (contexto, no un servicio); precio de venta por debajo del piso
  (recomendación); pedido mínimo declarado por debajo del piso rentable
  (recomendación); cartera activa sin funnel de captación declarado
  (servicio "Meta Ads y Google Ads" — mismo catálogo, objetivo B2B);
  concentración de cartera (contexto, se informa el dato sin clasificarlo
  en riesgo con un umbral inventado).
- **Campos nuevos (`src/lib/diagnostico-form.ts`):** ~30 campos, todos
  opcionales (`venta_minorista_activa`, `venta_mayorista_activa`, y el
  resto con prefijo `mayorista_`: catálogo apto, precio de lista, escalas,
  pedido mínimo, capacidad, tipo de comprador, condiciones de pago,
  cuentas activas, tickets, frecuencia, leads/cotizaciones/tiempo de
  cierre, CAC, concentración, canal usado, los cinco costos del piso,
  margen objetivo, precio de venta real, precio minorista de referencia,
  objetivo de facturación, visibilidad anti-canibalización). Nueva pestaña
  "Mayorista" en el formulario, visible sólo con `venta_mayorista_activa`.
- **Pruebas:** `src/lib/mayorista-fase9.test.ts` (41 casos): modalidad
  derivada, activación del bloque, las cinco fórmulas del piso de precio,
  pedido mínimo/contribución por pedido, cartera actual vs. objetivo
  (nunca combinados), capacidad máxima, recupero de CAC, escenario de
  activación (sin leads / con leads sin config / con leads y config),
  detección de canal por plataforma con datos reales de
  `CAPACIDADES_PLATAFORMA_DEFECTO`, anti-canibalización, y el mapeo
  completo de hallazgos.
- **Qué falta todavía:**
  - `src/documents/domain/build-context.ts:417` sigue con
    `modalidad: { minorista: true, mayorista: false }` hardcodeado: el
    canal mayorista todavía no llega a la capa de generación de
    documentos/PDF. Fuera de alcance de este bloque (que fue
    específicamente el motor de cálculo + mapeo de hallazgos, no la capa
    documental); queda para cuando se trabaje la integración de fase 9 con
    fases 11-13.
  - No hay soporte estructurado para escalas de precio por volumen (tablas
    de tramos): `mayorista_tiene_escalas_volumen` es puramente contextual,
    ninguna fórmula la usa — no había una fórmula definida para tramos.
  - Sin umbral de riesgo para concentración de cartera (a propósito: no
    hay un benchmark autorizado, se informa el dato crudo).
- **Riesgo:** ninguno nuevo más allá de lo ya documentado en la entrada 6
  de `docs/decisiones-pendientes.md`.
- **Bloqueo:** ninguno técnico.
- **Siguiente acción:** integrar `modalidad`/`mayorista` a la capa
  documental cuando se trabajen las fases 11-13 (no programado en este
  bloque).

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

### Fase 11 — Documento de diagnóstico — **FUNCIONAL, estructura de contenido ampliada Y capa visual aplicada (2026-08-22)**

- **Denominación del plan maestro:** "Documento de diagnóstico".
- **Estado real:** funcional (motor → plantilla → render → PDF completo),
  con la paleta, la tipografía de marca (Satoshi/Inter) y el logo ya
  aplicados. Pendiente: sólo el desglose por canal/producto/funnel
  documentado más abajo, y el rediseño de la interfaz de la herramienta
  (fuera de los documentos en sí).
- **Bloque técnico 2026-08-22 (fase 11/12, "parte funcional"):** primero se
  entregaron los cinco puntos que pide
  `docs/especificacion-visual-pdfs-fases-11-13.md` sección 12 — ver
  `docs/fase11-12-diseno-tecnico.md` (inventario de componentes, estructura
  de datos, wireframes, estrategia 16:9/A4, criterios de prueba). Después
  se reestructuró `diagnostico.ts` a las doce secciones del plan maestro:
  portada, cobertura, foto actual/canales/economía/productos/publicidad
  (comparten hoy el mismo `metric-grid` general — ver más abajo qué
  falta), funnel y hallazgos, riesgos y contradicciones, prioridades
  inmediatas, datos faltantes, próximo paso. "Riesgos y contradicciones"
  (`riskSection`) y "datos faltantes" (`missingDataSection`,
  `src/documents/templates/velocentum-v1/shared.ts`) son el MISMO array de
  restricciones, particionado por `bloquea.length > 0` — nunca una
  restricción duplicada entre las dos. "Prioridades inmediatas"
  (`immediatePrioritiesSection`) es un subconjunto filtrado de "Hallazgos
  priorizados" (`prioridad === "alta"`), no un dato nuevo. Se activó el
  bloque `next-step` (tipo ya declarado, sin usar en estos dos documentos)
  para la sección "Próximo paso". Se quitó `roadmapSection` del
  diagnóstico (no estaba en la lista de doce secciones del plan maestro; ya
  era un no-op porque `context.roadmap` está vacío para todo tipo de
  documento hoy — sin cambio de comportamiento real).
- **Qué NO se implementó en este bloque (documentado a propósito, no
  fue un olvido):** el desglose real por canal, por producto, de
  publicidad/medición y de funnel/retención (secciones 3, 5, 6 y 7 del
  plan maestro) sigue usando el `metric-grid` general existente, no una
  vista propia por ítem — porque `DocumentContextV1` hoy no tiene esos
  campos (no hay per-canal, per-producto, ni funnel/retención en el
  contrato documental), aunque el motor de cálculo SÍ los calcula
  (`derivados.canales`, `productosCargados()`, `derivados.funnel`). Es
  trabajo de plomería real pero no trivial: el diseño exacto de los campos
  nuevos que haría falta agregar está en
  `docs/fase11-12-diseno-tecnico.md`, punto 2, listo para implementar en un
  bloque técnico posterior sin tener que rediseñarlo de nuevo.
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
- **Bloque visual (2026-08-22), assets de marca aplicados:**
  - **Paleta:** los 14 tokens de
    `docs/especificacion-visual-pdfs-fases-11-13.md` sección 3, exactos, en
    `VELOCENTUM_LIGHT_V1` (`src/documents/theme/velocentum-light-v1.ts`):
    `primary: "#3B2EF5"`, `primaryBright: "#4B39FF"` (nuevo), `accent:
    "#7A6BFF"`, `ink: "#0D0B2D"`, `text: "#171437"` (nuevo), `muted:
    "#55546B"`, `border: "#D9D3FF"`, `borderSoft: "#E9E5FF"` (nuevo);
    `background`/`surface`/`surfaceSoft`/`success`/`warning`/`risk` ya
    coincidían. En el renderer web se agregaron variantes "-ink" NO parte
    de los 14 tokens (`--vdoc-success-ink`, `--vdoc-warning-ink`,
    `--vdoc-risk-ink`) para texto legible: los tokens de éxito/advertencia/
    riesgo usados directo como color de texto pequeño sobre blanco no
    llegan a 4.5:1 de contraste (advertencia: 1.67:1, verificado) — las
    variantes oscurecidas sí (6.5-7.1:1), sin cambiar el color de marca en
    sí, sólo dónde se usa como texto vs. como acento/borde/ícono.
  - **Tipografías:** Satoshi (Light/Regular/Medium/Bold/Black + itálicas,
    licencia ITF Free Font License 2.0 de Fontshare) e Inter (18pt
    Regular/Medium/SemiBold/Bold/ExtraBold, SIL OFL 1.1), copiadas a
    `src/assets/fuentes/` con sus LICENSE.txt. Registradas en
    @react-pdf/renderer como data URI en base64
    (`src/documents/theme/fuentes/registrar-fuentes.ts` +
    `*-datos.generated.ts`): el pipeline de fontkit que lee un archivo por
    ruta no está disponible en el entorno de despliegue serverless/edge de
    este proyecto (advertencia `IMPORT_IS_UNDEFINED` en cada build), así
    que un data URI en memoria es la única vía confiable. En el renderer
    web, `@font-face` auto-hosteado (ambas licencias permiten self-hosting).
  - **Logo:** símbolo y wordmark de Velocentum, en violeta y blanco
    (`src/assets/marca/*.svg`, generados desde el zip de logos originales
    cambiando sólo el `fill`, path por path idéntico — verificado por
    prueba). Reconstruidos como primitivas `<Svg>/<Path>` para PDF
    (`src/documents/renderers/pdf/marca.tsx`, con una prueba que compara
    cada `d`/`transform` contra el SVG fuente) y como `<img>` para web.
  - **Dos perfiles, un layout propio cada uno (no uno escalado del otro):**
    `createPdfDocumentElement(model, "pantalla" | "impresion")`. Pantalla:
    960×540 (16:9), como antes. Impresión: A4 (595.28×841.89), grilla de
    dos columnas en vez de tres, tarjetas anchas a página completa,
    cuerpo tipográfico mayor, franjas de acento de portada reescaladas
    con una prueba geométrica dedicada (evitó una regresión real: el
    subtítulo de portada quedaba detrás de la franja de color en A4 con
    los primeros valores).
  - **Descarga:** selector de perfil (pantalla/impresión) en
    `documentos.$id.$slug.tsx`.
- **Pruebas existentes:** `src/documents/build-document.test.ts`,
  `src/documents/domain/build-context.test.ts`,
  `src/documents/renderers/pdf/document.test.tsx` (incluye la prueba
  geométrica de portada, la de A4 real, y la de nombre largo/monto
  grande), `src/documents/renderers/pdf/marca.test.ts` (4 casos: paths
  idénticos a los SVG fuente), `src/documents/renderers/web/document-renderer.test.tsx`,
  `src/documents/theme/velocentum-light-v1.test.ts` (14 tokens exactos),
  `src/documents/templates/velocentum-v1/estructura-contenido-fase11-12.test.ts`
  (7 casos: diagnóstico nunca trae `scenarios`/`commercial-summary`/
  `commercial-offer`; riesgos y datos faltantes son particiones disjuntas;
  prioridades inmediatas es un subconjunto verificado).
- **Pruebas faltantes:** QA visual completa página por página con revisión
  humana (criterio de aceptación, sección 10) — se generaron y se
  entregaron 8 PDFs de revisión (Snake Store/Titan Web B1 × diagnóstico/
  proyección × pantalla/impresión) para esa revisión manual, pero no
  reemplaza una inspección exhaustiva de cada página de cada documento
  real.
- **Riesgo:** ninguno funcional. Limitación conocida, no bloqueante: el
  texto copiable de los PDF pierde la ligadura "fi" en algunos casos
  (ej. "Confianza" se copia como "Confanza") — se ve correctamente en
  pantalla/impresión, es un problema de mapeo Unicode del subset de
  fuente embebido, no de renderizado visual.
- **Bloqueo:** ninguno técnico.
- **Siguiente acción:** implementar el desglose por canal/producto/funnel
  documentado como pendiente arriba (único punto real que sigue faltando
  de fase 11/12); después, el rediseño de la interfaz de la herramienta
  (fuera de los documentos).

### Fase 12 — Documento de proyección — **FUNCIONAL, estructura de contenido ampliada Y capa visual aplicada (2026-08-22)**

- **Denominación del plan maestro:** "Documento de proyección".
- **Estado real:** funcional, con la paleta/tipografía/logo/perfiles
  pantalla-impresión ya aplicados — mismo diagnóstico que fase 11,
  comparten el mismo tema y el mismo renderer (ver el detalle completo del
  bloque visual en la sección de fase 11, no repetido acá).
- **Bloque técnico 2026-08-22:** reestructurado a las once secciones del
  plan maestro (`src/documents/templates/velocentum-v1/proyeccion-90d.ts`):
  portada, punto de partida, restricciones, escenarios (con el detalle
  mensual, la facturación incremental secundaria y el ahorro publicitario
  separado ya dentro del mismo bloque `scenarios`, sin sección de página
  aparte), supuestos, roadmap, condiciones para escalar y recalcular
  (`scalingConditionsSection`, restricciones filtradas por
  `bloquea.includes("escalamiento")`), próximo paso. La cifra de
  contribución incremental se mantiene ENCABEZANDO el documento (justo
  después de portada), antes de la línea de base y los escenarios en
  detalle: es una interpretación documentada, no una decisión nueva — la
  corrección aprobada 2026-08-21 (punto 2) ya estableció esa regla como
  "siempre", más específica que el orden literal de la lista de este
  bloque.
- **Evidencia:**
  - Plantilla versionada con escenarios y tabla mensual:
    `src/documents/templates/velocentum-v1/proyeccion-90d.ts`
    (`buildScenarios`, bloque `"scenarios"` con eyebrow "Escenarios").
  - Contribución como cifra dominante, facturación como contexto
    secundario: `src/documents/domain/resumen-comercial.ts`
    (`redaccionRangoContribucion`, "nunca la misma cifra").
- **Pruebas existentes:** `src/documents/domain/escenarios-90d.test.ts`,
  `src/documents/domain/resumen-comercial.test.ts`,
  `src/documents/templates/velocentum-v1/copy-guardrails.test.ts`
  (casos de proyección a 90 días),
  `src/documents/templates/velocentum-v1/estructura-contenido-fase11-12.test.ts`
  (condiciones para escalar filtradas correctamente).
- **Pruebas faltantes:** las mismas que fase 11 (QA visual humana completa).
- **Riesgo:** ninguno funcional nuevo.
- **Bloqueo:** ninguno técnico.
- **Siguiente acción:** el desglose por canal/producto/funnel pendiente de
  fase 11 también habilitaría más detalle acá (proyección por canal).

### Fase 13 — Propuesta comercial y rediseño visual — **PARCIAL, generador de paquetes implementado (2026-08-22)**

- **Denominación del plan maestro:** "Propuesta comercial y rediseño
  visual".
- **Estado real:** parcial, coincide con el plan maestro.
- **Decisión comercial que la desbloqueó:** entrada 7 de
  `docs/decisiones-pendientes.md` — escalera de hasta tres niveles
  (IMPULSO/TRACCIÓN/ESCALA, configurables), acumulativa, cada servicio
  ligado a un hallazgo concreto, precios siempre vacíos, confirmación
  manual obligatoria.
- **Bloque técnico 2026-08-22 ("parte funcional" de fase 13):**
  - `src/lib/paquetes.ts` (nuevo): `generarEscaleraPaquetes()` agrupa los
    hallazgos de capa "servicio" (`mapearHallazgos`) por servicio del
    catálogo cerrado (`serviciosJustificados`, reconoce servicios incluso
    dentro de strings compuestos como "Desarrollo y optimización web y
    Meta Ads" vía `serviciosCanonicosDe`), arma hasta tres niveles
    acumulativos (nunca más), cada línea de servicio con su unidad propia
    (campañas activas, piezas por mes, campañas, alcance descrito) y sus
    hallazgos justificantes, cantidades por defecto configurables
    marcadas `propuestoPorSistema: true`, precio siempre `null`.
  - `src/components/confirmacion-paquetes.tsx` (nuevo): pantalla de
    confirmación manual — ver los tres niveles, ajustar cantidades,
    agregar (sólo servicios ya justificados por algún hallazgo, nunca uno
    sin fundamento) o sacar servicios, cargar precios. `onConfirmar` sólo
    se dispara con la acción explícita del vendedor.
  - Wireado en `src/routes/_authenticated/diagnosticos.$id.tsx`
    (`SeccionPaquetes`, nueva): usa los `hallazgos`/`fugas`/`derivados` ya
    persistidos del diagnóstico, sin recalcular nada.
- **Interpretación documentada, no parte de la decisión cerrada** (entrada
  8 de `docs/decisiones-pendientes.md`, **RESUELTA**): el orden/reparto
  exacto de servicios entre niveles y el factor de escalado de cantidades
  por nivel no estaban especificados — se implementó un default razonable
  (orden fijo del catálogo, reparto parejo, cantidad × índice de nivel),
  completamente editable en la pantalla de confirmación; Matías confirmó
  que ese default ES la decisión comercial (el sistema propone, el
  vendedor ajusta), sin pedir ningún cambio.
- **Persistencia de la confirmación (entrada 9 de
  `docs/decisiones-pendientes.md`, RESUELTA el 2026-08-22, sin
  migración):** implementada sobre `diagnostico.propuesta` (JSONB, ya
  existente) — la columna pasó de guardar la propuesta redactada por el
  modelo directamente a guardar un sobre `{ propuesta, paquetes }`
  (`src/lib/contenido-propuesta.ts`), con compatibilidad hacia atrás para
  los diagnósticos guardados antes de este cambio. Nuevo server function
  `confirmarPaquetes` (`src/lib/paquetes.functions.ts`) persiste la
  selección confirmada leyendo el valor actual antes de escribir, para no
  pisar la propuesta ya generada; `generarPropuesta` se ajustó con el
  mismo criterio, para no pisar una selección de paquetes ya confirmada.
  Matías confirmó, al revisar la justificación técnica, que no había
  ninguna razón real (volumen, consultas cruzadas, integridad
  referencial, concurrencia) que exigiera una columna/tabla nueva — mismo
  patrón que todos los campos de las fases 3 a 13. Wireado en
  `diagnosticos.$id.tsx`: la pantalla ahora muestra la selección
  persistida al recargar, con una opción de "Editar de nuevo".
- **Lo que SIGUE pendiente, sin relación con la decisión 9:**
  `buildDocumentContext()` sigue con `comercial: null` incondicional
  (`src/documents/domain/build-context.ts:479`) — conectar la selección
  ya persistida hacia `SeleccionComercial` para que el PDF de propuesta la
  use es trabajo aparte, no bloqueado por ninguna decisión de base de
  datos.
- **Evidencia funcional construida (previa a este bloque):**
  - Plantilla de propuesta: `src/documents/templates/velocentum-v1/propuesta.ts`.
  - Salida combinada proyección + propuesta: `src/documents/templates/velocentum-v1/composicion.ts`.
- **Evidencia de lo visual, actualizada (bloque 2026-08-22):** el PDF de
  propuesta comparte el mismo tema/renderer que diagnóstico y proyección
  (fase 11), ya con la paleta de 14 tokens, Satoshi/Inter y el logo real,
  y ya con los dos perfiles (pantalla 16:9 / impresión A4) — ver el
  detalle completo en la sección de fase 11. Lo que sigue sin existir:
  rediseño de la interfaz de la herramienta en sí (fuera de los tres PDF).
- **Pruebas existentes:** `src/documents/templates/velocentum-v1/templates.test.ts`,
  `src/documents/renderers/pdf/filename.test.ts`,
  `src/documents/renderers/pdf/format.test.ts`,
  `src/lib/paquetes.test.ts` (25 casos: reconocimiento de servicios en
  strings compuestos, agrupación por servicio, escalera acumulativa, tope
  de tres niveles, precios siempre vacíos, unidades correctas por
  servicio, escalado de cantidad por nivel, validación de la escalera
  persistida), `src/components/confirmacion-paquetes.test.tsx` (4 casos,
  render estático), `src/lib/contenido-propuesta.test.ts` (10 casos:
  compatibilidad con la forma vieja de la columna, separar/combinar sin
  pisarse entre sí, ida y vuelta). No hay test dedicado para los server
  functions (`paquetes.functions.ts`/`propuesta.functions.ts`): mismo
  criterio que el resto del repo, son envoltorios finos de I/O sobre
  lógica pura ya probada.
- **Pruebas faltantes:** QA visual de la interfaz de la herramienta.
- **Riesgo:** ninguno nuevo; la selección confirmada ya se persiste.
- **Bloqueo:** ninguno técnico ni de base de datos.
- **Siguiente acción:** conectar la selección persistida hacia
  `SeleccionComercial`/`buildDocumentContext()` para que el PDF de
  propuesta la use; después, aplicar el sistema visual aprobado a los tres
  PDF y a la interfaz (comparte alcance con fases 11/12).

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
