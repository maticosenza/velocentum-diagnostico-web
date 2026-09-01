# BV4 · F2a — Hallazgos diferidos y supuestos de la ronda 3

Lo que la ronda 3 encontró y **no** corrigió, con ID para que nadie lo
redescubra ni lo tape. Tres los declaró el prompt de la ronda como fuera de
alcance (H-1, H-2, H-3); dos aparecieron al ejecutarla (H-4, H-5).

Estado al 2026-09-01, después de la auditoría del handoff: **H-4 resuelto**
por Matías —aportó al documento fuente la frase que faltaba—; **H-5
confirmado a F3b**; H-1, H-2 y H-3 quedan como estaban.

Regla que los agrupa: la ronda 3 tocó **lógica de negocio del reparto
30/60/90** y nada más. Lo que es presentación va a F3b, que es la fase de
arte; lo que pide cambiar el modelo comercial espera una decisión de Matías.

---

## H-1 · Restricciones mezcladas con servicios en el plan · F3b

En la etapa 61-90, "Muestra de productos parcial" y "Política de envío sin
confirmar" salen con la **misma viñeta** que los renglones de servicio. El
modelo las distingue —`restricciones` y `roadmapV2` son campos distintos, y
el `Resultado:` de cada etapa las nombra como `la restricción "…"`—; el que
no las distingue es el render.

Es presentación: **va a F3b**. No se corrigió acá.

## H-2 · Pago partido 60/40 en webs desde cero · modelo comercial

La condición comercial real de un desarrollo web custom desde cero es 60 %
adelantado y 40 % al finalizar. El modelo v2 sólo tiene
`recurrencia: mensual | unica`, así que **no es representable**. Registrado;
se resuelve más adelante. La ronda 3 **no tocó el modelo de F2a**.

## H-3 · Tensión de calendario en desarrollo custom · nota, no defecto

Si el desarrollo lleva hasta 3 meses y la pauta se cobra desde el mes 1, el
documento muestra esa superposición: en la propuesta de Titan Web, "Desarrollo
web custom" ocupa las tres etapas del plan mientras Meta Ads y Product Ads ya
están corriendo. Es **decisión comercial, no defecto**. Queda anotado para que
no se lea como error de reparto.

## H-4 · Google Ads no tenía viñeta de escala · **RESUELTO 2026-09-01**

**Lo que se encontró.** R3 pide que los servicios de pauta progresen activar →
optimizar → escalar. Se cumplía entero en Meta Ads y en Product Ads. En Google
Ads no: sus cinco viñetas verbatim cubrían activación (cuenta y Google Tag,
estructura, palabras clave, feed) y optimización (pujas y presupuesto), y
**ninguna decía escala**.

Las dos salidas posibles eran escribir la frase que faltaba —prohibido por el
prompt: "Nada se inventa: ni frases"— o dejar la línea sin renglón en 61-90.
La ronda **se frenó**: dejó el hueco, lo fijó con una prueba para que no se
tapara, y lo entregó como hallazgo.

**Cómo se resolvió.** Matías auditó el handoff y resolvió el fondo: Google Ads
**sí** escala en el mes 3, y la frase que faltaba era suya, no del documento.
Agregó la **sexta viñeta** a Google Ads en
`docs/funcional/f2a-textos-servicios.md`:

> Escala de las campañas y palabras clave con mejor rendimiento

El reparto la toma en 61-90 y la prueba cambió de sentido: antes fijaba el
hueco, ahora exige el renglón **y** que su frase esté en el markdown fuente
—si alguien la borra del documento y la deja sólo en el código, la suite
rompe—. R3 se cumple ahora en las tres líneas de pauta.

Queda registrado, y no como pendiente: el valor del ID está en el camino. Un
faltante de texto se frena y se pregunta; no se completa.

## H-5 · El encabezado del plan dice "DÍAS 0-30" · F3b (confirmado)

La primera etapa se rotula `01 · DÍAS 0-30` en el PDF, mientras su etiqueta,
dos renglones abajo, dice "Días 1 a 30". El encabezado usa `desdeDia`, que
vale `0` desde DHB-3.

No se tocó porque `desdeDia` es un campo del contrato documental que **también
renderizan las plantillas v1**: cambiarlo habría cambiado la salida v1 y
violado la condición F-2, que esta ronda tenía que respetar. Es presentación:
**va a F3b**, confirmado por Matías el 2026-09-01.

---

## Supuesto registrado · duración de desarrollo web custom

`desarrollo_web_custom` reparte relevamiento y maquetado en 1-30,
implementación en 31-60, y pruebas y puesta en producción en 61-90. Ese
reparto **vale para el caso de varios meses**. Si la duración fuera de un mes,
la línea iría completa en 1-30, como diseño web.

El modelo v2 **no tiene campo de duración** y no se inventó uno. Queda el
reparto de tres etapas como supuesto explícito; el día que exista el campo, la
tabla de `reparto-roadmap-v2.ts` lo lee y decide.
