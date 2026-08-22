/**
 * Fase 4 (auditoría de planes y comisiones, 2026-08-21): planes y comisiones
 * de Tiendanube, Shopify, WooCommerce y Empretienda con metadatos completos
 * (plan, vigencia, país, origen, evidencia), y la estructura preparada para
 * cargar una liquidación real de marketplace (Mercado Libre, próximos días).
 */
import { describe, expect, it } from "vitest";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
import {
  COMISIONES_MARKETPLACE_DEFECTO,
  COMISIONES_PLATAFORMA_DEFECTO,
  claveComisionPlataforma,
  comisionEfectivaCanal,
  comisionPlataformaDe,
  entradaMarketplace,
  entradaPlataforma,
  type ConfigComisiones,
} from "./canales";

function datosCon(overrides: Partial<DatosDiagnostico>): DatosDiagnostico {
  return { ...DATOS_INICIALES, ...overrides };
}

describe("COMISIONES_PLATAFORMA_DEFECTO: metadatos completos", () => {
  it("cubre Tiendanube (3 planes), Shopify (4 planes), WooCommerce y Empretienda", () => {
    expect(Object.keys(COMISIONES_PLATAFORMA_DEFECTO).sort()).toEqual(
      [
        "tiendanube_inicial",
        "tiendanube_esencial",
        "tiendanube_impulso",
        "shopify_basic",
        "shopify_grow",
        "shopify_advanced",
        "shopify_plus",
        "woocommerce",
        "empretienda",
      ].sort(),
    );
  });

  it("todas las entradas están marcadas verificado:false y provisional:true (son benchmark, no evidencia)", () => {
    for (const [clave, entrada] of Object.entries(COMISIONES_PLATAFORMA_DEFECTO)) {
      expect(entrada.verificado, `${clave}.verificado`).toBe(false);
      expect(entrada.provisional, `${clave}.provisional`).toBe(true);
      expect(entrada.origen, `${clave}.origen`).toBeTruthy();
      expect(entrada.vigencia_desde, `${clave}.vigencia_desde`).toBeTruthy();
    }
  });

  it("WooCommerce y Empretienda no cobran comisión por venta (0), a diferencia de Tiendanube/Shopify", () => {
    expect(COMISIONES_PLATAFORMA_DEFECTO["woocommerce"]!.comision).toBe(0);
    expect(COMISIONES_PLATAFORMA_DEFECTO["empretienda"]!.comision).toBe(0);
    expect(COMISIONES_PLATAFORMA_DEFECTO["tiendanube_inicial"]!.comision).toBeGreaterThan(0);
    expect(COMISIONES_PLATAFORMA_DEFECTO["shopify_basic"]!.comision).toBeGreaterThan(0);
  });

  it("las comisiones de Tiendanube y Shopify bajan a medida que sube el plan", () => {
    const tn = COMISIONES_PLATAFORMA_DEFECTO;
    expect(tn["tiendanube_inicial"]!.comision).toBeGreaterThan(tn["tiendanube_esencial"]!.comision);
    expect(tn["tiendanube_esencial"]!.comision).toBeGreaterThan(tn["tiendanube_impulso"]!.comision);
    expect(tn["shopify_basic"]!.comision).toBeGreaterThan(tn["shopify_grow"]!.comision);
    expect(tn["shopify_grow"]!.comision).toBeGreaterThan(tn["shopify_advanced"]!.comision);
    expect(tn["shopify_advanced"]!.comision).toBeGreaterThan(tn["shopify_plus"]!.comision);
  });
});

describe("entradaPlataforma / comisionPlataformaDe", () => {
  it("sin configuración, usa el benchmark por defecto del código (antes devolvía null)", () => {
    const d = datosCon({ plataforma: "tiendanube", plan_plataforma: "esencial" });
    expect(comisionPlataformaDe({}, d)).toBe(0.01);
    expect(entradaPlataforma({}, d)).toMatchObject({
      comision: 0.01,
      plan: "esencial",
      verificado: false,
    });
  });

  it("un valor plano legado en configuración (Record<string, number>) sigue funcionando y pisa al benchmark", () => {
    const d = datosCon({ plataforma: "tiendanube", plan_plataforma: "esencial" });
    const cfg: ConfigComisiones = { comision_plataforma: { tiendanube_esencial: 0.03 } };
    expect(comisionPlataformaDe(cfg, d)).toBe(0.03);
    // Un número plano no trae metadatos: la entrada resuelta sólo tiene `comision`.
    expect(entradaPlataforma(cfg, d)).toEqual({ comision: 0.03 });
  });

  it("una entrada rica en configuración (con metadatos) pisa al benchmark del código", () => {
    const d = datosCon({ plataforma: "woocommerce", plan_plataforma: "" });
    const cfg: ConfigComisiones = {
      comision_plataforma: {
        woocommerce: {
          comision: 0.015,
          origen: "acuerdo_comercial",
          verificado: true,
          vigencia_desde: "2026-01-01",
        },
      },
    };
    expect(entradaPlataforma(cfg, d)).toMatchObject({ comision: 0.015, verificado: true });
  });

  it("plataforma sin plan (empretienda) resuelve por la clave simple", () => {
    const d = datosCon({ plataforma: "empretienda", plan_plataforma: "" });
    expect(comisionPlataformaDe({}, d)).toBe(0);
  });

  it("plataforma no cubierta por ningún benchmark (VTEX) sigue devolviendo null: no se inventa un número", () => {
    const d = datosCon({ plataforma: "vtex", plan_plataforma: "" });
    expect(comisionPlataformaDe({}, d)).toBeNull();
    expect(entradaPlataforma({}, d)).toBeNull();
  });

  it("claveComisionPlataforma sigue siendo la clave compuesta plataforma_plan", () => {
    expect(claveComisionPlataforma("tiendanube", "esencial")).toBe("tiendanube_esencial");
    expect(claveComisionPlataforma("empretienda", "")).toBe("empretienda");
    expect(claveComisionPlataforma("", "")).toBe("");
  });
});

describe("comisionEfectivaCanal: metadatos de plataforma (plan, país, vigencia, evidencia)", () => {
  it("tienda propia sin config: usa el benchmark del código y lo marca benchmark_sin_verificar", () => {
    const d = datosCon({
      plataforma: "tiendanube",
      plan_plataforma: "esencial",
      pasarela: "mercado_pago",
    });
    const cfg: ConfigComisiones = { comision_pasarela: { mercado_pago: 0.05 } };
    const r = comisionEfectivaCanal(d, cfg, "tienda_propia", 45000);
    expect(r.valor).toBeCloseTo(0.01 + 0.05, 4);
    expect(r.evidencia).toBe("benchmark_sin_verificar");
    expect(r.provisional).toBe(true);
    expect(r.plan).toBe("esencial");
    expect(r.vigencia).toMatch(/desde 2026-08-21/);
  });

  it("una entrada de plataforma marcada verificado:true resuelve como liquidacion_verificada, no benchmark", () => {
    const d = datosCon({
      plataforma: "tiendanube",
      plan_plataforma: "esencial",
      pasarela: "mercado_pago",
    });
    const cfg: ConfigComisiones = {
      comision_plataforma: {
        tiendanube_esencial: {
          comision: 0.01,
          plan: "esencial",
          verificado: true,
          origen: "acuerdo_comercial_confirmado",
          vigencia_desde: "2026-01-01",
        },
      },
      comision_pasarela: { mercado_pago: 0.05 },
    };
    const r = comisionEfectivaCanal(d, cfg, "tienda_propia", 45000);
    expect(r.evidencia).toBe("liquidacion_verificada");
    expect(r.provisional).toBe(false);
    expect(r.origen).toBe("acuerdo_comercial_confirmado");
  });

  it("un valor verificado por el cliente en ESTE diagnóstico le sigue ganando a cualquier benchmark o liquidación de configuración (precedencia ya implementada)", () => {
    const d = datosCon({
      plataforma: "tiendanube",
      plan_plataforma: "esencial",
      pasarela: "mercado_pago",
      canal_tienda_comision_pct: 3.5,
    });
    const cfg: ConfigComisiones = {
      comision_plataforma: {
        tiendanube_esencial: { comision: 0.01, verificado: true },
      },
      comision_pasarela: { mercado_pago: 0.05 },
    };
    const r = comisionEfectivaCanal(d, cfg, "tienda_propia", 45000);
    expect(r.valor).toBeCloseTo(0.035, 4);
    expect(r.evidencia).toBe("liquidacion_cliente");
  });
});

describe("Mercado Libre: estructura preparada para cargar una liquidación real (fase 4)", () => {
  it("hoy (benchmark del código) el marketplace resuelve como benchmark_sin_verificar", () => {
    const d = datosCon({ vende_mercado_libre: true, canal_ml_tipo_publicacion: "clasica" });
    const r = comisionEfectivaCanal(d, {}, "mercado_libre", 25000);
    expect(r.valor).not.toBeNull();
    expect(r.evidencia).toBe("benchmark_sin_verificar");
    expect(r.provisional).toBe(true);
    expect(r.origen).toBe(COMISIONES_MARKETPLACE_DEFECTO["mercado_libre"]!.origen);
  });

  it("cuando llegue la liquidación real, alcanza con cargar una fila de configuración con verificado:true: pisa al benchmark y queda evidencia liquidacion_verificada", () => {
    const d = datosCon({ vende_mercado_libre: true, canal_ml_tipo_publicacion: "clasica" });
    const cfg: ConfigComisiones = {
      comision_marketplace: {
        mercado_libre: {
          comision: 0.145,
          marketplace: "mercado_libre",
          pais: "AR",
          origen: "liquidacion_mercado_libre_agosto_2026",
          fuente: "liquidacion_real_cliente_agregada",
          verificado: true,
          provisional: false,
          vigencia_desde: "2026-08-01",
        },
      },
    };
    const r = comisionEfectivaCanal(d, cfg, "mercado_libre", 25000);
    expect(r.valor).toBeCloseTo(0.145, 4);
    expect(r.evidencia).toBe("liquidacion_verificada");
    expect(r.provisional).toBe(false);
    expect(r.origen).toBe("liquidacion_mercado_libre_agosto_2026");
    expect(r.vigencia).toMatch(/desde 2026-08-01/);
    // El benchmark del código no se tocó: sigue disponible si se quita la config.
    expect(entradaMarketplace({}, "mercado_libre", "clasica")?.comision).toBe(
      COMISIONES_MARKETPLACE_DEFECTO["mercado_libre"]!.comision,
    );
  });

  it("un cargo declarado por el cliente sigue respaldando sólo al cargo, nunca reclasifica la comisión entera como verificada", () => {
    const d = datosCon({
      vende_mercado_libre: true,
      canal_ml_tipo_publicacion: "clasica",
      canal_ml_cargo_fijo: 1200,
    });
    const r = comisionEfectivaCanal(d, {}, "mercado_libre", 25000);
    expect(r.evidencia).toBe("declarado_cliente");
    expect(r.provisional).toBe(true);
  });
});
