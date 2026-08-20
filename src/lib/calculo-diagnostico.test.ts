import { describe, expect, it } from "vitest";
import {
  calcularDiagnostico,
  envioNetoVendedor,
  faltaEnvioCobrado,
  lecturaPresupuesto,
  type ConfiguracionCalculo,
} from "./calculo-diagnostico";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
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
      if (k === "margenes_producto" || k === "pesos_producto") continue;
      if (v !== null) expect(Number.isFinite(v as number)).toBe(true);
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
    const conversion = r.fugas.find((f) => f.id === "conversion")!;
    const sobre = r.fugas.find((f) => f.id === "sobrefragmentacion")!;

    expect(sobre.sospechosa).toBe(true);
    expect(sobre.monto!).toBeLessThanOrEqual(33_108_279 * 0.25);
    expect(sobre.detalle).toMatch(/rango razonable/);

    expect(conversion.sospechosa).toBe(true);
    expect(conversion.monto!).toBeLessThanOrEqual(33_108_279 * 0.25);

    expect(r.oportunidad_total).toBeLessThanOrEqual(Math.round(33_108_279 * 0.4));
    expect(r.oportunidad_total).toBeLessThan(33_108_279);
  });

  it("con el umbral fijo de respaldo la fuga por conversión queda topeada al 25%", () => {
    const sinTramos: ConfiguracionCalculo = { ...cfgReal };
    delete sinTramos.umbrales_cr_por_ticket;
    const r = calcularDiagnostico(real, sinTramos);
    const conversion = r.fugas.find((f) => f.id === "conversion")!;
    expect(conversion.sospechosa).toBe(true);
    expect(conversion.monto!).toBeLessThanOrEqual(33_108_279 * 0.25);
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

describe("fuga por carritos abandonados", () => {
  const cfgCarrito: ConfiguracionCalculo = { ...cfg, recuperacion_carrito_esperada: 0.08 };
  // Los dos booleanos vienen respondidos: sin respuesta la fuga no se calcula.
  const conCarritos: DatosDiagnostico = {
    ...base,
    facturacion_mensual: 10_000_000,
    carritos_abandonados: 500,
    recuperacion_carrito: false,
    retargeting_abandono: false,
  };
  const fugaDe = (d: DatosDiagnostico) =>
    calcularDiagnostico(d, cfgCarrito).fugas.find((f) => f.id === "carritos_abandonados");

  it("no hay fuga si ya tiene recuperación y retargeting", () => {
    expect(
      fugaDe({ ...conCarritos, recuperacion_carrito: true, retargeting_abandono: true }),
    ).toBeUndefined();
  });

  it("sin recuperación ni retargeting usa el porcentaje completo", () => {
    const r = calcularDiagnostico(conCarritos, cfgCarrito);
    const f = r.fugas.find((x) => x.id === "carritos_abandonados")!;
    const margen = r.derivados.margen_contribucion!;
    expect(f.calculable).toBe(true);
    expect(Math.abs(f.monto! - 500 * 0.08 * 45_000 * margen)).toBeLessThan(200);
  });

  it("con una sola de las dos activas usa la mitad del porcentaje", () => {
    const completa = fugaDe(conCarritos)!.monto!;
    const mitad = fugaDe({ ...conCarritos, recuperacion_carrito: true })!.monto!;
    expect(mitad).toBeGreaterThan(0);
    expect(Math.abs(mitad - completa / 2)).toBeLessThanOrEqual(1);
  });

  it("sin el dato de carritos queda como no calculable", () => {
    const f = fugaDe({ ...conCarritos, carritos_abandonados: null })!;
    expect(f.calculable).toBe(false);
    expect(f.faltantes).toContain("carritos_abandonados");
  });

  it("si un booleano quedó sin responder la fuga no se calcula", () => {
    const f = fugaDe({ ...conCarritos, retargeting_abandono: null })!;
    expect(f.calculable).toBe(false);
    expect(f.faltantes).toContain("retargeting_abandono");
    expect(f.monto).toBeNull();
  });

  it("con los dos booleanos sin responder lista ambos como faltantes", () => {
    const f = fugaDe({
      ...conCarritos,
      recuperacion_carrito: null,
      retargeting_abandono: null,
    })!;
    expect(f.calculable).toBe(false);
    expect(f.faltantes).toEqual(["recuperacion_carrito", "retargeting_abandono"]);
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

  it("no genera el hallazgo de ángulo si los dos campos de contenido están vacíos", () => {
    expect(hallazgosDe({ ...conDatos, angulo_que_funciona: "", dolor_cliente: "" })).not.toContain(
      "angulo",
    );
  });

  it("genera el hallazgo de ángulo si lo cargado dice que no lo tienen claro", () => {
    expect(
      hallazgosDe({ ...conDatos, angulo_que_funciona: "No sé, probamos de todo", dolor_cliente: "Precio alto" }),
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

  it("sí reporta las fugas de conversión y carritos abandonados", () => {
    const r = calcularDiagnostico(sinAds, cfgSinAds);
    expect(r.fugas.find((f) => f.id === "conversion")?.calculable).toBe(true);
    expect(r.fugas.find((f) => f.id === "carritos_abandonados")?.calculable).toBe(true);
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

  it("sí genera los hallazgos de conversión, carritos y contenido", () => {
    const ids = idsDe(sinAds);
    expect(ids).toContain("conversion");
    expect(ids).toContain("carritos_abandonados");
    expect(ids).toContain("creativos");
  });

  it("con inversión y conjuntos activos vuelve a generar el de estructura de cuenta", () => {
    expect(
      idsDe({ ...sinAds, inversion_meta: 1_500_000, presupuesto_diario: 50_000, conjuntos_activos: 12 }),
    ).toContain("estructura_cuenta");
  });
});

// ---------------------------------------------------- entrega 2.1 · costo de envío
// El envío se paga por pedido: el componente se divide por el ticket promedio.

describe("componente de envío por pedido", () => {
  const snake: DatosDiagnostico = {
    ...DATOS_INICIALES,
    nombre_tienda: "Snake Store",
    plataforma: "tiendanube",
    plan_plataforma: "inicial",
    pasarela: "mercado_pago",
    ticket_promedio: 225226,
    costo_envio_promedio: 11000,
    producto_1_nombre: "Campera Puffer",
    producto_1_costo: 40000,
    producto_1_precio: 180000,
    producto_2_nombre: "Chaleco Tiffany",
    producto_2_costo: 35000,
    producto_2_precio: 125000,
    producto_3_nombre: "Calza Street",
    producto_3_costo: 20000,
    producto_3_precio: 85000,
  };

  const titan: DatosDiagnostico = {
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
    producto_2_nombre: "Molde pan lactal",
    producto_2_costo: 17330,
    producto_2_precio: 32990,
    producto_3_nombre: "Cintura extensible",
    producto_3_costo: 15700,
    producto_3_precio: 30390,
  };

  it("caso A · Snake Store: componente único de envío y márgenes por producto", () => {
    const r = calcularDiagnostico(snake, cfg);
    expect(r.derivados.componente_envio).toBe(0.0488);
    expect(r.derivados.margenes_producto).toEqual([0.6589, 0.6012, 0.6459]);
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

  it("envío ausente: margen en null y el campo entre los faltantes", () => {
    const r = calcularDiagnostico(
      { ...titan, costo_envio_promedio: null, facturacion_mensual: 10_000_000 },
      cfg,
    );
    expect(r.derivados.componente_envio).toBeNull();
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.fugas.find((f) => f.id === "conversion")?.faltantes).toContain("envio_neto_vendedor");
  });

  it("sin ticket promedio no usa el precio como respaldo", () => {
    const r = calcularDiagnostico({ ...titan, ticket_promedio: null }, cfg);
    expect(r.derivados.componente_envio).toBeNull();
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.margenes_producto).toEqual([null, null, null]);
  });

  it("un solo producto cargado usa su margen directamente", () => {
    const r = calcularDiagnostico(
      { ...titan, producto_2_costo: null, producto_2_precio: null, producto_3_costo: null, producto_3_precio: null },
      cfg,
    );
    expect(r.derivados.margen_contribucion).toBe(0.0744);
  });

  it("envío bruto sin importe cobrado: no se calcula el margen", () => {
    const r = calcularDiagnostico(
      { ...titan, costo_envio_promedio: null, envio_bruto: 9000 },
      cfg,
    );
    expect(faltaEnvioCobrado({ ...titan, costo_envio_promedio: null, envio_bruto: 9000 })).toBe(true);
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
