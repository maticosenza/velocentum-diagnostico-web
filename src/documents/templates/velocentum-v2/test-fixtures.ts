/**
 * Fixtures propias de v2, construidas a mano con los helpers del dominio
 * (mismo criterio que `templates/velocentum-v1/test-fixtures.ts`: no
 * dependen del calculador ni del archivo de fixtures demostrativas de
 * `src/lib/`).
 *
 * Un test propio de ese archivo de `src/lib/` prohíbe que cualquier
 * archivo fuera de una lista corta lo importe — es la razón por la que
 * estas pruebas no reutilizan
 * `1-marketplace-fuerte-tienda-floja`/`4-roas-bueno-margen-negativo`
 * directamente aunque el PASO 1/3 del Bloque Visual 2 sí las usó (en
 * scripts temporales fuera de `src/`, nunca commiteados). Estos dos
 * fixtures reproducen las mismas características relevantes para el
 * contrato v2: uno "rico" (multicanal, escenario con tabla mensual y
 * palancas en las tres magnitudes, ambos MER calculables) análogo a s1, y
 * uno de "margen negativo" (hallazgo `margen_negativo`, escenarios sin
 * datos de funnel, cifra principal retenida) análogo a s4.
 */
import {
  valorCalculado,
  valorNoAplica,
  valorRetenido,
  type DocumentContextV1,
  type MetricasActualesDocumento,
} from "../../domain";

const metric = (value: number, evidenceIds: string[] = ["fixture"], supuestos: string[] = []) =>
  valorCalculado({ valor: value, confianza: "alta", evidenciaIds: evidenceIds, supuestos });

const METRICAS_RICAS: MetricasActualesDocumento = {
  facturacion: metric(15_000_000),
  ticket: metric(10_000),
  pedidos: metric(1_500),
  margenTotal: metric(0.32),
  margenMuestra: metric(0.32),
  inversionTotal: metric(1_000_000),
  merTienda: metric(15),
  merMarketplace: metric(6.2),
  roasProductAds: valorRetenido("Faltan ventas atribuidas de Product Ads."),
};

/** Análogo de `1-marketplace-fuerte-tienda-floja` (s1): multicanal, rico en datos. */
export function buildMulticanalContext(): DocumentContextV1 {
  return {
    schemaVersion: "document-context/1",
    templateVersion: "velocentum-v2-fixture",
    rulesetVersion: "fixture/manual",
    tipoDocumento: "proyeccion_90d",
    diagnostico: { id: "multicanal-fixture", version: 1, fecha: "2026-08-23" },
    cliente: {
      nombre: "Multicanal Demo",
      vertical: "E-commerce",
      moneda: "ARS",
      periodo: "mensual",
    },
    modalidad: { minorista: true, mayorista: false },
    cobertura: { general: 100, canales: 100, productos: 100, confianza: "alta" },
    evidencia: {},
    actual: METRICAS_RICAS,
    envio: { estado: "no_confirmado", costoNeto: null, mostrarEnDocumentos: false },
    hallazgos: [
      {
        id: "navegacion",
        titulo: "Pocas visitas llegan a agregar al carrito",
        capa: "servicio",
        prioridad: "alta",
        confianza: "media",
        evidenciaIds: ["fixture"],
        monto: metric(3_500_000),
        magnitud: "facturacion_incremental",
        servicioIds: ["meta-ads"],
      },
      {
        id: "checkout",
        titulo: "Checkouts iniciados que no terminan en compra",
        capa: "servicio",
        prioridad: "alta",
        confianza: "media",
        evidenciaIds: ["fixture"],
        monto: metric(1_200_000),
        magnitud: "contribucion_incremental",
        servicioIds: ["web"],
      },
      {
        id: "fragmentacion",
        titulo: "Estructura de cuenta fragmentada",
        capa: "recomendacion",
        prioridad: "media",
        confianza: "media",
        evidenciaIds: ["fixture"],
        monto: null,
        magnitud: null,
        servicioIds: [],
      },
      {
        id: "comisiones",
        titulo: "Comisiones de la plataforma dentro de rango",
        capa: "contexto",
        prioridad: "baja",
        confianza: "alta",
        evidenciaIds: ["fixture"],
        monto: null,
        magnitud: null,
        servicioIds: [],
      },
    ],
    margenBloqueado: false,
    fortalezas: [],
    funnelWeb: null,
    escenarios90d: [
      {
        id: "conservador",
        visible: true,
        confianza: "alta",
        facturacionIncremental: {
          acumulado90d: metric(15_488_804, ["fixture"], ["rampa_conservador"]),
          ritmoMensualDia90: metric(7_744_402, ["fixture"], ["rampa_conservador"]),
          palancas: [
            {
              id: "nav",
              nombre: "Fuga por navegación",
              monto: metric(3_567_928, ["fixture"], ["rampa_conservador"]),
            },
            {
              id: "carrito",
              nombre: "Fuga por carrito",
              monto: metric(3_539_385, ["fixture"], ["rampa_conservador"]),
            },
          ],
        },
        contribucionIncremental: {
          acumulado90d: metric(5_761_835, ["fixture"], ["rampa_conservador"]),
          ritmoMensualDia90: metric(2_880_917, ["fixture"], ["rampa_conservador"]),
          palancas: [
            {
              id: "nav2",
              nombre: "Fuga por navegación",
              monto: metric(1_327_269, ["fixture"], ["rampa_conservador"]),
            },
          ],
        },
        ahorroPublicitario: {
          acumulado90d: metric(357_249, ["fixture"], ["rampa_ahorro"]),
          ritmoMensualDia90: metric(158_777, ["fixture"], ["rampa_ahorro"]),
          palancas: [
            {
              id: "sobrefrag",
              nombre: "Fuga por sobrefragmentación",
              monto: metric(158_777, ["fixture"], ["rampa_ahorro"]),
            },
          ],
        },
        mensual: [
          {
            mes: 1,
            facturacionProyectada: metric(12_581_467, ["fixture"], ["rampa_conservador"]),
            facturacionIncrementalHabilitada: metric(2_581_467, ["fixture"], ["rampa_conservador"]),
            contribucionIncrementalHabilitada: metric(960_306, ["fixture"], ["rampa_conservador"]),
            ahorroPublicitarioHabilitado: metric(79_389, ["fixture"], ["rampa_ahorro"]),
          },
          {
            mes: 2,
            facturacionProyectada: metric(15_162_935, ["fixture"], ["rampa_conservador"]),
            facturacionIncrementalHabilitada: metric(5_162_935, ["fixture"], ["rampa_conservador"]),
            contribucionIncrementalHabilitada: metric(
              1_920_612,
              ["fixture"],
              ["rampa_conservador"],
            ),
            ahorroPublicitarioHabilitado: metric(119_083, ["fixture"], ["rampa_ahorro"]),
          },
          {
            mes: 3,
            facturacionProyectada: metric(17_744_402, ["fixture"], ["rampa_conservador"]),
            facturacionIncrementalHabilitada: metric(7_744_402, ["fixture"], ["rampa_conservador"]),
            contribucionIncrementalHabilitada: metric(
              2_880_917,
              ["fixture"],
              ["rampa_conservador"],
            ),
            ahorroPublicitarioHabilitado: metric(158_777, ["fixture"], ["rampa_ahorro"]),
          },
        ],
        supuestos: [
          {
            id: "rampa_conservador",
            etiqueta: "Rampa conservadora",
            valor: "25% / 50% / 75% de la oportunidad mensual en los meses 1, 2 y 3.",
            origen: "configuracion",
            evidenciaId: null,
          },
        ],
        restriccionesAplicadas: [],
      },
      {
        id: "base",
        visible: true,
        confianza: "media",
        facturacionIncremental: {
          acumulado90d: metric(21_684_325),
          ritmoMensualDia90: metric(10_325_869),
          palancas: [],
        },
        contribucionIncremental: {
          acumulado90d: metric(8_066_568),
          ritmoMensualDia90: metric(3_841_223),
          palancas: [],
        },
        ahorroPublicitario: {
          acumulado90d: metric(436_637),
          ritmoMensualDia90: metric(158_777),
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
          acumulado90d: metric(24_265_793),
          ritmoMensualDia90: metric(10_325_869),
          palancas: [],
        },
        contribucionIncremental: {
          acumulado90d: metric(9_026_875),
          ritmoMensualDia90: metric(3_841_223),
          palancas: [],
        },
        ahorroPublicitario: {
          acumulado90d: metric(452_514),
          ritmoMensualDia90: metric(158_777),
          palancas: [],
        },
        mensual: [],
        supuestos: [],
        restriccionesAplicadas: [],
      },
    ],
    resumenComercial: {
      escenarioComunicado: "conservador",
      cifraPrincipal: metric(5_761_835, ["fixture"], ["rampa_conservador"]),
      limiteInferior: metric(5_761_835, ["fixture"], ["rampa_conservador"]),
      limiteSuperior: metric(9_026_875),
      idEscenarioLimiteSuperior: "potencial",
      dispersion: { ratio: 1.57, umbral: 2.5, alta: false, datosParaCerrarla: [] },
      redaccion:
        "Con los datos disponibles y bajo estos supuestos, existe un rango de contribución incremental potencial de $5.761.835 a $9.026.875 durante los próximos 90 días.",
    },
    roadmap: [],
    roadmapV2: null,
    servicios: [
      { id: "meta-ads", nombre: "Meta Ads", alcance: ["Prospecting", "Retargeting"] },
      { id: "web", nombre: "Desarrollo y optimización web", alcance: ["Checkout", "Velocidad"] },
    ],
    comercial: {
      niveles: [
        {
          id: "impulso",
          nombre: "IMPULSO",
          servicios: [
            {
              servicio: "Meta Ads",
              unidad: "campañas_activas",
              cantidad: 2,
              descripcion: null,
              hallazgoIds: ["navegacion"],
            },
          ],
          precio: metric(900_000, ["seleccion-manual"]),
        },
      ],
    },
    comercialV2: null,
    restricciones: [],
    metodologia: [
      {
        id: "atribucion",
        etiqueta: "Perímetro de atribución",
        valor: "Multicanal: tienda propia + Mercado Libre.",
        origen: "configuracion",
        evidenciaId: null,
      },
    ],
  };
}

/**
 * Ronda 2.2.1, Corrección 1/R1: variante de `buildMulticanalContext` donde
 * los TRES escenarios (no sólo "conservador") tienen tabla mensual +
 * palancas + supuestos completos — mismo patrón de contenido "en cascada"
 * verificado en `1-marketplace-fuerte-tienda-floja` (fuera de `src/lib/`,
 * por eso se reconstruye acá): cuando ninguna tarjeta es corta, cada
 * tarjeta larga hereda el problema de espacio de la anterior, no sólo la
 * primera. Valores puramente sintéticos, sin relación con ningún cliente.
 */
export function buildTresEscenariosLargosContext(): DocumentContextV1 {
  const base = buildMulticanalContext();
  const conservador = base.escenarios90d.find((e) => e.id === "conservador")!;
  const clonarComo = (id: "base" | "potencial") => ({
    ...conservador,
    id,
    facturacionIncremental: {
      ...conservador.facturacionIncremental,
      palancas: conservador.facturacionIncremental.palancas.map((p) => ({
        ...p,
        id: `${p.id}_${id}`,
      })),
    },
    contribucionIncremental: {
      ...conservador.contribucionIncremental,
      palancas: conservador.contribucionIncremental.palancas.map((p) => ({
        ...p,
        id: `${p.id}_${id}`,
      })),
    },
    ahorroPublicitario: {
      ...conservador.ahorroPublicitario,
      palancas: conservador.ahorroPublicitario.palancas.map((p) => ({ ...p, id: `${p.id}_${id}` })),
    },
    mensual: conservador.mensual,
    supuestos: conservador.supuestos.map((s) => ({
      ...s,
      id: `${s.id}_${id}`,
      etiqueta: `${s.etiqueta} (${id})`,
    })),
  });
  return {
    ...base,
    escenarios90d: [conservador, clonarComo("base"), clonarComo("potencial")],
  };
}

/** Análogo de `4-roas-bueno-margen-negativo` (s4): margen negativo, sin datos de funnel. */
export function buildMargenNegativoContext(): DocumentContextV1 {
  return {
    schemaVersion: "document-context/1",
    templateVersion: "velocentum-v2-fixture",
    rulesetVersion: "fixture/manual",
    tipoDocumento: "proyeccion_90d",
    diagnostico: { id: "margen-negativo-fixture", version: 1, fecha: "2026-08-23" },
    cliente: {
      nombre: "Margen Negativo Demo",
      vertical: "E-commerce",
      moneda: "ARS",
      periodo: "mensual",
    },
    modalidad: { minorista: true, mayorista: false },
    cobertura: { general: 100, canales: 100, productos: 100, confianza: "alta" },
    evidencia: {},
    actual: {
      facturacion: metric(15_000_000),
      ticket: metric(10_000),
      pedidos: metric(1_500),
      margenTotal: metric(-0.07),
      margenMuestra: metric(-0.07),
      inversionTotal: metric(1_000_000),
      merTienda: metric(15),
      merMarketplace: valorRetenido("Faltan ventas atribuidas o inversión de marketplace."),
      roasProductAds: valorRetenido("Faltan ventas atribuidas o inversión de Product Ads."),
    },
    envio: { estado: "no", costoNeto: 0, mostrarEnDocumentos: false },
    hallazgos: [
      {
        id: "margen_negativo",
        titulo: "Margen de contribución negativo",
        capa: "recomendacion",
        prioridad: "alta",
        confianza: "media",
        evidenciaIds: ["fixture"],
        monto: null,
        magnitud: null,
        servicioIds: [],
      },
      {
        id: "comisiones-alto",
        titulo: "Comisiones de la plataforma y del marketplace",
        capa: "contexto",
        prioridad: "media",
        confianza: "media",
        evidenciaIds: ["fixture"],
        monto: null,
        magnitud: null,
        servicioIds: [],
      },
    ],
    margenBloqueado: false,
    fortalezas: [],
    funnelWeb: null,
    escenarios90d: [
      {
        id: "conservador",
        visible: true,
        confianza: "alta",
        facturacionIncremental: {
          acumulado90d: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          ritmoMensualDia90: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          palancas: [],
        },
        contribucionIncremental: {
          acumulado90d: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          ritmoMensualDia90: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          palancas: [],
        },
        ahorroPublicitario: {
          acumulado90d: valorRetenido(
            "No hay ahorro publicitario calculable con los datos actuales.",
          ),
          ritmoMensualDia90: valorRetenido(
            "No hay ahorro publicitario calculable con los datos actuales.",
          ),
          palancas: [],
        },
        mensual: [],
        supuestos: [],
        restriccionesAplicadas: [],
      },
      {
        id: "base",
        visible: true,
        confianza: "alta",
        facturacionIncremental: {
          acumulado90d: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          ritmoMensualDia90: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          palancas: [],
        },
        contribucionIncremental: {
          acumulado90d: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          ritmoMensualDia90: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          palancas: [],
        },
        ahorroPublicitario: {
          acumulado90d: valorRetenido(
            "No hay ahorro publicitario calculable con los datos actuales.",
          ),
          ritmoMensualDia90: valorRetenido(
            "No hay ahorro publicitario calculable con los datos actuales.",
          ),
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
          acumulado90d: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          ritmoMensualDia90: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          palancas: [],
        },
        contribucionIncremental: {
          acumulado90d: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          ritmoMensualDia90: valorRetenido(
            "No hay oportunidad de esta magnitud detectada con los datos actuales.",
          ),
          palancas: [],
        },
        ahorroPublicitario: {
          acumulado90d: valorRetenido(
            "No hay ahorro publicitario calculable con los datos actuales.",
          ),
          ritmoMensualDia90: valorRetenido(
            "No hay ahorro publicitario calculable con los datos actuales.",
          ),
          palancas: [],
        },
        mensual: [],
        supuestos: [],
        restriccionesAplicadas: [],
      },
    ],
    resumenComercial: {
      escenarioComunicado: "conservador",
      cifraPrincipal: valorRetenido(
        "No hay oportunidad de esta magnitud detectada con los datos actuales.",
      ),
      limiteInferior: valorRetenido(
        "No hay oportunidad de esta magnitud detectada con los datos actuales.",
      ),
      limiteSuperior: valorRetenido(
        "No hay oportunidad de esta magnitud detectada con los datos actuales.",
      ),
      idEscenarioLimiteSuperior: null,
      dispersion: { ratio: null, umbral: 2.5, alta: false, datosParaCerrarla: [] },
      redaccion: null,
    },
    roadmap: [],
    roadmapV2: null,
    servicios: [],
    comercial: null,
    comercialV2: null,
    restricciones: [],
    metodologia: [],
  };
}

/**
 * Caso límite (criterio de aceptación 15, nota informativa de la
 * auditoría interna ronda 1): mismo contexto que `buildMulticanalContext`,
 * con un nombre de cliente extremadamente largo y montos de más dígitos
 * de los que aparecen en s1/s4, para verificar que la composición no se
 * rompe con datos fuera del rango habitual de los dos fixtures.
 */
export function buildEstresContext(): DocumentContextV1 {
  const base = buildMulticanalContext();
  return {
    ...base,
    cliente: {
      ...base.cliente,
      nombre:
        "Distribuidora Mayorista Internacional de Indumentaria Deportiva y Artículos para el Hogar Sociedad Anónima",
    },
    actual: {
      ...base.actual,
      facturacion: metric(1_234_567_890),
      inversionTotal: metric(987_654_321),
    },
  };
}

/**
 * Bloque Visual 2.2, Parte A — barrido de cobertura: caso MAYORISTA puro
 * (D7: nunca "mixto"). No hay fixture canónico para este caso entre los
 * escenarios demostrativos de `src/lib/` — se construye acá, rotulado
 * explícitamente como contexto de prueba del prototipo, derivado de
 * `buildMulticanalContext` (misma forma de datos válida, sólo cambia
 * `modalidad` y los campos que dependen de ella). Sirve para probar el
 * componente de comparación entre canales y la deduplicación del MER
 * (C6) en un caso donde "canal" no tiene el mismo significado retail
 * que en s1/s4 — el bloque de comparación compara MER tienda propia vs.
 * MER marketplace (canales de venta/publicidad), no modalidades
 * comerciales, así que su comportamiento es idéntico independientemente
 * de `modalidad` — verificado, no encontrado ningún acoplamiento
 * indebido entre ambos conceptos.
 */
export function buildMayoristaContext(): DocumentContextV1 {
  const base = buildMulticanalContext();
  return {
    ...base,
    diagnostico: { ...base.diagnostico, id: "mayorista-fixture" },
    cliente: { ...base.cliente, nombre: "Mayorista Demo" },
    modalidad: { minorista: false, mayorista: true },
    metodologia: [
      {
        id: "modalidad",
        etiqueta: "Modalidad comercial",
        valor: "Mayorista (D7): operación mayorista sin canal minorista activo.",
        origen: "configuracion",
        evidenciaId: null,
      },
      ...base.metodologia,
    ],
  };
}

/**
 * Bloque Visual 2.2, Parte A — barrido de cobertura: caso MIXTO (D7:
 * minorista con módulo mayorista activado — nunca sinónimo de
 * "multicanal", que es tienda propia + Mercado Libre u otros canales de
 * venta). Mismo criterio que `buildMayoristaContext`: derivado de
 * `buildMulticanalContext`, rotulado como contexto de prueba del
 * prototipo, sin tocar fixtures canónicos.
 */
export function buildMixtoContext(): DocumentContextV1 {
  const base = buildMulticanalContext();
  return {
    ...base,
    diagnostico: { ...base.diagnostico, id: "mixto-fixture" },
    cliente: { ...base.cliente, nombre: "Mixto Demo" },
    modalidad: { minorista: true, mayorista: true },
    metodologia: [
      {
        id: "modalidad",
        etiqueta: "Modalidad comercial",
        valor: "Mixto (D7): operación minorista con módulo mayorista activado — no es multicanal.",
        origen: "configuracion",
        evidenciaId: null,
      },
      ...base.metodologia,
    ],
  };
}
