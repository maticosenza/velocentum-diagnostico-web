# Handoff nocturno · continuación · 20 de agosto de 2026

## Punto de partida

- Rama base: `feat/fase3-auditoria-diagnostico` @ `5cee6bd140fdc1c5d278a101ee4fbd24dda199c3`
  (verificado contra `origin` antes de empezar).
- Rama de trabajo: `feat/noche-continuacion`, creada desde ese SHA.
- Línea base confirmada antes de tocar nada: **183 pruebas correctas y 1 `todo`**
  (15 archivos), typecheck y build limpios.
- `main` sigue en `92727e0`. La rama de integración original
  (`feat/fase3-auditoria-diagnostico`) no fue tocada. No se usó Lovable ni se
  publicó nada.

## Estado al cierre

- Rama: `feat/noche-continuacion` @ `360a4f4`, pusheada a `origin`.
- **200 pruebas correctas y 1 `todo`** (17 archivos). Typecheck y build
  (cliente/SSR/Nitro) limpios después de cada bloque.
- No se desactivó ni se debilitó ninguna prueba existente.

## Bloques completados

### 1 · Conectar el diagnóstico persistido al motor documental (`2de1fce`)

- `src/documents/domain/from-diagnostico.ts`: reconstruye `ResultadoCalculo`
  desde la fila guardada en Supabase **sin volver a ejecutar el motor**. Los
  bloques de semáforo ausentes se completan como `sin_datos` (nunca verde por
  default) y una `oportunidad_total` corrupta o ausente no se publica como
  monto.
- `src/documents/build-document.ts`: catálogo único de documentos disponibles
  (`DOCUMENTOS_DISPONIBLES`) y `buildDocumentModelDesdeDiagnostico`, el único
  punto que la interfaz usa para armar un `DocumentModel` a partir de una fila
  persistida. Evita que vista previa y descarga puedan divergir.
- Pruebas: reproduce byte a byte el contexto armado directamente desde el
  motor; falla explícitamente si la fila no trae `datos` o `derivados`; no
  fabrica escenarios ni propuesta comercial.

### 2 · Vista de previsualización y botones de descarga (`5845ec5`)

- Nueva ruta `/documentos/$id/$slug`
  (`src/routes/_authenticated/documentos.$id.$slug.tsx`): cliente-only,
  arma el modelo desde el diagnóstico persistido (bloque 1) y lo renderiza con
  `DocumentWebRenderer`. Tabs para alternar entre diagnóstico, proyección 90
  días, propuesta y proyección+propuesta. Botón "Descargar PDF" que usa el
  export client existente (`renderers/pdf/export-client.ts`, ya probado) vía
  import dinámico, sin duplicar lógica de render.
- El detalle del diagnóstico (`diagnosticos.$id.tsx`) suma un menú "Ver
  documentos" con un link a cada vista previa.
- Si el diagnóstico guardado no trae lo mínimo para armar el documento
  (`datos` o `derivados`), la ruta muestra un estado vacío explícito en vez de
  inventar cifras.
- Respeta los estados del motor documental sin alterarlos: retenido, no
  aplica, cero real, envío triestado y precio comercial sólo con aprobación
  manual — todo eso vive en `domain/build-context.ts` y `domain/blocks.ts`,
  que este bloque no modificó.
- No se muestran escenarios de 90 días en ningún documento: `escenarios90d`
  sigue vacío porque el motor de escenarios todavía no existe (ver
  pendientes).

### 3 · Reactivación del hallazgo "clips de Mercado Libre" (`360a4f4`)

- Uno de los dos hallazgos desactivados en fase 3
  (`docs/fase3-evidencia-pendiente.md`) tenía una especificación exacta y
  autocontenida: un campo triestado `ml_tiene_clips: boolean | null` donde
  sólo `false` explícito activa el hallazgo.
- Se agregó el campo al modelo (`lib/diagnostico-form.ts`), al formulario
  (`diagnosticos.nuevo.tsx`, mismo patrón `CampoSiNo` que el resto de los
  triestado) y la regla de activación en `lib/propuesta.ts`
  (`vende_mercado_libre === true && ml_tiene_clips === false`).
- No requirió migración: la columna `datos` es JSON en Supabase.
- `docs/fase3-evidencia-pendiente.md` actualizado: este ítem queda resuelto;
  el de "plan mal dimensionado" sigue documentado como pendiente.

## Pendientes deliberados (documentados, no bloqueantes para el resto)

- **Motor de escenarios a 90 días — bloqueado por falta de especificación
  determinística.** `docs/motor-documental-v1.md` define la estructura de la
  proyección (portada, cobertura, escenario conservador/base/potencial,
  palancas, restricciones) y una regla de nomenclatura (acumulado 90 días ≠
  ritmo mensual día 90), pero **no define las fórmulas** que convierten el
  resultado del diagnóstico en esas cifras. Inventar esas fórmulas sería una
  decisión de negocio, no un requisito determinístico documentado — por eso
  no se tocó. Lo que sí existe y quedó verificado: el contrato de tipos
  (`Escenario90d`), las políticas de publicación (`escenarioPuedeMostrarse`,
  el potencial exige confianza alta) y la validación de contexto
  (`validarContextoDocumento`), todo already-implementado antes de esta
  sesión. El próximo paso real es que alguien defina, con ejemplos numéricos,
  cómo se calcula cada escenario a partir de `ResultadoCalculo`.
- **Hallazgo "plan de plataforma mal dimensionado" — sigue sin datos.**
  Necesita costo real del plan actual, costo de una alternativa comparable,
  el límite o función concreta en uso y el ahorro verificable. Ninguno de
  esos datos se releva hoy; agregar el hallazgo sin ellos volvería a violar
  la regla de "no afirmar sin evidencia" que fase 3 ya corrigió una vez.
- **Logo y tipografías oficiales** — siguen pendientes porque los assets no
  están en el repositorio.
- **Titan Web B2** — no se tocó, por instrucción explícita. Sigue
  necesitando envío neto confirmado y liquidación real de Mercado Libre antes
  de poder cerrarse.
- **Fases de auditoría por plataforma, mayorista/mixto, retención y rediseño
  integral** — no se empezaron esta noche; son bloques grandes que conviene
  planificar por separado, no algo que quepa en "bloque pequeño verificable".

## Riesgos y notas para quien retome

- La ruta de previsualización es `ssr: false` (usa Supabase client-side igual
  que el resto de las rutas autenticadas); no se probó en un navegador real
  contra datos vivos de Supabase en esta sesión — sólo se verificó con
  pruebas unitarias/de integración (`build-document.test.ts`,
  `document-renderer.test.tsx`) y build/typecheck limpios. Antes de mostrarla
  a un cliente conviene abrirla una vez contra un diagnóstico real.
- `src/routeTree.gen.ts` es un archivo generado y versionado; se regeneró
  automáticamente al correr `npm run build` después de agregar la nueva ruta.
  Si alguien edita rutas a mano sin correr build/dev, ese archivo quedará
  desactualizado.
- El campo `ml_tiene_clips` es opcional/triestado como el resto: los
  diagnósticos guardados antes de este cambio lo leen como `null` (no se
  preguntó), no como "sin clips". No hace falta backfill.

## Cómo verificar

```bash
npm test        # 200 passed | 1 todo
npm run typecheck
npm run build
```

Commits de esta sesión, en orden:

1. `2de1fce` — Conecta el diagnóstico persistido al motor documental.
2. `5845ec5` — Agrega vista de previsualización documental y botones de
   descarga.
3. `360a4f4` — Reactiva el hallazgo de clips de Mercado Libre con triestado
   explícito.
