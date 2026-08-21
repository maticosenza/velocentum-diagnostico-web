import { describe, expect, it } from "vitest";
import {
  calcularDiagnostico,
  envioNetoVendedor,
  faltaEnvioCobrado,
  faltantesMargen,
  participacionesSuperan100,
  participacionesIncompatibles,
  canalesSuperan100,
  comisionEnEscalaSospechosa,
  COMISIONES_MARKETPLACE_DEFECTO,
  montosNetosDeDescuento,
  montosNetosDeFinanciacion,
  lecturaPresupuesto,
  type ConfiguracionCalculo,
} from "./calculo-diagnostico";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
import { casoSnakeStore, casoTitanWebB1, casoTitanWebB1AntesDeCanales } from "./fixtures-casos";
import { mapearHallazgos } from "./propuesta";

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

  it("pondera los márgenes por el porcentaje de facturación de cada producto", () => {
    const r = calcularDiagnostico(
      {
        ...base,
        producto_1_pct_facturacion: 5,
        producto_2_nombre: "Campera",
        producto_2_costo: 45000,
        producto_2_precio: 100000,
        producto_2_pct_facturacion: 15,
        producto_3_nombre: "Remera",
        producto_3_costo: 14000,
        producto_3_precio: 20000,
        producto_3_pct_facturacion: 80,
      },
      cfg,
    );
    const [m1, m2, m3] = r.derivados.margenes_producto;
    const ponderado = r.derivados.margen_contribucion!;
    const esperado = (m1! * 5 + m2! * 15 + m3! * 80) / 100;
    expect(ponderado).toBeCloseTo(esperado, 3);
    expect(r.derivados.pesos_producto).toEqual([0.05, 0.15, 0.8]);
  });

  it("la remera que factura el 80% manda sobre la campera cara", () => {
    const r = calcularDiagnostico(
      {
        ...DATOS_INICIALES,
        nombre_tienda: "Tienda de prueba",
        plataforma: "tiendanube",
        plan_plataforma: "esencial",
        pasarela: "mercado_pago",
        costo_envio_promedio: 3000,
        ticket_promedio: 25000,
        producto_1_nombre: "Remera",
        producto_1_costo: 14000,
        producto_1_precio: 20000,
        producto_1_pct_facturacion: 80,
        producto_2_nombre: "Campera",
        producto_2_costo: 45000,
        producto_2_precio: 100000,
        producto_2_pct_facturacion: 15,
      },
      cfg,
    );
    const [mRemera, mCampera] = r.derivados.margenes_producto;
    const ponderado = r.derivados.margen_contribucion!;
    expect(Math.abs(ponderado - mRemera!)).toBeLessThan(Math.abs(ponderado - mCampera!));
    expect(ponderado).toBeCloseTo((mRemera! * 80 + mCampera! * 15) / 95, 4);
  });

  it("sin porcentajes cargados usa el promedio simple de los márgenes", () => {
    const r = calcularDiagnostico(
      {
        ...base,
        producto_2_nombre: "Campera",
        producto_2_costo: 45000,
        producto_2_precio: 100000,
      },
      cfg,
    );
    const [m1, m2] = r.derivados.margenes_producto;
    expect(r.derivados.margen_contribucion).toBeCloseTo((m1! + m2!) / 2, 4);
    expect(r.derivados.pesos_producto).toEqual([0.5, 0.5, null]);
  });

  it("un producto con costo y precio pero sin porcentaje queda fuera del ponderado", () => {
    const r = calcularDiagnostico(
      {
        ...base,
        producto_1_pct_facturacion: 60,
        producto_2_nombre: "Campera",
        producto_2_costo: 45000,
        producto_2_precio: 100000,
      },
      cfg,
    );
    expect(r.derivados.margen_contribucion).toBeCloseTo(r.derivados.margenes_producto[0]!, 4);
    expect(r.derivados.pesos_producto[1]).toBeNull();
  });

  it("sin productos con costo y precio el margen queda en null", () => {
    const r = calcularDiagnostico(
      { ...base, producto_1_costo: null, producto_1_precio: null },
      cfg,
    );
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.breakeven_roas).toBeNull();
    expect(
      calcularDiagnostico(
        { ...base, producto_1_costo: null, producto_1_precio: null, inversion_meta: 1_000_000 },
        cfg,
      ).fugas.find((f) => f.id === "gasto_no_rentable")?.calculable,
    ).toBe(false);
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
  it("sin las etapas intermedias no hay desglose: una sola oportunidad combinada", () => {
    const r = calcularDiagnostico(
      { ...base, facturacion_mensual: 9_000_000, visitas_mensuales: 50_000 },
      cfg,
    );
    expect(r.fugas.find((f) => f.id === "conversion")).toBeUndefined();
    expect(r.fugas.find((f) => f.id === "funnel_navegacion")).toBeUndefined();
    const combinada = r.fugas.find((f) => f.id === "funnel_combinado")!;
    expect(combinada.calculable).toBe(true);
    expect(r.derivados.funnel.desglosado).toBe(false);
    expect(r.derivados.funnel.faltantes).toEqual(["agregados_carrito", "checkouts_iniciados"]);
  });

  it("sin visitas la oportunidad de funnel no se calcula", () => {
    const r = calcularDiagnostico({ ...base, facturacion_mensual: 9_000_000 }, cfg);
    expect(r.derivados.funnel.estado).toBe("sin_datos");
    expect(r.fugas.some((f) => f.id.startsWith("funnel_"))).toBe(false);
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
      if (k === "margenes_producto" || k === "pesos_producto" || k === "canales") continue;
      if (typeof v !== "number") continue;
      expect(Number.isFinite(v)).toBe(true);
    }
    for (const canal of r.derivados.canales) {
      for (const v of Object.values(canal)) {
        if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
      }
    }
    expect(Number.isFinite(r.oportunidad_total)).toBe(true);
  });
});

// ---------------------------------------------------------------- caso real
// Tienda de indumentaria de ticket alto: los tres problemas del motor.

const cfgReal: ConfiguracionCalculo = {
  ...cfg,
  umbrales_cr_por_ticket: [
    { hasta: 30000, verde: 0.025, rojo: 0.012 },
    { hasta: 80000, verde: 0.018, rojo: 0.009 },
    { hasta: 150000, verde: 0.012, rojo: 0.006 },
    { hasta: 300000, verde: 0.007, rojo: 0.0035 },
    { hasta: null, verde: 0.005, rojo: 0.0025 },
  ],
  tope_fuga_individual: 0.25,
  tope_fuga_total: 0.4,
};

const real: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Indumentaria ticket alto",
  vertical: "indumentaria",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  costo_envio_promedio: 8000,
  ticket_promedio: 225226,
  facturacion_mensual: 33_108_279,
  visitas_mensuales: 28_550,
  inversion_meta: 5_705_433,
  presupuesto_diario: 190_181,
  conjuntos_activos: 27,
  producto_1_nombre: "Producto principal",
  producto_1_costo: 96_284,
  producto_1_precio: 225_226,
};

describe("caso real de ticket alto", () => {
  it("reproduce el margen, el MER y el CPA objetivo del caso", () => {
    const r = calcularDiagnostico(real, cfgReal);
    expect(r.derivados.margen_contribucion).toBeCloseTo(0.477, 3);
    expect(r.derivados.mer_actual).toBeCloseTo(5.8, 1);
    expect(r.derivados.pedidos_mensuales).toBe(147);
    expect(r.derivados.cpa_objetivo).toBeGreaterThan(69_000);
    expect(r.derivados.cpa_objetivo).toBeLessThan(70_500);
  });

  it("usa el umbral de conversión del tramo de ticket, no el fijo de 1,8%", () => {
    const r = calcularDiagnostico(real, cfgReal);
    expect(r.derivados.cr_umbral_verde).toBe(0.007);
    expect(r.derivados.cr_tienda).toBeCloseTo(147 / 28_550, 4);
  });

  it("sin ticket cargado la conversión no se puede evaluar", () => {
    const r = calcularDiagnostico({ ...real, ticket_promedio: null }, cfgReal);
    expect(r.derivados.cr_umbral_verde).toBeNull();
    expect(r.estados_bloque.funnel_web).toBe("sin_datos");
  });

  it("la economía da verde porque la tienda fue rentable", () => {
    const r = calcularDiagnostico(real, cfgReal);
    expect(r.estados_bloque.economia).toBe("verde");
  });

  it("topea las fugas desproporcionadas y las marca como sospechosas", () => {
    const r = calcularDiagnostico(real, cfgReal);
    const sobre = r.fugas.find((f) => f.id === "sobrefragmentacion")!;

    expect(sobre.sospechosa).toBe(true);
    expect(sobre.monto!).toBeLessThanOrEqual(Math.ceil(33_108_279 * 0.25));
    expect(sobre.detalle).toMatch(/rango razonable/);

    expect(r.oportunidad_total).toBeLessThanOrEqual(Math.round(33_108_279 * 0.4));
    expect(r.oportunidad_total).toBeLessThan(33_108_279);
  });

  it("la oportunidad de funnel también queda topeada al 25% de la facturación", () => {
    const r = calcularDiagnostico(real, cfgReal);
    const funnel = r.fugas.find((f) => f.id === "funnel_combinado");
    if (funnel?.monto != null) {
      expect(funnel.monto).toBeLessThanOrEqual(Math.ceil(33_108_279 * 0.25));
    }
  });

  it("detecta que el volumen no alcanza y cambia la lectura de presupuesto", () => {
    const r = calcularDiagnostico(real, cfgReal);
    expect(r.derivados.pedidos_semanales).toBeCloseTo(147 / 4.3, 0);
    expect(r.derivados.volumen_suficiente).toBe(false);
    const lectura = lecturaPresupuesto(r.derivados)!;
    expect(lectura).toMatch(/volumen de compras/);
    expect(lectura).not.toMatch(/Subinversión/);
  });

  it("con volumen suficiente vuelve la lectura de subinversión", () => {
    const r = calcularDiagnostico(
      { ...real, ticket_promedio: 30_000, facturacion_mensual: 33_108_279 },
      cfgReal,
    );
    expect(r.derivados.volumen_suficiente).toBe(true);
    expect(lecturaPresupuesto(r.derivados)).toMatch(/Subinversión|alcanza el piso/);
  });

  it("la sobrefragmentación se sigue reportando", () => {
    const r = calcularDiagnostico(real, cfgReal);
    expect(r.fugas.find((f) => f.id === "sobrefragmentacion")?.calculable).toBe(true);
  });
});

describe("cascada de atribución del funnel web", () => {
  const cfgFunnel: ConfiguracionCalculo = {
    ...cfg,
    mejora_agregado_pts: 2,
    mejora_checkout_pts: 10,
    mejora_compra_pts: 10,
  };
  // 50.000 visitas · 5.000 agregados · 1.000 checkouts · 200 compras.
  const conFunnel: DatosDiagnostico = {
    ...base,
    facturacion_mensual: 9_000_000,
    visitas_mensuales: 50_000,
    agregados_carrito: 5_000,
    checkouts_iniciados: 1_000,
  };

  it("parte el funnel en tres tramos disjuntos", () => {
    const r = calcularDiagnostico(conFunnel, cfgFunnel);
    const ids = r.fugas.map((f) => f.id);
    expect(ids).toContain("funnel_navegacion");
    expect(ids).toContain("funnel_carrito");
    expect(ids).toContain("funnel_checkout");
    expect(ids).not.toContain("funnel_combinado");
    expect(ids).not.toContain("conversion");
    expect(ids).not.toContain("carritos_abandonados");
    expect(r.derivados.funnel.desglosado).toBe(true);
    for (const id of ["funnel_navegacion", "funnel_carrito", "funnel_checkout"]) {
      expect(r.fugas.find((f) => f.id === id)!.confianza, id).toBe("alta");
    }
  });

  it("cascada y combinada son excluyentes entre sí", () => {
    const conTodo = calcularDiagnostico(conFunnel, cfgFunnel).fugas.map((f) => f.id);
    expect(conTodo).toContain("funnel_navegacion");
    expect(conTodo).toContain("funnel_carrito");
    expect(conTodo).toContain("funnel_checkout");
    expect(conTodo).not.toContain("funnel_combinado");

    for (const falta of ["agregados_carrito", "checkouts_iniciados"] as const) {
      const r = calcularDiagnostico({ ...conFunnel, [falta]: null }, cfgFunnel);
      const ids = r.fugas.map((f) => f.id);
      expect(ids, falta).toContain("funnel_combinado");
      expect(ids, falta).not.toContain("funnel_navegacion");
      expect(ids, falta).not.toContain("funnel_carrito");
      expect(ids, falta).not.toContain("funnel_checkout");
      expect(r.fugas.find((f) => f.id === "funnel_combinado")!.confianza).toBe("parcial");
    }
  });

  it("deriva las probabilidades condicionales de cada etapa", () => {
    const f = calcularDiagnostico(conFunnel, cfgFunnel).derivados.funnel;
    expect(f.p_carrito_dado_visita).toBeCloseTo(0.1, 4);
    expect(f.p_checkout_dado_carrito).toBeCloseTo(0.2, 4);
    expect(f.p_compra_dado_checkout).toBeCloseTo(0.2, 4);
    expect(f.compras).toBe(200);
  });

  it("valoriza cada tramo con las mejoras objetivo en puntos porcentuales", () => {
    const r = calcularDiagnostico(conFunnel, cfgFunnel);
    const margen = r.derivados.margen_contribucion!;
    const ticket = 45_000;
    // Navegación: +2 pts sobre el 10% de agregado, arrastrando las etapas siguientes.
    const navegacion = 50_000 * 0.02 * 0.2 * 0.2 * ticket * margen;
    // Carrito: +10 pts sobre el 20% de checkout, sobre los agregados actuales.
    const carrito = 5_000 * 0.1 * 0.2 * ticket * margen;
    // Checkout: +10 pts sobre el 20% de compra, sobre los checkouts actuales.
    const checkout = 1_000 * 0.1 * ticket * margen;

    const cerca = (real: number, esperado: number) =>
      expect(Math.abs(real - esperado) / esperado).toBeLessThan(0.001);
    cerca(r.fugas.find((f) => f.id === "funnel_navegacion")!.monto!, navegacion);
    cerca(r.fugas.find((f) => f.id === "funnel_carrito")!.monto!, carrito);
    cerca(r.fugas.find((f) => f.id === "funnel_checkout")!.monto!, checkout);
  });

  it("si falta una etapa entrega una oportunidad combinada sin desglose", () => {
    const r = calcularDiagnostico({ ...conFunnel, checkouts_iniciados: null }, cfgFunnel);
    const ids = r.fugas.map((f) => f.id);
    expect(ids).toContain("funnel_combinado");
    expect(ids).not.toContain("funnel_carrito");
    expect(r.derivados.funnel.faltantes).toEqual(["checkouts_iniciados"]);
  });

  it("cadena rota: más agregados que visitas invalida el funnel", () => {
    const r = calcularDiagnostico({ ...conFunnel, agregados_carrito: 60_000 }, cfgFunnel);
    expect(r.derivados.funnel.estado).toBe("error");
    expect(r.derivados.funnel.etapa_error).toBe("agregados_carrito");
    expect(r.fugas.some((f) => f.id.startsWith("funnel_"))).toBe(false);
    expect(r.estados_bloque.funnel_web).toBe("sin_datos");
  });

  it("cadena rota: más compras que checkouts iniciados también invalida", () => {
    const r = calcularDiagnostico({ ...conFunnel, checkouts_iniciados: 100 }, cfgFunnel);
    expect(r.derivados.funnel.estado).toBe("error");
    expect(r.derivados.funnel.etapa_error).toBe("compras");
  });
});

describe("hallazgos que dependen de booleanos sin responder", () => {
  const cfgCarrito: ConfiguracionCalculo = { ...cfg, recuperacion_carrito_esperada: 0.08 };
  const conDatos: DatosDiagnostico = {
    ...base,
    facturacion_mensual: 10_000_000,
    carritos_abandonados: 500,
  };
  const hallazgosDe = (d: DatosDiagnostico) => {
    const r = calcularDiagnostico(d, cfgCarrito);
    return mapearHallazgos(d, r.derivados, r.estados_bloque, r.fugas).map((x) => x.id);
  };

  it("no afirma que no hay retargeting cuando el campo quedó en null", () => {
    expect(hallazgosDe(conDatos)).not.toContain("sin_retargeting");
  });

  it("genera el hallazgo solo cuando el retargeting es un no explícito", () => {
    expect(
      hallazgosDe({ ...conDatos, recuperacion_carrito: false, retargeting_abandono: false }),
    ).toContain("sin_retargeting");
  });

  it("no afirma que faltan clips de Mercado Libre sin el campo triestado en false", () => {
    expect(hallazgosDe({ ...conDatos, vende_mercado_libre: true })).not.toContain("clips_ml");
    expect(
      hallazgosDe({ ...conDatos, vende_mercado_libre: true, ml_tiene_clips: true }),
    ).not.toContain("clips_ml");
  });

  it("no genera el hallazgo de clips si el negocio no vende en Mercado Libre", () => {
    expect(
      hallazgosDe({ ...conDatos, vende_mercado_libre: false, ml_tiene_clips: false }),
    ).not.toContain("clips_ml");
  });

  it("genera el hallazgo de clips solo con vende_mercado_libre y ml_tiene_clips en false", () => {
    expect(
      hallazgosDe({ ...conDatos, vende_mercado_libre: true, ml_tiene_clips: false }),
    ).toContain("clips_ml");
  });

  it("no genera el hallazgo de ángulo si los dos campos de contenido están vacíos", () => {
    expect(hallazgosDe({ ...conDatos, angulo_que_funciona: "", dolor_cliente: "" })).not.toContain(
      "angulo",
    );
  });

  it("genera el hallazgo de ángulo si lo cargado dice que no lo tienen claro", () => {
    expect(
      hallazgosDe({
        ...conDatos,
        angulo_que_funciona: "No sé, probamos de todo",
        dolor_cliente: "Precio alto",
      }),
    ).toContain("angulo");
  });

  it("fusiona los tres síntomas de estructura de cuenta en un solo hallazgo", () => {
    const r = calcularDiagnostico(conDatos, cfgCarrito);
    const hallazgos = mapearHallazgos(conDatos, r.derivados, r.estados_bloque, r.fugas);
    const ids = hallazgos.map((x) => x.id);
    expect(ids).not.toContain("sobrefragmentacion");
    expect(ids).not.toContain("volumen");
    expect(ids).not.toContain("presupuesto_bajo_piso");
    const estructura = hallazgos.filter((x) => x.id === "estructura_cuenta");
    expect(estructura.length).toBeLessThanOrEqual(1);
    if (estructura[0]) {
      expect(estructura[0].servicio).toBe("Meta Ads");
      expect((estructura[0].contexto ?? []).length).toBeGreaterThan(0);
    }
  });
});

describe("tienda sin inversión publicitaria ni Pixel", () => {
  const cfgSinAds: ConfiguracionCalculo = { ...cfg, recuperacion_carrito_esperada: 0.08 };
  const sinAds: DatosDiagnostico = {
    ...base,
    facturacion_mensual: 9_000_000,
    visitas_mensuales: 50_000,
    facturacion_pixel: null,
    inversion_meta: null,
    inversion_google: null,
    carritos_abandonados: 500,
    recuperacion_carrito: false,
    retargeting_abandono: false,
  };

  it("igual calcula el margen y el breakeven", () => {
    const r = calcularDiagnostico(sinAds, cfgSinAds);
    expect(r.derivados.margen_contribucion).toBeGreaterThan(0);
    expect(r.derivados.breakeven_roas).toBeGreaterThan(1);
  });

  it("deja la medición en sin_datos y no genera el riesgo de medición", () => {
    const r = calcularDiagnostico(sinAds, cfgSinAds);
    expect(r.derivados.delta_medicion).toBeNull();
    expect(r.estados_bloque.medicion).toBe("sin_datos");
    expect(r.fugas.find((f) => f.id === "medicion")).toBeUndefined();
  });

  it("con facturación de Pixel en cero tampoco calcula el delta", () => {
    const r = calcularDiagnostico({ ...sinAds, facturacion_pixel: 0 }, cfgSinAds);
    expect(r.derivados.delta_medicion).toBeNull();
    expect(r.estados_bloque.medicion).toBe("sin_datos");
  });

  it("no lista la fuga por gasto no rentable", () => {
    const r = calcularDiagnostico(sinAds, cfgSinAds);
    expect(r.fugas.find((f) => f.id === "gasto_no_rentable")).toBeUndefined();
  });

  it("sí reporta la oportunidad del funnel web", () => {
    const r = calcularDiagnostico(sinAds, cfgSinAds);
    expect(r.fugas.find((f) => f.id === "funnel_combinado")?.calculable).toBe(true);
  });

  it("con inversión cargada la fuga por gasto no rentable vuelve a evaluarse", () => {
    const r = calcularDiagnostico({ ...sinAds, inversion_meta: 5_000_000 }, cfgSinAds);
    expect(r.fugas.find((f) => f.id === "gasto_no_rentable")).toBeDefined();
  });
});

describe("mapearHallazgos con una tienda sin cuenta publicitaria", () => {
  const cfgSinAds: ConfiguracionCalculo = { ...cfg, recuperacion_carrito_esperada: 0.08 };
  const sinAds: DatosDiagnostico = {
    ...base,
    facturacion_mensual: 9_000_000,
    visitas_mensuales: 50_000,
    facturacion_pixel: null,
    inversion_meta: null,
    inversion_google: null,
    presupuesto_diario: null,
    conjuntos_activos: null,
    carritos_abandonados: 500,
    recuperacion_carrito: false,
    retargeting_abandono: false,
    frecuencia_creativos: "2 por mes",
  };
  const idsDe = (d: DatosDiagnostico) => {
    const r = calcularDiagnostico(d, cfgSinAds);
    return mapearHallazgos(d, r.derivados, r.estados_bloque, r.fugas).map((x) => x.id);
  };

  it("no genera el hallazgo de medición ni el de estructura de cuenta", () => {
    const ids = idsDe(sinAds);
    expect(ids).not.toContain("medicion");
    expect(ids).not.toContain("estructura_cuenta");
  });

  it("no genera el hallazgo de medición aunque el Pixel esté marcado como ausente", () => {
    expect(idsDe({ ...sinAds, tiene_pixel: false, capi_estado: "ausente" })).not.toContain(
      "medicion",
    );
  });

  it("sí genera los hallazgos de funnel y contenido", () => {
    const ids = idsDe(sinAds);
    expect(ids).toContain("funnel_combinado");
    expect(ids).toContain("creativos");
  });

  it("con inversión y conjuntos activos vuelve a generar el de estructura de cuenta", () => {
    expect(
      idsDe({
        ...sinAds,
        inversion_meta: 1_500_000,
        presupuesto_diario: 50_000,
        conjuntos_activos: 12,
      }),
    ).toContain("estructura_cuenta");
  });
});

// ---------------------------------------------------- entrega 2.1 · costo de envío
// El envío se paga por pedido: el componente se divide por el ticket promedio.

describe("componente de envío por pedido", () => {
  const snake = casoSnakeStore;
  const titan = casoTitanWebB1AntesDeCanales;

  it("caso A · Snake Store: componente único de envío y márgenes por producto", () => {
    const r = calcularDiagnostico(snake, cfg);
    expect(r.derivados.componente_envio).toBe(0.0488);
    expect(r.derivados.margenes_producto).toEqual([0.6589, 0.6012, 0.6459]);
    expect(r.derivados.margen_contribucion).toBe(0.6375);
    expect(r.derivados.breakeven_roas).toBe(1.5686);
  });

  it("caso B1 · Titan Web: el envío deja de comerse el precio unitario", () => {
    const r = calcularDiagnostico(titan, cfg);
    expect(r.derivados.componente_envio).toBe(0.36);
    expect(r.derivados.margenes_producto).toEqual([0.0744, 0.0547, 0.0634]);
    expect(r.derivados.margen_contribucion).toBe(0.0642);
    expect(r.derivados.breakeven_roas).toBe(15.585);
  });

  it("envío mayor al ticket: margen negativo pero finito", () => {
    const r = calcularDiagnostico({ ...titan, costo_envio_promedio: 40000 }, cfg);
    for (const m of r.derivados.margenes_producto) {
      if (m !== null) expect(Number.isFinite(m)).toBe(true);
    }
    expect(r.derivados.margen_contribucion!).toBeLessThan(0);
    expect(Number.isFinite(r.derivados.margen_contribucion!)).toBe(true);
    expect(r.derivados.breakeven_roas).toBeNull();
  });

  it("envío en cero: componente cero y margen normal", () => {
    const r = calcularDiagnostico({ ...titan, costo_envio_promedio: 0 }, cfg);
    expect(r.derivados.componente_envio).toBe(0);
    expect(r.derivados.margenes_producto[0]).toBeCloseTo(0.4344, 4);
  });

  it("si el vendedor no absorbe el envío, se ignoran montos viejos y el margen lo excluye", () => {
    const r = calcularDiagnostico(
      {
        ...titan,
        absorbe_costo_envio: false,
        costo_envio_promedio: 9000,
        envio_bruto: 12000,
        envio_cobrado_comprador: 3000,
      },
      cfg,
    );
    expect(r.derivados.envio_neto_vendedor).toBe(0);
    expect(r.derivados.componente_envio).toBe(0);
    expect(r.derivados.margenes_producto[0]).toBeCloseTo(0.4344, 4);
    expect(faltaEnvioCobrado({ ...titan, absorbe_costo_envio: false, envio_bruto: 9000 })).toBe(
      false,
    );
  });

  it("si confirma que absorbe envío pero no carga monto, el margen queda sin calcular", () => {
    const r = calcularDiagnostico(
      {
        ...titan,
        absorbe_costo_envio: true,
        costo_envio_promedio: null,
        envio_bruto: null,
        envio_cobrado_comprador: null,
      },
      cfg,
    );
    expect(r.derivados.envio_neto_vendedor).toBeNull();
    expect(r.derivados.margen_contribucion).toBeNull();
  });

  it("un diagnóstico anterior sin la pregunta nueva conserva el monto legado", () => {
    const legado = { ...titan };
    delete (legado as Record<string, unknown>)["absorbe_costo_envio"];
    expect(envioNetoVendedor(legado)).toBe(9000);
    expect(calcularDiagnostico(legado, cfg).derivados.margen_contribucion).toBe(0.0642);
  });

  it("envío ausente: margen en null y el campo entre los faltantes", () => {
    const r = calcularDiagnostico(
      {
        ...titan,
        costo_envio_promedio: null,
        facturacion_mensual: 10_000_000,
        visitas_mensuales: 40_000,
      },
      cfg,
    );
    expect(r.derivados.componente_envio).toBeNull();
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.fugas.find((f) => f.id === "funnel_combinado")?.faltantes).toContain(
      "envio_neto_vendedor",
    );
  });

  it("sin ticket promedio no usa el precio como respaldo", () => {
    const r = calcularDiagnostico({ ...titan, ticket_promedio: null }, cfg);
    expect(r.derivados.componente_envio).toBeNull();
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.margenes_producto).toEqual([null, null, null]);
  });

  it("un solo producto cargado usa su margen directamente", () => {
    const r = calcularDiagnostico(
      {
        ...titan,
        producto_2_costo: null,
        producto_2_precio: null,
        producto_3_costo: null,
        producto_3_precio: null,
      },
      cfg,
    );
    expect(r.derivados.margen_contribucion).toBe(0.0744);
  });

  it("envío bruto sin importe cobrado: no se calcula el margen", () => {
    const r = calcularDiagnostico({ ...titan, costo_envio_promedio: null, envio_bruto: 9000 }, cfg);
    expect(faltaEnvioCobrado({ ...titan, costo_envio_promedio: null, envio_bruto: 9000 })).toBe(
      true,
    );
    expect(r.derivados.envio_neto_vendedor).toBeNull();
    expect(r.derivados.margen_contribucion).toBeNull();
  });

  it("envío bruto 9.000 con 4.000 cobrado: neto 5.000 y componente 0,2", () => {
    const r = calcularDiagnostico(
      { ...titan, costo_envio_promedio: null, envio_bruto: 9000, envio_cobrado_comprador: 4000 },
      cfg,
    );
    expect(r.derivados.envio_neto_vendedor).toBe(5000);
    expect(r.derivados.componente_envio).toBe(0.2);
  });

  it("el campo legado sigue funcionando como neto en diagnósticos guardados", () => {
    expect(envioNetoVendedor({ ...titan })).toBe(9000);
  });
});

// -------------------------------------- entrega 2.2 · financiación y descuentos

describe("costo de financiación y descuentos", () => {
  /** S1: ticket 50.000, costo 40%, plataforma 1%, pasarela 5%, envío neto 5.000. */
  const s1: DatosDiagnostico = {
    ...DATOS_INICIALES,
    nombre_tienda: "Sintético S1",
    plataforma: "tiendanube",
    plan_plataforma: "esencial",
    pasarela: "mercado_pago",
    ticket_promedio: 50000,
    costo_envio_promedio: 5000,
    base_montos: "bruto",
    producto_1_nombre: "Único",
    producto_1_costo: 20000,
    producto_1_precio: 50000,
  };

  const margenDe = (d: DatosDiagnostico) =>
    calcularDiagnostico(d, cfg).derivados.margen_contribucion;

  it("base sin financiación ni descuento", () => {
    expect(margenDe(s1)).toBe(0.44);
  });

  it("solo financiación: 50% de ventas al 10,75%", () => {
    const r = calcularDiagnostico(
      { ...s1, financiacion_pct_ventas: 50, financiacion_costo_pct: 10.75 },
      cfg,
    );
    expect(r.derivados.costo_financiacion_efectivo).toBe(0.0538);
    expect(r.derivados.costo_descuento_efectivo).toBe(0);
    expect(r.derivados.margen_contribucion).toBe(0.3863);
  });

  it("solo descuento: 30% de ventas al 15%", () => {
    const r = calcularDiagnostico({ ...s1, descuento_pct_ventas: 30, descuento_pct: 15 }, cfg);
    expect(r.derivados.costo_descuento_efectivo).toBe(0.045);
    expect(r.derivados.margen_contribucion).toBe(0.395);
  });

  it("ambos combinados", () => {
    expect(
      margenDe({
        ...s1,
        financiacion_pct_ventas: 50,
        financiacion_costo_pct: 10.75,
        descuento_pct_ventas: 30,
        descuento_pct: 15,
      }),
    ).toBe(0.3413);
  });

  it("ambos combinados con base neto: el descuento no se resta dos veces", () => {
    const r = calcularDiagnostico(
      {
        ...s1,
        base_montos: "neto",
        financiacion_pct_ventas: 50,
        financiacion_costo_pct: 10.75,
        descuento_pct_ventas: 30,
        descuento_pct: 15,
      },
      cfg,
    );
    expect(r.derivados.costo_descuento_efectivo).toBe(0);
    expect(r.derivados.margen_contribucion).toBe(0.3863);
  });

  it("financiación al 100% de las ventas", () => {
    expect(margenDe({ ...s1, financiacion_pct_ventas: 100, financiacion_costo_pct: 10.75 })).toBe(
      0.3325,
    );
  });

  it("costos en cero con participaciones cargadas: margen sin cambios", () => {
    expect(
      margenDe({
        ...s1,
        financiacion_pct_ventas: 50,
        financiacion_costo_pct: 0,
        descuento_pct_ventas: 30,
        descuento_pct: 0,
      }),
    ).toBe(0.44);
  });

  it("participación en cero con costo positivo: componente cero", () => {
    const r = calcularDiagnostico(
      { ...s1, financiacion_pct_ventas: 0, financiacion_costo_pct: 10.75 },
      cfg,
    );
    expect(r.derivados.costo_financiacion_efectivo).toBe(0);
    expect(r.derivados.margen_contribucion).toBe(0.44);
  });

  it("todos los campos ausentes: margen idéntico a la entrega anterior", () => {
    expect(margenDe(s1)).toBe(0.44);
    expect(calcularDiagnostico(s1, cfg).derivados.costo_financiacion_efectivo).toBe(0);
  });

  it("participación cargada sin costo: componente no calculado y campo faltante", () => {
    const d = { ...s1, financiacion_pct_ventas: 50 };
    const r = calcularDiagnostico(d, cfg);
    expect(r.derivados.costo_financiacion_efectivo).toBeNull();
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(faltantesMargen(d)).toContain("financiacion_costo_pct");
  });

  it("costo cargado sin participación: componente no calculado y campo faltante", () => {
    const d = { ...s1, descuento_pct: 15 };
    const r = calcularDiagnostico(d, cfg);
    expect(r.derivados.costo_descuento_efectivo).toBeNull();
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(faltantesMargen(d)).toContain("descuento_pct_ventas");
  });

  it("valores negativos: no se calcula el componente", () => {
    const d = { ...s1, descuento_pct_ventas: -10, descuento_pct: 15 };
    expect(calcularDiagnostico(d, cfg).derivados.margen_contribucion).toBeNull();
    expect(faltantesMargen(d)).toContain("descuento_pct_ventas");
  });

  it("suma de participaciones mayor a 100 con costos superpuestos: advierte pero calcula", () => {
    const d: DatosDiagnostico = {
      ...s1,
      relacion_financiacion_descuento: "superpuestos",
      financiacion_pct_ventas: 80,
      financiacion_costo_pct: 10,
      descuento_pct_ventas: 40,
      descuento_pct: 10,
    };
    expect(participacionesSuperan100(d)).toBe(true);
    expect(calcularDiagnostico(d, cfg).derivados.margen_contribucion).toBe(0.32);
  });

  // ---------------------------------- entrega 2.3a · relación e indicadores netos

  it("excluyentes con suma 120: margen null y ambos campos en faltantes", () => {
    const d: DatosDiagnostico = {
      ...s1,
      relacion_financiacion_descuento: "excluyentes",
      financiacion_pct_ventas: 80,
      financiacion_costo_pct: 10,
      descuento_pct_ventas: 40,
      descuento_pct: 10,
    };
    expect(participacionesIncompatibles(d)).toBe(true);
    expect(calcularDiagnostico(d, cfg).derivados.margen_contribucion).toBeNull();
    expect(faltantesMargen(d)).toContain("financiacion_pct_ventas");
    expect(faltantesMargen(d)).toContain("descuento_pct_ventas");
  });

  it("excluyentes con suma 100: se calcula normal", () => {
    const d: DatosDiagnostico = {
      ...s1,
      relacion_financiacion_descuento: "excluyentes",
      financiacion_pct_ventas: 60,
      financiacion_costo_pct: 10,
      descuento_pct_ventas: 40,
      descuento_pct: 10,
    };
    expect(participacionesIncompatibles(d)).toBe(false);
    // 0,44 - 0,06 - 0,04 = 0,34
    expect(calcularDiagnostico(d, cfg).derivados.margen_contribucion).toBe(0.34);
  });

  const ambos: DatosDiagnostico = {
    ...s1,
    financiacion_pct_ventas: 50,
    financiacion_costo_pct: 10.75,
    descuento_pct_ventas: 30,
    descuento_pct: 15,
  };

  it("netos de descuento: solo se resta financiación", () => {
    const r = calcularDiagnostico(
      { ...ambos, montos_netos_de_descuento: true, montos_netos_de_financiacion: false },
      cfg,
    );
    expect(r.derivados.costo_descuento_efectivo).toBe(0);
    expect(r.derivados.costo_financiacion_efectivo).toBe(0.0538);
    expect(r.derivados.margen_contribucion).toBe(0.3863);
  });

  it("netos de financiación: solo se resta descuento", () => {
    const r = calcularDiagnostico(
      { ...ambos, montos_netos_de_descuento: false, montos_netos_de_financiacion: true },
      cfg,
    );
    expect(r.derivados.costo_financiacion_efectivo).toBe(0);
    expect(r.derivados.costo_descuento_efectivo).toBe(0.045);
    expect(r.derivados.margen_contribucion).toBe(0.395);
  });

  it("los dos en true: no se resta ninguno", () => {
    expect(
      margenDe({ ...ambos, montos_netos_de_descuento: true, montos_netos_de_financiacion: true }),
    ).toBe(0.44);
  });

  it("los dos en false: se restan los dos", () => {
    expect(
      margenDe({ ...ambos, montos_netos_de_descuento: false, montos_netos_de_financiacion: false }),
    ).toBe(0.3413);
  });

  it("diagnóstico viejo con base_montos neto: neto de descuento, bruto de financiación", () => {
    const viejo: DatosDiagnostico = { ...ambos, base_montos: "neto" };
    delete (viejo as Record<string, unknown>)["montos_netos_de_descuento"];
    delete (viejo as Record<string, unknown>)["montos_netos_de_financiacion"];
    expect(montosNetosDeDescuento(viejo)).toBe(true);
    expect(montosNetosDeFinanciacion(viejo)).toBe(false);
    expect(margenDe(viejo)).toBe(0.3863);
  });

  it("los cálculos degenerados no devuelven NaN ni infinito", () => {
    const r = calcularDiagnostico(
      { ...s1, financiacion_pct_ventas: 100, financiacion_costo_pct: 200 },
      cfg,
    );
    expect(Number.isFinite(r.derivados.margen_contribucion!)).toBe(true);
    expect(r.derivados.breakeven_roas).toBeNull();
  });
});

// ---------------------------------------------------- entrega 2.3 · mix de canales
// Cada canal tiene sus propias comisiones. Un mix incompleto no se reescala.

describe("mix de canales y comisiones", () => {
  const ML_BENCHMARK = {
    comision: 0.1694,
    marketplace: "mercado_libre",
    tipo_publicacion: "clasica",
    vigencia_desde: "2026-01-01",
    pais: "AR",
    origen: "benchmark_provisional",
    provisional: true,
  };

  /** Config con la comisión de marketplace, sin cargo fijo. */
  const cfgCanales: ConfiguracionCalculo = {
    ...cfg,
    comision_marketplace: { mercado_libre: ML_BENCHMARK },
  };

  /** Misma config, con el cargo fijo provisional de Mercado Libre. */
  const cfgCargoFijo: ConfiguracionCalculo = {
    ...cfg,
    comision_marketplace: {
      mercado_libre: {
        ...ML_BENCHMARK,
        cargo_fijo: 1095,
        cargo_fijo_hasta: 33000,
        base_aplicacion: "pedido" as const,
        precio_umbral: "ticket_promedio" as const,
        verificado: true,
      },
    },
  };

  const snake = casoSnakeStore;
  const titan = casoTitanWebB1;

  /** S3: un solo producto al 45% de costo, envío 8% del ticket en los dos canales. */
  const s3: DatosDiagnostico = {
    ...DATOS_INICIALES,
    nombre_tienda: "Mix S3",
    plataforma: "tiendanube",
    plan_plataforma: "esencial",
    pasarela: "mercado_pago",
    ticket_promedio: 50000,
    costo_envio_promedio: 4000,
    producto_1_nombre: "Producto único",
    producto_1_costo: 45000,
    producto_1_precio: 100000,
    producto_1_pct_facturacion: 100,
    canal_tienda_pct: 60,
    canal_ml_pct: 40,
  };

  const canalDe = (r: ReturnType<typeof calcularDiagnostico>, id: string) =>
    r.derivados.canales.find((c) => c.id === id)!;

  it("caso A · Snake Store: 100% tienda propia, comisiones de Tiendanube y Mercado Pago", () => {
    const r = calcularDiagnostico(snake, cfgCanales);
    expect(r.derivados.margen_muestra).toBe(0.6375);
    expect(r.derivados.margen_contribucion).toBe(0.6375);
    expect(r.derivados.breakeven_roas).toBe(1.5686);
    expect(r.derivados.canal_principal).toBe("tienda_propia");
    expect(r.derivados.cobertura_canales).toBe(100);
    expect(canalDe(r, "tienda_propia").comision_efectiva).toBe(0.07);
  });

  it("caso B1 · Titan Web: 100% Mercado Libre, sin comisiones de tienda propia", () => {
    const r = calcularDiagnostico(titan, cfgCanales);
    const ml = canalDe(r, "mercado_libre");
    expect(ml.comision_efectiva).toBe(0.1694);
    expect(ml.componente_envio).toBe(0.36);
    expect(ml.margenes_producto).toEqual([-0.035, -0.0547, -0.046]);
    expect(r.derivados.margen_muestra).toBe(-0.0452);
    expect(r.derivados.margen_contribucion).toBe(-0.0452);
    expect(r.derivados.canal_principal).toBe("mercado_libre");
    expect(r.derivados.comision_plataforma).toBeNull();
    expect(r.derivados.comision_pasarela).toBeNull();
    expect(canalDe(r, "tienda_propia").estado).toBe("no_aplica");
  });

  it("S3 · mix 60/40: cada canal con su margen y el total ponderado", () => {
    const r = calcularDiagnostico(s3, cfgCanales);
    expect(canalDe(r, "tienda_propia").margen).toBe(0.41);
    expect(canalDe(r, "mercado_libre").margen).toBe(0.3006);
    expect(r.derivados.margen_contribucion).toBe(0.3662);
    expect(r.derivados.margen_muestra).toBe(0.3662);
    expect(r.derivados.cobertura_canales).toBe(100);
    expect(r.derivados.canal_principal).toBe("tienda_propia");
  });

  it("mix incompleto 60/30: cobertura 90, margen de la muestra y total sin datos", () => {
    const r = calcularDiagnostico({ ...s3, canal_ml_pct: 30 }, cfgCanales);
    expect(r.derivados.cobertura_canales).toBe(90);
    expect(r.derivados.margen_muestra).toBe(0.3735);
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.estados_bloque.economia).toBe("sin_datos");
  });

  it("mix incompleto: el funnel muestra estructura pero no monetiza con el margen de la muestra", () => {
    const r = calcularDiagnostico(
      {
        ...s3,
        canal_ml_pct: 30,
        facturacion_mensual: 9_000_000,
        visitas_mensuales: 50_000,
        agregados_carrito: 5_000,
        checkouts_iniciados: 1_000,
      },
      cfgCanales,
    );

    expect(r.derivados.margen_muestra).toBe(0.3735);
    expect(r.derivados.margen_contribucion).toBeNull();

    const tramos = ["funnel_navegacion", "funnel_carrito", "funnel_checkout"];
    for (const id of tramos) {
      const f = r.fugas.find((x) => x.id === id);
      expect(f, id).toBeDefined();
      expect(f!.monto).toBeNull();
      expect(f!.calculable).toBe(false);
      expect(f!.faltantes).toContain("margen_contribucion");
    }

    // El volumen y la estructura del funnel sí se calculan.
    const fn = r.derivados.funnel;
    expect(fn.estado).toBe("calculado");
    expect(fn.desglosado).toBe(true);
    expect(fn.visitas).toBe(50_000);
    expect(fn.agregados_carrito).toBe(5_000);
    expect(fn.checkouts_iniciados).toBe(1_000);
    expect(fn.compras).toBe(180);
    expect(fn.p_carrito_dado_visita).toBeCloseTo(0.1, 4);
    expect(fn.p_checkout_dado_carrito).toBeCloseTo(0.2, 4);
    expect(fn.p_compra_dado_checkout).toBeCloseTo(0.18, 4);
  });

  it("suma mayor a 100: se bloquea el cálculo y los campos entran en faltantes", () => {
    const datos = { ...s3, canal_tienda_pct: 60, canal_ml_pct: 60 };
    const r = calcularDiagnostico(datos, cfgCanales);
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.margen_muestra).toBeNull();
    expect(faltantesMargen(datos)).toContain("canal_tienda_pct");
    expect(faltantesMargen(datos)).toContain("canal_ml_pct");
    expect(canalesSuperan100(datos)).toBe(true);
  });

  it("los dos canales en 0%: existen, no facturan y no hay margen que ponderar", () => {
    const r = calcularDiagnostico({ ...s3, canal_tienda_pct: 0, canal_ml_pct: 0 }, cfgCanales);
    expect(r.derivados.cobertura_canales).toBe(0);
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.canal_principal).toBeNull();
  });

  it("un canal en no_aplica no baja la cobertura", () => {
    const r = calcularDiagnostico(
      { ...s3, canal_tienda_pct: 100, canal_ml_pct: null, canal_ml_no_aplica: true },
      cfgCanales,
    );
    expect(r.derivados.cobertura_canales).toBe(100);
    expect(canalDe(r, "mercado_libre").estado).toBe("no_aplica");
    expect(r.derivados.margen_contribucion).toBe(0.41);
  });

  it("canal ausente: no sabemos si vende ahí y la cobertura baja", () => {
    const r = calcularDiagnostico({ ...s3, canal_ml_pct: null }, cfgCanales);
    expect(canalDe(r, "mercado_libre").estado).toBe("ausente");
    expect(r.derivados.cobertura_canales).toBe(60);
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.margen_muestra).toBe(0.41);
  });

  it("sin fila en configuración: se usa el valor por defecto del código", () => {
    const r = calcularDiagnostico(titan, cfg);
    const ml = canalDe(r, "mercado_libre");
    expect(ml.comision_efectiva).toBe(0.1694);
    expect(ml.comision_provisional).toBe(true);
    expect(ml.faltantes).not.toContain("comision_marketplace");
    // El cargo fijo por defecto no está verificado: se informa pero no se aplica.
    expect(ml.cargo_fijo_aplicado).toBe(false);
    expect(ml.cargo_fijo_disponible?.valor).toBe(1095);
    expect(ml.cargo_fijo_disponible?.verificado).toBe(false);
    expect(ml.cargo_fijo_disponible?.fuente).toBe("benchmark_provisional_pendiente_liquidacion");
    expect(r.derivados.margen_muestra).toBe(-0.0452);
  });

  it("cargo fijo: aplica por debajo del umbral y no aplica por encima", () => {
    const bajo = calcularDiagnostico({ ...titan, canal_ml_ticket: 20000 }, cfgCargoFijo);
    expect(canalDe(bajo, "mercado_libre").comision_efectiva).toBe(0.2242);
    expect(canalDe(bajo, "mercado_libre").cargo_fijo_aplicado).toBe(true);
    const alto = calcularDiagnostico({ ...titan, canal_ml_ticket: 40000 }, cfgCargoFijo);
    expect(canalDe(alto, "mercado_libre").comision_efectiva).toBe(0.1694);
    expect(canalDe(alto, "mercado_libre").cargo_fijo_aplicado).toBe(false);
  });

  it("empate exacto 50/50: el canal principal queda en null", () => {
    const r = calcularDiagnostico({ ...s3, canal_tienda_pct: 50, canal_ml_pct: 50 }, cfgCanales);
    expect(r.derivados.canal_principal).toBeNull();
    expect(r.derivados.cobertura_canales).toBe(100);
  });

  it("la comisión verificada con el cliente le gana al benchmark", () => {
    const r = calcularDiagnostico({ ...titan, canal_ml_comision_pct: 12 }, cfgCanales);
    const ml = canalDe(r, "mercado_libre");
    expect(ml.comision_efectiva).toBe(0.12);
    expect(ml.comision_origen).toBe("verificado_cliente");
    expect(canalDe(calcularDiagnostico(titan, cfgCanales), "mercado_libre").comision_origen).toBe(
      "benchmark_provisional",
    );
  });

  it("diagnóstico viejo con ml_pct_facturacion en 100: el mix es de Mercado Libre", () => {
    const viejo = {
      ...titan,
      canal_ml_pct: null,
      canal_tienda_no_aplica: false,
      ml_pct_facturacion: 100,
    };
    const r = calcularDiagnostico(viejo, cfgCanales);
    expect(r.derivados.canal_principal).toBe("mercado_libre");
    expect(r.derivados.cobertura_canales).toBe(100);
    expect(canalDe(r, "tienda_propia").estado).toBe("ausente");
  });

  it("diagnóstico viejo con ml_pct_facturacion parcial: el resto queda sin declarar", () => {
    const viejo = {
      ...titan,
      canal_ml_pct: null,
      canal_tienda_no_aplica: false,
      ml_pct_facturacion: 40,
    };
    const r = calcularDiagnostico(viejo, cfgCanales);
    expect(r.derivados.cobertura_canales).toBe(40);
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(canalDe(r, "tienda_propia").estado).toBe("ausente");
  });

  it("diagnóstico viejo sin ningún porcentaje: cobertura cero y cálculo de canal único", () => {
    const viejo = { ...titan, canal_ml_pct: null, canal_tienda_no_aplica: false };
    const r = calcularDiagnostico(viejo, cfgCanales);
    expect(r.derivados.cobertura_canales).toBe(0);
    expect(r.derivados.canal_principal).toBeNull();
    expect(canalDe(r, "tienda_propia").estado).toBe("ausente");
    expect(canalDe(r, "mercado_libre").estado).toBe("ausente");
    // Se conserva el cálculo previo a la entrega 2.3: tienda propia con datos compartidos.
    expect(r.derivados.margen_contribucion).toBe(0.0642);
  });

  it("sin contaminación: el funnel y las comisiones de tienda no tocan al marketplace", () => {
    const r = calcularDiagnostico(titan, cfgCanales);
    const ml = canalDe(r, "mercado_libre");
    const tienda = canalDe(r, "tienda_propia");
    expect(ml.comision_efectiva).not.toBe(tienda.comision_efectiva);
    expect(ml.margen).not.toBe(tienda.margen);
  });
});

// ---------------------------------------------------- entrega 2.3 · cargo fijo y escala
// El cargo fijo de Mercado Libre es una regla no verificada: hasta que alguien
// la confirme contra una liquidación real, se informa pero no se cobra.

describe("cargo fijo del marketplace y escala de la comisión verificada", () => {
  const base: DatosDiagnostico = {
    ...DATOS_INICIALES,
    nombre_tienda: "Titan Web",
    plataforma: "tiendanube",
    plan_plataforma: "esencial",
    pasarela: "mercado_pago",
    ticket_promedio: 25000,
    costo_envio_promedio: 9000,
    producto_1_nombre: "Bolsa tostado",
    producto_1_costo: 5890,
    producto_1_precio: 11650,
    producto_1_pct_facturacion: 20,
    producto_2_nombre: "Molde pan lactal",
    producto_2_costo: 17330,
    producto_2_precio: 32990,
    producto_2_pct_facturacion: 20,
    producto_3_nombre: "Cintura extensible",
    producto_3_costo: 15700,
    producto_3_precio: 30390,
    producto_3_pct_facturacion: 20,
    canal_ml_pct: 100,
    canal_tienda_no_aplica: true,
  };

  const ml = (r: ReturnType<typeof calcularDiagnostico>) =>
    r.derivados.canales.find((c) => c.id === "mercado_libre")!;

  const conRegla = (regla: Record<string, unknown>): ConfiguracionCalculo => ({
    ...cfg,
    comision_marketplace: {
      mercado_libre: {
        comision: 0.1694,
        origen: "benchmark_provisional",
        provisional: true,
        ...regla,
      },
    } as NonNullable<ConfiguracionCalculo["comision_marketplace"]>,
  });

  it("el valor por defecto del código no necesita fila en configuración", () => {
    expect(COMISIONES_MARKETPLACE_DEFECTO["mercado_libre"]?.comision).toBe(0.1694);
    expect(COMISIONES_MARKETPLACE_DEFECTO["mercado_libre"]?.verificado).toBe(false);
    expect(COMISIONES_MARKETPLACE_DEFECTO["mercado_libre"]?.cargo_fijo).toBe(1095);
  });

  it("cargo fijo con verificado en false: no se aplica y la comisión queda en 0,1694", () => {
    const r = calcularDiagnostico(
      base,
      conRegla({ cargo_fijo: 1095, cargo_fijo_hasta: 33000, verificado: false }),
    );
    expect(ml(r).comision_efectiva).toBe(0.1694);
    expect(ml(r).cargo_fijo_aplicado).toBe(false);
    expect(ml(r).cargo_fijo_disponible?.valor).toBe(1095);
    expect(ml(r).comisiones_producto).toEqual([0.1694, 0.1694, 0.1694]);
    expect(r.derivados.margen_muestra).toBe(-0.0452);
  });

  it("cargo fijo verificado con base pedido: se aplica sobre el ticket del canal", () => {
    const r = calcularDiagnostico(
      { ...base, canal_ml_ticket: 20000 },
      conRegla({
        cargo_fijo: 1095,
        cargo_fijo_hasta: 33000,
        base_aplicacion: "pedido",
        precio_umbral: "ticket_promedio",
        verificado: true,
      }),
    );
    // 0,1694 + 1095/20000 = 0,22415 -> 0,2242
    expect(ml(r).comision_efectiva).toBe(0.2242);
    expect(ml(r).cargo_fijo_aplicado).toBe(true);
    expect(ml(r).comisiones_producto).toEqual([0.2242, 0.2242, 0.2242]);
  });

  it("cargo fijo verificado con base unidad: se aplica sobre el precio de cada producto", () => {
    const r = calcularDiagnostico(
      base,
      conRegla({
        cargo_fijo: 1095,
        cargo_fijo_hasta: 40000,
        base_aplicacion: "unidad",
        precio_umbral: "precio_producto",
        verificado: true,
      }),
    );
    // 0,1694 + 1095/precio, distinto en cada producto
    expect(ml(r).comisiones_producto).toEqual([0.2634, 0.2026, 0.2054]);
  });

  it("productos a los dos lados del umbral con base precio_producto: uno con cargo y otro sin", () => {
    const r = calcularDiagnostico(
      base,
      conRegla({
        cargo_fijo: 1095,
        cargo_fijo_hasta: 20000,
        base_aplicacion: "pedido",
        precio_umbral: "precio_producto",
        verificado: true,
      }),
    );
    const [p1, p2, p3] = ml(r).comisiones_producto;
    // Sólo el producto de 11.650 queda por debajo del umbral de 20.000.
    expect(p1).toBe(0.2132);
    expect(p2).toBe(0.1694);
    expect(p3).toBe(0.1694);
  });

  it("cargo por publicación: nunca entra en la comisión por venta", () => {
    const r = calcularDiagnostico(
      base,
      conRegla({ cargo_fijo: 1095, base_aplicacion: "publicacion", verificado: true }),
    );
    expect(ml(r).comision_efectiva).toBe(0.1694);
    expect(ml(r).cargo_fijo_aplicado).toBe(false);
  });

  it("la comisión verificada se carga en porcentaje: 16,94 da la tasa 0,1694", () => {
    const r = calcularDiagnostico({ ...base, canal_ml_comision_pct: 16.94 }, cfg);
    expect(ml(r).comision_efectiva).toBe(0.1694);
    expect(ml(r).comision_origen).toBe("verificado_cliente");
    expect(ml(r).comision_escala_sospechosa).toBe(false);
  });

  it("comisión cargada como 0,1694 en el campo: se advierte el error de escala", () => {
    const r = calcularDiagnostico({ ...base, canal_ml_comision_pct: 0.1694 }, cfg);
    expect(ml(r).comision_escala_sospechosa).toBe(true);
    expect(comisionEnEscalaSospechosa(0.1694)).toBe(true);
    expect(comisionEnEscalaSospechosa(16.94)).toBe(false);
    expect(comisionEnEscalaSospechosa(0)).toBe(false);
    expect(comisionEnEscalaSospechosa(null)).toBe(false);
  });

  it("la comisión verificada le gana al valor por defecto del código", () => {
    const r = calcularDiagnostico({ ...base, canal_ml_comision_pct: 12 }, cfg);
    expect(ml(r).comision_efectiva).toBe(0.12);
    expect(ml(r).comision_origen).toBe("verificado_cliente");
    expect(ml(r).comision_provisional).toBe(false);
  });

  it("diagnóstico viejo sin campos de canal: abre sin error y los canales quedan ausentes", () => {
    const viejo = { ...base } as Record<string, unknown>;
    for (const k of Object.keys(viejo)) if (k.startsWith("canal_")) delete viejo[k];
    const r = calcularDiagnostico(viejo as DatosDiagnostico, cfg);
    expect(r.derivados.cobertura_canales).toBe(0);
    expect(r.derivados.canal_principal).toBeNull();
    for (const c of r.derivados.canales) expect(c.estado).toBe("ausente");
  });

  it("guardado y reapertura: los campos de canal sobreviven el ciclo completo", () => {
    const cargado: DatosDiagnostico = {
      ...base,
      canal_tienda_no_aplica: false,
      canal_tienda_pct: 60,
      canal_tienda_facturacion: 6_000_000,
      canal_tienda_ticket: 30000,
      canal_tienda_comision_pct: 7,
      canal_tienda_envio_neto: 2000,
      canal_tienda_inversion: 500000,
      canal_ml_pct: 40,
      canal_ml_ticket: 25000,
      canal_ml_comision_pct: 16.94,
      canal_ml_tipo_publicacion: "clasica",
    };
    const reabierto = JSON.parse(JSON.stringify(cargado)) as DatosDiagnostico;
    expect(reabierto.canal_tienda_pct).toBe(60);
    expect(reabierto.canal_ml_comision_pct).toBe(16.94);
    expect(reabierto.canal_ml_tipo_publicacion).toBe("clasica");
    const antes = calcularDiagnostico(cargado, cfg);
    const despues = calcularDiagnostico(reabierto, cfg);
    expect(despues.derivados).toEqual(antes.derivados);
    expect(despues.derivados.cobertura_canales).toBe(100);
  });

  it("el detalle recibe origen, marca de provisional y cobertura de la muestra", () => {
    const r = calcularDiagnostico({ ...base, canal_ml_pct: 70 }, cfg);
    expect(r.derivados.cobertura_canales).toBe(70);
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.margen_muestra).toBe(-0.0452);
    expect(ml(r).comision_origen).toBe("benchmark_provisional");
    expect(ml(r).comision_provisional).toBe(true);
    expect(r.derivados.canal_principal).toBe("mercado_libre");
  });
});

describe("impactos económicos: ahorro publicitario tipado", () => {
  const conAdsRentables: DatosDiagnostico = {
    ...base,
    facturacion_mensual: 9_000_000,
    inversion_meta: 5_000_000,
    conjuntos_activos: 20,
    presupuesto_diario: 1_000,
  };

  it("gasto_no_rentable y sobrefragmentación cargan un impacto ahorro_publicitario calculable", () => {
    const r = calcularDiagnostico(conAdsRentables, cfg);
    const gasto = r.fugas.find((f) => f.id === "gasto_no_rentable")!;
    const sobre = r.fugas.find((f) => f.id === "sobrefragmentacion")!;
    expect(gasto.calculable).toBe(true);
    expect(sobre.calculable).toBe(true);

    for (const fuga of [gasto, sobre]) {
      expect(fuga.impactos).toHaveLength(1);
      const impacto = fuga.impactos![0]!;
      expect(impacto.tipo).toBe("ahorro_publicitario");
      expect(impacto.confianza).toBe("alta");
      // El impacto tipado nunca diverge del monto legado, incluso topeado.
      expect(impacto.montoMensual).toBe(fuga.monto);
      // Nunca supera la inversión publicitaria elegible del mismo perímetro.
      expect(impacto.montoMensual as number).toBeLessThanOrEqual(
        r.derivados.inversion_publicitaria_total as number,
      );
    }
  });

  it("cuando no son calculables, el impacto queda retenido (nunca 0 ni el monto legado reinterpretado)", () => {
    const r = calcularDiagnostico(
      { ...base, producto_1_costo: null, producto_1_precio: null, inversion_meta: 1_000_000 },
      cfg,
    );
    const gasto = r.fugas.find((f) => f.id === "gasto_no_rentable")!;
    expect(gasto.calculable).toBe(false);
    expect(gasto.impactos).toHaveLength(1);
    expect(gasto.impactos![0]!.confianza).toBe("retenida");
    expect(gasto.impactos![0]!.montoMensual).toBeNull();
    expect(gasto.impactos![0]!.motivoRetencion).toBeTruthy();
  });

  it("el ahorro tipado nunca supera la inversión elegible, aunque el tope legado (25% de facturación) lo permita", () => {
    const r = calcularDiagnostico(real, cfgReal);
    const sobre = r.fugas.find((f) => f.id === "sobrefragmentacion")!;
    expect(sobre.sospechosa).toBe(true);
    expect(sobre.impactos).toHaveLength(1);

    const inversionElegible = r.derivados.inversion_publicitaria_total as number;
    // El tope legado (25% de facturación) es más laxo que la inversión
    // publicitaria elegible en este caso real: por eso hace falta el tope
    // adicional del modelo tipado.
    expect(sobre.monto as number).toBeGreaterThan(inversionElegible);
    expect(sobre.impactos![0]!.montoMensual).toBe(inversionElegible);
    expect(sobre.impactos![0]!.montoMensual as number).toBeLessThanOrEqual(inversionElegible);
  });
});

describe("impactos económicos: retención por margen bloqueado", () => {
  const casoConFunnelYAds: DatosDiagnostico = {
    ...casoSnakeStore,
    facturacion_mensual: 22_522_600,
    visitas_mensuales: 5_000,
    agregados_carrito: 1_000,
    checkouts_iniciados: 300,
    margen_declarado_min: 90,
    margen_declarado_max: 90,
    margen_declarado_confirmado: true,
  };

  it("margen bloqueado retiene contribución incremental pero NO facturación incremental", () => {
    const r = calcularDiagnostico(casoConFunnelYAds, cfg);
    expect(r.margen_bloqueado).toBe(true);

    const tramosFunnelIds = ["funnel_navegacion", "funnel_carrito", "funnel_checkout"];
    const fugasFunnel = r.fugas.filter((f) => tramosFunnelIds.includes(f.id));
    expect(fugasFunnel.length).toBeGreaterThan(0);

    for (const fuga of fugasFunnel) {
      const facturacion = fuga.impactos!.find((i) => i.tipo === "facturacion_incremental")!;
      const contribucion = fuga.impactos!.find((i) => i.tipo === "contribucion_incremental")!;
      // Facturación incremental no depende de margen: sigue publicada.
      expect(facturacion.confianza).not.toBe("retenida");
      expect(facturacion.montoMensual).toBeGreaterThan(0);
      // Contribución sí depende de margen: queda retenida.
      expect(contribucion.confianza).toBe("retenida");
      expect(contribucion.montoMensual).toBeNull();
      expect(contribucion.motivoRetencion).toMatch(/contradice/);
      // El monto legado (contribución) sigue null, sin cambiar el comportamiento previo.
      expect(fuga.monto).toBeNull();
      expect(fuga.calculable).toBe(false);
    }
  });
});
