import type { DocumentContextV1 } from "../../domain";
import { buildFindings, buildMetricGrid, buildShipping, mergeRestrictions } from "./blocks";
import {
  contentSection,
  coverSection,
  coverageSection,
  createModel,
  methodologySection,
  restrictionSection,
  roadmapSection,
  transitionSection,
} from "./shared";

export function buildDiagnosticoDocument(context: DocumentContextV1) {
  const metrics = buildMetricGrid(context);
  const shipping = buildShipping(context);
  const findings = buildFindings(context);
  const restrictions = mergeRestrictions(
    context.restricciones,
    metrics.restrictions,
    shipping.restrictions,
    findings.restrictions,
  );

  return createModel({
    context,
    templateId: "velocentum-diagnostico/v1",
    kind: "diagnostico",
    title: "Diagnóstico e-commerce",
    sections: [
      coverSection(
        context,
        "Diagnóstico e-commerce",
        "Una lectura ejecutiva basada en la evidencia disponible.",
      ),
      coverageSection(context),
      contentSection({
        id: "current-state",
        eyebrow: "Punto de partida",
        title: "Números actuales",
        blocks: [metrics.block, shipping.block],
      }),
      transitionSection("diagnostic-transition", "De los datos a las prioridades"),
      contentSection({
        id: "findings",
        eyebrow: "Diagnóstico",
        title: "Hallazgos priorizados",
        blocks: [findings.block],
      }),
      restrictionSection(restrictions),
      roadmapSection(context),
      methodologySection(context),
      transitionSection("diagnostic-close", "Próximo paso: validar y ejecutar"),
    ],
  });
}
