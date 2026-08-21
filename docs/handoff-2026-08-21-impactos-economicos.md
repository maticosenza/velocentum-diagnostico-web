# Handoff · separación de impactos económicos · 21 de agosto de 2026

Resuelve el bloqueo semántico documentado en
`docs/handoff-2026-08-21-motor-escenarios-90d.md`: `fuga.monto` mezclaba
facturación, contribución y ahorro publicitario y el motor de escenarios las
sumaba todas antes de sumarlas a la facturación. Trabajo aprobado y
ejecutado en 5 bloques pequeños, con suite/typecheck/build verificados
después de cada uno.

## Rama y estado del repositorio

- Rama: `feat/noche-continuacion`, pusheada a `origin/feat/noche-continuacion`.
- HEAD: `c10e198`.
- `main` intacto (`92727e0`, igual en local y `origin/main`). Sin Lovable, sin
  publicación, sin tocar producción, base ni Titan B2.
- Árbol de trabajo limpio.

## Commits de esta sesión (5 bloques, en orden)

1. `87492f4` — Decisión de diseño y fixtures manuales (bloque 1).
2. `506efd8` — Modelo tipado `ImpactoEconomico` y compatibilidad legada
   (bloque 2).
3. `206841c` — Cálculo separado + contrato documental (bloques 3 y 4,
   entregados juntos: cambiar la forma de `Fuga.impactos` rompe la
   compilación de todo lo que consume `Escenario90d` hasta que ambos lados se
   actualizan a la vez; no hay una forma honesta de partir esto en dos
   commits que compilen por separado).
4. `c10e198` — Regresión adicional: perímetros de inversión conservados
   (bloque 5).

## Archivos modificados

27 archivos, +2309/-421 líneas desde el handoff anterior. Nuevos:
`docs/decision-2026-08-21-impactos-economicos.md`,
`src/lib/impacto-economico.ts` (+test), `src/lib/ahorro-publicitario.ts`
(+test), `src/lib/funnel.test.ts`, `src/lib/fixtures-impactos-manual.ts`.
Modificados: `src/lib/funnel.ts`, `src/lib/calculo-diagnostico.ts` (+test),
`src/lib/escenarios-90d.ts` (+test), todo `src/documents/domain/*` y
`src/documents/templates/velocentum-v1/*`, ambos renderers (web y PDF).

## Fórmulas finales

**Funnel** (`funnel.ts`, por tramo — navegación/carrito/checkout/combinado):
```
facturación incremental = unidades recuperables × ticket
contribución incremental = facturación incremental × margen
```
Retención independiente: sin ticket se retiene facturación (y por lo tanto
contribución); sin margen se retiene sólo contribución. Los tres tramos son
disjuntos y se agregan sin reparo dentro de cada magnitud.

**Publicidad** (`calculo-diagnostico.ts`): `gasto_no_rentable` y
`sobrefragmentación` no cambiaron su fórmula ni su `monto` legado. Cada una
carga en paralelo un impacto `ahorro_publicitario`. Para agregados
(`ahorro-publicitario.ts`):
```
ahorro consolidado = min(max(gasto_no_rentable, sobrefragmentación), inversión_elegible)
```
Nunca la suma. `inversión_elegible` es `inversion_publicitaria_total`
(Meta + Google + Product Ads combinados, el mismo perímetro que ya usaban
ambas fórmulas).

**Escenarios** (`escenarios-90d.ts`):
```
facturación proyectada (mes N) = facturación actual + facturación incremental habilitada (mes N)
```
Nunca + contribución ni + ahorro. Tres líneas independientes por escenario,
cada una con su propio acumulado a 90 días y ritmo mensual al día 90. Dos
familias de curvas centralizadas en `ConfigEscenarios90d`:

| | mes 1 | mes 2 | mes 3 |
|---|---|---|---|
| Facturación/contribución — conservador | 25% | 50% | 75% |
| Facturación/contribución — base | 40% | 70% | 100% |
| Facturación/contribución — potencial | 50% | 85% | 100% |
| Ahorro publicitario — conservador | 50% | 75% | 100% |
| Ahorro publicitario — base | 75% | 100% | 100% |
| Ahorro publicitario — potencial | 100% | 100% | 100% |

Retención por línea, no por escenario completo: margen bloqueado o
contradicho retiene contribución y ahorro (nunca facturación); envío no
confirmado (capa documental) retiene contribución y ahorro por la misma
razón, nunca facturación.

## Fixtures manuales (cuentas visibles, `src/lib/fixtures-impactos-manual.ts`)

Ejemplo central (funnel, 10.000 visitas / 1.000 agregados / 200 checkouts /
100 compras, ticket 1.000, margen 0,5): facturación incremental total
20.000+50.000+20.000 = **90.000**; contribución incremental total
10.000+25.000+10.000 = **45.000**. La suma incompatible que nunca debe
aparecer es 135.000, y ningún test la produce. Ahorro publicitario:
`max(250.000, 300.000) = 300.000` (nunca 550.000), topeado a la inversión
elegible cuando corresponde (ejemplo: `max(90.000,150.000)=150.000 > 100.000
→ 100.000`). Facturación proyectada: `1.000.000 + 22.500 = 1.022.500`, nunca
`+11.250 +20.000` (1.053.750).

## Pruebas

Suite completa: **298 passed | 1 todo** (era 261 antes de esta sesión).
typecheck y build limpios en cada uno de los 4 commits de código (el bloque
1 no tocó código de producción). Cobertura de los 10 invariantes obligatorios
de la especificación (todos con test dedicado):

1. facturación y contribución del funnel no se suman — `funnel.test.ts`.
2. tramos disjuntos se agregan correctamente — `funnel.test.ts`,
   `impacto-economico.test.ts`.
3. ahorro no aumenta facturación — `escenarios-90d.test.ts`
   (`fixtures-impactos-manual.ts`).
4. gasto no rentable y sobrefragmentación no se duplican —
   `ahorro-publicitario.test.ts`.
5. ahorro no supera inversión elegible — `ahorro-publicitario.test.ts`,
   `calculo-diagnostico.test.ts`.
6. curvas diferentes por magnitud — `escenarios-90d.test.ts`.
7. retenido nunca es cero — `impacto-economico.test.ts`, `funnel.test.ts`.
8. diagnósticos legados no se reinterpretan — `impacto-economico.test.ts`,
   `from-diagnostico.test.ts`.
9. Meta/Google/Product Ads/marketplace conservan sus perímetros —
   `calculo-diagnostico.test.ts` (bloque 5).
10. ningún escenario publica cifras con dependencias bloqueadas —
    `escenarios-90d.test.ts` (lib y documents/domain), `build-context.test.ts`.

## Compatibilidad

`Fuga.monto`/`calculable`/`tipo`/`usa_margen`/`confianza`/`sospechosa` no
cambiaron: todo consumidor existente (`oportunidad_total`, el dashboard
interno, la fila persistida en Supabase) sigue funcionando idéntico. El
campo nuevo `Fuga.impactos` es opcional; una fuga persistida antes de este
modelo (sin ese campo) se lee a través de `impactosDeFuga`
(`impacto-economico.ts`), que la marca `no_clasificado` y retenida en vez de
reinterpretar el monto legado como una magnitud específica. Ninguna
normalización se agregó en `from-diagnostico.ts`: el fallback ocurre en el
punto de consumo (el motor de escenarios), que es donde ya se leía
`fuga.monto` bit a bit antes.

## Riesgos pendientes / qué sigue bloqueado

- **El motor de escenarios sigue sin aprobación semántica de negocio para
  mostrarse a un cliente.** Lo que existe es la separación correcta de
  unidades económicas; falta que Matías revise que las tres líneas (y sus
  curvas) son lo que quiere prometer.
- **Renderizado visual del detalle mensual** (tabla de 3 meses en PDF/web):
  sigue sin implementarse, tal como pidió la especificación ("no
  implementar todavía el nuevo render mensual"). Los datos ya viven en
  `DocumentBlock.scenarios.items[].monthly` con las tres magnitudes
  separadas.
- **Wiring de las rampas a la tabla `configuracion` de la base**: las dos
  familias de curvas están centralizadas y tipadas en código
  (`ConfigEscenarios90d`), pero ningún caller real pasa hoy una fila de
  configuración distinta al default.
- **Evidencia estructurada de que `gasto_no_rentable` y `sobrefragmentacion`
  son gastos disjuntos**: no existe hoy, así que v1 sigue asumiendo
  solapamiento total (usa el mayor, nunca la suma). Si en el futuro se
  puede probar que son disjuntos, la consolidación debería revisarse.
- Bloqueos heredados de handoffs previos, sin tocar esta sesión: reglas
  comerciales mayoristas, fases de auditoría adicionales, Titan B2, assets
  de marca.

## Confirmación

No se tocó `main`, producción, base de datos ni Titan B2 (el `it.todo`
sigue intacto, no tocado). No se publicó a Lovable ni a ningún entorno. Sin
revisión del chat auditor todavía: no renderizar ni integrar a `main` hasta
esa revisión, tal como se pidió.
