# Escenarios de validación de criterio (loop nocturno, bloque 1, 2026-08-22)

Seis diagnósticos ficticios pero coherentes, en
`src/lib/fixtures-escenarios-demo.ts`, generados para juzgar si la lectura
del negocio que arma el sistema (hallazgos, servicios recomendados,
prioridades) es defendible frente al dueño de la tienda. **No es una
prueba de que el cálculo dé bien** — eso ya lo cubre la suite de
regresión (`fixtures-casos.ts`, `esperadosFase2`, y el resto de
`src/lib/*.test.ts`). Es una prueba de lectura de negocio, con datos
diseñados a mano.

Los 36 PDF de revisión (diagnóstico + proyección + propuesta, en pantalla
y en impresión, por escenario) se generaron con
`src/documents/renderers/pdf/generar-pdfs-escenarios-demo.test.ts` y se
entregaron para revisión visual. `src/lib/fixtures-escenarios-demo.test.ts`
verifica que ninguno de los seis se usa como referencia de cálculo en la
suite de regresión.

**No se corrigió nada en este bloque.** Todo lo de abajo es hallazgo para
revisión de Matías.

---

## Síntesis: tres incoherencias con evidencia dura

### 1 · Margen negativo → silencio total (escenario 4, el más grave)

Con margen de contribución en **-7%** (el negocio pierde plata en cada
venta) y MER en 15x (aparenta ser un resultado excelente), el sistema
genera:

- **Cero hallazgos de capa "servicio" o "recomendacion".** El único
  hallazgo es "Comisiones de la plataforma y del marketplace", capa
  "contexto" — un dato informativo, no una alerta.
- **`oportunidad_total: 0`.** Ninguna fuga cuantificada.
- La fuga `gasto_no_rentable` queda `calculable:false` con
  `faltantes: ["margen_contribucion"]` — un nombre de campo **engañoso**:
  el margen NO falta, está calculado (-7%, "confianza alta", visible en
  la tarjeta "Margen total" de la página 3 del PDF). Lo que pasa es que
  `margenPositivo` en `calculo-diagnostico.ts` sólo acepta valores `> 0`
  (`margen !== null && margen > 0 ? margen : null`), así que un margen
  negativo se trata exactamente igual — a nivel de "qué falta" — que un
  margen que nunca se cargó.
- **No hay página "Riesgos y contradicciones"** en el PDF (la sección se
  omite por completo, sin ningún ítem que mostrar).

Visualmente: la página 3 del diagnóstico ("Foto actual") sí muestra
"Margen total -7,0%" — el dato crudo está ahí, a la vista, para quien lo
busque. Pero la página 5 ("Hallazgos priorizados") — la que en teoría le
dice al vendedor y al dueño de la tienda qué es lo urgente — no tiene
absolutamente nada sobre el problema más grave posible en un negocio: que
cada venta cuesta más de lo que factura. Un dueño de tienda que sólo lee
la sección de hallazgos (que es, en la práctica, para qué existe el
diagnóstico) se va sin saber que está perdiendo plata en cada pedido.

**Esto es "una recomendación que no se sostiene con los datos" en su
forma más extrema: no es una mala recomendación, es la AUSENCIA de
cualquier recomendación donde más se necesita.**

### 2 · Negocio sano con $9,8M/mes en "prioridades ALTA" (escenario 5)

Margen 57%, MER 25x (bien por encima del breakeven de 1,75x), funnel
"razonable", contenido activo — el escenario diseñado para ser "todo
funciona". El PDF de diagnóstico, en la sección **"Prioridades
inmediatas"** (la que el plan maestro define como el foco más urgente del
documento), muestra:

| Hallazgo | Prioridad | Monto |
|---|---|---|
| Pocas visitas llegan a agregar al carrito | ALTA | $3.562.500 |
| Carritos que no llegan al checkout | ALTA | $3.420.000 |
| Checkouts iniciados que no terminan en compra | ALTA | $2.850.000 |

Total: **$9.832.500/mes**, el **39% de la facturación mensual** (25M),
todos con prioridad "ALTA" — el mismo nivel de urgencia que, en el
escenario 4, no se le asigna a un negocio literalmente perdiendo plata en
cada venta.

La causa técnica: los tramos del funnel (`tramosFunnel`, `funnel.ts`)
valorizan la mejora completa hasta el umbral objetivo, a margen de
contribución completo, sin ponderar si el resto del negocio ya está sano.
Una conversión de 1,33% (mi diseño para "razonable", no catastrófica —
el umbral verde es 1,8%) genera, a un ticket de $100.000 y margen de 57%,
una cifra de "oportunidad" enorme en términos absolutos. El mecanismo en
sí mismo (tres tramos disjuntos, sin doble conteo) está bien diseñado y
ya fue auditado en fases anteriores — el problema es que **la escala en
pesos de una mejora de funnel modesta puede leerse como una emergencia
cuando el negocio de base es grande**, y el sistema no tiene ningún
mecanismo que module la prioridad ALTA/MEDIA/BAJA según qué tan sano está
el resto del negocio.

**Esto es exactamente lo que pedía marcar el bloque: "una prioridad que
no coincide con el impacto económico" y "el escenario 5 generando fugas
grandes sobre un negocio sano".**

### 3 · Dos hallazgos que se disparan sin verificar la condición que describen (escenario 1)

**a) "Mix de producto desalineado con el margen" (`mix_producto`,
`propuesta.ts`) recomendando Meta Ads para un problema que Meta Ads no
puede resolver.**

El escenario 1 tiene **un solo producto**. No hay "mix de producto"
posible — sólo hay un SKU. El hallazgo se dispara igual, porque la
comparación real que hace el código no es "margen de un producto vs. otro
producto": es "margen del producto en el canal principal (Mercado Libre,
33%, por tener más facturación) vs. margen ponderado total entre los dos
canales (37,2%, mezclando Mercado Libre con tienda propia al 47%)". Con
dos canales de comisión distinta vendiendo el MISMO producto, esa
comparación **siempre** va a dar "desalineado", sin que exista ningún
problema de mix real. El título del hallazgo, la nota que arma el
sistema y el servicio recomendado (Meta Ads) describen un problema de
catálogo que no existe; el problema real (si lo hay) es que la comisión
de Mercado Libre es más alta que la de la tienda propia — algo que Meta
Ads no cambia.

**b) "Product Ads sin ROAS objetivo por familia" (`product_ads`,
`propuesta.ts`) con Product Ads en 10x de ROAS real.**

En el escenario 1, Product Ads de Mercado Libre invierte $200.000 y
factura $2.000.000 atribuidos: ROAS 10x, un resultado muy bueno. El
hallazgo se dispara igual — el código sólo verifica
`datos.ml_product_ads === true`, nunca compara el ROAS real contra
ningún objetivo. Cualquier vendedor de Mercado Libre que tenga Product
Ads activado recibe este hallazgo, esté rindiendo 10x o rindiendo 0,5x.
Es un "servicio recomendado sin un hallazgo real que lo justifique": la
condición que dispara el hallazgo (`ml_product_ads === true`) no es la
condición que el título describe (falta de objetivo de ROAS).

---

## Detalle por escenario

### 1 · Marketplace fuerte, tienda floja

- **Diseño:** Mercado Libre 70% de la facturación con margen 33%; tienda
  propia 30% con margen 47% pero 150.000 visitas/mes contra apenas 150
  pedidos (CR global 0,1%).
- **Qué priorizó el sistema:** `estructura_cuenta` (fragmentación de
  cuenta, agrava por `sobrefragmentacion` calculable en $158.777),
  `mix_producto` (ver hallazgo #3a arriba — falso positivo), los tres
  tramos del funnel de tienda propia (navegación $1.769.692, carrito
  $1.755.535 — ambos "sospechosos", topeados por la red de seguridad —,
  checkout $315.996), `product_ads` (ver #3b arriba — falso positivo).
- **Servicios recomendados:** Meta Ads (×3, por tres hallazgos
  distintos), Desarrollo y optimización web (×2), Product Ads.
- **Coherencia:** el funnel de tienda propia SÍ está correctamente
  identificado como el problema central (visitas altísimas, conversión
  casi nula) — ahí el sistema acierta. Pero dos de los siete hallazgos
  (mix_producto, product_ads) son ruido: describen problemas que no
  existen con los datos cargados. Un lector que confía en la lista
  completa se lleva dos frentes de trabajo falsos.
- **Nota:** varios montos quedaron marcados `sospechosa: true` (topeados
  por `tope_fuga_individual`/`tope_fuga_total`, calibrados sobre una
  facturación de $10M) — comportamiento correcto de la red de seguridad,
  no un hallazgo nuevo, pero vale aclararlo porque los PDF de este
  escenario muestran cifras "topeadas", no las brutas.

### 2 · Margen alto, volumen bajo

- **Diseño:** ticket $300.000, margen 67%, sólo 10 pedidos/mes. El piso
  mensual para que un conjunto de Meta salga de aprendizaje (~$28M) es
  más de 9 veces la facturación total (3M).
- **Qué priorizó el sistema:** `estructura_cuenta` (incluye, en el
  contexto que redacta el modelo, tanto la fragmentación como el volumen
  insuficiente — ver nota abajo), los tres tramos de funnel.
- **Servicios recomendados:** Meta Ads, Desarrollo y optimización web.
- **Coherencia:** la lectura de fondo es correcta —
  `volumen_suficiente: false` sí se detecta y sí entra al contexto del
  hallazgo (`lecturaPresupuesto` ya tiene el texto correcto: "el
  problema no es de plata, es de estructura de cuenta o... consolidar en
  un solo conjunto"). Lo que puede ser cuestionable es que el ÚNICO
  servicio mapeado sea "Meta Ads": si el diagnóstico real es "este
  negocio todavía no tiene el volumen para que Meta funcione", venderle
  más trabajo de Meta Ads antes de resolver el volumen (¿tráfico?
  ¿conversión? ¿precio?) podría no ser la secuencia correcta. Esto no es
  un hallazgo "roto" (los tres síntomas de estructura de cuenta —
  fragmentación, presupuesto, volumen — se leen deliberadamente como uno
  solo, decisión ya auditada en una fase anterior) pero vale que Matías
  lo revise: ¿la propuesta comercial debería, en este caso, ofrecer algo
  distinto de Meta Ads primero?

### 3 · Margen fino, volumen alto

- **Diseño:** ticket $8.000, margen 9,25% (después de envío), 5.000
  pedidos/mes. Piso mensual para un conjunto (~$103k) es trivial frente a
  la facturación ($40M): puede escalar. Pero el margen es tan fino que el
  envío por sí solo le comió ~4 puntos.
- **Qué priorizó el sistema:** los tres tramos de funnel ($1.480.000 +
  $792.857 + $518.000 = $2.790.857), sin `sobrefragmentacion` (la cuenta
  está bien dimensionada: `estados.cuenta: verde`).
- **Servicios recomendados:** Desarrollo y optimización web, Meta Ads
  (en el tramo de carrito).
- **Coherencia:** correcta en lo estructural (cuenta sana, volumen
  suficiente, sin ruido de mix_producto porque hay un solo canal). El
  matiz que el sistema NO comunica en ningún hallazgo explícito es la
  fragilidad del margen en sí: `estados.economia` da "amarillo" (MER
  13,3x contra un objetivo de 16,6x, arriba del breakeven de 10,8x) pero
  no hay ningún hallazgo dedicado a "tu margen es tan fino que cualquier
  variación de costo te pone en rojo" — la fragilidad del margen queda
  implícita en el estado "amarillo" de economía, sin un hallazgo propio
  que la nombre. No es incorrecto, pero es una oportunidad de lectura que
  el sistema deja pasar.

### 4 · ROAS bueno, margen negativo

Ver síntesis #1 arriba — el hallazgo central de este bloque.
Complementario: `estados.cuenta` y `estados.economia` quedan en
`"sin_datos"` (no "rojo") porque `breakeven_roas`/`cpa_objetivo` dependen
de `margenPositivo`, que es `null` con margen negativo. El semáforo del
diagnóstico, en este escenario, literalmente no tiene un estado "rojo"
disponible para mostrar — pasa directo de "sin datos" a nada, nunca pasa
por "esto está mal".

### 5 · Todo sano

Ver síntesis #2 arriba. Complementario: el bloque "Riesgos y
contradicciones" no aparece (no hay ninguna restricción activa,
correcto), pero "Prioridades inmediatas" sí aparece con tres ítems en
ALTA — la única sección de "alarma" del documento la dispara,
paradójicamente, el escenario diseñado para no tener alarmas.

### 6 · Solo orgánico

- **Diseño:** sin un peso de inversión publicitaria (`inversion_meta`/
  `inversion_google` en 0 explícito), sin Mercado Libre. Margen 51%.
- **Qué priorizó el sistema:** los tres tramos de funnel ($929.524 +
  $1.186.111 + $915.000 = $3.030.635), nada de `gasto_no_rentable` ni
  `sobrefragmentacion` (correcto: ninguna de las dos fugas existe sin
  inversión publicitaria — comportamiento ya validado en fase 2/6).
- **Servicios recomendados:** Desarrollo y optimización web, Meta Ads (en
  el tramo de carrito — vale la pena que Matías revise si tiene sentido
  recomendar Meta Ads dentro del tramo "carrito" para un negocio que hoy
  no pautea nada; el servicio ahí no es "más pauta", es retargeting
  dentro del mismo canal, pero el nombre del servicio no lo aclara).
- **Coherencia:** limpio. `mer_actual: null` (no cero) porque no hay
  inversión — la distinción null-vs-cero funciona correctamente acá. Es
  el escenario con menos ruido de los seis.

---

## Lo que NO se encontró (control negativo)

Para que esta lista no sea sólo una lista de problemas: en ninguno de los
seis escenarios apareció una fuga marcada `sospechosa` sin explicación
visible, ninguna cifra en pesos apareció sin su badge de confianza, y la
regla de "nunca sumar magnitudes económicas" se mantuvo (facturación,
contribución y ahorro nunca aparecen mezclados en una sola cifra en
ningún PDF de los 36 generados — confirmado visualmente en varias
páginas). El bloque 2 de este mismo loop hace la verificación numérica
exhaustiva de esto; acá sólo se registra como observación de paso.

## Qué quedó pendiente

Ningún hallazgo de este documento se corrigió. Quedan para que Matías
decida cuáles ameritan un bloque técnico:

1. `gasto_no_rentable` (y cualquier lógica que dependa de
   `margenPositivo`) debería distinguir "margen no calculado" de "margen
   calculado y negativo" — hoy los trata igual.
2. Las prioridades ALTA/MEDIA/BAJA de `mapearHallazgos` no tienen ningún
   mecanismo que las module contra la salud general del negocio — un
   fuga de funnel legítima en un negocio sano puede terminar con la misma
   prioridad "ALTA" que en un negocio en crisis.
3. `mix_producto` compara el margen del canal principal contra el margen
   ponderado total — no compara productos entre sí. Con un solo producto
   y dos canales de comisión distinta, dispara siempre.
4. `product_ads` (el hallazgo, en `propuesta.ts`) no compara ningún ROAS
   real contra ningún objetivo — dispara con sólo `ml_product_ads ===
   true`.
