/**
 * Sección Presupuesto de la pantalla de detalle. Si el motor dice que el
 * negocio no llega a las compras semanales de un conjunto optimizado por
 * compra (`volumen_suficiente === false`), el piso por compra no se presenta
 * como la recomendación: manda el arranque por evento intermedio y el piso
 * queda como referencia. Caso 1ac7186c: 147 pedidos al mes, 34,2 por semana,
 * piso de $20.112.431 contra una oportunidad total de $423.117.
 */
import { describe, expect, it } from "vitest";
import type { Derivados } from "./calculo-diagnostico";
import { CASO_1AC7186C as caso } from "./fixtures-caso-1ac7186c";
import { COMPRAS_SEMANALES_POR_CONJUNTO, vistaPresupuesto } from "./vista-diagnostico";

const con = (parcial: Partial<Derivados>) =>
  ({ ...caso.derivados, ...parcial }) as unknown as Derivados;

describe("vistaPresupuesto", () => {
  it("caso 1ac7186c: sin volumen, el piso por compra queda como referencia con las compras que faltan", () => {
    const v = vistaPresupuesto(caso.derivados);
    expect(v.sinVolumen).toBe(true);
    expect(v.comprasSemanales).toBe(34.2);
    expect(v.notaReferencia).toContain(`${COMPRAS_SEMANALES_POR_CONJUNTO} compras por semana`);
    expect(v.notaReferencia).toContain("hoy el negocio hace 34,2");
    expect(v.notaReferencia).toContain("referencia");
  });

  it("con volumen suficiente la sección se ve como siempre", () => {
    const v = vistaPresupuesto(con({ volumen_suficiente: true, pedidos_semanales: 60 }));
    expect(v).toEqual({ sinVolumen: false, comprasSemanales: 60, notaReferencia: null });
  });

  it("sin saber el volumen (null o guardado antes del campo) no afirma nada", () => {
    expect(vistaPresupuesto(con({ volumen_suficiente: null })).sinVolumen).toBe(false);
    expect(vistaPresupuesto(con({ volumen_suficiente: null })).notaReferencia).toBeNull();
    const { volumen_suficiente: _, ...viejo } = caso.derivados as Derivados;
    expect(vistaPresupuesto(viejo as Derivados).sinVolumen).toBe(false);
    expect(vistaPresupuesto(null).sinVolumen).toBe(false);
  });

  it("lee las compras semanales de los derivados; sólo sin ellas las deriva de los pedidos mensuales", () => {
    // Un valor que no sale de 147 / 4,3: prueba que se lee, no se recalcula.
    expect(vistaPresupuesto(con({ pedidos_semanales: 30 })).comprasSemanales).toBe(30);
    const sinSemanales = con({ pedidos_semanales: null });
    expect(vistaPresupuesto(sinSemanales).comprasSemanales).toBe(34.2);
  });

  it("sin compras semanales ni pedidos, la nota no inventa un número", () => {
    const v = vistaPresupuesto(con({ pedidos_semanales: null, pedidos_mensuales: null }));
    expect(v.comprasSemanales).toBeNull();
    expect(v.notaReferencia).toContain("hoy el negocio no llega a ese volumen");
  });
});
