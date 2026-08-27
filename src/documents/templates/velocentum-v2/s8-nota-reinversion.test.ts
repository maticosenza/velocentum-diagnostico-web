/**
 * S8 (Bloque 3 Funcional): la nota de reinversión de ahorro publicitario
 * no se renderiza si el ahorro no es publicable. Gap real encontrado al
 * escribir esta prueba — antes se renderizaba incondicionalmente en
 * ambos renderers (PDF y web), corregido en `pdf-v2/document.tsx` y
 * `web-v2/document-renderer.tsx`.
 */
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { buildProyeccion90dDocumentV2 } from "./proyeccion-90d";
import { buildMulticanalContext, buildMargenNegativoContext } from "./test-fixtures";
import { createPdfDocumentElementV2 } from "../../renderers/pdf-v2/document";
import { DocumentWebRendererV2 } from "../../renderers/web-v2/document-renderer";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

const FRASE_NOTA = "El presupuesto liberado por consolidación de pauta";

async function textoCompleto(buffer: Buffer): Promise<string> {
  const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const paginas: string[] = [];
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const contenido = await documento.getPage(pagina).then((p) => p.getTextContent());
    paginas.push(contenido.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return paginas.join(" | ");
}

describe("S8 — nota de reinversión de ahorro publicitario, sólo si es publicable", () => {
  it("caso con ahorro calculado: la nota aparece en el PDF y en el web", async () => {
    const model = buildProyeccion90dDocumentV2(buildMulticanalContext());
    const scenarios = model.sections.flatMap((s) => s.blocks).find((b) => b.type === "scenarios");
    const conAhorro = scenarios?.type === "scenarios" && scenarios.items.some((i) => i.ahorroPublicitario90d.estado === "calculado");
    expect(conAhorro, "fixture inesperado: ningún escenario con ahorro calculado").toBe(true);

    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "pantalla"));
    const texto = await textoCompleto(buffer);
    expect(texto).toContain(FRASE_NOTA);

    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain(FRASE_NOTA);
  });

  it("caso sin ningún escenario con ahorro calculado: la nota no aparece en ninguno de los dos renderers", async () => {
    const model = buildProyeccion90dDocumentV2(buildMargenNegativoContext());
    const scenarios = model.sections.flatMap((s) => s.blocks).find((b) => b.type === "scenarios");
    const algunCalculado =
      scenarios?.type === "scenarios" && scenarios.items.some((i) => i.ahorroPublicitario90d.estado === "calculado");
    expect(algunCalculado, "fixture inesperado: hay ahorro calculado, no sirve para probar la ausencia").toBe(false);

    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "pantalla"));
    const texto = await textoCompleto(buffer);
    expect(texto).not.toContain(FRASE_NOTA);

    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).not.toContain(FRASE_NOTA);
  });
});
