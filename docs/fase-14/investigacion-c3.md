# Investigación C-3 (Fase 14.1) — sin implementar, sólo opciones con costo

Instrucción explícita del prompt de Fase 14.1: investigar C-3 sin
implementarlo, reportar opciones reales con su costo, no tomar una
decisión. Este documento es esa investigación. **Nada de lo que
describe acá está aplicado al código.**

## 0 · Lo que ya se confirmó (Fase 14, ítem 5 + este mismo build)

- El build de producción de esta app apunta a **Cloudflare Workers**:
  `npm run build` genera `.output/server/wrangler.json` y usa el preset
  `nitro` `cloudflare-module` (`@lovable.dev/vite-tanstack-config`,
  `LOVABLE_NITRO_PRESETS = ["cloudflare-module", "lovable-fetch-bundle"]`,
  `defaultPreset: "cloudflare-module"`). No hay ningún backend Node
  alternativo visible en el repo.
- Ya existe un precedente exacto de este mismo problema, resuelto:
  `src/documents/theme/fuentes/registrar-fuentes.ts` documenta,
  textualmente, que "el pipeline de fontkit que usa `@react-pdf/renderer`
  para leer un archivo por ruta (`fontkit.open`/`openSync`) no está
  disponible en el entorno de despliegue serverless/edge de este
  proyecto" — y lo resolvió embebiendo las fuentes como data URI en
  base64 en vez de leerlas por ruta de archivo. Es la confirmación, en
  la propia documentación del proyecto (no una suposición mía), de que
  el entorno de despliegue real no tiene filesystem utilizable en
  runtime.
- **Ni v1 ni v2 generan PDF del lado del servidor hoy.** Grep completo
  de `src/routes/` y `src/lib/*.functions.ts`: cero referencias a
  `@react-pdf/renderer`, `renderToBuffer` o `pdf().toBlob()` fuera de
  los `renderers/pdf*/` (que sólo se importan desde componentes de
  cliente). La descarga de PDF, en ambos motores, siempre corrió en el
  navegador (`pdf(...).toBlob()`). C-3 no es "mover algo que ya
  funciona en el servidor a otro lugar" — es hacer que la generación
  de PDF funcione en el servidor por primera vez en este proyecto.

## 1 · ¿El pipeline de dos pasadas necesita el filesystem, o se puede resolver embebiendo el recurso?

**No necesita el filesystem en sí — la dependencia real es un detalle
de implementación evitable, con el mismo patrón que ya resolvió el
problema de fuentes.**

Leí el código fuente de `pdfjs-dist` 6.2.108
(`node_modules/pdfjs-dist/legacy/build/pdf.mjs`, clase `PDFWorker`):

- En Node, `pdfjs` **ya corre sin un Worker de verdad** — el bloque
  estático de `PDFWorker` detecta `isNodeJS` y fuerza
  `#isWorkerDisabled = true` de entrada. Nunca hubo multi-threading
  real acá; siempre fue un "fake worker" en el mismo proceso.
- El fake worker (`_setupFakeWorkerGlobal`) hace, en este orden: (1) si
  `globalThis.pdfjsWorker.WorkerMessageHandler` ya existe, lo usa
  directo — **sin tocar el filesystem, sin `import()` dinámico**; (2)
  si no, hace `await import(this.workerSrc)` con lo que sea que tenga
  `GlobalWorkerOptions.workerSrc`.
- Hoy, `paginacion.ts` línea 47-48 fija ese `workerSrc` con
  `require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")` —
  `createRequire`, Node puro, resuelve una ruta absoluta de archivo en
  disco. Es exactamente el mismo patrón que rompió `export-client.ts`
  en el navegador (ítem 5 de Fase 14: "Module 'node:module' has been
  externalized") y, con altísima probabilidad, rompería igual en un
  bundle de Cloudflare Workers — un `import()` con una ruta de string
  calculada en runtime no es algo que un bundler pueda incluir
  estáticamente, y Workers no tiene filesystem para resolverla aunque
  el import fuera estático.

**La opción real:** importar el módulo del worker de forma ESTÁTICA
(`import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs"`)
y asignarlo una vez a `globalThis.pdfjsWorker` antes de la primera
llamada a `getDocument`. Con eso, pdfjs entra por la rama (1) de
arriba — nunca intenta resolver ni importar nada por ruta, en ningún
entorno. Es el patrón estándar y documentado para usar `pdfjs-dist` en
entornos empaquetados/edge (Next.js edge runtime, Vite SSR, etc.), y
el mismo principio que ya aplicó `registrar-fuentes.ts` para las
fuentes: dejar de leer un recurso por ruta, embeberlo/importarlo en el
propio bundle.

**Costo:** bajo en líneas de código (un import estático + una
asignación, en `paginacion.ts`), pero toca un archivo que las rondas
anteriores mantuvieron deliberadamente fuera del diff (`paginacion.ts`
es "el motor" en el sentido de Fase 14 — aunque este cambio es de
CABLEADO del worker, no de lógica de medición/paginación). Exige
verificación de regresión estricta: generar los 54 PDFs antes/después
y confirmar por hash que la salida no cambia un solo byte (mismo
criterio que Y2 ya exige para la descarga desde la interfaz). Esto por
sí solo NO resuelve C-3 — resuelve el obstáculo específico de
`require.resolve`, que es un prerrequisito común a las tres vías de
abajo (server con Workers, cliente, o un servicio externo).

## 2 · Si la app corre sobre Cloudflare Workers, ¿qué alternativas hay para generar el PDF con dos pasadas ahí?

Con el problema de la sección 1 resuelto, quedan preguntas reales que
**no puedo verificar sin desplegar** (explícitamente prohibido en esta
ronda):

- **Límites de CPU/tiempo de ejecución de Workers.** Generar dos
  pasadas de un documento de 7-9 páginas localmente tarda del orden de
  cientos de milisegundos a ~1-2 segundos por documento (medido de
  forma indirecta: el barrido de 54 documentos completo, Node, corrió
  en ~7-8 segundos totales en esta sesión). Es plausible que entre
  dentro de un plan de Workers pago con más CPU time, pero no tengo
  visibilidad de qué plan/límite tiene el despliegue real de este
  proyecto (gestionado por Lovable Cloud) — sólo lo confirmaría un
  smoke test real contra un preview deploy.
- **Ramas de código de `pdfjs-dist` específicas de Node
  (`NodeCanvasFactory`, `NodeFilterFactory`, `PDFNodeStream`), todas
  detrás de la misma bandera `isNodeJS`.** Como Cloudflare Workers con
  `nodejs_compat` expone un global `process` (shim), es probable que
  `isNodeJS` evalúe `true` también ahí, empujando a `pdfjs` por rutas
  pensadas para Node real, no para el compat shim de Workers. Mitigado
  parcialmente porque `paginacion.ts` sólo usa `getDocument(...).getPage(...).getTextContent()`
  — nunca rasteriza a un canvas — así que `NodeCanvasFactory` en
  particular no debería invocarse en este uso puntual, pero es una
  inferencia de lectura de código, no una verificación en el runtime
  real.
- **`@react-pdf/renderer`/pdfkit en sí** (la escritura del PDF, no la
  medición): nunca se ejecutó server-side en este proyecto (sección 0).
  Es razonable esperar que funcione — es una librería de escritura de
  PDF basada en pdfkit, sin dependencia de DOM/canvas para documentos
  de sólo texto como estos — pero "razonable esperar" no es lo mismo
  que "confirmado".

**Alternativas reales, con costo:**

1. **Arreglar el worker (sección 1) y probarlo directo en Workers.**
   Costo: bajo en código, pero requiere un despliegue de verificación
   (preview, no producción) para confirmar los dos puntos de arriba —
   algo que esta ronda tiene prohibido hacer sin autorización explícita.
   Si funciona, es la opción más simple: una función de servidor
   (`createServerFn`, mismo patrón que `paquetes.functions.ts`) que
   devuelve un `Response` binario (`TResponse extends Response` ya
   soportado por `@tanstack/start-client-core` 1.168.32, confirmado
   leyendo su `.d.ts` — no hay que inventar nada para esa parte;
   autenticación reutiliza `requireSupabaseAuth`, también sin invención).
2. **Delegar la generación a un servicio externo con Node real**
   (una función serverless en Vercel/Fly/Render/Cloudflare Containers,
   o un microservicio propio), invocado por HTTP desde el `createServerFn`
   de Workers. Costo: alto — nueva pieza de infraestructura para
   desplegar, mantener, pagar y asegurar (autenticación entre
   servicios, manejo de fallas de red, otro punto de observabilidad).
   Desproporcionado a menos que la opción 1 falle en la práctica.
3. **Cloudflare Containers** (contenedores reales invocables desde un
   Worker, si el plan los tiene habilitados): mismo costo que la
   opción 2 en esencia (nueva pieza a mantener), pero integrada al
   mismo proveedor. Producto más nuevo de Cloudflare, con su propio
   conjunto de límites que tampoco pude verificar sin desplegar.

## 3 · ¿Existe una forma de hacerlo sin servidor, del lado del cliente?

**Sí — y es, en este momento, la opción con menos incógnitas reales.**

El pipeline de dos pasadas usa dos cosas Node-only: `renderToBuffer`
(`@react-pdf/renderer`, tira una excepción real en el bundle de
navegador — confirmado, es el mismo motivo por el que
`export-client.ts` usa `pdf(...).toBlob()` en su lugar) y
`Buffer`/`createRequire` (secciones de arriba). Ambas tienen
equivalente ya PROBADO en el navegador dentro de este mismo proyecto:

- `renderToBuffer(...)` → `await pdf(...).toBlob()` seguido de
  `new Uint8Array(await blob.arrayBuffer())` — el mismo patrón que
  `export-client.ts` (v1 y v2) ya usa hoy para la pasada única.
- `Buffer.from(...)` → innecesario si se trabaja directo con
  `Uint8Array`/`ArrayBuffer` (que es lo que `getDocument({data: ...})`
  de `pdfjs` ya espera, y lo que usan mis propios scripts de medición
  de esta sesión).
- El fix del worker de la sección 1 (import estático +
  `globalThis.pdfjsWorker`) es el MISMO fix que hace falta para el
  navegador — no es trabajo adicional, es el mismo cambio sirviendo a
  las dos rutas.

**Costo:** el más bajo de las tres vías, porque nunca toca la pregunta
de arquitectura de servidor (nada de `createServerFn`, nada de
autenticación nueva, nada de límites de Workers, nada que verificar
con un despliegue). El costo real es de PERFORMANCE en el navegador
del usuario: la descarga hace el trabajo de renderizar el PDF DOS
veces (una para medir, otra para el documento final) en vez de una,
así que el botón "Descargar PDF" tarda más en responder — un costo de
experiencia medible y probable de acotar (mostrar un estado de carga
más largo), no un riesgo de arquitectura. No reduce el tamaño del
bundle del cliente (pdfjs ya viaja al navegador para la medición), pero
eso ya es cierto hoy indirectamente para otras partes del proyecto y
no es nuevo de esta opción.

## 4 · Resumen para la decisión (no es una recomendación — la sección 4.1 del prompt original de Fase 14 ya estableció esa distinción, ídem acá)

| Opción | Toca servidor/Workers | Necesita desplegar para validar | Costo relativo |
|---|---|---|---|
| 1. Servidor (Workers) | Sí | Sí (bloqueante para confirmar viabilidad) | Medio — bajo en código, alto en incertidumbre no resoluble sin desplegar |
| 2. Servicio externo (Node real) | Indirectamente (nuevo servicio) | No para la generación en sí, sí para integrarlo | Alto — nueva infraestructura a mantener |
| 3. Cliente (navegador) | No | No | Bajo — mismo patrón ya probado en este proyecto, costo es de UX (más lento), no de arquitectura |

El fix de la sección 1 (worker de `pdfjs` embebido estáticamente) es
un prerrequisito COMÚN a las opciones 1 y 3 — no es exclusivo de
ninguna. Cualquiera sea la vía elegida, ese cambio puntual en
`paginacion.ts` es el primer paso técnico, y necesita su propia
verificación de regresión (hash idéntico antes/después) antes de
construir cualquier otra cosa encima.
