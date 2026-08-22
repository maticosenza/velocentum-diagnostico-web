/**
 * Fase 9 (mayorista y mixto, decisión comercial 6, 2026-08-22): mayorista
 * como canal combinable, mismo catálogo de seis servicios aplicado a otro
 * objetivo. Piso de precio cost-plus con componentes nombrados, cartera
 * actual vs. escenario de activación siempre separados, anti-canibalización.
 */
import { describe, expect, it } from "vitest";
import { calcularDiagnostico, type ConfiguracionCalculo } from "./calculo-diagnostico";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
import { mapearHallazgos } from "./propuesta";
import { evaluarMayorista, modalidadComercial, type ConfigMayorista } from "./mayorista";

const cfgBase: ConfiguracionCalculo = {
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
  producto_1_nombre: "Producto principal",
  producto_1_costo: 20250,
  producto_1_precio: 45000,
  producto_1_pct_facturacion: 100,
};

/** Datos completos de piso de precio, cartera, capacidad y CAC — números redondos a propósito. */
const datosCompletos: Partial<DatosDiagnostico> = {
  venta_mayorista_activa: true,
  mayorista_costo_producto: 1000,
  mayorista_costo_logistica_b2b: 200,
  mayorista_comision_comercial: 150,
  mayorista_costo_financiacion: 50,
  mayorista_impuestos_cobranza: 100,
  mayorista_margen_objetivo_pct: 25,
  mayorista_precio_venta_real: 2500,
  mayorista_precio_minorista_referencia: 3000,
  mayorista_pedido_minimo_unidades: 10,
  mayorista_ticket_recompra: 25000,
  mayorista_cuentas_activas: 20,
  mayorista_frecuencia_recompra_dias: 30,
  mayorista_objetivo_facturacion_mensual: 750000,
  mayorista_capacidad_maxima_unidades_mes: 200,
  mayorista_cac_por_cuenta: 15000,
};

describe("modalidadComercial (canal combinable, fase 9)", () => {
  it("sin ningún dato cargado, es minorista (compatibilidad con diagnósticos existentes)", () => {
    expect(modalidadComercial(base)).toBe("minorista");
  });

  it("mayorista activo sin declarar minorista inactivo, es mixto", () => {
    expect(modalidadComercial({ ...base, venta_mayorista_activa: true })).toBe("mixto");
  });

  it("mayorista activo y minorista explícitamente inactivo, es mayorista puro", () => {
    expect(
      modalidadComercial({ ...base, venta_mayorista_activa: true, venta_minorista_activa: false }),
    ).toBe("mayorista");
  });

  it("mayorista explícitamente inactivo, sigue siendo minorista", () => {
    expect(modalidadComercial({ ...base, venta_mayorista_activa: false })).toBe("minorista");
  });
});

describe("evaluarMayorista: activación del bloque", () => {
  it("sin venta_mayorista_activa, el bloque entero no existe (null, no 'sin datos')", () => {
    expect(evaluarMayorista(base, {})).toBeNull();
    expect(evaluarMayorista({ ...base, venta_mayorista_activa: false }, {})).toBeNull();
  });

  it("con venta_mayorista_activa, el bloque existe aunque no tenga ningún otro dato", () => {
    const m = evaluarMayorista({ ...base, venta_mayorista_activa: true }, {});
    expect(m).not.toBeNull();
    expect(m!.activo).toBe(true);
  });
});

describe("piso de precio: costos variables mayoristas y precio mínimo", () => {
  it("con los cinco componentes, suma los costos variables unitarios", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    expect(m!.costos_variables_unitarios.valor).toBe(1500);
    expect(m!.costos_variables_unitarios.faltantes).toEqual([]);
  });

  it("falta uno de los cinco componentes: retiene el cálculo entero y lo nombra en faltantes", () => {
    const { mayorista_costo_financiacion: _omitido, ...sinFinanciacion } = datosCompletos;
    const m = evaluarMayorista({ ...base, ...sinFinanciacion } as DatosDiagnostico, {});
    expect(m!.costos_variables_unitarios.valor).toBeNull();
    expect(m!.costos_variables_unitarios.faltantes).toEqual(["mayorista_costo_financiacion"]);
  });

  it("precio mínimo = costos variables / (1 - margen objetivo)", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    // 1500 / (1 - 0.25) = 2000
    expect(m!.precio_minimo.valor).toBe(2000);
  });

  it("sin margen objetivo, el piso de precio queda retenido", () => {
    const { mayorista_margen_objetivo_pct: _omitido, ...sinMargen } = datosCompletos;
    const m = evaluarMayorista({ ...base, ...sinMargen } as DatosDiagnostico, {});
    expect(m!.precio_minimo.valor).toBeNull();
    expect(m!.precio_minimo.faltantes).toContain("mayorista_margen_objetivo_pct");
  });

  it("descuento máximo viable = 1 - (precio mínimo / precio minorista)", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    // 1 - 2000/3000 = 0.3333...
    expect(m!.descuento_maximo_viable.valor).toBeCloseTo(0.3333, 3);
  });

  it("margen de contribución real usa el precio efectivamente cobrado, no el objetivo", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    // (2500 - 1500) / 2500 = 0.4
    expect(m!.margen_contribucion.valor).toBe(0.4);
  });
});

describe("pedido mínimo rentable y contribución por pedido", () => {
  it("pedido mínimo rentable = precio mínimo * unidades mínimas", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    expect(m!.pedido_minimo_rentable.valor).toBe(20000); // 2000 * 10
  });

  it("contribución por pedido = margen real * ticket de recompra", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    expect(m!.contribucion_por_pedido.valor).toBe(10000); // 0.4 * 25000
  });
});

describe("cartera actual vs. objetivo (nunca se suman)", () => {
  it("facturación recurrente de la cartera actual = cuentas activas * ticket recompra * (30/frecuencia)", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    expect(m!.cartera_actual_facturacion_recurrente_mensual.valor).toBe(500000); // 20*25000*1
  });

  it("cuentas necesarias para el objetivo, redondeado hacia arriba", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    expect(m!.cuentas_necesarias_objetivo.valor).toBe(30); // ceil(750000/25000)
  });

  it("sin objetivo declarado, cuentas necesarias queda retenido", () => {
    const { mayorista_objetivo_facturacion_mensual: _omitido, ...sinObjetivo } = datosCompletos;
    const m = evaluarMayorista({ ...base, ...sinObjetivo } as DatosDiagnostico, {});
    expect(m!.cuentas_necesarias_objetivo.valor).toBeNull();
  });

  it("cartera actual y cuentas necesarias son campos separados, nunca una suma combinada", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    expect(m!.cartera_actual_facturacion_recurrente_mensual.valor).not.toBe(
      (m!.cuentas_necesarias_objetivo.valor ?? 0) + (m!.cartera_actual_facturacion_recurrente_mensual.valor ?? 0),
    );
    // Son dos campos del objeto, no una cifra fusionada: confirmamos que existen por separado.
    expect(m).toHaveProperty("cartera_actual_facturacion_recurrente_mensual");
    expect(m).toHaveProperty("cuentas_necesarias_objetivo");
  });
});

describe("capacidad máxima y recupero de CAC", () => {
  it("capacidad máxima de facturación = unidades máximas * precio de venta real", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    expect(m!.capacidad_maxima_facturacion_mensual.valor).toBe(500000); // 200*2500
  });

  it("recupero del CAC en meses = CAC / contribución mensual por cuenta", () => {
    const m = evaluarMayorista({ ...base, ...datosCompletos } as DatosDiagnostico, {});
    // contribución mensual = 10000 * (30/30) = 10000; 15000/10000 = 1.5
    expect(m!.recupero_cac_meses.valor).toBe(1.5);
  });
});

describe("escenario de activación (leads -> cuentas nuevas, siempre por separado)", () => {
  it("sin ningún lead declarado, el escenario ni siquiera existe", () => {
    const m = evaluarMayorista({ ...base, venta_mayorista_activa: true } as DatosDiagnostico, {});
    expect(m!.escenario_activacion.existe).toBe(false);
    expect(m!.escenario_activacion.calculable).toBe(false);
  });

  it("con leads pero sin tasa de cierre en configuración, documenta el funnel sin proyectar una cantidad", () => {
    const m = evaluarMayorista(
      { ...base, venta_mayorista_activa: true, mayorista_leads_mensuales: 40 } as DatosDiagnostico,
      {},
    );
    expect(m!.escenario_activacion.existe).toBe(true);
    expect(m!.escenario_activacion.calculable).toBe(false);
    expect(m!.escenario_activacion.cuentas_nuevas_estimadas_90d).toBeNull();
    expect(m!.escenario_activacion.faltantes).toContain("mayorista_tasa_cierre_esperada");
  });

  it("con leads y tasa de cierre configurada, proyecta cuentas nuevas a 90 días con supuestos visibles", () => {
    const cfg: ConfigMayorista = { mayorista_tasa_cierre_esperada: 0.05 };
    const m = evaluarMayorista(
      { ...base, venta_mayorista_activa: true, mayorista_leads_mensuales: 40 } as DatosDiagnostico,
      cfg,
    );
    // 40 leads * 3 meses * 5% = 6
    expect(m!.escenario_activacion.calculable).toBe(true);
    expect(m!.escenario_activacion.cuentas_nuevas_estimadas_90d).toBe(6);
    expect(m!.escenario_activacion.confianza).toBe("baja");
    expect(m!.escenario_activacion.supuestos.length).toBeGreaterThan(0);
  });

  it("la cartera actual y el escenario de activación nunca se combinan en una sola cifra", () => {
    const cfg: ConfigMayorista = { mayorista_tasa_cierre_esperada: 0.05 };
    const m = evaluarMayorista(
      { ...base, ...datosCompletos, mayorista_leads_mensuales: 40 } as DatosDiagnostico,
      cfg,
    );
    expect(m!.cartera_actual_facturacion_recurrente_mensual.valor).toBe(500000);
    expect(m!.escenario_activacion.cuentas_nuevas_estimadas_90d).toBe(6);
    // Campos completamente separados: no existe ningún campo "total" que los combine.
    expect(Object.keys(m as object)).not.toContain("total_cuentas");
    expect(Object.keys(m as object)).not.toContain("facturacion_total");
  });
});

describe("disponibilidad del canal mayorista en la plataforma (CAPACIDADES_PLATAFORMA_DEFECTO)", () => {
  it("Tiendanube Inicial no tiene canal mayorista: sugiere el primer plan que sí lo tiene (Impulso)", () => {
    const m = evaluarMayorista(
      { ...base, plataforma: "tiendanube", plan_plataforma: "inicial", venta_mayorista_activa: true } as DatosDiagnostico,
      {},
    );
    expect(m!.canal_disponible).toBe(false);
    expect(m!.plan_sugerido).toBe("Impulso");
  });

  it("Tiendanube Impulso sí tiene canal mayorista: no sugiere ningún cambio de plan", () => {
    const m = evaluarMayorista(
      { ...base, plataforma: "tiendanube", plan_plataforma: "impulso", venta_mayorista_activa: true } as DatosDiagnostico,
      {},
    );
    expect(m!.canal_disponible).toBe(true);
    expect(m!.plan_sugerido).toBeNull();
  });

  it("plataforma no relevada: capacidad desconocida, no se afirma nada", () => {
    const m = evaluarMayorista(
      { ...base, plataforma: "plataforma_no_relevada", plan_plataforma: "", venta_mayorista_activa: true } as DatosDiagnostico,
      {},
    );
    expect(m!.canal_disponible).toBeNull();
    expect(m!.plan_sugerido).toBeNull();
  });
});

describe("anti-canibalización", () => {
  it("riesgo activo cuando minorista está activo (por defecto) y el precio mayorista es visible", () => {
    const m = evaluarMayorista(
      {
        ...base,
        venta_mayorista_activa: true,
        mayorista_precio_visible_en_plataforma_minorista: true,
      } as DatosDiagnostico,
      {},
    );
    expect(m!.riesgo_canibalizacion).toBe(true);
  });

  it("sin minorista activo, no hay riesgo de canibalización aunque el precio sea visible", () => {
    const m = evaluarMayorista(
      {
        ...base,
        venta_mayorista_activa: true,
        venta_minorista_activa: false,
        mayorista_precio_visible_en_plataforma_minorista: true,
      } as DatosDiagnostico,
      {},
    );
    expect(m!.riesgo_canibalizacion).toBe(false);
  });

  it("sin declarar visibilidad, no hay riesgo (no se asume canibalización)", () => {
    const m = evaluarMayorista({ ...base, venta_mayorista_activa: true } as DatosDiagnostico, {});
    expect(m!.riesgo_canibalizacion).toBe(false);
  });
});

function hallazgosDe(d: DatosDiagnostico, c: ConfiguracionCalculo = cfgBase) {
  const r = calcularDiagnostico(d, c);
  return mapearHallazgos(d, r.derivados, r.estados_bloque, r.fugas);
}

describe("mapeo de hallazgos mayoristas (fase 9, decisión comercial 6)", () => {
  it("sin venta_mayorista_activa, no se genera ningún hallazgo mayorista", () => {
    const h = hallazgosDe(base);
    expect(h.some((x) => x.id.startsWith("mayorista_"))).toBe(false);
  });

  it("plan sin canal mayorista: recomendación de plan + servicio de implementación, con el catálogo de seis", () => {
    const h = hallazgosDe({
      ...base,
      plataforma: "tiendanube",
      plan_plataforma: "inicial",
      venta_mayorista_activa: true,
    } as DatosDiagnostico);
    const recomendacion = h.find((x) => x.id === "mayorista_canal_no_disponible");
    expect(recomendacion?.capa).toBe("recomendacion");
    expect(recomendacion?.nota).toMatch(/Impulso/);
    const servicio = h.find((x) => x.id === "mayorista_implementacion");
    expect(servicio?.capa).toBe("servicio");
    expect(servicio?.servicio).toBe("Desarrollo y optimización web");
  });

  it("plan con canal mayorista disponible: no recomienda cambio de plan", () => {
    const h = hallazgosDe({
      ...base,
      plataforma: "tiendanube",
      plan_plataforma: "impulso",
      venta_mayorista_activa: true,
    } as DatosDiagnostico);
    expect(h.some((x) => x.id === "mayorista_canal_no_disponible")).toBe(false);
    expect(h.some((x) => x.id === "mayorista_implementacion")).toBe(false);
  });

  it("plataforma no relevada: hallazgo de capacidad desconocida, sin recomendar plan", () => {
    const h = hallazgosDe({
      ...base,
      plataforma: "plataforma_no_relevada",
      plan_plataforma: "",
      venta_mayorista_activa: true,
    } as DatosDiagnostico);
    const contexto = h.find((x) => x.id === "mayorista_capacidad_desconocida");
    expect(contexto?.capa).toBe("contexto");
    expect(contexto?.servicio).toBeNull();
  });

  it("riesgo de canibalización: hallazgo de contexto, nunca presentado como servicio", () => {
    const h = hallazgosDe({
      ...base,
      venta_mayorista_activa: true,
      mayorista_precio_visible_en_plataforma_minorista: true,
    } as DatosDiagnostico);
    const c = h.find((x) => x.id === "mayorista_canibalizacion");
    expect(c?.capa).toBe("contexto");
    expect(c?.servicio).toBeNull();
  });

  it("precio de venta por debajo del piso: hallazgo de recomendación (ajuste comercial, no servicio)", () => {
    const h = hallazgosDe({
      ...base,
      ...datosCompletos,
      venta_mayorista_activa: true,
      mayorista_precio_venta_real: 1000, // por debajo del piso de 2000
    } as DatosDiagnostico);
    const p = h.find((x) => x.id === "mayorista_precio_bajo_el_piso");
    expect(p?.capa).toBe("recomendacion");
    expect(p?.servicio).toBeNull();
  });

  it("precio de venta por encima del piso: no genera el hallazgo", () => {
    const h = hallazgosDe({ ...base, ...datosCompletos } as DatosDiagnostico);
    expect(h.some((x) => x.id === "mayorista_precio_bajo_el_piso")).toBe(false);
  });

  it("pedido mínimo declarado insuficiente frente al piso rentable", () => {
    const h = hallazgosDe({
      ...base,
      ...datosCompletos,
      mayorista_pedido_minimo_monto: 5000, // el piso calculado es 20000
    } as DatosDiagnostico);
    const p = h.find((x) => x.id === "mayorista_pedido_minimo_insuficiente");
    expect(p?.capa).toBe("recomendacion");
  });

  it("cartera activa sin funnel declarado: hallazgo de servicio (mismo catálogo, otro objetivo)", () => {
    const h = hallazgosDe({
      ...base,
      venta_mayorista_activa: true,
      mayorista_cuentas_activas: 20,
    } as DatosDiagnostico);
    const f = h.find((x) => x.id === "mayorista_sin_funnel_activo");
    expect(f?.capa).toBe("servicio");
    expect(f?.servicio).toBe("Meta Ads y Google Ads");
  });

  it("cartera activa CON leads declarados: no genera el hallazgo de funnel ausente", () => {
    const h = hallazgosDe({
      ...base,
      venta_mayorista_activa: true,
      mayorista_cuentas_activas: 20,
      mayorista_leads_mensuales: 10,
    } as DatosDiagnostico);
    expect(h.some((x) => x.id === "mayorista_sin_funnel_activo")).toBe(false);
  });

  it("concentración de cartera: se informa el dato, sin clasificarlo en riesgo", () => {
    const h = hallazgosDe({
      ...base,
      venta_mayorista_activa: true,
      mayorista_concentracion_pct_top_cliente: 62,
    } as DatosDiagnostico);
    const c = h.find((x) => x.id === "mayorista_concentracion_cartera");
    expect(c?.capa).toBe("contexto");
    expect(c?.nota).toMatch(/62/);
  });
});
