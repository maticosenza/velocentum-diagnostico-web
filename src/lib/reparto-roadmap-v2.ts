/**
 * BV4 · F2a ronda 3 — reparto 30/60/90 de las líneas de la selección v2.
 *
 * Excepción autorizada al límite de dos rondas, por motivo explícito: el
 * reparto temporal es **lógica de negocio, no presentación**, y por eso no
 * podía diferirse a F3b, que es una fase de arte. Diferirlo habría dejado que
 * F3b rediseñara el render sobre un reparto incorrecto.
 *
 * ## El defecto que corrige
 *
 * Hasta la ronda 2, toda línea seleccionada sin hallazgo de prioridad alta
 * detrás caía entera en la etapa 90 ("servicio seleccionado sin hallazgo"),
 * una regla que se escribió cuando las líneas del plan salían del mapeo de
 * hallazgos. Con el modelo v2 las líneas salen de la **selección comercial**,
 * así que esa regla mandaba a la etapa 90 casi todo: en los PDFs del commit
 * candidato, Titan Web quedaba con una sola etapa —"DÍAS 61-90"— y Snake
 * Store se quedaba sin la etapa 1-30.
 *
 * ## Las tres reglas (confirmadas por Matías, 2026-09-01)
 *
 *  - **R1 · Infraestructura antes que pauta.** `diseno_web` va completo en
 *    1-30: el ecosistema debe estar listo antes de invertir en pauta.
 *  - **R2 · Contenido en los tres meses.** Las tres líneas de contenido
 *    aparecen en las tres etapas, porque la producción es mensual.
 *  - **R3 · Los servicios de pauta progresan** activar → optimizar → escalar.
 *
 * ## Cómo se representa
 *
 * El reparto NO contiene texto: contiene **índices** a los entregables
 * verbatim de `textos-servicios-v2.ts`, que a su vez son los de
 * `docs/funcional/f2a-textos-servicios.md`. Así, por construcción, ninguna
 * frase del plan puede estar fuera del documento fuente: para escribir una
 * frase nueva habría que agregarla primero al documento, y ahí la decisión
 * vuelve a ser humana. `reparto-roadmap-v2.test.ts` lo verifica leyendo el
 * markdown fuente.
 *
 * Una línea puede repetir un entregable en dos etapas cuando el trabajo es
 * cíclico: `planificacion_contenido` en 31-60 y 61-90, el "ídem, cíclico" de
 * la tabla confirmada. Y puede no tener entregable para una etapa cuando esa
 * etapa no le corresponde —`diseno_web` y `branding` van completas en 1-30
 * por R1—, pero **nunca porque falte la frase**: cuando faltó, se frenó y la
 * frase la aportó Matías al documento fuente. Fue el caso de la escala de
 * Google Ads (H-4, resuelto el 2026-09-01 con una sexta viñeta); el hallazgo
 * queda en `docs/bv4-f2a-hallazgos-diferidos.md` como registro de cómo se
 * resolvió, no como pendiente.
 */

import { lineaV2, LINEAS_V2_IDS, type LineaId } from "./catalogo-v2";
import { textoDeLinea } from "./textos-servicios-v2";

/** Las tres etapas del plan, en orden. Mismos IDs que `EtapaRoadmap`. */
export const ETAPAS_ROADMAP_V2 = ["etapa_30", "etapa_60", "etapa_90"] as const;

export type EtapaRoadmapV2 = (typeof ETAPAS_ROADMAP_V2)[number];

/** Índices dentro de `entregables` de la línea, por etapa. */
export type RepartoDeLinea = Readonly<Record<EtapaRoadmapV2, readonly number[]>>;

/**
 * La tabla confirmada por Matías, traducida a índices de entregable.
 *
 * Cada comentario nombra la celda de la tabla del prompt de la ronda 3
 * (`docs/prompts/bv4-f2a-ronda3-roadmap-prompt.md`) que la fila representa.
 */
export const REPARTO_ROADMAP_V2: Readonly<Record<LineaId, RepartoDeLinea>> = {
  // R3 · activar (cuenta, píxel y CAPI; estrategia; eventos verificados) →
  // optimizar (validación creativa) → escalar (retargeting progresivo).
  meta_ads: { etapa_30: [0, 1, 2], etapa_60: [3], etapa_90: [4] },
  // R3 · activar (cuenta y Google Tag; estructura; palabras clave; feed) →
  // optimizar (pujas y presupuesto) → escalar (campañas y palabras clave con
  // mejor rendimiento). La viñeta de escala es la sexta, aportada por Matías
  // al resolver H-4: la ronda 3 se frenó antes que inventarla.
  google_ads: { etapa_30: [0, 1, 2, 3], etapa_60: [4], etapa_90: [5] },
  // R3 · activar (campañas por publicación y catálogo; selección según
  // rotación y margen) → optimizar (ACOS y presupuesto) → escalar
  // (participación de mercado y lectura contra la liquidación).
  product_ads: { etapa_30: [0, 1], etapa_60: [2], etapa_90: [3, 4] },
  // R2 · en las tres etapas. El ciclo es mensual; el reparto ordena la
  // viñeta que domina cada mes, sin repetir ninguna.
  contenido_audiovisual: { etapa_30: [0, 1], etapa_60: [2], etapa_90: [3] },
  // R2 · ídem audiovisual, con la misma forma de reparto.
  contenido_estatico: { etapa_30: [0, 1], etapa_60: [2], etapa_90: [3] },
  // R2 · calendario y ángulos al principio; la lectura de resultados y el
  // ajuste del calendario son el ciclo, y por eso se repiten en 61-90
  // ("ídem, cíclico" en la tabla confirmada).
  planificacion_contenido: { etapa_30: [0, 1, 2], etapa_60: [3], etapa_90: [3] },
  // Búsqueda y coordinación → ángulos y publicación → reutilización.
  influencer_marketing: { etapa_30: [0, 1], etapa_60: [2], etapa_90: [3] },
  // R1 · COMPLETO en 1-30: la infraestructura va antes que la pauta.
  diseno_web: { etapa_30: [0, 1, 2, 3], etapa_60: [], etapa_90: [] },
  // Relevamiento y maquetado → implementación → pruebas y puesta en
  // producción. SUPUESTO REGISTRADO: este reparto vale para el caso de
  // varios meses. Si la duración fuera de un mes, iría completo en 1-30,
  // pero el modelo no tiene campo de duración y no se inventa uno.
  desarrollo_web_custom: { etapa_30: [0, 1], etapa_60: [2], etapa_90: [3] },
  // COMPLETO en 1-30, igual que diseño web.
  branding: { etapa_30: [0, 1, 2], etapa_60: [], etapa_90: [] },
};

/** Separa los entregables dentro de un renglón del plan. */
export const SEPARADOR_RENGLON_PLAN = " · ";

/**
 * Los entregables verbatim que le tocan a una línea en una etapa. Vacío si
 * la etapa no le corresponde, y vacío también si la línea no tiene texto
 * confirmado: una línea pendiente no se rellena, igual que en el resto del
 * documento.
 */
export function entregablesDeEtapa(lineaId: LineaId, etapa: EtapaRoadmapV2): string[] {
  const texto = textoDeLinea(lineaId);
  if (texto === null) return [];
  return REPARTO_ROADMAP_V2[lineaId][etapa]
    .map((i) => texto.entregables[i])
    .filter((v): v is string => v !== undefined);
}

/**
 * El renglón del plan para una línea en una etapa: el nombre de la línea y
 * sus entregables de esa etapa, todo verbatim. `null` cuando la etapa no le
 * corresponde a la línea — nunca un renglón vacío ni un relleno.
 *
 * El nombre va adelante porque una etapa junta renglones de varias líneas y,
 * sin él, el lector no sabe de qué servicio es cada acción. El nombre
 * también sale del documento fuente: es el título de la sección.
 */
export function renglonDePlan(lineaId: LineaId, etapa: EtapaRoadmapV2): string | null {
  const entregables = entregablesDeEtapa(lineaId, etapa);
  if (entregables.length === 0) return null;
  return `${lineaV2(lineaId).nombre}: ${entregables.join(SEPARADOR_RENGLON_PLAN)}`;
}

/** Las líneas que no tienen ningún renglón en una etapa dada. Para pruebas y QA. */
export function lineasSinRenglon(etapa: EtapaRoadmapV2): LineaId[] {
  return LINEAS_V2_IDS.filter((id) => renglonDePlan(id as LineaId, etapa) === null) as LineaId[];
}
