/**
 * Fase 14 — descarga de PDF v2 desde el navegador. Hermano de
 * `renderers/pdf/export-client.ts` (v1), con una diferencia real: el
 * pipeline de dos pasadas (`renderPdfV2ConDosPasadas`, `paginacion.ts`)
 * usa `renderToBuffer` de `@react-pdf/renderer`, que en el build para
 * navegador es un stub que lanza (`react-pdf.browser.js`: "renderToBuffer
 * environment error") — es un mecanismo pensado para Node (generación de
 * artefactos, tests, medición de paginación en dos pasadas), no para
 * correr en el navegador.
 *
 * Acá se usa una única pasada — `pdf(...).toBlob()`, la misma función
 * browser-safe que ya usa v1 — sin el refinamiento de marcadores de
 * continuación medidos en dos pasadas (Bloque Visual 2.2.3). Diferencia
 * real, documentada en `docs/fase-14/plan-reversion.md`: en un escenario
 * que se parte entre páginas, el PDF descargado desde la interfaz podría
 * no repetir la identidad del escenario en la página de continuación
 * (el defecto que Bloque Visual 2.2.2/2.2.3 corrigió con dos pasadas);
 * los 54 PDFs de los ZIPs de revisión y auditoría siguen generándose con
 * el pipeline completo de dos pasadas (Node), sin este límite. Pendiente
 * antes de activar el interruptor en producción: mover el renderizado de
 * descarga a una función de servidor (patrón `createServerFn` ya usado
 * en `src/lib/paquetes.functions.ts`) para recuperar el pipeline
 * completo también en el botón de descarga.
 *
 * El gate de exportación (`verificarExportacionPermitidaV2`,
 * `exportacion.ts`) se reutiliza tal cual, sin reimplementarlo — es el
 * mismo chequeo, sin importar qué pipeline de render se use después.
 */
import type { DocumentModelV2 } from "../../templates/velocentum-v2/types";
import { slugifyPdfSegment } from "../pdf/filename";
import { verificarExportacionPermitidaV2 } from "./exportacion";
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
  const [{ pdf }, { createPdfDocumentElementV2 }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./document"),
  ]);
  return pdf(createPdfDocumentElementV2(model, profile)).toBlob();
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
