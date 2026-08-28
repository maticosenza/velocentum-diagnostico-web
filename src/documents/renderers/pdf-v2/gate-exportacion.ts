/**
 * D1/C-04 (Bloque 3 Funcional): el chequeo puro del bloqueo de
 * exportación, sin ninguna dependencia de Node — `exportacion.ts`
 * importaba `renderPdfV2ConDosPasadas` de `./paginacion` para el
 * pipeline de dos pasadas, que usa `createRequire` (Node) para resolver
 * el worker de `pdfjs-dist`. En un módulo ES estático, importar
 * CUALQUIER nombre de `exportacion.ts` arrastra todo su grafo de
 * módulos — incluido `paginacion.ts` — al bundle; en el navegador
 * `node:module` está externalizado (Vite lo deja vacío), así que
 * `createRequire` revienta apenas el módulo se evalúa. Fase 14, ítem 3
 * (integración v2 en la interfaz): encontrado en la validación real por
 * el flujo de la interfaz (ítem 5) — nunca apareció en los tests, que
 * corren en Node, no en un bundle de navegador.
 *
 * Este archivo es el ÚNICO que declara la lógica del gate; tanto
 * `exportacion.ts` (Node, dos pasadas — generación de artefactos y
 * tests) como `export-client.ts` (navegador, una pasada — el botón de
 * descarga real) importan de acá, nunca reimplementan el chequeo.
 */
import type { DocumentBlockV2, DocumentModelV2 } from "../../templates/velocentum-v2/types";

export const MENSAJE_EXPORTACION_BLOQUEADA_V2 =
  "Selección comercial pendiente: no se puede exportar una propuesta sin selección comercial confirmada.";

function bloqueOfertaComercial(
  model: DocumentModelV2,
): Extract<DocumentBlockV2, { type: "commercial-offer" }> | null {
  for (const section of model.sections) {
    for (const block of section.blocks) {
      if (block.type === "commercial-offer") return block;
    }
  }
  return null;
}

/**
 * Lanza si `model` es una propuesta sin selección comercial confirmada.
 * `comercialDesdeEscalera()` (`domain/build-context.ts`) ya garantiza que
 * `pendiente: true` es exactamente "sin selección confirmada" (revalida
 * `confirmado === true` y `niveles.length > 0` antes de construir el
 * modelo) — este gate no reimplementa esa lógica, sólo la hace cumplir en
 * el punto de exportación.
 *
 * No cambia el modelo: la vista previa interna de la propuesta SIEMPRE se
 * construye igual (D1), pendiente o no.
 */
export function verificarExportacionPermitidaV2(model: DocumentModelV2): void {
  if (model.kind !== "propuesta") return;
  const bloque = bloqueOfertaComercial(model);
  if (bloque === null || bloque.pendiente === true) {
    throw new Error(MENSAJE_EXPORTACION_BLOQUEADA_V2);
  }
}
