/**
 * Pestañas del detalle: la pestaña de la URL se valida (lo que no es una
 * pestaña cae en Resumen) y "Qué falta" junta sólo lo que la pantalla ya
 * nombraba como faltante, respetando el perímetro.
 */
import { describe, expect, it } from "vitest";
import type { Fuga } from "./calculo-diagnostico";
import { PESTANAS, pestanaDesdeBusqueda, queFaltaDiagnostico } from "./pestanas-diagnostico";
import type { PerimetroVista } from "./vista-diagnostico";

const TODO: PerimetroVista = {
  tiendaPropia: true,
  mercadoLibre: true,
  pautaTienda: true,
  pautaMeta: true,
  productAds: true,
  funnelWeb: true,
};
const SIN_TIENDA: PerimetroVista = {
  ...TODO,
  tiendaPropia: false,
  pautaTienda: false,
  funnelWeb: false,
};

function fuga(cambios: Partial<Fuga>): Fuga {
  return {
    id: "conversion",
    etiqueta: "Conversión",
    tipo: "monto",
    monto: null,
    calculable: true,
    faltantes: [],
    ...cambios,
  } as Fuga;
}

describe("pestaña desde la URL", () => {
  it("cinco pestañas, Resumen primero", () => {
    expect(PESTANAS).toEqual(["resumen", "detalle", "propuesta", "proyeccion", "comercial"]);
  });

  it("acepta las cinco y manda todo lo demás a Resumen", () => {
    for (const p of PESTANAS) expect(pestanaDesdeBusqueda(p)).toBe(p);
    expect(pestanaDesdeBusqueda(undefined)).toBe("resumen");
    expect(pestanaDesdeBusqueda("")).toBe("resumen");
    expect(pestanaDesdeBusqueda("Detalle")).toBe("resumen");
    expect(pestanaDesdeBusqueda(3)).toBe("resumen");
  });
});

describe("qué falta para completar el diagnóstico", () => {
  it("con todo calculado y todos los bloques con datos, no falta nada", () => {
    const estados = {
      medicion: "verde",
      economia: "amarillo",
      cuenta: "rojo",
      funnel_web: "verde",
      creativos: "verde",
    } as const;
    expect(queFaltaDiagnostico([fuga({ monto: 1000 })], estados, TODO)).toEqual({
      datos: [],
      bloques: [],
    });
  });

  it("junta los faltantes de las fugas sin calcular, sin repetir y con nombre legible", () => {
    const fugas = [
      fuga({ calculable: false, faltantes: ["visitas_mensuales", "ticket_promedio"] }),
      fuga({ id: "gasto_no_rentable", calculable: false, faltantes: ["ticket_promedio"] }),
      fuga({ id: "fatiga_creativa", monto: 500, faltantes: ["no_se_lista"] }),
    ];
    const { datos } = queFaltaDiagnostico(fugas, {}, TODO);
    expect(datos).toEqual(["visitas mensuales", "ticket promedio"]);
  });

  it("un bloque sin estado cuenta como sin datos, en el orden del semáforo", () => {
    const { bloques } = queFaltaDiagnostico([], { economia: "verde" }, TODO);
    expect(bloques).toEqual(["Medición", "Cuenta", "Funnel web", "Contenido"]);
  });

  it("lo que el cliente no tiene no falta: sin tienda no se piden Medición ni Funnel web", () => {
    const { bloques } = queFaltaDiagnostico([], {}, SIN_TIENDA);
    expect(bloques).toEqual(["Economía", "Cuenta", "Contenido"]);
  });

  it("sin pauta en Meta no se pide Cuenta", () => {
    const { bloques } = queFaltaDiagnostico([], {}, { ...TODO, pautaMeta: false });
    expect(bloques).not.toContain("Cuenta");
  });
});
