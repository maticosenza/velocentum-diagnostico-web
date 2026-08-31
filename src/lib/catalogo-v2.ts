/**
 * BV4 · F2a etapa 1 — Catálogo comercial v2, AL LADO del v1.
 *
 * El catálogo cerrado de seis servicios (`SERVICIOS`, `src/lib/propuesta.ts`)
 * NO se modifica ni se elimina: alimenta el mapeo hallazgo→servicio vigente y
 * toda la salida v1, que debe seguir produciendo exactamente lo mismo. Este
 * módulo agrega un catálogo v2 versionado que consumen el panel de selección
 * comercial y la propuesta del motor v2; nada de la cadena v1 lo importa.
 *
 * Fuente normativa: `docs/funcional/f2a-panel-comercial-reconciliado.md`,
 * puntos b (líneas e IDs) y c (matriz de traducción v1→v2), con Q1, Q2, Q8 y
 * Q10 cerradas por decisión vinculante de Matías el 2026-08-30.
 *
 * Tres reglas duras de este archivo:
 *
 *  1. **Los IDs son contrato.** No se renombran después de la primera
 *     persistencia: quedan escritos en la columna `diagnostico.propuesta` de
 *     cada diagnóstico guardado. `catalogo-v2.test.ts` los fija uno por uno,
 *     literalmente, para que un renombre rompa la suite en vez de romper los
 *     datos.
 *
 *  2. **Ningún activador se inventa** (Q2). `influencer_marketing` y
 *     `desarrollo_web_custom` no tienen equivalente en el catálogo v1 y no
 *     reciben sugerencia automática desde ningún hallazgo: se seleccionan a
 *     mano, hasta que exista una regla diagnóstica específica y aprobada. La
 *     tabla de traducción es la ÚNICA fuente de sugerencias y no las
 *     menciona; una prueba verifica que ninguna combinación de hallazgos
 *     pueda proponerlas.
 *
 *  3. **Contenido es un servicio con dos líneas, y el servicio v1 sugiere el
 *     grupo completo** (Q1). "Planificación y creación de contenido" propone
 *     las tres líneas de contenido juntas; cada una queda desmarcable
 *     individualmente en el panel (eso es UI, etapa 4: acá sólo se declara
 *     que la sugerencia es grupal).
 *
 * Lo que este módulo NO decide, a propósito: cantidades precargadas por nivel
 * (etapa 4), precio, moneda, fiscalidad, recurrencia efectiva y totales
 * (etapa 2). Acá vive sólo la taxonomía: qué líneas existen, cómo se llaman,
 * en qué unidad se cuentan, qué recurrencia se sugiere por defecto y desde
 * qué servicio v1 se proponen.
 */

import { SERVICIOS, type HallazgoMapeado } from "./propuesta";
import { serviciosJustificados } from "./paquetes";

/** Versión del sobre y del catálogo. Viaja en `diagnostico.propuesta` (etapa 3). */
export const VERSION_CATALOGO_V2 = 2 as const;

/**
 * Las diez líneas facturables, en el orden del punto b del reconciliado.
 * Este orden es el orden de presentación del panel y el de las sugerencias.
 */
export const LINEAS_V2_IDS = [
  "meta_ads",
  "google_ads",
  "product_ads",
  "contenido_audiovisual",
  "contenido_estatico",
  "influencer_marketing",
  "planificacion_contenido",
  "diseno_web",
  "desarrollo_web_custom",
  "branding",
] as const;

export type LineaId = (typeof LINEAS_V2_IDS)[number];

/**
 * Unidad de conteo de la línea. `sin_cantidad` es la línea que no se
 * cuantifica: lleva el total de la línea directo, no unitario × cantidad
 * (Q3, punto d del reconciliado).
 *
 * Nota del punto b, verificación 5 del reconciliado: "piezas/mes" y
 * "creadores/mes" describen el DEFAULT mensual. Si una de esas líneas se pasa
 * a recurrencia única en una propuesta concreta (Q10), la cantidad se lee como
 * cantidad total, no por mes. La unidad no cambia; cambia su lectura.
 */
export type UnidadLineaV2 =
  "campañas" | "piezas_por_mes" | "creadores_por_mes" | "paginas" | "sin_cantidad";

/** Q10: default por línea, editable en cada propuesta concreta. */
export type RecurrenciaV2 = "mensual" | "unica";

export type LineaFacturableV2 = {
  id: LineaId;
  /** Servicio (unidad de taxonomía y de sugerencia). Nueve en total: Contenido tiene dos líneas. */
  servicio: string;
  /** Rótulo de la línea en el panel y en la propuesta. */
  nombre: string;
  unidad: UnidadLineaV2;
  /** Q10: sugerencia, nunca imposición. La recurrencia efectiva se define por línea. */
  recurrenciaSugerida: RecurrenciaV2;
  /** Q8: la ruta B2C/B2B/ambas es atributo de la línea, y sólo de Diseño web. */
  admiteRuta: boolean;
};

const LINEAS: readonly LineaFacturableV2[] = [
  {
    id: "meta_ads",
    servicio: "Meta Ads",
    nombre: "Meta Ads",
    unidad: "campañas",
    recurrenciaSugerida: "mensual",
    admiteRuta: false,
  },
  {
    id: "google_ads",
    servicio: "Google Ads",
    nombre: "Google Ads",
    unidad: "campañas",
    recurrenciaSugerida: "mensual",
    admiteRuta: false,
  },
  {
    id: "product_ads",
    servicio: "Product Ads",
    nombre: "Product Ads",
    unidad: "campañas",
    recurrenciaSugerida: "mensual",
    admiteRuta: false,
  },
  {
    id: "contenido_audiovisual",
    servicio: "Contenido",
    nombre: "Contenido audiovisual",
    unidad: "piezas_por_mes",
    recurrenciaSugerida: "mensual",
    admiteRuta: false,
  },
  {
    id: "contenido_estatico",
    servicio: "Contenido",
    nombre: "Contenido estático",
    unidad: "piezas_por_mes",
    recurrenciaSugerida: "mensual",
    admiteRuta: false,
  },
  {
    id: "influencer_marketing",
    servicio: "Influencer marketing",
    nombre: "Influencer marketing",
    unidad: "creadores_por_mes",
    recurrenciaSugerida: "mensual",
    admiteRuta: false,
  },
  {
    id: "planificacion_contenido",
    servicio: "Planificación de contenido",
    nombre: "Planificación de contenido",
    unidad: "sin_cantidad",
    recurrenciaSugerida: "mensual",
    admiteRuta: false,
  },
  {
    id: "diseno_web",
    servicio: "Diseño web",
    nombre: "Diseño web",
    unidad: "sin_cantidad",
    recurrenciaSugerida: "unica",
    admiteRuta: true,
  },
  {
    id: "desarrollo_web_custom",
    servicio: "Desarrollo web custom",
    nombre: "Desarrollo web custom",
    unidad: "paginas",
    recurrenciaSugerida: "unica",
    admiteRuta: false,
  },
  {
    id: "branding",
    servicio: "Branding",
    nombre: "Branding",
    unidad: "sin_cantidad",
    recurrenciaSugerida: "unica",
    admiteRuta: false,
  },
];

/** El catálogo versionado completo. Diez líneas, nueve servicios. */
export const CATALOGO_COMERCIAL_V2 = {
  version: VERSION_CATALOGO_V2,
  lineas: LINEAS,
} as const;

/** Los nueve servicios, en el orden en que aparecen sus líneas. */
export const SERVICIOS_V2: readonly string[] = LINEAS.reduce<string[]>((acc, linea) => {
  if (!acc.includes(linea.servicio)) acc.push(linea.servicio);
  return acc;
}, []);

const POR_ID = new Map<LineaId, LineaFacturableV2>(LINEAS.map((l) => [l.id, l]));

export function lineaV2(id: LineaId): LineaFacturableV2 {
  const linea = POR_ID.get(id);
  // Inalcanzable con `LineaId`; el guardia protege la lectura de un ID que
  // llegue desde la base (JSON persistido), no desde el tipo.
  if (!linea) throw new Error(`Línea comercial desconocida: ${id}`);
  return linea;
}

/** `true` si la línea lleva cantidad y por lo tanto precio UNITARIO (Q3). */
export function esCuantificable(linea: LineaFacturableV2): boolean {
  return linea.unidad !== "sin_cantidad";
}

/** Lectura tolerante de un ID que llega del JSON persistido. */
export function esLineaId(valor: unknown): valor is LineaId {
  return typeof valor === "string" && POR_ID.has(valor as LineaId);
}

/**
 * Matriz de traducción v1 → v2, punto c del reconciliado, exhaustiva sobre
 * los seis servicios del catálogo v1: el tipo obliga a cubrirlos todos y
 * prohíbe inventar una clave que no exista en `SERVICIOS`.
 *
 * `desarrollo_web_custom` e `influencer_marketing` NO aparecen acá y no
 * pueden aparecer (Q2): no tienen equivalente v1.
 */
export const TRADUCCION_V1_A_V2: Record<(typeof SERVICIOS)[number], readonly LineaId[]> = {
  "Meta Ads": ["meta_ads"],
  "Google Ads": ["google_ads"],
  "Product Ads": ["product_ads"],
  // Directo por alcance: popup y rutas B2C/B2B viven en Diseño web [C].
  "Desarrollo y optimización web": ["diseno_web"],
  "Diseño de marca": ["branding"],
  // Q1: sugiere el GRUPO de contenido completo; cada línea queda desmarcable
  // individualmente en el panel.
  "Planificación y creación de contenido": [
    "planificacion_contenido",
    "contenido_audiovisual",
    "contenido_estatico",
  ],
};

/**
 * Q2: líneas de selección exclusivamente manual. Ninguna regla diagnóstica
 * las propone; la tabla de traducción no las nombra y una prueba lo verifica
 * sobre todas las combinaciones posibles de servicios v1.
 */
export const LINEAS_SIN_ACTIVADOR_AUTOMATICO: readonly LineaId[] = [
  "influencer_marketing",
  "desarrollo_web_custom",
];

export type LineaSugeridaV2 = {
  lineaId: LineaId;
  /** Hallazgos concretos que justifican la sugerencia. Nunca vacío. */
  hallazgoIds: string[];
};

/**
 * Traduce los hallazgos ya mapeados (capa "servicio" del catálogo v1) a las
 * líneas v2 que el panel muestra marcadas. Devuelve las líneas en el orden
 * del catálogo, cada una con la unión de los hallazgos que la justifican.
 *
 * No decide nada más: una línea sugerida es una línea PREMARCADA y
 * desmarcable, nunca una línea impuesta. Las líneas no sugeridas se muestran
 * igual, desmarcadas (regla de visibilidad §6 de la espec. original: el panel
 * muestra las diez siempre).
 *
 * Q8: elegir TRACCIÓN o ESCALA no interviene acá — `diseno_web` sólo llega
 * sugerido por un hallazgo compatible, nunca por el nivel.
 */
export function lineasSugeridasV2(hallazgos: HallazgoMapeado[]): LineaSugeridaV2[] {
  const porLinea = new Map<LineaId, string[]>();

  for (const { servicio, hallazgoIds } of serviciosJustificados(hallazgos)) {
    const destinos = TRADUCCION_V1_A_V2[servicio as (typeof SERVICIOS)[number]];
    if (!destinos) continue;
    for (const lineaId of destinos) {
      const acumulados = porLinea.get(lineaId) ?? [];
      for (const id of hallazgoIds) if (!acumulados.includes(id)) acumulados.push(id);
      porLinea.set(lineaId, acumulados);
    }
  }

  return LINEAS.filter((l) => porLinea.has(l.id)).map((l) => ({
    lineaId: l.id,
    hallazgoIds: porLinea.get(l.id)!,
  }));
}
