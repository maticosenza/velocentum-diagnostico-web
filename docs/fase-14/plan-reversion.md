# Plan de reversión — Fase 14 (integración controlada de v2)

## 1 · El interruptor

**Un único archivo, un único valor:** `src/documents/motor-activo.ts`.

```ts
export const MOTOR_DOCUMENTAL_ACTIVO: MotorDocumental = "v1";
```

- **Activar v2:** cambiar el valor a `"v2"`.
- **Revertir a v1:** cambiar el valor a `"v1"`.

Nada más lee ni decide el motor por su cuenta. Los tres puntos que antes
elegían v1 de forma hardcodeada (`docs/fase-14/inventario-paso1.md`
sección a) ahora sólo *consumen* el resultado de este único archivo:

- `src/documents/build-document.ts`, función `armarDocumentoActivo` —
  lee `MOTOR_DOCUMENTAL_ACTIVO` UNA sola vez, arma el modelo con el
  motor que corresponde, y devuelve `{ engine: "v1" | "v2", model }`.
- `src/routes/_authenticated/documentos.$id.$slug.tsx` — nunca importa
  `MOTOR_DOCUMENTAL_ACTIVO` directamente; hace `switch` sobre
  `resuelto.engine` (el valor que YA decidió `armarDocumentoActivo`)
  para elegir `DocumentWebRenderer` o `DocumentWebRendererV2`, y
  `downloadDocumentModelPdf` o `downloadDocumentModelPdfV2`.
- `src/documents/renderers/pdf/export-client.ts` (v1) y
  `src/documents/renderers/pdf-v2/export-client.ts` (v2) — cada uno sólo
  sabe renderizar SU propio tipo de modelo; ninguno decide cuál usar.

## 2 · Qué se pierde y qué no al revertir

**Revertir (`"v2"` → `"v1"`) no pierde nada**: v1 sigue siendo el mismo
código, sin tocar, que producía la interfaz antes de esta fase — no hay
ningún dato, configuración ni documento generado con v2 que dependa de
que el interruptor siga en `"v2"` para seguir funcionando. Los
diagnósticos ya guardados (`datos`/`derivados`/`estados_bloque`/`fugas`
en la tabla `diagnostico`) son el mismo dato crudo que ambos motores
leen — revertir el interruptor no borra ni transforma nada persistido,
sólo cambia qué código arma el documento la PRÓXIMA vez que alguien lo
pida.

**Lo único "perdido" al activar v2 (mientras esté activo) es cosmético,
no de datos**: la interfaz deja de mostrar el documento combinado
"Proyección + propuesta" (`proyeccion-propuesta`), que hoy sólo existe
en v1 — ver `docs/fase-14/inventario-paso1.md`, nota sobre
`DOCUMENTOS_DISPONIBLES_V2`. Revertir a v1 lo devuelve de inmediato, sin
ninguna acción adicional.

## 3 · Cómo verificar que la reversión funcionó

1. `git diff src/documents/motor-activo.ts` debe mostrar sólo la línea
   del valor (`"v1"` en vez de `"v2"`, o viceversa) — ningún otro
   archivo debería cambiar para revertir.
2. `npx vitest run` — la línea base completa (802 passed + 1 todo, ver
   sección 12 del handoff) debe volver exactamente a ese número. Las
   pruebas X1/X7 (`fase-14-x1-x4-x5-x7.test.ts`) verifican
   específicamente que `MOTOR_DOCUMENTAL_ACTIVO === "v1"` y que
   `armarDocumentoActivo` delega en `buildDocumentModelDesdeDiagnostico`
   sin ninguna diferencia estructural — si la reversión quedó a medias,
   estas dos pruebas fallan.
3. `npx tsc --noEmit` y `npx vite build` limpios.
4. En la interfaz: `/documentos/:id/:slug` para cualquier diagnóstico
   real debe mostrar exactamente el mismo documento (misma composición,
   mismo copy) que mostraba antes de esta fase, y las cuatro pestañas
   (incluida "Proyección + propuesta") vuelven a estar disponibles.

## 4 · Prueba real de la reversión (hecha en esta sesión, no sólo descrita)

Secuencia ejecutada tal cual, con el archivo real (sin mocks) —
evidencia completa en el historial de esta sesión:

1. **Activar**: `src/documents/motor-activo.ts` editado a `"v2"`.
2. **Generar** (con el flag real en `"v2"`, sin mockear nada): se llamó
   `armarDocumentoActivo` con un diagnóstico real (fixture "Snake
   Store") y se confirmó `engine === "v2"`; se renderizó el PDF v2
   resultante con `renderPdfV2ConDosPasadas` y se confirmó que es un PDF
   válido (`%PDF-`, > 3000 bytes).
   - Efecto colateral esperado y confirmado: con el flag en `"v2"`, las
     pruebas X1/X7 (que aseveran `MOTOR_DOCUMENTAL_ACTIVO === "v1"` y
     que `armarDocumentoActivo` delega en v1) **fallan** — 4 de 7 en
     `fase-14-x1-x4-x5-x7.test.ts` — prueba de que son aserciones reales
     sobre el archivo real, no tautologías.
3. **Revertir**: `src/documents/motor-activo.ts` editado de vuelta a
   `"v1"`.
4. **Generar** (con el flag ya revertido): `npx vitest run` completo →
   **802 passed + 1 todo**, idéntico al número previo a los pasos 1-3.
   `npx tsc --noEmit` y `npx vite build` limpios.

No quedó ningún archivo modificado fuera de `motor-activo.ts` durante
la prueba (los cambios de los pasos 2-3 fueron exclusivamente sobre ese
único archivo, más un archivo de test temporal creado y borrado en el
mismo paso, nunca commiteado).

## 5 · Límite conocido, pendiente antes de activar en producción

`src/documents/renderers/pdf-v2/export-client.ts` (descarga desde la
interfaz) usa una única pasada de renderizado (`pdf(...).toBlob()`,
browser-safe) en vez del pipeline completo de dos pasadas
(`renderPdfV2ConDosPasadas`, `paginacion.ts`) que generan los 54 PDFs de
cada ZIP de revisión/auditoría — ese pipeline depende de
`renderToBuffer`, que en el build de navegador de `@react-pdf/renderer`
es un stub que lanza (`react-pdf.browser.js`: "renderToBuffer
environment error"), confirmado leyendo el paquete instalado. Con una
única pasada, el PDF descargado desde el botón de la interfaz no recibe
el refinamiento de marcadores de continuación medidos en dos pasadas
(Bloque Visual 2.2.3) — sólo importa para escenarios que se parten
entre páginas; para el resto del documento no hay ninguna diferencia.
Pendiente, documentado, no resuelto en esta fase (P2: v2 queda inactivo,
así que este límite no afecta a ningún usuario real todavía): mover el
renderizado de descarga a una función de servidor (patrón
`createServerFn`, ya usado en `src/lib/paquetes.functions.ts`) antes de
activar el interruptor en producción, para recuperar el pipeline
completo también en el botón de descarga.
