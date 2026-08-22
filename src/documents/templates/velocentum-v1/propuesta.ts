import type { DocumentContextV1 } from "../../domain";
import { buildCommercialOffer, buildCommercialSummary, buildFindings, mergeRestrictions } from "./blocks";
import {
  contentSection,
  coverSection,
  createModel,
  restrictionSection,
  roadmapSection,
  transitionSection,
} from "./shared";

export function buildPropuestaDocument(context: DocumentContextV1) {
  const findings = buildFindings(context);
  const commercial = buildCommercialOffer(context);
  const summary = buildCommercialSummary(context);
  const restrictions = mergeRestrictions(
    context.restricciones,
    findings.restrictions,
    commercial.restrictions,
    summary.restrictions,
  );

  return createModel({
    context,
    templateId: "velocentum-propuesta/v1",
    kind: "propuesta",
    title: "Propuesta de trabajo",
    sections: [
      coverSection(
        context,
        "Propuesta de trabajo",
        "Una intervención alineada con las prioridades validadas.",
      ),
      // Una sola cifra arriba (corrección aprobada 2026-08-21, punto 4): el
      // resto (hallazgos, alcance, paquete) va abajo, en detalle.
      contentSection({
        id: "commercial-summary",
        eyebrow: "Lo que importa",
        title: "Contribución incremental proyectada",
        blocks: [summary.block],
        tone: "dark",
      }),
      contentSection({
        id: "proposal-context",
        eyebrow: "Por qué ahora",
        title: "Prioridades que orientan la propuesta",
        blocks: [findings.block],
      }),
      transitionSection("proposal-transition", "Del diagnóstico a la ejecución"),
      contentSection({
        id: "services",
        eyebrow: "Alcance",
        title: "Qué vamos a trabajar",
        blocks:
          context.servicios.length > 0 ? [{ type: "services", items: context.servicios }] : [],
      }),
      contentSection({
        id: "commercial-offer",
        eyebrow: "Propuesta comercial",
        title: "Paquete seleccionado",
        blocks: [commercial.block],
        tone: "soft",
      }),
      restrictionSection(restrictions),
      roadmapSection(context),
      contentSection({
        id: "next-step",
        eyebrow: "Próximo paso",
        title: "Cómo avanzamos",
        blocks: [{ type: "next-step", label: "Validar alcance, responsables y fecha de inicio." }],
        tone: "dark",
      }),
    ],
  });
}
