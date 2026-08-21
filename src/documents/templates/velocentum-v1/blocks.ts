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
    const contribution90d = publishValue(scenario.contribucionAcumulada90d, "money");
    const monthlyPaceDay90 = publishValue(scenario.ritmoMensualDia90, "money");
    const retained = [
      retainedRestriction(
        `escenario:${scenario.id}:contribucion`,
        `Contribución retenida · ${scenario.id}`,
        scenario.contribucionAcumulada90d,
      ),
      retainedRestriction(
        `escenario:${scenario.id}:ritmo`,
        `Ritmo mensual retenido · ${scenario.id}`,
        scenario.ritmoMensualDia90,
      ),
    ].filter((value): value is RestriccionDocumento => value !== null);
    restrictions.push(...retained);

    const levers = scenario.palancas.flatMap((lever) => {
      const contribution = publishValue(lever.contribucion, "money");
      const restriction = retainedRestriction(
        `escenario:${scenario.id}:palanca:${lever.id}`,
        `Palanca retenida · ${lever.nombre}`,
        lever.contribucion,
      );
      if (restriction) restrictions.push(restriction);
      return contribution ? [{ id: lever.id, name: lever.nombre, contribution }] : [];
    });

    const monthly = scenario.mensual.map((mes) => ({
      month: mes.mes,
      revenueProjected: publishValue(mes.facturacionProyectada, "money"),
      opportunityEnabled: publishValue(mes.oportunidadHabilitada, "money"),
    }));

    return {
      id: scenario.id,
      confidence: scenario.confianza,
      contribution90d,
      monthlyPaceDay90,
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

export function buildCommercialOffer(context: DocumentContextV1): {
  block: DocumentBlock | null;
  restrictions: RestriccionDocumento[];
} {
  const commercial = context.comercial;
  if (!commercial || commercial.aprobadaManualmente !== true) {
    return { block: null, restrictions: [] };
  }

  let price: PublishedNumber | null = null;
  const restrictions: RestriccionDocumento[] = [];
  if (commercial.incluirPrecioEnPdf) {
    const publishable = publicarNumeroDesdeEvidencia("comercial.precio", commercial.precio);
    price = publishValue(publishable, "money");
    const restriction = retainedRestriction(
      "comercial:precio",
      "Precio comercial retenido",
      publishable,
    );
    if (restriction) restrictions.push(restriction);
  }

  return {
    block: {
      type: "commercial-offer",
      packageId: commercial.paqueteId,
      name: commercial.nombre,
      scope: [...commercial.alcance],
      exclusions: [...commercial.exclusiones],
      deliverables: [...commercial.entregables],
      durationDays: commercial.duracionDias,
      paymentTerms: commercial.formaPago,
      startDate: commercial.inicio,
      price,
    },
    restrictions,
  };
}

export function mergeRestrictions(...groups: RestriccionDocumento[][]): RestriccionDocumento[] {
  const byId = new Map<string, RestriccionDocumento>();
  for (const item of groups.flat()) byId.set(item.id, item);
  return [...byId.values()];
}
