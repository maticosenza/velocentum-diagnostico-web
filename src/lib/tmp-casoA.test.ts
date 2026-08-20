import { it } from "vitest";
import { calcularDiagnostico } from "./calculo-diagnostico";
import { DATOS_INICIALES } from "./diagnostico-form";
const cfg = { comision_plataforma: { tiendanube_inicial: 0.02 }, comision_pasarela: { mercado_pago: 0.05 } };
it("a", () => {
  const r = calcularDiagnostico({ ...DATOS_INICIALES, plataforma: "tiendanube", plan_plataforma: "inicial", pasarela: "mercado_pago", ticket_promedio: 225226, costo_envio_promedio: 11000, producto_1_costo: 40000, producto_1_precio: 180000, producto_2_costo: 35000, producto_2_precio: 125000, producto_3_costo: 20000, producto_3_precio: 85000 }, cfg);
  console.log("MARGEN", r.derivados.margen_contribucion, "BE", r.derivados.breakeven_roas, r.derivados.pesos_producto);
});
