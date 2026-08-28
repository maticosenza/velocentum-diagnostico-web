<!-- Ejecutado desde 8d685ed, cerrado en 84f4109. Texto original sin modificar. -->

BLOQUE VISUAL 2.2 — RONDA CORRECTIVA (2.2.1)

═══════════════════════════════════════════════════════════════════
CONTEXTO
═══════════════════════════════════════════════════════════════════

Repositorio: maticosenza/velocentum-diagnostico-web
Rama: feat/noche-continuacion — trabajar únicamente acá.
HEAD esperado: 8d685ede3a7e0135140e1fbf95cae14512566c2f
Línea base esperada: 681 pruebas aprobadas + 1 todo, typecheck limpio,
build exitoso, árbol limpio.

La auditoría externa del Bloque Visual 2.2 dio APROBADO CON CORRECCIONES.

Lo verificado y aprobado, que NO hay que rehacer:
  - el bug de paginación está efectivamente corregido: 48 PDFs, 325
    páginas, 325 rásters, cero páginas decorativas vacías, cero
    contenido cortado por desborde de textura;
  - tinta plena A4: máximo 13,6% sobre 158 páginas, ninguna sobre 25%;
  - cero placeholders, undefined, NaN, null o enums crudos en los 48
    PDFs;
  - D-4 resuelto: "† remite a Supuestos, en este mismo escenario"
    presente en todas las páginas con daga;
  - barrido de cobertura completo: 6 casos nuevos incluidos mayorista y
    mixto, ninguno con layout roto;
  - ningún hallazgo fuera de alcance modificado;
  - ninguna decisión pendiente resuelta de oficio.

Esta ronda corrige cinco cosas y solo cinco. No amplía alcance, no
rediseña lo aprobado, no avanza de bloque.

═══════════════════════════════════════════════════════════════════
PASO 0 — VERIFICACIÓN INICIAL
═══════════════════════════════════════════════════════════════════

Reportá rama, HEAD completo, `git status --short`, y el resultado de
suite, typecheck y build. Debe dar 681 + 1 todo.
Si algo difiere, DETENETE y reportá la diferencia exacta.

═══════════════════════════════════════════════════════════════════
PROHIBICIONES ABSOLUTAS (sin cambios respecto del Bloque Visual 2.2)
═══════════════════════════════════════════════════════════════════

- No modificar src/documents/domain/types.ts ni ningún tipo del dominio.
- src/lib/ es de SOLO LECTURA. No modificar fixtures canónicos.
- No modificar velocentum-v1 ni los renderers v1.
- No modificar ninguna prueba existente. Las 681 + 1 todo deben seguir
  pasando sin tocarse.
- No promover v2 sobre v1. No conectar v2 a la interfaz ni al botón de
  descarga.
- No implementar el bloqueo de exportación: es Bloque 3 funcional.
- No resolver las decisiones pendientes 1, 2, 3, 4 ni 6.
- No tocar E-05, E-07, E-08, E-09, E-16, E-18, C-02, C-03, C-04, C-08,
  R-07, R-09.
- No tocar base de datos, migraciones, secretos ni producción.
- No integrar a main. No publicar. No desplegar.
- No avanzar al Bloque 3 funcional, al Bloque Visual 3 ni a la fase 14.
- No inventar cifras, servicios, precios ni resultados.
- No copiar contenido, copy ni cifras de `Dropnkicks propuesta.pdf`.

Terminología obligatoria (D7): multicanal = combinación de tienda
propia, Mercado Libre u otros canales de venta. Mixto = operación
minorista con módulo mayorista activado.

═══════════════════════════════════════════════════════════════════
CORRECCIÓN 1 · REGRESIÓN EN LA IDENTIDAD DE CONTINUACIÓN (C5)
═══════════════════════════════════════════════════════════════════

Severidad: ALTA. Es una regresión respecto de la ronda 2.1, criterio 13.

Qué pasó: D-2 pedía dejar de repetir el nombre del escenario en tarjetas
que NO continúan. Se implementó al revés. Hoy:
  - el marcador redundante a mitad de tarjeta SIGUE presente;
  - el marcador de identidad en la página de CONTINUACIÓN, que en la
    ronda 2.1 funcionaba, DESAPARECIÓ.

Evidencia comparada, misma página, dos rondas:
  ANTES (ronda 2.1), comparativas/antes-2.2/
  1-marketplace-fuerte-tienda-floja__proyeccion_90d-pantalla-6.png:
  el bloque de continuación abre con "CONSERVADOR" seguido de
  "Supuestos". Correcto.

  AHORA (ronda 2.2), rasters/s1-s4-corregidos/ y rasters/cobertura/:
  la misma página abre directamente con "Supuestos — referencia de los
  valores marcados con †", sin ninguna identidad de escenario.

Alcance del defecto: cinco documentos, perfil pantalla, siempre en la
página 6 de 9:
  1-marketplace-fuerte-tienda-floja__proyeccion_90d-pantalla
  2-margen-alto-volumen-bajo__proyeccion_90d-pantalla
  3-margen-fino-volumen-alto__proyeccion_90d-pantalla
  5-todo-sano__proyeccion_90d-pantalla
  6-solo-organico__proyeccion_90d-pantalla

Qué hacer:
  a) restaurar el marcador de identidad en el bloque de continuación,
     con el formato que ya existía en 2.1 más una marca explícita de
     continuación;
  b) eliminar el marcador redundante a mitad de tarjeta, que es lo que
     D-2 pedía originalmente.

Es decir: el nombre del escenario aparece UNA vez en el encabezado de la
tarjeta, y vuelve a aparecer SOLO si el bloque continúa en otra página.

Criterio: ninguna página de continuación sin identidad; ninguna tarjeta
que quepa entera repite su propio nombre. Verificable con una prueba
que recorra las páginas y compruebe ambas condiciones.

═══════════════════════════════════════════════════════════════════
CORRECCIÓN 2 · D-2 NO RESUELTO (marcador redundante)
═══════════════════════════════════════════════════════════════════

Severidad: MEDIA. Se resuelve junto con la Corrección 1, punto (b), pero
se lista aparte porque su alcance es mayor.

Evidencia: el nombre del escenario aparece dos veces en la misma página,
en tarjetas que no continúan, en al menos 20 páginas de ambos perfiles,
incluidos los documentos de s1 y s4 que ya habían pasado por 2.1.
Ejemplos verificados:
  rasters/cobertura/5-todo-sano__proyeccion_90d-pantalla-5.png
    → "CONSERVADOR" en el encabezado de la tarjeta y otra vez en violeta
      pequeño, encima de la nota de la daga.
  rasters/s1-s4-corregidos/
  1-marketplace-fuerte-tienda-floja__proyeccion_90d-impresion-6.png
    → "BASE" en el encabezado y otra vez encima de la tabla mensual.

Criterio: cero repeticiones del nombre de escenario dentro de una misma
tarjeta que cabe entera en una página, en los 48 PDFs.

═══════════════════════════════════════════════════════════════════
CORRECCIÓN 3 · TRANSICIONES Y CIERRES SIGUEN SIENDO BLOQUES PLANOS
═══════════════════════════════════════════════════════════════════

Severidad: MEDIA. Es la séptima viñeta de D-5, que quedó sin atender en
el perfil pantalla.

D-5 pedía: "transiciones y cierres con intención visual, evitando
bloques planos sin función".

En el perfil impresión esto se resolvió (sección 5.4 del contrato:
fondo claro, mensaje dentro de una tarjeta). En el perfil PANTALLA no se
tocó: las transiciones y los cierres siguen siendo una página violeta a
sangre completa con una sola línea de texto y aproximadamente 85% de
superficie vacía.

Evidencia:
  rasters/cobertura/5-todo-sano__diagnostico-pantalla-3.png
    ("De los datos a las prioridades")
  rasters/cobertura/5-todo-sano__diagnostico-pantalla-5.png
    ("Validar los hallazgos priorizados y definir con qué se arranca")
En ese documento, 2 de 5 páginas son bloques planos.

Qué hacer: aplicar en pantalla la misma intención visual que ya existe
en impresión, usando los tokens de dirección de arte de la sección 6 del
contrato (textura de líneas, degradado con dirección, motivo de
línea+puntos). El fondo violeta a sangre PUEDE conservarse en pantalla
—C3 aplica solo a A4— pero la página no puede ser un rectángulo de color
liso con una línea de texto.

Qué NO hacer: agregar contenido inventado. La transición sigue diciendo
lo mismo; cambia cómo se compone.

Criterio: ninguna página de transición o cierre, en ningún perfil, es un
bloque de color plano sin recursos de dirección de arte.

═══════════════════════════════════════════════════════════════════
CORRECCIÓN 4 · MONTAJES COMPARATIVOS FALTANTES (D-5 criterio 5)
═══════════════════════════════════════════════════════════════════

Severidad: MEDIA, de evidencia.

El prompt exigía montajes antes/después "de páginas representativas de
portada, contenido, escenarios y cierre". El paquete entregó UN solo
montaje: comparativas/montajes/portada-D3.png, que cubre únicamente
portada.

La evidencia cruda sí permitió completar la auditoría —
comparativas/antes-2.2/ tiene las 74 páginas del baseline 2.1 — pero el
entregable exigido no se cumplió.

Qué hacer: generar los tres montajes faltantes, antes (ronda 2.1) contra
después (HEAD final de esta ronda correctiva), para s1 y s4:
  - CONTENIDO: una página de diagnóstico con hallazgos, ambos perfiles;
  - ESCENARIOS: una página de proyección con tarjeta de escenario y
    tabla mensual, ambos perfiles;
  - CIERRE: una página de transición o próximo paso, ambos perfiles.
Más la portada, que ya existe, regenerada contra el HEAD final.

Criterio: cuatro montajes, uno por cada tipo de página exigido, con
etiqueta clara de qué archivo y qué página se comparan de cada lado.

═══════════════════════════════════════════════════════════════════
CORRECCIÓN 5 · NÚMERO DE PÁGINAS INCORRECTO EN EL HANDOFF
═══════════════════════════════════════════════════════════════════

Severidad: BAJA, pero es un dato de auditoría y tiene que quedar bien.

El handoff de la ronda 2.2 declara, en sus secciones 9 y 10, un barrido
"sobre las 409 páginas totales de esta ronda (48 PDFs)".

El recuento sobre los artefactos entregados da 325 páginas: la suma de
páginas de los 48 PDFs es 325, y hay exactamente 325 rásters, en
correspondencia uno a uno.

La hipótesis más probable es que 409 sea el conteo del commit 9923df6,
el que todavía tenía el bug de paginación, y que el número no se haya
actualizado después del commit correctivo 8d685ed.

Qué hacer:
  a) confirmar o refutar esa hipótesis: contá las páginas que producen
     los 48 PDFs generados desde 9923df6 y reportá el número;
  b) corregir el conteo en el handoff y en cualquier documento de
     docs/visual/ que lo repita;
  c) revisar si algún otro número del handoff quedó heredado del commit
     con bug, y corregirlo.

Criterio: todo número declarado en el handoff se puede reproducir desde
los artefactos entregados.

═══════════════════════════════════════════════════════════════════
OBSERVACIONES QUE NO REQUIEREN ACCIÓN EN ESTA RONDA
═══════════════════════════════════════════════════════════════════

No las corrijas. Están registradas y se resuelven más adelante.

  - El literal CSS duplicado en `document-renderer.css` (fallback de
    custom property). Queda documentado como deuda; no lo toques ahora.
  - La textura de fondo en PDF quedó restringida a la portada por una
    limitación real de `@react-pdf/renderer` con `Svg` en posición
    absoluta. La decisión de revertir fue correcta. Si en el futuro se
    quiere textura en páginas de contenido del PDF, hay que resolverlo
    con `View` anidados de tamaño fijo, no con `Svg` absoluto.
  - La excepción de ocupación de portada (D-1) y la baja ocupación de
    propuesta/findings con pocos ítems quedan aceptadas y documentadas
    en la sección 5.8 del contrato.
  - La discrepancia "5 contra 6 páginas para diagnóstico" quedó
    explicada: son dos perfiles distintos (impresión 5, pantalla 6), no
    inestabilidad de generación. No hay nada que investigar.

═══════════════════════════════════════════════════════════════════
PRUEBAS NUEVAS Y CONTEO DE PRUEBAS
═══════════════════════════════════════════════════════════════════

Pruebas nuevas de esta ronda, sobre v2 exclusivamente:

  R1 · ninguna página de continuación de tarjeta de escenario carece de
       identidad, en ninguno de los dos perfiles;
  R2 · ninguna tarjeta que quepa entera en una página repite su propio
       nombre;
  R3 · ninguna página de transición o cierre es un bloque de color plano
       sin recursos de dirección de arte, en ninguno de los dos
       perfiles.

CONTEO DE PRUEBAS — REGLA INEQUÍVOCA, SIN DOBLE CONTEO:

  - Línea base antes de esta ronda: **681 aprobadas + 1 todo**.
  - **P1–P10 y Q1–Q6 YA ESTÁN INCLUIDAS dentro de esas 681.** No se
    suman de nuevo. Son subconjuntos de la línea base, no adicionales.
  - **R1–R3 son las únicas pruebas nuevas** de esta ronda.
  - Total final esperado = 681 + (cantidad de casos que aporten R1–R3),
    más 1 todo.

Ninguna prueba existente se modifica, se elimina ni se relaja. Si una
prueba de la línea base se rompe, es señal de que se tocó algo que no
correspondía: revertí y reportá.

═══════════════════════════════════════════════════════════════════
CRITERIOS DE ACEPTACIÓN DE ESTA RONDA
═══════════════════════════════════════════════════════════════════

 1. Las 681 + 1 todo de la línea base pasan sin haber sido modificadas.
 2. Typecheck limpio y build exitoso.
 3. v1, dominio, src/lib/ y fixtures canónicos no aparecen en el diff.
 4. R1 a R3 pasan. P1–P10 y Q1–Q6, que forman parte de la línea base,
    siguen pasando sin relajarse.
 5. Corrección 1: cero páginas de continuación sin identidad, en los 48
    PDFs.
 6. Corrección 2: cero repeticiones del nombre de escenario dentro de
    una tarjeta que cabe entera, en los 48 PDFs.
 7. Corrección 3: cero páginas de transición o cierre como bloque plano,
    en ambos perfiles.
 8. Corrección 4: los cuatro montajes entregados y etiquetados.
 9. Corrección 5: todo número del handoff reproducible desde los
    artefactos.
10. Ninguna página A4 supera el 25% de tinta plena (sigue vigente).
11. Cero placeholders, undefined, NaN, null o enums crudos.
12. Ninguna regresión respecto de la ronda 2.2 en ninguno de los 48
    documentos: conteo de páginas y comparación antes/después.
13. Ningún hallazgo fuera de alcance modificado.
14. Ninguna decisión pendiente resuelta de oficio.
15. Nada inventado. Ningún umbral relajado.

═══════════════════════════════════════════════════════════════════
SECUENCIA DE TRABAJO, AUDITORÍA INTERNA, COMMIT Y PUSH
═══════════════════════════════════════════════════════════════════

Seguí esta secuencia exactamente, en este orden. No la reordenes.

  PASO 1 — Implementar las Correcciones 1 a 5 y verificar el árbol de
           trabajo. `git status --short` debe reflejar únicamente los
           cambios previstos.

  PASO 2 — Ejecutar suite completa, typecheck, build y la generación
           completa de los 48 PDFs, sus rásters, los renders web y los
           cuatro montajes. Inspeccionar las páginas afectadas.

  PASO 3 — Crear un COMMIT CANDIDATO LOCAL. Sin push. Este commit es el
           objeto que se audita.

  PASO 4 — Ejecutar la AUDITORÍA INTERNA COMPLETA contra ese HEAD
           candidato exacto. Un agente auditor de SOLO LECTURA, sin
           contexto de la sesión de implementación, que verifica y solo
           reporta, nunca implementa:
             - aislamiento del diff;
             - que las Correcciones 1 a 5 tengan corrección, prueba y
               página de evidencia cada una;
             - que las observaciones que no requieren acción no hayan
               sido tocadas;
             - que ningún hallazgo fuera de alcance se haya tocado;
             - que ninguna decisión pendiente se haya resuelto;
             - que ningún umbral se haya relajado;
             - que el conteo de pruebas respete la regla de no doble
               conteo (681 de línea base, P/Q incluidas en ellas, R1–R3
               como únicas nuevas);
             - que todo número declarado sea reproducible desde los
               artefactos;
             - que los 15 criterios estén evaluados uno por uno con
               veredicto explícito.
           Veredicto: APROBADO / APROBADO CON CORRECCIONES / BLOQUEADO.

  PASO 5 — Si la auditoría devuelve correcciones: aplicarlas,
           INCORPORARLAS AL COMMIT CANDIDATO (amend o commit adicional,
           a tu criterio, mientras el resultado quede en un único HEAD
           candidato coherente) y volver al PASO 4 ejecutando la
           auditoría COMPLETA sobre el nuevo HEAD. No alcanza con
           verificar puntualmente lo corregido.

  PASO 6 — Máximo DOS rondas de auditoría. Si al cabo de la segunda
           queda algo abierto, no lo fuerces: cerrá con lo que haya y
           reportalo como pendiente en el handoff.

  PASO 7 — ÚNICAMENTE después de un veredicto APROBADO, hacer push a
           feat/noche-continuacion.

  PASO 8 — Comprobar que HEAD local y remoto coinciden:
           `git log origin/feat/noche-continuacion -1` debe devolver
           exactamente el mismo hash que el HEAD local. Reportarlo.

Restricciones de commit y push, vigentes en toda la secuencia: push
ÚNICAMENTE a feat/noche-continuacion; nunca a main; nunca un merge, un
rebase sobre main ni un tag. Mensajes de commit descriptivos, en
español, referenciando las Correcciones 1 a 5.

═══════════════════════════════════════════════════════════════════
FORMATO DEL HANDOFF
═══════════════════════════════════════════════════════════════════

Doce secciones numeradas, en este orden, sin omitir ninguna.

 1. Rama y HEAD completo.
 2. `git status --short`.
 3. `git diff --stat` contra 8d685ed.
 4. Aislamiento: archivos tocados y afirmación explícita.
 5. Resultado del paso 0.
 6. Estado de las Correcciones 1 a 5, una por una, con archivo, perfil,
    página de evidencia y prueba que la cubre.
 7. Resultado de la Corrección 5: cuántas páginas producen los 48 PDFs
    desde 9923df6, cuántas desde el HEAD final, y qué otros números del
    handoff se corrigieron.
 8. CONTEO DE PRUEBAS, declarado sin doble conteo y en este orden:
      a) línea base antes de 2.2.1: 681 aprobadas + 1 todo;
      b) subconjuntos P1–P10 y Q1–Q6: cuántos casos son y confirmación
         explícita de que ya están incluidos dentro de esas 681;
      c) pruebas nuevas R1–R3: cuántos casos aportan;
      d) total final: 681 + casos de R1–R3, más 1 todo.
    Más el resultado de typecheck y build.
 9. Verificación de no regresión sobre los 48 documentos: conteo de
    páginas antes y después.
10. Rutas y descripción de los cuatro montajes comparativos.
11. Auditoría interna: sobre qué HEAD candidato se corrió cada ronda,
    cuántas rondas hubo, qué reportó cada una, qué se corrigió, y el
    veredicto final. Confirmación explícita de que el push se hizo
    después del veredicto APROBADO y no antes.
12. Los 15 criterios de aceptación, uno por uno, con veredicto.

Listá las rutas de todos los PDFs, rásters, renders web y montajes.

═══════════════════════════════════════════════════════════════════
RESTRICCIONES FINALES
═══════════════════════════════════════════════════════════════════

Al terminar el handoff, DETENETE para revisión humana.

No promuevas v2 sobre v1.
No conectes v2 a la interfaz ni al botón de descarga.
No implementes el bloqueo de exportación.
No resuelvas las decisiones pendientes 1, 2, 3, 4 ni 6.
No modifiques base de datos, migraciones, secretos ni producción.
No integres a main. No publiques. No despliegues.
No avances al Bloque 3 funcional, al Bloque Visual 3 ni a la fase 14.
No amplíes el alcance.

Si algo de este prompt entra en conflicto con el código, con los
documentos de docs/visual/ o con una instrucción previa, NO elijas por
tu cuenta: detenete y reportá el conflicto.

FIN DEL PROMPT — BLOQUE VISUAL 2.2.1
