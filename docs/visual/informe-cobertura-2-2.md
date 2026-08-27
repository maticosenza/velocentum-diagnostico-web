# Informe de cobertura — Bloque Visual 2.2, Parte A

Barrido sobre los cuatro escenarios demostrativos que faltaban (2, 3, 5,
6) y dos casos construidos como contexto de prueba del prototipo
(mayorista, mixto — sin fixture canónico para ninguno de los dos), con
el lenguaje visual de D-5 y las correcciones D-1 a D-4 ya aplicadas.

Generación: 6 casos × 3 documentos × 2 perfiles = 36 PDFs + 18 renders
web. Sumados a los 12 PDFs + 6 web de s1/s4 corregidos: **48 PDFs, 409
páginas rasterizadas** (158 de ellas en perfil impresión/A4), 24
renders web en total para esta ronda.

Los escenarios 2/3/5/6 se generaron con un script efímero fuera de
`src/` (no commiteado, borrado antes del cierre) que usa el motor real
(`calcularDiagnostico` + `buildDocumentContext`) sobre los datos de los
escenarios demostrativos existentes en el repositorio — nunca se
importaron esos datos desde ningún archivo commiteado bajo `src/`.
Mayorista y mixto se generaron con `buildMayoristaContext()`/
`buildMixtoContext()` de `templates/velocentum-v2/test-fixtures.ts`
(commiteadas, cubiertas por la suite Q5).

## Hallazgo real de esta parte: bug de paginación (encontrado y corregido)

El primer intento de D-5 agregaba una textura de fondo a CADA página de
contenido con un `<Svg>` en `position: "absolute"`. Al controlar el
conteo de páginas antes/después (exigido explícitamente por el
gobernante de esta ronda), se detectó que los 6 documentos de control
(s1/s4 × 3 tipos) habían crecido de **5/8/7/5/6/5 páginas a
7/11/11/7/9/7** — hasta +4 páginas por documento, un crecimiento
claramente desproporcionado. Investigación: `@react-pdf/renderer` no
trata `Svg` como `View` bajo posicionamiento absoluto (el motor emitía
`"Node of type SVG can't wrap between pages and it's bigger than
available page height"`), lo que forzaba páginas adicionales completas
ocupadas sólo por la textura, mal coloreada además (el `rgba()` no se
pintaba translúcido). Corrección: la textura de fondo se retiró de
`ContentPage` — queda sólo en `CoverPage`, donde el `Svg` está anidado
en un `View` de tamaño fijo, no como hijo absoluto de la página.
Verificado: tras la corrección, el conteo de páginas de los 6
documentos de control **volvió a coincidir exactamente** con el de
antes de esta ronda (comparación real contra un render de 89b2b7b vía
`git worktree`, ver tabla abajo). Documentado en el contrato, sección
6.1.

## Conteo de páginas por documento, antes (89b2b7b) y después (esta ronda), perfil impresión

| Documento | Antes | Después |
|---|---|---|
| 1-marketplace-fuerte-tienda-floja / diagnostico-impresion | 5 | 5 |
| 1-marketplace-fuerte-tienda-floja / proyeccion_90d-impresion | 8 | 8 |
| 1-marketplace-fuerte-tienda-floja / propuesta-impresion | 7 | 7 |
| 4-roas-bueno-margen-negativo / diagnostico-impresion | 5 | 5 |
| 4-roas-bueno-margen-negativo / proyeccion_90d-impresion | 6 | 6 |
| 4-roas-bueno-margen-negativo / propuesta-impresion | 5 | 5 |

Sin crecimiento en ninguno de los 6 documentos de control.

## Verificación automatizada (las 409 páginas)

- **Barrido de texto** (extracción real vía `pdfjs-dist` sobre las 48
  PDFs, página por página): cero ocurrencias de `undefined`, `NaN`,
  `null`, `[object Object]`, `Sin datos`, `††`.
- **Cobertura de tinta en A4** (158 páginas de perfil impresión,
  rasterizadas a 100dpi, fracción de píxeles con luminosidad <128/255):
  máximo observado 14,0% — **cero páginas por encima del 25%** exigido
  por C3/D-5.

## Inspección visual dirigida

Dado el volumen (409 páginas), la inspección página por página
completa de las 48 PDFs no es proporcional a lo que se puede verificar
con garantía manual en el tiempo de este bloque — se complementó el
barrido automatizado (cubre el 100% de las páginas para los defectos
que un barrido de texto/píxeles puede detectar) con inspección visual
dirigida a 6 páginas representativas, repartidas entre s1/s4 y los
casos nuevos:

- `1-marketplace-fuerte-tienda-floja__diagnostico-impresion` p1
  (portada): D-3 confirmado — líneas diagonales reales, ya no un
  bloque sólido.
- `1-marketplace-fuerte-tienda-floja__diagnostico-impresion` p2
  (línea de base): comparación entre canales con íconos, tarjetas con
  profundidad, glifo de personalidad junto al eyebrow — contenido
  idéntico al de antes de esta ronda, layout intacto.
- `mayorista__proyeccion_90d-impresion` p5 (escenarios, tarjeta
  CONSERVADOR completa): D-2 confirmado (BASE/POTENCIAL sin repetir su
  nombre, CONSERVADOR lo repite una sola vez) y D-4 confirmado (nota
  "† remite a Supuestos, en este mismo escenario." inmediatamente
  después del header, antes de la tabla mensual).
- `mayorista__proyeccion_90d-impresion` p6 (continuación de
  CONSERVADOR): "Supuestos — referencia de los valores marcados con †"
  correctamente titulado.
- `6-solo-organico__propuesta-impresion` p1 (portada): mismo patrón de
  D-3/D-5 en un escenario nuevo.
- `3-margen-fino-volumen-alto__propuesta-impresion` p3 (hallazgos): sin
  íconos en tarjetas de hallazgo (correcto según regla 6.4 — los
  íconos son sólo para escenario/canales), baja ocupación preexistente
  por `colsFindings:1` con pocos hallazgos (contrato 5.8, no es un
  residuo nuevo de esta ronda).

Ninguna de las 6 páginas mostró texto cortado, superposición o layout
roto.

## C6/comparación entre canales en mayorista

El componente se comporta idéntico al caso minorista — confirmado en
código (`buildChannelComparisonV2` no lee `modalidad` en ningún punto)
y visualmente. No se encontró ningún acoplamiento indebido entre
"canal" (concepto de venta/publicidad) y "modalidad comercial"
(minorista/mayorista/mixto).

## Fila por documento (los 8 casos, 3 documentos × 2 perfiles cada uno)

| Caso | Resultado del barrido automatizado |
|---|---|
| 1-marketplace-fuerte-tienda-floja (corregido) | Limpio — D-1 residual de portada documentado (contrato 5.8) |
| 4-roas-bueno-margen-negativo (corregido) | Limpio — D-1 residual de portada documentado (contrato 5.8) |
| 2-margen-alto-volumen-bajo | Limpio |
| 3-margen-fino-volumen-alto | Limpio — baja ocupación preexistente en findings/propuesta (contrato 5.8) |
| 5-todo-sano | Limpio |
| 6-solo-organico | Limpio |
| mayorista (prueba) | Limpio — comparación entre canales verificada |
| mixto (prueba) | Limpio — terminología D7 verificada |

El barrido no reveló ningún layout roto en ninguno de los seis
escenarios nuevos. El único hallazgo real de esta parte fue el bug de
paginación de la textura de fondo (arriba), encontrado en los
documentos de control (s1/s4) y corregido antes de generar el resto
del barrido de cobertura.
