<!-- Ejecutado desde c4bdb0d. Texto original sin modificar. -->

FASE 14 — INTEGRACIÓN CONTROLADA DE v2 EN LA INTERFAZ REAL

═══════════════════════════════════════════════════════════════════
1 · CONTEXTO Y HEAD ESPERADO
═══════════════════════════════════════════════════════════════════

Repositorio: maticosenza/velocentum-diagnostico-web
Rama: feat/noche-continuacion — trabajar únicamente acá.
HEAD esperado al iniciar: c4bdb0d
Línea base esperada: 789 pruebas aprobadas + 1 todo, typecheck limpio,
build exitoso, árbol limpio.

PRIMER PASO OBLIGATORIO: guardá este prompt verbatim en
`docs/prompts/fase-14.md` con la línea de encabezado

  <!-- Ejecutado desde c4bdb0d. Texto original sin modificar. -->

Estado del sistema al iniciar:
  - `velocentum-v2` está completo: contrato funcional de dos ejes,
    bloqueo de exportación, roadmap 30/60/90, propuesta cualitativa,
    funnel, fortalezas, dirección visual aprobada.
  - `velocentum-v1` sigue siendo lo que produce la interfaz real. Todos
    sus defectos conocidos siguen vivos ahí: páginas a sangre completa
    en A4, "Sin datos — Sin datos", margen negativo sin alerta,
    propuestas exportables sin selección comercial confirmada.
  - v2 NO está conectado a la interfaz ni al botón de descarga. El
    bloqueo de exportación existe en código y NO protege nada todavía,
    porque el camino que usa la herramienta es v1.

Esta fase conecta v2 a la interfaz real. Es la primera vez en todo el
proyecto que un cambio sale del prototipo aislado y toca lo que un
usuario ve.

═══════════════════════════════════════════════════════════════════
2 · DECISIONES DE PRODUCTO CERRADAS (entrada, no en discusión)
═══════════════════════════════════════════════════════════════════

P1 · REEMPLAZO, NO SELECTOR
  v2 reemplaza a v1 en el flujo de la interfaz. No se implementa ningún
  selector ni convivencia de dos caminos.
  Motivo: mientras exista el camino viejo, alguien lo usa sin saber que
  es el viejo, y v1 tiene defectos que llegan al cliente. Además el
  bloqueo de exportación solo pasa a ser real cuando v2 es el único
  camino.

P2 · IMPLEMENTAR ACTIVADO EN FALSO
  El reemplazo se implementa completo pero queda INACTIVO detrás de un
  interruptor de un solo punto. La interfaz sigue usando v1 al terminar
  esta fase.
  La activación es un acto humano posterior, después de que Matías
  genere los casos reales por el flujo y los apruebe.
  El interruptor tiene que ser un único lugar, obvio, documentado, y
  revertible cambiando un valor. Nada de banderas dispersas.

P3 · USUARIO ÚNICO
  Hoy Matías es el único usuario de la herramienta. Eso simplifica dos
  cosas y solo dos: el plan de reversión puede ser un cambio de una
  línea, y no hay que migrar ni preservar documentos generados por
  terceros. NO asumas nada más a partir de esto — no elimines controles
  ni validaciones "porque hay un solo usuario".

P4 · CASOS REALES PARA LA VALIDACIÓN
  Snake Store y Titan Web B1 son datos de clientes reales que hoy viven
  como fixtures de regresión. La validación de esta fase consiste en
  poder cargarlos y generarlos por el FLUJO REAL de la interfaz, no por
  script. No hacen falta clientes nuevos.

P5 · E-20 ES CORRECCIÓN OBLIGATORIA, E-19 ES DECISIÓN
  Ver sección 4. E-20 se corrige en esta fase. E-19 se decide en esta
  fase, con una recomendación fundada, pero la decisión final es humana.

═══════════════════════════════════════════════════════════════════
3 · FUENTES DE VERDAD
═══════════════════════════════════════════════════════════════════

Leelas antes de escribir código:

  docs/plan-maestro-fases.md                     — secciones 5.1 a 5.7
  docs/funcional/contrato-bloque-3.md            — incluida la sección
                                                   de criterios de
                                                   promoción de v2
  docs/visual/contrato-composicion-v2.md         — secciones 5.1 y 5.8
  docs/visual/auditoria-visual-2026-08-23.md     — sección e), E-19/E-20
  docs/visual/handoff-bloque-visual-3-1.md
  docs/prompts/                                  — prompts por bloque

Si un documento contradice a otro, gana el más reciente y lo reportás.
Si este prompt contradice a un documento, DETENETE y reportá.

═══════════════════════════════════════════════════════════════════
4 · ALCANCE
═══════════════════════════════════════════════════════════════════

4.1 · INCLUIDO

  ÍTEM 1 · E-20 — páginas bajo 25% de ocupación
    La auditoría externa midió las 380 páginas del artefacto de la ronda
    3.1 y encontró 16 páginas de contenido (más de 40 palabras) por
    debajo del 25% de ocupación. Son estas, con su porcentaje medido:

      14,8%  confirmada/propuesta-impresion            p6
      15,0%  mayorista/proyeccion_90d-impresion        p6
      15,0%  mixto/proyeccion_90d-impresion            p6
      17,1%  4-roas-bueno-margen-negativo/diagnostico-impresion p4
      19,8%  mayorista/propuesta-impresion             p3
      19,8%  mixto/propuesta-impresion                 p3
      21,5%  confirmada/diagnostico-impresion          p5
      21,5%  confirmada/propuesta-impresion            p7
      21,5%  confirmada/proyeccion_90d-impresion       p4
      21,7%  mixto/diagnostico-impresion               p5
      21,7%  mixto/proyeccion_90d-impresion            p7
      21,9%  2-margen-alto-volumen-bajo/diagnostico-pantalla p4
      21,9%  3-margen-fino-volumen-alto/diagnostico-pantalla p4
      21,9%  5-todo-sano/diagnostico-pantalla          p4
      21,9%  confirmada/diagnostico-pantalla           p3
      24,4%  confirmada/propuesta-pantalla             p6

    Método de medición: distancia vertical entre la primera y la última
    fila con contenido, descontando el pie de página, sobre el ráster.
    Si tu método difiere, declaralo y proponé el operativo.

    Qué hacer: fusionar secciones, reordenar bloques o expandir
    componentes. Regla dura, sin excepción: NO inventes contenido para
    llenar. Si una página no llega sin inventar, documentala con su
    motivo puntual en la lista cerrada de la sección 5.8 del contrato de
    composición — pero el objetivo es que la lista NO crezca de forma
    significativa.

    Criterio: cero páginas de contenido bajo el 25%, o cada excepción
    justificada individualmente con la razón por la que el contenido
    real no alcanza.

  ÍTEM 2 · E-19 — decisión sobre el umbral general
    124 de las 380 páginas quedan bajo el umbral de 70%/65%. El registro
    de E-19 identifica correctamente la causa estructural: los bloques se
    dimensionan por los datos reales y está prohibido inflar contenido,
    así que cualquier caso con poco contenido real queda bajo el umbral
    por diseño. El umbral y la regla de no inventar son parcialmente
    incompatibles.

    Qué hacer: NO decidas por tu cuenta. Producí un análisis con la
    distribución real de ocupación sobre las 380 páginas —histograma o
    percentiles— y una recomendación fundada entre estas dos vías:
      a) bajar el umbral a un valor que el contenido real cumpla de
         forma sistemática, tratando como defecto solo lo que quede por
         debajo;
      b) rediseñar la paginación para que el umbral actual sea
         alcanzable.
    Marcalo como DECISIÓN HUMANA y esperá respuesta antes de aplicar
    cualquier cambio derivado. El ÍTEM 1 no depende de esto y sigue.

  ÍTEM 3 · Integración de v2 en la interfaz, inactiva
    Identificá el punto único donde la interfaz decide qué plantilla y
    qué renderer usa para generar y descargar. Implementá el reemplazo
    de v1 por v2 en ese punto, detrás del interruptor de P2.
    Al terminar, con el interruptor en su valor por defecto, la interfaz
    debe seguir produciendo exactamente lo mismo que hoy con v1.
    Con el interruptor invertido, debe producir v2 y el bloqueo de
    exportación debe disparar en la interfaz real.

  ÍTEM 4 · Plan de reversión
    Escribí en `docs/fase-14/plan-reversion.md`: cuál es el interruptor,
    dónde vive, qué valor lo activa y cuál lo revierte, qué se pierde y
    qué no al revertir, y cómo verificar que la reversión funcionó.
    Probalo de verdad: activá, generá, revertí, generá, y demostrá que
    la salida vuelve a ser la de v1.

  ÍTEM 5 · Validación por el flujo real
    Con el interruptor activado en un entorno local, cargá Snake Store y
    Titan Web B1 por la interfaz —no por script— y generá los tres
    documentos en ambos perfiles. Capturá evidencia: qué pantallas,
    qué pasos, qué salió.
    Probá también el bloqueo: intentá descargar una propuesta sin
    selección comercial confirmada DESDE LA INTERFAZ y demostrá que no
    se puede.
    Al terminar, devolvé el interruptor a su valor por defecto.

  ÍTEM 6 · Estados y mensajes visibles en la interfaz
    Lo que la interfaz muestre sobre estados, validaciones y bloqueos
    tiene que usar la capa semántica compartida y el copy literal de D4.
    Ningún texto de estado definido en la interfaz por su cuenta.

4.2 · EXCLUIDO

  - Activar el reemplazo. Queda implementado e inactivo.
  - Publicar, desplegar, integrar a `main`.
  - Staging y candidato de publicación: son etapas posteriores.
  - Rediseño visual: la dirección de arte está aprobada.
  - Cambios en el motor, fórmulas o reglas de negocio.
  - Multiusuario, permisos, concurrencia: no hay decisión de producto
    tomada y hoy hay un solo usuario.
  - Aplicar cualquier cambio derivado de E-19 antes de la decisión
    humana.

═══════════════════════════════════════════════════════════════════
5 · PROHIBICIONES ABSOLUTAS
═══════════════════════════════════════════════════════════════════

  - No activar el reemplazo de v1 por v2 en el valor por defecto.
  - No eliminar v1: tiene que quedar funcional y alcanzable por
    reversión.
  - No modificar el motor, `src/lib/`, fixtures canónicos ni fórmulas.
  - No modificar, eliminar ni relajar ninguna prueba existente.
  - No tocar base de datos, migraciones, secretos ni producción.
  - No integrar a `main`. No publicar. No desplegar.
  - No avanzar a staging ni al candidato de publicación.
  - No inventar contenido para llenar páginas, ni cifras, servicios,
    precios, umbrales o resultados.
  - No decidir E-19 por tu cuenta.
  - Ningún agente con mandato de auditoría ejecuta `git push` ni crea el
    commit que termina pusheado (sección 5.6 del plan maestro).

Terminología obligatoria (D7): multicanal = tienda propia + Mercado
Libre u otros canales de venta. Mixto = minorista con módulo mayorista
activado.

═══════════════════════════════════════════════════════════════════
6 · SECUENCIA
═══════════════════════════════════════════════════════════════════

PASO 0 · VERIFICACIÓN
  Rama, HEAD completo, `git status --short`, suite, typecheck y build.
  HEAD debe ser c4bdb0d y la suite 789 + 1 todo. Si difiere, DETENETE.
  Guardá este prompt en `docs/prompts/fase-14.md`.

PASO 1 · INVENTARIO
  Reportá, con archivo y línea:
    a) el punto único donde la interfaz elige plantilla y renderer para
       generar y para descargar;
    b) qué componentes de la interfaz muestran estados, validaciones o
       mensajes derivados del modelo, y si usan la capa semántica o
       texto propio;
    c) cómo se cargan hoy los datos de un diagnóstico desde la interfaz,
       y si Snake Store y Titan Web B1 se pueden reproducir por ese
       camino;
    d) para cada una de las 16 páginas de E-20, qué sección la genera y
       por qué su contenido real no llena.
  CHECKPOINT OBLIGATORIO NO BLOQUEANTE: reportá y seguí, salvo condición
  de detención de la sección 10.

PASO 2 · ÍTEM 2 — ANÁLISIS DE E-19 Y DECISIÓN HUMANA
  Producí el análisis y la recomendación. Reportá y ESPERÁ respuesta.
  Mientras esperás, seguí con los ítems 1, 3, 4 y 6, que no dependen de
  esta decisión.

PASO 3 · ÍTEM 1 — E-20
PASO 4 · ÍTEMS 3, 4 Y 6 — INTEGRACIÓN, REVERSIÓN Y ESTADOS
PASO 5 · ÍTEM 5 — VALIDACIÓN POR FLUJO REAL
PASO 6 · PRUEBAS — sección 7
PASO 7 · ARTEFACTOS, AUDITORÍA, COMMIT Y PUSH — secciones 9 y 11

═══════════════════════════════════════════════════════════════════
7 · PRUEBAS OBLIGATORIAS
═══════════════════════════════════════════════════════════════════

Ninguna prueba existente se modifica, elimina ni relaja.

  X1 · con el interruptor en su valor por defecto, el punto único de
       decisión devuelve v1, y la salida de la interfaz es idéntica a la
       de antes de esta fase;
  X2 · con el interruptor invertido, devuelve v2;
  X3 · con v2 activo, la exportación de una propuesta sin selección
       comercial confirmada falla de forma explícita y controlada,
       invocada desde el punto de la interfaz, no solo desde el módulo;
  X4 · cero páginas de contenido bajo el 25% de ocupación, salvo las
       excepciones documentadas individualmente;
  X5 · ningún texto de estado definido en la interfaz por fuera de la
       capa semántica compartida;
  X6 · determinismo por hash, dos corridas;
  X7 · v1 produce exactamente la misma salida que antes de esta fase.

Conteo sin doble suma: línea base 789 + 1 todo; X1-X7 son las únicas
nuevas.

═══════════════════════════════════════════════════════════════════
8 · CRITERIOS DE ACEPTACIÓN
═══════════════════════════════════════════════════════════════════

  1. Las 789 + 1 todo pasan sin que ninguna prueba se haya relajado.
  2. Typecheck limpio y build exitoso.
  3. El motor, `src/lib/` y los fixtures canónicos fuera del diff.
  4. X1 a X7 pasan.
  5. E-20: cero páginas bajo el 25%, o cada excepción justificada
     individualmente con la razón del contenido real.
  6. E-19: análisis con distribución real entregado, recomendación
     fundada, decisión marcada como HUMANA y NO aplicada.
  7. El reemplazo está implementado y INACTIVO por defecto.
  8. El interruptor es un único punto, documentado y revertible.
  9. Plan de reversión escrito Y probado de verdad: activar, generar,
     revertir, generar, demostrar que la salida vuelve a v1.
 10. Snake Store y Titan Web B1 generados por el flujo real de la
     interfaz, con evidencia de las pantallas y los pasos.
 11. El bloqueo de exportación demostrado desde la interfaz.
 12. Ningún texto de estado definido fuera de la capa semántica.
 13. v1 sigue funcional y alcanzable por reversión.
 14. Sin regresiones visuales: conteo de páginas documento por documento
     contra el artefacto de la ronda 3.1, con toda diferencia explicada.
 15. Ninguna página A4 sobre el 25% de tinta plena.
 16. Cero placeholders, `undefined`, `NaN`, `null` o enums crudos.
 17. Nada inventado. Ningún umbral relajado para conseguir verde.
 18. Este prompt guardado en `docs/prompts/fase-14.md`.
 19. No se activó el reemplazo, no se integró a `main`, no se publicó,
     no se desplegó, no se avanzó a staging.

═══════════════════════════════════════════════════════════════════
9 · AUDITORÍA, COMMIT, PUSH Y ZIP
═══════════════════════════════════════════════════════════════════

REGLA DE REPRODUCIBILIDAD: los artefactos se generan desde el commit
candidato en un `git worktree` limpio, nunca desde el árbol de trabajo.

  A) Implementar y verificar el árbol de trabajo.
  B) Suite, typecheck, build y generación completa de artefactos.
  C) COMMIT CANDIDATO LOCAL, sin push.
  D) Auditoría interna COMPLETA, agente de SOLO LECTURA, contra ese HEAD
     candidato exacto, con los 19 criterios uno por uno.
     El auditor REPORTA Y TERMINA. No commitea, no pushea, no toca el
     remoto.
  E) Si hay correcciones: aplicalas VOS, incorporalas al candidato, y
     relanzá la auditoría COMPLETA sobre el nuevo HEAD.
  F) Máximo DOS rondas.
  G) Únicamente tras veredicto APROBADO, hacé VOS el push a
     `feat/noche-continuacion`.
  H) Verificá que HEAD local y remoto coinciden.

ZIP en Descargas: `velocentum-fase-14-revision.zip`, con `docs/`,
`pdfs/`, `rasters/`, `web/`, `comparativas/`, `estados/`,
`exportacion/`, `roadmap/`, más dos carpetas nuevas:

  `interfaz/`  — evidencia de la validación por flujo real: capturas o
                 salidas de los pasos con Snake Store y Titan Web B1,
                 el intento de exportación bloqueada desde la interfaz,
                 y la prueba de reversión completa.
  `ocupacion/` — el análisis de distribución de E-19 y el antes/después
                 de las 16 páginas de E-20.

Verificalo con `unzip -t` y declará el conteo por carpeta. Ninguna
vacía.

═══════════════════════════════════════════════════════════════════
10 · AUTONOMÍA Y CONDICIONES DE DETENCIÓN
═══════════════════════════════════════════════════════════════════

Podés trabajar de forma autónoma y prolongada. El checkpoint del PASO 1
es obligatorio pero NO bloqueante.

DETENETE Y REPORTÁ ante:
  1. Un conflicto real entre el código y la documentación vigente que
     cambie qué hay que construir.
  2. Una regresión no resoluble dentro del alcance: algo que exigiría
     tocar el motor, relajar una prueba, alterar la salida de v1 o
     rebajar un umbral.
  3. Una decisión de producto nueva. La más probable, además de E-19: si
     conectar v2 obliga a cambiar cómo la interfaz carga o valida datos,
     o si el bloqueo de exportación exige una pantalla nueva.
  4. Si el punto único de decisión de la interfaz no existe y conectar
     v2 exigiría tocarla en varios lugares: eso cambia la naturaleza del
     ítem 3 y hay que hablarlo.

No son motivo de detención: un inventario grande, una migración tediosa,
o una prueba nueva que falla y hay que corregir el código.

Ante la duda entre continuar y detenerte: detenete. Esta fase toca lo
que un usuario ve, y es la primera vez en todo el proyecto.

═══════════════════════════════════════════════════════════════════
11 · HANDOFF
═══════════════════════════════════════════════════════════════════

Catorce secciones numeradas, sin omitir ninguna:

 1. Rama, HEAD local y remoto, commit candidato de los artefactos.
 2. `git status --short`.
 3. `git diff --stat` contra c4bdb0d.
 4. Aislamiento: archivos tocados; qué se tocó de v1 y la prueba de que
    su salida no cambió.
 5. Resultado del PASO 0 y del inventario del PASO 1.
 6. E-20: las 16 páginas, una por una, qué se hizo y su ocupación
    después. Excepciones nuevas con su motivo puntual.
 7. E-19: el análisis de distribución, la recomendación fundada, y la
    confirmación de que NO se aplicó ningún cambio derivado.
 8. Integración: cuál es el punto único, cómo quedó el interruptor,
    dónde vive, y confirmación de que está inactivo por defecto.
 9. Plan de reversión: ruta del documento y evidencia de la prueba real
    de activar, generar, revertir, generar.
10. Validación por flujo real: pasos con Snake Store y Titan Web B1,
    qué se generó, y la evidencia del bloqueo de exportación desde la
    interfaz.
11. Estados y mensajes: qué usa la capa semántica y qué no.
12. Conteo de pruebas sin doble suma: 789 + 1 de base; X1-X7 nuevas;
    total final. Typecheck y build.
13. Conteo de páginas documento por documento contra la ronda 3.1, con
    toda diferencia explicada.
14. Auditoría interna: sobre qué HEAD corrió cada ronda, veredicto, y
    confirmación de que el push lo hiciste vos después del APROBADO.
    Más decisiones pendientes nuevas y lo que quedó sin resolver.

═══════════════════════════════════════════════════════════════════
12 · RESTRICCIONES FINALES
═══════════════════════════════════════════════════════════════════

Al terminar el handoff y el ZIP, DETENETE para revisión humana.

No actives el reemplazo. No elimines v1.
No modifiques base de datos, migraciones, secretos ni producción.
No integres a `main`. No publiques. No despliegues.
No avances a staging ni al candidato de publicación.
No decidas E-19 por tu cuenta.
No amplíes el alcance.

Si algo de este prompt entra en conflicto con el código o con los
documentos de `docs/`, NO elijas por tu cuenta: detenete y reportá.

FIN DEL PROMPT — FASE 14
