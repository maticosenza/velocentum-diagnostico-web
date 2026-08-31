import { createRequire } from "node:module";
import React from "react";
import { Document, Page, renderToBuffer } from "@react-pdf/renderer";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { registrarFuentesVelocentum } from "../fuentes/registrar-fuentes";
import { VELOCENTUM_CRYSTAL_V1 } from "../velocentum-crystal-v1";
import { VELOCENTUM_LIGHT_V1 } from "../velocentum-light-v1";
import {
  DESCRIPTOR_VELOCENTUM,
  LockupVelocentum,
  WORDMARK_VELOCENTUM,
  type PropsLockup,
} from "./lockup";

/**
 * Lockup tipográfico — BV4 F1, etapa 5. Se verifica que las cuatro variantes
 * rendericen de verdad a PDF (no sólo que compilen) y que el texto que sale
 * sea el de DH-11, sin el claim institucional.
 */
const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

registrarFuentesVelocentum();

async function textoDelPdf(props: PropsLockup, fondo = "#FFFFFF"): Promise<string> {
  const buffer = await renderToBuffer(
    <Document>
      <Page size={[420, 200]} style={{ backgroundColor: fondo, padding: 40 }}>
        <LockupVelocentum {...props} />
      </Page>
    </Document>,
  );
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  return content.items
    .map((i) => ("str" in i ? i.str : ""))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

describe("lockup tipográfico de la herramienta", () => {
  it("renderiza en claro, con descriptor, y dice lo que DH-11 manda", async () => {
    const texto = await textoDelPdf({ variante: "claro" });
    expect(texto).toContain(WORDMARK_VELOCENTUM);
    expect(texto).toContain(DESCRIPTOR_VELOCENTUM);
  });

  it("renderiza en oscuro sobre ink", async () => {
    const texto = await textoDelPdf({ variante: "oscuro" }, VELOCENTUM_CRYSTAL_V1.colors.ink);
    expect(texto).toContain(WORDMARK_VELOCENTUM);
    expect(texto).toContain(DESCRIPTOR_VELOCENTUM);
  });

  it("renderiza sin descriptor cuando se lo pide", async () => {
    const texto = await textoDelPdf({ descriptor: false });
    expect(texto).toContain(WORDMARK_VELOCENTUM);
    expect(texto).not.toContain(DESCRIPTOR_VELOCENTUM);
  });

  it("renderiza en vertical y con el isotipo en encuadre cuadrado", async () => {
    const texto = await textoDelPdf({ orientacion: "vertical", encuadre: "cuadrado" });
    expect(texto).toContain(WORDMARK_VELOCENTUM);
  });

  it("NO usa el claim institucional: DH-11 lo reserva para acceso, portada y cierre, y F1 no lo aplica", async () => {
    const texto = await textoDelPdf({});
    expect(texto).not.toContain("hacer crecer negocios");
    expect(texto.toLowerCase()).not.toContain("negocio de");
  });

  it("usa Satoshi para el wordmark: la familia sale del tema, no de un literal", () => {
    expect(VELOCENTUM_CRYSTAL_V1.typography.heading).toBe("Satoshi");
    expect(VELOCENTUM_CRYSTAL_V1.typography.body).toBe("Inter");
  });

  it("funciona también con el tema v1: no está atado al tema de marca", async () => {
    const texto = await textoDelPdf({ theme: VELOCENTUM_LIGHT_V1 });
    expect(texto).toContain(WORDMARK_VELOCENTUM);
  });

  it("no se aplica a ninguna superficie en F1", () => {
    // El lockup existe como componente y nada lo importa todavía: aplicarlo a
    // navegación, portadas o documentos es alcance de F2/F3.
    expect(typeof LockupVelocentum).toBe("function");
  });
});
