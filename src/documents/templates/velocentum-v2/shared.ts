import type { DocumentContextV1, RestriccionDocumento } from "../../domain";
import { buildRestrictionsGroupedV2 } from "./blocks";
import type { DocumentBlockV2, DocumentModelV2, DocumentSectionV2 } from "./types";

export function createModelV2(args: {
  context: DocumentContextV1;
  templateId: string;
  kind: DocumentModelV2["kind"];
  title: string;
  sections: DocumentSectionV2[];
}): DocumentModelV2 {
  return {
    schemaVersion: "document-model-v2/1",
    templateId: args.templateId,
    kind: args.kind,
    source: {
      contextSchemaVersion: args.context.schemaVersion,
      templateVersion: args.context.templateVersion,
      rulesetVersion: args.context.rulesetVersion,
      diagnosticId: args.context.diagnostico.id,
      diagnosticVersion: args.context.diagnostico.version,
    },
    metadata: {
      title: args.title,
      clientName: args.context.cliente.nombre,
      date: args.context.diagnostico.fecha,
    },
    sections: args.sections.filter((section) => section.blocks.length > 0),
  };
}

export function coverSectionV2(
  context: DocumentContextV1,
  title: string,
  subtitle: string,
  kind: DocumentModelV2["kind"],
  templateId: string,
): DocumentSectionV2 {
  // Versión tomada del identificador de plantilla ya existente (C10, ronda
  // 2.1): "velocentum-diagnostico/v2" -> "v2". Si el identificador no trae
  // el separador esperado, se documenta el caso y no se muestra un valor
  // inventado (se usa el identificador completo, nunca un placeholder).
  const version = templateId.includes("/") ? (templateId.split("/").pop() ?? templateId) : templateId;
  return {
    id: "cover",
    tone: "dark",
    eyebrow: "Velocentum · Diagnóstico e-commerce",
    title,
    blocks: [
      {
        type: "cover",
        title,
        subtitle,
        clientName: context.cliente.nombre,
        diagnosticDate: context.diagnostico.fecha,
        documentKind: kind,
        version,
      },
    ],
  };
}

export function coverageSectionV2(context: DocumentContextV1): DocumentSectionV2 {
  return {
    id: "coverage",
    tone: "soft",
    eyebrow: "Calidad de evidencia",
    title: "Qué tan completa es la lectura",
    blocks: [
      {
        type: "coverage",
        confidence: context.cobertura.confianza,
        items: [
          {
            id: "general",
            label: "Cobertura general",
            value: context.cobertura.general,
            origen: null,
          },
          {
            id: "canales",
            label: "Cobertura de canales",
            value: context.cobertura.canales,
            origen: context.evidencia["mix_canales"]?.estado ?? null,
          },
          {
            id: "productos",
            label: "Cobertura de productos",
            value: context.cobertura.productos,
            origen: context.evidencia["productos_muestra"]?.estado ?? null,
          },
        ],
      },
    ],
  };
}

export function transitionSectionV2(id: string, label: string): DocumentSectionV2 {
  return { id, tone: "dark", eyebrow: null, title: null, blocks: [{ type: "transition", label }] };
}

export function nextStepSectionV2(label: string): DocumentSectionV2 {
  return {
    id: "next-step",
    tone: "dark",
    eyebrow: "Próximo paso",
    title: "Cómo seguimos",
    blocks: [{ type: "next-step", label }],
  };
}

export function restrictionsGroupedSectionV2(items: RestriccionDocumento[]): DocumentSectionV2 {
  const block = buildRestrictionsGroupedV2(items);
  return {
    id: "restrictions",
    tone: "soft",
    eyebrow: "Condiciones de lectura",
    title: "Qué falta validar",
    blocks: block ? [block] : [],
  };
}

/**
 * BV4 F2a ronda 2: con selección comercial v2, el plan se arma desde ELLA
 * (`context.roadmapV2`), no desde la escalera legada. Si no, el plan
 * describiría un paquete distinto del que el documento cotiza.
 *
 * `context.roadmap` queda como está y lo siguen renderizando las plantillas
 * v1, cuya salida no cambia. `roadmapV2` es `null` exactamente cuando no hay
 * selección v2, y entonces esta función se comporta igual que antes.
 */
export function roadmapSectionV2(context: DocumentContextV1): DocumentSectionV2 {
  const items = context.roadmapV2 ?? context.roadmap;
  return {
    id: "roadmap",
    tone: "light",
    eyebrow: "Plan de acción",
    title: "Hoja de ruta",
    blocks: items.length > 0 ? [{ type: "roadmap", items }] : [],
  };
}

export function methodologySectionV2(context: DocumentContextV1): DocumentSectionV2 {
  return {
    id: "methodology",
    tone: "soft",
    eyebrow: "Trazabilidad",
    title: "Metodología y supuestos",
    blocks: context.metodologia.length > 0 ? [{ type: "methodology", items: context.metodologia }] : [],
  };
}

export function contentSectionV2(args: {
  id: string;
  eyebrow: string;
  title: string;
  blocks: Array<DocumentBlockV2 | null>;
  tone?: DocumentSectionV2["tone"];
}): DocumentSectionV2 {
  return {
    id: args.id,
    tone: args.tone ?? "light",
    eyebrow: args.eyebrow,
    title: args.title,
    blocks: args.blocks.filter((block): block is DocumentBlockV2 => block !== null),
  };
}

export function mergeRestrictionsV2(...groups: RestriccionDocumento[][]): RestriccionDocumento[] {
  const byId = new Map<string, RestriccionDocumento>();
  for (const item of groups.flat()) byId.set(item.id, item);
  return [...byId.values()];
}
