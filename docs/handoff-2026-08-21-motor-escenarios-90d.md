# Handoff · motor de escenarios a 90 días · 21 de agosto de 2026

Pausa del desarrollo a pedido explícito. Este documento es el resumen para
retomar; el detalle de diseño está en la conversación que aprobó el motor
(curvas de rampa, reglas de pool combinado, límites de mayorista).

## Estado del repositorio

- Rama: `feat/noche-continuacion`.
- Último commit: `23c805e` — pusheado a `origin/feat/noche-continuacion`
  (verificado: `git rev-parse HEAD` y `git rev-parse origin/feat/noche-continuacion`
  coinciden).
- Árbol de trabajo: limpio (`git status --short` sin salida).
- `main` sigue intacto, sin tocar. Sin Lovable, sin publicación. Titan B2
  sigue sin cerrar (`it.todo` explícito, no tocado esta sesión).

## Commits implementados esta sesión

1. `eb4719a` — Motor determinístico de escenarios a 90 días (cálculo puro).
   `src/lib/escenarios-90d.ts`: reutiliza las fugas ya calculadas por
   `calcularDiagnostico` como única fuente de oportunidad; aplica las tres
   curvas de rampa aprobadas (conservador 25/50/75, base 40/70/100,
   potencial 50/85/100), centralizadas en `ConfiguracionCalculo` con default
   documentado como política comercial, no evidencia observada. Retiene
   (nunca cero real) ante margen bloqueado, contradicción sin validar, cero
   fugas calculables o facturación mensual ausente.
2. `fcddfd6` — Conecta el motor al contrato documental. `escenarios90d` en
   `DocumentContextV1` dejó de ser `[]` hardcodeado. Agrega la regla: si la
   política de envío no está confirmada, los tres escenarios se retienen
   igual que el margen total (misma dependencia de margen que esa política
   puede bloquear).
3. `803c5db` — Expone el detalle mensual en el bloque documental
   (`DocumentBlock.scenarios.items[].monthly`): los tres meses, cada uno con
   facturación proyectada y oportunidad habilitada.
4. `23c805e` — Regresión explícita de dos reglas aprobadas: el escenario
   potencial nunca lista una palanca fuera de las fugas del motor; invertir
   el reparto de inversión entre Meta y Google no cambia la proyección (el
   motor de escenarios no lee esos campos por separado, sólo consume fugas
   ya calculadas sobre el pool combinado).

## Verificación

```bash
npm test        # 261 passed | 1 todo (19 → 21 archivos de test)
npm run typecheck
npm run build
```

Los tres comandos quedaron limpios en cada uno de los cuatro commits, no
sólo al final.

## El motor de escenarios NO está aprobado semánticamente todavía

Lo que existe es una implementación técnica correcta de las reglas de
negocio ya aprobadas (curvas de rampa, retención por margen/envío, pool
combinado Meta/Google, exclusión de mayorista). **Nadie validó todavía que
el número que produce sea el número correcto para mostrarle a un cliente.**
No usar en documentos reales ni mostrarlo a Matías como cifra definitiva
hasta una revisión semántica explícita.

## Bloqueo prioritario para la próxima sesión

**`fuga.monto` mezcla tres unidades económicas distintas**, y el motor de
escenarios las suma todas como si fueran la misma cosa antes de sumarlas a
la facturación actual. Esto es un defecto de diseño real, no un detalle:

| Fuga | Fórmula | Qué es en realidad |
|---|---|---|
| `funnel_navegacion`, `funnel_carrito`, `funnel_checkout` (`funnel.ts`, función `valorizar`) | `unidades × ticket × margen` | **Contribución** (utilidad marginal), no facturación. Ya viene neta del costo del producto, envío, comisión, financiación y descuento. |
| `gasto_no_rentable` (`calculo-diagnostico.ts`, rama `gasto_no_rentable`) | `inversionAds × (1 − mer/breakevenRoas)` | **Ahorro publicitario** (gasto que se deja de perder), no facturación nueva ni contribución. |
| `sobrefragmentacion` (`calculo-diagnostico.ts`, rama `sobrefragmentacion`) | `((conjuntos_activos − conjuntosSostenibles) × 50 × cpaObjetivo) / 4` | Otra forma de **ahorro/eficiencia publicitaria**, misma familia que la anterior, no facturación. |

`calcularEscenarios90d` (`src/lib/escenarios-90d.ts`) suma estos tres montos
sin distinguir su unidad (`oportunidadMensualBase = fugas.reduce((acc, f) =>
acc + f.monto, 0)`) y después arma `facturacionProyectada = facturación_actual
+ oportunidadHabilitada`. Eso está tratando contribución y ahorro
publicitario como si fueran facturación incremental — no lo son, y sumarlos
a la facturación produce un número que no significa lo que el documento dice
que significa.

**No se puede corregir sin una decisión de producto**: hace falta separar
`fuga.monto` en al menos dos (o tres) magnitudes explícitas por tramo —
facturación incremental, contribución incremental y ahorro publicitario — y
decidir qué cifra de cada escenario se compara contra qué (¿la proyección
de 90 días es de facturación, de contribución, o de "resultado" con las tres
sumadas correctamente cada una a su propia línea?). Motor documental v1 ya
exige esta separación en general (nunca mezclar MER con ROAS, nunca contar
Product Ads dos veces); acá falta aplicarla a fugas y escenarios.

## Explícitamente pendiente de implementar (no autorizado todavía)

- **Renderizado visual del detalle mensual** en PDF/web. Los datos ya están
  en `DocumentBlock.scenarios.items[].monthly` (bloque 3), pero
  `document-renderer.tsx` y `document.tsx` todavía no dibujan esa tabla. Es
  una decisión de diseño, no de cálculo — no implementar hasta que se
  apruebe el layout.
- **Wiring de la rampa a la tabla `configuracion` de la base.** La rampa
  está centralizada en código (`ConfigEscenarios90d`, override tipado), pero
  ningún caller real pasa hoy una fila de configuración distinta al
  default. Conectarlo tocaría la capa de rutas/DB — no hacerlo sin
  aprobación explícita.
- Resolver el bloqueo de `fuga.monto` de arriba antes de considerar el
  motor listo para producción.
- Los bloqueos ya documentados en `docs/handoff-nocturno-2026-08-20-controlador.md`
  que siguen sin resolver: reglas comerciales mayoristas, fases de
  auditoría adicionales, Titan B2, assets de marca.

## Cómo verificar este estado

```bash
git log --oneline -5           # HEAD debe ser 23c805e
git status --short             # debe estar vacío
npm test && npm run typecheck && npm run build
```
