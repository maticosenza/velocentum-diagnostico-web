<!-- Ejecutado desde e5080e2, cerrado en 490d3e8. Texto original sin modificar. -->

BLOQUE VISUAL 2 — PROTOTIPO FUNCIONAL PARA DOS ESCENARIOS

═══════════════════════════════════════════════════════════════════
CONTEXTO
═══════════════════════════════════════════════════════════════════

Repositorio: maticosenza/velocentum-diagnostico-web
Rama: feat/noche-continuacion — trabajar únicamente acá.
HEAD esperado: 57aa8795623bf110a5b2dc6747b2046e128f8596
Línea base esperada: 595 pruebas aprobadas + 1 todo (596 total), typecheck
limpio, build exitoso, árbol limpio.

El Bloque Visual 1 cerró aprobado. Su salida son seis documentos en
docs/visual/, con la fuente de verdad en
docs/visual/auditoria-visual-2026-08-23.md. El inventario final es de 38
identificadores: E-01 a E-18, C-01 a C-08, R-01 a R-12.

Leé los seis documentos de docs/visual/ ANTES de empezar:
  - auditoria-visual-2026-08-23.md   (fuente de verdad, apéndice completo)
  - inventario-componentes.md
  - contrato-estados.md
  - perfiles-pantalla-a4.md
  - wireframes.md
  - matriz-hallazgos.md

Este prompt no los repite y no los reemplaza. Cuando este prompt cita un
identificador (E-xx, C-xx, R-xx, D-x, V-x), el contenido completo de ese
identificador vive en esos documentos.

Este bloque construye un PROTOTIPO funcional. No propaga. No cierra
hallazgos de contrato ni de dominio. No se promueve a producción.

═══════════════════════════════════════════════════════════════════
PASO 0 — VERIFICACIÓN Y CRITERIO DE ENTRADA
═══════════════════════════════════════════════════════════════════

0.1 Reportá rama, HEAD, `git status --short`, y el resultado de suite,
    typecheck y build. Si algo difiere de lo informado arriba, DETENETE y
    reportá la diferencia exacta. No reconcilies por tu cuenta.

0.2 Confirmá que docs/visual/auditoria-visual-2026-08-23.md contiene E-17,
    E-18, C-08, el C-01 reformulado, la ampliación de C-02 y el estado
    "parcialmente resuelto" de E-10. Si falta alguno, DETENETE: estarías
    trabajando contra una versión anterior de la auditoría.

0.3 CRITERIO DE ENTRADA SOBRE C-01. En el Bloque 1 se conservó el texto
    original de C-01 junto a la reformulación, por trazabilidad. Verificá
    que un lector nuevo no pueda confundirlos: la reformulación debe estar
    marcada de forma inequívoca como VERSIÓN VIGENTE y el texto anterior
    como HISTÓRICO / SUPERADO. El texto original afirma que el perfil A4 no
    existe, lo cual quedó refutado para el renderer PDF; si alguien lo lee
    como vigente, toma una decisión equivocada.

    - Si la distinción ya es inequívoca: no toques nada y reportalo.
    - Si no lo es: corregí ÚNICAMENTE esa marcación, en ese archivo, en un
      commit propio y separado, antes de empezar el paso 1. No aproveches
      ese commit para ningún otro cambio.

═══════════════════════════════════════════════════════════════════
DECISIÓN 5 — RESUELTA (entrada, no está en discusión)
═══════════════════════════════════════════════════════════════════

Sobre la divergencia sistemática PDF ↔ web (E-17), la decisión tomada es:

  - UNIFICAR la capa semántica: el texto de estado de `ValorPublicable` y
    el formato numérico se centralizan en un módulo compartido, único, que
    consumen ambos renderers. Dado el mismo valor, ambos dicen lo mismo y
    formatean igual.
  - MANTENER SEPARADOS los layouts y renderers de PDF y web. Cada uno
    decide CÓMO dibuja; ninguno decide QUÉ dice.
  - NO intentar compartir el árbol visual completo. `@react-pdf/renderer` y
    el renderer web tienen restricciones distintas; forzar una jerarquía
    común no está autorizado.

Decisiones 1, 2, 3, 4 y 6 siguen PENDIENTES y quedan para bloques
posteriores. No las resuelvas de oficio:
  1. Separar `retenido` de `evidencia_faltante` en los tipos.
  2. Si "inversión $0 declarada" debe ser `no_aplica` para MER.
  3. Tratamiento visual y copy de la propuesta con margen negativo.
  4. Si el Eje 1 (`Evidencia<T>`) debe renderizarse, y dónde.
  6. Completar el roadmap 30/60/90 o eliminar esas plantillas.

Decisión 7: resuelta usando un contexto de prueba propio del prototipo, sin
modificar los fixtures canónicos (ver ALCANCE).

═══════════════════════════════════════════════════════════════════
PROHIBICIONES ABSOLUTAS
═══════════════════════════════════════════════════════════════════

- No modificar `src/documents/domain/types.ts` ni ningún tipo del dominio.
  La extensión del contrato de estados (D4 completo, `evidencia_faltante`,
  `estimado_configuracion`) es Bloque 3, no éste.
- No modificar cálculos, fórmulas, motor de escenarios ni reglas
  comerciales. `src/lib/` es de SOLO LECTURA en este bloque, sin excepción.
- No modificar `src/lib/fixtures-escenarios-demo.ts` ni ningún fixture
  canónico.
- No modificar `src/documents/templates/velocentum-v1/` ni los renderers
  existentes bajo `src/documents/renderers/`. v1 queda intacto y sigue
  siendo lo que se genera en producción.
- No modificar ninguna prueba existente, ninguna expectativa numérica y
  ningún snapshot. Las 595 + 1 todo deben seguir pasando SIN TOCARLAS. Si
  una se rompe, es señal de que tocaste v1: revertí y reportá.
- No conectar el prototipo a la interfaz de usuario ni al botón de
  descarga.
- No propagar a los otros cuatro escenarios.
- No promover v2 sobre v1.
- No tocar base de datos, migraciones, secretos ni producción.
- No integrar a `main`. No publicar. No desplegar.
- No avanzar al Bloque Visual 3 ni a la fase 14.

═══════════════════════════════════════════════════════════════════
ESTRATEGIA: PROTOTIPO EN PARALELO
═══════════════════════════════════════════════════════════════════

El repositorio ya versiona plantillas (`velocentum-v1`, ids
`velocentum-diagnostico/v1`). Usá el mismo mecanismo: creá un espacio
`velocentum-v2` que consuma EXACTAMENTE el mismo
`DocumentContextV1`/`DocumentModel` que v1, sin ningún cambio en el
dominio.

El prototipo incluye tres piezas:
  a) la capa semántica compartida (decisión 5);
  b) el renderer PDF v2, con sus dos perfiles;
  c) el renderer web v2, necesario para demostrar la paridad semántica.

Garantías que este diseño debe cumplir y que quiero verificadas al cierre:
  - v1 genera exactamente lo mismo que hoy → las 595 pruebas pasan sin
    tocarse y ningún snapshot cambia;
  - el prototipo se puede aprobar o descartar sin riesgo;
  - si se aprueba, un bloque posterior promueve v2 y retira v1; si no, se
    borra v2 y no queda deuda.

El prototipo se genera por script, a archivo, para revisión humana.

═══════════════════════════════════════════════════════════════════
ALCANCE
═══════════════════════════════════════════════════════════════════

Escenarios (de `src/lib/fixtures-escenarios-demo.ts`, SOLO LECTURA):
  - s1-marketplace-fuerte           → caso MULTICANAL con cifras publicadas
  - s4-roas-bueno-margen-negativo   → caso de estados límite y retención

Documentos: diagnóstico, proyección 90 días, propuesta.
Perfiles: pantalla (16:9) e impresión (A4).
Total a generar: 2 × 3 × 2 = 12 PDFs, más el render web v2 de los mismos
seis documentos para la verificación de paridad.

Cobertura conocida: s4 NO tiene datos de funnel cargados, así que por sí
solo no ejercita la tabla de escenarios con contenido ni la retención en
cascada por margen negativo. No inventes datos ni modifiques el fixture.
Si necesitás ese caso, armá un contexto de prueba DENTRO del script del
prototipo, rotulado explícitamente como caso de prueba del prototipo y
nunca como escenario demostrativo. Documentá qué datos usaste y por qué.

Terminología obligatoria (D7): multicanal = tienda propia + Mercado Libre u
otros canales de venta. Mixto = minorista con módulo mayorista activado.
Nunca uses "mixto" como sinónimo de "multicanal".

HALLAZGOS EN ALCANCE (capa renderer/plantilla):
  E-01, E-02, E-03, E-04 (mitad renderer), E-06, E-10 (tratamiento visual
  de la alerta en el diagnóstico), E-11, E-12, E-13, E-14, E-15, E-17,
  C-01 (residual: sangre en A4, encabezado de tabla al continuar, escala
  tipográfica completa), C-07, R-01, R-02, R-03, R-04, R-05, R-06, R-08,
  R-10, R-11, R-12.

EXPRESAMENTE FUERA DE ALCANCE (Bloque 3):
  E-05, E-07, E-08, E-09, E-16, E-18, C-02, C-03, C-04, C-08, R-07, R-09.
  Si el prototipo los hace más evidentes, documentalo; no los toques.

Excepción única y acotada: para E-08 y C-07 podés agregar en v2 un
parámetro de variante al constructor de `findings` (por ejemplo
"diagnóstico" contra "propuesta") para demostrar la diferenciación. Es un
cambio de plantilla dentro de v2, permitido. Cualquier cambio que requiera
tocar `context.hallazgos` o el dominio NO está permitido: documentá el
límite y seguí.

Sobre E-10: la quinta exigencia de D5 —la propuesta cualitativa sin
promesas económicas— es la decisión pendiente 3 y NO está en alcance. Lo
único que entra es que la alerta de margen negativo se vea distinta del
resto de los hallazgos en el diagnóstico.

═══════════════════════════════════════════════════════════════════
SECUENCIA DE TRABAJO
═══════════════════════════════════════════════════════════════════

── PASO 1 — REPRODUCIR ANTES DE CORREGIR ──

Generá los 12 PDFs con v1 tal como está hoy. Rasterizá cada página e
inspeccionala vos mismo. Reportá, con descripción precisa por página:

  a) si E-01 (solapamiento en la tabla de escenarios) se reproduce, y en
     qué páginas exactas;
  b) si E-02 (página con encabezado y cuerpo vacío) se reproduce, y cuál
     es el mecanismo real. La causa presunta original fue refutada en el
     Bloque 1; la hipótesis vigente es desbordamiento de contenido con el
     header `fixed` repitiéndose.

Sin reproducción confirmada, NO corrijas ese hallazgo: reportalo y seguí
con el resto. Un arreglo sin reproducción previa no es verificable.

Esta línea de base es el "antes" de los montajes comparativos del cierre.
Conservá los rásters de v1 para la comparación del paso 5.

── PASO 2 — CONTRATO DE COMPOSICIÓN (antes de dibujar nada) ──

Escribí docs/visual/contrato-composicion-v2.md con:

  CAPA SEMÁNTICA COMPARTIDA (decisión 5):
  - módulo único que, dado un `ValorPublicable`, devuelve la etiqueta de
    estado usando el copy de D4 y asomando el motivo real, hoy descartado
    por `publishValue` (E-04);
  - política única de formato numérico —moneda, porcentaje, ratio,
    cero real— consumida por ambos renderers (E-14);
  - etiquetas traducidas de `capa`, `prioridad`, `confianza` y magnitud
    económica, en un solo lugar (E-15, E-03);
  - regla explícita: ningún renderer define texto de estado por su cuenta.

  COMPOSICIÓN, POR PERFIL:
  - escala tipográfica completa por rol de texto (título, subtítulo, label,
    valor, badge, nota, pie) y por perfil (R-03, C-01 residual);
  - reglas de grilla y balanceo (R-02);
  - umbral de ocupación mínima por página (R-01);
  - qué puede ir a sangre en pantalla y qué NO puede ir a sangre en A4
    (C-01 residual);
  - continuación de tablas con encabezado repetido (C-01 residual);
  - presentación de la tabla mensual bajo D2: mes a mes, ritmo mensual al
    día 90 y acumulado de 90 días como TRES MAGNITUDES rotuladas por
    separado, nunca bajo una misma etiqueta (R-12);
  - presentación de palancas con magnitud y período explícitos (E-03);
  - escala de severidad con color + icono + texto, nunca color solo
    (E-11, D4);
  - agrupación de retenciones por causa, no por producto cartesiano (E-06);
  - tratamiento visual de la alerta crítica de margen negativo (E-10, D5);
  - presentación de los supuestos (†) con su nota resuelta en la misma
    página (E-13);
  - iconografía lineal en círculo y numeración 01/02/03 (R-04);
  - portada: cliente, tipo de documento, fecha y versión; franja con
    degradado en vez de bandas duras (R-05);
  - un solo tratamiento del wordmark en ambos renderers y perfiles (R-06);
  - máximo de divisorias por documento y por perfil (R-08);
  - comparación entre canales en diagnóstico MULTICANAL (R-10);
  - densidad y aprovechamiento de los escenarios en 16:9 (R-11);
  - puente explícito entre la cifra mensual del diagnóstico y el acumulado
    a 90 días de la propuesta (C-07);
  - orden de hallazgos por severidad y luego por impacto (E-12).

Este contrato es la fuente de las pruebas del paso 4. Todo lo que exceda
las decisiones D1–D8 y la decisión 5 se marca DECISIÓN PENDIENTE, no se
resuelve de oficio.

── PASO 3 — PROTOTIPO ──

Implementá v2 según el contrato del paso 2: capa semántica compartida,
renderer PDF v2 con sus dos perfiles, renderer web v2.

Regenerá los 12 PDFs y los seis renders web con v2. Rasterizá e
inspeccioná cada página vos mismo ANTES de mostrarlas. Si una página no
cumple el contrato del paso 2, corregila antes de seguir: no dejes la
verificación para el paso 5.

── PASO 4 — PRUEBAS NUEVAS, SOLO SOBRE v2 ──

Agregá pruebas estructurales derivadas del contrato, que apunten
exclusivamente a v2. Como mínimo:

  - PDF y web producen el MISMO texto de estado y el MISMO número
    formateado para el mismo `ValorPublicable` (decisión 5, E-17);
  - cero ocurrencias de "Sin datos" como texto de estado;
  - ninguna cadena de metadatos unida con " - ";
  - toda palanca declara magnitud y período;
  - acumulado de 90 días y ritmo mensual al día 90 nunca comparten
    etiqueta (D2);
  - ninguna sección se emite con cuerpo vacío;
  - ningún texto por debajo del mínimo tipográfico de su perfil;
  - superficie de tinta plena por página A4 bajo el umbral del contrato;
  - severidad distinguible sin color;
  - toda marca de supuesto (†) tiene nota resuelta en la misma página;
  - los hallazgos salen ordenados por severidad;
  - el bloque de hallazgos de la propuesta no es idéntico al del
    diagnóstico (E-08, dentro de la excepción acotada).

Las pruebas verifican el contrato, no describen el resultado obtenido. No
ajustes el contrato para que una prueba pase. Ninguna prueba existente se
modifica.

═══════════════════════════════════════════════════════════════════
CRITERIOS DE ACEPTACIÓN
═══════════════════════════════════════════════════════════════════

El bloque solo puede darse por terminado si TODOS estos se cumplen:

FUNCIONALES
  1. Las 595 pruebas originales + 1 todo pasan sin haber sido modificadas.
  2. Typecheck limpio.
  3. Build exitoso.
  4. v1 produce la misma salida que antes del bloque (verificable: ningún
     archivo de v1 en el diff).
  5. Ningún archivo de `src/lib/`, del dominio, de migraciones, de base ni
     de producción aparece en el diff.
  6. Las pruebas nuevas de v2 pasan y verifican el contrato del paso 2.

VISUALES (sobre los 12 PDFs de v2, página por página)
  7. Sin texto solapado, cortado ni fuera de página, en ningún perfil.
  8. Sin páginas con encabezado y cuerpo vacío.
  9. Sin tablas ilegibles; toda tabla que continúa repite su encabezado.
 10. Ninguna página A4 supera el umbral de tinta plena del contrato.
 11. Contraste suficiente en pantalla, impresión y videollamada.
 12. Alineaciones, márgenes y padding consistentes dentro de cada perfil.
 13. Los estados se entienden también sin color.
 14. `retenido`, `no_aplica` y `evidencia_faltante` tienen presentación
     propia y ninguno se muestra como cero.
 15. Nombres largos de cliente y montos grandes no rompen la composición.
 16. Los tres documentos se reconocen como parte del mismo sistema, y a la
     vez se distinguen entre sí.

DE PARIDAD
 17. Para cada `ValorPublicable` de los seis documentos, el texto de estado
     y el número formateado son idénticos en PDF y en web.

DE DISCIPLINA
 18. Ningún hallazgo fuera de alcance fue modificado.
 19. Ninguna decisión pendiente (1, 2, 3, 4, 6) fue resuelta de oficio.
 20. Ninguna cifra, servicio, precio ni resultado fue inventado.

Si alguno no se cumple, no lo fuerces: reportalo como pendiente en el
handoff con su motivo.

═══════════════════════════════════════════════════════════════════
AUDITORÍA INTERNA
═══════════════════════════════════════════════════════════════════

Antes del commit final, corré un agente auditor interno de SOLO LECTURA
sobre el resultado, con un MÁXIMO DE DOS RONDAS de corrección.

El auditor verifica, y solo reporta —nunca implementa—:
  - aislamiento del diff: que v1, el dominio, `src/lib/`, los fixtures, las
    pruebas existentes y los snapshots no aparezcan modificados;
  - que cada ítem en alcance tenga una afirmación verificable en el
    contrato del paso 2 y una prueba o una inspección visual que lo
    respalde;
  - que ningún hallazgo fuera de alcance haya sido tocado;
  - que el copy de D4 esté transcripto literalmente donde corresponde;
  - que la terminología de D7 se respete en código, documentos y salidas;
  - que las DECISIONES PENDIENTES estén marcadas y no resueltas de oficio;
  - que los 20 criterios de aceptación estén evaluados uno por uno, con
    veredicto explícito por criterio;
  - que no queden placeholders, `undefined`, `NaN` ni texto sin normalizar
    en ninguna de las 12 salidas.

Veredicto del auditor: APROBADO / APROBADO CON CORRECCIONES / BLOQUEADO.
Si al cabo de dos rondas queda algo sin resolver, no lo fuerces: cerrá con
lo que haya y reportalo como pendiente.

═══════════════════════════════════════════════════════════════════
COMMITS Y PUSH
═══════════════════════════════════════════════════════════════════

- Commit y push ÚNICAMENTE a `feat/noche-continuacion`.
- Nunca a `main`. Nunca un merge, un rebase sobre main ni un tag.
- El paso 0.3, si requirió corrección, va en un commit propio y separado,
  anterior a todo el resto.
- El trabajo del prototipo puede ir en uno o varios commits, a tu criterio,
  pero ninguno se hace antes de que la auditoría interna esté aprobada.
- Mensajes de commit descriptivos, en español, referenciando los IDs de
  hallazgo que atienden.
- Después del push, verificá que
  `git log origin/feat/noche-continuacion -1` coincide con el HEAD local y
  reportalo.

═══════════════════════════════════════════════════════════════════
FORMATO OBLIGATORIO DEL HANDOFF
═══════════════════════════════════════════════════════════════════

Devolvé el handoff con estas trece secciones, numeradas, en este orden y
sin omitir ninguna. Si una sección no aplica, escribí "no aplica" y por
qué; no la borres.

 1. Rama y HEAD completo (hash entero).
 2. Salida de `git status --short`.
 3. Salida de `git diff --stat` contra
    57aa8795623bf110a5b2dc6747b2046e128f8596.
 4. Confirmación de aislamiento: lista de archivos tocados, y afirmación
    explícita de que v1, el dominio, `src/lib/`, los fixtures, las pruebas
    existentes y los snapshots no fueron modificados.
 5. Resultado del PASO 0.3 sobre C-01: ¿estaba clara la distinción entre
    versión vigente e histórica? ¿Hubo que corregir? ¿En qué commit?
 6. Resultado del PASO 1: para E-01 y para E-02, si se reprodujo, en qué
    páginas exactas, y cuál resultó ser el mecanismo real.
 7. Ruta del contrato de composición (`docs/visual/contrato-composicion-v2.md`)
    y resumen de las reglas que fijó.
 8. Conteo de pruebas, por separado: originales (595 + 1 todo, intactas) y
    nuevas de v2. Resultado de typecheck y de build.
 9. Estado de CADA hallazgo en alcance, uno por uno: resuelto en el
    prototipo / parcialmente resuelto / no resuelto, con el motivo.
10. Resultado de la verificación de paridad PDF ↔ web: qué se comparó,
    cuántos valores, y si hubo alguna divergencia residual.
11. Evaluación de los 20 criterios de aceptación, uno por uno, con
    veredicto explícito.
12. Veredicto de la auditoría interna, cuántas rondas hubo, y qué se
    corrigió en cada una.
13. DECISIONES PENDIENTES nuevas surgidas durante el bloque, y todo lo que
    quedó sin resolver, con su motivo.

Adjuntá o listá las rutas de: los 12 PDFs de v2, los 12 rásters de v1 del
paso 1, y los montajes comparativos v1 contra v2 por escenario, documento
y perfil.

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
código, con los seis documentos de docs/visual/ o con una instrucción
previa, NO elijas por tu cuenta: detenete y reportá el conflicto.

FIN DEL PROMPT — BLOQUE VISUAL 2
