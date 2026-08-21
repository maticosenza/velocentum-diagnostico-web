# Handoff nocturno · controlador autónomo · 20 de agosto de 2026

Cierre de la sesión de ejecución continua sobre `feat/noche-continuacion`. La
cola completa vive en `docs/cola-nocturna.md`, con el detalle de cada bloque;
este documento es el resumen ejecutivo.

## Resultado

**Toda la cola quedó completada o justificadamente bloqueada.** No quedó
ningún ítem en estado `pendiente` sin resolver — cada fila de
`docs/cola-nocturna.md` es `completado`, `bloqueado_datos`,
`bloqueado_comercial` o `bloqueado_migracion`, con la razón puntual escrita
al lado.

- Rama: `feat/noche-continuacion`, 10 commits por delante de la base
  (`5cee6bd`, `feat/fase3-auditoria-diagnostico`), todos pusheados a
  `origin`.
- `main` sigue en `92727e0`. La rama de integración original no se tocó.
  No se usó Lovable ni se publicó nada.
- Suite final: **242 pruebas correctas y 1 `todo`** (19 archivos), arrancando
  desde 200+1 al comienzo de esta sesión. Typecheck, build (cliente/SSR/Nitro)
  y lint de todos los archivos tocados, limpios en cada bloque.

## Commits de esta sesión (orden cronológico)

1. `6f63663` — Cola de trabajo nocturna con clasificación completa.
2. `e2a6cc3` — Extrae y testea los helpers de formato de la vista de
   diagnóstico (`lib/vista-diagnostico.ts`, 11 pruebas nuevas).
3. `ecff8e8` — Invariantes de consistencia contra hallazgos duplicados
   (`validarContextoDocumento` + `propuesta-invariantes.test.ts`, 31 pruebas
   nuevas entre ambos).
4. `73c5ad4` — Accesibilidad de la vista de previsualización documental
   (`role="status"`, `role="alert"`, `aria-current`, `aria-busy`).
5. `78d6b67` — Auditoría de revelado progresivo del formulario: sin cambios
   de código, el formulario ya está bien condicionado.
6. `64694a5` — Elimina código muerto (`esDocumentoDisponible`, sin
   consumidores reales).

(Los commits previos a esta sesión — adaptador documental, ruta de
previsualización, reactivación de `clips_ml` — quedaron documentados en
`docs/handoff-nocturno-2026-08-20-continuacion.md`.)

## Bloques completados esta sesión

- **A9** — helpers de formato (`pesos`, `numero`, `pct`, `etiqueta`)
  extraídos a un módulo puro y testeados: un cero real nunca es un guión, un
  valor ausente o no finito siempre lo es.
- **B2** — hallazgos duplicados ahora se rechazan en
  `validarContextoDocumento`, igual que los escenarios; `mapearHallazgos` se
  corre contra 7 datasets representativos verificando IDs sin duplicar,
  campos no vacíos y capa válida.
- **A10 + E7** — estados de carga, error y "documento imposible de armar" en
  la vista de previsualización ahora son accesibles para lectores de
  pantalla.
- **C4 + C6** — auditoría confirmó que el formulario ya implementa revelado
  progresivo extenso (por canal, por modo A/B, por triestado de envío); no
  había ningún cambio seguro que hacer sin una decisión de producto.
- **E5** — único código muerto real introducido por la rama
  (`esDocumentoDisponible`) eliminado; dos falsos positivos de la primera
  pasada descartados tras revisión manual.

## Bloqueos, con evidencia

| Ítem | Tipo de bloqueo | Por qué |
|---|---|---|
| Motor de escenarios a 90 días (fórmulas reales) | comercial | `docs/motor-documental-v1.md` define estructura y nomenclatura, no fórmulas. Inventarlas sería fijar una regla de negocio sin mandato. |
| Reglas comerciales mayoristas | comercial | No existe ninguna definición de precios/condiciones mayoristas en el repositorio. |
| Fases de auditoría por plataforma / mayorista-mixto / retención / rediseño integral | comercial | Mencionadas en el handoff previo como parte de "el plan", pero no hay documento con su alcance en este repo. No se puede planificar en el vacío. |
| Hallazgo "plan de plataforma mal dimensionado" | datos | Necesita costo real del plan actual, costo de alternativa, límite en uso y ahorro verificable — nada de eso se releva hoy. |
| Rediseño de recuento de campos del formulario (C5) | comercial | Qué campos son "núcleo" para una llamada de 45 minutos es una decisión de producto/UX que no está especificada; el formulario ya tiene un modo B ("solo conversado") construido exactamente para ese escenario. |
| Caso B2 de Titan Web | datos | `it.todo` explícito; instrucción explícita del usuario de no cerrarlo; requiere envío neto y liquidación real que no están disponibles. |
| Logo y tipografías oficiales | datos | Assets no están en el repositorio. |
| Pruebas de componente de las rutas nuevas (A8) | infraestructura | El repo no tiene `@testing-library/react` ni `jsdom` configurado, y ninguna ruta existente tiene test de componente. Agregar ese arnés es un cambio de infraestructura, no un bloque chico — se dejó documentado en vez de improvisarlo a las 22 h. |

## Restricciones respetadas

- `main` sin tocar (`92727e0` intacto).
- Rama de integración original sin tocar.
- Sin Lovable, sin publicación.
- Sin datos inventados de Titan Web.
- Titan B2 sin cerrar.
- Ninguna prueba desactivada ni suavizada — sólo se agregaron pruebas.
- Sin comandos destructivos.
- Ninguna otra rama modificada.
- La rama quedó en un estado recuperable en cada commit (suite + typecheck +
  build verdes antes de cada push).

## Siguiente acción recomendada

No queda trabajo determinístico y seguro pendiente en esta rama. Los
próximos pasos reales requieren, en orden de esfuerzo:

1. **Decisión de producto** sobre qué campos del formulario son
   verdaderamente prescindibles en una llamada de 45 minutos (C5) — con esa
   decisión, el cambio de UI es directo y de bajo riesgo porque el
   mecanismo de revelado progresivo ya existe.
2. **Fórmulas del motor de escenarios a 90 días** (D1), con ejemplos
   numéricos concretos — el contrato de tipos, las políticas de publicación
   y la validación ya están implementados y probados; sólo falta la lógica
   de cálculo en sí.
3. **Datos comparativos** para reactivar el hallazgo de plan mal
   dimensionado (costo actual, costo de alternativa, límite en uso, ahorro
   verificable).
4. Opcionalmente, agregar `@vitest/coverage-v8` para medir cobertura real y
   encontrar ramas sin ejercitar en `calculo-diagnostico.ts` — no se hizo
   esta noche porque instalar una dependencia nueva no es un bloque chico
   reversible en el mismo sentido que editar código existente.

## Cómo verificar

```bash
npm test        # 242 passed | 1 todo
npm run typecheck
npm run build
```
