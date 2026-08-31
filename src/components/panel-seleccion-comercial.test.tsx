/**
 * BV4 · F2a etapa 4 — el panel, en render estático (mismo criterio que
 * `confirmacion-paquetes.test.tsx`: no hay arnés de interacción en el repo).
 *
 * Se verifica lo que el panel promete en pantalla: las diez líneas siempre,
 * los dos grupos de totales sin combinar, cero hexadecimales propios, la
 * moneda respetada y ningún precio inventado.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PanelSeleccionComercial } from "./panel-seleccion-comercial";
import { CATALOGO_COMERCIAL_V2, lineasSugeridasV2 } from "@/lib/catalogo-v2";
import { seleccionInicialV2 } from "@/lib/precargas-v2";
import type { HallazgoMapeado } from "@/lib/propuesta";
import type { SobreComercialV2 } from "@/lib/seleccion-comercial-v2";

function hallazgo(id: string, servicio: string): HallazgoMapeado {
  return { id, titulo: `Hallazgo ${id}`, capa: "servicio", servicio };
}

function render(sobreGuardado: SobreComercialV2 | null = null, hallazgos: HallazgoMapeado[] = []) {
  return renderToStaticMarkup(
    <PanelSeleccionComercial
      sugeridas={lineasSugeridasV2(hallazgos)}
      sobreGuardado={sobreGuardado}
      onConfirmar={() => {}}
    />,
  );
}

function sobre(cambios: Partial<SobreComercialV2> = {}): SobreComercialV2 {
  return {
    version: 2,
    moneda: "ARS",
    fiscal: { aplicaImpuesto: true, porcentaje: 21, confirmado: true },
    seleccion: seleccionInicialV2({ nivel: "impulso", sugeridas: [] }),
    legado: null,
    ...cambios,
  };
}

/**
 * Qué líneas quedaron marcadas. Se mira el checkbox de CADA línea por su id
 * y no la cantidad de `data-state="checked"` del documento: los checkboxes
 * de la configuración fiscal y de los agregados también lo llevan.
 */
function lineasMarcadas(html: string): string[] {
  const ids: string[] = [];
  for (const etiqueta of html.matchAll(/<button[^>]*\bid="linea-([a-z_]+)"[^>]*>/g)) {
    if (etiqueta[0].includes('data-state="checked"')) ids.push(etiqueta[1]!);
  }
  return ids;
}

/** `Intl` separa el símbolo con espacio duro (U+00A0); acá se normaliza. */
const legible = (html: string) => html.replace(/\u00A0/g, " ");

describe("visibilidad: las diez líneas, siempre", () => {
  it("muestra las diez, incluso sin ningún hallazgo que sugiera nada", () => {
    const html = render();
    for (const linea of CATALOGO_COMERCIAL_V2.lineas) {
      expect(html).toContain(linea.nombre);
    }
  });

  it("las sugeridas llegan marcadas y el resto no", () => {
    const html = render(null, [hallazgo("H1", "Meta Ads")]);
    expect(html).toContain('id="linea-meta_ads"');
    expect(html).toContain("sugerida por: H1");
    expect(lineasMarcadas(html)).toEqual(["meta_ads"]);
  });

  it("Q8: ninguna línea llega marcada por el nivel, ni siquiera diseño web", () => {
    const html = render(
      sobre({ seleccion: seleccionInicialV2({ nivel: "escala", sugeridas: [] }) }),
    );
    expect(html).toContain("Diseño web");
    expect(lineasMarcadas(html)).toEqual([]);
  });
});

describe("Q10: dos grupos de totales, nunca uno combinado", () => {
  it("imprime los dos títulos y ninguno que sume ambos", () => {
    const html = render(sobre());
    expect(html).toContain("Inversión mensual");
    expect(html).toContain("Inversión inicial / pago único");
    expect(html).not.toContain("Total general");
    expect(html).not.toContain("Gran total");
    expect(html).not.toContain("Total combinado");
  });

  it("cada grupo cierra con subtotal neto, impuesto y total", () => {
    const html = render(sobre());
    expect(html.match(/Subtotal neto/g) ?? []).toHaveLength(2);
    expect(html.match(/Impuesto \(21 %\)/g) ?? []).toHaveLength(2);
    expect(html.match(/>Total</g) ?? []).toHaveLength(2);
  });

  it("sin impuesto, no se imprime la línea de impuesto", () => {
    const html = render(
      sobre({ fiscal: { aplicaImpuesto: false, porcentaje: 21, confirmado: true } }),
    );
    expect(html).not.toContain("Impuesto (");
    expect(html.match(/Subtotal neto/g) ?? []).toHaveLength(2);
  });
});

describe("Q6: los totales no se editan", () => {
  it("los totales de grupo salen en <dd>, nunca en un input", () => {
    const html = render(sobre());
    expect(html).toContain("<dd");

    // TODO campo numérico editable del panel es una cantidad, un precio o el
    // porcentaje fiscal. Ningún total tiene input: si alguien agregara uno,
    // esta cuenta deja de cerrar. (Los `<input>` ocultos que Radix pone
    // detrás de cada checkbox no son `type="number"` y no cuentan.)
    const numericos = html.match(/<input[^>]*type="number"/g) ?? [];
    const cantidades = html.match(/id="cantidad-/g) ?? [];
    const precios = html.match(/id="precio-/g) ?? [];
    const fiscales = html.match(/id="fiscal-porcentaje"/g) ?? [];
    expect(cantidades).toHaveLength(7);
    expect(precios).toHaveLength(10);
    expect(fiscales).toHaveLength(1);
    expect(numericos).toHaveLength(18);
  });

  it("el total de línea se muestra como texto y arranca en guion sin precio", () => {
    const html = render(sobre());
    expect(html).toContain("Total de línea");
    expect(html).toContain("—");
  });
});

describe("Q4: la moneda se respeta y no se hardcodea", () => {
  it("en ARS imprime el símbolo argentino y ninguno extranjero", () => {
    const html = legible(render(sobre({ moneda: "ARS" })));
    expect(html).toContain("$ 0");
    expect(html).not.toContain("US$");
  });

  it("en USD imprime el símbolo de dólar, no el argentino a secas", () => {
    const html = legible(render(sobre({ moneda: "USD" })));
    expect(html).toContain("US$ 0");
  });
});

describe("Q9: la configuración fiscal se confirma a mano", () => {
  it("sin confirmar, avisa que la exportación queda bloqueada", () => {
    const html = render(
      sobre({ fiscal: { aplicaImpuesto: true, porcentaje: 21, confirmado: false } }),
    );
    expect(html).toContain("la exportación de la propuesta queda bloqueada");
  });

  it("confirmada, no muestra el aviso", () => {
    expect(render(sobre())).not.toContain("la exportación de la propuesta queda bloqueada");
  });
});

describe("agregados", () => {
  it("muestra los cuatro con su alcance del nivel", () => {
    const html = render(
      sobre({ seleccion: seleccionInicialV2({ nivel: "impulso", sugeridas: [] }) }),
    );
    expect(html).toContain("Tracking web");
    expect(html).toContain("Email marketing");
    expect(html).toContain("básico");
    expect(html).toContain("Reportes");
    expect(html).toContain("mensual");
    expect(html).toContain("CRO");
  });

  it("CRO aparece deshabilitado fuera de ESCALA, con el motivo a la vista", () => {
    const html = render(
      sobre({ seleccion: seleccionInicialV2({ nivel: "impulso", sugeridas: [] }) }),
    );
    expect(html).toContain("Sólo en ESCALA");
    expect(html).toContain("disabled");
  });

  it("en ESCALA, el alcance de email marketing cambia y CRO se habilita", () => {
    const html = render(
      sobre({ seleccion: seleccionInicialV2({ nivel: "escala", sugeridas: [] }) }),
    );
    expect(html).toContain("segmentación y recompra");
    expect(html).not.toContain("Sólo en ESCALA");
  });
});

describe("nada se inventa", () => {
  it("ningún precio precargado: todos los campos de precio arrancan vacíos", () => {
    const html = render(sobre());
    expect(html).toContain('placeholder="Sin cargar"');
    expect(html.match(/placeholder="Sin cargar"/g) ?? []).toHaveLength(
      CATALOGO_COMERCIAL_V2.lineas.length,
    );
  });

  it("sin ninguna línea marcada, el botón de confirmar está deshabilitado", () => {
    const html = render(sobre());
    expect(html).toContain("Marcá al menos una línea para poder confirmar.");
  });

  it("la ruta sólo aparece en Diseño web", () => {
    const html = render(sobre());
    expect(html.match(/id="ruta-/g) ?? []).toHaveLength(1);
    expect(html).toContain('id="ruta-diseno_web"');
  });
});

describe("tokens del tema activo: cero hexadecimales propios", () => {
  it("el HTML renderizado no contiene ningún color hexadecimal", () => {
    const html = render(sobre({ moneda: "USD" }), [hallazgo("H1", "Meta Ads")]);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
