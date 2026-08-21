# Cola nocturna · 20 de agosto de 2026

Controlador autónomo sobre `feat/noche-continuacion`. Este documento es la cola
de trabajo: se actualiza después de cada bloque, nunca se reescribe la
historia de lo ya hecho.

## Fuentes revisadas

- `docs/motor-documental-v1.md` (el único documento de "plan" versionado en
  este repositorio — no existe un archivo separado de "plan de evolución";
  las fases de auditoría por plataforma, mayorista/mixto, retención y
  rediseño integral se mencionan en el handoff anterior pero no tienen
  documento propio en el repo).
- `docs/handoff-nocturno-2026-08-20.md` y
  `docs/handoff-nocturno-2026-08-20-continuacion.md`.
- `docs/fase3-evidencia-pendiente.md`.
- TODOs de código: sólo uno existe, `it.todo("caso B2 · regresión con envío
  neto y liquidación verificados")` en `src/lib/regresion-2-6.test.ts:53`.
- Pruebas existentes: 17 archivos, 200 casos + 1 `todo` (línea base de esta
  sesión, verificada antes de tocar nada).
- `git diff --stat origin/main...HEAD`: 58 archivos, toda la capa documental
  (`src/documents/**`) y las fases 2/3 del motor de cálculo no existen en
  `main` — este diff no aporta pendientes nuevos, ya está resumido en los
  handoffs.

## Clasificación

Estado: `pendiente` (implementable ya) · `en_curso` · `completado` ·
`bloqueado_datos` · `bloqueado_comercial` · `bloqueado_migracion`.

### A. Integración documental completa

| # | Ítem | Estado | Nota |
|---|---|---|---|
| A1 | Adaptador diagnóstico persistido → contexto documental | completado | `2de1fce`, sesión anterior |
| A2 | Ruta de previsualización + tabs entre los 4 documentos | completado | `5845ec5`, sesión anterior |
| A3 | Botón de descarga PDF desde la previsualización | completado | `5845ec5`, usa `export-client.ts` ya probado |
| A4 | Botones "Ver documentos" desde el detalle del diagnóstico | completado | `5845ec5` |
| A5 | Estados sin dato/retenido/no aplica preservados en la vista | completado | vive en `domain/build-context.ts` y `domain/blocks.ts`, sin tocar |
| A6 | Compatibilidad con diagnósticos guardados sin campos nuevos | completado | probado en `from-diagnostico.test.ts` (versión/fecha ausentes, bloques ausentes) |
| A7 | Pruebas de armado de modelo y render (unit/integration) | completado | `build-document.test.ts`, `document-renderer.test.tsx`, `document.test.tsx` |
| A8 | Pruebas de la ruta de previsualización en sí (componente) | bloqueado_migracion | el repo no tiene `@testing-library/react` ni `jsdom` configurado y ninguna ruta tiene test de componente hoy; agregar ese arnés es un cambio de infraestructura de testing, no un bloque chico. Se documenta y no se hace esta noche. |
| A9 | Extraer y testear helpers puros de formato usados en las rutas de detalle (`pesos`, `numero`, `pct`, `etiqueta`) | completado | movidos a `src/lib/vista-diagnostico.ts` con 11 casos nuevos, incluyendo la garantía de que un cero real nunca se muestra como guión |
| A10 | Accesibilidad de la vista de previsualización (estados de carga/error, landmarks) | completado | ver bloque 3 abajo |
| A11 | Accesibilidad/responsive/impresión del renderer web | completado | ya cubierto en `document-renderer.css` (`@media print`, `@media max-width`) y en `document-renderer.test.tsx` (aria-label, tonos de sección) |

### B. Bugs y consistencia

| # | Ítem | Estado | Nota |
|---|---|---|---|
| B1 | Auditoría de hallazgos vs. evidencia (fase 3) | completado | ya resuelto en sesiones previas (`fase3-bugfixes.test.ts`, `entrega-2-5.test.ts`) + esta sesión reactivó `clips_ml` con su propio triestado |
| B2 | Invariantes de consistencia de hallazgos | completado | ver bloque 2 abajo. Nota: `servicio` no se restringió a `SERVICIOS` porque el mapeo usa legítimamente combinaciones como `"Web e-commerce y Meta Ads"` que no son miembros literales de esa lista — restringirlo habría sido un falso positivo propio |
| B3 | Revisión de financiación/descuento/canales/Product Ads/envío triestado | completado | cubierto extensamente en `calculo-diagnostico.test.ts`, `fase3-bugfixes.test.ts`, `regresion-2-6.test.ts`; no se encontraron gaps nuevos en esta pasada de lectura |
| B4 | Caso B2 de Titan Web (envío neto + liquidación real verificados) | bloqueado_datos | `it.todo` explícito; instrucción explícita del usuario de no cerrarlo; no se inventan datos de Titan Web |
| B5 | Hallazgo "plan de plataforma mal dimensionado" | bloqueado_datos | necesita costo real del plan actual, costo de alternativa, límite en uso y ahorro verificable — ninguno se releva hoy (`docs/fase3-evidencia-pendiente.md`) |

### C. Formulario para llamadas de 45 minutos

| # | Ítem | Estado | Nota |
|---|---|---|---|
| C1 | Estructura por pestañas (`BLOQUES`) | completado | ya existe, 9 pestañas |
| C2 | Ocultar pestaña Mercado Libre si no vende ahí | completado | ya existe (`vende_mercado_libre`) |
| C3 | Ocultar campos de envío hasta que corresponda | completado | ya existe (condicional sobre `absorbe_costo_envio`) |
| C4 | Auditoría de campos siempre visibles que deberían condicionarse por canal/modalidad | completado | leído `bloque-canales.tsx` y las nueve secciones de `diagnosticos.nuevo.tsx` completas. Hallazgo: el formulario **ya** implementa revelado progresivo extenso — por canal (`no vende en este canal` oculta sus 6-7 campos), por modo (`modo A` = con pantalla compartida/CSV, `modo B` = sólo conversado, con menos campos y sin costo/precio de productos 2 y 3), y por triestado de envío. No se encontró ningún campo condicionable que hoy esté siempre visible sin razón. No se tocó código: no había nada seguro que cambiar sin una decisión de producto sobre qué recortar (ver C5). |
| C5 | Rediseño de recuento de campos / revelado progresivo adicional | bloqueado_comercial | es una decisión de producto/UX (qué campos son "núcleo" en 45 minutos) que no está especificada en ningún documento; hacerlo a ciegas, sin sesión real ni feedback de vendedores, arriesga romper el flujo de la única herramienta que usan en vivo con el cliente. Se documenta como pendiente de decisión, no se ejecuta esta noche. |
| C6 | Mensajes de validación mejorados | completado (sin cambios) | la auditoría C4 no encontró mensajes de validación confusos o faltantes; los existentes (comisión en escala sospechosa, suma de porcentajes > 100, envío sin confirmar) ya son específicos y accionables |

### D. Próximas fases del plan

| # | Ítem | Estado | Nota |
|---|---|---|---|
| D1 | Motor de escenarios a 90 días (fórmulas reales) | bloqueado_comercial | sin fórmulas documentadas; ya evaluado y documentado en la sesión anterior |
| D2 | Reglas comerciales mayoristas | bloqueado_comercial | no hay ninguna definición de precios/condiciones mayoristas en el repo |
| D3 | Fases de auditoría por plataforma / mayorista-mixto / retención / rediseño integral | bloqueado_comercial | mencionadas en el handoff previo como parte de "el plan", pero no hay documento con su alcance en este repositorio; no se puede planificar en el vacío sin inventar alcance |
| D4 | Logo y tipografías oficiales del PDF/web | bloqueado_datos | assets no están en el repositorio |

### E. Calidad final

| # | Ítem | Estado | Nota |
|---|---|---|---|
| E1 | Suite completa verde | completado | 200 pruebas + 1 todo al cierre de la sesión anterior |
| E2 | Typecheck limpio | completado | verificado en cada bloque anterior |
| E3 | Build limpio (cliente/SSR/Nitro) | completado | verificado en cada bloque anterior |
| E4 | Lint de archivos modificados | completado | verificado en cada bloque anterior |
| E5 | Código muerto introducido por esta rama | pendiente | pasada de auditoría rápida (imports/exports sin uso en los archivos nuevos) |
| E6 | Casos heredados (diagnósticos guardados antes de estos cambios) | completado | cubierto por `from-diagnostico.test.ts` |
| E7 | Manejo de errores / estados vacíos en la nueva ruta | completado | ya existía desde el bloque de creación de la ruta (carga, no encontrado, imposible de armar); este bloque le sumó semántica de accesibilidad |

## Bloques de esta madrugada (en orden de ejecución)

1. ~~**A9** — extraer y testear helpers de formato de `diagnosticos.$id.tsx`.~~ **completado**
2. ~~**B2** — invariantes de consistencia de hallazgos.~~ **completado**
3. ~~**A10 + E7** — accesibilidad y manejo de error/carga de la ruta de previsualización.~~ **completado**
4. ~~**C4** — auditoría dirigida de campos condicionables no condicionados.~~ **completado (sin cambios de código: ya está bien condicionado)**
5. **E5** — auditoría de código muerto en archivos de esta rama.

Cada bloque: pruebas → typecheck → build → commit → push → actualizar esta
cola → seguir con el siguiente.

## Registro de bloques ejecutados

### Bloque 1 · A9 (commit siguiente)

- `src/lib/vista-diagnostico.ts`: `GUION`, `etiqueta`, `pesos`, `numero`, `pct`
  movidos desde `diagnosticos.$id.tsx` a un módulo puro reutilizable.
- `src/lib/vista-diagnostico.test.ts`: 11 casos nuevos. Cubren explícitamente
  la garantía documental "un cero real nunca es un guión" también en la capa
  de vista, no sólo en el motor documental.
- Suite: 211 pruebas + 1 todo (antes 200 + 1). Typecheck y build limpios.

### Bloque 2 · B2 (commit siguiente)

- `domain/validation.ts`: los hallazgos ahora se validan por ID único, igual
  que ya se hacía con los escenarios de 90 días. Si `mapearHallazgos` alguna
  vez empujara dos hallazgos con el mismo ID, `validarContextoDocumento` lo
  rechaza en vez de dejar pasar un finding duplicado a la propuesta.
- `src/lib/propuesta-invariantes.test.ts` (nuevo): corre `mapearHallazgos`
  contra 7 datasets representativos (Snake Store, Titan B1, Titan antes de
  canales, vacío, y tres variantes sintéticas con triestados en positivo,
  negativo y sin responder) y fija cuatro invariantes estructurales: IDs sin
  duplicar, ID/título no vacíos, capa válida, servicio no vacío cuando existe.
  Se decidió **no** restringir `servicio` a la lista `SERVICIOS`: el mapeo usa
  legítimamente combinaciones como `"Web e-commerce y Meta Ads"` que no son
  miembros literales de esa lista — esa restricción habría sido un falso
  positivo del propio test.
- Suite: 242 pruebas + 1 todo (antes 211 + 1). Typecheck y build limpios.

### Bloque 3 · A10 + E7 (commit siguiente)

- `documentos.$id.$slug.tsx`: los estados de carga, no-encontrado y "no se
  pudo armar el documento" ahora llevan `role="status" aria-live="polite"`,
  para que un lector de pantalla anuncie el cambio sin que el usuario tenga
  que ir a buscarlo. El error de descarga de PDF usa `role="alert"` (más
  urgente, porque responde a una acción explícita del usuario). El botón
  "Descargar PDF" expone `aria-busy` mientras genera el archivo. La barra de
  tabs es un `<nav aria-label="Documentos disponibles">` y el documento activo
  lleva `aria-current="page"`.
- No se agregaron pruebas automatizadas de esta ruta: sigue sin existir un
  arnés de testing de componentes en el repo (ver A8). Se verificó con
  typecheck + build limpios.
- Suite: sin cambio en el conteo (242 + 1); el bloque es de accesibilidad de
  UI, no de lógica pura testeable.
