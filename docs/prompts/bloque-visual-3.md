<!-- Ejecutado desde 82bb66e. Texto original sin modificar. -->

BLOQUE VISUAL 3 — PROPAGACIÓN VISUAL SOBRE EL CONTRATO FUNCIONAL DEFINITIVO

═══════════════════════════════════════════════════════════════════
1 · CONTEXTO Y HEAD ESPERADO
═══════════════════════════════════════════════════════════════════

Repositorio: maticosenza/velocentum-diagnostico-web
Rama: feat/noche-continuacion — trabajar únicamente acá.
HEAD esperado al iniciar: 82bb66e
Línea base esperada: 765 pruebas aprobadas + 1 todo, typecheck limpio,
build exitoso, árbol limpio.

PRIMER PASO OBLIGATORIO, antes de cualquier otra cosa: guardá este
prompt verbatim en `docs/prompts/bloque-visual-3.md`, con la línea de
encabezado

  <!-- Ejecutado desde 82bb66e. Texto original sin modificar. -->

Es la regla de la sección 5.6 de `docs/plan-maestro-fases.md`, que
empieza a aplicarse desde este bloque.

El Bloque 3 Funcional cerró con veredicto externo APROBADO CON RESERVA.
Verificado desde artefactos: el bloqueo de exportación funciona en el
punto único de decisión e invocado sin interfaz, con las dos ramas del
gate y el caso permitido produciendo un PDF real; el roadmap 30/60/90 se
renderiza con contenido trazable; DHB-1, DHB-2 y DHB-3 implementados;
54 PDFs, 376 páginas, 376 rásters, 54 renders web, 9 archivos de estados
con los dos ejes y el copy literal.

Las dos reservas que dejó esa auditoría entran en este bloque como
ítems 1 y 2.

Estado del sistema:
  - `velocentum-v2` tiene el contrato funcional completo y la dirección
    visual aprobada.
  - `velocentum-v1` sigue intacto y es lo que produce producción.
  - v2 NO está conectado a la interfaz ni al botón de descarga.

Este bloque es VISUAL: propaga y ajusta la composición sobre el contrato
funcional ya cerrado. No cambia semántica ni reglas de negocio.

═══════════════════════════════════════════════════════════════════
2 · FUENTES DE VERDAD
═══════════════════════════════════════════════════════════════════

Leelas todas antes de escribir código:

  docs/plan-maestro-fases.md              (estado y disciplina)
  docs/funcional/contrato-bloque-3.md     (contrato funcional)
  docs/visual/contrato-composicion-v2.md  (contrato de composición)
  docs/visual/auditoria-visual-2026-08-23.md  (38 identificadores)
  docs/visual/handoff-bloque-3.md
  docs/prompts/                           (prompts originales por bloque)

Si un documento contradice a otro, gana el más reciente y lo reportás.
Si este prompt contradice a un documento, DETENETE y reportá.

═══════════════════════════════════════════════════════════════════
3 · ALCANCE
═══════════════════════════════════════════════════════════════════

3.1 · INCLUIDO

  ÍTEM 1 · Renombrar `calculado` → `disponible` (reserva R-1)
    El contrato funcional, en su matriz de estados, declara que
    `"calculado"` pasa a `disponible`. El renombrado nunca se hizo: los
    nueve archivos de `estados/` del ZIP muestran 60 ocurrencias de
    `calculado` y cero de `disponible` como estado del Eje 2.
    D4 fija cuatro estados del Eje 2: disponible / retenido /
    evidencia_faltante / no_aplica. Hoy hay tres más uno mal nombrado.

    Es un renombrado mecánico, con la suite como red. No cambia
    comportamiento ni copy visible. Alcanza al tipo, a los call sites, a
    la capa semántica y a las pruebas que asertan el identificador.
    Actualizá la matriz del contrato funcional para que refleje el
    estado real después del cambio.

  ÍTEM 2 · Carpeta `roadmap/` en el ZIP (reserva R-2)
    El ZIP del Bloque 3 declaraba siete carpetas y la sección 17 pedía
    ocho: faltó `roadmap/`. La evidencia existe dentro de los PDFs, pero
    el entregable no. Se corrige al armar el ZIP de este bloque.

  ÍTEM 3 · Componentes visuales pendientes
    R-09 · El título ya se corrigió a "Hallazgos priorizados", pero el
      funnel y el bloque de retención siguen sin construirse. Este es el
      bloque donde se decide: o se construyen, o se declara que el motor
      no expone los datos necesarios y se documenta.
    R-07 · Las fortalezas están implementadas solo para 2 de las 5
      dimensiones del motor (`economia`, `funnel_web`) porque son las
      únicas que exponen métrica y umbral en `derivados`. Verificá si
      las otras tres pueden resolverse sin fabricar el criterio. Si no,
      dejalo documentado como está: no inventes umbrales.
    R-04 · Iconografía lineal en círculo donde el contrato de
      composición la habilita, sin extenderla a superficies nuevas.

  ÍTEM 4 · Verificación visual de las piezas que recién ahora tienen
    contenido
    El roadmap 30/60/90, `restrictions-grouped`, la propuesta cualitativa
    de DHB-2 y las fortalezas se renderizan por primera vez con datos
    reales. Nunca pasaron por revisión de composición. Hay que
    inspeccionarlas página por página, en los dos perfiles, y corregir
    lo que rompa el contrato de composición.

  ÍTEM 5 · Criterios de promoción de v2 sobre v1
    Están escritos en el contrato funcional. Verificá que sigan siendo
    verificables después de este bloque y actualizalos si algo cambió.
    NO ejecutes ninguna promoción.

3.2 · EXCLUIDO

  - Cambios de semántica, fórmulas, reglas de negocio o del motor.
  - Promoción de v2 sobre v1.
  - Fase 14, staging, publicación.
  - Nuevos escenarios o fixtures canónicos.
  - Rediseño de la dirección de arte, que está aprobada.

═══════════════════════════════════════════════════════════════════
4 · PROHIBICIONES ABSOLUTAS
═══════════════════════════════════════════════════════════════════

  - No modificar `src/lib/`, fixtures canónicos ni el motor.
  - No modificar `velocentum-v1` ni los renderers v1, salvo lo forzado
    mecánicamente por el renombrado del ítem 1; en ese caso el cambio no
    puede alterar la salida de v1, y hay que demostrarlo regenerando y
    comparando.
  - No relajar ninguna prueba existente. El renombrado del ítem 1 puede
    actualizar el identificador esperado en una aserción, nunca
    debilitarla: si una prueba deja de fallar al revertir el cambio, la
    modificación la vació.
  - No promover v2 sobre v1. No conectar v2 a la interfaz.
  - No tocar base, migraciones, secretos ni producción.
  - No integrar a `main`. No publicar. No desplegar.
  - No avanzar a la fase 14, a staging ni a publicación.
  - No inventar cifras, servicios, precios, umbrales ni resultados.
  - Ningún agente con mandato de auditoría ejecuta `git push` ni crea el
    commit que termina pusheado (sección 5.6 del plan maestro).

Terminología obligatoria (D7): multicanal = tienda propia + Mercado
Libre u otros canales de venta. Mixto = minorista con módulo mayorista
activado.

═══════════════════════════════════════════════════════════════════
5 · SECUENCIA
═══════════════════════════════════════════════════════════════════

PASO 0 · VERIFICACIÓN
  Rama, HEAD completo, `git status --short`, suite, typecheck y build.
  HEAD debe ser 82bb66e y la suite 765 + 1 todo. Si difiere, DETENETE.
  Guardá este prompt en `docs/prompts/bloque-visual-3.md`.

PASO 1 · INVENTARIO Y DECISIONES ABIERTAS
  Reportá, con archivo y línea:
    a) todos los puntos donde aparece el identificador `calculado` como
       estado del Eje 2, y cuáles son pruebas que lo asertan;
    b) qué datos expone hoy el motor que permitirían construir el funnel
       y el bloque de retención de R-09 — y si no alcanzan, decilo;
    c) qué dimensiones del motor exponen métrica Y umbral, para saber si
       R-07 puede ampliarse más allá de `economia` y `funnel_web`;
    d) las páginas donde se renderizan roadmap, `restrictions-grouped`,
       propuesta cualitativa y fortalezas, por caso y perfil.
  CHECKPOINT OBLIGATORIO NO BLOQUEANTE: reportá y seguí, salvo que se
  cumpla una condición de detención de la sección 8.

PASO 2 · ÍTEM 1 — RENOMBRADO
  En pasos pequeños, corriendo suite después de cada uno.
  Al terminar: demostrá que la salida de v1 no cambió, regenerando y
  comparando antes/después.

PASO 3 · ÍTEMS 3 Y 4 — COMPONENTES Y COMPOSICIÓN
  Construí lo que el motor permita de R-09 y R-07; documentá lo que no.
  Inspeccioná las piezas nuevas página por página, en los dos perfiles.

PASO 4 · PRUEBAS
  Sobre v2. Ninguna existente se elimina ni se relaja.
    V1 · el identificador `calculado` no existe como estado del Eje 2;
         los cuatro estados de D4 existen con su copy literal;
    V2 · las páginas de roadmap, restrictions-grouped, propuesta
         cualitativa y fortalezas cumplen el contrato de composición:
         sin texto solapado, cortado ni fuera de página; sin cuerpo
         vacío; ocupación dentro del umbral o en la lista de
         excepciones; A4 bajo el 25% de tinta plena; contraste
         calculado;
    V3 · v1 produce exactamente la misma salida que antes del bloque;
    V4 · determinismo por hash, dos corridas.
  Conteo sin doble suma: línea base 765 + 1 todo; todo lo anterior ya
  está incluido; V1-V4 son las únicas nuevas.

PASO 5 · ARTEFACTOS, AUDITORÍA, COMMIT Y PUSH — secciones 6 y 7.

═══════════════════════════════════════════════════════════════════
6 · CRITERIOS DE ACEPTACIÓN
═══════════════════════════════════════════════════════════════════

  1. Las 765 + 1 todo pasan sin que ninguna prueba se haya relajado.
  2. Typecheck limpio y build exitoso.
  3. `src/lib/`, fixtures canónicos y el motor fuera del diff.
  4. V1 a V4 pasan.
  5. El identificador `calculado` no existe como estado del Eje 2;
     los cuatro estados de D4 existen con su copy literal.
  6. La matriz del contrato funcional refleja el estado real.
  7. R-09 resuelto o documentado con la razón exacta.
  8. R-07 ampliado hasta donde el motor lo permita, sin umbrales
     inventados.
  9. Roadmap, restrictions-grouped, propuesta cualitativa y fortalezas
     inspeccionadas página por página en los dos perfiles.
 10. Ninguna página con texto solapado, cortado o fuera de página.
 11. Ninguna página A4 sobre el 25% de tinta plena.
 12. Cero placeholders, `undefined`, `NaN`, `null` o enums crudos.
 13. Paridad semántica PDF↔web sostenida.
 14. v1 produce exactamente la misma salida que antes del bloque.
 15. Determinismo verificado por hash, dos corridas.
 16. Sin regresiones: conteo de páginas documento por documento contra
     el ZIP del Bloque 3, con toda diferencia explicada.
 17. Los criterios de promoción de v2 sobre v1 siguen siendo
     verificables; ninguna promoción ejecutada.
 18. Nada inventado. Ningún umbral del contrato de composición relajado.
 19. Este prompt guardado en `docs/prompts/bloque-visual-3.md`.
 20. No se integró a `main`, no se publicó, no se desplegó.

═══════════════════════════════════════════════════════════════════
7 · AUDITORÍA, COMMIT, PUSH Y ZIP
═══════════════════════════════════════════════════════════════════

REGLA DE REPRODUCIBILIDAD: todos los artefactos se generan desde el
commit candidato en un `git worktree` limpio, nunca desde el árbol de
trabajo. Declará desde qué worktree y qué commit salió cada artefacto.

Secuencia, exactamente en este orden:

  A) Implementar y verificar el árbol de trabajo.
  B) Suite, typecheck, build y generación completa de artefactos.
  C) Crear un COMMIT CANDIDATO LOCAL, sin push.
  D) Auditoría interna COMPLETA, agente de SOLO LECTURA, contra ese HEAD
     candidato exacto, con los 20 criterios uno por uno.
     El auditor REPORTA Y TERMINA. No commitea, no pushea, no toca el
     remoto (sección 5.6 del plan maestro).
  E) Si hay correcciones: aplicalas VOS, incorporalas al candidato, y
     volvé a lanzar la auditoría COMPLETA sobre el nuevo HEAD.
  F) Máximo DOS rondas.
  G) Únicamente tras veredicto APROBADO, hacé VOS el push a
     `feat/noche-continuacion`.
  H) Verificá que HEAD local y remoto coinciden.

ZIP en Descargas: `velocentum-bloque-visual-3-revision.zip`, con
`docs/`, `pdfs/`, `rasters/` (todas las páginas, ambos perfiles),
`web/`, `comparativas/`, `estados/`, `exportacion/`, **`roadmap/`** y
`manifest.txt`. Verificalo con `unzip -t` y declará el conteo por
carpeta. Las ocho carpetas deben existir y ninguna vacía.

═══════════════════════════════════════════════════════════════════
8 · AUTONOMÍA Y CONDICIONES DE DETENCIÓN
═══════════════════════════════════════════════════════════════════

Podés trabajar de forma autónoma y prolongada. El checkpoint del PASO 1
es obligatorio pero NO bloqueante: reportalo y seguí.

DETENETE Y REPORTÁ únicamente ante:
  1. Un conflicto real entre el código y la documentación vigente que
     cambie qué hay que construir.
  2. Una regresión no resoluble dentro del alcance: algo que exigiría
     tocar el motor, relajar una prueba, alterar la salida de v1 o
     rebajar un umbral.
  3. Una decisión de producto nueva, no cubierta por la documentación.
     El caso más probable: si R-09 exige definir qué datos componen el
     funnel, o si R-07 exige fijar un umbral que el motor no expone.

No son motivo de detención: un inventario grande, una migración
tediosa, o una prueba nueva que falla y hay que corregir el prototipo.

Ante la duda entre continuar y detenerte: detenete.

═══════════════════════════════════════════════════════════════════
9 · HANDOFF
═══════════════════════════════════════════════════════════════════

Doce secciones numeradas, sin omitir ninguna:

 1. Rama, HEAD local y remoto, commit candidato de los artefactos.
 2. `git status --short`.
 3. `git diff --stat` contra 82bb66e.
 4. Aislamiento: archivos tocados; qué se tocó de v1 y la prueba de que
    su salida no cambió.
 5. Resultado del PASO 0 y del inventario del PASO 1.
 6. Ítem 1: puntos renombrados, pruebas actualizadas, y la verificación
    de que cada aserción tocada sigue fallando al revertir.
 7. Ítems 3 y 4: qué se construyó de R-09 y R-07, qué quedó documentado
    y por qué.
 8. Inspección página por página de las piezas nuevas.
 9. Conteo de pruebas sin doble suma: 765 + 1 de línea base; V1-V4
    nuevas; total final. Typecheck y build.
10. Conteo de páginas documento por documento contra el Bloque 3, con
    toda diferencia explicada.
11. Auditoría interna: sobre qué HEAD corrió cada ronda, veredicto, y
    confirmación de que el push lo hiciste vos, después del APROBADO.
12. Los 20 criterios, uno por uno, con veredicto. Más decisiones
    pendientes nuevas y lo que quedó sin resolver.

═══════════════════════════════════════════════════════════════════
10 · RESTRICCIONES FINALES
═══════════════════════════════════════════════════════════════════

Al terminar el handoff y el ZIP, DETENETE para revisión humana.

No promuevas v2 sobre v1. No conectes v2 a la interfaz.
No modifiques base, migraciones, secretos ni producción.
No integres a `main`. No publiques. No despliegues.
No avances a la fase 14, a staging ni a publicación.
No amplíes el alcance.

Si algo de este prompt entra en conflicto con el código o con los
documentos de `docs/`, NO elijas por tu cuenta: detenete y reportá.

FIN DEL PROMPT — BLOQUE VISUAL 3
