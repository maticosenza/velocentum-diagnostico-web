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
  RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO,
  RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO,
  aplicarRampa,
  calcularEscenarios90d,
  rampaAhorroPublicitarioDe,
  rampaFacturacionContribucionDe,
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
