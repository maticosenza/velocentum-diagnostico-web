import { renderToBuffer } from "@react-pdf/renderer";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildProyeccion90dDocument,
  buildProyeccionPropuestaDocument,
} from "../../templates/velocentum-v1";
import { buildSnakeContext, buildTitanContext } from "../../templates/velocentum-v1/test-fixtures";
import { createPdfDocumentElement } from "./document";
import { renderDocumentModelToBlob } from "./export-client";

describe("Velocentum PDF renderer", () => {
  it("renders a complete 16:9 document to a PDF buffer", async () => {
    const model = buildProyeccionPropuestaDocument(buildSnakeContext());
    const buffer = await renderToBuffer(createPdfDocumentElement(model));

    const qaOutput = process.env["VELOCENTUM_PDF_QA_OUTPUT"];
    if (qaOutput) {
      await mkdir(dirname(qaOutput), { recursive: true });
      await writeFile(qaOutput, buffer);
    }

    const source = buffer.toString("latin1");
    const mediaBoxes = source.match(/\/MediaBox \[0 0 960 540\]/g) ?? [];

    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(5_000);
    expect(mediaBoxes).toHaveLength(model.sections.length);
  });

  it("renders the conditioned Titan model without requiring browser globals", async () => {
    const model = buildProyeccion90dDocument(buildTitanContext());
    const blob = await renderDocumentModelToBlob(model);

    const titanQaOutput = process.env["VELOCENTUM_TITAN_PDF_QA_OUTPUT"];
    if (titanQaOutput) {
      await mkdir(dirname(titanQaOutput), { recursive: true });
      await writeFile(titanQaOutput, Buffer.from(await blob.arrayBuffer()));
    }

    const header = Buffer.from(await blob.slice(0, 5).arrayBuffer()).toString("ascii");

    expect(blob.type).toBe("application/pdf");
    expect(header).toBe("%PDF-");
  });
});
