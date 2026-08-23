# Contrato de estados (D4) — modelo documental, sin implementar

Modelo de los dos ejes obligatorios de D4 (`docs/visual/auditoria-visual-2026-08-23.md`),
verificado contra el código real de esta rama. Este documento **no
implementa nada**: describe qué existe hoy, qué le falta para llegar a D4,
y marca DECISIÓN PENDIENTE donde la redacción exacta no está fijada por
ninguna decisión ya tomada.

## 1 · Los dos ejes de D4, tal como los pidió el encargo

**Eje 1 — Origen de la evidencia:** `verificado` / `declarado` /
`estimado_configuracion` / `no_disponible` / `no_aplica`.

**Eje 2 — Disponibilidad del cálculo:** `disponible` / `retenido` /
`evidencia_faltante` / `no_aplica`.

Los dos ejes son **independientes**: un dato puede estar `declarado`
(origen) y a la vez `disponible` (cálculo) — o `verificado` y `retenido` —
o `no_aplica` en los dos, etc. Ninguna combinación puede distinguirse sólo
por color.

## 2 · Qué existe HOY en el código para cada eje

### Eje 2 (disponibilidad del cálculo) — SÍ existe, parcialmente

`ValorPublicable<T>` (`src/documents/domain/types.ts:28-46`) es,
estructuralmente, el Eje 2 de D4, con una diferencia: sólo tiene TRES
estados, no cuatro.

| D4 (Eje 2) | `ValorPublicable<T>` hoy | Coincide |
|---|---|---|
| `disponible` | `estado: "calculado"` | Sí, 1 a 1 |
| `no_aplica` | `estado: "no_aplica"` | Sí, 1 a 1 |
| `retenido` | `estado: "retenido"` | Parcial — ver abajo |
| `evidencia_faltante` | **no existe como estado propio** | No |

`ValorPublicable` sólo tiene un `"retenido"` genérico, con un array de
`motivos: string[]` en texto libre para explicar POR QUÉ (contradicción de
margen, cobertura parcial, política de envío sin confirmar, dato nunca
cargado, etc.). D4 pide separar dos causas de ausencia — "está bloqueado
aunque el dato podría existir" (`retenido`) vs. "directamente falta el
dato de entrada" (`evidencia_faltante`) — y hoy el código no distingue
esas dos causas a nivel de tipo: ambas caen en el mismo `"retenido"`, y la
única forma de saber cuál es cuál es leer el texto libre de `motivos`.

### Eje 1 (origen de la evidencia) — existe el TIPO, pero no se usa

`Evidencia<T>` (`src/documents/domain/types.ts:13-24`) es, estructuralmente,
el Eje 1 de D4, también con una diferencia: tampoco tiene
`estimado_configuracion`.

| D4 (Eje 1) | `Evidencia<T>` hoy | Coincide |
|---|---|---|
| `verificado` | `estado: "verificado"` | Sí, 1 a 1 |
| `declarado` | `estado: "declarado"` | Sí, 1 a 1 |
| `no_disponible` | `estado: "no_disponible"` | Sí, 1 a 1 |
| `no_aplica` | `estado: "no_aplica"` | Sí, 1 a 1 |
| `estimado_configuracion` | **no existe como estado propio** | No |

Pero hay un problema más grave que la falta de un estado: **`Evidencia<T>`
nunca llega a ningún renderer.** `context.evidencia: Record<string,
Evidencia<unknown>>` se construye en
`src/documents/domain/build-context.ts` (el diccionario de trazabilidad,
una entrada por campo declarado: `facturacion_mensual`, `mix_canales`,
`productos_muestra`, `politica_envio`, `margen_declarado`, etc.) pero
**ningún constructor de bloque (`blocks.ts`/`shared.ts`) ni ningún
renderer (PDF o web) lee `context.evidencia` en ningún punto** —
verificado por búsqueda exhaustiva: cero coincidencias de `context.evidencia`
o `.evidencia[` fuera de donde se construye. Existe sólo para trazabilidad
interna (`evidenciaIds: string[]` dentro de cada `ValorPublicable`, que
apunta a claves de este diccionario), nunca se muestra al lector.

**Conclusión:** hoy el lector de un documento SÓLO ve el Eje 2 (a través de
"Sin datos"/"Retenido" y de la etiqueta `confianza`), nunca el Eje 1. El
Eje 1 existe en el modelo de datos pero es invisible en el documento final.
Esto es exactamente lo que describe C-02: "un solo eje de estados donde se
exigen dos" — confirmado en código, no sólo en la lectura visual.

### La pieza que hoy hace de sustituto imperfecto de "los dos ejes": `confianza`

`ConfianzaDocumento = "alta" | "media" | "baja" | "bloqueada"`
(`src/documents/domain/types.ts:26`) es la única señal de calidad que
efectivamente se le muestra al lector hoy (badge "Confianza alta/media/baja",
o el estado especial "bloqueada"). Es una escala ÚNICA de cuatro valores
que en la práctica mezcla información de los dos ejes de D4 sin separarlos:
un valor puede tener confianza "media" porque el dato es `declarado` sin
validar (Eje 1) o porque depende de un supuesto de curva de adopción
(ninguno de los dos ejes de D4 — es una tercera dimensión, "depende de un
supuesto comercial", ya marcada aparte con el símbolo † y `assumptions:
string[]`, ver `src/documents/renderers/pdf/format.ts:22-31`). Colapsar
esto en una sola escala es la causa estructural de C-02.

## 3 · Localización de los cuatro focos pedidos, sin corregir nada

### "Sin datos — Sin datos" (E-04)

Cadena completa, de origen a pantalla:

1. `src/documents/domain/resumen-comercial.ts:115-131` — cuando ni el
   escenario conservador ni el potencial/base son calculables,
   `limiteInferior` y `limiteSuperior` quedan AMBOS `retenido` (motivos
   `MOTIVO_SIN_CONSERVADOR`/`MOTIVO_SIN_LIMITE_SUPERIOR`, líneas 64-68).
2. `src/documents/templates/velocentum-v1/blocks.ts:262-263`
   (`buildCommercialSummary`) — `publishValue()` sobre un `ValorPublicable`
   retenido devuelve `null` (regla general de `publishValue`,
   `blocks.ts:28-40`): tanto `range.lower` como `range.upper` llegan `null`
   al bloque.
3. Renderer PDF, `src/documents/renderers/pdf/document.tsx:567-571` —
   el string `"Sin datos"` está hardcodeado como reemplazo de cada extremo
   nulo, unidos con `" – "` — de ahí "Sin datos — Sin datos" literal.
4. Renderer web, `src/documents/renderers/web/document-renderer.tsx:247-253` —
   la MISMA situación (ambos extremos `null`) se muestra como `"Retenido"`
   (clase `vdoc-retained`), no `"Sin datos"`.

**Hallazgo adicional de este bloque, no listado con ID propio:** el PDF y
el renderer web usan DOS PALABRAS DISTINTAS para el mismo estado
("Sin datos" vs. "Retenido"). Ninguno de los dos usa el copy exacto de D4
(`"No se muestra hasta validar: [motivo]"` para `retenido`). Ninguno de
los dos asoma el `motivo` real (`MOTIVO_SIN_CONSERVADOR`/
`MOTIVO_SIN_LIMITE_SUPERIOR`) al lector — el texto se descarta al pasar
por `publishValue()`, que sólo devuelve `null`, sin el motivo.

### `no_aplica` mostrado como dato faltante (E-05)

Verificado el caso exacto (s6, MER tienda propia, inversión $0):
`src/documents/domain/build-context.ts:556-563`.

```ts
merTienda:
  datos.canal_tienda_no_aplica === true
    ? valorNoAplica("El cliente declaró que no vende por tienda propia.")
    : publicarNumero({
        valor: resultado.derivados.mer_tienda_propia,
        evidenciaIds: ["mix_canales", "inversion_meta", "inversion_google"],
        motivo: "Faltan facturación o inversión del perímetro de tienda propia.",
      }),
```

**Este hallazgo, tal como está formulado, no se sostiene literalmente:**
no hay ningún `no_aplica` siendo mal mostrado como "dato faltante". Con
inversión $0 pero SIN que el cliente haya declarado explícitamente "no
vendo por tienda propia" (`canal_tienda_no_aplica !== true`), el código
entra por la rama `publicarNumero(...)`, que devuelve `estado: "retenido"`
— es genuinamente "retenido" según el tipo, no `no_aplica` disfrazado.

Lo que SÍ es un hallazgo real, de fondo: **el modelo nunca considera "el
cliente declaró $0 de inversión publicitaria" como una razón válida de
`no_aplica`** para el MER — sólo "el cliente declaró que no vende por este
canal" lo es. Esto es inconsistente con el propio código: `roasProductAds`
(mismo archivo, líneas 572-579) sí trata una declaración explícita
(`ml_product_ads === false`) como `no_aplica`, pero ninguna métrica trata
"inversión en $0, declarada, no ausente" de la misma manera. Un MER
calculado sobre $0 de inversión no es un dato que falte — es una razón por
la que el ratio no se puede formar (división por cero real, no dato
ausente), conceptualmente más cerca de `no_aplica` que de `retenido`. **Sin
una decisión de producto sobre si "inversión $0 declarada" debe ser
`no_aplica` para MER, esto queda como DECISIÓN PENDIENTE** — no se
resuelve en este bloque documental.

### Cero real heredando la confianza del bloque (E-16)

`src/documents/domain/build-context.ts:131-142` (`publicarNumero`):

```ts
function publicarNumero(args: {
  valor: number | null | undefined;
  evidenciaIds: string[];
  motivo: string;
  confianza?: Exclude<ConfianzaDocumento, "bloqueada">;
}): ValorPublicable<number> {
  if (!finito(args.valor)) return valorRetenido(args.motivo);
  return valorCalculado({
    valor: args.valor,
    confianza: args.confianza ?? "media",
    evidenciaIds: args.evidenciaIds,
  });
}
```

`inversionTotal` (`build-context.ts:551-555`) llama a `publicarNumero` SIN
pasar `confianza` — cae en el default `"media"`, sin importar que el valor
sea un $0 real, exacto, calculado directamente de datos declarados
(`inversion_publicitaria_total`). "Confianza media" no describe la certeza
del número (que es total: es una suma de campos declarados, no una
estimación) — describe el hecho de que nadie pasó un valor explícito de
`confianza` en este call site. Confirmado: es el comportamiento general de
`publicarNumero` para CUALQUIER métrica de `metric-grid` que no reciba
`confianza` explícita, no un caso aislado de `inversionTotal`.

### Escenario íntegramente retenido con badge de confianza "alta" (E-07)

`src/documents/domain/escenarios-90d.ts:190-215`
(`escenarioCalculadoADocumento`), línea 201:

```ts
return {
  id: c.id,
  visible: visiblePara(c.id, confianzaDocumento),
  confianza: confianzaDocumento,   // <- el mismo valor para los tres escenarios
  ...
};
```

`confianzaDocumento` es la confianza GENERAL del documento (calculada una
sola vez en `build-context.ts` a partir de la cobertura y las
restricciones), pasada tal cual a los tres escenarios (conservador, base,
potencial) sin importar si las tres magnitudes de ESE escenario en
particular están calculadas o completamente retenidas. Un escenario sin una
sola cifra calculable puede llevar el mismo badge "ALTA" que uno con las
tres cifras publicadas, porque el badge nunca se calcula por escenario.

Además, la nota fija ("El presupuesto liberado por consolidación de pauta
puede reinvertirse…") se renderiza sin condición en ambos renderers
(`document.tsx:617-621`, `document-renderer.tsx:314-318`) — no hay ningún
`if (item.adSavings90d)` que la condicione, así que aparece aunque el
ahorro publicitario de ese escenario esté retenido.

## 4 · Cómo se representa el margen negativo hoy (D5)

Implementado en el bloque de corrección de incoherencias (commit
`e5080e2`, ya en HEAD): con margen de contribución calculado y negativo,
`src/lib/calculo-diagnostico.ts` retiene TODA fuga `usa_margen: true`
(motivo `"El margen de contribución calculado es negativo…"`), y
`src/lib/propuesta.ts` (`mapearHallazgos`) genera un hallazgo propio
`id: "margen_negativo"`, empujado primero en el array, capa
`"recomendacion"`. `src/documents/domain/build-context.ts`
(`prioridadDeHallazgo`) fuerza `prioridad: "alta"` para ese id específico.

Cotejado contra las cuatro exigencias de D5:

| Exigencia de D5 | Estado hoy |
|---|---|
| Alerta crítica visible en el diagnóstico | Sí — hallazgo `margen_negativo`, primero, prioridad alta. Pero usa el mismo componente visual (`findings`) y el mismo badge sin color propio que cualquier otro hallazgo "alta" (ver E-11): no hay una alerta VISUALMENTE distinta de las demás, sólo distinta en posición y en el campo `prioridad`. |
| Retención de toda proyección que dependa del margen | Sí — a nivel de `Fuga` (motor) y, en cascada, a nivel de `Escenario90d` (las líneas de contribución/ahorro dependen de las mismas fugas). No verificado en este bloque a nivel de PIXEL sobre un PDF real de un escenario con margen negativo Y datos de funnel simultáneamente (s4, el único escenario de margen negativo en la evidencia, no tiene datos de funnel cargados — ver `docs/visual/matriz-hallazgos.md`, fila E-10). |
| Conservación de hallazgos/recomendaciones que NO dependan del margen | Sí, estructuralmente: `mapearHallazgos` no filtra nada más que lo relacionado al margen; hallazgos como `medicion`, `creativos`, `angulo`, `comisiones` no leen `margen_contribucion`. |
| Posibilidad de preparar una propuesta cualitativa, sin promesas económicas | **DECISIÓN PENDIENTE.** Hoy `buildPropuestaDocument` no distingue "propuesta con proyecciones retenidas por margen negativo" de "propuesta con proyecciones retenidas por cualquier otro motivo" — no existe ningún tratamiento cualitativo especial. `commercial-summary` en la propuesta simplemente muestra el estado retenido genérico (ver E-04 arriba). Ningún wireframe de este bloque puede fijar cómo se ve "propuesta cualitativa sin promesas" porque no hay una decisión de copy/estructura tomada — se marca DECISIÓN PENDIENTE en `docs/visual/wireframes.md`. |
| No debe bloquear el documento entero ni ocultar el problema | Confirmado: el resto del diagnóstico (metric-grid con el −7,0% visible, otros hallazgos, restricciones) se sigue generando con normalidad. |

## 5 · Íconos y numeración (contexto para R-04)

No hay ningún sistema de iconografía lineal violeta en círculo en ningún
renderer — confirmado por búsqueda: cero referencias a un componente de
ícono en `document.tsx`/`document-renderer.tsx` fuera de
`SimboloVelocentum`/`WordmarkVelocentum` (la marca, no iconografía de
contenido) y el ícono genérico "i" de restricciones
(`document-renderer.tsx:507`, texto plano, no un ícono real). La
numeración "01/02/03" SÍ existe, pero sólo en el renderer WEB de
`findings` (`vdoc-finding__index`, `document-renderer.tsx:192-194`,
`String(index + 1).padStart(2, "0")`) — el renderer PDF de `findings`
(`document.tsx:530-549`) no numera nada. R-04 es, en la mitad web de
`findings`, una extensión de un patrón que ya existe ahí; en todo lo
demás (incluido el PDF completo), es una adición nueva.

## 6 · Resumen de DECISIÓN PENDIENTE de este documento

1. Redacción/estructura exacta para separar `retenido` de
   `evidencia_faltante` dentro de `ValorPublicable` (hoy un solo estado).
2. Si "inversión $0 declarada" debe tratarse como `no_aplica` para MER
   (y métricas análogas), en vez de `retenido` (ver E-05).
3. Cómo se ve, en concreto, una "propuesta cualitativa sin promesas
   económicas" cuando el margen es negativo (D5, quinta exigencia) — no
   hay componente ni copy definidos hoy.
4. Si el Eje 1 (`Evidencia<T>`/`context.evidencia`) debe empezar a
   renderizarse en algún bloque, y en cuál — hoy no se muestra en
   ninguno.
