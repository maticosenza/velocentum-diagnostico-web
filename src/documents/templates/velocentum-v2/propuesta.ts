import type { DocumentContextV1 } from "../../domain";
import { buildBridgeNoteV2, buildCommercialOfferV2, buildCommercialSummaryV2, buildFindingsV2 } from "./blocks";
import {
  contentSectionV2,
  coverSectionV2,
  createModelV2,
  restrictionsGroupedSectionV2,
  roadmapSectionV2,
  transitionSectionV2,
} from "./shared";

/**
 * Espejo de `templates/velocentum-v1/propuesta.ts`, con los bloques v2.
 * Diferencia deliberada respecto de v1 (E-08 acotado, única excepción de
 * alcance permitida — contrato sección 2.18): `buildFindingsV2` recibe
 * `variante: "propuesta"`, así que sólo muestra los hallazgos de capa
 * "servicio" en vez de duplicar exactamente el diagnóstico completo.
 */
export function buildPropuestaDocumentV2(context: DocumentContextV1) {
  const findings = buildFindingsV2(context, "propuesta");
  const commercial = buildCommercialOfferV2(context);
  const summary = buildCommercialSummaryV2(context);
  const bridge = buildBridgeNoteV2(context);

  return createModelV2({
    context,
    templateId: "velocentum-propuesta/v2",
    kind: "propuesta",
    title: "Propuesta de trabajo",
    sections: [
      coverSectionV2(
        context,
        "Propuesta de trabajo",
        "Una intervención alineada con las prioridades validadas.",
      ),
      contentSectionV2({
        id: "commercial-summary",
        eyebrow: "Lo que importa",
        title: "Contribución incremental proyectada",
        blocks: [summary, bridge],
        tone: "dark",
      }),
      contentSectionV2({
        id: "proposal-context",
        eyebrow: "Por qué ahora",
        title: "Prioridades que resolvemos en este paquete",
        blocks: [findings],
      }),
      transitionSectionV2("proposal-transition", "Del diagnóstico a la ejecución"),
      contentSectionV2({
        id: "services",
        eyebrow: "Alcance",
        title: "Qué vamos a trabajar",
        blocks: context.servicios.length > 0 ? [{ type: "services", items: context.servicios }] : [],
      }),
      contentSectionV2({
        id: "commercial-offer",
        eyebrow: "Propuesta comercial",
        title: "Paquete seleccionado",
        blocks: [commercial],
        tone: "soft",
      }),
      restrictionsGroupedSectionV2(context.restricciones),
      roadmapSectionV2(context),
      contentSectionV2({
        id: "next-step",
        eyebrow: "Próximo paso",
        title: "Cómo avanzamos",
        blocks: [{ type: "next-step", label: "Validar alcance, responsables y fecha de inicio." }],
        tone: "dark",
      }),
    ],
  });
}
