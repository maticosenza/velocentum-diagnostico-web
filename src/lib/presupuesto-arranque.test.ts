/**
 * Fase 6 (presupuesto de arranque, 2026-08-21): separa el piso teórico
 * optimizando por compra del presupuesto de arranque optimizando por un
 * evento intermedio, junto con los supuestos usados y el nivel de confianza.
 * Sin historial propio de costo por evento intermedio, ese presupuesto se
 * muestra siempre como rango, nunca como cifra única, y el costo por evento
 * sale de configuración marcado como benchmark.
 */
import { describe, expect, it } from "vitest";
import {
  calcularDiagnostico,
  FACTOR_COSTO_EVENTO_INTERMEDIO_DEFECTO,
  MARGEN_INCERTIDUMBRE_PRESUPUESTO_DEFECTO,
  type ConfiguracionCalculo,
} from "./calculo-diagnostico";
import { redondear } from "./dinero";
import { DATOS_INICIALES, type DatosDiagnostico } from "./diagnostico-form";

const cfg: ConfiguracionCalculo = {
  reserva_default: 0.35,
  comision_plataforma: { tiendanube_esencial: 0.01 },
  comision_pasarela: { mercado_pago: 0.05 },
};

const base: DatosDiagnostico = {
  ...DATOS_INICIALES,
  nombre_tienda: "Tienda de prueba",
  plataforma: "tiendanube",
  plan_plataforma: "esencial",
  pasarela: "mercado_pago",
  ticket_promedio: 45000,
  costo_envio_promedio: 3000,
  producto_1_nombre: "Producto principal",
  producto_1_costo: 20250,
  producto_1_precio: 45000,
};

describe("presupuesto de arranque: piso teórico vs. evento intermedio", () => {
  it("expone el piso teórico (compra) igual al ya existente piso_mensual_un_conjunto", () => {
    const r = calcularDiagnostico(base, cfg);
    expect(r.derivados.presupuesto_arranque.piso_teorico_compra).toBe(
      r.derivados.piso_mensual_un_conjunto,
    );
  });

  it("el presupuesto de arranque por evento intermedio nunca es una cifra única: siempre un rango", () => {
    const r = calcularDiagnostico(base, cfg);
    const rango = r.derivados.presupuesto_arranque.arranque_evento_intermedio;
    expect(rango).not.toBeNull();
    expect(rango!.bajo).toBeLessThan(rango!.alto);
  });

  it("usa el benchmark por defecto (20% del CPA, ±20% de incertidumbre) sin configuración", () => {
    const r = calcularDiagnostico(base, cfg);
    const piso = r.derivados.piso_mensual_un_conjunto!;
    const pisoEventoIntermedio = piso * FACTOR_COSTO_EVENTO_INTERMEDIO_DEFECTO;
    const bajoEsperado = redondear(
      pisoEventoIntermedio * (1 - MARGEN_INCERTIDUMBRE_PRESUPUESTO_DEFECTO),
      0,
    );
    const altoEsperado = redondear(
      pisoEventoIntermedio * (1 + MARGEN_INCERTIDUMBRE_PRESUPUESTO_DEFECTO),
      0,
    );
    expect(r.derivados.presupuesto_arranque.arranque_evento_intermedio).toEqual({
      bajo: bajoEsperado,
      alto: altoEsperado,
    });
  });

  it("un factor y un margen de incertidumbre distintos en configuración cambian el rango", () => {
    const r = calcularDiagnostico(base, {
      ...cfg,
      factor_costo_evento_intermedio: 0.1,
      margen_incertidumbre_presupuesto: 0.5,
    });
    const piso = r.derivados.piso_mensual_un_conjunto!;
    const pisoEventoIntermedio = piso * 0.1;
    expect(r.derivados.presupuesto_arranque.arranque_evento_intermedio).toEqual({
      bajo: redondear(pisoEventoIntermedio * 0.5, 0),
      alto: redondear(pisoEventoIntermedio * 1.5, 0),
    });
  });

  it("declara los supuestos usados: reserva, heurística de 50/semana, factor de evento intermedio y rango", () => {
    const r = calcularDiagnostico(base, cfg);
    const supuestos = r.derivados.presupuesto_arranque.supuestos.join(" | ");
    expect(supuestos).toMatch(/reserva de 35%/);
    expect(supuestos).toMatch(/50 conversiones por semana/);
    expect(supuestos).toMatch(/20% del CPA objetivo/);
    expect(supuestos).toMatch(/benchmark de configuración/);
    expect(supuestos).toMatch(/incertidumbre de ±20%/);
  });

  it("la confianza nunca es alta: depende de un benchmark sin verificar", () => {
    const r = calcularDiagnostico(base, cfg);
    expect(r.derivados.presupuesto_arranque.confianza).not.toBe("alta");
  });

  it("sin CPA objetivo calculable, todo el bloque queda sin datos y con confianza baja", () => {
    const r = calcularDiagnostico({ ...base, ticket_promedio: null }, cfg);
    expect(r.derivados.cpa_objetivo).toBeNull();
    expect(r.derivados.presupuesto_arranque.piso_teorico_compra).toBeNull();
    expect(r.derivados.presupuesto_arranque.arranque_evento_intermedio).toBeNull();
    expect(r.derivados.presupuesto_arranque.supuestos).toEqual([]);
    expect(r.derivados.presupuesto_arranque.confianza).toBe("baja");
  });

  it("los campos preexistentes (piso_mensual_un_conjunto, inversion_actual_mensual, volumen_suficiente) no cambian", () => {
    const r = calcularDiagnostico(base, cfg);
    expect(typeof r.derivados.piso_mensual_un_conjunto).toBe("number");
    expect(r.derivados.inversion_actual_mensual).toBeNull();
    // Sin facturación mensual cargada, no se sabe (ni se afirma) si el volumen alcanza.
    expect(r.derivados.volumen_suficiente).toBeNull();
  });
});
