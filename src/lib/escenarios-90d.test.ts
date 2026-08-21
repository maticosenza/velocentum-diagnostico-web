import { describe, expect, it } from "vitest";
import { calcularDiagnostico, type ConfiguracionCalculo } from "./calculo-diagnostico";
import {
  RAMPAS_ESCENARIO_90D_DEFECTO,
  calcularEscenarios90d,
  rampaDe,
  type ConfigEscenarios90d,
} from "./escenarios-90d";
import type { DatosDiagnostico } from "./diagnostico-form";
import { casoSnakeStore } from "./fixtures-casos";

const cfg: ConfiguracionCalculo = {
  reserva_default: 0.35,
  comision_plataforma: { tiendanube_inicial: 0.02, tiendanube_esencial: 0.01 },
  comision_pasarela: { mercado_pago: 0.05 },
  umbrales_cr_por_ticket: [{ hasta: null, verde: 0.018, rojo: 0.01 }],
  delta_medicion: { verde: 0.1, rojo: 0.2 },
  tope_fuga_individual: 0.25,
  tope_fuga_total: 0.4,
  mejora_agregado_pts: 2,
  mejora_checkout_pts: 10,
  mejora_compra_pts: 10,
};

/** Snake Store con funnel completo y coherente: genera fugas de funnel calculables. */
const casoConFunnel: DatosDiagnostico = {
  ...casoSnakeStore,
  facturacion_mensual: 22_522_600, // 100 pedidos al ticket de Snake Store
  visitas_mensuales: 5000,
  agregados_carrito: 1000,
  checkouts_iniciados: 300,
};

function resultadoConFunnel() {
  return calcularDiagnostico(casoConFunnel, cfg);
}

describe("calcularEscenarios90d", () => {
  it("reutiliza la misma oportunidad mensual para los tres escenarios: sólo cambia el ritmo", () => {
    const resultado = resultadoConFunnel();
    const escenarios = calcularEscenarios90d(casoConFunnel, resultado);
    const [conservador, base, potencial] = escenarios;

    expect(conservador!.calculable).toBe(true);
    expect(base!.calculable).toBe(true);
    expect(potencial!.calculable).toBe(true);

    const oportunidadTotal = resultado.oportunidad_total;
    expect(oportunidadTotal).toBeGreaterThan(0);

    // Mes 3 de "base" y "potencial" llega al 100% de la oportunidad; conservador sólo al 75%.
    expect(base!.mensual[2]!.oportunidadHabilitada).toBe(oportunidadTotal);
    expect(potencial!.mensual[2]!.oportunidadHabilitada).toBe(oportunidadTotal);
    expect(conservador!.mensual[2]!.oportunidadHabilitada).toBe(
      Math.round(oportunidadTotal * 0.75),
    );

    // Las palancas listadas son exactamente las fugas calculables del motor: nada inventado.
    const idsFugasCalculables = resultado.fugas
      .filter((f) => f.calculable && typeof f.monto === "number" && f.monto > 0)
      .map((f) => f.id)
      .sort();
    expect(base!.palancas.map((p) => p.id).sort()).toEqual(idsFugasCalculables);
    expect(potencial!.palancas.map((p) => p.id).sort()).toEqual(idsFugasCalculables);
  });

  it("el mes 1 es más bajo que el mes 3 en cada escenario, según la rampa aprobada", () => {
    const resultado = resultadoConFunnel();
    const [conservador, base, potencial] = calcularEscenarios90d(casoConFunnel, resultado);

    for (const escenario of [conservador!, base!, potencial!]) {
      expect(escenario.mensual[0]!.oportunidadHabilitada).toBeLessThanOrEqual(
        escenario.mensual[1]!.oportunidadHabilitada,
      );
      expect(escenario.mensual[1]!.oportunidadHabilitada).toBeLessThanOrEqual(
        escenario.mensual[2]!.oportunidadHabilitada,
      );
    }

    // Potencial adopta más rápido que base, que adopta más rápido que conservador.
    expect(potencial!.mensual[0]!.oportunidadHabilitada).toBeGreaterThanOrEqual(
      base!.mensual[0]!.oportunidadHabilitada,
    );
    expect(base!.mensual[0]!.oportunidadHabilitada).toBeGreaterThanOrEqual(
      conservador!.mensual[0]!.oportunidadHabilitada,
    );
  });

  it("la facturación proyectada de cada mes es la facturación actual más la oportunidad habilitada ese mes", () => {
    const resultado = resultadoConFunnel();
    const [, base] = calcularEscenarios90d(casoConFunnel, resultado);
    for (const mes of base!.mensual) {
      expect(mes.facturacionProyectada).toBe(
        (casoConFunnel.facturacion_mensual as number) + mes.oportunidadHabilitada,
      );
    }
  });

  it("el acumulado de 90 días es la suma de los tres meses, no el ritmo mensual del día 90 multiplicado por 3", () => {
    const resultado = resultadoConFunnel();
    const [conservador] = calcularEscenarios90d(casoConFunnel, resultado);
    const sumaMeses = conservador!.mensual.reduce((acc, m) => acc + m.oportunidadHabilitada, 0);
    expect(conservador!.acumulado90d).toBe(sumaMeses);
    expect(conservador!.acumulado90d).not.toBe(conservador!.ritmoMensualDia90! * 3);
  });

  it("retiene los tres escenarios cuando el margen está bloqueado por una contradicción crítica confirmada", () => {
    const datos: DatosDiagnostico = {
      ...casoConFunnel,
      margen_declarado_min: 90,
      margen_declarado_max: 90,
      margen_declarado_confirmado: true,
    };
    const resultado = calcularDiagnostico(datos, cfg);
    expect(resultado.margen_bloqueado).toBe(true);

    const escenarios = calcularEscenarios90d(datos, resultado);
    for (const escenario of escenarios) {
      expect(escenario.calculable).toBe(false);
      expect(escenario.motivo).toMatch(/contradice/);
      expect(escenario.mensual).toEqual([]);
      expect(escenario.acumulado90d).toBeNull();
      expect(escenario.ritmoMensualDia90).toBeNull();
    }
  });

  it("retiene los tres escenarios ante una contradicción sin confirmar (no sólo cuando bloquea)", () => {
    const datos: DatosDiagnostico = {
      ...casoConFunnel,
      margen_declarado_min: 90,
      margen_declarado_max: 90,
      margen_declarado_confirmado: false,
    };
    const resultado = calcularDiagnostico(datos, cfg);
    expect(resultado.margen_bloqueado).toBe(false);
    expect(resultado.contradiccion_margen?.nivel).toBe("critica");

    const escenarios = calcularEscenarios90d(datos, resultado);
    for (const escenario of escenarios) {
      expect(escenario.calculable).toBe(false);
      expect(escenario.motivo).toMatch(/no fue validada/);
    }
  });

  it("sin ninguna fuga calculable, retiene en vez de mostrar un acumulado en cero", () => {
    const resultado = calcularDiagnostico(casoSnakeStore, cfg);
    expect(resultado.fugas.some((f) => f.calculable && (f.monto ?? 0) > 0)).toBe(false);

    const escenarios = calcularEscenarios90d(casoSnakeStore, resultado);
    for (const escenario of escenarios) {
      expect(escenario.calculable).toBe(false);
      expect(escenario.motivo).toBe("No hay oportunidades calculables con los datos actuales.");
      // Nunca se confunde "no calculable" con un cero real.
      expect(escenario.acumulado90d).toBeNull();
    }
  });

  it("retiene cuando hay fuga calculable pero no se declaró la facturación mensual", () => {
    const datos: DatosDiagnostico = {
      ...casoSnakeStore,
      facturacion_mensual: null,
      conjuntos_activos: 20,
      presupuesto_diario: 1000,
    };
    const resultado = calcularDiagnostico(datos, cfg);
    expect(resultado.fugas.some((f) => f.id === "sobrefragmentacion" && f.calculable)).toBe(true);

    const escenarios = calcularEscenarios90d(datos, resultado);
    for (const escenario of escenarios) {
      expect(escenario.calculable).toBe(false);
      expect(escenario.motivo).toBe("No se declaró la facturación mensual.");
    }
  });

  it("ninguna mejora de conversión puede llevar una tasa por encima del 100%: no genera escenarios irreales", () => {
    // El techo ya vive en `tramosFunnel` (funnel.ts); acá sólo se confirma que
    // el motor de escenarios no reintroduce el problema al escalar por mes.
    const resultado = resultadoConFunnel();
    const [, , potencial] = calcularEscenarios90d(casoConFunnel, resultado);
    expect(potencial!.ritmoMensualDia90).toBe(resultado.oportunidad_total);
  });
});

describe("reglas comerciales aprobadas 2026-08-21", () => {
  it("el escenario potencial nunca incorpora una palanca fuera de las fugas detectadas por el motor", () => {
    // Regla 2: contenido, stock y capacidad operativa son condiciones de
    // viabilidad, nunca generadores directos de facturación en el escenario.
    const resultado = resultadoConFunnel();
    const [, , potencial] = calcularEscenarios90d(casoConFunnel, resultado);
    const idsFugasCalculables = resultado.fugas
      .filter((f) => f.calculable && typeof f.monto === "number" && f.monto > 0)
      .map((f) => f.id)
      .sort();
    expect(potencial!.palancas.map((p) => p.id).sort()).toEqual(idsFugasCalculables);
    // Ninguna palanca del escenario potencial excede la fuga que la originó,
    // aun en el mes de mayor adopción (100%): no se infla nada.
    for (const palanca of potencial!.palancas) {
      const fuga = resultado.fugas.find((f) => f.id === palanca.id)!;
      expect(palanca.contribucionMensualDia90).toBeLessThanOrEqual(fuga.monto as number);
    }
  });

  it("Meta y Google se tratan como pool combinado: invertir el reparto entre ambos no cambia la proyección", () => {
    // Regla 3: nunca se suman conversiones declaradas por separado de Meta y
    // Google. El motor de escenarios ni siquiera lee inversion_meta/inversion_google
    // por separado: sólo consume las fugas ya calculadas sobre el pool combinado.
    const base: DatosDiagnostico = {
      ...casoConFunnel,
      inversion_meta: 300_000,
      inversion_google: 100_000,
    };
    const invertido: DatosDiagnostico = {
      ...casoConFunnel,
      inversion_meta: 100_000,
      inversion_google: 300_000,
    };

    const escenariosBase = calcularEscenarios90d(base, calcularDiagnostico(base, cfg));
    const escenariosInvertido = calcularEscenarios90d(invertido, calcularDiagnostico(invertido, cfg));

    expect(escenariosInvertido.map((e) => e.acumulado90d)).toEqual(
      escenariosBase.map((e) => e.acumulado90d),
    );
    expect(escenariosInvertido.map((e) => e.ritmoMensualDia90)).toEqual(
      escenariosBase.map((e) => e.ritmoMensualDia90),
    );
  });
});

describe("rampaDe", () => {
  it("usa el valor por defecto aprobado cuando la configuración no trae una rampa", () => {
    expect(rampaDe({}, "conservador")).toEqual(RAMPAS_ESCENARIO_90D_DEFECTO.conservador);
    expect(rampaDe({}, "base")).toEqual(RAMPAS_ESCENARIO_90D_DEFECTO.base);
    expect(rampaDe({}, "potencial")).toEqual(RAMPAS_ESCENARIO_90D_DEFECTO.potencial);
  });

  it("usa la rampa de configuración cuando está completa y es numérica", () => {
    const cfgPersonalizada: ConfigEscenarios90d = {
      rampa_escenario_base: { mes1: 0.1, mes2: 0.2, mes3: 0.3 },
    };
    expect(rampaDe(cfgPersonalizada, "base")).toEqual({ mes1: 0.1, mes2: 0.2, mes3: 0.3 });
    // Las rampas no configuradas siguen en su valor por defecto.
    expect(rampaDe(cfgPersonalizada, "conservador")).toEqual(
      RAMPAS_ESCENARIO_90D_DEFECTO.conservador,
    );
  });

  it("ignora una rampa incompleta o no numérica de la configuración y usa el default", () => {
    const invalida = { rampa_escenario_potencial: { mes1: 0.5 } } as ConfigEscenarios90d;
    expect(rampaDe(invalida, "potencial")).toEqual(RAMPAS_ESCENARIO_90D_DEFECTO.potencial);
  });
});
