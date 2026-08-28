import type { DocumentContextV1 } from "../../domain";
import {
  buildChannelComparisonV2,
  buildCoverageBlockV2,
  buildFindingsV2,
  buildFortalezasV2,
  buildFunnelV2,
  buildMetricGridV2,
  buildShippingV2,
  dedupeMetricGridV2,
} from "./blocks";
import {
  contentSectionV2,
  coverSectionV2,
  createModelV2,
  methodologySectionV2,
  nextStepSectionV2,
  restrictionsGroupedSectionV2,
  transitionSectionV2,
} from "./shared";

const TEMPLATE_ID = "velocentum-diagnostico/v2";

/** Espejo de `templates/velocentum-v1/diagnostico.ts`, con los bloques v2. */
export function buildDiagnosticoDocumentV2(context: DocumentContextV1) {
  const coverage = buildCoverageBlockV2(context);
  const channelComparison = buildChannelComparisonV2(context);
  // C6, ronda 2.1: cuando la comparación entre canales está presente, MER
  // tienda/marketplace no se repiten en la grilla de métricas.
  const metrics = dedupeMetricGridV2(buildMetricGridV2(context), channelComparison);
  const shipping = buildShippingV2(context);
  const fortalezas = buildFortalezasV2(context);
  // R-09 (Bloque Visual 3): funnel web de tienda propia. `null` cuando no
  // aplica al canal, no hay datos o hay un error de coherencia — mismo
  // criterio que `fortalezas`, nunca un bloque vacío con encabezado.
  const funnel = buildFunnelV2(context);
  const findings = buildFindingsV2(context, "diagnostico");

  return createModelV2({
    context,
    templateId: TEMPLATE_ID,
    kind: "diagnostico",
    title: "Diagnóstico e-commerce",
    sections: [
      coverSectionV2(
        context,
        "Diagnóstico e-commerce",
        "Una lectura ejecutiva basada en la evidencia disponible.",
        "diagnostico",
        TEMPLATE_ID,
      ),
      // Cobertura + foto actual en una sola sección (corrección de auditoría,
      // ronda 1): la cobertura sola (3 barras) dejaba la página muy por
      // debajo del umbral de ocupación de R-01.
      contentSectionV2({
        id: "current-state",
        eyebrow: "Punto de partida",
        title: "Cobertura y foto actual: economía, canales y publicidad",
        // Bloques cortos ANTES de la grilla de 9 métricas (`metrics` al
        // final, no al principio) — corrección de auditoría, ronda 1 y
        // C-1 (Bloque Visual 3.1): la grilla por sí sola ya ocupa una
        // página casi completa, así que cualquier bloque corto que la
        // siguiera terminaba solo en la página de continuación (defecto
        // real encontrado con `fortalezas`, un único ítem en el caso
        // "1-marketplace-fuerte-tienda-floja": página de continuación con
        // una sola tarjeta y ~78% en blanco). Con `metrics` al final, la
        // fila de continuación que le corresponde a ELLA es el residuo ya
        // documentado y aceptado (contrato de composición v2, sección 5.8,
        // primera viñeta) — no un nuevo defecto. Sin inventar contenido,
        // sólo reordenando bloques reales.
        blocks: [coverage, channelComparison, fortalezas, shipping, funnel, metrics],
      }),
      transitionSectionV2("diagnostic-transition", "De los datos a las prioridades"),
      contentSectionV2({
        id: "findings",
        eyebrow: "Diagnóstico",
        // DA-3 (Bloque 3 Funcional): renombrado — la página trae
        // hallazgos (`buildFindingsV2`). R-09 (Bloque Visual 3): el
        // funnel web ya se construye (bloque `funnel` en la sección
        // "current-state" de arriba); la retención sigue sin resolver —
        // el motor no expone un derivado estructurado para eso, ver
        // `docs/funcional/contrato-bloque-3.md` sección 7.
        title: "Hallazgos priorizados",
        blocks: [findings],
      }),
      restrictionsGroupedSectionV2(context.restricciones),
      methodologySectionV2(context),
      nextStepSectionV2("Validar los hallazgos priorizados y definir con qué se arranca."),
    ],
  });
}
