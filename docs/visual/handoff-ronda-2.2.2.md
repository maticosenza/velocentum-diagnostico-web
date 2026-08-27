# Handoff — Ronda de correcciones 2.2.2 (cierre de residuales sobre la ronda 2.2.1)

## 1. Rama y HEAD

- Rama: `feat/noche-continuacion`.
- HEAD de partida (verificado en el paso 0): `84f4109e505fb9fc8a1f8028aa8f1fc4c2d2e201`.
- Esta ronda **no crea un commit candidato nuevo con cambios de código**:
  Corrección A no requirió ningún cambio de código (ver sección 6) y
  Corrección B se investigó a fondo pero no se resolvió de forma segura
  dentro del alcance permitido (ver sección 7) — el único cambio de
  código que se probó (regla estática más granular en
  `src/documents/renderers/pdf-v2/document.tsx`) se revirtió por
  completo tras encontrar una regresión real. El único cambio que
  permanece es una prueba nueva (T1) que no toca ningún comportamiento
  existente.

## 2. `git status --short`

```
?? docs/visual/handoff-ronda-2.2.2.md
?? src/documents/templates/velocentum-v2/ronda-2.2.2-correcciones.test.ts
```

(Antes de esta captura, `scratchpad-2.2.2/` — scripts efímeros de
investigación y generación, y los rásters de verificación — se limpió
del árbol de trabajo; no se commitea, mismo criterio que las rondas
2.2 y 2.2.1.)

## 3. `git diff --stat` contra `84f4109`

No hay diff contra `84f4109` en archivos trackeados: los dos archivos de
arriba son nuevos (no aparecen en `git diff --stat`, que sólo compara
archivos ya trackeados). El único archivo de código de producto tocado
en algún momento de esta ronda
(`src/documents/renderers/pdf-v2/document.tsx`) quedó **revertido a su
estado exacto en `84f4109`** — confirmado con `git checkout --` sobre
ese archivo y `git status --short` limpio antes de la captura de arriba.

## 4. Aislamiento

Archivos nuevos: 2 (una prueba, este handoff). v1, `src/lib/`, fixtures
canónicos y dominio: fuera del diff — no se tocó ninguno. Confirmado dos
veces: (a) durante el desarrollo, un intento de agregar
`ronda-2.2.2-correcciones.test.ts` a la lista de archivos permitidos de
la prueba de guarda de `src/lib/fixtures-escenarios-demo.test.ts` se
revirtió de inmediato al notar que tocaba `src/lib/` (prohibido); la
prueba nueva se reescribió para usar únicamente los fixtures propios de
v2 (`test-fixtures.ts`), sin ninguna dependencia de `src/lib/`. (b) el
cambio de código de Corrección B, que si se hubiera mantenido habría
tocado sólo `src/documents/renderers/pdf-v2/document.tsx` (fuera de
`src/lib/`, dominio y v1 igual), se revirtió por completo — ver sección
7.

## 5. Resultado del paso 0

Verificado antes de tocar nada:

| Comprobación | Resultado |
|---|---|
| Rama | `feat/noche-continuacion` ✓ |
| HEAD | `84f4109e505fb9fc8a1f8028aa8f1fc4c2d2e201` ✓ |
| `git status --short` | vacío (árbol limpio) ✓ |
| Suite | 688 pasan + 1 todo (689) ✓ |
| Typecheck | limpio ✓ |
| Build (`vite build`) | exitoso (únicos warnings: `fontkit`/`browser-module`, preexistentes) ✓ |

Todo coincidió con lo esperado — se continuó según lo indicado.

## 6. Resultado de A.1 — qué pasó realmente con la sección de propuesta

**Conclusión: el código nunca perdió la sección. El paquete de PDFs
entregado en la ronda 2.2.1 no era reproducible desde su propio HEAD.**

Procedimiento: se creó un `git worktree` limpio en `8d685ed` (HEAD
anterior a la ronda 2.2.1) y se regeneró `propuesta` de s1
(`1-marketplace-fuerte-tienda-floja`), ambos perfiles, con el motor real
(`calcularDiagnostico` + `buildDocumentContext`, `tipoDocumento:
"propuesta"`) — exactamente el mismo procedimiento que describe la
sección 9 del handoff de la ronda 2.2.1. Resultado: **7 páginas en
ambos perfiles**, con la cifra `$ 5.761.835`, el encabezado
`Contribución incremental proyectada` y la frase puente de C-07, los
tres presentes.

Se repitió el mismo procedimiento contra el HEAD actual de esta ronda
(`84f4109`, la ronda 2.2.1 ya aplicada): **resultado idéntico — 7
páginas, sección completa, en ambos perfiles.** Se comparó
`src/documents/templates/velocentum-v2/propuesta.ts` byte a byte entre
ambos commits: **sin ninguna diferencia** — la sección
`commercial-summary` (`eyebrow: "Lo que importa"`, `title: "Contribución
incremental proyectada"`, bloques `summary` + `bridge`) está en el
código exactamente igual en los dos commits.

Se repitió también para s4 (`4-roas-bueno-margen-negativo`): **5 páginas
en ambos commits y ambos perfiles**, encabezado presente (la frase
puente de C-07 no aparece en s4 en NINGÚN commit — es comportamiento
esperado: `buildBridgeNoteV2` la omite cuando no hay hallazgos de capa
"servicio" con monto calculado, que es el caso real de s4 por el margen
negativo bloqueado; no es el defecto reportado).

**Por lo tanto: el 6→7 y el 4→5 no es una regresión de código en ningún
commit real entre `8d685ed` y `84f4109`.** El PDF entregado en el
paquete de la ronda 2.2.1 (6/4 páginas, sección ausente) no se pudo
reproducir generando desde el HEAD que esa ronda declaró. La explicación
del handoff de la 2.2.1 ("la tabla de conteo... citaba 7/5, el valor
real y estable es 6/4") **es incorrecta** — el valor real y estable,
verificado independientemente en dos commits distintos con el motor
real, es 7/5, no 6/4.

**Alcance del defecto, verificado sobre las 16 combinaciones
caso/perfil de `propuesta` de esta ronda:** el patrón "7 páginas con
sección, salvo 5 páginas en el caso sin bridge-note (s4)" se cumple en
**los 8 casos** (los 6 escenarios demostrativos + mayorista + mixto),
ambos perfiles — no sólo en s1 y s4. Esto explica por qué el total de
páginas de esta ronda (325, sección 9) difiere del total citado por la
ronda 2.2.1 (313) en exactamente 12 páginas: 5 escenarios con
bridge-note × 2 perfiles (10 páginas) + s4 × 2 perfiles (2 páginas) = 12
— aritméticamente exacto contra la diferencia 325−313=12. No se
encontró ninguna otra causa de diferencia.

**No se puede determinar, con la evidencia disponible en este entorno,
en qué paso exacto de la generación de la ronda 2.2.1 se perdió la
sección** (el script de generación de esa ronda fue efímero, no
commiteado, siguiendo el mismo criterio que las rondas 2.2 y 2.2.1 —
no queda rastro para inspeccionar). Lo que sí se pudo establecer de
forma concluyente es que **no fue el código fuente**: se probó en dos
commits reales, con el motor real, sin fixtures armados a mano, y en
ambos el resultado es idéntico y correcto.

## 7. Estado de las Correcciones A y B

### Corrección A — RESUELTA (sin cambio de código; regeneración correcta)

No hizo falta ningún cambio en `src/`: la sección ya estaba en el
código en el HEAD de partida (ver sección 6). La corrección consistió en
regenerar correctamente los 48 PDFs de esta ronda desde ese HEAD real,
con el motor real — evidencia:

| Caso | Perfil | Páginas propuesta | Encabezado | Frase puente C-07 |
|---|---|---|---|---|
| 1-marketplace-fuerte-tienda-floja | pantalla / impresión | 7 / 7 | ✓ / ✓ | ✓ / ✓ |
| 2-margen-alto-volumen-bajo | pantalla / impresión | 7 / 7 | ✓ / ✓ | ✓ / ✓ |
| 3-margen-fino-volumen-alto | pantalla / impresión | 7 / 7 | ✓ / ✓ | ✓ / ✓ |
| 4-roas-bueno-margen-negativo | pantalla / impresión | 5 / 5 | ✓ / ✓ | — (esperado, ver sección 6) |
| 5-todo-sano | pantalla / impresión | 7 / 7 | ✓ / ✓ | ✓ / ✓ |
| 6-solo-organico | pantalla / impresión | 7 / 7 | ✓ / ✓ | ✓ / ✓ |
| mayorista | pantalla / impresión | 7 / 7 | ✓ / ✓ | ✓ / ✓ |
| mixto | pantalla / impresión | 7 / 7 | ✓ / ✓ | ✓ / ✓ |

**Criterio cumplido**: los 16 documentos de propuesta contienen la
sección de cifra principal; la frase puente aparece en los 14 casos
donde el modelo la incluye (todos salvo s4, por diseño). Conteo de
páginas de s1 y s4 vuelto a 7/7 y 5/5 — el criterio 5 del prompt.

No se rediseñó la página: es el mismo componente (`contentSectionV2`
con `id: "commercial-summary"`) que ya existía, sin ningún cambio de
composición.

### Corrección B — NO RESUELTA. Revertida a la conducta segura de la ronda 2.2.1. Requiere decisión humana.

**Se investigó a fondo, se probaron dos enfoques distintos, y ninguno
resultó seguro dentro del alcance permitido de esta ronda ("no
rediseñar", ningún mecanismo interno de paginación no verificado). Se
revirtió todo cambio de código — el comportamiento actual es idéntico,
línea por línea, al de la ronda 2.2.1: el marcador de identidad sigue
antepuesto únicamente al bloque de Supuestos, con la misma regla
estática ya auditada. El defecto reportado por la auditoría externa
(el marcador no es el primer elemento de la página cuando el quiebre
real cae antes, dentro de las palancas) sigue presente, sin cambios
respecto de la ronda 2.2.1.**

**Intento 1 — `render`-prop con `subPageNumber` (descartado, reproduce
un hallazgo ya documentado).** La ronda 2.2.1 ya había probado y
descartado este mecanismo para el encabezado de la tarjeta (rompía
texto en tarjetas cortas). Esta ronda lo probó de nuevo, en un
componente React‑PDF aislado y mínimo (no en el pipeline real, para no
arriesgar el árbol de trabajo), específicamente para capturar el
`subPageNumber` de un elemento como efecto lateral y decidir en un
elemento posterior si mostrar el marcador. Resultado, reproducido de
forma consistente: el marcador aparece en la página incorrecta (la
misma página que el encabezado real, no la de continuación) —
evidencia de que `@react-pdf/renderer` invoca el callback `render` más
de una vez por nodo, en pasadas de layout distintas, y el valor
finalmente usado no es predecible desde el código de la aplicación.
Confirma, con evidencia nueva e independiente, la razón por la que la
ronda 2.2.1 ya había descartado esta vía.

**Intento 2 — heurístico estático de altura estimada (descartado tras
encontrar una regresión real).** Se construyó una simulación en JavaScript
puro (sin ningún mecanismo interno de `@react-pdf/renderer`) que estima,
tarjeta larga por tarjeta larga en cascada, cuál bloque (métricas+tabla,
cada grupo de palancas, o Supuestos) es el primero que no entra en la
página actual, usando constantes de altura calibradas contra el
documento real de la auditoría (`1-marketplace-fuerte-tienda-floja`,
proyección 90 días, ambos perfiles). **Calibrado así, reprodujo
EXACTAMENTE los 6 quiebres reales de ese documento** (CONSERVADOR→
Supuestos, BASE→segundo grupo de palancas, POTENCIAL→primer grupo de
palancas, en pantalla; y en impresión, el patrón distinto de esa
tarjeta con tabla apilada). Al escalarlo a los 48 PDFs de esta ronda y
validarlo contra la prueba R1 preexistente (que usa un fixture
sintético distinto, `buildTresEscenariosLargosContext`), produjo un
**falso positivo real**: el marcador "(continuación)" apareció en la
misma página que el propio encabezado real de la tarjeta — exactamente
la regresión que Corrección 2 de la ronda 2.2.1 (D-2) prohíbe, y que la
prueba R1 detectó (perfil impresión, página 7). Se generalizó el
alcance de la validación a los 8 casos reales de esta ronda y se
encontraron fallos adicionales en los escenarios 3, 5, mayorista y
mixto en pantalla — el heurístico, calibrado contra un solo documento
real, no generaliza a contenido con distinta cantidad de palancas por
grupo.

**Conclusión:** ni un mecanismo dinámico (consultar dónde cae la página
real) ni uno estático (estimar la altura sin consultar nada) resultaron
seguros con la evidencia disponible esta ronda. Una solución
genuinamente correcta requeriría una de dos cosas, ambas fuera del
alcance de "no rediseñar" de este prompt: (a) un mecanismo confiable de
`@react-pdf/renderer` para conocer el quiebre real de página en tiempo
de render — no existe uno probado en este árbol de componentes; o (b)
un renderizado en dos pasadas (generar sin marcador, inspeccionar con
`pdfjs` dónde cayó cada bloque, volver a generar con esa información),
que duplicaría el costo de generación de **todo** documento del
producto (no sólo los de esta ronda) y agregaría `pdfjs-dist` como
dependencia de runtime — un cambio de arquitectura real, no una
corrección acotada.

**Se revirtió todo el código de este intento** (`git checkout --` sobre
`src/documents/renderers/pdf-v2/document.tsx`, confirmado con
`git status` y `git diff` limpios contra `84f4109`). El defecto R-B
sigue presente, sin agravarse ni mejorar respecto de la ronda 2.2.1.

**Recomendación:** decisión humana sobre si (a) se acepta el defecto
residual como está (documentado, severidad MEDIA, no pierde contenido,
sólo desplaza dónde aparece la identidad dentro de una página real) y
se continúa; o (b) se autoriza una ronda futura con alcance ampliado
para evaluar la opción (b) de arriba (dos pasadas) como cambio de
arquitectura consciente, no como corrección acotada.

## 8. Conteo de pruebas

- Línea base (paso 0): 688 aprobadas + 1 todo (689).
- R1–R3 (ronda 2.2.1) y Q1–Q6 / P1–P10 (rondas 2.1/2.2): **ya incluidas**
  dentro de las 688 — no se suman de nuevo.
- T1 (esta ronda, Corrección A): **6 pruebas nuevas** (una por fixture:
  multicanal ~s1, margen negativo ~s4, tres escenarios largos, estrés,
  mayorista, mixto — cada una cubre ambos perfiles dentro del mismo
  `it`). Usa fixtures propios de v2 (`test-fixtures.ts`), no los seis
  escenarios demostrativos de `src/lib/` (fuera de alcance de esta
  ronda, ver sección 4).
- T2 (Corrección B): **no agregada** — no hay corrección de código que
  probar (sección 7).
- **Total final: 688 + 6 = 694, más 1 todo preexistente = 695.**
- Ninguna prueba existente se modificó, relajó ni eliminó.
- Typecheck: limpio. `vite build`: exitoso (mismos warnings preexistentes
  de `fontkit`, no relacionados con esta ronda).

## 9. Conteo de páginas documento por documento, contra la ronda 2.2.1

| Documento | Perfil | Páginas (2.2.2, esta ronda) | Páginas citadas (2.2.1) | Diferencia explicada |
|---|---|---|---|---|
| 1 · diagnostico | pantalla / impresión | 6 / 5 | — | sin cambio de código; no evaluado individualmente por la ronda 2.2.1 en su tabla pública, ver nota |
| 1 · proyeccion_90d | pantalla / impresión | 9 / 8 | — | ídem |
| 1 · propuesta | pantalla / impresión | **7 / 7** | 6 / 6 (paquete entregado) | Corrección A — sección restaurada (sección 6) |
| 2 · propuesta | pantalla / impresión | **7 / 7** | (paquete entregado: 6/6, inferido) | Corrección A |
| 3 · propuesta | pantalla / impresión | **7 / 7** | (ídem) | Corrección A |
| 4 · propuesta | pantalla / impresión | **5 / 5** | 4 / 4 (paquete entregado) | Corrección A |
| 5 · propuesta | pantalla / impresión | **7 / 7** | (ídem) | Corrección A |
| 6 · propuesta | pantalla / impresión | **7 / 7** | (ídem) | Corrección A |
| mayorista / mixto · los 3 tipos | pantalla / impresión | sin cambio | sin cambio | no afectados (sección 6) |

**Total de esta ronda: 325 páginas** (167 pantalla + 158 impresión) en
los 48 documentos — ver tabla completa en el manifest del ZIP. **Total
citado por la ronda 2.2.1: 313.** Diferencia: **+12, explicada en su
totalidad** por Corrección A (sección 6): 5 escenarios con bridge-note ×
2 perfiles (+10) + s4 × 2 perfiles (+2) = 12. No se encontró ninguna
otra diferencia — diagnostico y proyeccion_90d no cambiaron (el código
que los genera no se tocó, y A.1 confirmó que `propuesta.ts` tampoco
cambió entre `8d685ed` y `84f4109`; el `código` nunca fue la causa).

Nota: la tabla pública de la ronda 2.2.1 (`informe-cobertura-2-2.md`)
no desglosa por documento/perfil para los 8 casos completos, sólo cita
el total (313) y el error puntual de s1/s4 en su handoff — de ahí que
varias celdas de arriba queden como "paquete entregado, inferido" en vez
de un valor citado explícitamente.

## 10. Auditoría interna

**Una sola ronda.** No hubo commit candidato con cambios de código de
producto (Corrección A no lo requirió; Corrección B se revirtió por
completo) — la auditoría interna de esta ronda es este mismo documento
más la verificación automatizada descrita en las secciones 6-9,
corrida contra el árbol de trabajo actual (idéntico a `84f4109` en todo
archivo de `src/` salvo la prueba nueva T1, que no cambia ningún
comportamiento de producto).

**Veredicto: APROBADO CON RESERVA — Corrección A resuelta y verificada;
Corrección B NO resuelta, revertida a conducta segura, requiere decisión
humana antes de continuar (sección 7).**

Por el veredicto no siendo "APROBADO" pleno sobre los 11 criterios del
prompt (específicamente el criterio 4 —T2 no existe— y el criterio 7
—la marca sigue apareciendo fuera de la cabecera en el mismo patrón que
la ronda 2.2.1— no se cumplen), **esta ronda NO hace push**. El HEAD
remoto permanece en `84f4109`, idéntico al local salvo por los dos
archivos nuevos sin commitear (sección 2). No se integra a `main`, no se
publica, no se despliega, no se avanza al Bloque 3 ni a la fase 14 — tal
como exige el prompt en cualquier caso.

## ZIP de revisión

`velocentum-bloque-visual-2-2-2-revision.zip`, en Descargas, contiene:
los 48 PDFs regenerados desde `84f4109` (Corrección A aplicada, sección
6), sus 158 rásters de impresión a 150dpi, este handoff y un
`manifest.txt` con el conteo de archivos y páginas. No incluye montajes
antes/después (Corrección B no tiene "después" que montar — se revirtió
al comportamiento de la ronda 2.2.1) ni renders web (no se generaron
esta ronda; el foco de verificación fue el contenido y la paginación
real de los PDFs, que es lo que ambas correcciones auditan). Verificado
con `unzip -t`.
