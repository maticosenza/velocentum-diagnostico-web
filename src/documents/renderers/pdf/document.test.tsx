import { renderToBuffer } from "@react-pdf/renderer";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDiagnosticoDocument,
  buildProyeccion90dDocument,
  buildProyeccionPropuestaDocument,
} from "../../templates/velocentum-v1";
import { buildSnakeContext, buildTitanContext } from "../../templates/velocentum-v1/test-fixtures";
import { createPdfDocumentElement, PROFILES, type PdfProfile } from "./document";
import { renderDocumentModelToBlob } from "./export-client";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import {
  casoSnakeStore,
  casoSnakeStoreCoberturaCompleta,
  casoTitanWebB1,
  configuracionRegresionFase2,
} from "../../../lib/fixtures-casos";
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

  it("portada: el título y el subtítulo nunca invaden la franja de acento, en ningún perfil (regresión: se vio texto detrás del color en A4)", () => {
    for (const profile of ["pantalla", "impresion"] as PdfProfile[]) {
      const p = PROFILES[profile];
      const pageWidth = p.pageSize === "A4" ? 595.28 : p.pageSize[0];
      const inicioFranjaSuave = pageWidth - p.coverAccentSoftOffset - p.coverAccentSoftWidth;
      const finContenido = p.coverPadding + p.coverTitleWidth;
      expect(finContenido).toBeLessThan(inicioFranjaSuave);
    }
  });

  it("perfil 'impresion' usa A4 (595.28 x 841.89), un layout propio, no una versión escalada del de pantalla", async () => {
    const model = buildProyeccionPropuestaDocument(buildSnakeContext());
    const bufferPantalla = await renderToBuffer(createPdfDocumentElement(model, "pantalla"));
    const bufferImpresion = await renderToBuffer(createPdfDocumentElement(model, "impresion"));

    const qaOutput = process.env["VELOCENTUM_PDF_IMPRESION_QA_OUTPUT"];
    if (qaOutput) {
      await mkdir(dirname(qaOutput), { recursive: true });
      await writeFile(qaOutput, bufferImpresion);
    }

    const sourcePantalla = bufferPantalla.toString("latin1");
    const sourceImpresion = bufferImpresion.toString("latin1");

    expect(sourcePantalla.match(/\/MediaBox \[0 0 960 540\]/g) ?? []).toHaveLength(
      model.sections.length,
    );
    // A4 en puntos PDF (PDFKit serializa 595.28x841.89 con precisión de punto flotante).
    const mediaBoxesA4 = sourceImpresion.match(/\/MediaBox \[0 0 595\.28\d* 841\.89\d*\]/g) ?? [];
    expect(mediaBoxesA4).toHaveLength(model.sections.length);
    expect(bufferImpresion.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("nombre de cliente largo y monto de ocho cifras no rompen la composición (no crashea, arma un PDF válido)", async () => {
    const datosConNombreLargoYMontoGrande: DatosDiagnostico = {
      ...casoSnakeStore,
      nombre_tienda:
        "Distribuidora Mayorista Internacional del Sur de Productos para el Hogar y la Oficina S.R.L.",
      facturacion_mensual: 987_654_321,
      visitas_mensuales: 5000,
      agregados_carrito: 1000,
      checkouts_iniciados: 300,
      absorbe_costo_envio: true,
    };
    const resultado = calcularDiagnostico(datosConNombreLargoYMontoGrande, configuracionRegresionFase2);
    const contexto = buildDocumentContext({
      datos: datosConNombreLargoYMontoGrande,
      resultado,
      diagnostico: { id: "test-pdf-nombre-largo", version: 1, fecha: "2026-08-22" },
      tipoDocumento: "diagnostico",
    });
    const { buildDiagnosticoDocument } = await import("../../templates/velocentum-v1");
    const model = buildDiagnosticoDocument(contexto);

    for (const profile of ["pantalla", "impresion"] as const) {
      const buffer = await renderToBuffer(createPdfDocumentElement(model, profile));
      expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
      expect(buffer.byteLength).toBeGreaterThan(5_000);
    }
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

  /**
   * Genera el set de PDFs de revisión visual (bloque visual, 2026-08-22):
   * Snake Store y Titan Web B1, diagnóstico y proyección, pantalla e
   * impresión — 8 archivos. Sólo escribe si se define
   * `VELOCENTUM_QA_PDF_DIR`; sin esa variable, la prueba igual corre y
   * verifica que los 8 documentos son PDFs válidos, sólo que no los
   * persiste. Mismo criterio que las otras pruebas de este archivo con
   * salida de QA opcional.
   */
  it("genera (u opcionalmente persiste) el set de revisión visual: Snake Store y Titan Web B1, diagnóstico y proyección, pantalla e impresión", async () => {
    const qaDir = process.env["VELOCENTUM_QA_PDF_DIR"];

    const datosSnakeConOportunidad: DatosDiagnostico = {
      ...casoSnakeStoreCoberturaCompleta,
      facturacion_mensual: 22_522_600,
      visitas_mensuales: 5000,
      agregados_carrito: 1000,
      checkouts_iniciados: 300,
      absorbe_costo_envio: true,
    };

    const casos: { nombre: string; datos: DatosDiagnostico }[] = [
      { nombre: "snake-store", datos: datosSnakeConOportunidad },
      { nombre: "titan-web-b1", datos: casoTitanWebB1 },
    ];

    for (const caso of casos) {
      const resultado = calcularDiagnostico(caso.datos, configuracionRegresionFase2);
      for (const tipo of ["diagnostico", "proyeccion_90d"] as const) {
        const contexto = buildDocumentContext({
          datos: caso.datos,
          resultado,
          diagnostico: { id: `qa-${caso.nombre}-${tipo}`, version: 1, fecha: "2026-08-22" },
          tipoDocumento: tipo,
        });
        const model =
          tipo === "diagnostico"
            ? buildDiagnosticoDocument(contexto)
            : buildProyeccion90dDocument(contexto);

        for (const profile of ["pantalla", "impresion"] as PdfProfile[]) {
          const buffer = await renderToBuffer(createPdfDocumentElement(model, profile));
          expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
          expect(buffer.byteLength).toBeGreaterThan(5_000);

          if (qaDir) {
            const archivo = join(qaDir, `${caso.nombre}-${tipo}-${profile}.pdf`);
            await mkdir(dirname(archivo), { recursive: true });
            await writeFile(archivo, buffer);
          }
        }
      }
    }
  });
});
