import type { DocumentContextV1, RestriccionDocumento } from "../../domain";
import type { DocumentBlock, DocumentModel, DocumentSection, VelocentumTemplateId } from "./types";

export function createModel(args: {
  context: DocumentContextV1;
  templateId: VelocentumTemplateId;
  kind: DocumentModel["kind"];
  title: string;
  sections: DocumentSection[];
}): DocumentModel {
  return {
    schemaVersion: "document-model/1",
    templateId: args.templateId,
    themeId: "velocentum-light/v1",
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

export function coverSection(
  context: DocumentContextV1,
  title: string,
  subtitle: string,
): DocumentSection {
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

export function coverageSection(context: DocumentContextV1): DocumentSection {
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

export function transitionSection(id: string, label: string): DocumentSection {
  return {
    id,
    tone: "dark",
    eyebrow: null,
    title: null,
    blocks: [{ type: "transition", label }],
  };
}

export function restrictionSection(items: RestriccionDocumento[]): DocumentSection {
  return {
    id: "restrictions",
    tone: "soft",
    eyebrow: "Condiciones de lectura",
    title: "Qué falta validar",
    blocks: items.length > 0 ? [{ type: "restrictions", items }] : [],
  };
}

export function roadmapSection(context: DocumentContextV1): DocumentSection {
  return {
    id: "roadmap",
    tone: "light",
    eyebrow: "Plan de acción",
    title: "Hoja de ruta",
    blocks: context.roadmap.length > 0 ? [{ type: "roadmap", items: context.roadmap }] : [],
  };
}

export function methodologySection(context: DocumentContextV1): DocumentSection {
  return {
    id: "methodology",
    tone: "soft",
    eyebrow: "Trazabilidad",
    title: "Metodología y supuestos",
    blocks:
      context.metodologia.length > 0 ? [{ type: "methodology", items: context.metodologia }] : [],
  };
}

export function contentSection(args: {
  id: string;
  eyebrow: string;
  title: string;
  blocks: Array<DocumentBlock | null>;
  tone?: DocumentSection["tone"];
}): DocumentSection {
  return {
    id: args.id,
    tone: args.tone ?? "light",
    eyebrow: args.eyebrow,
    title: args.title,
    blocks: args.blocks.filter((block): block is DocumentBlock => block !== null),
  };
}
