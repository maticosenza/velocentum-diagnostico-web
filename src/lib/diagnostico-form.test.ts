import { describe, expect, it } from "vitest";
import {
  CAMPOS_EXCLUSIVOS,
  DATOS_INICIALES,
  borradorConDatos,
  camposExclusivosCargados,
  estacionarAlCambiarModo,
  hayDatosCargados,
  productoTieneDatos,
  quitarUltimoProducto,
  sanearEstacionados,
  type DatosDiagnostico,
} from "./diagnostico-form";
import { casoSnakeStore } from "./fixtures-casos";

const conDatosA: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Tienda",
  facturacion_mensual: 1_000_000,
  presupuesto_diario: 1000,
  csv_gasto_total: 30_000,
  csv_dias_periodo: 30,
};

describe("quitarUltimoProducto (H-55)", () => {
  it("baja la lista en uno y vacía el producto que sale", () => {
    const d = quitarUltimoProducto(casoSnakeStore);
    expect(d.cantidad_productos).toBe(2);
    expect(d.producto_3_nombre).toBe("");
    expect(d.producto_3_costo).toBeNull();
    expect(d.producto_3_precio).toBeNull();
    expect(d.producto_3_pct_facturacion).toBeNull();
    // Los que quedan en la lista no se tocan.
    expect(d.producto_2_nombre).toBe(casoSnakeStore.producto_2_nombre);
    expect(d.producto_2_costo).toBe(casoSnakeStore.producto_2_costo);
  });

  it("quitando dos veces no queda nada cargado debajo de la lista", () => {
    const d = quitarUltimoProducto(quitarUltimoProducto(casoSnakeStore));
    expect(d.cantidad_productos).toBe(1);
    expect(productoTieneDatos(d, 2)).toBe(false);
    expect(productoTieneDatos(d, 3)).toBe(false);
    expect(productoTieneDatos(d, 1)).toBe(true);
  });

  it("con un solo producto no hace nada", () => {
    const d = { ...casoSnakeStore, cantidad_productos: 1 };
    expect(quitarUltimoProducto(d)).toBe(d);
  });

  it("productoTieneDatos cuenta los montos aunque modo B no los muestre", () => {
    const d = { ...DATOS_INICIALES, producto_3_costo: 100 };
    expect(productoTieneDatos(d, 3)).toBe(true);
    expect(productoTieneDatos(DATOS_INICIALES, 3)).toBe(false);
  });
});

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

describe("hayDatosCargados", () => {
  it("un formulario recién abierto no tiene datos, aunque los iniciales traigan valores", () => {
    expect(hayDatosCargados(DATOS_INICIALES, {}, {})).toBe(false);
  });

  it("strings con sólo espacios y notas vacías no cuentan", () => {
    expect(
      hayDatosCargados({ ...DATOS_INICIALES, nombre_tienda: "   " }, { medicion: "  " }, {}),
    ).toBe(false);
  });

  it("cuenta cualquier campo distinto del inicial, incluidos booleanos y números por defecto", () => {
    expect(hayDatosCargados({ ...DATOS_INICIALES, nombre_tienda: "Tienda" }, {}, {})).toBe(true);
    expect(hayDatosCargados({ ...DATOS_INICIALES, vende_mercado_libre: true }, {}, {})).toBe(true);
    expect(hayDatosCargados({ ...DATOS_INICIALES, cantidad_productos: 5 }, {}, {})).toBe(true);
  });

  it("una nota o algo estacionado cuentan aunque los datos estén vacíos", () => {
    expect(hayDatosCargados(DATOS_INICIALES, { medicion: "no tiene pixel" }, {})).toBe(true);
    expect(hayDatosCargados(DATOS_INICIALES, {}, { presupuesto_diario: 1000 })).toBe(true);
  });
});

describe("borradorConDatos", () => {
  const crudo = (borrador: object) => JSON.stringify(borrador);

  it("sin borrador, ilegible o sin modo no hay nada que avisar", () => {
    expect(borradorConDatos(null)).toBeNull();
    expect(borradorConDatos("")).toBeNull();
    expect(borradorConDatos("{no es json")).toBeNull();
    expect(borradorConDatos("null")).toBeNull();
    expect(borradorConDatos(crudo({ datos: { nombre_tienda: "Tienda" } }))).toBeNull();
  });

  it("un borrador con sólo el modo elegido no cuenta", () => {
    expect(borradorConDatos(crudo({ modo: "A", datos: DATOS_INICIALES, notas: {} }))).toBeNull();
  });

  it("con datos devuelve el nombre de la tienda, recortado", () => {
    expect(borradorConDatos(crudo({ modo: "B", datos: { nombre_tienda: "  Tienda  " } }))).toEqual({
      nombreTienda: "Tienda",
    });
  });

  it("una nota sin nombre de tienda cuenta, con el nombre vacío", () => {
    expect(borradorConDatos(crudo({ modo: "A", notas: { medicion: "sin pixel" } }))).toEqual({
      nombreTienda: "",
    });
  });

  it("lo estacionado cuenta sólo si es del modo inactivo, como al recuperarlo", () => {
    expect(
      borradorConDatos(crudo({ modo: "B", estacionados: { presupuesto_diario: 1000 } })),
    ).toEqual({ nombreTienda: "" });
    expect(
      borradorConDatos(crudo({ modo: "A", estacionados: { presupuesto_diario: 1000 } })),
    ).toBeNull();
  });
});
