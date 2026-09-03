# BV4 · Rehacer el gate de F2a — comparar contenido, no bytes

**Esto no es una fase de BV4 y no consume rondas de F2a.** Es la corrección del
documento del gate y de su criterio de comparación, después de un intento fallido
el 2026-09-03 en el que aparecieron tres defectos que lo hacen inejecutable.

El código de F2a **no se toca**. El commit candidato `04db2fb` (tag
`bv4-f2a-candidato-preSupabase`) está sano y no está en discusión. Lo que falla
es la prueba, no lo probado.

Autorización de Matías, 2026-09-03: rehacer el criterio del gate para que compare
contenido en vez de bytes. Se descartó explícitamente la alternativa de alinear
los fixtures con lo que la interfaz puede capturar, porque eso degradaría el
fixture para que quepa en un formulario incompleto y escondería H-15.

---

## 1 · Qué pasó, verificado

El 2026-09-03 se intentó correr `docs/bv4-f2a-gate-navegador.md` de punta a punta,
con motor en v2 y servidor local. Se frenó antes de descargar ningún PDF. Tres
defectos, los tres verificados directamente en el código:

### D-1 · La fecha del diagnóstico hace imposible la igualdad byte a byte

- El fixture del pipeline fija `fecha: "2026-08-31"`
  (`generar-propuestas-f2a.test.ts`, función `contextoDe`).
- La app la genera al vuelo: `diagnosticos.nuevo.tsx:279` hace
  `fecha: new Date().toISOString().slice(0, 10)`. **No hay campo editable.**
- Esa fecha llega al PDF: `shared.ts:26` la pone en `metadata.date`,
  `shared.ts:55` en `diagnosticDate`, y `document.tsx:1910` y `1942` la imprimen.
- También arma el nombre del archivo descargado (`export-client.ts:37`).

Distinta fecha, distintos bytes, distinto hash. **Garantizado**, aunque todo lo
demás se cargue perfecto.

Nota de alcance verificada: `diagnosticId` y `diagnosticVersion` viajan al
metadata (`shared.ts:20-21`) pero **no** aparecen en `document.tsx`. No se
imprimen. El único campo variable que llega al PDF es la fecha.

### D-2 · El documento no declara los valores de la selección

El paso 9 dice "cargar precios en las líneas marcadas" sin decir cuáles. La
sección "Si no coinciden" nombra `SOBRE_SNAKE` / `SOBRE_TITAN` como la fuente de
verdad, pero recién *después* de que el gate falló. Quien lo corre carga a ciegas.

### D-3 · El formulario no puede capturar el caso — H-15

`casoSnakeStore` tiene costo y precio de los **tres** productos:

| # | Nombre | Costo | Precio | % fact. |
|---|---|---|---|---|
| 1 | Campera Puffer | 40000 | 180000 | 30 |
| 2 | Chaleco Tiffany | 35000 | 125000 | 20 |
| 3 | Calza Street | 20000 | 85000 | 10 |

Y `esperadosFase2.snakeStore.margenesProducto` es
`[0.6589, 0.6012, 0.6459, null, null]`: tres márgenes calculados.

Pero el bloque 5 del formulario dice literalmente *"Costo y precio sólo del
principal"*: sólo el producto 1 tiene esos campos, los demás únicamente
porcentaje de facturación.

El motor sí los usa: `calculo-diagnostico.ts:372-373` lee `producto_2_costo` y
`producto_2_precio`.

Verificado además que `git log -S "producto_2_costo" -- src/routes/ src/components/`
**vuelve vacío**: el formulario nunca tuvo esos campos en la historia de este
repo. No es una regresión reciente de esta rama.

Consecuencia: los márgenes de los productos 2 y 3 salen `null` desde la interfaz
y calculados desde el pipeline. **El contenido del PDF difiere de verdad**, no
sólo los bytes. Y esto no tiene arreglo manual: no hay celda que editar.

## 2 · Qué hay que hacer

Reescribir el criterio del gate: **comparación por contenido extraído del PDF**,
no por SHA-256 del archivo.

El determinismo del render ya está probado aparte, por doble corrida, en
`generar-propuestas-f2a.test.ts`. Esa prueba **se queda como está**: sigue siendo
válida y no depende de la interfaz. Lo que cambia es cómo se compara el PDF del
navegador contra el del pipeline.

### Qué tiene que verificar la comparación

Sobre el texto extraído de los dos PDFs (navegador y pipeline), para cada caso y
cada perfil:

1. Las **diez líneas** del catálogo, con las seleccionadas y sus cantidades.
2. Los **precios unitarios y totales por línea**.
3. Los **dos grupos de totales** — "Inversión mensual" e "Inversión inicial /
   pago único" — cada uno con subtotal neto, impuesto y total.
4. Que **no exista ningún total que sume los dos grupos**.
5. La **moneda** y el **porcentaje fiscal**.
6. Los **tres agregados** incluidos.
7. El **plan 30/60/90**: las tres etiquetas y cada acción impresa tal cual.
8. El **nivel** elegido.

### Qué queda explícitamente fuera de la comparación, y por qué

- **La fecha del diagnóstico** (D-1). Es variable por diseño y correcta en los
  dos lados: el pipeline usa una fija para ser reproducible, la app usa la del
  día porque es lo que corresponde a un diagnóstico real.
- **Los márgenes de los productos 2 y 3** (D-3, H-15). Difieren por el hueco de
  captura del formulario, no por un defecto del motor ni del render.

Las dos exclusiones tienen que quedar **escritas y justificadas en el documento
del gate**, no aplicadas en silencio. Un lector futuro tiene que entender qué no
se compara y por qué.

Hay una función `textoDelPdf` ya usada en ese mismo archivo de pruebas para el
gate del roadmap 30/60/90 (`RONDA 3 · el plan 30/60/90 impreso en los cuatro
PDFs`). Reusala; no escribas otra.

## 3 · Qué hay que corregir en el documento

`docs/bv4-f2a-gate-navegador.md`:

1. **Sección 6 completa**: reemplazar la comparación por SHA-256 por la de
   contenido, con el comando exacto a correr y qué se espera.
2. **Sección "Si no coinciden"**: reescribir. La causa "la selección difiere en
   un peso" sigue siendo válida, pero ya no es la primera sospechosa.
3. **Paso 9**: declarar los valores exactos a cargar. Para Snake Store, nivel
   TRACCIÓN, moneda ARS, IVA 21% confirmado:

   | Línea | Cantidad | Precio unitario |
   |---|---|---|
   | Meta Ads | 5 | 90.000 |
   | Google Ads | 5 | 80.000 |
   | Contenido audiovisual | 15 | 18.000 |
   | Contenido estático | 18 | 9.000 |
   | Planificación de contenido | — | total 120.000 |
   | Branding | — | total 950.000, recurrencia **única** |

   Más los tres agregados: tracking web, email marketing, reportes.

   Para Titan Web B1, sacá los valores de `SOBRE_TITAN` en el mismo archivo y
   declaralos igual. **No los inventes.**

4. **Sección 1**: declarar los datos exactos de `casoSnakeStore` a cargar en los
   ocho bloques del formulario, y qué campos van vacíos. Verificado el
   2026-09-03: `casoSnakeStore` pisa sólo 13 campos sobre `DATOS_INICIALES`; todo
   lo demás va vacío por diseño, incluida `facturacion_mensual`.

   Dos cosas que aparecieron al cargarlo y hay que dejar escritas:
   - `casoSnakeStore` tiene `vertical: ""`, pero el formulario lo pide y la app
     lista el caso como "Indumentaria". Declarar cuál corresponde.
   - `venta_minorista_activa` y `venta_mayorista_activa` son `null` en el
     fixture, pero el formulario obliga a Sí o No y **no permite volver a "sin
     responder"**. El texto de ayuda dice que sin responder se asume Sí. Declarar
     qué hay que elegir.

5. **Sección 0-bis**: agregar D-1 y D-3 como advertencias, para que quien lo
   corra sepa de antemano qué no va a coincidir.

## 4 · Hallazgos a registrar

En `docs/bv4-hallazgos-diferidos.md`:

- **H-14** · El gate de F2a pedía una igualdad byte a byte imposible (D-1), y no
  declaraba ni los valores de la selección ni los del diagnóstico (D-2).
  Corregido por esta tarea. Dejá anotado el patrón, que es el mismo de H-7: el
  documento se escribió sin ejecutarlo de punta a punta.
- **H-15** · El formulario sólo captura costo y precio del producto principal,
  mientras el motor (`calculo-diagnostico.ts:372-373`) y los fixtures los aceptan
  para los cinco. **Abierto.** No es sólo un problema del gate: en una llamada
  real sólo se puede capturar el margen del producto principal. Va a F2b.
- **H-16** · Dos defectos de interfaz observados el 2026-09-03, los dos en el
  formulario de diagnóstico: los toggles de canal minorista/mayorista no vuelven
  a "sin responder" una vez tocados, y `null` no equivale a "Sí" para el motor
  aunque el texto de ayuda lo diga; y no se puede volver a la pantalla de
  selección de modo A/B una vez elegido. **Abiertos.** Van a F2b.

## 5 · Fuera de alcance

- Código de F2a. **No se toca nada** de `src/lib/seleccion-comercial-v2*`,
  `catalogo-v2`, `precargas-v2`, `reparto-roadmap-v2` ni `textos-servicios-v2`.
- Los fixtures `casoSnakeStore`, `casoTitanWebB1`, `SOBRE_SNAKE`, `SOBRE_TITAN`.
  **No se degradan para que quepan en el formulario.** Es la alternativa que
  Matías descartó.
- El formulario de diagnóstico. H-15 y H-16 se registran, no se arreglan acá.
- La prueba de determinismo por doble corrida. Se queda como está.
- `MOTOR_DOCUMENTAL_ACTIVO` (`"v1"`) y `TEMA_DOCUMENTAL_ACTIVO`
  (`"velocentum-light-v1"`).
- Migraciones de esquema. Cero.

## 6 · Procedimiento

1. Árbol limpio, HEAD en `9e20a79`. Guardá el prompt verbatim en `docs/prompts/`.
2. Línea de base: `npm test` y `npm run typecheck`, registrá el conteo. La
   referencia conocida es 83 archivos / 1140 pruebas + 1 todo.
3. Escribí la comparación por contenido. Corré la suite.
4. Corregí el documento del gate.
5. Registrá H-14, H-15 y H-16.
6. QA completo: test, typecheck, build. Comparalos contra la línea de base.
7. Commit candidato **local**. Artefactos desde worktree limpio: los diffs, los
   logs crudos de QA, y los documentos corregidos.
8. Handoff de máximo diez líneas.

## 7 · Invariantes

- **Ningún `git push`.** Commit candidato local y detención completa.
- **Nada se inventa**: ni valores de fixture, ni precios, ni datos del caso
  Titan. Todo sale del código. Faltante = parada y reporte.
- Si algo del arreglo pareciera exigir tocar código de F2a o los fixtures:
  **frená y reportá**. Es la señal de que el enfoque está mal.
- Máximo dos rondas de corrección.
- No se toca `.env` ni se imprime el valor de ninguna variable de entorno.
