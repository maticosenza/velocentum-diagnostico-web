# PASO 1 — inventario (Fase 14)

Checkpoint obligatorio no bloqueante. Ver `docs/prompts/fase-14.md`
sección 6, PASO 1.

## a) Punto único de decisión de plantilla/renderer

**No existe hoy un único punto que decida TODO (plantilla + renderer web
+ renderer PDF) — hay tres puntos coordinados, los tres consumidos por
un único componente de interfaz:**

1. `src/documents/build-document.ts`, función `buildDocumentModelDesdeDiagnostico`
   (línea ~140) — arma el `DocumentModel` (v1) llamando a
   `getVelocentumV1Template(templateId).build(...)`. El propio archivo se
   autodescribe como "Punto único de armado de documentos... La interfaz
   sólo conoce este módulo" — es el punto de entrada arquitectónico, pero
   hoy está hardcodeado a v1 (no hay ninguna rama que pueda devolver v2).
2. `src/routes/_authenticated/documentos.$id.$slug.tsx` (línea 23) —
   importa `DocumentWebRenderer` (v1) de forma fija para la vista previa
   en pantalla.
3. `src/documents/renderers/pdf/export-client.ts` (línea 12) — importa
   `createPdfDocumentElement` (v1) de forma fija para la descarga.

Los tres son consumidos ÚNICAMENTE por el mismo archivo
(`documentos.$id.$slug.tsx` — único caller de los tres en todo `src/`,
confirmado por búsqueda exhaustiva). No hay otra ruta, componente ni
script que construya o renderice un documento para un usuario real.

**Esto SÍ cambia la naturaleza del ítem 3 en el sentido literal del
prompt (sección 10, condición 4: "si el punto único... no existe y
conectar v2 exigiría tocarla en varios lugares") — pero no en un sentido
que amerite detenerse**: los tres puntos son pequeños, ya coordinados
por diseño (un solo caller), y la solución natural es la que P2 ya pide
("el interruptor tiene que ser un único lugar, obvio, documentado, y
revertible cambiando un valor") — un ÚNICO flag/constante que decide el
motor, con los tres puntos de arriba haciendo `branch` sobre ESE mismo
valor (nunca decidiendo por su cuenta). El flag en sí es el "punto
único"; los tres call sites son consumidores del mismo flag, no
decisiones independientes. Se reporta y se continúa (no es una decisión
de producto nueva ni un problema de arquitectura dispersa — es
exactamente el patrón de "feature flag" que P2 describe).

Plan concreto (ítem 3, PASO 4): `buildDocumentModelDesdeDiagnostico`
devuelve una unión discriminada (`{ engine: "v1", model } | { engine:
"v2", model }`) según el flag; los otros dos puntos hacen `switch` sobre
`engine` para llamar al renderer que corresponde. El flag vive en un
único archivo nuevo, pequeño, documentado.

## b) Componentes que muestran estados/validaciones/mensajes del modelo

Relevados sobre la superficie de generación de documentos (la única que
esta fase toca — ítem 6/X5 son sobre "lo que la interfaz muestre sobre
estados, validaciones y bloqueos" del FLUJO DE DOCUMENTOS, no sobre el
resto de la aplicación):

- `documentos.$id.$slug.tsx`, banner `errorDescarga` (línea 189-196) y
  los dos `EmptyState` (carga fallida, build fallido, líneas 91-126):
  ambos muestran `error.message` tal cual, sin texto propio inventado
  por la interfaz — **ya cumple** el criterio, y seguirá cumpliéndolo
  cuando el gate de exportación de v2 (`MENSAJE_EXPORTACION_BLOQUEADA_V2`,
  `renderers/pdf-v2/exportacion.ts`) se conecte: el mensaje que llegue a
  pantalla será literalmente esa constante, no una reformulación.
- El resto de los textos de esa ruta (`ETIQUETA_PERFIL`, "Descargar
  PDF", "Volver al diagnóstico", nombres de pestañas) son copy de
  INTERFAZ (navegación, acciones), no estados derivados del modelo de
  documento — fuera del alcance de D4.

**Fuera de esta superficie, no tocado por esta fase:** la página de
detalle del diagnóstico (`diagnosticos.$id.tsx`) tiene su propio panel
"Resumen" con un tipo `EstadoBloque`/`ETIQUETA_ESTADO` propio (líneas
530-597) — es un concepto PRE-EXISTENTE y DISTINTO (confianza de
cálculo por bloque, de fases anteriores), no el Eje 1/Eje 2 de D4 ni
parte del flujo de generación de documentos. Reescribirlo para que use
la capa semántica de documentos sería ampliar el alcance de esta fase
sin que el prompt lo pida — se deja documentado, no se toca.

## c) Carga de datos hoy — reproducibilidad de Snake Store y Titan Web B1

`src/routes/_authenticated/diagnosticos.nuevo.tsx`: formulario completo
que arma un objeto `datos: DatosDiagnostico` campo por campo (estado de
React, valores iniciales `DATOS_INICIALES`), llama
`calcularDiagnostico(datos, cfg)` y guarda con
`supabase.from("diagnostico").insert(...)` (línea 236-297, función
`guardar`). Es el ÚNICO camino de creación de diagnósticos en la
interfaz.

`src/lib/fixtures-casos.ts`, `casoSnakeStore` y `casoTitanWebB1`: ambos
son objetos `DatosDiagnostico` puros (mismo tipo exacto que arma el
formulario) — **sí son reproducibles por el flujo real**, completando a
mano los ~15-17 campos que cada uno fija por encima de
`DATOS_INICIALES` (nombre de tienda, plataforma, plan, pasarela, ticket
promedio, costo de envío, tres productos con nombre/costo/precio/% de
facturación, y los campos de canal — `canal_tienda_pct`/
`canal_ml_no_aplica` para Snake Store; `vende_mercado_libre`/
`canal_ml_pct`/`canal_ml_facturacion`/`canal_tienda_no_aplica`/
`ml_inversion_product_ads` para Titan Web B1). Ningún campo de ninguno
de los dos casos está fuera de lo que el formulario captura.

## d) Las 16 páginas de E-20 — sección que las genera y por qué no llenan

Inspección visual directa (rásters de la ronda 3.1, commit `f18ff1f` —
mismo código de composición que el HEAD actual `c4bdb0d`, sin cambios
de por medio). Se agrupan por causa real — la misma causa se repite en
varias páginas:

**Grupo 1 — fila de continuación de `metric-grid` (3 tarjetas: MER
tienda propia / MER marketplace / ROAS Product Ads).** YA es una
excepción documentada y aceptada (`contrato-composicion-v2.md` sección
5.8, primera viñeta, ampliada en la ronda 3.1 para cubrir estos casos
exactos). No requiere corrección nueva — requiere decidir si sigue
como excepción o si el rediseño de E-20 la alcanza también.
  - `2-margen-alto-volumen-bajo/diagnostico-pantalla` p4 (21,9%)
  - `3-margen-fino-volumen-alto/diagnostico-pantalla` p4 (21,9%)
  - `5-todo-sano/diagnostico-pantalla` p4 (21,9%)
  - `confirmada/diagnostico-pantalla` p3 (21,9%)

**Grupo 2 — `findings` con pocos hallazgos reales (2).** Mismo patrón
que la excepción YA documentada en 5.8 ("Por qué ahora... con pocos
hallazgos de capa servicio"), extendido a más casos/documentos.
  - `4-roas-bueno-margen-negativo/diagnostico-impresion` p4 (17,1%) —
    "Hallazgos priorizados", 2 hallazgos reales.
  - `mayorista/propuesta-impresion` p3 (19,8%) — "Por qué ahora", 2
    hallazgos reales.
  - `mixto/propuesta-impresion` p3 (19,8%) — ídem, mismo contenido real.

**Grupo 3 — `restrictions-grouped` con pocas restricciones reales (2).**
Patrón nuevo, no documentado todavía en 5.8.
  - `confirmada/diagnostico-impresion` p5 (21,5%)
  - `confirmada/propuesta-impresion` p7 (21,5%)
  - `confirmada/proyeccion_90d-impresion` p4 (21,5%)

**Grupo 4 — `methodology` con pocas entradas reales (2).** Patrón
nuevo.
  - `mixto/diagnostico-impresion` p5 (21,7%)
  - `mixto/proyeccion_90d-impresion` p7 (21,7%)

**Grupo 5 — `commercial-offer` confirmado, paquete real pequeño (1
nivel, 2 servicios).** Patrón nuevo — distinto de la excepción ya
documentada en 5.8 (que sólo cubre el caso PENDIENTE, "Selección
comercial pendiente", una oración). Este es el caso CONFIRMADO, con
datos reales, pero el paquete real elegido es chico.
  - `confirmada/propuesta-impresion` p6 (14,8%)
  - `confirmada/propuesta-pantalla` p6 (24,4%)

**Grupo 6 — continuación de tarjeta de escenario (`scenarios`), grupo
"Ahorro publicitario" + Supuestos, sin tabla mensual en la
continuación.** Patrón nuevo — el marcador de continuación de Bloque
Visual 2.2.3 abre una página nueva para un grupo de palancas corto.
  - `mayorista/proyeccion_90d-impresion` p6 (15,0%)
  - `mixto/proyeccion_90d-impresion` p6 (15,0%)

**Todas comparten la misma raíz:** contenido real, correcto, completo
— simplemente poco, sin nada más real para agregar. Ninguna tiene texto
cortado, solapado ni un bloque vacío con encabezado.
