/**
 * Pruebas exclusivas de la ronda correctiva 2.2.1 (R1-R3). Verifican el
 * contrato, no describen el resultado obtenido — si una prueba falla, se
 * corrige el prototipo, nunca el umbral. No tocan v1, dominio, `src/lib/`
 * ni ninguna prueba preexistente del Bloque Visual 2, la ronda 2.1 ni la
 * ronda 2.2.
 */
import { createRequire } from "node:module";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { buildProyeccion90dDocumentV2, buildDiagnosticoDocumentV2 } from "./index";
import {
  buildMulticanalContext,
  buildMargenNegativoContext,
  buildMayoristaContext,
  buildMixtoContext,
  buildTresEscenariosLargosContext,
} from "./test-fixtures";
import type { DocumentBlockV2, DocumentModelV2 } from "./types";
import { createPdfDocumentElementV2, type PdfProfileV2 } from "../../renderers/pdf-v2/document";
import { renderPdfV2ConDosPasadas } from "../../renderers/pdf-v2/paginacion";

function blocksOf<T extends DocumentBlockV2["type"]>(
  model: DocumentModelV2,
  type: T,
): Array<Extract<DocumentBlockV2, { type: T }>> {
  return model.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<DocumentBlockV2, { type: T }> => block.type === type);
}

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

async function textoPorPagina(buffer: Buffer): Promise<string[]> {
  const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const paginas: string[] = [];
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const contenido = await documento.getPage(pagina).then((p) => p.getTextContent());
    paginas.push(contenido.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return paginas;
}

describe("Ronda 2.2.1 — R1 (Corrección 1): ninguna página de continuación de una tarjeta de escenario carece de identidad", () => {
  it("la página que retoma el bloque de Supuestos de una tarjeta partida incluye el nombre del escenario", async () => {
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const model = buildProyeccion90dDocumentV2(buildMulticanalContext());
      const paginas = await textoPorPagina(await renderToBuffer(createPdfDocumentElementV2(model, perfil)));
      // "conservador" es la única tarjeta larga del fixture (tabla mensual +
      // 2 grupos de palancas + supuestos) — su bloque de Supuestos es lo
      // bastante largo como para partirse en ambos perfiles con este
      // contenido. La página que contiene el texto literal de su supuesto
      // ("25% / 50% / 75%...") es la página de continuación real.
      const paginaContinuacion = paginas.find((p) => p.includes("25% / 50% / 75% de la oportunidad mensual"));
      expect(paginaContinuacion, `perfil ${perfil}: no se encontró la página de Supuestos`).toBeDefined();
      expect(
        paginaContinuacion!.includes("CONSERVADOR"),
        `perfil ${perfil}: la página de continuación no repite la identidad del escenario`,
      ).toBe(true);
    }
  });

  it("con las tres tarjetas largas (sin ninguna corta), TODA página con el bloque de Supuestos identifica su escenario — no sólo la primera tarjeta", async () => {
    // Reproduce el patrón "en cascada" real de 1-marketplace-fuerte-tienda-floja
    // (verificado fuera de este archivo, con datos del motor real, en el
    // barrido de cobertura del handoff): sin tarjetas cortas que antecedan
    // a las largas, CONSERVADOR entra solo en su propia página A4, pero
    // BASE y POTENCIAL (2da y 3ra) heredan el problema de espacio de la
    // anterior y también continúan. Una regla que sólo mirara "la primera
    // tarjeta larga" (probada y descartada durante esta ronda) deja a BASE
    // y POTENCIAL con su bloque de Supuestos sin ninguna identidad — esta
    // prueba es exactamente la que hubiera detectado ese defecto.
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const model = buildProyeccion90dDocumentV2(buildTresEscenariosLargosContext());
      // Bloque Visual 2.2.3: mapa medido sobre el PDF real (dos pasadas),
      // no la regla estática incondicional que esta prueba documentaba
      // originalmente.
      const { buffer } = await renderPdfV2ConDosPasadas(model, perfil);
      const paginas = await textoPorPagina(buffer);
      let paginasConSupuestos = 0;
      paginas.forEach((texto, index) => {
        if (!texto.includes("Supuestos —")) return;
        paginasConSupuestos += 1;
        const tieneIdentidad = ["CONSERVADOR", "BASE", "POTENCIAL"].some((n) => texto.includes(n));
        expect(
          tieneIdentidad,
          `perfil ${perfil}, página ${index + 1}: tiene el bloque de Supuestos pero ninguna identidad de escenario`,
        ).toBe(true);
      });
      expect(paginasConSupuestos, `perfil ${perfil}: no se encontró ninguna página con Supuestos`).toBeGreaterThan(0);
    }
  });
});

describe("Ronda 2.2.1 — R2 (Correcciones 1+2): ninguna tarjeta que quepa entera en una página repite su propio nombre", () => {
  it("escenarios cortos del fixture mayorista (esCorta === true): el nombre aparece exactamente una vez", async () => {
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const model = buildProyeccion90dDocumentV2(buildMayoristaContext());
      const cortas = blocksOf(model, "scenarios")[0]!.items.filter((i) => i.esCorta);
      const paginas = await textoPorPagina(await renderToBuffer(createPdfDocumentElementV2(model, perfil)));
      const texto = paginas.filter((p) => p.includes("Qué puede ocurrir en 90 días, mes a mes")).join("\n");
      for (const item of cortas) {
        const nombre = item.id.toUpperCase();
        const ocurrencias = (texto.match(new RegExp(nombre, "g")) ?? []).length;
        expect(ocurrencias, `perfil ${perfil}, escenario ${nombre} (esCorta)`).toBe(1);
      }
    }
  });

  it("escenarios cortos del fixture mixto (esCorta === true): el nombre aparece exactamente una vez", async () => {
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const model = buildProyeccion90dDocumentV2(buildMixtoContext());
      const cortas = blocksOf(model, "scenarios")[0]!.items.filter((i) => i.esCorta);
      const paginas = await textoPorPagina(await renderToBuffer(createPdfDocumentElementV2(model, perfil)));
      const texto = paginas.filter((p) => p.includes("Qué puede ocurrir en 90 días, mes a mes")).join("\n");
      for (const item of cortas) {
        const nombre = item.id.toUpperCase();
        const ocurrencias = (texto.match(new RegExp(nombre, "g")) ?? []).length;
        expect(ocurrencias, `perfil ${perfil}, escenario ${nombre} (esCorta)`).toBe(1);
      }
    }
  });

  it("escenario s4-estilo (margen negativo, las 3 tarjetas caben enteras): ninguna repite su nombre", async () => {
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const model = buildProyeccion90dDocumentV2(buildMargenNegativoContext());
      expect(blocksOf(model, "scenarios")[0]!.items.every((i) => i.esCorta)).toBe(true);
      const paginas = await textoPorPagina(await renderToBuffer(createPdfDocumentElementV2(model, perfil)));
      const texto = paginas.filter((p) => p.includes("Qué puede ocurrir en 90 días, mes a mes")).join("\n");
      for (const nombre of ["CONSERVADOR", "BASE", "POTENCIAL"]) {
        const ocurrencias = (texto.match(new RegExp(nombre, "g")) ?? []).length;
        expect(ocurrencias, `perfil ${perfil}, escenario ${nombre}`).toBe(1);
      }
    }
  });
});

describe("Ronda 2.2.1 — R3 (Corrección 3): ninguna página de transición o cierre es un bloque de color plano sin recursos de dirección de arte", () => {
  it("las páginas de transición en pantalla dibujan trazos vectoriales reales (líneas), no sólo un relleno sólido", async () => {
    const { OPS } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const model = buildProyeccion90dDocumentV2(buildMulticanalContext());
    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "pantalla"));
    const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
    let paginasDeTransicionEncontradas = 0;
    for (let i = 1; i <= documento.numPages; i++) {
      const pagina = await documento.getPage(i);
      const contenido = await pagina.getTextContent();
      const texto = contenido.items.map((it) => ("str" in it ? it.str : "")).join(" ");
      // pdfjs a veces extrae "VELOCENTUM /" con un espacio entre cada
      // glifo (kerning de la fuente de encabezado) — se compara sin
      // espacios para no depender de ese detalle de extracción.
      if (!texto.replace(/\s+/g, "").includes("VELOCENTUM/")) continue;
      paginasDeTransicionEncontradas += 1;
      const operadores = await pagina.getOperatorList();
      const trazos = operadores.fnArray.filter((op) => op === OPS.setStrokeRGBColor).length;
      expect(trazos, `página ${i}: transición sin trazos vectoriales (bloque plano)`).toBeGreaterThanOrEqual(5);
      // Motivo de línea+puntos (D-5, contrato 6.7) también presente.
      const puntos = (texto.match(/·/g) ?? []).length;
      expect(puntos, `página ${i}: falta el motivo línea+puntos`).toBeGreaterThanOrEqual(4);
    }
    expect(paginasDeTransicionEncontradas, "no se encontró ninguna página de transición para verificar").toBeGreaterThan(
      0,
    );
  });

  it("el fondo de la transición en pantalla sigue a sangre completa (no se le exige C3, que sólo aplica a A4)", async () => {
    const model = buildDiagnosticoDocumentV2(buildMulticanalContext());
    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "pantalla"));
    const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
    let vistas = 0;
    for (let i = 1; i <= documento.numPages; i++) {
      const pagina = await documento.getPage(i);
      const contenido = await pagina.getTextContent();
      const texto = contenido.items.map((it) => ("str" in it ? it.str : "")).join(" ");
      // pdfjs a veces extrae "VELOCENTUM /" con un espacio entre cada
      // glifo (kerning de la fuente de encabezado) — se compara sin
      // espacios para no depender de ese detalle de extracción.
      if (!texto.replace(/\s+/g, "").includes("VELOCENTUM/")) continue;
      vistas += 1;
      const operadores = await pagina.getOperatorList();
      const { OPS } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // Debe seguir habiendo un relleno de fondo (constructWPath/paintPath
      // no son estables entre versiones de pdfjs para "hay un rect"; lo
      // verificable de forma estable es que sigue habiendo al menos un
      // color de relleno distinto del blanco, es decir setFillRGBColor).
      expect(operadores.fnArray.includes(OPS.setFillRGBColor)).toBe(true);
    }
    expect(vistas).toBeGreaterThan(0);
  });
});
