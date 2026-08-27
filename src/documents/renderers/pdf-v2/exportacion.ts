/**
 * D1/C-04 (Bloque 3 Funcional): punto único de bloqueo de exportación para
 * v2. Archivo NUEVO, exclusivo de v2 — nunca modifica
 * `renderers/pdf/export-client.ts` (v1, real): tocar el export real de v1
 * sería un cambio de comportamiento, prohibido por la sección 6 del
 * prompt. No está conectado a ningún botón real (sección 4.2 EXCLUIDO:
 * "no promover v2, no conectar v2 a la interfaz").
 *
 * El gate vive DENTRO de la función que genera el PDF, no en un validador
 * aparte que una UI pudiera olvidarse de llamar — "un bloqueo que sólo
 * desactiva un botón no es un bloqueo" (PASO 4.7 del prompt).
 *
 * Ver `docs/funcional/contrato-bloque-3.md` sección 2.
 */
import type { DocumentBlockV2, DocumentModelV2 } from "../../templates/velocentum-v2/types";
import { renderPdfV2ConDosPasadas, type ResultadoDosPasadasV2 } from "./paginacion";
import type { PdfProfileV2 } from "./document";

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

/**
 * Punto único de generación + exportación de un PDF v2 (PASO 1(e) del
 * inventario). Corre el gate ANTES de renderizar nada — una propuesta
 * bloqueada nunca llega a `renderPdfV2ConDosPasadas`.
 */
export async function exportarDocumentModelV2(
  model: DocumentModelV2,
  profile: PdfProfileV2,
): Promise<ResultadoDosPasadasV2> {
  verificarExportacionPermitidaV2(model);
  return renderPdfV2ConDosPasadas(model, profile);
}
