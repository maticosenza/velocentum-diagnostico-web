# BV4 · Hallazgos diferidos del proyecto (H-6 en adelante)

Hermano de `docs/bv4-f2a-hallazgos-diferidos.md`, que cubre H-1 a H-5 y es
específico de la ronda 3 de F2a. Este archivo recoge lo que apareció **fuera**
de una ronda: en la auditoría del handoff y en el preflight del gate del
2026-09-02. Cada uno con ID, para que nadie lo redescubra ni lo tape.

Estado al 2026-09-02, después de la auditoría del preflight (veredicto
APROBADO CON CORRECCIONES) y de la migración de la política de UPDATE:
**H-7 corregido**, **H-8 mitigado parcialmente**, **H-9 parcialmente
encaminado**; **H-6**, **H-10**, **H-11** y **H-12** quedan abiertos,
ordenados, con dueño humano. H-11 y H-12 entraron por esa auditoría: los dos
estaban reportados en el handoff del preflight, pero sin ID.

---

## H-6 · El handoff de F2a describe mal los warnings del build · deuda

El handoff (`docs/bv4-f2a-handoff.md`, punto 2) afirma que `vite build` sale
"con **exactamente los dos mismos warnings que el base `043ba08`** (chunk
>500 kB en `paginacion`/`marca`, e `inlineDynamicImports`)".

El log crudo del propio artefacto de F2a
(`qa/build-candidato.log` del ZIP de `04db2fb`) tiene **cinco clases**:

1. chunk mayor a 500 kB después de minificar;
2. `inlineDynamicImports option is ignored because the codeSplitting option is
   specified`;
3. dos `IMPORT_IS_UNDEFINED` de fontkit (`open` y `openSync`);
4. nueve `createServerFn().inputValidator() is deprecated. Use
   createServerFn().validator() instead.`, en tres archivos.

La afirmación es **falsa por construcción**, no por descuido de medición: uno
de esos tres archivos es `src/lib/seleccion-comercial-v2.functions.ts`, que
**F2a creó**. El base `043ba08` no pudo haber emitido ese warning porque el
archivo no existía.

Deuda concreta: migrar los tres server functions de `.inputValidator()` a
`.validator()`. **No se hizo en el preflight**: habría cambiado la superficie
de tres archivos que el preflight tenía que tocar lo menos posible.

## H-7 · El gate no declaraba prerrequisitos de entorno · CORREGIDO 2026-09-02

`docs/bv4-f2a-gate-navegador.md` se escribió sin declarar una sola variable de
entorno. El gate frenó en el primer intento por eso: el flujo comercial exigía
`SUPABASE_SERVICE_ROLE_KEY`, que no está en el `.env` local ni va a estar.

Corregido con la sección **0-bis · Prerrequisitos de entorno**, que dice qué
variables hacen falta, cuáles no, quién las lee y por qué. Sólo nombres:
ningún valor entra al documento.

## H-8 · La escritura comercial no tiene cobertura contra base real · abierto

Ninguna prueba de la suite ejerce la escritura de los tres server functions
contra una base. Por eso las 1128 pruebas pasaban verdes mientras el flujo del
navegador se caía en el primer guardado: **la suite no podía ver el problema.**

Mitigado parcialmente en el preflight con
`src/lib/escritura-comercial-autenticada.test.ts` (12 pruebas): fija que los
tres obtienen su cliente por la vía autenticada y que no queda ninguna
referencia a `supabaseAdmin` ni a `client.server`. Verificado por mutación
—revertir un archivo pone la prueba en rojo—, así que una regresión futura
rompe la suite.

Lo que sigue abierto: eso es una prueba de **fuente**, no de comportamiento.
No hay nada que ejercite un guardado real contra Postgres con RLS aplicando.
Cubrirlo pide una base de prueba y es tarea aparte.

## H-9 · RLS sin verificación de propiedad · abierto, parcialmente encaminado

El escaneo de seguridad de Lovable reporta tres hallazgos abiertos sobre la
misma base:

- **Crítico**, tabla `diagnostico`: políticas SELECT y DELETE con `true` para
  cualquier usuario autenticado, sin chequeo de propiedad.
- **Crítico**, tabla `oportunidad`: SELECT, UPDATE y DELETE con `true`; la
  tabla contiene datos de contacto.
- **Warning**, tabla `configuracion`: cualquier autenticado puede escribir.

**Evidencia verificada** (panel Cloud de Lovable, Database → RLS policies,
2026-09-02). Esto es lo que H-9 no tenía y ahora sí:

| Tabla | Políticas | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `configuracion` | 4 | `USING true` | `CHECK true` | `USING true` | `USING true` |
| `diagnostico` | **3** | `USING true` | `CHECK (auth.uid() = creado_por)` | **NO EXISTÍA** | `USING true` |
| `oportunidad` | 4 | `USING true` | `CHECK (auth.uid() = creado_por)` | `USING true` | `USING true` |

Los datos actuales son de prueba —cuatro registros, un solo usuario—, así que
es **deuda ordenada, no urgencia**.

**Lo que sí se hizo, y por qué no es "arreglar H-9 de paso":** la fila de
`diagnostico` decía *NO EXISTE* en UPDATE, y eso no es una política floja sino
una **ausente**. Con RLS, lo que no está permitido está prohibido: después del
preflight, ninguna escritura del usuario podía pasar y el gate quedaba
bloqueado. La migración del 2026-09-02 (autorizada como excepción, alcance
exclusivo a esa política) la crea **con chequeo de propiedad**,
`auth.uid() = creado_por` en `USING` y en `WITH CHECK`, el mismo criterio que
ya usaba el INSERT de esa tabla. Deliberadamente **no** copia el `USING true`
de las otras: habría sido sumarle un cuarto punto a H-9 mientras se lo empieza
a cerrar.

Así que H-9 queda **parcialmente encaminado**: el criterio correcto ya está
aplicado en un punto de la base, y sirve de precedente para los demás. Lo que
sigue pendiente son las seis políticas con `true` de las tres tablas y las de
SELECT y DELETE de `diagnostico`. Cada una pide su propia migración y su
propia aprobación.

Relación con el preflight, que conviene dejar explícita: pasar de service role
al cliente del usuario **no relajó nada**. Al contrario, las políticas pasaron
a aplicar de verdad donde antes se salteaban — hasta el punto de descubrir que
una faltaba.

## H-10 · Claves publishable en el historial del repo · bajo riesgo, abierto

`.env` estuvo versionado desde `0b2a054` hasta `6035ebf`, que lo sacó del
seguimiento y lo agregó a `.gitignore`. En ese tramo del historial quedan las
claves **publishable** de Supabase (dos: la del servidor y la `VITE_`).

Riesgo bajo por definición: son claves pensadas para ser públicas —viajan al
navegador en cualquier build— y su superficie está acotada por RLS, que es
justamente lo que H-9 señala. `ANTHROPIC_API_KEY` **nunca entró** al historial:
verificado contando líneas agregadas en todas las versiones de `.env`, cero.

Limpiar el historial exige reescribirlo, y el repo está conectado a Lovable:
no se hace sin decisión humana explícita.

## H-11 · Cinco errores de formato preexistentes en `propuesta.functions.ts` · deuda

`npx eslint src/lib/propuesta.functions.ts` da **cinco errores
`prettier/prettier`** en las líneas 52-66, todos en el tipado inline de
`oportunidad` y en el `Number(...)` de `oportunidad_total`: saltos de línea que
Prettier quiere y el archivo no tiene.

Son **preexistentes**, no los introdujo el preflight: verificados idénticos en
`6035ebf` corriendo el mismo eslint sobre el árbol guardado con `git stash`.

Por qué no se corrigieron en el preflight: formatearlos habría metido en el
diff líneas que el arreglo no necesitaba tocar. El preflight cambiaba tres
líneas por archivo en dos archivos que ya funcionaban en producción, y el
criterio era que el diff mostrara exactamente eso y nada más. Un `prettier
--write` habría reescrito quince líneas ajenas al cambio y hecho más difícil
de auditar lo único que importaba.

Deuda concreta: un `npx prettier --write src/lib/propuesta.functions.ts` en un
commit aparte, que no mezcle formato con lógica. `npm run lint` no es parte
del gate de QA de ninguna fase, así que esto no rompe nada mientras tanto.

## H-12 · `supabaseAdmin` quedó sin importadores · código muerto, no se borra

Después del preflight, **ningún archivo de `src/` importa `supabaseAdmin`**
(la única mención fuera de su propio archivo está en la prueba que justamente
verifica que nadie lo use). `src/integrations/supabase/client.server.ts` sigue
exportando un cliente de service role que saltea RLS y que ya no usa nadie.

Es código muerto **con superficie de riesgo**: está a un import de distancia de
volver a saltear RLS, ahora que RLS por fin aplica de verdad. Y sigue leyendo
`SUPABASE_SERVICE_ROLE_KEY`, una variable que en Lovable Cloud no existe: si
alguien lo importa, revienta en runtime, no en compilación.

**No se borra.** Su línea 1 dice "This file is automatically generated. Do not
edit it directly": borrarlo es una decisión de Matías, y probablemente haya que
tomarla del lado de Lovable, no del repo. Queda registrado para que la próxima
persona que lo vea sepa que la orfandad es deliberada y conocida.
