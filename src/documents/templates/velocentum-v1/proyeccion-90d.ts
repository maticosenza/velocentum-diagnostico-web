import type { DocumentContextV1 } from "../../domain";
import { buildMetricGrid, buildScenarios, buildShipping, mergeRestrictions } from "./blocks";
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

export function buildProyeccion90dDocument(context: DocumentContextV1) {
  const metrics = buildMetricGrid(context);
  const shipping = buildShipping(context);
  const scenarios = buildScenarios(context);
  const restrictions = mergeRestrictions(
    context.restricciones,
    metrics.restrictions,
    shipping.restrictions,
    scenarios.restrictions,
  );

  return createModel({
    context,
    templateId: "velocentum-proyeccion-90d/v1",
    kind: "proyeccion_90d",
    title: "Plan de crecimiento a 90 días",
    sections: [
      coverSection(
        context,
        "Plan de crecimiento a 90 días",
        "Escenarios condicionados por evidencia, capacidad y rentabilidad.",
      ),
      coverageSection(context),
      contentSection({
        id: "projection-baseline",
        eyebrow: "Línea de base",
        title: "Desde dónde proyectamos",
        blocks: [metrics.block, shipping.block],
      }),
      transitionSection("projection-transition", "Tres meses, una secuencia medible"),
      contentSection({
        id: "scenarios",
        eyebrow: "Escenarios",
        title: "Qué puede ocurrir en 90 días",
        blocks: [scenarios.block],
      }),
      restrictionSection(restrictions),
      roadmapSection(context),
      methodologySection(context),
      transitionSection("projection-close", "La proyección se actualiza con evidencia real"),
    ],
  });
}
