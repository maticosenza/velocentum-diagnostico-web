/**
 * H-40: el monto que acompaña a cada hallazgo redactado sale del
 * `hallazgo_id` que copia el modelo y de `FUGA_DE_HALLAZGO`, nunca del título.
 */
import { describe, expect, it } from "vitest";
import type { Fuga } from "./calculo-diagnostico";
import {
  FUGA_DE_HALLAZGO,
  montosDeHallazgos,
  normalizarPropuesta,
  type PropuestaGenerada,
} from "./propuesta";

type Hallazgo = PropuestaGenerada["hallazgos"][number];

function hallazgo(titulo: string, hallazgo_id: string | null): Hallazgo {
  return {
    hallazgo_id,
    titulo,
    capa: "servicio",
    que_encontramos: "",
    que_significa: "",
    que_hacemos: "",
    servicio: null,
  };
}

function fuga(id: string, monto: number | null, extra: Partial<Fuga> = {}): Fuga {
  return {
    id,
    etiqueta: id,
    tipo: "monto",
    monto,
    calculable: monto !== null,
    faltantes: [],
    ...extra,
  };
}

const FUGAS: Fuga[] = [
  fuga("funnel_carrito", 50_000),
  fuga("gasto_no_rentable", 2_015_067),
  fuga("sobrefragmentacion", 300_000),
  fuga("recuperacion_carrito", 80_000),
  fuga("recompra", 120_000),
  fuga("medicion", null, { tipo: "riesgo" }),
];

describe("montosDeHallazgos", () => {
  it("asocia el hallazgo con su fuga por hallazgo_id", () => {
    const [mer, estructura] = montosDeHallazgos(
      [
        hallazgo("MER por debajo del breakeven", "mer_bajo"),
        hallazgo("Estructura de cuenta fragmentada", "estructura_cuenta"),
      ],
      FUGAS,
    );
    expect(mer).toEqual({ monto: 2_015_067, sospechosa: false, alcance: null });
    expect(estructura?.monto).toBe(300_000);
  });

  it("no le da el monto de gasto no rentable a títulos con 'Mercado' o 'comercial' (corrida F)", () => {
    const montos = montosDeHallazgos(
      [
        hallazgo("Publicaciones de Mercado Libre sin clips", "clips_ml"),
        hallazgo("Estrategia comercial sin foco", null),
      ],
      FUGAS,
    );
    expect(montos).toEqual([null, null]);
  });

  it("sin hallazgo_id no hay monto aunque el título coincida (propuestas guardadas)", () => {
    expect(montosDeHallazgos([hallazgo("MER por debajo del breakeven", null)], FUGAS)).toEqual([
      null,
    ]);
  });

  it("los tramos del funnel reciben su propio monto", () => {
    const [carrito] = montosDeHallazgos(
      [hallazgo("Carritos que no llegan al checkout", "funnel_carrito")],
      FUGAS,
    );
    expect(carrito?.monto).toBe(50_000);
  });

  it("recuperación de carrito toma su fuga, no la del funnel, y aclara que no incluye recompra", () => {
    const [recuperacion] = montosDeHallazgos(
      [hallazgo("Recuperación de carrito y recompra", "retencion_recuperacion_carrito")],
      FUGAS,
    );
    expect(recuperacion?.monto).toBe(80_000);
    expect(recuperacion?.alcance).toMatch(/solo recuperación de carrito/);
    expect(recuperacion?.alcance).toMatch(/sin recompra/);
  });

  it("un id repetido en dos hallazgos no le da monto a ninguno", () => {
    expect(
      montosDeHallazgos(
        [hallazgo("MER bajo", "mer_bajo"), hallazgo("Gasto que no rinde", "mer_bajo")],
        FUGAS,
      ),
    ).toEqual([null, null]);
  });

  it("sin monto cuando el id no tiene fuga, la fuga falta, es riesgo o su monto no es positivo", () => {
    const hallazgos = [
      hallazgo("Id desconocido", "inventado"),
      hallazgo("Medición", "medicion"),
      hallazgo("Checkout", "funnel_checkout"),
    ];
    expect(montosDeHallazgos(hallazgos, FUGAS)).toEqual([null, null, null]);
    expect(
      montosDeHallazgos(
        [hallazgo("Estructura", "estructura_cuenta"), hallazgo("Recompra", "recompra")],
        [fuga("sobrefragmentacion", 0), fuga("recompra", null)],
      ),
    ).toEqual([null, null]);
  });

  it("propaga la marca de sospechosa", () => {
    const [mer] = montosDeHallazgos(
      [hallazgo("MER bajo", "mer_bajo")],
      [fuga("gasto_no_rentable", 1_000, { sospechosa: true })],
    );
    expect(mer?.sospechosa).toBe(true);
  });

  it("cada fuga del mapa es un id que emite el motor", () => {
    const vigentes = [
      "gasto_no_rentable",
      "sobrefragmentacion",
      "recuperacion_carrito",
      "recompra",
      "funnel_navegacion",
      "funnel_carrito",
      "funnel_checkout",
      "funnel_combinado",
    ];
    for (const fugaId of Object.values(FUGA_DE_HALLAZGO)) expect(vigentes).toContain(fugaId);
  });
});

describe("normalizarPropuesta y hallazgo_id", () => {
  const base = { resumen: "Lectura general." };

  it("conserva el hallazgo_id que devuelve el modelo", () => {
    const p = normalizarPropuesta({
      ...base,
      hallazgos: [{ hallazgo_id: "mer_bajo", titulo: "MER bajo", capa: "servicio" }],
    });
    expect(p?.hallazgos[0]?.hallazgo_id).toBe("mer_bajo");
  });

  it("sin hallazgo_id, o con uno vacío o no textual, queda en null", () => {
    const p = normalizarPropuesta({
      ...base,
      hallazgos: [
        { titulo: "Sin id", capa: "servicio" },
        { hallazgo_id: "  ", titulo: "Vacío", capa: "servicio" },
        { hallazgo_id: 3, titulo: "Número", capa: "servicio" },
      ],
    });
    expect(p?.hallazgos.map((h) => h.hallazgo_id)).toEqual([null, null, null]);
  });
});
