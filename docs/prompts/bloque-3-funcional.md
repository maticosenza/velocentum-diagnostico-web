<!-- Ejecutado desde 7caa9bbb, cerrado en 318c2ac. Texto original sin modificar. -->

BLOQUE 3 FUNCIONAL — CONTRATO, ESTADOS Y CONTROLES DE EXPORTACIÓN

═══════════════════════════════════════════════════════════════════
1 · CONTEXTO Y HEAD ESPERADO
═══════════════════════════════════════════════════════════════════

Repositorio: maticosenza/velocentum-diagnostico-web
Rama: feat/noche-continuacion — trabajar únicamente acá.
HEAD esperado al iniciar: 7caa9bbb3025bb195689f67331f915f9cdb59434
Línea base esperada: 718 pruebas aprobadas + 1 todo (719), typecheck
limpio, build exitoso, árbol limpio.

La ronda visual está CERRADA. El Bloque Visual 2.2.3 fue APROBADO por
auditoría externa sobre artefactos crudos: 48 PDFs, 325 páginas, 325
rásters, cero continuaciones sin marca en cabecera, cero marcas
espurias, cero placeholders, cero páginas vacías, tinta A4 muy por
debajo del umbral, Corrección A intacta en las 16 combinaciones
caso/perfil de propuesta, y determinismo verificado por hash.

Estado del proyecto:
  - `velocentum-v2` (plantillas, renderers PDF y web, capa semántica
    compartida, mecanismo de continuación en dos pasadas) está validado
    sobre los seis escenarios canónicos más un caso mayorista y uno
    mixto.
  - `velocentum-v1` sigue intacto y es lo que produce producción.
  - v2 NO está conectado a la interfaz ni al botón de descarga.
  - La dirección visual de v2 está aprobada y NO se rediseña acá.

Este bloque es FUNCIONAL: contrato de estados, semántica, controles de
exportación y los hallazgos de contrato que quedaron fuera del alcance
visual. No es un bloque de diseño.

═══════════════════════════════════════════════════════════════════
2 · FUENTES DE VERDAD
═══════════════════════════════════════════════════════════════════

Leelas TODAS antes de escribir una línea de código. Este prompt no las
reemplaza ni las resume.

  docs/visual/auditoria-visual-2026-08-23.md
    Fuente de verdad de la auditoría. 38 identificadores: E-01 a E-18,
    C-01 a C-08, R-01 a R-12. Decisiones D1 a D8.
  docs/visual/contrato-estados.md
  docs/visual/inventario-componentes.md
  docs/visual/perfiles-pantalla-a4.md
  docs/visual/wireframes.md
  docs/visual/matriz-hallazgos.md
  docs/visual/contrato-composicion-v2.md
    Incluidas la sección de dirección de arte y la de continuación
    medida en dos pasadas.
  Handoffs de los Bloques Visuales 1, 2, 2.1, 2.2, 2.2.1, 2.2.2 y 2.2.3.

Si un documento contradice a otro, gana el más reciente, y lo reportás.
Si este prompt contradice a un documento, DETENETE y reportá el
conflicto: no elijas por tu cuenta.

═══════════════════════════════════════════════════════════════════
3 · DECISIONES CERRADAS (entrada, no están en discusión)
═══════════════════════════════════════════════════════════════════

3.1 · D4 — DOS EJES DE ESTADO, copy exacto, sin reformular

  Eje 1 — Origen de la evidencia:
    verificado              → "Validado con evidencia del período"
    declarado               → "Informado por el cliente; pendiente de
                               validación documental"
    estimado_configuracion  → "Referencia configurada; no validada con
                               datos del cliente"
    no_disponible           → "No contamos con este dato"
    no_aplica               → "No corresponde a este negocio o canal"

  Eje 2 — Disponibilidad del cálculo:
    disponible              → "Calculado con los datos disponibles"
    retenido                → "No se muestra hasta validar: [motivo]"
    evidencia_faltante      → "Falta [dato] para realizar este cálculo"
    no_aplica               → "Este cálculo no corresponde a este caso"

  Los dos ejes son independientes. Ningún estado puede distinguirse
  únicamente por color.

3.2 · DHB-1 — INVERSIÓN DECLARADA EN CERO (decisión humana cerrada)

  Una inversión $0 declarada CONTINÚA EXISTIENDO como dato declarado: no
  desaparece, no se oculta, y su origen en el Eje 1 es `declarado`.

  Los ratios cuyo denominador sea ese cero quedan `no_aplica` en el Eje
  2 — no `evidencia_faltante` y no `retenido`. La razón es que el ratio
  es matemáticamente no formable, no que falte un dato.

  Aplica a MER tienda propia, MER marketplace, ROAS Product Ads y todo
  ratio análogo cuyo denominador sea una inversión declarada en cero.

3.3 · DHB-2 — PROPUESTA CUALITATIVA CON MARGEN NEGATIVO (cerrada)

  Cuando el margen invalida el cálculo, la propuesta se emite igual, en
  modo cualitativo, y contiene exactamente estas siete piezas:

    1. alerta clara de margen negativo;
    2. explicación de por qué no se publican promesas económicas;
    3. hallazgos verificables que no dependan del margen;
    4. prioridades cualitativas y servicios compatibles del catálogo;
    5. plan de validación de datos y medición;
    6. próximos pasos;
    7. estado de la selección comercial: pendiente o confirmada.

  NO debe mostrar ahorro, retorno, contribución proyectada ni ningún
  resultado económico prometido mientras el margen invalide el cálculo.

3.4 · DHB-3 — ROADMAP 30/60/90 (cerrada)

  Se completa. Se genera DETERMINÍSTICAMENTE desde los hallazgos, las
  prioridades y los servicios de la selección comercial confirmada.

  No inventa servicios, tareas, precios ni resultados. Todo lo que
  aparece en el roadmap tiene que poder trazarse a un hallazgo, a una
  prioridad o a un servicio del catálogo cerrado.

  Sin selección comercial confirmada puede existir una vista previa
  interna rotulada como pendiente, pero la exportación de la propuesta
  permanece bloqueada.

3.5 · D1 — BLOQUEO DE EXPORTACIÓN

  Sin selección comercial confirmada NO se puede emitir ni descargar un
  PDF de propuesta para cliente. La vista previa interna existe,
  rotulada "Selección comercial pendiente", y queda bloqueada para
  exportación.

3.6 · D5 — MARGEN NEGATIVO

  Produce simultáneamente: alerta crítica visible en el diagnóstico;
  retención de toda proyección que dependa del margen; conservación de
  los hallazgos que NO dependan del margen; y la propuesta cualitativa
  de DHB-2. Nunca bloquea el documento entero ni oculta el problema.

3.7 · D7 — TERMINOLOGÍA

  Multicanal = combinación de tienda propia, Mercado Libre u otros
  canales de venta.
  Mixto = operación minorista con módulo mayorista activado.
  Nunca uses "mixto" como sinónimo de "multicanal".

3.8 · CATÁLOGO COMERCIAL CERRADO, seis servicios, sin excepciones

  Meta Ads · Google Ads · Product Ads · Desarrollo y optimización web ·
  Planificación y creación de contenido · Diseño de marca.

  El sistema nunca inventa precios ni servicios fuera de esta lista.

3.9 · DA-1 a DA-4 — RATIFICADAS

  DA-1 · El Eje 1 (`Evidencia<T>`) se muestra como chip compacto en las
         tarjetas de `metric-grid` y en el bloque `coverage`, junto al
         valor, nunca al final del documento. No se muestra en
         `findings` ni en `scenarios` en este bloque.
  DA-2 · Un hallazgo puede mapear a varios servicios del catálogo.
         `servicio` deja de ser texto libre y pasa a ser una lista de
         referencias al catálogo cerrado. La cadena concatenada "Web
         e-commerce y Meta Ads" se convierte en dos referencias, no en
         un servicio nuevo.
  DA-3 · El título "Funnel, retención y hallazgos priorizados" se
         renombra para que describa lo que la página efectivamente
         contiene. Construir el funnel y el bloque de retención es
         trabajo del Bloque Visual 3.
  DA-4 · Se incluye la sección de fortalezas, poblada de forma
         determinística desde el motor con las métricas que superan sus
         umbrales de referencia. Nunca redactada libremente ni
         inventada. Si el motor no expone hoy una noción de "métrica
         sana", declaralo y dejá R-07 sin resolver en vez de fabricar el
         criterio.

3.10 · NO QUEDA NINGUNA DECISIÓN HUMANA BLOQUEANTE ABIERTA

  Si durante la implementación aparece una decisión de producto que no
  esté cubierta por esta sección ni por la documentación vigente,
  DETENETE y reportala. No la resuelvas por tu cuenta.

═══════════════════════════════════════════════════════════════════
4 · ALCANCE
═══════════════════════════════════════════════════════════════════

4.1 · INCLUIDO

  Contrato y dominio:
    C-02 · separar los dos ejes en el modelo y hacerlos visibles.
    C-03 / E-09 · `servicio` deja de ser texto libre; referencia al
           catálogo cerrado de seis (DA-2).
    E-05 · `no_aplica` deja de listarse como dato faltante.
    E-16 · un cero real declarado se publica como dato declarado; los
           ratios sobre ese cero quedan `no_aplica` (DHB-1).
    E-18 · roadmap 30/60/90 determinístico (DHB-3).
    C-04 / D1 · bloqueo real de exportación.
    C-08 · vista previa del perfil A4 en el renderer web.
    E-07 · confianza calculada por escenario, no heredada del documento;
           la nota de reinversión de ahorro publicitario solo aparece si
           hay ahorro publicable.
    E-08 · `findings` de la propuesta deja de ser el mismo conjunto que
           el del diagnóstico: selección y resumen, no repetición.
    R-07 · fortalezas (DA-4).
    R-09 · título (DA-3).
    D5 / DHB-2 · propuesta cualitativa con margen negativo.

  Interfaz:
    Estados, validaciones y mensajes visibles derivados de lo anterior.
    Generación, descarga y bloqueo de documentos.

  Documentación:
    Reconciliación del roadmap general del proyecto (sección 5).

4.2 · EXCLUIDO

  - Rediseño visual de cualquier tipo. La dirección de arte de v2 está
    aprobada. Solo se ajusta composición donde un cambio funcional lo
    haga inevitable, y se documenta.
  - Promoción de v2 sobre v1. Este bloque escribe los criterios; no los
    ejecuta.
  - Bloque Visual 3, fase 14, staging y publicación.
  - Cualquier cambio de fórmula, rampa o regla de cálculo del motor de
    escenarios.
  - Nuevos escenarios o fixtures canónicos.

═══════════════════════════════════════════════════════════════════
5 · RECONCILIACIÓN DEL ROADMAP GENERAL
═══════════════════════════════════════════════════════════════════

Esto se hace en el PASO 1, antes de tocar código.

  5.1 Localizá el archivo de roadmap general vigente del proyecto.
      Buscá en `docs/` y en la raíz: planes de fases, planes de bloques,
      documentos de evolución, cualquier cosa que describa el recorrido
      completo.

  5.2 Según lo que encuentres:
      - Si existe UNO inequívoco: actualizalo. No crees otro documento
        competidor.
      - Si existen VARIAS versiones: determiná cuál es la vigente,
        actualizala, y marcá las anteriores con un encabezado explícito
        "HISTÓRICO — superado por <ruta del vigente>". No las borres.
      - Si NO existe una fuente inequívoca: creá una sola en
        `docs/roadmap-general.md`, indicando en su primera línea que
        reemplaza los planes parciales anteriores, y listando cuáles.

  5.3 El roadmap vigente debe registrar:
      - bloques finalizados, con su HEAD de cierre;
      - artefactos y ZIP de cada auditoría;
      - decisiones humanas cerradas (D1, D4, D5, D7, DHB-1/2/3,
        DA-1 a DA-4, catálogo de servicios);
      - residuales aceptados, si los hubiera;
      - dependencias entre etapas;
      - criterios de entrada y de salida de cada etapa;
      - estado actual;
      - próximos pasos;
      - prohibiciones de integración y publicación;
      - plan de reversión.

  5.4 Secuencia restante, que el roadmap debe reflejar sin alterar:
      1. Bloque 3 funcional  ← este bloque
      2. Bloque Visual 3
      3. Fase 14: integración controlada
      4. Staging/Lovable y QA completo
      5. Candidato de publicación
      6. Aprobación humana
      7. Prompt independiente de publicación

  5.5 Al cierre de este bloque, actualizá el roadmap con el resultado
      real: HEAD de cierre, artefactos, y estado de cada hallazgo.

═══════════════════════════════════════════════════════════════════
6 · PROHIBICIONES ABSOLUTAS
═══════════════════════════════════════════════════════════════════

  - No modificar fórmulas, rampas ni reglas de cálculo. Los cambios de
    tipo pueden tocar firmas, nunca resultados numéricos.
  - No modificar `src/lib/fixtures-escenarios-demo.ts` ni ningún fixture
    canónico. Los casos mayorista y mixto siguen siendo contextos de
    prueba del prototipo.
  - No modificar `velocentum-v1` ni los renderers v1, salvo lo
    estrictamente forzado por un cambio de tipo del dominio; en ese caso
    el cambio debe ser mecánico, sin alterar su salida, y documentado
    archivo por archivo.
  - No modificar, eliminar ni relajar ninguna prueba existente. Si una
    se rompe, es señal: revertí y reportá.
  - No promover v2 sobre v1. No cambiar cuál plantilla usa producción.
  - No tocar base de datos, migraciones, secretos ni producción.
  - No integrar a `main`. No publicar. No desplegar.
  - No avanzar al Bloque Visual 3, a la fase 14, a staging ni a
    publicación.
  - No inventar cifras, servicios, precios ni resultados.
  - No parsear los strings de `motivos` para inferir un estado. El
    estado se decide en el call site, con un discriminador explícito.
  - No tomar decisiones de producto que no estén en la sección 3 ni en
    la documentación vigente.

═══════════════════════════════════════════════════════════════════
7 · SECUENCIA DE IMPLEMENTACIÓN
═══════════════════════════════════════════════════════════════════

PASO 0 · VERIFICACIÓN
  0.1 Rama, HEAD completo, `git status --short`. HEAD debe ser
      7caa9bbb3025bb195689f67331f915f9cdb59434.
  0.2 Suite, typecheck y build. Debe dar 718 + 1 todo. Declaralo: ese
      número es la referencia inamovible del bloque.
  0.3 Confirmá que existen los siete documentos de `docs/visual/`.
  Si algo no se cumple, DETENETE y reportá.

PASO 1 · INVENTARIO Y ROADMAP (sin modificar código)
  1.1 Reconciliación del roadmap según la sección 5.
  1.2 Inventario, con archivo y línea:
      a) todos los call sites que construyen un `ValorPublicable`, y
         para cada uno si su ausencia es "el dato de entrada no está" o
         "el cálculo está bloqueado por una regla";
      b) todos los call sites que construyen una `Evidencia`, y cuáles
         corresponderían a `estimado_configuracion`;
      c) todos los consumidores de `context.evidencia`;
      d) dónde se produce y se consume `hallazgo.servicio`, y el listado
         completo de strings distintos que hoy toma;
      e) el punto único donde se decide generar y exportar un documento;
      f) dónde se calcula `confianzaDocumento` y dónde se propaga a los
         escenarios;
      g) todo ratio cuyo denominador pueda ser una inversión declarada
         en cero (DHB-1);
      h) qué archivos de v1 quedarían forzados por un cambio de tipo.
  1.3 CHECKPOINT OBLIGATORIO, NO BLOQUEANTE. Reportá el inventario
      completo y el estado del roadmap antes de continuar. Si no
      encontrás discrepancias, conflictos documentales ni decisiones
      humanas nuevas, seguí de forma autónoma al PASO 2. Si encontrás
      cualquiera de las tres, DETENETE (ver sección 7.bis).

PASO 2 · CONTRATO FUNCIONAL
  Escribí `docs/funcional/contrato-bloque-3.md` con:
    - la matriz de estados antes/después de la sección 8, completada con
      el call site real de cada fila;
    - la regla de discriminación `retenido` vs `evidencia_faltante`,
      declarada explícitamente y decidida en el call site;
    - la regla de DHB-1: qué ratios, con qué denominador, pasan a
      `no_aplica`, y cómo se conserva el cero declarado;
    - el catálogo cerrado de seis servicios y el mapeo desde cada string
      libre actual;
    - la regla de bloqueo de exportación: qué documentos, en qué
      condición, con qué mensaje, y en qué punto del código vive;
    - la estructura de las siete piezas de la propuesta cualitativa
      (DHB-2) y qué queda explícitamente prohibido mostrar;
    - la regla de generación determinística del roadmap 30/60/90
      (DHB-3): qué lo puebla, desde qué fuentes, y qué trazabilidad debe
      tener cada ítem;
    - la regla de confianza por escenario;
    - el criterio de selección de `findings` para la propuesta (E-08);
    - la definición de "métrica sana" para fortalezas, si DA-4 procede;
    - los criterios de promoción de v2 sobre v1 (sección 14).
  CHECKPOINT OBLIGATORIO, NO BLOQUEANTE. Reportá el contrato funcional
  completo antes de implementar. Si no encontrás discrepancias,
  conflictos documentales ni decisiones humanas nuevas, seguí de forma
  autónoma al PASO 3. Si encontrás cualquiera de las tres, DETENETE
  (ver sección 7.bis).

PASO 3 · DOMINIO Y TIPOS
  En pasos pequeños, corriendo suite, typecheck y build después de cada
  uno. No acumules deuda entre sub-pasos.
    3.1 extender `ValorPublicable` con `evidencia_faltante`;
    3.2 extender `Evidencia` con `estimado_configuracion`;
    3.3 migrar cada call site según la matriz del PASO 2;
    3.4 DHB-1: ratios sobre inversión declarada en cero → `no_aplica`;
    3.5 `servicio` → lista de referencias al catálogo cerrado;
    3.6 confianza por escenario;
    3.7 `no_aplica` fuera de la sección de faltantes;
    3.8 roadmap 30/60/90 determinístico (DHB-3).

PASO 4 · CAPA SEMÁNTICA, RENDERERS E INTERFAZ
  4.1 la capa semántica compartida expone los nueve estados con el copy
      literal de D4. Ningún renderer define texto de estado por su
      cuenta.
  4.2 Eje 1 visible según DA-1.
  4.3 selección de `findings` para la propuesta (E-08).
  4.4 fortalezas (DA-4) y título (DA-3).
  4.5 propuesta cualitativa con margen negativo: las siete piezas de
      DHB-2, y la prohibición explícita de mostrar ahorro, retorno,
      contribución proyectada o promesas económicas.
  4.6 vista previa del perfil A4 en el renderer web (C-08).
  4.7 bloqueo de exportación (D1): el control vive en el punto único
      identificado en el PASO 1(e), no en el botón. Un bloqueo que solo
      desactiva un botón NO es un bloqueo.
  4.8 roadmap 30/60/90 renderizado en proyección y propuesta, con vista
      previa interna rotulada como pendiente cuando no hay selección
      comercial confirmada.
  La dirección visual de v2 NO se rediseña. Si un cambio funcional
  obliga a mover algo, documentalo.

PASO 5 · PRUEBAS — sección 10.
PASO 6 · ARTEFACTOS Y VERIFICACIÓN VISUAL RESIDUAL — secciones 12 y 15.
PASO 7 · AUDITORÍA, COMMIT, PUSH Y HANDOFF — secciones 15, 16 y 17.

═══════════════════════════════════════════════════════════════════
7.bis · AUTONOMÍA Y CONDICIONES DE DETENCIÓN
═══════════════════════════════════════════════════════════════════

Los checkpoints del PASO 1 y del PASO 2 son CONTROLES OBLIGATORIOS PERO
NO BLOQUEANTES. Tenés que producirlos, reportarlos y verificarlos, pero
podés continuar de forma autónoma si no encontrás nada de lo que sigue.

DETENETE Y REPORTÁ, sin continuar, únicamente ante:

  1. Un CONFLICTO REAL: el código contradice a la documentación vigente,
     o dos documentos vigentes se contradicen entre sí, o este prompt
     contradice a cualquiera de los dos, y la contradicción cambia qué
     hay que construir.
  2. Una REGRESIÓN NO RESOLUBLE dentro del alcance: algo se rompe y
     arreglarlo exigiría tocar el dominio de una forma no prevista,
     modificar una prueba existente, tocar v1 alterando su salida,
     relajar un umbral, o salirse del alcance de la sección 4.
  3. Una DECISIÓN DE PRODUCTO NUEVA: cualquier cosa que no esté resuelta
     por la sección 3 ni por la documentación vigente. El caso más
     probable es DA-4: si el motor no expone hoy una noción de "métrica
     sana", declaralo, dejá R-07 sin resolver y reportalo.

NO son motivo de detención: que el inventario sea más grande de lo
esperado, que el contrato tome más tiempo, que una migración sea
tediosa, o que una prueba nueva falle y tengas que corregir el
prototipo. Eso es trabajo, no bloqueo.

Ante la duda entre continuar y detenerte: detenete. Un reporte de más
cuesta minutos; una decisión de producto tomada por tu cuenta cuesta un
bloque entero.

═══════════════════════════════════════════════════════════════════
8 · MATRIZ DE ESTADOS ANTES / DESPUÉS
═══════════════════════════════════════════════════════════════════

Completala en el PASO 2 con el call site real de cada fila.

EJE 2 — disponibilidad del cálculo

  ANTES (`ValorPublicable.estado`)  →  DESPUÉS
  "calculado"                       →  disponible
  "no_aplica"                       →  no_aplica
  "retenido", causa: falta un campo →  evidencia_faltante
     de entrada                          "Falta [dato] para realizar
                                          este cálculo"
  "retenido", causa: regla de       →  retenido
     negocio (margen negativo,           "No se muestra hasta validar:
     dispersión alta, contradicción,      [motivo]"
     cobertura insuficiente,
     conservador no calculable)
  ratio con denominador = inversión →  no_aplica  (DHB-1)
     declarada en cero                   "Este cálculo no corresponde a
                                          este caso"

  El estado se decide EN EL CALL SITE, con un discriminador explícito.
  Está PROHIBIDO inferirlo parseando el string de `motivos`.

  Casos conocidos que hay que clasificar sí o sí:
    - "Faltan ventas atribuidas o inversión de Product Ads"
    - "Faltan facturación o inversión del perímetro de tienda propia"
    - MOTIVO_SIN_CONSERVADOR
    - MOTIVO_SIN_LIMITE_SUPERIOR
    - "El margen de contribución calculado es negativo…"
    - inversión declarada en cero → `no_aplica` por DHB-1

EJE 1 — origen de la evidencia

  ANTES (`Evidencia.estado`)        →  DESPUÉS
  "verificado"                      →  verificado
  "declarado"                       →  declarado
  "no_disponible"                   →  no_disponible
  "no_aplica"                       →  no_aplica
  (no existe)                       →  estimado_configuracion, para toda
                                       referencia que venga de
                                       configuración y no de datos del
                                       cliente

  Una inversión declarada en cero conserva origen `declarado` (DHB-1).

CONFIANZA
  ANTES: `confianzaDocumento` se propaga tal cual a los tres escenarios.
  DESPUÉS: cada escenario calcula su propia confianza a partir de sus
  propias magnitudes publicables. Un escenario sin una sola cifra
  publicable no puede llevar badge ALTA.

SERVICIOS
  ANTES: `hallazgo.servicio` es texto libre, admite combinaciones.
  DESPUÉS: lista de referencias al catálogo cerrado de seis. Ningún
  servicio nuevo.

═══════════════════════════════════════════════════════════════════
9 · PLAN DE COMPATIBILIDAD Y MIGRACIÓN
═══════════════════════════════════════════════════════════════════

  9.1 v1 sigue siendo lo que produce producción durante todo el bloque.
  9.2 Un cambio de tipo puede forzar cambios mecánicos en v1. Permitidos
      SOLO si no alteran su salida. Verificalo regenerando la salida de
      v1 antes y después y comparándola.
  9.3 v2 consume el modelo extendido y expone los nueve estados.
  9.4 La capa semántica compartida sigue siendo el único lugar donde se
      define el texto de estado y el formato numérico.
  9.5 Si un cambio funcional obliga a mover composición en v2, se
      documenta y se muestra en la verificación visual residual.
  9.6 Ninguna migración de datos, ninguna migración de base.

═══════════════════════════════════════════════════════════════════
10 · PRUEBAS OBLIGATORIAS
═══════════════════════════════════════════════════════════════════

Sobre el código nuevo y sobre v2. Ninguna prueba existente se modifica,
elimina ni relaja. Verifican el contrato del PASO 2, no describen el
resultado obtenido.

  S1 · los nueve estados existen en el tipo y cada uno produce el copy
       literal de D4, sin reformular.
  S2 · cobertura de la matriz del PASO 2, fila por fila: ningún
       `retenido` que corresponda a `evidencia_faltante` queda sin
       migrar.
  S3 · ningún estado se decide parseando `motivos`.
  S4 · ningún `no_aplica` aparece en la sección de datos faltantes.
  S5 · DHB-1: con inversión declarada en cero, el cero se publica como
       dato declarado y el ratio correspondiente queda `no_aplica`,
       nunca `evidencia_faltante` ni `retenido`. Probalo para MER tienda
       propia, MER marketplace y ROAS Product Ads.
  S6 · `servicio` solo toma valores del catálogo cerrado de seis; cero
       cadenas concatenadas; cero servicios repetidos.
  S7 · la confianza de un escenario se deriva de sus propias magnitudes;
       un escenario íntegramente retenido no puede llevar ALTA.
  S8 · la nota de reinversión de ahorro publicitario no se renderiza si
       el ahorro no es publicable.
  S9 · los `findings` de la propuesta no son idénticos a los del
       diagnóstico del mismo caso.
  S10 · BLOQUEO DE EXPORTACIÓN: con `comercial` ausente o incompleto, la
       exportación de propuesta falla de forma explícita y controlada,
       con mensaje, en el punto único de decisión. Probalo también
       invocando la función de exportación DIRECTAMENTE, sin pasar por
       la interfaz.
  S11 · con selección comercial confirmada, la exportación procede.
  S12 · DHB-2: con margen negativo, la propuesta contiene las siete
       piezas, y NO contiene ahorro, retorno, contribución proyectada ni
       ninguna promesa económica.
  S13 · paridad semántica PDF↔web: para cada `ValorPublicable`, mismo
       texto de estado y mismo número formateado en ambos renderers.
  S14 · Eje 1 visible donde DA-1 lo define, y no en el resto.
  S15 · DHB-3: el roadmap 30/60/90 se genera solo con selección
       comercial confirmada; cada ítem es trazable a un hallazgo, una
       prioridad o un servicio del catálogo; cero ítems inventados. Sin
       selección confirmada, existe vista previa rotulada como pendiente
       y la exportación sigue bloqueada.
  S16 · v1 produce exactamente la misma salida que antes del bloque.
  S17 · determinismo: dos corridas consecutivas producen los mismos PDFs
       por hash.

═══════════════════════════════════════════════════════════════════
11 · CASOS LÍMITE OBLIGATORIOS
═══════════════════════════════════════════════════════════════════

Sobre los seis escenarios canónicos más mayorista y mixto:

  L1 · inversión publicitaria declarada en cero (s6 solo orgánico).
  L2 · margen de contribución negativo (s4).
  L3 · proyección íntegramente retenida en los tres escenarios (s4).
  L4 · negocio sin ningún problema detectado (s5): el documento no
       inventa problemas ni queda vacío.
  L5 · canal declarado como no aplicable por el cliente.
  L6 · propuesta sin selección comercial.
  L7 · propuesta con selección comercial completa.
  L8 · propuesta con selección comercial PARCIAL: debe bloquear igual.
  L9 · caso mayorista, donde el concepto de canal es distinto.
  L10 · caso mixto: la terminología D7 se sostiene y las dos lecturas se
       muestran separadas antes de cualquier total combinado.
  L11 · nombre de cliente largo y montos grandes.
  L12 · un hallazgo que mapea a más de un servicio del catálogo.
  L13 · margen negativo Y selección comercial confirmada: la propuesta
       cualitativa se emite, sin promesas económicas.
  L14 · roadmap con selección confirmada y con selección pendiente.

═══════════════════════════════════════════════════════════════════
12 · VERIFICACIÓN VISUAL RESIDUAL
═══════════════════════════════════════════════════════════════════

  12.1 Regenerá los documentos de los ocho casos, tres documentos, dos
       perfiles, con v2, desde el worktree limpio (sección 15).
  12.2 Rasterizá TODAS las páginas e inspeccionalas vos mismo.
  12.3 Verificá, página por página: sin texto solapado, cortado ni fuera
       de página; sin páginas con encabezado y cuerpo vacío; ninguna
       página A4 sobre el 25% de tinta plena; contraste calculado; toda
       continuación con su marca en la cabecera; ninguna marca espuria;
       cero placeholders, `undefined`, `NaN`, `null` o enums crudos;
       ocupación dentro del contrato o en la lista cerrada de
       excepciones; la sección de cifra principal de la propuesta
       presente en las 16 combinaciones.
  12.4 Comparativas antes/después limitadas a las páginas que un cambio
       funcional haya modificado.
  12.5 Si un cambio funcional degradó la composición, corregilo o
       documentá por qué no se puede sin rediseñar.

═══════════════════════════════════════════════════════════════════
13 · CRITERIOS DE ACEPTACIÓN
═══════════════════════════════════════════════════════════════════

  1. Las 718 + 1 todo pasan sin que ninguna prueba existente haya sido
     modificada.
  2. Typecheck limpio y build exitoso.
  3. S1 a S17 pasan.
  4. Los catorce casos límite L1 a L14 cubiertos por prueba y artefacto.
  5. Los nueve estados de D4 existen en el tipo, con el copy literal.
  6. Cero estados decididos por parseo de strings.
  7. DHB-1 implementado: cero declarado se conserva, ratios `no_aplica`.
  8. `servicio` solo toma valores del catálogo cerrado de seis.
  9. El bloqueo de exportación funciona en el punto único de decisión,
     verificado sin pasar por la interfaz.
 10. DHB-2 implementado: las siete piezas presentes, cero promesas
     económicas.
 11. DHB-3 implementado: roadmap determinístico y trazable, bloqueado
     sin selección confirmada.
 12. Ningún escenario íntegramente retenido lleva badge ALTA.
 13. Ningún `no_aplica` aparece como dato faltante.
 14. Paridad semántica PDF↔web sostenida en los ocho casos.
 15. v1 produce exactamente la misma salida que antes del bloque.
 16. La dirección visual de v2 no fue rediseñada; todo cambio de
     composición está forzado por un cambio funcional y documentado.
 17. Sin regresiones visuales: ninguna página con texto solapado,
     cortado o fuera de página; ninguna A4 sobre 25% de tinta; cero
     continuaciones sin marca en cabecera; cero marcas espurias.
 18. Determinismo verificado por hash, dos corridas.
 19. El roadmap general reconciliado según la sección 5, y actualizado
     al cierre con el resultado real.
 20. DA-1 a DA-4 implementadas según lo ratificado.
 21. Nada inventado: ninguna cifra, servicio, precio ni resultado.
 22. Ningún umbral del contrato de composición relajado.
 23. Los criterios de promoción de v2 sobre v1 están escritos y son
     verificables, pero NO se ejecutó ninguna promoción.
 24. No se integró a `main`, no se publicó, no se desplegó, no se tocó
     producción, no se avanzó al Bloque Visual 3 ni a la fase 14.

═══════════════════════════════════════════════════════════════════
14 · CRITERIOS DE PROMOCIÓN DE v2 SOBRE v1
═══════════════════════════════════════════════════════════════════

Escribilos en el contrato del PASO 2 y en el roadmap. NO los ejecutes.

Como mínimo, la promoción exigirá:
  a) los 24 criterios de aceptación de este bloque en verde;
  b) los ocho casos generados con v2, tres documentos, dos perfiles,
     revisados página por página por un humano;
  c) el bloqueo de exportación verificado en la interfaz real;
  d) al menos un caso con datos de un cliente real, no demo;
  e) aprobación humana explícita y registrada;
  f) un plan de reversión a v1 en un solo paso.

═══════════════════════════════════════════════════════════════════
15 · AUDITORÍA, COMMIT, PUSH Y REPRODUCIBILIDAD
═══════════════════════════════════════════════════════════════════

REGLA DE REPRODUCIBILIDAD, obligatoria: todos los artefactos del ZIP se
generan desde el COMMIT CANDIDATO en un `git worktree` limpio, nunca
desde el árbol de trabajo. Declará en el handoff desde qué worktree y
qué commit se generó cada artefacto.

Secuencia, exactamente en este orden:

  A) Implementar y verificar el árbol de trabajo.
  B) Suite, typecheck, build y generación completa de artefactos.
  C) Crear un COMMIT CANDIDATO LOCAL, sin push. Es el objeto que se
     audita.
  D) Auditoría interna COMPLETA, agente de SOLO LECTURA sin contexto de
     la sesión de implementación, contra ese HEAD candidato exacto.
     Verifica: aislamiento del diff; que v1 produzca la misma salida;
     que ninguna prueba existente se haya modificado; que ningún estado
     se decida parseando strings; que el copy de D4 esté literal; que el
     bloqueo de exportación viva en el punto único; que DHB-1/2/3 y
     DA-1 a DA-4 se hayan implementado según lo cerrado; que la
     terminología D7 se respete; inspección visual real sobre PDFs
     rasterizados, no solo lectura de código; que todo número declarado
     sea reproducible desde los artefactos; los 24 criterios uno por uno
     con veredicto explícito.
     Veredicto: APROBADO / APROBADO CON CORRECCIONES / BLOQUEADO.
  E) Si aparecen correcciones: aplicarlas, incorporarlas al commit
     candidato, y volver a D con la auditoría COMPLETA sobre el nuevo
     HEAD.
  F) Máximo DOS rondas. Si al cabo de la segunda queda algo abierto, no
     lo fuerces: cerrá con lo que haya y reportalo como pendiente.
  G) Únicamente tras veredicto APROBADO, push a
     `feat/noche-continuacion`.
  H) Comprobar que `git log origin/feat/noche-continuacion -1` devuelve
     el mismo hash que el HEAD local. Reportarlo.

Push únicamente a `feat/noche-continuacion`. Nunca a `main`. Nunca
merge, rebase sobre main ni tag. Mensajes en español, referenciando los
identificadores que atienden.

Si después del commit candidato hacés commits adicionales —por ejemplo
para agregar el handoff—, declaralo y aclará que los artefactos
corresponden al candidato, no al HEAD final.

═══════════════════════════════════════════════════════════════════
16 · FORMATO OBLIGATORIO DEL HANDOFF
═══════════════════════════════════════════════════════════════════

Veinte secciones numeradas, en este orden, sin omitir ninguna. Si una no
aplica, escribí "no aplica" y por qué.

   1. Rama, HEAD local y remoto, y commit candidato exacto desde el que
      se generaron los artefactos.
   2. `git status --short`.
   3. `git diff --stat` contra 7caa9bbb.
   4. Aislamiento: archivos tocados; qué se tocó de v1 y por qué; prueba
      de que la salida de v1 no cambió.
   5. Resultado del PASO 0, con la línea base medida.
   6. Reconciliación del roadmap: qué archivo era el vigente, qué se
      actualizó, qué se marcó histórico, o qué se creó y por qué.
   7. Inventario del PASO 1, con archivo y línea.
   8. Ruta del contrato funcional y resumen de las reglas que fijó.
   9. Matriz de estados antes/después, completada, fila por fila con su
      call site.
  10. Estado de cada hallazgo en alcance, uno por uno: E-05, E-07, E-08,
      E-09, E-16, E-18, C-02, C-03, C-04, C-08, R-07, R-09, D5.
  11. Cómo se implementaron DHB-1, DHB-2 y DHB-3, con evidencia.
  12. Cómo se implementaron DA-1 a DA-4.
  13. Conteo de pruebas SIN DOBLE CONTEO: línea base 718 + 1 todo;
      subconjuntos preexistentes, confirmando que ya están incluidos;
      pruebas nuevas S1-S17, cuántos casos aportan; total final.
      Typecheck y build.
  14. Cobertura de los casos límite L1 a L14.
  15. Evidencia del bloqueo de exportación: caso bloqueado, caso
      permitido, caso parcial, y resultado de invocar la exportación
      directamente sin pasar por la interfaz.
  16. Resultado de la verificación visual residual, página por página.
  17. Paridad semántica PDF↔web.
  18. Determinismo verificado por hash.
  19. Auditoría interna: sobre qué HEAD candidato corrió cada ronda,
      cuántas hubo, qué reportó cada una, qué se corrigió, veredicto
      final, y confirmación de que el push fue posterior al APROBADO.
  20. Los 24 criterios de aceptación, uno por uno, con veredicto. Más
      decisiones pendientes nuevas y todo lo que quedó sin resolver.

═══════════════════════════════════════════════════════════════════
17 · CONTENIDO OBLIGATORIO DEL ZIP DE REVISIÓN
═══════════════════════════════════════════════════════════════════

Generá en la carpeta de Descargas del usuario:
`velocentum-bloque-3-funcional-revision.zip`

Contenido:
  - `handoff-bloque-3.md` con las 20 secciones;
  - `docs/` con el contrato funcional, el roadmap general actualizado y
    toda actualización de `docs/visual/`;
  - `pdfs/` con los documentos de los ocho casos, tres documentos, dos
    perfiles;
  - `rasters/` con TODAS las páginas de esos PDFs, los dos perfiles;
  - `web/` con los renders web equivalentes;
  - `comparativas/` con los montajes antes/después de las páginas
    afectadas por cambios funcionales;
  - `estados/` con una salida legible por caso que muestre, para cada
    `ValorPublicable`, su estado en los dos ejes y el copy resultante;
  - `exportacion/` con la evidencia del bloqueo: caso bloqueado, caso
    permitido, caso parcial, y el resultado de invocar la exportación
    directamente sin pasar por la interfaz;
  - `roadmap/` con la salida del roadmap 30/60/90 con selección
    confirmada y con selección pendiente;
  - `manifest.txt` con la lista completa de archivos y el conteo por
    carpeta.

Verificá el ZIP con `unzip -t` antes de reportarlo, y declará el conteo
de archivos y de páginas. Todo número declarado tiene que ser
reproducible desde el contenido del ZIP.

═══════════════════════════════════════════════════════════════════
18 · RESTRICCIONES FINALES
═══════════════════════════════════════════════════════════════════

Al terminar el handoff y el ZIP, DETENETE para revisión humana.

No integres a `main`. No publiques. No despliegues.
No cambies nada en producción.
No promuevas v2 sobre v1.
No avances al Bloque Visual 3, a la fase 14, a staging ni a publicación.
No tomes decisiones de producto que no estén en la sección 3 ni
respaldadas por la documentación vigente.
No amplíes el alcance.

Podés trabajar de forma autónoma y prolongada dentro de esta secuencia.
La autonomía es sobre el CÓMO, nunca sobre el QUÉ ni sobre el HASTA
DÓNDE.

Si algo de este prompt entra en conflicto con el código, con los
documentos de `docs/visual/` o con una instrucción previa, NO elijas por
tu cuenta: detenete y reportá el conflicto.

FIN DEL PROMPT — BLOQUE 3 FUNCIONAL
