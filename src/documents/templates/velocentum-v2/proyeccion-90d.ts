import type { DocumentContextV1 } from "../../domain";
import {
  buildChannelComparisonV2,
  buildCommercialSummaryV2,
  buildCoverageBlockV2,
  buildMetricGridV2,
  buildScenariosV2,
  buildShippingV2,
} from "./blocks";
import {
  contentSectionV2,
  coverSectionV2,
  createModelV2,
  methodologySectionV2,
  nextStepSectionV2,
  restrictionsGroupedSectionV2,
  roadmapSectionV2,
  transitionSectionV2,
} from "./shared";

/** Espejo de `templates/velocentum-v1/proyeccion-90d.ts`, con los bloques v2. */
export function buildProyeccion90dDocumentV2(context: DocumentContextV1) {
  const coverage = buildCoverageBlockV2(context);
  const metrics = buildMetricGridV2(context);
  const channelComparison = buildChannelComparisonV2(context);
  const shipping = buildShippingV2(context);
  const scenarios = buildScenariosV2(context);
  const summary = buildCommercialSummaryV2(context);

  return createModelV2({
    context,
    templateId: "velocentum-proyeccion-90d/v2",
    kind: "proyeccion_90d",
    title: "Plan de crecimiento a 90 días",
    sections: [
      coverSectionV2(
        context,
        "Plan de crecimiento a 90 días",
        "Escenarios condicionados por evidencia, capacidad y rentabilidad.",
      ),
      // Cifra destacada + cobertura de evidencia en una sola sección
      // (corrección de auditoría, ronda 1): cada una por separado (un
      // número grande, tres barras) dejaba su página muy por debajo del
      // umbral de ocupación de R-01; juntas, "cuánto" y "con qué confianza"
      // son una lectura coherente.
      contentSectionV2({
        id: "commercial-summary",
        eyebrow: "Lo que importa",
        title: "Contribución incremental proyectada",
        blocks: [summary, coverage],
        tone: "dark",
      }),
      contentSectionV2({
        id: "projection-baseline",
        eyebrow: "Línea de base",
        title: "Punto de partida validado",
        // Comparación de canales primero (corrección de auditoría, ronda 1):
        // la grilla de 9 métricas por sí sola ya ocupa una página completa,
        // así que un bloque corto después de ella siempre terminaba solo en
        // la página de continuación. Antes de la grilla, comparte página.
        blocks: [channelComparison, metrics, shipping],
      }),
      restrictionsGroupedSectionV2(context.restricciones),
      transitionSectionV2("projection-transition", "Tres meses, una secuencia medible"),
      contentSectionV2({
        id: "scenarios",
        eyebrow: "Escenarios",
        title: "Qué puede ocurrir en 90 días, mes a mes",
        blocks: [scenarios],
      }),
      methodologySectionV2(context),
      roadmapSectionV2(context),
      nextStepSectionV2("Confirmar el escenario de planificación y activar el roadmap."),
    ],
  });
}
