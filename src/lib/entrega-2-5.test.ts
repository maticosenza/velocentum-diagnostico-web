/**
 * Entrega 2.5: Product Ads de Mercado Libre y regla de contradicción del margen.
 */

import { describe, expect, it } from "vitest";
import {
  calcularDiagnostico,
  hayInversionPublicitaria,
  inversionProductAds,
  inversionPublicitariaTotal,
  type ConfiguracionCalculo,
} from "./calculo-diagnostico";
import { evaluarContradiccion, rangoDeclarado } from "./contradiccion";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
import { mapearHallazgos } from "./propuesta";

const cfg: ConfiguracionCalculo = {
  reserva_default: 0.35,
  comision_plataforma: { tiendanube_esencial: 0.01, tiendanube_inicial: 0.02 },
  comision_pasarela: { mercado_pago: 0.05 },
  comision_marketplace: {
    mercado_libre: {
      comision: 0.1694,
      marketplace: "mercado_libre",
      pais: "AR",
      origen: "benchmark_provisional",
      provisional: true,
      verificado: false,
    },
  },
  umbrales_cr_por_ticket: [{ hasta: null, verde: 0.018, rojo: 0.01 }],
  delta_medicion: { verde: 0.1, rojo: 0.2 },
  tope_fuga_individual: 0.25,
  tope_fuga_total: 0.4,
  mejora_agregado_pts: 2,
  mejora_checkout_pts: 10,
  mejora_compra_pts: 10,
};

/** B1 · Titan Web: sólo Mercado Libre, con Product Ads. */
const titan: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Titan Web",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  vende_mercado_libre: true,
  facturacion_mensual: 50_000_000,
  ticket_promedio: 25000,
  costo_envio_promedio: 9000,
  producto_1_nombre: "Bolsa tostado",
  producto_1_costo: 5890,
  producto_1_precio: 11650,
  producto_1_pct_facturacion: 20,
  canal_ml_pct: 100,
  canal_ml_facturacion: 50_000_000,
  canal_tienda_no_aplica: true,
  ml_inversion_product_ads: 1_800_000,
};

const canal = (r: ReturnType<typeof calcularDiagnostico>, id: string) =>
  r.derivados.canales.find((c) => c.id === id)!;

describe("Product Ads de Mercado Libre", () => {
  it("caso B1 · el MER del canal se calcula y el sistema no dice que no invierte", () => {
    const r = calcularDiagnostico(titan, cfg);
    expect(r.derivados.mer_marketplace).toBe(27.78);
    expect(canal(r, "mercado_libre").mer).toBe(27.78);
    expect(r.derivados.hay_inversion_publicitaria).toBe(true);
    expect(r.derivados.inversion_publicitaria_total).toBe(1_800_000);
    // Sin ventas atribuidas cargadas el ROAS queda sin datos, pero el MER existe.
    expect(r.derivados.roas_product_ads).toBeNull();
    expect(canal(r, "mercado_libre").roas_pauta).toBeNull();
  });

  it("tres estados: positivo, cero explícito y ausente", () => {
    const positivo = calcularDiagnostico(titan, cfg).derivados;
    const cero = calcularDiagnostico({ ...titan, ml_inversion_product_ads: 0 }, cfg).derivados;
    const ausente = calcularDiagnostico({ ...titan, ml_inversion_product_ads: null }, cfg).derivados;

    expect(positivo.hay_inversion_publicitaria).toBe(true);
    expect(positivo.mer_marketplace).toBe(27.78);

    // Cero explícito: el cliente declaró que no invierte. No es "sin datos".
    expect(cero.hay_inversion_publicitaria).toBe(false);
    expect(cero.inversion_publicitaria_total).toBe(0);
    expect(cero.mer_marketplace).toBeNull();

    // Ausente: no sabemos, no se afirma nada.
    expect(ausente.hay_inversion_publicitaria).toBeNull();
    expect(ausente.inversion_publicitaria_total).toBeNull();
    expect(ausente.mer_marketplace).toBeNull();
  });

  it("Product Ads positivo con Meta y Google en cero: sigue habiendo inversión", () => {
    const d = { ...titan, inversion_meta: 0, inversion_google: 0 };
    expect(inversionProductAds(d)).toBe(1_800_000);
    expect(inversionPublicitariaTotal(d)).toBe(1_800_000);
    expect(hayInversionPublicitaria(d)).toBe(true);

    const r = calcularDiagnostico({ ...d, presupuesto_diario: null, conjuntos_activos: 3 }, cfg);
    const hallazgos = mapearHallazgos(d, r.derivados, r.estados_bloque, r.fugas);
    // Los hallazgos de estructura de cuenta ya no se apagan por falta de Meta/Google.
    expect(r.derivados.hay_inversion_publicitaria).toBe(true);
    expect(hallazgos.every((h) => h.id !== "sin_inversion")).toBe(true);
  });

  it("con ventas atribuidas cargadas el ROAS de Product Ads se calcula", () => {
    const r = calcularDiagnostico({ ...titan, ml_ventas_product_ads: 9_000_000 }, cfg);
    expect(r.derivados.roas_product_ads).toBe(5);
    expect(canal(r, "mercado_libre").roas_pauta).toBe(5);
    // El MER del canal no cambia: mide todo el canal, no sólo lo atribuido.
    expect(r.derivados.mer_marketplace).toBe(27.78);
  });

  it("el MER de cada perímetro no se mezcla", () => {
    const mixto: DatosDiagnostico = {
      ...titan,
      canal_tienda_no_aplica: false,
      canal_tienda_pct: 50,
      canal_ml_pct: 50,
      canal_tienda_facturacion: 20_000_000,
      canal_ml_facturacion: 30_000_000,
      inversion_meta: 4_000_000,
      inversion_google: 1_000_000,
      ml_inversion_product_ads: 1_500_000,
    };
    const r = calcularDiagnostico(mixto, cfg);
    expect(r.derivados.mer_tienda_propia).toBe(4); // 20M / 5M
    expect(r.derivados.mer_marketplace).toBe(20); // 30M / 1,5M
    expect(r.derivados.inversion_publicitaria_total).toBe(6_500_000);
  });

  it("la inversión en Product Ads no se resta dos veces", () => {
    const sinAds = calcularDiagnostico({ ...titan, ml_inversion_product_ads: null }, cfg);
    const conAds = calcularDiagnostico(titan, cfg);

    // El margen no cambia: la pauta no entra en el margen de contribución.
    expect(conAds.derivados.margen_contribucion).toBe(sinAds.derivados.margen_contribucion);
    expect(canal(conAds, "mercado_libre").margen).toBe(canal(sinAds, "mercado_libre").margen);

    const ml = canal(conAds, "mercado_libre");
    const esperadoAntes = Math.round(50_000_000 * (ml.margen_exacto as number));
    expect(ml.contribucion_antes_publicidad).toBe(esperadoAntes);
    expect(ml.inversion_publicitaria).toBe(1_800_000);
    // La resta ocurre una sola vez, acá.
    expect(ml.resultado_despues_publicidad).toBe(esperadoAntes - 1_800_000);
  });
});

describe("regla de contradicción del margen declarado", () => {
  const rango = rangoDeclarado(10, 12);

  it("dentro del rango no hay contradicción", () => {
    const c = evaluarContradiccion(0.11, rango)!;
    expect(c.dentro_del_rango).toBe(true);
    expect(c.nivel).toBe("sin_alerta");
    expect(c.diferencia).toBe(0);
  });

  it("mide contra el límite más cercano, no contra el centro", () => {
    const c = evaluarContradiccion(0.08, rango)!;
    expect(c.limite_cercano).toBe(0.1);
    expect(c.diferencia).toBe(0.02);
    expect(c.nivel).toBe("sin_alerta");
  });

  it("diferencia de 0,07 contra el límite: validación requerida", () => {
    const c = evaluarContradiccion(0.03, rango)!;
    expect(c.limite_cercano).toBe(0.1);
    expect(c.diferencia).toBe(0.07);
    expect(c.nivel).toBe("validacion_requerida");
  });

  it("por encima del rango también mide contra el límite más cercano", () => {
    const c = evaluarContradiccion(0.25, rango)!;
    expect(c.limite_cercano).toBe(0.12);
    expect(c.diferencia).toBe(0.13);
    expect(c.nivel).toBe("critica");
  });

  it("cambio de signo: crítica", () => {
    const c = evaluarContradiccion(-0.045, rangoDeclarado(11, null))!;
    expect(c.cambio_de_signo).toBe(true);
    expect(c.nivel).toBe("critica");
  });

  it("declarado sólo con mínimo: el rango es ese valor exacto", () => {
    const r = rangoDeclarado(11, null)!;
    expect(r).toEqual({ min: 0.11, max: 0.11 });
    expect(evaluarContradiccion(0.11, r)!.dentro_del_rango).toBe(true);
    expect(evaluarContradiccion(0.05, r)!.nivel).toBe("validacion_requerida");
  });

  it("los umbrales se pueden editar desde configuración", () => {
    const c = evaluarContradiccion(0.03, rango, {
      umbral_critico: 0.06,
      umbral_validacion: 0.02,
    })!;
    expect(c.nivel).toBe("critica");
  });
});

describe("bloqueo por contradicción crítica", () => {
  /** Tienda propia con margen alto y funnel completo: el declarado del 11% lo contradice. */
  const conFunnel: DatosDiagnostico = {
    ...titan,
    canal_ml_pct: null,
    canal_ml_facturacion: null,
    canal_ml_no_aplica: true,
    canal_tienda_no_aplica: false,
    canal_tienda_pct: 100,
    canal_tienda_facturacion: 50_000_000,
    ticket_promedio: 225226,
    costo_envio_promedio: 11000,
    producto_1_costo: 40000,
    producto_1_precio: 180000,
    producto_1_pct_facturacion: 100,
    visitas_mensuales: 100_000,
    agregados_carrito: 8_000,
    checkouts_iniciados: 3_000,
    facturacion_pixel: 20_000_000,
    conjuntos_activos: 12,
    presupuesto_diario: 60_000,
  };

  it("crítica confirmada: bloquea los montos que usan margen, no el resto", () => {
    const r = calcularDiagnostico(
      { ...conFunnel, margen_declarado_min: 11, margen_declarado_confirmado: true },
      cfg,
    );

    expect(r.derivados.contradiccion_margen?.nivel).toBe("critica");
    expect(r.margen_bloqueado).toBe(true);
    expect(r.oportunidad_total).toBe(0);

    for (const f of r.fugas.filter((x) => x.usa_margen)) {
      expect(f.monto, f.id).toBeNull();
      expect(f.calculable, f.id).toBe(false);
      expect(f.faltantes).toContain("margen_en_contradiccion");
    }

    // Lo que no depende del margen sigue en pie.
    expect(r.derivados.funnel.estado).toBe("calculado");
    expect(r.derivados.funnel.visitas).toBe(100_000);
    expect(r.derivados.canales.find((c) => c.id === "mercado_libre")!.comision_efectiva).toBe(
      0.1694,
    );
    expect(r.estados_bloque.medicion).not.toBe("sin_datos");

    const hallazgos = mapearHallazgos(conFunnel, r.derivados, r.estados_bloque, r.fugas);
    const ids = hallazgos.map((h) => h.id);
    expect(ids).not.toContain("mer_bajo");
    expect(ids).not.toContain("cuotas");
    expect(ids).toContain("clips_ml");
    expect(ids).toContain("plan_plataforma");
  });

  it("crítica sin confirmar: informa pero no bloquea", () => {
    const r = calcularDiagnostico({ ...conFunnel, margen_declarado_min: 11 }, cfg);
    expect(r.derivados.contradiccion_margen?.nivel).toBe("critica");
    expect(r.derivados.contradiccion_margen?.confirmado).toBe(false);
    expect(r.margen_bloqueado).toBe(false);
    expect(r.oportunidad_total).toBeGreaterThan(0);
  });

  it("sin margen declarado no hay contradicción", () => {
    const r = calcularDiagnostico(conFunnel, cfg);
    expect(r.derivados.contradiccion_margen).toBeNull();
    expect(r.margen_bloqueado).toBe(false);
  });
});
