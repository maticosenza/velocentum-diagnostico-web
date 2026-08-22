import type { DocumentContextV1 } from "../../domain";
import {
  buildCommercialSummary,
  buildMetricGrid,
  buildScenarios,
  buildShipping,
  mergeRestrictions,
} from "./blocks";
import {
  contentSection,
  coverSection,
  coverageSection,
  createModel,
  methodologySection,
  nextStepSection,
  restrictionSection,
  roadmapSection,
  scalingConditionsSection,
  transitionSection,
} from "./shared";

/**
 * Estructura de contenido reconciliada con el plan maestro (fase 11/12,
 * `docs/fase11-12-diseno-tecnico.md`): once secciones. El detalle mes 1/2/3,
 * la facturación incremental secundaria y el ahorro publicitario separado
 * (puntos 5, 7 y 8 del plan maestro) ya viven DENTRO del bloque
 * `scenarios` existente (cada escenario trae sus tres magnitudes por
 * separado, nunca sumadas) — no son secciones de página aparte, es
 * reordenar/titular lo que ya existe.
 *
 * La cifra de contribución incremental encabeza el documento (después de
 * portada), ANTES de la línea de base y de los escenarios en detalle: esto
 * es una regla dura ya aprobada (corrección 2026-08-21, punto 2 — "la
 * cifra dominante SIEMPRE encabeza"), y se mantiene así aunque el orden
 * literal de la lista de este bloque la ubique más adelante. Interpretación
 * documentada, no una decisión nueva: la regla previa es más específica y
 * explícitamente "nunca"/"siempre".
 */
export function buildProyeccion90dDocument(context: DocumentContextV1) {
  const metrics = buildMetricGrid(context);
  const shipping = buildShipping(context);
  const scenarios = buildScenarios(context);
  const summary = buildCommercialSummary(context);
  const restrictions = mergeRestrictions(
    context.restricciones,
    metrics.restrictions,
    shipping.restrictions,
    scenarios.restrictions,
    summary.restrictions,
  );

  return createModel({
    context,
    templateId: "velocentum-proyeccion-90d/v1",
    kind: "proyeccion_90d",
    title: "Plan de crecimiento a 90 días",
    sections: [
      // 1. Portada.
      coverSection(
        context,
        "Plan de crecimiento a 90 días",
        "Escenarios condicionados por evidencia, capacidad y rentabilidad.",
      ),
      contentSection({
        id: "commercial-summary",
        eyebrow: "Lo que importa",
        title: "Contribución incremental proyectada",
        blocks: [summary.block],
        tone: "dark",
      }),
      coverageSection(context),
      // 2. Punto de partida.
      contentSection({
        id: "projection-baseline",
        eyebrow: "Línea de base",
        title: "Punto de partida validado",
        blocks: [metrics.block, shipping.block],
      }),
      // 3. Restricciones.
      restrictionSection(restrictions),
      transitionSection("projection-transition", "Tres meses, una secuencia medible"),
      // 4. Tres escenarios (5. detalle mes 1/2/3, 7. facturación incremental
      // secundaria y 8. ahorro publicitario separado ya van adentro del
      // bloque scenarios, 9. palancas por escenario también).
      contentSection({
        id: "scenarios",
        eyebrow: "Escenarios",
        title: "Qué puede ocurrir en 90 días, mes a mes",
        blocks: [scenarios.block],
      }),
      // 9. Supuestos (las palancas ya van dentro de cada escenario).
      methodologySection(context),
      // 10. Roadmap 30/60/90.
      roadmapSection(context),
      // 11. Condiciones para escalar y recalcular.
      scalingConditionsSection(restrictions),
      nextStepSection("Confirmar el escenario de planificación y activar el roadmap."),
    ],
  });
}
