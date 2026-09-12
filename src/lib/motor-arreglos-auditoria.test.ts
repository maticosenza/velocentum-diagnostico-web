/**
 * Arreglos de la auditoría del motor del 2026-09-10
 * (`docs/bv4-motor-arreglos-propuestos.md`): H-30, H-34, H-29 y H-28.
 */

import { describe, expect, it } from "vitest";
import { buildDocumentContext } from "../documents/domain/build-context";
import {
  calcularDiagnostico,
  coberturaProductos,
  evaluarFunnel,
  faltantesMargen,
  hayInversionPublicitaria,
  inversionPublicitariaTotal,
  productosSuperan100,
} from "./calculo-diagnostico";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";
import {
  casoTitanWebB1,
  casoTitanWebB1CoberturaCompleta,
  configuracionRegresionFase2 as cfg,
} from "./fixtures-casos";

const titan = casoTitanWebB1;
const ml = (d: DatosDiagnostico) =>
  calcularDiagnostico(d, cfg).derivados.canales.find((c) => c.id === "mercado_libre")!;

describe("H-30 · resultado después de publicidad", () => {
  it("sin la inversión del canal no hay resultado neto de pauta", () => {
    const c = ml({ ...titan, ml_inversion_product_ads: null });
    expect(c.contribucion_antes_publicidad).not.toBeNull();
    expect(c.inversion_publicitaria).toBeNull();
    expect(c.resultado_despues_publicidad).toBeNull();
  });

  it("un cero explícito sigue siendo cero: el resultado es la contribución", () => {
    const c = ml({ ...titan, ml_inversion_product_ads: 0 });
    expect(c.resultado_despues_publicidad).toBe(c.contribucion_antes_publicidad);
  });
});

describe("H-34 · porcentajes de producto que suman más de 100", () => {
  const sobre100: DatosDiagnostico = {
    ...casoTitanWebB1CoberturaCompleta,
    producto_1_pct_facturacion: 60,
    producto_2_pct_facturacion: 30,
    producto_3_pct_facturacion: 30,
  };

  it("la cobertura no se recorta: 120 es un mix imposible", () => {
    expect(coberturaProductos(sobre100)).toBe(120);
    expect(productosSuperan100(sobre100)).toBe(true);
    expect(productosSuperan100(casoTitanWebB1CoberturaCompleta)).toBe(false);
  });

  it("retiene el margen total, publica la muestra y pide los porcentajes", () => {
    expect(calcularDiagnostico(casoTitanWebB1CoberturaCompleta, cfg).derivados.margen_contribucion).not.toBeNull();

    const r = calcularDiagnostico(sobre100, cfg);
    expect(r.derivados.cobertura_productos).toBe(120);
    expect(r.derivados.margen_contribucion).toBeNull();
    expect(r.derivados.margen_muestra).not.toBeNull();
    expect(faltantesMargen(sobre100)).toEqual(
      expect.arrayContaining([
        "producto_1_pct_facturacion",
        "producto_2_pct_facturacion",
        "producto_3_pct_facturacion",
      ]),
    );
    // H-31: las fugas que dependen del margen piden esos campos, no margen_contribucion.
    for (const f of r.fugas) expect(f.faltantes, f.id).not.toContain("margen_contribucion");
  });

  it("una suma que da 100 con decimales cuenta como cobertura completa", () => {
    const d = {
      ...casoTitanWebB1CoberturaCompleta,
      producto_1_pct_facturacion: 33.3,
      producto_2_pct_facturacion: 33.3,
      producto_3_pct_facturacion: 33.4,
    };
    expect(coberturaProductos(d)).toBe(100);
    expect(calcularDiagnostico(d, cfg).derivados.margen_contribucion).not.toBeNull();
  });

  it("el documento lo informa como mix inconsistente, no como cobertura parcial", () => {
    const c = buildDocumentContext({
      datos: sobre100,
      resultado: calcularDiagnostico(sobre100, cfg),
      diagnostico: { id: "fixture-sobre-100", version: 1, fecha: "2026-09-12" },
    });
    const ids = c.restricciones.map((x) => x.id);
    expect(ids).toContain("mix_productos_invalido");
    expect(ids).not.toContain("cobertura_productos_parcial");
  });
});

describe("H-29 · inversión total con un componente sin cargar", () => {
  it("un canal declarado sin su inversión retiene el total", () => {
    const d: DatosDiagnostico = {
      ...titan,
      canal_tienda_no_aplica: false,
      canal_tienda_pct: 40,
      canal_ml_pct: 60,
      inversion_meta: null,
      inversion_google: null,
    };
    expect(inversionPublicitariaTotal(d)).toBeNull();
    expect(hayInversionPublicitaria(d)).toBeNull();
  });

  it("un canal ausente con el mix cubierto al 100% por los otros cuenta cero", () => {
    const d: DatosDiagnostico = {
      ...titan,
      canal_tienda_no_aplica: false,
      canal_tienda_pct: null,
      inversion_meta: null,
      inversion_google: null,
    };
    expect(inversionPublicitariaTotal(d)).toBe(1_800_000);
    expect(hayInversionPublicitaria(d)).toBe(true);
  });

  const soloTienda: DatosDiagnostico = {
    ...titan,
    canal_tienda_no_aplica: false,
    canal_tienda_pct: 100,
    canal_ml_pct: null,
    canal_ml_facturacion: null,
    canal_ml_no_aplica: true,
    ml_inversion_product_ads: null,
  };

  it("Meta en cero y Google sin cargar no es declarar que no invierte", () => {
    const d = { ...soloTienda, inversion_meta: 0, inversion_google: null };
    expect(inversionPublicitariaTotal(d)).toBe(0);
    expect(hayInversionPublicitaria(d)).toBeNull();
  });

  it("Meta y Google en cero sí es declarar que no invierte", () => {
    const d = { ...soloTienda, inversion_meta: 0, inversion_google: 0 };
    expect(inversionPublicitariaTotal(d)).toBe(0);
    expect(hayInversionPublicitaria(d)).toBe(false);
  });
});

describe("H-28 · conversión de tienda y funnel con la facturación de la tienda", () => {
  /** Negocio mixto: la tienda factura el 30% y tiene mucho tráfico. */
  const mixto: DatosDiagnostico = {
    ...DATOS_INICIALES,
    nombre_tienda: "Mixto H-28",
    facturacion_mensual: 10_000_000,
    ticket_promedio: 20_000,
    canal_tienda_pct: 30,
    canal_ml_pct: 70,
    visitas_mensuales: 150_000,
    agregados_carrito: 4_000,
    checkouts_iniciados: 600,
  };

  it("150 pedidos de tienda sobre 150.000 visitas: CR 0,1%, no 0,33%", () => {
    const r = calcularDiagnostico(mixto, cfg);
    // Los pedidos mensuales siguen siendo del negocio: 10M / 20.000.
    expect(r.derivados.pedidos_mensuales).toBe(500);
    // La tienda factura el 30%: 3M / 20.000 = 150 pedidos.
    expect(r.derivados.cr_tienda).toBe(0.001);
    expect(r.derivados.funnel.compras).toBe(150);
    expect(r.derivados.funnel.p_compra_dado_checkout).toBe(0.25);
  });

  it("la facturación declarada de la tienda le gana a la derivada del mix", () => {
    const r = calcularDiagnostico({ ...mixto, canal_tienda_facturacion: 4_500_000 }, cfg);
    expect(r.derivados.funnel.compras).toBe(225);
    expect(r.derivados.cr_tienda).toBe(0.0015);
  });

  it("con canales declarados y sin porcentaje de tienda, no cae a la facturación total", () => {
    const f = evaluarFunnel({ ...mixto, canal_tienda_pct: null });
    expect(f.compras).toBeNull();
    expect(f.estado).toBe("sin_datos");
    expect(f.faltantes).toEqual(["canal_tienda_facturacion", "canal_tienda_pct", "ticket_promedio"]);
  });

  it("sin canales declarados se conserva la facturación total", () => {
    const f = evaluarFunnel({ ...mixto, canal_tienda_pct: null, canal_ml_pct: null });
    expect(f.compras).toBe(500);
  });
});
