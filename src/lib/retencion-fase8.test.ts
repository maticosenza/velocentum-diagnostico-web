/**
 * Fase 8 (retención, 2026-08-22): fugas de recuperación de carrito y
 * recompra. Base: total de carritos abandonados / compradores únicos, sin
 * restar los ya recuperados (la tasa actual ya los representa); mejora =
 * tasa objetivo (config) menos tasa actual. Regla del cupón: se descarta si
 * la contribución post-descuento no sigue siendo positiva.
 */
import { describe, expect, it } from "vitest";
import { calcularDiagnostico, type ConfiguracionCalculo } from "./calculo-diagnostico";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
import { mapearHallazgos } from "./propuesta";

const cfg: ConfiguracionCalculo = {
  reserva_default: 0.35,
  comision_plataforma: { tiendanube_esencial: 0.01 },
  comision_pasarela: { mercado_pago: 0.05 },
  recuperacion_carrito_esperada: 0.2,
  recompra_esperada: 0.3,
};

/** Un solo producto declarado al 100% explícito: margen total calculado, no retenido. */
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

function fugaDe(id: string, d: DatosDiagnostico, c: ConfiguracionCalculo = cfg) {
  return calcularDiagnostico(d, c).fugas.find((f) => f.id === id);
}

/**
 * `derivados.margen_contribucion` está redondeado a 4 decimales
 * (`DECIMALES_TASA`); el monto de la fuga se calcula puertas adentro con el
 * margen sin redondear. Comparamos con tolerancia relativa en vez de
 * recalcular la fórmula interna del motor a mano.
 */
function cercaDe(real: number | null, esperado: number) {
  expect(real).not.toBeNull();
  expect(Math.abs((real as number) - esperado) / esperado).toBeLessThan(0.001);
}

describe("recuperación de carritos abandonados (fase 8)", () => {
  it("sin ningún dato de retención cargado, la fuga ni siquiera existe (igual que gasto_no_rentable sin inversión)", () => {
    expect(fugaDe("recuperacion_carrito", base)).toBeUndefined();
  });

  it("con carritos abandonados pero sin tasa actual ni objetivo, la fuga existe pero no es calculable", () => {
    const d = { ...base, carritos_abandonados: 500 };
    const f = fugaDe("recuperacion_carrito", d)!;
    expect(f).toBeDefined();
    expect(f.calculable).toBe(false);
    expect(f.monto).toBeNull();
    expect(f.faltantes).toContain("retencion_recuperacion_pct_actual");
  });

  it("sin la tasa objetivo en configuración, queda retenida (no hay benchmark de código para esto)", () => {
    const d: DatosDiagnostico = {
      ...base,
      carritos_abandonados: 500,
      retencion_recuperacion_pct_actual: 10,
    };
    const { recuperacion_carrito_esperada: _omitida, ...cfgSinObjetivo } = cfg;
    const f = fugaDe("recuperacion_carrito", d, cfgSinObjetivo)!;
    expect(f.calculable).toBe(false);
    expect(f.faltantes).toContain("recuperacion_carrito_esperada");
  });

  it("con todos los datos, calcula la contribución incremental de la mejora (tasa objetivo - tasa actual)", () => {
    const d: DatosDiagnostico = {
      ...base,
      carritos_abandonados: 500,
      retencion_recuperacion_pct_actual: 10, // 10% actual vs. 20% objetivo => mejora 10 pts
    };
    const r = calcularDiagnostico(d, cfg);
    const f = r.fugas.find((x) => x.id === "recuperacion_carrito")!;
    expect(f.calculable).toBe(true);
    const margen = r.derivados.margen_contribucion!;
    const esperado = 500 * 0.1 * 45000 * margen;
    cercaDe(f.monto, esperado);
    const impacto = f.impactos!.find((i) => i.tipo === "contribucion_incremental")!;
    expect(impacto.confianza).toBe("media");
    expect(impacto.montoMensual).toBe(f.monto);
  });

  it("ya en el objetivo o por encima, no hay oportunidad: la fuga no se agrega", () => {
    const d: DatosDiagnostico = {
      ...base,
      carritos_abandonados: 500,
      retencion_recuperacion_pct_actual: 25, // ya por encima del objetivo (20%)
    };
    expect(fugaDe("recuperacion_carrito", d)).toBeUndefined();
  });

  it("regla del cupón: se aplica si la contribución post-descuento sigue siendo positiva", () => {
    const d: DatosDiagnostico = {
      ...base,
      carritos_abandonados: 500,
      retencion_recuperacion_pct_actual: 10,
      retencion_usa_cupon: true,
      retencion_cupon_pct: 5, // 5%: bien por debajo del margen, sigue siendo rentable
    };
    const r = calcularDiagnostico(d, cfg);
    const f = r.fugas.find((x) => x.id === "recuperacion_carrito")!;
    const margen = r.derivados.margen_contribucion!;
    const esperado = 500 * 0.1 * (45000 * margen - 45000 * 0.05);
    cercaDe(f.monto, esperado);
    expect(f.detalle).toBeUndefined();
  });

  it("regla del cupón: se descarta si dejaría la contribución en cero o negativa, y lo dice en el detalle", () => {
    const d: DatosDiagnostico = {
      ...base,
      carritos_abandonados: 500,
      retencion_recuperacion_pct_actual: 10,
      retencion_usa_cupon: true,
      retencion_cupon_pct: 90, // descuento enorme: se come toda la contribución
    };
    const r = calcularDiagnostico(d, cfg);
    const f = r.fugas.find((x) => x.id === "recuperacion_carrito")!;
    const margen = r.derivados.margen_contribucion!;
    // El monto se calcula IGNORANDO el cupón descartado (contribución sin descuento).
    const esperado = 500 * 0.1 * 45000 * margen;
    cercaDe(f.monto, esperado);
    expect(f.detalle).toMatch(/se descartó del cálculo/);
  });
});

describe("recompra / segunda compra (fase 8)", () => {
  const cincoDatos: Partial<DatosDiagnostico> = {
    recompra_compradores_unicos: 1000,
    recompra_tasa_actual_pct: 15,
    recompra_ventana_dias: 60,
    recompra_ticket_segunda_compra: 40000,
    recompra_tiene_secuencia_postventa: false,
  };

  it("sin ningún dato de recompra cargado, la fuga ni siquiera existe", () => {
    expect(fugaDe("recompra", base)).toBeUndefined();
  });

  it("con sólo alguno de los cinco datos, la fuga existe pero no es calculable (recomendación cualitativa)", () => {
    const d = { ...base, recompra_compradores_unicos: 1000 };
    const f = fugaDe("recompra", d)!;
    expect(f).toBeDefined();
    expect(f.calculable).toBe(false);
    expect(f.monto).toBeNull();
    expect(f.faltantes).toContain("recompra_tasa_actual_pct");
    expect(f.faltantes).toContain("recompra_ventana_dias");
    expect(f.faltantes).toContain("recompra_ticket_segunda_compra");
    expect(f.faltantes).toContain("recompra_tiene_secuencia_postventa");
  });

  it("con los cinco datos mínimos y la tasa objetivo en config, calcula la contribución incremental", () => {
    const d: DatosDiagnostico = { ...base, ...cincoDatos } as DatosDiagnostico;
    const r = calcularDiagnostico(d, cfg);
    const f = r.fugas.find((x) => x.id === "recompra")!;
    expect(f.calculable).toBe(true);
    const margen = r.derivados.margen_contribucion!;
    // objetivo 30% - actual 15% = 15 pts de mejora
    const esperado = 1000 * 0.15 * 40000 * margen;
    cercaDe(f.monto, esperado);
  });

  it("sin la tasa objetivo de recompra en configuración, queda como recomendación cualitativa", () => {
    const d: DatosDiagnostico = { ...base, ...cincoDatos } as DatosDiagnostico;
    const { recompra_esperada: _omitida, ...cfgSinObjetivo } = cfg;
    const f = fugaDe("recompra", d, cfgSinObjetivo)!;
    expect(f.calculable).toBe(false);
    expect(f.faltantes).toContain("recompra_esperada");
  });

  it("ya en el objetivo o por encima, no hay oportunidad: la fuga no se agrega", () => {
    const d: DatosDiagnostico = {
      ...base,
      ...cincoDatos,
      recompra_tasa_actual_pct: 40, // ya por encima del objetivo (30%)
    } as DatosDiagnostico;
    expect(fugaDe("recompra", d)).toBeUndefined();
  });

  it("reutiliza el mismo cupón declarado para recuperación de carrito (mismo criterio)", () => {
    const d: DatosDiagnostico = {
      ...base,
      ...cincoDatos,
      retencion_usa_cupon: true,
      retencion_cupon_pct: 90,
    } as DatosDiagnostico;
    const r = calcularDiagnostico(d, cfg);
    const f = r.fugas.find((x) => x.id === "recompra")!;
    const margen = r.derivados.margen_contribucion!;
    const esperado = 1000 * 0.15 * 40000 * margen;
    cercaDe(f.monto, esperado);
    expect(f.detalle).toMatch(/se descartó del cálculo/);
  });
});

function hallazgosDe(d: DatosDiagnostico, c: ConfiguracionCalculo = cfg) {
  const r = calcularDiagnostico(d, c);
  return mapearHallazgos(d, r.derivados, r.estados_bloque, r.fugas);
}

describe("mapeo de hallazgos de retención (fase 8, decisión comercial 4)", () => {
  it("plan sin carrito nativo (Tiendanube Inicial): se divide en recomendación (subir de plan) + servicio (implementación)", () => {
    const d: DatosDiagnostico = { ...base, plan_plataforma: "inicial" };
    const ids = hallazgosDe(d).map((h) => h.id);
    expect(ids).toContain("retencion_subir_plan");
    expect(ids).toContain("retencion_recuperacion_carrito");

    const recomendacion = hallazgosDe(d).find((h) => h.id === "retencion_subir_plan")!;
    expect(recomendacion.capa).toBe("recomendacion");
    expect(recomendacion.nota).toMatch(/Esencial/);

    const servicio = hallazgosDe(d).find((h) => h.id === "retencion_recuperacion_carrito")!;
    expect(servicio.capa).toBe("servicio");
    expect(servicio.servicio).toBe("Planificación de contenido");
  });

  it("plan con carrito nativo (Tiendanube Esencial) y sin ningún canal declarado: capa servicio directamente, sin recomendación de plan", () => {
    const d: DatosDiagnostico = {
      ...base,
      retencion_canal_email: false,
      retencion_canal_whatsapp: false,
      retencion_canal_retargeting: false,
    };
    const hallazgos = hallazgosDe(d);
    const ids = hallazgos.map((h) => h.id);
    expect(ids).not.toContain("retencion_subir_plan");
    expect(ids).toContain("retencion_recuperacion_carrito");
    expect(hallazgos.find((h) => h.id === "retencion_recuperacion_carrito")!.capa).toBe("servicio");
  });

  it("plan con carrito nativo, sin evidencia de brecha (nada declarado): no se genera ningún hallazgo de retención", () => {
    const ids = hallazgosDe(base).map((h) => h.id);
    expect(ids).not.toContain("retencion_recuperacion_carrito");
    expect(ids).not.toContain("retencion_subir_plan");
  });

  it("el servicio suma Meta Ads cuando el retargeting es parte de la implementación", () => {
    const d: DatosDiagnostico = {
      ...base,
      plan_plataforma: "inicial",
      retencion_canal_retargeting: true,
    };
    const servicio = hallazgosDe(d).find((h) => h.id === "retencion_recuperacion_carrito")!;
    expect(servicio.servicio).toBe("Planificación de contenido y Meta Ads");
  });

  it("capacidad desconocida (Empretienda): no se afirma nada ni se recomienda un plan", () => {
    const d: DatosDiagnostico = { ...base, plataforma: "empretienda", plan_plataforma: "" };
    const ids = hallazgosDe(d).map((h) => h.id);
    expect(ids).toContain("retencion_capacidad_desconocida");
    expect(ids).not.toContain("retencion_subir_plan");
    expect(ids).not.toContain("retencion_recuperacion_carrito");
    const h = hallazgosDe(d).find((x) => x.id === "retencion_capacidad_desconocida")!;
    expect(h.capa).toBe("contexto");
  });

  it("WooCommerce sin carrito nativo: fuera de alcance, nunca presentado como servicio de implementación nativa", () => {
    const d: DatosDiagnostico = { ...base, plataforma: "woocommerce", plan_plataforma: "" };
    const hallazgos = hallazgosDe(d);
    const ids = hallazgos.map((h) => h.id);
    expect(ids).toContain("retencion_carrito_fuera_de_alcance");
    expect(ids).not.toContain("retencion_subir_plan");
    expect(ids).not.toContain("retencion_recuperacion_carrito");
    const h = hallazgos.find((x) => x.id === "retencion_carrito_fuera_de_alcance")!;
    expect(h.capa).toBe("contexto");
    expect(h.servicio).toBeNull();
    expect(h.nota).toMatch(/desarrollo a medida o un plugin de terceros/);
  });

  it("recompra calculable: hallazgo en capa servicio", () => {
    const d: DatosDiagnostico = {
      ...base,
      recompra_compradores_unicos: 1000,
      recompra_tasa_actual_pct: 15,
      recompra_ventana_dias: 60,
      recompra_ticket_segunda_compra: 40000,
      recompra_tiene_secuencia_postventa: false,
    };
    const h = hallazgosDe(d).find((x) => x.id === "recompra")!;
    expect(h).toBeDefined();
    expect(h.capa).toBe("servicio");
  });

  it("recompra con datos parciales (no calculable): hallazgo en capa recomendación, cualitativo", () => {
    const d: DatosDiagnostico = { ...base, recompra_compradores_unicos: 1000 };
    const h = hallazgosDe(d).find((x) => x.id === "recompra")!;
    expect(h).toBeDefined();
    expect(h.capa).toBe("recomendacion");
  });

  it("recompra sin ningún dato: no se genera el hallazgo", () => {
    const ids = hallazgosDe(base).map((h) => h.id);
    expect(ids).not.toContain("recompra");
  });
});
