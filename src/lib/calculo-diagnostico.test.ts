import { describe, expect, it } from "vitest";
import { calcularDiagnostico, type ConfiguracionCalculo } from "./calculo-diagnostico";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";

const cfg: ConfiguracionCalculo = {
  reserva_default: 0.35,
  comision_plataforma: {
    tiendanube_inicial: 0.02,
    tiendanube_esencial: 0.01,
    tiendanube_impulso: 0.007,
    shopify_basic: 0.02,
    shopify_grow: 0.01,
    shopify_advanced: 0.005,
    shopify_plus: 0.002,
    empretienda: 0,
    woocommerce: 0,
    desarrollo_propio: 0,
    otro: 0,
  },
  comision_pasarela: { mercado_pago: 0.05, pago_nube: 0.04, mobbex: 0.045, talo: 0.04, otra: 0.05 },
  umbrales_funnel_web: {
    cr_tienda: { verde: 0.018, rojo: 0.01 },
    carrito_a_checkout: { verde: 0.5, rojo: 0.35 },
    checkout_a_compra: { verde: 0.6, rojo: 0.4 },
    lcp_mobile: { verde: 2.5, rojo: 4 },
  },
  umbrales_creativos: {
    creativos_nuevos_mes: { verde: 8, rojo: 4 },
    gasto_creativo_top: { verde: 0.4, rojo: 0.6 },
    antiguedad_creativo_top_dias: { verde: 30, rojo: 60 },
    hook_rate: { verde: 0.3, rojo: 0.2 },
    outbound_ctr: { verde: 0.015, rojo: 0.008 },
  },
  delta_medicion: { verde: 0.05, rojo: 0.15 },
};

/** Caso de ejemplo: un solo producto al 45% de costo sobre un ticket de 45.000. */
const base: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Tienda de prueba",
  vertical: "indumentaria",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  ticket_promedio: 45000,
  costo_envio_promedio: 3000,
  pasarela: "mercado_pago",
  producto_1_nombre: "Producto principal",
  producto_1_costo: 20250,
  producto_1_precio: 45000,
};

describe("margen ponderado por productos", () => {
  it("con un solo producto usa su margen y deja el breakeven cerca de 2,5", () => {
    const r = calcularDiagnostico(base, cfg);
    expect(r.derivados.margen_contribucion).toBeGreaterThan(0.38);
    expect(r.derivados.margen_contribucion).toBeLessThan(0.45);
    expect(r.derivados.breakeven_roas).toBeGreaterThan(2.2);
    expect(r.derivados.breakeven_roas).toBeLessThan(2.7);
  });

  it("pondera los márgenes de varios productos por su participación", () => {
    const r = calcularDiagnostico(
      {
        ...base,
        producto_2_nombre: "Campera",
        producto_2_costo: 45000,
        producto_2_precio: 100000,
        producto_3_nombre: "Remera",
        producto_3_costo: 14000,
        producto_3_precio: 20000,
      },
      cfg,
    );
    const [m1, m2, m3] = r.derivados.margenes_producto;
    expect(m1).not.toBeNull();
    expect(m2).not.toBeNull();
    expect(m3).not.toBeNull();
    const ponderado = r.derivados.margen_contribucion!;
    // Queda entre el peor y el mejor margen, y más cerca del producto caro.
    expect(ponderado).toBeGreaterThan(Math.min(m1!, m2!, m3!));
    expect(ponderado).toBeLessThan(Math.max(m1!, m2!, m3!));
    const esperado =
      (m1! * 45000 + m2! * 100000 + m3! * 20000) / (45000 + 100000 + 20000);
    expect(ponderado).toBeCloseTo(esperado, 3);
  });

  it("sin productos con costo y precio el margen queda en null", () => {
    const r = calcularDiagnostico(
      { ...base, producto_1_costo: null, producto_1_precio: null },
      cfg,
    );
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.breakeven_roas).toBeNull();
    expect(r.fugas.find((f) => f.id === "gasto_no_rentable")?.calculable).toBe(false);
  });

  it("calcula CPA breakeven, CPA objetivo y ROAS objetivo", () => {
    const r = calcularDiagnostico(base, cfg);
    const margen = r.derivados.margen_contribucion!;
    expect(r.derivados.cpa_breakeven).toBeCloseTo(45000 * margen, -1);
    expect(r.derivados.cpa_objetivo).toBeCloseTo(45000 * margen * 0.65, -1);
    expect(r.derivados.roas_objetivo).toBeGreaterThan(3);
  });
});

describe("conversión derivada", () => {
  it("saca pedidos de facturación sobre ticket y conversión sobre visitas", () => {
    const r = calcularDiagnostico(
      { ...base, facturacion_mensual: 9_000_000, visitas_mensuales: 40_000 },
      cfg,
    );
    expect(r.derivados.pedidos_mensuales).toBe(200);
    expect(r.derivados.cr_tienda).toBeCloseTo(200 / 40_000, 6);
  });

  it("sin visitas cargadas la conversión queda en null", () => {
    const r = calcularDiagnostico({ ...base, facturacion_mensual: 9_000_000 }, cfg);
    expect(r.derivados.cr_tienda).toBeNull();
    expect(r.estados_bloque.funnel_web).toBe("sin_datos");
  });
});

describe("estados por bloque", () => {
  it("marca sin datos cuando falta información", () => {
    const r = calcularDiagnostico(DATOS_INICIALES, cfg);
    expect(r.estados_bloque.medicion).toBe("sin_datos");
    expect(r.estados_bloque.economia).toBe("sin_datos");
    expect(r.estados_bloque.cuenta).toBe("sin_datos");
    expect(r.estados_bloque.funnel_web).toBe("sin_datos");
    expect(r.estados_bloque.creativos).toBe("sin_datos");
    expect(r.oportunidad_total).toBe(0);
  });

  it("evalúa el delta de medición contra los umbrales", () => {
    const verde = calcularDiagnostico(
      { ...base, facturacion_mensual: 1_000_000, facturacion_pixel: 1_030_000 },
      cfg,
    );
    expect(verde.estados_bloque.medicion).toBe("verde");

    const rojo = calcularDiagnostico(
      { ...base, facturacion_mensual: 1_000_000, facturacion_pixel: 1_400_000 },
      cfg,
    );
    expect(rojo.estados_bloque.medicion).toBe("rojo");
    expect(rojo.derivados.delta_medicion).toBeCloseTo(0.4, 4);
    const riesgo = rojo.fugas.find((f) => f.id === "medicion");
    expect(riesgo?.tipo).toBe("riesgo");
    expect(riesgo?.monto).toBeNull();
  });
});

describe("fugas", () => {
  it("valoriza la fuga por conversión sólo si la conversión está por debajo del verde", () => {
    const r = calcularDiagnostico(
      { ...base, facturacion_mensual: 9_000_000, visitas_mensuales: 50_000 },
      cfg,
    );
    const cr = r.derivados.cr_tienda!;
    const margen = r.derivados.margen_contribucion!;
    const fuga = r.fugas.find((f) => f.id === "conversion");
    expect(fuga?.calculable).toBe(true);
    expect(fuga?.monto).toBeCloseTo(50_000 * (0.018 - cr) * 45000 * margen, -4);

    const sinFuga = calcularDiagnostico(
      { ...base, facturacion_mensual: 9_000_000, visitas_mensuales: 5_000 },
      cfg,
    );
    expect(sinFuga.fugas.find((f) => f.id === "conversion")).toBeUndefined();
  });

  it("marca la fuga como no calculable y lista los campos faltantes", () => {
    const r = calcularDiagnostico({ ...base, facturacion_mensual: 9_000_000 }, cfg);
    const fuga = r.fugas.find((f) => f.id === "conversion");
    expect(fuga?.calculable).toBe(false);
    expect(fuga?.faltantes).toContain("visitas_mensuales");
    expect(fuga?.monto).toBeNull();
  });

  it("ya no calcula fuga por fatiga creativa", () => {
    const r = calcularDiagnostico({ ...base, inversion_meta: 1_000_000 }, cfg);
    expect(r.fugas.find((f) => f.id === "fatiga_creativa")).toBeUndefined();
  });

  it("usa el gasto diario del modo B para el presupuesto", () => {
    const r = calcularDiagnostico({ ...base, gasto_diario: 50_000 }, cfg);
    expect(r.derivados.inversion_actual_mensual).toBe(1_500_000);
  });

  it("suma la oportunidad total y devuelve el valor conservador al 60%", () => {
    const r = calcularDiagnostico(
      {
        ...base,
        facturacion_mensual: 10_000_000,
        inversion_meta: 1_000_000,
        inversion_google: 500_000,
        visitas_mensuales: 40_000,
        conjuntos_activos: 12,
        presupuesto_diario: 50_000,
      },
      cfg,
    );
    const suma = r.fugas.reduce((a, f) => a + (f.monto ?? 0), 0);
    expect(r.oportunidad_total).toBe(Math.round(suma));
    expect(r.oportunidad_conservadora).toBe(Math.round(suma * 0.6));
    for (const f of r.fugas) {
      if (f.monto !== null) expect(Number.isFinite(f.monto)).toBe(true);
    }
  });

  it("nunca devuelve NaN ni infinito con datos degenerados", () => {
    const r = calcularDiagnostico(
      {
        ...base,
        ticket_promedio: 0,
        producto_1_precio: 0,
        facturacion_pixel: 100,
        inversion_meta: 0,
        inversion_google: 0,
        facturacion_mensual: 100,
      },
      cfg,
    );
    for (const [k, v] of Object.entries(r.derivados)) {
      if (k === "margenes_producto") continue;
      if (v !== null) expect(Number.isFinite(v as number)).toBe(true);
    }
    expect(Number.isFinite(r.oportunidad_total)).toBe(true);
  });
});
