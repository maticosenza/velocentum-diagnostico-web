import { describe, expect, it } from "vitest";
import { FUNNEL_MANUAL, RETENIDO_NO_ES_CERO_MANUAL } from "./fixtures-impactos-manual";
import { tramosFunnel, type FunnelDerivado } from "./funnel";
import { sumarImpactosPorTipo } from "./impacto-economico";

/**
 * Funnel construido a mano (no via `evaluarFunnel`), igual al fixture de
 * `fixtures-impactos-manual.ts`: visitas 10.000, agregados 1.000, checkouts
 * 200, compras 100. Bypassa la cascada completa de comisiones/envío para que
 * el margen sea un parámetro directo, tal como lo recibe `tramosFunnel` hoy.
 */
function funnelManual(overrides: Partial<FunnelDerivado> = {}): FunnelDerivado {
  const { entrada } = FUNNEL_MANUAL;
  return {
    estado: "calculado",
    visitas: entrada.visitas,
    agregados_carrito: entrada.agregados_carrito,
    checkouts_iniciados: entrada.checkouts_iniciados,
    compras: entrada.compras,
    p_checkout_dado_carrito: entrada.p_checkout_dado_carrito,
    p_compra_dado_checkout: entrada.p_compra_dado_checkout,
    p_carrito_dado_visita: entrada.p_carrito_dado_visita,
    cr_global: entrada.cr_global,
    etapa_error: null,
    error: null,
    faltantes: [],
    desglosado: true,
    ticket: FUNNEL_MANUAL.ticket,
    exactas: {
      p_carrito_dado_visita: entrada.p_carrito_dado_visita,
      p_checkout_dado_carrito: entrada.p_checkout_dado_carrito,
      p_compra_dado_checkout: entrada.p_compra_dado_checkout,
      cr_global: entrada.cr_global,
    },
    ...overrides,
  };
}

describe("tramosFunnel: facturación incremental vs. contribución incremental", () => {
  it("cada tramo separa facturación (unidades × ticket) de contribución (× margen), como en la cuenta manual", () => {
    const tramos = tramosFunnel(funnelManual(), {}, FUNNEL_MANUAL.margen);
    const porId = Object.fromEntries(tramos.map((t) => [t.id, t]));

    for (const id of ["funnel_navegacion", "funnel_carrito", "funnel_checkout"] as const) {
      const tramo = porId[id]!;
      const facturacion = tramo.impactos.find((i) => i.tipo === "facturacion_incremental")!;
      const contribucion = tramo.impactos.find((i) => i.tipo === "contribucion_incremental")!;

      expect(facturacion.montoMensual).toBe(FUNNEL_MANUAL.facturacionIncrementalPorTramo[id]);
      expect(contribucion.montoMensual).toBe(FUNNEL_MANUAL.contribucionIncrementalPorTramo[id]);
      // El monto legado (contribución) no cambia con este modelo.
      expect(tramo.monto).toBe(FUNNEL_MANUAL.contribucionIncrementalPorTramo[id]);
      // Nunca son el mismo número (salvo que ambos sean 0, que no es este caso).
      expect(facturacion.montoMensual).not.toBe(contribucion.montoMensual);
    }
  });

  it("los tres tramos son disjuntos: la suma de facturación incremental coincide con la cuenta manual", () => {
    const tramos = tramosFunnel(funnelManual(), {}, FUNNEL_MANUAL.margen);
    const agregadoFacturacion = sumarImpactosPorTipo(
      tramos.map((t) => t.impactos),
      "facturacion_incremental",
    );
    const agregadoContribucion = sumarImpactosPorTipo(
      tramos.map((t) => t.impactos),
      "contribucion_incremental",
    );

    expect(agregadoFacturacion).toEqual({
      calculable: true,
      montoMensual: FUNNEL_MANUAL.totales.facturacionIncremental,
    });
    expect(agregadoContribucion).toEqual({
      calculable: true,
      montoMensual: FUNNEL_MANUAL.totales.contribucionIncremental,
    });

    // Lo que nunca debe aparecer: tratar ambas magnitudes como una sola suma.
    const sumaIncompatible =
      (agregadoFacturacion as { montoMensual: number }).montoMensual +
      (agregadoContribucion as { montoMensual: number }).montoMensual;
    expect(sumaIncompatible).toBe(FUNNEL_MANUAL.sumaIncompatibleQueNuncaDebeAparecer);
    // Ningún tramo ni total debe ser jamás igual a esa suma incompatible.
    for (const tramo of tramos) {
      expect(tramo.monto).not.toBe(FUNNEL_MANUAL.sumaIncompatibleQueNuncaDebeAparecer);
    }
  });

  it("sin ticket promedio se retiene facturación incremental (y por lo tanto contribución)", () => {
    const tramos = tramosFunnel(funnelManual({ ticket: null }), {}, FUNNEL_MANUAL.margen);
    for (const tramo of tramos) {
      const facturacion = tramo.impactos.find((i) => i.tipo === "facturacion_incremental")!;
      const contribucion = tramo.impactos.find((i) => i.tipo === "contribucion_incremental")!;
      expect(facturacion.confianza).toBe("retenida");
      expect(facturacion.montoMensual).toBeNull();
      expect(facturacion.motivoRetencion).toMatch(/ticket/);
      expect(contribucion.confianza).toBe("retenida");
      expect(contribucion.montoMensual).toBeNull();
      // El monto legado sigue null también: no cambia el comportamiento previo.
      expect(tramo.monto).toBeNull();
      expect(tramo.calculable).toBe(false);
    }
  });

  it("sin margen se retiene sólo contribución incremental: facturación incremental se sigue publicando", () => {
    const tramos = tramosFunnel(funnelManual(), {}, null);
    for (const tramo of tramos) {
      const facturacion = tramo.impactos.find((i) => i.tipo === "facturacion_incremental")!;
      const contribucion = tramo.impactos.find((i) => i.tipo === "contribucion_incremental")!;

      expect(facturacion.confianza).not.toBe("retenida");
      expect(facturacion.montoMensual).toBeGreaterThan(0);
      expect(contribucion.confianza).toBe("retenida");
      expect(contribucion.montoMensual).toBeNull();
      expect(contribucion.motivoRetencion).toMatch(/margen/);

      // El monto legado (que siempre fue contribución) sigue retenido, sin
      // cambiar el comportamiento previo a este modelo.
      expect(tramo.monto).toBeNull();
      expect(tramo.calculable).toBe(false);
    }
  });

  it("un tramo en cero real (unidades = 0) nunca se confunde con un tramo retenido", () => {
    // Checkout: 0 checkouts iniciados -> unidades del tramo checkout = 0 (real),
    // sin importar la probabilidad de compra.
    const tramos = tramosFunnel(
      funnelManual({ checkouts_iniciados: 0 }),
      {},
      null, // margen ausente: fuerza además el caso "retenido" en el mismo tramo
    );
    const checkout = tramos.find((t) => t.id === "funnel_checkout")!;
    const facturacion = checkout.impactos.find((i) => i.tipo === "facturacion_incremental")!;
    const contribucion = checkout.impactos.find((i) => i.tipo === "contribucion_incremental")!;

    // Cero real: unidades=0 -> facturación incremental = 0, con confianza "alta".
    expect(facturacion.montoMensual).toBe(RETENIDO_NO_ES_CERO_MANUAL.ceroReal.facturacionIncrementalEsperada);
    expect(facturacion.confianza).toBe("alta");
    // Retenido: sin margen, contribución no es 0, es null.
    expect(contribucion.montoMensual).toBeNull();
    expect(contribucion.confianza).toBe("retenida");
    expect(facturacion.montoMensual).not.toBe(contribucion.montoMensual);
  });
});
