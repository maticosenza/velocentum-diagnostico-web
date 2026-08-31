# Auditoría visual 2026-08-23 — fuente de verdad

Bloque Visual 1 (inventario, contrato y wireframes), rama `feat/noche-continuacion`,
HEAD de partida `e5080e20b2be491c3f45ad9846fc07441e68c103` (verificado: 595
pruebas aprobadas + 1 todo, typecheck limpio, build exitoso, árbol limpio).

Este documento es la ÚNICA fuente completa de los hallazgos de la
auditoría visual externa. Todo documento posterior en `docs/visual/`
referencia hallazgos por ID contra este archivo — nunca los repite completos.
Los identificadores son estables: nunca se renumeran. Un hallazgo resuelto
se marca resuelto acá mismo, no se borra ni se mueve a otro lado.

Este bloque es DOCUMENTAL. No corrige nada del código. Localiza, documenta
y propone.

---

## a) Alcance de la auditoría

Evidencia externa: **79 páginas de 10 documentos PDF**, generados a partir
de **4 de los 6 escenarios demostrativos** (`src/lib/fixtures-escenarios-demo.ts`):
`s1-marketplace-fuerte`, `s4-roas-bueno-margen-negativo`, `s5-todo-sano`,
`s6-solo-organico`. Los escenarios `s2-margen-alto-volumen-bajo` y
`s3-margen-fino-volumen-alto` NO fueron auditados visualmente (ver sección
"Cobertura pendiente", D8).

| Archivo | Páginas | Perfil |
|---|---|---|
| `s1-marketplace-fuerte-diagnostico-pantalla.pdf` | 7 | 16:9 |
| `s1-marketplace-fuerte-propuesta-pantalla.pdf` | 6 | 16:9 |
| `s1-marketplace-fuerte-proyeccion-impresion.pdf` | 8 | A4 |
| `s1-marketplace-fuerte-proyeccion-pantalla.pdf` | 10 | 16:9 |
| `s4-roas-bueno-margen-negativo-diagnostico-pantalla.pdf` | 7 | 16:9 |
| `s4-roas-bueno-margen-negativo-propuesta-pantalla.pdf` | 6 | 16:9 |
| `s4-roas-bueno-margen-negativo-proyeccion-impresion.pdf` | 9 | A4 |
| `s4-roas-bueno-margen-negativo-proyeccion-pantalla.pdf` | 10 | 16:9 |
| `s5-todo-sano-diagnostico-pantalla.pdf` | 8 | 16:9 |
| `s6-solo-organico-diagnostico-pantalla.pdf` | 8 | 16:9 |

**Total: 79 páginas.** Nota de cobertura de la propia evidencia: no hay
ningún documento de **propuesta** para s5 ni s6, ningún documento de
**diagnóstico** en perfil impresión para ninguno de los cuatro escenarios,
y ningún documento de propuesta en perfil impresión para ninguno. La
composición "proyección + propuesta" (`velocentum-proyeccion-propuesta/v1`)
tampoco aparece en la evidencia. Ver `docs/visual/perfiles-pantalla-a4.md`
para el estado real del perfil A4 verificado contra el código en esta rama.

Resumen de hallazgos, tal como llegó originalmente: **16 errores
comprobados** (E-01 a E-16), **5 inconsistencias de contrato vigentes** —
4 normativas (C-01 a C-04) y 1 inferida (C-07); C-05 fue reclasificada
como R-12 y C-06 fue retirada — y **12 recomendaciones** (R-01 a R-12).

**Reconciliado al cierre de este bloque (2026-08-23, corrección
documental post-handoff — ver sección d más abajo):** el inventario final
tiene **38 identificadores** — **E-01 a E-18** (18, se agregaron E-17 y
E-18), **C-01 a C-08** (8, se agregó C-08; C-01 se reescribió y pasó de
"Bloque 1" a "Bloque 2"), **R-01 a R-12** (12, sin cambios). Antes de esta
corrección había 35 identificadores; después, 38. **La cantidad de
identificadores no equivale a la cantidad de problemas activos únicos**:
C-05 no cuenta aparte porque referencia a R-12 (mismo problema, un solo
lugar donde se resuelve), y C-06 está retirado (no es un problema). El
detalle completo de las ocho correcciones está en la sección d.

---

## b) Decisiones de producto (D1 a D8)

Transcriptas literalmente, tal como llegaron con el encargo de este
bloque. Son ENTRADA, no están en discusión en este bloque.

### D1 · Propuesta sin paquete comercial

> No se puede descargar ni emitir un PDF de propuesta para cliente si no
> existe una selección comercial confirmada. La vista previa interna puede
> existir, pero debe mostrar claramente "Selección comercial pendiente" y
> quedar bloqueada para exportación.

### D2 · Tabla mensual

> Contrato conceptual aprobado: debe mostrar los valores de cada mes, el
> ritmo mensual al día 90 y el acumulado de 90 días como TRES MAGNITUDES
> DIFERENTES, nunca bajo una misma etiqueta. Lo pendiente de aprobación es
> únicamente la presentación visual.

### D3 · Motor de escenarios

> La arquitectura, las rampas y la separación entre facturación incremental,
> contribución incremental y ahorro publicitario están aprobadas y
> auditadas. El handoff antiguo que decía lo contrario quedó superado. El
> motor está aprobado para cálculo interno y prototipos; su salida
> definitiva a clientes sigue condicionada al QA semántico y visual en
> curso.

### D4 · Estados: dos ejes obligatorios e independientes

> **Eje 1 — Origen de la evidencia** (copy exacto, no reformular):
> - `verificado` → "Validado con evidencia del período"
> - `declarado` → "Informado por el cliente; pendiente de validación
>   documental"
> - `estimado_configuracion` → "Referencia configurada; no validada con
>   datos del cliente"
> - `no_disponible` → "No contamos con este dato"
> - `no_aplica` → "No corresponde a este negocio o canal"
>
> **Eje 2 — Disponibilidad del cálculo** (copy exacto, no reformular):
> - `disponible` → "Calculado con los datos disponibles"
> - `retenido` → "No se muestra hasta validar: [motivo]"
> - `evidencia_faltante` → "Falta [dato] para realizar este cálculo"
> - `no_aplica` → "Este cálculo no corresponde a este caso"
>
> Ninguno de estos estados puede distinguirse únicamente mediante color.

### D5 · Margen negativo

> Debe producir simultáneamente:
> - alerta crítica visible en el diagnóstico;
> - retención de toda proyección que dependa del margen;
> - conservación de los hallazgos y recomendaciones que NO dependan del
>   margen;
> - posibilidad de preparar una propuesta cualitativa, sin promesas
>   económicas ni proyecciones retenidas presentadas como cifras.
>
> No debe bloquear el documento entero ni ocultar el problema.

### D6 · Formatos de impresión

> Diagnóstico, proyección y propuesta necesitan una variante A4 real, no una
> 16:9 reducida. Pantalla y A4 comparten contenido y reglas semánticas, pero
> usan perfiles de composición independientes.

### D7 · Terminología (uso obligatorio, sin excepción)

> Multicanal = combinación de tienda propia, Mercado Libre u otros canales
> de venta.
> Mixto = operación minorista con módulo mayorista activado.
> Nunca usar "mixto" como sinónimo de "multicanal".
> El escenario s1-marketplace-fuerte es MULTICANAL, no mixto.

### D8 · Cobertura pendiente

> Los escenarios 2 y 3 y las variantes mayorista y mixta son necesarios
> antes de la propagación final y de la fase 14. No bloquean este bloque.

**Estado de D8 al cierre de este bloque:** sigue sin resolver, tal como
D8 mismo indica que puede seguir — no es un pendiente de ESTE bloque.
`s2-margen-alto-volumen-bajo` y `s3-margen-fino-volumen-alto`
(`src/lib/fixtures-escenarios-demo.ts`) existen como fixtures pero no
tienen auditoría visual (0 páginas revisadas). Ninguna variante mayorista
ni mixta existe entre los seis escenarios demostrativos — los seis son
minoristas puros (`ModalidadComercial` nunca se ejercita como `"mayorista"`
ni `"mixto"` en `fixtures-escenarios-demo.ts`, verificado por lectura
directa del archivo).

---

## c) Apéndice completo de hallazgos

### Errores comprobados (E-01 a E-16)

**E-01 · NORMATIVO** · Texto solapado en la tabla de escenarios. Verificado
a 400 DPI: "$ 5.761.835" se superpone con "$ 15.488.804"; encabezados de
columna sin canal de separación ("CONTRIBUCIÓNFACT.
PROYECTADAINCREMENTAL"); celdas pisadas ("$ 960.306 †$ 12.581.467 †"); dagas
duplicadas "††".
Dónde: s1-proyeccion-impresion p6-7, s1-proyeccion-pantalla p6-8.
Causa presunta: bloque `scenarios` del renderer PDF, tres KPIs y cinco
columnas en un ancho de card que no los soporta.

**E-02 · NORMATIVO** · Página sin contenido. s1-proyeccion-pantalla p9/10
contiene solo el encabezado "ESCENARIOS / Qué puede ocurrir en 90 días, mes
a mes"; el cuerpo está vacío.
Causa presunta: paginación que emite una sección por escenario sin
verificar que el escenario tenga contenido publicable.

**E-03 · NORMATIVO** · La lista de palancas mezcla tres magnitudes
económicas. Seis líneas "Fuga por…": navegación aparece con $3.567.928 y
con $1.327.269, sin etiqueta que las distinga, más "sobrefragmentación". La
aritmética confirma que la primera terna es facturación incremental, la
segunda contribución incremental y la tercera ahorro publicitario. Además
el valor es ritmo mensual al día 90 presentado en una página titulada "90
días".
Dónde: todas las páginas de escenarios de s1.
Causa presunta: `LineaImpacto90d.palancas` expone `montoMensualDia90` por
línea; el renderer aplana las tres listas en una sola. Existe una constante
de etiquetas de magnitud en el renderer PDF que no se aplica acá.
Nota: el dominio es correcto y está aprobado (D3). El defecto es del
renderer.

**E-04 · NORMATIVO** · "Sin datos — Sin datos" como cifra principal, en
tarjeta destacada sobre fondo navy, en cuatro documentos.
Dónde: s4 propuesta p2 pantalla, s4 proyección p2 pantalla e impresión.
Causa presunta: el dominio marca la cifra principal como retenida
correctamente; el formateador imprime la etiqueta de ausencia y une los dos
extremos del rango con guión largo. Capa de formato, no motor.

**E-05 · NORMATIVO** · Un no_aplica presentado como evidencia faltante. Con
inversión publicitaria $0, "MER tienda propia" aparece bajo "Datos
faltantes" con el texto "Faltan facturación o inversión del perímetro de
tienda propia".
Dónde: s6-solo-organico p7/8.

**E-06 · NORMATIVO + INFERIDO** · Volcado de retenciones. 19 tarjetas casi
idénticas ("Facturación incremental (ritmo) retenida · conservador"…)
ocupando dos a tres páginas, con concordancia gramatical rota ("Ahorro
publicitario retenida").
Dónde: s4-proyeccion-impresion p5-6, s4-proyeccion-pantalla p5-7.
Causa presunta: se enumera el producto cartesiano magnitud ×
acumulado/ritmo × escenario en vez de agrupar por causa de retención.

**E-07 · NORMATIVO** · Contradicción de confianza. Tarjetas
"CONSERVADOR/ALTA", "BASE/ALTA", "POTENCIAL/ALTA" sin una sola cifra. Y la
nota "el presupuesto liberado por consolidación de pauta puede
reinvertirse" se muestra aunque el ahorro publicitario esté retenido.
Dónde: s4-proyeccion p8/9 y p9/10.

**E-08 · NORMATIVO** · Duplicación exacta diagnóstico ↔ propuesta: los 7
hallazgos, mismo componente, mismo orden, mismos montos.
Dónde: s1-diagnostico p5 = s1-propuesta p3.

**E-09 · NORMATIVO** · Servicio concatenado en el alcance: conviven "Meta
Ads", "Desarrollo y optimización web" y "Desarrollo y optimización web y
Meta Ads" como tres ítems distintos.
Dónde: s1-propuesta p5/6.
Causa presunta: el campo `servicio` es texto libre y admite combinaciones
que no son miembros del catálogo de seis servicios. Es contrato, no
presentación. Ver C-03 y V2.

**E-10 · NORMATIVO** · Margen negativo sin alerta. "−7,0% / Confianza
alta" en una card idéntica a las demás. Ni el diagnóstico ni la propuesta
de ese escenario mencionan que el negocio pierde dinero por venta.
Dónde: s4-diagnostico p3, s4-proyeccion p4.
Tratamiento aprobado: D5.

**E-11 · NORMATIVO** · Severidad sin diferencia visual: ALTA y MEDIA con
chip lavanda idéntico. Presente en todos los diagnósticos.

**E-12 · INFERIDO** · Orden de hallazgos no respeta severidad: MEDIA,
MEDIA, ALTA, ALTA, ALTA, MEDIA, MEDIA. Dónde: s1-diagnostico p5.

**E-13 · NORMATIVO** · Daga "†" sin nota al pie en ninguna página de
ningún documento. CAUSA RAÍZ: PENDIENTE DE LOCALIZAR (según la auditoría
externa — ver `docs/visual/matriz-hallazgos.md` para el resultado de la
búsqueda de este bloque).

**E-14 · INFERIDO** · Formato decimal inconsistente: "50,83%" contra
"37,2%", "57,0%", "−7,0%". Dónde: s6 p3/8.

**E-15 · NORMATIVO** · Metadatos crudos concatenados con guiones:
"servicio - confianza media - Contribución incremental". Presente en
todos los diagnósticos y propuestas.

**E-16 · INFERIDO** · Cero real etiquetado como estimación: "Inversión
publicitaria $ 0 / Confianza media". Dónde: s6 p3/8.

### Inconsistencias de contrato

**C-01 · NORMATIVO · ⚠ HISTÓRICO / SUPERADO — no es la versión vigente.
La versión vigente es la reformulación en la sección "d) Correcciones del
cierre" más abajo, marcada VERSIÓN VIGENTE. Se conserva este texto tal
cual llegó únicamente por trazabilidad; no lo uses para tomar decisiones.**
· El perfil A4 no existe como maquetación propia.
Según la auditoría externa, el tamaño de página del renderer PDF es una
constante única [960,540] y el CSS de impresión del renderer web declara
`@page 13.333in × 7.5in` con secciones de `min-height 7.5in` y salto de
página. Es decir: el "perfil impresión" sería la composición 16:9 paginada
a papel. CONFIRMAR O REFUTAR (V3). Decisión aplicable: D6.
**Resultado real (ver versión vigente): refutada para el renderer PDF,
confirmada para el renderer web — no quedó "confirmar o refutar" abierto.**

**C-02 · NORMATIVO** · Un solo eje de estados donde se exigen dos.
"Confianza: ALTA / Cobertura 100%" convive con una proyección
íntegramente retenida. Origen de evidencia y disponibilidad del cálculo se
presentan colapsados en una sola escala. Dónde: s4 completo. Decisión
aplicable: D4.

**C-03 · NORMATIVO** · El campo `servicio` es texto libre, lo que rompe
la trazabilidad hallazgo → servicio del catálogo de seis. Origen de E-09.
CONFIRMAR O REFUTAR (V2).

**C-04 · NORMATIVO** · Se emite una "Propuesta de trabajo" sin selección
comercial. s4-propuesta son 6 páginas con portada, "Sin datos — Sin
datos", un hallazgo de contexto, un aviso de retención y dos divisorias:
cero alcance, cero entregables. El sistema respeta la regla de no inventar
precio, pero no impide publicar el documento. Decisión aplicable: D1.
CONFIRMAR O REFUTAR (V4, V5).

**C-05 · RECLASIFICADO → R-12.** Era: "tabla mensual implementada sin
aprobación de layout". El contrato conceptual está aprobado (D2); lo
pendiente es solo la presentación visual. Deja de ser inconsistencia de
contrato.

**C-06 · RETIRADO.** Era: "motor de escenarios sin aprobación semántica
según handoff". El handoff quedó superado por decisiones y entregas
posteriores (D3). No se cuenta como hallazgo. Se conserva el ID para
trazabilidad.

**C-07 · INFERIDO** · Sin puente entre documentos. El diagnóstico de s1
muestra fugas mensuales ($1.769.692, $1.755.535, $315.996) y la propuesta
encabeza con $5.761.835 a 90 días. Ninguna página explica la relación
entre ambas cifras.

### Recomendaciones (requieren aprobación de producto en el Bloque 2)

**R-01** · Contrato de ocupación por página: ≥70% del alto útil en 16:9.
Hoy hay páginas con 12% a 45% de ocupación en casi todos los documentos.

**R-02** · Balanceo de grilla: 7 ítems → 4+3, nunca 3+3+1. Card huérfana
en s1 p3, s5 p3, s6 p3.

**R-03** · Escala tipográfica mínima por perfil: las tarjetas de escenario
en 16:9 quedan ilegibles en videollamada.

**R-04** · Aplicar la iconografía definida por el sistema de diseño
(iconos lineales violetas en círculo, numeración 01/02/03). No aparece en
ninguna de las 79 páginas.

**R-05** · Portada con cliente y versión; franja con degradado suave en
vez de tres bandas violetas duras.

**R-06** · Un solo tratamiento del wordmark: hoy "velocentum" en portada y
"VELOCENTUM" al pie.

**R-07** · Sección de fortalezas. s5-todo-sano (57% de margen, MER 25x)
recibe tres alertas de prioridad ALTA por $9,8M y ni una línea sobre lo
que funciona bien.

**R-08** · Máximo una divisoria por documento. s4-propuesta: 3 de 6
páginas son portada o divisoria.

**R-09** · Alinear título y contenido: "Funnel, retención y hallazgos
priorizados" encabeza una página sin funnel y sin retención, en los
cuatro diagnósticos.

**R-10** · Componente de comparación entre canales en diagnósticos
MULTICANAL. s1 es "marketplace fuerte / tienda floja" y muestra MER 35,0x
y 10,0x como cards planas equivalentes.

**R-11** · Rediseñar los escenarios en 16:9: hoy usan una card mínima por
página con dos tercios vacíos y aprovechan peor el espacio que el A4.

**R-12** · Presentación de la tabla mensual (ex C-05). Contrato aprobado
en D2; el layout debe proponerse en el Bloque 2 y aprobarse antes de
implementarse.

---

## d) Correcciones del cierre (2026-08-23, corrección documental post-handoff)

Ocho correcciones aplicadas al cierre del Bloque Visual 1, antes de pasar
al Bloque Visual 2. El apéndice original (sección c) **no se reescribe ni
se borra** — sigue siendo la transcripción literal de la auditoría
externa, tal como llegó. Esta sección es la capa de corrección que se le
suma encima, con la misma regla que ya regía para C-05/C-06: un hallazgo
corregido se marca corregido acá, nunca se elimina del registro.

### E-17 · NORMATIVO (nuevo) · Divergencia sistemática entre PDF y web

Durante la verificación de código de este bloque aparecieron, repetidas
veces, distintos tratamientos entre el renderer PDF y el renderer web para
el MISMO estado semántico — no un hallazgo aislado, sino un patrón que
atraviesa el documento entero:

- **`ValorPublicable` retenido:** PDF muestra `"Sin datos"`
  (`src/documents/renderers/pdf/document.tsx:567-571`); web muestra
  `"Retenido"` (`src/documents/renderers/web/document-renderer.tsx:247-253`,
  clase `vdoc-retained`). Mismo estado, dos palabras distintas.
- **Tratamiento visual de la prioridad de un hallazgo:** PDF usa un
  `badgeStyle` único para "alta"/"media"/"baja"
  (`src/documents/renderers/pdf/document.tsx:535`, sin variante por
  `prioridad`); web sí diferencia por color
  (`src/documents/renderers/web/document-renderer.tsx:197-199` +
  `src/documents/renderers/web/document-renderer.css:388-404`,
  `.vdoc-tag--alta`/`.vdoc-tag--media`).
- **Configuración de `Intl.NumberFormat` para porcentajes:** PDF fuerza
  `minimumFractionDigits: 1` (`src/documents/renderers/pdf/format.ts:4-7`);
  web no fija ningún mínimo (`src/documents/renderers/web/format.ts:12-15`,
  `style: "percent", maximumFractionDigits: 2` sin `minimumFractionDigits`)
  — pueden mostrar cantidades de decimales distintas para el mismo valor.
- **`item.capa`:** PDF muestra el valor crudo del enum
  (`src/documents/renderers/pdf/document.tsx:537-540`, `{item.capa}` tal
  cual — "servicio"); web lo traduce
  (`src/documents/renderers/web/document-renderer.tsx:200`,
  `{LABELS_CAPA[item.capa]}` — "Servicio").
- **Supuestos:** visibles en web dentro de cada tarjeta de escenario
  (`src/documents/renderers/web/document-renderer.tsx:385-390`,
  `item.assumptions`), completamente omitidos en PDF (el caso `"scenarios"`
  de `src/documents/renderers/pdf/document.tsx:582-663` nunca los lee) —
  esta es, además, la causa raíz de E-13, ya localizada en la matriz.
- **Numeración 01/02/03 de hallazgos:** presente en web
  (`src/documents/renderers/web/document-renderer.tsx:192-194`,
  `vdoc-finding__index`), ausente en PDF (`document.tsx:530-549`, el caso
  `"findings"` no numera nada).

**Causa raíz:** no hay ninguna capa de presentación compartida entre los
dos renderers. Cada uno (`document.tsx` para PDF, `document-renderer.tsx`
para web) implementa su propio mapeo de estado → texto/color/estructura,
de forma completamente independiente, a partir del mismo `DocumentModel`.
No existe ningún módulo intermedio de "reglas de presentación" que ambos
consuman — cada divergencia de arriba es un lugar donde alguien implementó
la regla dos veces, con resultados distintos.

**Capa:** renderer/presentación. **Bloque de corrección:** Bloque Visual 2.

### E-18 · NORMATIVO (nuevo) · Roadmap siempre vacío

`src/documents/domain/build-context.ts` fija `roadmap: []` de forma
incondicional en el `DocumentContextV1` que arma `buildDocumentContext` —
no hay ninguna rama del código que lo pueble con datos reales del motor.
El bloque `roadmap` en sí SÍ existe, completo, en las tres capas: tiene un
constructor (`src/documents/templates/velocentum-v1/shared.ts:169-177`,
`roadmapSection`), un caso en el renderer PDF
(`src/documents/renderers/pdf/document.tsx:664-680`) y un componente en
el renderer web (`src/documents/renderers/web/document-renderer.tsx:404-423`,
`RoadmapBlock`) — los tres saben perfectamente cómo dibujar una hoja de
ruta si les llega alguna. Lo que falta es exclusivamente el dato de
origen: con `context.roadmap` siempre `[]`,
`roadmapSection` siempre produce `blocks: []`, y `createModel`
(`shared.ts:4-30`) filtra esa sección vacía antes de que llegue a
ningún renderer — así que en la práctica, ningún documento generado desde
el motor real muestra jamás una hoja de ruta, aunque las plantillas de
proyección y propuesta la incluyan en su lista de secciones
(`proyeccion-90d.ts`, `propuesta.ts`).

**Capa:** dominio/contrato. **Bloque de corrección:** Bloque Visual 3, o
una decisión de producto previa (¿se completa el roadmap con datos reales,
o se elimina la sección/el bloque de las plantillas que hoy prometen algo
que nunca entregan?) — ver decisión pendiente 6.

### C-01 · ✅ VERSIÓN VIGENTE — reescrita y reasignada de Bloque 1 a Bloque 2

**Esta es la versión vigente de C-01.** El texto original de C-01
(sección c más arriba, ahora marcado HISTÓRICO / SUPERADO) queda tal cual,
para trazabilidad, pero no debe usarse para tomar decisiones. La
afirmación central de C-01 — "el perfil A4 no existe
como maquetación propia" / "el tamaño de página del renderer PDF es una
constante única [960,540]" — **queda REFUTADA**, verificada contra
`src/documents/renderers/pdf/document.tsx:99-142` (`PROFILES`): hay dos
valores de `pageSize` distintos (`[960,540]` para pantalla, `"A4"` para
impresión), con tokens de composición propios cada uno (grilla de 3 vs. 2
columnas, tipografía distinta). Detalle completo, con la parte de la
afirmación que SÍ se confirma (el CSS de impresión del renderer web, que
no tiene perfil A4), en `docs/visual/perfiles-pantalla-a4.md`.

**C-01, reescrita, conserva únicamente los problemas residuales
verificables** (los que sí siguen siendo ciertos hoy):

- Portada y transiciones son a sangre completa (bleed) en AMBOS perfiles,
  incluido A4 (`document.tsx:213-229`, `coverAccent`/`coverAccentSoft` sin
  margen) — si "sin páginas a sangre completa" se adopta como regla para
  A4, hoy no se cumple.
- Los encabezados de la tabla mensual de escenarios no se repiten al
  continuar de página (`document.tsx:623-648`): se imprimen una sola vez
  por escenario, sin ningún mecanismo de repetición configurado para
  cuando `@react-pdf/renderer` corta la tabla entre páginas.
- El escalado tipográfico entre perfiles se limita a `baseFontSize`/
  `titleFontSize` a nivel global (`PROFILES.*`) — no hay una escala
  completa por rol de texto (label, valor, nota, badge) pensada para
  papel.
- **Aclaración, no un defecto nuevo:** que los dos perfiles compartan el
  mismo árbol de componentes (`makeStyles(profile)`, `renderBlock`,
  `ContentPage`, parametrizados por `PROFILES[profile]`) es una decisión
  ARQUITECTÓNICA, no un defecto por sí mismo — es perfectamente válido que
  "perfiles de composición independientes" (D6) se implemente como
  parámetros propios sobre un solo árbol de componentes, en vez de dos
  jerarquías de componentes separadas. Sólo sería un defecto si esa
  arquitectura impidiera lograr las diferencias que D6 exige, y no es el
  caso: las diferencias de columnas, tamaño de página y tipografía ya se
  logran así.

**Capa:** renderer. **Bloque de corrección:** Bloque Visual 2 (reasignado
desde Bloque 1 — ya no es un déficit de contrato/arquitectura a resolver
antes de diseñar, es trabajo de implementación visual directo sobre los
tres puntos residuales de arriba).

### C-08 · NORMATIVO (nuevo) · No existe previsualización A4

Aunque el renderer PDF sí tiene un perfil `impresion` real (ver C-01
reescrita arriba), **no hay ninguna forma de previsualizar ese perfil A4
sin descargar el PDF.** `DocumentWebRendererProps`
(`src/documents/renderers/web/document-renderer.tsx:12-15`) no tiene
ningún campo `profile` — el renderer web siempre produce la misma
composición HTML, la que corresponde a `pantalla`. La pantalla de vista
previa (`src/routes/_authenticated/documentos.$id.$slug.tsx:198-202`)
monta `<DocumentWebRenderer model={model} />` sin ningún selector de
perfil; el único lugar donde `profile` existe en la UI es el dropdown de
"Descargar PDF" (`ETIQUETA_PERFIL`, líneas 26-29 de esa misma ruta), que
no afecta a la vista previa en pantalla en absoluto. El `@page` del CSS de
impresión del renderer web (`document-renderer.css:751-775`) permanece
fijo en las dimensiones de 16:9 (`13.333in × 7.5in`), nunca A4 — así que
ni siquiera "Imprimir" desde el navegador sobre la vista previa produce
A4. La única manera de comprobar cómo se ve el perfil `impresion` hoy es
descargar el PDF y abrirlo.

**Capa:** renderer/UI. **Bloque de corrección:** Bloque Visual 2.

### E-10 · ajustado a "parcialmente resuelto"

El hallazgo original ("margen negativo sin alerta") ya no aplica tal cual
— desde el commit `e5080e2` (previo a este bloque, ya en HEAD), el
hallazgo `margen_negativo` existe, aparece primero en el array y lleva
prioridad "alta" forzada (`src/lib/propuesta.ts`,
`src/documents/domain/build-context.ts`, `prioridadDeHallazgo`). **Pero
sigue usando exactamente el mismo componente visual (`findings`) y el
mismo tratamiento (mismo badge, sin color propio — ver E-17) que cualquier
otro hallazgo de prioridad alta.** No hay ninguna diferenciación visual
específica para "esto es más grave que una alta cualquiera" — la única
diferencia hoy es de posición (siempre primero) y de metadato
(`prioridad: "alta"`), no de presentación. Por eso queda **parcialmente
resuelto**, no resuelto: el dato y la prioridad ya están bien; la
diferenciación visual queda pendiente para el Bloque Visual 2.

### C-02 · ampliada con las brechas de tipado

Además de la descripción original (un solo eje de estados donde D4 exige
dos), la verificación de este bloque encontró tres brechas de tipado
concretas, verificadas contra `src/documents/domain/types.ts`:

1. **`ValorPublicable<T>` no contempla `evidencia_faltante`** — sólo tiene
   `"calculado"` / `"retenido"` / `"no_aplica"` (líneas 28-46); D4 exige
   distinguir `retenido` de `evidencia_faltante` como dos causas de
   ausencia distintas, y hoy ambas caen en el mismo `"retenido"` genérico.
2. **`Evidencia<T>` no contempla `estimado_configuracion`** — sólo tiene
   `"verificado"` / `"declarado"` / `"no_disponible"` / `"no_aplica"`
   (líneas 13-24); D4 exige un quinto estado que hoy no existe en el tipo.
3. **`Evidencia<T>` no llega a ningún renderer** — `context.evidencia`
   se construye en `build-context.ts` pero ningún constructor de bloque ni
   ningún renderer (PDF o web) lo lee jamás (verificado por búsqueda
   exhaustiva, cero coincidencias fuera de donde se construye): el Eje 1
   completo de D4 es invisible en el documento final, sin importar qué
   estados tenga el tipo.

Detalle completo de las tres, con cita exacta, en
`docs/visual/contrato-estados.md`, secciones 2 y 6.

### E-01 y E-02 · condición de entrada obligatoria para el Bloque Visual 2

Ambos hallazgos (solapamiento de texto en la tabla de escenarios;
página con encabezado y cuerpo vacío) se verificaron en este bloque **sólo
contra el código fuente** (ancho de tarjeta, estructura de la tabla,
paginación automática de `@react-pdf/renderer`) — no se regeneró ningún
PDF real en este bloque documental, así que la causa estructural está
localizada pero el defecto en sí no se reprodujo visualmente de nuevo.

**Condición de entrada obligatoria antes de tocar el renderer en el
Bloque Visual 2:** regenerar los PDFs de los escenarios afectados (como
mínimo s1, que es donde se documentó la evidencia original) y comprobar
que el defecto TODAVÍA existe con el código actual. Si no se reproduce,
no implementar ninguna corrección basada únicamente en la evidencia
histórica de la auditoría externa — la causa estructural señalada acá
(ancho de card + tabla de 5 columnas, `document.tsx:97,623-648`) puede
haber cambiado de comportamiento por otras razones desde que se generó
esa evidencia (por ejemplo, cambios de contenido en los escenarios que
alteren cuánto texto entra en cada celda).

### Reconciliación de identificadores (resumen)

- **Antes de esta corrección:** 35 identificadores (E-01 a E-16 = 16;
  C-01 a C-07 = 7; R-01 a R-12 = 12).
- **Después de esta corrección:** 38 identificadores (E-01 a E-18 = 18;
  C-01 a C-08 = 8; R-01 a R-12 = 12, sin cambios).
- **La cantidad de identificadores no es la cantidad de problemas activos
  únicos:** C-05 no suma un problema aparte porque ya está reclasificada
  hacia R-12 (mismo problema, un solo lugar de resolución); C-06 está
  retirado (dejó de ser un problema real desde que D3 superó al handoff
  que lo originó). De los 38 IDs, 2 (C-05, C-06) no representan trabajo
  pendiente por sí mismos — son registro histórico de una reclasificación
  y un retiro, respectivamente.

Ver `docs/visual/matriz-hallazgos.md` para las 38 filas completas, con
estado de verificación y bloque de corrección asignado a cada una.

## e) Corrección post-Bloque Visual 3.1 (2026-08-28)

Dos hallazgos nuevos, encontrados por la auditoría externa de la ronda
correctiva Bloque Visual 3.1 (commit candidato `f18ff1f`, artefacto de
revisión de 380 páginas / 54 PDFs). Mismo criterio que la sección d): el
apéndice original y la sección d) **no se reescriben** — esta es otra
capa de corrección que se suma encima.

### E-19 · RESUELTO (actualización 2026-08-28, Fase 14.1) · El umbral de ocupación de página (R-01/5.1) no se cumple de forma sistemática

**Resuelto.** Decisión humana de Matías, Fase 14.1 (2026-08-28): vía
(a) de la sección "Decisión pendiente" abajo — bajar el umbral general
a **50% para pantalla e impresión** (antes 70%/65%, sección 5.1 de
`contrato-composicion-v2.md`, ahora actualizada). El piso duro de 25%
(E-20) se mantiene sin cambios de valor, pero cambia de naturaleza: ver
E-20 abajo. Registrado además un hallazgo estructural nuevo, **E-21**
(abajo), que documenta la causa raíz común a E-19 y E-20 — la
auditoría externa acertó en identificar el patrón pero lo separó en
dos hallazgos distintos cuando es, en el fondo, una única causa
arquitectónica en dos manifestaciones. El análisis de distribución que
sostiene esta decisión está en `docs/fase-14/analisis-e19.md`; el
razonamiento original de este hallazgo se conserva sin editar abajo,
como registro histórico de por qué se llegó a esta decisión.

R-01 (`docs/visual/matriz-hallazgos.md`) ya había señalado, desde la
auditoría original, que no existe ningún mecanismo de medición u
ocupación mínima en el renderer. El contrato de composición v2
(`docs/visual/contrato-composicion-v2.md`, sección 5.1) adoptó
después un umbral formal — **≥70% del alto útil en pantalla, ≥65% en
A4** — con una lista cerrada de excepciones documentadas caso por caso
(sección 5.8, C7) cada vez que una ronda encontraba una página real por
debajo del umbral.

La auditoría externa de Bloque Visual 3.1 midió la ocupación real de las
380 páginas del artefacto de revisión (54 PDFs, 9 casos × 3 documentos ×
2 perfiles, commit `f18ff1f`) y encontró **124 páginas de contenido bajo
el umbral del contrato** — muy por encima del puñado de casos que la
lista cerrada de excepciones (5.8) documenta hasta ahora. No es una
regresión introducida por la ronda 3.1: el patrón viene arrastrándose
desde el Bloque Visual 2.1 (primera vez que se formalizó el umbral),
corrigiéndose caso por caso — cada ronda resolvía la página puntual que
tenía delante y sumaba, cuando no podía resolverla sin inventar
contenido, una nueva excepción a la lista cerrada — sin que ninguna
ronda tratara el patrón de forma sistémica. La ronda 3.1 corrigió los
tres casos puntuales que tenía en su propio alcance (C-1) y documentó
transparentemente su propio efecto colateral (contrato de composición,
sección 5.8, ampliada); no midió ni corrigió las 380 páginas completas
porque estaba fuera de su mandato (limitado a C-1 a C-4).

**Causa raíz estructural:** el contrato fija un umbral global único sin
ningún mecanismo que garantice que las páginas lo cumplan — los bloques
de contenido se dimensionan por los datos reales que exponen (nunca se
infla contenido para llenar una página, regla dura de todo este
prototipo), así que cualquier combinación caso/documento cuyo contenido
real sea menor a lo que llena una página completa queda,
legítimamente, por debajo del umbral, sin importar en qué orden se
acomoden los bloques. Reordenar bloques (como hizo C-1 en la ronda 3.1)
puede mover EN QUÉ página cae el déficit, pero no lo elimina
estructuralmente cuando el contenido real de un caso es, de por sí,
poco.

**Decisión pendiente, diferida a la fase 14 — no se resuelve acá:**
bajar el umbral a un valor que el contenido real pueda cumplir de forma
sistemática, o rediseñar la paginación (tamaño de página variable,
fusión de secciones delgadas entre documentos, u otra estrategia de
densidad visual) para que el ≥70%/65% actual se vuelva alcanzable. Es
una decisión de producto/diseño, no algo para resolver dentro de una
ronda correctiva — explícitamente fuera del alcance de Bloque Visual
3.1 (mandato acotado a C-1 a C-4, ver
`docs/visual/handoff-bloque-visual-3-1.md`).

**Capa:** contrato de composición / producto. **Bloque de corrección:**
Fase 14 (criterio de entrada — ver `docs/plan-maestro-fases.md`
sección 5.7).

### E-20 · RECLASIFICADO (actualización 2026-08-28, Fase 14.1) · Páginas bajo 25% de ocupación: criterio de entrada de un futuro rediseño de paginación, no corrección obligatoria de fase 14

**Reclasificado.** Deja de ser "corrección obligatoria" de la fase 14
— las 16 páginas quedaron documentadas y justificadas individualmente
(`docs/visual/contrato-composicion-v2.md` sección 5.8.1, ejecutado en
Fase 14) y el piso de 25% se mantiene sin cambios de valor. Lo que
cambia es el ENCUADRE: el argumento arquitectónico de Fase 14 (el
modelo una-sección-por-página de react-pdf hace que ninguna técnica de
reordenamiento resuelva una sección con contenido real escaso) se
acepta como correcto — E-20 no es una categoría de defecto distinta de
E-19, sino la manifestación más aguda de la misma causa estructural
(ver **E-21**, nuevo, abajo). Separarlos en dos hallazgos, como hizo la
auditoría externa original, sugería que E-20 era corregible por
composición mientras E-19 era sólo una cuestión de umbral — la
investigación de Fase 14 mostró que ninguno de los dos es corregible
por composición sin un rediseño de fondo (fusionar secciones enteras).
Por eso E-20 pasa a ser **criterio de entrada de un futuro rediseño de
paginación** (la vía (b) que Fase 14 evaluó y descartó por alcance) —
si ese rediseño se emprende alguna vez, las 16 páginas (y las que
E-21 describe de forma más amplia) son el criterio de aceptación que
debe cumplir.

Distinto de E-19 (una pregunta de política abierta: ¿cuál debería ser
el umbral general?), el subconjunto de páginas con ocupación por debajo
del 25% es un defecto real bajo **cualquier** decisión plausible sobre
el umbral general — incluso una versión del umbral considerablemente
más relajada que el 70%/65% actual seguiría considerando ese nivel de
vacío un defecto de composición, no una variación aceptable de
contenido corto. No es la misma categoría que las excepciones ya
documentadas en la sección 5.8 del contrato de composición (que
describen residuos de 15-25%, con motivo puntual y sin contenido para
llenarlos, todavía discutibles); una página bajo el 25% desde una
lectura ejecutiva es, directamente, una página que no cumple su
función.

**Corrección obligatoria, no una decisión de producto:** estas páginas
van como corrección al INICIO de la fase 14, sin esperar a que se
resuelva la decisión de umbral general de E-19 — el subconjunto exacto
de páginas bajo 25% y su recuento no se re-verificó de forma
independiente en esta sesión documental (la cifra viene del relevamiento
de la auditoría externa, no de una medición propia); confirmarlo con
una medición real de ocupación (no sólo longitud de texto extraído,
que es el proxy que usan las pruebas automatizadas hoy — ver
`generar-pdfs-bloque-3.test.ts`, H2) es parte del trabajo de entrada a
la fase 14, no de este registro.

**Capa:** contrato de composición. **Bloque de corrección:** Fase 14,
primera corrección obligatoria (criterio de entrada — ver
`docs/plan-maestro-fases.md` sección 5.7).

### E-21 · NORMATIVO (nuevo, 2026-08-28, Fase 14.1) · El modelo una-sección-por-página de react-pdf es la causa estructural común de E-19 y E-20

**Hallazgo:** en `renderers/pdf-v2/document.tsx`, cada `contentSectionV2`
del modelo se renderiza como su propio `<Page>` de `@react-pdf/renderer`
(`model.sections.map(...)` → un `<Page>` por sección) — dos secciones
NUNCA comparten página, sin importar el orden de sus bloques internos
ni cuánto contenido real tenga cada una. Cuando el contenido real de
una sección es escaso (2 hallazgos, 2 restricciones, un paquete
comercial de un nivel, un grupo de escenario con una sola palanca),
esa sección ocupa una página entera con vacío estructural — no porque
el renderer falle en componer bien el contenido que tiene, sino porque
el propio modelo de paginación no tiene ningún mecanismo para
compartir una página entre dos secciones cortas.

**Es la causa raíz común de E-19 y E-20 — no una tercera categoría
independiente.** E-19 (el patrón sistémico, 124/380 páginas bajo el
umbral general original) y E-20 (las 16 páginas bajo el piso duro de
25%) son dos mediciones del MISMO fenómeno con dos umbrales distintos:
en ambos casos, la técnica de reordenar bloques dentro de una sección
(la que sí resolvió C-1 en Bloque Visual 3.1) no alcanza, porque el
problema nunca está en el orden interno de una sección — está en que
la sección, completa, tiene poco que decir. La auditoría externa
original (2026-08-23) acertó en identificar el patrón pero lo separó
en dos hallazgos (E-19 como cuestión de umbral, E-20 como defecto de
composición corregible) cuando ambos comparten la misma causa
estructural y ninguno es corregible por composición sin tocar el
modelo de paginación en sí.

**Resolución:** exige fusionar secciones ENTERAS (ej. combinar
"Restricciones" y "Metodología" cuando ambas son cortas, o "Por qué
ahora" con "Alcance") — un rediseño del modelo de paginación, no un
ajuste de composición dentro de las secciones existentes. Evaluado en
Fase 14 (`docs/fase-14/analisis-e19.md` sección 4, punto 2) y
descartado por alcance: es un proyecto, no cabe en una ronda
correctiva acotada. **Queda fuera de alcance hasta que se decida
abordarlo** — ninguna fase futura está obligada a resolverlo, pero
cualquier trabajo futuro de rediseño de paginación debe partir de este
hallazgo como su criterio de entrada (junto con las 16 páginas
puntuales de E-20 y el barrido más amplio de 35 páginas adicionales
que documentó `docs/fase-14/analisis-e19.md` sección 5).

**Capa:** arquitectura de renderizado (`renderers/pdf-v2/document.tsx`,
modelo de paginación). **Bloque de corrección:** ninguno asignado —
criterio de entrada de un futuro rediseño de paginación, sin fecha.

### Reconciliación de identificadores (actualización 2026-08-28)

- **Antes de esta corrección:** 38 identificadores (E-01 a E-18 = 18;
  C-01 a C-08 = 8; R-01 a R-12 = 12).
- **Después de esta corrección:** 40 identificadores (E-01 a E-20 = 20;
  C-01 a C-08 = 8, sin cambios; R-01 a R-12 = 12, sin cambios). E-19/E-20
  no reemplazan a R-01 (que sigue siendo la recomendación original de
  ocupación, ya adoptada en el contrato de composición) — la registran
  como incumplida en la práctica, con magnitud medida (124/380) y una
  segunda categoría (E-20) que no depende de cómo se resuelva la
  primera.

`docs/visual/matriz-hallazgos.md` no se actualiza en esta corrección
documental — sus 38 filas describen la auditoría original (2026-08-23);
E-19/E-20 son hallazgos de una ronda posterior (Bloque Visual 3.1,
2026-08-28), fuera del alcance de esa matriz.

### Reconciliación de identificadores (actualización 2026-08-28, Fase 14.1)

- **Antes de esta corrección:** 40 identificadores (E-01 a E-20 = 20;
  C-01 a C-08 = 8; R-01 a R-12 = 12).
- **Después de esta corrección:** 41 identificadores (E-01 a E-21 = 21;
  C-01 a C-08 = 8, sin cambios; R-01 a R-12 = 12, sin cambios). E-19
  pasa a RESUELTO (decisión humana tomada, umbral general en 50%); E-20
  pasa a RECLASIFICADO (deja de ser corrección obligatoria de fase 14,
  pasa a ser criterio de entrada de un futuro rediseño de paginación);
  E-21 es nuevo — la causa estructural común que explica por qué ni
  E-19 ni E-20 son corregibles por composición dentro del alcance de
  una ronda correctiva. Ningún identificador se elimina: E-19/E-20
  quedan con su texto histórico intacto más la nota de resolución al
  principio de cada uno, siguiendo el mismo criterio de no reescritura
  que ya usa este documento.

`docs/visual/matriz-hallazgos.md` sigue sin actualizarse — E-19/E-20/E-21
son hallazgos posteriores a su alcance original (misma nota de arriba).

## f) Registro BV4 · F1-preflight (2026-08-31)

Hallazgos levantados durante el preflight del Bloque Visual 4 (rebranding),
sobre HEAD `831ef34`, rama local `feat/bv4-rebranding`. Se registran con el
formato de E-21. Ninguno de ellos se corrige en F1 salvo E-22, que ya está
aplicado. Aclaración vinculante heredada del prompt de F1: la observación de
ligaduras fi/fl fue descartada **antes** de recibir identificador (era
artefacto de extracción de texto, no del render) — no existe ningún "E-26
ligaduras" y no ocupa lugar en la serie.

### E-22 · RESUELTO (nuevo, 2026-08-31, BV4 F1-preflight) · El script `dev` no era la causa del arranque colgado; la causa real es que el árbol de trabajo está desalojado a iCloud

**Hallazgo:** el script era `"dev": "vite dev"` y `npm run dev` no llegaba
nunca a servir. La causa registrada en el prompt de F1 —que `vite dev` no
existe en Vite 8 y que el CLI toma `dev` como directorio raíz— **no se
verifica**: en `vite@8.2.0`, `node_modules/vite/dist/node/cli.js:704`
declara `cli.command("[root]", "start dev server").alias("serve").alias("dev")`,
y el despacho de `cac` (`cli.js:522-533`) descarta el token que hizo
`match` antes de pasar el resto como argumentos, así que la raíz sigue
siendo el cwd. `vite dev` es una invocación válida en esta versión.

La causa real es del entorno, no del repositorio. El repo vive en
`~/Documents/`, sincronizado por iCloud Drive, y con 14 GiB libres de 228 el
sistema desalojó su contenido: `ls -lO` muestra la marca `compressed,dataless`
en ~98% de `node_modules` (muestra de 400 archivos: 391 dataless) y en 158 de
los 256 archivos de `src/`. Cada primera lectura de un archivo dispara una
descarga bajo demanda a través de `fileproviderd`, serializada globalmente en
**~1 a 3,5 archivos por segundo**, con paralelismo nulo (43 archivos con
`xargs -P 32` tardaron 12,2 s; 86 archivos de `@babel/types/lib` tardaron
27,9 s en frío y 3 ms en la segunda corrida, ya materializados).

Medición decisiva: importar uno por uno los cinco plugins que carga el
wrapper `@lovable.dev/vite-tanstack-config` dio
`@tanstack/devtools-vite` 54 ms · `@tailwindcss/vite` 80 ms ·
`vite-tsconfig-paths` 6 ms · `@vitejs/plugin-react` 13 ms (los cuatro ya
tibios de una prueba previa) y
**`@tanstack/react-start/plugin/vite` 848 601 ms — 14 min 8 s en frío.**
Eso, y no el script, es el "cuelgue". El mismo mecanismo explica el
`tsc --noEmit` de ~14 minutos observado el 2026-08-30 con sólo ~2 s de CPU
consumida.

**Resolución:** el script se reemplazó por
`"dev": "vite --port 8080 --strictPort"` (commit `8d00078`). Se mantiene
aunque la premisa original no se verifique: es explícito y determinista,
coincide con el puerto por defecto que el propio wrapper fija
(`@lovable.dev/vite-tanstack-config/dist/index.js:750-762`) y con la
invocación que ya usaba Matías. La verificación de que `npm run dev` levanta
y responde queda **condicionada a materializar el árbol**: no es un defecto
del repositorio y no se corrige desde él. Acción que corresponde a Matías:
liberar espacio en disco y/o desactivar "Optimizar almacenamiento del Mac"
para iCloud Drive, o mover el repositorio fuera de `~/Documents` (p. ej. a
`~/Developer`). Mientras el árbol siga desalojado, cualquier corrida en frío
—`npm test`, typecheck, build, generación de PDFs— paga el mismo peaje.

**Capa:** entorno de desarrollo (`package.json`, sistema de archivos del
equipo). **Bloque de corrección:** BV4 F1-preflight (script, hecho) +
acción de entorno de Matías (materialización, pendiente).

### E-23 · NORMATIVO (nuevo, 2026-08-31, BV4 F1-preflight) · El panel de confirmación de la selección comercial SÍ existe y persiste; la observación original queda registrada con su discrepancia anotada

**Hallazgo tal como se levantó:** no existe pantalla ni panel para confirmar
la selección comercial; el candado de exportación de la propuesta existe
pero la llave no.

**Realidad verificada en el repositorio (2026-08-31), que contradice la
observación:** la cadena completa existe y funciona de punta a punta.

- `src/components/confirmacion-paquetes.tsx:220` — botón "Confirmar
  propuesta", `onClick={() => onConfirmar({ niveles, confirmado: true })}`.
- `src/lib/paquetes.functions.ts:13-49` — `confirmarPaquetes`,
  `createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])`,
  rechaza `escalera.confirmado !== true` y persiste con
  `supabaseAdmin.from("diagnostico").update({ propuesta: aGuardar })`.
- `src/documents/domain/from-diagnostico.ts:120-130` lee esa propuesta
  persistida.
- `src/documents/domain/build-context.ts:605` (`comercialDesdeEscalera`)
  arma el bloque `commercial-offer` con `pendiente: false`.
- `src/documents/renderers/pdf-v2/gate-exportacion.ts`
  (`verificarExportacionPermitidaV2`) deja pasar la exportación.

La llave existe. El comentario de cabecera de `confirmacion-paquetes.tsx`
("Sólo estado local en memoria") quedó desactualizado y es, con alta
probabilidad, el origen de la observación.

**Resolución:** el hallazgo se conserva con su texto original más esta
discrepancia anotada —mismo criterio de no reescritura que ya usa este
documento para E-19/E-20—, y **no** se corrige en F1. Consecuencia de
alcance, que es decisión de Matías y queda asentada acá: el alcance de F2a
deja de ser "construir el panel" y pasa a ser "revisar y extender el panel
existente", incluida la actualización del comentario de cabecera engañoso.

**Capa:** contrato funcional (selección comercial y gate de exportación).
**Bloque de corrección:** F2a, con alcance corregido a revisión/extensión.

### E-24 · NORMATIVO (nuevo, 2026-08-31, BV4 F1-preflight) · `factor_costo_evento_intermedio` en 20% sin respaldo de datos reales — alcance documental verificado: NO llega a documento de cliente

**Hallazgo:** `src/lib/calculo-diagnostico.ts:115` define
`FACTOR_COSTO_EVENTO_INTERMEDIO_DEFECTO = 0.2`, con el comentario "sin dato
de configuración, el costo de un evento intermedio se estima en un 20% del
CPA objetivo". Se usa en la línea 1025 cuando `cfg.factor_costo_evento_intermedio`
no viene cargado. El propio código lo declara: "nunca se verifica con datos
reales de este cliente, así que el resultado nunca se muestra como cifra
única" (comentario en 1018-1021). No hay fuente ni benchmark que lo respalde.

**Alcance documental, que el prompt de F1 dejaba pendiente de verificar:
verificado y cerrado — no llega.** El valor alimenta exclusivamente
`derivados.presupuesto_arranque` (`calculo-diagnostico.ts:1057`, `1134`), y
el único consumidor de ese campo en toda la aplicación fuera de sus tests es
`src/routes/_authenticated/diagnosticos.$id.tsx:763`, una pantalla interna
autenticada. Ningún archivo bajo `src/documents/` lo referencia: no entra al
modelo de documento, no se imprime en PDF ni en web, no llega al cliente.

**Resolución:** queda como decisión de negocio de Matías —reemplazar el 20%
por un benchmark con fuente, o dejarlo explícitamente como supuesto interno—,
sin urgencia visual ni documental, porque su alcance está confinado a
pantalla interna. No se toca en F1.

**Capa:** motor de cálculo (`src/lib/calculo-diagnostico.ts`), superficie
interna. **Bloque de corrección:** ninguno asignado — decisión de negocio.

### E-25 · NORMATIVO (nuevo, 2026-08-31, BV4 F1-preflight) · `COMISIONES_PLATAFORMA_DEFECTO`: son 11 entradas, no 9, y a diferencia de E-24 sus valores SÍ llegan a documento de cliente

**Hallazgo:** `src/lib/canales.ts:146` define `COMISIONES_PLATAFORMA_DEFECTO`
con **11 entradas** —no 9, como decía la observación original—:
`tiendanube_inicial`, `tiendanube_esencial`, `tiendanube_impulso`,
`shopify_basic`, `shopify_grow`, `shopify_advanced`, `shopify_plus`,
`woocommerce`, `empretienda`, `tiendanube_escala`, `tiendanube_evolucion`.
Las 11 llevan `verificado: false` y `provisional: true`, con
`fuente: "benchmark_provisional_pendiente_verificacion"`. Dos de ellas
(`tiendanube_escala`, `tiendanube_evolucion`) tienen además `comision: null`
por negociarse comercio por comercio, y el código las retiene en vez de
sumarlas como cero (guard explícito en `comisionEfectivaCanal`).

**Alcance documental, que el prompt de F1 dejaba pendiente de verificar:
verificado — SÍ llega, y es la diferencia sustantiva con E-24.**
`entradaPlataforma(cfg, d)` arma su tabla como
`{ ...COMISIONES_PLATAFORMA_DEFECTO, ...(cfg.comision_plataforma ?? {}) }`:
si la configuración en base no trae override, el benchmark sin verificar es
el que se usa. Para `tienda_propia` sin `comision_pct` declarada por el
cliente, `comisionEfectivaCanal` devuelve ese valor marcado
`provisional: true`, y de ahí entra al margen por producto
(`calculo-diagnostico.ts:714`, `755`, `margenesExactos`), que alimenta las
fugas marcadas `usa_margen: true` y, a través de ellas,
`oportunidad_total` / `oportunidad_conservadora`
(`calculo-diagnostico.ts:1686-1687`) — las cifras que el documento de
cliente publica como titular. La resolución sí queda etiquetada como
provisional en el objeto, pero el número viaja.

**Resolución:** queda como decisión de negocio de Matías —verificar las 11
comisiones contra liquidaciones reales y cargarlas en `configuracion`, o
decidir que el documento explicite su carácter provisional donde hoy no lo
hace—. No se toca en F1. Se registra aparte del caso E-24 justamente porque
el alcance verificado es distinto: aquel se queda en pantalla interna, este
llega al cliente.

**Capa:** motor de cálculo (`src/lib/canales.ts`,
`src/lib/calculo-diagnostico.ts`) con superficie documental.
**Bloque de corrección:** ninguno asignado — decisión de negocio.

### E-26 · NORMATIVO (nuevo, 2026-08-31, BV4 F1-preflight) · Planitud tipográfica en los artefactos del 2026-08-28: confirmada en pdf-v2 como escala de rango corto y sin jerarquía dentro de `metric-grid`

**Hallazgo:** en los PDFs auditados el 2026-08-28 (generados con el motor
**v2** activo, portadas marcadas "v2") once métricas aparecen con el mismo
peso visual. Verificado contra `src/documents/renderers/pdf-v2/document.tsx`
—no contra v1, como advertía el prompt de F1—, la observación se confirma,
con los números reales de pdf-v2:

- `PROFILES_V2.pantalla.escala` (línea 127): `titulo: 22`, `subtitulo: 10`,
  `label: 9`, `valor: 17`, `valorGrande: 30`, `badge: 8`, `nota: 8.5`,
  `pie: 8`.
- `PROFILES_V2.impresion.escala` (línea 145): `titulo: 18`, `subtitulo: 9.5`,
  `label: 9.5`, `valor: 15`, `valorGrande: 24`, `badge: 8`, `nota: 9`,
  `pie: 8`.
- El bloque `metric-grid` (líneas 1161-1183) renderiza **todos** sus ítems
  como `cardLabel` + `ValorTexto`, es decir el mismo `e.valor` para cada
  uno: no hay ninguna variante de destaque dentro del bloque.
- `valorGrande` existe pero sólo se usa en tres lugares, ninguno de ellos
  `metric-grid`: `commercialSummaryNumber` (469),
  `commercialSummaryRange` (470, `-6`) y
  `scenarioMetricValuePrimary` (452, `-12`).

Los valores de puntos citados en la primera versión de la auditoría de
rebranding (título 25 pt, cuerpo 7,5–14 pt) provenían de v1 y quedan
reemplazados por los de arriba.

**Resolución:** es un hallazgo de diseño tipográfico del motor v2, no un
defecto funcional. Su corrección —ampliar el rango de la escala y dar al
`metric-grid` una jerarquía interna (métrica principal vs. secundarias)—
pertenece a F3, la migración visual de pdf-v2 al tema nuevo. No se toca en
F1, que sólo lee pdf-v2 para inventariarlo.

**Capa:** escala tipográfica de `renderers/pdf-v2/document.tsx`.
**Bloque de corrección:** F3.

### E-27 · CONTRADICHO (nuevo, 2026-08-31, BV4 F1-preflight) · "Ausencia de iconografía": pdf-v2 sí tiene iconografía vectorial; el hallazgo se conserva con la discrepancia anotada

**Hallazgo tal como se levantó:** cero iconografía en los artefactos del
2026-08-28.

**Realidad verificada en pdf-v2, que contradice la observación:**
`src/documents/renderers/pdf-v2/document.tsx` tiene iconografía vectorial
real, dibujada con `@react-pdf/renderer`:

- `IconCircle` (líneas 700-735) dibuja cinco íconos en `<Svg width={12}
  height={12} viewBox="0 0 12 12">` con `<Circle>` y `<Path>`, uno por
  cada `kind`: `conservador`, `base`, `potencial`, `tienda`, `marketplace`.
  Se consume en las líneas 956 (escenarios), 1195 (tienda) y 1203
  (marketplace).
- `PrioridadBadge` (753-760) imprime
  `{ICONOS_PRIORIDAD[prioridad]} {LABELS_PRIORIDAD[prioridad]}`, con los
  glifos `▲` / `●` / `▽` definidos en
  `src/documents/semantica-v2/etiquetas.ts:21`.
- Hay además tres capas `<Svg>` de gradiente y acento en portada y
  transiciones (1570, 1622, 1687).

**Resolución:** la evidencia del artefacto se conserva —a 12 pt sobre una
página de 960×540 los íconos son, en la práctica, casi invisibles, y esa
lectura del auditor es legítima—, pero la causa registrada es incorrecta: no
es ausencia de iconografía sino iconografía subdimensionada y sin peso
gráfico. La corrección pertenece a F3, y su punto de partida es el existente,
no un sistema desde cero. El sistema de objetos de marca (prisma, barras,
diana, rayo) que F1 incorpora al repositorio en su etapa 4 es el material
previsto para esa corrección.

**Capa:** iconografía de `renderers/pdf-v2/document.tsx`.
**Bloque de corrección:** F3.

### E-28 · PARCIALMENTE CONTRADICHO (nuevo, 2026-08-31, BV4 F1-preflight) · "Columna única en apaisado": el perfil `pantalla` usa 2 y 3 columnas; la columna única es real pero acotada a cinco bloques y al perfil `impresion`

**Hallazgo tal como se levantó:** columna única en apaisado, observada en los
artefactos del 2026-08-28.

**Realidad verificada en pdf-v2:** el perfil apaisado **sí** usa multicolumna
en los bloques principales. `PROFILES_V2.pantalla` (líneas 133-136) declara
`colsMetricGrid: 3`, `colsFindings: 2`, `colsScenarios: 3`,
`colsServices: 2`, con `monthlyStacked: false`. El que colapsa a una columna
es `impresion` (líneas 175-181): `colsMetricGrid: 2`, `colsFindings: 1`,
`colsScenarios: 1`, `colsServices: 1`, `monthlyStacked: true` — decisión
documentada en el propio archivo, tomada en la ronda 2.1 (C2) porque tres
tarjetas de escenario no entran en una fila de A4 sin colisionar.

Lo que sí es columna única **en ambos perfiles**, por construcción y no por
perfil, son cinco bloques que no pasan por la grilla de columnas: `roadmap`
(1423), `restrictions` (1496) y `restrictions-grouped` (1507), armados como
`View` apilados; y `commercial-offer` (1461) y `methodology` (1518), hijos
directos de `cardGrid`, que es `{ flexDirection: "column", gap: 10 }`
(línea 310).

**Resolución:** el hallazgo se conserva con la evidencia del artefacto y esta
acotación. Su alcance real es "cinco bloques sin grilla, en los dos perfiles"
más "el perfil `impresion` colapsado a una columna por restricción de ancho
de A4", no "el apaisado es de columna única". La revisión pertenece a F3, y
debe respetar la razón registrada de la decisión C2 en `impresion`.

**Capa:** estructura de página de `renderers/pdf-v2/document.tsx`.
**Bloque de corrección:** F3.

### Reconciliación de identificadores (actualización 2026-08-31, BV4 F1-preflight)

- **Antes de esta corrección:** 41 identificadores (E-01 a E-21 = 21;
  C-01 a C-08 = 8; R-01 a R-12 = 12). Último ID registrado verificado en el
  archivo vivo: **E-21, línea 697** — coincide con lo que preveía el prompt
  de F1, así que la serie E-22..E-28 se escribe sin correrse.
- **Después de esta corrección:** 48 identificadores (E-01 a E-28 = 28;
  C-01 a C-08 = 8, sin cambios; R-01 a R-12 = 12, sin cambios). E-22 nace y
  cierra en el mismo preflight (script corregido; la verificación de arranque
  queda condicionada a una acción de entorno que no es del repositorio).
  E-23 y E-27 se registran **contradichos** por la verificación contra el
  código, y E-28 **parcialmente contradicho**: los tres conservan la
  observación original y la evidencia del artefacto, con la discrepancia
  anotada, siguiendo el mismo criterio de no reescritura que este documento
  ya aplicó a E-19/E-20. E-24 y E-25 quedan como decisiones de negocio de
  Matías, con su alcance documental ahora verificado y distinto entre sí.
  Ningún identificador se elimina. No existe ningún "E-26 ligaduras": esa
  observación se descartó antes de recibir ID y no ocupa lugar en la serie.

`docs/visual/matriz-hallazgos.md` sigue sin actualizarse — E-22 a E-28 son
hallazgos muy posteriores a su alcance original (2026-08-23), igual que
E-19/E-20/E-21.
