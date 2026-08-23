import type { DocumentContextV1 } from "../../domain";
import { buildChannelComparisonV2, buildCoverageBlockV2, buildFindingsV2, buildMetricGridV2, buildShippingV2 } from "./blocks";
import {
  contentSectionV2,
  coverSectionV2,
  createModelV2,
  methodologySectionV2,
  nextStepSectionV2,
  restrictionsGroupedSectionV2,
  transitionSectionV2,
} from "./shared";

/** Espejo de `templates/velocentum-v1/diagnostico.ts`, con los bloques v2. */
export function buildDiagnosticoDocumentV2(context: DocumentContextV1) {
  const coverage = buildCoverageBlockV2(context);
  const metrics = buildMetricGridV2(context);
  const channelComparison = buildChannelComparisonV2(context);
  const shipping = buildShippingV2(context);
  const findings = buildFindingsV2(context, "diagnostico");

  return createModelV2({
    context,
    templateId: "velocentum-diagnostico/v2",
    kind: "diagnostico",
    title: "Diagnóstico e-commerce",
    sections: [
      coverSectionV2(
        context,
        "Diagnóstico e-commerce",
        "Una lectura ejecutiva basada en la evidencia disponible.",
      ),
      // Cobertura + foto actual en una sola sección (corrección de auditoría,
      // ronda 1): la cobertura sola (3 barras) dejaba la página muy por
      // debajo del umbral de ocupación de R-01.
      contentSectionV2({
        id: "current-state",
        eyebrow: "Punto de partida",
        title: "Cobertura y foto actual: economía, canales y publicidad",
        // Bloques cortos antes de la grilla de 9 métricas (corrección de
        // auditoría, ronda 1): la grilla por sí sola ya ocupa la página
        // completa, así que un bloque corto después de ella terminaba solo
        // en la página de continuación.
        blocks: [coverage, channelComparison, metrics, shipping],
      }),
      transitionSectionV2("diagnostic-transition", "De los datos a las prioridades"),
      contentSectionV2({
        id: "findings",
        eyebrow: "Diagnóstico",
        title: "Funnel, retención y hallazgos priorizados",
        blocks: [findings],
      }),
      restrictionsGroupedSectionV2(context.restricciones),
      methodologySectionV2(context),
      nextStepSectionV2("Validar los hallazgos priorizados y definir con qué se arranca."),
    ],
  });
}
