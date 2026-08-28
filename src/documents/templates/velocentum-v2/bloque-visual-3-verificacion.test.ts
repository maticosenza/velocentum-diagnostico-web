/**
 * PASO 4 (Bloque Visual 3, HEAD de partida `82bb66e`): V1 a V4.
 *
 * V1 · el identificador `"calculado"` no existe como estado del Eje 2 en
 *      `src/documents/` (renombrado ítem 1). NO escanea `src/lib/`: el
 *      `EstadoFunnel` de `funnel.ts` usa el mismo literal para un
 *      concepto DISTINTO (desglose de tramo, no disponibilidad del Eje
 *      2) — identificado como decoy en el PASO 1 de
 *      `docs/prompts/bloque-visual-3.md`, fuera del alcance del ítem 1.
 * V2 · las páginas nuevas (funnel, R-09) cumplen el contrato de
 *      composición: cero placeholders/`undefined`/`NaN`/`null`/enums
 *      crudos, paridad semántica PDF↔web.
 * V3 · v1 no cambió — verificado por separado con un `git worktree` en
 *      `82bb66e` y comparación de texto extraído de sus 36 PDFs de
 *      revisión (idéntico); no se repite acá porque exige un proceso
 *      Node aparte, no una prueba de esta suite.
 * V4 · determinismo: dos corridas consecutivas, mismo proceso, hash
 *      idéntico — mismo patrón que `ronda-2.2.3-correcciones.test.ts`
 *      U3.
 */
import crypto from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import { configuracionRegresionFase2 } from "../../../lib/fixtures-casos";
import { DATOS_INICIALES, type DatosDiagnostico } from "../../../lib/diagnostico-form";
import { buildDocumentContext } from "../../domain";
import { buildDiagnosticoDocumentV2 } from "./diagnostico";
import { DocumentWebRendererV2 } from "../../renderers/web-v2/document-renderer";
import { renderPdfV2ConDosPasadas } from "../../renderers/pdf-v2/paginacion";
import type { PdfProfileV2 } from "../../renderers/pdf-v2/document";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

const PERFILES: PdfProfileV2[] = ["pantalla", "impresion"];

function contextoConFunnel() {
  const datos: DatosDiagnostico = {
    ...DATOS_INICIALES,
    nombre_tienda: "Fixture V2/V4 Bloque Visual 3",
    facturacion_mensual: 1_000_000,
    ticket_promedio: 2_000,
    visitas_mensuales: 10_000,
    agregados_carrito: 1_000,
    checkouts_iniciados: 600,
  };
  return buildDocumentContext({
    datos,
    resultado: calcularDiagnostico(datos, configuracionRegresionFase2),
    diagnostico: { id: "fixture-v1v4-bloque-visual-3", version: 1, fecha: "2026-08-28" },
  });
}

function archivosFuente(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) archivosFuente(ruta, acc);
    else if (/\.(ts|tsx)$/.test(entrada.name)) acc.push(ruta);
  }
  return acc;
}

describe("V1: el identificador \"calculado\" no existe como estado del Eje 2 en src/documents/", () => {
  it("cero ocurrencias del literal \"calculado\" en todo src/documents/", () => {
    const raiz = join(__dirname, "../../../documents");
    const archivos = archivosFuente(raiz).filter((a) => !a.endsWith("bloque-visual-3-verificacion.test.ts"));
    const conOcurrencia = archivos.filter((a) => /"calculado"/.test(readFileSync(a, "utf-8")));
    expect(conOcurrencia, `archivos con "calculado" residual: ${conOcurrencia.join(", ")}`).toEqual([]);
  });
});

describe("V2: composición del bloque funnel (R-09) — cero placeholders, paridad PDF↔web", () => {
  it("PDF: sin placeholders crudos en ninguna página, ambos perfiles", async () => {
    const model = buildDiagnosticoDocumentV2(contextoConFunnel());
    for (const perfil of PERFILES) {
      const { buffer } = await renderPdfV2ConDosPasadas(model, perfil);
      const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const contenido = await page.getTextContent();
        const texto = contenido.items.map((it) => ("str" in it ? it.str : "")).join(" ");
        expect(texto, `perfil ${perfil}, página ${p}`).not.toMatch(/undefined|NaN|\bnull\b/);
      }
    }
  });

  it("web: markup contiene el bloque funnel con las cuatro etapas y sin placeholders", () => {
    const model = buildDiagnosticoDocumentV2(contextoConFunnel());
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain('data-block-type="funnel"');
    for (const etiqueta of ["Visitas", "Agregados al carrito", "Checkouts iniciados", "Compras", "Conversión global"]) {
      expect(html).toContain(etiqueta);
    }
    expect(html).not.toMatch(/undefined|NaN|\bnull\b/);
  });

  it("paridad semántica PDF↔web: mismos números en la etapa de compras", async () => {
    const context = contextoConFunnel();
    const model = buildDiagnosticoDocumentV2(context);
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain("500"); // compras
    expect(html).toContain("83,3%"); // conversión compras/checkouts

    const { buffer } = await renderPdfV2ConDosPasadas(model, "pantalla");
    const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
    let textoCompleto = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const contenido = await page.getTextContent();
      textoCompleto += contenido.items.map((it) => ("str" in it ? it.str : "")).join(" ");
    }
    expect(textoCompleto).toContain("500");
    expect(textoCompleto).toContain("83,3%");
  });
});

describe("V4: determinismo — dos corridas consecutivas del diagnóstico con funnel producen el mismo PDF (hash idéntico)", () => {
  it.each(PERFILES)("perfil %s", async (perfil) => {
    const resultado1 = await renderPdfV2ConDosPasadas(buildDiagnosticoDocumentV2(contextoConFunnel()), perfil);
    const resultado2 = await renderPdfV2ConDosPasadas(buildDiagnosticoDocumentV2(contextoConFunnel()), perfil);
    const hash1 = crypto.createHash("sha256").update(resultado1.buffer).digest("hex");
    const hash2 = crypto.createHash("sha256").update(resultado2.buffer).digest("hex");
    expect(hash1, `perfil ${perfil}: los PDFs de dos corridas no son bit a bit idénticos`).toBe(hash2);
  });
});
