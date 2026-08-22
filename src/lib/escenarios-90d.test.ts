import { describe, expect, it } from "vitest";
import { calcularDiagnostico, type ConfiguracionCalculo } from "./calculo-diagnostico";
import {
  FACTURACION_PROYECTADA_MANUAL,
  MISMA_BASE_CURVAS_DISTINTAS,
  RAMPA_AHORRO_CONSERVADOR_SOBRE_40000,
  RAMPA_CONTRIBUCION_CONSERVADOR_SOBRE_45000,
  RAMPA_FACTURACION_CONSERVADOR_SOBRE_90000,
} from "./fixtures-impactos-manual";
import {
  DISPERSION_CURVAS_APROBADAS_MANUAL,
  DISPERSION_CURVAS_RECONFIGURADAS_MANUAL,
  ESCENARIO_BASE_MANUAL,
} from "./fixtures-correccion-producto";
import {
  RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO,
  RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO,
  UMBRAL_DISPERSION_90D_DEFECTO,
  aplicarRampa,
  calcularEscenarios90d,
  evaluarDispersionContribucion,
  rampaAhorroPublicitarioDe,
  rampaFacturacionContribucionDe,
  umbralDispersionDe,
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

describe("aplicarRampa", () => {
  it("coincide con la cuenta manual de facturación (curva conservador sobre 90.000)", () => {
    const r = aplicarRampa(
      RAMPA_FACTURACION_CONSERVADOR_SOBRE_90000.base,
      RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO.conservador,
    );
    expect(r.mensual.map((m) => m.habilitado)).toEqual([
      RAMPA_FACTURACION_CONSERVADOR_SOBRE_90000.mes1,
      RAMPA_FACTURACION_CONSERVADOR_SOBRE_90000.mes2,
      RAMPA_FACTURACION_CONSERVADOR_SOBRE_90000.mes3,
    ]);
    expect(r.acumulado90d).toBe(RAMPA_FACTURACION_CONSERVADOR_SOBRE_90000.acumulado90d);
    expect(r.ritmoMensualDia90).toBe(RAMPA_FACTURACION_CONSERVADOR_SOBRE_90000.ritmoMensualDia90);
    // El acumulado nunca es el ritmo del mes 3 multiplicado por 3.
    expect(r.acumulado90d).not.toBe(r.ritmoMensualDia90 * 3);
  });

  it("coincide con la cuenta manual de contribución (misma curva, base distinta)", () => {
    const r = aplicarRampa(
      RAMPA_CONTRIBUCION_CONSERVADOR_SOBRE_45000.base,
      RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO.conservador,
    );
    expect(r.acumulado90d).toBe(RAMPA_CONTRIBUCION_CONSERVADOR_SOBRE_45000.acumulado90d);
    expect(r.ritmoMensualDia90).toBe(RAMPA_CONTRIBUCION_CONSERVADOR_SOBRE_45000.ritmoMensualDia90);
  });

  it("coincide con la cuenta manual de ahorro publicitario (curva propia)", () => {
    const r = aplicarRampa(
      RAMPA_AHORRO_CONSERVADOR_SOBRE_40000.base,
      RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO.conservador,
    );
    expect(r.acumulado90d).toBe(RAMPA_AHORRO_CONSERVADOR_SOBRE_40000.acumulado90d);
    expect(r.ritmoMensualDia90).toBe(RAMPA_AHORRO_CONSERVADOR_SOBRE_40000.ritmoMensualDia90);
  });

  it("la misma base produce un mes 1 distinto según la familia de curvas (facturación/contribución vs. ahorro)", () => {
    const rFC = aplicarRampa(
      MISMA_BASE_CURVAS_DISTINTAS.base,
      RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO.conservador,
    );
    const rAhorro = aplicarRampa(
      MISMA_BASE_CURVAS_DISTINTAS.base,
      RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO.conservador,
    );
    expect(rFC.mensual[0]!.habilitado).toBe(MISMA_BASE_CURVAS_DISTINTAS.mes1FamiliaFacturacionContribucion);
    expect(rAhorro.mensual[0]!.habilitado).toBe(MISMA_BASE_CURVAS_DISTINTAS.mes1FamiliaAhorro);
    expect(rFC.mensual[0]!.habilitado).not.toBe(rAhorro.mensual[0]!.habilitado);
  });
});

describe("rampaFacturacionContribucionDe / rampaAhorroPublicitarioDe", () => {
  it("usan el valor por defecto aprobado cuando la configuración no trae una rampa", () => {
    expect(rampaFacturacionContribucionDe({}, "conservador")).toEqual(
      RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO.conservador,
    );
    expect(rampaAhorroPublicitarioDe({}, "conservador")).toEqual(
      RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO.conservador,
    );
  });

  it("cada familia se configura de forma independiente", () => {
    const cfgPersonalizada: ConfigEscenarios90d = {
      rampa_escenario_base: { mes1: 0.1, mes2: 0.2, mes3: 0.3 },
      rampa_ahorro_base: { mes1: 0.6, mes2: 0.8, mes3: 1 },
    };
    expect(rampaFacturacionContribucionDe(cfgPersonalizada, "base")).toEqual({
      mes1: 0.1,
      mes2: 0.2,
      mes3: 0.3,
    });
    expect(rampaAhorroPublicitarioDe(cfgPersonalizada, "base")).toEqual({
      mes1: 0.6,
      mes2: 0.8,
      mes3: 1,
    });
    // Las rampas no configuradas siguen en su valor por defecto, por familia.
    expect(rampaFacturacionContribucionDe(cfgPersonalizada, "conservador")).toEqual(
      RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO.conservador,
    );
  });

  it("ignora una rampa incompleta o no numérica de la configuración y usa el default", () => {
    const invalida = { rampa_escenario_potencial: { mes1: 0.5 } } as ConfigEscenarios90d;
    expect(rampaFacturacionContribucionDe(invalida, "potencial")).toEqual(
      RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO.potencial,
    );
  });
});

describe("calcularEscenarios90d: facturación, contribución y ahorro nunca se mezclan", () => {
  it("facturación proyectada = facturación actual + facturación incremental habilitada, nunca + contribución ni + ahorro", () => {
    const resultado = resultadoConFunnel();
    const [, base] = calcularEscenarios90d(casoConFunnel, resultado);
    expect(base!.facturacionIncremental.calculable).toBe(true);
    expect(base!.facturacionProyectada.calculable).toBe(true);
    if (base!.facturacionProyectada.calculable && base!.facturacionIncremental.calculable) {
      for (const mes of base!.facturacionProyectada.mensual) {
        const habilitado = base!.facturacionIncremental.mensual.find((m) => m.mes === mes.mes)!
          .habilitado;
        expect(mes.valor).toBe((casoConFunnel.facturacion_mensual as number) + habilitado);
      }
    }
  });

  it("la facturación proyectada nunca suma contribución ni ahorro (cuenta manual)", () => {
    const p = FACTURACION_PROYECTADA_MANUAL;
    const proyectada = p.facturacionActual + p.facturacionIncrementalHabilitadaMes1;
    expect(proyectada).toBe(p.facturacionProyectadaMes1Esperada);
    expect(proyectada).not.toBe(p.sumaIncompatibleQueNuncaDebeAparecer);
  });

  it("facturación y contribución incremental son magnitudes distintas del mismo escenario", () => {
    const resultado = resultadoConFunnel();
    const [, base] = calcularEscenarios90d(casoConFunnel, resultado);
    expect(base!.facturacionIncremental.calculable).toBe(true);
    expect(base!.contribucionIncremental.calculable).toBe(true);
    if (base!.facturacionIncremental.calculable && base!.contribucionIncremental.calculable) {
      expect(base!.facturacionIncremental.acumulado90d).toBeGreaterThan(
        base!.contribucionIncremental.acumulado90d,
      );
      expect(base!.facturacionIncremental.acumulado90d).not.toBe(
        base!.contribucionIncremental.acumulado90d,
      );
    }
  });

  it("el mes 1 es más bajo que el mes 3 en cada línea, según la rampa aprobada", () => {
    const resultado = resultadoConFunnel();
    const [conservador, base, potencial] = calcularEscenarios90d(casoConFunnel, resultado);

    for (const escenario of [conservador!, base!, potencial!]) {
      for (const linea of [escenario.facturacionIncremental, escenario.contribucionIncremental]) {
        if (!linea.calculable) continue;
        expect(linea.mensual[0]!.habilitado).toBeLessThanOrEqual(linea.mensual[1]!.habilitado);
        expect(linea.mensual[1]!.habilitado).toBeLessThanOrEqual(linea.mensual[2]!.habilitado);
      }
    }

    // Potencial adopta más rápido que base, que adopta más rápido que conservador.
    expect(potencial!.facturacionIncremental.calculable && conservador!.facturacionIncremental.calculable).toBe(
      true,
    );
    if (potencial!.facturacionIncremental.calculable && base!.facturacionIncremental.calculable && conservador!.facturacionIncremental.calculable) {
      expect(potencial!.facturacionIncremental.mensual[0]!.habilitado).toBeGreaterThanOrEqual(
        base!.facturacionIncremental.mensual[0]!.habilitado,
      );
      expect(base!.facturacionIncremental.mensual[0]!.habilitado).toBeGreaterThanOrEqual(
        conservador!.facturacionIncremental.mensual[0]!.habilitado,
      );
    }
  });

  it("el acumulado de 90 días es la suma de los tres meses, no el ritmo mensual del día 90 multiplicado por 3", () => {
    const resultado = resultadoConFunnel();
    const [conservador] = calcularEscenarios90d(casoConFunnel, resultado);
    const linea = conservador!.facturacionIncremental;
    expect(linea.calculable).toBe(true);
    if (linea.calculable) {
      const sumaMeses = linea.mensual.reduce((acc, m) => acc + m.habilitado, 0);
      expect(linea.acumulado90d).toBe(sumaMeses);
      expect(linea.acumulado90d).not.toBe(linea.ritmoMensualDia90 * 3);
    }
  });

  it("margen bloqueado (contradicción crítica confirmada) retiene contribución y ahorro, pero NUNCA facturación incremental", () => {
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
      expect(escenario.facturacionIncremental.calculable).toBe(true);
      expect((escenario.facturacionIncremental as { acumulado90d: number }).acumulado90d).toBeGreaterThan(0);

      expect(escenario.contribucionIncremental.calculable).toBe(false);
      expect(escenario.contribucionIncremental.motivo).toMatch(/contradice/);
      expect(escenario.contribucionIncremental.mensual).toEqual([]);
      expect(escenario.contribucionIncremental.acumulado90d).toBeNull();
    }
  });

  it("contradicción crítica SIN confirmar también retiene contribución y ahorro (no sólo cuando bloquea)", () => {
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
      expect(escenario.facturacionIncremental.calculable).toBe(true);
      expect(escenario.contribucionIncremental.calculable).toBe(false);
      expect(escenario.contribucionIncremental.motivo).toMatch(/no fue validada/);
      expect(escenario.ahorroPublicitario.calculable).toBe(false);
      expect(escenario.ahorroPublicitario.motivo).toMatch(/no fue validada/);
    }
  });

  it("sin ninguna fuga calculable, retiene las tres magnitudes en vez de mostrar un acumulado en cero", () => {
    const resultado = calcularDiagnostico(casoSnakeStore, cfg);
    expect(resultado.fugas.some((f) => f.calculable && (f.monto ?? 0) > 0)).toBe(false);

    const escenarios = calcularEscenarios90d(casoSnakeStore, resultado);
    for (const escenario of escenarios) {
      expect(escenario.facturacionIncremental.calculable).toBe(false);
      expect(escenario.contribucionIncremental.calculable).toBe(false);
      expect(escenario.facturacionProyectada.calculable).toBe(false);
      // Nunca se confunde "no calculable" con un cero real.
      expect(escenario.facturacionIncremental.acumulado90d).toBeNull();
    }
  });

  it("con fuga calculable pero sin facturación mensual declarada, retiene sólo la facturación proyectada", () => {
    const datos: DatosDiagnostico = {
      ...casoSnakeStore,
      facturacion_mensual: null,
      conjuntos_activos: 20,
      presupuesto_diario: 1000,
      inversion_meta: 30_000,
    };
    const resultado = calcularDiagnostico(datos, cfg);
    expect(resultado.fugas.some((f) => f.id === "sobrefragmentacion" && f.calculable)).toBe(true);

    const escenarios = calcularEscenarios90d(datos, resultado);
    for (const escenario of escenarios) {
      // El ahorro publicitario no necesita facturación actual: sigue calculable.
      expect(escenario.ahorroPublicitario.calculable).toBe(true);
      // La facturación proyectada sí la necesita: queda retenida.
      expect(escenario.facturacionProyectada.calculable).toBe(false);
      expect(escenario.facturacionProyectada.motivo).toBe("No se declaró la facturación mensual.");
    }
  });

  it("ninguna mejora de conversión puede llevar una tasa por encima del 100%: no genera escenarios irreales", () => {
    const resultado = resultadoConFunnel();
    const [, , potencial] = calcularEscenarios90d(casoConFunnel, resultado);
    const linea = potencial!.facturacionIncremental;
    expect(linea.calculable).toBe(true);
  });
});

describe("reglas comerciales aprobadas 2026-08-21", () => {
  it("el escenario potencial nunca incorpora una palanca fuera de las fugas detectadas por el motor", () => {
    const resultado = resultadoConFunnel();
    const [, , potencial] = calcularEscenarios90d(casoConFunnel, resultado);
    const linea = potencial!.contribucionIncremental;
    expect(linea.calculable).toBe(true);
    if (linea.calculable) {
      const idsFugasConContribucion = resultado.fugas
        .filter((f) => f.impactos?.some((i) => i.tipo === "contribucion_incremental" && i.montoMensual))
        .map((f) => f.id)
        .sort();
      expect(linea.palancas.map((p) => p.id).sort()).toEqual(idsFugasConContribucion);
      for (const palanca of linea.palancas) {
        const fuga = resultado.fugas.find((f) => f.id === palanca.id)!;
        const impacto = fuga.impactos!.find((i) => i.tipo === "contribucion_incremental")!;
        expect(palanca.montoMensualDia90).toBeLessThanOrEqual(impacto.montoMensual as number);
      }
    }
  });

  it("Meta y Google se tratan como pool combinado: invertir el reparto entre ambos no cambia la proyección", () => {
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

    expect(escenariosInvertido.map((e) => e.facturacionIncremental)).toEqual(
      escenariosBase.map((e) => e.facturacionIncremental),
    );
    expect(escenariosInvertido.map((e) => e.contribucionIncremental)).toEqual(
      escenariosBase.map((e) => e.contribucionIncremental),
    );
  });
});

describe("corrección de producto aprobada 2026-08-21 (veredicto sobre 2685999)", () => {
  it("punto 1: la curva potencial de ahorro publicitario es 85/100/100, no 100/100/100", () => {
    expect(RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO.potencial).toEqual({
      mes1: 0.85,
      mes2: 1,
      mes3: 1,
    });
    // Las demás curvas de ahorro quedan sin cambios.
    expect(RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO.conservador).toEqual({
      mes1: 0.5,
      mes2: 0.75,
      mes3: 1,
    });
    expect(RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO.base).toEqual({ mes1: 0.75, mes2: 1, mes3: 1 });
  });

  it("punto 1: el mes 1 del escenario potencial de ahorro ya no captura el 100% de la base", () => {
    const r = aplicarRampa(100_000, RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO.potencial);
    expect(r.mensual[0]!.habilitado).toBe(85_000);
    expect(r.mensual[0]!.habilitado).not.toBe(100_000);
    expect(r.mensual[2]!.habilitado).toBe(100_000);
  });

  describe("punto 7: umbralDispersionDe / evaluarDispersionContribucion", () => {
    it("usa 2,5 por defecto y respeta la configuración cuando es válida", () => {
      expect(umbralDispersionDe({})).toBe(UMBRAL_DISPERSION_90D_DEFECTO);
      expect(umbralDispersionDe({ umbral_dispersion: 3 })).toBe(3);
      expect(umbralDispersionDe({ umbral_dispersion: 0 })).toBe(UMBRAL_DISPERSION_90D_DEFECTO);
      expect(umbralDispersionDe({ umbral_dispersion: -1 })).toBe(UMBRAL_DISPERSION_90D_DEFECTO);
      expect(umbralDispersionDe({ umbral_dispersion: NaN })).toBe(UMBRAL_DISPERSION_90D_DEFECTO);
      expect(umbralDispersionDe({ umbral_dispersion: Infinity })).toBe(UMBRAL_DISPERSION_90D_DEFECTO);
    });

    it("con las curvas aprobadas, el cociente potencial/conservador de contribución es ~1,57: nunca dispara el umbral por defecto", () => {
      const resultado = resultadoConFunnel();
      const escenarios = calcularEscenarios90d(casoConFunnel, resultado);
      const d = evaluarDispersionContribucion(escenarios);
      expect(d.evaluable).toBe(true);
      if (d.evaluable) {
        // 235/150 (suma de curva potencial / suma de curva conservador para contribución/facturación).
        expect(d.ratio).toBeCloseTo(235 / 150, 4);
        expect(d.alta).toBe(false);
      }
    });

    it("un umbral configurado más bajo que el cociente real dispara la dispersión alta", () => {
      const resultado = resultadoConFunnel();
      const escenarios = calcularEscenarios90d(casoConFunnel, resultado);
      const d = evaluarDispersionContribucion(escenarios, { umbral_dispersion: 1.5 });
      expect(d.evaluable).toBe(true);
      if (d.evaluable) {
        expect(d.ratio).toBeGreaterThan(1.5);
        expect(d.alta).toBe(true);
      }
    });

    it("no es evaluable sin ambos escenarios calculables (por ejemplo, sin ninguna fuga)", () => {
      const resultado = calcularDiagnostico(casoSnakeStore, cfg);
      const escenarios = calcularEscenarios90d(casoSnakeStore, resultado);
      const d = evaluarDispersionContribucion(escenarios);
      expect(d.evaluable).toBe(false);
      expect(d.umbral).toBe(UMBRAL_DISPERSION_90D_DEFECTO);
    });

    it("fixture manual: con las curvas hoy aprobadas, el cociente real coincide con la cuenta a mano y NO dispara", () => {
      const c = DISPERSION_CURVAS_APROBADAS_MANUAL;
      const resultado = resultadoConFunnel();
      const escenarios = calcularEscenarios90d(casoConFunnel, resultado);
      const d = evaluarDispersionContribucion(escenarios, { umbral_dispersion: c.umbral });
      expect(d.evaluable).toBe(true);
      if (d.evaluable) {
        expect(d.ratio).toBeCloseTo(c.ratioEsperado, 4);
        expect(d.alta).toBe(c.disparaEsperado);
      }
    });

    it("fixture manual: con una configuración de rampas RECONFIGURADA, la regla SÍ dispara — cociente 5,0 sobre umbral 2,5", () => {
      const c = DISPERSION_CURVAS_RECONFIGURADAS_MANUAL;
      const resultado = resultadoConFunnel();
      const escenarios = calcularEscenarios90d(casoConFunnel, resultado, {
        rampa_escenario_conservador: c.rampaConservador,
        rampa_escenario_potencial: c.rampaPotencial,
      });
      const d = evaluarDispersionContribucion(escenarios, { umbral_dispersion: c.umbral });
      expect(d.evaluable).toBe(true);
      if (d.evaluable) {
        // El cociente es independiente de la base real del cliente (misma
        // oportunidad mensual para los tres escenarios): da exactamente 5,0.
        expect(d.ratio).toBeCloseTo(c.ratioEsperado, 4);
        expect(d.ratio).toBeCloseTo(5, 4);
        expect(d.alta).toBe(c.disparaEsperado);
        expect(d.alta).toBe(true);
      }
    });

    it("fixture manual: aplicarRampa con las curvas reconfiguradas reproduce los acumulados exactos a mano", () => {
      const c = DISPERSION_CURVAS_RECONFIGURADAS_MANUAL;
      const conservador = aplicarRampa(c.baseContribucionIncremental, c.rampaConservador);
      const potencial = aplicarRampa(c.baseContribucionIncremental, c.rampaPotencial);
      expect(conservador.acumulado90d).toBe(c.acumuladoConservadorEsperado);
      expect(potencial.acumulado90d).toBe(c.acumuladoPotencialEsperado);
      expect(potencial.acumulado90d / conservador.acumulado90d).toBeCloseTo(c.ratioEsperado, 4);
    });
  });
});

describe("fixture manual: ninguna suma cruza magnitudes a nivel de escenario completo", () => {
  it("aplicarRampa reproduce los tres acumulados por magnitud del fixture manual, cada uno por separado", () => {
    const e = ESCENARIO_BASE_MANUAL;
    const facturacion = aplicarRampa(e.bases.facturacionIncremental, e.rampaFacturacionContribucion);
    const contribucion = aplicarRampa(e.bases.contribucionIncremental, e.rampaFacturacionContribucion);
    const ahorro = aplicarRampa(e.bases.ahorroPublicitario, e.rampaAhorro);

    expect(facturacion.acumulado90d).toBe(e.acumulados90d.facturacionIncremental);
    expect(contribucion.acumulado90d).toBe(e.acumulados90d.contribucionIncremental);
    expect(ahorro.acumulado90d).toBe(e.acumulados90d.ahorroPublicitario);

    expect(facturacion.mensual.map((m) => m.habilitado)).toEqual([80_000, 140_000, 200_000]);
    expect(contribucion.mensual.map((m) => m.habilitado)).toEqual([36_000, 63_000, 90_000]);
    expect(ahorro.mensual.map((m) => m.habilitado)).toEqual([22_500, 30_000, 30_000]);
  });

  it("facturación proyectada por mes es actual + facturación incremental, nunca + contribución ni + ahorro (cuenta manual)", () => {
    const e = ESCENARIO_BASE_MANUAL;
    const facturacion = aplicarRampa(e.bases.facturacionIncremental, e.rampaFacturacionContribucion);
    const proyectadaMes3 = e.facturacionActual + facturacion.mensual[2]!.habilitado;

    expect(proyectadaMes3).toBe(e.facturacionProyectadaPorMes.mes3);
    expect(proyectadaMes3).not.toBe(e.facturacionProyectadaMes3IncompatibleQueNuncaDebeAparecer);

    for (const [i, mes] of ([1, 2, 3] as const).entries()) {
      const esperado = (e.facturacionProyectadaPorMes as Record<string, number>)[`mes${mes}`]!;
      expect(e.facturacionActual + facturacion.mensual[i]!.habilitado).toBe(esperado);
    }
  });

  it("ninguna de las tres magnitudes acumuladas suma jamás a la 'suma total incompatible' del fixture manual", () => {
    const e = ESCENARIO_BASE_MANUAL;
    const suma =
      e.acumulados90d.facturacionIncremental +
      e.acumulados90d.contribucionIncremental +
      e.acumulados90d.ahorroPublicitario;
    expect(suma).toBe(e.sumaTotalIncompatibleQueNuncaDebeAparecer);

    // Verificación real contra el motor: ninguna de las tres líneas de un
    // escenario calculado coincide con esa suma incompatible.
    const resultado = resultadoConFunnel();
    const [, base] = calcularEscenarios90d(casoConFunnel, resultado);
    const valores = [
      base!.facturacionIncremental.calculable ? base!.facturacionIncremental.acumulado90d : null,
      base!.contribucionIncremental.calculable ? base!.contribucionIncremental.acumulado90d : null,
      base!.ahorroPublicitario.calculable ? base!.ahorroPublicitario.acumulado90d : null,
    ].filter((v): v is number => v !== null);
    for (const valor of valores) {
      expect(valor).not.toBe(e.sumaTotalIncompatibleQueNuncaDebeAparecer);
    }
  });
});
