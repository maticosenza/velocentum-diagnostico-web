import type { DocumentModel } from "../../templates/velocentum-v1";
import { buildDocumentPdfFilename } from "./filename";
import type { PdfProfile } from "./document";

export async function renderDocumentModelToBlob(
  model: DocumentModel,
  profile: PdfProfile = "pantalla",
): Promise<Blob> {
  const [{ pdf }, { createPdfDocumentElement }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./document"),
  ]);
  return pdf(createPdfDocumentElement(model, profile)).toBlob();
}

export async function downloadDocumentModelPdf(
  model: DocumentModel,
  profile: PdfProfile = "pantalla",
  filename = buildDocumentPdfFilename(model),
): Promise<void> {
  if (typeof document === "undefined") {
    throw new Error("La descarga PDF sólo está disponible en el navegador.");
  }

  const blob = await renderDocumentModelToBlob(model, profile);
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
