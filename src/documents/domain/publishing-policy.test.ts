import { describe, expect, it } from "vitest";
import {
  debeMostrarEnvio,
  evidenciaDisponible,
  envioBloqueaRentabilidad,
  escenarioPuedeMostrarse,
  publicarNumeroDesdeEvidencia,
  resolverPoliticaEnvio,
  valorCalculado,
  valorNoAplica,
  valorRetenido,
} from "./publishing-policy";
import type { Escenario90d } from "./types";

describe("política de valores publicables", () => {
  it("conserva un cero calculado y no lo confunde con retenido", () => {
    const cero = valorCalculado({
      valor: 0,
      confianza: "alta",
      evidenciaIds: ["inversion_meta"],
    });
    const retenido = valorRetenido<number>("Falta el margen total.");

    expect(cero).toMatchObject({ estado: "calculado", valor: 0 });
    expect(retenido).toMatchObject({ estado: "retenido", valor: null });
    expect(valorNoAplica<number>("No vende por tienda propia")).toMatchObject({
      estado: "no_aplica",
      valor: null,
    });
  });

  it("publica cero y false cuando forman parte de evidencia disponible", () => {
    expect(
      publicarNumeroDesdeEvidencia("product_ads", {
        estado: "declarado",
        valor: 0,
        fuente: "cliente",
        periodo: "mensual",
      }),
    ).toMatchObject({ estado: "calculado", valor: 0 });

    expect(
      evidenciaDisponible({
        estado: "declarado",
        valor: false,
        fuente: "cliente",
        periodo: null,
      }),
    ).toBe(true);
  });

  it("retiene un número no disponible y conserva no aplica", () => {
    expect(
      publicarNumeroDesdeEvidencia("roas", {
        estado: "no_disponible",
        valor: null,
        motivo: "No hubo exportación de Product Ads.",
      }),
    ).toMatchObject({ estado: "retenido", valor: null });

    expect(
      publicarNumeroDesdeEvidencia("funnel", {
        estado: "no_aplica",
        valor: null,
        motivo: "Operación 100% marketplace.",
      }),
    ).toMatchObject({ estado: "no_aplica", valor: null });
  });
});

describe("triestado de envío", () => {
  it("no confirmado nunca se convierte silenciosamente en no", () => {
    const envio = resolverPoliticaEnvio({});
    expect(envio).toEqual({
      estado: "no_confirmado",
      costoNeto: null,
      mostrarEnDocumentos: false,
    });
    expect(envioBloqueaRentabilidad(envio)).toBe(true);
    expect(debeMostrarEnvio(envio)).toBe(false);
  });

  it("no implica costo cero, sin mostrarlo en documentos", () => {
    const envio = resolverPoliticaEnvio({ estado: false });
    expect(envio).toEqual({ estado: "no", costoNeto: 0, mostrarEnDocumentos: false });
    expect(envioBloqueaRentabilidad(envio)).toBe(false);
    expect(debeMostrarEnvio(envio)).toBe(false);
  });

  it("sí requiere un costo neto disponible para rentabilidad", () => {
    const incompleto = resolverPoliticaEnvio({ estado: "si" });
    expect(envioBloqueaRentabilidad(incompleto)).toBe(true);
    expect(debeMostrarEnvio(incompleto)).toBe(false);

    const completo = resolverPoliticaEnvio({
      estado: "si",
      costoNeto: {
        estado: "verificado",
        valor: 5_000,
        fuente: "liquidacion_ml",
        periodo: "2026-07",
      },
    });
    expect(envioBloqueaRentabilidad(completo)).toBe(false);
    expect(debeMostrarEnvio(completo)).toBe(true);
  });

  it("acepta directamente el booleano/null del formulario actual", () => {
    expect(resolverPoliticaEnvio({ estado: true }).estado).toBe("si");
    expect(resolverPoliticaEnvio({ estado: false }).estado).toBe("no");
    expect(resolverPoliticaEnvio({ estado: null }).estado).toBe("no_confirmado");
  });

  it("adapta el campo legado sin asumir que un ausente vale cero", () => {
    expect(resolverPoliticaEnvio({ costoNetoLegacy: 5_000 })).toMatchObject({
      estado: "si",
      costoNeto: { estado: "declarado", valor: 5_000 },
    });
    expect(resolverPoliticaEnvio({ costoNetoLegacy: null }).estado).toBe("no_confirmado");
  });
});

describe("visibilidad de escenarios", () => {
  const escenario = (
    id: Escenario90d["id"],
    confianza: Escenario90d["confianza"],
  ): Escenario90d => ({
    id,
    visible: true,
    confianza,
    contribucionAcumulada90d: valorRetenido("Motor de escenarios pendiente."),
    ritmoMensualDia90: valorRetenido("Motor de escenarios pendiente."),
    palancas: [],
    supuestos: [],
    restriccionesAplicadas: [],
  });

  it("oculta potencial cuando la confianza no es alta", () => {
    expect(escenarioPuedeMostrarse(escenario("potencial", "media"))).toBe(false);
    expect(escenarioPuedeMostrarse(escenario("potencial", "alta"))).toBe(true);
    expect(escenarioPuedeMostrarse(escenario("conservador", "baja"))).toBe(true);
  });
});
