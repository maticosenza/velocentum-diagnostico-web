import type { DocumentModel } from "../../templates/velocentum-v1";

const KIND_LABELS: Record<DocumentModel["kind"], string> = {
  diagnostico: "diagnostico",
  proyeccion_90d: "proyeccion-90-dias",
  propuesta: "propuesta",
  proyeccion_propuesta: "proyeccion-y-propuesta",
};

export function slugifyPdfSegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildDocumentPdfFilename(model: DocumentModel): string {
  const client = slugifyPdfSegment(model.metadata.clientName) || "cliente";
  const date = slugifyPdfSegment(model.metadata.date) || "sin-fecha";
  return `${client}-${KIND_LABELS[model.kind]}-${date}.pdf`;
}
