<!-- Ejecutado desde 490d3e8, cerrado en 89b2b7b. Texto original sin modificar. -->

BLOQUE VISUAL 2 — RONDA DE CORRECCIONES (2.1)

═══════════════════════════════════════════════════════════════════
CONTEXTO
═══════════════════════════════════════════════════════════════════

Repositorio: maticosenza/velocentum-diagnostico-web
Rama: feat/noche-continuacion — trabajar únicamente acá.
HEAD esperado: 490d3e8 (commit del handoff del Bloque Visual 2).
Commit del prototipo v2: f8db5608a538c6a3db2194c9fd30948d97d5b25e
Línea base esperada: 595 pruebas aprobadas + 1 todo (596 total), typecheck
limpio, build exitoso, árbol de trabajo limpio.

El Bloque Visual 2 entregó un prototipo v2 en paralelo (velocentum-v2 +
capa semántica compartida), con 12 PDFs, 73 rásters y 6 renders web.

La auditoría visual humana de esa entrega dio: **APROBADO CON CORRECCIONES**.

Resultado de esa auditoría sobre los 20 criterios de aceptación:
7 APROBADOS, 8 APROBADOS CON RESERVA, 5 NO APROBADOS.

Criterios NO APROBADOS, todos con evidencia visual directa:
  - criterio 7  · sin texto solapado, cortado ni fuera de página
  - criterio 9  · tablas legibles y encabezado repetido al continuar
  - criterio 10 · ninguna página A4 supera el umbral de tinta plena
  - criterio 11 · contraste suficiente
  - criterio 15 · nombres largos y montos grandes no rompen la composición

Estado de los 24 hallazgos en alcance tras la auditoría:
11 resueltos, 10 parciales, 2 no resueltos, 1 con reserva.

Resueltos y verificados (NO tocar, no hay que rehacerlos):
  E-02, E-03, E-04, E-10, E-11, E-12, E-14, C-07, R-02, R-03, R-11.

Parciales o no resueltos que esta ronda debe cerrar:
  E-01, E-06, C-01 (residuales a y b), R-01, R-06, R-10 (defecto
  introducido), R-12 (layout), más las tarjetas de servicio con cuerpo
  vacío y la portada sin cliente ni versión.

Fuera de alcance de esta ronda, siguen siendo Bloque 3 (NO tocar):
  E-05, E-07, E-08, E-09, E-16, E-18, C-02, C-03, C-04, C-08, R-07, R-09.

Esta ronda corrige exclusivamente lo que falló. No amplía alcance, no
rediseña lo aprobado y no cierra hallazgos de contrato ni de dominio.

═══════════════════════════════════════════════════════════════════
PASO 0 — VERIFICACIÓN INICIAL
═══════════════════════════════════════════════════════════════════

Antes de escribir una sola línea, ejecutá y reportá:

0.1 Rama actual y HEAD completo. Debe ser feat/noche-continuacion en
    490d3e8. Si difiere, DETENETE y reportá la diferencia exacta.
    No reconcilies por tu cuenta.

0.2 `git status --short`. El árbol debe estar limpio.

0.3 Suite completa, typecheck y build. Debe dar 595 aprobadas + 1 todo,
    typecheck limpio, build exitoso. Si difiere, DETENETE y reportá.

0.4 Confirmá que existe el espacio versionado v2 del Bloque Visual 2
    (plantillas y renderers) y que velocentum-v1 sigue intacto. Si el
    prototipo v2 no está donde el handoff dice que está, DETENETE y
    reportá.

0.5 Confirmá que existen docs/visual/auditoria-visual-2026-08-23.md y
    docs/visual/contrato-composicion-v2.md. El contrato de composición es
    la referencia normativa de esta ronda: donde este prompt fija un
    umbral, ese umbral se incorpora al contrato.

═══════════════════════════════════════════════════════════════════
PROHIBICIONES ABSOLUTAS (idénticas al Bloque Visual 2, siguen vigentes)
═══════════════════════════════════════════════════════════════════

- No modificar `src/documents/domain/types.ts` ni ningún tipo del dominio.
- No modificar cálculos, fórmulas, motor de escenarios ni reglas
  comerciales. `src/lib/` es de SOLO LECTURA, sin excepción.
- No modificar `src/lib/fixtures-escenarios-demo.ts` ni ningún fixture
  canónico.
- No modificar `velocentum-v1` ni los renderers v1. v1 queda intacto y
  sigue siendo lo que se genera en producción.
- No modificar ninguna prueba existente, ninguna expectativa numérica y
  ningún snapshot. Las 595 + 1 todo deben seguir pasando SIN TOCARLAS. Si
  una se rompe, es señal de que tocaste v1: revertí y reportá.
- No promover v2 sobre v1.
- No conectar el prototipo a la interfaz de usuario ni al botón de
  descarga.
- No propagar a los otros cuatro escenarios. El alcance sigue siendo
  s1-marketplace-fuerte y s4-roas-bueno-margen-negativo.
- No resolver por tu cuenta las decisiones pendientes 1, 2, 3, 4 ni 6.
- No tocar base de datos, migraciones, secretos ni producción.
- No integrar a `main`. No publicar. No desplegar.
- No avanzar al Bloque Visual 3 ni a la fase 14.
- No inventar cifras, servicios, precios ni resultados. Si una página no
  puede cumplir un umbral sin inventar contenido, documentá el caso y
  dejalo como está.

Terminología obligatoria (D7): multicanal = tienda propia + Mercado Libre
u otros canales de venta. Mixto = minorista con módulo mayorista activado.
Nunca uses "mixto" como sinónimo de "multicanal".

═══════════════════════════════════════════════════════════════════
CORRECCIONES OBLIGATORIAS
═══════════════════════════════════════════════════════════════════

── C1 · DESBORDE DE LA TABLA MENSUAL EN A4 ──
Criterios afectados: 7 y 9. Hallazgo: E-01 (parcial), R-12 (parcial).

Evidencia:
  1-marketplace-fuerte-tienda-floja__proyeccion_90d-impresion.pdf,
  página 6/7, tarjeta del escenario POTENCIAL.
  La columna AHORRO PUBLICITARIO sale fuera del borde derecho de la
  tarjeta. El encabezado y los tres valores ($ 134.960 †, $ 158.777 †,
  $ 158.777 †) pisan la línea del borde y las dagas quedan fuera de la
  tarjeta. Las líneas separadoras de fila terminan antes de esa columna,
  lo que confirma que el contenido está fuera del contenedor.
  Verificado por recorte a 400 DPI.

Causa estructural: una tabla de cinco columnas (MES, CONTRIBUCIÓN
INCREMENTAL, FACTURACIÓN PROYECTADA, FACTURACIÓN INCREMENTAL, AHORRO
PUBLICITARIO) no entra en el ancho de tarjeta del perfil impresion.

Qué es aceptable:
  - reducir el número de columnas visibles en el perfil impresion,
    llevando una o dos magnitudes a una segunda fila o a un bloque aparte;
  - apilar la tabla en formato de dos columnas (etiqueta / valor) por mes;
  - ajustar los anchos relativos y el padding de la tarjeta.

Qué NO es aceptable:
  - achicar la tipografía por debajo del mínimo del contrato de
    composición;
  - eliminar magnitudes: D2 exige que mes a mes, ritmo mensual al día 90 y
    acumulado de 90 días sigan siendo tres magnitudes distintas y
    rotuladas por separado;
  - recortar o truncar números.

Criterio de aceptación: ningún glifo fuera de su contenedor en ninguna de
las 73 páginas, en ninguno de los dos perfiles, verificado a 300 DPI o más.

── C2 · COLISIÓN DE COLUMNAS EN LAS TARJETAS DE ESCENARIO EN A4 ──
Criterios afectados: 7 y 15. Hallazgo: E-01 (parcial), E-06 (parcial).

Evidencia:
  4-roas-bueno-margen-negativo__proyeccion_90d-impresion.pdf,
  página 5/6.
  Las tres tarjetas de escenario (CONSERVADOR, BASE, POTENCIAL) se
  disponen lado a lado en A4 vertical. Dentro de cada una, las tres
  columnas de magnitud no tienen canal de separación. En la capa de texto
  se lee "ContribuciónFacturación", "oportunidadoportunidadahorro",
  "magnitud magnitud calculable". Los nueve bloques de retención quedan
  ilegibles.

Dato relevante para el diagnóstico: en el perfil pantalla el mismo
contenido NO colisiona. Es un problema de ancho exclusivo del perfil
impresion, no un problema del componente.

Qué es aceptable:
  - una tarjeta de escenario por fila en el perfil impresion, en lugar de
    tres lado a lado;
  - las tres magnitudes apiladas verticalmente dentro de cada tarjeta en
    vez de en tres columnas;
  - cualquier combinación de las anteriores.

Qué NO es aceptable:
  - truncar el texto de estado: el copy de D4 se muestra completo;
  - reducir la tipografía por debajo del mínimo del contrato.

Criterio de aceptación: cero solapamientos de texto en las 73 páginas,
verificado a 300 DPI o más.

── C3 · PÁGINAS A SANGRE COMPLETA EN A4 ──
Criterio afectado: 10. Hallazgo: C-01 residual (a), R-08 (parcial).

Evidencia, medida sobre los 36 rásters A4 del entregable (porcentaje de
píxeles en tinta oscura):
  1-...-propuesta-impresion.pdf   → 4 de 7 páginas al ~99% (1, 2, 4, 7)
  4-...-propuesta-impresion.pdf   → 4 de 5 páginas al ~99% (1, 2, 3, 5)
  1-...-diagnostico-impresion.pdf → 3 de 5 páginas al ~99% (1, 3, 5)
  1-...-proyeccion_90d-impresion.pdf → 4 de 7 páginas al ~98% (1, 2, 4, 7)
  4-...-proyeccion_90d-impresion.pdf → 3 de 6 páginas al ~98% (1, 2, 4)
Afecta a portadas, transiciones, páginas de cierre y páginas hero.

Qué hay que hacer: aplicar la regla ya escrita en el contrato de
composición. En el perfil impresion, portadas, transiciones, cierres y
páginas hero NO van a sangre completa. Fondo claro, con el acento
contenido dentro de un bloque delimitado.

El perfil pantalla NO cambia: ahí la sangre completa se conserva tal como
está aprobada.

Criterio de aceptación: ninguna página A4 supera el 25% de su superficie
en tinta plena, medido programáticamente sobre el ráster.

── C4 · CONTRASTE INSUFICIENTE ──
Criterio afectado: 11.

Evidencia, dos casos:

 (a) 1-marketplace-fuerte-tienda-floja__propuesta-impresion.pdf,
     página 2/7. La frase que contiene el rango — "Con los datos
     disponibles y bajo estos supuestos, existe un rango de contribución
     incremental potencial de $ 5.761.835 a $ 9.026.875 durante los
     próximos 90 días" — se renderiza en gris apagado sobre fondo navy y
     es el texto menos legible de la página. Es precisamente el texto que
     califica la cifra principal del documento.

 (b) 4-roas-bueno-margen-negativo__proyeccion_90d-impresion.pdf,
     página 5/6. Los nueve bloques de retención se renderizan en ámbar
     sobre blanco. El ámbar es el token de Advertencia del sistema y no
     debe usarse como color de párrafo completo: sirve como acento de
     badge o de borde, no como color de cuerpo de texto.

Qué hay que hacer: corregir ambos midiendo el contraste por cálculo, no a
ojo. Si C3 cambia el fondo de la página hero a claro, (a) se resuelve por
consecuencia: verificalo igual, no lo des por hecho.

Criterio de aceptación: contraste mínimo 4,5:1 para todo texto de cuerpo y
3:1 para texto grande, en ambos perfiles, verificado por una prueba
automatizada que calcule el ratio, no por inspección visual.

── C5 · IDENTIDAD DE LA TARJETA PARTIDA ENTRE PÁGINAS ──
Criterio afectado: 9. Hallazgo: C-01 residual (b), reserva sobre
repetición de encabezados.

Evidencia:
  1-marketplace-fuerte-tienda-floja__proyeccion_90d-impresion.pdf,
  páginas 5 → 6.
  La tarjeta del escenario BASE se parte: el badge "BASE", los tres KPI de
  90 días y la tabla mensual quedan en la página 5; las fugas por
  magnitud, el ahorro publicitario y los supuestos continúan en la página
  6. La página 6 repite correctamente el encabezado de sección
  ("ESCENARIOS / Qué puede ocurrir en 90 días, mes a mes") pero NO repite
  "BASE" en ningún lado. Un lector que abre el documento por la página 6
  no puede saber a qué escenario pertenecen esos números.

La reserva de C-01 sobre repetición de encabezados se cumplió para el
header de sección y NO se cumplió para la identidad del contenido partido.

Qué hay que hacer: cuando una tarjeta de escenario se parta entre páginas,
la continuación debe repetir el nombre del escenario y marcarse
explícitamente como continuación. Lo mismo aplica a cualquier tabla que se
parta: la continuación repite su encabezado de columnas.

Criterio de aceptación: toda página de continuación identifica
inequívocamente el escenario o la tabla a la que pertenece.

── C6 · DUPLICACIÓN DEL MER (defecto introducido por R-10) ──
Hallazgo: R-10 (resuelto con defecto).

Evidencia:
  1-marketplace-fuerte-tienda-floja__diagnostico-pantalla.pdf,
  páginas 2 y 3.
  1-marketplace-fuerte-tienda-floja__proyeccion_90d-impresion.pdf,
  página 3.
  El componente nuevo "Comparación entre canales" muestra MER tienda
  propia 10,0× y MER marketplace 35,0× con barras proporcionales. La
  grilla de métricas de la página siguiente vuelve a mostrar exactamente
  los mismos dos valores, bajo el mismo título de sección repetido. Un
  lector ve el mismo 35,0× dos veces en dos páginas consecutivas.

Qué hay que hacer: cuando el componente de comparación entre canales esté
presente, esos dos campos no se repiten en la grilla de métricas.

Nota: el componente de comparación en sí está bien resuelto y es una
mejora real. No lo quites. Lo que sobra es la repetición en la grilla.

Criterio de aceptación: ningún valor aparece dos veces dentro de la misma
sección de un documento.

── C7 · OCUPACIÓN POR DEBAJO DEL UMBRAL ──
Hallazgo: R-01 (no resuelto).

Páginas medidas por debajo del 50% de ocupación:
  s1 diagnóstico pantalla 5/6   → ~45%
  s1 propuesta A4 2/7           → ~35%
  s1 propuesta A4 5/7           → ~5%
  s4 propuesta A4 4/5           → ~8%
  s1 proyección A4 3/7          → ~6%
  s4 proyección A4 3/6          → ~4%

Qué hay que hacer: aplicar la regla ya escrita en el contrato de
composición — ≥70% del alto útil en el perfil pantalla, ≥65% en A4. Donde
una sección no llene, fusionala con la siguiente o expandí el componente.

Qué NO hay que hacer: agregar contenido inventado para llenar. Si una
página no puede alcanzar el umbral sin inventar, documentá el caso con su
motivo y dejala como está. Una excepción documentada es una respuesta
correcta; una página rellenada con contenido inventado no lo es.

Criterio de aceptación: ninguna página de contenido por debajo del umbral,
salvo las documentadas explícitamente con su motivo.

── C8 · TARJETAS DE SERVICIO CON CUERPO VACÍO ──

Evidencia:
  1-marketplace-fuerte-tienda-floja__propuesta-impresion.pdf,
  página 5/7, sección ALCANCE.
  Tres tarjetas con número y título y el cuerpo reservado en blanco. La
  página queda con ~5% de ocupación.

Qué hay que hacer: el cuerpo vacío no debe reservar espacio. O la tarjeta
trae contenido, o se compacta a su altura real.

Qué NO hay que hacer: NO resuelvas E-09. El ítem concatenado "Desarrollo y
optimización web y Meta Ads" que aparece como servicio 03 sigue FUERA DE
ALCANCE: es un problema de contrato (`servicio` como texto libre) y
corresponde al Bloque 3. Dejalo tal como está.

Criterio de aceptación: ninguna tarjeta renderiza con espacio reservado
vacío en ninguno de los dos perfiles.

── C9 · WORDMARK CON DOS TRATAMIENTOS ──
Hallazgo: R-06 (no resuelto).

Evidencia: la portada usa "velocentum" en minúscula; el pie de las páginas
internas usa "Velocentum" capitalizado. En el Bloque Visual 2 el pie pasó
de mayúsculas a capitalizado, pero siguen siendo dos tratamientos
distintos del mismo wordmark.

Qué hay que hacer: un solo tratamiento del wordmark en los dos renderers y
en los dos perfiles.

Criterio de aceptación: una sola forma del wordmark en las 73 páginas y en
los 6 renders web.

── C10 · PORTADA SIN CLIENTE NI VERSIÓN ──
Hallazgo: R-05 (parcial).

El degradado suave que reemplazó las tres bandas duras está bien resuelto
y no hay que tocarlo. Lo que falta: la portada sigue sin nombre de cliente
y sin versión del documento. R-05 y el componente "Portada con cliente,
tipo de documento, fecha y versión" de la especificación piden los cuatro
campos; hoy hay tipo de documento, etiqueta de escenario y fecha.

Qué hay que hacer: incorporar los cuatro campos a la portada en ambos
perfiles, tomando el nombre de cliente de `context.cliente.nombre` y la
versión del identificador de plantilla ya existente. No inventes ningún
valor: si un campo no está disponible en el contexto, documentá el caso y
no lo muestres.

Criterio de aceptación adicional: verificá el comportamiento con un nombre
de cliente largo (usá un contexto de prueba propio del prototipo, sin
tocar los fixtures canónicos) y confirmá que no rompe la composición.

═══════════════════════════════════════════════════════════════════
ACLARACIÓN SOBRE UN DESVÍO DE ALCANCE DEL BLOQUE ANTERIOR
═══════════════════════════════════════════════════════════════════

En el Bloque Visual 2 se implementó la página "Selección comercial
pendiente" (hallazgo C-04, decisión D1), que estaba declarada
explícitamente FUERA DE ALCANCE.

NO la revertas: el aviso está bien redactado y es útil.

Pero sí tenés que reportar, en el handoff y sin implementar nada al
respecto: **¿el botón de descarga bloquea o no la exportación de un PDF de
propuesta cuando no hay selección comercial confirmada?**

Si NO la bloquea, decilo con todas las letras y NO lo implementes en esta
ronda: la restricción de exportación es Bloque 3. El riesgo que hay que
dejar asentado es que hoy el documento dice "pendiente" y aun así se
descarga como propuesta para cliente, lo que da la falsa impresión de que
el control existe.

═══════════════════════════════════════════════════════════════════
PRUEBAS NUEVAS REQUERIDAS
═══════════════════════════════════════════════════════════════════

Agregá o extendé pruebas que apunten EXCLUSIVAMENTE a v2. Ninguna prueba
existente se modifica, se elimina ni se relaja.

Las pruebas verifican el contrato de composición, no describen el
resultado obtenido. Si una prueba falla, se corrige el prototipo, nunca el
umbral.

Cobertura mínima:

  P1 · cero glifos fuera de su contenedor (C1);
  P2 · cero solapamientos de texto (C2);
  P3 · superficie de tinta plena por página A4 por debajo del 25% (C3);
  P4 · contraste calculado ≥ 4,5:1 en texto de cuerpo y ≥ 3:1 en texto
       grande, en ambos perfiles (C4);
  P5 · toda página de continuación identifica su escenario o repite el
       encabezado de su tabla (C5);
  P6 · ningún valor duplicado dentro de una misma sección (C6);
  P7 · ocupación mínima por página según el contrato, con lista explícita
       de excepciones documentadas (C7);
  P8 · ninguna tarjeta con espacio reservado vacío (C8);
  P9 · una sola forma del wordmark en todas las salidas (C9);
  P10 · portada con los cuatro campos y sin ruptura de composición con
        nombre de cliente largo (C10).

Se conservan además, sin modificar, todas las pruebas de v2 creadas en el
Bloque Visual 2 (paridad PDF/web, ausencia de "Sin datos", ausencia de
metadatos concatenados con " - ", magnitud y período en cada palanca,
acumulado y ritmo nunca bajo la misma etiqueta, ninguna sección con cuerpo
vacío, mínimo tipográfico, severidad distinguible sin color, dagas con
nota resuelta, orden por severidad, hallazgos de propuesta distintos de
los del diagnóstico).

═══════════════════════════════════════════════════════════════════
CRITERIOS DE ACEPTACIÓN DE ESTA RONDA
═══════════════════════════════════════════════════════════════════

La ronda 2.1 solo puede darse por terminada si TODOS estos se cumplen.

FUNCIONALES
  1. Las 595 pruebas originales + 1 todo pasan sin haber sido modificadas.
  2. Typecheck limpio.
  3. Build exitoso.
  4. v1 produce la misma salida que antes: ningún archivo de v1 en el diff.
  5. Ningún archivo de `src/lib/`, del dominio, de fixtures canónicos, de
     migraciones, de base ni de producción aparece en el diff.
  6. Las pruebas P1 a P10 pasan, y las pruebas de v2 del Bloque Visual 2
     siguen pasando sin haber sido relajadas.

VISUALES, sobre los 12 PDFs regenerados, página por página
  7. Sin texto solapado, cortado ni fuera de página, en ningún perfil.
  8. Sin páginas con encabezado y cuerpo vacío.
  9. Sin tablas ilegibles; toda tabla o tarjeta que continúa repite su
     encabezado y su identidad.
 10. Ninguna página A4 supera el 25% de superficie en tinta plena.
 11. Contraste suficiente, calculado, en pantalla, impresión y
     videollamada.
 12. Alineaciones, márgenes y padding consistentes dentro de cada perfil.
 13. Los estados se entienden también sin color.
 14. `retenido`, `no_aplica` y `evidencia_faltante` tienen presentación
     propia y ninguno se muestra como cero.
 15. Nombres largos de cliente y montos grandes no rompen la composición,
     verificado con un contexto de prueba propio.
 16. Los tres documentos se reconocen como parte del mismo sistema y se
     distinguen entre sí.
 17. Ocupación por encima del umbral, salvo excepciones documentadas.
 18. Un solo tratamiento del wordmark.
 19. Portada con cliente, tipo de documento, fecha y versión.

DE PARIDAD
 20. Para cada `ValorPublicable` de los seis documentos, el texto de
     estado y el número formateado son idénticos en PDF y en web.

DE DISCIPLINA
 21. Ningún hallazgo fuera de alcance fue modificado. En particular: E-05,
     E-07, E-08, E-09, E-16, E-18, C-02, C-03, C-04, C-08, R-07 y R-09
     siguen como estaban.
 22. Ninguna decisión pendiente (1, 2, 3, 4, 6) fue resuelta de oficio.
 23. Ninguna cifra, servicio, precio ni resultado fue inventado.
 24. Ningún umbral del contrato de composición fue relajado para que una
     prueba pasara.

Si alguno no se cumple, no lo fuerces: reportalo como pendiente en el
handoff, con su motivo.

═══════════════════════════════════════════════════════════════════
INSPECCIÓN DE LOS 12 PDFs CORREGIDOS
═══════════════════════════════════════════════════════════════════

Regenerá los 12 PDFs (2 escenarios × 3 documentos × 2 perfiles) y los 6
renders web con el v2 corregido.

Rasterizá TODAS las páginas resultantes e inspeccionalas vos mismo antes
de mostrarlas. La inspección debe ser página por página, no por muestreo.

Para cada página, verificá y dejá constancia de:
  - texto cortado, solapado o fuera de página;
  - encabezado con cuerpo vacío;
  - legibilidad de tablas y continuidad entre páginas;
  - repetición del encabezado y de la identidad cuando algo se parte;
  - densidad y aprovechamiento del formato;
  - márgenes, sangrado, tipografía y ocupación;
  - contraste;
  - estados comprensibles sin color;
  - placeholders, `undefined`, `NaN`, `null`, enums crudos o texto técnico
    sin normalizar.

Para C1, C2 y C4, la verificación debe hacerse a 300 DPI o más sobre el
recorte específico, no sobre la página completa reducida.

Producí montajes comparativos v2-antes contra v2-después, únicamente de
las páginas afectadas por C1 a C10. No hace falta comparar el documento
completo: comparar lo que no cambió sólo agrega ruido.

Listá las rutas de: los 12 PDFs corregidos, los rásters de todas sus
páginas, los 6 renders web y los montajes comparativos.

═══════════════════════════════════════════════════════════════════
AUDITORÍA INTERNA
═══════════════════════════════════════════════════════════════════

Antes del commit final, corré un agente auditor interno de SOLO LECTURA
sobre el resultado, con un MÁXIMO DE DOS RONDAS de corrección.

El auditor verifica y sólo reporta — nunca implementa:

  - aislamiento del diff: que v1, el dominio, `src/lib/`, los fixtures
    canónicos, las pruebas existentes y los snapshots no aparezcan
    modificados;
  - que cada una de C1 a C10 tenga una corrección concreta, una prueba que
    la respalde y una página de evidencia que la demuestre;
  - que ningún hallazgo fuera de alcance haya sido tocado, con revisión
    explícita de E-05, E-07, E-08, E-09, E-16, E-18, C-02, C-03, C-04,
    C-08, R-07 y R-09;
  - que ninguna decisión pendiente haya sido resuelta de oficio;
  - que ningún umbral del contrato de composición haya sido relajado;
  - que el copy de D4 siga transcripto literalmente;
  - que la terminología de D7 se respete en código, documentos y salidas;
  - que los 24 criterios de aceptación de esta ronda estén evaluados uno
    por uno, con veredicto explícito por criterio;
  - que no queden placeholders, `undefined`, `NaN`, `null` ni texto sin
    normalizar en ninguna de las salidas.

Veredicto del auditor: APROBADO / APROBADO CON CORRECCIONES / BLOQUEADO.

Si al cabo de dos rondas queda algo sin resolver, no lo fuerces: cerrá con
lo que haya y reportalo como pendiente en el handoff.

═══════════════════════════════════════════════════════════════════
COMMIT Y PUSH
═══════════════════════════════════════════════════════════════════

- Commit y push ÚNICAMENTE a `feat/noche-continuacion`.
- Nunca a `main`. Nunca un merge, un rebase sobre main ni un tag.
- Ningún commit se hace antes de que la auditoría interna esté aprobada.
- El trabajo puede ir en uno o varios commits, a tu criterio, con mensajes
  descriptivos en español que referencien las correcciones C1 a C10 y los
  IDs de hallazgo que atienden.
- Después del push, verificá que
  `git log origin/feat/noche-continuacion -1` coincide con el HEAD local y
  reportalo.

═══════════════════════════════════════════════════════════════════
FORMATO COMPLETO DEL HANDOFF
═══════════════════════════════════════════════════════════════════

Devolvé el handoff con estas quince secciones, numeradas, en este orden y
sin omitir ninguna. Si una sección no aplica, escribí "no aplica" y por
qué; no la borres.

 1. Rama y HEAD completo (hash entero).
 2. Salida de `git status --short`.
 3. Salida de `git diff --stat` contra 490d3e8.
 4. Confirmación de aislamiento: lista de archivos tocados, y afirmación
    explícita de que v1, el dominio, `src/lib/`, los fixtures canónicos,
    las pruebas existentes y los snapshots no fueron modificados.
 5. Resultado del PASO 0 completo (0.1 a 0.5).
 6. Estado de C1 a C10, UNA POR UNA: resuelta / parcialmente resuelta / no
    resuelta, con la página de evidencia que lo demuestra y la prueba que
    lo cubre.
 7. Respuesta explícita sobre el bloqueo de exportación de la propuesta
    sin selección comercial confirmada (sólo reporte, sin implementar).
 8. Conteo de pruebas, por separado: originales (595 + 1 todo, intactas),
    pruebas de v2 del Bloque Visual 2, y pruebas nuevas P1 a P10.
    Resultado de typecheck y de build.
 9. Resultado de la inspección página por página de los 12 PDFs: qué se
    revisó, qué se encontró, qué quedó limpio.
10. Resultado de la verificación de paridad PDF ↔ web: qué se comparó,
    cuántos valores y si hubo divergencia residual.
11. Evaluación de los 24 criterios de aceptación de esta ronda, uno por
    uno, con veredicto explícito.
12. Lista de excepciones documentadas de ocupación (C7), con su motivo.
13. Veredicto de la auditoría interna, cuántas rondas hubo y qué se
    corrigió en cada una.
14. DECISIONES PENDIENTES nuevas surgidas durante la ronda, y todo lo que
    quedó sin resolver, con su motivo.
15. Rutas de los 12 PDFs corregidos, sus rásters, los 6 renders web y los
    montajes comparativos.

═══════════════════════════════════════════════════════════════════
RESTRICCIONES FINALES
═══════════════════════════════════════════════════════════════════

Al terminar el handoff, DETENETE para revisión humana.

No propagues el diseño a los otros cuatro escenarios.
No promuevas v2 sobre v1.
No toques la interfaz de usuario ni el botón de descarga.
No modifiques base de datos, migraciones, secretos ni producción.
No integres a `main`. No publiques. No despliegues.
No avances al Bloque Visual 3 ni a la fase 14.
No resuelvas por tu cuenta las decisiones pendientes 1, 2, 3, 4 ni 6.
No amplíes el alcance ni tomes decisiones de producto que no estén en este
documento.

Si algo de este prompt entra en conflicto con lo que encontrás en el
código, con los documentos de `docs/visual/` o con una instrucción previa,
NO elijas por tu cuenta: detenete y reportá el conflicto.

FIN DEL PROMPT — BLOQUE VISUAL 2.1
