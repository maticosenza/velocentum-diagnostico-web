import { describe, expect, it } from "vitest";
import {
  FUGA_LEGADA_MANUAL,
  FUNNEL_MANUAL,
  RETENIDO_NO_ES_CERO_MANUAL,
} from "./fixtures-impactos-manual";
import {
  impactoCalculado,
  impactoRetenido,
  impactosDeFuga,
  impactosDeFugaLegado,
  sumarImpactosPorTipo,
  tieneImpactosTipados,
  type ImpactoEconomico,
} from "./impacto-economico";

describe("impactoCalculado / impactoRetenido", () => {
  it("un impacto calculado nunca lleva motivoRetencion", () => {
    const impacto = impactoCalculado({
      tipo: "facturacion_incremental",
      montoMensual: 90_000,
      confianza: "alta",
      dependencias: ["ticket_promedio"],
    });
    expect(impacto).toEqual({
      tipo: "facturacion_incremental",
      montoMensual: 90_000,
      moneda: "ARS",
      periodo: "mensual",
      confianza: "alta",
      dependencias: ["ticket_promedio"],
    });
  });

  it("un cero real es un impacto calculado, no retenido", () => {
    const impacto = impactoCalculado({
      tipo: "facturacion_incremental",
      montoMensual: RETENIDO_NO_ES_CERO_MANUAL.ceroReal.facturacionIncrementalEsperada,
      confianza: "alta",
    });
    expect(impacto.montoMensual).toBe(0);
    expect(impacto.confianza).not.toBe("retenida");
  });

  it("un impacto retenido nunca lleva un monto numérico", () => {
    const impacto = impactoRetenido({
      tipo: "contribucion_incremental",
      motivo: RETENIDO_NO_ES_CERO_MANUAL.retenido.motivo,
    });
    expect(impacto.montoMensual).toBeNull();
    expect(impacto.confianza).toBe("retenida");
    expect(impacto.motivoRetencion).toBe(RETENIDO_NO_ES_CERO_MANUAL.retenido.motivo);
  });

  it("cero real y retenido nunca son el mismo objeto: 0 !== null", () => {
    const ceroReal = impactoCalculado({
      tipo: "facturacion_incremental",
      montoMensual: 0,
      confianza: "alta",
    });
    const retenido = impactoRetenido({
      tipo: "contribucion_incremental",
      motivo: "sin margen",
    });
    expect(ceroReal.montoMensual).toBe(0);
    expect(retenido.montoMensual).toBeNull();
    expect(ceroReal.montoMensual).not.toBe(retenido.montoMensual);
  });
});

describe("compatibilidad con diagnósticos legados", () => {
  it("una fuga sin `impactos` no se reclasifica: queda no_clasificado y retenida", () => {
    const impactos = impactosDeFugaLegado(FUGA_LEGADA_MANUAL.fugaPersistida);
    expect(impactos).toHaveLength(1);
    expect(impactos[0]).toMatchObject(FUGA_LEGADA_MANUAL.impactoEsperado);
    expect(impactos[0]!.motivoRetencion).toContain("50000");
  });

  it("tieneImpactosTipados distingue una fuga nueva de una legada", () => {
    expect(tieneImpactosTipados(FUGA_LEGADA_MANUAL.fugaPersistida)).toBe(false);
    expect(
      tieneImpactosTipados({
        monto: 50_000,
        impactos: [impactoCalculado({ tipo: "ahorro_publicitario", montoMensual: 1, confianza: "alta" })],
      }),
    ).toBe(true);
  });

  it("impactosDeFuga usa los impactos tipados cuando existen, y el adaptador legado cuando no", () => {
    const nuevo = impactoCalculado({
      tipo: "ahorro_publicitario",
      montoMensual: 10_000,
      confianza: "alta",
    });
    expect(impactosDeFuga({ monto: 10_000, impactos: [nuevo] })).toEqual([nuevo]);
    expect(impactosDeFuga(FUGA_LEGADA_MANUAL.fugaPersistida)).toEqual(
      impactosDeFugaLegado(FUGA_LEGADA_MANUAL.fugaPersistida),
    );
  });

  it("un monto legado nunca se reinterpreta como facturación, contribución o ahorro", () => {
    const impactos = impactosDeFuga(FUGA_LEGADA_MANUAL.fugaPersistida);
    expect(impactos.every((i) => i.tipo === "no_clasificado")).toBe(true);
    expect(impactos.some((i) => i.montoMensual === FUGA_LEGADA_MANUAL.fugaPersistida.monto)).toBe(
      false,
    );
  });
});

describe("sumarImpactosPorTipo", () => {
  const impactoFacturacion = (montoMensual: number): ImpactoEconomico =>
    impactoCalculado({ tipo: "facturacion_incremental", montoMensual, confianza: "alta" });

  it("suma los tres tramos disjuntos del funnel: coincide con la cuenta manual", () => {
    const porFuga = [
      [impactoFacturacion(FUNNEL_MANUAL.facturacionIncrementalPorTramo.funnel_navegacion)],
      [impactoFacturacion(FUNNEL_MANUAL.facturacionIncrementalPorTramo.funnel_carrito)],
      [impactoFacturacion(FUNNEL_MANUAL.facturacionIncrementalPorTramo.funnel_checkout)],
    ];
    const agregado = sumarImpactosPorTipo(porFuga, "facturacion_incremental");
    expect(agregado).toEqual({
      calculable: true,
      montoMensual: FUNNEL_MANUAL.totales.facturacionIncremental,
    });
  });

  it("nunca mezcla facturación con contribución al sumar por tipo", () => {
    const porFuga = [
      [
        impactoFacturacion(FUNNEL_MANUAL.facturacionIncrementalPorTramo.funnel_navegacion),
        impactoCalculado({
          tipo: "contribucion_incremental",
          montoMensual: FUNNEL_MANUAL.contribucionIncrementalPorTramo.funnel_navegacion,
          confianza: "alta",
        }),
      ],
    ];
    const facturacion = sumarImpactosPorTipo(porFuga, "facturacion_incremental");
    const contribucion = sumarImpactosPorTipo(porFuga, "contribucion_incremental");
    expect(facturacion).toEqual({
      calculable: true,
      montoMensual: FUNNEL_MANUAL.facturacionIncrementalPorTramo.funnel_navegacion,
    });
    expect(contribucion).toEqual({
      calculable: true,
      montoMensual: FUNNEL_MANUAL.contribucionIncrementalPorTramo.funnel_navegacion,
    });
    expect((facturacion as { montoMensual: number }).montoMensual).not.toBe(
      (contribucion as { montoMensual: number }).montoMensual,
    );
  });

  it("sin ningún impacto del tipo pedido, no es calculable (nunca cero)", () => {
    const agregado = sumarImpactosPorTipo([[impactoFacturacion(1000)]], "ahorro_publicitario");
    expect(agregado.calculable).toBe(false);
  });

  it("si algún impacto del tipo está retenido, el agregado completo queda retenido", () => {
    const porFuga = [
      [impactoFacturacion(1000)],
      [impactoRetenido({ tipo: "facturacion_incremental", motivo: "Falta el ticket promedio." })],
    ];
    const agregado = sumarImpactosPorTipo(porFuga, "facturacion_incremental");
    expect(agregado).toEqual({ calculable: false, motivo: "Falta el ticket promedio." });
  });

  it("no_clasificado nunca participa de una suma por tipo clasificado", () => {
    const legado = impactosDeFugaLegado({ monto: 999_999 });
    const agregado = sumarImpactosPorTipo(
      [legado, [impactoFacturacion(500)]],
      "facturacion_incremental",
    );
    expect(agregado).toEqual({ calculable: true, montoMensual: 500 });
  });
});
