# Handoff — Ronda de correcciones 2.2.3 (marca de continuación en dos pasadas)

## 1. Rama, HEAD local/remoto y confirmación de `5e2edc9`

- Rama: `feat/noche-continuacion`.
- Antes de empezar esta ronda se verificó y confirmó: `5e2edc9` ya estaba
  pusheado, HEAD local y remoto coincidían exactamente en
  `5e2edc9a88d57c9c49071b67c2c5b7acf0cdc592`.
- HEAD candidato de esta ronda: `907ab1200361a412acbcb95adccf3b310844a7e4`
  (dos commits locales sobre `5e2edc9`: `d76e074` — mecanismo de dos
  pasadas — y `907ab12` — cobertura del quiebre dentro de la tabla
  mensual, hallazgo real durante la generación de los 48 PDFs, ver
  sección 7).

## 2. `git status --short`

```
(vacío)
```

## 3. `git diff --stat` contra `5e2edc9`

```
 docs/visual/contrato-composicion-v2.md             |  87 +++++++
 package-lock.json                                  |  15 +-
 package.json                                       |   2 +-
 src/documents/renderers/pdf-v2/document.tsx        | 268 +++++++++++++--------
 src/documents/renderers/pdf-v2/paginacion.ts       | 252 +++++++++++++++++++
 .../velocentum-v2/ronda-2.1-correcciones.test.ts   |   7 +-
 .../velocentum-v2/ronda-2.2-correcciones.test.ts   |   6 +-
 .../velocentum-v2/ronda-2.2.1-correcciones.test.ts |   7 +-
 .../velocentum-v2/ronda-2.2.3-correcciones.test.ts | 160 ++++++++++++
 9 files changed, 688 insertions(+), 116 deletions(-)
```

## 4. Aislamiento

Los 9 archivos tocados están, sin excepción, dentro de
`src/documents/renderers/pdf-v2/`, `src/documents/templates/velocentum-v2/`,
`docs/visual/` o son `package.json`/`package-lock.json` (ver sección 6
para la justificación puntual de ese cambio). **Ningún archivo de v1,
dominio (`src/documents/domain/`), `src/lib/` ni fixtures canónicos
está en el diff** — confirmado por inspección directa del `git diff
--stat` de arriba. Las tres pruebas preexistentes tocadas
(`ronda-2.1`, `ronda-2.2`, `ronda-2.2.1-correcciones.test.ts`) sólo
cambiaron su llamada de renderizado (de `renderToBuffer(createPdfDocumentElementV2(...))`
a `renderPdfV2ConDosPasadas(...)`, que ahora es la única vía que
produce la paginación real con marcadores) — ninguna assertion se
modificó, relajó ni eliminó.

## 5. Inventario del paso 1

- **Dónde se compone hoy la tarjeta de escenario**: `ScenarioCard`
  (`src/documents/renderers/pdf-v2/document.tsx`, función completa
  entre las líneas ~851-1010 del HEAD candidato). Orden de composición
  real: header (nombre + badge) → métricas (KPI) → nota de reinversión
  → tabla mensual (apilada en impresión, columnar en pantalla; cada
  fila de mes ya se parte individualmente entre páginas, D-4) → hasta 3
  grupos de palancas → bloque de supuestos → restricciones.
- **Dónde se emitía la marca (antes de esta ronda)**: un único punto,
  antes del bloque de supuestos (`document.tsx`, dentro del `View` que
  envuelve `TITULO_SUPUESTOS_CON_DAGA`), condicionado por la regla
  estática `marcaContinuacion` de la ronda 2.2.1 — sin ninguna relación
  con dónde caía el quiebre real.
- **Punto exacto para inyectar el mapa de paginación**: el límite entre
  `renderBlock` (recorre los bloques del modelo y arma cada sección) y
  `ScenarioCard` (compone cada tarjeta) es el único lugar por donde
  pasan, ya hoy, tanto `profile` como los datos de cada `EscenarioV2` —
  agregar un parámetro más (`mapaPaginacion`) ahí es la inyección
  mínima, sin tocar la firma pública que usan las pruebas existentes
  más que agregando un argumento opcional con valor por defecto.

## 6. Mecanismo de dos pasadas y garantía de determinismo

Documentado en detalle, con ejemplos de código y de datos reales, en
`docs/visual/contrato-composicion-v2.md`, sección nueva **"7 · Marca de
continuación medida en dos pasadas (Bloque Visual 2.2.3)"**. Resumen:

- **Pasada 1** (`renderPdfV2ConDosPasadas`,
  `src/documents/renderers/pdf-v2/paginacion.ts`): renderiza sin ningún
  marcador y mide con `pdfjs` (`medirPaginacionV2`) en qué página cae
  cada uno de seis bloques posibles de cada tarjeta larga: métricas,
  nota, tabla (o cada fila de mes individual, ver hallazgo de la
  sección 7 de este handoff), cada uno de los tres grupos de palancas,
  y supuestos.
- **Pasada 2**: renderiza con el mapa medido — cada marcador se pinta
  DENTRO del mismo `wrap={false}` que el bloque que introduce (nunca
  como hermano suelto), así nunca puede separarse de él en un corte de
  página.
- **Convergencia (L7)**: se vuelve a medir el resultado de la pasada 2;
  si coincide con el mapa que se usó para producirla, ES el PDF
  definitivo. Si insertar los marcadores desplazó algún quiebre, el
  mapa recién medido alimenta un tercer intento, así hasta converger o
  agotar un techo de 4 intentos (nunca itera indefinidamente). Sobre
  los 48 documentos reales de esta ronda: máximo 3 intentos, **0
  documentos no convergentes**.
- **Determinismo (L5)**: `renderPdfV2ConDosPasadas` es una función pura
  de `(model, profile)`. Se identificó y corrigió la única fuente real
  de no-determinismo: `@react-pdf/renderer` usa `new Date()` como
  `CreationDate` por defecto, y ese valor viaja también al
  identificador de archivo del PDF (`PDFSecurity.generateFileID`, hash
  sobre `CreationDate` + el resto de los metadatos), así que sin
  fijarlo NINGÚN PDF de esta app —ni antes de esta ronda— era
  reproducible bit a bit entre corridas. Se fijó a una constante
  (`FECHA_CREACION_FIJA_V2`). Verificado por hash SHA-256: prueba U3
  (12 combinaciones, 2 corridas cada una) y los 48 PDFs de esta ronda,
  generados dos veces completas — **0 hashes distintos**.

## 7. Estado del residual

**Las 24 páginas afectadas que citó la auditoría externa quedaron
resueltas, y además se encontró y corrigió una variante adicional del
mismo defecto que esa auditoría no había medido.**

Verificación sobre los 48 PDFs reales, generados en el worktree limpio
(sección 9 de este handoff, HEAD `907ab12`):

- **U1 sobre los 48 documentos**: 0 páginas de continuación sin marca
  al principio. Evidencia página por página, dos casos representativos
  (montajes completos en el ZIP, `montajes/`):
  - `1-marketplace-fuerte-tienda-floja/proyeccion_90d-pantalla.pdf`,
    página 7 de 9 — el "peor caso" citado explícitamente por la
    auditoría: antes, la página abría con los tres KPI de BASE sin
    ninguna etiqueta y la marca aparecía recién antes de Supuestos, con
    POTENCIAL ya empezado más abajo sin relación aparente; ahora, "BASE
    (CONTINUACIÓN)" es el primer texto de la página, antes de "Ahorro
    publicitario / Fuga por sobrefragmentación…".
  - Mismo documento, perfil impresión, página 6 de 8 — el quiebre ahí
    caía antes de las métricas (el header de BASE quedaba huérfano al
    pie de la página anterior); ahora "BASE (CONTINUACIÓN)" precede
    directamente a "Contribución incremental 90 días $ 8.066.568".
  - **Hallazgo adicional, fuera de lo que midió la auditoría externa**:
    `3-margen-fino-volumen-alto/proyeccion_90d-pantalla.pdf`, página 8
    de 9 — el quiebre de POTENCIAL caía DENTRO de la tabla mensual
    (entre la fila de Mes 1 y la de Mes 2, cada fila se parte
    individualmente entre páginas por diseño desde D-4) — la página
    abría con "Mes 2 $ 2.372.228…" sin ninguna etiqueta. No estaba
    cubierto por el mapa de bloques original (metricas/nota/tabla/
    grupo/supuestos, que sólo contemplaba la PRIMERA fila de la tabla);
    se agregó `` `mes:${numero}` `` como séptimo bloque medible/marcable
    (commit `907ab12`) — ahora "POTENCIAL (CONTINUACIÓN)" precede a
    "Mes 2".
- **U2 sobre los 48 documentos**: 0 marcas espurias — cada escenario
  aparece exactamente `1 + |marcadores medidos|` veces dentro del
  bloque de escenarios, nunca más.
- **T1 (Corrección A, ronda 2.2.2) sigue intacta**: las 16
  combinaciones caso/perfil de propuesta conservan el encabezado
  "Contribución incremental proyectada"; la frase puente de C-07
  aparece en las 14 que corresponden (todas salvo s4, por diseño — sin
  hallazgos de capa servicio con monto calculado).
- Ningún placeholder, `undefined`, `NaN` ni cuerpo vacío en las 325
  páginas.

**Cláusula de corte: NO se activó.** El mecanismo convergió en los 48
documentos reales, generalizó a los 6 fixtures sintéticos de la prueba
committeada (12 combinaciones), y el único ajuste necesario tras el
primer intento de generación completa (el bloque `mes:N`) se incorporó
al mismo commit candidato sin necesitar una segunda ronda de auditoría
externa de por medio.

## 8. Conteo de pruebas

- Línea base (paso 0): 694 aprobadas + 1 todo.
- R1-R3, Q1-Q6, P1-P10, T1: **ya incluidas** dentro de esas 694 — no se
  suman de nuevo. (Tres de esos archivos cambiaron su llamada de
  render, sección 4 — ninguna prueba nueva ahí.)
- U1-U4 (esta ronda): **24 pruebas nuevas** —
  `ronda-2.2.3-correcciones.test.ts`, 6 fixtures × 4 describes (`it.each`,
  cada `it` cubre ambos perfiles con un `for` interno).
- **Total final: 694 + 24 = 718, más 1 todo preexistente = 719.**
- Ninguna prueba existente se modificó en su assertion, se relajó ni se
  eliminó.
- Typecheck: limpio. `vite build`: exitoso (mismos warnings
  preexistentes de `fontkit`, no relacionados con esta ronda).
- Verificado también en el worktree limpio (`907ab12`, aislado): mismo
  resultado — 718 + 1 todo, typecheck limpio, build exitoso.

## 9. Conteo de páginas contra la ronda 2.2.2, y Corrección A intacta

**325 páginas totales en los 48 documentos, idéntico a la ronda
2.2.2 (167 pantalla + 158 impresión, sin cambio).** El mecanismo de
esta ronda reubica dónde cae la marca de identidad — no agrega ni
quita contenido, así que no hay razón estructural para que cambie el
conteo, y no cambió: verificado documento por documento (48/48
idénticos). El criterio 8 del prompt permitía que insertar la marca
agregara una página si eso quedaba explicado — no hizo falta: el
`wrap={false}` que envuelve cada marcador con su bloque es
suficientemente ajustado (una línea de texto corta) como para no
empujar contenido a una página nueva en ninguno de los 48 casos
reales.

**Corrección A (ronda 2.2.2) sigue intacta en las 16 combinaciones
caso/perfil de propuesta** — ver sección 7, verificado por T1 sobre los
48 PDFs reales de esta ronda, no sólo sobre los fixtures sintéticos.

## 10. Auditoría interna

- **Una ronda completa**, de solo lectura, contra el HEAD candidato
  final `907ab12` — la misma generación de los 48 PDFs, el barrido de
  U1/U2/T1/placeholders y la verificación de determinismo (sección 6-9
  de este handoff) sirvieron como esa auditoría; no hizo falta una
  segunda ronda porque no se encontró ninguna regresión ni
  no-convergencia sobre el HEAD final (el hallazgo del bloque `mes:N`
  se descubrió y corrigió ANTES de fijar el HEAD candidato, dentro del
  mismo ciclo de generación-verificación, no como una corrección
  posterior a un veredicto).
- **Veredicto: APROBADO.** Los 12 criterios de aceptación del prompt se
  cumplen: (1) 718+1 todo sin modificar pruebas existentes; (2)
  typecheck y build limpios, en el árbol de trabajo y en el worktree
  limpio; (3) v1/dominio/`src/lib/`/fixtures canónicos fuera del diff;
  (4) U1-U4 pasan, todas las pruebas previas siguen pasando; (5) cero
  páginas de continuación con la marca fuera de la cabecera en los 48
  PDFs, ambos perfiles; (6) cero marcas espurias; (7) determinismo
  verificado por hash en dos corridas completas de los 48 documentos;
  (8) conteo de páginas idéntico a la ronda 2.2.2 (325=325); (9) máximo
  de tinta plena A4 observado 2,28%, muy por debajo del 25%; (10) cero
  placeholders; (11) Corrección A intacta en las 16 combinaciones; (12)
  nada fuera de alcance, nada inventado, ningún umbral relajado.
- El push a `feat/noche-continuacion` (sección de restricciones finales
  de este documento) se hizo **después** de este veredicto APROBADO,
  nunca antes.

## Reproducibilidad

Todos los artefactos de este handoff y del ZIP se generaron en un `git
worktree` limpio (`/tmp/wt-2.2.3`, eliminado al cierre de esta ronda),
en el commit candidato exacto `907ab1200361a412acbcb95adccf3b310844a7e4`
— `git worktree add`, `npm install`, y la generación completa desde
ahí, nunca desde el árbol de trabajo principal. Los rásters "antes" de
los montajes se generaron igual, en un segundo worktree limpio en
`5e2edc9` (HEAD de la ronda 2.2.2, también eliminado al cierre).
