import { describe, expect, it } from "vitest";
import { buildDiagnosticoDocument } from "./diagnostico";
import { buildProyeccionPropuestaDocument } from "./composicion";
import { buildPropuestaDocument } from "./propuesta";
import { buildProyeccion90dDocument } from "./proyeccion-90d";
import { VELOCENTUM_V1_TEMPLATES, getVelocentumV1Template } from "./registry";
import { buildSnakeContext, buildTitanContext } from "./test-fixtures";
import type { DocumentBlock, DocumentModel } from "./types";

function signature(model: DocumentModel) {
  return {
    templateId: model.templateId,
    themeId: model.themeId,
    sections: model.sections.map((section) => ({
      id: section.id,
      tone: section.tone,
      blocks: section.blocks.map((block) => block.type),
    })),
  };
}

function blocksOf<T extends DocumentBlock["type"]>(
  model: DocumentModel,
  type: T,
): Array<Extract<DocumentBlock, { type: T }>> {
  return model.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<DocumentBlock, { type: T }> => block.type === type);
}

describe("Velocentum document templates v1", () => {
  it("keeps the Titan projection structure stable", () => {
    expect(signature(buildProyeccion90dDocument(buildTitanContext()))).toMatchInlineSnapshot(`
      {
        "sections": [
          {
            "blocks": [
              "cover",
            ],
            "id": "cover",
            "tone": "dark",
          },
          {
            "blocks": [
              "coverage",
            ],
            "id": "coverage",
            "tone": "soft",
          },
          {
            "blocks": [
              "metric-grid",
            ],
            "id": "projection-baseline",
            "tone": "light",
          },
          {
            "blocks": [
              "transition",
            ],
            "id": "projection-transition",
            "tone": "dark",
          },
          {
            "blocks": [
              "scenarios",
            ],
            "id": "scenarios",
            "tone": "light",
          },
          {
            "blocks": [
              "restrictions",
            ],
            "id": "restrictions",
            "tone": "soft",
          },
          {
            "blocks": [
              "roadmap",
            ],
            "id": "roadmap",
            "tone": "light",
          },
          {
            "blocks": [
              "methodology",
            ],
            "id": "methodology",
            "tone": "soft",
          },
          {
            "blocks": [
              "transition",
            ],
            "id": "projection-close",
            "tone": "dark",
          },
        ],
        "templateId": "velocentum-proyeccion-90d/v1",
        "themeId": "velocentum-light/v1",
      }
    `);
  });

  it("keeps the Snake diagnosis structure stable", () => {
    expect(signature(buildDiagnosticoDocument(buildSnakeContext()))).toMatchInlineSnapshot(`
      {
        "sections": [
          {
            "blocks": [
              "cover",
            ],
            "id": "cover",
            "tone": "dark",
          },
          {
            "blocks": [
              "coverage",
            ],
            "id": "coverage",
            "tone": "soft",
          },
          {
            "blocks": [
              "metric-grid",
            ],
            "id": "current-state",
            "tone": "light",
          },
          {
            "blocks": [
              "transition",
            ],
            "id": "diagnostic-transition",
            "tone": "dark",
          },
          {
            "blocks": [
              "findings",
            ],
            "id": "findings",
            "tone": "light",
          },
          {
            "blocks": [
              "roadmap",
            ],
            "id": "roadmap",
            "tone": "light",
          },
          {
            "blocks": [
              "transition",
            ],
            "id": "diagnostic-close",
            "tone": "dark",
          },
        ],
        "templateId": "velocentum-diagnostico/v1",
        "themeId": "velocentum-light/v1",
      }
    `);
  });

  it("omits non-applicable data and turns retained data into restrictions, never zero", () => {
    const projection = buildProyeccion90dDocument(buildTitanContext());
    const metricIds = blocksOf(projection, "metric-grid").flatMap((block) =>
      block.items.map((item) => item.id),
    );
    const restrictions = blocksOf(projection, "restrictions").flatMap((block) => block.items);

    expect(metricIds).not.toContain("merTienda");
    expect(metricIds).not.toContain("margenTotal");
    expect(restrictions.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "retenido:margenTotal",
        "retenido:roasProductAds",
        "envio:no-confirmado",
        "retenido:escenario:base:contribucion",
      ]),
    );
    expect(blocksOf(projection, "shipping")).toHaveLength(0);
  });

  it("preserves a real zero and hides a potential scenario without high confidence", () => {
    const titan = buildProyeccion90dDocument(buildTitanContext());
    const titanScenarioBlock = blocksOf(titan, "scenarios")[0];
    expect(titanScenarioBlock).toBeDefined();
    const titanScenarios = titanScenarioBlock?.items ?? [];
    expect(titanScenarios.map((scenario) => scenario.id)).toEqual(["base"]);
    expect(titanScenarios[0]?.monthlyPaceDay90?.value).toBe(0);

    const snake = buildProyeccion90dDocument(buildSnakeContext());
    const snakeScenarioBlock = blocksOf(snake, "scenarios")[0];
    expect(snakeScenarioBlock).toBeDefined();
    const snakeScenarios = snakeScenarioBlock?.items ?? [];
    expect(snakeScenarios.map((scenario) => scenario.id)).toEqual(["base", "potencial"]);
    expect(snakeScenarios[0]?.contribution90d?.value).toBe(0);
  });

  it("only exposes price after an approved manual selection asks to include it", () => {
    const hidden = buildPropuestaDocument(buildSnakeContext());
    expect(blocksOf(hidden, "commercial-offer")[0]?.price).toBeNull();

    const visibleContext = buildSnakeContext();
    if (!visibleContext.comercial) throw new Error("Fixture must include a commercial selection");
    visibleContext.comercial.incluirPrecioEnPdf = true;
    const visible = buildPropuestaDocument(visibleContext);
    expect(blocksOf(visible, "commercial-offer")[0]?.price?.value).toBe(900_000);

    const noSelectionContext = buildSnakeContext();
    noSelectionContext.comercial = null;
    expect(blocksOf(buildPropuestaDocument(noSelectionContext), "commercial-offer")).toHaveLength(
      0,
    );
  });

  it("composes projection and proposal with one cover and the visual sandwich", () => {
    const combined = buildProyeccionPropuestaDocument(buildSnakeContext());
    expect(blocksOf(combined, "cover")).toHaveLength(1);
    expect(combined.sections.map((section) => section.tone)).toEqual(
      expect.arrayContaining(["dark", "light", "soft"]),
    );
    expect(combined.sections.some((section) => section.id === "combined-transition")).toBe(true);
    expect(combined.sections.some((section) => section.id === "scenarios")).toBe(true);
    expect(combined.sections.some((section) => section.id === "services")).toBe(true);
    expect(new Set(combined.sections.map((section) => section.id)).size).toBe(
      combined.sections.length,
    );
  });

  it("registers the four versioned templates", () => {
    expect(Object.keys(VELOCENTUM_V1_TEMPLATES)).toHaveLength(4);
    expect(
      getVelocentumV1Template("velocentum-diagnostico/v1").build(buildSnakeContext()).kind,
    ).toBe("diagnostico");
  });
});
