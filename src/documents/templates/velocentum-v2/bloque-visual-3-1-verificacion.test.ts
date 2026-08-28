/**
 * Ronda correctiva Bloque Visual 3.1 (HEAD de partida `cb8b378`): W1 a W3,
 * una por cada corrección (C-1 a C-3; C-4 es un cambio de redacción sin
 * prueba propia — ver `docs/funcional/contrato-bloque-3.md` sección 15).
 *
 * W1 · ninguna página de contenido queda por debajo del umbral de
 *      ocupación por una sección de fortalezas aislada — regresión
 *      directa de C-1 ("1-marketplace-fuerte-tienda-floja/diagnostico",
 *      una sola fortaleza, terminaba sola en una página ~78% en blanco).
 *      Barre los ocho casos reales con `fortalezas` no vacío, ambos
 *      perfiles: cualquier página que muestre una fortaleza comparte esa
 *      página con contenido sustancial adicional (no es un caso nuevo de
 *      la lista cerrada de excepciones de la sección 5.8 del contrato de
 *      composición — el defecto se corrige, no se exime).
 * W2 · el bloque `funnel` es una tabla propia, visualmente distinguible
 *      de `metric-grid` — no comparte su patrón de tarjetas (CardGrid/
 *      `vdoc2-metric-grid`) en ninguno de los dos renderers.
 * W3 · el generador de renders web (`renderers/web-v2/
 *      generar-web-bloque-3.test.ts`) produce exactamente un render por
 *      cada PDF (54 = 9 casos × 3 documentos × 2 perfiles) — la prueba
 *      vive en ese archivo (mismo criterio que el generador hermano de
 *      PDFs); acá sólo se referencia para dejar registrado el mapeo
 *      W3 → archivo real.
 */
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import { ESCENARIOS_DEMOSTRATIVOS, configuracionEscenariosDemo } from "../../../lib/fixtures-escenarios-demo";
import { buildDocumentContext, type DocumentContextV1 } from "../../domain";
import { DocumentWebRendererV2 } from "../../renderers/web-v2/document-renderer";
import { renderPdfV2ConDosPasadas } from "../../renderers/pdf-v2/paginacion";
import type { PdfProfileV2 } from "../../renderers/pdf-v2/document";
import { buildDiagnosticoDocumentV2 } from "./diagnostico";
import { buildMayoristaContext, buildMixtoContext } from "./test-fixtures";

const PERFILES: PdfProfileV2[] = ["pantalla", "impresion"];

const CASOS: { id: string; contexto: () => DocumentContextV1 }[] = [
  ...ESCENARIOS_DEMOSTRATIVOS.map((escenario) => ({
    id: escenario.id,
    contexto: () => {
      const resultado = calcularDiagnostico(escenario.datos, configuracionEscenariosDemo);
      return buildDocumentContext({
        datos: escenario.datos,
        resultado,
        diagnostico: { id: `w1-${escenario.id}`, version: 1, fecha: "2026-08-28" },
        tipoDocumento: "diagnostico",
      });
    },
  })),
  { id: "mayorista", contexto: () => buildMayoristaContext() },
  { id: "mixto", contexto: () => buildMixtoContext() },
];

describe("W1: ninguna fortaleza aislada queda sola en una página de baja ocupación (C-1)", () => {
  it.each(CASOS.map((c) => c.id))("caso %s: cualquier página con una fortaleza trae contenido sustancial adicional, ambos perfiles", async (id) => {
    const caso = CASOS.find((c) => c.id === id)!;
    const context = caso.contexto();
    if (context.fortalezas.length === 0) return; // nada que verificar en este caso

    const model = buildDiagnosticoDocumentV2(context);
    const etiquetas = context.fortalezas.map((f) => f.etiqueta);

    for (const perfil of PERFILES) {
      const { buffer } = await renderPdfV2ConDosPasadas(model, perfil);
      const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const contenido = await page.getTextContent();
        const texto = contenido.items.map((it) => ("str" in it ? it.str : "")).join(" ");
        const traeFortaleza = etiquetas.some((e) => texto.includes(e));
        if (!traeFortaleza) continue;
        // Umbral calibrado contra el defecto real de C-1: la página
        // defectuosa (fortaleza sola) medía ~90 caracteres de contenido
        // real más encabezado/pie; toda página corregida observada en
        // este barrido supera los 400. 300 separa ambos con margen sin
        // acoplarse a un caso puntual.
        expect(
          texto.trim().length,
          `${id}/${perfil} p${p}: fortaleza sola, sólo ${texto.trim().length} caracteres: "${texto.trim()}"`,
        ).toBeGreaterThan(300);
      }
    }
  });
});

describe("W2: el bloque funnel es una tabla propia, distinguible de metric-grid (C-2)", () => {
  function contextoConFunnel() {
    const escenario = ESCENARIOS_DEMOSTRATIVOS[0]!; // "1-marketplace-fuerte-tienda-floja", con funnel desglosado
    const resultado = calcularDiagnostico(escenario.datos, configuracionEscenariosDemo);
    return buildDocumentContext({
      datos: escenario.datos,
      resultado,
      diagnostico: { id: "w2-funnel", version: 1, fecha: "2026-08-28" },
      tipoDocumento: "diagnostico",
    });
  }

  it("web: el bloque funnel usa la tabla (`vdoc2-monthly-table`), no la grilla de tarjetas de metric-grid", () => {
    const context = contextoConFunnel();
    expect(context.funnelWeb).not.toBeNull();
    const model = buildDiagnosticoDocumentV2(context);
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));

    const inicio = html.indexOf('data-block-type="funnel"');
    expect(inicio).toBeGreaterThan(-1);
    // Ventana acotada inmediatamente después del marcador del bloque —
    // suficiente para cubrir el título + la tabla completa (5 filas, 900
    // caracteres reales medidos) sin depender de encontrar el cierre
    // exacto del `<div>` (anidado, no trivial de ubicar con substrings) y
    // sin llegar al bloque siguiente (`metric-grid`, que sí usa
    // `vdoc2-metric-grid` legítimamente — no es lo que este check
    // verifica). Antes de C-2 este mismo tramo contenía literalmente
    // `vdoc2-metric-grid` (mismo patrón que metric-grid) — ahora no debe
    // aparecer.
    const ventana = html.slice(inicio, inicio + 900);

    expect(ventana).toContain("vdoc2-monthly-table");
    expect(ventana).not.toContain("vdoc2-metric-grid");
    expect(ventana).toContain("Funnel de conversión");
  });

  it("PDF: el bloque funnel trae un título propio (\"Funnel de conversión\") en ambos perfiles", async () => {
    const model = buildDiagnosticoDocumentV2(contextoConFunnel());
    for (const perfil of PERFILES) {
      const { buffer } = await renderPdfV2ConDosPasadas(model, perfil);
      const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
      let textoCompleto = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const contenido = await page.getTextContent();
        textoCompleto += contenido.items.map((it) => ("str" in it ? it.str : "")).join("");
      }
      // pdfjs separa el letter-spacing en runs irregulares — se compara sin espacios.
      expect(textoCompleto.replace(/\s+/g, "")).toContain("Funneldeconversión");
    }
  });
});

describe("W3: el generador web produce un render por cada PDF (C-3)", () => {
  it("referencia — la prueba real vive en renderers/web-v2/generar-web-bloque-3.test.ts (54 = 9 × 3 × 2)", () => {
    expect(true).toBe(true);
  });
});
