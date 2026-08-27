# Handoff — Bloque 3 Funcional (2026-08-27)

HEAD de partida `7caa9bbb3025bb195689f67331f915f9cdb59434` (cierre de
Bloque Visual 2.2.3). HEAD candidato final `84e2e8ce22f77fb84df95154a509a718ffd0d070`,
pusheado a `feat/noche-continuacion`, HEAD local y remoto verificados
idénticos. **Veredicto: APROBADO** (auditoría interna, 24/24 criterios,
dos rondas — segunda ronda tras una corrección cosmética, ver sección 19).

## 1 · Resumen ejecutivo

Bloque 3 Funcional cierra el contrato de estados de dos ejes (D4),
DHB-1/2/3, DA-1 a DA-4 y el bloqueo real de exportación (D1) sobre el
prototipo `velocentum-v2` — plantillas, renderers PDF/web y capa
semántica compartida, en paralelo a `velocentum-v1` (que sigue siendo lo
único que produce producción). Sobre ese trabajo corrieron dos rondas de
corrección (R-03 y sus AJUSTES) que encontraron y resolvieron tres
regresiones visuales reales, dos checks unilaterales, una pieza sin
cobertura de artefacto y un defecto de copy — todo documentado con
verificación de falsabilidad, no sólo "se corrigió y quedó en verde".

## 2 · Alcance y árbol de commits

```
7caa9bb  Handoff ronda 2.2.3 (HEAD de partida)
5fee10c  Bloque 3 Funcional: contrato, estados D4, DHB-1/2/3, DA-1 a DA-4, bloqueo de exportación
75a2643  R-03: corrige tres regresiones visuales reales (H1/H2/H3)
bcd338e  AJUSTES a R-03: checks presencia/ausencia, H2 en pantalla (H2b), muestra visual,
         reconciliación de páginas, H1.5 implementado, noveno caso QA, L13, typo
84e2e8c  Corrección de la auditoría interna: comentario desactualizado (48→54 PDFs)
```

34 archivos tocados en total, todos bajo `src/documents/`,
`src/lib/fixtures-escenarios-demo.test.ts` (una línea de allowlist),
`docs/funcional/` y `docs/plan-maestro-fases.md` (reconciliación
documental). Cero archivos de CI/deploy, DB, secretos o rutas/UI real
— verificado en la sección 19.

## 3 · D4 — matriz de estados de dos ejes

**Eje 2 (`ValorPublicable`, disponibilidad del cálculo):** 4 estados
(`calculado`/`retenido`/`evidencia_faltante`/`no_aplica`), copy literal
en `semantica-v2/estado.ts` (`textoEstadoV2`). `evidencia_faltante` es
el estado nuevo — separa "falta un dato de entrada" de "retenido por
regla de negocio" (antes ambos colapsaban en `retenido`).

**Eje 1 (`Evidencia`, origen)**: 5 estados
(`verificado`/`declarado`/`estimado_configuracion`/`no_disponible`/
`no_aplica`), copy literal (`textoOrigenV2`). `estimado_configuracion`
se agregó al tipo por exigencia de D4 pero no tiene call site activo
hoy (documentado como tal, no forzado).

Ver contrato sección 1 para la matriz completa call-site por call-site.

## 4 · D1 — bloqueo de exportación

Punto nuevo y exclusivo de v2 (`renderers/pdf-v2/exportacion.ts`),
nunca conectado a ninguna interfaz real. Gate: `kind === "propuesta"` Y
selección comercial no confirmada (vía el campo `pendiente` del bloque
`commercial-offer`, ya garantizado equivalente a
`comercial === null || niveles.length === 0`). Mensaje exacto:
"Selección comercial pendiente: no se puede exportar una propuesta sin
selección comercial confirmada." La vista previa interna se construye
siempre, pendiente o no. `renderers/pdf/export-client.ts` (v1 real) sin
tocar.

## 5 · DHB-1 — inversión declarada en $0

`merTienda`/`merMarketplace`/`roasProductAds` con inversión declarada
exactamente $0 → `no_aplica` (nunca `evidencia_faltante` ni
`retenido`), y el cero declarado se mantiene visible en
`context.evidencia[...]` como `{estado: "declarado", valor: 0}` — para
las TRES métricas, verificado con presencia real (AJUSTES ítem 2,
sección 11).

## 6 · DHB-2 — propuesta cualitativa con margen negativo

Disparador: `margen_bloqueado` o hallazgo `margen_negativo` presente.
Siete piezas, todas trazables a datos ya existentes (alerta, explicación
fija, hallazgos de servicio, prioridades/servicios sin monto, plan de
validación, próximos pasos, estado de selección comercial) — ninguna
inventada. `commercial-summary` numérico NUNCA se renderiza en modo
cualitativo. La alerta (pieza 1+2) se verifica VISIBLE con contraste
real (no sólo presente en el stream de texto — ver sección 10, H1). L13
(AJUSTES): la frase de cierre ya no lee como si todo el trabajo
estuviera en suspenso — ahora dice explícitamente que lo retenido es la
proyección económica, no el trabajo.

## 7 · DHB-3 — roadmap 30/60/90 determinístico

Sólo con `comercial !== null`. Fuentes: hallazgos priorizados,
servicios seleccionados, restricciones. Reparto fijo: alta+servicio→30,
media+servicio→60, servicio sin hallazgo alta + restricciones→90. Cada
acción es literal (título de hallazgo o nombre de servicio), nunca
redactada. Hasta el cierre de R-03/AJUSTES esto sólo tenía cobertura de
PRUEBA unitaria (`roadmap-dhb-3.test.ts`, fixtures sintéticas) — cero
cobertura de ARTEFACTO real, porque ningún caso QA original tenía
selección confirmada (ver sección 13). Resuelto con el noveno caso
(sección 15).

## 8 · DA-1 a DA-4

- **DA-1**: origen (Eje 1) visible sólo donde el origen es inequívoco
  (`metric-grid`: facturación/ticket; `coverage`: canales/productos) —
  nunca en findings/scenarios, nunca inventando una regla de colapso
  para múltiples orígenes.
- **DA-2**: `servicioId` (string libre) → `servicioIds: string[]`,
  siempre filtrado contra el catálogo cerrado de 6 servicios vía
  `serviciosCanonicosDe`. Cero ids inventados, cero repetidos.
- **DA-3**: título de la sección de hallazgos alineado a su contenido
  real ("Hallazgos priorizados", ya no promete funnel/retención que no
  construye).
- **DA-4**: fortalezas determinísticas, sólo para 2 de 5 dimensiones
  del motor (`economia`, `funnel_web` — las únicas que exponen métrica
  Y umbral como campos de `derivados`); las otras 3 quedan
  explícitamente sin resolver, documentado, no fabricado.

## 9 · Preservación de v1 (S16) — anclajes Snake Store / Titan Web B1

Al escribir S16 se encontraron TRES regresiones reales de dominio
compartido que alteraban la salida real de v1 sin que ninguna prueba
existente lo detectara (roadmap poblándose de verdad, DHB-1 cambiando
`retenido`→`no_aplica`, confianza de escenario recalculada) —
corregidas mecánicamente en el único borde real de producción de v1
(`buildDocumentModelDesdeDiagnostico`). Verificado con 4 pruebas sobre
`casoSnakeStore`/`casoTitanWebB1` — las mismas dos ejecutadas como
"anclajes" en la auditoría final (sección 19, criterio 11): 4/4 en
verde, re-verificado independientemente dos veces.

## 10 · R-03 — tres hallazgos visuales reales, con verificación permanente

Encontrados por inspección visual externa, no por ningún check
automático — la resolución vinculante R-03 corrigió dos diagnósticos
iniciales incorrectos antes de que se arreglara nada.

- **H1** — título invisible: `commercial-summary` cualitativo en
  pantalla pintaba el título con `theme.colors.ink` (oscuro) sobre
  fondo oscuro. Preexistente al bloque, activado por DHB-2. Fix:
  `titleDark` (color claro condicional). Verificado con color REAL
  extraído vía `getOperatorList` (no `getTextContent`, que no ve
  color).
- **H2** — página sin contenido / desborde de footer: `CardGrid`
  compartido por metric-grid/services/findings/strengths envolvía cada
  fila SIN `wrap={false}` en el contenedor — dos síntomas de la misma
  causa según perfil (pantalla: footer superpuesto sin cortar página;
  impresión: corta a una página nueva que no re-renderiza el
  contenido). Fix: `wrap={false}` en el contenedor de fila, un solo
  lugar. Verificado revirtiendo el fix y reproduciendo exactamente el
  síntoma real.
- **H3** — mojibake: familia "diamante" (◆◇♦⬥) rota vía Satoshi Bold en
  `@react-pdf/renderer` — cada codepoint resolvía a basura distinta
  (Æ, Ç, f, %). Fix: sustitución sistemática a `■` vía la única
  constante compartida (`PERSONALIDAD_POR_DOCUMENTO`), no un parche
  puntual.

Generador (`generar-pdfs-bloque-3.test.ts`) incorporado permanentemente
al repo — decisión consciente, no acoplamiento silencioso (resuelve la
prueba huérfana del worktree, ver sección 12).

## 11 · AJUSTES a R-03 — checks presencia/ausencia

Regla general: todo check derivado de una decisión cerrada verifica
PRESENCIA, no sólo ausencia. Clasificación de los 4 mínimos exigidos:

| Check | Estado antes | Corrección |
|---|---|---|
| DHB-2 | Sólo ausencia (cifra prohibida) | Agregado: título visible con contraste real (mismo punto ciego que H1) |
| DHB-1 | 1 de 3 sub-casos con presencia | Agregada la presencia faltante en merMarketplace/roasProductAds |
| DHB-3 | Ya balanceado | Sin cambios — ya exige coincidencia exacta + trazabilidad |
| D1 | Ya balanceado | Sin cambios — ya verifica el mensaje exacto del throw |

## 12 · AJUSTES a R-03 — prueba huérfana del worktree

`generar-pdfs-bloque-3.test.ts` vivía en un worktree pero no en el
árbol principal (752 vs. 753 pruebas) — rompía reproducibilidad.
Decisión: commiteada al candidato (no descartada), agregada al
allowlist de `fixtures-escenarios-demo.test.ts`. Verificado recreando
el worktree desde el candidato: mismo conteo de pruebas, misma
generación de los documentos reales.

## 13 · AJUSTES a R-03 — H2 en pantalla (H2b) y pérdida de contenido

El check de H2 original sólo cubría la firma de impresión (página con
sólo header). Se agregó H2b, específico de pantalla: detecta contenido
con baseline dentro de la franja del pie (`Footer` se pinta DESPUÉS del
contenido en el JSX de `ContentPage`, así que queda pintado encima).
Falsabilidad confirmó contenido REAL oculto ("Informado por el cliente;
pendiente de validación documental", y=10-20pt) — **pérdida de
contenido real, no cosmética.**

## 14 · AJUSTES a R-03 — muestreo visual determinístico

30 páginas inspeccionadas (una por tipo de sección real × perfil, más
casos específicos para DHB-2/roadmap). Cero defectos nuevos. Hallazgo
real: ni `restrictions-grouped` ni `roadmap` se renderizaban en ninguno
de los 8 casos QA originales — `comercial` siempre `null` (resuelto con
el noveno caso, sección 15). Hallazgo colateral fuera de alcance:
`context.servicios[].alcance` siempre vacío en el pipeline real
(reportado, no corregido — decisión de producto pendiente).

## 15 · Cierre — H1.5, noveno caso QA, L13, typo

- **H1.5** (aprobado con condiciones): la página de alerta cualitativa
  (~85% vacía) se centra verticalmente dentro de una tarjeta
  `cardAlerta` (ya aprobada, reutilizada sin tokens nuevos). Gate
  exacto (`section.blocks.length === 1 && blocks[0].type ===
  "bridge-note"`), probado imposible de disparar fuera de la sección
  qualitativa (único par de productores de ese tipo de bloque). Check
  falsable propio: relleno de tarjeta presente + contraste ≥4,5:1,
  ambos perfiles, falsabilidad verificada.
- **Noveno caso QA "confirmada"**: pipeline real sobre `casoSnakeStore`
  (fixture de regresión, no demo) con una escalera de paquetes
  confirmada armada a mano. Ejercita `restrictions-grouped` y roadmap
  (etapas 60/90 reales; 30 vacía a propósito, sin hallazgo alta
  disponible) por ARTEFACTO real, no sólo por prueba — L7/L14 cubiertos.
  54 PDFs, 376 páginas totales (+47 exactas, sólo el caso nuevo).
- **L13**: sólo la frase de cierre de la alerta DHB-2 ajustada — lo
  retenido es la proyección económica, no el trabajo. Resto intacto.
- **Typo**: `Origen: {item.origen}` interpolaba el enum crudo en vez de
  `LABELS_ORIGEN_SUPUESTO` — afectaba los 4 valores, no sólo el acento.
  Alineado con `web-v2` (que ya lo hacía bien).

## 16 · Pruebas modificadas — inventario completo y verificación de falsabilidad

**Bajo la resolución D4 (alcance explícito, ya autorizado):**
- `build-context.test.ts`: 2 asserts reclasificados
  `retenido→evidencia_faltante` (ROAS Product Ads sin ventas
  atribuidas; precio de nivel sin cargar) — cita la sección 1 del
  contrato, igual de específicos que antes.

**Mecánicas, forzadas por tipo (`servicioId→servicioIds`):**
- `validation.test.ts`, `templates/velocentum-v1/test-fixtures.ts` (×2
  call sites).

**Bajo R-02 (ya autorizado en su propia ronda):**
- `ronda-2.2.2-correcciones.test.ts`: "margen negativo" sacado de un
  array genérico, reemplazado por un test dedicado más estricto
  (verifica ausencia Y presencia, ambos perfiles).

**Nuevas, agregadas esta ronda (no modifican ninguna existente):**
`exportacion.test.ts`, `roadmap-dhb-3.test.ts`, `s8-nota-reinversion.test.ts`,
`c-08-perfil-a4.test.ts`, `dhb-2-margen-negativo.test.ts` (S12 + AJUSTES
+ H1.5), `bloque-3-contrato.test.ts` (S1-S14), `build-document.test.ts`
(S16), `generar-pdfs-bloque-3.test.ts` (H1/H2/H2b/H3).

**Falsabilidad demostrada** (revertir el fix → confirmar la falla
exacta → restaurar) para: H1 (título), H2 (`cardRow wrap`), H3 (glifo),
DHB-2 (contraste de la pieza 1), H1.5 (tarjeta + contraste). Ningún
umbral relajado para hacer pasar algo.

## 17 · Artefactos y estructura del ZIP

`velocentum-bloque-3-funcional-revision.zip`:
```
docs/
  contrato-bloque-3.md
  handoff-bloque-3.md
pdfs/
  <9 casos>/
    diagnostico-{pantalla,impresion}.pdf
    proyeccion_90d-{pantalla,impresion}.pdf
    propuesta-{pantalla,impresion}.pdf
roadmap/
  restricciones-{pantalla,impresion}-7.png   (caso "confirmada", p7)
  roadmap-{pantalla,impresion}-8.png         (caso "confirmada", p8)
```
54 PDFs (9 casos × 3 documentos × 2 perfiles). La carpeta `roadmap/`
trae los rásters de la única prueba de artefacto real de DHB-3 (sección
15) — antes de esta ronda no existía ningún PDF real con esas dos
secciones pobladas.

## 18 · Determinismo y reproducibilidad

Candidato regenerado 3 veces de forma independiente desde 2 worktrees
limpios distintos (uno por cada candidato: `bcd338e` y el final
`84e2e8c`) — hashes SHA-256 de los 54 PDFs idénticos en las 3
corridas. `npm run typecheck`, `npm run test -- --run` (765 passed + 1
todo) y `npm run build` limpios, re-verificados de forma independiente
en cada worktree.

## 19 · Auditoría interna — 24 criterios

Dos rondas. Primera ronda sobre `bcd338e`: 24/24 PASS, un hallazgo
cosmético (comentario de `fixtures-escenarios-demo.test.ts` decía "48
PDFs", el generador ya produce 54 — sin impacto funcional). Corregido
en `84e2e8c`. Segunda ronda — auditoría COMPLETA de nuevo sobre el HEAD
corregido, no una verificación puntual: 24/24 PASS, sin hallazgos
nuevos. Cada criterio verificado con un comando real ejecutado en un
worktree limpio (no lectura pasiva de código):

1. D1 — gate equivalente probado + 5/5 tests. 2-3. D4 — copy literal
confirmado por lectura directa. 4. DHB-1 — 3/3 sub-casos con presencia.
5. DHB-2 — 8/8 tests, L13 confirmado. 6. DHB-3 — 4/4 + artefacto real.
7. DA-1 — S14 2/2. 8. DA-2 — catálogo cerrado confirmado en código +
test. 9. DA-3 — título correcto. 10. DA-4 — determinístico, 2/5
dimensiones. 11. S16 — 4/4 anclajes. 12. Aislamiento — 9/9 + comentario
corregido verificado. 13-14. Fixtures/motor — 0 líneas de diff. 15. Sin
pruebas debilitadas — 4 líneas de eliminación, las 4 re-derivadas y
confirmadas legítimas. 16-18. H1/H2/H2b/H3 — contraste real, ambos
perfiles, barrido sistemático. 19-20. Presencia + H1.5 — gate con 2
únicos productores posibles. 21. Determinismo — 3ª corrida
independiente idéntica. 22. Reproducibilidad — re-verificada. 23. Cero
invención — hallazgoId real confirmado por cálculo independiente. 24.
Alcance — diff acotado, cero rutas usan v2.

## 20 · Estado final y restricciones vigentes

**Push completado**: `84e2e8c` en `feat/noche-continuacion`, HEAD local
y remoto verificados idénticos. **No se integró a `main`, no se
publicó, no se desplegó, no se promovió v2 sobre v1** (v1 sigue siendo
lo único que produce producción). H1.5 fue la única pieza que requería
aprobación explícita antes de implementarse — se aprobó con condiciones
y se implementó dentro de esas condiciones, sin extender el gate ni
agregar iconografía/motivo nuevos. Pendiente, fuera de alcance de este
bloque, documentado pero no decidido: qué debería mostrar
`context.servicios[].alcance` para casos reales (sección 14); la
tensión de mensaje en el caso L13 entre la alerta de la pieza 1 y un
paquete/roadmap ya confirmados más adelante en el mismo documento
(reportada, sección 6 del contrato, no corregida sin aprobación). La
promoción de v2 sobre v1 sigue sin ejecutarse — ninguno de sus 6
criterios (contrato sección 8) corrió en este bloque.
