# BV4 · F2a — Pasos exactos para reproducir el gate en el navegador

El flujo en navegador lo ejecuta Matías. Este documento deja escritos los
pasos, en orden, y qué hay que comparar al final.

> **Gate de F2a:** diagnóstico → proyección → selección comercial confirmada
> + configuración fiscal confirmada → propuesta → PDF descargado desde la
> interfaz en pantalla y A4 → **el contenido del descargado dice lo mismo que
> el del pipeline**, para Snake Store y Titan Web B1.

El criterio era "SHA-256 del descargado = SHA-256 del pipeline" hasta el
2026-09-03. Era imposible de cumplir: la app genera la fecha del diagnóstico
al vuelo y esa fecha se imprime en el PDF, así que los bytes nunca podían
coincidir. Está registrado como **H-14** en `docs/bv4-hallazgos-diferidos.md`
y corregido acá. El determinismo del render —que era lo que el hash intentaba
probar— se sigue probando aparte, por doble corrida, en
`generar-propuestas-f2a.test.ts`.

---

## 0-bis · Prerrequisitos de entorno

Esta sección se agregó **después** de que el gate frenara en el primer intento
(registrado como **H-7** en `docs/bv4-hallazgos-diferidos.md`: el documento se
escribió sin declarar un solo prerrequisito). El `.env` local no se toca ni se
commitea, y **ningún valor de variable se escribe acá ni en ningún artefacto**:
sólo los nombres.

**Hacen falta, y ya están en el `.env` local:**

| Variable | Quién la lee | Para qué |
| --- | --- | --- |
| `SUPABASE_URL` | `auth-middleware.ts:36` | servidor: arma el cliente autenticado |
| `SUPABASE_PUBLISHABLE_KEY` | `auth-middleware.ts:37` | servidor: ídem, más el `apikey` de cada request |
| `VITE_SUPABASE_URL` | `client.ts:33` | navegador: cliente del usuario |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `client.ts:34` | navegador: ídem |

Sin las dos primeras, el middleware corta con
`Missing Supabase environment variable(s): …` **antes** de tocar la base, y se
cae todo el paso 5 en adelante.

**No hace falta, y no la va a haber:**

- `SUPABASE_SERVICE_ROLE_KEY`. El backend es Lovable Cloud, que por diseño no
  expone service role keys. Hasta el preflight del 2026-09-02, los tres server
  functions comerciales escribían con `supabaseAdmin` (service role, saltea
  RLS) y por eso el flujo era **irreproducible en local**: la lectura pasaba y
  la escritura tiraba excepción. Hoy leen y escriben con el cliente autenticado
  del middleware, sujeto a RLS, y la clave dejó de ser necesaria.

**Consecuencia a tener presente durante el gate:** ahora las políticas de RLS
aplican de verdad. Si un guardado falla, el primer sospechoso es la política de
la tabla `diagnostico`, no el código. Está registrado como **H-9** y se trata
aparte.

**Ni una ni otra cosa:**

- `ANTHROPIC_API_KEY` sólo la lee `propuesta.functions.ts:45`, para la propuesta
  redactada por el modelo. La cadena documental lee de `diagnostico.propuesta`
  únicamente la clave `paquetes` (`from-diagnostico.ts:123`), así que los cuatro
  PDFs del gate no dependen de ella.
- `SUPABASE_PROJECT_ID` y `VITE_SUPABASE_PROJECT_ID` están en el `.env` y no las
  lee ningún archivo de `src/`.

### 0-bis.1 · Dos cosas que NO van a coincidir, y hay que saberlo antes

**D-1 · La fecha del diagnóstico es distinta de los dos lados, siempre.**
El fixture del pipeline la fija en `2026-08-31` (`contextoDe`, en
`generar-propuestas-f2a.test.ts`). La app la genera al vuelo —
`diagnosticos.nuevo.tsx:279`, `new Date().toISOString().slice(0, 10)` — y **no
hay campo editable** para ponerla. Esa fecha se imprime en la portada
(`velocentum-v2/shared.ts:55` → `document.tsx:1908` y `1942`) y arma el nombre
del archivo descargado (`export-client.ts:35-39`). Por eso el gate ya no compara
bytes: distinta fecha, distinto hash, garantizado.

Alcance verificado: `diagnosticId` y `diagnosticVersion` viajan al modelo
(`shared.ts:20-21`) pero **no se imprimen**; el `v2` de la portada es el sufijo
del `templateId` (`shared.ts:43`), no la versión del diagnóstico. **La fecha es
el único campo variable que llega al PDF**, y la suite lo fija.

**D-3 · El gate se corre en modo A, no en modo B.** En modo B el formulario
sólo pide costo y precio del producto principal
(`diagnosticos.nuevo.tsx:891`: `const conMontos = modo === "A" || n === 1`),
y los dos fixtures traen costo y precio de **tres** productos. En modo A los
tres tienen sus campos y el caso entra completo. Si por error se carga en modo
B, lo que cambia en el PDF es **un número**: la línea "Los productos relevados
representan **60%** de la facturación" pasa a decir 30% en Snake Store y 20%
en Titan Web. Verificado el 2026-09-03 renderizando las dos variantes y
comparando el texto extraído: es la única diferencia; los márgenes de los
productos 2 y 3 no se imprimen en ningún lado. El hueco de captura de modo B es
real y queda abierto como **H-15**, pero es un problema de F2b, no del gate.

## 0 · Antes de empezar: conmutar el motor a v2 (F-3, registrado)

El bloque `commercial-selection` y los dos perfiles de PDF viven en la cadena
**v2**. El commit candidato tiene `MOTOR_DOCUMENTAL_ACTIVO = "v1"`, que es
como debe quedar. Para el gate hay que conmutarlo **en local y sin
commitear**:

```bash
# 1. Conmutar
sed -i '' 's/MotorDocumental = "v1"/MotorDocumental = "v2"/' src/documents/motor-activo.ts
grep -n 'MOTOR_DOCUMENTAL_ACTIVO' src/documents/motor-activo.ts   # debe decir "v2"

# 2. Levantar
npm run dev        # http://localhost:8080

# … flujo del navegador (secciones 1 a 4) …

# 3. Revertir SIEMPRE al terminar
git checkout -- src/documents/motor-activo.ts
git status --short          # debe salir vacío
```

`TEMA_DOCUMENTAL_ACTIVO` **no se toca**: sigue en `velocentum-light-v1`. El
panel consume tokens del tema activo, cualquiera sea, así que no hace falta
activar crystal para nada de esto.

## 1 · Cargar el diagnóstico de Snake Store

**Modo A** ("Con acceso al panel"). No es opcional: en modo B el formulario no
pide costo ni precio de los productos 2 y 3 (D-3). El modo elegido no viaja al
motor ni al documento — `modo` no es un campo de `DatosDiagnostico` y
`build-context.ts` no lo lee —, sólo decide qué campos se ven.

`casoSnakeStore` (`src/lib/fixtures-casos.ts:37-64`) pisa **20 campos** sobre
`DATOS_INICIALES`. Son estos, bloque por bloque. **Todo lo que no está en esta
tabla va vacío**, incluida `facturacion_mensual`.

| Bloque | Campo del formulario | Valor |
| --- | --- | --- |
| Identificación | Nombre de la tienda | `Snake Store` |
| Identificación | Vertical | *vacío* (ver abajo) |
| Identificación | Plataforma | `Tiendanube` |
| Identificación | Plan de la plataforma | `Inicial` |
| Identificación | ¿Vende en Mercado Libre? | **No** |
| Identificación | ¿Tiene canal minorista activo? | *sin responder* (ver abajo) |
| Identificación | ¿Tiene canal mayorista activo? | *sin responder* (ver abajo) |
| Canales · Tienda propia | Porcentaje de la facturación total | `100` |
| Canales · Mercado Libre | No vende en este canal | **tildado** |
| Economía | Ticket promedio | `225226` |
| Economía | Envío neto del vendedor por pedido | `11000` (ver abajo) |
| Economía | Pasarela | `Mercado Pago` |
| Productos | Productos en la lista | `3` (es el default) |
| Productos | Producto 1 (principal) | `Campera Puffer` · costo `40000` · precio `180000` · `30 %` |
| Productos | Producto 2 | `Chaleco Tiffany` · costo `35000` · precio `125000` · `20 %` |
| Productos | Producto 3 | `Calza Street` · costo `20000` · precio `85000` · `10 %` |

Medición, Cuenta, Web y Contenido quedan **enteramente vacíos**. Son los ocho
bloques visibles: Mercado Libre y Mayorista no aparecen porque este caso no
vende en ML ni tiene canal mayorista.

**Vertical.** El fixture tiene `vertical: ""`. Dejalo vacío: es lo que
reproduce el caso exacto. No cambia nada — el motor no lee `vertical` (no
aparece en `calculo-diagnostico.ts`) y la cadena v2 no lo imprime
(`build-context.ts:1036` lo pone en `cliente.vertical` y ningún archivo de
`templates/velocentum-v2` ni de `renderers/pdf-v2` lo lee). Si igual querés
llenarlo, la etiqueta que le corresponde es **Indumentaria**: es la que usa la
propia fixture documental de Snake Store del repo
(`velocentum-v1/test-fixtures.ts:157`) y es coherente con los tres productos.

**Minorista y mayorista.** El fixture los tiene en `null` (sin responder), y
así hay que dejarlos. El texto de ayuda dice que sin responder se asume que sí,
y para minorista es verdad: `mayorista.ts:58` evalúa
`venta_minorista_activa !== false`, así que *sin responder* y *Sí* son lo mismo
para el motor. Para mayorista **no**: `mayorista.ts:59` y `:66` evalúan
`=== true`, así que *sin responder* equivale a **No**, no a Sí. Si los tocaste
por error, el equivalente exacto es minorista = **Sí** y mayorista = **No**;
y se puede volver a *sin responder* clickeando otra vez el botón que quedó
marcado (`campos-formulario.tsx:252`).

**Envío.** El campo del envío está escondido hasta responder que sí a *"¿El
negocio absorbe parte del costo del envío?"* (`diagnosticos.nuevo.tsx:656-660`),
pero el fixture deja `absorbe_costo_envio` sin responder. La secuencia que deja
los dos como el fixture: responder **Sí**, escribir `11000` en "Envío neto del
vendedor por pedido", y volver a clickear **Sí** para dejarlo sin responder. El
campo no se esconde, porque la condición ya se cumple por tener valor cargado.
Si lo dejás en **Sí**, el PDF cambia de verdad: desaparecen la restricción
"Política de envío sin confirmar" y su renglón en la etapa 61-90, y aparece la
proyección de contribución incremental.

Después:

1. Guardar y abrir el detalle: `/diagnosticos/<id>`.
2. Verificar que el número principal, el semáforo y las fugas se ven.

## 2 · Proyección

3. Abrir **Proyección 90 días** desde la lista de documentos del diagnóstico y
   verificar que renderiza. (Semana 0, si aparece, es de **este** documento;
   en la propuesta no existe y no puede existir — invariante en la suite.)

## 3 · Selección comercial y configuración fiscal

4. En el detalle del diagnóstico, bajar a **"Selección comercial"** (está
   arriba de "Paquetes propuestos (escalera v1)", que es otra cosa y no se
   toca).
5. Comprobar que aparecen las **diez líneas**, con las sugeridas por el
   diagnóstico marcadas y el resto desmarcadas.
6. Elegir **nivel TRACCIÓN**. Verificar que las cantidades sugeridas se
   ajustan (audiovisual 15, estático 18, campañas 5 en cada plataforma) y que
   **Diseño web NO queda marcado** por cambiar de nivel.
7. Elegir **moneda ARS**.
8. Dejar marcadas exactamente estas seis líneas, y ninguna más, con estos
   valores. Salen de `SOBRE_SNAKE`, en
   `src/documents/renderers/pdf-v2/generar-propuestas-f2a.test.ts:92-131`:

   | Línea | Cantidad | Precio | Recurrencia |
   | --- | --- | --- | --- |
   | Meta Ads | 5 campañas | unitario `90.000` | mensual |
   | Google Ads | 5 campañas | unitario `80.000` | mensual |
   | Contenido audiovisual | 15 piezas/mes | unitario `18.000` | mensual |
   | Contenido estático | 18 piezas/mes | unitario `9.000` | mensual |
   | Planificación de contenido | — | total de línea `120.000` | mensual |
   | Branding | — | total de línea `950.000` | **única** |

   Desmarcadas quedan las otras cuatro: Product Ads, Influencer marketing,
   Diseño web y Desarrollo web custom. El gate verifica que **no aparecen**
   en el PDF.

   Los tres agregados van **incluidos**: tracking web, email marketing y
   reportes.

   Verificar que el total de cada línea se calcula solo y que **no hay ningún
   campo editable de total**.
9. En **Configuración fiscal**: dejar "Aplica impuesto" tildado con 21 % y
   tildar **"Configuración fiscal confirmada"**. El aviso rojo de exportación
   bloqueada tiene que desaparecer.
10. Verificar los **dos grupos de totales** en vivo: "Inversión mensual"
    (subtotal neto `1.402.000`, impuesto `294.420`, total `1.696.420`) e
    "Inversión inicial / pago único" (subtotal neto `950.000`, impuesto
    `199.500`, total `1.149.500`). **No debe existir ningún total que los
    sume**: ni `2.352.000` ni `2.845.920`. El gate verifica las dos ausencias.
11. Apretar **"Confirmar selección comercial"** y esperar el mensaje de
    guardado.
12. **Recargar la página.** La selección tiene que seguir ahí: vive en base,
    no en estado de React.

### 3.1 · Comprobación del candado (Q9)

13. Destildar "Configuración fiscal confirmada", confirmar de nuevo, ir a la
    propuesta e intentar descargar el PDF: tiene que **fallar** con
    "Selección comercial pendiente: falta confirmar la selección de líneas y
    la configuración fiscal de la propuesta."
14. Volver a tildarla y confirmar. La descarga vuelve a funcionar.

## 4 · Propuesta y descarga en los dos perfiles

15. Abrir el documento **Propuesta**.
16. Verificar en pantalla: las líneas seleccionadas con su **texto verbatim**
    (descripción + entregables), la exclusión de Diseño web si corresponde, la
    nota al pie en las líneas de contenido, los agregados con el alcance del
    nivel, y los dos grupos de totales.
17. Descargar con **"Descargar PDF" → "Pantalla (16:9)"**, y renombrar el
    archivo a `snake-store-propuesta-pantalla.pdf`.
18. Descargar con **"Descargar PDF" → "Impresión (A4)"**, y renombrarlo a
    `snake-store-propuesta-impresion.pdf`.

**Renombrar no es opcional.** El nombre de la descarga no distingue perfil
(`export-client.ts:35-39` arma `<cliente>-propuesta-<fecha>.pdf`), así que la
segunda descarga cae como `… (1).pdf` y no hay forma de saber cuál es cuál sin
mirarlas. El gate espera los cuatro nombres de la sección 6.

### 4.1 · El plan 30/60/90 (ronda 3)

En "Hoja de ruta", antes de descargar, mirar tres cosas:

- Están las **tres etapas**: "Días 1 a 30", "Días 31 a 60" y "Días 61 a 90".
  Antes de la ronda 3, Titan Web tenía sólo la de 61-90 y Snake Store no tenía
  la de 1-30.
- Cada renglón dice **qué se hace**, no sólo el nombre del servicio: "Meta
  Ads: Configuración inicial de cuenta, píxel y CAPI · …".
- **Diseño web aparece completo en 1-30 y no vuelve a aparecer** (R1: la
  infraestructura va antes que la pauta).
- Las tres líneas de pauta **escalan en 61-90**. En Google Ads el renglón es
  "Escala de las campañas y palabras clave con mejor rendimiento": es la sexta
  viñeta que aportaste al resolver H-4, y antes de tenerla la etapa quedaba
  sin ese renglón a propósito.

## 5 · Repetir con Titan Web B1

19. Repetir los pasos 1 a 18 con `casoTitanWebB1`
    (`src/lib/fixtures-casos.ts:67-98`), que pisa **24 campos** sobre
    `DATOS_INICIALES`. Las diferencias con Snake Store en el diagnóstico:

    | Bloque | Campo | Valor |
    | --- | --- | --- |
    | Identificación | Nombre de la tienda | `Titan Web` |
    | Identificación | Plan de la plataforma | `Esencial` |
    | Identificación | ¿Vende en Mercado Libre? | **Sí** (habilita el noveno bloque) |
    | Economía | Facturación mensual | `50000000` |
    | Economía | Ticket promedio | `25000` |
    | Economía | Envío neto del vendedor por pedido | `9000` (misma secuencia que Snake) |
    | Canales · Tienda propia | No vende en este canal | **tildado** |
    | Canales · Mercado Libre | Porcentaje de la facturación total | `100` |
    | Canales · Mercado Libre | Facturación del canal | `50000000` |
    | Mercado Libre | Inversión mensual en Product Ads | `1800000` |
    | Productos | Producto 1 (principal) | `Bolsa tostado` · `5890` · `11650` · `20 %` |
    | Productos | Producto 2 | `Molde pan lactal` · `17330` · `32990` · `20 %` |
    | Productos | Producto 3 | `Cintura extensible` · `15700` · `30390` · `20 %` |

    Plataforma (`Tiendanube`) y pasarela (`Mercado Pago`) son las mismas.

20. La selección comercial va en **nivel ESCALA** y **moneda USD**, con IVA
    21 % confirmado. Salen de `SOBRE_TITAN`
    (`generar-propuestas-f2a.test.ts:134-173`):

    | Línea | Cantidad | Precio | Recurrencia |
    | --- | --- | --- | --- |
    | Meta Ads | 7 campañas | unitario `1.200` | mensual |
    | Product Ads | 7 campañas | unitario `800` | mensual |
    | Diseño web, ruta **B2C y B2B** | — | total de línea `6.500` | **única** |
    | Desarrollo web custom | 4 páginas | unitario `1.500` | **única** |

    Cuatro agregados incluidos: tracking web, email marketing, reportes y
    **CRO** (sólo existe en ESCALA). Verificar que el alcance de Email
    marketing dice "segmentación y recompra".

    Los dos grupos: "Inversión mensual" (`14.000` / `2.940` / `16.940`) e
    "Inversión inicial / pago único" (`12.500` / `2.625` / `15.125`). No debe
    existir ni `26.500` ni `32.065`.

    Quedan desmarcadas Google Ads, Contenido audiovisual, Contenido estático,
    Influencer marketing, Planificación de contenido y Branding.

21. Renombrar las dos descargas a `titan-web-b1-propuesta-pantalla.pdf` y
    `titan-web-b1-propuesta-impresion.pdf`.

## 6 · Comparar el contenido contra el pipeline

El gate no compara bytes: compara lo que dice cada PDF. La comparación vive en
el mismo archivo que genera los artefactos,
`src/documents/renderers/pdf-v2/generar-propuestas-f2a.test.ts`, y usa el mismo
extractor de texto (`textoDelPdf`, sobre `pdfjs-dist`) que ya usaba el gate del
plan 30/60/90.

```bash
# 1. Los cuatro descargados, con estos nombres exactos:
mkdir -p /tmp/f2a-navegador
ls /tmp/f2a-navegador
#   snake-store-propuesta-pantalla.pdf
#   snake-store-propuesta-impresion.pdf
#   titan-web-b1-propuesta-pantalla.pdf
#   titan-web-b1-propuesta-impresion.pdf

# 2. El gate
VELOCENTUM_F2A_NAVEGADOR_DIR=/tmp/f2a-navegador \
  npx vitest run src/documents/renderers/pdf-v2/generar-propuestas-f2a.test.ts
```

**Qué se espera:** `Tests  24 passed (24)`. Sin la variable de entorno los
cuatro casos del gate se saltean a la vista —`20 passed | 4 skipped`— en vez de
pasar en falso, que es lo que hace `npm test`.

El PDF del pipeline lo genera la propia corrida en memoria, así que no hace
falta escribirlo a disco. Si igual los querés como artefacto:

```bash
VELOCENTUM_F2A_QA_DIR=/tmp/f2a-pipeline \
  npx vitest run src/documents/renderers/pdf-v2/generar-propuestas-f2a.test.ts
```

### Qué verifica la comparación

Sobre el texto extraído de los dos PDFs, para cada caso y cada perfil (cuatro
combinaciones), con los valores esperados leídos **del modelo**, no escritos a
mano:

1. Las **diez líneas del catálogo**: las cotizadas con su nombre y su ruta si
   la tiene, y las no cotizadas **ausentes**.
2. Por línea cotizada, el renglón completo: **cantidad, unidad, precio
   unitario, recurrencia y total**, en un solo string. Un peso de diferencia
   en cualquiera de los tres números lo rompe.
3. Los **dos grupos de totales** — "Inversión mensual" e "Inversión inicial /
   pago único" — cada uno con subtotal neto, impuesto y total.
4. Que **no exista ningún total que sume los dos grupos**, ni el neto ni el
   que lleva impuesto.
5. La **moneda** y el **porcentaje fiscal**, que viajan dentro de esos mismos
   importes (`$` / `US$`, `Impuesto (21 %)`).
6. Los **agregados incluidos**, con su alcance.
7. El **plan 30/60/90**: las tres etiquetas y cada acción impresa tal cual.
8. El **nivel** elegido.

### Qué queda explícitamente fuera de la comparación, y por qué

**La fecha del diagnóstico.** Es el único campo variable que llega al PDF
(D-1, verificado y fijado por la suite). Es correcta de los dos lados: el
pipeline usa una fija para ser reproducible, la app usa la del día porque es la
que corresponde a un diagnóstico real. Compararla sería exigir que dos cosas
distintas por diseño sean iguales.

**Nada más.** La otra exclusión candidata eran los márgenes de los productos 2
y 3 (D-3): se descartó porque el hueco de captura es de **modo B**, y el gate
se corre en modo A, donde el formulario pide costo y precio de los tres. Aun
en modo B los márgenes no se imprimen: lo único que cambiaría en el PDF es el
porcentaje de la línea "Los productos relevados representan 60% de la
facturación". Queda registrado como **H-15**, abierto, para F2b.

### Si no coinciden

El fallo nombra el punto de control que falta y el texto exacto que esperaba,
por ejemplo:

```
línea meta_ads · cantidad, unitario, recurrencia y total
  → «5 campañas · unitario $ 90.000 · mensual $ 450.000»
```

En orden de probabilidad:

1. **Falta el archivo o está mal nombrado.** El fallo es un `ENOENT` con la
   ruta completa. Las dos descargas de un mismo caso llegan con el mismo
   nombre; revisá que no hayas renombrado dos veces el mismo archivo.
2. **El diagnóstico cargado no es el fixture.** Si lo que falla son renglones
   del plan 30/60/90 o líneas que aparecen de más, el sospechoso es el
   diagnóstico, no la selección: las acciones del plan salen de los hallazgos
   y las restricciones, que salen del motor. Los dos casos típicos están
   arriba: haber dejado el envío en "Sí" (se cae la restricción "Política de
   envío sin confirmar") y haber cargado en modo B (cambia el porcentaje de
   cobertura, que **no** está entre los puntos de control pero se ve en el
   PDF).
3. **La selección difiere.** Si lo que falla son renglones de línea o de
   grupo, cantidades, precios, nivel, moneda, porcentaje fiscal, ruta o
   agregados no son los de la sección 3 u 8. **No es un defecto del pipeline:
   es la prueba de que el PDF refleja la selección.**
4. **La configuración de cálculo de la base no es la del fixture.** El
   pipeline calcula con `configuracionRegresionFase2`; la app usa lo que haya
   en la tabla `configuracion` (`configuracion.ts:5-9`). Si divergen, divergen
   los hallazgos y las restricciones, y con ellos el plan.

No relajes la comparación para que pase. Si un punto de control no se puede
cumplir, es un hallazgo, no un ajuste del gate.

## 7 · Al terminar

```bash
git checkout -- src/documents/motor-activo.ts
git status --short          # vacío
grep -n 'MOTOR_DOCUMENTAL_ACTIVO' src/documents/motor-activo.ts   # "v1"
```
