# Handoff · corrección de producto (8 puntos) · 21 de agosto de 2026

Implementación y auditoría read-only (subagente independiente por commit) de
las 8 correcciones de producto aprobadas sobre el commit `2685999`
("APROBADO CON CORRECCIONES"), más el render mensual y los fixtures
numéricos adicionales pedidos explícitamente después de esa auditoría.

## Estado del repositorio

- Rama: `feat/noche-continuacion`, pusheada a `origin/feat/noche-continuacion`.
- HEAD: **`47d7a4b`**.
- `main` intacto (`92727e0`, igual en local y `origin/main`).
- Árbol de trabajo limpio. Sin Lovable, sin publicación, sin producción, sin
  base, sin migraciones, sin secretos tocados. Titan B2 sigue pendiente sin
  datos inventados (el `it.todo` sigue intacto).

## Pruebas, typecheck y build (estado final verificado en HEAD)

```
npm test         # 350 passed | 1 todo (26 archivos)
npm run typecheck
npm run build
```

Los tres comandos quedaron limpios después de cada commit de esta corrección,
verificados además de forma **aislada** (worktrees temporales) por cada
auditoría, para no depender de que el árbol de trabajo estuviera limpio en
el momento exacto de la verificación.

## Commits de esta corrección (en orden)

| Commit | Contenido | Veredicto del auditor |
|---|---|---|
| `3e2ecca` | Bloque A: curva potencial de ahorro 100→85/100/100 + umbral de dispersión configurable (2,5) | APROBADO CON OBSERVACIONES → corregido |
| `20112b7` | Corrección bloque A (cobertura NaN/Infinity, precisión de comentario) | **APROBADO** (ronda 2, verificado en worktree aislado) |
| `5277eca` | Bloque B: resumen comercial (cifra dominante = contribución del conservador, redacción obligatoria, dispersión) | APROBADO CON OBSERVACIONES → corregido |
| `2717b65` | Corrección bloque B + avance: hallazgos con magnitud etiquetada, marca de supuesto | APROBADO CON OBSERVACIONES → corregido |
| `620bea3` | Bloque C: render completo de los puntos 2, 4, 5, 6, 7, 8 + correcciones sobre 2717b65 | **APROBADO** (sin observaciones) |
| `47d7a4b` | Render del detalle mensual (web y PDF) + fixtures numéricos de no-cruce y disparo de dispersión | **APROBADO** (3 observaciones menores, no bloqueantes, ninguna requirió corrección) |

Ninguna ronda de corrección llegó al límite de 3 intentos. El commit más
grande y de mayor riesgo (`620bea3`, 13 archivos) quedó aprobado sin
observaciones en su primera auditoría.

## Las ocho correcciones de producto: estado final

| # | Corrección aprobada | Estado |
|---|---|---|
| 1 | Curva potencial de ahorro publicitario: 100/100/100 → 85/100/100 | ✅ Implementado y auditado (`3e2ecca`) |
| 2 | Contribución incremental es la cifra dominante en proyección y propuesta; facturación pasa a bloque secundario | ✅ Implementado y auditado (`620bea3`): reordenada primero, con estilo visual distinto (más grande, color de acento) en ambos renderers |
| 3 | El diagnóstico no proyecta: sólo estado actual y magnitudes etiquetadas, sin totales combinados ni curvas | ✅ Ya cumplido estructuralmente (el template de diagnóstico nunca llamó al bloque de escenarios); reforzado con hallazgos etiquetados por magnitud y un test explícito que confirma cero bloques `commercial-summary`/`scenarios` en diagnóstico |
| 4 | Encabezado de la propuesta: una sola cifra arriba (contribución incremental a 90 días, conservador), el resto abajo | ✅ Implementado y auditado (`620bea3`): nuevo bloque `commercial-summary`, primera sección de contenido en la propuesta (y en la proyección) |
| 5 | Marca de supuesto visible en toda cifra proyectada, con acceso a los supuestos, en web y PDF | ✅ Implementado y auditado (`2717b65`/`620bea3`): marca genérica en `PublishedNumberView` (web, subrayado + "†" + tooltip) y `formatPublishedNumber` (PDF, "†"), aplicada a **cualquier** cifra con supuestos, incluida la tabla mensual nueva |
| 6 | Redacción obligatoria exacta + frases prohibidas detectadas con prueba dedicada | ✅ Implementado y auditado (`5277eca`/`620bea3`): `redaccionRangoContribucion` arma la plantilla exacta; `copy-guardrails.test.ts` recorre recursivamente el `DocumentModel` completo de 6 documentos reales (con/sin oportunidad, 100% Mercado Libre) más un control negativo |
| 7 | Regla de dispersión (potencial/conservador > umbral → rango sin cifra principal + qué datos la cerrarían) | ✅ Implementado y auditado (`3e2ecca`/`5277eca`/`620bea3`/`47d7a4b`). **Nota importante**: con las curvas hoy aprobadas el cociente converge a ~1,57 (nunca supera 2,5) — es matemáticamente imposible que dispare con datos reales de un cliente hasta que alguien reconfigure las rampas. Se demostró con un fixture que el mecanismo SÍ dispara correctamente ante una reconfiguración (cociente 5,0), pero esa reconfiguración no está conectada a ninguna UI real todavía |
| 8 | Nota de reinversión visible en el bloque de ahorro | ✅ Implementado y auditado (`620bea3`): texto idéntico en ambos renderers |

## Trabajo adicional de esta sesión (fuera de las 8 correcciones originales, por instrucción explícita posterior)

- **Render del detalle mensual** (web y PDF): tabla de 3 meses × 4 magnitudes
  por escenario, con marca de supuesto en cada celda. Antes explícitamente
  bloqueado ("no renderizar hasta aprobación del dominio"); ahora
  desbloqueado por instrucción directa una vez que las 8 correcciones
  quedaron aprobadas.
- **Fixtures numéricos adicionales** (`src/lib/fixtures-correccion-producto.ts`):
  un escenario completo con las tres magnitudes acumuladas a 90 días
  calculadas a mano (verificadas contra el motor real), y dos configuraciones
  de dispersión (aprobada, que no dispara; reconfigurada, que dispara con
  cociente exacto ~5,0 — el auditor notó que en punto flotante da
  4,999999445..., no 5,0 literal, por el redondeo a peso entero mensual; el
  test usa `toBeCloseTo`, no `toBe`, así que esto no es un defecto).

## Observaciones abiertas (no bloqueantes, ninguna requiere acción para aprobar este trabajo)

1. La regla de dispersión (punto 7) es hoy una red de seguridad latente: no
   puede dispararse con datos de un cliente real mientras las rampas sigan
   siendo las aprobadas (`RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO`). Sólo
   se activaría si en el futuro se reconfiguran las curvas vía
   `ConfigEscenarios90d` — mecanismo que hoy no está conectado a ninguna
   fila de configuración real ni a ninguna UI.
2. El test que compara cada magnitud del motor real contra la "suma total
   incompatible" del fixture manual es correcto pero, por sí solo, débil
   (casi tautológico, ya que compara contra un número derivado de una base
   hipotética sin relación con los datos reales usados). La garantía real
   de no-cruce de magnitudes se sostiene por lectura de código
   (`blocks.ts`, `escenarios-90d.ts` de dominio), confirmada por los
   auditores en cada ronda, no por ese test aislado.
3. Heredado de handoffs anteriores, sin tocar en esta sesión: wiring de las
   rampas a la tabla `configuracion` de la base, reglas comerciales
   mayoristas, Titan B2, assets de marca.

## Confirmación

No se tocó `main`, producción, base de datos ni migraciones. No se publicó
a Lovable ni a ningún entorno. No se inventaron datos de Titan Web. No se
cerró Titan B2 (el `it.todo` sigue intacto). No se desactivó ninguna prueba
ni se redujo ninguna validación para forzar un verde. Ningún commit ya
respaldado fue reescrito. Todos los pushes fueron exclusivamente a
`feat/noche-continuacion`.

## Recomendación

Las 8 correcciones de producto están implementadas, auditadas de forma
independiente (read-only, sin contexto previo por cada auditor) y probadas
contra el motor real. El render mensual y los fixtures de dispersión
adicionales también quedaron auditados y aprobados. **Recomiendo la
integración a `main`** en cuanto a corrección técnica — queda a criterio de
Matías validar el resultado visual (web y PDF) antes de considerar esto
definitivo para un cliente real, dado que el render mensual es nuevo y no
tuvo una revisión de diseño previa (sólo funcional/técnica).
