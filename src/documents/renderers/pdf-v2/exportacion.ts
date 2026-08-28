/**
 * D1/C-04 (Bloque 3 Funcional): punto único de bloqueo de exportación para
 * v2 — pipeline completo de dos pasadas (Node), usado por la generación
 * de artefactos y los tests. El chequeo del gate en sí (puro, sin
 * dependencias de Node) vive en `./gate-exportacion` — este archivo lo
 * reexporta para no romper a nadie que ya importaba desde acá, pero no
 * lo reimplementa. Ver ese archivo para el porqué de la separación
 * (Fase 14, ítem 3: `node:module` no existe en el navegador).
 *
 * El gate vive DENTRO de la función que genera el PDF, no en un validador
 * aparte que una UI pudiera olvidarse de llamar — "un bloqueo que sólo
 * desactiva un botón no es un bloqueo" (PASO 4.7 del prompt).
 *
 * Ver `docs/funcional/contrato-bloque-3.md` sección 2.
 */
import type { DocumentModelV2 } from "../../templates/velocentum-v2/types";
import { renderPdfV2ConDosPasadas, type ResultadoDosPasadasV2 } from "./paginacion";
import type { PdfProfileV2 } from "./document";
import { verificarExportacionPermitidaV2 } from "./gate-exportacion";

export { MENSAJE_EXPORTACION_BLOQUEADA_V2, verificarExportacionPermitidaV2 } from "./gate-exportacion";

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
