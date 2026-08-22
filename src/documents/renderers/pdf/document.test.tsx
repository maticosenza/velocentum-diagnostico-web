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
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import { casoSnakeStore, configuracionRegresionFase2 } from "../../../lib/fixtures-casos";
import { buildDocumentContext } from "../../domain";
import type { DatosDiagnostico } from "../../../lib/diagnostico-form";

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

  it("renders the monthly detail table with real pipeline data without crashing", async () => {
    // El fixture armado a mano (buildTitanContext/buildSnakeContext) siempre
    // trae `mensual: []`; hace falta el pipeline real para que la tabla
    // mensual tenga contenido que renderizar.
    const datosConOportunidad: DatosDiagnostico = {
      ...casoSnakeStore,
      facturacion_mensual: 22_522_600,
      visitas_mensuales: 5000,
      agregados_carrito: 1000,
      checkouts_iniciados: 300,
      absorbe_costo_envio: true,
    };
    const resultado = calcularDiagnostico(datosConOportunidad, configuracionRegresionFase2);
    const contexto = buildDocumentContext({
      datos: datosConOportunidad,
      resultado,
      diagnostico: { id: "test-pdf-mensual", version: 1, fecha: "2026-08-20" },
      tipoDocumento: "proyeccion_90d",
    });
    const model = buildProyeccion90dDocument(contexto);
    const scenariosBlock = model.sections
      .flatMap((section) => section.blocks)
      .find((block) => block.type === "scenarios");
    if (scenariosBlock?.type !== "scenarios") throw new Error("Fixture debe traer un escenario calculable");
    expect(scenariosBlock.items.some((item) => item.monthly.length > 0)).toBe(true);

    const buffer = await renderToBuffer(createPdfDocumentElement(model));
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(5_000);
  });
});
