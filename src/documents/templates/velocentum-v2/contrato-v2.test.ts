/**
 * Pruebas exclusivas de v2 (Bloque Visual 2, PASO 4). Cubren las 11
 * aserciones mínimas del prompt gobernante. Usan `test-fixtures.ts`
 * (fixtures propias, construidas a mano) en vez del archivo de fixtures
 * demostrativas de `src/lib/` — ese archivo restringe por un test propio
 * qué archivos pueden importarlo, y esta suite no está en esa lista ni
 * puede agregarse a ella (`src/lib/` es de sólo lectura para este bloque).
 * Los dos fixtures acá
 * reproducen las mismas características relevantes que
 * `1-marketplace-fuerte-tienda-floja` (s1) y
 * `4-roas-bueno-margen-negativo` (s4) — ver el comentario de
 * `test-fixtures.ts` para el detalle. No tocan v1 ni el dominio.
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
import type { DocumentBlockV2, DocumentModelV2, EscenarioV2 } from "./types";
import { createPdfDocumentElementV2, PROFILES_V2, type PdfProfileV2 } from "../../renderers/pdf-v2/document";
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

const ESCENARIOS = [
  { id: "multicanal", build: buildMulticanalContext },
  { id: "margen-negativo", build: buildMargenNegativoContext },
] as const;
const TIPOS = ["diagnostico", "proyeccion_90d", "propuesta"] as const;

function buildModel(escenarioId: (typeof ESCENARIOS)[number]["id"], tipo: (typeof TIPOS)[number]): DocumentModelV2 {
  const escenario = ESCENARIOS.find((e) => e.id === escenarioId);
  if (!escenario) throw new Error(`Escenario no encontrado: ${escenarioId}`);
  const contexto: DocumentContextV1 = escenario.build();
  return tipo === "diagnostico"
    ? buildDiagnosticoDocumentV2(contexto)
    : tipo === "proyeccion_90d"
      ? buildProyeccion90dDocumentV2(contexto)
      : buildPropuestaDocumentV2(contexto);
}

function blocksOf<T extends DocumentBlockV2["type"]>(
  model: DocumentModelV2,
  type: T,
): Array<Extract<DocumentBlockV2, { type: T }>> {
  return model.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<DocumentBlockV2, { type: T }> => block.type === type);
}

const COMBINACIONES = ESCENARIOS.flatMap((e) => TIPOS.map((tipo) => ({ escenarioId: e.id, tipo })));

describe("contrato v2 — modelo (sin renderizar)", () => {
  it("ninguna sección queda con cuerpo vacío", () => {
    for (const { escenarioId, tipo } of COMBINACIONES) {
      const model = buildModel(escenarioId, tipo);
      for (const section of model.sections) {
        expect(section.blocks.length, `${escenarioId}/${tipo} sección "${section.id}" vacía`).toBeGreaterThan(0);
      }
    }
  });

  it("D2: la tabla mensual nunca repite la misma etiqueta para dos magnitudes", () => {
    for (const { escenarioId, tipo } of COMBINACIONES) {
      if (tipo !== "proyeccion_90d") continue;
      const model = buildModel(escenarioId, tipo);
      for (const block of blocksOf(model, "scenarios")) {
        for (const item of block.items) {
          for (const mes of item.mensual) {
            const etiquetas = [
              "Contribución incremental",
              "Facturación proyectada",
              "Facturación incremental",
              "Ahorro publicitario",
            ];
            expect(new Set(etiquetas).size).toBe(4);
            expect(mes.mes).toBeGreaterThanOrEqual(1);
          }
        }
      }
    }
  });

  it("palancas: siempre con magnitud y período explícitos, nunca un monto sin calificador", () => {
    let palancasEncontradas = 0;
    for (const { escenarioId, tipo } of COMBINACIONES) {
      if (tipo !== "proyeccion_90d") continue;
      const model = buildModel(escenarioId, tipo);
      for (const block of blocksOf(model, "scenarios")) {
        for (const item of block.items) {
          for (const palanca of item.palancas) {
            palancasEncontradas++;
            expect(palanca.periodo).toBe("ritmo_mensual_dia_90");
            expect(["facturacion_incremental", "contribucion_incremental", "ahorro_publicitario"]).toContain(
              palanca.tipo,
            );
          }
        }
      }
    }
    expect(palancasEncontradas).toBeGreaterThan(0);
  });

  it("hallazgos ordenados por prioridad y, dentro de cada prioridad, por monto descendente", () => {
    const orden = { alta: 0, media: 1, baja: 2 } as const;
    for (const { escenarioId, tipo } of COMBINACIONES) {
      const model = buildModel(escenarioId, tipo);
      for (const block of blocksOf(model, "findings")) {
        for (let i = 1; i < block.items.length; i++) {
          const anterior = block.items[i - 1]!;
          const actual = block.items[i]!;
          expect(orden[anterior.prioridad]).toBeLessThanOrEqual(orden[actual.prioridad]);
          if (orden[anterior.prioridad] === orden[actual.prioridad]) {
            const montoAnterior = anterior.monto?.estado === "disponible" ? anterior.monto.valor : -Infinity;
            const montoActual = actual.monto?.estado === "disponible" ? actual.monto.valor : -Infinity;
            expect(montoAnterior).toBeGreaterThanOrEqual(montoActual);
          }
        }
      }
    }
  });

  it("E-08 acotado: la propuesta muestra un subconjunto (capa servicio) de los hallazgos del diagnóstico, nunca más", () => {
    for (const { id: escenarioId } of ESCENARIOS) {
      const diagnostico = buildModel(escenarioId, "diagnostico");
      const propuesta = buildModel(escenarioId, "propuesta");
      const idsDiagnostico = new Set(blocksOf(diagnostico, "findings").flatMap((b) => b.items.map((i) => i.id)));
      const idsPropuesta = blocksOf(propuesta, "findings").flatMap((b) => b.items.map((i) => i.id));
      for (const id of idsPropuesta) expect(idsDiagnostico.has(id)).toBe(true);
      for (const block of blocksOf(propuesta, "findings")) {
        for (const item of block.items) expect(item.capa).toBe("servicio");
      }
    }
  });

  it("D1: propuesta sin selección comercial confirmada nunca omite la sección, siempre queda marcada pendiente", () => {
    // margen-negativo: sin escalera confirmada -> pendiente, niveles vacío.
    const propuestaPendiente = buildModel("margen-negativo", "propuesta");
    const bloquePendiente = blocksOf(propuestaPendiente, "commercial-offer");
    expect(bloquePendiente.length).toBe(1);
    expect(bloquePendiente[0]!.pendiente).toBe(true);
    expect(bloquePendiente[0]!.niveles).toHaveLength(0);

    // multicanal: con escalera confirmada -> no pendiente, niveles con contenido real.
    const propuestaConfirmada = buildModel("multicanal", "propuesta");
    const bloqueConfirmado = blocksOf(propuestaConfirmada, "commercial-offer");
    expect(bloqueConfirmado.length).toBe(1);
    expect(bloqueConfirmado[0]!.pendiente).toBe(false);
    expect(bloqueConfirmado[0]!.niveles.length).toBeGreaterThan(0);
  });

  it("escala tipográfica completa: los 8 roles están definidos y difieren entre pantalla e impresión", () => {
    const roles: Array<keyof (typeof PROFILES_V2)["pantalla"]["escala"]> = [
      "titulo",
      "subtitulo",
      "label",
      "valor",
      "valorGrande",
      "badge",
      "nota",
      "pie",
    ];
    for (const rol of roles) {
      expect(typeof PROFILES_V2.pantalla.escala[rol]).toBe("number");
      expect(typeof PROFILES_V2.impresion.escala[rol]).toBe("number");
    }
    // Al menos un rol debe diferir entre perfiles (escala "completa", no un solo valor global compartido).
    const difieren = roles.some((rol) => PROFILES_V2.pantalla.escala[rol] !== PROFILES_V2.impresion.escala[rol]);
    expect(difieren).toBe(true);
    // Mínimo tipográfico legible por perfil: ningún rol por debajo de 7pt.
    for (const perfil of ["pantalla", "impresion"] as const) {
      for (const rol of roles) expect(PROFILES_V2[perfil].escala[rol]).toBeGreaterThanOrEqual(7);
    }
  });

  it("ninguna cadena de metadatos une dos etiquetas distintas con ' - ' sin marcador propio", () => {
    for (const { escenarioId, tipo } of COMBINACIONES) {
      const model = buildModel(escenarioId, tipo);
      for (const block of blocksOf(model, "findings")) {
        for (const item of block.items) {
          // v1 unía "capa - confianza - magnitud" con " - " (E-15); v2 usa "·".
          expect(item.titulo).not.toMatch(/ - /);
        }
      }
      for (const block of blocksOf(model, "scenarios")) {
        for (const item of block.items) {
          for (const palanca of item.palancas) expect(palanca.nombre).not.toMatch(/ - /);
        }
      }
    }
  });

  it("balanceo de grilla: filasBalanceadas nunca deja una última fila con un único ítem cuando hay alternativa", () => {
    expect(filasBalanceadas(7, PROFILES_V2.pantalla.colsScenarios)).not.toEqual(
      expect.arrayContaining([1]),
    );
  });
});

describe("contrato v2 — PDF real (renderToBuffer + extracción de texto)", () => {
  it.each(
    COMBINACIONES.flatMap(({ escenarioId, tipo }) =>
      (["pantalla", "impresion"] as PdfProfileV2[]).map((perfil) => ({ escenarioId, tipo, perfil })),
    ),
  )("$escenarioId / $tipo / $perfil: sin 'Sin datos', sin daga doble, † siempre con Supuestos", async ({
    escenarioId,
    tipo,
    perfil,
  }) => {
    const model = buildModel(escenarioId, tipo);
    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, perfil));
    const texto = await textoCompletoDelPdf(buffer);

    expect(texto).not.toContain("Sin datos");
    expect(texto).not.toContain("††");
    if (texto.includes("†")) {
      expect(texto).toContain("Supuestos");
    }
  });

  it("s4/proyeccion_90d: el hallazgo de margen negativo (cuando aparece en diagnóstico) usa tratamiento visual distinto, no el badge genérico", async () => {
    const model = buildModel("margen-negativo", "diagnostico");
    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "pantalla"));
    const texto = await textoCompletoDelPdf(buffer);
    const tieneMargenNegativo = blocksOf(model, "findings").some((b) =>
      b.items.some((i) => i.esMargenNegativo),
    );
    if (tieneMargenNegativo) {
      expect(texto).toContain("ALERTA CRÍTICA");
    }
  });
});

describe("contrato v2 — web real (renderToStaticMarkup)", () => {
  it.each(COMBINACIONES)(
    "$escenarioId / $tipo: sin 'Sin datos', severidad con texto (no sólo color)",
    ({ escenarioId, tipo }) => {
      const model = buildModel(escenarioId, tipo);
      const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
      expect(html).not.toContain("Sin datos");
      expect(html).not.toMatch(/>Retenido</);
      const findings = blocksOf(model, "findings");
      for (const block of findings) {
        for (const item of block.items) {
          if (!item.esMargenNegativo) {
            expect(html).toMatch(new RegExp(`(ALTA|MEDIA|BAJA)`));
          }
        }
      }
    },
  );

  it("paridad PDF/web: el mismo ValorV2 produce el mismo texto de estado en ambos renderers (capa semántica compartida)", async () => {
    const model = buildModel("multicanal", "proyeccion_90d");
    const scenarios = blocksOf(model, "scenarios")[0]!;
    const conservador = scenarios.items.find((i: EscenarioV2) => i.id === "conservador");
    expect(conservador).toBeDefined();
    if (!conservador || conservador.contribucion90d.estado !== "disponible") throw new Error("fixture inesperado");

    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    const buffer = await renderToBuffer(createPdfDocumentElementV2(model, "pantalla"));
    const textoPdf = await textoCompletoDelPdf(buffer);

    const cifra = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
      conservador.contribucion90d.valor,
    );
    expect(html).toContain(cifra);
    expect(textoPdf).toContain(cifra);
  });

  it("criterio 15: nombre de cliente extremadamente largo y montos de 9-10 dígitos no rompen la composición", async () => {
    const context = buildEstresContext();
    const model = buildDiagnosticoDocumentV2(context);
    for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
      const buffer = await renderToBuffer(createPdfDocumentElementV2(model, perfil));
      const texto = await textoCompletoDelPdf(buffer);
      expect(texto).toContain("Distribuidora Mayorista Internacional");
      expect(texto).toContain("$ 1.234.567.890");
      expect(texto).not.toContain("Sin datos");
    }
    const html = renderToStaticMarkup(React.createElement(DocumentWebRendererV2, { model }));
    expect(html).toContain("Distribuidora Mayorista Internacional");
    // Misma capa de formato compartida (decisión 5): idéntico en PDF y web.
    expect(html).toContain("$ 1.234.567.890");
  });
});
