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
aprobación explícita*: la página de "commercial-summary" en modo
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
