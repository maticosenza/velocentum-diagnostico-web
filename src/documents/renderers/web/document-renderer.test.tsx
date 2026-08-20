import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildDiagnosticoDocument,
  buildPropuestaDocument,
  buildProyeccion90dDocument,
  buildProyeccionPropuestaDocument,
} from "../../templates/velocentum-v1";
import { buildSnakeContext, buildTitanContext } from "../../templates/velocentum-v1/test-fixtures";
import { DocumentWebRenderer } from "./document-renderer";
import { formatPublishedNumber } from "./format";

function render(model: ReturnType<typeof buildDiagnosticoDocument>) {
  return renderToStaticMarkup(<DocumentWebRenderer model={model} />);
}

describe("renderer web documental", () => {
  it("renderiza diagnóstico con sandwich visual, estructura accesible y cero real", () => {
    const html = render(buildDiagnosticoDocument(buildSnakeContext()));

    expect(html).toContain('data-document-kind="diagnostico"');
    expect(html).toContain('aria-label="Diagnóstico e-commerce para Snake Store"');
    expect(html).toContain('data-section-tone="dark"');
    expect(html).toContain('data-section-tone="light"');
    expect(html).toContain('data-section-tone="soft"');
    expect(html).toContain('data-value="0"');
    expect(html).toContain("Cobertura del diagnóstico");
  });

  it("muestra retenidos y restricciones sin convertirlos en cero", () => {
    const html = render(buildProyeccion90dDocument(buildTitanContext()));

    expect(html).toContain('data-document-kind="proyeccion_90d"');
    expect(html).toContain("Margen total");
    expect(html).toContain("ROAS Product Ads");
    expect(html).toContain("Retenido");
    expect(html).toContain("Falta validar la liquidación real.");
    expect(html).not.toContain("Potencial</h3>");
  });

  it("renderiza propuesta sin mostrar un precio excluido manualmente", () => {
    const html = render(buildPropuestaDocument(buildSnakeContext()));

    expect(html).toContain('data-document-kind="propuesta"');
    expect(html).toContain("Growth 90 días");
    expect(html).toContain("Medición");
    expect(html).toContain("Validar alcance, responsables y fecha de inicio.");
    expect(html).not.toContain('data-value="900000"');
  });

  it("muestra envío y precio únicamente cuando el modelo los habilita", () => {
    const shippingContext = buildSnakeContext();
    shippingContext.envio = {
      estado: "si",
      costoNeto: {
        estado: "declarado",
        valor: 5_000,
        fuente: "fixture",
        periodo: "mensual",
      },
      mostrarEnDocumentos: true,
    };
    const shippingHtml = render(buildDiagnosticoDocument(shippingContext));
    expect(shippingHtml).toContain('data-block-type="shipping"');
    expect(shippingHtml).toContain('data-value="5000"');

    const commercialContext = buildSnakeContext();
    if (!commercialContext.comercial) throw new Error("Fixture comercial incompleto");
    commercialContext.comercial.incluirPrecioEnPdf = true;
    const commercialHtml = render(buildPropuestaDocument(commercialContext));
    expect(commercialHtml).toContain('data-block-type="commercial-offer"');
    expect(commercialHtml).toContain('data-value="900000"');
  });

  it("renderiza la composición con una sola portada y ambas capas", () => {
    const model = buildProyeccionPropuestaDocument(buildSnakeContext());
    const html = render(model);

    expect(html).toContain('data-document-kind="proyeccion_propuesta"');
    expect(html.match(/data-block-type="cover"/g)).toHaveLength(1);
    expect(html).toContain("Qué puede ocurrir en 90 días");
    expect(html).toContain("Paquete seleccionado");
  });

  it("formatea ARS, porcentajes, ratios y cero sin usar falsy", () => {
    expect(
      formatPublishedNumber({
        value: 0,
        format: "money",
        confidence: "alta",
        evidenceIds: ["fixture"],
        assumptions: [],
      }),
    ).toContain("0");
    expect(
      formatPublishedNumber({
        value: 0.6375,
        format: "percent",
        confidence: "alta",
        evidenceIds: ["fixture"],
        assumptions: [],
      }),
    ).toContain("63,75");
    expect(
      formatPublishedNumber({
        value: 27.8,
        format: "ratio",
        confidence: "alta",
        evidenceIds: ["fixture"],
        assumptions: [],
      }),
    ).toBe("27,8×");
  });
});
