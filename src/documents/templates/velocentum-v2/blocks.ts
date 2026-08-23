/**
 * Constructores de bloques v2. Consumen el mismo `DocumentContextV1` que
 * v1 (`src/documents/domain`), sin ningún cambio de dominio. A diferencia
 * de v1, preservan el `ValorPublicable<number>` completo como `ValorV2`
 * (estado + motivo real) en vez de colapsar a `PublishedNumber | null` —
 * ver `contrato-composicion-v2.md` sección 1.1/3.
 */
import {
  debeMostrarEnvio,
  escenarioPuedeMostrarse,
  publicarNumeroDesdeEvidencia,
  type DocumentContextV1,
  type MetricasActualesDocumento,
  type RestriccionDocumento,
  type ValorPublicable,
} from "../../domain";
import type {
  DocumentBlockV2,
  EscenarioV2,
  FormatoValorV2,
  HallazgoV2,
  MesEscenarioV2,
  NivelComercialV2,
  PalancaV2,
  RestriccionAgrupadaV2,
  ValorV2,
} from "./types";

const METRIC_DEFINITIONS: Array<{
  id: keyof MetricasActualesDocumento;
  label: string;
  format: FormatoValorV2;
}> = [
  { id: "facturacion", label: "Facturación mensual", format: "money" },
  { id: "ticket", label: "Ticket promedio", format: "money" },
  { id: "pedidos", label: "Pedidos mensuales", format: "number" },
  { id: "margenTotal", label: "Margen total", format: "percent" },
  { id: "margenMuestra", label: "Margen de la muestra", format: "percent" },
  { id: "inversionTotal", label: "Inversión publicitaria", format: "money" },
  { id: "merTienda", label: "MER tienda propia", format: "ratio" },
  { id: "merMarketplace", label: "MER marketplace", format: "ratio" },
  { id: "roasProductAds", label: "ROAS Product Ads", format: "ratio" },
];

const ORDEN_PRIORIDAD: Record<HallazgoV2["prioridad"], number> = { alta: 0, media: 1, baja: 2 };

export function publicarV2(valor: ValorPublicable<number>, formato: FormatoValorV2): ValorV2 {
  if (valor.estado === "calculado") {
    return {
      estado: "calculado",
      valor: valor.valor,
      formato,
      confianza: valor.confianza,
      evidenciaIds: [...valor.evidenciaIds],
      supuestos: [...valor.supuestos],
    };
  }
  if (valor.estado === "retenido") {
    return { estado: "retenido", formato, motivos: [...valor.motivos] };
  }
  return { estado: "no_aplica", formato, motivo: valor.motivo };
}

/**
 * Bloque de cobertura, expuesto por separado de `coverageSectionV2`
 * (corrección de la auditoría interna, ronda 1): una sección propia con
 * sólo 3 barras deja la página muy por debajo del umbral de ocupación de
 * R-01. Los templates lo agrupan con contenido relacionado en la misma
 * sección en vez de darle una página aparte.
 */
export function buildCoverageBlockV2(context: DocumentContextV1): DocumentBlockV2 {
  return {
    type: "coverage",
    confidence: context.cobertura.confianza,
    items: [
      { id: "general", label: "Cobertura general", value: context.cobertura.general },
      { id: "canales", label: "Cobertura de canales", value: context.cobertura.canales },
      { id: "productos", label: "Cobertura de productos", value: context.cobertura.productos },
    ],
  };
}

export function buildMetricGridV2(context: DocumentContextV1): DocumentBlockV2 | null {
  const items = METRIC_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    value: publicarV2(context.actual[definition.id], definition.format),
  }));
  return items.length > 0 ? { type: "metric-grid", items } : null;
}

/**
 * Comparación entre canales (R-10): sólo cuando ambos MER son calculables
 * simultáneamente. `merTienda`/`merMarketplace` calculados por separado ya
 * viven en metric-grid; este bloque es adicional, no un reemplazo.
 */
export function buildChannelComparisonV2(context: DocumentContextV1): DocumentBlockV2 | null {
  const tienda = context.actual.merTienda;
  const marketplace = context.actual.merMarketplace;
  if (tienda.estado !== "calculado" || marketplace.estado !== "calculado") return null;
  return {
    type: "channel-comparison",
    tienda: { label: "MER tienda propia", value: publicarV2(tienda, "ratio") },
    marketplace: { label: "MER marketplace", value: publicarV2(marketplace, "ratio") },
  };
}

/**
 * C6, ronda 2.1: cuando el bloque "Comparación entre canales" está
 * presente, MER tienda propia y MER marketplace no se repiten en la
 * grilla de métricas — evita mostrar el mismo valor dos veces en la
 * misma sección de un documento.
 */
export function dedupeMetricGridV2(
  metrics: DocumentBlockV2 | null,
  channelComparison: DocumentBlockV2 | null,
): DocumentBlockV2 | null {
  if (!metrics || metrics.type !== "metric-grid" || !channelComparison) return metrics;
  const items = metrics.items.filter((item) => item.id !== "merTienda" && item.id !== "merMarketplace");
  return items.length > 0 ? { type: "metric-grid", items } : null;
}

export function buildShippingV2(context: DocumentContextV1): DocumentBlockV2 | null {
  if (context.envio.estado !== "si") return null;
  if (!debeMostrarEnvio(context.envio)) return null;
  const valor = publicarNumeroDesdeEvidencia("envio.costoNeto", context.envio.costoNeto);
  if (valor.estado !== "calculado") return null;
  return {
    type: "shipping",
    label: "Costo neto absorbido por pedido",
    cost: publicarV2(valor, "money"),
  };
}

export function buildFindingsV2(
  context: DocumentContextV1,
  variante: "diagnostico" | "propuesta",
): DocumentBlockV2 | null {
  const fuente =
    variante === "propuesta"
      ? context.hallazgos.filter((h) => h.capa === "servicio")
      : context.hallazgos;

  const items: HallazgoV2[] = fuente.map((hallazgo) => ({
    id: hallazgo.id,
    titulo: hallazgo.titulo,
    capa: hallazgo.capa,
    prioridad: hallazgo.prioridad,
    confianza: hallazgo.confianza,
    evidenciaIds: [...hallazgo.evidenciaIds],
    magnitud: hallazgo.magnitud,
    monto: hallazgo.monto ? publicarV2(hallazgo.monto, "money") : null,
    esMargenNegativo: hallazgo.id === "margen_negativo",
  }));

  // E-12: orden por prioridad y, dentro de cada prioridad, por monto
  // descendente (montos nulos al final de su grupo).
  items.sort((a, b) => {
    const porPrioridad = ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad];
    if (porPrioridad !== 0) return porPrioridad;
    const montoA = a.monto?.estado === "calculado" ? a.monto.valor : -Infinity;
    const montoB = b.monto?.estado === "calculado" ? b.monto.valor : -Infinity;
    return montoB - montoA;
  });

  if (items.length === 0) return null;
  return { type: "findings", variante, items };
}

const LABEL_MAGNITUD_LINEA = {
  facturacion_incremental: "facturacion_incremental",
  contribucion_incremental: "contribucion_incremental",
  ahorro_publicitario: "ahorro_publicitario",
} as const;

export function buildScenariosV2(context: DocumentContextV1): DocumentBlockV2 | null {
  const items: EscenarioV2[] = context.escenarios90d.filter(escenarioPuedeMostrarse).map((scenario) => {
    const contribucion90d = publicarV2(scenario.contribucionIncremental.acumulado90d, "money");
    const facturacion90d = publicarV2(scenario.facturacionIncremental.acumulado90d, "money");
    const ahorroPublicitario90d = publicarV2(scenario.ahorroPublicitario.acumulado90d, "money");

    const mensual: MesEscenarioV2[] = scenario.mensual.map((mes) => ({
      mes: mes.mes,
      facturacionProyectada: publicarV2(mes.facturacionProyectada, "money"),
      facturacionIncrementalHabilitada: publicarV2(mes.facturacionIncrementalHabilitada, "money"),
      contribucionIncrementalHabilitada: publicarV2(mes.contribucionIncrementalHabilitada, "money"),
      ahorroPublicitarioHabilitado: publicarV2(mes.ahorroPublicitarioHabilitado, "money"),
    }));

    const lineas = [
      { tipo: LABEL_MAGNITUD_LINEA.facturacion_incremental, linea: scenario.facturacionIncremental },
      { tipo: LABEL_MAGNITUD_LINEA.contribucion_incremental, linea: scenario.contribucionIncremental },
      { tipo: LABEL_MAGNITUD_LINEA.ahorro_publicitario, linea: scenario.ahorroPublicitario },
    ] as const;

    const palancas: PalancaV2[] = lineas.flatMap(({ tipo, linea }) =>
      linea.palancas.map((palanca) => ({
        id: palanca.id,
        nombre: palanca.nombre,
        tipo,
        monto: publicarV2(palanca.monto, "money"),
        periodo: "ritmo_mensual_dia_90" as const,
      })),
    );

    return {
      id: scenario.id,
      confianza: scenario.confianza,
      contribucion90d,
      facturacion90d,
      ahorroPublicitario90d,
      mensual,
      palancas,
      supuestos: [...scenario.supuestos],
      restricciones: [...scenario.restriccionesAplicadas],
      esCorta: mensual.length === 0 && palancas.length === 0,
    };
  });

  return items.length > 0 ? { type: "scenarios", items } : null;
}

/**
 * E-13: la cifra principal (`escenarioComunicado` es siempre "conservador")
 * puede llevar marca † cuando depende de un supuesto de rampa; su nota
 * resuelta sale de `escenarios90d.find(id==="conservador").supuestos` — el
 * mismo campo que ya usa el bloque `scenarios` — para que la marca nunca
 * quede sin la lista de "Supuestos" en la misma composición.
 */
export function buildCommercialSummaryV2(context: DocumentContextV1): DocumentBlockV2 | null {
  if (!context.resumenComercial) return null;
  const r = context.resumenComercial;
  const headline = publicarV2(r.cifraPrincipal, "money");
  const conservador = context.escenarios90d.find((e) => e.id === r.escenarioComunicado);
  const assumptionsDetail =
    headline.estado === "calculado" && headline.supuestos.length > 0 ? [...(conservador?.supuestos ?? [])] : [];
  return {
    type: "commercial-summary",
    scenarioCommunicated: r.escenarioComunicado,
    headline,
    range: {
      lower: publicarV2(r.limiteInferior, "money"),
      upper: publicarV2(r.limiteSuperior, "money"),
      upperScenarioId: r.idEscenarioLimiteSuperior,
    },
    statement: r.redaccion,
    assumptionsDetail,
    dispersion: {
      ratio: r.dispersion.ratio,
      threshold: r.dispersion.umbral,
      high: r.dispersion.alta,
      dataToCloseIt: [...r.dispersion.datosParaCerrarla],
    },
  };
}

/**
 * Puente diagnóstico↔propuesta (C-07): sólo con datos ya existentes en el
 * contexto — hallazgos de capa "servicio" con monto calculado y la cifra
 * principal del resumen comercial, también calculada. Sin ninguno de los
 * dos, no hay frase que construir y el bloque no se muestra.
 */
export function buildBridgeNoteV2(context: DocumentContextV1): DocumentBlockV2 | null {
  if (!context.resumenComercial) return null;
  if (context.resumenComercial.cifraPrincipal.estado !== "calculado") return null;
  const montosServicio = context.hallazgos
    .filter((h) => h.capa === "servicio" && h.monto?.estado === "calculado")
    .map((h) => h.titulo);
  if (montosServicio.length === 0) return null;
  return {
    type: "bridge-note",
    text:
      "Estas prioridades mensuales, sostenidas 90 días bajo el escenario conservador, " +
      "son la base de la contribución incremental proyectada arriba.",
  };
}

/**
 * D1: una propuesta sin selección comercial confirmada nunca omite la
 * sección — muestra "Selección comercial pendiente" (`pendiente: true`,
 * `niveles: []`). El bloqueo de exportación que también exige D1 es un
 * comportamiento de UI/descarga, fuera de alcance de este prototipo
 * (sin conexión a ningún botón de descarga).
 */
export function buildCommercialOfferV2(context: DocumentContextV1): DocumentBlockV2 {
  const commercial = context.comercial;
  if (!commercial || commercial.niveles.length === 0) {
    return { type: "commercial-offer", pendiente: true, niveles: [] };
  }
  const niveles: NivelComercialV2[] = commercial.niveles.map((nivel) => ({
    id: nivel.id,
    nombre: nivel.nombre,
    servicios: nivel.servicios.map((s) => ({
      servicio: s.servicio,
      unidad: s.unidad,
      cantidad: s.cantidad,
      descripcion: s.descripcion,
      hallazgoIds: [...s.hallazgoIds],
    })),
    precio: publicarV2(nivel.precio, "money"),
  }));
  return { type: "commercial-offer", pendiente: false, niveles };
}

/**
 * Agrupación de retenciones por motivo real (E-06,
 * contrato-composicion-v2.md sección 2.8): usada sólo para restricciones
 * estructurales (`context.restricciones`, envío no confirmado, precio de
 * nivel comercial sin cargar). Las retenciones a nivel de línea de
 * escenario/palanca YA muestran su motivo real inline vía `ValorV2`
 * (E-04) y no se duplican acá — evita reintroducir el volcado de E-06.
 */
export function buildRestrictionsGroupedV2(items: RestriccionDocumento[]): DocumentBlockV2 | null {
  if (items.length === 0) return null;
  const porMotivo = new Map<string, string[]>();
  for (const item of items) {
    const clave = item.detalle;
    const etiquetas = porMotivo.get(clave) ?? [];
    etiquetas.push(item.etiqueta);
    porMotivo.set(clave, etiquetas);
  }
  const grupos: RestriccionAgrupadaV2[] = [...porMotivo.entries()].map(([motivo, etiquetas]) => ({
    motivo,
    etiquetas,
  }));
  return { type: "restrictions-grouped", items: grupos };
}
