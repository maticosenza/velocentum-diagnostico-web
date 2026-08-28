<!-- Ejecutado desde 7d3883a. Texto original sin modificar. -->
FASE 14 — RONDA CORRECTIVA (14.1)

CONTEXTO
Rama: feat/noche-continuacion. HEAD esperado: 7d3883a.
La auditoría externa dio APROBADO CON CORRECCIONES.

Verificado y cerrado, NO rehacer: el bloqueo de exportación funciona en
la interfaz real con el copy literal; el interruptor quedó en "v1"
inactivo; v1 intacto; el bug del import Node-only encontrado y corregido;
la evidencia de flujo real con Snake Store y Titan.

DECISIÓN HUMANA SOBRE E-19 — TOMADA
Vía (a): bajar el umbral. Umbral nuevo: 50% para ambos perfiles.
Motivo: la mediana real es 52,7%, así que un umbral en 50 deja que la
mitad del universo lo cumpla y sigue siendo un gate genuino. 45 sería
demasiado permisivo.
El piso de 25% se mantiene, pero cambia de naturaleza: deja de ser
corrección obligatoria de esta fase y pasa a ser criterio de entrada de
un futuro rediseño de paginación (la vía b que descartaste por alcance).

Tu argumento arquitectónico sobre E-20 se acepta: en react-pdf una
sección nunca comparte página con otra, así que una sección con poco
contenido real ocupa una página entera con vacío, y no hay
reordenamiento que lo arregle sin inflar tipografía o inventar
contenido. E-20 no es una categoría distinta de E-19 — es el mismo
problema en su forma más aguda. La auditoría externa se equivocó al
separarlos.

CORRECCIONES

C-1 · APLICAR EL UMBRAL DE 50%
Actualizá contrato-composicion-v2.md sección 5.1: umbral 50% para
pantalla e impresión, con la justificación (mediana real 52,7%,
distribución sin quiebre natural, incompatibilidad estructural entre el
modelo una-sección-por-página y un umbral alto).
Actualizá las pruebas de ocupación al umbral nuevo.
Reportá cuántas páginas quedan bajo 50% con el umbral aplicado, y
reconciliá la lista de excepciones de 5.8: las que ahora cumplen salen
de la lista.

C-2 · RECLASIFICAR E-19 Y E-20
En auditoria-visual-2026-08-23.md: E-19 pasa a RESUELTO con la decisión
tomada y el umbral nuevo. E-20 pasa de "corrección obligatoria fase 14"
a "criterio de entrada del rediseño de paginación", con la
justificación arquitectónica que ya escribiste.
Registrá un hallazgo nuevo, E-21: el modelo una-sección-por-página de
react-pdf hace que secciones con poco contenido real ocupen una página
entera. Es la causa estructural de E-19 y E-20. Su resolución exige
fusionar secciones enteras — un rediseño, no un ajuste — y queda fuera
de alcance hasta que se decida abordarlo.

C-3 · DESCARGA DE PDF A FUNCIÓN DE SERVIDOR — BLOQUEANTE PARA ACTIVAR
Verifiqué los siete PDFs de interfaz/pdfs-descargados/: CERO marcas de
continuación. El pipeline de dos pasadas es Node-only y no corre en el
navegador, así que la descarga de la interfaz usa una sola pasada.

Consecuencia: activar v2 hoy entregaría documentos con el defecto que
resolvimos en el bloque 2.2.3 — un lector abre la página 6 y no sabe a
qué escenario pertenecen los números. Los 54 PDFs que auditamos durante
nueve bloques NO son los que produce la interfaz.

Mové la generación y descarga de PDF a una función de servidor, de modo
que el pipeline de dos pasadas corra también desde la interfaz.

Criterio: los PDFs descargados desde la interfaz son byte a byte
idénticos a los que produce el pipeline de dos pasadas para el mismo
caso, documento y perfil. Verificalo por hash sobre al menos Snake Store
y Titan, los tres documentos, ambos perfiles.

Si mover la descarga al servidor exige una decisión de arquitectura que
no está en la documentación —dónde vive la función, cómo se autentica,
qué pasa si tarda— DETENETE y reportá antes de implementar.

C-4 · REVALIDAR POR FLUJO REAL
Con C-3 resuelto, repetí la validación del ítem 5: Snake Store y Titan
por la interfaz, los tres documentos, ambos perfiles, con el interruptor
en v2. Esta vez los PDFs descargados tienen que coincidir por hash con
los del pipeline.
Al terminar, devolvé el interruptor a "v1".

PRUEBAS
  Y1 · el umbral de ocupación es 50% y las pruebas lo verifican;
  Y2 · los PDFs generados desde el punto de la interfaz son idénticos
       por hash a los del pipeline de dos pasadas, mismo caso/documento/
       perfil;
  Y3 · toda página de continuación tiene su marca, también en los PDFs
       generados por el camino de la interfaz.
Ninguna prueba existente se modifica ni se relaja.

CRITERIOS DE ACEPTACIÓN
 1. La línea base pasa sin que ninguna prueba se haya relajado.
 2. Typecheck limpio y build exitoso.
 3. Y1 a Y3 pasan.
 4. C-1 a C-4 resueltas, cada una con evidencia.
 5. El interruptor sigue en "v1" por defecto. v1 intacto.
 6. Los PDFs de la interfaz coinciden por hash con los del pipeline.
 7. Sin regresiones: conteo de páginas contra 7d3883a, con toda
    diferencia explicada.
 8. Nada inventado. Ningún umbral relajado para conseguir verde — el
    cambio de 70/65 a 50 es una decisión humana documentada, no una
    relajación para pasar una prueba.

SECUENCIA
Implementar → suite, typecheck, build, artefactos desde worktree limpio
del candidato → commit candidato local sin push → auditoría interna
COMPLETA de solo lectura contra ese HEAD → si hay correcciones,
aplicalas VOS y relanzá la auditoría completa → máximo dos rondas →
push hecho por VOS tras el veredicto APROBADO → verificar HEAD local =
remoto.

ZIP: velocentum-fase-14-1-revision.zip, con las mismas carpetas más
interfaz/ conteniendo los PDFs descargados y la comparación por hash.

HANDOFF: doce secciones, mismo formato que la fase 14, agregando el
resultado de la comparación por hash y el conteo de páginas bajo el
umbral nuevo.

RESTRICCIONES
No actives el reemplazo. No elimines v1. No integres a main. No
publiques. No despliegues. No avances a staging. No amplíes el alcance.

FIN DEL PROMPT — FASE 14.1
