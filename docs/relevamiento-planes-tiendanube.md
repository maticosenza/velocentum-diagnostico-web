# Relevamiento · planes reales de Tiendanube y auditoría de las demás plataformas

Relevamiento contra documentación oficial, realizado el 2026-08-22, para
cerrar el hallazgo colateral detectado en el bloque de reconciliación del
plan maestro: el formulario modelaba 3 planes de Tiendanube y la
plataforma tiene 5, lo que hacía que un prospecto en Escala o Evolución no
pudiera cargar su plan real y recibiera una comisión de plataforma
equivocada (que entra directamente en `margen_contribucion`).

## Los 5 planes reales de Tiendanube

Fuente oficial: [tiendanube.com/planes-y-precios](https://www.tiendanube.com/planes-y-precios)
(precios Argentina), corroborado con
[ayuda.tiendanube.com/es_ES/123482-planes/...](https://ayuda.tiendanube.com/es_ES/123482-planes/cuales-son-los-planes-de-tiendanube-y-que-inlcuyen)
(centro de ayuda oficial). Consultado el 2026-08-22.

| Plan | Comisión por venta | Recuperación de carrito nativa | Ventas mayoristas |
|---|---|---|---|
| Inicial | **2%** (sin cambios respecto del valor ya cargado) | No | No |
| Esencial | **1%** (sin cambios) | Sí | No |
| Impulso | **0,7%** (sin cambios) | Sí | Sí — 1 tabla de precios |
| Escala | **Desconocida — "a convenir" por comercio** (la página oficial no publica un porcentaje fijo) | Sí | Sí — hasta 3 tablas de precios |
| Evolución | **Desconocida — "a convenir" por comercio** (ídem) | Sí | Sí — tablas ilimitadas |

Cita: "Note: All percentages refer to costs charged for payment methods
other than Pago Nube. Pago Nube transactions have no transaction fees
across all plans" (comisión de Pago Nube en 0 para todos los planes; el
resto de las pasarelas paga la comisión de plataforma indicada, o la
negociada en Escala/Evolución).

**Ningún plan cambió de nombre.** Inicial, Esencial e Impulso siguen
llamándose exactamente igual en la documentación oficial actual — no hizo
falta ningún alias ni renombre para preservar compatibilidad. Los
diagnósticos guardados con esos 3 planes siguen resolviendo la misma
comisión que antes (verificado con una prueba explícita en
`src/lib/canales.test.ts`).

**Por qué Escala y Evolución no tienen entrada en
`COMISIONES_PLATAFORMA_DEFECTO`.** La página oficial de precios muestra la
comisión de estos dos planes como "a convenir" — no hay un porcentaje
público fijo que relevar. Agregar un número ahí sería inventarlo, algo que
esta sesión tiene prohibido explícitamente. En su lugar:

- `src/lib/diagnostico-form.ts` (`PLANES_POR_PLATAFORMA.tiendanube`) sí
  incluye los 5 planes: el vendedor puede seleccionar Escala o Evolución
  correctamente al cargar un diagnóstico.
- `src/lib/canales.ts` (`COMISIONES_PLATAFORMA_DEFECTO`) NO tiene entrada
  para `tiendanube_escala` ni `tiendanube_evolucion`: `comisionPlataformaDe()`
  resuelve `null` para esos dos planes, exactamente el mismo comportamiento
  que ya existía para cualquier plataforma sin benchmark (por ejemplo,
  VTEX) — "sin dato, sin inventar", no un caso especial nuevo.
- `src/lib/canales.ts` (`CAPACIDADES_PLATAFORMA_DEFECTO`) sí tiene entrada
  completa para los 5 planes: la capacidad de carrito nativo y de canal
  mayorista de Escala y Evolución sí están documentadas con fuente oficial
  (relevadas en el bloque anterior, `docs/relevamiento-carrito-mayorista-plataformas.md`).

## Consecuencia sobre el margen (el motivo de este bloque)

Antes de este bloque, un prospecto real en el plan Escala o Evolución de
Tiendanube no podía cargar su plan en el formulario (no existía como
opción) — quedaba forzado a elegir uno de los 3 planes viejos, con lo cual
`comisionPlataformaDe()` resolvía la comisión de un plan que NO es el suyo
(por ejemplo, la de Impulso al 0,7%, cuando su comisión real podría ser
otra), y esa comisión entra directo en `margenDeCanal()` →
`margen_contribucion`. Con este bloque, el vendedor puede seleccionar el
plan real; si es Escala o Evolución, la comisión de plataforma queda en
`null` (dato desconocido, correctamente retenido) en vez de una cifra de
otro plan haciéndose pasar por la suya.

## Auditoría de las demás plataformas (Shopify, WooCommerce, Empretienda)

Pedido explícito: revisar si el formulario modela menos planes de los que
la plataforma ofrece hoy, documentando aunque no se corrija en este bloque.
Resultado: **sin discrepancia encontrada en ninguna de las tres.**

| Plataforma | Planes que modela el formulario | Planes reales según fuente oficial | Discrepancia |
|---|---|---|---|
| Shopify | Basic, Grow, Advanced, Plus (4) | Basic, Grow, Advanced, Plus (4) — [shopify.com/pricing](https://www.shopify.com/pricing), consultado 2026-08-22. Existe un plan "Starter" pero es sólo para venta por link/redes sociales, no una tienda completa; no aparece en la tabla comparativa de planes de tienda y no se cuenta acá. | Ninguna. |
| WooCommerce | Sin plan (autohosteado, comisión plana) | Sigue siendo un plugin autohosteado sin niveles de plan oficiales a nivel plataforma — no se encontró ninguna oferta de "plan" tarifado en woocommerce.com, sólo hosting/extensiones de terceros. | Ninguna. |
| Empretienda | Sin plan (plan único) | Sigue siendo un plan único, sin niveles — [empretienda.com](https://www.empretienda.com/), consultado 2026-08-22 ("$10.490/mes, sin comisión por venta"; el monto puede haber cambiado desde el relevamiento anterior de esta sesión, que registró $9.490 — variación de precio, no de estructura de planes). | Ninguna. |

Ninguna de las tres necesita una corrección de planes en este momento.

## Pruebas agregadas (`src/lib/canales.test.ts`)

- `PLANES_POR_PLATAFORMA` ofrece los 5 planes reales de Tiendanube, en el
  mismo orden que la página oficial.
- Los 3 planes preexistentes resuelven exactamente la misma comisión que
  antes de este bloque (0,02 / 0,01 / 0,007).
- Ningún plan preexistente fue renombrado (las 3 claves siguen existiendo
  tal cual en ambas tablas de defecto).
- Escala y Evolución resuelven `comisionPlataformaDe() === null` (sin
  inventar número), y no tienen entrada en `COMISIONES_PLATAFORMA_DEFECTO`.
- Un plan de Tiendanube inexistente sigue devolviendo `null`.
- La nueva función `entradaCapacidadesPlataforma()` resuelve correctamente
  la capacidad de carrito nativo por plan, incluidos Escala y Evolución, y
  devuelve `null` para una plataforma sin relevar.

## Qué queda pendiente

- Si en el futuro Tiendanube publica un porcentaje fijo para Escala/Evolución
  (hoy "a convenir"), agregar esas dos entradas a
  `COMISIONES_PLATAFORMA_DEFECTO` con la fuente real — no antes.
- El mapeo de hallazgos de retención y mayorista (decisiones 4 y 6 de
  `docs/decisiones-pendientes.md`) sigue sin implementarse; este bloque
  sólo corrige el relevamiento de planes, no programa ese mapeo.
