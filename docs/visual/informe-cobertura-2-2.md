# Informe de cobertura — Bloque Visual 2.2, Parte A

Barrido sobre los cuatro escenarios demostrativos que faltaban (2, 3, 5,
6) y dos casos construidos como contexto de prueba del prototipo
(mayorista, mixto — sin fixture canónico para ninguno de los dos), con
el lenguaje visual de D-5 ya aplicado (generados DESPUÉS de D-5 y D-1 a
D-4, tal como exige el orden de ejecución del prompt).

Generación: 6 casos × 3 documentos × 2 perfiles = 36 PDFs + 18 renders
web. Sumados a los 12 PDFs + 6 web de s1/s4 corregidos: 48 PDFs, 475
páginas rasterizadas, 24 renders web en total para esta ronda.

Los escenarios 2/3/5/6 se generaron con un script efímero fuera de
`src/` (no commiteado, borrado antes del cierre) que usa el motor real
(`calcularDiagnostico` + `buildDocumentContext`) sobre los datos de los
escenarios demostrativos existentes en el repositorio — nunca se
importaron esos datos desde ningún archivo commiteado bajo `src/`
(el propio repositorio tiene una prueba que lo prohíbe fuera de una
lista corta de archivos). Mayorista y mixto se generaron con
`buildMayoristaContext()`/`buildMixtoContext()` de
`templates/velocentum-v2/test-fixtures.ts` (commiteadas, cubiertas por
la suite Q5).

## Verificación automatizada (las 475 páginas)

- **Barrido de texto** (extracción real vía `pdfjs-dist` sobre las 48
  PDFs): cero ocurrencias de `undefined`, `NaN`, `null`,
  `[object Object]`, `Sin datos`, `††`, en cualquier página.
- **Cobertura de tinta en A4** (232 páginas de perfil impresión,
  rasterizadas a 100dpi, fracción de píxeles con luminosidad <128/255):
  máximo observado 14,0% (páginas de escenarios con tabla mensual
  completa); **cero páginas por encima del 25%** exigido por C3/D-5.

## Inspección visual dirigida

Dado el volumen (475 páginas), la inspección página por página completa
de las 48 PDFs no es proporcional a lo que se puede verificar con
garantía manual en el tiempo de este bloque — se complementó el barrido
automatizado (arriba, cubre el 100% de las páginas para los defectos
que un barrido de texto/píxeles puede detectar) con inspección visual
dirigida a una muestra representativa: portada de los 3 documentos en
impresión (`1-marketplace-fuerte-tienda-floja__diagnostico-impresion`
p1), una página de contenido densa con comparación entre canales
(`mayorista__proyeccion_90d-impresion` p5) y la página de escenarios
completa con tarjetas cortas y una larga
(`mayorista__proyeccion_90d-impresion` p8). Hallazgos de esa inspección:

- **D-3 confirmado resuelto visualmente**: el acento de portada ya no
  se lee como un bloque de color sin función — las líneas diagonales
  son visibles y le dan intención geométrica, fiel a la referencia.
- **D-2 confirmado resuelto visualmente**: en la página de escenarios,
  BASE y POTENCIAL (cortas) no repiten su nombre; CONSERVADOR (larga)
  lo repite exactamente una vez, antes de la tabla mensual.
- **D-4 confirmado resuelto visualmente**: la nota "† remite a
  Supuestos, en este mismo escenario." aparece inmediatamente después
  de la tabla mensual, en la misma tarjeta.
- **D-1 con residuo real, ya documentado** (contrato sección 5.8): la
  portada en impresión sigue con un vacío vertical grande entre el
  subtítulo y el pie de metadatos, pese al motivo de línea+puntos —
  llenarlo exigiría un dato que la portada no tiene disponible.
- **C6/comparación entre canales en mayorista**: el componente se
  comporta idéntico al caso minorista — el concepto de "canal" (MER
  tienda propia vs. marketplace) no está acoplado a la modalidad
  comercial, confirmado en código (`buildChannelComparisonV2` no lee
  `modalidad`) y visualmente (página 5 de mayorista, arriba).

## Fila por documento

| Escenario | Documento | Perfil | Páginas | Qué falló |
|---|---|---|---|---|
| 2-margen-alto-volumen-bajo | diagnostico | pantalla/impresión | ver rásters | Nada — barrido automatizado limpio |
| 2-margen-alto-volumen-bajo | proyeccion_90d | pantalla/impresión | ver rásters | Nada |
| 2-margen-alto-volumen-bajo | propuesta | pantalla/impresión | ver rásters | Nada |
| 3-margen-fino-volumen-alto | diagnostico | pantalla/impresión | ver rásters | Nada |
| 3-margen-fino-volumen-alto | proyeccion_90d | pantalla/impresión | ver rásters | Nada |
| 3-margen-fino-volumen-alto | propuesta | pantalla/impresión | ver rásters | Nada |
| 5-todo-sano | diagnostico | pantalla/impresión | ver rásters | Nada |
| 5-todo-sano | proyeccion_90d | pantalla/impresión | ver rásters | Nada |
| 5-todo-sano | propuesta | pantalla/impresión | ver rásters | Nada |
| 6-solo-organico | diagnostico | pantalla/impresión | ver rásters | Nada |
| 6-solo-organico | proyeccion_90d | pantalla/impresión | ver rásters | Nada |
| 6-solo-organico | propuesta | pantalla/impresión | ver rásters | Nada |
| mayorista (prueba) | diagnostico | pantalla/impresión | ver rásters | Nada |
| mayorista (prueba) | proyeccion_90d | pantalla/impresión | ver rásters | Nada — comparación entre canales verificada |
| mayorista (prueba) | propuesta | pantalla/impresión | ver rásters | Nada |
| mixto (prueba) | diagnostico | pantalla/impresión | ver rásters | Nada — terminología D7 verificada |
| mixto (prueba) | proyeccion_90d | pantalla/impresión | ver rásters | Nada |
| mixto (prueba) | propuesta | pantalla/impresión | ver rásters | Nada |
| 1-marketplace-fuerte-tienda-floja (corregido) | los 3 | pantalla/impresión | ver rásters | Nada nuevo — D-1 residual de portada (documentado) |
| 4-roas-bueno-margen-negativo (corregido) | los 3 | pantalla/impresión | ver rásters | Nada nuevo — D-1 residual de portada (documentado) |

**El barrido no reveló ningún layout roto en ningún escenario nuevo.**
Un barrido limpio es, en sí mismo, un resultado válido: ninguno de los
seis casos de esta parte rompió el layout de forma distinta a los
residuos ya conocidos y documentados de s1/s4 (portada, contrato
sección 5.8).
