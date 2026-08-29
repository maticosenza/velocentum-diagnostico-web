/**
 * Fase 14 — descarga de PDF v2 desde el navegador. Hermano de
 * `renderers/pdf/export-client.ts` (v1).
 *
 * Fase 14.1 (ítem C-3, 2026-08-28, decisión humana de Matías — vía
 * "cliente" de `docs/fase-14/investigacion-c3.md` sección 3): usa el
 * pipeline COMPLETO de dos pasadas (`renderPdfV2ConDosPasadas`,
 * `paginacion.ts`) — el mismo mecanismo con el que se generan los 54
 * PDFs de los ZIPs de revisión, con el refinamiento de marcadores de
 * continuación medidos en dos pasadas (Bloque Visual 2.2.3). Antes de
 * esta ronda, la descarga usaba una sola pasada porque
 * `renderPdfV2ConDosPasadas` dependía de `renderToBuffer` (stub que
 * lanza en el build de navegador) y de `require.resolve` de Node (rompía
 * el bundle: "Module 'node:module' has been externalized", ítem 5 de
 * Fase 14) — las dos cosas se corrigieron en `paginacion.ts` (`pdf(...).toBlob()`
 * en vez de `renderToBuffer`, import estático del worker de `pdfjs` en
 * vez de `require.resolve`), así que ahora `paginacion.ts` es universal
 * (Node y navegador) y esta función lo importa directo.
 *
 * El gate de exportación (`verificarExportacionPermitidaV2`) se importa
 * de `./gate-exportacion` — mismo chequeo que usa `exportacion.ts`, un
 * solo lugar declara la lógica, los dos la importan.
 */
import type { DocumentModelV2 } from "../../templates/velocentum-v2/types";
import { slugifyPdfSegment } from "../pdf/filename";
import { verificarExportacionPermitidaV2 } from "./gate-exportacion";
import type { PdfProfileV2 } from "./document";

const KIND_LABELS_V2: Record<DocumentModelV2["kind"], string> = {
  diagnostico: "diagnostico",
  proyeccion_90d: "proyeccion-90-dias",
  propuesta: "propuesta",
};

export function buildDocumentPdfFilenameV2(model: DocumentModelV2): string {
  const client = slugifyPdfSegment(model.metadata.clientName) || "cliente";
  const date = slugifyPdfSegment(model.metadata.date) || "sin-fecha";
  return `${client}-${KIND_LABELS_V2[model.kind]}-${date}.pdf`;
}

export async function renderDocumentModelV2ToBlob(
  model: DocumentModelV2,
  profile: PdfProfileV2 = "pantalla",
): Promise<Blob> {
  verificarExportacionPermitidaV2(model);
  const { renderPdfV2ConDosPasadas } = await import("./paginacion");
  const { buffer } = await renderPdfV2ConDosPasadas(model, profile);
  return new Blob([buffer.slice()], { type: "application/pdf" });
}

export async function downloadDocumentModelPdfV2(
  model: DocumentModelV2,
  profile: PdfProfileV2 = "pantalla",
  filename = buildDocumentPdfFilenameV2(model),
): Promise<void> {
  if (typeof document === "undefined") {
    throw new Error("La descarga PDF sólo está disponible en el navegador.");
  }

  const blob = await renderDocumentModelV2ToBlob(model, profile);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 0);
}
