import { describe, expect, it } from "vitest";
import { valorCalculado, valorNoAplica, valorRetenido } from "./publishing-policy";
import type { DocumentContextV1, MetricasActualesDocumento } from "./types";
import { assertContextoDocumento, validarContextoDocumento } from "./validation";

const calculado = (valor: number) =>
  valorCalculado({ valor, confianza: "alta", evidenciaIds: ["fixture"] });

const metricas = (): MetricasActualesDocumento => ({
  facturacion: calculado(50_000_000),
  ticket: calculado(25_000),
  pedidos: calculado(2_000),
  margenTotal: valorRetenido("La muestra no cubre todo el negocio."),
  margenMuestra: calculado(0.115),
  inversionTotal: calculado(1_800_000),
  merTienda: valorNoAplica("No vende por tienda propia."),
  merMarketplace: calculado(27.78),
  roasProductAds: valorRetenido("Faltan ventas atribuidas."),
});

function contextoValido(): DocumentContextV1 {
  return {
    schemaVersion: "document-context/1",
    templateVersion: "velocentum-diagnostico/v1",
    rulesetVersion: "calculo/2.5",
    tipoDocumento: "diagnostico",
    diagnostico: { id: "diagnostico-titan", version: 1, fecha: "2026-08-20" },
    cliente: { nombre: "Titan Web", vertical: "hogar", moneda: "ARS", periodo: "mensual" },
    modalidad: { minorista: true, mayorista: false },
    cobertura: { general: 60, canales: 100, productos: 60, confianza: "media" },
    evidencia: {
      fixture: { estado: "declarado", valor: true, fuente: "diagnostico", periodo: "mensual" },
    },
    actual: metricas(),
    envio: { estado: "no_confirmado", costoNeto: null, mostrarEnDocumentos: false },
    hallazgos: [],
    margenBloqueado: false,
    fortalezas: [],
    escenarios90d: [],
    resumenComercial: null,
    roadmap: [],
    servicios: [],
    comercial: null,
    restricciones: [],
    metodologia: [],
  };
}

describe("validación del contexto documental", () => {
  it("acepta un contexto parcial sin convertir retenidos en cero", () => {
    const contexto = contextoValido();
    expect(validarContextoDocumento(contexto)).toEqual([]);
    expect(() => assertContextoDocumento(contexto)).not.toThrow();
    expect(contexto.actual.margenTotal).toMatchObject({ estado: "retenido", valor: null });
  });

  it("rechaza NaN, cobertura imposible y cifras sin trazabilidad", () => {
    const contexto = contextoValido();
    contexto.cobertura.productos = 120;
    contexto.actual.ticket = {
      estado: "calculado",
      valor: Number.NaN,
      confianza: "alta",
      evidenciaIds: [],
      supuestos: [],
    };

    const paths = validarContextoDocumento(contexto).map((p) => p.path);
    expect(paths).toContain("cobertura.productos");
    expect(paths).toContain("actual.ticket.valor");
    expect(paths).toContain("actual.ticket.evidenciaIds");
    expect(() => assertContextoDocumento(contexto)).toThrow("Contexto documental inválido");
  });

  it("rechaza un escenario potencial visible sin confianza alta", () => {
    const contexto = contextoValido();
    contexto.escenarios90d.push({
      id: "potencial",
      visible: true,
      confianza: "media",
      facturacionIncremental: {
        acumulado90d: valorRetenido("Sin motor de escenarios."),
        ritmoMensualDia90: valorRetenido("Sin motor de escenarios."),
        palancas: [],
      },
      contribucionIncremental: {
        acumulado90d: valorRetenido("Sin motor de escenarios."),
        ritmoMensualDia90: valorRetenido("Sin motor de escenarios."),
        palancas: [],
      },
      ahorroPublicitario: {
        acumulado90d: valorRetenido("Sin motor de escenarios."),
        ritmoMensualDia90: valorRetenido("Sin motor de escenarios."),
        palancas: [],
      },
      mensual: [],
      supuestos: [],
      restriccionesAplicadas: [],
    });

    expect(validarContextoDocumento(contexto)).toContainEqual({
      path: "escenarios90d.0.visible",
      mensaje: "El escenario potencial requiere confianza alta.",
    });
  });

  it("rechaza dos hallazgos con el mismo ID, para no duplicar un finding en la propuesta", () => {
    const contexto = contextoValido();
    const hallazgo = {
      id: "mer_bajo",
      titulo: "MER por debajo del breakeven",
      capa: "servicio" as const,
      prioridad: "alta" as const,
      confianza: "media" as const,
      evidenciaIds: [],
      monto: null,
      magnitud: null,
      servicioIds: [],
    };
    contexto.hallazgos.push(hallazgo, { ...hallazgo });

    expect(validarContextoDocumento(contexto)).toContainEqual({
      path: "hallazgos.1.id",
      mensaje: "El hallazgo está duplicado.",
    });
  });

  it("rechaza un diagnóstico que trae resumenComercial: no debe proyectar (punto 3)", () => {
    const contexto = contextoValido();
    contexto.resumenComercial = {
      escenarioComunicado: "conservador",
      cifraPrincipal: calculado(1_000_000),
      limiteInferior: calculado(1_000_000),
      limiteSuperior: calculado(2_000_000),
      idEscenarioLimiteSuperior: "base",
      dispersion: { ratio: 2, umbral: 2.5, alta: false, datosParaCerrarla: [] },
      redaccion: "texto",
    };

    expect(validarContextoDocumento(contexto)).toContainEqual({
      path: "resumenComercial",
      mensaje: "Un diagnóstico no proyecta: resumenComercial debe ser null.",
    });
  });

  it("rechaza una redacción con una frase prohibida", () => {
    const contexto = contextoValido();
    contexto.tipoDocumento = "proyeccion_90d";
    contexto.resumenComercial = {
      escenarioComunicado: "conservador",
      cifraPrincipal: calculado(1_000_000),
      limiteInferior: calculado(1_000_000),
      limiteSuperior: calculado(2_000_000),
      idEscenarioLimiteSuperior: "base",
      dispersion: { ratio: 2, umbral: 2.5, alta: false, datosParaCerrarla: [] },
      redaccion: "Con estos datos, vas a ganar mucho dinero.",
    };

    const problemas = validarContextoDocumento(contexto);
    expect(problemas.some((p) => p.path === "resumenComercial.redaccion")).toBe(true);
  });

  it("rechaza una cifra principal calculada cuando la dispersión es alta", () => {
    const contexto = contextoValido();
    contexto.tipoDocumento = "proyeccion_90d";
    contexto.resumenComercial = {
      escenarioComunicado: "conservador",
      cifraPrincipal: calculado(1_000_000),
      limiteInferior: calculado(1_000_000),
      limiteSuperior: calculado(3_000_000),
      idEscenarioLimiteSuperior: "potencial",
      dispersion: { ratio: 3, umbral: 2.5, alta: true, datosParaCerrarla: ["algo"] },
      redaccion: "texto",
    };

    expect(validarContextoDocumento(contexto)).toContainEqual({
      path: "resumenComercial.cifraPrincipal",
      mensaje: "Con dispersión alta no se debe publicar una cifra principal.",
    });
  });
});
