import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "./calculo-diagnostico";
import {
  casoSnakeStore,
  casoTitanWebB1,
  casoTitanWebB1AntesDeCanales,
  casoTitanWebB2Pendiente,
  configuracionRegresionFase2,
  esperadosFase2,
} from "./fixtures-casos";

describe("regresion conjunta de la fase 2", () => {
  it("caso A · Snake Store conserva envio, margen y breakeven", () => {
    const r = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2);
    const esperado = esperadosFase2.snakeStore;

    expect(r.derivados.componente_envio).toBe(esperado.componenteEnvio);
    expect(r.derivados.margenes_producto).toEqual(esperado.margenesProducto);
    expect(r.derivados.margen_contribucion).toBe(esperado.margenContribucion);
    expect(r.derivados.breakeven_roas).toBe(esperado.breakevenRoas);
  });

  it("caso B1 · Titan Web conserva margen de marketplace y Product Ads", () => {
    const r = calcularDiagnostico(casoTitanWebB1, configuracionRegresionFase2);
    const esperado = esperadosFase2.titanWebB1ConComisionMarketplace;
    const ml = r.derivados.canales.find((canal) => canal.id === "mercado_libre")!;

    expect(ml.margenes_producto).toEqual(esperado.margenesProducto);
    expect(r.derivados.margen_contribucion).toBe(esperado.margenContribucion);
    expect(r.derivados.mer_marketplace).toBe(esperado.merMarketplace);
    expect(r.derivados.inversion_publicitaria_total).toBe(1_800_000);
    expect(r.derivados.roas_product_ads).toBeNull();
  });

  it("caso B1 · el intermedio previo a comisiones sigue siendo auditable", () => {
    const r = calcularDiagnostico(casoTitanWebB1AntesDeCanales, configuracionRegresionFase2);
    const esperado = esperadosFase2.titanWebB1AntesDeComisionMarketplace;

    expect(r.derivados.componente_envio).toBe(esperado.componenteEnvio);
    expect(r.derivados.margenes_producto).toEqual(esperado.margenesProducto);
    expect(r.derivados.margen_contribucion).toBe(esperado.margenContribucion);
    expect(r.derivados.breakeven_roas).toBe(esperado.breakevenRoas);
  });

  it("el bloqueo de B2 declara exactamente los datos que faltan", () => {
    expect(casoTitanWebB2Pendiente.estado).toBe("pendiente_verificacion");
    expect(casoTitanWebB2Pendiente.faltantes).toEqual([
      "envio_neto_vendedor",
      "liquidacion_mercado_libre",
    ]);
  });

  it.todo("caso B2 · regresion con envio neto y liquidacion verificados");
});
