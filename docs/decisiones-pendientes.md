# Decisiones pendientes

Registro de decisiones de producto o de negocio que aparecieron durante el
trabajo autónomo del 2026-08-21 y que no estaban ya resueltas en los
documentos existentes. No se tomaron unilateralmente: se anota el contexto y
se sigue con lo que no depende de ellas.

Estructura: **Abiertas** (siguen sin resolver) y **Cerradas** (resueltas,
con el contexto original conservado, no borrado). Cada entrada queda
numerada de forma permanente; los números no se reutilizan.

## Abiertas

### 10 · Cómo conectar la selección de paquetes confirmada a la propuesta comercial (`comercial` en `build-context.ts:479`)

**Contexto.** El plan maestro (fase 13) dejó anotado como pendiente "conectar
la selección persistida hacia `SeleccionComercial`/`buildDocumentContext()`
para que el PDF de propuesta la use" — hoy `comercial: null` sigue
hardcodeado. Al intentar implementarlo (2026-08-23) apareció un
**desajuste estructural real entre los dos modelos**, no sólo plomería:

- Lo que se persiste (`EscaleraPaquetesConfirmada`, `src/lib/paquetes.ts`) es
  una **escalera de hasta tres niveles** (IMPULSO/TRACCIÓN/ESCALA),
  acumulativa, cada nivel con su propia lista de servicios y su propio
  precio (`NivelPaquete.precio: number | null`). Es un menú de tres
  opciones, no una oferta única.
- Lo que el documento de propuesta consume (`SeleccionComercial`,
  `src/documents/domain/types.ts:210-222`) es **un solo paquete**:
  `paqueteId`, `nombre`, `alcance`, `exclusiones`, `entregables`,
  `duracionDias`, `precio` (`Evidencia<number>`), `formaPago`, `inicio`,
  `incluirPrecioEnPdf`. El bloque `"commercial-offer"` (`blocks.ts` →
  `buildCommercialOffer`) arma UNA sola tarjeta de oferta, y
  `propuesta.ts` sólo tiene una sección `"commercial-offer"` (singular).
- La pantalla de confirmación (`confirmacion-paquetes.tsx`) nunca captura
  `exclusiones`, `duracionDias`, `formaPago`, `inicio` ni
  `incluirPrecioEnPdf` para ningún nivel — esos campos no existen en
  ningún lugar de la UI ni del modelo persistido hoy.

**Por qué no se resolvió unilateralmente.** Completar la conexión exige
decidir cosas de negocio que no están definidas en ningún documento
existente:

1. ¿La propuesta muestra los tres niveles lado a lado (como el menú que
   son), o el vendedor elige UNO como "la" oferta que se envía al
   cliente?
2. Si es un solo nivel: ¿de dónde salen duración, forma de pago, fecha de
   inicio, exclusiones y si el precio va impreso en el PDF? ¿Campos
   nuevos en la pantalla de confirmación, o un default fijo (por ejemplo,
   90 días, alineado con el horizonte de escenarios)? Un default inventado
   acá sería exactamente el tipo de dato de negocio que la regla de este
   trabajo prohíbe asumir.
3. Si son los tres niveles: el bloque `"commercial-offer"` (tipo y
   plantilla) necesita rediseñarse para un menú de tres tarjetas, no una
   sola — trabajo de plantilla/diseño, no sólo de plomería, y coincide con
   el "rediseño visual" que fase 13 ya dejó pendiente por separado.

**Qué se hizo en su lugar.** No se tocó `comercial: null` en
`build-context.ts`. Queda exactamente como estaba, documentado acá para
que Matías decida antes de que se implemente cualquiera de las dos rutas.

## Cerradas

### 1 · ¿Debe "margen total" en el motor de cálculo exigir 100% de cobertura de productos, igual que ya exige el documento? — **RESUELTA el 2026-08-22**

**Contexto original.** Durante la fase 5 (productos dinámicos y cobertura),
al separar "margen de la muestra" de "margen total" se habían encontrado dos
reglas distintas y ya aprobadas conviviendo en el repositorio, con alcances
distintos: el adaptador documental exigía 100% de cobertura de canales Y de
productos para publicar `margenTotal`; el motor de cálculo
(`derivados.margen_contribucion`) nunca exigió cobertura de productos, sólo
de canales.

**Resolución (auditoría externa, 2026-08-22).** Se unificó la semántica: el
motor de cálculo ahora exige exactamente lo mismo que ya exigía el
documento. Implementado en `src/lib/calculo-diagnostico.ts`
(`calcularDiagnostico`):

- `margen_contribucion` (el TOTAL) sólo se publica con 100% explícito de
  cobertura de productos (`coberturaProductos(d) >= 100`) **y** 100% de
  cobertura de canales aplicables (regla de canales ya existente, sin
  cambios). Con cobertura parcial de cualquiera de los dos, queda `null`
  (retenido).
- `margen_muestra` no cambió: sigue publicándose sobre lo que sí se cargó,
  sin exigir cobertura total, tal como ya funcionaba.
- Un solo producto sin porcentaje de facturación declarado ya NO equivale a
  un 100% implícito: `coberturaProductos` sólo suma participaciones
  declaradas (`> 0`), nunca las asume. Si el vendedor no declara
  explícitamente "100%" en el campo de porcentaje de ese único producto, el
  margen total queda retenido (el de la muestra sigue disponible).
- Cualquier cálculo aguas abajo que dependía de `margen_contribucion`
  (`breakeven_roas`, `cpa_breakeven`, `cpa_objetivo`, `roas_objetivo`,
  `contribucion_marginal`, el bloque completo de
  `presupuesto_arranque` — piso teórico y presupuesto de arranque por
  evento intermedio, fase 6 —, y las fugas que usan margen) queda retenido
  con él mientras la cobertura sea parcial, porque todos siguen leyendo la
  misma variable `margen` ya gateada. Esto es intencional y no un efecto
  colateral: el pedido explícito fue "cualquier cálculo dependiente del
  margen total debe quedar retenido mientras la cobertura sea parcial".
- **Corrección obligatoria (auditoría externa, 2026-08-22, ronda 2):** la
  primera versión de este bloque dejaba de evaluar la contradicción contra
  el margen declarado por el cliente (`evaluarContradiccion`) en cuanto la
  cobertura de productos era parcial, porque comparaba únicamente contra
  `margen_contribucion` (el total), que en ese caso es `null`. Eso era una
  regresión funcional real: el caso que originó la regla de contradicción
  (Titan Web, 60% de cobertura de productos, margen de la muestra negativo)
  dejaba de disparar la alerta si el cliente declaraba, por ejemplo, 10-12%
  de rentabilidad. Se corrigió en `src/lib/contradiccion.ts`:
  `evaluarContradiccion` ahora recibe `{ total, muestra }` y compara contra
  el margen total cuando está disponible; si está retenido, compara contra
  el margen de la MUESTRA en vez de dejar de evaluar. El resultado ahora
  registra `origen_margen` (`"total"` | `"muestra"`), `confianza_base`
  (`"alta"` con margen total, `"media"` — un nivel menos — con margen de la
  muestra) y la cobertura de productos/canales usada en la comparación. Los
  umbrales (0,05 validación, 0,10 crítica) y la regla de cambio de signo no
  cambiaron: sólo cambió contra qué margen se comparan. `confirmado`/`bloquea`
  siguen dependiendo únicamente de si el cliente confirmó su margen
  declarado — es un eje independiente de `origen_margen`: una contradicción
  puede estar confirmada y bloquear apoyándose en una muestra parcial. Ver
  `src/lib/contradiccion.test.ts` (incluye el caso Titan Web al 60%
  explícitamente) y la UI (`diagnosticos.$id.tsx`, `AvisoContradiccion`),
  que ahora aclara cuando la comparación se hizo contra la muestra.
- Los diagnósticos ya guardados NO se recalculan automáticamente: esta regla
  sólo se aplica cuando se calcula un diagnóstico nuevo o se usa la acción
  explícita "Editar y recalcular" (`diagnosticos.nuevo.tsx`), que crea una
  versión nueva. Leer un diagnóstico existente (`diagnosticos.$id.tsx`) sigue
  mostrando los `derivados` ya calculados y guardados en su momento, sin
  volver a ejecutar el motor.

**Impacto verificado.** Pantalla de diagnóstico
(`diagnosticos.$id.tsx`): "Margen total" y "Piso teórico"/"Presupuesto de
arranque" ya mostraban "—" (guión) para cualquier valor `null` mediante los
helpers existentes (`pesos`/`pct` en `vista-diagnostico.ts`) — no hizo falta
tocar la UI para eso. Cobertura de productos, la nota de cobertura parcial y
"Margen de la muestra" siguen visibles sin cambios. El aviso de contradicción
(`AvisoContradiccion`) sí se tocó: cuando `origen_margen` es `"muestra"`,
ahora aclara explícitamente que la comparación se hizo contra el margen de
la muestra y qué porcentaje del catálogo cubre, en vez de dar a entender que
se comparó contra un margen total.

### 2 · Valor por defecto del costo por evento intermedio (fase 6, presupuesto de arranque) — **RESUELTA el 2026-08-22**

**Contexto original.** El "presupuesto de arranque optimizando por evento
intermedio" (`derivados.presupuesto_arranque.arranque_evento_intermedio`,
`src/lib/calculo-diagnostico.ts`) necesita un costo estimado por evento
intermedio (agregar al carrito o iniciar checkout). Por instrucción
explícita del usuario, ese costo "sale de configuración marcado como
benchmark" — se implementó como una proporción del CPA objetivo
(`factor_costo_evento_intermedio`, config), con un default de código
(`FACTOR_COSTO_EVENTO_INTERMEDIO_DEFECTO = 0,2`, es decir 20% del CPA
objetivo) documentado en `src/lib/calculo-diagnostico.ts`. Se había dejado
anotada porque el número concreto (20%) no tiene respaldo de datos reales
de ningún cliente.

**Resolución.** El patrón implementado es exactamente el pedido: el 20%
queda como benchmark configurable, marcado explícitamente como supuesto
(nunca como dato observado), sobrescribible sin tocar código cargando
`factor_costo_evento_intermedio` en la fila `configuracion` de la base, y
con confianza que nunca llega a "alta" mientras el presupuesto de arranque
dependa de este benchmark sin verificar (`presupuesto_arranque.confianza`,
`src/lib/calculo-diagnostico.ts`). No hace falta ningún cambio de código:
es la decisión comercial ya tomada, verificada contra la implementación
existente.

**Consecuencia.** Si en el futuro aparece una referencia mejor (datos de
campañas propias con optimización por agregar-al-carrito o
iniciar-checkout vs. compra), se reemplaza el 20% cargando ese número en
`configuracion`, sin tocar código.

### 3 · Nueve de las catorce fases del plan maestro no tienen definición verificable en este repositorio — **RESUELTA el 2026-08-22**

**Resolución.** Matías compartió el plan maestro consolidado completo
(`docs/plan-maestro-consolidado-2026-08-21.md`, incorporado al repositorio
tal cual) y la especificación visual de las fases 11 a 13
(`docs/especificacion-visual-pdfs-fases-11-13.md`). Con esa fuente, las
nueve fases quedaron reconciliadas contra el código real en
`docs/plan-maestro-fases.md`: fase 1 y 2 **COMPLETA**, fase 4
**MAYORMENTE COMPLETA** (ya cubiertas antes, sólo faltaba el nombre), fase 9
**PENDIENTE**, fase 10 **TÉCNICAMENTE COMPLETA**, fases 11 y 12
**FUNCIONAL / VISUAL PENDIENTE**, fase 13 **PARCIAL**, fase 14
**PENDIENTE**. Ninguna quedó con contenido inventado: cada estado tiene
evidencia archivo:línea verificada contra el HEAD `d07fcac`, no contra la
línea base de 366 pruebas que el plan maestro usó (`c4cb51a`).

**Contexto original.** La reconciliación del plan maestro (2026-08-22,
`docs/plan-maestro-fases.md`) pidió un único documento con las catorce
fases normalizadas. La instrucción dio nombre y estado real para cinco:
fase 3 (productos dinámicos y cobertura), fase 5 (plataformas y
comisiones), fase 6 (presupuesto de arranque), fase 7 (medición y
publicidad por plataforma) y fase 8 (retención, carrito y recompra). Para
las fases 1, 2, 4, 9, 10, 11, 12, 13 y 14, este repositorio no tiene ningún
nombre, alcance ni evidencia — ni en el código, ni en los tests, ni en
ningún documento de `docs/`, ni en los handoffs de sesiones anteriores.

**Por qué no se completó igual.** Completar esas nueve filas habría exigido
inventar nombres y alcances de fase sin ninguna fuente que los respalde —
exactamente el tipo de dato no resuelto en los documentos existentes que la
regla de parada de este trabajo pide no asumir unilateralmente. El plan
maestro consolidado que las define vive fuera de este repositorio (en el
controlador o en la documentación de producto de Matías), no acá.

**Qué se hizo en su lugar.** Se dejaron las nueve filas explícitamente
marcadas "SIN DEFINICIÓN VERIFICABLE ACÁ" en `docs/plan-maestro-fases.md`,
en vez de completarlas con contenido plausible pero no verificado. Se
señaló, sin asumirla, una posible relación entre esas fases y el trabajo
mencionado sin numeración ni alcance en `docs/cola-nocturna.md`
("mayorista/mixto, retención y rediseño integral").

### 4 · ¿Vende Velocentum retención (recuperación de carrito y recompra)? — **RESUELTA el 2026-08-22**

**Contexto original.** El plan maestro consolidado
(`docs/plan-maestro-consolidado-2026-08-21.md`, sección 8) listaba
"Retención" como decisión comercial pendiente: "si Velocentum vende
email/WhatsApp/automatización". La fase 8 del plan maestro (retención,
carrito y recompra) señalaba que el bloque de recompra no podía completarse
sin esta definición, y el inventario de fase 8 en `docs/plan-maestro-fases.md`
confirmó que hoy no existe ningún campo, cálculo ni hallazgo de recompra en
el código — sólo carrito abandonado dentro del funnel y el hallazgo booleano
`sin_retargeting`.

**Resolución.** Sí, con alcance acotado:

- **Vende:** estrategia e implementación de recuperación de carrito y flujos
  de recompra por email y WhatsApp, usando las integraciones **nativas** de
  la plataforma de e-commerce del cliente.
- **No vende:** automatizaciones complejas ni desarrollo de herramientas
  propias de automatización.

**Consecuencia para el mapeo de hallazgos (bloque técnico posterior, NO
implementado en el bloque que registra esta decisión).** Recuperación de
carrito y recompra no son un servicio independiente: son un agregado
condicionado a que la plataforma del cliente soporte la capacidad nativa
(ver el relevamiento del Atributo A, más abajo). El hallazgo se encadena en
dos capas:

- si el plan del cliente **no** incluye la capacidad nativa: capa
  `"recomendacion"` (subir de plan) seguida de capa `"servicio"`
  (implementación de los flujos);
- si el plan **sí** la incluye: capa `"servicio"` directamente.

### 5 · ¿Vende Velocentum producción de contenido? — **RESUELTA el 2026-08-22**

**Contexto original.** No había un catálogo de servicios comerciales
confirmado más allá de los medios pagos (Meta/Google/Product Ads)
mencionados de forma dispersa en el plan maestro y en el código
(`src/lib/propuesta.ts`, hallazgo `product_ads`).

**Resolución.** Sí. Catálogo de servicios confirmado, **seis, cerrado** (no
hay servicios fuera de esta lista):

1. Meta Ads.
2. Google Ads.
3. Product Ads (Mercado Libre).
4. Desarrollo y optimización web.
5. Planificación y creación de contenido.
6. Diseño de marca (branding).

*(Los paréntesis de 3 y 6 son aclaración, no parte del string: el código
usa exactamente "Product Ads" y "Diseño de marca", sin el paréntesis —
mismo criterio para los dos, reconciliado 2026-08-23.)*

**Consecuencia para el mapeo de hallazgos.** Cualquier hallazgo que no
mapee a uno de estos seis servicios queda en capa `"recomendacion"`, nunca
en capa `"servicio"`.

### 6 · ¿Qué vende Velocentum en mayorista? — **RESUELTA el 2026-08-22**

**Contexto original.** El plan maestro consolidado (sección 8) listaba
"Mayorista" como decisión comercial pendiente: "servicios B2B ofrecidos y
alcance". La fase 9 del plan maestro (Mayorista y Mixto) estaba bloqueada
explícitamente por esta definición — confirmado en `docs/plan-maestro-fases.md`:
hoy sólo existe un *placeholder* de tipo (`modalidad: {minorista, mayorista}`,
`src/documents/domain/types.ts:257-258`) sin ninguna lógica de negocio
detrás.

**Resolución.** El mismo catálogo de seis servicios (entrada 5), aplicado a
otro objetivo. No hay servicios B2B nuevos: cambia el tipo de campaña (más
B2B, más captación de base de datos) y el objetivo, pero Meta Ads sigue
siendo Meta Ads.

**Consecuencia para la fase 9 (bloque técnico posterior, NO implementado en
el bloque que registra esta decisión).** No hay que crear un catálogo
mayorista nuevo. Hay que detectar si el canal mayorista existe en la
plataforma del cliente (ver el relevamiento del Atributo B, más abajo) y
mapear los hallazgos mayoristas a los seis servicios ya existentes.

### 7 · Paquetes y precios — **RESUELTA el 2026-08-22**

**Contexto original.** El plan maestro consolidado (sección 8) listaba
"Paquetes/precios" como decisión comercial pendiente: "catálogo manual de
ofertas". `docs/plan-maestro-fases.md` (fase 13) confirmó que hoy existe el
tipo `SeleccionComercial` (con `aprobadaManualmente: true` literal,
`src/documents/domain/types.ts:210-222`) pero `comercial: null` está
hardcodeado en `buildDocumentContext()`
(`src/documents/domain/build-context.ts:479`) — no hay ningún flujo que lo
complete.

**Resolución.** Escalera de hasta tres niveles con confirmación manual
obligatoria:

- Nombres de los niveles, configurables: **IMPULSO, TRACCIÓN, ESCALA**.
- Escalera acumulativa: cada nivel incluye todo el anterior más servicios o
  alcance adicional.
- Nunca más de tres niveles. Menos de tres si no hay hallazgos suficientes
  que justifiquen el escalón.
- Cada servicio de cada nivel debe estar ligado a un hallazgo concreto. Si
  ningún hallazgo lo justifica, no entra.
- Cada servicio lleva **alcance explícito** con sus unidades propias: Meta
  Ads y Google Ads en campañas activas; contenido en piezas por mes;
  Product Ads en campañas; web y branding en entregables o alcance
  descrito.
- Las cantidades por nivel salen de valores por defecto **configurables**,
  marcados como propuesta del sistema, nunca como decisión tomada.
- Los precios quedan **vacíos**. El sistema nunca inventa un precio.
- **Confirmación manual obligatoria** antes de generar la propuesta:
  pantalla donde se ven los tres niveles con sus servicios, alcances y
  precios, y donde se puede ajustar cantidades, agregar o sacar servicios,
  y cargar precios. Sin esa confirmación explícita, no se genera el
  documento.

**Consecuencia.** El generador de paquetes (bloque técnico posterior, NO
implementado en el bloque que registra esta decisión) debe respetar estas
ocho reglas exactamente; ninguna se puede relajar sin una nueva decisión
explícita.

### 8 · Algoritmo de reparto de servicios en la escalera de paquetes — **RESUELTA el 2026-08-22**

**Contexto original.** Al implementar el generador de paquetes
(`src/lib/paquetes.ts`), la decisión comercial 7 no especificaba en qué
orden ni con qué factor de escala se reparten los servicios justificados
entre los tres niveles. Se implementó un default razonable (orden fijo
del catálogo `SERVICIOS`, reparto parejo entre los niveles habilitados,
cantidad × índice de nivel), completamente editable en la pantalla de
confirmación.

**Resolución.** El reparto por defecto que propone el sistema es
exactamente la decisión comercial ya tomada: el sistema propone un
reparto y el vendedor lo ajusta en la pantalla de confirmación
(`src/components/confirmacion-paquetes.tsx`) antes de que se convierta en
una propuesta real. No hace falta ninguna regla de negocio adicional ni
ningún cambio de código.

### 9 · Persistencia de la selección comercial confirmada — **RESUELTA el 2026-08-22**

**Contexto original.** La pantalla de confirmación de paquetes sólo
guardaba la escalera confirmada en estado de React, en memoria: se perdía
al recargar la página. Se había anotado que agregar persistencia
requeriría una migración de base de datos (columna o tabla nueva).

**Resolución.** No había ninguna razón técnica real que exigiera una
migración — ni volumen, ni consultas cruzadas, ni integridad referencial,
ni una concurrencia que no pueda resolverse leyendo el valor actual antes
de escribir. La selección de paquetes (nivel, servicios, cantidades,
precios) es un objeto del mismo tipo que ya vivía en columnas JSON
existentes sin ningún cambio de esquema durante las fases 3 a 13
(`datos`, `derivados`, `configuracion.valor`). Se implementó sobre
`diagnostico.propuesta` (JSONB, ya existente): esa columna pasó de guardar
la propuesta redactada por el modelo directamente a guardar un sobre con
dos claves independientes, `propuesta` y `paquetes`
(`src/lib/contenido-propuesta.ts`), con compatibilidad hacia atrás para
los diagnósticos guardados antes de este cambio (forma vieja: el objeto
guardado ES la propuesta, sin sobre). El nuevo server function
`confirmarPaquetes` (`src/lib/paquetes.functions.ts`) lee el valor actual
de la columna antes de escribir, para no pisar la propuesta ya generada;
`generarPropuesta` (`src/lib/propuesta.functions.ts`) se ajustó con el
mismo criterio, para no pisar una selección de paquetes ya confirmada. No
se aplicó ninguna migración.

**Consecuencia.** El circuito de confirmación y persistencia queda
completo y probado (`src/lib/contenido-propuesta.ts`,
`src/lib/contenido-propuesta.test.ts`, `src/lib/paquetes.functions.ts`,
wireado en `diagnosticos.$id.tsx`). Sigue pendiente, como trabajo aparte
(no bloqueado por ninguna decisión de base de datos): conectar la
selección persistida hacia `SeleccionComercial`/`buildDocumentContext()`
para que el PDF de propuesta la use — hoy `comercial: null` sigue
hardcodeado en `src/documents/domain/build-context.ts:479`, sin relación
con esta decisión.

---

## Relevamiento de plataformas (atributos A y B, entradas 4 y 6)

Como parte del cierre de las entradas 4 y 6, se relevaron dos atributos
nuevos por plataforma y plan, contra documentación oficial, con fuente y
fecha registradas y `verificado: false` mientras no haya confirmación
directa de cada cliente. El detalle completo (fuente, cita, fecha de
consulta, y qué combinaciones quedaron como desconocidas por falta de
fuente oficial confiable) vive en
`docs/relevamiento-carrito-mayorista-plataformas.md`. La estructura de datos
que representa ambos atributos vive junto a `ComisionPlataforma` en
`src/lib/canales.ts`.

---

*(Este archivo se actualiza a medida que aparecen nuevas decisiones
pendientes durante el trabajo autónomo. Cada entrada queda numerada y no se
borra hasta que Matías la resuelve.)*
