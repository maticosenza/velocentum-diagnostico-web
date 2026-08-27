/**
 * D5/DHB-2 (Bloque 3 Funcional) — propuesta cualitativa con margen
 * negativo. Complementa la prueba discriminada de
 * `ronda-2.2.2-correcciones.test.ts` (título/alerta en el PDF).
 *
 * R-02 (2026-08-27), falsabilidad bidireccional: las condiciones a) y b)
 * dependen del código nuevo de DHB-2 (fallan si se revierte
 * `esCualitativa` en `propuesta.ts`) — verificado. Las condiciones c) y
 * d) ejercitan el filtro E-08 (`capa === "servicio"`), que YA existía
 * antes de DHB-2 y que DHB-2 deliberadamente NO toca (contrato-bloque-3.md
 * sección 3, R-02 PASO 0.1: "vía menos invasiva", el array `findings` no
 * cambia). Aisladas, c) y d) pasarían igual sin DHB-2 — no prueban nada
 * nuevo por sí solas. Por eso se combinan con a) y b) en un único `it`
 * por caso ("simultáneamente, sobre el mismo caso", exigencia literal de
 * R-02): la prueba completa SÍ falla si se revierte DHB-2, porque a)/b)
 * fallan primero. c)/d) quedan documentadas acá como guardas de que
 * DHB-2 no rompió el filtro E-08 al implementarse, no como prueba de
 * comportamiento nuevo en sí mismas.
 */
import { createRequire } from "node:module";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import type { DocumentBlockV2, HallazgoV2 } from "./types";
import { buildDiagnosticoDocumentV2 } from "./diagnostico";
import { buildPropuestaDocumentV2 } from "./propuesta";
import { buildMargenNegativoContext, buildMulticanalContext } from "./test-fixtures";
import { createPdfDocumentElementV2 } from "../../renderers/pdf-v2/document";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

async function textoCompleto(buffer: Buffer): Promise<string> {
  const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const paginas: string[] = [];
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const contenido = await documento.getPage(pagina).then((p) => p.getTextContent());
    paginas.push(contenido.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return paginas.join(" | ");
}

function findingsItems(sections: { blocks: DocumentBlockV2[] }[]): HallazgoV2[] {
  const block = sections.flatMap((s) => s.blocks).find((b) => b.type === "findings");
  return block?.type === "findings" ? block.items : [];
}

describe("D5/DHB-2: propuesta cualitativa con margen negativo", () => {
  it("caso margen negativo: alerta presente, sin cifra proyectada, hallazgos de servicio conservados, distintos del diagnóstico", () => {
    const contexto = buildMargenNegativoContext();
    const propuesta = buildPropuestaDocumentV2(contexto);
    const diagnostico = buildDiagnosticoDocumentV2(contexto);
    const seccion = propuesta.sections.find((s) => s.id === "commercial-summary");

    // (a) alerta clara de margen negativo presente.
    const bridge = seccion?.blocks.find((b) => b.type === "bridge-note");
    expect(bridge, "falta la alerta de margen negativo").toBeDefined();
    expect((bridge as { text: string }).text).toContain("Alerta:");

    // (b) sin cifra/promesa económica proyectada.
    expect(
      seccion?.blocks.some((b) => b.type === "commercial-summary"),
      "DHB-2: no debe llevar cifra proyectada en modo cualitativo",
    ).toBe(false);

    // (c) hallazgos de capa "servicio" (no dependen del margen) conservados íntegros.
    const itemsPropuesta = findingsItems(propuesta.sections);
    const esperados = contexto.hallazgos.filter((h) => h.capa === "servicio");
    expect(itemsPropuesta.length).toBe(esperados.length);
    for (const esperado of esperados) {
      expect(itemsPropuesta.some((i) => i.id === esperado.id)).toBe(true);
    }

    // (d) findings de la propuesta distintos de los del diagnóstico del mismo caso.
    const idsDiagnostico = new Set(findingsItems(diagnostico.sections).map((i) => i.id));
    const idsPropuesta = new Set(itemsPropuesta.map((i) => i.id));
    expect(idsDiagnostico.has("margen_negativo"), "el diagnóstico sí muestra margen_negativo").toBe(true);
    expect(idsPropuesta.has("margen_negativo"), "la propuesta no lo muestra en el array findings").toBe(false);
    expect(idsPropuesta.size).toBeLessThan(idsDiagnostico.size);
    for (const id of idsPropuesta) expect(idsDiagnostico.has(id)).toBe(true);
  });

  it("caso de control no cualitativo: la sección económica sigue presente y sin alterar", () => {
    const model = buildPropuestaDocumentV2(buildMulticanalContext());
    const seccion = model.sections.find((s) => s.id === "commercial-summary");
    expect(seccion?.eyebrow).toBe("Lo que importa");
    expect(seccion?.title).toBe("Contribución incremental proyectada");
    expect(seccion?.blocks.some((b) => b.type === "commercial-summary")).toBe(true);
  });
});

describe("S12 — DHB-2: las siete piezas están presentes, sin ninguna promesa económica", () => {
  it("piezas 1, 2, 6 y 7 (incondicionales) están presentes con el fixture mínimo de margen negativo", () => {
    const model = buildPropuestaDocumentV2(buildMargenNegativoContext());
    const blocks = model.sections.flatMap((s) => s.blocks);

    // 1+2. alerta + explicación (mismo bloque, ver test de arriba).
    expect(blocks.some((b) => b.type === "bridge-note")).toBe(true);
    // 6. próximos pasos.
    expect(blocks.some((b) => b.type === "next-step")).toBe(true);
    // 7. estado de la selección comercial (pendiente o confirmada).
    expect(blocks.some((b) => b.type === "commercial-offer")).toBe(true);

    // 3, 4 y 5 dependen de que el caso tenga hallazgos de capa "servicio",
    // `context.servicios` y `context.restricciones` no vacíos — mismo
    // criterio de todo el contrato v2: nunca un bloque vacío con
    // encabezado. `buildMargenNegativoContext` es un fixture mínimo sin
    // esos tres, así que quedan legítimamente ausentes acá; se verifican
    // con datos reales en el siguiente test.
  });

  it("piezas 3, 4 y 5 (condicionadas a datos) se renderizan cuando el caso las tiene, incluso en modo cualitativo", () => {
    const contexto = {
      ...buildMulticanalContext(),
      margenBloqueado: true,
      restricciones: [
        {
          id: "cobertura_canales_parcial",
          etiqueta: "Cobertura de canales parcial",
          detalle: "El mix conocido cubre 60% de la facturación.",
          bloquea: ["rentabilidad" as const],
        },
      ],
    };
    const model = buildPropuestaDocumentV2(contexto);
    const blocks = model.sections.flatMap((s) => s.blocks);

    // 3. hallazgos verificables que no dependen del margen.
    expect(blocks.some((b) => b.type === "findings")).toBe(true);
    // 4. prioridades cualitativas y servicios compatibles, sin monto.
    expect(blocks.some((b) => b.type === "services")).toBe(true);
    // 5. plan de validación de datos y medición (restricciones agrupadas).
    expect(model.sections.some((s) => s.id === "restrictions")).toBe(true);
    // Sigue en modo cualitativo: sin cifra proyectada.
    expect(blocks.some((b) => b.type === "commercial-summary")).toBe(false);
  });

  it("el PDF cualitativo no muestra ninguna cifra ni encabezado de contribución/ahorro proyectados", async () => {
    // Chequeo estructural, no de palabras sueltas: la alerta de la pieza 2
    // menciona "retorno"/"ahorro" al EXPLICAR que no se proyectan (ver
    // `buildAlertaMargenNegativoV2`) — buscar esas palabras literalmente
    // daría un falso positivo. Lo que DHB-2 prohíbe es la CIFRA/encabezado
    // de una promesa económica, no la palabra en una frase que la niega.
    const model = buildPropuestaDocumentV2(buildMargenNegativoContext());
    expect(model.sections.some((s) => s.id === "scenarios")).toBe(false);
    const blocks = model.sections.flatMap((s) => s.blocks);
    expect(blocks.some((b) => b.type === "commercial-summary")).toBe(false);
    expect(blocks.some((b) => b.type === "scenarios")).toBe(false);

    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "pantalla"));
    const texto = await textoCompleto(buffer);
    expect(texto).not.toContain("Contribución incremental a 90 días");
    expect(texto).not.toContain("Contribución incremental proyectada");
  });
});
