# F2a · Panel de selección comercial — Reconciliación funcional (Q1–Q10 cerradas)

**Estatus: documento funcional, NO ejecutable, sin preguntas abiertas.**
Reconcilia `paso-1-panel-seleccion-comercial.md` (espec. original del
2026-08-30) con el contrato maestro de BV4 y con el estado real del repo
verificado por Matías. La especificación original **queda supersedida como
entrada directa**. Las preguntas **Q1–Q10 están cerradas por decisión
vinculante de Matías el 2026-08-30**. La verificación final de consistencia
(sección al final) confirma que no quedan contradicciones ni preguntas
abiertas: la redacción del prompt de F2a solo espera el **cierre y auditoría
de F1 Foundation**.

Etiquetas: **[C]** confirmado por Matías · **[M]** verificado por Matías en
repo vivo, aceptado · **[NV]** a verificar en repo durante el prompt de F2a
(tarea de ejecución, no pregunta abierta).

---

## a · Catálogo v2 versionado

El catálogo cerrado de seis servicios (Meta Ads, Google Ads, Product Ads,
Desarrollo y optimización web, Planificación y creación de contenido, Diseño
de marca) **no se modifica ni se elimina**: alimenta el mapeo
hallazgo→servicio vigente y la salida v1, incluidas combinaciones legítimas
tipo "Web e-commerce y Meta Ads" ya contempladas en los invariantes de
hallazgos.

Se crea un **catálogo v2 al lado del v1**, con el patrón de
versionado/conmutación del resto del proyecto:

- v1 intacto → toda plantilla, prueba y documento v1 sigue produciendo
  exactamente la misma salida.
- v2 = 9 servicios / 10 líneas facturables (punto b), consumido por el panel
  y por la propuesta del motor v2.
- El mapeo hallazgo→servicio se **extiende** con la tabla de traducción v1→v2
  (punto c); no se reescribe el mapeo v1.

## b · Servicios (9) vs. líneas facturables (10) — IDs estables

Un **servicio** es la unidad de taxonomía y de sugerencia desde hallazgos.
Una **línea facturable** es la fila del panel: lo que lleva cantidad, precio y
recurrencia. Contenido es un servicio con dos líneas. IDs estables:

| # | Línea (ID estable) | Servicio | Unidad | Recurrencia sugerida |
|---|---|---|---|---|
| 1 | `meta_ads` | Meta Ads | campañas | mensual |
| 2 | `google_ads` | Google Ads | campañas | mensual |
| 3 | `product_ads` | Product Ads | campañas | mensual |
| 4 | `contenido_audiovisual` | Contenido | piezas/mes | mensual |
| 5 | `contenido_estatico` | Contenido | piezas/mes | mensual |
| 6 | `influencer_marketing` | Influencer marketing | creadores/mes | mensual |
| 7 | `planificacion_contenido` | Planificación de contenido | — | mensual |
| 8 | `diseno_web` | Diseño web | — | **única** [Q10] |
| 9 | `desarrollo_web_custom` | Desarrollo web custom | páginas | **única** [Q10] |
| 10 | `branding` | Branding | — | **única** [Q10] |

Los IDs son contrato: no se renombran después de la primera persistencia.
**[Q10 cerrada]** La recurrencia sugerida es solo default: **se define por
línea en cada propuesta concreta**; cualquier línea puede cambiarse de
mensual a única o viceversa.

**[Q8 cerrada]** La línea `diseno_web`, al seleccionarse, habilita la
definición de la ruta correspondiente: **B2C, B2B o ambas** (el precedente
Titan Web exige poder marcar ambas). La ruta es atributo de la línea, no línea
aparte.

## c · Matriz catálogo v1 → v2 (cerrada)

| Servicio v1 (hallazgos) | Traducción v2 | Estado |
|---|---|---|
| Meta Ads | `meta_ads` | directo |
| Google Ads | `google_ads` | directo |
| Product Ads | `product_ads` | directo |
| Desarrollo y optimización web | `diseno_web` | directo por alcance (popup y rutas B2C/B2B viven acá [C]) |
| Diseño de marca | `branding` | directo |
| Planificación y creación de contenido | **[Q1 cerrada]** sugiere **como grupo** las tres líneas: `planificacion_contenido` + `contenido_audiovisual` + `contenido_estatico`, cada una **desmarcable individualmente** en el panel | cerrado |
| — (sin equivalente v1) | `influencer_marketing` | **[Q2 cerrada]** selección exclusivamente manual; sin activación automática hasta regla diagnóstica específica y aprobada |
| — (sin equivalente v1) | `desarrollo_web_custom` | **[Q2 cerrada]** ídem |

**[Q8 cerrada]** Elegir TRACCIÓN o ESCALA **no preselecciona** `diseno_web`.
Diseño web solo llega al panel sugerido por un hallazgo compatible o por
selección manual. (Los ítems "Rutas B2C/B2B" de los packs son composición de
marketing del paquete, no precarga del panel.)

Regla vinculante intacta: ningún activador automático se inventa.

## d · Extensión mínima del modelo de selección

Estado actual **[M]**: existe `SeleccionComercial` con **precio total por
nivel**. Su forma exacta de tipos está **[NV]** — el prompt de F2a la lee del
repo antes de tocar nada.

Contrato objetivo (aditivo, no destructivo), con Q3–Q10 integradas:

- Sobre versionado con **`moneda: "ARS" | "USD"`** [Q4]: una sola moneda por
  propuesta, consistente en panel y PDF, formateada según la moneda elegida.
  **Prohibido hardcodear ARS.**
- **Configuración fiscal explícita por propuesta** [Q9]:
  `fiscal: { aplicaImpuesto: sí/no, porcentaje, confirmado: sí/no }`.
  Valor inicial sugerido 21%, **debe confirmarse antes de exportar**: sin
  configuración fiscal confirmada, la exportación de propuesta permanece
  bloqueada (se suma a la confirmación de selección ya existente). **La
  condición fiscal jamás se infiere de la moneda**: ARS y USD llevan la misma
  estructura de subtotal neto, impuesto —si corresponde— y total final.
- `lineas[]`: `{ lineaId, seleccionada, cantidad?, precioUnitario? |
  precioLinea?, recurrencia: mensual | unica, ruta? }`.
  - **[Q3 cerrada]** Cuantificables: se carga **precio unitario**; el sistema
    calcula y muestra el total de la línea (unitario × cantidad) **según su
    recurrencia**: por mes si es mensual, único si es única. Cambiar la
    cantidad recalcula solo.
  - Sin cantidad: se carga el total de la línea.
  - `recurrencia` editable por línea [Q10], con los defaults del punto b.
  - `ruta` (B2C/B2B/ambas) solo aplica a `diseno_web` [Q8].
- `agregados[]` con dos formas: binarios (`incluido: sí/no`) y **por nivel con
  alcance** (punto f); el alcance sigue al nivel elegido, overrides futuros se
  modelan explícitos.
- **[Q10 cerrada] Totales separados obligatorios.** Dos grupos independientes:
  **"Inversión mensual"** (suma de líneas mensuales) e **"Inversión inicial /
  pago único"** (suma de líneas únicas). Cada grupo cierra con su subtotal
  neto, su impuesto —si la configuración fiscal aplica [Q9]— y su total final.
  **Nunca se imprime un total combinado** que mezcle ambos: no existe "gran
  total" mensual + único.
- **[Q6 cerrada]** Todos los totales son **calculados y no editables**. Sin
  redondeos ni overrides silenciosos. Un descuento o ajuste comercial futuro
  se modelará como concepto explícito, nunca pisando la suma.
- El precio total por nivel del modelo actual queda como dato legado legible
  (sobre del punto g).

## e · Precio — cerrado

[Q3] unitario × cantidad · [Q4] ARS o USD, una sola por propuesta, sin
hardcodeo · [Q5+Q9] netos; impuesto explícito por configuración fiscal
confirmada, no por moneda · [Q6] totales solo calculados · [Q10] dos grupos de
totales, mensual y único, jamás mezclados.

Notas de divergencia deliberada, para registro: (1) la propuesta manual de
Titan mostraba solo la leyenda "valores netos + 21% de IVA"; el contrato nuevo
imprime el impuesto calculado y el total final por grupo — cambio de
presentación decidido. (2) El "total final con IVA" **singular** de la
redacción original de Q5 queda superado por Q10: son **dos totales
paralelos**, uno por grupo de recurrencia.

## f · Matriz de agregados por servicio y nivel (cerrada)

| Agregado | Dónde vive | IMPULSO | TRACCIÓN | ESCALA |
|---|---|---|---|---|
| Retargeting | dentro de `meta_ads` [C] | ✓ | ✓ | ✓ |
| Tracking de plataforma | dentro de cada línea de pauta seleccionada [C] | ✓ | ✓ | ✓ |
| Tracking web | agregado propio [Q7] | ✓ | ✓ | ✓ |
| Email marketing | agregado propio, **por nivel con alcance** [Q7] | básico | automatizaciones | segmentación y recompra |
| Reportes | por nivel [C] | mensual | semanal | semanal |
| CRO | agregado exclusivo de ESCALA [C] | — | — | ✓ |
| Popup | dentro de `diseno_web` [C], no es agregado | (vía Diseño web) | (vía Diseño web) | (vía Diseño web) |
| Rutas B2C/B2B | atributo de `diseno_web` [Q8] — sin precarga por nivel | — | — | — |

## g · Persistencia: `diagnostico.propuesta`, cero migraciones

Prioridad única: la columna JSON existente **`diagnostico.propuesta`** [M],
con **sobre versionado**:

```
{
  "version": 2,
  "moneda": "ARS" | "USD",
  "fiscal": { "aplicaImpuesto": true|false, "porcentaje": 21, "confirmado": true|false },
  "seleccion": { …SeleccionComercialV2… }
}
```

- Lectura tolerante: contenido previo sin sobre o con forma v1 se interpreta
  como legado y no rompe nada; nunca se sobreescribe silenciosamente sin
  conservar su lectura.
- **Cero migraciones de esquema.** Si al verificar el repo la columna no
  existe, no es JSON, o no admite el sobre sin migración: **se frena y se
  reporta**. No hay plan B automático.
- La persistencia en base (no en estado de React) sigue siendo condición del
  chequeo SHA-256 interfaz = pipeline [C].

## h · Semana 0: exclusión contractual de la propuesta

Semana 0 va **únicamente en proyección** [C]: el bloque se define en el
contrato documental de proyección exclusivamente; el contrato/modelo de
propuesta **no tiene campo** donde representarla; invariante verificable en la
suite que rechaza cualquier intento de inyectarla (mismo espíritu que
`validarContextoDocumento` con hallazgos duplicados).

## i · Gate de F2a (dos perfiles)

> diagnóstico → proyección → **selección comercial confirmada + configuración
> fiscal confirmada** [Q9] → propuesta → PDF descargado desde la interfaz en
> **pantalla (16:9) y A4 (`impresion`)** → SHA-256 del descargado = SHA-256
> del pipeline, para **Snake Store y Titan Web B1**.

Matías ejecuta el flujo en navegador; la auditoría verifica contra artefactos
crudos desde worktree limpio del commit candidato.

## j · Correcciones a las referencias desactualizadas de la espec. original

| La espec. original decía | Corrección vigente |
|---|---|
| "Tokens de rebranding… hoy el renderer usa Helvetica; Font.register exige archivos" | Aplicaba a v1. **pdf-v2 ya usa Satoshi e Inter** vía `registrar-fuentes.ts` [M]. Foundation es **F1** |
| "Paginación y densidad" como paso 2 previo | Paginación = **F3a** |
| "Jerarquía tipográfica" e "iconografía y profundidad" como pasos 4 y 5 | Ambos = **F3b** |
| "Arreglar el script dev entra en este bloque" | Ya asignado a **F1 preflight** (E-22) |
| "Registrar E-22 a E-25 como primer paso" | Ya asignado a **F1 preflight** (0.6) |
| "El renderer web ya resuelve la grilla de 3 columnas que el PDF no tiene" | Verificado sobre la cadena **v1**; re-verificar contra web/pdf **v2** en F3a |
| Gate en un solo formato | El gate incluye **ambos perfiles** (punto i), porque A4 existe [M] |
| "E-26 (ligaduras fi/fl) descartado" | Punto k: esa observación **nunca recibió ID** y no ocupa lugar en la serie |

## k · Numeración de hallazgos

- Fuente viva: `docs/visual/auditoria-visual-2026-08-23.md`. Antes de
  registrar, verificar el último ID escrito (al 2026-08-30: E-21, línea 697).
- Ligaduras fi/fl: descartadas **antes** de recibir ID; no existe "E-26
  ligaduras".
- Serie vigente: E-22 script dev · E-23 panel faltante · E-24 factor 20% ·
  E-25 comisiones sin verificar · E-26 planitud tipográfica · E-27 ausencia de
  iconografía · E-28 columna única. Si el archivo vivo mostrara otro último
  ID, la serie corre completa y se reporta — previsto en 0.6 del prompt de F1.

---

## Decisiones Q1–Q10 · CERRADAS (2026-08-30, vinculantes)

| Q | Decisión |
|---|---|
| Q1 | "Planificación y creación de contenido" (hallazgo histórico) sugiere como grupo las tres líneas de contenido, desmarcables individualmente |
| Q2 | Influencer marketing y desarrollo web custom: selección manual; sin activación automática hasta regla diagnóstica específica y aprobada |
| Q3 | Cuantificables: precio unitario cargado; el sistema multiplica y muestra el total de línea según su recurrencia |
| Q4 | ARS y USD admitidas; una sola moneda consistente por propuesta; se persiste y renderiza la seleccionada; prohibido hardcodear ARS |
| Q5 | Importes netos; se muestran subtotal neto, impuesto —si corresponde— y total final (por grupo de recurrencia, ver Q10) |
| Q6 | Totales calculados, no editables; sin redondeos ni overrides silenciosos; descuentos futuros se modelan explícitamente |
| Q7 | Tracking web en los tres niveles. Email marketing con alcance por nivel: básico / automatizaciones / segmentación y recompra |
| Q8 | Tracción/Escala no preseleccionan Diseño web; llega por hallazgo o selección manual; al seleccionarse se define la ruta B2C/B2B/ambas |
| Q9 | El impuesto no depende de la moneda: configuración fiscal explícita por propuesta (aplica sí/no + porcentaje, sugerido 21%), **confirmada antes de exportar**; misma estructura de totales en ARS y USD |
| Q10 | `recurrencia: mensual \| unica` obligatoria por línea; dos subtotales independientes ("Inversión mensual" e "Inversión inicial / pago único"); jamás un total combinado. Diseño web, desarrollo custom y branding se sugieren como pago único; la recurrencia se define por línea en cada propuesta |

## Verificación final de consistencia

Barrido completo tras cerrar Q9 y Q10:

1. **Q9 × Q4**: resuelto — la estructura fiscal es idéntica en ARS y USD y no
   se infiere de la moneda. Sin conflicto restante.
2. **Q10 × Q5**: resuelto por supersedencia explícita — el "total final"
   singular pasa a dos totales paralelos por grupo de recurrencia (nota de
   divergencia en el punto e). Sin conflicto restante.
3. **Q10 × Q3**: resuelto — "total mensual de línea" pasa a "total de línea
   según recurrencia". Una línea cuantificable puede ser única (p. ej.
   desarrollo custom: unitario por página × páginas, pago único). Sin
   conflicto restante.
4. **Q9 × candado de exportación existente**: compatible — la confirmación
   fiscal se suma a la confirmación de selección como condición del mismo
   candado; no crea un segundo mecanismo.
5. **Q10 × cantidades "/mes" del punto b**: las unidades "piezas/mes" y
   "creadores/mes" describen el default mensual; si Matías cambiara una de
   esas líneas a única en una propuesta concreta, la unidad se lee como
   cantidad total. Documentado, sin conflicto.

**Confirmación: no quedan contradicciones internas ni preguntas abiertas para
Matías.** Los únicos [NV] restantes (forma exacta del tipo
`SeleccionComercial` actual y viabilidad del sobre en `diagnostico.propuesta`)
son verificaciones de ejecución que el propio prompt de F2a realiza como
primer paso, con cláusula de freno si fallan. Lo único que bloquea la
redacción del prompt de F2a es el **cierre y auditoría de F1 Foundation**.

## Qué se conserva intacto de la especificación original [C]

Los **textos de los 10 servicios/líneas con sus entregables** (§7, confirmados
uno a uno, incluida la nota al pie de contenido y las exclusiones de
influencer y diseño web); las **cantidades precargadas por nivel** (§4, cupo
por plataforma, precargas como sugerencia); el **desglose impreso con su
advertencia registrada** (§5, ahora con la estructura fiscal de Q9 y los dos
grupos de Q10); las reglas de **visibilidad** (§6: panel muestra las 10 líneas
siempre; PDF solo las seleccionadas; diagnóstico/proyección ocultan solo
`no_aplica`, retenidos visibles con restricción); **reportes** 1 mensual en
IMPULSO y semanal en los otros dos; y el criterio de que **nada se inventa** —
un texto o precio faltante se marca pendiente, no se rellena.
