/**
 * Fase 5 (productos dinámicos y cobertura, 2026-08-21): la lista de productos
 * pasa de tres casillas fijas a una lista de uno a cinco, se expone la
 * cobertura del catálogo analizado, y se preserva la regla ya aprobada de que
 * el margen de la muestra y el margen total son cosas distintas.
 */
import { describe, expect, it } from "vitest";
import {
  camposPorBloque,
  cantidadProductosDe,
  DATOS_INICIALES,
  type DatosDiagnostico,
} from "./diagnostico-form";
import { calcularDiagnostico, coberturaProductos, productosCargados } from "./calculo-diagnostico";
import type { ConfiguracionCalculo } from "./calculo-diagnostico";
import {
  casoSnakeStore,
  casoSnakeStoreCoberturaCompleta,
  configuracionRegresionFase2,
  esperadosFase2,
} from "./fixtures-casos";

function datosCon(overrides: Partial<DatosDiagnostico>): DatosDiagnostico {
  return { ...DATOS_INICIALES, ...overrides };
}

const cfg: ConfiguracionCalculo = {
  reserva_default: 0.35,
  comision_plataforma: { tiendanube_esencial: 0.01 },
  comision_pasarela: { mercado_pago: 0.05 },
};

const base: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Tienda de prueba",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  ticket_promedio: 45000,
  costo_envio_promedio: 3000,
  pasarela: "mercado_pago",
};

describe("cantidadProductosDe: acota entre 1 y 5", () => {
  it("sin el campo cargado, usa 3 (compatibilidad con diagnósticos anteriores)", () => {
    expect(cantidadProductosDe({})).toBe(3);
  });

  it("acota valores fuera de rango", () => {
    expect(cantidadProductosDe({ cantidad_productos: 0 })).toBe(1);
    expect(cantidadProductosDe({ cantidad_productos: -2 })).toBe(1);
    expect(cantidadProductosDe({ cantidad_productos: 8 })).toBe(5);
  });

  it("respeta un valor válido dentro del rango", () => {
    expect(cantidadProductosDe({ cantidad_productos: 1 })).toBe(1);
    expect(cantidadProductosDe({ cantidad_productos: 5 })).toBe(5);
  });
});

describe("camposPorBloque(\"productos\"): la cantidad de productos define lo requerido", () => {
  it("con 1 producto, modo B sólo pide el nombre, el % y costo/precio del principal", () => {
    const campos = camposPorBloque("B", "productos", 1);
    expect(campos).toEqual([
      "producto_1_nombre",
      "producto_1_pct_facturacion",
      "producto_1_costo",
      "producto_1_precio",
    ]);
  });

  it("con 5 productos, modo A pide nombre, % y costo/precio de los cinco", () => {
    const campos = camposPorBloque("A", "productos", 5);
    for (const n of [1, 2, 3, 4, 5]) {
      expect(campos).toContain(`producto_${n}_nombre`);
      expect(campos).toContain(`producto_${n}_pct_facturacion`);
      expect(campos).toContain(`producto_${n}_costo`);
      expect(campos).toContain(`producto_${n}_precio`);
    }
    expect(campos).toHaveLength(20);
  });

  it("con 5 productos, modo B sigue pidiendo costo/precio sólo del principal", () => {
    const campos = camposPorBloque("B", "productos", 5);
    expect(campos).toContain("producto_1_costo");
    expect(campos).toContain("producto_1_precio");
    expect(campos).not.toContain("producto_2_costo");
    expect(campos).not.toContain("producto_5_costo");
    for (const n of [1, 2, 3, 4, 5]) {
      expect(campos).toContain(`producto_${n}_nombre`);
      expect(campos).toContain(`producto_${n}_pct_facturacion`);
    }
  });
});

describe("productosCargados: reconoce hasta cinco productos", () => {
  it("carga los cinco cuando los cinco tienen costo y precio", () => {
    const d = datosCon({
      cantidad_productos: 5,
      producto_1_nombre: "P1",
      producto_1_costo: 100,
      producto_1_precio: 200,
      producto_2_nombre: "P2",
      producto_2_costo: 100,
      producto_2_precio: 200,
      producto_3_nombre: "P3",
      producto_3_costo: 100,
      producto_3_precio: 200,
      producto_4_nombre: "P4",
      producto_4_costo: 100,
      producto_4_precio: 200,
      producto_5_nombre: "P5",
      producto_5_costo: 100,
      producto_5_precio: 200,
    });
    expect(productosCargados(d).map((p) => p.indice)).toEqual([1, 2, 3, 4, 5]);
  });

  it("un producto 4 o 5 sin costo/precio no entra en la lista cargada", () => {
    const d = datosCon({
      producto_1_nombre: "P1",
      producto_1_costo: 100,
      producto_1_precio: 200,
      producto_4_nombre: "Sin datos",
    });
    expect(productosCargados(d).map((p) => p.indice)).toEqual([1]);
  });
});

describe("coberturaProductos: qué porcentaje del catálogo está analizado", () => {
  it("sin productos cargados, cobertura cero", () => {
    expect(coberturaProductos(DATOS_INICIALES)).toBe(0);
  });

  it("suma los porcentajes declarados de los productos cargados, sin superar 100", () => {
    const d = datosCon({
      producto_1_nombre: "P1",
      producto_1_costo: 100,
      producto_1_precio: 200,
      producto_1_pct_facturacion: 30,
      producto_2_nombre: "P2",
      producto_2_costo: 100,
      producto_2_precio: 200,
      producto_2_pct_facturacion: 20,
    });
    expect(coberturaProductos(d)).toBe(50);
  });

  it("cinco productos que suman 100% dan cobertura completa", () => {
    const d = datosCon({
      cantidad_productos: 5,
      producto_1_nombre: "P1",
      producto_1_costo: 100,
      producto_1_precio: 200,
      producto_1_pct_facturacion: 20,
      producto_2_nombre: "P2",
      producto_2_costo: 100,
      producto_2_precio: 200,
      producto_2_pct_facturacion: 20,
      producto_3_nombre: "P3",
      producto_3_costo: 100,
      producto_3_precio: 200,
      producto_3_pct_facturacion: 20,
      producto_4_nombre: "P4",
      producto_4_costo: 100,
      producto_4_precio: 200,
      producto_4_pct_facturacion: 20,
      producto_5_nombre: "P5",
      producto_5_costo: 100,
      producto_5_precio: 200,
      producto_5_pct_facturacion: 20,
    });
    expect(coberturaProductos(d)).toBe(100);
  });

  it("un producto cargado sin porcentaje declarado no suma cobertura (no se inventa el resto)", () => {
    const d = datosCon({
      producto_1_nombre: "Único",
      producto_1_costo: 20250,
      producto_1_precio: 45000,
    });
    expect(coberturaProductos(d)).toBe(0);
  });
});

describe("calcularDiagnostico: margen ponderado con hasta cinco productos", () => {
  it("pondera los cinco productos por su participación declarada", () => {
    const d: DatosDiagnostico = {
      ...base,
      cantidad_productos: 5,
      producto_1_nombre: "P1",
      producto_1_costo: 10000,
      producto_1_precio: 20000,
      producto_1_pct_facturacion: 20,
      producto_2_nombre: "P2",
      producto_2_costo: 12000,
      producto_2_precio: 20000,
      producto_2_pct_facturacion: 20,
      producto_3_nombre: "P3",
      producto_3_costo: 14000,
      producto_3_precio: 20000,
      producto_3_pct_facturacion: 20,
      producto_4_nombre: "P4",
      producto_4_costo: 16000,
      producto_4_precio: 20000,
      producto_4_pct_facturacion: 20,
      producto_5_nombre: "P5",
      producto_5_costo: 18000,
      producto_5_precio: 20000,
      producto_5_pct_facturacion: 20,
    };
    const r = calcularDiagnostico(d, cfg);
    expect(r.derivados.margenes_producto).toHaveLength(5);
    expect(r.derivados.pesos_producto).toEqual([0.2, 0.2, 0.2, 0.2, 0.2]);
    expect(r.derivados.margenes_producto.every((m) => typeof m === "number")).toBe(true);
    // Con 5 productos cubriendo el 100% de la facturación, el margen ponderado
    // es el promedio simple pesado por partes iguales (20% cada uno).
    const numericos = r.derivados.margenes_producto.filter(
      (m): m is number => typeof m === "number",
    );
    const promedio = numericos.reduce((a, m) => a + m, 0) / numericos.length;
    expect(r.derivados.margen_contribucion).toBeCloseTo(promedio, 4);
    expect(r.derivados.cobertura_productos).toBe(100);
  });

  it("el cuarto y quinto producto participan del breakeven y la comisión por producto", () => {
    const d: DatosDiagnostico = {
      ...base,
      cantidad_productos: 4,
      producto_1_nombre: "P1",
      producto_1_costo: 10000,
      producto_1_precio: 20000,
      producto_4_nombre: "P4",
      producto_4_costo: 16000,
      producto_4_precio: 20000,
    };
    const r = calcularDiagnostico(d, cfg);
    // Sin porcentajes declarados, ambos entran con peso igual (0,5 cada uno).
    expect(r.derivados.pesos_producto).toEqual([0.5, null, null, 0.5, null]);
    expect(r.derivados.margenes_producto[3]).not.toBeNull();
  });

  it("cobertura de productos parcial: la cobertura queda visible, la muestra se calcula, pero el total queda retenido", () => {
    const d: DatosDiagnostico = {
      ...base,
      producto_1_nombre: "P1",
      producto_1_costo: 10000,
      producto_1_precio: 20000,
      producto_1_pct_facturacion: 40,
      producto_2_nombre: "P2",
      producto_2_costo: 12000,
      producto_2_precio: 20000,
      producto_2_pct_facturacion: 20,
    };
    const r = calcularDiagnostico(d, cfg);
    expect(r.derivados.cobertura_productos).toBe(60);
    // El margen total exige 100% explícito de cobertura de productos: con
    // 60% queda retenido. El de la muestra sí se calcula sobre lo cargado.
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(typeof r.derivados.margen_muestra).toBe("number");
  });
});

describe("H-23 · sólo entran los productos que siguen en la lista", () => {
  it("un producto quitado con datos no entra ni al margen ni a la cobertura", () => {
    // Snake con la lista bajada a 1: los productos 2 y 3 siguen en `datos`.
    const d = { ...casoSnakeStore, cantidad_productos: 1 };
    expect(productosCargados(d).map((p) => p.indice)).toEqual([1]);
    expect(coberturaProductos(d)).toBe(30);
    const r = calcularDiagnostico(d, configuracionRegresionFase2);
    expect(r.derivados.margenes_producto).toEqual([
      esperadosFase2.snakeStore.margenesProducto[0],
      null,
      null,
      null,
      null,
    ]);
    expect(r.derivados.pesos_producto).toEqual([1, null, null, null, null]);
    expect(r.derivados.margen_muestra).toBe(esperadosFase2.snakeStore.margenesProducto[0]);
  });

  it("un producto 4 quitado no completa el 100% de cobertura", () => {
    const d = datosCon({
      cantidad_productos: 3,
      producto_1_costo: 100,
      producto_1_precio: 200,
      producto_1_pct_facturacion: 60,
      producto_4_costo: 100,
      producto_4_precio: 200,
      producto_4_pct_facturacion: 40,
    });
    expect(coberturaProductos(d)).toBe(60);
    expect(coberturaProductos({ ...d, cantidad_productos: 4 })).toBe(100);
  });

  it("sin cantidad_productos guardada se leen los tres de antes de la fase 5", () => {
    const d = { ...casoSnakeStore } as Partial<DatosDiagnostico>;
    delete d.cantidad_productos;
    expect(productosCargados(d as DatosDiagnostico).map((p) => p.indice)).toEqual([1, 2, 3]);
  });

  it("Snake tal como está en el fixture (cantidad 3) no cambia", () => {
    expect(casoSnakeStore.cantidad_productos).toBe(3);
    expect(coberturaProductos(casoSnakeStore)).toBe(60);
  });
});

describe("H-50 · en modo B los montos de los productos 2 a 5 no entran", () => {
  it("Snake en modo B: sólo el principal tiene margen y la cobertura es la suya", () => {
    expect(productosCargados(casoSnakeStore, "B").map((p) => p.indice)).toEqual([1]);
    expect(coberturaProductos(casoSnakeStore, "B")).toBe(30);
    const r = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2, "B");
    expect(r.derivados.cobertura_productos).toBe(30);
    expect(r.derivados.margenes_producto).toEqual([
      esperadosFase2.snakeStore.margenesProducto[0],
      null,
      null,
      null,
      null,
    ]);
  });

  it("los mismos datos en modo A (el default) siguen dando los tres márgenes", () => {
    const r = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2);
    expect(r.derivados.margenes_producto).toEqual(esperadosFase2.snakeStore.margenesProducto);
    expect(calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2, "A")).toEqual(r);
  });

  it("en modo B el porcentaje del producto 2 sin montos no suma cobertura", () => {
    const d = datosCon({
      producto_1_costo: 100,
      producto_1_precio: 200,
      producto_1_pct_facturacion: 70,
      producto_2_pct_facturacion: 30,
    });
    expect(coberturaProductos(d, "B")).toBe(70);
  });
});

describe("H-31 · margen retenido por cobertura: se piden campos del formulario", () => {
  /** Snake con las tres fugas que dependen del margen y no pasan por el funnel. */
  const conFugas = (d: DatosDiagnostico): DatosDiagnostico => ({
    ...d,
    facturacion_mensual: 20_000_000,
    inversion_meta: 1_000_000,
    carritos_abandonados: 100,
    retencion_recuperacion_pct_actual: 5,
    recompra_compradores_unicos: 500,
    recompra_tasa_actual_pct: 10,
    recompra_ventana_dias: 60,
    recompra_ticket_segunda_compra: 150_000,
    recompra_tiene_secuencia_postventa: false,
  });
  const IDS = ["gasto_no_rentable", "recuperacion_carrito", "recompra"];
  const faltantesDe = (d: DatosDiagnostico, modo: "A" | "B" = "A") => {
    const r = calcularDiagnostico(d, configuracionRegresionFase2, modo);
    return IDS.map((id) => {
      const f = r.fugas.find((x) => x.id === id);
      expect(f, id).toBeDefined();
      return f!.faltantes;
    });
  };

  it("Snake (60%): las tres fugas piden los porcentajes de producto, no el margen", () => {
    const r = calcularDiagnostico(conFugas(casoSnakeStore), configuracionRegresionFase2);
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.margen_muestra).not.toBeNull();
    for (const faltan of faltantesDe(conFugas(casoSnakeStore))) {
      expect(faltan).not.toContain("margen_contribucion");
      expect(faltan).toEqual(
        expect.arrayContaining([
          "producto_1_pct_facturacion",
          "producto_2_pct_facturacion",
          "producto_3_pct_facturacion",
        ]),
      );
    }
    const gasto = r.fugas.find((x) => x.id === "gasto_no_rentable")!;
    expect(gasto.faltantes).toEqual([
      "producto_1_pct_facturacion",
      "producto_2_pct_facturacion",
      "producto_3_pct_facturacion",
    ]);
  });

  it("un producto del cálculo sin porcentaje: se pide sólo ese porcentaje", () => {
    const d = conFugas({ ...casoSnakeStore, producto_2_pct_facturacion: null });
    for (const faltan of faltantesDe(d)) {
      expect(faltan).toContain("producto_2_pct_facturacion");
      expect(faltan).not.toContain("producto_1_pct_facturacion");
      expect(faltan).not.toContain("margen_contribucion");
    }
  });

  it("un producto declarado sin montos: se piden su costo y su precio", () => {
    const d = conFugas({
      ...casoSnakeStore,
      cantidad_productos: 4,
      producto_4_nombre: "Buzo",
      producto_4_pct_facturacion: 40,
    });
    for (const faltan of faltantesDe(d)) {
      expect(faltan).toEqual(expect.arrayContaining(["producto_4_costo", "producto_4_precio"]));
      expect(faltan).not.toContain("producto_4_pct_facturacion");
      expect(faltan).not.toContain("margen_contribucion");
    }
  });

  it("en modo B no se piden montos que el formulario no muestra", () => {
    for (const faltan of faltantesDe(conFugas(casoSnakeStore), "B")) {
      expect(faltan).toContain("producto_1_pct_facturacion");
      expect(faltan).not.toContain("producto_2_costo");
      expect(faltan).not.toContain("producto_2_pct_facturacion");
    }
  });

  it("sin productos cargados (4b): se piden los campos del producto principal", () => {
    const d = conFugas({
      ...casoSnakeStore,
      producto_1_costo: null,
      producto_1_precio: null,
      producto_1_pct_facturacion: null,
      producto_2_costo: null,
      producto_2_precio: null,
      producto_3_costo: null,
      producto_3_precio: null,
    });
    for (const faltan of faltantesDe(d)) {
      expect(faltan).toEqual(
        expect.arrayContaining([
          "producto_1_costo",
          "producto_1_precio",
          "producto_1_pct_facturacion",
        ]),
      );
      expect(faltan).not.toContain("margen_contribucion");
    }
  });

  it("con cobertura completa el margen se publica y ninguna fuga lo pide", () => {
    const r = calcularDiagnostico(
      conFugas(casoSnakeStoreCoberturaCompleta),
      configuracionRegresionFase2,
    );
    expect(r.derivados.margen_contribucion).not.toBeNull();
    for (const f of r.fugas) {
      expect(f.faltantes.some((c) => c.startsWith("producto_"))).toBe(false);
      expect(f.faltantes).not.toContain("margen_contribucion");
    }
  });

  it("si el margen no se calcula por otra causa, se conserva margen_contribucion", () => {
    // Sin ticket no hay margen de muestra: la causa no es cobertura.
    const d = conFugas({ ...casoSnakeStore, ticket_promedio: null });
    const r = calcularDiagnostico(d, configuracionRegresionFase2);
    expect(r.derivados.margen_muestra).toBeNull();
    const gasto = r.fugas.find((x) => x.id === "gasto_no_rentable")!;
    expect(gasto.faltantes).toContain("margen_contribucion");
    expect(gasto.faltantes.some((c) => c.startsWith("producto_"))).toBe(false);
  });
});
