import type { DocumentContextV1 } from "../../domain";
import { buildFindings, buildMetricGrid, buildShipping, mergeRestrictions } from "./blocks";
import {
  contentSection,
  coverSection,
  coverageSection,
  createModel,
  immediatePrioritiesSection,
  methodologySection,
  missingDataSection,
  nextStepSection,
  riskSection,
  transitionSection,
} from "./shared";

/**
 * Estructura de contenido reconciliada con el plan maestro (fase 11/12,
 * `docs/fase11-12-diseno-tecnico.md`): doce secciones. El diagnóstico
 * NUNCA importa `buildScenarios`/`buildCommercialSummary`/
 * `buildCommercialOffer` — no muestra escenarios, promesas futuras,
 * paquete ni precio (regla dura de este bloque).
 *
 * "Riesgos y contradicciones" y "datos faltantes" son el mismo array de
 * restricciones, separado por `riskSection`/`missingDataSection`: nunca se
 * duplica una restricción entre las dos. "Prioridades inmediatas" es un
 * subconjunto filtrado de "Hallazgos priorizados", no un dato nuevo.
 *
 * "Foto actual y canales", "Productos y cobertura", "Publicidad y
 * medición" y "Funnel y retención actual" (secciones 3, 5, 6 y 7 del plan
 * maestro) siguen usando el mismo `metric-grid` general de hoy: el
 * desglose por canal/producto/funnel con datos propios queda pendiente,
 * documentado en `docs/fase11-12-diseno-tecnico.md` punto 2 — requiere
 * campos nuevos en `DocumentContextV1` que este bloque no agrega.
 */
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
      // 1. Portada y alcance.
      coverSection(
        context,
        "Diagnóstico e-commerce",
        "Una lectura ejecutiva basada en la evidencia disponible.",
      ),
      // 2. Calidad y cobertura de evidencia.
      coverageSection(context),
      // 3-6. Foto actual y canales / economía y rentabilidad / productos y
      // cobertura / publicidad y medición: hoy comparten el mismo
      // metric-grid general (ver nota de arriba sobre el desglose pendiente).
      contentSection({
        id: "current-state",
        eyebrow: "Punto de partida",
        title: "Foto actual: economía, canales y publicidad",
        blocks: [metrics.block, shipping.block],
      }),
      transitionSection("diagnostic-transition", "De los datos a las prioridades"),
      // 7. Funnel y retención actual, 8. Hallazgos priorizados.
      contentSection({
        id: "findings",
        eyebrow: "Diagnóstico",
        title: "Funnel, retención y hallazgos priorizados",
        blocks: [findings.block],
      }),
      // 9. Riesgos y contradicciones.
      riskSection(restrictions),
      // 10. Prioridades inmediatas.
      immediatePrioritiesSection(findings.block),
      // 11. Datos faltantes.
      missingDataSection(restrictions),
      methodologySection(context),
      // 12. Próximo paso.
      nextStepSection("Validar los hallazgos priorizados y definir con qué se arranca."),
    ],
  });
}
