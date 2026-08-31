import type { DocumentContextV1 } from "../../domain";
import {
  buildAlertaMargenNegativoV2,
  buildBridgeNoteV2,
  buildCommercialOfferV2,
  buildCommercialSelectionV2,
  buildCommercialSummaryV2,
  buildFindingsV2,
  esPropuestaCualitativaV2,
} from "./blocks";
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
 *
 * D5/DHB-2 (Bloque 3 Funcional): con margen negativo/bloqueado, la
 * propuesta se emite en modo cualitativo — `commercial-summary` (cifra,
 * rango, redacción) NUNCA se renderiza, se reemplaza por la alerta fija
 * de `buildAlertaMargenNegativoV2` (piezas 1+2 de DHB-2, sin tocar el
 * array `findings` — R-02, PASO 0.1). El resto de las siete piezas
 * (servicios, plan de validación, roadmap, próximo paso, selección
 * comercial) ya son incondicionales en este template — ver
 * `docs/funcional/contrato-bloque-3.md` sección 3.
 */
const TEMPLATE_ID = "velocentum-propuesta/v2";

export function buildPropuestaDocumentV2(context: DocumentContextV1) {
  const esCualitativa = esPropuestaCualitativaV2(context);
  const findings = buildFindingsV2(context, "propuesta");
  const seleccionV2 = buildCommercialSelectionV2(context);
  // Regla de PRESENTACIÓN (auditoría externa de F2a, 2026-08-31): con una
  // selección comercial v2 confirmada, la escalera v1 no se imprime. El
  // documento no puede decir "Selección comercial pendiente · No hay una
  // escalera de paquetes confirmada" en una página y mostrar la propuesta
  // cotizada completa en la siguiente; un prospecto leería las dos cosas.
  //
  // No es un borrado y no toca la cadena v1: `buildCommercialOfferV2` sigue
  // igual, el bloque sigue existiendo, y sigue siendo la voz comercial de
  // todo diagnóstico SIN selección v2 —incluida la plantilla v1, que no se
  // modificó—. Lo único que cambia es cuál de las dos habla cuando las dos
  // podrían.
  const seleccionV2Confirmada =
    seleccionV2 !== null && seleccionV2.type === "commercial-selection" && !seleccionV2.pendiente;
  const commercial = seleccionV2Confirmada ? null : buildCommercialOfferV2(context);
  const summary = esCualitativa ? null : buildCommercialSummaryV2(context);
  const bridge = esCualitativa ? buildAlertaMargenNegativoV2(context) : buildBridgeNoteV2(context);

  return createModelV2({
    context,
    templateId: TEMPLATE_ID,
    kind: "propuesta",
    title: "Propuesta de trabajo",
    sections: [
      coverSectionV2(
        context,
        "Propuesta de trabajo",
        "Una intervención alineada con las prioridades validadas.",
        "propuesta",
        TEMPLATE_ID,
      ),
      contentSectionV2({
        id: "commercial-summary",
        eyebrow: esCualitativa ? "Por qué no proyectamos" : "Lo que importa",
        title: esCualitativa
          ? "Margen negativo: foco en la causa raíz"
          : "Contribución incremental proyectada",
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
      // BV4 F2a: la sección aparece SÓLO si hay una selección comercial v2.
      // Sin ella, la propuesta queda exactamente como antes de F2a.
      contentSectionV2({
        id: "commercial-selection",
        eyebrow: "Alcance y precio",
        title: "Selección comercial",
        blocks: [seleccionV2],
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
