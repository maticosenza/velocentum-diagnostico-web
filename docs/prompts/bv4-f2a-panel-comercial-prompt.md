# BV4 · F2a Panel de selección comercial — Prompt de ejecución

Ejecutás únicamente la fase F2a. El contrato normativo es
`bv4-contrato-maestro.md`; la especificación funcional es
`f2a-panel-comercial-reconciliado.md` con **Q1–Q10 cerradas**. Si algo de este
prompt contradice a cualquiera de los dos, gana el contrato y frenás.

Base: `feat/bv4-rebranding` en `043ba08` (F1 aprobada y pusheada).

**No ejecutás `git push` en ningún punto de F2a.** Commit candidato local,
artefactos, handoff, detención. El push llega recién con autorización expresa
de Matías después de la auditoría externa y del gate en navegador.

Frenás y reportás, sin improvisar, ante: cualquier decisión de producto no
listada acá; cualquier contradicción real; cualquier dato faltante. Nada se
inventa: ni cifras, ni precios, ni textos de servicio, ni activadores.

## Invariantes

- `main` intacto. Sin publicación, **sin migraciones de esquema**.
- Cadena v1 intacta. `MOTOR_DOCUMENTAL_ACTIVO` y `TEMA_DOCUMENTAL_ACTIVO` en
  sus valores actuales en todo commit; podés conmutar en local para probar,
  nunca lo commiteás.
- El panel **no lleva hexadecimales propios**: consume tokens del tema activo,
  cualquiera sea. Nace token-based sin forzar la activación de crystal.
- Máximo dos rondas de corrección por etapa.

---

## Etapa 0 · Diagnóstico del panel existente — SIN TOCAR CÓDIGO

El preflight de F1 encontró que **el panel de selección comercial ya existe y
funciona end-to-end**, contra lo que suponía la especificación original. Por
eso F2a no es "construir": es **revisar y extender**.

Antes de escribir una línea, producí `docs/bv4-f2a-diagnostico.md` con:

1. **Dónde vive** el panel hoy: rutas, componentes, tipos, y cómo se persiste
   la selección actual (columna, forma exacta del JSON si lo hay).
2. **Qué cumple ya** de Q1–Q10 y **qué falta**, punto por punto, con
   referencia a archivo y línea. Los diez puntos son:
   catálogo v2 versionado · 9 servicios/10 líneas con IDs estables ·
   mapeo v1→v2 con el grupo de contenido · sin activadores automáticos para
   influencer y desarrollo custom · precio unitario × cantidad ·
   moneda ARS/USD sin hardcodeo · configuración fiscal explícita y confirmable ·
   totales calculados no editables · recurrencia mensual/única con dos
   subtotales · agregados por nivel con alcance.
3. **Viabilidad de la persistencia**: ¿existe `diagnostico.propuesta`? ¿es
   JSON? ¿admite el sobre versionado sin migración? **Si la respuesta es no,
   frenás acá y reportás.** No hay plan B automático.
4. **Qué de lo existente se conserva** y qué se reemplaza, con el criterio de
   no romper selecciones ya guardadas (lectura tolerante del legado).

Commit propio del diagnóstico. **Parada de reporte**: entregás este documento
y esperás luz verde antes de la etapa 1. Si el diagnóstico muestra que falta
mucho menos —o mucho más— de lo previsto, el alcance se reajusta con Matías,
no por tu cuenta.

## Etapa 1 · Catálogo v2 versionado

Creá el catálogo v2 **al lado** del de seis servicios, sin modificarlo ni
eliminarlo: v1 alimenta el mapeo hallazgo→servicio vigente y toda la salida
v1, que debe seguir produciendo exactamente lo mismo.

Las 10 líneas con sus IDs estables —`meta_ads`, `google_ads`, `product_ads`,
`contenido_audiovisual`, `contenido_estatico`, `influencer_marketing`,
`planificacion_contenido`, `diseno_web`, `desarrollo_web_custom`, `branding`—
son contrato: no se renombran después de la primera persistencia.

Tabla de traducción v1→v2 exactamente como está en el reconciliado (§c).
**El servicio viejo "Planificación y creación de contenido" sugiere como grupo
las tres líneas de contenido, cada una desmarcable.** Influencer marketing y
desarrollo web custom **no tienen activador automático**: selección manual
únicamente. Ningún activador se inventa.

Commit propio.

## Etapa 2 · Modelo de selección

Extensión aditiva sobre lo que exista, sin romper lo guardado:

- `moneda: "ARS" | "USD"` a nivel de propuesta, una sola y consistente.
  **Prohibido hardcodear ARS** en formato o render.
- `fiscal: { aplicaImpuesto, porcentaje, confirmado }`, sugerido 21%.
  **Sin `confirmado: true` la exportación queda bloqueada**, sumándose al
  candado de selección que ya existe — no creás un segundo mecanismo.
  La condición fiscal **jamás se infiere de la moneda**.
- Por línea: `{ lineaId, seleccionada, cantidad?, precioUnitario? |
  precioLinea?, recurrencia, ruta? }`.
  - Cuantificables: precio **unitario**; el total de línea = unitario ×
    cantidad, recalculado al cambiar la cantidad.
  - Sin cantidad: total de línea.
  - `recurrencia: "mensual" | "unica"`, **editable por línea**. Defaults:
    únicas para `diseno_web`, `desarrollo_web_custom` y `branding`; mensuales
    las otras siete.
  - `ruta` (B2C / B2B / ambas) solo en `diseno_web`.
- Agregados: binarios y **por nivel con alcance** (email marketing: básico /
  automatizaciones / segmentación y recompra; reportes: mensual en IMPULSO,
  semanal en los otros dos; CRO solo en ESCALA; tracking web en los tres).
- **Dos grupos de totales, obligatorios y separados**: "Inversión mensual" e
  "Inversión inicial / pago único". Cada uno con su subtotal neto, su impuesto
  si aplica, y su total. **Nunca un total combinado.**
- Todos los totales **calculados, no editables**. Sin redondeos ni overrides.

Tests del modelo, incluidos: lectura tolerante de una selección legada, y que
un total combinado no sea representable.

Commit propio.

## Etapa 3 · Persistencia

Sobre versionado en `diagnostico.propuesta`:
`{ version: 2, moneda, fiscal, seleccion }`. Lectura tolerante del contenido
previo. **Cero migraciones de esquema**; si no es viable, frenás (ya debería
haberse detectado en la etapa 0).

La selección vive en base, no en estado de React: es condición del chequeo
SHA-256 entre el PDF de la interfaz y el del pipeline.

Commit propio.

## Etapa 4 · Panel

Las 10 líneas visibles siempre, con las sugeridas por el diagnóstico marcadas
y el resto desmarcado. Cantidades precargadas por nivel como sugerencia
editable (audiovisual 10/15/20 · estático 12/18/24 · campañas hasta 3/5/7,
**cupo por plataforma, no total**). Precio manual por línea. Selector de
moneda, configuración fiscal, y los dos subtotales en vivo.

Elegir TRACCIÓN o ESCALA **no preselecciona** `diseno_web`.

Tokens del tema activo, cero hexes propios, contraste AA, focus visible.

Commit propio.

## Etapa 5 · Propuesta

Los textos de los 10 servicios van **verbatim** del reconciliado §7, con sus
exclusiones y la nota al pie de contenido. Un servicio sin texto confirmado se
marca pendiente, **no se rellena**.

Desglose impreso: precio por línea y los dos totales por grupo, con subtotal
neto, impuesto si aplica y total final. Ambos perfiles: pantalla (16:9) y
`impresion` (A4).

**Semana 0 va solo en proyección.** El modelo de propuesta no tiene campo
donde representarla, y un invariante en la suite rechaza cualquier intento de
inyectarla.

Commit propio.

## Etapa 6 · QA, artefactos y cierre

`npm test`, typecheck y build limpios, con la suite v1 intacta. Matriz de
PDFs regenerada. Determinismo por doble corrida. Commit candidato **local**.
ZIP desde **worktree limpio** del commit candidato, incluyendo el diagnóstico
de la etapa 0, los logs de QA, y los PDFs de propuesta de los dos perfiles
para Snake Store y Titan Web B1.

Handoff de **máximo 10 líneas**. **Detención completa, sin push.**

### Gate de F2a

> diagnóstico → proyección → **selección comercial confirmada + configuración
> fiscal confirmada** → propuesta → PDF descargado desde la interfaz en
> pantalla y A4 → **SHA-256 del descargado = SHA-256 del pipeline**, para
> Snake Store y Titan Web B1.

El flujo en navegador lo ejecuta Matías; vos dejás el entorno listo y
documentás los pasos exactos para reproducirlo.

## Qué NO hacés en F2a

`git push`. Migrar el resto de la interfaz (es F2b). Tocar paginación o
jerarquía documental (F3a/F3b). Activar el tema crystal o el motor v2 en un
commit. Modificar la cadena v1. Inventar textos, precios o activadores.
Integrar a `main`. Publicar.
