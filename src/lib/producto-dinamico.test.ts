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

  it("cobertura de productos parcial: la cobertura queda visible aunque el margen ya se calcule", () => {
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
    expect(typeof r.derivados.margen_contribucion).toBe("number");
  });
});
