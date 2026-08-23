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

Resumen de hallazgos: **16 errores comprobados** (E-01 a E-16), **5
inconsistencias de contrato vigentes** — 4 normativas (C-01 a C-04) y 1
inferida (C-07); C-05 fue reclasificada como R-12 y C-06 fue retirada — y
**12 recomendaciones** (R-01 a R-12).

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

**C-01 · NORMATIVO** · El perfil A4 no existe como maquetación propia.
Según la auditoría externa, el tamaño de página del renderer PDF es una
constante única [960,540] y el CSS de impresión del renderer web declara
`@page 13.333in × 7.5in` con secciones de `min-height 7.5in` y salto de
página. Es decir: el "perfil impresión" sería la composición 16:9 paginada
a papel. CONFIRMAR O REFUTAR (V3). Decisión aplicable: D6.

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

## Notas de reconciliación de este bloque (2026-08-23)

Durante la verificación de código de este bloque se encontraron, además,
hechos relevantes que no tienen ID propio en el apéndice original pero que
afectan directamente a varios de los hallazgos de arriba. Se documentan
en `docs/visual/matriz-hallazgos.md` y en `docs/visual/contrato-estados.md`,
citados desde ahí, para no alterar la numeración original de este apéndice:

- El renderer PDF (`src/documents/renderers/pdf/document.tsx`) nunca
  renderiza la lista de "Supuestos" (`item.assumptions`) dentro del bloque
  `scenarios` — el renderer web sí lo hace. Esto localiza con certeza la
  causa raíz de E-13 (ver matriz).
- Varias divergencias de formato/copy entre el renderer PDF y el renderer
  web para el MISMO estado semántico (percent con decimales variables vs.
  fijos; "Sin datos" vs. "Retenido"; `item.capa` crudo vs. etiqueta
  traducida; badge de prioridad sin color propio en PDF pero sí en web).
  Ver matriz de hallazgos, fila de cada E correspondiente.
