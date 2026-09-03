# BV4 · Gate de F2a por contenido — handoff

1. El gate de F2a ya no compara bytes: compara el **contenido extraído** de los
   dos PDFs. El criterio viejo era imposible (la app genera la fecha al vuelo y
   la imprime). No se tocó una línea de código de F2a ni de los fixtures.
2. La comparación vive en `generar-propuestas-f2a.test.ts`, reusa `textoDelPdf`
   y arma los valores esperados **del modelo**, no a mano. Probada por mutación:
   un peso de diferencia, un agregado de menos y el fallo nombra qué falta.
3. Único excluido: **la fecha**. Verificado que es el único campo variable que
   llega al PDF (`diagnosticId`/`diagnosticVersion` no se imprimen).
4. **Corrección al prompt (D-3):** el hueco de captura de costo y precio por
   producto es de **modo B**, no del formulario (`nuevo.tsx:891`). En modo A —
   donde va el gate — el caso entra completo, así que **no hay segunda
   exclusión**. Medido: en modo B lo único que cambia en el PDF es la cobertura,
   de 60 % a 30 % / 20 %. Queda como H-15, abierto, para F2b.
5. **Corrección al prompt (H-16b):** `CampoSiNo` **sí** vuelve a "sin responder"
   (`campos-formulario.tsx:252`). Se registró como observación no reproducida.
   Lo que sí quedó confirmado es que `null` significa **Sí** en minorista y
   **No** en mayorista. H-16a (no se vuelve a elegir modo A/B) confirmado.
6. **Corrección al prompt (dos datos):** `casoSnakeStore` pisa **20** campos,
   no 13. Y `git log -S "producto_2_costo"` vuelve vacío también para
   `producto_1_costo`: el formulario interpola los nombres, así que esa búsqueda
   no prueba nada. La evidencia real es `645ed85`.
7. Documento reescrito: sección 6 (comparación + comando exacto), "Si no
   coinciden" (cuatro sospechosos en orden), pasos 8 y 20 (valores exactos de
   `SOBRE_SNAKE` y `SOBRE_TITAN`), sección 1 (los 20 campos por bloque, vertical,
   los dos toggles y la secuencia del envío) y 0-bis.1 (D-1 y D-3).
8. Registrados **H-14** (corregido), **H-15** y **H-16** (abiertos).
9. QA: 83 archivos, **1153 pruebas + 4 salteadas + 1 todo** (base: 1140 + 1
   todo; +13 nuevas y 4 que sólo corren con los PDFs del navegador).
   `tsc --noEmit` limpio, `vite build` limpio con los mismos cinco warnings.
10. Commit candidato **local**, sin push. Falta que Matías corra el gate.
