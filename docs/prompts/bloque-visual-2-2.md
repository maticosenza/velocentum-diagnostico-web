<!-- Ejecutado desde 89b2b7b, cerrado en 8d685ed. Texto original sin modificar. -->

BLOQUE VISUAL 2.2 — BARRIDO DE COBERTURA, AJUSTES DE COMPOSICIÓN
Y COHERENCIA VISUAL

═══════════════════════════════════════════════════════════════════
CONTEXTO
═══════════════════════════════════════════════════════════════════

Repositorio: maticosenza/velocentum-diagnostico-web
Rama: feat/noche-continuacion — trabajar únicamente acá.
HEAD esperado: 89b2b7bc06bb502b0c96734f443cedc439645370
Línea base real: 665 pruebas aprobadas + 1 todo (666), 47 archivos de
test, typecheck limpio, build exitoso, árbol limpio.

Nota sobre la línea base: son 595 pruebas de dominio + 47 de v2 del
Bloque Visual 2 + 23 de la ronda 2.1. El número "595+1" que circuló en
prompts anteriores estaba desactualizado; la referencia válida es 665+1.

La ronda 2.1 cerró con APROBADO CON CORRECCIONES en la auditoría humana
externa, verificada de forma independiente sobre los 12 PDFs, las 74
páginas rasterizadas, las 8 comparativas y los 6 renders web.

Quedaron resueltas y verificadas: C1, C2, C3, C4, C6, C8, C9 y C10.
C5 quedó resuelta con un residuo. C7 quedó parcialmente resuelta.
El barrido de regresiones antes/después sobre las 73 páginas comparables
no detectó ninguna regresión real.

Este bloque hace tres cosas y solo tres:
  A. extiende la evidencia visual a los escenarios que faltan;
  B. cierra los defectos residuales D-1 a D-4;
  C. alinea el lenguaje visual del prototipo con la referencia Velocentum
     (D-5), ANTES de propagarlo.

No promueve v2 sobre v1. No toca el contrato de tipos. No implementa el
bloqueo de exportación. No es un rediseño general.

Orden posterior, ya decidido y fuera de discusión en este bloque:
Bloque Visual 2.2 → Bloque 3 funcional → Bloque Visual 3 → fase 14.

═══════════════════════════════════════════════════════════════════
PASO 0 — VERIFICACIÓN INICIAL
═══════════════════════════════════════════════════════════════════

Reportá rama, HEAD completo, `git status --short`, y el resultado de
suite, typecheck y build. Debe dar 665 + 1 todo.

Si algo difiere, DETENETE y reportá la diferencia exacta. No reconcilies
por tu cuenta.

Confirmá que existen docs/visual/contrato-composicion-v2.md y
docs/visual/auditoria-visual-2026-08-23.md.

Confirmá que tenés acceso a las dos referencias de dirección de arte:
`Dropnkicks propuesta.pdf` y `velocentum_design_system.txt`. Si no están
disponibles en el repositorio ni en el material de referencia,
DETENETE y pedilas antes de empezar D-5. NO improvises la dirección de
arte a partir de tu criterio.

═══════════════════════════════════════════════════════════════════
PROHIBICIONES ABSOLUTAS
═══════════════════════════════════════════════════════════════════

- No modificar src/documents/domain/types.ts ni ningún tipo del dominio.
- src/lib/ es de SOLO LECTURA. No modificar fixtures canónicos.
- No modificar velocentum-v1, renderers/pdf (v1) ni renderers/web (v1).
- No modificar ninguna prueba existente. Las 665 + 1 todo deben seguir
  pasando sin tocarse.
- No promover v2 sobre v1. No conectar v2 a la interfaz ni al botón de
  descarga.
- No implementar el bloqueo de exportación de propuesta sin selección
  comercial confirmada: es Bloque 3 funcional.
- No resolver las decisiones pendientes 1, 2, 3, 4 ni 6.
- No tocar los hallazgos fuera de alcance: E-05, E-07, E-08, E-09, E-16,
  E-18, C-02, C-03, C-04, C-08, R-07, R-09.
- No tocar base de datos, migraciones, secretos ni producción.
- No integrar a main. No publicar. No desplegar.
- No avanzar al Bloque 3 funcional, al Bloque Visual 3 ni a la fase 14.
- No inventar cifras, servicios, precios ni resultados.
- No copiar contenido, copy ni cifras de `Dropnkicks propuesta.pdf`: es
  dirección de arte, no una plantilla ni una fuente de contenido.

Terminología obligatoria (D7): multicanal = combinación de tienda propia,
Mercado Libre u otros canales de venta. Mixto = operación minorista con
módulo mayorista activado. Nunca uses "mixto" como sinónimo de
"multicanal".

═══════════════════════════════════════════════════════════════════
ORDEN DE EJECUCIÓN
═══════════════════════════════════════════════════════════════════

D-5 (coherencia visual) se implementa ANTES de la Parte A (barrido de
cobertura). Motivo: el criterio 6 de D-5 exige que los escenarios nuevos
se generen ya con el lenguaje visual corregido. Generar primero y
rediseñar después obligaría a regenerar todo dos veces.

Secuencia:
  1. Paso 0 — verificación.
  2. D-5 — tokens y componentes de dirección de arte.
  3. D-1 a D-4 — defectos residuales.
  4. Parte A — barrido de cobertura, ya con el lenguaje corregido.
  5. Pruebas, auditoría interna, commit, handoff.

═══════════════════════════════════════════════════════════════════
D-5 · COHERENCIA VISUAL CON LA REFERENCIA VELOCENTUM
═══════════════════════════════════════════════════════════════════

Referencias de dirección de arte: `Dropnkicks propuesta.pdf` y
`velocentum_design_system.txt`.

Diagnóstico de partida: el prototipo v2 conserva correctamente la paleta
y la tipografía del sistema, pero quedó más plano, más vacío y más
técnico que la referencia. Se lee como un informe generado
automáticamente, no como un entregable de una consultora de growth.

No se debe copiar literalmente una presentación comercial sobre un
informe diagnóstico. Hay que trasladar el ADN visual de la referencia de
forma compatible con páginas densas, tablas y el perfil A4.

Reforzá de forma SISTEMÁTICA —no página por página— estos elementos:

  - fondos claros blanco/lavanda con textura o geometría extremadamente
    sutil;
  - degradados azul/violeta contenidos y con dirección;
  - jerarquía de títulos que combine navy/negro con acentos azules;
  - tarjetas redondeadas con profundidad leve y consistente;
  - iconografía lineal dentro de círculos cuando ayude a identificar
    etapas, canales o acciones;
  - mejor uso del espacio vacío, sin rellenar con contenido inventado;
  - transiciones y cierres con intención visual, evitando bloques planos
    sin función;
  - coherencia entre diagnóstico, proyección y propuesta, manteniendo una
    personalidad diferenciada para cada documento.

RESTRICCIONES DE D-5

  - La referencia es dirección de arte, no una plantilla para copiar.
  - No agregar decoración que compita con cifras, alertas o tablas. Si un
    recurso decorativo reduce la legibilidad de un número, de una alerta
    o de una fila de tabla, se descarta.
  - En A4 se mantiene fondo claro y máximo 25% de tinta plena por página
    (C3 sigue vigente y no se negocia).
  - No modificar v1, dominio, cálculos, fixtures ni contenido.
  - Implementar los recursos como TOKENS Y COMPONENTES COMPARTIDOS de v2,
    no como excepciones manuales por página. Si una página necesita un
    tratamiento propio, es señal de que falta un token, no de que hay que
    hacer una excepción.
  - No convertir el trabajo en un rediseño general ni ampliar el alcance
    funcional.
  - La iconografía se usa solo donde ayuda a identificar etapas, canales
    o acciones. No poner un ícono en cada tarjeta por defecto.

CRITERIOS DE D-5

  1. Las salidas se reconocen inequívocamente como parte del mismo
     sistema visual que `Dropnkicks propuesta.pdf`.
  2. Ninguna portada contiene bloques decorativos vacíos o que parezcan
     imágenes sin cargar.
  3. Las páginas de contenido dejan de sentirse como tablas automáticas,
     sin perder legibilidad.
  4. Pantalla conserva mayor riqueza visual; A4 mantiene una adaptación
     imprimible.
  5. La comparación antes/después incluye páginas representativas de
     portada, contenido, escenarios y cierre.
  6. El barrido de cobertura usa directamente este lenguaje visual
     corregido para los escenarios nuevos.

ENTREGABLE DOCUMENTAL DE D-5

Antes de implementar, agregá al contrato de composición
(docs/visual/contrato-composicion-v2.md) una sección nueva que fije:
  - los tokens de textura/geometría de fondo y su opacidad máxima;
  - los tokens de degradado (dirección, extensión, límites por perfil);
  - la escala de profundidad de tarjetas (sombra/glow) por perfil;
  - las reglas de uso de iconografía: cuándo se usa y cuándo no;
  - la regla de "personalidad por documento": qué distingue visualmente
    diagnóstico, proyección y propuesta sin romper el sistema;
  - el límite duro de decoración: qué no puede superponerse ni competir
    con cifras, alertas y tablas.

Esa sección es la fuente de la prueba Q6.

═══════════════════════════════════════════════════════════════════
PARTE B — DEFECTOS RESIDUALES D-1 A D-4
═══════════════════════════════════════════════════════════════════

── D-1 · OCUPACIÓN: la lista de excepciones no cubre lo que pasa ──

Medición externa sobre los 74 rásters de la ronda 2.1: al menos siete
páginas de contenido sustantivo quedan por debajo del umbral (70%
pantalla / 65% A4) sin encajar en ninguna de las tres excepciones de la
sección 5.8 del contrato de composición:

  1-...-propuesta-impresion.pdf       p2/7   109 palabras   ~36%
  1-...-propuesta-impresion.pdf       p3/7    83 palabras   ~38%
  1-...-proyeccion_90d-impresion.pdf  p2/8   103 palabras   ~47%
  4-...-diagnostico-impresion.pdf     p2/5    95 palabras   ~53%
  1-...-propuesta-pantalla.pdf        p2/7   108 palabras   ~50%
  1-...-diagnostico-pantalla.pdf      p5/6   102 palabras   ~52%
  1-...-proyeccion_90d-pantalla.pdf   p8/9   134 palabras   ~52%

Método de la medición externa: distancia entre la primera y la última
fila con contenido, descontando el pie de página. Si el contrato define
"alto útil" de otro modo, decilo y proponé la definición operativa; lo
que no es discutible es una página al 36%.

La más importante es la primera: la página 2 de la propuesta lleva la
cifra que sostiene toda la venta y queda con dos tercios en blanco.

Qué hacer: aplicar la regla del contrato — fusionar secciones que no
llenen, o expandir el componente. Prioridad al hero de propuesta y al
hero de proyección. Parte de esto se resuelve por consecuencia de D-5:
un hero con dirección de arte ocupa el espacio con intención en vez de
dejarlo vacío.

Qué NO hacer: agregar contenido inventado. Si una página no llega sin
inventar, sumala a la lista de excepciones con su motivo puntual y
dejala. Una excepción documentada es correcta; rellenar no lo es.

Actualizá la sección 5.8 del contrato para que la lista de excepciones
sea realmente cerrada y verificable página por página, no por categoría.

── D-2 · MARCADOR DE IDENTIDAD DE ESCENARIO REDUNDANTE ──

Evidencia: 4-...-proyeccion_90d-impresion.pdf p5/6 y
1-...-proyeccion_90d-impresion.pdf p7/8. Dentro de una misma tarjeta que
NO se parte, el nombre del escenario aparece dos o tres veces en violeta
pequeño: antes de la tabla mensual, antes de las palancas y antes de
"Supuestos".

C5 pedía repetir la identidad al CONTINUAR en otra página; se implementó
de forma incondicional.

Qué hacer: el marcador se muestra únicamente cuando el bloque
efectivamente continúa desde la página anterior.

Criterio: ninguna tarjeta que quepa entera en una página repite su
propio nombre.

── D-3 · BLOQUE DE ACENTO VACÍO EN LA PORTADA A4 ──

Evidencia: 1-...-propuesta-impresion.pdf p1/7 y
1-...-diagnostico-impresion.pdf p1/5. El acento violeta pasó de banda a
sangre a rectángulo redondeado contenido —lo correcto para C3— pero
quedó como un bloque de color liso, sin contenido, flotando arriba a la
derecha. Puede leerse como una imagen que no cargó. Además la portada
queda con aproximadamente 55% de vacío entre el subtítulo y el pie.

Qué hacer: resolver esto DENTRO de D-5, no como parche aislado. El
acento debe ser un elemento de dirección de arte con intención
—retícula sutil, curva, degradado con dirección— derivado de los tokens
nuevos, no un rectángulo ad hoc. Compactar el vacío vertical.

No vuelvas a la sangre completa: C3 sigue vigente, máximo 25% de tinta
plena por página A4.

Criterio: la portada A4 no contiene ningún bloque de color liso sin
función, y su ocupación cumple el umbral o entra en la lista de
excepciones con su motivo.

── D-4 · LA DAGA SIGUE SIN NOTA EXPLÍCITA ──

Evidencia: 1-...-propuesta-impresion.pdf p2/7 y todas las páginas con
montos, en ambos perfiles. El bloque "Supuestos" ya se renderiza en PDF
—era la causa raíz de E-13— pero ningún texto vincula el símbolo † con
esa lista.

Qué hacer: vincular explícitamente la marca con su destino en la misma
página.

Criterio: toda página que contenga † contiene también su nota o una
referencia inequívoca a ella.

── OBSERVACIÓN SOBRE EL CRECIMIENTO DE PÁGINAS (no es una corrección) ──

La ronda 2.1 hizo que 1-...-proyeccion_90d-impresion pasara de 7 a 8
páginas: el costo de que la tarjeta POTENCIAL deje de partirse. Es un
intercambio correcto y no hay que revertirlo. Pero al resolver D-1 y D-5,
controlá que el total de páginas por documento no crezca de forma
desproporcionada. Reportá el conteo de páginas antes y después por
documento.

═══════════════════════════════════════════════════════════════════
PARTE A — BARRIDO DE COBERTURA
═══════════════════════════════════════════════════════════════════

Se ejecuta DESPUÉS de D-5 y D-1 a D-4, con el lenguaje visual ya
corregido (criterio 6 de D-5).

Generá con v2 corregido:
  - los cuatro escenarios demo que faltan (2, 3, 5 y 6),
  - los tres documentos de cada uno (diagnóstico, proyección, propuesta),
  - los dos perfiles (pantalla 16:9 y A4).

Además, y por separado: un caso MAYORISTA y un caso MIXTO. Si no existen
fixtures canónicos para esos dos, armá contextos de prueba dentro del
script del prototipo, rotulados explícitamente como casos de prueba del
prototipo y nunca como escenarios demostrativos, sin tocar
src/lib/fixtures-escenarios-demo.ts. Documentá qué datos usaste y de
dónde salieron.

Rasterizá TODAS las páginas resultantes e inspeccionalas una por una.
Para cada página verificá:
  - texto cortado, solapado o fuera de página;
  - encabezado con cuerpo vacío;
  - legibilidad de tablas y continuidad entre páginas;
  - identidad repetida cuando un bloque continúa;
  - densidad y ocupación;
  - márgenes, sangrado y tipografía;
  - contraste;
  - estados comprensibles sin color;
  - que la decoración de D-5 no compita con cifras, alertas ni tablas;
  - placeholders, undefined, NaN, null, enums crudos o texto técnico sin
    normalizar.

Entregá un INFORME DE COBERTURA con una fila por documento: escenario,
documento, perfil, páginas y qué falló.

Si un escenario rompe el layout, describí exactamente cómo y corregilo
solo si la causa está dentro del alcance de este bloque. Si la causa es
un hallazgo fuera de alcance, documentalo y no lo toques.

Si el barrido no revela nada roto, decilo con todas las letras: un
barrido limpio es un resultado válido.

Atención particular a cuatro cosas que solo se pueden probar acá:
  - el componente de comparación entre canales en un caso mayorista,
    donde el concepto de "canal" es distinto;
  - la deduplicación del MER (C6) cuando no hay marketplace;
  - la tabla mensual apilada con montos de otra magnitud;
  - los recursos visuales de D-5 sobre páginas más densas que las de s1
    y s4.

═══════════════════════════════════════════════════════════════════
PRUEBAS NUEVAS
═══════════════════════════════════════════════════════════════════

Sobre v2 exclusivamente. Ninguna prueba existente se modifica, elimina
ni relaja. Las pruebas verifican el contrato, no describen el resultado
obtenido. Si una prueba falla, se corrige el prototipo, nunca el umbral.

  Q1 · ocupación mínima por página, con la lista de excepciones como
       dato explícito y cerrado, no como umbral flexible;
  Q2 · ninguna tarjeta que quepa entera repite su propio nombre;
  Q3 · la portada no contiene bloques de color sin contenido;
  Q4 · toda página con † resuelve la marca en la misma página;
  Q5 · el barrido de cobertura (escenarios 2, 3, 5, 6 más mayorista y
       mixto) pasa las mismas comprobaciones estructurales que ya tenían
       s1 y s4: sin desborde, sin colisión, sin sangre completa en A4,
       contraste calculado, sin cuerpo vacío, paridad PDF↔web;
  Q6 · D-5 implementado como tokens y componentes compartidos: ninguna
       página define recursos decorativos propios fuera del sistema de
       tokens; la opacidad de textura/geometría de fondo no supera el
       límite fijado en el contrato; ningún recurso decorativo se
       superpone a cifras, alertas ni filas de tabla; A4 sigue por
       debajo del 25% de tinta plena con la decoración aplicada.

Se conservan sin modificar todas las pruebas de v2 del Bloque Visual 2 y
de la ronda 2.1 (P1 a P10).

═══════════════════════════════════════════════════════════════════
CRITERIOS DE ACEPTACIÓN
═══════════════════════════════════════════════════════════════════

 1. Las 665 + 1 todo pasan sin haber sido modificadas.
 2. Typecheck limpio y build exitoso.
 3. v1, dominio, src/lib/ y fixtures canónicos no aparecen en el diff.
 4. Q1 a Q6 pasan, y P1 a P10 siguen pasando sin relajarse.
 5. Informe de cobertura completo, con una fila por documento generado.
 6. D-1 a D-4 resueltos, o documentados con motivo si no se pueden
    resolver sin inventar contenido.
 7. Ninguna página, en ningún escenario, con texto solapado, cortado o
    fuera de página.
 8. Ninguna página A4 supera el 25% de tinta plena, en ningún escenario,
    con la decoración de D-5 ya aplicada.
 9. Paridad PDF↔web en todos los escenarios.
10. Ningún hallazgo fuera de alcance modificado.
11. Ninguna decisión pendiente resuelta de oficio.
12. Nada inventado. Ningún umbral relajado.
13. Ninguna regresión visual respecto de la ronda 2.1 en s1 y s4:
    comparación antes/después obligatoria sobre esos dos escenarios.
14. D-5, criterio 1: las salidas se reconocen inequívocamente como parte
    del mismo sistema visual que la referencia.
15. D-5, criterio 2: ninguna portada contiene bloques decorativos vacíos
    o que parezcan imágenes sin cargar.
16. D-5, criterio 3: las páginas de contenido no se sienten como tablas
    automáticas, sin pérdida de legibilidad.
17. D-5, criterio 4: pantalla conserva mayor riqueza visual; A4 mantiene
    una adaptación imprimible.
18. D-5, criterio 5: la comparación antes/después incluye páginas
    representativas de portada, contenido, escenarios y cierre.
19. D-5, criterio 6: los escenarios nuevos se generaron directamente con
    el lenguaje visual corregido, no con el anterior.
20. D-5 implementado como tokens y componentes compartidos, sin
    excepciones manuales por página.
21. Ninguna decoración compite con cifras, alertas o tablas.
22. El conteo de páginas por documento no creció de forma
    desproporcionada; se reporta antes y después.

Si algo no se cumple, no lo fuerces: reportalo como pendiente con su
motivo.

Los criterios 14 a 17 son cualitativos y no se pueden cerrar con una
prueba automatizada. Para esos cuatro, el veredicto lo emite la revisión
humana sobre los montajes comparativos; tu obligación es entregar la
evidencia que permita emitirlo, no autoadjudicarte el resultado.

═══════════════════════════════════════════════════════════════════
AUDITORÍA INTERNA
═══════════════════════════════════════════════════════════════════

Agente auditor de SOLO LECTURA, MÁXIMO DOS RONDAS de corrección.

Verifica y solo reporta, nunca implementa:
  - aislamiento del diff;
  - que cada uno de D-1 a D-4 tenga corrección, prueba y página de
    evidencia;
  - que D-5 esté implementado como tokens y componentes compartidos, y
    que exista la sección nueva del contrato que los fija;
  - que ninguna página defina recursos decorativos propios por fuera del
    sistema de tokens;
  - que ninguna decoración se superponga a cifras, alertas o filas de
    tabla;
  - que A4 siga por debajo del 25% de tinta plena con la decoración
    aplicada;
  - que la referencia se haya usado como dirección de arte y NO se haya
    copiado contenido, copy ni cifras de `Dropnkicks propuesta.pdf`;
  - que los escenarios nuevos se hayan generado con el lenguaje visual
    corregido y no con el anterior;
  - que el informe de cobertura esté completo y no omita documentos;
  - que ningún hallazgo fuera de alcance se haya tocado, con revisión
    explícita de E-05, E-07, E-08, E-09, E-16, E-18, C-02, C-03, C-04,
    C-08, R-07 y R-09;
  - que ninguna decisión pendiente se haya resuelto de oficio;
  - que ningún umbral del contrato se haya relajado;
  - que la terminología de D7 se respete en código, documentos y salidas;
  - que los 22 criterios estén evaluados uno por uno con veredicto
    explícito, marcando los criterios 14 a 17 como "pendiente de
    revisión humana" en vez de autoadjudicárselos;
  - que no queden placeholders, undefined, NaN, null ni texto sin
    normalizar en ninguna salida.

Veredicto: APROBADO / APROBADO CON CORRECCIONES / BLOQUEADO.

Si tras dos rondas queda algo abierto, cerrá con lo que haya y
reportalo como pendiente.

═══════════════════════════════════════════════════════════════════
COMMIT Y PUSH
═══════════════════════════════════════════════════════════════════

Commit y push ÚNICAMENTE a feat/noche-continuacion. Nunca a main, nunca
un merge, un rebase sobre main ni un tag. Ningún commit antes de que la
auditoría interna esté aprobada. Mensajes descriptivos en español,
referenciando D-1 a D-5 y los escenarios cubiertos. Después del push,
verificá que `git log origin/feat/noche-continuacion -1` coincide con el
HEAD local y reportalo.

═══════════════════════════════════════════════════════════════════
FORMATO DEL HANDOFF
═══════════════════════════════════════════════════════════════════

Diecisiete secciones numeradas, en este orden, sin omitir ninguna. Si una
no aplica, escribí "no aplica" y por qué.

 1. Rama y HEAD completo (hash entero).
 2. Salida de `git status --short`.
 3. Salida de `git diff --stat` contra 89b2b7b.
 4. Aislamiento: archivos tocados y afirmación explícita de que v1, el
    dominio, src/lib/, los fixtures canónicos y las pruebas existentes no
    fueron modificados.
 5. Resultado del paso 0, incluyendo la confirmación de acceso a las dos
    referencias de dirección de arte.
 6. D-5: qué tokens y componentes compartidos creaste, dónde viven, y la
    ruta de la sección nueva del contrato de composición que los fija.
 7. D-5: cómo se diferencian visualmente diagnóstico, proyección y
    propuesta sin romper el sistema, y qué recurso concreto lo produce.
 8. D-5: declaración explícita de que no se copió contenido, copy ni
    cifras de la referencia, y de qué se tomó exactamente como dirección
    de arte.
 9. Estado de D-1 a D-4, uno por uno, con página de evidencia y prueba.
10. INFORME DE COBERTURA: una fila por documento generado (escenario,
    documento, perfil, páginas, qué falló).
11. Casos mayorista y mixto: qué datos usaste, de dónde salieron, y qué
    reveló cada uno.
12. Lista de excepciones de ocupación actualizada y cerrada, página por
    página, con motivo puntual.
13. Conteo de pruebas por separado: 665 + 1 intactas, P1-P10 intactas, y
    las nuevas Q1-Q6. Typecheck y build.
14. Inspección página por página: qué se revisó y qué se encontró.
15. Paridad PDF↔web en todos los escenarios.
16. Comparación antes/después sobre s1 y s4, con páginas representativas
    de portada, contenido, escenarios y cierre (criterio 5 de D-5), y
    conteo de páginas por documento antes y después.
17. Los 22 criterios de aceptación, uno por uno, con veredicto — con los
    criterios 14 a 17 marcados como "pendiente de revisión humana".

Adjuntá o listá las rutas de todos los PDFs, rásters, renders web y
montajes comparativos.

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
No amplíes el alcance ni tomes decisiones de producto que no estén en
este documento.
No conviertas D-5 en un rediseño general: es alineación de dirección de
arte sobre la estructura ya aprobada.

Si algo de este prompt entra en conflicto con el código, con los
documentos de docs/visual/ o con una instrucción previa, NO elijas por tu
cuenta: detenete y reportá el conflicto.

FIN DEL PROMPT — BLOQUE VISUAL 2.2
