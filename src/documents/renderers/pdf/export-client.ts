import type { DocumentModel } from "../../templates/velocentum-v1";
import { buildDocumentPdfFilename } from "./filename";

export async function renderDocumentModelToBlob(model: DocumentModel): Promise<Blob> {
  const [{ pdf }, { createPdfDocumentElement }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./document"),
  ]);
  return pdf(createPdfDocumentElement(model)).toBlob();
}

export async function downloadDocumentModelPdf(
  model: DocumentModel,
  filename = buildDocumentPdfFilename(model),
): Promise<void> {
  if (typeof document === "undefined") {
    throw new Error("La descarga PDF sólo está disponible en el navegador.");
  }

  const blob = await renderDocumentModelToBlob(model);
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
