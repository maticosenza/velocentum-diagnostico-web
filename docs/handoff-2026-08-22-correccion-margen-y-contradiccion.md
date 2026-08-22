# Handoff · corrección de margen total/muestra y contradicción · 22 de agosto de 2026

Dos correcciones encadenadas, aprobadas por auditoría externa, sobre el
trabajo de fases 4/5/6 del handoff anterior
(`docs/handoff-2026-08-21-fases-4-5-6.md`). Rama `feat/noche-continuacion`.
Ciclo por bloque: implementación → pruebas + typecheck + build → auditoría
independiente read-only (subagente sin contexto previo) → corrección de
observaciones accionables → re-auditoría. Máximo dos rondas de corrección
por bloque.

## Estado del repositorio

- Rama: `feat/noche-continuacion`.
- **HEAD antes de este commit: `10f086e`** (handoff de fases 4/5/6).
- Este handoff se commitea junto con el código que describe; el hash final
  queda en `git log` inmediatamente después.
- `main` no fue tocado. Sin integración, sin publicación, sin producción,
  sin base de datos, sin migraciones.
- Árbol de trabajo limpio antes del commit (verificado con `git status`).

## Pruebas, typecheck y build (estado final, verificado antes de commitear)

```
npm test         # 398 passed | 1 todo (30 archivos) — antes de este bloque: 389 passed | 1 todo (29 archivos)
npm run typecheck # limpio
npm run build     # exitoso (sólo warnings preexistentes de fontkit/@react-pdf)
```

El `it.todo` (caso B2 de Titan Web, sin datos inventados) sigue intacto y es
el mismo de siempre — no se agregó ni se quitó ningún `.todo`.

## Bloque 1 · Margen total exige 100% explícito de cobertura de productos

**Corrección aprobada.** `derivados.margen_contribucion` (el margen TOTAL)
sólo se publica con 100% explícito de cobertura de productos **y** 100% de
cobertura de canales aplicables. Antes, sólo exigía cobertura de canales; un
solo producto sin porcentaje de facturación declarado se trataba como
representativo del 100% del negocio. Eso resolvió la decisión pendiente #1
del handoff anterior (ver `docs/decisiones-pendientes.md`).

**Archivo económico afectado:** `src/lib/calculo-diagnostico.ts`
(`calcularDiagnostico`). `coberturaProductos(d)` (ya existente desde fase 5)
es la fuente única: sólo suma participaciones declaradas (`> 0`), nunca las
asume.

**Cascada de retención verificada:** todo lo que dependía de
`margen_contribucion` sigue leyendo la misma variable `margen`, ya gateada,
así que queda retenido (`null`) junto con ella mientras la cobertura sea
parcial:

- `breakeven_roas`, `cpa_breakeven`, `cpa_objetivo`, `roas_objetivo`,
  `contribucion_marginal`;
- el bloque completo de `presupuesto_arranque` (fase 6: piso teórico y
  presupuesto de arranque por evento intermedio), porque depende de
  `cpa_objetivo`;
- las fugas con `usa_margen: true` (tramos de funnel, gasto no rentable,
  sobrefragmentación) — sus montos y las magnitudes tipadas dependientes de
  margen (`contribucion_incremental`, `ahorro_publicitario`) quedan
  retenidas; `facturacion_incremental` (no depende de margen) sigue
  publicándose sin cambios.

`derivados.margen_muestra` NO se tocó: sigue publicándose sobre lo que sí se
cargó, sin exigir cobertura total, exactamente como ya funcionaba.

**Módulos independientes verificados sin cambios:** funnel, canales,
comisiones, medición, contenido — la retención sólo alcanza fugas marcadas
`usa_margen: true`.

**Compatibilidad histórica:** el motor de cálculo (`calcularDiagnostico`)
sólo se ejecuta al crear un diagnóstico nuevo o al usar la acción explícita
"Editar y recalcular" (`diagnosticos.nuevo.tsx`), que crea una versión nueva
en vez de mutar la existente. Confirmado por grep: es el único call site de
producción. Leer un diagnóstico guardado (`diagnosticos.$id.tsx`,
`from-diagnostico.ts`) reproduce los `derivados` ya persistidos, nunca
recalcula. Los diagnósticos guardados antes de este cambio no se ven
afectados hasta que alguien los recalcule explícitamente.

**Auditoría:** ronda 1, **APROBADO** con una observación no bloqueante
(`esperadosFase2CoberturaCompleta`, un fixture de test sin usar, con un
comentario levemente impreciso) — corregida (fixture eliminado, comentario
ajustado) y reverificada con la suite completa sin necesidad de una segunda
ronda formal.

## Bloque 2 · La contradicción no puede dejar de evaluarse (corrección obligatoria)

**Regresión detectada por la auditoría externa.** El bloque 1, al gatear
`margen_contribucion`, hizo que `evaluarContradiccion` (que comparaba sólo
contra el margen total) dejara de evaluarse en cualquier diagnóstico con
cobertura de productos parcial — exactamente el caso que originó la regla:
Titan Web, 60% de cobertura de productos, margen de la muestra negativo
(-4,52%). Con la implementación rota, un cliente podía declarar 10-12% de
rentabilidad sobre ese negocio y el sistema no lo advertía.

**Corrección aprobada, implementada en `src/lib/contradiccion.ts`:**
`evaluarContradiccion` ahora recibe `{ total, muestra }` en vez de un único
`calculado`:

1. Compara contra el margen **total** si está disponible.
2. Si el total está retenido, compara contra el margen de la **muestra** en
   vez de dejar de evaluar.
3. El resultado registra `origen_margen: "total" | "muestra"`.
4. Registra `cobertura_productos` y `cobertura_canales` — la cobertura y el
   alcance de la evidencia usada en la comparación.
5. `confirmado`/`bloquea` siguen dependiendo únicamente de si el cliente
   confirmó su margen declarado — un eje independiente de `origen_margen`.
   Verificado explícitamente con un test: una contradicción puede estar
   confirmada y bloquear apoyándose en una muestra parcial.
6. `confianza_base`: `"alta"` con margen total, `"media"` (un nivel menos,
   nunca "baja") con margen de la muestra. La UI
   (`diagnosticos.$id.tsx`, `AvisoContradiccion`) ahora aclara
   explícitamente cuándo la comparación se hizo contra la muestra y qué
   porcentaje del catálogo cubre.
7. Umbrales (0,05 validación, 0,10 crítica) y la regla de cambio de signo:
   sin cambios, byte-idénticos a la versión anterior. Sólo cambió contra qué
   margen se compara.
8. Nada más se tocó: el único cambio en `calculo-diagnostico.ts` para este
   bloque es el call site de `evaluarContradiccion` (pasa `{ total: margen,
   muestra: margenMuestra }` más la cobertura).
9. Funnel, canales, comisiones, medición y contenido siguen sin verse
   afectados por el bloqueo de contradicción (la retención sigue acotada a
   fugas `usa_margen: true`).
10. Caso Titan Web (60% de cobertura) cubierto explícitamente en
    `src/lib/contradiccion.test.ts`, con el fixture real
    (`casoTitanWebB1`), no uno inventado.

**Pruebas nuevas** (`src/lib/contradiccion.test.ts`, 9 casos): cobertura
completa compara contra el total; cobertura parcial compara contra la
muestra con confianza más baja y cobertura registrada; contradicción
confirmada sobre muestra parcial bloquea igual; sin margen total ni de
muestra no se evalúa sin error; sin rango declarado no se evalúa; umbrales y
cambio de signo dan resultados idénticos con ambos orígenes (sólo cambia
`origen_margen`/`confianza_base`); el caso Titan Web dispara la crítica y,
confirmado, bloquea sin tocar los módulos independientes. Además,
`src/lib/entrega-2-5.test.ts` migró sus llamadas directas a
`evaluarContradiccion` a la nueva firma y ganó dos aserciones nuevas
(`origen_margen`, `confianza_base`) sobre un caso de cobertura completa ya
existente.

**Auditoría:** ronda 1, **APROBADO**, sin observaciones.

## Archivos modificados en este bloque (ambas correcciones)

```
docs/decisiones-pendientes.md                      (Decisión #1 marcada resuelta, con la corrección de contradicción documentada)
docs/handoff-2026-08-22-correccion-margen-y-contradiccion.md  (nuevo, este archivo)
src/lib/calculo-diagnostico.ts                     (gate de cobertura de productos + call site de evaluarContradiccion)
src/lib/contradiccion.ts                           (origen_margen, confianza_base, cobertura registrada)
src/lib/contradiccion.test.ts                      (nuevo, 9 casos)
src/lib/fixtures-casos.ts                          (variantes *CoberturaCompleta para tests que necesitan margen total calculado)
src/routes/_authenticated/diagnosticos.$id.tsx     (nota explícita cuando la contradicción usa la muestra)
src/documents/build-document.test.ts
src/documents/domain/build-context.test.ts
src/documents/domain/escenarios-90d.test.ts
src/documents/domain/from-diagnostico.test.ts
src/documents/domain/resumen-comercial.test.ts
src/documents/templates/velocentum-v1/copy-guardrails.test.ts
src/lib/calculo-diagnostico.test.ts
src/lib/entrega-2-5.test.ts
src/lib/escenarios-90d.test.ts
src/lib/fase3-bugfixes.test.ts
src/lib/presupuesto-arranque.test.ts
src/lib/producto-dinamico.test.ts
src/lib/regresion-2-6.test.ts
```

Los archivos `*.test.ts` de `src/documents/` y varios de `src/lib/` no
cambiaron su lógica de negocio: se ajustaron fixtures o expectativas para
seguir probando exactamente lo que probaban antes de la corrección (por
ejemplo, dándole cobertura de productos 100% explícita a un fixture cuando
el test en cuestión no trata sobre cobertura sino sobre comisiones, envío,
financiación, etc.), o se actualizaron para reflejar la nueva semántica de
retención cuando el test SÍ trata sobre cobertura parcial. Ningún cambio de
expectativa se hizo sin un cálculo independiente del motor real (verificado
en ambas rondas de auditoría).

## Riesgo real, no un efecto colateral aceptado sin más

- Cualquier diagnóstico con cobertura de productos parcial (la mayoría de
  los casos modo B de un solo producto sin porcentaje declarado, o con
  varios productos que no suman el 100%) ahora muestra el margen total, el
  breakeven, el CPA objetivo y el presupuesto de arranque completo en "—"
  (sin datos) en la pantalla interna de diagnóstico, hasta que el vendedor
  declare explícitamente el 100% de cobertura del catálogo. Esto es lo que
  pidió la corrección aprobada, no un bug — pero cambia sustancialmente lo
  que ve el equipo comercial en diagnósticos ya cargados con datos
  incompletos.
- La detección de contradicción ahora puede disparar sobre una base parcial
  (margen de la muestra). Es la corrección correcta y la que restaura el
  caso Titan Web, pero implica que "muestra" alerta con menos evidencia que
  "total" — la UI y el campo `confianza_base` lo dejan explícito para que
  nadie lo confunda con una alerta sobre el negocio completo.

## Pendientes y decisiones no tomadas en este bloque

- **Decisión pendiente #2** (`docs/decisiones-pendientes.md`): el 20% por
  defecto del costo de evento intermedio (fase 6) sigue sin resolver, sin
  cambios en este bloque.
- No se tocó `docs/cola-nocturna.md` ni ningún otro documento de limpieza:
  ese era el bloque 4 del plan original (limpieza y consistencia), que no
  se retomó en esta sesión.
- No se actualizó el plan maestro, por instrucción explícita.

## Confirmación de restricciones

No se tocó `main`, producción, base de datos ni migraciones. No se publicó
a ningún entorno. No se inventaron datos de Titan Web B2 (el `it.todo` sigue
intacto). No se desactivó ni se debilitó ninguna prueba para forzar un
verde: toda expectativa que cambió se justificó contra la regla aprobada y
se verificó con un cálculo independiente del motor real, en ambas rondas de
auditoría (subagentes read-only, sin contexto previo de la sesión).

## Ejecución detenida

Por instrucción explícita: no se integra a `main`, no se publica, y la
ejecución se detiene después de este handoff a la espera de aprobación
antes de continuar con cualquier otro bloque.
