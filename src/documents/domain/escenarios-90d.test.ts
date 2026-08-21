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
  it("calcula los tres escenarios con confianza y evidencia cuando el envío está confirmado", () => {
    const { resultado, envio } = envioYResultado(casoConOportunidad);
    const escenarios = escenariosDocumento(casoConOportunidad, resultado, "media", envio);

    expect(escenarios.map((e) => e.id)).toEqual(["conservador", "base", "potencial"]);
    for (const escenario of escenarios) {
      expect(escenario.contribucionAcumulada90d.estado).toBe("calculado");
      expect(escenario.ritmoMensualDia90.estado).toBe("calculado");
      expect(escenario.mensual).toHaveLength(3);
      expect(escenario.supuestos.map((s) => s.id)).toContain(`rampa_escenario_${escenario.id}`);
    }

    // El potencial sólo queda visible porque la confianza pasada es "alta" en el otro test;
    // acá, con confianza "media", el contrato lo oculta aunque esté calculado.
    const potencial = escenarios.find((e) => e.id === "potencial")!;
    expect(potencial.visible).toBe(false);
  });

  it("deja visible al escenario potencial sólo con confianza alta", () => {
    const { resultado, envio } = envioYResultado(casoConOportunidad);
    const escenarios = escenariosDocumento(casoConOportunidad, resultado, "alta", envio);
    expect(escenarios.find((e) => e.id === "potencial")!.visible).toBe(true);
  });

  it("retiene los tres escenarios cuando la política de envío no está confirmada, aunque el margen sea calculable", () => {
    // Titan Web B1 no confirma absorbe_costo_envio: no_confirmado.
    const resultado = calcularDiagnostico(casoTitanWebB1, configuracionRegresionFase2);
    const envio = politicaEnvioDocumento(casoTitanWebB1, resultado);
    expect(envio.estado).toBe("no_confirmado");

    const escenarios = escenariosDocumento(casoTitanWebB1, resultado, "media", envio);
    for (const escenario of escenarios) {
      expect(escenario.contribucionAcumulada90d).toMatchObject({ estado: "retenido" });
      expect(escenario.ritmoMensualDia90.estado).toBe("retenido");
      if (escenario.contribucionAcumulada90d.estado === "retenido") {
        expect(escenario.contribucionAcumulada90d.motivos[0]).toMatch(/política de envío/);
      }
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
      expect(escenario.contribucionAcumulada90d.estado).toBe("retenido");
      if (escenario.contribucionAcumulada90d.estado === "retenido") {
        expect(escenario.contribucionAcumulada90d.motivos[0]).toMatch(/contradice/);
      }
    }
  });
});
