/**
 * Render estático (mismo criterio que los renderers documentales: sin
 * arnés de testing de interacción en este repo todavía). Cubre que el
 * componente arma HTML sin crashear con distintas escaleras, y que
 * muestra los datos esperados: nombres de nivel, unidades, y el estado
 * vacío cuando no hay ningún hallazgo que justifique un paquete.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConfirmacionPaquetes } from "./confirmacion-paquetes";
import { generarEscaleraPaquetes } from "@/lib/paquetes";
import type { HallazgoMapeado } from "@/lib/propuesta";

function hallazgo(id: string, servicio: string): HallazgoMapeado {
  return { id, titulo: `Hallazgo ${id}`, capa: "servicio", servicio };
}

function render(escalera: ReturnType<typeof generarEscaleraPaquetes>) {
  return renderToStaticMarkup(<ConfirmacionPaquetes escalera={escalera} onConfirmar={() => {}} />);
}

describe("ConfirmacionPaquetes", () => {
  it("sin ningún hallazgo de servicio, muestra el estado vacío en vez de un paquete inventado", () => {
    const html = render(generarEscaleraPaquetes([]));
    expect(html).toContain("No hay hallazgos que justifiquen un paquete todavía");
  });

  it("con un servicio justificado, muestra el nombre del nivel, el servicio y su unidad", () => {
    const html = render(generarEscaleraPaquetes([hallazgo("a", "Meta Ads")]));
    expect(html).toContain("IMPULSO");
    expect(html).toContain("Meta Ads");
    expect(html).toContain("campañas activas");
    expect(html).toContain("Confirmar propuesta");
  });

  it("nunca muestra un precio precargado: el campo de precio queda vacío por defecto", () => {
    const html = render(generarEscaleraPaquetes([hallazgo("a", "Meta Ads")]));
    expect(html).toContain('placeholder="Sin cargar"');
  });

  it("con varios servicios, arma los tres niveles sin crashear", () => {
    const h = [
      hallazgo("a", "Meta Ads"),
      hallazgo("b", "Google Ads"),
      hallazgo("c", "Product Ads"),
      hallazgo("d", "Desarrollo y optimización web"),
      hallazgo("e", "Planificación y creación de contenido"),
      hallazgo("f", "Diseño de marca"),
    ];
    const html = render(generarEscaleraPaquetes(h));
    expect(html).toContain("IMPULSO");
    expect(html).toContain("TRACCIÓN");
    expect(html).toContain("ESCALA");
  });
});
