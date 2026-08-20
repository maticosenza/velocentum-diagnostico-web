import { describe, expect, it } from "vitest";
import { buildProyeccionPropuestaDocument } from "../../templates/velocentum-v1";
import { buildSnakeContext } from "../../templates/velocentum-v1/test-fixtures";
import { buildDocumentPdfFilename, slugifyPdfSegment } from "./filename";

describe("PDF filename", () => {
  it("builds a stable and portable filename from the model", () => {
    const model = buildProyeccionPropuestaDocument(buildSnakeContext());
    expect(buildDocumentPdfFilename(model)).toBe(
      "snake-store-proyeccion-y-propuesta-2026-08-20.pdf",
    );
  });

  it("removes accents, symbols and repeated separators", () => {
    expect(slugifyPdfSegment("  Tienda Núñez & Compañía  ")).toBe("tienda-nunez-compania");
  });
});
