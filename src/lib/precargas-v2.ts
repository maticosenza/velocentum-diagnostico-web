/**
 * BV4 · F2a etapa 4 — cantidades precargadas por nivel y armado de la
 * selección inicial del panel.
 *
 * Fuente: §4 de la especificación original, conservado intacto por el
 * reconciliado ("las cantidades precargadas por nivel (§4, cupo por
 * plataforma, precargas como sugerencia)") y transcrito en la etapa 4 del
 * prompt: audiovisual 10/15/20 · estático 12/18/24 · campañas hasta 3/5/7.
 *
 * **El cupo de campañas es POR PLATAFORMA, no total.** Cada línea de pauta
 * —Meta Ads, Google Ads, Product Ads— tiene su propio cupo: en ESCALA son
 * hasta 7 campañas en cada una, no 7 repartidas entre las tres.
 *
 * Las líneas sin precarga documentada quedan **sin cantidad**: influencer
 * marketing (creadores/mes) y desarrollo web custom (páginas) no tienen
 * cifra confirmada por Matías y no se les inventa una. Se cargan a mano.
 *
 * Toda precarga es **sugerencia editable**, nunca una decisión tomada: el
 * mismo criterio que `propuestoPorSistema` en el generador de la escalera v1.
 */

import { CATALOGO_COMERCIAL_V2, esCuantificable, lineaV2, type LineaId } from "./catalogo-v2";
import type { IdNivel } from "./paquetes";
import {
  lineaVaciaV2,
  type LineaSeleccionadaV2,
  type SeleccionComercialV2,
} from "./seleccion-comercial-v2";
import type { LineaSugeridaV2 } from "./catalogo-v2";

/** Cantidad sugerida por nivel. Una línea ausente de esta tabla no lleva precarga. */
export const CANTIDAD_PRECARGADA_POR_NIVEL: Partial<
  Record<LineaId, Readonly<Record<IdNivel, number>>>
> = {
  contenido_audiovisual: { impulso: 10, traccion: 15, escala: 20 },
  contenido_estatico: { impulso: 12, traccion: 18, escala: 24 },
  // Cupo POR PLATAFORMA: cada una de las tres líneas de pauta lleva el suyo.
  meta_ads: { impulso: 3, traccion: 5, escala: 7 },
  google_ads: { impulso: 3, traccion: 5, escala: 7 },
  product_ads: { impulso: 3, traccion: 5, escala: 7 },
};

/** `null` cuando la línea no tiene precarga confirmada: se carga a mano. */
export function cantidadPrecargada(lineaId: LineaId, nivel: IdNivel): number | null {
  return CANTIDAD_PRECARGADA_POR_NIVEL[lineaId]?.[nivel] ?? null;
}

function conCantidad(linea: LineaSeleccionadaV2, cantidad: number | null): LineaSeleccionadaV2 {
  if (linea.precio.modo !== "unitario") return linea;
  return { ...linea, precio: { ...linea.precio, cantidad } };
}

/**
 * Arma la selección con la que el panel abre por primera vez: las diez
 * líneas siempre, las sugeridas por el diagnóstico marcadas y el resto
 * desmarcado, con las cantidades precargadas del nivel como sugerencia.
 *
 * El precio queda SIEMPRE vacío: el sistema nunca inventa un precio.
 *
 * Q8: elegir TRACCIÓN o ESCALA no preselecciona `diseno_web`. Esta función
 * no mira el nivel para decidir qué se marca — sólo `sugeridas`, que sale
 * de los hallazgos.
 */
export function seleccionInicialV2(args: {
  nivel: IdNivel;
  sugeridas: readonly LineaSugeridaV2[];
}): SeleccionComercialV2 {
  const marcadas = new Set(args.sugeridas.map((s) => s.lineaId));
  const lineas = CATALOGO_COMERCIAL_V2.lineas.map((delCatalogo) => {
    const vacia = lineaVaciaV2(delCatalogo.id);
    const seleccionada = marcadas.has(delCatalogo.id);
    const cantidad = esCuantificable(delCatalogo)
      ? cantidadPrecargada(delCatalogo.id, args.nivel)
      : null;
    return conCantidad({ ...vacia, seleccionada }, cantidad);
  });
  return { nivel: args.nivel, lineas, agregados: [] };
}

/**
 * Cambia el nivel de una selección ya en curso y reajusta **sólo** las
 * cantidades que seguían en la precarga del nivel anterior o vacías. Una
 * cantidad que el vendedor editó a mano no se toca: la precarga es
 * sugerencia, y una sugerencia no pisa una decisión.
 *
 * Precios, líneas marcadas, recurrencias y rutas quedan intactos. Los
 * agregados que dejan de estar disponibles en el nivel nuevo (CRO fuera de
 * ESCALA) se apagan, porque no pueden aplicarse.
 */
export function cambiarNivelV2(
  seleccion: SeleccionComercialV2,
  nivelNuevo: IdNivel,
): SeleccionComercialV2 {
  const nivelAnterior = seleccion.nivel;
  const lineas = seleccion.lineas.map((linea) => {
    if (linea.precio.modo !== "unitario") return linea;
    const precargaAnterior = cantidadPrecargada(linea.lineaId, nivelAnterior);
    const precargaNueva = cantidadPrecargada(linea.lineaId, nivelNuevo);
    if (precargaNueva === null) return linea;
    const sinTocar = linea.precio.cantidad === null || linea.precio.cantidad === precargaAnterior;
    return sinTocar ? conCantidad(linea, precargaNueva) : linea;
  });
  return { ...seleccion, nivel: nivelNuevo, lineas };
}

/** Etiqueta de la unidad de una línea, para el panel y la propuesta. */
export const ETIQUETA_UNIDAD_V2: Record<ReturnType<typeof lineaV2>["unidad"], string> = {
  campañas: "campañas",
  piezas_por_mes: "piezas por mes",
  creadores_por_mes: "creadores por mes",
  paginas: "páginas",
  sin_cantidad: "alcance",
};
