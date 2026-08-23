import {
  debeMostrarEnvio,
  escenarioPuedeMostrarse,
  publicarNumeroDesdeEvidencia,
  type DocumentContextV1,
  type MetricasActualesDocumento,
  type RestriccionDocumento,
  type ValorPublicable,
} from "../../domain";
import type { DocumentBlock, DocumentValueFormat, PublishedNumber } from "./types";

const METRIC_DEFINITIONS: Array<{
  id: keyof MetricasActualesDocumento;
  label: string;
  format: DocumentValueFormat;
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

export function publishValue(
  value: ValorPublicable<number>,
  format: DocumentValueFormat,
): PublishedNumber | null {
  if (value.estado !== "calculado") return null;
  return {
    value: value.valor,
    format,
    confidence: value.confianza,
    evidenceIds: [...value.evidenciaIds],
    assumptions: [...value.supuestos],
  };
}

function retainedRestriction(
  id: string,
  label: string,
  value: ValorPublicable<number>,
): RestriccionDocumento | null {
  if (value.estado !== "retenido") return null;
  return {
    id: `retenido:${id}`,
    etiqueta: label,
    detalle: value.motivos.join(" "),
    bloquea: [],
  };
}

export function buildMetricGrid(context: DocumentContextV1): {
  block: DocumentBlock | null;
  restrictions: RestriccionDocumento[];
} {
  const items: Extract<DocumentBlock, { type: "metric-grid" }>["items"] = [];
  const restrictions: RestriccionDocumento[] = [];

  for (const definition of METRIC_DEFINITIONS) {
    const value = context.actual[definition.id];
    const published = publishValue(value, definition.format);
    if (published) {
      items.push({ id: definition.id, label: definition.label, value: published });
      continue;
    }
    const restriction = retainedRestriction(definition.id, definition.label, value);
    if (restriction) restrictions.push(restriction);
  }

  return {
    block: items.length > 0 ? { type: "metric-grid", items } : null,
    restrictions,
  };
}

export function buildShipping(context: DocumentContextV1): {
  block: DocumentBlock | null;
  restrictions: RestriccionDocumento[];
} {
  if (context.envio.estado === "no") return { block: null, restrictions: [] };
  if (context.envio.estado === "no_confirmado") {
    return {
      block: null,
      restrictions: [
        {
          id: "envio:no-confirmado",
          etiqueta: "Costo de envío no confirmado",
          detalle:
            "No se publica un costo de envío hasta confirmar si el vendedor absorbe una parte neta.",
          bloquea: ["rentabilidad"],
        },
      ],
    };
  }

  if (!debeMostrarEnvio(context.envio)) {
    return {
      block: null,
      restrictions: [
        {
          id: "envio:costo-retenido",
          etiqueta: "Costo neto de envío pendiente",
          detalle:
            context.envio.costoNeto.estado === "no_disponible"
              ? context.envio.costoNeto.motivo
              : "El costo neto de envío no es publicable.",
          bloquea: ["rentabilidad"],
        },
      ],
    };
  }

  const value = publicarNumeroDesdeEvidencia("envio.costoNeto", context.envio.costoNeto);
  const cost = publishValue(value, "money");
  return cost
    ? {
        block: { type: "shipping", label: "Costo neto absorbido por pedido", cost },
        restrictions: [],
      }
    : { block: null, restrictions: [] };
}

export function buildFindings(context: DocumentContextV1): {
  block: DocumentBlock | null;
  restrictions: RestriccionDocumento[];
} {
  const restrictions: RestriccionDocumento[] = [];
  const items = context.hallazgos.map((finding) => {
    const amount = finding.monto ? publishValue(finding.monto, "money") : null;
    if (finding.monto) {
      const restriction = retainedRestriction(
        `hallazgo:${finding.id}`,
        `Monto retenido · ${finding.titulo}`,
        finding.monto,
      );
      if (restriction) restrictions.push(restriction);
    }
    return {
      id: finding.id,
      titulo: finding.titulo,
      capa: finding.capa,
      prioridad: finding.prioridad,
      confianza: finding.confianza,
      evidenciaIds: [...finding.evidenciaIds],
      magnitud: finding.magnitud,
      amount,
    };
  });

  return {
    block: items.length > 0 ? { type: "findings", items } : null,
    restrictions,
  };
}

export function buildScenarios(context: DocumentContextV1): {
  block: DocumentBlock | null;
  restrictions: RestriccionDocumento[];
} {
  const restrictions: RestriccionDocumento[] = [];
  const items = context.escenarios90d.filter(escenarioPuedeMostrarse).map((scenario) => {
    const lineas = [
      { key: "revenue", label: "Facturación incremental", linea: scenario.facturacionIncremental },
      { key: "contribution", label: "Contribución incremental", linea: scenario.contribucionIncremental },
      { key: "adSavings", label: "Ahorro publicitario", linea: scenario.ahorroPublicitario },
    ] as const;

    const publicado: Record<string, PublishedNumber | null> = {};
    const paso90: Record<string, PublishedNumber | null> = {};
    const levers: Extract<DocumentBlock, { type: "scenarios" }>["items"][number]["levers"] = [];

    for (const { key, label, linea } of lineas) {
      publicado[key] = publishValue(linea.acumulado90d, "money");
      paso90[key] = publishValue(linea.ritmoMensualDia90, "money");
      const retained = [
        retainedRestriction(
          `escenario:${scenario.id}:${key}:acumulado`,
          `${label} retenida · ${scenario.id}`,
          linea.acumulado90d,
        ),
        retainedRestriction(
          `escenario:${scenario.id}:${key}:ritmo`,
          `${label} (ritmo) retenida · ${scenario.id}`,
          linea.ritmoMensualDia90,
        ),
      ].filter((value): value is RestriccionDocumento => value !== null);
      restrictions.push(...retained);

      const tipo =
        key === "revenue"
          ? ("facturacion_incremental" as const)
          : key === "contribution"
            ? ("contribucion_incremental" as const)
            : ("ahorro_publicitario" as const);
      for (const lever of linea.palancas) {
        const amount = publishValue(lever.monto, "money");
        const restriction = retainedRestriction(
          `escenario:${scenario.id}:palanca:${key}:${lever.id}`,
          `Palanca retenida · ${lever.nombre}`,
          lever.monto,
        );
        if (restriction) restrictions.push(restriction);
        if (amount) levers.push({ id: lever.id, name: lever.nombre, type: tipo, amount });
      }
    }

    const monthly = scenario.mensual.map((mes) => ({
      month: mes.mes,
      revenueProjected: publishValue(mes.facturacionProyectada, "money"),
      revenueEnabled: publishValue(mes.facturacionIncrementalHabilitada, "money"),
      contributionEnabled: publishValue(mes.contribucionIncrementalHabilitada, "money"),
      adSavingsEnabled: publishValue(mes.ahorroPublicitarioHabilitado, "money"),
    }));

    return {
      id: scenario.id,
      confidence: scenario.confianza,
      revenue90d: publicado["revenue"] ?? null,
      contribution90d: publicado["contribution"] ?? null,
      adSavings90d: publicado["adSavings"] ?? null,
      revenuePaceDay90: paso90["revenue"] ?? null,
      contributionPaceDay90: paso90["contribution"] ?? null,
      adSavingsPaceDay90: paso90["adSavings"] ?? null,
      monthly,
      levers,
      assumptions: [...scenario.supuestos],
      restrictions: [...scenario.restriccionesAplicadas],
    };
  });

  return {
    block: items.length > 0 ? { type: "scenarios", items } : null,
    restrictions,
  };
}

/**
 * Encabezado comercial de 90 días (corrección aprobada 2026-08-21, puntos
 * 2, 4, 6 y 7). `null` cuando el documento no proyecta (diagnóstico:
 * `context.resumenComercial` ya es `null` desde el contrato).
 */
export function buildCommercialSummary(context: DocumentContextV1): {
  block: DocumentBlock | null;
  restrictions: RestriccionDocumento[];
} {
  if (!context.resumenComercial) return { block: null, restrictions: [] };
  const r = context.resumenComercial;
  const restrictions: RestriccionDocumento[] = [];

  const headline = publishValue(r.cifraPrincipal, "money");
  const headlineRetained = retainedRestriction(
    "resumen-comercial:cifra-principal",
    "Cifra principal retenida",
    r.cifraPrincipal,
  );
  if (headlineRetained) restrictions.push(headlineRetained);

  const lower = publishValue(r.limiteInferior, "money");
  const upper = publishValue(r.limiteSuperior, "money");

  return {
    block: {
      type: "commercial-summary",
      scenarioCommunicated: r.escenarioComunicado,
      headline,
      range: { lower, upper, upperScenarioId: r.idEscenarioLimiteSuperior },
      statement: r.redaccion,
      dispersion: {
        ratio: r.dispersion.ratio,
        threshold: r.dispersion.umbral,
        high: r.dispersion.alta,
        dataToCloseIt: [...r.dispersion.datosParaCerrarla],
      },
    },
    restrictions,
  };
}

export function buildCommercialOffer(context: DocumentContextV1): {
  block: DocumentBlock | null;
  restrictions: RestriccionDocumento[];
} {
  const commercial = context.comercial;
  if (!commercial || commercial.niveles.length === 0) {
    return { block: null, restrictions: [] };
  }

  const restrictions: RestriccionDocumento[] = [];
  const niveles = commercial.niveles.map((nivel) => {
    const price = publishValue(nivel.precio, "money");
    const restriction = retainedRestriction(
      `comercial:${nivel.id}:precio`,
      `Precio retenido · ${nivel.nombre}`,
      nivel.precio,
    );
    if (restriction) restrictions.push(restriction);
    return {
      id: nivel.id,
      name: nivel.nombre,
      services: nivel.servicios.map((servicio) => ({
        service: servicio.servicio,
        unit: servicio.unidad,
        quantity: servicio.cantidad,
        description: servicio.descripcion,
        findingIds: [...servicio.hallazgoIds],
      })),
      price,
    };
  });

  return {
    block: { type: "commercial-offer", niveles },
    restrictions,
  };
}

export function mergeRestrictions(...groups: RestriccionDocumento[][]): RestriccionDocumento[] {
  const byId = new Map<string, RestriccionDocumento>();
  for (const item of groups.flat()) byId.set(item.id, item);
  return [...byId.values()];
}
