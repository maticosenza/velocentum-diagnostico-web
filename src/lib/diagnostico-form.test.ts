import { describe, expect, it } from "vitest";
import {
  CAMPOS_EXCLUSIVOS,
  DATOS_INICIALES,
  camposExclusivosCargados,
  estacionarAlCambiarModo,
  sanearEstacionados,
  type DatosDiagnostico,
} from "./diagnostico-form";

const conDatosA: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Tienda",
  facturacion_mensual: 1_000_000,
  presupuesto_diario: 1000,
  csv_gasto_total: 30_000,
  csv_dias_periodo: 30,
};

describe("camposExclusivosCargados", () => {
  it("lista sólo los exclusivos del modo que tienen valor", () => {
    expect(camposExclusivosCargados(conDatosA, "A")).toEqual([
      "presupuesto_diario",
      "csv_gasto_total",
      "csv_dias_periodo",
    ]);
    expect(camposExclusivosCargados(conDatosA, "B")).toEqual([]);
  });

  it("no cuenta strings vacíos ni nulos", () => {
    expect(camposExclusivosCargados(DATOS_INICIALES, "A")).toEqual([]);
    expect(camposExclusivosCargados(DATOS_INICIALES, "B")).toEqual([]);
  });
});

describe("estacionarAlCambiarModo", () => {
  it("saca de datos lo exclusivo del modo que se deja y lo guarda aparte", () => {
    const { datos, estacionados } = estacionarAlCambiarModo(conDatosA, "A", {});
    expect(datos.presupuesto_diario).toBeNull();
    expect(datos.csv_gasto_total).toBeNull();
    expect(datos.csv_dias_periodo).toBeNull();
    expect(estacionados).toEqual({
      presupuesto_diario: 1000,
      csv_gasto_total: 30_000,
      csv_dias_periodo: 30,
    });
  });

  it("conserva lo compartido", () => {
    const { datos } = estacionarAlCambiarModo(conDatosA, "A", {});
    expect(datos.nombre_tienda).toBe("Tienda");
    expect(datos.facturacion_mensual).toBe(1_000_000);
  });

  it("ida y vuelta restaura lo estacionado y no deja nada en datos que no sea del modo activo", () => {
    const ida = estacionarAlCambiarModo(conDatosA, "A", {});
    const enB: DatosDiagnostico = { ...ida.datos, gasto_diario: 500, cantidad_campanas: "3" };
    const vuelta = estacionarAlCambiarModo(enB, "B", ida.estacionados);

    expect(vuelta.datos.presupuesto_diario).toBe(1000);
    expect(vuelta.datos.csv_gasto_total).toBe(30_000);
    expect(vuelta.datos.gasto_diario).toBeNull();
    expect(vuelta.datos.cantidad_campanas).toBe("");
    expect(vuelta.estacionados).toEqual({ gasto_diario: 500, cantidad_campanas: "3" });

    for (const campo of CAMPOS_EXCLUSIVOS.B) {
      expect(vuelta.datos[campo]).toEqual(DATOS_INICIALES[campo]);
    }
  });

  it("el estacionamiento vacío no toca nada del modo destino", () => {
    const { datos } = estacionarAlCambiarModo(conDatosA, "A", {});
    for (const campo of CAMPOS_EXCLUSIVOS.B) {
      expect(datos[campo]).toEqual(DATOS_INICIALES[campo]);
    }
  });
});

describe("sanearEstacionados", () => {
  it("descarta basura, campos de otro modo y valores vacíos", () => {
    expect(sanearEstacionados(null, "A")).toEqual({});
    expect(sanearEstacionados("x", "A")).toEqual({});
    expect(
      sanearEstacionados(
        { presupuesto_diario: 1000, gasto_diario: 500, capi_estado: "", nombre_tienda: "T" },
        "A",
      ),
    ).toEqual({ presupuesto_diario: 1000 });
  });
});
