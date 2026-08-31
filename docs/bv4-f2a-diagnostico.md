# BV4 · F2a etapa 0 — Diagnóstico del panel de selección comercial existente

**Sin tocar código.** Documento de la parada de reporte de la etapa 0 del
prompt `docs/prompts/bv4-f2a-panel-comercial-prompt.md`.

- Rama: `feat/bv4-rebranding`, base `043ba08` (F1 aprobada), árbol limpio al
  iniciar.
- Contrato normativo: `docs/bv4-contrato-maestro.md`.
- Especificación funcional: `f2a-panel-comercial-reconciliado.md` (Q1–Q10
  cerradas), aportado por Matías; se guarda en
  `docs/funcional/f2a-panel-comercial-reconciliado.md` para que la auditoría
  externa tenga la entrada vigente dentro del repo.
- Línea de base verificada antes de escribir nada: `npm test` → **72 archivos,
  903 pruebas + 1 todo, todo en verde**; `npm run typecheck` → **limpio**.

---

## 0 · Resumen ejecutivo

E-23 (`docs/visual/auditoria-visual-2026-08-23.md:862`) es correcto: **existe
un panel de confirmación comercial que persiste en base y alimenta el candado
de exportación de punta a punta**. Pero la verificación línea por línea muestra
que **ese panel resuelve un problema distinto del que pide F2a**:

| | Panel existente (Fase 13, decisión comercial 7) | Panel que pide F2a |
|---|---|---|
| Unidad | **Nivel** de una escalera acumulativa (IMPULSO/TRACCIÓN/ESCALA) | **Línea facturable** (10 líneas fijas) |
| Precio | Uno **por nivel**, manual | **Unitario por línea** × cantidad |
| Catálogo | 6 servicios v1 | 9 servicios / 10 líneas v2 con IDs estables |
| Recurrencia | No existe | Obligatoria por línea, con dos subtotales |
| Moneda | Fija `"ARS"` en el tipo | `"ARS" \| "USD"` por propuesta |
| Fiscal | No existe | Explícita y confirmable, candado de exportación |
| Agregados | No existen | Binarios y por nivel con alcance |

Lo que **sí** se reutiliza y no hay que reconstruir: el riel de confirmación
manual explícita, la persistencia en `diagnostico.propuesta` con sobre y
lectura tolerante, la traducción al contrato documental, el bloque
`commercial-offer` del motor v2, el candado de exportación, y la generación
de la matriz de PDFs con doble corrida.

Conclusión de alcance: **falta más de lo que "revisar y extender" sugiere**.
No es reescribir desde cero — los rieles existen y son buenos —, pero el
modelo de datos comercial, el catálogo v2, la moneda, la configuración
fiscal, la recurrencia, los totales y los agregados son **construcción
nueva**, no ajuste. Nueve de los diez puntos de la etapa 0 están en cero o
casi. El prompt pide que, si el diagnóstico muestra que falta mucho más de lo
previsto, el alcance se reajuste con Matías: **queda planteado en la
sección 5**.

Además hay **dos frenos formales** (sección 6) que necesitan decisión humana
antes de avanzar: un insumo faltante que bloquea la etapa 5, y una
contradicción de forma entre el sobre que pide la etapa 3 y el sobre que la
columna ya usa.

---

## 1 · Dónde vive el panel hoy

### 1.1 · Cadena completa, de la ruta a la base

| Capa | Archivo | Referencia |
|---|---|---|
| Ruta (contenedor) | `src/routes/_authenticated/diagnosticos.$id.tsx` | `:269` monta `<SeccionPaquetes>`, `:293` la define |
| Estado + confirmación | mismo archivo | `:293-357` (`SeccionPaquetes`: genera escalera, guarda, alterna vista/edición) |
| Panel (UI) | `src/components/confirmacion-paquetes.tsx` | `:44` `ConfirmacionPaquetes` |
| Generador de la escalera | `src/lib/paquetes.ts` | `:212` `generarEscaleraPaquetes` |
| Catálogo de servicios v1 | `src/lib/propuesta.ts` | `:21` `SERVICIOS` (los seis cerrados) |
| Mapeo hallazgo→servicio | `src/lib/propuesta.ts` | `mapearHallazgos`, capa `"servicio"` |
| Persistencia (server fn) | `src/lib/paquetes.functions.ts` | `:13` `confirmarPaquetes` |
| Sobre de la columna JSON | `src/lib/contenido-propuesta.ts` | `:34` `separarContenidoGuardado`, `:51` `combinarContenidoGuardado` |
| Lectura tolerante | `src/lib/paquetes.ts` | `:243` `normalizarEscaleraConfirmada` |
| Traducción al contrato documental | `src/documents/domain/build-context.ts` | `:570` `comercialDesdeEscalera` |
| Contrato documental | `src/documents/domain/types.ts` | `:303` `ServicioNivelComercial`, `:314` `NivelComercial`, `:331` `SeleccionComercial` |
| Bloque del documento v2 | `src/documents/templates/velocentum-v2/blocks.ts` | `:398` `buildCommercialOfferV2` |
| Tipo del bloque v2 | `src/documents/templates/velocentum-v2/types.ts` | `:126` `NivelComercialV2`, `:197` `commercial-offer` |
| Candado de exportación | `src/documents/renderers/pdf-v2/gate-exportacion.ts` | `:22` mensaje, `:47` `verificarExportacionPermitidaV2` |
| Descarga desde la interfaz | `src/documents/renderers/pdf-v2/export-client.ts` | `:41` `renderDocumentModelV2ToBlob` (llama al gate en `:45`) |
| Selector de perfil en la UI | `src/routes/_authenticated/documentos.$id.$slug.tsx` | `:34` `ETIQUETA_PERFIL` (pantalla 16:9 / impresión A4), `:138` `descargarPdf` |

### 1.2 · Tipos vigentes (forma exacta)

`src/lib/paquetes.ts` — modelo persistido:

```ts
// :41
type UnidadServicio = "campañas_activas" | "piezas_por_mes" | "campañas" | "alcance_descrito";

// :73
type AlcanceServicioNivel = {
  servicio: string;            // nombre libre, tomado del catálogo v1 de seis
  unidad: UnidadServicio;
  cantidad: number | null;     // null sólo si unidad === "alcance_descrito"
  descripcion: string | null;  // sólo para "alcance_descrito"
  hallazgoIds: string[];       // justificación, nunca vacío
  propuestoPorSistema: true;
};

// :86
type NivelPaquete = {
  id: "impulso" | "traccion" | "escala";
  nombre: string;              // configurable
  servicios: AlcanceServicioNivel[];
  precio: number | null;       // UN precio por NIVEL, manual, null al generar
};

// :94 / :106
type EscaleraPaquetes          = { niveles: NivelPaquete[]; confirmado: false };
type EscaleraPaquetesConfirmada = { niveles: NivelPaquete[]; confirmado: true };
```

`src/documents/domain/types.ts` — contrato documental:

```ts
// :105
type MonedaDocumento = "ARS";           // ← literal de un solo valor

// :331
type SeleccionComercial = { niveles: NivelComercial[] };
```

### 1.3 · Cómo se persiste hoy la selección — forma exacta del JSON

Columna: **`diagnostico.propuesta`**, tipo `jsonb`, nullable.
Declarada en `supabase/migrations/20260818225831_32093743-7da7-4e6a-a44f-06e0efeeeef7.sql:1`
(`ALTER TABLE public.diagnostico ADD COLUMN IF NOT EXISTS propuesta jsonb;`) y
tipada en `src/integrations/supabase/types.ts:53` como `propuesta: Json | null`.

La columna **ya lleva un sobre de dos claves** (`src/lib/contenido-propuesta.ts:22`):

```jsonc
{
  "propuesta": { /* PropuestaGenerada: la propuesta redactada por el modelo */ },
  "paquetes":  {
    "confirmado": true,
    "niveles": [
      {
        "id": "impulso",
        "nombre": "IMPULSO",
        "servicios": [
          {
            "servicio": "Meta Ads",
            "unidad": "campañas_activas",
            "cantidad": 1,
            "descripcion": null,
            "hallazgoIds": ["..."],
            "propuestoPorSistema": true
          }
        ],
        "precio": 250000
      }
    ]
  }
}
```

Y ya tiene **lectura tolerante de una forma anterior**
(`contenido-propuesta.ts:45-47`): si el objeto guardado no tiene ninguna de las
dos claves, se interpreta como la propuesta redactada suelta, sin sobre —
exactamente el mecanismo que la etapa 3 vuelve a pedir, un nivel más adentro.

La escritura nunca pisa la otra mitad: `confirmarPaquetes`
(`paquetes.functions.ts:39-40`) lee el valor actual, separa, y recombina antes
de escribir.

### 1.4 · Cómo llega la selección al PDF

`from-diagnostico.ts:120-130` lee la columna → `normalizarEscaleraConfirmada`
→ `buildDocumentContext` → `comercialDesdeEscalera` (`build-context.ts:570`) →
`context.comercial` → `buildCommercialOfferV2` (`blocks.ts:398`) → bloque
`commercial-offer` → `verificarExportacionPermitidaV2` deja o no exportar.

**La selección vive en base, no en estado de React** — condición del chequeo
SHA-256 interfaz = pipeline. Ya se cumple.

Nota de estado: el comentario de cabecera de `confirmacion-paquetes.tsx:9-13`
("Sólo estado local en memoria… la persistencia requiere una columna nueva")
es **deuda documental desactualizada**: la persistencia se resolvió después,
en la decisión 9, sin migración. Corregirlo es parte de F2a.

---

## 2 · Q1–Q10, punto por punto: qué cumple y qué falta

Los diez puntos son los de la etapa 0 del prompt. `%` es cobertura real
verificada contra código, no estimación.

### 2.1 · Catálogo v2 versionado — **falta (0 %)**

No existe. Sólo el catálogo cerrado de seis de `src/lib/propuesta.ts:21`, que
por contrato **no se modifica ni se elimina**. El patrón de versionado que hay
que imitar sí existe y está probado: `src/documents/templates/velocentum-v1/`
junto a `velocentum-v2/`, con `motor-activo.ts` como único interruptor.

### 2.2 · 9 servicios / 10 líneas con IDs estables — **falta (0 %)**

Hoy la unidad de identidad es el **nombre del servicio como string libre**
(`AlcanceServicioNivel.servicio`, `paquetes.ts:74`), no un ID estable. Los IDs
de `paquetes.ts:62` (`impulso`/`traccion`/`escala`) identifican **niveles**, no
líneas facturables. Las diez líneas del reconciliado §b no existen en ningún
lado del repo.

### 2.3 · Mapeo v1→v2 con el grupo de contenido [Q1] — **falta (0 %)**

`serviciosCanonicosDe` (`paquetes.ts:121`) traduce el texto del hallazgo a uno
o más de los seis nombres v1. No hay tabla de traducción a v2. En particular,
"Planificación y creación de contenido" es hoy **un solo servicio con unidad
`piezas_por_mes`** (`paquetes.ts:48`) y debe pasar a sugerir **como grupo** tres
líneas desmarcables (`planificacion_contenido` + `contenido_audiovisual` +
`contenido_estatico`).

### 2.4 · Sin activadores automáticos para influencer y desarrollo custom [Q2] — **se cumple por ausencia**

Ningún hallazgo mapea a `influencer_marketing` ni a `desarrollo_web_custom`
porque esas líneas no existen. Verificado: `mapearHallazgos`
(`src/lib/propuesta.ts`) sólo emite los seis nombres canónicos, y
`serviciosJustificados` (`paquetes.ts:127`) descarta todo lo que no esté en
`SERVICIOS`. **Riesgo de la etapa 1:** al crear el catálogo v2 hay que
mantener explícitamente estas dos líneas fuera de toda regla de sugerencia, y
cubrirlo con una prueba.

### 2.5 · Precio unitario × cantidad [Q3] — **falta (0 %)**

Hoy hay **un precio por nivel**, manual (`NivelPaquete.precio`,
`paquetes.ts:91`; carga en `confirmacion-paquetes.tsx:196-211`). No hay precio
por línea, no hay precio unitario, y la `cantidad` que ya existe
(`paquetes.ts:77`, editable en `confirmacion-paquetes.tsx:152-163`) **no
multiplica nada**: es sólo alcance descriptivo. El precio de nivel queda como
dato legado legible (reconciliado §d, último bullet).

### 2.6 · Moneda ARS/USD sin hardcodeo [Q4] — **falta (0 %), y el hardcodeo es de tipo**

`MonedaDocumento = "ARS"` (`types.ts:105`) es un literal de un solo valor;
`build-context.ts:750` lo fija. Además está hardcodeado en **cuatro
formateadores**, uno por cadena de render:

| Archivo | Línea | Qué hace |
|---|---|---|
| `src/lib/format.ts` | `:2-9` | `formatARS`, `currency: "ARS"` — lo usa la interfaz y `domain/resumen-comercial.ts` |
| `src/documents/renderers/web/format.ts` | `:5-9` | `currency: "ARS"` (web v1) |
| `src/documents/renderers/pdf/format.ts` | `:12` | `` `$ ${integer.format(...)}` `` (PDF v1) |
| `src/documents/semantica-v2/formato.ts` | `:19` | `` `$ ${ENTERO.format(...)}` `` (cadena v2) |

**Punto de atención de invariante:** tres de esos cuatro están en la cadena v1,
que el prompt manda dejar intacta. La ampliación es **aditiva**: `"ARS" |
"USD"` con `"ARS"` como valor por defecto, y los formateadores pasan a recibir
la moneda con `"ARS"` por defecto. La salida v1 debe quedar **byte a byte
idéntica**; se verifica con la matriz de PDFs y la doble corrida SHA de la
etapa 6, además de las 903 pruebas actuales.

### 2.7 · Configuración fiscal explícita y confirmable [Q9] — **falta (0 %)**

No existe ningún concepto fiscal en el modelo comercial. Barrido de
`impuesto|iva|fiscal` en `src/`: los únicos aciertos son
`mayorista_impuestos_cobranza` (`src/lib/diagnostico-form.ts:312`), un costo
del diagnóstico mayorista, **sin ninguna relación** con la fiscalidad de la
propuesta.

Lo que **sí** existe es el candado al que hay que sumarse, no duplicar:
`verificarExportacionPermitidaV2` (`gate-exportacion.ts:47`) bloquea la
exportación cuando el bloque `commercial-offer` viene `pendiente: true`. Es
**el único lugar** que declara la lógica del gate, y tanto la exportación de
Node (`exportacion.ts`) como la descarga del navegador (`export-client.ts:45`)
lo importan. La confirmación fiscal se agrega ahí.

### 2.8 · Totales calculados no editables [Q6] — **falta (0 %), sin conflicto**

No hay totales de ninguna clase hoy: ni por línea, ni por grupo, ni general.
El único importe es el precio de nivel, que es **entrada manual** y seguirá
siéndolo (Q6 prohíbe editar totales *calculados*, no cargar precios). No hay
ningún override ni redondeo que desarmar: se construye limpio.

### 2.9 · Recurrencia mensual/única con dos subtotales [Q10] — **falta (0 %)**

No existe `recurrencia` ni `subtotal` en el repo. El contrato documental
declara `cliente.periodo: "mensual"` fijo (`types.ts:364`) — es el período del
diagnóstico, no la recurrencia de una línea, pero conviene no confundirlos al
nombrar los campos nuevos. La prohibición del total combinado hay que hacerla
**no representable en el tipo**, según pide la etapa 2.

### 2.10 · Agregados por nivel con alcance [Q7] — **falta (0 %)**

Ningún agregado de la matriz del reconciliado §f existe: ni retargeting, ni
tracking de plataforma, ni tracking web, ni email marketing, ni reportes, ni
CRO, ni popup. Barrido confirmado sobre `src/lib` y `src/documents`. La
palabra "agregados" en el repo pertenece a `agregados_carrito` del funnel
(`src/lib/funnel.ts:35`), sin relación.

### 2.11 · Cierres parciales adicionales

- **[Q8] Tracción/Escala no preseleccionan Diseño web** — **se cumple por
  construcción.** `generarEscaleraPaquetes` (`paquetes.ts:212`) sólo reparte
  servicios **justificados por un hallazgo** (`serviciosJustificados`,
  `paquetes.ts:127`); el nivel nunca agrega un servicio por sí mismo, y la UI
  sólo permite agregar servicios ya justificados
  (`confirmacion-paquetes.tsx:100-110`). Hay que **preservar** esta propiedad
  al pasar a diez líneas visibles siempre: visible ≠ preseleccionada.
- **[Q8] `ruta` B2C/B2B/ambas** — no existe. Falta.
- **[§h] Semana 0** — **se cumple por ausencia y es fácil de blindar.** Barrido
  de `semana` en `src/documents` y `src/lib`: ningún concepto "Semana 0" en
  ninguna plantilla, contexto ni renderer. El modelo de propuesta no tiene
  dónde representarla; el invariante de la etapa 5 es una prueba de
  no-representabilidad, no un borrado.
- **Textos de los servicios** — `ServicioDocumento` (`types.ts:156`) tiene
  `alcance: string[]`, pero `build-context.ts:506` lo construye **siempre
  vacío** (`alcance: []`). Los entregables por servicio nunca se imprimieron.
  Ver el freno F-1.

### 2.12 · Tabla resumen

| # | Punto (Q) | Estado | Evidencia |
|---|---|---|---|
| 1 | Catálogo v2 versionado | ✗ falta | `src/lib/propuesta.ts:21` |
| 2 | 9 servicios / 10 líneas, IDs estables | ✗ falta | `src/lib/paquetes.ts:62,74` |
| 3 | Mapeo v1→v2, grupo de contenido [Q1] | ✗ falta | `src/lib/paquetes.ts:48,121` |
| 4 | Sin activadores automáticos [Q2] | ✓ por ausencia | `src/lib/paquetes.ts:127` |
| 5 | Precio unitario × cantidad [Q3] | ✗ falta | `src/lib/paquetes.ts:77,91` |
| 6 | Moneda ARS/USD sin hardcodeo [Q4] | ✗ falta | `types.ts:105` + 4 formateadores |
| 7 | Configuración fiscal confirmable [Q9] | ✗ falta | sin concepto; candado en `gate-exportacion.ts:47` |
| 8 | Totales calculados no editables [Q6] | ✗ falta | sin totales |
| 9 | Recurrencia + dos subtotales [Q10] | ✗ falta | sin concepto |
| 10 | Agregados por nivel con alcance [Q7] | ✗ falta | sin concepto |
| — | Diseño web sin precarga por nivel [Q8] | ✓ por construcción | `paquetes.ts:212`, `confirmacion-paquetes.tsx:100` |
| — | Ruta B2C/B2B/ambas [Q8] | ✗ falta | sin campo |
| — | Semana 0 fuera de propuesta [§h] | ✓ por ausencia | sin ocurrencias |
| — | Selección en base, no en React [§g] | ✓ cumple | `from-diagnostico.ts:120` |

---

## 3 · Viabilidad de la persistencia

Las tres preguntas de la etapa 0, respondidas contra el repo:

1. **¿Existe `diagnostico.propuesta`?** **Sí.**
   `supabase/migrations/20260818225831_…sql:1`.
2. **¿Es JSON?** **Sí, `jsonb` nullable.** Tipado como `Json | null` en
   `src/integrations/supabase/types.ts:53`.
3. **¿Admite el sobre versionado sin migración?** **Sí.** Es una columna JSONB
   sin restricción de esquema, ya usada con un sobre de dos claves y con
   lectura tolerante de la forma anterior. Sumar el sobre v2 es escribir más
   JSON en la misma columna: **cero migraciones**. El precedente exacto ya está
   documentado en `src/lib/contenido-propuesta.ts:1-18`.

**No se activa la cláusula de freno del punto 3.** La persistencia es viable.

Lo que **sí** requiere decisión es *dónde* dentro del JSON va el sobre: ver el
freno F-2.

---

## 4 · Qué se conserva y qué se reemplaza

### 4.1 · Se conserva intacto (no se toca)

- **Catálogo v1 de seis servicios** (`src/lib/propuesta.ts:21`) y todo
  `mapearHallazgos`: alimentan la salida v1, que debe seguir produciendo
  exactamente lo mismo.
- **Toda la cadena documental v1** (`templates/velocentum-v1/`,
  `renderers/pdf/`, `renderers/web/`) y sus pruebas.
- **`MOTOR_DOCUMENTAL_ACTIVO = "v1"`** (`src/documents/motor-activo.ts:19`) y
  **`TEMA_DOCUMENTAL_ACTIVO = "velocentum-light-v1"`**
  (`src/documents/theme/tema-activo.ts:29`) en sus valores actuales en todo
  commit.
- **El riel de confirmación manual explícita**: el par de tipos
  `EscaleraPaquetes` / `EscaleraPaquetesConfirmada` (`paquetes.ts:94,106`), que
  hace **imposible por tipo** devolver algo ya confirmado desde el generador.
  Es un patrón bueno y el modelo v2 lo repite.
- **El candado único de exportación** (`gate-exportacion.ts`): un solo lugar
  declara la lógica; la confirmación fiscal se **suma** ahí, no crea un
  segundo mecanismo.
- **La infraestructura de artefactos**: matriz de 54 PDFs
  (`generar-pdfs-bloque-3.test.ts:268`), doble corrida, y
  `scripts/empaquetar-artefactos.mjs` (worktree limpio obligatorio).
- **Los dos perfiles ya expuestos en la interfaz**: pantalla 16:9 e impresión
  A4 (`documentos.$id.$slug.tsx:34`). No hay que construirlos.

### 4.2 · Se extiende de forma aditiva (lectura tolerante del legado)

- **`separarContenidoGuardado` / `combinarContenidoGuardado`**
  (`contenido-propuesta.ts:34,51`): reconocen una tercera forma, sin perder las
  dos que ya reconocen.
- **`normalizarEscaleraConfirmada`** (`paquetes.ts:243`): sigue devolviendo la
  escalera legada cuando lo guardado es la forma vieja, y devuelve el sobre v2
  cuando es la nueva. **Ninguna selección ya guardada deja de leerse.**
- **`comercialDesdeEscalera`** (`build-context.ts:570`): gana un camino v2 sin
  perder el v1.
- **`MonedaDocumento`** (`types.ts:105`): `"ARS"` → `"ARS" | "USD"`, con
  `"ARS"` por defecto en todo lo existente. Los cuatro formateadores reciben la
  moneda como parámetro opcional con default `"ARS"`.
- **`ServicioDocumento.alcance`** (`types.ts:159`): hoy siempre `[]`; pasa a
  llevar los entregables — **cuando existan los textos confirmados** (F-1).
- **`confirmarPaquetes`** (`paquetes.functions.ts:13`): acepta el sobre v2
  además de la escalera.

### 4.3 · Se agrega nuevo, al lado

Catálogo v2 (10 líneas, IDs estables), tabla de traducción v1→v2, modelo de
selección v2 (moneda, fiscal, líneas con recurrencia y ruta, agregados), motor
de totales por grupo, panel de las 10 líneas, y los invariantes de la suite
(total combinado no representable, Semana 0 no inyectable, sin activadores
automáticos para las dos líneas manuales).

### 4.4 · Se corrige

El comentario de cabecera de `src/components/confirmacion-paquetes.tsx:9-13`,
que afirma que la selección vive sólo en memoria. Es falso desde la decisión 9
y contradice `contenido-propuesta.ts`.

### 4.5 · Criterio de no romper lo guardado

Ninguna selección ya persistida cambia de forma en base. La migración de datos
es **perezosa y opcional**: un diagnóstico con escalera legada se sigue leyendo
y exportando igual; sólo al confirmar de nuevo desde el panel v2 se escribe el
sobre v2. Se cubre con una prueba explícita de lectura tolerante, pedida por la
etapa 2.

---

## 5 · Reajuste de alcance propuesto (decisión de Matías)

El prompt dice que F2a "no es construir: es revisar y extender". La
verificación matiza eso: **los rieles se revisan y extienden; el modelo
comercial se construye**. Nueve de los diez puntos están en cero. No cambia
la lista de etapas ni el gate, pero sí el peso relativo:

- Etapas **1, 2 y 3** (catálogo, modelo, persistencia) son la parte gruesa y
  concentran el riesgo de romper la cadena v1 (sobre todo el punto 2.6,
  moneda).
- Etapa **4** (panel) es reescritura del componente, no ajuste: el existente
  itera niveles, el nuevo itera diez líneas fijas.
- Etapa **5** está **bloqueada por F-1** hasta que lleguen los textos.
- Etapa **6** (QA, artefactos, gate) es la que menos cambia: la
  infraestructura está.

**Pregunta concreta:** ¿se ejecuta F2a completa como está prompteada, o se
parte el gate — etapas 1 a 4 + QA con propuesta sin textos de servicio, y la
etapa 5 cuando llegue `paso-1-panel-seleccion-comercial.md` §7? Recomiendo
**esperar los textos y ejecutar F2a completa**, porque el gate exige un PDF de
propuesta descargado y comparado por SHA, y una propuesta con diez servicios
marcados "pendiente" es un artefacto de auditoría pobre.

---

## 6 · Frenos y decisiones pendientes

### F-1 · BLOQUEANTE (etapa 5) · Faltan los textos verbatim de los 10 servicios

La etapa 5 exige: *"Los textos de los 10 servicios van **verbatim** del
reconciliado §7"*. **El reconciliado no tiene §7**: sus secciones son a–k más
la tabla Q1–Q10. Su cierre ("Qué se conserva intacto de la especificación
original") remite a *"§7 de `paso-1-panel-seleccion-comercial.md`"*, con sus
entregables, la nota al pie de contenido y las exclusiones de influencer y
diseño web.

Ese archivo **no está disponible**: no está en el repo, no está en
`~/Desktop/BV4_BRANDING_CONFIRMADO/docs/` (que contiene únicamente
`actualizacion-vinculante-rebranding.txt`, `bv4-contrato-maestro.md`,
`bv4-f1-foundation-prompt.md`, `bv4-f2a-panel-comercial-prompt.md`,
`f2a-panel-comercial-reconciliado.md`, `Plan_Maestro_Velocentum_2026.pdf`,
`rebranding-primera-entrega-v2.md`), y no aparece en ningún lado del Escritorio.
El contrato maestro §5 lo listaba como adjunto de F2a ("como referencia
histórica de lo confirmado") y no llegó.

Por el invariante *"Nada se inventa… Faltante = parada y reporte"*: **no se
redacta ni un texto de servicio**. Además hoy `ServicioDocumento.alcance` se
construye siempre vacío (`build-context.ts:506`), así que no hay un texto
anterior del cual partir.

**Qué necesito:** `paso-1-panel-seleccion-comercial.md` (o al menos su §7
completo, con los diez bloques, la nota al pie de contenido y las dos
exclusiones).

**Impacto:** bloquea sólo la etapa 5. Las etapas 1–4 y 6 pueden ejecutarse sin
esos textos.

### F-2 · DECISIÓN DE FORMA (etapa 3) · Dónde va el sobre versionado

La etapa 3 y el reconciliado §g piden el sobre en `diagnostico.propuesta`:

```jsonc
{ "version": 2, "moneda": "...", "fiscal": {...}, "seleccion": {...} }
```

Pero **la raíz de esa columna ya está ocupada** por el sobre de la decisión 9
(`contenido-propuesta.ts:22`): `{ "propuesta": …, "paquetes": … }`. Escribir el
sobre v2 en la raíz **destruiría la propuesta redactada por el modelo** que
convive ahí, y rompería `separarContenidoGuardado`, que decide la forma por la
presencia de esas dos claves.

No es una contradicción del contrato: el reconciliado se redactó describiendo
la columna, no el sobre interno. Pero la letra de la etapa 3 no se puede
ejecutar tal cual.

**Opciones:**

- **(a) Recomendada — anidar en `paquetes`:** el sobre v2 pasa a ser el
  contenido de la clave `paquetes`, distinguible de la escalera legada por
  `version === 2` (la legada tiene `confirmado: true` y no tiene `version`).
  Cero cambios en la raíz, cero riesgo para la propuesta redactada,
  `normalizarEscaleraConfirmada` distingue las dos formas por una sola
  comprobación, y la lectura tolerante ya existente sigue valiendo tal cual.
- **(b) Tercera clave hermana** (`{ propuesta, paquetes, comercialV2 }`): más
  explícito, pero deja dos fuentes de verdad comercial conviviendo en la misma
  columna y obliga a decidir cuál gana. Más superficie de error.

**Qué necesito:** confirmación de **(a)** — o de (b) si preferís la separación.
Sin eso no arranco la etapa 3. (La etapa 1 y la 2 no dependen de esta decisión;
sólo la 3.)

### F-3 · OPERATIVO (etapa 6, gate) · El gate exige conmutar el motor en local

El gate de F2a pide el PDF de propuesta descargado desde la interfaz en
pantalla y A4, con SHA-256 igual al del pipeline. El bloque `commercial-offer`
con los dos grupos de totales vive en la **cadena v2**, y hoy
`MOTOR_DOCUMENTAL_ACTIVO = "v1"` (`motor-activo.ts:19`).

No es un freno: el prompt ya lo prevé ("podés conmutar en local para probar,
nunca lo commiteás"). Lo registro para que quede explícito que **los pasos de
reproducción del gate incluirán conmutar `motor-activo.ts` a `"v2"` antes del
flujo en navegador y revertirlo después**, y que el commit candidato se
verifica con el valor `"v1"` en su lugar (CE-1).

### F-4 · ATENCIÓN (etapa 2) · La moneda toca la cadena v1

Ampliar `MonedaDocumento` (`types.ts:105`) y parametrizar los cuatro
formateadores alcanza a `src/lib/format.ts`, `renderers/pdf/format.ts` y
`renderers/web/format.ts`, los tres en la cadena v1 que el invariante manda
dejar intacta. La lectura que aplico —salvo que me corrijas— es que **el
invariante protege el comportamiento y la salida, no la inmutabilidad
sintáctica del archivo**: una ampliación aditiva con `"ARS"` por defecto deja
la salida v1 idéntica. Lo verifico con las 903 pruebas, la matriz de PDFs y la
doble corrida SHA de la etapa 6, y lo reporto explícitamente en el handoff. Si
preferís que la cadena v1 no se toque ni sintácticamente, la alternativa es
duplicar los formateadores en v2 — decilo y lo hago así.

---

## 7 · Estado y próximo paso

- Prompt guardado verbatim en `docs/prompts/bv4-f2a-panel-comercial-prompt.md`
  (SHA-256 `3ef9256820f01f1b75c25ccbea149268ad77c365a63d47beb4934299b9768632`,
  idéntico al original por `diff`).
- Especificación funcional guardada en
  `docs/funcional/f2a-panel-comercial-reconciliado.md`.
- **Cero código tocado.** El único cambio del árbol son estos tres documentos.
- Línea de base registrada: 72 archivos / 903 pruebas + 1 todo en verde,
  typecheck limpio.

**Parada de reporte.** No avanzo a la etapa 1 hasta tener luz verde, y en
particular hasta que decidas sobre **F-2** (forma del sobre) y **F-1** (textos
de los servicios, que bloquean la etapa 5).
