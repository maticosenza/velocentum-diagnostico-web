# Decisión · modelo de impactos económicos · bloque 1

Resuelve el bloqueo documentado en
`docs/handoff-2026-08-21-motor-escenarios-90d.md`: `fuga.monto` mezclaba
facturación, contribución y ahorro publicitario como si fueran la misma
unidad, y el motor de escenarios sumaba las tres antes de sumarlas a la
facturación actual. Este documento fija las decisiones de diseño antes de
tocar código de producción (bloques 2 a 5).

## 1. Qué NO cambia

- `Fuga.monto`, `Fuga.calculable`, `Fuga.tipo`, `Fuga.usa_margen`,
  `Fuga.confianza`, `Fuga.sospechosa`: se mantienen bit a bit. Todo consumidor
  actual (`oportunidad_total`, `oportunidad_conservadora`, el tope de fuga
  individual/total, el dashboard interno en `index.tsx`/`diagnosticos.$id.tsx`,
  la fila persistida en Supabase) sigue funcionando exactamente igual.
- La tabla `configuracion` de la base y el esquema de Supabase no se tocan.
- El renderizado mensual (tabla de 3 meses en PDF/web) sigue sin
  implementarse: es una decisión de layout, no de cálculo, y sigue pendiente
  de aprobación explícita.

Lo nuevo es un campo **adicional** (`impactos: ImpactoEconomico[]`) que
convive con lo anterior. Nada existente se borra ni se reinterpreta.

## 2. Modelo tipado

`src/lib/impacto-economico.ts` (bloque 2):

```ts
type TipoImpacto =
  | "facturacion_incremental"
  | "contribucion_incremental"
  | "ahorro_publicitario";

type ConfianzaImpacto = "alta" | "media" | "retenida";

type ImpactoEconomico = {
  tipo: TipoImpacto;
  /** null únicamente cuando confianza === "retenida". Nunca cero inventado. */
  montoMensual: number | null;
  moneda: "ARS";
  periodo: "mensual";
  confianza: ConfianzaImpacto;
  dependencias: string[];
  /** presente sólo cuando confianza === "retenida". */
  motivoRetencion?: string;
};
```

Se adapta el tipo sugerido en la especificación (`montoMensual: number`) a
`number | null` porque la regla dura del negocio ("preservar retenido
distinto de cero real") no se puede representar con un número obligatorio:
si `retenida` exigiera igual un número, alguien terminaría mostrando ese
número. `motivoRetencion` sólo existe cuando hace falta explicar la
retención, igual que el resto del motor documental (`ValorPublicable`).

`Fuga` gana un campo opcional `impactos?: ImpactoEconomico[]`. Opcional
porque una fuga persistida antes de este cambio no lo tiene (ver §4).

## 3. Cada magnitud, por separado

### Funnel (`funnel.ts`, `tramosFunnel`)

Por tramo (`funnel_navegacion`, `funnel_carrito`, `funnel_checkout`,
`funnel_combinado`):

```
facturación incremental = unidades recuperables × ticket
contribución incremental = facturación incremental × margen
```

Retención independiente por magnitud:
- sin ticket → se retiene **sólo** facturación incremental (y por
  consiguiente contribución, que la necesita como base);
- sin margen (ausente o contradicho) → se retiene **sólo** contribución
  incremental; facturación incremental se sigue publicando si hay ticket.

Los tres tramos son disjuntos (ya lo garantiza la cascada de atribución) y
se agregan sin reparo dentro de cada magnitud: suma de facturación
incremental de los tres tramos, suma de contribución incremental de los tres
tramos. Nunca se suma facturación con contribución.

### Publicidad (`calculo-diagnostico.ts`, `gasto_no_rentable` y
`sobrefragmentacion`)

Ambas fugas siguen calculándose exactamente igual que hoy (mismo
`inversionAds` combinado Meta+Google+Product Ads, mismas fórmulas) y se
siguen mostrando como hallazgos individuales — cada una es una explicación
distinta ("gasto no rentable" vs. "sobrefragmentación") y el cliente se
beneficia de ver ambas. Lo que cambia es **cómo se agregan** cuando alguien
necesita un ahorro publicitario consolidado (el motor de escenarios, no el
diagnóstico):

- las dos comparten el mismo perímetro de inversión (`inversionAds` ==
  `derivados.inversion_publicitaria_total`), así que consolidar es
  `max(gasto_no_rentable, sobrefragmentacion)`, nunca la suma — no hay hoy
  ninguna fuente de evidencia estructurada que pruebe que son gastos
  disjuntos, así que la v1 asume solapamiento total y usa el mayor;
  el bloque 3 introduce `consolidarAhorroPublicitario` con esta regla;
- el resultado nunca puede superar `inversionAds`: ambas fórmulas ya están
  acotadas a `inversionAds` individualmente (`gasto_no_rentable` porque el
  factor `1 − mer/breakeven` nunca supera 1 cuando aplica; `sobrefragmentacion`
  se acota explícitamente al implementarla, porque su fórmula no tiene ese
  techo matemático incorporado);
- no se reinvierte el ahorro ni se convierte a facturación vía CPA/ROAS
  (regla explícita de v1).

## 4. Compatibilidad con diagnósticos legados

`impactos` es opcional. `resultadoDesdeDiagnostico`
(`src/documents/domain/from-diagnostico.ts`) sigue leyendo `fila.fugas` tal
cual (no recalcula). Cuando una fuga persistida no trae `impactos` (todo lo
guardado antes de este cambio), el bloque 2 agrega un adaptador
`impactosDeFugaLegado` que **no reinterpreta el monto**: produce un único
impacto retenido con `tipo` marcado como no clasificable
(`motivoRetencion: "Diagnóstico calculado antes de separar facturación,
contribución y ahorro: el monto legado no se reclasifica automáticamente."`).
Ese impacto no participa de ninguna agregación por tipo. Un diagnóstico
legado con fugas nunca aparenta tener facturación/contribución/ahorro
calculados: aparece como retenido hasta que se recalcule con el motor
nuevo.

## 5. Motor de escenarios (bloque 3 y 4)

`facturación proyectada (mes N) = facturación actual + facturación
incremental habilitada (mes N)`. Nunca se suma contribución ni ahorro.

Cada escenario (`conservador`/`base`/`potencial`) expone **tres líneas
independientes**, cada una con su propio acumulado a 90 días y su propio
ritmo mensual al día 90:

- facturación incremental (curva 25/50/75 · 40/70/100 · 50/85/100 — la
  misma familia ya aprobada, ahora aplicada sólo a esta magnitud);
- contribución incremental (misma familia de curvas que facturación,
  porque ambas miden la misma recuperación desde ángulos distintos);
- ahorro publicitario (curva propia, más agresiva porque no depende de
  ejecución del funnel: conservador 50/75/100 · base 75/100/100 · potencial
  100/100/100).

Retención por línea, no por escenario completo:
- falta ticket → retiene facturación incremental (y contribución, que la
  usa de base) en las tres curvas;
- margen bloqueado o contradicción sin validar → retiene **sólo**
  contribución incremental y ahorro publicitario (ambas dependen de margen:
  contribución porque es facturación×margen, ahorro porque
  `breakeven_roas` es `1/margen`). Facturación incremental sigue
  publicándose;
- política de envío no confirmada (capa documental, `documents/domain/
  escenarios-90d.ts`) → retiene sólo contribución incremental y ahorro
  publicitario, por la misma razón (ambas dependen del margen que esa
  política puede afectar). Facturación incremental no se retiene por esto:
  es la regla explícita de la sección 6 de la especificación aprobada.

Nunca se publica un "impacto total" que sume las tres líneas.

## 6. Contrato documental (bloque 4)

`Escenario90d` (`src/documents/domain/types.ts`) pasa de dos campos mezclados
(`contribucionAcumulada90d`, `ritmoMensualDia90`) a tres líneas explícitas —
`facturacionIncremental`, `contribucionIncremental`, `ahorroPublicitario` —
cada una un `{ acumulado90d: ValorPublicable<number>; ritmoMensualDia90:
ValorPublicable<number> }`. `mensual[]` gana los tres desgloses habilitados
por mes además de `facturacionProyectada`. Las palancas (`palancas[]`)
declaran de qué magnitud vienen (`tipo: TipoImpacto`).

Esto obliga a actualizar el paso mecánico siguiente en la cadena
(`buildScenarios` en `src/documents/templates/velocentum-v1/blocks.ts`, el
tipo `DocumentBlock` de `scenarios`, y las dos vistas que hoy muestran
"Contribución acumulada a 90 días" con un número que mezclaba las tres
magnitudes) para que compilen contra el contrato nuevo y dejen de mostrar
esa cifra incorrecta. Eso **no** es implementar el render mensual nuevo: es
la actualización mecánica mínima para que el dato que ya se mostraba deje de
estar mal, sin agregar ninguna tabla ni sección nueva. La tabla de detalle
mensual (bloque 3 de la sesión anterior) sigue sin dibujarse.

## 7. Qué queda explícitamente bloqueado

- Diseño visual del detalle mensual en PDF/web.
- Wiring de la rampa a la tabla `configuracion` de la base.
- Evidencia estructurada de que `gasto_no_rentable` y `sobrefragmentacion`
  son gastos disjuntos (hoy no existe una fuente para eso: v1 asume
  solapamiento total).
- Reglas comerciales mayoristas, fases de auditoría adicionales, Titan B2,
  assets de marca (heredado de handoffs anteriores).
