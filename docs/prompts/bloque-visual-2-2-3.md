<!-- Ejecutado desde 5e2edc9, cerrado en 7caa9bb. Texto original sin modificar. -->

BLOQUE VISUAL 2.2.3 — RENDERIZADO EN DOS PASADAS PARA LA MARCA DE CONTINUACIÓN

═══════════════════════════════════════════════════════════════════
CONTEXTO
═══════════════════════════════════════════════════════════════════

Repositorio: maticosenza/velocentum-diagnostico-web
Rama: feat/noche-continuacion — trabajar únicamente acá.
Punto de partida: commit local `5e2edc9`, YA AUTORIZADO PARA PUSH por la
auditoría externa. Si todavía no lo pusheaste, hacelo ANTES de empezar
esta ronda, y reportá el HEAD remoto resultante.
Línea base: 694 pruebas aprobadas + 1 todo, typecheck y build limpios.

La auditoría externa de la ronda 2.2.2 dio APROBADO CON RESERVA.

Verificado y cerrado, NO hay que rehacerlo:
  - Corrección A restaurada en las 16 combinaciones caso/perfil de
    propuesta: encabezado "Contribución incremental proyectada" y cifra
    principal presentes en las 16; frase puente de C-07 presente en 14 y
    correctamente ausente en las 2 de s4 por margen negativo;
  - conteo de páginas 325, con las 12 diferencias respecto de la ronda
    anterior explicadas una por una;
  - cero placeholders, cero páginas con cuerpo vacío, cero repeticiones
    de nombre de escenario en tarjetas que caben enteras;
  - tinta plena A4 máximo 13,4% sobre 158 páginas;
  - la investigación de provenance de A.1, que demostró que el código
    nunca perdió la sección y que los PDFs del paquete 2.2.1 no eran
    reproducibles desde su HEAD.

Queda UN residual: la marca de continuación está mal ubicada. Esta ronda
corrige eso y nada más.

═══════════════════════════════════════════════════════════════════
AUTORIZACIÓN EXPRESA: RENDERIZADO EN DOS PASADAS
═══════════════════════════════════════════════════════════════════

La auditoría externa AUTORIZA el renderizado en dos pasadas, con estos
límites, que son parte del alcance y no negociables:

  L1 · Solo dentro de `velocentum-v2`. No toca v1, ni el dominio, ni
       `src/lib/`, ni los fixtures canónicos.
  L2 · La pasada 1 renderiza el documento sin marcas de continuación, y
       su ÚNICO producto es un mapa de paginación real: qué bloque de
       qué tarjeta cae en qué página. No produce el PDF final.
  L3 · La pasada 2 renderiza el documento definitivo consumiendo ese
       mapa. El PDF que se entrega es siempre el de la pasada 2.
  L4 · El mapa de paginación se obtiene MIDIENDO la salida de la pasada
       1, no estimando alturas ni consultando mecanismos internos no
       documentados de `@react-pdf/renderer`. Las dos vías que la ronda
       2.2.2 descartó con evidencia —`render`-prop con `subPageNumber`, y
       heurístico estático de altura— siguen prohibidas.
  L5 · El resultado debe ser determinístico: dos ejecuciones seguidas
       sobre el mismo contexto producen PDFs idénticos. Verificalo por
       hash sobre los 48 PDFs, dos corridas consecutivas.
  L6 · El costo de la segunda pasada es aceptable. No optimices a costa
       del determinismo.
  L7 · Si la pasada 1 y la pasada 2 producen paginaciones distintas
       —porque agregar la marca cambia el alto y desplaza el quiebre—,
       resolvelo reservando el espacio de la marca también en la pasada
       1, de modo que las dos pasadas paginen igual. Si aun así no
       converge, DETENETE y reportá: no itereres pasadas indefinidamente.

═══════════════════════════════════════════════════════════════════
PASO 0 — VERIFICACIÓN INICIAL
═══════════════════════════════════════════════════════════════════

Reportá rama, HEAD local y remoto, `git status --short`, y el resultado
de suite, typecheck y build. Debe dar 694 + 1 todo.
Confirmá que `5e2edc9` está pusheado y que HEAD local y remoto coinciden.
Si algo difiere, DETENETE y reportá.

═══════════════════════════════════════════════════════════════════
PROHIBICIONES ABSOLUTAS
═══════════════════════════════════════════════════════════════════

- No modificar el dominio, `src/lib/`, fixtures canónicos ni v1.
- No modificar, eliminar ni relajar ninguna prueba existente.
- No promover v2 sobre v1. No conectar v2 a la interfaz.
- No implementar el bloqueo de exportación: es Bloque 3 funcional.
- No tocar E-05, E-07, E-08, E-09, E-16, E-18, C-02, C-03, C-04, C-08,
  R-07, R-09.
- No tocar base, migraciones, secretos ni producción.
- No integrar a main. No publicar. No desplegar.
- No avanzar al Bloque 3 funcional, al Bloque Visual 3 ni a la fase 14.
- No rediseñar: la dirección visual de v2 está aprobada.
- No volver a intentar las dos vías descartadas en la ronda 2.2.2.

═══════════════════════════════════════════════════════════════════
EL DEFECTO
═══════════════════════════════════════════════════════════════════

La marca `ESCENARIO (CONTINUACIÓN)` está anclada al bloque "Supuestos"
en vez de a la continuación misma. Cuando el quiebre real cae antes
—dentro de las palancas o dentro de la tabla mensual— la marca aparece
en el medio o al pie de la página, no a la cabeza.

Alcance medido sobre los 48 PDFs de la ronda 2.2.2: 24 páginas
afectadas, en 12 documentos de proyección, ambos perfiles.

Peor caso, y el que justifica esta ronda:
  `1-marketplace-fuerte-tienda-floja/proyeccion_90d-impresion.pdf`
  página 6 de 8.
  La página abre con los tres KPI de BASE —$ 8.066.568, $ 21.684.325,
  $ 436.637— SIN ninguna etiqueta de escenario. La marca
  "BASE (CONTINUACIÓN)" aparece recién en la línea 49 de 56, cerca del
  pie. Y en la misma página, más abajo, empieza la tarjeta POTENCIAL,
  que SÍ está etiquetada.
  Consecuencia: un lector que entra por esa página ve un único nombre de
  escenario —POTENCIAL— y tres cifras sin etiquetar arriba. La
  contribución de BASE ($ 8.066.568) y la de POTENCIAL ($ 9.026.875) son
  cercanas en magnitud, así que la atribución errónea es plausible y no
  es detectable por el lector.

Los números son correctos. Lo que falla es la etiqueta, y falla en el
punto de entrada a la página.

═══════════════════════════════════════════════════════════════════
QUÉ HAY QUE LOGRAR
═══════════════════════════════════════════════════════════════════

En toda página que continúe una tarjeta de escenario desde la página
anterior, la marca de identidad debe ser el PRIMER elemento de contenido
después del encabezado de sección, sea cual sea el bloque que se retoma:
KPIs, tabla mensual, palancas o supuestos.

Y se mantiene lo ya conseguido: ninguna tarjeta que quepa entera en una
página repite su propio nombre (D-2 / Corrección 2 de la ronda 2.2.1).

Las dos condiciones son simultáneas. Una solución que arregle la primera
y rompa la segunda no sirve: es exactamente la regresión que la ronda
2.2.2 encontró y revirtió.

═══════════════════════════════════════════════════════════════════
SECUENCIA
═══════════════════════════════════════════════════════════════════

PASO 1 — INVENTARIO (sin modificar nada)
  Documentá, con archivo y línea: dónde se compone hoy la tarjeta de
  escenario en el renderer PDF de v2; dónde se emite la marca; y cuál es
  el punto exacto donde se podría inyectar el mapa de paginación.
  Reportá antes de seguir.

PASO 2 — MECANISMO DE DOS PASADAS
  Implementalo según L1 a L7. Documentá en
  `docs/visual/contrato-composicion-v2.md` una sección nueva que
  describa: cómo se obtiene el mapa, qué contiene, cómo lo consume la
  pasada 2, y la garantía de determinismo.

PASO 3 — GENERACIÓN Y VERIFICACIÓN
  Regenerá los 48 PDFs y TODOS sus rásters, los dos perfiles.
  Inspeccioná una por una las 24 páginas que hoy están afectadas, más
  las páginas donde una tarjeta cabe entera, para confirmar que no
  aparecieron marcas espurias.

PASO 4 — PRUEBAS
  U1 · en toda página de continuación, la marca de identidad es el
       primer elemento de contenido tras el encabezado de sección;
  U2 · ninguna tarjeta que quepa entera repite su propio nombre
       (refuerza R2, no la reemplaza);
  U3 · determinismo: dos corridas consecutivas producen los 48 PDFs con
       hash idéntico;
  U4 · el mapa de paginación de la pasada 1 coincide con la paginación
       real de la pasada 2 en los 48 documentos.
  Ninguna prueba existente se modifica, elimina ni relaja.
  Conteo sin doble suma: línea base 694 + 1 todo; T1, R1-R3, Q1-Q6 y
  P1-P10 ya están incluidas dentro de esas 694; U1-U4 son las únicas
  nuevas.

═══════════════════════════════════════════════════════════════════
CRITERIOS DE ACEPTACIÓN
═══════════════════════════════════════════════════════════════════

 1. Las 694 + 1 todo pasan sin modificarse.
 2. Typecheck limpio y build exitoso.
 3. v1, dominio, `src/lib/` y fixtures canónicos fuera del diff.
 4. U1 a U4 pasan; todas las pruebas previas siguen pasando sin
    relajarse.
 5. Cero páginas de continuación con la marca fuera de la cabecera, en
    los 48 PDFs y en los dos perfiles.
 6. Cero marcas espurias en tarjetas que caben enteras.
 7. Determinismo verificado por hash, dos corridas.
 8. Conteo de páginas documento por documento contra la ronda 2.2.2, con
    toda diferencia explicada. Si la marca desplaza un quiebre y agrega
    una página, es aceptable siempre que esté explicado.
 9. Ninguna página A4 sobre el 25% de tinta plena.
10. Cero placeholders, `undefined`, `NaN`, `null` o enums crudos.
11. La sección de cifra principal de la propuesta sigue presente en las
    16 combinaciones caso/perfil (no revertir la Corrección A).
12. Nada fuera de alcance modificado. Nada inventado. Ningún umbral
    relajado.

═══════════════════════════════════════════════════════════════════
CLÁUSULA DE CORTE
═══════════════════════════════════════════════════════════════════

Esta ronda tiene un límite duro. Si al cabo de DOS rondas completas de
auditoría interna el mecanismo de dos pasadas no converge —no es
determinístico, no generaliza a los 48 documentos, o introduce una
regresión que no se puede aislar— DETENETE, revertí todo cambio de
código, y reportá.

En ese caso el residual se acepta como limitación documentada y la ronda
visual se cierra igual. No abras una tercera vía por tu cuenta ni
sigas iterando. Un label mal ubicado no justifica bloquear el proyecto
de forma indefinida.

═══════════════════════════════════════════════════════════════════
AUDITORÍA, COMMIT Y PUSH
═══════════════════════════════════════════════════════════════════

  A) Implementar y verificar el árbol de trabajo.
  B) Suite, typecheck, build y generación completa de artefactos.
  C) Crear un COMMIT CANDIDATO LOCAL, sin push.
  D) Auditoría interna COMPLETA, de solo lectura, contra ese HEAD
     candidato exacto. Verifica: aislamiento del diff; que U1-U4 tengan
     prueba y página de evidencia; determinismo por hash; que la
     Corrección A no se haya revertido; conteo de páginas contra la
     ronda 2.2.2 con toda diferencia explicada; los 12 criterios uno por
     uno.
  E) Si aparecen correcciones: aplicarlas, incorporarlas al commit
     candidato, y volver a D con la auditoría COMPLETA sobre el nuevo
     HEAD.
  F) Máximo DOS rondas. Después aplica la cláusula de corte.
  G) Únicamente tras veredicto APROBADO, push a `feat/noche-continuacion`.
  H) Comprobar que HEAD local y remoto coinciden, y reportarlo.

Push únicamente a `feat/noche-continuacion`. Nunca a main. Nunca merge,
rebase sobre main ni tag.

═══════════════════════════════════════════════════════════════════
HANDOFF — DIEZ SECCIONES NUMERADAS
═══════════════════════════════════════════════════════════════════

 1. Rama, HEAD local y remoto, y confirmación de que `5e2edc9` quedó
    pusheado antes de empezar.
 2. `git status --short`.
 3. `git diff --stat` contra `5e2edc9`.
 4. Aislamiento: archivos tocados y afirmación explícita.
 5. Inventario del paso 1, con archivo y línea.
 6. Cómo funciona el mecanismo de dos pasadas, y cómo se garantiza el
    determinismo. Ruta de la sección nueva del contrato.
 7. Estado del residual: cuántas de las 24 páginas afectadas quedaron
    resueltas, con evidencia página por página. Si la cláusula de corte
    se activó, decilo con todas las letras y explicá qué falló.
 8. Conteo de pruebas sin doble suma: línea base 694 + 1; pruebas
    previas ya incluidas; U1-U4 nuevas; total final. Typecheck y build.
 9. Conteo de páginas documento por documento contra la ronda 2.2.2, con
    toda diferencia explicada, y confirmación de que la Corrección A
    sigue intacta en las 16 combinaciones.
10. Auditoría interna: sobre qué HEAD corrió cada ronda, cuántas hubo,
    veredicto, y confirmación de que el push fue posterior al APROBADO.

ZIP de revisión en Descargas:
`velocentum-bloque-visual-2-2-3-revision.zip` con los 48 PDFs, TODOS sus
rásters —los dos perfiles, no solo impresión—, los montajes antes/después
de las 24 páginas afectadas, el handoff y un `manifest.txt`. Verificalo
con `unzip -t` y declará el conteo de archivos y de páginas.

REGLA DE REPRODUCIBILIDAD, obligatoria a partir de esta ronda: todos los
PDFs del ZIP deben generarse desde el commit candidato en un `git
worktree` limpio, nunca desde el árbol de trabajo. La ronda 2.2.1
entregó artefactos que no se pudieron reproducir desde su propio HEAD;
eso no puede repetirse. Declará en el handoff desde qué worktree y qué
commit se generó cada artefacto.

═══════════════════════════════════════════════════════════════════
RESTRICCIONES FINALES
═══════════════════════════════════════════════════════════════════

Al terminar el handoff y el ZIP, DETENETE para revisión humana.

No promuevas v2 sobre v1. No conectes v2 a la interfaz.
No implementes el bloqueo de exportación.
No modifiques base, migraciones, secretos ni producción.
No integres a main. No publiques. No despliegues.
No avances al Bloque 3 funcional, al Bloque Visual 3 ni a la fase 14.
No amplíes el alcance.

Si algo de este prompt entra en conflicto con el código, con los
documentos de `docs/visual/` o con una instrucción previa, NO elijas por
tu cuenta: detenete y reportá el conflicto.

FIN DEL PROMPT — BLOQUE VISUAL 2.2.3
