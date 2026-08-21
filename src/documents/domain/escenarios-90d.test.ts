import { describe, expect, it } from "vitest";
import { calcularDiagnostico, type ConfiguracionCalculo } from "../../lib/calculo-diagnostico";
import { casoSnakeStore, casoTitanWebB1, configuracionRegresionFase2 } from "../../lib/fixtures-casos";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { escenariosDocumento } from "./escenarios-90d";
import { politicaEnvioDocumento } from "./build-context";

/** Snake Store con funnel completo: genera fugas calculables de verdad. */
const casoConOportunidad: DatosDiagnostico = {
  ...casoSnakeStore,
  facturacion_mensual: 22_522_600,
  visitas_mensuales: 5000,
  agregados_carrito: 1000,
  checkouts_iniciados: 300,
  absorbe_costo_envio: true,
};

function envioYResultado(datos: DatosDiagnostico, cfg: ConfiguracionCalculo = configuracionRegresionFase2) {
  const resultado = calcularDiagnostico(datos, cfg);
  return { resultado, envio: politicaEnvioDocumento(datos, resultado) };
}

describe("escenariosDocumento", () => {
  it("calcula las tres magnitudes con confianza y evidencia cuando el envío está confirmado", () => {
    const { resultado, envio } = envioYResultado(casoConOportunidad);
    const escenarios = escenariosDocumento(casoConOportunidad, resultado, "media", envio);

    expect(escenarios.map((e) => e.id)).toEqual(["conservador", "base", "potencial"]);
    for (const escenario of escenarios) {
      expect(escenario.facturacionIncremental.acumulado90d.estado).toBe("calculado");
      expect(escenario.contribucionIncremental.acumulado90d.estado).toBe("calculado");
      expect(escenario.mensual).toHaveLength(3);
      expect(escenario.supuestos.map((s) => s.id)).toContain(`rampa_escenario_${escenario.id}`);
      expect(escenario.supuestos.map((s) => s.id)).toContain(`rampa_ahorro_${escenario.id}`);
      // Nunca la misma cifra: facturación y contribución son magnitudes distintas.
      if (
        escenario.facturacionIncremental.acumulado90d.estado === "calculado" &&
        escenario.contribucionIncremental.acumulado90d.estado === "calculado"
      ) {
        expect(escenario.facturacionIncremental.acumulado90d.valor).not.toBe(
          escenario.contribucionIncremental.acumulado90d.valor,
        );
      }
    }

    // El potencial sólo queda visible porque la confianza pasada es "alta" en otro test;
    // acá, con confianza "media", el contrato lo oculta aunque esté calculado.
    const potencial = escenarios.find((e) => e.id === "potencial")!;
    expect(potencial.visible).toBe(false);
  });

  it("propaga el supuesto de rampa dentro de CADA ValorPublicable de la línea, no sólo en escenario.supuestos (corrección aprobada 2026-08-21, punto 5)", () => {
    const { resultado, envio } = envioYResultado(casoConOportunidad);
    const escenarios = escenariosDocumento(casoConOportunidad, resultado, "alta", envio);

    for (const escenario of escenarios) {
      const supuestoFC = `rampa_escenario_${escenario.id}`;
      const supuestoAhorro = `rampa_ahorro_${escenario.id}`;

      expect(escenario.facturacionIncremental.acumulado90d.estado).toBe("calculado");
      if (escenario.facturacionIncremental.acumulado90d.estado === "calculado") {
        expect(escenario.facturacionIncremental.acumulado90d.supuestos).toContain(supuestoFC);
        expect(escenario.facturacionIncremental.ritmoMensualDia90).toMatchObject({
          estado: "calculado",
          supuestos: [supuestoFC],
        });
      }
      for (const palanca of escenario.facturacionIncremental.palancas) {
        expect(palanca.monto).toMatchObject({ estado: "calculado", supuestos: [supuestoFC] });
      }

      if (escenario.ahorroPublicitario.acumulado90d.estado === "calculado") {
        expect(escenario.ahorroPublicitario.acumulado90d.supuestos).toContain(supuestoAhorro);
      }
      for (const palanca of escenario.ahorroPublicitario.palancas) {
        expect(palanca.monto).toMatchObject({ estado: "calculado", supuestos: [supuestoAhorro] });
      }

      for (const mes of escenario.mensual) {
        if (mes.facturacionIncrementalHabilitada.estado === "calculado") {
          expect(mes.facturacionIncrementalHabilitada.supuestos).toContain(supuestoFC);
        }
        if (mes.contribucionIncrementalHabilitada.estado === "calculado") {
          expect(mes.contribucionIncrementalHabilitada.supuestos).toContain(supuestoFC);
        }
        if (mes.ahorroPublicitarioHabilitado.estado === "calculado") {
          expect(mes.ahorroPublicitarioHabilitado.supuestos).toContain(supuestoAhorro);
        }
      }
    }
  });

  it("un valor retenido nunca lleva `supuestos` (el estado ni siquiera tiene ese campo)", () => {
    // Titan B1 es 100% Mercado Libre: no hay funnel de tienda propia, así que
    // facturación/contribución incremental quedan retenidas.
    const resultado = calcularDiagnostico(casoTitanWebB1, configuracionRegresionFase2);
    const envio = politicaEnvioDocumento(casoTitanWebB1, resultado);
    const escenarios = escenariosDocumento(casoTitanWebB1, resultado, "media", envio);

    for (const escenario of escenarios) {
      expect(escenario.facturacionIncremental.acumulado90d.estado).toBe("retenido");
      expect(escenario.facturacionIncremental.acumulado90d).not.toHaveProperty("supuestos");
    }
  });

  it("deja visible al escenario potencial sólo con confianza alta", () => {
    const { resultado, envio } = envioYResultado(casoConOportunidad);
    const escenarios = escenariosDocumento(casoConOportunidad, resultado, "alta", envio);
    expect(escenarios.find((e) => e.id === "potencial")!.visible).toBe(true);
  });

  it("retiene contribución y ahorro cuando la política de envío no está confirmada, pero NUNCA facturación incremental", () => {
    // Titan Web B1 no confirma absorbe_costo_envio: no_confirmado.
    const resultado = calcularDiagnostico(casoTitanWebB1, configuracionRegresionFase2);
    const envio = politicaEnvioDocumento(casoTitanWebB1, resultado);
    expect(envio.estado).toBe("no_confirmado");

    const escenarios = escenariosDocumento(casoTitanWebB1, resultado, "media", envio);
    for (const escenario of escenarios) {
      expect(escenario.contribucionIncremental.acumulado90d).toMatchObject({ estado: "retenido" });
      expect(escenario.ahorroPublicitario.acumulado90d).toMatchObject({ estado: "retenido" });
      if (escenario.contribucionIncremental.acumulado90d.estado === "retenido") {
        expect(escenario.contribucionIncremental.acumulado90d.motivos[0]).toMatch(/política de envío/);
      }
      if (escenario.ahorroPublicitario.acumulado90d.estado === "retenido") {
        expect(escenario.ahorroPublicitario.acumulado90d.motivos[0]).toMatch(/política de envío/);
      }
    }
  });

  it("facturación incremental no depende de envío ni de margen: sigue publicada aunque el envío no esté confirmado", () => {
    // Mismo caso que arriba, pero Titan B1 no tiene funnel de tienda propia
    // (100% Mercado Libre): usamos Snake Store con funnel + envío sin confirmar.
    const datos: DatosDiagnostico = { ...casoConOportunidad, absorbe_costo_envio: null };
    const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
    const envio = politicaEnvioDocumento(datos, resultado);
    expect(envio.estado).toBe("no_confirmado");

    const escenarios = escenariosDocumento(datos, resultado, "media", envio);
    for (const escenario of escenarios) {
      expect(escenario.facturacionIncremental.acumulado90d.estado).toBe("calculado");
      expect(escenario.contribucionIncremental.acumulado90d.estado).toBe("retenido");
    }
  });

  it("no confunde retención por margen con retención por envío en el motivo mostrado", () => {
    const datos: DatosDiagnostico = {
      ...casoConOportunidad,
      margen_declarado_min: 90,
      margen_declarado_max: 90,
      margen_declarado_confirmado: true,
    };
    const { resultado, envio } = envioYResultado(datos);
    expect(resultado.margen_bloqueado).toBe(true);

    const escenarios = escenariosDocumento(datos, resultado, "media", envio);
    for (const escenario of escenarios) {
      expect(escenario.contribucionIncremental.acumulado90d.estado).toBe("retenido");
      if (escenario.contribucionIncremental.acumulado90d.estado === "retenido") {
        expect(escenario.contribucionIncremental.acumulado90d.motivos[0]).toMatch(/contradice/);
      }
      // Facturación incremental no depende de margen: sigue publicada.
      expect(escenario.facturacionIncremental.acumulado90d.estado).toBe("calculado");
    }
  });

  it("nunca publica un impacto total que sume las tres magnitudes", () => {
    const { resultado, envio } = envioYResultado(casoConOportunidad);
    const escenarios = escenariosDocumento(casoConOportunidad, resultado, "alta", envio);
    for (const escenario of escenarios) {
      expect(escenario).not.toHaveProperty("impactoTotal90d");
      expect(escenario).not.toHaveProperty("totalAcumulado90d");
    }
  });
});
