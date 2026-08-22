# Decisiones pendientes

Registro de decisiones de producto o de negocio que aparecieron durante el
trabajo autónomo del 2026-08-21 y que no estaban ya resueltas en los
documentos existentes. No se tomaron unilateralmente: se anota el contexto y
se sigue con lo que no depende de ellas.

Estructura: **Abiertas** (siguen sin resolver) y **Cerradas** (resueltas,
con el contexto original conservado, no borrado). Cada entrada queda
numerada de forma permanente; los números no se reutilizan.

## Abiertas

### 2 · Valor por defecto del costo por evento intermedio (fase 6, presupuesto de arranque)

**Contexto.** El "presupuesto de arranque optimizando por evento intermedio"
(`derivados.presupuesto_arranque.arranque_evento_intermedio`,
`src/lib/calculo-diagnostico.ts`) necesita un costo estimado por evento
intermedio (agregar al carrito o iniciar checkout). Por instrucción explícita
del usuario, ese costo "sale de configuración marcado como benchmark" — se
implementó como una proporción del CPA objetivo
(`factor_costo_evento_intermedio`, config), con un default de código
(`FACTOR_COSTO_EVENTO_INTERMEDIO_DEFECTO = 0,2`, es decir 20% del CPA
objetivo) documentado en `src/lib/calculo-diagnostico.ts`.

**Por qué se anota igual, sin bloquear el bloque.** El patrón en sí (config
primero, default de código marcado como benchmark, nunca cifra única, nunca
confianza "alta") es exactamente lo que pidió el usuario y no requería
autorización adicional. Pero el número concreto, 20%, no tiene respaldo de
datos reales de ningún cliente — es una estimación razonable de que un
evento intermedio (más frecuente, más barato) cuesta una fracción del costo
de una compra, no una cifra derivada de benchmarks de la industria ni de
datos propios. Hoy el radio de impacto es acotado: este valor sólo alimenta
la pantalla interna de diagnóstico (`diagnosticos.$id.tsx`), no ningún
documento cliente-facing (`src/documents/`). Auditoría independiente de fase
6 (commit `0b803af`) recomendó dejarlo trazable acá antes de que, en el
futuro, se conecte a un documento que llegue a un cliente.

**Qué decidir.** Si Matías tiene una referencia mejor (data de campañas
propias con optimización por agregar-al-carrito o iniciar-checkout vs.
compra), reemplazar el 20% por ese número en la fila `configuracion` de la
base (clave `factor_costo_evento_intermedio`) — no requiere tocar código. Si
no hay objeción, el valor por defecto queda como está.

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

### 8 · Algoritmo de reparto de servicios en la escalera de paquetes — **PENDIENTE**

**Contexto.** Al implementar el generador de paquetes (bloque técnico,
2026-08-22, `src/lib/paquetes.ts`) que cierra la entrada 7, la decisión
comercial 7 deja sin especificar dos cosas:

1. Con varios servicios justificados por hallazgos, **en qué orden y en
   qué nivel entra cada uno** (¿todos los servicios ligados a Meta Ads van
   primero? ¿se reparte parejo entre los niveles habilitados?).
2. **Cómo escala la cantidad** de un servicio numérico (campañas activas,
   piezas por mes) ya incluido en un nivel al subir al siguiente — la
   decisión dice "más servicios o alcance adicional" pero no da una
   fórmula.

**Qué se implementó mientras tanto (default razonable, no una decisión
de negocio).** `generarEscaleraPaquetes()` reparte los servicios
justificados en el orden fijo del catálogo `SERVICIOS`, lo más parejo
posible entre los niveles habilitados (nunca más de tres), y escala la
cantidad de cada servicio numérico linealmente con el índice del nivel
(nivel 1 = base configurable, nivel 2 = base × 2, nivel 3 = base × 3).
Está documentado en el comentario de cabecera de `src/lib/paquetes.ts` y
es completamente editable en la pantalla de confirmación
(`src/components/confirmacion-paquetes.tsx`): el vendedor puede mover
servicios entre niveles y cambiar cualquier cantidad antes de confirmar.

**Por qué no bloqueó el bloque.** El generador y la pantalla de
confirmación no dependen de que este reparto sea "el correcto": son
válidos con cualquier distribución, y la confirmación manual obligatoria
existe precisamente para que el vendedor corrija el default del sistema
antes de que se convierta en una propuesta real.

**Consecuencia.** Si Matías define un criterio distinto (por ejemplo,
Meta/Google Ads siempre en el nivel 1, contenido recién en el nivel 2),
es un cambio acotado a la función de reparto en `src/lib/paquetes.ts`, sin
tocar el resto del generador ni la UI de confirmación.

### 9 · Persistencia de la selección comercial confirmada — **PENDIENTE (requiere cambio de base)**

**Contexto.** La pantalla de confirmación de paquetes
(`src/components/confirmacion-paquetes.tsx`) sólo guarda la escalera
editada y confirmada en estado de React, en memoria: se pierde si se
recarga la página. `SeleccionComercial`
(`src/documents/domain/types.ts:210-222`) es el tipo que el PDF de
propuesta necesita para mostrar paquete/alcance/precio, pero
`buildDocumentContext()` sigue fijando `comercial: null` de forma
incondicional (`src/documents/domain/build-context.ts:479`): no hay
ninguna columna ni tabla en Supabase para guardar una selección
confirmada por diagnóstico.

**Por qué no se implementó.** Agregar esa persistencia requiere una
migración de base de datos (columna o tabla nueva). Está expresamente
fuera de lo que este trabajo autónomo puede hacer por sí solo
("restricciones permanentes: no tocar... la base... ni migraciones").

**Consecuencia.** El generador de paquetes y la pantalla de confirmación
quedan listos y probados (`src/lib/paquetes.ts`,
`src/lib/paquetes.test.ts`, `src/components/confirmacion-paquetes.tsx`),
pero el circuito completo ("confirmar y que el PDF de propuesta lo use")
necesita, como paso siguiente y con aprobación explícita de Matías: una
migración que agregue dónde guardar la selección confirmada, y wireado de
esa selección hacia `SeleccionComercial`/`buildDocumentContext()`.

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
