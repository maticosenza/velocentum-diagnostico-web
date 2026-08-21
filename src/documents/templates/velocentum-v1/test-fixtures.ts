import {
  valorCalculado,
  valorNoAplica,
  valorRetenido,
  type DocumentContextV1,
  type MetricasActualesDocumento,
} from "../../domain";

// Helpers intentionally build contexts by hand: fixtures do not depend on the calculator.
const metric = (value: number, evidenceIds: string[] = ["fixture"]) =>
  valorCalculado({ valor: value, confianza: "alta", evidenciaIds: evidenceIds });

const BASE_METRICS: MetricasActualesDocumento = {
  facturacion: metric(50_000_000, ["facturacion"]),
  ticket: metric(25_000, ["ticket"]),
  pedidos: metric(2_000, ["pedidos"]),
  margenTotal: valorRetenido("Falta validar la liquidación real."),
  margenMuestra: metric(-0.0452, ["productos"]),
  inversionTotal: metric(1_800_000, ["product-ads"]),
  merTienda: valorNoAplica("No hay tráfico en tienda propia."),
  merMarketplace: metric(27.8, ["facturacion", "product-ads"]),
  roasProductAds: valorRetenido("Faltan ventas atribuidas de Product Ads."),
};

export function buildTitanContext(): DocumentContextV1 {
  return {
    schemaVersion: "document-context/1",
    templateVersion: "velocentum-v1",
    rulesetVersion: "fixture/manual",
    tipoDocumento: "proyeccion_90d",
    diagnostico: { id: "titan-fixture", version: 1, fecha: "2026-08-20" },
    cliente: { nombre: "Titan Web", vertical: "Tecnología", moneda: "ARS", periodo: "mensual" },
    modalidad: { minorista: true, mayorista: false },
    cobertura: { general: 62, canales: 75, productos: 60, confianza: "media" },
    evidencia: {},
    actual: BASE_METRICS,
    envio: { estado: "no_confirmado", costoNeto: null, mostrarEnDocumentos: false },
    hallazgos: [
      {
        id: "rentabilidad",
        titulo: "Validar rentabilidad por liquidación",
        capa: "recomendacion",
        prioridad: "alta",
        confianza: "bloqueada",
        evidenciaIds: ["productos"],
        monto: valorRetenido("La comisión efectiva todavía no está verificada."),
        servicioId: "auditoria-marketplace",
      },
    ],
    escenarios90d: [
      {
        id: "base",
        visible: true,
        confianza: "media",
        facturacionIncremental: {
          acumulado90d: metric(0, ["product-ads"]),
          ritmoMensualDia90: metric(0, ["product-ads"]),
          palancas: [],
        },
        contribucionIncremental: {
          acumulado90d: valorRetenido("La rentabilidad está pendiente."),
          ritmoMensualDia90: valorRetenido("La rentabilidad está pendiente."),
          palancas: [],
        },
        ahorroPublicitario: {
          acumulado90d: valorRetenido("La rentabilidad está pendiente."),
          ritmoMensualDia90: valorRetenido("La rentabilidad está pendiente."),
          palancas: [],
        },
        mensual: [],
        supuestos: [],
        restriccionesAplicadas: [],
      },
      {
        id: "potencial",
        visible: true,
        confianza: "media",
        facturacionIncremental: {
          acumulado90d: metric(8_000_000),
          ritmoMensualDia90: metric(3_200_000),
          palancas: [],
        },
        contribucionIncremental: {
          acumulado90d: metric(5_000_000),
          ritmoMensualDia90: metric(2_000_000),
          palancas: [],
        },
        ahorroPublicitario: {
          acumulado90d: metric(0),
          ritmoMensualDia90: metric(0),
          palancas: [],
        },
        mensual: [],
        supuestos: [],
        restriccionesAplicadas: [],
      },
    ],
    // Este fixture no incluye un escenario "conservador" (sólo base/potencial):
    // el resumen comercial queda retenido, tal como lo estaría en un caso real.
    resumenComercial: {
      escenarioComunicado: "conservador",
      cifraPrincipal: valorRetenido("El escenario conservador no es calculable con los datos actuales."),
      limiteInferior: valorRetenido("El escenario conservador no es calculable con los datos actuales."),
      limiteSuperior: metric(5_000_000),
      idEscenarioLimiteSuperior: "potencial",
      dispersion: { ratio: null, umbral: 2.5, alta: false, datosParaCerrarla: [] },
      redaccion: null,
      supuestoIds: [],
    },
    roadmap: [
      {
        id: "validacion",
        etiqueta: "Validar economía unitaria",
        desdeDia: 1,
        hastaDia: 15,
        acciones: ["Revisar liquidación real"],
        resultadoEsperado: "Margen verificable",
      },
    ],
    servicios: [
      {
        id: "auditoria-marketplace",
        nombre: "Auditoría de marketplace",
        alcance: ["Mercado Libre", "Product Ads"],
      },
    ],
    comercial: null,
    restricciones: [],
    metodologia: [
      {
        id: "atribucion",
        etiqueta: "Perímetro de atribución",
        valor: "Marketplace separado de tienda propia",
        origen: "configuracion",
        evidenciaId: null,
      },
    ],
  };
}

export function buildSnakeContext(): DocumentContextV1 {
  return {
    schemaVersion: "document-context/1",
    templateVersion: "velocentum-v1",
    rulesetVersion: "fixture/manual",
    tipoDocumento: "diagnostico",
    diagnostico: { id: "snake-fixture", version: 2, fecha: "2026-08-20" },
    cliente: { nombre: "Snake Store", vertical: "Indumentaria", moneda: "ARS", periodo: "mensual" },
    modalidad: { minorista: true, mayorista: true },
    cobertura: { general: 92, canales: 90, productos: 100, confianza: "alta" },
    evidencia: {},
    actual: {
      facturacion: metric(24_000_000),
      ticket: metric(40_000),
      pedidos: metric(600),
      margenTotal: metric(0.6375),
      margenMuestra: metric(0.6375),
      inversionTotal: metric(0),
      merTienda: metric(0),
      merMarketplace: valorNoAplica("No vende en marketplace."),
      roasProductAds: valorNoAplica("No usa Product Ads."),
    },
    envio: { estado: "no", costoNeto: 0, mostrarEnDocumentos: false },
    hallazgos: [
      {
        id: "medicion",
        titulo: "Preparar medición para la inversión inicial",
        capa: "servicio",
        prioridad: "alta",
        confianza: "alta",
        evidenciaIds: ["fixture"],
        monto: null,
        servicioId: "medicion",
      },
    ],
    escenarios90d: [
      {
        id: "base",
        visible: true,
        confianza: "alta",
        facturacionIncremental: {
          acumulado90d: metric(0),
          ritmoMensualDia90: metric(0),
          palancas: [{ id: "retencion", nombre: "Retención", monto: metric(0) }],
        },
        contribucionIncremental: {
          acumulado90d: metric(0),
          ritmoMensualDia90: metric(0),
          palancas: [{ id: "retencion", nombre: "Retención", monto: metric(0) }],
        },
        ahorroPublicitario: {
          acumulado90d: metric(0),
          ritmoMensualDia90: metric(0),
          palancas: [],
        },
        mensual: [],
        supuestos: [],
        restriccionesAplicadas: [],
      },
      {
        id: "potencial",
        visible: true,
        confianza: "alta",
        facturacionIncremental: {
          acumulado90d: metric(7_500_000),
          ritmoMensualDia90: metric(3_000_000),
          palancas: [{ id: "captacion", nombre: "Captación", monto: metric(7_500_000) }],
        },
        contribucionIncremental: {
          acumulado90d: metric(3_000_000),
          ritmoMensualDia90: metric(1_200_000),
          palancas: [{ id: "captacion", nombre: "Captación", monto: metric(3_000_000) }],
        },
        ahorroPublicitario: {
          acumulado90d: metric(0),
          ritmoMensualDia90: metric(0),
          palancas: [],
        },
        mensual: [],
        supuestos: [],
        restriccionesAplicadas: [],
      },
    ],
    // Diagnóstico: no proyecta (corrección aprobada 2026-08-21, punto 3).
    resumenComercial: null,
    roadmap: [
      {
        id: "base",
        etiqueta: "Base de medición",
        desdeDia: 1,
        hastaDia: 30,
        acciones: ["Configurar medición"],
        resultadoEsperado: "Datos comparables",
      },
    ],
    servicios: [{ id: "medicion", nombre: "Medición", alcance: ["GA4", "Ads"] }],
    comercial: {
      aprobadaManualmente: true,
      paqueteId: "growth",
      nombre: "Growth 90 días",
      alcance: ["Medición", "Pauta"],
      exclusiones: ["Producción audiovisual"],
      entregables: ["Tablero"],
      duracionDias: 90,
      precio: { estado: "declarado", valor: 900_000, fuente: "seleccion-manual", periodo: null },
      formaPago: "Mensual",
      inicio: null,
      incluirPrecioEnPdf: false,
    },
    restricciones: [],
    metodologia: [],
  };
}
