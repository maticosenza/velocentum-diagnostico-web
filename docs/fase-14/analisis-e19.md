# E-19 — análisis de distribución y recomendación (DECISIÓN HUMANA)

Fase 14, ítem 2. No se aplicó ningún cambio derivado de este análisis —
sólo se produce acá, para que Matías decida. Ver `docs/prompts/fase-14.md`
sección 4.1, ítem 2.

## 1 · Qué dice el registro de E-19

`docs/visual/auditoria-visual-2026-08-23.md`, sección e): 124 de las 380
páginas del artefacto de la ronda 3.1 (commit `f18ff1f`) quedan bajo el
umbral de ocupación del contrato de composición (`contrato-composicion-v2.md`
sección 5.1: ≥70% pantalla / ≥65% impresión). Causa estructural correcta:
los bloques se dimensionan por los datos reales (regla dura, nunca se
infla contenido) — cualquier caso con poco contenido real queda bajo el
umbral por diseño, sin importar cómo se acomoden los bloques.

## 2 · Medición propia — método y por qué difiere del de la auditoría

La auditoría externa midió "distancia vertical entre la primera y la
última fila con contenido, descontando el pie de página, sobre el
ráster" (medición de píxeles). Este análisis usa un método distinto,
declarado: las posiciones Y reales de cada glifo de texto (`pdfjs`
`getTextContent()`, `transform[5]`, mismo mecanismo ya usado por H2b en
`generar-pdfs-bloque-3.test.ts`), excluyendo la franja del pie. Ocupación
= (Y máxima − Y mínima del contenido) / alto útil de página (alto de
página menos `pagePaddingTop`/`pagePaddingBottom`, los mismos tokens que
usa el renderer real, `PROFILES_V2`).

**Validación cruzada contra las 16 páginas de E-20** (única referencia
de valores reales disponible): mi método corre sistemáticamente 1.5 a
6.2 puntos porcentuales POR ENCIMA del valor de la auditoría en las 16
páginas conocidas, pero con el mismo orden relativo (correlación
direccional consistente) — ver la tabla completa en el historial de esta
sesión. **Uso este método sólo para caracterizar la FORMA de la
distribución agregada (percentiles/histograma), no para reproducir el
25% exacto de ninguna página individual** — el criterio duro de E-20
(cero páginas bajo el 25%, o excepción justificada) se evalúa contra las
16 páginas y porcentajes que dio la propia auditoría externa, no contra
esta medición.

Universo: 218 páginas (de 380), excluyendo portadas (54) y páginas de
tono oscuro con el wordmark grande estilo "transición"/cierre (108) —
ninguna de las dos categorías es evaluable con este criterio de
ocupación de texto (son deliberadamente breves o a sangre completa,
tratamiento ya aceptado en `contrato-composicion-v2.md` sección 5.4,
C3).

## 3 · Distribución (218 páginas de contenido)

| Percentil | Ocupación |
|---|---|
| Mínimo | 11,1% |
| P10 | 20,6% |
| P25 | 32,7% |
| P50 (mediana) | 52,7% |
| P75 | 86,7% |
| P90 | 100,0% |
| Máximo | 100,0% |
| Promedio | 56,3% |

Histograma (bandas de 10 puntos):

```
10-20%: ################## (19)
20-30%: ############################### (31)
30-40%: ############################ (27)
40-50%: ################################# (25)
50-60%: ################## (18)
60-70%: ########################## (23)
70-80%: ############### (14)
80-90%: ################ (16)
90-100%: ################################################# (45)
```

Páginas que fallarían bajo distintos umbrales candidatos (mi método):

| Umbral | Páginas bajo el umbral | % del universo |
|---|---|---|
| 70% (actual, pantalla) | 143 | 66% |
| 65% (actual, impresión) | 133 | 61% |
| 60% | 120 | 55% |
| 55% | 115 | 53% |
| 50% | 102 | 47% |
| 45% | 95 | 44% |
| 40% | 77 | 35% |
| 35% | 60 | 28% |
| 30% | 50 | 23% |
| 25% | 45 | 21% |

**Lectura de la forma:** la distribución NO tiene un único salto claro —
está razonablemente repartida entre 10% y 100%, con dos acumulaciones
visibles: una entre 20-50% (83 páginas, el "cuerpo" del problema) y otra
grande entre 90-100% (45 páginas, contenido que sí llena bien). La banda
50-60% es la más liviana (18 páginas) — el valle más cercano a un punto
de corte natural en los datos, aunque no es un quiebre marcado.

## 4 · Recomendación fundada (no aplicada — decisión humana pendiente)

**Entre las dos vías de la sección 4.1 ítem 2 del prompt, la
recomendación es la vía (a): bajar el umbral, no rediseñar la
paginación como estrategia general.**

Razones:

1. **La causa raíz no es de composición, es de volumen de datos real.**
   Los 16 casos de E-20 inspeccionados uno por uno (ver el handoff de
   esta fase, sección correspondiente) muestran el mismo patrón una y
   otra vez: 2 hallazgos reales, 2 restricciones reales, un paquete
   comercial confirmado de 1 nivel, una continuación de tarjeta de
   escenario con una sola magnitud. Ningún reordenamiento de bloques
   (la herramienta que sí resolvió C-1 en la ronda 3.1) puede hacer que
   2 oraciones ocupen 70% de una página sin inflar tipografía a un punto
   que rompería la escala tipográfica ya aprobada, o sin inventar un
   tercer hallazgo que no existe — ambas cosas prohibidas.
2. **Rediseñar la paginación (vía b) no tiene un mecanismo concreto
   propuesto que la sustente hoy.** La única palanca real sin inventar
   contenido es fusionar SECCIONES ENTERAS entre sí (ej. combinar
   "hallazgos" y "restricciones" en una sola sección cuando ambas son
   cortas) — un cambio de composición mucho más profundo que reordenar
   bloques dentro de una sección, con riesgo de romper la identidad
   temática de cada sección (cada una tiene su propio `eyebrow`/título,
   pensado como unidad de lectura). Es una vía viable PERO es un
   proyecto de rediseño, no un ajuste — no cabe en el alcance acotado de
   esta fase (`4.2 EXCLUIDO`: "Rediseño visual: la dirección de arte
   está aprobada").
3. **La distribución no tiene una meseta cerca de 70/65%** que sugiera
   que el umbral actual esté "casi bien" — el volumen de páginas que
   fallan (61-66% del universo con mi método, consistente en orden de
   magnitud con el 124/380 ≈ 33% de la auditoría sobre el universo
   completo de 380, incluidas portadas/transiciones que no fallan
   estructuralmente) indica que el 70%/65% se fijó sin validarlo contra
   contenido real — exactamente lo que el propio registro de E-19 ya
   concluye.
4. **Bajar el umbral no elimina el criterio de calidad — lo recalibra.**
   E-20 ya establece que hay un piso absoluto (25%) que sigue siendo un
   defecto real bajo cualquier decisión sobre el umbral general. Un
   umbral general más bajo (candidato: **45-50%**, cerca del valle
   natural de la distribución en la banda 50-60% y de la mediana
   real, 52,7%) seguiría funcionando como gate de calidad genuino —
   páginas por debajo de ESE número, en un universo donde la mitad del
   contenido real ya lo supera, sí serían indicio de un problema de
   composición, no sólo de volumen de datos.

**Número candidato para la vía (a), sujeto a la decisión humana: bajar
de 70%/65% a algo en el rango 45-50%**, manteniendo el piso duro de
E-20 (25%) sin cambios, y manteniendo la lista cerrada de excepciones
documentadas (sección 5.8) para los casos puntuales que ni siquiera ese
número alcancen sin inventar contenido.

**Esto es una recomendación, no una decisión.** No se modificó
`contrato-composicion-v2.md` sección 5.1 ni ningún umbral en código a
partir de este análisis. Ítem 1 (E-20) sigue su curso en paralelo, sin
depender de esta decisión.

## 5 · Confirmación adicional durante el ítem 1 (E-20)

Al construir la prueba X4 (`fase-14-x1-x4-x5-x7.test.ts`) se barrieron
los nueve casos × tres documentos × dos perfiles completos (no sólo las
16 páginas que reportó la auditoría externa) con el método declarado en
la sección 2. Resultado: **35 páginas adicionales** por debajo de 30%
en mi medición (mayormente en `propuesta`, secciones "Alcance"/
"Paquete seleccionado"/"Qué falta validar" con poco contenido real por
caso) — ninguna nueva CATEGORÍA de causa (mismo patrón: datos reales
escasos, no composición rota), pero confirma que el problema es más
amplio que las 16 puntualmente investigadas. Esto **refuerza**, no
contradice, la recomendación de la sección 4: es exactamente la escala
que ya describe el 124/380 de E-19. X4 se acotó deliberadamente a (a)
confirmar que las 16 páginas investigadas siguen documentadas y (b) un
piso absoluto de 10% (ninguna página observada baja de 11,1%) para no
convertir un test de regresión en una resolución no autorizada de E-19
por la puerta de atrás.
