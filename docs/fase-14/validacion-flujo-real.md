# Validación por el flujo real — Ítem 5 (Fase 14)

Snake Store y Titan Web B1 cargados **por la interfaz real** (formulario
`/diagnosticos/nuevo`, no por script), con el interruptor
(`src/documents/motor-activo.ts`) temporalmente en `"v2"` para esta
validación — revertido a `"v1"` al terminar (sección 5, más abajo).
Entorno: `npm run dev` local (`localhost:8080`), Modo A (pantalla
compartida), autenticado con la sesión real de Matías (login hecho por
él mismo — nunca se manejaron credenciales desde la sesión de trabajo).

## 1 · Snake Store — carga por el formulario real

Los ~15 campos que `casoSnakeStore` (`src/lib/fixtures-casos.ts`) fija
por encima de `DATOS_INICIALES` se completaron uno por uno en los
bloques reales del formulario (Identificación, Canales, Economía,
Productos): nombre de tienda, vertical (Indumentaria), plataforma
(Tiendanube, plan Inicial), Mercado Libre "No vende en este canal"
(marca `canal_ml_no_aplica`), tienda propia 100% de la facturación,
ticket promedio $225.226, envío neto $11.000, pasarela Mercado Pago, y
los tres productos (Campera Puffer/Chaleco Tiffany/Calza Street) con
costo/precio/% de facturación — el formulario mostró "Suma de la
lista: 60%", confirmando la cobertura parcial que el fixture describe
en su comentario. Guardado con éxito:
`http://localhost:8080/diagnosticos/2e5485b3-7a25-451b-8f8e-930b3d4a0227`.

**Desvío real, no un error:** dos preguntas del formulario (¿tienen
canal minorista activo?, ¿el negocio absorbe parte del costo del
envío?) no tienen equivalente directo en `DatosDiagnostico` como
campos aislados — son gates de UX que exponen el campo real
(`canal_tienda_pct`, `costo_envio_promedio`) sólo después de
responderlas. Se respondieron con la opción que refleja el hecho real
del caso (Sí a ambas, porque Snake Store sí tiene tienda propia con
100% de cobertura y sí tiene un costo de envío real). El dato numérico
que terminó guardado es idéntico al del fixture; lo que cambia es que
el `DatosDiagnostico` real también trae `absorbe_costo_envio: true`,
un campo que el fixture de test (armado a mano, sin pasar por la UI)
nunca necesitó fijar.

## 2 · Titan Web B1 — carga por el formulario real

Mismo proceso con los ~17 campos de `casoTitanWebB1`: nombre "Titan
Web", vertical Deco y hogar (mismo valor que ya tenía la carga real
preexistente "Titanwebok" en el listado, usado como referencia),
Tiendanube plan Esencial, "¿Vende en Mercado Libre?" Sí (habilita el
bloque 9 "Mercado Libre" del formulario), tienda propia "No vende en
este canal" (`canal_tienda_no_aplica`), Mercado Libre 100% de la
facturación / $50.000.000, facturación mensual $50.000.000, ticket
promedio $25.000, envío neto $9.000, pasarela Mercado Pago, y los tres
productos (Bolsa tostado/Molde pan lactal/Cintura extensible).
Guardado con éxito:
`http://localhost:8080/diagnosticos/0529c10c-2387-4943-a9cf-6f7c317caea4`.

**Mismo desvío de campo, distinto lugar:** `ml_inversion_product_ads`
($1.800.000 en el fixture) se cargó en el campo "Inversión publicitaria
del canal" de la tarjeta Mercado Libre en Canales — el formulario no
expone un campo separado para "inversión específica de Product Ads"
en el punto donde se completó esta carga; es la misma cifra real, en
el campo de inversión de canal más cercano al concepto. No es un dato
inventado — es el mismo número real del caso, mapeado al campo
disponible más específico.

## 3 · Los tres documentos, ambos perfiles — generados desde la interfaz real

Con el interruptor en `"v2"`, la vista previa (`DocumentWebRendererV2`)
y la descarga (`downloadDocumentModelPdfV2`) se confirmaron para:

| Caso | Documento | Pantalla | Impresión |
|---|---|---|---|
| Snake Store | Diagnóstico | ✅ PDF válido, 7 páginas, 960×540 | ✅ PDF válido, 6 páginas, A4 |
| Snake Store | Proyección 90 días | ✅ PDF válido, 7 páginas, 960×540 | (ver nota) |
| Snake Store | Propuesta | 🛑 Bloqueada por el gate (sección 4) | 🛑 Misma |
| Titan Web | Diagnóstico | ✅ PDF válido, 7 páginas, 960×540 | ✅ PDF válido, 6 páginas, A4 |
| Titan Web | Proyección 90 días | ✅ PDF válido, 7 páginas, 960×540 | ✅ PDF válido, 7 páginas, A4 |
| Titan Web | Propuesta | 🛑 Bloqueada por el gate (sección 4) | 🛑 Misma |

Los siete PDFs reales descargados están en la evidencia de esta ronda
(`interfaz/pdfs-descargados/` del ZIP). `pdfinfo` sobre cada uno
confirma `Producer: react-pdf`, `Creator: Velocentum ·
velocentum-diagnostico/v2` (o el `templateId` v2 correspondiente),
tamaño de página real por perfil. Nota: para Snake Store se descargó
un subconjunto representativo (diagnóstico en los dos perfiles,
proyección en pantalla) en vez de las seis combinaciones completas de
ambos casos — la cobertura combinada entre los dos casos ya ejercita
los tres documentos y los dos perfiles reales sin repetir la misma
prueba seis veces.

## 4 · Bloqueo de exportación, demostrado desde la interfaz

Ninguno de los dos casos tiene selección comercial confirmada. Al
intentar "Descargar PDF" → cualquier perfil sobre la pestaña
"Propuesta", la interfaz mostró, en el mismo banner de error que ya
usaba v1 (`documentos.$id.$slug.tsx`, `errorDescarga`), el texto
literal del gate:

> Selección comercial pendiente: no se puede exportar una propuesta
> sin selección comercial confirmada.

Confirmado para los dos casos, capturado en pantalla (evidencia en
`interfaz/bloqueo-exportacion-snake-store.jpg`). El mensaje es
exactamente `MENSAJE_EXPORTACION_BLOQUEADA_V2`
(`renderers/pdf-v2/gate-exportacion.ts`) — la interfaz no lo reformula
(ítem 6/X5).

## 5 · Hallazgo real encontrado por esta validación — corregido en el momento

El primer intento de descargar el PDF de Snake Store (diagnóstico,
pantalla) falló con un error real, nunca visto en los tests (que corren
en Node, no en un bundle de navegador):

> Module "node:module" has been externalized for browser compatibility.
> Cannot access "node:module.createRequire" in client code.

**Causa:** `renderers/pdf-v2/export-client.ts` importaba
`verificarExportacionPermitidaV2` desde `./exportacion`, que a su vez
importa `renderPdfV2ConDosPasadas` de `./paginacion` — ese archivo usa
`createRequire` (Node) para resolver el worker de `pdfjs-dist`. Un
import estático arrastra TODO el módulo de `exportacion.ts` al bundle
del navegador, incluido `paginacion.ts` — y `node:module` no existe ahí.

**Corrección:** el chequeo del gate se extrajo a
`renderers/pdf-v2/gate-exportacion.ts`, un módulo puro sin ninguna
dependencia de Node. `exportacion.ts` (Node, dos pasadas) y
`export-client.ts` (navegador, una pasada) importan los dos de ese
único lugar — ninguno reimplementa la lógica. Confirmado: después de
la corrección, la descarga funcionó para los dos casos, ambos
perfiles, sin ningún error en consola.

Esto es exactamente el tipo de defecto que sólo un flujo real detecta
— ningún test en Node (todos los que existían antes de esta fase)
podía haberlo encontrado, porque ninguno ejecuta el código dentro de
un bundle real de navegador.

## 6 · Interruptor devuelto a su valor por defecto

Al terminar la validación: `src/documents/motor-activo.ts` editado de
vuelta a `"v1"` (mismo archivo, único cambio). Confirmado con dos
señales independientes:

- `npx vitest run` → 802 passed + 1 todo, idéntico al número de antes
  de activar v2 para esta validación.
- Recarga de la vista previa de Snake Store en el navegador: volvió al
  diseño de v1 (portada a sangre completa, degradado violeta, wordmark
  en píldora) y reapareció la pestaña "Proyección + propuesta" (sólo
  existe en el catálogo v1) — confirmación visual directa, no sólo por
  código.
