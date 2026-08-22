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

/**
 * Fase 11/12 (estructura de contenido, 2026-08-22): separa el mismo array
 * de restricciones en dos secciones disjuntas, sin agregar ningún dato
 * nuevo. "Riesgos y contradicciones" son las que ya bloquean algo
 * (`bloquea.length > 0`: mix inválido, contradicción de margen, etc.);
 * "datos faltantes" son las que no bloquean nada crítico, sólo informan
 * que algo no se pudo publicar. Una restricción nunca aparece en las dos.
 */
export function riskSection(items: RestriccionDocumento[]): DocumentSection {
  const riesgos = items.filter((r) => r.bloquea.length > 0);
  return {
    id: "risks",
    tone: "soft",
    eyebrow: "Antes de leer las cifras",
    title: "Riesgos y contradicciones",
    blocks: riesgos.length > 0 ? [{ type: "restrictions", items: riesgos }] : [],
  };
}

export function missingDataSection(items: RestriccionDocumento[]): DocumentSection {
  const faltantes = items.filter((r) => r.bloquea.length === 0);
  return {
    id: "missing-data",
    tone: "soft",
    eyebrow: "Transparencia",
    title: "Datos faltantes",
    blocks: faltantes.length > 0 ? [{ type: "restrictions", items: faltantes }] : [],
  };
}

/**
 * Condiciones para escalar o recalcular la proyección (sección propia del
 * PDF de proyección): el subconjunto de restricciones que efectivamente
 * bloquea "escalamiento", no todo lo que falta en general.
 */
export function scalingConditionsSection(items: RestriccionDocumento[]): DocumentSection {
  const condiciones = items.filter((r) => r.bloquea.includes("escalamiento"));
  return {
    id: "scaling-conditions",
    tone: "soft",
    eyebrow: "Antes de escalar",
    title: "Condiciones para escalar y recalcular",
    blocks: condiciones.length > 0 ? [{ type: "restrictions", items: condiciones }] : [],
  };
}

/**
 * "Prioridades inmediatas" ⊆ "Hallazgos priorizados": el mismo bloque de
 * hallazgos, filtrado a `prioridad === "alta"`. Nunca un dato nuevo, nunca
 * un hallazgo que no haya aparecido ya en la sección de hallazgos.
 */
export function immediatePrioritiesSection(findingsBlock: DocumentBlock | null): DocumentSection {
  const items =
    findingsBlock && findingsBlock.type === "findings"
      ? findingsBlock.items.filter((item) => item.prioridad === "alta")
      : [];
  return {
    id: "immediate-priorities",
    tone: "light",
    eyebrow: "Foco inmediato",
    title: "Prioridades inmediatas",
    blocks: items.length > 0 ? [{ type: "findings", items }] : [],
  };
}

export function nextStepSection(label: string): DocumentSection {
  return {
    id: "next-step",
    tone: "dark",
    eyebrow: "Próximo paso",
    title: "Cómo seguimos",
    blocks: [{ type: "next-step", label }],
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
