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
): DocumentSectionV2 {
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
          { id: "general", label: "Cobertura general", value: context.cobertura.general },
          { id: "canales", label: "Cobertura de canales", value: context.cobertura.canales },
          { id: "productos", label: "Cobertura de productos", value: context.cobertura.productos },
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

export function roadmapSectionV2(context: DocumentContextV1): DocumentSectionV2 {
  return {
    id: "roadmap",
    tone: "light",
    eyebrow: "Plan de acción",
    title: "Hoja de ruta",
    blocks: context.roadmap.length > 0 ? [{ type: "roadmap", items: context.roadmap }] : [],
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
