# Handoff · ciclo implementación→auditoría · 21 de agosto de 2026

Auditoría retroactiva de los 5 bloques de la separación de impactos
económicos, con un auditor read-only independiente (subagente sin contexto
previo de la implementación) por cada bloque, siguiendo el protocolo
aprobado: máximo 3 rondas de corrección por bloque, corregir sólo lo
observado, re-auditar después de cada corrección.

## Estado del repositorio

- Rama: `feat/noche-continuacion`, pusheada a `origin/feat/noche-continuacion`.
- HEAD: `48fcebd`.
- `main` intacto (`92727e0`, igual en local y `origin/main`).
- Árbol de trabajo limpio. Sin Lovable, sin publicación, sin producción, sin
  base, sin migraciones, sin secretos tocados.

## Commits creados en este ciclo (además de los 5 bloques ya existentes)

| Commit | Descripción |
|---|---|
| `daddcbb` | Corrección bloque 1, ronda 1: `TipoImpacto` en el documento de decisión (agrega `no_clasificado`, ausente desde que el bloque 2 extendió el tipo real). |
| `2b72fbf` | Corrección bloque 2, ronda 1: guard rail `Number.isFinite` en `impactoCalculado` + documentación de las invariantes de diseño (tipo plano, array vacío vs. legado). |
| `48fcebd` | Corrección bloque 5, ronda 1: aserción del tope de ahorro vuelta incondicional (antes envuelta en un `if`) + aserción real de `roas_product_ads` que el nombre del test prometía y no verificaba. |

Ningún bloque necesitó una tercera ronda. El bloque 3+4 (el de mayor
tamaño y riesgo, 23 archivos) quedó **aprobado sin observaciones en la
primera ronda**.

## Veredicto del auditor por bloque

| Bloque | Commit(s) | Ronda 1 | Ronda 2 | Rondas usadas |
|---|---|---|---|---|
| 1 — Decisión + fixtures manuales | `87492f4` → `daddcbb` | APROBADO CON OBSERVACIONES (1 hallazgo) | **APROBADO** | 2/3 |
| 2 — Modelo tipado + compat. legada | `506efd8` → `2b72fbf` | APROBADO CON OBSERVACIONES (3 hallazgos, 2 documentales) | **APROBADO** | 2/3 |
| 3+4 — Cálculo separado + contrato documental | `206841c` | **APROBADO** (0 hallazgos) | — | 1/3 |
| 5 — Regresión de perímetros | `c10e198` → `48fcebd` | APROBADO CON OBSERVACIONES (2 hallazgos) | **APROBADO** | 2/3 |

### Detalle de los hallazgos y su resolución

**Bloque 1** — El documento de decisión (§2) declaraba `TipoImpacto` con
sólo 3 variantes, contradiciendo su propia §4 (compatibilidad legada) y el
fixture `FUGA_LEGADA_MANUAL`, que ya requerían una 4ª variante
`no_clasificado` (agregada al código real en el bloque 2, pero nunca
retrofiteada al documento). Corregido en `daddcbb`; re-auditado y
verificado textualmente contra `impacto-economico.ts`.

**Bloque 2** — Tres observaciones, todas no bloqueantes en origen: (1)
`ImpactoEconomico` es un tipo plano, no una unión discriminada — se
documentó la restricción de que sólo los constructores deben crearlo; (2)
un array vacío `impactos: []` se trata como "ya tipado" (no cae al
adaptador legado) — se documentó como decisión intencional, no como bug;
(3) `impactoCalculado` no validaba `Number.isFinite` en runtime — se
agregó un guard real que falla explícito ante `NaN`/`Infinity`, con test
dedicado. La re-auditoría confirmó que el guard es real (throw
incondicional antes de construir el objeto) y que ningún call-site
legítimo podía dispararlo (todos pasan por `Math.max(0, redondear(x,0) ??
0)`, siempre finito).

**Bloque 3+4** — Sin hallazgos. El auditor verificó los 10 puntos del
checklist de negocio (separación de magnitudes, facturación proyectada
nunca suma contribución/ahorro, máximo no suma en la consolidación de
ahorro, doble tope consistente, retención selectiva por margen/envío,
compatibilidad legada, Titan B2 intacto, sin render mensual nuevo) con
evidencia archivo:línea, y recalculó a mano al menos dos fixtures.

**Bloque 5** — Dos observaciones, una de las cuales resultó ser un falso
positivo del auditor de ronda 1: afirmó que con el fixture del test ambas
fugas (`gasto_no_rentable`, `sobrefragmentacion`) quedaban retenidas,
haciendo vacía la aserción del tope (envuelta en un `if`). Al corregir,
verifiqué empíricamente ejecutando el motor real con el `cfg` y fixture
exactos del archivo: **ambas fugas eran de hecho calculables**
(`margen_contribucion = 0.0095`), así que la aserción sí se ejecutaba. La
re-auditoría (ronda 2) confirmó esto de forma independiente (instrumentó
su propio archivo de depuración temporal, lo verificó, y lo borró). De
todos modos, la corrección quedó aplicada: `if` reemplazado por
`expect(fuga.calculable).toBe(true)` incondicional, que es una mejora de
robustez legítima independientemente de si la premisa original era
correcta (evita que la prueba pueda volverse silenciosamente vacía en el
futuro). La segunda observación (ROAS de Product Ads sin aserción, pese a
que el nombre del test lo prometía) era real y se corrigió agregando el
dato faltante (`ml_ventas_product_ads`) y dos aserciones nuevas.

## Pruebas, typecheck y build (estado final en HEAD)

```
npm test         # 299 passed | 1 todo (24 archivos)
npm run typecheck
npm run build
```

Los tres comandos quedaron limpios después de cada uno de los 3 commits de
corrección, no sólo al final. El único `it.todo` de toda la suite sigue
siendo el caso Titan B2 (`src/lib/regresion-2-6.test.ts:53`), sin tocar.

## Fórmulas finales (con ejemplos numéricos verificados de forma independiente por el auditor)

**Funnel** (por tramo, disjuntos entre sí):
```
facturación incremental  = unidades recuperables × ticket
contribución incremental = facturación incremental × margen
```
Ejemplo recalculado por el auditor del bloque 3+4: rampa conservador
(25/50/75%) sobre una base de 90.000 → 22.500 / 45.000 / 67.500,
acumulado 135.000, ritmo del mes 3 = 67.500 (≠ acumulado/3 = 45.000).

**Ahorro publicitario** (consolidado, nunca sumado):
```
ahorro consolidado = min(max(gasto_no_rentable, sobrefragmentación), inversión_elegible)
```
Ejemplo recalculado por el auditor del bloque 3+4: `max(90.000, 150.000) =
150.000 > 100.000` (inversión elegible) → topeado a 100.000, nunca a
240.000 (la suma).

**Perímetros de inversión** (verificado empíricamente en la ronda 2 del
bloque 5, con el motor real): con Meta=300.000, Google=100.000, Product
Ads=1.800.000 → `inversion_publicitaria_total = 2.200.000`. `mer_marketplace
= 25.000.000/1.800.000 ≈ 13,89` (sólo perímetro Product Ads, nunca
`25.000.000/2.200.000 ≈ 11,36`). `roas_product_ads = 3.600.000/1.800.000 =
2` (nunca `3.600.000/2.200.000 ≈ 1,64`).

**Escenarios**:
```
facturación proyectada (mes N) = facturación actual + facturación incremental habilitada (mes N)
```
Nunca + contribución ni + ahorro — verificado por el auditor leyendo
`facturacionProyectadaDe` en `src/lib/escenarios-90d.ts` línea por línea:
el único término sumado a `facturacionActual` viene de la línea de
facturación incremental.

## Funcionalidades aprobadas

- Separación completa de facturación incremental, contribución incremental
  y ahorro publicitario en el cálculo (`funnel.ts`, `calculo-diagnostico.ts`,
  `ahorro-publicitario.ts`, `escenarios-90d.ts`) y en el contrato documental
  (`documents/domain/*`, plantillas, ambos renderers).
- Retención por magnitud (no por escenario completo): margen bloqueado o
  envío no confirmado retienen únicamente contribución y ahorro, nunca
  facturación incremental.
- Consolidación de ahorro publicitario por el máximo, nunca la suma, con
  doble tope consistente a la inversión publicitaria elegible.
- Compatibilidad con diagnósticos legados: un monto sin `impactos` queda
  `no_clasificado` y retenido, nunca reinterpretado.
- Los tres perímetros de inversión (tienda propia, marketplace, Product
  Ads) siguen sin cruzarse entre sí en ningún derivado (`mer_tienda_propia`,
  `mer_marketplace`, `roas_product_ads`).
- Titan B2 sigue exactamente donde estaba (1 `it.todo`, sin tocar).

## Observaciones pendientes (no bloqueantes, quedaron documentadas en código/tests, ninguna requiere acción adicional)

- `ImpactoEconomico` es un tipo plano, no una unión discriminada — la
  invariante depende de que todo el código futuro use exclusivamente
  `impactoCalculado`/`impactoRetenido`. Documentado en el propio tipo.
- Un `impactos: []` (array vacío) se trata como "dato nuevo real", no
  legado — comportamiento intencional, documentado.

## Qué sigue bloqueado / decisiones y datos que necesita Matías

(heredado del handoff anterior, sin cambios en este ciclo de auditoría)

- **Aprobación semántica de negocio del motor de escenarios**: la
  separación de unidades económicas es correcta y está auditada, pero
  nadie de negocio revisó todavía si las tres líneas (y sus curvas) son lo
  que se quiere prometer a un cliente.
- **Renderizado visual del detalle mensual** (tabla de 3 meses en PDF/web):
  sigue sin implementarse — es una decisión de diseño/layout pendiente de
  aprobación explícita, no de cálculo. Los datos ya están en el contrato.
- **Wiring de las rampas a la tabla `configuracion` de la base**: las dos
  familias de curvas están centralizadas en código, pero nada las conecta
  todavía a una fila de configuración real.
- **Evidencia estructurada de gastos disjuntos** entre `gasto_no_rentable`
  y `sobrefragmentacion`: no existe hoy, así que v1 sigue asumiendo
  solapamiento total (máximo, nunca suma). Si en el futuro se puede
  demostrar que son gastos disjuntos, la consolidación debería revisarse.
- Bloqueos heredados sin tocar: reglas comerciales mayoristas, fases de
  auditoría adicionales, Titan B2, assets de marca.

## Recomendación explícita

**Recomiendo integrar el código a `main` en cuanto a corrección técnica**:
los 5 bloques pasaron auditoría independiente (3 de 5 con corrección menor
en la primera ronda, ninguno rechazado, ninguno llegó a la tercera ronda),
la suite completa (299 tests) cubre los 10 invariantes de negocio
obligatorios, y typecheck/build están limpios en cada commit.

**No recomiendo integrar todavía** sin la aprobación semántica de negocio
explícita de Matías (el motor calcula correctamente, pero nadie de negocio
confirmó que las curvas y las tres líneas separadas sean lo que se quiere
mostrar a un cliente real) y sin decidir el diseño del render mensual antes
de exponerlo. Es decir: **la corrección técnica está lista para revisión
final; la integración a producción sigue condicionada a esas dos
decisiones de negocio**, tal como se pidió explícitamente no hacer sin
aprobación.
