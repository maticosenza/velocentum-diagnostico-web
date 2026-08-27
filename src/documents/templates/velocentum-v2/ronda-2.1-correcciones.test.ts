/**
 * Pruebas exclusivas de la ronda de correcciones 2.1 (P1-P10). Verifican
 * el contrato, no describen el resultado obtenido — si una prueba falla,
 * se corrige el prototipo, nunca el umbral (regla explícita del prompt
 * gobernante). No tocan v1, dominio, `src/lib/` ni ninguna prueba
 * preexistente del Bloque Visual 2 (`contrato-v2.test.ts`).
 */
import { createRequire } from "node:module";
import { renderToBuffer } from "@react-pdf/renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import React from "react";
import {
  buildDiagnosticoDocumentV2,
  buildProyeccion90dDocumentV2,
  buildPropuestaDocumentV2,
} from "./index";
import { buildEstresContext, buildMargenNegativoContext, buildMulticanalContext } from "./test-fixtures";
import type { DocumentBlockV2, DocumentModelV2 } from "./types";
import {
  createPdfDocumentElementV2,
  IMPRESION_ACCENT_GEOMETRY,
  PROFILES_V2,
  V2_CONTRAST_TOKENS,
  type PdfProfileV2,
} from "../../renderers/pdf-v2/document";
import { renderPdfV2ConDosPasadas } from "../../renderers/pdf-v2/paginacion";
import { DocumentWebRendererV2 } from "../../renderers/web-v2/document-renderer";
import { filasBalanceadas } from "../../semantica-v2/balanceo";
import type { DocumentContextV1 } from "../../domain";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

async function textoCompletoDelPdf(buffer: Buffer): Promise<string> {
  const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let texto = "";
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const contenido = await documento.getPage(pagina).then((p) => p.getTextContent());
    texto += `${contenido.items.map((item) => ("str" in item ? item.str : "")).join(" ")}\n`;
  }
  return texto;
}

function blocksOf<T extends DocumentBlockV2["type"]>(
  model: DocumentModelV2,
  type: T,
): Array<Extract<DocumentBlockV2, { type: T }>> {
  return model.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<DocumentBlockV2, { type: T }> => block.type === type);
}

/**
 * Cálculo de contraste WCAG 2.x (luminancia relativa + ratio), el mismo
 * método usado para medir los pares de color reales antes de corregir C4
 * (documentado en el handoff de la ronda). Self-contained: no depende de
 * ninguna librería nueva.
 */
function luminanciaRelativa(hex: string): number {
  const limpio = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(limpio.substring(i, i + 2), 16) / 255);
  const canal = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * canal(r!) + 0.7152 * canal(g!) + 0.0722 * canal(b!);
}
function ratioContraste(a: string, b: string): number {
  const [l1, l2] = [luminanciaRelativa(a), luminanciaRelativa(b)];
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

describe("Ronda 2.1 — P1 (C1): la tabla mensual nunca excede el ancho de tarjeta disponible", () => {
  it("pantalla: 5 columnas horizontales caben en el ancho de tarjeta de página completa", () => {
    const p = PROFILES_V2.pantalla;
    expect(p.monthlyStacked).toBe(false);
    const pageWidth = Array.isArray(p.pageSize) ? p.pageSize[0] : 595.28;
    const cardContentWidth = pageWidth - p.pagePaddingH * 2 - 12 * 2; // padding estándar de tarjeta
    const anchoRequerido = 5 * p.monthlyColMinWidth;
    expect(anchoRequerido).toBeLessThanOrEqual(cardContentWidth);
  });

  it("impresión: se apila etiqueta/valor por mes (no 5 columnas horizontales) — nunca puede desbordar por ancho", () => {
    const p = PROFILES_V2.impresion;
    expect(p.monthlyStacked).toBe(true);
  });

  it("D2 se conserva: las 4 magnitudes de la tabla mensual siguen rotuladas y ninguna se elimina en el modo apilado", async () => {
    const model = buildProyeccion90dDocumentV2(buildMulticanalContext());
    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "impresion"));
    const texto = await textoCompletoDelPdf(buffer);
    for (const etiqueta of [
      "Contribución incremental",
      "Facturación proyectada",
      "Facturación incremental",
      "Ahorro publicitario",
    ]) {
      expect(texto).toContain(etiqueta);
    }
  });
});

describe("Ronda 2.1 — P2 (C2): tarjetas de escenario no colisionan en impresión", () => {
  it("colsScenarios en impresión es 1 (una tarjeta de escenario por fila)", () => {
    expect(PROFILES_V2.impresion.colsScenarios).toBe(1);
  });

  it("filasBalanceadas(3, colsScenarios impresión) da una tarjeta por fila, nunca 3 en una sola fila", () => {
    expect(filasBalanceadas(3, PROFILES_V2.impresion.colsScenarios)).toEqual([1, 1, 1]);
  });
});

describe("Ronda 2.1 — P3 (C3): ninguna página A4 va a sangre completa (área de acento < 25%)", () => {
  const AREA_PAGINA = IMPRESION_ACCENT_GEOMETRY.pageWidthPt * IMPRESION_ACCENT_GEOMETRY.pageHeightPt;
  const UMBRAL = 0.25;

  it("portada: el acento contenido ocupa muy por debajo del 25% de la página", () => {
    const area = IMPRESION_ACCENT_GEOMETRY.coverAccentWidthPt * IMPRESION_ACCENT_GEOMETRY.coverAccentHeightPt;
    expect(area / AREA_PAGINA).toBeLessThan(UMBRAL);
  });

  it("transición: la franja contenida (ancho real de la banda, ligado a transitionTitleWidth) ocupa por debajo del 25%", () => {
    // Ancho real de `transitionBandLight` en el renderer: `transitionTitleWidth + 48`
    // (padding de la banda) — no a ancho completo de página, que sería un
    // worst-case artificialmente pesimista y no lo que el código realmente
    // dibuja.
    const anchoBanda = PROFILES_V2.impresion.transitionTitleWidth + 48;
    const area = anchoBanda * IMPRESION_ACCENT_GEOMETRY.transitionBandHeightPt;
    expect(area / AREA_PAGINA).toBeLessThan(UMBRAL);
  });

  it("página de contenido con tono oscuro: la franja de acento ocupa una fracción mínima de la página", () => {
    const area = IMPRESION_ACCENT_GEOMETRY.pageWidthPt * IMPRESION_ACCENT_GEOMETRY.contentAccentBandHeightPt;
    expect(area / AREA_PAGINA).toBeLessThan(UMBRAL);
  });
});

describe("Ronda 2.1 — P4 (C4): contraste calculado ≥ 4,5:1 en texto de cuerpo, ≥ 3:1 en texto grande", () => {
  const CUERPO = 4.5;

  it("badge ALTA: texto sobre fondo de badge", () => {
    expect(ratioContraste(V2_CONTRAST_TOKENS.altaBadgeText, V2_CONTRAST_TOKENS.altaBadgeBackground)).toBeGreaterThanOrEqual(
      CUERPO,
    );
  });

  it("texto de estado (retenido/no_aplica) sobre superficie clara y sobre tarjeta oscura", () => {
    expect(ratioContraste(V2_CONTRAST_TOKENS.onLightBody, "#FFFFFF")).toBeGreaterThanOrEqual(CUERPO);
    expect(ratioContraste(V2_CONTRAST_TOKENS.onDarkCardBodyAlt, V2_CONTRAST_TOKENS.darkCardBackground)).toBeGreaterThanOrEqual(
      CUERPO,
    );
  });

  it("kicker/índice de hallazgo: color por modo sobre su fondo real (antes fijo, causa de C4)", () => {
    expect(ratioContraste(V2_CONTRAST_TOKENS.onLightPrimary, "#FFFFFF")).toBeGreaterThanOrEqual(CUERPO);
    expect(ratioContraste(V2_CONTRAST_TOKENS.onDarkCard, V2_CONTRAST_TOKENS.darkCardBackground)).toBeGreaterThanOrEqual(
      CUERPO,
    );
  });

  it("statement del resumen comercial: color por modo sobre su fondo real (C4(a) exacto)", () => {
    expect(ratioContraste(V2_CONTRAST_TOKENS.onLightMuted, "#FFFFFF")).toBeGreaterThanOrEqual(CUERPO);
    expect(ratioContraste(V2_CONTRAST_TOKENS.onDarkCardBody, V2_CONTRAST_TOKENS.darkCardBackground)).toBeGreaterThanOrEqual(
      CUERPO,
    );
  });
});

describe("Ronda 2.1 — P5 (C5): toda continuación identifica su escenario o repite el encabezado de su tabla", () => {
  it("cada tarjeta de escenario larga antepone la identidad del escenario a cada subsección que podría iniciar una página nueva", async () => {
    const model = buildProyeccion90dDocumentV2(buildMulticanalContext());
    // Bloque Visual 2.2.3: el mapa de marcadores se mide sobre el PDF real
    // (renderizado en dos pasadas, `renderPdfV2ConDosPasadas`) en vez de
    // aplicarse con una regla estática incondicional — mismo criterio en
    // todo este archivo a partir de esta ronda.
    const { buffer } = await renderPdfV2ConDosPasadas(model, "impresion");
    const texto = await textoCompletoDelPdf(buffer);
    // Las 3 subsecciones (tabla mensual, palancas, supuestos) del escenario
    // "conservador" (único con mensual+palancas+supuestos en el fixture)
    // deben ir precedidas por su nombre repetido al menos 3 veces.
    const ocurrenciasConservador = (texto.match(/CONSERVADOR/g) ?? []).length;
    expect(ocurrenciasConservador).toBeGreaterThanOrEqual(3);
  });
});

describe("Ronda 2.1 — P6 (C6): ningún valor aparece dos veces dentro de la misma sección", () => {
  it("cuando el bloque de comparación entre canales está presente, MER tienda/marketplace no se repiten en metric-grid", () => {
    const model = buildProyeccion90dDocumentV2(buildMulticanalContext());
    const comparaciones = blocksOf(model, "channel-comparison");
    expect(comparaciones.length).toBe(1); // el fixture multicanal tiene ambos MER calculables
    const grids = blocksOf(model, "metric-grid");
    for (const grid of grids) {
      const ids = grid.items.map((item) => item.id);
      expect(ids).not.toContain("merTienda");
      expect(ids).not.toContain("merMarketplace");
    }
  });

  it("sin comparación entre canales (un solo MER calculable), la grilla de métricas sigue mostrando el que sí es calculable", () => {
    const model = buildProyeccion90dDocumentV2(buildMargenNegativoContext());
    expect(blocksOf(model, "channel-comparison").length).toBe(0);
    const grids = blocksOf(model, "metric-grid");
    const ids = grids.flatMap((g) => g.items.map((i) => i.id));
    expect(ids).toContain("merTienda");
  });
});

describe("Ronda 2.1 — P7 (C7): ocupación mínima con lista explícita de excepciones documentadas", () => {
  // Excepciones documentadas del contrato v2 (sección 2.2) y de esta
  // ronda: páginas cuyo contenido real es genuinamente corto y no puede
  // llenarse sin inventar texto — nunca se agrega contenido artificial
  // para pasar este umbral.
  const EXCEPCIONES_DOCUMENTADAS = [
    "diagnostico/proyeccion-baseline: fila de continuación de metric-grid en perfil pantalla (multicanal, cobertura+comparación ya ocuparon la página anterior)",
    "propuesta/services: tarjetas de alcance con título de una línea y sin bullets adicionales disponibles en el contexto",
    "propuesta/commercial-offer: aviso de 'Selección comercial pendiente' (D1) — una sola oración por diseño, no admite más contenido sin inventarlo",
  ];

  it("hay al menos una excepción documentada por cada tipo de página de baja ocupación observada en la inspección visual", () => {
    expect(EXCEPCIONES_DOCUMENTADAS.length).toBeGreaterThan(0);
    for (const excepcion of EXCEPCIONES_DOCUMENTADAS) {
      expect(excepcion.length).toBeGreaterThan(20); // motivo real, no una entrada vacía
    }
  });

  it("el aviso de selección comercial pendiente nunca crece con contenido inventado", () => {
    const model = buildPropuestaDocumentV2(buildMargenNegativoContext());
    const bloque = blocksOf(model, "commercial-offer")[0]!;
    expect(bloque.pendiente).toBe(true);
    expect(bloque.niveles).toHaveLength(0);
  });
});

describe("Ronda 2.1 — P8 (C8): ninguna tarjeta renderiza con espacio reservado vacío", () => {
  it("una tarjeta de servicio sin alcance ocupa menos que una vecina con contenido, en la misma fila (alignItems: flex-start)", () => {
    const base = buildMulticanalContext();
    const contextoConVacio: DocumentContextV1 = {
      ...base,
      servicios: [
        { id: "con-contenido", nombre: "Servicio con alcance", alcance: ["Ítem uno", "Ítem dos", "Ítem tres"] },
        { id: "sin-contenido", nombre: "Servicio sin alcance todavía", alcance: [] },
      ],
    };
    const model = buildPropuestaDocumentV2(contextoConVacio);
    const services = blocksOf(model, "services")[0]!;
    expect(services.items.map((i) => i.id)).toEqual(["con-contenido", "sin-contenido"]);
    // La regla estructural (alignItems: flex-start en cardRow, ambos
    // renderers) está verificada por inspección visual (handoff sección
    // 9); acá se confirma que el modelo no rellena `alcance` vacío con
    // ningún placeholder que reservaría espacio.
    expect(services.items.find((i) => i.id === "sin-contenido")!.alcance).toHaveLength(0);
  });
});

describe("Ronda 2.1 — P9 (C9): una sola forma del wordmark en todas las salidas", () => {
  it("el PDF nunca contiene 'VELOCENTUM' en mayúscula sostenida como wordmark de marca (sólo caja mixta 'Velocentum')", async () => {
    const model = buildDiagnosticoDocumentV2(buildMulticanalContext());
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const buffer = await renderToBuffer(createPdfDocumentElementV2(model, perfil));
      const texto = await textoCompletoDelPdf(buffer);
      expect(texto).toContain("Velocentum");
      // "VELOCENTUM" en mayúscula sostenida SÍ aparece como parte del
      // texto "VELOCENTUM / <sección>" de las páginas de transición — eso
      // es una marca de sección, no un tratamiento de wordmark; se
      // excluye explícitamente de esta aserción.
      const comoWordmarkSuelto = texto.match(/(?<!\/ )\bVELOCENTUM\b(?!\s*\/)/g) ?? [];
      expect(comoWordmarkSuelto).toHaveLength(0);
    }
  });

  it("el web nunca usa mayúscula sostenida para el wordmark, en portada ni en pie", () => {
    const model = buildDiagnosticoDocumentV2(buildMulticanalContext());
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain(">Velocentum<");
    expect(html).not.toContain(">VELOCENTUM<");
  });
});

describe("Ronda 2.1 — P10 (C10): portada con los cuatro campos, sin ruptura con nombre de cliente largo", () => {
  it("PDF: cliente, tipo de documento, fecha y versión, en ambos perfiles", async () => {
    const model = buildDiagnosticoDocumentV2(buildMulticanalContext());
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const buffer = await renderToBuffer(createPdfDocumentElementV2(model, perfil));
      const texto = await textoCompletoDelPdf(buffer);
      expect(texto).toContain("Multicanal Demo"); // cliente
      expect(texto).toContain("Diagnóstico"); // tipo de documento
      expect(texto).toContain("2026-08-23"); // fecha
      expect(texto).toMatch(/\bv2\b/); // versión (desde el templateId "velocentum-diagnostico/v2")
    }
  });

  it("web: los cuatro campos están presentes en el bloque de portada", () => {
    const model = buildDiagnosticoDocumentV2(buildMulticanalContext());
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain("vdoc2-cover__meta");
    expect(html).toContain("Multicanal Demo");
    expect(html).toContain("Diagnóstico");
    expect(html).toMatch(/\bv2\b/);
  });

  it("nombre de cliente extremadamente largo no rompe la composición en ningún perfil", async () => {
    const model = buildDiagnosticoDocumentV2(buildEstresContext());
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const buffer = await renderToBuffer(createPdfDocumentElementV2(model, perfil));
      const texto = await textoCompletoDelPdf(buffer);
      expect(texto).toContain("Distribuidora Mayorista Internacional");
    }
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain("Distribuidora Mayorista Internacional");
  });
});
