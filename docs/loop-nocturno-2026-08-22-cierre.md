# Cierre del loop nocturno (2026-08-22 → 2026-08-23)

Handoff consolidado de los dos bloques del loop nocturno del 2026-08-22
(escenarios de validación de criterio y QA numérico completo) más el cierre
de sus pendientes, hecho el 2026-08-23 (bloque A de la sesión siguiente).
Reemplaza a los resúmenes sueltos entregados en el chat mientras el loop
corría — acá queda todo junto y verificado contra el estado final del
código.

## Bloque 1 · Escenarios de validación de criterio (commit `df3d196`)

Seis diagnósticos ficticios pero coherentes
(`src/lib/fixtures-escenarios-demo.ts`) para juzgar si la lectura de negocio
del sistema (hallazgos, servicios, prioridades) es defendible — no una
prueba de que el cálculo dé bien, eso ya lo cubre la suite de regresión.

**Detalle completo, por escenario, con evidencia:**
`docs/loop-nocturno-2026-08-22-escenarios.md`. No se corrigió nada en ese
bloque; todo quedó para que Matías decida qué amerita un bloque técnico.

**Tres incoherencias de lectura de negocio, con evidencia dura:**

1. Margen de contribución en -7% (escenario 4): cero hallazgos de capa
   "servicio"/"recomendación", `oportunidad_total: 0`, sin sección de
   riesgos y contradicciones en el PDF. El motivo técnico:
   `faltantes: ["margen_contribucion"]` es un nombre engañoso — el margen
   no falta, está calculado y es negativo; `margenPositivo` sólo acepta
   valores `> 0`, así que un margen negativo se trata igual que uno nunca
   cargado.
2. Negocio sano (escenario 5, margen 57%, MER 25x) con $9.832.500/mes (39%
   de la facturación) en "Prioridades inmediatas" con prioridad ALTA — el
   mismo nivel de urgencia que el escenario 4, que literalmente pierde
   plata en cada venta. Los tramos de funnel valorizan la mejora completa
   sin ponderar la salud del resto del negocio.
3. Dos hallazgos que se disparan sin verificar la condición que describen:
   `mix_producto` compara canal principal contra margen ponderado total (no
   producto contra producto — dispara siempre con un solo SKU y dos
   canales de comisión distinta); `product_ads` sólo verifica
   `ml_product_ads === true`, nunca compara el ROAS real contra un
   objetivo.

**Entrega:** los 36 PDFs de revisión (6 escenarios × 3 documentos ×
2 perfiles) se regeneraron el 2026-08-23 en `revision-pdfs-escenarios-demo/`
(raíz del proyecto, ver sección "Entrega de los 36 PDFs" más abajo — el
directorio original en el scratchpad de la sesión anterior ya no existía al
retomar el trabajo, es un directorio temporal del sistema, no del
repositorio).

## Bloque 2 · QA numérico completo (commit `9f4c176`)

Cobertura, con el motor real (nunca un `DocumentContextV1` armado a mano),
de los siete puntos pedidos: cada cifra publicada coincide con su derivado
de origen; ninguna suma cruza magnitudes económicas; los valores retenidos
nunca se muestran como cero; un cero real nunca se muestra como ausente; el
margen total no aparece con cobertura de productos parcial; ningún render
contiene una frase prohibida; los precios quedan vacíos salvo confirmación
manual explícita. Más la prueba de punta a punta obligatoria (formulario →
cálculo → contexto → modelo → render web → PDF), verificada con
`pdfjs-dist` extrayendo el texto real de las páginas (no el buffer
comprimido) y confirmada como genuina (no tautológica) por inyección de
falla del auditor: rompió temporalmente el formateador de PDF, confirmó que
la prueba fallaba, y revirtió.

**Archivos:** `src/documents/qa-numerica-bloque2.test.ts`,
`src/documents/renderers/pdf/qa-e2e-formulario-a-pdf.test.ts`.

**Auditoría (ronda 1): APROBADO CON OBSERVACIONES.** Dos defectos
encontrados y corregidos antes del commit:

- **Defecto 1 (prueba vacía):** la prueba de "el detalle mensual nunca
  iguala facturación proyectada a la suma con contribución o ahorro"
  exigía `ahorroPublicitarioHabilitado.estado === "calculado"` en el
  guard del loop, pero el fixture nunca declaraba inversión publicitaria
  — el `continue` se disparaba siempre y ningún `expect` corría nunca. Se
  corrigió separando el guard: la comparación facturación-vs-contribución
  corre siempre que ambas estén calculadas (con un `expect(mesesComparados
  > 0)` de control), y la comparación con ahorro corre sólo si aplica.
- **Defecto 2 (prueba confundida):** la prueba de "margen retenido nunca
  aparece como 0" (punto 3) llamaba a `contexto(casoSnakeStore, ...)` sin
  confirmar la política de envío, así que en realidad estaba probando
  retención por envío sin confirmar, no por cobertura parcial de
  productos como decía su propio título. Se corrigió envolviendo el
  fixture con `conFacturacionYEnvioConfirmado()` y agregando un `expect`
  explícito sobre `motivos` que descarta la palabra "envío".

Ninguna ronda 2 de auditoría fue necesaria: los dos defectos eran
localizados y la corrección se verificó localmente (566/566 pruebas,
typecheck limpio) antes de un checkpoint de uso que pidió cerrar el bloque
sin arrancar trabajo nuevo.

**Limitación conocida, no bloqueante, dejada pendiente en ese commit:**
`ahorroPublicitarioHabilitado` nunca quedaba `"calculado"` en el fixture de
la prueba del detalle mensual, ni siquiera con `inversion_meta`/
`inversion_google` declarados. **Investigado y cerrado el 2026-08-23** —
ver la sección siguiente.

## Bloque A · Cierre de los pendientes de la sesión anterior (2026-08-23)

### 1 · Este documento

Handoff consolidado, arriba.

### 2 · Entrega de los 36 PDFs de revisión

El directorio original (`.../scratchpad/escenarios-demo/`) vivía en el
directorio temporal de sesión del sistema, no en el repositorio — ya no
existía al retomar el trabajo (limpieza normal de `/tmp` entre sesiones).
Se regeneraron con la prueba que ya existía para ese fin
(`src/documents/renderers/pdf/generar-pdfs-escenarios-demo.test.ts`, sin
tocarla) hacia:

```
/Users/maticosenza/Documents/velocentum-diagnostico-web-local/revision-pdfs-escenarios-demo/
```

36 archivos, ~1,3 MB en total, organizados por escenario:

```
revision-pdfs-escenarios-demo/<id-del-escenario>/{diagnostico,proyeccion_90d,propuesta}-{pantalla,impresion}.pdf
```

Los seis `<id-del-escenario>` son autodescriptivos:
`1-marketplace-fuerte-tienda-floja`, `2-margen-alto-volumen-bajo`,
`3-margen-fino-volumen-alto`, `4-roas-bueno-margen-negativo`,
`5-todo-sano`, `6-solo-organico`.

**No se versionaron en git** (agregado a `.gitignore`): son un artefacto de
QA regenerable en cualquier momento con el comando de abajo, no código
fuente ni una decisión que deba preservarse en el historial. Para
regenerarlos:

```
VELOCENTUM_ESCENARIOS_QA_DIR="$(pwd)/revision-pdfs-escenarios-demo" \
  npx vitest run src/documents/renderers/pdf/generar-pdfs-escenarios-demo.test.ts
```

### 3 · Por qué `ahorroPublicitarioHabilitado` nunca queda calculado en el fixture de QA — investigado, es el fixture, no el motor

**Conclusión: no es un bug del motor.** Es el comportamiento correcto de
"una fuga que no existe no se muestra como cero" (mismo criterio que rige
todo el módulo `impacto-economico.ts`), aplicado a un fixture que describe
una cuenta publicitaria sana, sin datos de estructura de cuenta. Verificado
ejecutando el motor real (`calcularDiagnostico`) directamente sobre el
fixture de la prueba (`datosConOportunidad` en
`qa-numerica-bloque2.test.ts`):

- `mer_actual: 45.05` vs. `breakeven_roas: 1.565` — la cuenta es **muy
  rentable** (MER muy por encima del breakeven). La fuga `gasto_no_rentable`
  sólo se agrega al array de fugas cuando `mer < breakeven_roas`
  (`calculo-diagnostico.ts:1235`); si la cuenta es rentable, la fuga
  **ni siquiera se crea** — no hay ninguna entrada, ni calculable ni
  retenida, para `gasto_no_rentable` en `resultado.fugas`.
- `sobrefragmentacion` queda con `calculable: false,
  faltantes: ["conjuntos_activos", "presupuesto_diario"]`: el fixture
  nunca declaró esos dos campos (ninguna variante de
  `casoSnakeStoreCoberturaCompleta` los trae).
- `consolidarAhorroPublicitario()` (`src/lib/ahorro-publicitario.ts`) recibe
  `gastoNoRentable: null` y `sobrefragmentacion: null` — ninguna de las dos
  fuentes de ahorro tiene un candidato, así que devuelve
  `{ calculable: false, motivo: "No hay ahorro publicitario calculable..." }`,
  sin importar cuánto se haya declarado en `inversion_meta`/
  `inversion_google`: la inversión es sólo el TOPE del ahorro
  (`inversionElegible`), no una fuente de ahorro por sí misma.

En criollo: el fixture describe una cuenta publicitaria que gasta bien
(ROAS muy por encima del punto de equilibrio) y sobre la que no se relevó
la estructura de cuenta (conjuntos activos, presupuesto diario). Con esos
datos, genuinamente **no hay ningún ahorro publicitario que recuperar** —
mostrar un número ahí sería inventar una oportunidad que no existe, exactamente
lo que la regla de "retenido nunca es cero, pero tampoco se inventa un
número" prohíbe.

**No se tocó el motor ni el fixture de la prueba** (por instrucción
explícita: investigar y documentar, no corregir todavía). Para que un
fixture de prueba futuro ejercite la rama "calculado" de
`ahorroPublicitarioHabilitado`, necesitaría uno de estos dos cambios,
ninguno aplicado acá:

- MER por debajo del breakeven (cuenta que gasta de forma no rentable), o
- `conjuntos_activos` por encima del umbral sostenible + `presupuesto_diario`
  declarados (estructura de cuenta fragmentada).

El comentario en `qa-numerica-bloque2.test.ts` (sección 2, "el detalle
mensual...") se actualizó para reflejar esta conclusión, en vez de "no se
determinó por límite de tiempo".

### 4 · Conectar la selección de paquetes a la propuesta — bloqueado por una decisión de producto, no implementado

Se investigó cómo conectar `comercial: null`
(`src/documents/domain/build-context.ts:479`) con la selección de paquetes
ya persistida (`EscaleraPaquetesConfirmada`, decisión 9 cerrada el
2026-08-22). El resultado: **no es plomería, hay un desajuste estructural
real entre los dos modelos** que ninguna decisión existente resuelve.
Detalle completo, incluidas las dos preguntas concretas que hacen falta
responder antes de implementar cualquier cosa, en la nueva entrada 10 de
`docs/decisiones-pendientes.md` (única entrada **Abierta** del documento).
Resumen: lo persistido es un menú de tres niveles con precio por nivel; lo
que consume el documento de propuesta es un solo paquete con campos
(duración, forma de pago, fecha de inicio, exclusiones, si el precio va
impreso) que hoy no se capturan en ningún lado. No se tocó
`build-context.ts` — sigue con `comercial: null` incondicional, sin cambio
de comportamiento.

## Estado al cierre de este bloque

- Rama: `feat/noche-continuacion`, sincronizada con `origin`.
- Suite completa, typecheck y build: verificados antes del commit de este
  bloque (ver el commit correspondiente para el conteo exacto de pruebas).
- Ningún código de motor ni de plantilla se modificó en este bloque: los
  cambios son documentales (este handoff, la entrada 10 de decisiones
  pendientes, un comentario de prueba actualizado) más la entrega de los 36
  PDFs (no versionados).
- Pendiente real para la próxima sesión: que Matías resuelva la entrada 10
  de `docs/decisiones-pendientes.md` para poder conectar `comercial` a la
  propuesta.
