# BV4 · Hallazgos diferidos del proyecto (H-6 en adelante)

Hermano de `docs/bv4-f2a-hallazgos-diferidos.md`, que cubre H-1 a H-5 y es
específico de la ronda 3 de F2a. Este archivo recoge lo que apareció **fuera**
de una ronda, sea cual sea su origen: la auditoría del handoff y el preflight
del gate del 2026-09-02, las corridas del gate, la auditoría del formulario
de carga del 2026-09-10, la auditoría del motor de cálculo del 2026-09-10 y
la auditoría de las salidas del 2026-09-11 (pantalla de detalle, listado,
propuesta IA y cadena documental v2). Cada uno con ID, para que nadie lo
redescubra ni lo tape.

Estado al 2026-09-11, después de la auditoría del preflight (veredicto
APROBADO CON CORRECCIONES), de la migración de la política de UPDATE, de las
dos corridas del gate de F2a, de la auditoría del formulario de carga del
2026-09-10, de la auditoría del motor de cálculo del 2026-09-10 y de la
auditoría de las salidas del 2026-09-11: **H-7, H-14 y H-17 corregidos**,
**H-8 mitigado parcialmente**, **H-9 parcialmente encaminado**; **H-6**,
**H-10**, **H-11**, **H-12**, **H-13**, **H-15**, **H-16** (sólo el punto b:
el a se resolvió el 2026-09-12), **H-19 a H-22 y H-24 a H-27**,
**H-28 a H-30 y H-32 a H-37**, **H-38, H-39, H-41 a H-44, H-47 y H-48**, **H-49**, **H-52**, **H-53** y **H-54** quedan abiertos, ordenados, con dueño
humano; **H-51** queda en pausa por una decisión de producto. H-11 y H-12 entraron por esa auditoría: los dos estaban
reportados en el handoff del preflight, pero sin ID. H-13 lo abrió la propia
migración: aplicarla a mano deja la puerta abierta a que el cambio vuelva
duplicado desde Lovable. H-14, H-15 y H-16 los abrió el primer intento de
correr el gate (2026-09-03): el documento no se había ejecutado nunca. H-17 lo
abrió la primera corrida completa (2026-09-05), que sí llegó hasta el final.
H-18 a H-27 los abrió la auditoría del formulario de carga del 2026-09-10
(`diagnosticos.nuevo.tsx`, `campos-formulario.tsx`, `bloque-canales.tsx`,
`diagnostico-form.ts`, cruzados contra lo que el motor consume): son del
formulario, no del motor, que ya estaba auditado. Están corregidos H-18 (`c18c49c`, 2026-09-11) y H-23 (2026-09-12).
Los diez están ordenados por impacto en una llamada real. H-28 a H-37 los
abrió la auditoría del motor de cálculo del 2026-09-10
(`calculo-diagnostico.ts`, `contradiccion.ts`, `mayorista.ts`, `funnel.ts`,
`canales.ts`, `dinero.ts`, `impacto-economico.ts`; sin entrar al formulario,
los documentos ni la base): son del motor. Sólo H-31 está corregido (2026-09-12). Cuatro de
ellos (H-28, H-29, H-30 y H-34) tienen diseño de arreglo, sin aprobar y sin
aplicar, en `docs/bv4-motor-arreglos-propuestos.md`. Los diez están
ordenados por impacto en una llamada comercial real. H-38 a H-47 los abrió
la auditoría de las salidas del 2026-09-11 (`diagnosticos.$id.tsx`,
`index.tsx`, `propuesta-seccion.tsx`, `propuesta.ts`, y la cadena documental
v2: `build-context.ts`, `escenarios-90d.ts`, `resumen-comercial.ts`,
`estado.ts`, `document-renderer.tsx`, plantillas `velocentum-v2`): son de lo
que ve el vendedor en pantalla y de lo que recibiría el prospecto en los
documentos, no del formulario ni del motor. H-48 se verificó aparte, con
grep, el mismo día. H-49 lo abrió el 2026-09-11 el intento de llevar al
listado el arreglo de `ac3b3f2`: es el pendiente que la sección 4 del estado
del 2026-09-10 (hoy `docs/bv4-estado-2026-09-11.md`) había dejado sin ID. De
H-38 a H-49 están corregidos H-40 (`7948164`, 2026-09-11), H-45 (`ccbd98e`, 2026-09-15) y H-46 (`c345230` y `ccbd98e`, 2026-09-15; "CPA objetivo" y "ROAS objetivo" se quedan por decisión de Matías). H-50 lo abrió el
diseño del arreglo de H-18. H-51 lo abrió el 2026-09-12 el arreglo de
"Cancelar" del formulario de carga, y H-52 la verificación de ese arreglo en
el navegador. H-53 y H-54 salieron el mismo día, al poner H-51 en pausa: son
lo que su arreglo parcial (`1099ba9`) no cubre. H-55 salió el mismo día del
análisis previo al arreglo de H-23, y quedó corregido junto con él. H-56 salió
el mismo día de la consola del navegador, al no abrir los diagnósticos del
18/8, y quedó corregido en el commit que lo registra. H-38 no es un bug con arreglo
obvio: requiere una decisión de producto sobre qué "oportunidad" es la
oficial. Aclaración que atraviesa a varios: `src/documents/motor-activo.ts:19`
tiene `MOTOR_DOCUMENTAL_ACTIVO = "v1"`, así que todo lo referido a la cadena
v2 describe lo que pasará al activar el interruptor, no lo que el prospecto
recibe hoy. Los seis hallazgos menores y las cuatro sospechas sin verificar
de esa auditoría no llevan ID: quedan al final del archivo, en la sección
"Auditoría de salidas 2026-09-11: fuera del registro".

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

**Resuelto el 2026-09-12, sin tocar `cambiarModo`.** El camino concreto era el
borrador: "Cancelar" sólo navegaba al listado, el borrador seguía en
`localStorage` con `modo`, y al volver se recuperaba con el modo ya elegido.
Ahora "Cancelar" descarta el borrador (pide confirmación si hay datos
cargados), y el aviso de borrador retomado tiene "Empezar de cero", que vuelve
a `modo === null` sin salir de la pantalla. Los números de línea de arriba son
del 2026-09-03.

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

## H-18 · Cambiar de modo borra datos sin confirmación y la pantalla promete lo contrario · CORREGIDO 2026-09-11

Dispara con un clic en "cambiar" del encabezado del formulario
(`diagnosticos.nuevo.tsx:384`), que llama a `cambiarModo` directo, sin
confirmación.

`diagnosticos.nuevo.tsx:211-221` pisa con el valor inicial todo lo listado en
`CAMPOS_EXCLUSIVOS` del modo anterior (`diagnostico-form.ts:668-682`). De A a
B se pierden `facturacion_pixel`, `capi_estado`, `conjuntos_activos`,
`presupuesto_diario`, `visitas_mensuales` y los cinco `csv_*`
(`csv_gasto_total`, `csv_frecuencia_promedio`, `csv_ctr_global`,
`csv_conjuntos_bajo_gasto`, `csv_dias_periodo`). De B a A se pierden
`tiene_analytics`, `numeros_meta_coinciden`, `gasto_diario` y
`cantidad_campanas`. Volver al modo original no los restaura: `cambiarModo`
sólo escribe `DATOS_INICIALES[campo]`.

La pantalla de elección de modo dice "Podés cambiarlo después sin perder lo
cargado" (`diagnosticos.nuevo.tsx:315`).

Consecuencia: una importación entera del CSV de Meta (`CargaCsvMeta`,
`diagnosticos.nuevo.tsx:970-986`) desaparece con un clic, y el motor recalcula
sin bloque Cuenta ni delta de medición.

**Corregido el 2026-09-11 en `c18c49c`.** Se evaluó "ocultar sin borrar" y se
descartó: el motor lee por presencia, no por modo (`calculo-diagnostico.ts:1000-1004`,
`presupuesto_diario` pisa a `gasto_diario`), así que un campo oculto con valor
alimentaría el cálculo sin que se vea. En su lugar, `cambiarModo` mueve lo
exclusivo con valor a un estado aparte (`estacionados`), fuera de `datos`, y lo
restaura al volver al modo original (`estacionarAlCambiarModo`,
`diagnostico-form.ts`). Si hay exclusivos cargados, "cambiar" pide confirmación
con la cantidad; al guardar con algo estacionado, avisa que no se incluye sin
bloquear. El borrador persiste lo estacionado. El texto de la pantalla de
elección ahora dice lo que pasa. Ver H-50 para la misma incoherencia en los
productos 2 a 5, que este arreglo no cubre. La lógica de estacionar y restaurar
está cubierta por tests (`diagnostico-form.test.ts`), pero los diálogos y el
aviso no se probaron en el navegador al momento de escribir esto.

## H-19 · En modo B el bloque Web nunca genera funnel, aunque la pantalla lo muestre completo · abierto

Visitas mensuales sólo se pide en modo A (`diagnosticos.nuevo.tsx:1021`,
`{modo === "A" && <CampoNumero label="Visitas mensuales" .../>}`). La
completitud de Web en modo B se calcula sin visitas
(`diagnostico-form.ts:645`: `["agregados_carrito", "checkouts_iniciados",
"carritos_abandonados"]`), así que el bloque llega a 3/3 y tilde verde.

`funnel.ts:201-205`: con `visitas === null` el estado es `sin_datos` y la
función retorna antes de usar agregados o checkouts. `funnel.ts:408`: en
`sin_datos`, `tramosFunnel` devuelve `[]`. `calculo-diagnostico.ts:957-959`:
la conversión de tienda (`crTienda`) queda `null` sin visitas.
`calculo-diagnostico.ts:1167-1172`: el estado del bloque web queda
`sin_datos`.

Los tres campos que B sí pide sólo sirven para la validación de coherencia en
vivo (`funnel.ts:186-199`, cadena visitas ≥ carrito ≥ checkout ≥ compras
sobre las etapas presentes). Ninguna oportunidad de navegación, carrito ni
checkout existe en modo B.

Se combina con H-18: un diagnóstico que empezó en A, cargó visitas y pasó a B
las pierde (`visitas_mensuales` está en `CAMPOS_EXCLUSIVOS.A`,
`diagnostico-form.ts:674`).

## H-20 · En modo B el bloque Cuenta pide dos campos y no produce nada · abierto

Modo B pide gasto diario y cantidad de campañas
(`diagnosticos.nuevo.tsx:1002-1016`). `cantidad_campanas` no lo lee ningún
módulo: grep de `\bcantidad_campanas\b` en `src` fuera de tests, fixtures y el
propio formulario devuelve cero lectores.

El estado del bloque Cuenta exige `conjuntos_activos > 0`
(`calculo-diagnostico.ts:1153-1163`) y la fuga por sobrefragmentación lo pide
como faltante (`calculo-diagnostico.ts:1261`, `faltantes(datos,
["conjuntos_activos"])`). Modo B nunca pide conjuntos activos (sólo aparece en
el bloque de modo A, `diagnosticos.nuevo.tsx:988-992`), y al pasar de A a B se
borran (H-18).

`gasto_diario` entra como respaldo de `presupuesto_diario`
(`calculo-diagnostico.ts:1000-1004`) y de ahí sólo llega a
`inversion_actual_mensual` (`calculo-diagnostico.ts:1012` y `:1131`); todo lo
demás que usa `presupuestoDiario` (`:1008-1009`, `:1154-1160`, `:1262`)
necesita además los conjuntos.

Consecuencia: en modo B, Cuenta es siempre `sin_datos` y la sobrefragmentación
queda retenida con un faltante que el formulario no ofrece cargar.

## H-21 · Ocultar la pestaña Mercado Libre no apaga sus datos en el motor · abierto

`diagnosticos.nuevo.tsx:171-177` (`bloquesVisibles`) sólo filtra la
visibilidad del bloque `mercado_libre` según `vende_mercado_libre`. El único
efecto asociado (`:179-182`) cambia de pestaña; ningún efecto ni handler limpia
campos `ml_*` al pasar el toggle a "No".

`vende_mercado_libre` tiene cero lecturas en `calculo-diagnostico.ts` y en
`canales.ts`. Los campos de la pestaña oculta sí se leen:
`ml_inversion_product_ads` en `calculo-diagnostico.ts:562`
(`inversionProductAds`), `ml_ventas_product_ads` en `:813` y `:985`,
`ml_pct_facturacion` como respaldo del porcentaje del canal en
`canales.ts:548` (`pctCanal`), que a su vez decide `estadoCanal`
(`canales.ts:552-555`), `coberturaCanales` (`:565-568`) y `canalPrincipal`
(`:589-595`). La inversión publicitaria total suma Product Ads sin condición
(`calculo-diagnostico.ts:578-583`).

Sólo la propuesta respeta el toggle: `propuesta.ts:438` (clips) y `:483`
(Product Ads) chequean `vende_mercado_libre`.

Consecuencia: con "No" en "¿Vende en Mercado Libre?", MER, inversión total,
cobertura de canales y canal principal siguen contando lo que se cargó antes
de ocultar la pestaña.

**Avance 2026-09-12, sigue abierto.** El "No" escribe `canal_ml_no_aplica`
(`respuestaVendeMercadoLibre`, `diagnostico-form.ts`): `estadoCanal` da
`no_aplica` y el porcentaje de ML, incluido el respaldo `ml_pct_facturacion`,
deja de contar para cobertura y canal principal. Product Ads cargado sigue
sumando a la inversión total. Los diagnósticos guardados antes no traen
`canal_ml_no_aplica` y se recalculan como antes; la pantalla de detalle igual
saca la tarjeta de ML con `vende_mercado_libre === false`. Tests en
`src/lib/detalle-perimetro.test.ts`.

## H-22 · El porcentaje de Mercado Libre se pide por dos caminos que pueden desacordar · abierto

Pestaña Mercado Libre: `ml_pct_facturacion`, `CampoPorcentaje` sin `maximo`
(`diagnosticos.nuevo.tsx:1190-1194`). Pestaña Canales: `canal_ml_pct`,
`CampoPorcentaje` con `maximo={100}` (`bloque-canales.tsx:94-100`).

`canales.ts:545-549` (`pctCanal`): gana `canal_ml_pct`; `ml_pct_facturacion`
es respaldo sólo cuando el primero es `null`. Pero `bloque-canales.tsx:96`
muestra únicamente `datos[c.pct]` (`canal_ml_pct`), mientras que el pie de
cobertura y el texto "declarado / no aplica / sin datos"
(`bloque-canales.tsx:163-192`, vía `coberturaCanales`, `canalPrincipal` y
`estadoCanal`) usan `pctCanal`.

Consecuencia con 30 en la pestaña ML y el campo de Canales vacío: Canales
muestra el campo vacío y abajo "Mercado Libre: declarado", cobertura 30%.
Consecuencia con 150 en la pestaña ML (sin tope): `canalesSuperan100`
(`canales.ts:575-577`) es verdadero, `faltantesMargen` retiene el margen
(`calculo-diagnostico.ts:541-543`) y el aviso rojo "Los porcentajes suman más
de 100" aparece en Canales (`bloque-canales.tsx:179-183`), donde el campo
causante no está.

## H-23 · Los productos "quitados" siguen entrando al cálculo y a la suma en pantalla · CORREGIDO 2026-09-12

"Quitar" sólo baja `cantidad_productos` (`diagnosticos.nuevo.tsx:870`,
`set("cantidad_productos", Math.max(1, cantidad - 1))`); no borra nombre,
costo, precio ni porcentaje del producto que desaparece de la lista
(`:886`, el render itera hasta `cantidadProductosDe(datos)`).

`productosCargados` lee los cinco productos sin mirar `cantidad_productos`
(`calculo-diagnostico.ts:360-405`; `cantidad_productos` tiene cero referencias
en `calculo-diagnostico.ts`). `coberturaProductos` también
(`calculo-diagnostico.ts:412-418`), y de ella depende que se publique el
margen total (`:897-898`, `:904`, `:918`). "Suma de la lista" en pantalla suma
los cinco porcentajes (`diagnosticos.nuevo.tsx:923-929`).

Consecuencia: un producto 4 cargado y luego quitado sigue pesando en el margen
por canal, puede completar el 100% de cobertura del catálogo y hace que la
suma en pantalla no coincida con las filas visibles.

**Corregido el 2026-09-12, junto con H-50.** Los números de línea de arriba son
de antes de H-18: hoy "Quitar" está en `diagnosticos.nuevo.tsx:1038` y el
render en `:1054`. `productosCargados` recibe el modo y sólo lee los primeros
`cantidadProductosDe(d)` productos; `coberturaProductos` hereda el filtro, y
con ella el margen total. "Suma de la lista" suma sólo las filas visibles. Un
diagnóstico guardado sin `cantidad_productos` (anterior a la fase 5) lee 3,
que es lo que `cantidadProductosDe` ya devolvía y lo que esa versión del
formulario tenía. Los fixtures de regresión no cambian: `casoSnakeStore` y
`casoTitanWebB1` heredan `cantidad_productos: 3` de `DATOS_INICIALES` y cargan
tres productos, así que su cobertura sigue en 60%. Cambiaron cuatro tests de
`producto-dinamico.test.ts` que cargaban los productos 4 y 5 sin declarar la
cantidad (heredaban 3), que es justo el estado que este arreglo deja afuera:
ahora declaran 5, o 4. Del lado del formulario, que "Quitar" dejara datos
cargados debajo de la lista está en H-55.

## H-24 · La barra de progreso cuenta menos bloques de los que lista · abierto

`diagnosticos.nuevo.tsx:355-358` cuenta como denominador sólo los bloques con
`camposPorBloque(modo, b.id).length > 0`, y `:438` imprime
"{bloquesCompletos} de {bloquesConCampos} bloques completos". Medición en modo
B devuelve lista vacía (`diagnostico-form.ts:622`, `modo === "A" ?
["facturacion_pixel", "capi_estado"] : []`) y Mayorista siempre
(`diagnostico-form.ts:601`, `mayorista: []`). La lista de navegación, en
cambio, itera `bloquesVisibles` completo (`diagnosticos.nuevo.tsx:448`).

Confirmado por configuración:

| Modo | ML | Mayorista | Bloques listados | La barra dice "de" |
|---|---|---|---|---|
| B | no | no | 8 | 7 |
| B | sí | no | 9 | 8 |
| A | sí | no | 9 | 9 |
| A | sí | sí | 10 | 9 |

La observación original ("0 de 7" con 8 listados en modo B; "9" y 9 en modo A)
queda confirmada por esas líneas. Los bloques sin campos además aparecen sin
contador ni tilde en la navegación (`diagnosticos.nuevo.tsx:475`,
`tieneCampos && (...)`).

## H-25 · Envío e inversión se piden en Economía y otra vez en Canales; el motor elige uno sin avisar · abierto

**Envío.** Economía pide `absorbe_costo_envio`, `costo_envio_promedio`,
`envio_bruto` y `envio_cobrado_comprador` (`diagnosticos.nuevo.tsx:648-695`);
Canales pide "Envío neto del canal" (`canal_tienda_envio_neto` /
`canal_ml_envio_neto`, `bloque-canales.tsx:138-143`).
`calculo-diagnostico.ts:699-702`: si `absorbe_costo_envio === false` el envío
del canal se ignora y vale 0 aunque esté cargado; si no, el del canal gana
sobre el compartido (`numeroCanal(d, canal, "envio_neto") ??
envioNetoVendedor(d)`). El recuadro "Envío neto del vendedor" de Economía
(`diagnosticos.nuevo.tsx:683-685`) muestra sólo `envioNetoVendedor(datos)`,
que no lee los campos de canal (`calculo-diagnostico.ts:426-438`).

**Inversión.** Economía pide `inversion_meta` e `inversion_google`
(`diagnosticos.nuevo.tsx:838-847`); Canales pide "Inversión publicitaria del
canal" (`canal_tienda_inversion`, `bloque-canales.tsx:144-148`).
`calculo-diagnostico.ts:579` y `:598`: el de canal gana
(`numeroCanal(d, "tienda_propia", "inversion") ?? inversionMetaGoogle(d)`).
Las dependencias de la fuga de gasto no rentable siguen nombrando
`inversion_meta` e `inversion_google` (`calculo-diagnostico.ts:1252`).

Consecuencia: el número que ve el vendedor en Economía no es el que usa el
motor cuando Canales tiene un valor distinto, y nada en pantalla dice cuál
ganó.

## H-26 · Veintiún campos se piden y ningún módulo fuera del formulario los lee · abierto

Grep de cada campo del modelo (`DatosDiagnostico`, `diagnostico-form.ts`)
contra `src` excluyendo tests, fixtures, `diagnostico-form.ts` y
`diagnosticos.nuevo.tsx`. Sin ningún lector:

- Medición: `tiene_pixel` (`diagnosticos.nuevo.tsx:556-560` y `:585-589`),
  `capi_estado` (`:566-571`), `tiene_analytics` (`:590-594`),
  `numeros_meta_coinciden` (`:595-599`).
- Cuenta: `cantidad_campanas` (`:1009-1014`), `csv_gasto_total`,
  `csv_frecuencia_promedio`, `csv_ctr_global`, `csv_conjuntos_bajo_gasto`,
  `csv_dias_periodo` (los cinco se escriben en `:979-983`).
- Productos: `reparto_pauta` (`:947-964`).
- Web: `retargeting_abandono` (`:1053-1057`), `retencion_secuencia_contactos`
  (`:1085-1090`).
- Mercado Libre: `ml_productos_publicados` (`:1195-1199`).
- Mayorista: `mayorista_pct_catalogo_apto` (`:1233-1238`),
  `mayorista_precio_lista` (`:1239-1243`), `mayorista_tiene_escalas_volumen`
  (`:1244-1249`), `mayorista_tipo_comprador` (`:1250-1255`),
  `mayorista_condiciones_pago` (`:1256-1261`), `mayorista_canal_usado`
  (`:1262-1267`), `mayorista_ticket_inicial` (`:1357-1361`).

Consecuencia concreta: Medición en modo A exige `capi_estado` para llegar al
100% (`diagnostico-form.ts:622`) y nadie lo usa. Los cinco campos del CSV se
guardan en `datos` (`diagnosticos.nuevo.tsx:280`) y no alimentan ningún
derivado. Sólo `mayorista_tiene_escalas_volumen` avisa en su ayuda que es
contextual (`diagnosticos.nuevo.tsx:1248`); los otros veinte se piden como si
contaran.

## H-27 · Dos textos en pantalla dicen algo distinto de lo que hace el motor · abierto

**Carritos abandonados.** La ayuda del campo dice "Es referencia: la
oportunidad se calcula con el embudo" (`diagnosticos.nuevo.tsx:1045`). El
motor lo usa como base de la fuga "Recuperación de carritos abandonados"
(`calculo-diagnostico.ts:1329-1419`: `carritosBase = d.carritos_abandonados`,
`carritosAdicionales = carritosBase * mejora`, `:1369`), y con cero o vacío
esa fuga directamente no existe (`:1329`, `finito(...) && > 0`). El embudo
(`funnel.ts`) no lee `carritos_abandonados`.

**Origen del dato por bloque.** `ORIGEN_DATOS` no distingue modo
(`diagnostico-form.ts:693-707`) y se muestra tal cual bajo el título de cada
pestaña (`diagnosticos.nuevo.tsx:494`, `{ORIGEN_DATOS[bloque]}`). En modo B,
Medición dice "Events Manager, pestaña Resumen. Ojo que Meta solo guarda unos
dos meses de historial." (`diagnostico-form.ts:695-696`) y Cuenta dice "Meta
Ads Manager: filtrá el mes, activá 'Con entrega', desglosá por conjunto de
anuncios y exportá." (`:701-702`), mientras la descripción del propio modo B
dice "Sin acceso al panel. Los datos salen de lo que cuenta el prospecto."
(`diagnostico-form.ts:14`).

## H-28 · La conversión de tienda y el funnel mezclan ventas de Mercado Libre con visitas de la tienda · abierto

`src/lib/calculo-diagnostico.ts:952-959` calcula pedidos como facturación total sobre ticket y los divide por visitas de tienda. `src/lib/funnel.ts:121-129` hace lo mismo para las compras del funnel: cae a `facturacion_mensual` completa cuando no hay `canal_tienda_facturacion`, ignorando el porcentaje declarado del canal, que sí usa `facturacionCanal` en la línea 602. Entrada: mix 40% tienda / 60% ML, facturación 10M, ticket 20k, 20k visitas. Salida: `cr_tienda` 0,025 y 500 compras en el funnel, cuando la tienda factura 4M y tiene 200 pedidos. El usuario ve una conversión de tienda 2,5 veces inflada, un estado de funnel más verde de lo real y fugas de funnel valorizadas sobre compras de otro canal.

Diseño de arreglo (sin aprobar, sin aplicar): `docs/bv4-motor-arreglos-propuestos.md`, arreglo 1.

## H-29 · Inversión publicitaria parcial se publica como total · abierto

`calculo-diagnostico.ts:566-583`: si Meta está cargado y Product Ads (o Google) es null, el desconocido se suma como 0. Eso alimenta `mer_actual` (989-992), el estado de economía (1145-1150), `contribucion_marginal` (994-997) y la fuga por gasto no rentable (1212). Entrada: mix 40/60, `inversion_meta` 1M, `ml_inversion_product_ads` null. Salida: `inversion_publicitaria_total` 1M, MER 10, economía verde, sin fuga de gasto. Variante 2b: `inversion_meta` 0 y Google null da `hay_inversion_publicitaria: false` ("declaró que no invierte") con Google sin relevar. El usuario ve un MER y un resultado marginal que solo cubren una parte del gasto.

Diseño de arreglo (sin aprobar, sin aplicar): `docs/bv4-motor-arreglos-propuestos.md`, arreglo 2, incluido el análisis del caso Titan Web B1.

## H-30 · Retención asimétrica en el canal: MER retenido, resultado después de publicidad publicado · abierto

`calculo-diagnostico.ts:802` exige inversión conocida para el MER del canal, pero la línea 808 hace `contribucionAntes - (inversion ?? 0)`. Entrada: ML con 6M de facturación y sin inversión cargada. Salida: `mer: null`, `resultado_despues_publicidad: 2.700.000`, idéntico a `contribucion_antes_publicidad`. El usuario lee "resultado después de publicidad" como si el canal no gastara nada en pauta.

Diseño de arreglo (sin aprobar, sin aplicar): `docs/bv4-motor-arreglos-propuestos.md`, arreglo 3.

## H-31 · Margen retenido por cobertura: se publica la muestra pero las fugas piden un campo que no existe · CORREGIDO 2026-09-12

`faltantesMargen` (533-550) no revisa productos ni cobertura, y `margenDeCanal` devuelve `margen: null` con `faltantes: []` cuando no hay productos (849). El motor solo expande `margen_contribucion` para los tramos del funnel (1193-1195); gasto no rentable (1216), carrito (1344) y recompra (1459) lo dejan como está. Entrada: todos los campos cargados, un solo producto con 60% de facturación. Salida: `margen_muestra: 0.5` publicado, `margen_contribucion: null`, y seis fugas no calculables cuyo único faltante es `margen_contribucion`. Entrada 4b: sin productos cargados, canal con `faltantes: []`. El usuario ve un margen del 50% en pantalla y al lado "falta el margen"; no hay ningún dato que pueda ir a pedirle al cliente porque lo que falta es `producto_N_pct_facturacion`, que no aparece.

**Corregido el 2026-09-12, en el motor y no en la pantalla.** Los faltantes
viajan fuera del detalle (a los impactos retenidos como `dependencias`, a la
propuesta IA, a cualquier consumidor futuro), y el motor ya expandía
`margen_contribucion` para el funnel: traducirlo sólo en pantalla dejaba dos
criterios. `faltantesMargenTotal(d, modo, margenMuestra, faltantesCanales)`
devuelve los campos del formulario que destraban el total, y
`calcularDiagnostico` reemplaza con ellos a `margen_contribucion`, en su lugar
y sin repetir, en las cuatro fugas que lo pedían (tramos del funnel, gasto no
rentable, recuperación de carrito y recompra). Dos casos:

- **Muestra calculada, total retenido.** La causa es cobertura. Si un
  producto del cálculo no tiene porcentaje, se pide ese porcentaje. Si uno de
  la lista tiene nombre o porcentaje pero no montos, se piden sus montos (en
  modo B sólo los del principal, porque del 2 al 5 no hay dónde cargarlos). Si
  todos tienen porcentaje y no llegan a 100, se piden los porcentajes de los
  productos del cálculo, que son los que hay que revisar. Si el mix de canales
  no llega a 100, se suman los porcentajes de los canales que no están en "no
  aplica".
- **Ningún producto en el cálculo** (el caso 4b): los campos del producto
  principal, más `faltantesMargen` y los faltantes de los canales que alimentan
  el margen.

En cualquier otro caso (el margen no se calcula por una causa que no es
cobertura, o es negativo) se conserva `margen_contribucion`: una lista
incompleta sería peor que la genérica. El detalle traduce los campos nuevos
(`ETIQUETAS_CAMPO`: "% de facturación del producto N", "costo del producto
N", "% de facturación de Mercado Libre"…). El resto de los identificadores
crudos sigue en H-42.

Medido sobre los fixtures, sin cambiarlos. Snake Store no tiene fugas que
dependan del margen (no carga inversión, carritos ni recompra: sólo
sobrefragmentación), así que su salida no cambia. Titan Web B1 sí: gasto no
rentable, por Product Ads, pasa de `margen_contribucion` a
`producto_1_pct_facturacion`, `producto_2_pct_facturacion` y
`producto_3_pct_facturacion`. Ojo con ese caso: su margen de muestra es
negativo (−0,0452), así que completar la cobertura no destraba la cifra, la
lleva a `margen_negativo`. Lo que pide es correcto (es lo que retiene el
total), pero no es lo único que falta resolver. Ningún documento imprime
faltantes, y el gate de F2a sigue verde sin tocarlo. Cambió un test,
`calculo-diagnostico.test.ts` (mix 60/30): el funnel esperaba
`margen_contribucion` y ahora recibe `canal_tienda_pct` y `canal_ml_pct`.

## H-32 · Cupón declarado sin porcentaje se valoriza como si no hubiera cupón · abierto

`calculo-diagnostico.ts:1375-1378` y `1491-1494`: `retencion_usa_cupon === true` con `retencion_cupon_pct` null da `cuponPct = null`, y la contribución por carrito se calcula sin descuento. Entrada: 100 carritos, 5% actual, 15% objetivo, cupón sí, porcentaje vacío. Salida: 100.000 de oportunidad; con cupón del 20% da 60.000. El usuario ve la oportunidad de recuperación y de recompra sobreestimada, con `confianza: "media"`, y ningún faltante.

## H-33 · Costo de campaña de recompra ausente se toma como cero · abierto

`calculo-diagnostico.ts:1503-1505`: `recompra_costo_campana_mensual` null pasa a 0 y se resta nada. Entrada: los cinco campos mínimos de recompra cargados, costo null. Salida: 2.000.000, igual que declarando costo 0, confianza "media", y `recompra_costo_campana_mensual` listado como dependencia como si se hubiera usado. El usuario lee una oportunidad neta de campaña que en realidad es bruta.

## H-34 · Porcentajes de producto que suman más de 100 se declaran cobertura completa · abierto

`coberturaProductos` (412-418) recorta a 100 con `Math.min`, y la línea 898 lee eso como cobertura explícita del 100%. `canalesSuperan100` bloquea el caso análogo en canales; en productos no hay bloqueo. Entrada: dos productos con 60% y 60%. Salida: `cobertura_productos: 100`, `margen_contribucion: 0.575` publicado como total, pesos 0,5 y 0,5. El usuario ve un margen total respaldado por un mix imposible.

Diseño de arreglo (sin aprobar, sin aplicar): `docs/bv4-motor-arreglos-propuestos.md`, arreglo 7.

## H-35 · Una fuga que da cero real desaparece de la lista, igual que una no evaluada · abierto

`calculo-diagnostico.ts:1196` descarta tramos con monto 0; 1235 es un `else if` sin `else` (MER por encima del breakeven no genera fuga); 1368 y 1483 omiten carrito y recompra cuando la mejora no es positiva. Entrada: inversión 100k con MER 100, recompra actual 40% contra objetivo 30%. Salida: `fugas` contiene solo sobrefragmentación. El usuario no distingue "gasto rentable, revisado" de "no se pudo evaluar el gasto".

## H-36 · Pixel en cero explícito se lee como ausencia de dato · abierto

`calculo-diagnostico.ts:867-874` exige `facturacion_pixel > 0`. Entrada: `facturacion_pixel` 0 con `inversion_meta` 1M. Salida: `delta_medicion: null`, medición `sin_datos`, sin hallazgo de riesgo. El usuario ve "sin datos" en medición para una cuenta que invierte y cuyo Pixel no atribuye nada.

## H-37 · Mayorista: contribución negativa publicada y recupero de CAC con un faltante falso · abierto

`src/lib/mayorista.ts:169-170` publica un margen negativo cuando el precio real está debajo del costo; 193 lo multiplica por el ticket y publica una contribución por pedido negativa; 273-275 entonces retiene el recupero de CAC agregando `mayorista_ticket_recompra` a faltantes aunque el ticket esté cargado. Entrada: costos unitarios que superan `mayorista_precio_venta_real`. El usuario ve una contribución por pedido en negativo y, al lado, "falta el ticket de recompra".

---

## Auditoría de las salidas · 2026-09-11 · H-38 a H-48

Fuente: reporte de la auditoría de las salidas del 2026-09-11, registrado verbatim (evidencia archivo:línea y corridas tal como vinieron). Nota de alcance del reporte, textual: "`src/documents/motor-activo.ts:19` tiene `MOTOR_DOCUMENTAL_ACTIVO = "v1"`. Hoy el botón "Ver documentos" y la descarga sirven las plantillas v1 (`build-document.ts:289-299`). Los hallazgos sobre la cadena v2 describen lo que el prospecto va a recibir cuando se active el interruptor. No audité v1." Esa nota se repite al pie del encabezado de cada hallazgo que la necesita (H-38, H-39, H-43, H-44). Las referencias `:NNN` sin archivo siguen la convención del reporte: apuntan al último archivo nombrado en la misma oración o, en los hallazgos del detalle, a `diagnosticos.$id.tsx`. Al registrarlos no había ninguno de los once corregido; después se corrigieron H-40 (`7948164`, 2026-09-11), H-45 (`ccbd98e`, 2026-09-15) y H-46 (`c345230` y `ccbd98e`, 2026-09-15; "CPA objetivo" y "ROAS objetivo" se quedan por decisión de Matías).

Advertencia de transcripción: el texto del hallazgo 1 (H-38) llegó con el render roto en el tramo que va desde la primera cita de archivo hasta "Corrida A" (los signos `$` se interpretaron como fórmula y partieron el texto letra por letra). Se reconstruyó carácter por carácter; el resto de los hallazgos llegó limpio.

## H-38 · El mismo diagnóstico tiene tres "oportunidades" que no coinciden ni en número ni en concepto · abierto, requiere decisión de producto

> Nota de alcance (verbatim del reporte): `src/documents/motor-activo.ts:19` tiene `MOTOR_DOCUMENTAL_ACTIVO = "v1"`. Hoy el botón "Ver documentos" y la descarga sirven las plantillas v1 (`build-document.ts:289-299`). Lo que este hallazgo dice sobre la cadena v2 describe lo que el prospecto va a recibir cuando se active el interruptor. La cadena v1 no fue auditada.

El detalle suma todas las fugas con monto, contribución de funnel y ahorro de pauta juntos, y lo llama "Oportunidad mensual estimada" con un piso de 0,6 (`diagnosticos.$id.tsx:189-190, 629-638`; motor `calculo-diagnostico.ts:1642-1645, 1686-1687`). La proyección y la propuesta v2 encabezan con contribución incremental acumulada a 90 días del escenario conservador, sólo impactos de contribución, con rampa 25/50/75 (`escenarios-90d.ts:310-311, 324-326`; `resumen-comercial.ts:145-155`; `build-context.ts:1114-1121`; renderer `document-renderer.tsx:338-343`). La regla documental prohíbe sumar contribución con ahorro (`escenarios-90d.ts:11-13`). La propuesta IA recibe el total mensual mezclado (`propuesta.ts:578`). Corrida A: el vendedor ve en pantalla "$ 7.199.999 a $ 11.999.999" mensual y el prospecto lee "$ 13.327.086" a 90 días, rango hasta "$ 20.879.101", con un ahorro de "$ 4.500.000" aparte. La palabra "conservador" significa 0,6 en la pantalla y una curva de adopción en el PDF.

**No es un bug con arreglo obvio.** Las tres cifras salen de tres definiciones distintas de "oportunidad", cada una coherente consigo misma. Resolverlo exige una decisión de producto: cuál es la cifra oficial que ve el vendedor, cuál lee el prospecto, y si ambas tienen que coincidir o basta con que se llamen distinto. Hasta esa decisión no hay arreglo que aplicar.

## H-39 · Un solo campo de recompra cargado deja la propuesta sin cifra, mientras el detalle muestra el rango completo · abierto

> Nota de alcance (verbatim del reporte): `src/documents/motor-activo.ts:19` tiene `MOTOR_DOCUMENTAL_ACTIVO = "v1"`. Hoy el botón "Ver documentos" y la descarga sirven las plantillas v1 (`build-document.ts:289-299`). Lo que este hallazgo dice sobre la cadena v2 describe lo que el prospecto va a recibir cuando se active el interruptor. La cadena v1 no fue auditada.

Cualquier dato de recompra crea la fuga recompra no calculable con un impacto retenido (`calculo-diagnostico.ts:1441-1480`). Un impacto retenido retiene el agregado entero de contribución (`impacto-economico.ts:186-189`, `escenarios-90d.ts:311`). Corrida B, sólo `recompra_tiene_secuencia_postventa: false`: el detalle sigue diciendo "$ 7.199.999 a $ 11.999.999" con cuatro fugas valorizadas; la propuesta v2 imprime en el encabezado "No se muestra hasta validar: Sin los cinco datos mínimos de recompra, la oportunidad queda como recomendación cualitativa." (`estado.ts:35-41`, `document-renderer.tsx:336-343`), sin redacción del rango y sin nota puente. Mismo mecanismo con recuperación de carrito no calculable (`calculo-diagnostico.ts:1338-1364`). El motivo es texto interno y lo lee el prospecto.

## H-40 · La propuesta IA del detalle pega montos a los hallazgos por palabra clave, y la clave "mer" atrapa cualquier título con "Mercado", "comercial" o "número" · CORREGIDO 2026-09-11

`propuesta-seccion.tsx:11-16, 22-30` busca claves por id de fuga. Los ids `conversion` y `carritos_abandonados` ya no existen en el motor; para los tramos de funnel cae a la etiqueta "Fuga por carrito", que ningún título redactado contiene. Corrida F, con gasto no rentable presente: "Publicaciones de Mercado Libre sin clips" y "Estrategia comercial sin foco" reciben `gasto_no_rentable`, y el vendedor ve "$ 2.015.067" al lado de clips (`:117-125`). "Carritos que no llegan al checkout" y "Pocas visitas llegan a agregar al carrito" no reciben monto en ninguna corrida.

**Corregido el 2026-09-11, en el mismo commit que cierra esta entrada.** Además de las dos claves muertas, los cuatro ids que emite el funnel (`funnel_navegacion`, `funnel_carrito`, `funnel_checkout`, `funnel_combinado`, armados en `funnel.ts` y sumados a `fugas` en `calculo-diagnostico.ts:1191-1210`) tampoco tenían clave y caían a la etiqueta ("Fuga por carrito", etc.). Se descartó arreglar el emparejamiento por texto: aun con palabras completas, "carrito" pega con el tramo del funnel y con la recuperación de carrito, y "rentab" con un título sobre Product Ads. Tampoco se le pide al modelo el id de la fuga, porque sería la misma adivinanza en otro lado. El modelo copia en `hallazgo_id` el `id` del hallazgo de `mapearHallazgos` que redacta (`PROMPT_PROPUESTA`, `normalizarPropuesta`), y la fuga sale de `FUGA_DE_HALLAZGO` en `propuesta.ts`. Sin id, con id sin fuga, con monto no positivo o con id repetido, no hay monto. El hallazgo de recuperación de carrito imprime el monto con la aclaración "solo recuperación de carrito, sin recompra", porque su título habla de las dos cosas. Las propuestas guardadas antes de este cambio no tienen `hallazgo_id` y quedan sin montos hasta regenerarlas (decisión explícita: hoy mostraban algunos bien y otros mal, sin forma de saber cuáles). Tests en `propuesta-montos.test.ts`.

## H-41 · Con algo calculable, el titular del detalle muestra un total parcial sin marcarlo, y la IA lo recibe como cifra cerrada · abierto

El aviso de "rango pendiente" sólo dispara con total en cero (`diagnosticos.$id.tsx:596`). Con total mayor a cero y fugas pendientes, `:626-644` imprime el rango sin ninguna marca; las pendientes recién aparecen al pie de la lista de fugas (`:793-802`). Corrida B lo reproduce. El listado hace lo mismo (`index.tsx:188-191`). La IA recibe `oportunidad_total` y sólo las fugas calculables (`propuesta.ts:578-580`) con la orden de no mencionar faltantes (`:626-627`), así que redacta la cifra como completa.

## H-42 · Identificadores internos crudos en el titular y en la lista de faltantes · abierto

`diagnosticos.$id.tsx:75-88` traduce 12 nombres; el motor emite al menos 19 ids en faltantes más los de `faltantesMargen` (`calculo-diagnostico.ts:533-550`, `canales.ts:580-583`). Con margen negativo el motor agrega `margen_negativo` (`calculo-diagnostico.ts:1608-1619`) y el titular queda "Falta margen de contribución, margen_negativo y CPA objetivo para realizar este cálculo." (`:596-616`, corrida C). En fugas, "No se pudo calcular. Faltan: margen de contribución, margen_negativo." (`:797-798`); el detalle explicativo del motor (`:1616`) no se imprime ahí. Con contradicción confirmada: "Faltan: margen_en_contradiccion" (`:1590`). Corrida D: "Faltan: margen de contribución, canal_tienda_pct, canal_ml_pct".

## H-43 · En la propuesta v2, lo que falta validar se imprime como acciones del plan, como sección propia y como alcance de cada servicio · abierto

> Nota de alcance (verbatim del reporte): `src/documents/motor-activo.ts:19` tiene `MOTOR_DOCUMENTAL_ACTIVO = "v1"`. Hoy el botón "Ver documentos" y la descarga sirven las plantillas v1 (`build-document.ts:289-299`). Lo que este hallazgo dice sobre la cadena v2 describe lo que el prospecto va a recibir cuando se active el interruptor. La cadena v1 no fue auditada.

Cada restricción entra como acción de los días 61 a 90 y en "Resultado: Avance sobre … la restricción "Cobertura de canales parcial"" (`build-context.ts:533-538`, `document-renderer.tsx:534-535`). Corrida H: acciones de la etapa 90 son "Meta Ads" y "Cobertura de canales parcial"; corrida D: "Mix de canales inconsistente". La sección "Qué falta validar" va en la propuesta (`templates/velocentum-v2/propuesta.ts:115`, `shared.ts:112-121`) con textos como "El cálculo legado puede existir, pero la rentabilidad no se publica hasta confirmar si el vendedor absorbe el costo y cuál es el neto." (`build-context.ts:287-289`) y "El mix conocido cubre 0% de la facturación." (`:269`). Los servicios viajan con `alcance: []` siempre (`:619`) y "Qué vamos a trabajar" imprime "Alcance a validar" en cada tarjeta (`document-renderer.tsx:554`, template `:97`).

## H-44 · Cobertura de canales: 120 % en el detalle, 100 % en el documento · abierto

> Nota de alcance (verbatim del reporte): `src/documents/motor-activo.ts:19` tiene `MOTOR_DOCUMENTAL_ACTIVO = "v1"`. Hoy el botón "Ver documentos" y la descarga sirven las plantillas v1 (`build-document.ts:289-299`). Lo que este hallazgo dice sobre la cadena v2 describe lo que el prospecto va a recibir cuando se active el interruptor. La cadena v1 no fue auditada.

El detalle imprime `cobertura_canales` crudo y sólo avisa por debajo de 100 (`diagnosticos.$id.tsx:1026, 1036`). El contexto documental recorta a 100 (`build-context.ts:149-151, 881`) y agrega la restricción (`:258-264`). Corrida D: pantalla "Cobertura declarada 120%" sin aviso; documento "Cobertura de canales 100%", "Confianza media" y en la misma página "Los porcentajes declarados por canal superan el 100%".

## H-45 · "Inversión actual mensual" no es la inversión actual del negocio · CORREGIDO 2026-09-15

Es presupuesto diario de Meta por 30 (`calculo-diagnostico.ts:1000-1004, 1012`). El detalle la titula así en `:915` y dos filas arriba muestra "Inversión publicitaria total", que es Meta más Google más Product Ads declarados (`:871-877`, motor `:578-583`). Corrida F: "$ 1.980.000" y "$ 25.000.000" en la misma pantalla. La lectura textual de presupuesto compara la primera contra el piso (`:337-343`).

Verificado el 2026-09-15: sigue abierto después de `b2c88a5`. Ese commit reordena las filas que rodean a "Inversión actual mensual" en Presupuesto, pero la fila sigue ahí con la misma etiqueta (`diagnosticos.$id.tsx:1044`), el valor sigue siendo presupuesto diario de Meta × 30 (`calculo-diagnostico.ts:1223`) y "Inversión publicitaria total" sigue en la misma pantalla (`diagnosticos.$id.tsx:981`).

**Corregido el 2026-09-15 en `ccbd98e`.** La fila de Presupuesto pasa a llamarse "Presupuesto diario de Meta × 30" (`diagnosticos.$id.tsx:1071-1076`): dice lo que es, una proyección y sólo de Meta, y ya no se confunde con "Inversión publicitaria total" de Economía. El motor no cambia: `inversion_actual_mensual` se sigue calculando igual (`calculo-diagnostico.ts:1225`) y conserva su nombre en los derivados. `lecturaPresupuesto` (`calculo-diagnostico.ts:338-349`) no imprime el valor, pero lo compara contra el piso y decía "el presupuesto", que al lado de la inversión total se leía como toda la pauta; ahora dice "el presupuesto de Meta" en las dos ramas que usan ese valor. La rama de volumen insuficiente no lo usa y queda igual. El test que la cubre (`calculo-diagnostico.test.ts:426`) sigue pasando sin cambios.

## H-46 · Duplicados y derivados triviales en el detalle · CORREGIDO 2026-09-15; CPA objetivo y ROAS objetivo se quedan por decisión de Matías

- "MER tienda propia" y "MER Mercado Libre" (`:857-861`) repiten "MER del canal" de cada tarjeta (`:1085`); misma fórmula en `:974-981` y `:801-802`. "ROAS de Product Ads" aparece en `:862-869` y en `:1098-1103`.
- "Pedidos mensuales estimados" (`:878`), "Compras semanales estimadas" (`:920`, es pedidos ÷ 4,3 en `:1015`) y "Compras estimadas" del funnel (`:969`, misma división cuando no hay facturación por canal, `funnel.ts:121-129`).
- Conjuntos activos y sostenibles en el semáforo (`:672-675`) y en presupuesto (`:916-919`).
- Breakeven ROAS en el semáforo (`:667`), en el respaldo (`:703`), en economía (`:851`) y por canal (`:1104`). "CPA objetivo" y "ROAS objetivo" (`:854-855`) son breakeven con reserva (`:944-949`); "Reserva aplicada" (`:853`) es la constante de configuración (`:943`).
- "Origen de la comisión" (`:1077-1080`) y "Evidencia" (`:1081`) leen el mismo campo `comision_evidencia`.

**Corregido el 2026-09-15 en `c345230`.** Los números de línea de arriba son los del reporte, anteriores al commit; los de abajo son los de después. Cada métrica queda en un solo lugar. MER y ROAS de Product Ads de Mercado Libre viven en la tarjeta del canal de Resumen, que los lee de los derivados del negocio (`mer_marketplace`, `roas_product_ads`) y no de los del canal: es la misma cuenta, pero así aparecen aunque el canal no tenga participación declarada. Salen de Economía y de las tarjetas de canal de Detalle. Margen total y breakeven salen de Economía de Detalle. MER combinado y conjuntos activos vs. sostenibles quedan sólo en su píldora. "Origen de la comisión" y "Evidencia" pasan a una sola fila. Salen la fila suelta de compras semanales, la fila "hoy / necesarias" de Presupuesto y la conversión global del funnel. El test de la tarjeta de Mercado Libre sin participación declarada está en `resumen-diagnostico.test.tsx`.

Cuatro duplicados se conservan a propósito:

- Breakeven ROAS y conversión de la tienda siguen en las píldoras del semáforo (`diagnosticos.$id.tsx:771, 786-788`) además de Resumen, porque ahí ese número explica el estado de la píldora.
- La comisión efectiva de Mercado Libre sigue en la tarjeta del canal de Detalle (`:1220`) además de Resumen, porque ahí la califican el origen, la vigencia de la regla (`:1221-1227`) y el aviso de cargo fijo sin verificar (`:1247-1252`).
- "Breakeven del canal" (`:1240`) no es duplicado: es otra métrica, 1/margen del canal (`calculo-diagnostico.ts:1015`), no el breakeven del negocio.
- "Compras estimadas" del funnel (`:1107`) es la compra de la tienda propia (facturación de la tienda sobre ticket, `evaluarFunnel` en `funnel.ts`) y coincide con "Pedidos mensuales estimados" (`:988`) sólo en canal único.

Había quedado abierto el punto de "CPA objetivo", "ROAS objetivo" y "Reserva aplicada" (verificado el 2026-09-15): `c345230` no los sacó. Seguían en Economía de Detalle (`diagnosticos.$id.tsx:977-979`), al lado de "CPA breakeven" (`:976`). No son duplicados literales, porque cada uno aparece una sola vez en la pantalla: son los derivados triviales del cuarto punto de arriba. Los dos objetivos son breakeven con reserva, y la reserva es la constante de configuración.

**Cerrado parcialmente el 2026-09-15 en `ccbd98e`, por decisión de Matías del mismo día.** "Reserva aplicada" sale de la pantalla: es cómo se calculan los otros dos, no una métrica para mostrar. El motor la sigue usando para calcularlos (`derivados.reserva` no cambia). "CPA objetivo" y "ROAS objetivo" se quedan en Economía de Detalle (`diagnosticos.$id.tsx:1005-1006`), al lado de "CPA breakeven": son lo que le dice al cliente a qué apuntar. Con eso no queda nada abierto en H-46.

## H-47 · Filas y secciones que salen vacías casi siempre, y métricas que en una llamada no dicen nada · abierto

- Quien no vende en Mercado Libre ve "—" y "Sin datos" en `:861-869` y una tarjeta de Mercado Libre siempre presente con "No aplica" o "Sin datos" (`:1013-1014, 1044-1070`); `derivados.canales` trae dos entradas siempre (`calculo-diagnostico.ts:879`).
- La sección de funnel se muestra con estado `sin_datos` porque `:949` sólo oculta `no_aplica`: sin visitas, ocho filas en "—" (`funnel.ts:201-205`). En modo B es siempre así (H-19).
- "Margen total (negocio completo)" (`:846`) exige 100 % explícito de productos y de canales (`:897-918`); las dos fixtures reales lo dejan en "—".
- Para una llamada: "Reserva aplicada", "Piso teórico mensual (optimizando por compra, un conjunto)" (`:903-906`), "Supuestos usados (confianza: media)" con cuatro frases fijas (`calculo-diagnostico.ts:1041-1055`), "Comisión provisional: es un benchmark…" (`:1105-1110`), "Vigencia de la regla" (`:1082-1084`) y la marca "Estimación parcial: faltan etapas intermedias del funnel" (`:735-741`).

## H-48 · `EXPLICACION_FUGA` en el detalle tiene claves para ids de fuga que el motor ya no emite · abierto

Verificado aparte con grep el 2026-09-11, fuera del reporte. `src/routes/_authenticated/diagnosticos.$id.tsx:90-96` define `EXPLICACION_FUGA` (justo después de `ETIQUETAS_CAMPO`, que arranca en `:75`) con cuatro claves: `conversion` (`:91`), `gasto_no_rentable` (`:93`), `fatiga_creativa` (`:94`) y `sobrefragmentacion` (`:95`). Los ids que el motor emite hoy en `src/lib/calculo-diagnostico.ts` son cinco: `gasto_no_rentable` (`:1220, :1239`), `sobrefragmentacion` (`:1266, :1290`), `recuperacion_carrito` (`:1350, :1389`), `recompra` (`:1465, :1509`) y `medicion` (`:1546`). No hay ningún `id: "conversion"` ni `id: "fatiga_creativa"` en `src/lib`; los tests lo confirman explícitamente (`calculo-diagnostico.test.ts:256, :272, :458` verifican que esos dos ids no aparecen). El mapa se consume en `:773` con `f.detalle ?? EXPLICACION_FUGA[f.id] ?? ""`. Es el mismo patrón de claves muertas que H-40 describe para `CLAVES_FUGA` en `propuesta-seccion.tsx:11-16` (allí las muertas son `conversion` y `carritos_abandonados`).

Observación secundaria, del mismo grep: además de las dos claves muertas, faltan explicaciones para `medicion`, `recompra` y `recuperacion_carrito`. Tres de las cinco fugas vigentes no tienen entrada en el mapa, así que cuando el motor no trae `detalle` esas tres salen sin texto explicativo en pantalla (el `?? ""` de `:773` imprime vacío).

---

## H-49 · El listado muestra "$ 0" cuando el total es cero por fugas sin calcular, y no tiene con qué distinguirlo del cero real · abierto

Es el pendiente que el estado del 2026-09-10 (sección 4; hoy `docs/bv4-estado-2026-09-11.md`) dejó sin ID al registrar `ac3b3f2`. Verificado el 2026-09-11 al intentar arreglarlo. `src/routes/_authenticated/index.tsx:188-190` imprime `formatARS(f.oportunidad_total)` siempre que el valor sea un número. Un `oportunidad_total` en 0 porque ninguna fuga pudo calcularse es un número, así que el listado muestra "$ 0" para el mismo caso que el detalle ya distingue desde `ac3b3f2` (`diagnosticos.$id.tsx:596`, guard `total === 0 && fugasSinCalcular.length > 0`).

La causa no está en la celda: está en lo que la pantalla pide. La query del listado (`index.tsx:70-80`) selecciona `id, fecha, version, oportunidad_id, oportunidad_total` más nombre, vertical y estado de la oportunidad. No trae `fugas`, ni `derivados`, ni `estados_bloque`. El detalle distingue el caso filtrando la columna jsonb `fugas` por `calculable === false` (`diagnosticos.$id.tsx:193`); esa columna es lo único que lo marca. En la tabla `diagnostico` (`supabase/migrations/20260816212403_*.sql:62-74`) no hay ninguna columna que diga "pendiente": `oportunidad_total numeric NOT NULL DEFAULT 0` no distingue cero real de cero por ignorancia, y las cuatro migraciones posteriores que tocan la tabla tampoco agregan una.

Opciones evaluadas el 2026-09-11, ninguna aplicada:

1. **Ampliar la query para traer `fugas`** y replicar en la celda el criterio del detalle. Es la única que reproduce la distinción exacta con lo que hay en la base. Costo: trae un jsonb completo por fila para pintar una celda, en la pantalla que lista todos los diagnósticos. Descartada por ese costo.
2. **Traer `fugas` pero pedir sólo lo necesario** con un select anidado. PostgREST no filtra dentro de un jsonb en el select, así que en la práctica es la opción 1 con otro nombre. Descartada por lo mismo.
3. **No tocar la query y mostrar "—" para todo `oportunidad_total === 0`.** Elimina el "$ 0" engañoso, pero también oculta el cero real, que es justamente la distinción que el detalle conserva y que se quiere conservar. Descartada: rompe el criterio.
4. **Columna derivada al guardar** (un booleano tipo "oportunidad pendiente", calculado por el motor cuando persiste el diagnóstico) y que el listado la lea. Es la solución correcta: el listado lee un dato ya derivado en vez de recalcular desde las fugas. **Toca la persistencia** (migración, escritura al guardar, tipos), y el contrato maestro lo prohíbe sin decisión explícita. Es la que queda pendiente de esa decisión.

Mientras tanto el listado queda como está, con "$ 0" para ese caso, y la query sin cambios. El detalle sí lo distingue.

## H-50 · Costo y precio de los productos 2 a 5 se ocultan en modo B pero no se borran, y el motor los usa igual · CORREGIDO 2026-09-12

Encontrado el 2026-09-11 al diseñar el arreglo de H-18. Es la misma
incoherencia por presencia que H-18 tenía en los campos exclusivos, en un
lugar que `CAMPOS_EXCLUSIVOS` no cubre. Va junto a H-15, que documenta la
limitación de captura; este hallazgo es sobre lo que pasa con lo ya cargado.

`diagnosticos.nuevo.tsx:952` decide si se muestran costo y precio por
producto:

```ts
const conMontos = modo === "A" || n === 1;
```

y `:961` los renderiza sólo si `conMontos`. En **modo B**, del producto 2 al
5 los campos `producto_N_costo` y `producto_N_precio` no se ven, pero:

- **No están en `CAMPOS_EXCLUSIVOS`** (`diagnostico-form.ts:668-682`), así que
  cambiar de modo no los toca: ni los borraba antes de `c18c49c` ni los
  estaciona ahora. Quedan en `datos` con el valor que tuvieran.
- **El motor los lee por presencia**: `productosCargados`
  (`calculo-diagnostico.ts:360-405`) toma `producto_2_costo` y
  `producto_2_precio` en `:372-373`, y lo mismo para 3, 4 y 5 en `:379-394`.
  Con eso calcula margen por producto y cobertura del catálogo (`:413`).

Dos formas de disparar:

1. Cargar costo y precio de los productos 2 y 3 en modo A, cambiar a modo B
   y guardar. El diagnóstico queda en modo B con márgenes de tres productos
   que el vendedor no vio en pantalla al guardar. La confirmación de H-18 no
   los cuenta, porque no son exclusivos.
2. "Editar y recalcular" un diagnóstico de modo A que tenga los cinco
   productos con montos, con la nueva versión en modo B. La pantalla muestra
   sólo nombre y porcentaje del producto 2 en adelante; el motor calcula con
   los costos heredados. Si el vendedor corrige el precio del producto 2 en
   la llamada, no tiene dónde escribirlo.

Es exactamente el caso que se descartó para H-18: un valor oculto que sigue
alimentando el cálculo. No se toca en esta sesión. Las salidas posibles son
las de H-15: o modo B captura montos de todos los productos (y `conMontos`
desaparece), o los montos de los productos 2 a 5 entran en
`CAMPOS_EXCLUSIVOS.A` y se estacionan como el resto. Cualquiera de las dos
cambia la cobertura del catálogo en modo B, que H-15 ya midió.

**Corregido el 2026-09-12, junto con H-23, por una tercera vía: el motor lee
según el modo.** `calcularDiagnostico(datos, cfg, modo)` y
`productosCargados(d, modo)` descartan los montos de los productos 2 a 5 en
modo B (`montosVisibles`, la misma regla que `conMontos` en el formulario). No
se estaciona nada: los valores quedan en `datos`, no entran al cálculo mientras
el modo sea B y vuelven a verse y a contar en modo A. El formulario pasa su
modo al guardar. `modo` es opcional y por defecto "A", como la columna
`diagnostico.modo`, así que los tests y el gate de F2a (que no pasan modo)
calculan igual que antes.

En modo B la cobertura del catálogo pasa a ser la del producto principal, que
es lo que H-15 había medido vaciando los montos a mano (Snake Store: de 60% a
30%). H-15 sigue abierto: la decisión de si modo B tiene que capturar más
montos no cambia.

Lo que no pasa por el motor y lee productos de `datos` no recibe el modo, y no
hace falta: `productos_muestra` en `build-context.ts` sólo se usa por su
`.estado`, que no cambia mientras el principal esté cargado, y el hallazgo
`mix_producto` (`propuesta.ts`) cruza cada producto con
`derivados.margenes_producto`, que en modo B trae `null` del 2 al 5, así que
no puede disparar con un producto que el motor no usó. Los diagnósticos ya
guardados conservan los derivados con los que se guardaron: el cambio aplica
al próximo "Guardar".

## H-51 · Cerrar sesión no borra el borrador del formulario, y la clave es una sola por navegador · en pausa, requiere decisión de producto

Encontrado el 2026-09-12 al arreglar "Cancelar" del formulario de carga. No
se corrige en esa sesión: el arreglo cae en `app-sidebar.tsx`, fuera de su
alcance. Sale del código; no lo reproduje en el navegador.

`src/components/app-sidebar.tsx:20-25`:

```ts
async function cerrarSesion() {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
  navigate({ to: "/auth", replace: true });
}
```

Limpia la caché de react-query y la sesión de Supabase, pero no toca
`localStorage`. El borrador del formulario vive ahí bajo `CLAVE_BORRADOR`
(`diagnostico-form.ts`, `"velocentum:borrador-diagnostico"`), que es una clave
fija: no lleva el id del usuario. Ni el autoguardado ni `leerBorrador`
(`diagnosticos.nuevo.tsx`) miran quién es el usuario.

Cómo se dispara: un vendedor carga parte de una llamada, cierra sesión, y otro
vendedor entra en el mismo navegador. Al abrir "Nuevo diagnóstico" retoma el
borrador del primero: prospecto, montos y notas. Desde el 2026-09-12 el aviso
de borrador retomado al menos lo muestra y ofrece "Empezar de cero", pero los
datos del prospecto ajeno ya quedaron a la vista.

Salidas posibles (la 1 quedó aplicada en `1099ba9`; la 2, frenada por la
pausa de abajo):

1. **Borrar `CLAVE_BORRADOR` en `cerrarSesion`**, antes del `signOut`. Es una
   línea. Pierde el borrador del propio vendedor si cerró sesión sin querer a
   mitad de una llamada.
2. **Incluir el id del usuario en la clave.** Cada uno conserva el suyo y nadie
   ve el de otro. Deja borradores huérfanos en el navegador y toca también
   `diagnosticos.nuevo.tsx`, que tendría que leer la clave con el usuario.

**En pausa desde el 2026-09-12, por una decisión de producto pendiente:
borrador persistido contra borrador local.** Con el persistido, el borrador
pasa a ser una entidad del producto: guardado en la base, varios por usuario
y visible en el listado junto a los diagnósticos hechos. El local es el de
hoy: uno por navegador, en `localStorage`. Hasta que se decida no se avanza:
si entra el persistido, la salida 2 (usuario en la clave) es trabajo tirado.

Lo que ya quedó aplicado antes de la pausa es `1099ba9` (la salida 1, con
confirmación). `cerrarSesion` (`app-sidebar.tsx:50-60`) borra
`CLAVE_BORRADOR` antes del `signOut` y otra vez después de navegar a `/auth`;
si el borrador tiene algo cargado (`borradorConDatos`, en
`diagnostico-form.ts`) pide confirmación con el nombre de la tienda. Queda
como mitigación hasta la decisión. Lo cubren sólo los tests unitarios de
`borradorConDatos`: no se probó en el navegador. Si entra el persistido, hay
que revisarlo: cerrar sesión ya no tendría nada que descartar y la
confirmación sobraría.

Lo que `1099ba9` no cubre quedó registrado aparte: H-53 (la sesión muere sin
pasar por el botón) y H-54 (el borrador no tiene dueño).

## H-52 · De "Editar y recalcular" a "Nuevo diagnóstico" el formulario conserva el diagnóstico de origen, y "Guardar" crea la versión sobre el prospecto equivocado · abierto

Encontrado el 2026-09-12 al verificar en el navegador el arreglo de
"Cancelar". Reproducido en el navegador sin guardar: las consecuencias al
guardar salen del código. Es más grave que lo que se vino a arreglar esa
sesión y queda para una sesión propia.

**Causa.** "Editar y recalcular" (`/diagnosticos/nuevo?desde=<id>`) y "Nuevo
diagnóstico" (`/diagnosticos/nuevo`) son la misma ruta; sólo cambia el search.
TanStack Router 1.170 no remonta el componente de una ruta cuando cambia el
search salvo que la ruta o el router declaren `remountDeps`
(`node_modules/@tanstack/react-router/dist/esm/Match.js:138-146`: sin
`remountDeps` la key es `undefined`). Ni `src/router.tsx:8-13` ni la ruta lo
declaran. El link de la barra lateral (`app-sidebar.tsx:11`) va a
`/diagnosticos/nuevo` sin search, así que el componente sigue montado, pierde
`desde` y conserva todo su estado.

**Las cinco piezas que sobreviven** (`diagnosticos.nuevo.tsx`, líneas del
2026-09-12):

1. `origen`: id, `oportunidad_id` y versión del diagnóstico que se estaba
   editando. Nada lo vuelve a `null`: la precarga (`:166-195`) sale con
   `if (!desde) return;` (`:168`) sin limpiar.
2. `modo`, 3. `datos`, 4. `notas` y 5. `estacionados`: los del diagnóstico de
   origen. Sobreviven sólo si no hay borrador guardado. Si lo hay, la
   recuperación (`:197-205`, que ahora sí corre porque `desde` desapareció)
   los reemplaza por los del borrador, pero `origen` sigue intacto.

Quedan también `bloque`, `error` y la hora del encabezado, sin consecuencia.

**Reproducción** (hecha el 2026-09-12 con el diagnóstico de Titan Web,
`3b10d4f2`):

1. Listado → abrir un diagnóstico → "Editar y recalcular". Esperar a que
   cargue.
2. Click en "Nuevo diagnóstico" en la barra lateral.
3. **Sin borrador:** la URL queda en `/diagnosticos/nuevo`, pero el encabezado
   sigue diciendo "Editar y recalcular" y el botón "Guardar versión nueva",
   con los datos de Titan Web. A los 3 segundos el autoguardado (`:212-230`,
   que ahora sí corre) escribe esos datos en `CLAVE_BORRADOR` como si fueran
   un diagnóstico nuevo.
4. **Con un borrador de otro prospecto** (sembrado a mano como
   `PRUEBA-OTRO-PROSPECTO`, modo B): el formulario muestra ese otro
   prospecto en modo B, con el encabezado "Editar y recalcular" y el botón
   "Guardar versión nueva" todavía atados a Titan Web.

**Consecuencia 1: "Guardar" escribe una versión sobre el diagnóstico
equivocado.** Con `origen` vivo, `guardar()` no crea oportunidad (`:372`, usa
`origen.oportunidad_id`), inserta `version: origen.version + 1` (`:399`) y
`origen_diagnostico_id: origen.id` (`:400`), con los `datos` y `notas` que
estén en pantalla. En el caso 4 queda "Titan Web versión 2" con los números
de otro prospecto, y ese prospecto no tiene oportunidad propia. Además el
borrador no se borra (`:413` lo borra sólo `if (!origen)`), así que sobrevive
a un guardado exitoso.

**Consecuencia 2: la versión nueva se muestra con la identidad del cliente
anterior.** El nombre que se ve sale de la oportunidad, no de `datos`: el
listado (`index.tsx:174`, `f.oportunidad?.nombre_tienda`), el título del
detalle (`diagnosticos.$id.tsx:177`) y el link a la versión anterior
(`:231-236`). La propuesta de la IA toma de la oportunidad el nombre, la
vertical y la plataforma (`propuesta.functions.ts:67-69`), así que se
redactaría para Titan Web con los números del otro prospecto. **Lo que no
hereda** son la selección comercial y la propuesta ya guardadas: viven en
`diagnostico.propuesta`, por fila (`seleccion-comercial-v2.functions.ts:55-79`,
`diagnosticos.$id.tsx:271-296`), y `guardar()` inserta sin esa columna. La
versión equivocada nace sin selección ni propuesta; lo que arrastra del
cliente anterior es su identidad.

**Interacción con el arreglo de "Cancelar" del 2026-09-12.** `pedirCancelar`
decide por `desde`. Con el estado viejo, `desde` ya no está y trata el
formulario como nuevo: si hay datos pide confirmación con el nombre que esté
en pantalla y, si se descarta, borra `CLAVE_BORRADOR`. No empeora el caso,
pero tampoco lo resuelve.

Salidas posibles, ninguna aplicada ni aprobada: declarar en la ruta
`remountDeps` con `desde`, para que cambiar entre editar y nuevo monte un
componente limpio, o resetear todo el estado (incluido `origen`) cuando
`desde` desaparece. La primera es una línea y cubre también cualquier estado
que se agregue después. Cualquiera de las dos tiene que probarse en el
navegador con los dos casos de arriba. Hay que revisar además si hay
versiones guardadas por este camino antes del arreglo, porque en la base no
se distinguen de las legítimas.

## H-53 · Si la sesión muere sin pasar por "Cerrar sesión", el borrador queda vivo · abierto, requiere decisión de producto

Encontrado el 2026-09-12 al poner H-51 en pausa. Sale del código: no lo
reproduje y **no vi el 401 en la red**. La cadena de abajo sale de leer el
código, no de observarla. Tampoco verifiqué con qué código de estado rechaza
el servidor de auth (401 o 403): auth-js decide por el tipo de error, no por
el número, y la ruta privada redirige ante cualquier error.

`1099ba9` borra `CLAVE_BORRADOR` sólo desde el botón de la barra lateral
(`app-sidebar.tsx:50-60`). La sesión también termina sin ese botón, cuando el
servidor de auth la rechaza, y ese camino no pasa por `app-sidebar.tsx`
(auth-js 2.112.3, `node_modules/@supabase/auth-js/dist/module/GoTrueClient.js`):

1. **Refresh rechazado.** El cliente corre con `autoRefreshToken: true` y
   guarda la sesión en `localStorage` (`src/integrations/supabase/client.ts:50-53`).
   Si el refresh falla con un error que no es de red
   (`!isAuthRetryableFetchError`) y el access token ya venció,
   `_callRefreshToken` llama a `_removeSession()` (`GoTrueClient.js:4260-4282`).
2. **Sesión que ya no existe en el servidor.** Si `getUser` falla con
   `AuthSessionMissingError` (el JWT apunta a una sesión que no está en la
   base, por ejemplo revocada), también llama a `_removeSession()`
   (`GoTrueClient.js:2702-2708`).
3. `_removeSession()` borra sólo las claves propias de auth-js (la sesión, la
   de `-user` y los verificadores PKCE) y emite `SIGNED_OUT`
   (`GoTrueClient.js:4386-4403`).
4. `__root.tsx:137-141` recibe `SIGNED_OUT` y hace `router.invalidate()`;
   `_authenticated/route.tsx:8-9` vuelve a correr `getUser`, recibe el error y
   redirige a `/auth`.

En ningún paso se toca `CLAVE_BORRADOR`.

Cómo se dispara: un vendedor carga parte de una llamada y deja la pestaña. La
sesión muere porque el refresh token vence o se revoca. Al volver cae en
`/auth`, y quien entre en ese navegador, él u otro, retoma el borrador desde
"Nuevo diagnóstico".

La diferencia con H-51 es que acá no hay acción del vendedor, así que no hay
en qué momento preguntarle. Borrar en este camino pierde sin confirmación la
llamada de alguien a quien sólo se le venció la sesión, que casi siempre es
el mismo que vuelve a entrar: cambia un problema de privacidad por pérdida
de datos. Si el borrador tuviera dueño (H-54), no habría que borrarlo.

Salidas posibles, ninguna aplicada, las dos atadas a la decisión de H-51:

1. **Escuchar `SIGNED_OUT` en `__root.tsx` y borrar la clave.** Cubre este
   camino y también el del botón, pero borra sin preguntar.
2. **Resolverlo por H-54**: con un borrador que tenga dueño no hay nada que
   borrar al perder la sesión.

## H-54 · El borrador de localStorage no tiene dueño y cruza entre usuarios del mismo navegador · abierto, requiere decisión de producto

Separado de H-51 el 2026-09-12. El título de H-51 ya lo nombraba ("la clave
es una sola por navegador"); queda como entrada propia porque no depende de
cómo termine la sesión. Sale del código; no lo reproduje con dos usuarios.

- `CLAVE_BORRADOR` (`diagnostico-form.ts:752`) es fija,
  `"velocentum:borrador-diagnostico"`: no lleva el id del usuario.
- El autoguardado (`diagnosticos.nuevo.tsx:215-232`) escribe `modo`, `datos`,
  `notas`, `estacionados` y `guardadoEn`, sin ningún campo del usuario.
- `leerBorrador` (`diagnosticos.nuevo.tsx:121-138`) lee la clave sin mirar
  quién está logueado, aunque el componente tiene `user` a mano (`:144`).
  `borradorConDatos` (`diagnostico-form.ts`, de `1099ba9`) tampoco lo mira.

El borrador pasa de un usuario al siguiente por cualquier camino que no
borre la clave. Hoy la borran sólo cerrar sesión desde el botón (`1099ba9`),
Cancelar y "Empezar de cero" en un diagnóstico nuevo
(`diagnosticos.nuevo.tsx:323-331`) y guardar uno nuevo (`:416`); H-53 es un
camino que no la borra. Quien entra ve el prospecto, los montos y
las notas del otro. El aviso de borrador retomado muestra el nombre de la
tienda y ofrece "Empezar de cero", pero para entonces los datos ya
quedaron a la vista.

No se arregla hasta la decisión de H-51. Con el borrador persistido, este
hallazgo desaparece: el dueño lo da la fila. Con el local, la salida es la 2
de H-51 (usuario en la clave), que deja borradores huérfanos en el
navegador.

## H-55 · "Quitar" baja la cantidad de productos sin borrar lo cargado ni avisar · CORREGIDO 2026-09-12

Salió del análisis previo al arreglo de H-23 y no estaba registrado. Es la
causa en el formulario del estado que H-23 describe en el motor. "Quitar"
(`diagnosticos.nuevo.tsx:1038`) sólo hacía
`set("cantidad_productos", Math.max(1, cantidad - 1))`: nombre, costo, precio y
porcentaje del producto que salía de la lista quedaban en `datos`, fuera de la
vista, se guardaban con el diagnóstico y volvían a aparecer cargados al tocar
"Agregar producto". Hasta H-23, además, seguían entrando al cálculo.

Aclaración sobre el contexto con que llegó: se lo describió como "el estado
incoherente que tiene Snake", con tres productos cargados y
`cantidad_productos = 1`. El fixture no es así: `casoSnakeStore` no declara
`cantidad_productos`, hereda `3` de `DATOS_INICIALES`
(`diagnostico-form.ts:413`) y carga tres productos. Es coherente, y por eso
H-23 no le cambia la cobertura (sigue en 60%). El estado incoherente se armó
a mano en los tests de H-23 (`{ ...casoSnakeStore, cantidad_productos: 1 }`),
donde la cobertura baja a 30%, la del producto principal.

**Corregido el 2026-09-12, en el mismo commit que abre esta entrada.**
`quitarUltimoProducto` (`diagnostico-form.ts`) baja la lista en uno y vacía
los cuatro campos del producto que sale, incluidos los montos que modo B no
muestra. Si ese producto tiene algo cargado (`productoTieneDatos`), "Quitar"
pide confirmación nombrando el producto; si está vacío, quita directo.
"Agregar producto" no cambió: un estado incoherente que ya exista (un borrador
o un diagnóstico guardado antes de este cambio, con datos debajo de la lista)
muestra esos datos al volver a agregar el producto. Quedan a la vista y, por
H-23, no cuentan mientras estén debajo de la lista, así que no se borran en
silencio. La lógica está cubierta por tests (`diagnostico-form.test.ts`). El
diálogo no se probó en el navegador.

## H-56 · El detalle se cae con los diagnósticos guardados antes de que `derivados` tuviera `presupuesto_arranque` · CORREGIDO 2026-09-12

Diagnosticado el 2026-09-12 con la consola del navegador. Los dos
diagnósticos del 18/8/26 no abrían: la pantalla de detalle mostraba "This
page didn't load" (uno de los ids: `33eeded6-483e-40a7-80a6-b64147c1bf8a`,
Snake Store, versión 3). El error:

```
TypeError: Cannot read properties of undefined (reading 'piso_teorico_compra')
    at Presupuesto (src/routes/_authenticated/diagnosticos.$id.tsx:1607 en el bundle, :916 en el fuente)
```

**Causa.** `Presupuesto` hacía `const pa = derivados.presupuesto_arranque`
sin guarda y después leía `pa.piso_teorico_compra`,
`pa.arranque_evento_intermedio`, `pa.supuestos` y `pa.confianza`. El tipo
`Derivados` (`calculo-diagnostico.ts:157-218`) declara
`presupuesto_arranque` como obligatorio, así que TypeScript no avisa. Pero
el tipo describe lo que el motor produce hoy, no lo que hay en la base: la
pantalla lee la columna jsonb `derivados` tal como se guardó
(`diagnosticos.$id.tsx:147`, `as unknown as FilaDiagnostico`). El campo
entró en `0b803af` (2026-08-21, "Fase 6: presupuesto de arranque separado del
piso teórico por compra"). Un diagnóstico guardado antes no lo trae. Por eso
fallan los del 18/8 y ninguno posterior: la causa es la fecha de guardado, no
el diagnóstico.

**El problema de fondo.** No hay versionado de `derivados` ni tolerancia a
formas anteriores: cualquier campo que se agregue al tipo va a faltar en los
registros viejos. El tipo al 18/8 (`6763ace`, último commit del motor antes
del 19/8) tiene 22 campos; el actual tiene 40. Faltan 18:
`envio_neto_vendedor`, `componente_envio`, `costo_financiacion_efectivo`,
`costo_descuento_efectivo`, `canales`, `cobertura_canales`,
`cobertura_productos`, `canal_principal`, `margen_muestra`,
`mer_tienda_propia`, `mer_marketplace`, `roas_product_ads`,
`inversion_publicitaria_total`, `hay_inversion_publicitaria`,
`contradiccion_margen`, `presupuesto_arranque`, `funnel` y `mayorista`.

Revisé cada lectura de `derivados` en la pantalla de detalle, incluidas las
que pasan por `mapearHallazgos` (`propuesta.ts:68-540`) y
`lecturaPresupuesto` (`calculo-diagnostico.ts:336`). Los escalares pasan por
`pesos`/`numero`/`pct` (`vista-diagnostico.ts`), que muestran guion con
`undefined`. `canales`, `cobertura_canales`, `contradiccion_margen`,
`funnel`, `mayorista` y `margenes_producto` ya tenían guarda (`??`, `?.` o
`if`). Quedaron cuatro lecturas sin guarda:

1. `presupuesto_arranque` (`Presupuesto`): tiraba la pantalla. Es el error
   de arriba.
2. `pesos_producto.filter(...)` (`EconomiaDetalle`): latente. El campo ya
   existía el 18/8 y la condición previa `cobertura_productos < 100` da
   `false` con `undefined`, así que hoy no se dispara. Rompería con un
   registro que tenga cobertura y no tenga pesos.
3. `cobertura_productos` en la fila "Cobertura del catálogo analizado": no
   rompe, pero imprimía "—%".
4. `hay_inversion_publicitaria === null` en "Inversión publicitaria total":
   no rompe. Con el campo ausente la fila muestra "—" en vez de "Sin datos",
   porque `inversion_publicitaria_total` tampoco está. Se deja así: un
   guion es la política de dato ausente de la pantalla.

**Corregido el 2026-09-12, en el mismo commit que abre esta entrada.** Sólo
la pantalla (`diagnosticos.$id.tsx`), sin tocar el motor, los fixtures ni
los datos. Sin versionado ni migración: eso queda para otra conversación.
`Presupuesto` toma `presupuesto_arranque ?? {}` y `supuestos ?? []`. Con el
campo ausente, el piso teórico sale "—", el arranque "Sin datos" (lo mismo
que ya mostraba con `arranque_evento_intermedio` en `null`), el bloque de
supuestos no aparece y la lectura de presupuesto sigue, porque sólo usa campos
que ya existían el 18/8. `pesos_producto ?? []` cubre el punto 2, y la fila de
cobertura muestra "—" sin el "%". Verificado en el navegador (vite local,
`:8080`) con `33eeded6-…`: la pantalla abre sin errores en consola y la
sección de presupuesto muestra los guiones descritos. El otro diagnóstico del
18/8 no se abrió porque su id no estaba en el reporte.

Fuera de alcance, sin revisar: la cadena documental ("Ver documentos") lee
`derivados` de esos mismos registros por su cuenta (`build-context.ts`) y no
se verificó si tolera la forma del 18/8. `presupuesto_arranque` no se lee
fuera del detalle.

---

## Auditoría de salidas 2026-09-11: fuera del registro

Lo que sigue viene del mismo reporte y no lleva ID. Queda acá para que no se pierda. Vale la misma nota de alcance: `motor-activo.ts:19` está en `"v1"`; lo que hable de la cadena v2 describe lo que pasará al activarla.

### Seis hallazgos verificados de menor impacto

Verbatim del reporte: "Quedaron afuera 6 hallazgos verificados de menor impacto:"

1. Semáforo Economía en amarillo con un texto que compara sólo contra breakeven (`:667` vs `calculo-diagnostico.ts:1145-1150`).
2. "Conversión de la tienda" 0,22 % junto a "Conversión global" 0,15 % y "Pedidos 133" junto a "Compras 89" en la corrida E, cuya causa es H-28.
3. Hallazgos mayoristas en propuesta y documentos (`propuesta.ts:341-434`) sin ninguna sección en el detalle.
4. `margen_muestra` llega al PDF (`build-context.ts:1013-1019`) pero no a la IA (`propuesta.ts:561`).
5. "Metodología y supuestos" nunca se imprime porque `metodologia: []` (`build-context.ts:1133`, `shared.ts:143-150`).
6. Notas de hallazgos que anuncian faltantes van a la IA (`propuesta.ts:305-308, 332`) contra la regla del prompt (`:626-627`).

### Cuatro sospechas sin verificar

Verbatim del reporte:

1. La cadena v1, que es la que hoy recibe el prospecto, puede tener los mismos problemas 6 y 7 (H-43 y H-44). No la leí.
2. Paridad PDF v2 con web v2: sólo confirmé "Resultado:", "Selección comercial pendiente" y "Sin precio cargado" en `pdf-v2/document.tsx`. El bloque de servicios (`:1650`) lista alcance sin etiqueta de vacío; no sé qué imprime con lista vacía.
3. La IA podría copiar la instrucción "Redactalo como un único hallazgo…" (`propuesta.ts:164`), que viaja dentro de los datos. Depende del modelo.
4. Modo B: el semáforo de Medición queda siempre "Sin datos" porque `facturacion_pixel` es exclusivo del modo A. Lo infiero de H-18, no lo corrí.

El inventario de métricas de la pantalla de detalle que acompañaba al reporte no se registra acá: está en `docs/bv4-inventario-metricas-detalle.md`, tal como vino, sin juicio.
