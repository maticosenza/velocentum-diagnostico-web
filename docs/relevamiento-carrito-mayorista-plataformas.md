# Relevamiento · recuperación de carrito nativa y canal mayorista por plataforma

Relevamiento contra documentación oficial, realizado el 2026-08-22, como
condición previa de las decisiones comerciales 4 y 6
(`docs/decisiones-pendientes.md`). Bloque estrictamente de documentación y
estructura de datos: **no se implementó ningún mapeo de hallazgos, módulo
mayorista ni generador de paquetes** a partir de este relevamiento — eso
queda para un bloque técnico posterior, una vez aprobado este contenido.

La estructura de datos que representa estos dos atributos vive en
`src/lib/canales.ts` (`CapacidadesPlataforma`,
`CAPACIDADES_PLATAFORMA_DEFECTO`), como tabla hermana de
`ComisionPlataforma`/`COMISIONES_PLATAFORMA_DEFECTO`. Ningún valor de este
documento se inventó: donde no hubo una fuente oficial confiable, el
atributo queda `null` (desconocido) tanto en este documento como en el
código, nunca completado con una suposición razonable.

## Atributo A · recuperación de carrito nativa

Pregunta: ¿el plan de la plataforma incluye, de forma nativa (sin instalar
nada adicional ni pagar una extensión aparte), el envío automático de
recordatorios/recuperación a compradores que agregaron productos al
carrito y no completaron la compra?

| Plataforma | Plan | Recuperación de carrito nativa | Fuente oficial | Cita/paráfrasis |
|---|---|---|---|---|
| Tiendanube | Inicial | **NO** | [tiendanube.com/planes-y-precios](https://www.tiendanube.com/planes-y-precios) | La función "Recuperación de carritos abandonados" no aparece en el listado de características del plan Inicial. |
| Tiendanube | Esencial | **SÍ** | [tiendanube.com/planes-y-precios](https://www.tiendanube.com/planes-y-precios) | "Recuperación de carritos abandonados" listada explícitamente como incluida. |
| Tiendanube | Impulso | **SÍ** | [tiendanube.com/planes-y-precios](https://www.tiendanube.com/planes-y-precios) | Misma función listada explícitamente. |
| Tiendanube | Escala* | **SÍ** | [tiendanube.com/planes-y-precios](https://www.tiendanube.com/planes-y-precios) | Misma función listada explícitamente. |
| Tiendanube | Evolución* | **SÍ** | [tiendanube.com/planes-y-precios](https://www.tiendanube.com/planes-y-precios) | Misma función listada explícitamente. |
| Shopify | Basic | **SÍ** | [help.shopify.com/en/manual/b2b/getting-started/plan-features](https://help.shopify.com/en/manual/b2b/getting-started/plan-features) y [shopify.com/pricing](https://www.shopify.com/pricing) | "Abandoned checkout recovery" listada explícitamente en la tabla comparativa de planes, en las cuatro categorías. |
| Shopify | Grow | **SÍ** | ídem | ídem |
| Shopify | Advanced | **SÍ** | ídem | ídem |
| Shopify | Plus | **SÍ** | ídem | ídem |
| WooCommerce | (sin plan, autohosteado) | **NO** (nativo) | [woocommerce.com/products/abandoned-cart-recovery/](https://woocommerce.com/products/abandoned-cart-recovery/) | La recuperación de carrito no está en el núcleo de WooCommerce: sólo existe como extensión paga vendida en el marketplace oficial (publicada por el desarrollador tercero Addify, ~USD 79/año). No hay ningún plan/tier donde venga incluida por defecto. |
| Empretienda | (plan único) | **DESCONOCIDO** | [empretienda.com](https://www.empretienda.com/) (portada) | La función no aparece mencionada en el listado de características de la portada oficial (gestión de pedidos, productos, listas de email marketing, promociones), pero tampoco hay una negación explícita. No se encontró un artículo del centro de ayuda que lo confirme o lo descarte. Se deja como desconocido, no como "no", siguiendo la instrucción de no completar con suposiciones. |

*Nota sobre Tiendanube:* la plataforma tiene hoy **cinco** planes activos
según su página oficial de precios — Inicial, Esencial, Impulso, Escala y
Evolución —, dos más de los tres que modela `PLANES_POR_PLATAFORMA`
(`src/lib/diagnostico-form.ts`: sólo inicial/esencial/impulso). Se
incluyeron igual las claves `tiendanube_escala` y `tiendanube_evolucion` en
`CAPACIDADES_PLATAFORMA_DEFECTO` porque describen la plataforma real, pero
el formulario todavía no ofrece esos dos planes como opción seleccionable.
**Esto es un hallazgo para un bloque técnico posterior** (actualizar
`PLANES_POR_PLATAFORMA` y, de paso, revisar si `COMISIONES_PLATAFORMA_DEFECTO`
también necesita esas dos claves) — no se corrige en este bloque, que es
estrictamente documental.

## Atributo B · canal mayorista

Pregunta: ¿la plataforma ofrece, de forma oficial y documentada, un
canal/función de venta mayorista o B2B (precios diferenciados, cantidad
mínima de pedido, clientes mayoristas etiquetados, catálogos B2B), más allá
de simplemente poder vender cualquier cosa por la misma tienda?

| Plataforma | Canal mayorista | Nombre oficial | Fuente oficial | Cita/paráfrasis |
|---|---|---|---|---|
| Mercado Libre | **SÍ** | Mercado Libre Negocios | [news.mercadolibre.com/mercado-libre-b2b-en-argentina](https://news.mercadolibre.com/mercado-libre-b2b-en-argentina) | Unidad de negocio para compra y venta B2B; requiere CUIT válido; precios/listas mayoristas (descuentos reportados de hasta 50%), facturación estandarizada, financiación vía Mercado Pago, permisos delegados para colaboradores de la empresa, costos de envío más bajos en ventas mayoristas. Vigente en Argentina, México y Chile; Brasil pendiente al momento del relevamiento. |
| Tiendanube | Plan-dependiente | Ventas mayoristas (tablas de precios) | [ayuda.tiendanube.com/es_ES/ventas-mayoristas/...](https://ayuda.tiendanube.com/es_ES/ventas-mayoristas/que-es-y-como-configurar-la-funcion-de-ventas-mayoristas-y-minoristas-de-tiendanube) | "La funcionalidad de ventas mayoristas y el límite de tablas de precios disponibles dependen del plan que tengas activo en tu tienda." Inicial/Esencial: no disponible. Impulso: 1 tabla de precios. Escala: hasta 3 tablas. Evolución: tablas ilimitadas. |
| Shopify | **SÍ**, en todos los planes pagos | Shopify B2B | [help.shopify.com/en/manual/b2b/getting-started/plan-features](https://help.shopify.com/en/manual/b2b/getting-started/plan-features) | "Most B2B features are available on all plans, including companies, catalogs, net payment terms, self-serve ordering, and Shopify Flow automations." Basic/Grow/Advanced: hasta 3 catálogos activos vía Shopify Markets. Plus: catálogos ilimitados, asignación directa a compañías, depósito/pago parcial, checkout/storefront contextual (esto último también en Advanced). |
| WooCommerce | **NO** (nativo) | — | [woocommerce.com/products/b2b-for-woocommerce/](https://woocommerce.com/products/b2b-for-woocommerce/), [.../wholesale-for-woocommerce/](https://woocommerce.com/products/wholesale-for-woocommerce/), [.../b2b-wholesale-suite/](https://woocommerce.com/products/b2b-wholesale-suite/) | El núcleo de WooCommerce no tiene función mayorista/B2B propia. El marketplace oficial (woocommerce.com, operado por Automattic) vende varias extensiones pagas de terceros (B2B for WooCommerce, Wholesale for WooCommerce, B2B & Wholesale Suite) — vetadas por el marketplace oficial, pero desarrolladas por terceros, no construidas por el equipo core de WooCommerce como sí lo es Shopify B2B para Shopify. |
| Empretienda | **SÍ** | Vender por mayor | [empretienda.helpjuice.com/es_AR/venta-mayorista](https://empretienda.helpjuice.com/es_AR/venta-mayorista) | Desde Productos → Configuraciones avanzadas → Vender por mayor: permite diferenciar productos, precios, stock y cantidades/montos mínimos de venta mayorista vs. minorista dentro de la misma tienda; puede restringirse a clientes registrados. Empretienda tiene un único plan (sin niveles), así que la función no está condicionada por plan. |

## Caveats de confiabilidad de las fuentes

- **Mercado Libre:** la página orientada a vendedores
  (`vendedores.mercadolibre.com.ar`) bloqueó el acceso directo (403,
  probable protección anti-bot). Se usó el dominio oficial de prensa
  (`news.mercadolibre.com`) como fuente primaria, corroborado con
  fragmentos indexados de la nota para vendedores — no se pudo verificar la
  página completa de esa segunda fuente.
- **Tiendanube y Shopify:** fuentes oficiales de primera mano
  (`ayuda.tiendanube.com`, `help.shopify.com`, páginas oficiales de
  precios), con alta confianza. Los precios/nombres de plan pueden variar
  por país — este relevamiento refleja lo que devolvió la búsqueda en este
  momento (aparentemente Argentina, a juzgar por precios en ARS donde
  aplica).
- **WooCommerce:** es el caso más ambiguo de "oficial" — no hay función
  nativa en ningún caso, pero sí existen extensiones de terceros vendidas
  a través del canal oficial (`woocommerce.com`). Se reportó como NO nativo
  en ambos atributos, con la salvedad explícita de qué SÍ existe (vía
  extensión paga) para no dar una imagen incompleta.
- **Empretienda:** no se encontró una página de planes/precios separada de
  la portada (no indexada o no existente); el precio de portada puede
  haber cambiado para cuando se lea este documento. La recuperación de
  carrito nativa quedó explícitamente como **desconocida**, no como "no" —
  la ausencia en una portada de marketing es sugerente pero no
  concluyente.
- Todas las consultas se hicieron mediante herramientas de búsqueda y
  lectura de página (WebSearch/WebFetch) durante esta sesión (2026-08-22);
  no se inspeccionó HTML crudo en ningún caso. Si el contenido de estas
  páginas cambia, este relevamiento queda desactualizado hasta la próxima
  revisión — por eso todas las entradas de `CAPACIDADES_PLATAFORMA_DEFECTO`
  llevan `verificado: false` y una fecha de vigencia, nunca `verificado: true`.

## Qué queda como desconocido

- **Empretienda · recuperación de carrito nativa:** sin fuente oficial que
  lo confirme o lo descarte. `null` en el código
  (`CAPACIDADES_PLATAFORMA_DEFECTO.empretienda.recuperacion_carrito_nativa`).
- **Mercado Libre · recuperación de carrito nativa:** no aplica — Mercado
  Libre es un marketplace, no una plataforma de tienda propia con carrito
  propio; el atributo A está pensado para plataformas de tienda propia. Se
  dejó `null` con una nota explícita en el código, no un "no" implícito.

## Próximo paso (bloque técnico posterior, no iniciado acá)

1. Actualizar `PLANES_POR_PLATAFORMA` (`src/lib/diagnostico-form.ts`) para
   incluir los planes Escala y Evolución de Tiendanube, si se decide que el
   formulario debe ofrecerlos.
2. Implementar el encadenamiento de hallazgo de retención (decisión 4):
   `recomendacion` (subir de plan) → `servicio` (implementación de flujos)
   cuando `recuperacion_carrito_nativa` es `false`; `servicio` directo
   cuando es `true`; sin hallazgo de retención cuando es `null`
   (desconocido, no se afirma nada sin evidencia).
3. Implementar la detección de canal mayorista (decisión 6) a partir de
   `canal_mayorista` y el mapeo de hallazgos mayoristas a los seis
   servicios del catálogo (decisión 5), no a un catálogo B2B nuevo.
4. Confirmar directamente con Empretienda (o con un cliente real que lo
   use) si tiene recuperación de carrito nativa, para pasar de
   `desconocido` a un valor real.
