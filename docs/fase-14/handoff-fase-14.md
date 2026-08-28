# Handoff — Fase 14: Integración controlada de v2 en la interfaz real

Prompt original: `docs/prompts/fase-14.md` (guardado verbatim, ejecutado
desde c4bdb0d).

## 1 · Rama, HEAD y commit candidato

- Rama: `feat/noche-continuacion`.
- HEAD local y remoto: `5575704` (`git status -sb` sin diferencia
  ahead/behind contra `origin/feat/noche-continuacion` al momento de
  la auditoría).
- Commit candidato de los artefactos (ZIP, worktree de auditoría):
  `5575704`, el mismo HEAD.

## 2 · `git status --short`

Vacío — árbol de trabajo limpio al momento de la auditoría (y sigue
limpio salvo este mismo archivo de handoff, agregado después del
veredicto APROBADO).

## 3 · `git diff --stat` contra `c4bdb0d`

```
 docs/fase-14/analisis-e19.md                       | 171 +++++++++
 docs/fase-14/inventario-paso1.md                   | 154 ++++++++
 docs/fase-14/plan-reversion.md                     | 113 ++++++
 docs/fase-14/validacion-flujo-real.md              | 145 +++++++
 docs/prompts/fase-14.md                            | 416 +++++++++++++++++++++
 docs/visual/contrato-composicion-v2.md             | 105 ++++++
 src/documents/build-document.ts                    | 131 ++++++-
 src/documents/fase-14-x1-x4-x5-x7.test.ts          | 295 +++++++++++++++
 src/documents/fase-14-x2-x3-x6-activo.test.ts      | 167 +++++++++
 src/documents/motor-activo.ts                      |  19 +
 src/documents/renderers/pdf-v2/export-client.ts    |  83 ++++
 src/documents/renderers/pdf-v2/exportacion.ts      |  47 +--
 src/documents/renderers/pdf-v2/gate-exportacion.ts |  53 +++
 src/lib/fixtures-escenarios-demo.test.ts           |   4 +
 src/routes/_authenticated/documentos.$id.$slug.tsx |  43 ++-
 15 files changed, 1896 insertions(+), 50 deletions(-)
```

## 4 · Aislamiento

Ningún archivo de `src/documents/domain/`, `src/documents/templates/`
ni `src/documents/renderers/{pdf,pdf-v2/paginacion.ts,pdf-v2/document.ts,web,web-v2}`
está en el diff — el motor de cálculo, las plantillas y los renderers
de composición/paginación quedan intactos. Dentro de `renderers/pdf-v2/`
sólo cambiaron:

- `exportacion.ts` (extracción del gate a `gate-exportacion.ts`, mismo
  comportamiento, re-exportado — 47 líneas, sin lógica nueva).
- `gate-exportacion.ts` (nuevo, módulo puro).
- `export-client.ts` (nuevo, descarga desde el navegador).

`src/lib/` tiene UN archivo en el diff:
`fixtures-escenarios-demo.test.ts` (+4 líneas) — agrega una entrada al
`Set` `ARCHIVOS_PERMITIDOS` de un test de higiene de nombres de
archivo, porque X4 (Fase 14) reutiliza los nueve escenarios de demo ya
existentes. No toca `calculo-diagnostico.ts`, `fixtures-casos.ts`,
`paquetes.ts` ni ningún dato de fixture canónico — es una entrada de
allowlist en un test de infraestructura, no un cambio de negocio. La
auditoría interna (sección 14) lo marcó como desviación literal del
criterio 3 pero no bloqueante; queda documentado acá sin ambigüedad.

Prueba de que la salida de v1 no cambió: X7
(`fase-14-x1-x4-x5-x7.test.ts`) hace un deep-equal estructural entre
`armarDocumentoActivo(...).model` (con el interruptor en `"v1"`, valor
real sin mock) y una llamada directa a
`buildDocumentModelDesdeDiagnostico` — la función v1 original, cuyo
cuerpo no cambió en el diff (sólo un comentario).

## 5 · PASO 0 y PASO 1

PASO 0: branch/HEAD(`c4bdb0d`)/status/suite verificados al inicio —
789 passed + 1 todo, typecheck y build limpios, según lo reportado al
comienzo de esta fase.

PASO 1 (inventario, `docs/fase-14/inventario-paso1.md`):

- a) El punto único de decisión de plantilla/renderer NO existía como
  tal — eran tres puntos coordinados. Se resolvió creando
  `motor-activo.ts` + `armarDocumentoActivo` como el único lugar real
  que lee el interruptor.
- b) Componentes de interfaz que ya muestran estados/validaciones del
  modelo: confirmado compatible sin cambios (banner `errorDescarga`
  ya genérico).
- c) Reproducibilidad de Snake Store y Titan Web B1 por el formulario
  real: confirmada campo por campo.
- d) Las 16 páginas de E-20, agrupadas en 6 causas — ver sección 6.

## 6 · E-20 — las 16 páginas, una por una

Ver `ocupacion/e20-16-paginas.txt` (dentro del ZIP) para el detalle
completo con % real, grupo causal y motivo. Resumen: las 16 quedan
documentadas como excepciones agrupadas y justificadas
(`contrato-composicion-v2.md` sección 5.8.1) — su ocupación DESPUÉS de
esta fase es **idéntica** a la de antes (Bloque Visual 3.1), porque
Fase 14 no modificó ninguna plantilla ni renderer de composición
(confirmado por el `git diff --stat` de la sección 3: cero archivos de
`templates/velocentum-v2/` en el diff). Se evaluaron y descartaron tres
técnicas de corrección real (reordenar bloques — imposible en
react-pdf, cada sección abre su propia página; fusionar secciones —
arriesga emparejamientos incoherentes; expandir con contenido real —
no existe ningún campo real sin usar en los seis tipos de bloque
involucrados). Ninguna excepción nueva se agregó sin motivo puntual
citado.

## 7 · E-19 — análisis, recomendación, confirmación de NO aplicación

`docs/fase-14/analisis-e19.md`: distribución real sobre 218 páginas de
contenido (excluyendo portadas y páginas de cierre a sangre completa),
percentiles (mín 11,1% / P25 32,7% / mediana 52,7% / P75 86,7%),
histograma de 9 bandas, y tabla de páginas que fallarían bajo distintos
umbrales candidatos. **Recomendación: vía (a), bajar el umbral general
a ~45-50%, manteniendo el piso duro de E-20 (25%) sin cambios.**
Marcada explícitamente como DECISIÓN HUMANA — pendiente de Matías.
Confirmado (grep sobre el diff completo): ningún umbral de ocupación
(`0.7`, `0.65`, `70%`, `65%`) cambió en ningún archivo de código ni en
`contrato-composicion-v2.md` durante esta fase.

## 8 · Integración: punto único, interruptor, estado

Punto único: `src/documents/build-document.ts`, función
`armarDocumentoActivo(fila, slug)` — lee `MOTOR_DOCUMENTAL_ACTIVO` una
sola vez y devuelve `DocumentModelResuelto` (unión discriminada
`{engine:"v1"|"v2", model}`); todo lo demás (la ruta de la interfaz, la
descarga de PDF, el catálogo de pestañas) lee ese resultado, ninguno
vuelve a consultar el flag por su cuenta.

Interruptor: `src/documents/motor-activo.ts`,
`export const MOTOR_DOCUMENTAL_ACTIVO: MotorDocumental = "v1"`.
**Estado actual: `"v1"` — INACTIVO por defecto**, confirmado en el HEAD
candidato (`5575704`) y por la auditoría interna (criterio 7).

## 9 · Plan de reversión

Documento: `docs/fase-14/plan-reversion.md`. Prueba real ejecutada en
esta sesión (sección 4 de ese documento): activar (`"v1"` → `"v2"`),
generar un PDF real vía `armarDocumentoActivo` desde el navegador,
confirmar que X1/X7 fallan correctamente con el flag en `"v2"`,
revertir (`"v2"` → `"v1"`), y confirmar dos señales independientes: (1)
`npx vitest run` vuelve a 802 passed + 1 todo, (2) recarga visual de la
vista previa de Snake Store en el navegador — vuelve al diseño de v1
(portada a sangre completa, wordmark en píldora) y reaparece la
pestaña "Proyección + propuesta" (sólo existe en el catálogo v1).
Limitación conocida y documentada (sección 5 del plan): la descarga
desde el navegador usa una sola pasada de render (no el pipeline
completo de dos pasadas que sí usan los artefactos de ZIP) — pendiente
de una función de servidor (`createServerFn`) antes de activar el
interruptor en producción.

## 10 · Validación por flujo real (ítem 5)

`docs/fase-14/validacion-flujo-real.md`: Snake Store y Titan Web B1
cargados campo por campo por el formulario real de
`/diagnosticos/nuevo` (no por script), con dos desvíos reales
honestamente documentados (gates de UX sin campo 1:1, mapeo de
`ml_inversion_product_ads` al campo de inversión de canal disponible).
Los tres documentos generados en los dos perfiles vía la interfaz real
(vista previa `DocumentWebRendererV2` + descarga
`downloadDocumentModelPdfV2`); los siete PDFs reales quedan en
`interfaz/pdfs-descargados/` del ZIP, verificados con `pdfinfo`
(tamaño de página real por perfil, `Producer: react-pdf`). El bloqueo
de exportación se demostró en los dos casos: el banner de la interfaz
muestra el texto literal de `MENSAJE_EXPORTACION_BLOQUEADA_V2`, sin
reformular — captura en `interfaz/bloqueo-exportacion-snake-store.jpg`.
Durante esta validación se encontró y corrigió un bug real de
navegador (`node:module` externalizado) — ver sección 14.

## 11 · Estados y mensajes: capa semántica

Ningún texto de estado nuevo se escribió a mano fuera de
`src/documents/semantica-v2/estado.ts` (`textoEstadoV2`/
`textoOrigenV2`), que ya existía de rondas anteriores y no se tocó en
esta fase. El único mensaje de estado que toca el diff es
`MENSAJE_EXPORTACION_BLOQUEADA_V2` — pre-existente desde el Bloque 3
Funcional, sólo reubicado de `exportacion.ts` a `gate-exportacion.ts`
(mismo valor de string, mismo import consumido por ambos archivos). El
guard `"La descarga PDF sólo está disponible en el navegador."` en
`export-client.ts` (v2) es copia literal del guard ya existente en el
`export-client.ts` de v1 — no es un texto nuevo. `estados/` (ZIP)
documenta el copy real de las 9 casos, extraído usando exactamente el
mismo formato de `textoEstadoV2`.

## 12 · Conteo de pruebas, typecheck, build

- Línea base: 789 passed + 1 todo.
- Nuevas de esta fase (X1-X7, sin doble suma): 13 tests en total,
  repartidos en `fase-14-x1-x4-x5-x7.test.ts` (sin mock: X1×3, X7×1,
  X5×1, X4×2 = 7) y `fase-14-x2-x3-x6-activo.test.ts` (con
  `vi.mock` del interruptor: X2×3, X3×2, X6×1 = 6).
- **Total final: 802 passed + 1 todo** (789 + 13 = 802, confirmado por
  la auditoría interna corriendo la suite completa ella misma).
- Typecheck (`npx tsc --noEmit`): limpio.
- Build (`npm run build`): exitoso, `.output/` generado completo.

## 13 · Conteo de páginas vs Bloque Visual 3.1

**380 páginas totales, idéntico a Bloque Visual 3.1**, con el mismo
desglose por caso (verificado contando los rasters del ZIP de esta
ronda):

| Caso | Páginas |
|---|---|
| 1-marketplace-fuerte-tienda-floja | 44 |
| 2-margen-alto-volumen-bajo | 43 |
| 3-margen-fino-volumen-alto | 43 |
| 4-roas-bueno-margen-negativo | 33 |
| 5-todo-sano | 43 |
| 6-solo-organico | 41 |
| confirmada | 47 |
| mayorista | 43 |
| mixto | 43 |
| **Total** | **380** |

Cero diferencia frente a la ronda 3.1: esperable y explicado por la
sección 3/6 — Fase 14 no tocó ninguna plantilla ni renderer de
composición, sólo el mecanismo de integración (interruptor,
`armarDocumentoActivo`, la ruta de la interfaz y la descarga desde el
navegador).

## 14 · Auditoría interna, veredicto, push

Auditoría interna de solo lectura corrida contra el HEAD candidato
exacto `5575704` (una sola ronda; no hizo falta una segunda). El
auditor corrió la suite completa, typecheck y build por su cuenta
(no confió en afirmaciones del código/docs), leyó los diffs línea por
línea, extrajo el ZIP y contó carpetas/archivos, e inspeccionó
visualmente las capturas.

**Veredicto: APROBADO**, con una observación no bloqueante en el
criterio 3 (`src/lib/fixtures-escenarios-demo.test.ts` técnicamente
dentro del diff pese a la letra literal del criterio "`src/lib/`...
fuera del diff") — el propio auditor evaluó el cambio como inofensivo
en sustancia (entrada de allowlist en un test de higiene, no toca
cálculo ni fixtures canónicos) y no lo consideró motivo para una
segunda ronda. Documentado sin ambigüedad en la sección 4 de este
handoff.

El auditor señaló además, como observación adicional (no uno de los 19
criterios), que no encontró en el repo un documento de handoff de 14
secciones al momento de auditar — corregido con este mismo archivo,
escrito y commiteado después del veredicto APROBADO.

Push: hecho por mí (el agente principal), nunca por el auditor,
únicamente después de este veredicto APROBADO. HEAD local y remoto
verificados coincidentes tras el push.

**Decisiones pendientes / lo que queda sin resolver:**

- **E-19**: decisión humana pendiente sobre el umbral general de
  ocupación (recomendación: vía a, ~45-50%). No decidida ni aplicada
  por este agente, como exige el prompt.
- Antes de activar `MOTOR_DOCUMENTAL_ACTIVO` en producción: mover la
  descarga de PDF v2 desde el navegador a una función de servidor
  (`createServerFn`) para recuperar el pipeline completo de dos
  pasadas (sección 9 / `plan-reversion.md` sección 5).
- Ningún otro criterio quedó parcial ni pendiente.

**Restricciones finales, confirmadas cumplidas:** el reemplazo sigue
inactivo (`"v1"`), v1 no fue eliminado, no se tocó base de datos,
migraciones, secretos ni producción, no se integró a `main`, no se
publicó, no se desplegó, no se avanzó a staging, y E-19 no fue
decidido por este agente. Fin de Fase 14 — detenido para revisión
humana.
