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
  factor_fatiga: [
    { hasta: 2.5, factor: 0 },
    { hasta: 4, factor: 0.15 },
    { hasta: null, factor: 0.3 },
  ],
  delta_medicion: { verde: 0.05, rojo: 0.15 },
};

const base: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Tienda de prueba",
  vertical: "indumentaria",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  ticket_promedio: 45000,
  costo_producto_pct: 45,
  costo_envio_promedio: 3000,
  pasarela: "mercado_pago",
};

describe("calcularDiagnostico · caso de ejemplo", () => {
  it("da un margen cercano al 40% y un breakeven ROAS cercano a 2,5", () => {
    const r = calcularDiagnostico(base, cfg);
    expect(r.derivados.margen_contribucion).toBeGreaterThan(0.38);
    expect(r.derivados.margen_contribucion).toBeLessThan(0.45);
    expect(r.derivados.breakeven_roas).toBeGreaterThan(2.2);
    expect(r.derivados.breakeven_roas).toBeLessThan(2.7);
  });

  it("calcula CPA breakeven, CPA objetivo y ROAS objetivo", () => {
    const r = calcularDiagnostico(base, cfg);
    const margen = r.derivados.margen_contribucion!;
    expect(r.derivados.cpa_breakeven).toBe(Math.round(45000 * margen));
    expect(r.derivados.cpa_objetivo).toBe(Math.round(45000 * margen * 0.65));
    expect(r.derivados.roas_objetivo).toBeGreaterThan(3);
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
      { ...base, ventas_backoffice: 1_000_000, facturacion_pixel: 1_030_000 },
      cfg,
    );
    expect(verde.estados_bloque.medicion).toBe("verde");

    const rojo = calcularDiagnostico(
      { ...base, ventas_backoffice: 1_000_000, facturacion_pixel: 1_400_000 },
      cfg,
    );
    expect(rojo.estados_bloque.medicion).toBe("rojo");
    expect(rojo.derivados.delta_medicion).toBeCloseTo(0.4, 4);
    const riesgo = rojo.fugas.find((f) => f.id === "medicion");
    expect(riesgo?.tipo).toBe("riesgo");
    expect(riesgo?.monto).toBeNull();
  });

  it("normaliza cr_tienda cargado como porcentaje", () => {
    const r = calcularDiagnostico({ ...base, cr_tienda: 1.25 }, cfg);
    expect(r.estados_bloque.funnel_web).toBe("amarillo");
    const verde = calcularDiagnostico({ ...base, cr_tienda: 2.1 }, cfg);
    expect(verde.estados_bloque.funnel_web).toBe("verde");
  });
});

describe("fugas", () => {
  it("valoriza la fuga por conversión sólo si cr está por debajo del verde", () => {
    const r = calcularDiagnostico({ ...base, sesiones_mensuales: 50_000, cr_tienda: 1.0 }, cfg);
    const fuga = r.fugas.find((f) => f.id === "conversion");
    const margen = r.derivados.margen_contribucion!;
    expect(fuga?.calculable).toBe(true);
    expect(fuga?.monto).toBe(Math.round(50_000 * (0.018 - 0.01) * 45000 * margen));

    const sinFuga = calcularDiagnostico({ ...base, sesiones_mensuales: 50_000, cr_tienda: 2.5 }, cfg);
    expect(sinFuga.fugas.find((f) => f.id === "conversion")).toBeUndefined();
  });

  it("marca la fuga como no calculable y lista los campos faltantes", () => {
    const r = calcularDiagnostico({ ...base, cr_tienda: 1.0 }, cfg);
    const fuga = r.fugas.find((f) => f.id === "conversion");
    expect(fuga?.calculable).toBe(false);
    expect(fuga?.faltantes).toContain("sesiones_mensuales");
    expect(fuga?.monto).toBeNull();
  });

  it("aplica el factor de fatiga por tramo de frecuencia", () => {
    const r = calcularDiagnostico({ ...base, inversion_meta: 1_000_000, frecuencia_30d: 4.5 }, cfg);
    expect(r.fugas.find((f) => f.id === "fatiga_creativa")?.monto).toBe(300_000);
    const sano = calcularDiagnostico(
      { ...base, inversion_meta: 1_000_000, frecuencia_30d: 2 },
      cfg,
    );
    expect(sano.fugas.find((f) => f.id === "fatiga_creativa")).toBeUndefined();
  });

  it("suma la oportunidad total y devuelve el valor conservador al 60%", () => {
    const r = calcularDiagnostico(
      {
        ...base,
        facturacion_mensual: 10_000_000,
        inversion_meta: 1_000_000,
        inversion_google: 500_000,
        sesiones_mensuales: 40_000,
        cr_tienda: 0.9,
        frecuencia_30d: 3,
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
        ventas_backoffice: 0,
        facturacion_pixel: 100,
        inversion_meta: 0,
        inversion_google: 0,
        facturacion_mensual: 100,
      },
      cfg,
    );
    for (const v of Object.values(r.derivados)) {
      if (v !== null) expect(Number.isFinite(v)).toBe(true);
    }
    expect(Number.isFinite(r.oportunidad_total)).toBe(true);
  });
});
