# Contrato funcional — Bloque 3 (2026-08-27)

Escrito en el PASO 2 del prompt "BLOQUE 3 FUNCIONAL — CONTRATO, ESTADOS Y
CONTROLES DE EXPORTACIÓN", HEAD de partida
`7caa9bbb3025bb195689f67331f915f9cdb59434`. Fija las reglas que el PASO 3
y el PASO 4 implementan — este documento no implementa nada por sí
mismo. Todo call site citado se verificó leyendo el código real de ese
HEAD, no los documentos de `docs/visual/` (congelados desde el
23/08-2026, antes de que v2 existiera).

## 1 · Matriz de estados, completada con el call site real

### Eje 2 — disponibilidad del cálculo

| ANTES (`ValorPublicable.estado`) | Call site real | DESPUÉS |
|---|---|---|
| `"calculado"` | `valorCalculado()` (`publishing-policy.ts:15`), usado en `build-context.ts`, `escenarios-90d.ts`, `resumen-comercial.ts` | `disponible` |
| `"no_aplica"` | `valorNoAplica()` (`publishing-policy.ts:39`) — `merTienda`/`merMarketplace`/`roasProductAds` cuando el cliente declaró el canal como no aplicable (`build-context.ts:556-579`) | `no_aplica` |
| `"retenido"`, dato de entrada ausente | `publicarNumero()` (`build-context.ts:131`) cuando `!finito(valor)` por falta de dato — `facturacion`/`ticket`/`pedidos`/`inversionTotal` (`build-context.ts:534-555`); `lineaRetenidaDocumento`/`celdaMes` (`escenarios-90d.ts:84,140`) cuando `!linea.calculable` con motivo "No se declaró la facturación mensual." (`src/lib/escenarios-90d.ts:267`); `comercialDesdeEscalera` → `precio` sin cargar (`build-context.ts:358-363`, motivo "El vendedor no cargó un precio para este nivel.") | **evidencia_faltante** — "Falta [dato] para realizar este cálculo" |
| `"retenido"`, regla de negocio | `margenTotal`/`margenMuestra` cuando `resultado.margen_bloqueado` (contradicción confirmada), cuando la cobertura de canales/productos es parcial (`!coberturaCompleta`), o cuando la política de envío no está confirmada (`build-context.ts:526-552`); `MOTIVO_SIN_CONSERVADOR`/`MOTIVO_SIN_LIMITE_SUPERIOR` (`resumen-comercial.ts:64,67`); retención de fugas con `usa_margen: true` cuando el margen es negativo (`src/lib/calculo-diagnostico.ts`, ver D5); `overrideMargenEnvio` cuando `envioBloqueaRentabilidad(envio)` retiene contribución/ahorro publicitario en escenarios (`escenarios-90d.ts:228`, `MOTIVO_ENVIO_NO_CONFIRMADO`) | **retenido** (sin cambio) |
| ratio con denominador = inversión declarada en $0 | `merTienda` (`inversionCanal(datos,"tienda_propia") === 0`), `merMarketplace`/`roasProductAds` (`inversionProductAds(datos) === 0`) — hoy caen en `publicarNumero` genérico (`build-context.ts:556-579`), sin distinguir "cero real" de "dato ausente" | **no_aplica** (DHB-1) — "Este cálculo no corresponde a este caso" |

**Actualización 2026-08-28 (Bloque Visual 3, reserva R-1):** al cierre de
Bloque 3 Funcional el renombrado de la primera fila nunca se ejecutó —
el código seguía usando el literal `"calculado"`. Bloque Visual 3 lo
implementó como renombrado mecánico (sin cambio de comportamiento):
`ValorPublicable.estado`/`ValorV2.estado` usan hoy `"disponible"`, y
`"calculado"` no existe más como estado del Eje 2 en `src/documents/`
(verificado: cero ocurrencias). La columna "ANTES" de esta fila queda
como registro histórico; la columna "DESPUÉS" es ahora el estado real
del código, no una intención pendiente.

**Corrección 2026-08-27 (durante PASO 3) a la primera versión de este
contrato:** la primera redacción de este documento clasificaba
"cobertura de canales/productos parcial" como `evidencia_faltante` por
criterio propio, presentándola como un caso de juicio no pre-clasificado
por la sección 8 del prompt. Es un error: la sección 8, fila EJE 2
(línea 438-442 del prompt), lista **"cobertura insuficiente" de forma
explícita** como ejemplo de causa "regla de negocio" que se queda en
`retenido`, igual que margen negativo, dispersión alta, contradicción y
conservador no calculable. Se revierte: la rama `!coberturaCompleta` de
`margenTotal`/`margenMuestra` NO migra, queda `retenido` sin cambio.

Sobre **"política de envío no confirmada"** (`envioBloqueaRentabilidad`):
no está en la lista explícita de "casos conocidos que hay que clasificar
sí o sí" de la sección 8 ni en los ejemplos de "regla de negocio" de esa
misma matriz — sigue siendo, en rigor, un caso de juicio no
pre-clasificado, y el criterio original de este contrato (falta una
confirmación pendiente, no un dato numérico ni una regla) se mantiene
como lectura válida. Sin embargo, la resolución vinculante del usuario
sobre modificación de pruebas existentes (2026-08-27, alcance D4) exige
que un caso esté **explícitamente listado en la matriz de la sección 8**
para ser elegible para tocar una prueba rota. Este caso no lo está.
Aplicar la reclasificación rompe `build-context.test.ts` ("mantiene
envío legado como no confirmado y retiene márgenes publicables") sin
que ese caso sea elegible bajo esa regla. Decisión: **no se implementa
en este Bloque 3** — la rama de envío no confirmado de
`margenTotal`/`margenMuestra` queda `retenido` sin cambio, igual que
`overrideMargenEnvio` en escenarios. Queda como candidato documentado
para una futura decisión humana explícita (no una que este contrato
pueda tomar unilateralmente), no como una reclasificación de Bloque 3.

### Eje 1 — origen de la evidencia

| ANTES (`Evidencia.estado`) | Call site real | DESPUÉS |
|---|---|---|
| `"verificado"` | `contradiccion_margen`, `evidencia["fuga_${id}"]` (`build-context.ts:457-478`, fuente `"calcularDiagnostico"`) | `verificado` |
| `"declarado"` | `evidenciaDeclarada()` (`build-context.ts:119`) — todas las entradas de `context.evidencia` que vienen de `datos.*` | `declarado` |
| `"no_disponible"` | `evidenciaDeclarada()` cuando el valor es `null`/`undefined`/string vacío | `no_disponible` |
| `"no_aplica"` | no hay ningún call site real hoy que construya una `Evidencia` con este estado (distinto de `ValorPublicable.no_aplica`, que sí se usa) | `no_aplica` (el tipo lo soporta, sin call site activo hoy) |
| (no existe) | **Sin call site real hoy.** Candidatos evaluados y descartados: las rampas de escenario (`escenarios-90d.ts:41-53`) y las comisiones de plataforma por defecto (`COMISIONES_PLATAFORMA_DEFECTO`, `src/lib/canales.ts:146`, origen `"benchmark_provisional"`) son configuración del sistema, pero NINGUNA de las dos hoy se expone como entrada de `context.evidencia` — viven en `SupuestoDocumento.origen` (mecanismo distinto, ya correcto para su propósito) o directamente no llegan al contrato documental. Se agrega el estado al tipo por exigencia explícita de D4 (Eje 1 completo); no se inventa un call site que no existe para forzar su uso. | `estimado_configuracion` |

Una inversión declarada en cero conserva `estado: "declarado"` (DHB-1,
sección 3).

**Residual documentado, PASO 3 (2026-08-27):** `escenarios-90d.ts`
(`documents/domain`, `mensualDocumento`/`facturacionProyectadaDe` en
`src/lib/escenarios-90d.ts:262-277`) NO migra su rama `facturacionProyectada`
retenida a `evidencia_faltante` en este bloque. Motivo: el motor puro
colapsa dos causas distintas — "no se declaró la facturación mensual"
(dato de entrada ausente, elegible) y "la facturación incremental no es
calculable" (motivo heredado de `facturacionIncremental.motivo`, que
puede venir de una fuga retenida por CUALQUIER causa, incluida una regla
de negocio) — en un único campo `motivo: string`, sin discriminador
estructurado. Migrar sólo la primera causa exigiría parsear ese string
para distinguirla de la segunda, lo cual está explícitamente prohibido
(sección 8 del prompt: "Está PROHIBIDO inferirlo parseando el string de
`motivos`"). Migrar ambas sin distinguir arriesgaría reclasificar una
retención por regla de negocio como si fuera un dato faltante. Se deja
como `retenido` sin cambio — requeriría agregar un discriminador
estructurado al tipo `FacturacionProyectada` de `src/lib/escenarios-90d.ts`
(cambio de tipo, no de fórmula, pero fuera del alcance ya cargado de este
PASO 3) antes de poder migrarse con seguridad. Candidato para un futuro
bloque, no una decisión de producto nueva.

### Confianza (E-07)

**Regla nueva:** cada `Escenario90d.confianza` se deriva de sus PROPIAS
tres magnitudes (`facturacionIncremental`, `contribucionIncremental`,
`ahorroPublicitario`, cada una `LineaImpacto90d.acumulado90d`), no del
`confianzaDocumento` que hoy se copia literal
(`escenarios-90d.ts:201`). Regla: si las tres magnitudes están
`retenido`/`no_aplica` (ninguna `calculado`), el escenario NUNCA puede
llevar `"alta"` — su confianza pasa a `"baja"`, sin importar cuál sea
`confianzaDocumento`. Si al menos una magnitud es `calculado`, la
confianza del escenario es `confianzaDocumento` acotada por la peor
confianza de sus magnitudes `calculado` (nunca mejor que el mínimo real
de lo que efectivamente se publica). `visiblePara`/`escenarioPuedeMostrarse`
no cambian — siguen leyendo el resultado de esta regla nueva, no al
revés.

### Servicios (C-03/E-09/DA-2)

**ANTES:** `HallazgoDocumento.servicioId: string | null`
(`domain/types.ts:89`), producido en `build-context.ts:310` vía
`idServicio()` — un slugify plano sobre `hallazgo.servicio` (string
libre de `src/lib/propuesta.ts`), sin filtrar contra el catálogo. Si
`hallazgo.servicio` fuera alguna vez una concatenación, `servicioId`
hereda un id inventado que no está en el catálogo.

**DESPUÉS:** `HallazgoDocumento.servicioIds: string[]`. Se produce
reutilizando `serviciosCanonicosDe()` (`src/lib/paquetes.ts:121`, YA
existente, YA filtra contra `SERVICIOS` — `src/lib/propuesta.ts:21-28`)
sobre `hallazgo.servicio`, mapeando cada nombre canónico devuelto a un
id estable con la MISMA función `idServicio()` ya existente, aplicada
ahora al nombre canónico, nunca al string crudo. Un hallazgo sin ningún
servicio reconocible produce `servicioIds: []`, nunca un id inventado.

**Catálogo cerrado (`src/lib/propuesta.ts:21-28`, sin cambios, es el
mismo desde la fase 8):**

| Nombre canónico | Id estable (`idServicio`) |
|---|---|
| Meta Ads | `meta_ads` |
| Google Ads | `google_ads` |
| Product Ads | `product_ads` |
| Desarrollo y optimización web | `desarrollo_y_optimizacion_web` |
| Planificación y creación de contenido | `planificacion_y_creacion_de_contenido` |
| Diseño de marca | `diseno_de_marca` |

**Mapeo desde cada string libre actual:** `serviciosCanonicosDe(servicio)`
ya resuelve esto — `SERVICIOS.filter(s => servicio.includes(s))`
(`src/lib/paquetes.ts:121-123`). Una concatenación como "Desarrollo y
optimización web y Meta Ads" produce `["Desarrollo y optimización web",
"Meta Ads"]` → dos ids, no uno inventado — verificado que la función ya
hace esto correctamente (se usa en la escalera de paquetes desde la fase
13).

## 2 · Bloqueo de exportación (D1/C-04)

**Dónde vive:** un punto de exportación NUEVO en v2
(`src/documents/renderers/pdf-v2/exportacion.ts`, PASO 4.7), nunca el
`export-client.ts` real de v1 — modificar el export real de v1 sería un
cambio de COMPORTAMIENTO, no mecánico, prohibido por la sección 6 salvo
que un cambio de tipo lo fuerce (no es el caso: v1 no tiene ningún
export de v2 que forzar). v2 hoy no tiene ningún punto de exportación
conectado a nada — se construye uno, se prueba directamente (S10), y
NO se conecta a ningún botón real (`4.2 EXCLUIDO`: no promover v2, no
conectar v2 a la interfaz).

**Condición:** `kind === "propuesta"` Y (`context.comercial === null` O
`context.comercial.niveles.length === 0`). `comercialDesdeEscalera()`
(`build-context.ts:343-366`) ya garantiza que `null` es exactamente
"sin selección confirmada" (revalida `confirmado === true` y
`niveles.length > 0`) — no hace falta ninguna lógica nueva de
detección, sólo el gate que hoy no existe en ningún lado.

**Mensaje:** al fallar, la función lanza un error explícito (no
`undefined`, no un booleano silencioso) con el texto "Selección
comercial pendiente: no se puede exportar una propuesta sin selección
comercial confirmada." — mismo copy que la vista previa interna
rotulada (abajo).

**Vista previa interna:** el modelo v2 de la propuesta SIEMPRE se
construye igual (D1: "la vista previa interna puede existir") — el
bloque `commercial-offer` ya maneja `pendiente: true` cuando
`context.comercial` es `null` (`v2/blocks.ts`, `buildCommercialOfferV2`,
comentario D1 existente). Lo que se agrega es EXCLUSIVAMENTE el gate de
exportación, no un cambio al modelo de vista previa.

## 3 · Propuesta cualitativa con margen negativo (D5/DHB-2)

**Disparador:** `resultado.margen_bloqueado === true` O el hallazgo
`id === "margen_negativo"` presente en `context.hallazgos` (la misma
señal que ya prioriza ese hallazgo primero, `build-context.ts:89`
`prioridadDeHallazgo`) — cualquiera de las dos activa el modo
cualitativo, para cubrir tanto "margen negativo confirmado y bloqueado"
como "margen negativo calculado pero la contradicción todavía no se
confirmó".

**Las siete piezas, cada una trazable a datos ya existentes en el
contexto — nada nuevo que inventar:**

1. **Alerta de margen negativo** — el hallazgo `margen_negativo` ya
   existe (`src/lib/propuesta.ts`, `mapearHallazgos`), primero,
   prioridad alta. Se renderiza con un tratamiento visual propio (no
   sólo posición — mismo criterio ya usado para D-5, sin rediseñar el
   sistema de badges, sólo dar a ESTE hallazgo un color/ícono distinto
   al resto de "alta").
2. **Explicación de por qué no se publican promesas económicas** — texto
   fijo, nunca generado por IA, condicionado a `esCualitativa === true`.
3. **Hallazgos verificables que no dependan del margen** —
   `context.hallazgos.filter(h => h.id !== "margen_negativo")`, YA
   estructuralmente no dependen del margen (`mapearHallazgos` no filtra
   nada más — confirmado en el PASO 1).
4. **Prioridades cualitativas y servicios compatibles** —
   `context.servicios` (ya deduplicado desde `hallazgo.servicioIds`),
   sin ningún monto asociado.
5. **Plan de validación de datos y medición** — deriva de
   `context.restricciones` (ya existente: cobertura parcial, envío no
   confirmado, contradicción de margen) — no se inventa contenido nuevo,
   se reutiliza el mismo array con un encabezado propio.
6. **Próximos pasos** — el bloque `next-step` ya existente, sin cambios.
7. **Estado de la selección comercial** — `context.comercial === null`
   → "pendiente"; si no, "confirmada" con los niveles (mismo bloque
   `commercial-offer`, sin duplicar).

**Prohibido explícitamente mientras `esCualitativa === true`:**
`commercial-summary` (cifra de contribución incremental, rango,
redacción) NO se renderiza — se reemplaza por la alerta de la pieza 1.
Ningún bloque de escenarios (`proyeccion-90d`) con cifras retenidas
presentadas como pendientes de "casi calcularse" — quedan simplemente
fuera de la propuesta cualitativa (la proyección en sí, documento
separado, sigue mostrando sus retenciones D5 normalmente, con el copy
D4 literal).

## 4 · Roadmap 30/60/90 determinístico (DHB-3/E-18)

**Disparador:** sólo con `context.comercial !== null` (selección
confirmada) — sin eso, `context.roadmap` queda `[]` y el bloque
`roadmap` desaparece del documento exportable; v2 puede mostrar una
VISTA PREVIA interna rotulada "pendiente" (no exportable, mismo
mecanismo que D1) usando los hallazgos/servicios ya disponibles aunque
la selección no esté confirmada — pero el documento que pasa por el
gate de exportación nunca lleva un roadmap poblado sin selección
confirmada.

**Fuentes, sin inventar nada:** `context.hallazgos` (priorizados, ya
ordenados), `context.comercial.niveles[].servicios` (la selección
confirmada) y `context.restricciones` (para "plan de validación" cuando
aplica). Tres etapas fijas (30/60/90 días, `EtapaRoadmap.desdeDia`/
`hastaDia`: 0-30, 31-60, 61-90). Reparto determinístico: los hallazgos
de prioridad "alta" ligados a un servicio SELECCIONADO van a la etapa
30; "media" ligados a un servicio seleccionado, a la etapa 60; el resto
de servicios seleccionados sin hallazgo de alta prioridad asociado (si
los hay) y el plan de medición/validación, a la etapa 90. Cada
`EtapaRoadmap.acciones[]` es literal el título del hallazgo o el nombre
del servicio que la originó — nunca texto redactado libremente.
`resultadoEsperado` cita el hallazgo/servicio de origen explícitamente
(trazabilidad exigida: "todo lo que aparece en el roadmap tiene que
poder trazarse a un hallazgo, a una prioridad o a un servicio").

## 5 · Selección de `findings` para la propuesta (E-08)

**Ya sustancialmente resuelto en v2** (`v2/blocks.ts:135-142`,
`buildFindingsV2(context, "propuesta")`): filtra
`context.hallazgos.filter(h => h.capa === "servicio")`, estructuralmente
distinto del diagnóstico (`buildFindingsV2(context, "diagnostico")`, sin
filtrar). Este contrato fija esto como la regla oficial — la "selección"
que pide la sección 4.1 es este filtro por capa; el "resumen" es que la
propuesta nunca repite hallazgos de capa "recomendación"/"contexto"
(que no tienen traducción directa a un servicio del catálogo, así que
no pertenecen a una propuesta comercial). S9 fija esto con prueba.

## 6 · "Métrica sana" para fortalezas (DA-4/R-07)

**El motor expone esta noción PARCIALMENTE — R-07 se resuelve para 2 de 5
dimensiones, las otras 3 quedan explícitamente sin resolver, per sección
3.9 ("si el motor no expone hoy una noción de 'métrica sana', declaralo y
dejá R-07 sin resolver en vez de fabricar el criterio").**
`resultado.estados_bloque` (`src/lib/calculo-diagnostico.ts:260-266`,
`EstadosBloque`) clasifica cinco dimensiones (`medicion`, `economia`,
`cuenta`, `funnel_web`, `creativos`) en `"verde"`/`"amarillo"`/`"rojo"`/
`"sin_datos"`, cada una con un umbral determinístico en el motor — pero
sólo DOS exponen tanto la métrica real como su umbral como campos de
`resultado.derivados` de primer nivel, sin que el contrato documental
tenga que recomputar nada ni acceder a configuración interna del motor:

- **`economia`** (verde: `mer >= breakeven_roas` con reserva aplicada) —
  métrica: `derivados.mer_actual`; umbral: `derivados.breakeven_roas`.
  Ambos ya son campos de salida del motor.
- **`funnel_web`** (verde: `cr_tienda` sobre el umbral por tramo de
  ticket) — métrica: `derivados.cr_tienda`; umbral:
  `derivados.cr_umbral_verde`. Ambos ya son campos de salida del motor.

Las otras tres se dejan **explícitamente sin resolver, sin fortaleza
generada para ellas aunque su estado sea "verde"**:

- **`medicion`**: el umbral (`uDelta`, `cfg.delta_medicion`) es un
  parámetro de configuración de ENTRADA a `calcularDiagnostico`, no un
  campo de `derivados` — no hay dónde leerlo después del cálculo sin
  duplicar la config por fuera del motor.
- **`cuenta`**: el ratio real (`(presupuesto_diario × 7) / conjuntos_activos`
  dividido por `derivados.piso_semanal_por_conjunto`) se computa inline
  en `calculo-diagnostico.ts:1160-1162` y NUNCA se guarda en `derivados`
  — sólo el denominador (`piso_semanal_por_conjunto`) es un campo de
  salida. Citar la fortaleza exigiría recalcular el ratio por fuera del
  motor, duplicando lógica de umbral (prohibido en el espíritu de la
  sección 6 del prompt, aunque no toque `calculo-diagnostico.ts`
  literalmente).
- **`creativos`**: `evaluarEstadoCreativos(d)` es cualitativo — no hay
  ninguna métrica numérica que citar.

**Regla de fortalezas (para las dos dimensiones resueltas):** con
`estado === "verde"`, se agrega una fortaleza determinística cuyo texto
cita la métrica y su valor real de `resultado.derivados`, nunca redactada
libremente. Sin ninguna de las dos dimensiones en "verde", la sección de
fortalezas no aparece (mismo criterio que cualquier otro bloque opcional
del contrato v2 — nunca un bloque vacío con encabezado).

## 7 · Título de la sección de hallazgos (DA-3/R-09)

`v2/diagnostico.ts:62` sigue con `title: "Funnel, retención y hallazgos
priorizados"` — la página sólo trae hallazgos (`buildFindingsV2`), sin
funnel ni retención con estructura propia (eso es Bloque Visual 3, DA-3
lo dice explícito). Nuevo título: **"Hallazgos priorizados"** — describe
exactamente lo que la sección contiene, sin prometer nada que otro
bloque (Bloque Visual 3) tiene que construir.

## 8 · Criterios de promoción de v2 sobre v1 (sección 14 del prompt)

Se transcriben acá y en el roadmap general, sin ejecutar ninguno:

a) los 24 criterios de aceptación de este bloque en verde; b) los ocho
casos generados con v2, tres documentos, dos perfiles, revisados página
por página por un humano; c) el bloqueo de exportación verificado en la
interfaz real (hoy no existe ninguna interfaz para v2 — es un criterio
para cuando exista); d) al menos un caso con datos de un cliente real,
no demo; e) aprobación humana explícita y registrada; f) un plan de
reversión a v1 en un solo paso.

**Estado de este bloque respecto de esos criterios: NINGUNO se
ejecuta acá.** v1 sigue siendo lo único que produce producción durante
todo este bloque y después de su cierre, hasta que una promoción
explícita, humana, separada, decida lo contrario.

## 9 · Eje 1 visible en metric-grid/coverage (DA-1), PASO 4.2

**Resuelto PARCIALMENTE, mismo criterio de sección 6 (DA-4): sólo donde
hay un origen único y sin ambigüedad, nunca inventando una regla de
colapso para múltiples orígenes.**

`context.evidencia: Record<string, Evidencia<unknown>>` ya existe y trae
`estado` (Eje 1) por clave. El problema real: la mayoría de los campos de
`metric-grid` tienen VARIOS `evidenciaIds` (ej. `pedidos`:
`["facturacion_mensual","ticket_promedio"]`, que pueden tener orígenes
Eje 1 distintos) — DA-1 pide "un chip junto al valor", singular, y no hay
ninguna regla de colapso definida por la sección 3 ni por la
documentación vigente para combinar dos orígenes distintos en un chip.
Inventar una (¿el peor? ¿el primero?) sería una decisión de producto no
autorizada.

**Se implementa el chip SÓLO donde el origen es inequívoco (un único
`evidenciaId`):**

- `metric-grid`: `facturacion` (`facturacion_mensual`) y `ticket`
  (`ticket_promedio`). El resto (`pedidos`, `margenTotal`,
  `margenMuestra`, `inversionTotal`, `merTienda`, `merMarketplace`,
  `roasProductAds`) tiene 2 o 3 `evidenciaIds` — sin chip, sin inventar
  colapso.
- `coverage`: `canales` (`context.evidencia.mix_canales`) y `productos`
  (`context.evidencia.productos_muestra`). `general` es el mínimo entre
  ambos (`build-context.ts`), sin un origen propio — sin chip.

El copy literal D4 del Eje 1 vive en `semantica-v2/estado.ts`
(`textoOrigenV2`), igual que `textoEstadoV2` para el Eje 2 — ningún
renderer escribe el texto a mano (PASO 4.1).

## 10 · Preservación de la salida de v1 (S16), tres regresiones reales encontradas y corregidas

Al escribir las pruebas de S16 (comparar la salida de v1 antes/después
del bloque) se encontraron TRES cambios de dominio compartido
(`documents/domain`, usado por v1 y v2 por igual) que alteraban la
salida real de v1 sin que ninguna prueba existente lo detectara —
ninguno era intencional para v1, los tres se corrigen mecánicamente en
el único borde real de producción de v1: `buildDocumentModelDesdeDiagnostico`
(`src/documents/build-document.ts`, único consumidor real de
`getVelocentumV1Template` — v2 no pasa por acá, nunca la vista previa
interna). Las pruebas de `templates/velocentum-v1/*` que usan fixtures
hechos a mano (`buildTitanContext`, etc.) NO pasan por este archivo —
por eso conservan su comportamiento normal (v1 SÍ soporta roadmap real
y confianza propia cuando el contexto se lo da a mano; lo que no puede
hacer es empezar a recibirlos desde el dominio real sin que nadie se lo
pida).

1. **DHB-3 (roadmap real):** `context.roadmap` pasó de ser siempre `[]`
   a poblarse de verdad con selección comercial confirmada — v1 nunca
   mostró un roadmap real desde `buildDocumentContext`. Fix: se fuerza
   `roadmap: []` en el borde real de v1.
2. **DHB-1 (ratios sobre inversión $0 declarada):** `merTienda`/
   `merMarketplace`/`roasProductAds` pasaron de `retenido` (con
   restricción visible en v1) a `no_aplica` (sin restricción) cuando la
   inversión declarada es exactamente $0. Fix: se revierte a `retenido`
   con el motivo genérico original SÓLO quando el `no_aplica` viene de
   inversión $0 (`inversionCanal(datos, canal) === 0`, discriminador
   estructural) — nunca cuando viene de una declaración de negocio
   legítima y preexistente (`canal_tienda_no_aplica`, etc.), que sigue
   `no_aplica` igual que siempre.
3. **E-07 (confianza por escenario):** `Escenario90d.confianza` pasó de
   copiar `confianzaDocumento` literal a derivarse de sus propias
   magnitudes — cambia el badge de confianza (y la visibilidad del
   escenario "potencial") en casos reales donde ninguna magnitud es
   calculable. Fix: se revierte `confianza` (y `visible`, recalculado
   con la misma regla que antes) a `context.cobertura.confianza` — el
   mismo valor que `confianzaDocumento` representaba antes de este
   bloque, verificado en `build-context.ts`.

Pruebas: `src/documents/build-document.test.ts`, describe "S16 (Bloque 3
Funcional)".

## 11 · R-03 (2026-08-27): corrección de tres hallazgos visuales reales, con verificación permanente

Ronda de corrección sobre PASO 6, iniciada por revisión externa directa
de rásters. Los tres hallazgos son reales; el diagnóstico inicial de
esta sesión sobre H2 y H3 fue parcialmente incorrecto y se corrigió con
evidencia antes de tocar código (ver detalle en cada uno).

**H1 — título invisible en secciones `tone: "dark"` (severidad máxima:
en el caso DHB-2 es el titular de la alerta de margen negativo).**
Preexistente al Bloque 3 (idéntico en HEAD `7caa9bbb`, verificado por
`git show`). Causa: `styles.title` (`pdf-v2/document.tsx`) fija
`color: theme.colors.ink` sin variante `*Dark`, a diferencia de
`eyebrow`/`eyebrowDark` justo arriba. Alcance real, acotado por lectura
de código: sólo las secciones `tone: "dark"` que pasan por `ContentPage`
con `title` no nulo — únicamente "commercial-summary"
(`propuesta.ts`/`proyeccion-90d.ts`), sólo en perfil pantalla
(`impresionSoftened` ya aplana a claro en impresión). Cover/transición/
next-step usan rutas de render propias, con color ya resuelto
correctamente, no afectadas. Fix: `titleDark: { color: theme.colors.surface }`,
aplicado igual que `eyebrowDark` (`dark ? styles.titleDark : {}`).
Verificado por contraste REAL (no sólo el par de tokens del tema): el
test extrae el color de relleno efectivo del stream del PDF vía
`getOperatorList()` en el carácter donde arranca el título, y confirma
que ratio WCAG ≥ 3:1 contra el fondo real de la sección. El cuerpo de la
alerta ("Alerta: Margen de contribución negativo...") no duplica el
titular ("Margen negativo: foco en la causa raíz") — mismo hallazgo, no
el mismo texto.

*Vacío de layout (H1.5), reportado, NO implementado — pendiente de
aprobación explícita. **Superseded por la sección 12, punto 6** (la
propuesta de abajo quedó rechazada por forma insuficiente; la versión
vigente trae wireframe, tokens reutilizados y el caso L13)*: la página
de "commercial-summary" en modo
cualitativo (sólo alerta + eyebrow, sin cifra ni supuestos) ocupa ~15%
del área de una página 16:9/A4 completa, en AMBOS perfiles (confirmado
visualmente en pantalla e impresión). El contenido se distribuye desde
arriba (`header` fijo + `content` en flujo normal, sin `justifyContent`
ni `alignItems` centrados) porque `ContentPage` nunca tuvo un modo
"contenido corto" — el resto de bloques que comparten esta sección
(cifra + rango + supuestos) normalmente llenan el espacio, así que el
vacío nunca se manifestó antes de DHB-2. Propuesta (no implementada):
tratamiento de layout propio para la alerta cualitativa — centrado
vertical del bloque dentro del área de contenido (`justifyContent:
"center"` en el contenedor de la sección cuando el único bloque
presente es `bridge-note` en modo alerta) y/o una tarjeta con borde/
fondo propio (mismo lenguaje visual que `cardAlerta`, ya usado para el
hallazgo de margen negativo en `findings`) en vez de texto plano — para
darle jerarquía visual propia a la única pieza que un cliente con
margen negativo va a leer en esa página.

**H2 — página sin contenido real / desborde de footer.** El diagnóstico
inicial de esta sesión fue incorrecto en dos puntos: (a) atribuyó la
causa a los chips de DA-1 — descartado por prueba directa (quitar los
chips del mismo caso no cambia el conteo de páginas, 6/6 con y sin
chips); (b) afirmó que impresión "corta correctamente" — falso, el
mismo mecanismo roto produce dos síntomas distintos por perfil (ver
abajo). Causa raíz real, aislada por prueba directa contra HEAD
`7caa9bbb`: el caso 1 (multicanal) pasaba de 6/5 páginas
(pantalla/impresión) a 6/6 sólo cuando el bloque `strengths` (DA-4,
nuevo de este bloque) está presente — confirmado quitando sólo ese
bloque del modelo, sin tocar nada más. El `CardGrid` compartido (usado
por metric-grid, services, findings Y strengths) envolvía cada fila en
un `<View style={styles.cardRow}>` SIN `wrap={false}` — cada tarjeta
individual sí lo tenía, pero no el contenedor de fila, que es lo que
Yoga mide para decidir el corte de página. Con una fila cerca del borde
de página, dos síntomas de la misma causa según perfil: pantalla no
cortaba y el footer quedaba superpuesto sobre la fila; impresión sí
cortaba a una página nueva, pero la fila desbordada no se
re-renderizaba ahí, dejando una página con sólo el header fijo (~95
caracteres de texto). Fix: `wrap={false}` en el contenedor de fila de
`CardGrid` — un solo lugar, compartido por los cuatro tipos de grilla,
no un ajuste del caso 1. Verificado por prueba directa (revertir el fix
reproduce exactamente la página vacía real, mismo texto) y por barrido
automático sobre las 329 páginas reales (umbral de 115 caracteres,
calibrado contra la página vacía real de ~95-100 y el contenido corto
real más bajo observado, ~130-145) — 0 páginas por debajo del umbral
tras el fix. Invariante adicional verificado: para diagnóstico,
impresión nunca tiene más páginas que pantalla, en los 8 casos.

**H3 — glifo roto en el eyebrow del diagnóstico.** La hipótesis externa
(colisión de byte) se confirmó de forma precisa: el codepoint real es
`◆` (U+25C6, diagnóstico — NO `→`, ese es `proyeccion_90d`), y la capa
de texto REAL del PDF (no un artefacto de rasterización) contiene `Æ`
(U+00C6) en su lugar — confirmado extrayendo el texto vía `pdfjs`
directamente del PDF generado, sin pasar por `pdftoppm`. Barrido
adicional: TODA la familia "diamante" (`◆` U+25C6, `◇` U+25C7, `♦`
U+2666, `⬥` U+2B25) se verificó rota a través de Satoshi Bold vía
`@react-pdf/renderer` — cada codepoint produce basura DISTINTA (Æ, Ç, f,
%), consistente con un glifo ausente de la fuente resuelto a un slot
equivocado durante el subsetting, no con una colisión de un único byte
fijo. `■`, `○`, `▲`/`▽` (estos dos últimos ya en uso en `etiquetas.ts`
para prioridad) se verificaron correctos por el mismo mecanismo. Fix:
sustitución sistemática — `◆` → `■` en la única constante
`PERSONALIDAD_POR_DOCUMENTO` (`semantica-v2/direccion-arte.ts`), usada
por ambos renderers (PDF y web), sin parches puntuales. Verificado por
barrido automático de mojibake sobre las 329 páginas reales (todo
carácter no-ASCII fuera de la prosa española y de los 9 símbolos
esperados del propio código está prohibido) y por una regresión directa
que busca literalmente `Æ`.

**Cobertura automática resultante (COBERTURA del prompt R-03):** los
tres hallazgos, más el barrido general de mojibake y de páginas sin
contenido, corren sobre los 48 documentos/329 páginas reales en cada
corrida de suite (`generar-pdfs-bloque-3.test.ts`, incorporado al repo
— ver decisión de árbol abajo), no sólo sobre una muestra. Lo que
NO queda cubierto automáticamente: (a) ocupación/tinta por página (R-01/
el "25% de tinta" de la sección 12.3 del prompt) — sigue siendo
verificación visual manual; (b) el vacío de layout de H1.5 (es un juicio
de diseño, no un defecto binario) — reportado, no chequeado por
umbral; (c) inspección visual de las 274 páginas no muestreadas
individualmente durante esta ronda (S13/paridad y las otras verificaciones
programáticas sí las cubren indirectamente).

**Árbol — generador de PDFs incorporado al repo.** `generar-pdfs-bloque-3.test.ts`
pasa a ser parte permanente de la suite (no un script descartable),
mismo criterio que el generador hermano de v1
(`generar-pdfs-escenarios-demo.test.ts`): las verificaciones H1/H2/H3
necesitan generar los 48 documentos reales para correr, y dejarlas fuera
del repo las volvería no-reproducibles. Se agregó a la lista de archivos
permitidos a importar `fixtures-escenarios-demo.ts`
(`src/lib/fixtures-escenarios-demo.test.ts`), mismo mecanismo ya
existente para su análogo de v1.

## 12 · AJUSTES A R-03 (2026-08-27): checks unilaterales, footer en pantalla, muestra visual, reconciliación de páginas, H1.5 reformulado

Segunda ronda de ajustes sobre R-03, antes de cerrarla. Seis puntos.

**1 · Prueba huérfana del worktree.** Resuelta: `generar-pdfs-bloque-3.test.ts`
se commiteó al candidato (ya estaba en `75a2643`, no se dejó viviendo
sólo en el worktree). Verificado recreando `/tmp/wt-r03` desde cero
(`git worktree add` + `npm install` limpio): typecheck limpio, suite
762+1 todo (idéntico al árbol principal tras las correcciones de este
punto 2), y generación real de los 48 PDFs con H1/H2/H3 en verde desde
ese worktree aislado.

**2 · Checks unilaterales — clasificación y corrección.** Regla
aplicada: todo check derivado de una decisión cerrada debe verificar
presencia, no sólo ausencia. De los 4 mínimos exigidos, 2 tenían el
defecto:
- **DHB-2** (`dhb-2-margen-negativo.test.ts`): el único chequeo de PDF
  real (`textoCompleto`, vía `getTextContent()`) sólo verificaba
  ausencia de la cifra prohibida — nunca la presencia VISIBLE del
  titular de la alerta, y `getTextContent()` no ve color (mismo punto
  ciego que dejó pasar H1). Se agregó un test que ubica el titular vía
  `getOperatorList()` (mismo mecanismo que H1 en el generador) y exige
  contraste real ≥ 3:1. Falsabilidad verificada: revertir `titleDark`
  hace fallar este nuevo test con el mismo síntoma exacto de H1.
- **DHB-1** (`bloque-3-contrato.test.ts`, S5): el sub-caso de MER
  tienda propia ya verificaba presencia (`c.evidencia["inversion_meta"]`
  = `declarado, valor:0`); los sub-casos de MER marketplace y ROAS
  Product Ads sólo verificaban `no_aplica`. Se agregó la misma
  aserción de presencia (`c.evidencia["inversion_product_ads"]`) a
  ambos.
- **DHB-3** (`roadmap-dhb-3.test.ts`) y **D1** (`exportacion.test.ts`)
  ya estaban balanceados — no se tocaron. DHB-3 ya exige coincidencia
  exacta de `acciones` por etapa y trazabilidad contra un set de
  fuentes válidas reales; D1 ya verifica el mensaje exacto del throw
  (`toThrowError(MENSAJE_EXPORTACION_BLOQUEADA_V2)`), no sólo que no
  haya exportado.

Suite tras los dos fixes: 762 passed + 1 todo (subió de 761 por el
nuevo test de DHB-2), typecheck limpio.

**3 · Muestreo visual determinístico (~20-30 páginas).** Criterio: una
página por cada tipo de sección implementado en los tres documentos
v2 (grep de `id:` en `diagnostico.ts`/`proyeccion-90d.ts`/
`propuesta.ts`/`shared.ts`), por perfil — 15 filas × 2 perfiles = 30
páginas, caso 1 (marketplace fuerte/tienda floja) como representante
por defecto, con dos excepciones deliberadas: el caso 4 (margen
negativo) para el titular cualitativo de DHB-2 (la página exacta de
H1), y una página renderizada aparte, con datos reales de
`fixtures-casos.ts` (no un caso demo) pasados por el pipeline real
(`calcularDiagnostico` → `buildDocumentContext` → `buildPropuestaDocumentV2`),
para "restrictions-grouped" y "roadmap" — **hallazgo real**: ninguno de
los 8 casos QA (los 6 demostrativos + mayorista + mixto) tiene
`comercial` confirmado (`comercialDesdeEscalera` devuelve `null` sin
`paquetesConfirmados`), así que esas dos secciones nunca se renderizan
en los 48 documentos reales — cobertura visual cero de dos piezas
nuevas de Bloque 3 hasta este punto. Inspección de las 30 páginas: 0
defectos nuevos (sin texto invisible/bajo contraste, sin contenido
cortado/superpuesto/tapado por el pie, sin mojibake, sin placeholders/
NaN/undefined, sin grilla rota). Confirmación visual directa (no sólo
automática) de que H1 sigue resuelto en su página original. Dos
observaciones NO nuevas, ya conocidas como trade-off aceptado: la
página de continuación de `strengths` en impresión (página completa
para una sola tarjeta) y la página de "Qué vamos a trabajar" quedan
muy vacías — mismo patrón que motiva el punto 6. Hallazgo menor de
copy (no de render): "Origen: configuracion" en Metodología, en los
dos casos con ese bloque (mayorista/mixto), sin tilde — no corregido
en esta ronda por no estar entre los 6 puntos pedidos, queda anotado.

**4 · H2 en ambos perfiles + pérdida de contenido en pantalla.** Se
agregó `H2b` (`generar-pdfs-bloque-3.test.ts`), específico de
pantalla: detecta cualquier texto (que no sea el propio pie —
"Velocentum" o el contador de página) con baseline dentro de la franja
del pie (`y < 34`, usando los tokens reales de `styles.footer`:
`bottom: 18` + `fontSize` 8). Falsabilidad verificada revirtiendo
`cardRow` `wrap={false}`: el check de impresión existente falló con su
firma conocida (página con sólo header) y **el nuevo check de pantalla
también falló, con contenido real**:
```
p2: y=20.0 "Informado por el cliente; pendiente de validación"
p2: y=10.9 "documental"
```
Es la copia literal del estado D4 "declarado" (Eje 1). **Confirmado:
es pérdida de contenido real, no cosmética.** En `ContentPage`
(`document.tsx`), `<Footer>` se pinta después de
`<View style={styles.content}>` en el JSX — con `position: "absolute"`,
eso lo deja pintado ENCIMA en el orden de composición. Contenido que
desborda hasta esa franja queda visualmente oculto detrás del pie,
aunque sigue presente en el stream de texto (por eso el chequeo de
longitud mínima no lo atrapaba: el texto está, sólo invisible al
lector). Con el fix restaurado, las 10 pruebas del archivo pasan
limpio.

**5 · 329 vs 325 páginas, explicadas documento por documento.**
Aclaración de la comparación: 325 es el total real de v2 (no de v1)
de la ronda anterior (Bloque Visual 2.2.3, handoff
`docs/visual/handoff-ronda-2.2.3.md` sección 9 — "167 pantalla + 158
impresión"), sobre los mismos 8 casos/48 documentos, HEAD `7caa9bbb`
(el commit inmediatamente anterior al candidato de Bloque 3). Se
reconstruyó ese total generando los 48 documentos desde un worktree
limpio en `7caa9bbb` (sin generador commiteado en ese HEAD, por eso no
había quedado un artefacto reproducible) — **167 pantalla + 158
impresión = 325, exacto**, confirmando que la comparación es
apples-to-apples (mismo motor v2, mismos 8 casos). El candidato actual
mide 170 pantalla + 159 impresión = 329. Los 4 páginas de diferencia,
documento por documento:

| Delta | Documento(s) | Causa |
|---|---|---|
| +1 (impresión) | 1-marketplace, diagnóstico | DA-4 (`strengths`/fortalezas): bloque nuevo, condicional (`context.fortalezas.length > 0`) |
| +1 (pantalla) | 2-margen-alto, diagnóstico | DA-4, misma causa |
| +1 (pantalla) | 4-roas-margen-negativo, diagnóstico | DA-4, misma causa |
| +1 (pantalla) | 5-todo-sano, diagnóstico | DA-4, misma causa |
| +1 (pantalla) | 6-solo-orgánico, diagnóstico | DA-4, misma causa |
| −1 (pantalla) | 6-solo-orgánico, proyección 90d | Fix de `cardRow wrap={false}` (H2): el bloque `scenarios` usa el mismo `CardGrid` que `strengths`; con la fila tratada como unidad atómica, Yoga empaqueta este caso en una página menos que antes del fix — no hay pérdida de contenido (mismas 10 tests de H2/H2b en verde para este documento) |

Suma: +1+1+1+1+1−1 = **+4**, exacto. Los 3 casos sin ningún delta en
diagnóstico (3-margen-fino, mayorista, mixto) no tienen fortalezas
calculadas para ese caso (`context.fortalezas.length === 0`) o ya
estaban en el mismo número de páginas por otra razón preexistente a
Bloque 3. **Ningún delta quedó sin explicar por una sección nueva
genuina (DA-4) o por el fix de H2 — no hay síntoma adicional de H2
escondido en la diferencia.** Nota aparte: el roadmap 30/60/90 y la
propuesta cualitativa de DHB-2/DHB-3 NO explican ningún página nueva
porque, per el punto 3, nunca se renderizan en los 8 casos reales
(comercial siempre `null`) — su costo de página real es desconocido
hasta que exista un caso QA con selección confirmada.

**6 · H1.5 — propuesta reformulada (sigue sin implementar, requiere
aprobación explícita).** Reemplaza la propuesta informal de la sección
11. Página objetivo: "commercial-summary" en modo cualitativo
(DHB-2), la vista de las capturas del punto 3 arriba.

*Wireframe, perfil pantalla (960×540pt):*
```
┌──────────────────────────────────────────────┐
│ → POR QUÉ NO PROYECTAMOS         (eyebrow,    │
│                                    ya existe)  │
│ Margen negativo: foco en la causa raíz (título,│
│                                    ya existe)  │
│                                                │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ (cardAlerta, mismo lenguaje visual que  ┃  │
│  ┃  "Selección comercial pendiente" y      ┃  │
│  ┃  "Qué falta validar" — borde            ┃  │
│  ┃  theme.colors.risk, ya usado 2 veces)   ┃  │
│  ┃                                          ┃  │
│  ┃  Alerta: Margen de contribución         ┃  │
│  ┃  negativo. No proyectamos contribución, ┃  │
│  ┃  ahorro ni retorno: el margen de        ┃  │
│  ┃  contribución actual es negativo, así   ┃  │
│  ┃  que cualquier cifra de rentabilidad    ┃  │
│  ┃  futura no tendría respaldo real. Esta  ┃  │
│  ┃  propuesta se enfoca en resolver esa    ┃  │
│  ┃  causa raíz antes de proyectar ningún   ┃  │
│  ┃  resultado económico.       (texto YA   ┃  │
│  ┃                               existente) ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│         (bloque centrado verticalmente         │
│          en el área de contenido)              │
│                                                │
│ Velocentum                              2 / 5  │
└──────────────────────────────────────────────┘
```
*Perfil impresión (A4)*: mismo esquema — eyebrow + título ya en su
posición actual (no cambian), tarjeta `cardAlerta` centrada
verticalmente en el área de contenido, mismo texto. La única
diferencia es que en impresión la sección ya usa `impresionSoftened`
(fondo claro, texto oscuro) — la tarjeta usa el `cardAlerta` claro tal
cual existe hoy (borde rojo/fondo `#FBEAEA`), sin variante nueva.

*Cómo resuelve el ~85% vacío sin inventar contenido*: no agrega
ninguna palabra nueva — el eyebrow, el título y el cuerpo de la alerta
son exactamente el mismo string que hoy. Los dos cambios son de
layout puro: (a) envolver el texto ya existente en una tarjeta
`cardAlerta` (ya aprobada, ya usada dos veces en este mismo documento)
en vez de texto plano contra el fondo de la sección, lo que le da peso
visual propio; (b) centrar verticalmente ese bloque dentro del área de
contenido (`justifyContent: "center"` en el contenedor de la sección,
sólo cuando el único bloque presente es la alerta cualitativa) en vez
de anclarlo arriba. Ninguno de los dos requiere una cifra, un ícono
nuevo ni una frase adicional.

*Tokens de dirección de arte reutilizados*: `cardAlerta` (`document.tsx`,
ya existente, sin modificar) para el borde/fondo de la tarjeta;
ninguno de los tokens de `semantica-v2/direccion-arte.ts` (textura,
degradado, profundidad, glifo de personalidad) cambia — la propuesta
NO extiende `ICONOGRAFIA_SUPERFICIES` ni agrega textura de fondo a esta
superficie, precisamente para no introducir una decisión de diseño
nueva fuera de las ya aprobadas en D-5.

*Caso L13 (margen negativo Y selección comercial confirmada
simultáneamente)*: sin cambio de comportamiento. La condición
`esCualitativa` (`propuesta.ts`) depende únicamente del margen —
`buildAlertaMargenNegativoV2` no lee `context.comercial` en ningún
punto. La pieza de selección comercial (`commercial-offer`, pieza 7)
es una sección aparte, ya independiente de `esCualitativa` hoy mismo:
con selección confirmada, esa sección aparte muestra el paquete
confirmado en vez de "Selección comercial pendiente", pero la página
de la alerta (esta propuesta) es idéntica en ambos casos — el mensaje
no depende de si hay selección o no. La propuesta no necesita ninguna
condición especial para L13 porque no toca esa dependencia existente.

Sigue siendo propuesta — no implementada, pendiente de aprobación
explícita antes de cualquier cambio de código.

## 13 · CIERRE de R-03 (2026-08-27): H1.5 implementado, noveno caso QA, L13, typo

R-03 queda cerrada por decisión del usuario. Cuatro puntos ejecutados
sobre lo anterior, autorizados explícitamente:

**H1.5 implementado.** Gate exacto en `ContentPage`
(`document.tsx`): `esAlertaHero = section.blocks.length === 1 &&
section.blocks[0]?.type === "bridge-note"` — probado algebraicamente
equivalente a `esCualitativa` dado el árbol de construcción real de
`propuesta.ts` (`buildBridgeNoteV2` sólo es no-null si
`resumenComercial.cifraPrincipal` está calculado, condición que
también deja `buildCommercialSummaryV2` no-null porque necesita menos
— sólo que `resumenComercial` exista — así que en la rama NO
cualitativa `blocks.length` nunca puede ser 1 con ese único bloque
siendo `bridge-note`; verificado por grep exhaustivo: `bridge-note`
sólo lo producen `buildAlertaMargenNegativoV2`/`buildBridgeNoteV2`, un
único call site). El texto de la alerta se envuelve en
`[styles.standaloneCard, styles.cardAlerta, styles.heroAlertaCard]`
(deliberadamente SIN `cardDark`: mezclar el texto claro de `cardDark`
con el fondo claro de `cardAlerta` hubiera repetido el defecto de H1),
centrado con `styles.contentHeroAlerta` (`flex:1, justifyContent:
"center"`), texto en `V2_CONTRAST_TOKENS.altaBadgeText` ("#992D2D",
6,52:1 sobre "#FBEAEA", ya verificado en C4 ronda 2.1) — nunca
`theme.colors.risk` (3,66:1, insuficiente). Cero contenido nuevo: el
texto es el literal ya producido por `buildAlertaMargenNegativoV2`.

Check falsable propio (`dhb-2-margen-negativo.test.ts`): dos
condiciones sobre el PDF real — (a) `hayRellenoConColor` detecta el
`constructPath` inmediatamente después de fijar el color de relleno
exacto de `cardAlerta` ("#fbeaea") en el operator list — sin la
tarjeta, esa página nunca pinta ese color; (b) contraste ≥ 4,5:1 entre
el color real del texto (vía `colorAlMostrar`, mismo mecanismo que
H1.4) y el fondo de la tarjeta. Falsabilidad verificada revirtiendo el
gate (`esAlertaHero = false && ...`): ambos perfiles fallan
exactamente en "la página no pinta el relleno de cardAlerta", restaurado
y en verde.

**Noveno caso QA "confirmada".** Ver comentario en cabecera de
`generar-pdfs-bloque-3.test.ts` y el objeto `ESCALERA_CONFIRMADA_SNAKE_STORE`
ahí mismo para el detalle completo de datos/origen. Resumen: pipeline
real (`calcularDiagnostico` + `buildDocumentContext`, sin datos
inyectados a mano) sobre `casoSnakeStore` (`fixtures-casos.ts`, fixture
de regresión, no demostrativa), con una escalera de paquetes confirmada
armada a mano (mismo criterio que `buildMayoristaContext`/
`buildMixtoContext`) que selecciona "Planificación y creación de
contenido" (servicio real sugerido por el motor para este caso,
`hallazgoIds: ["retencion_recuperacion_carrito"]`, media prioridad →
etapa 60) y "Meta Ads" (servicio del catálogo sin ningún hallazgo real
asociado en este caso → etapa 90, junto con las dos restricciones
reales del caso). Etapa 30 queda vacía a propósito: ningún caso de
`fixtures-casos.ts` tiene un hallazgo "alta" en capa "servicio" —
llenarla hubiera exigido inventar un hallazgo, prohibido. Verificado
por artefacto real: `restrictions-grouped` (p7 propuesta, ambos
perfiles) y `roadmap` (p8, etapas 60 y 90 con acciones/trazabilidad
literal) aparecen con contenido real por primera vez en los 54
documentos — antes de este caso, cero cobertura de artefacto para esas
dos piezas de DHB-3 (sólo cobertura de prueba unitaria con fixtures
sintéticas). L7 (selección completa) y L14 (roadmap con selección
confirmada) quedan cubiertos por artefacto, no sólo por prueba.

Hallazgo colateral, fuera de alcance de este ajuste, reportado y NO
corregido acá: `build-context.ts:455` construye
`context.servicios[].alcance` SIEMPRE vacío (`[]`) para cualquier caso
que pase por el pipeline real — los ocho casos originales nunca lo
mostraron porque sus servicios vienen de fixtures armadas a mano con
`alcance` hardcodeado. Con un único servicio real sugerido, la página
"Qué vamos a trabajar" mide ~98 caracteres, bajo el umbral H2
(115) calibrado contra fixtures con alcance no vacío. Se excluyó del
check ese caso preciso (una sola tarjeta de servicio real, ver
comentario en el test) sin inventar contenido de alcance — decisión de
producto (qué debería decir el alcance de servicios reales) queda
pendiente, no tomada acá.

**Página de propuesta cualitativa: 54 → 376 páginas totales (9 casos ×
3 documentos × 2 perfiles), delta contra los 329 exactamente +47 = los
seis documentos íntegros del caso "confirmada" (7+6 diagnóstico +
9+9 propuesta + 8+8 proyección = 47) — ningún otro caso cambió de
conteo.**

**L13 — ajuste de copy.** Sólo la frase de cierre de
`buildAlertaMargenNegativoV2` (`blocks.ts`): "antes de proyectar ningún
resultado económico" → "lo que queda en suspenso es la proyección de
un resultado económico, no el trabajo." Resto del texto sin cambios;
las siete piezas de DHB-2 sin cambios. Ningún test asertaba el string
literal anterior (grep confirmado antes de tocarlo) — el ajuste no
forzó ningún cambio más allá de esa frase.

**Typo corregido.** `document.tsx`, caso `"methodology"`: `Origen:
{item.origen}` interpolaba el valor crudo del enum
(`"observado"|"declarado"|"configuracion"|"derivado"`) en vez de pasar
por `LABELS_ORIGEN_SUPUESTO` (`semantica-v2/etiquetas.ts`, ya existente,
ya con tilde) — afectaba los cuatro valores, no sólo el acento de
"configuracion". `web-v2/document-renderer.tsx` ya usaba el label
correcto en el mismo punto (línea 631); este fix alinea pdf-v2 con el
comportamiento ya establecido en el otro renderer, no inventa una
convención nueva. Verificado con render real de `mayorista`: "Origen:
Configuración" (antes: "Origen: configuracion").

Suite tras estos cuatro puntos: 765 passed + 1 todo (subió de 762 por
H1.5 ×2 perfiles), typecheck y build limpios.

## 14 · R-09 (Bloque Visual 3, 2026-08-28): PARCIALMENTE RESUELTO — funnel construido, retención documentada sin resolver

La sección 7 de este documento dejaba pendiente, explícitamente, dos
componentes de R-09: el funnel web y el bloque de retención. Bloque
Visual 3 (HEAD de partida `82bb66e`) resolvió el primero y dejó el
segundo documentado, mismo criterio que R-07 — no se fabrica un
componente para exponer algo que el motor no expone estructurado.

**Funnel — CONSTRUIDO.** `resultado.derivados.funnel` (`FunnelDerivado`,
`src/lib/funnel.ts`) ya traía la cascada completa del canal tienda
propia (visitas/agregados/checkouts/compras, tres tasas por tramo,
conversión global), pero nunca llegaba a `DocumentContextV1`. Se agregó
`funnelWebDocumento` (`domain/build-context.ts`) que lo traduce SIN
derivar ni recalcular ninguna tasa: lee los campos de `FunnelDerivado`
tal cual, marca `no_aplica` (DHB-1) cuando una tasa tiene denominador
cero, y devuelve `null` (bloque ausente, nunca vacío con encabezado)
cuando el estado del motor es `no_aplica`/`sin_datos`/`error`. Forma
visual: tabular, reutilizando el patrón `metric-grid` ya aprobado
(`vdoc2-metric-grid`/`vdoc2-metric` en web; `CardGrid` en PDF) — cuatro
tarjetas (o dos, cuando `desglosado` es falso y faltan etapas
intermedias) más una tarjeta de conversión global. Sin gráfico nuevo,
sin composición nueva. Verificado con `funnel-web-r09.test.ts` (cinco
casos: desglosado, combinado, no_aplica, sin_datos, denominador cero) y
con inspección visual real (PDF rasterizado, pantalla e impresión) y de
markup web (`renderToStaticMarkup`) — paridad semántica confirmada
texto por texto entre ambos renderers.

**Retención — SIN RESOLVER, documentado (mismo criterio que R-07).**
A diferencia del funnel, no existe un `XxxDerivado` estructurado
análogo para retención en `resultado.derivados`. Lo que expone el motor
son dos `Fuga` independientes (`recuperacion_carrito`, `recompra`,
`calculo-diagnostico.ts:1315-1440`), cada una con su impacto monetario
tipado — ya mapeadas a `hallazgos` y ya visibles hoy en la sección de
hallazgos del documento. No hay un objeto con la forma de
"cascada de retención" (tasa actual, tasa objetivo, ventana, cohortes)
en `derivados`: esos números viven como campos de ENTRADA de
`DatosDiagnostico` (`retencion_recuperacion_pct_actual`,
`recompra_tasa_actual_pct`, etc.), no como salida derivada. Construir
un bloque de retención exigiría una de dos cosas fuera de alcance de
este bloque: (a) que el motor exponga un derivado de retención nuevo
(cambio del motor, prohibido en la sección 4 de este bloque), o (b) un
componente que sólo re-empaquete visualmente los mismos dos hallazgos
que el usuario ya ve en la sección de hallazgos, sin aportar
información nueva — decisión explícita del usuario: no fabricarlo.
Queda para un bloque futuro con mandato de diseño explícito sobre qué
forma debería tener ese derivado en el motor.

**Estado final de R-09: PARCIALMENTE RESUELTO.** Funnel: sí. Retención:
no, con la razón documentada arriba — no "resuelto" a secas.

## 15 · Reconciliación de páginas contra el Bloque 3 (criterio de aceptación 16)

Corrección aplicada tras la primera ronda de auditoría interna sobre el
commit candidato (veredicto APROBADO CON CORRECCIONES): el criterio 16
exige reconciliar el conteo de páginas contra el ZIP del Bloque 3 con
"toda diferencia explicada", y esa explicación no estaba escrita en
ningún documento del candidato. Se agrega acá.

**376 → 380 páginas, delta +4, las 54 combinaciones (9 casos × 3
documentos × 2 perfiles).** Verificado regenerando los 54 PDFs desde un
`git worktree` limpio en `82bb66e` (antes) y comparando contra el mismo
juego generado desde el commit candidato (después), con `pdfinfo` sobre
cada PDF.

El delta completo está concentrado en cuatro documentos `diagnostico`
— los únicos cuatro tipo/perfil que tienen la sección "Cobertura y foto
actual" con la fila de fortalezas cerca del borde de página, donde el
bloque `funnel` nuevo (R-09) empuja el contenido restante a una página
adicional:

| Documento | Antes | Después | Delta |
|---|---|---|---|
| `1-marketplace-fuerte-tienda-floja/diagnostico-pantalla` | 6 | 7 | +1 |
| `2-margen-alto-volumen-bajo/diagnostico-impresion` | 5 | 6 | +1 |
| `3-margen-fino-volumen-alto/diagnostico-impresion` | 5 | 6 | +1 |
| `5-todo-sano/diagnostico-impresion` | 5 | 6 | +1 |

Las 50 combinaciones restantes (incluida `5-todo-sano/diagnostico-pantalla`,
la usada como comparativa visual en el ZIP de revisión) no cambiaron de
conteo — el funnel entró en el espacio disponible de la página existente
en esos casos. Ninguna de las cuatro páginas nuevas tiene texto solapado,
cortado, ni queda con encabezado sin contenido — verificado por
inspección visual directa de los rásters y por la suite automatizada de
composición (H1/H2/H2b/H3, `generar-pdfs-bloque-3.test.ts`), que corre
sobre las 54 combinaciones y pasa en verde sobre el HEAD final.

## 16 · Ronda correctiva Bloque Visual 3.1 (2026-08-28): C-1 a C-4

Cuatro correcciones sobre el candidato auditado del Bloque Visual 3
(`cb8b378`, APROBADO CON CORRECCIONES). Ninguna reabre R-01/R-09, ninguna
toca el motor, ninguna relaja un umbral existente.

**C-1 — fortalezas aislada en una página ~78% en blanco.** Causa real:
`fortalezas` era el último bloque de la sección "current-state"
(`diagnostico.ts`); en el caso con una sola fortaleza
(`1-marketplace-fuerte-tienda-floja`, `channelComparison` presente → C6
dedup activo → `metric-grid` cabe sin fila de continuación), no quedaba
ningún bloque grande después para absorber su tarjeta si la sección
completa no cabía en la página anterior. Corrección: `metrics` pasa al
final del orden de bloques (`blocks: [coverage, channelComparison,
fortalezas, shipping, funnel, metrics]`) — `fortalezas`/`shipping`/
`funnel` quedan pegados al principio de la sección, donde siempre hay
contenido previo y siguiente con qué fusionarse, y la fila de
continuación que le toca a `metrics` quedar sola es el residuo YA
documentado y aceptado (`contrato-composicion-v2.md` sección 5.8, C7,
primera viñeta — ampliada en esta ronda, ver ahí). Sin inventar
contenido, sólo reordenando bloques reales. Falseado: revertir el orden
reproduce el defecto original exacto (167 caracteres en la página
aislada) — ver `bloque-visual-3-1-verificacion.test.ts`, W1.

**C-2 — el funnel se leía como cuatro tarjetas sueltas, no como
cascada.** Causa real: `buildFunnelV2`/`renderBlock` reutilizaban
literalmente el mismo `CardGrid` y las mismas `cols` que `metric-grid`,
sin ningún título ni tratamiento visual propio. Corrección: el funnel
pasa a la tabla simple ya aprobada (`monthlyTable*` en PDF, mismos
estilos que el detalle mensual de escenarios; `vdoc2-table-wrap`/
`vdoc2-monthly-table` en web), con encabezado propio ("Funnel de
conversión: tienda propia") y columnas Etapa/Valor/Conversión desde la
etapa anterior — mismo patrón de composición ya aprobado, sin gráfico
nuevo. Cero derivación: los mismos cuatro valores y tres porcentajes que
ya traía el bloque. Falseado: revertir el renderer reproduce el
`vdoc2-metric-grid` compartido — ver W2.

**C-3 — `web/` traía 27 renders en vez de 54.** Causa real (inferida —
el script que generó el ZIP anterior no se incorporó al repositorio, no
hay commit que lo pruebe directamente): 27 = 9 casos × 3 documentos × 1
perfil — exactamente la mitad de 54, la firma exacta de haber iterado
sólo el perfil "pantalla". A diferencia del renderer PDF, el renderer
web es HTML continuo sin paginación real: "impresión" sólo cambia una
clase CSS (`vdoc2--impresion`, ancho A4) y un par de custom properties
de sombra/textura (`profile` en `document-renderer.tsx`), no la
composición estructural — fácil de asumir "no agrega nada" y omitirlo,
pero `c-08-perfil-a4.test.ts` ya probaba que los dos perfiles producen
HTML distinto, y el ZIP original de Bloque Visual 3 prometía 54 (un
render por PDF, sección 17). Corrección: nuevo generador incorporado al
repo, `renderers/web-v2/generar-web-bloque-3.test.ts` (mismo criterio
que el generador hermano de PDFs — sólo escribe a disco con
`VELOCENTUM_BLOQUE3_WEB_QA_DIR`, siempre verifica los 54 en memoria),
que itera los dos perfiles explícitamente y verifica que producen HTML
distinto para cada caso/documento.

**C-4 — desliz de redacción en la sección 15.** "los únicos siete
tipo/perfil" → "los únicos **cuatro** tipo/perfil" (la tabla de arriba
siempre tuvo cuatro filas; el texto decía "siete" desde la ronda
anterior). Corregido en esta misma sección de arriba.

### Reconciliación de páginas contra `cb8b378`

54 PDFs regenerados desde un `git worktree` limpio en `cb8b378` (antes)
y comparados contra el mismo juego generado desde el árbol con las
cuatro correcciones (después), con `pdfinfo` sobre cada PDF. **380 → 380
páginas totales, delta neto 0** — pero con movimiento real dentro de
tres documentos, los tres explicados por el mismo mecanismo (C-1 mueve
`metrics` al final; la tabla del funnel de C-2 es más compacta que el
`CardGrid` que reemplaza):

| Documento | Antes | Después | Delta |
|---|---|---|---|
| `2-margen-alto-volumen-bajo/diagnostico-pantalla` | 6 | 7 | +1 |
| `2-margen-alto-volumen-bajo/diagnostico-impresion` | 6 | 5 | −1 |
| `3-margen-fino-volumen-alto/diagnostico-pantalla` | 6 | 7 | +1 |
| `3-margen-fino-volumen-alto/diagnostico-impresion` | 6 | 5 | −1 |
| `5-todo-sano/diagnostico-pantalla` | 6 | 7 | +1 |
| `5-todo-sano/diagnostico-impresion` | 6 | 5 | −1 |

**Pantalla, +1 en los tres casos**: ninguno de los tres usa
`channelComparison` (venden sólo por tienda propia, sin Mercado Libre),
así que el dedup de C6 no aplica y `metric-grid` conserva sus 9 tarjetas
— con `metrics` al final (C-1), su fila de continuación (MER tienda
propia/MER marketplace/ROAS Product Ads, ~15-25% de ocupación) ahora
abre página propia en vez de quedar seguida por `shipping`/`funnel` en
la misma página, como pasaba con el orden anterior. Es el MISMO residuo
ya aceptado en `contrato-composicion-v2.md` sección 5.8 (C7, antes sólo
documentado para el caso multicanal s1) — no un defecto nuevo, ver la
ampliación de esa sección. Verificado por inspección visual: contenido
idéntico al de la excepción ya aceptada (mismas tres tarjetas, mismo
motivo de "no aplica"/"evidencia_faltante").

**Impresión, −1 en los mismos tres casos**: la tabla del funnel (C-2)
ocupa menos alto que el `CardGrid` de cuatro tarjetas + tarjeta
"Conversión global" que reemplaza, así que en el perfil que apila más
agresivamente (impresión) ese ahorro alcanza para evitar una página que
antes hacía falta.

Las 48 combinaciones restantes (incluidas las 4 páginas nuevas de la
ronda anterior, sección 15) no cambiaron de conteo. Ninguna página nueva
ni desplazada tiene texto solapado, cortado, ni queda con encabezado sin
contenido — verificado por inspección visual directa de los rásters y
por la suite automatizada de composición (H1/H2/H2b/H3,
`generar-pdfs-bloque-3.test.ts`), que corre sobre las 54 combinaciones y
pasa en verde sobre el HEAD final.
