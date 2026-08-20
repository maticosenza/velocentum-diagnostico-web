import type { DocumentContextV1 } from "../../domain";
import { buildCommercialOffer, buildFindings, mergeRestrictions } from "./blocks";
import { buildProyeccion90dDocument } from "./proyeccion-90d";
import {
  contentSection,
  coverSection,
  createModel,
  restrictionSection,
  transitionSection,
} from "./shared";

const OMITTED_PROJECTION_SECTION_IDS = new Set(["cover", "projection-close"]);

export function buildProyeccionPropuestaDocument(context: DocumentContextV1) {
  const projection = buildProyeccion90dDocument(context);
  const findings = buildFindings(context);
  const commercial = buildCommercialOffer(context);
  const proposalRestrictions = mergeRestrictions(findings.restrictions, commercial.restrictions);
  const proposalRestrictionSection = restrictionSection(proposalRestrictions);
  proposalRestrictionSection.id = "proposal-restrictions";

  return createModel({
    context,
    templateId: "velocentum-proyeccion-propuesta/v1",
    kind: "proyeccion_propuesta",
    title: "Proyección y propuesta",
    sections: [
      coverSection(
        context,
        "Proyección y propuesta",
        "Un plan de 90 días conectado con una intervención concreta.",
      ),
      ...projection.sections.filter((section) => !OMITTED_PROJECTION_SECTION_IDS.has(section.id)),
      transitionSection("combined-transition", "De la oportunidad al plan de trabajo"),
      contentSection({
        id: "proposal-context",
        eyebrow: "Por qué ahora",
        title: "Prioridades que orientan la propuesta",
        blocks: [findings.block],
      }),
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
      proposalRestrictionSection,
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
