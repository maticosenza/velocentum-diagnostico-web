# BV4 · Hallazgos diferidos del proyecto (H-6 en adelante)

Hermano de `docs/bv4-f2a-hallazgos-diferidos.md`, que cubre H-1 a H-5 y es
específico de la ronda 3 de F2a. Este archivo recoge lo que apareció **fuera**
de una ronda: en la auditoría del handoff y en el preflight del gate del
2026-09-02. Cada uno con ID, para que nadie lo redescubra ni lo tape.

Estado al 2026-09-05, después de la auditoría del preflight (veredicto
APROBADO CON CORRECCIONES), de la migración de la política de UPDATE y de las
dos corridas del gate de F2a: **H-7, H-14 y H-17 corregidos**, **H-8 mitigado
parcialmente**, **H-9 parcialmente encaminado**; **H-6**, **H-10**, **H-11**,
**H-12**, **H-13**, **H-15** y **H-16** quedan abiertos, ordenados, con dueño
humano. H-11 y H-12 entraron por esa auditoría: los dos estaban reportados en
el handoff del preflight, pero sin ID. H-13 lo abrió la propia migración:
aplicarla a mano deja la puerta abierta a que el cambio vuelva duplicado desde
Lovable. H-14, H-15 y H-16 los abrió el primer intento de correr el gate
(2026-09-03): el documento no se había ejecutado nunca. H-17 lo abrió la
primera corrida completa (2026-09-05), que sí llegó hasta el final.

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
ya usaba el INSERT de esa tabla. **Aplicada y verificada** ese mismo día en el
panel Cloud: `diagnostico` pasó de 3 a 4 políticas. Deliberadamente **no** copia el `USING true`
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

## H-13 · La migración de la política puede volver duplicada desde Lovable · abierto

Está verificado que **Lovable escribe migraciones al repo**: las cinco
anteriores las commiteó `gpt-engineer-app[bot]` junto con `types.ts`
regenerado. No está verificado el sentido contrario —que Lovable *no* lea
migraciones que le lleguen por el repo—; simplemente no se lo observó. La
dirección del flujo es una **inferencia**, no un hecho probado, y H-13 vale
igual bajo cualquiera de las dos lecturas.

El riesgo concreto: la política de UPDATE de `diagnostico` se aplicó a mano
desde el panel Cloud el 2026-09-02. Si Lovable genera **su propia** migración
por ese mismo cambio y la commitea a `main`, van a existir **dos archivos
creando la misma política**, y en **dos ramas ya divergidas**: la escrita a
mano vive en `feat/bv4-rebranding`, que no se pushea, y la generada viviría en
`main`.

El `DROP POLICY IF EXISTS` con el que empieza el SQL escrito a mano **mitiga el
fallo de ejecución, no la duplicación**. Son dos problemas distintos:

- *Ejecución*: reconstruir la base desde cero corriendo las dos migraciones en
  orden de timestamp no rompe, porque la segunda dropea antes de crear. Eso el
  `DROP` sí lo resuelve.
- *Duplicación*: el historial de migraciones queda con dos registros para un
  solo cambio, en dos ramas que hay que reconciliar a mano. Eso el `DROP` no lo
  toca. Y si la versión generada por Lovable tuviera **otro contenido** —por
  ejemplo `USING true`, que es lo que hacen las otras políticas de la base—,
  en una reconstrucción gana **la de timestamp más alto**, en silencio.

Qué hacer cuando `main` y la rama converjan: mirar
`supabase/migrations/` buscando una segunda migración que toque
`"Usuarios autenticados pueden editar diagnosticos"`, comparar su contenido
contra el archivo escrito a mano, y quedarse con una sola. La decisión de cuál
es de Matías. **No se resuelve por adelantado**: hoy no existe todavía esa
segunda migración, y adivinar su forma sería inventar.

## H-14 · El gate de F2a pedía una igualdad imposible y cargaba a ciegas · corregido

`docs/bv4-f2a-gate-navegador.md` pedía, hasta el 2026-09-03, que el SHA-256 del
PDF descargado del navegador fuera igual al del pipeline. **No podía pasar
nunca.** La app genera la fecha del diagnóstico al vuelo
(`diagnosticos.nuevo.tsx:279`, `new Date().toISOString().slice(0, 10)`), no hay
campo editable para fijarla, y esa fecha se imprime en la portada
(`velocentum-v2/shared.ts:55` → `document.tsx:1908` y `1942`). El fixture del
pipeline la tiene clavada en `2026-08-31`. Distinta fecha, distintos bytes,
distinto hash, aunque todo lo demás se cargue perfecto.

Además el documento no declaraba **ningún valor**: el paso 9 decía "cargar
precios en las líneas marcadas" sin decir cuáles, y la sección "Si no
coinciden" recién nombraba `SOBRE_SNAKE` / `SOBRE_TITAN` como fuente de verdad
*después* de que el gate fallara. Quien lo corría cargaba a ciegas y se
enteraba al final.

**Es el mismo patrón de H-7**: el documento se escribió sin ejecutarlo de punta
a punta. H-7 fue la variante de entorno (ningún prerrequisito declarado), H-14
es la variante de criterio y de datos. Las dos veces el defecto no estaba en lo
probado sino en la prueba, y las dos veces apareció recién al intentar correrlo.

Corregido el 2026-09-03: el criterio pasa a ser **comparación por contenido
extraído del PDF**, los valores de los dos casos quedan declarados en el
documento, y la única exclusión —la fecha— queda escrita y justificada. La
comparación vive en `generar-propuestas-f2a.test.ts` y reusa el extractor
`textoDelPdf` que ya usaba el gate del plan 30/60/90. La prueba de determinismo
por doble corrida, que era lo que el hash intentaba probar, se queda como está.

## H-15 · En modo B el formulario sólo captura el margen del producto principal · abierto

`diagnosticos.nuevo.tsx:891` decide qué campos se muestran por producto:

```ts
const conMontos = modo === "A" || n === 1;
```

En **modo B** ("Solo conversado"), del producto 2 en adelante sólo se pide
nombre y porcentaje de facturación. El motor, en cambio, acepta costo y precio
de los cinco (`calculo-diagnostico.ts:360-405`, `productosCargados`; los del producto 2 en
`:372-373`), y los
fixtures de regresión traen los tres: `casoSnakeStore` da
`margenes_producto = [0.6589, 0.6012, 0.6459, null, null]`.

No es una regresión de esta rama: `conMontos` entró en `645ed85`
(2026-08-17, `gpt-engineer-app[bot]`), el commit que partió el formulario en
modos A y B. La limitación nació con el modo B.

Ojo con el atajo de verificación: `git log -S "producto_2_costo" --
src/routes/ src/components/` vuelve vacío, pero **eso no prueba nada**. El
formulario arma los nombres de campo por interpolación
(`` `producto_${n}_costo` ``, `:888`), así que el literal nunca estuvo en esos
archivos; la misma búsqueda con `producto_1_costo` también vuelve vacía, y ese
campo sí existe y siempre existió. Comprobado el 2026-09-03.

Alcance real, medido y no supuesto: se renderizaron los cuatro PDFs con los
costos y precios de los productos 2 y 3 vaciados y se comparó el texto extraído
contra el de los fixtures completos. **La única diferencia es un número**: la
cobertura del catálogo, de `60%` a `30%` en Snake Store y a `20%` en Titan Web.
Los márgenes por producto no se imprimen en ningún lado. La consecuencia
grande está aguas arriba, no en el PDF: en una llamada sin acceso al panel sólo
se puede calcular el margen del producto principal, y la cobertura del catálogo
cae con él.

No es un problema del gate —que se corre en modo A, donde el caso entra
completo— y por eso **no se excluye nada** de la comparación por esto. **Va a
F2b**: hay que decidir si modo B tiene que poder capturar costo y precio de más
de un producto, o si la limitación es correcta y lo que falta es que el
documento lo diga.

## H-16 · Dos observaciones de interfaz del 2026-09-03 · una confirmada, otra no reproducida

Las dos salieron de intentar correr el gate a mano. Las dos van a F2b. Se
registran con lo que dice el código, no sólo con lo observado.

**a) No se puede volver a la pantalla de selección de modo A/B. Confirmado.**
`diagnosticos.nuevo.tsx:310` muestra esa pantalla sólo con `modo === null`, y
el único lugar que vuelve a tocar el modo después de elegirlo es `cambiarModo`
(`:211-221`), que cambia de A a B y de B a A pero **nunca vuelve a `null`**.
Elegido el modo, la pantalla de selección no se vuelve a ver en esa sesión de
formulario.

**b) Los toggles de canal minorista/mayorista no vuelven a "sin responder".
No se pudo reproducir en el código.** `CampoSiNo` sí vuelve a `null`:
`campos-formulario.tsx:252` hace `onChange(value === o.v ? null : o.v)`, o sea
que clickear el botón que ya está marcado lo limpia. Y los dos handlers de
estos campos pasan el valor tal cual (`:542` y `:548`), sin coercionar — a
diferencia de `¿Vende en Mercado Libre?` (`:536`), que hace `v === true` y por
eso ese sí queda atrapado en `false`. Queda anotado como **observación no
reproducida**: puede ser un problema de affordance —con `null` ningún botón
está resaltado, así que no se ve que el click "apagó" la respuesta— y no de
comportamiento. **No se cambió nada por esto.** Antes de tocar código hay que
reproducirlo con pasos exactos.

Lo que sí quedó confirmado del punto b es la **asimetría semántica**, y es la
que importa: el texto de ayuda de minorista dice que sin responder se asume que
sí, y para minorista es cierto (`mayorista.ts:58`: `!== false`, así que `null` y
`true` son lo mismo). Para mayorista **no** hay texto que lo diga y el
comportamiento es el opuesto (`mayorista.ts:59` y `:66`: `=== true`, así que
`null` equivale a **No**). Dos campos vecinos, misma apariencia, `null` con
significado opuesto. Está declarado en `docs/bv4-f2a-gate-navegador.md`,
sección 1, para que quien corra el gate no lo adivine.

## H-17 · El bloque de comandos del gate creaba un directorio vacío · CORREGIDO 2026-09-05

La sección 6 de `docs/bv4-f2a-gate-navegador.md` tenía `mkdir -p
/tmp/f2a-navegador`, un `ls` de ese directorio y los cuatro nombres esperados
como comentario, pero **no tenía el paso que llevaba los archivos ahí**. Quien
lo corriera al pie de la letra creaba el directorio vacío, lo listaba vacío —
sin que el `ls` fallara— y recién moría después, en la corrida del gate, con un
`ENOENT` sobre el primer PDF. Los cuatro descargados estaban todo el tiempo en
`~/Downloads`, ya renombrados por los pasos 17, 18 y 21.

**Es el mismo patrón de H-7 y de H-14**: el documento se escribió sin
ejecutarlo de punta a punta. H-7 fue la variante de entorno, H-14 la de criterio
y de datos, H-17 la de comandos — un bloque de bash que se lee bien y no hace lo
que dice hacer. Las tres veces el defecto estuvo en la prueba, no en lo probado,
y las tres veces apareció recién al intentar correrla. La corrida del 2026-09-05
es la primera que llegó hasta el final, y por eso pudo encontrarlo.

Corregido con un `cp` explícito desde `~/Downloads` con los cuatro nombres
completos, dejando el `ls` después como verificación. `cp` y no `mv`: si el gate
falla y hay que repetirlo, los originales tienen que seguir donde estaban.
