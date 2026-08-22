import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildDiagnosticoDocument,
  buildPropuestaDocument,
  buildProyeccion90dDocument,
  buildProyeccionPropuestaDocument,
} from "../../templates/velocentum-v1";
import { buildSnakeContext, buildTitanContext } from "../../templates/velocentum-v1/test-fixtures";
import type { PublishedNumber } from "../../templates/velocentum-v1";
import { DocumentWebRenderer, PublishedNumberView } from "./document-renderer";
import { formatPublishedNumber } from "./format";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import { casoSnakeStore, configuracionRegresionFase2 } from "../../../lib/fixtures-casos";
import { buildDocumentContext } from "../../domain";
import type { DatosDiagnostico } from "../../../lib/diagnostico-form";

function render(model: ReturnType<typeof buildDiagnosticoDocument>) {
  return renderToStaticMarkup(<DocumentWebRenderer model={model} />);
}

const numeroBase: PublishedNumber = {
  value: 1_000_000,
  format: "money",
  confidence: "alta",
  evidenceIds: [],
  assumptions: [],
};

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

describe("PublishedNumberView: marca de supuesto (corrección aprobada 2026-08-21, punto 5)", () => {
  it("no marca un valor observado (sin supuestos)", () => {
    const html = renderToStaticMarkup(<PublishedNumberView value={numeroBase} />);
    expect(html).toContain('data-supuesto="false"');
    expect(html).not.toContain("vdoc-number--supuesto");
    expect(html).not.toContain("vdoc-number__mark");
    expect(html).not.toContain("†");
  });

  it("marca visiblemente un valor que depende de una curva de adopción", () => {
    const conSupuesto: PublishedNumber = { ...numeroBase, assumptions: ["rampa_escenario_conservador"] };
    const html = renderToStaticMarkup(<PublishedNumberView value={conSupuesto} />);
    expect(html).toContain('data-supuesto="true"');
    expect(html).toContain("vdoc-number--supuesto");
    expect(html).toContain("vdoc-number__mark");
    expect(html).toContain("†");
    expect(html).toMatch(/title="[^"]*supuesto[^"]*"/i);
  });

  it("la marca aparece efectivamente en el bloque de escenarios de un documento con datos reales", () => {
    // buildSnakeContext() es un fixture armado a mano (no depende del
    // calculador, por diseño): sus ValorPublicable nunca traen `supuestos`.
    // Para probar la marca en un render real hace falta el pipeline
    // completo (calcularDiagnostico + buildDocumentContext), que es donde
    // escenariosDocumento efectivamente propaga el supuesto de la rampa.
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
      diagnostico: { id: "test-marca-supuesto", version: 1, fecha: "2026-08-20" },
      tipoDocumento: "proyeccion_90d",
    });
    const html = render(buildProyeccion90dDocument(contexto));
    expect(html).toContain("vdoc-number--supuesto");
    expect(html).toContain("vdoc-number__mark");
  });
});

describe("detalle mensual por escenario", () => {
  function contextoConOportunidad() {
    const datosConOportunidad: DatosDiagnostico = {
      ...casoSnakeStore,
      facturacion_mensual: 22_522_600,
      visitas_mensuales: 5000,
      agregados_carrito: 1000,
      checkouts_iniciados: 300,
      absorbe_costo_envio: true,
    };
    const resultado = calcularDiagnostico(datosConOportunidad, configuracionRegresionFase2);
    return buildDocumentContext({
      datos: datosConOportunidad,
      resultado,
      diagnostico: { id: "test-detalle-mensual", version: 1, fecha: "2026-08-20" },
      tipoDocumento: "proyeccion_90d",
    });
  }

  it("muestra los tres meses con las cuatro magnitudes, sin cruzarlas en la misma celda", () => {
    const html = render(buildProyeccion90dDocument(contextoConOportunidad()));

    expect(html).toContain("Detalle mensual");
    expect(html).toContain("vdoc-monthly-table");
    expect(html).toContain("Mes 1");
    expect(html).toContain("Mes 2");
    expect(html).toContain("Mes 3");
    expect(html).toContain("Contribución incremental");
    expect(html).toContain("Facturación proyectada");
    expect(html).toContain("Facturación incremental");
    expect(html).toContain("Ahorro publicitario");
  });

  it("el fixture armado a mano (sin motor real) no muestra la tabla: mensual queda vacío por diseño", () => {
    const html = render(buildProyeccion90dDocument(buildTitanContext()));
    expect(html).not.toContain("vdoc-monthly-table");
  });
});
