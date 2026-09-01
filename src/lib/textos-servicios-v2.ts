/**
 * BV4 · F2a etapa 5 — textos de los diez servicios, VERBATIM.
 *
 * Fuente única: `docs/funcional/f2a-textos-servicios.md`, que a su vez es §7
 * de `paso-1-panel-seleccion-comercial.md`, confirmado uno por uno por
 * Matías el 2026-08-30 y aportado el 2026-08-31 al resolver el freno F-1.
 *
 * **Verbatim quiere decir verbatim**: no se reescriben, no se resumen, no se
 * completan, no se les corrige la puntuación. `textos-servicios-v2.test.ts`
 * lee el documento fuente y compara contra estas constantes carácter por
 * carácter, así que este archivo no puede desviarse sin romper la suite.
 *
 * Una línea sin texto confirmado se marca **pendiente**: `textoDeLinea`
 * devuelve `null` y el documento imprime que falta, nunca un relleno.
 */

import { LINEAS_V2_IDS, type LineaId } from "./catalogo-v2";

export type TextoServicioV2 = {
  /** La frase en cursiva bajo el título, tal cual. */
  descripcion: string;
  /** Los ítems de la lista, en su orden. */
  entregables: readonly string[];
  /** La aclaración en cursiva al pie del bloque, cuando existe. */
  exclusion: string | null;
};

/**
 * Nota al pie de la sección de contenido (slide 10 de la propuesta de Titan
 * Web). Evita el malentendido de "prometiste 10 y publicaste 10, no 20".
 */
export const NOTA_AL_PIE_CONTENIDO =
  "Cada pieza maestra se adapta a Instagram y TikTok; una adaptación no duplica el conteo de contenido.";

/** Las líneas a las que la nota al pie de contenido les corresponde. */
export const LINEAS_CON_NOTA_DE_CONTENIDO: readonly LineaId[] = [
  "contenido_audiovisual",
  "contenido_estatico",
];

const TEXTOS: Readonly<Record<LineaId, TextoServicioV2>> = {
  meta_ads: {
    descripcion:
      "Generar demanda y captar clientes nuevos con campañas segmentadas hacia la tienda.",
    entregables: [
      "Configuración inicial de cuenta, píxel y CAPI",
      "Estrategia de campañas y audiencias",
      "Eventos de navegación, carrito, checkout y compra verificados",
      "Validación creativa y redistribución de inversión según señales",
      "Retargeting progresivo",
    ],
    exclusion: null,
  },
  google_ads: {
    descripcion:
      "Captar demanda que ya está buscando el producto y sostener la presencia en marca.",
    entregables: [
      "Configuración inicial de cuenta, conversiones y Google Tag",
      "Estructura de campañas de búsqueda y Performance Max",
      "Investigación de palabras clave y negativas",
      "Feed de productos conectado a Merchant Center",
      "Optimización de pujas y presupuesto según resultados",
      "Escala de las campañas y palabras clave con mejor rendimiento",
    ],
    exclusion: null,
  },
  product_ads: {
    descripcion:
      "Ganar visibilidad dentro de Mercado Libre y mejorar el rendimiento de las publicaciones que ya venden.",
    entregables: [
      "Configuración de campañas por publicación y por catálogo",
      "Selección de publicaciones a impulsar según rotación y margen",
      "Ajuste de ACOS objetivo y presupuesto por campaña",
      "Seguimiento de participación de mercado en las categorías activas",
      "Lectura de resultados contra la liquidación de la plataforma",
    ],
    exclusion: null,
  },
  contenido_audiovisual: {
    descripcion: "Producir piezas en video que validen el producto y alimenten las campañas.",
    entregables: [
      "Producción y edición de piezas mensuales",
      "Ángulos por formato: recetas, unboxing, sets y reviews",
      "Adaptación de cada pieza maestra a Instagram y TikTok",
      "Entrega lista para publicar y para usar como creativo en campañas",
    ],
    exclusion: null,
  },
  contenido_estatico: {
    descripcion:
      "Sostener la presencia y comunicar oferta, producto y beneficios con piezas de diseño.",
    entregables: [
      "Diseño de piezas mensuales para feed e historias",
      "Placas de oferta, producto destacado y prueba social",
      "Adaptación de formatos según canal",
      "Entrega lista para publicar y para usar como creativo en campañas",
    ],
    exclusion: null,
  },
  influencer_marketing: {
    descripcion:
      "Sumar voces externas que aporten prueba social y alcance con creadores del rubro.",
    entregables: [
      "Búsqueda y selección de perfiles según etapa y categoría",
      "Coordinación de entregas, envíos y calendario",
      "Definición de ángulos: recetas, reviews o uso real",
      "Reutilización del material en campañas",
    ],
    exclusion: "No incluye honorarios de creadores ni envío de productos.",
  },
  planificacion_contenido: {
    descripcion:
      "Definir qué se comunica, cuándo y con qué objetivo, para que la producción no sea improvisada.",
    entregables: [
      "Calendario mensual por canal y formato",
      "Definición de ángulos y mensajes según producto y oferta",
      "Priorización de piezas para B2C y B2B cuando aplica",
      "Lectura de resultados y ajuste del calendario siguiente",
    ],
    exclusion: null,
  },
  diseno_web: {
    descripcion: "Preparar la tienda para convertir el tráfico que traen las campañas.",
    entregables: [
      "Jerarquía de productos, banners y páginas clave",
      "Recorridos de compra diferenciados cuando hay B2C y B2B",
      "Captura: popup y formularios",
      "Mejoras de conversión priorizadas por impacto",
    ],
    exclusion: "No incluye desarrollos web mayores: eso es Desarrollo web custom.",
  },
  desarrollo_web_custom: {
    descripcion: "Construir funcionalidad o páginas que la plantilla de la tienda no resuelve.",
    entregables: [
      "Relevamiento de requerimientos y alcance por página",
      "Diseño y maquetado a medida",
      "Implementación sobre la plataforma existente",
      "Pruebas y puesta en producción",
    ],
    exclusion: null,
  },
  branding: {
    descripcion: "Dar una identidad visual consistente a la tienda, el contenido y las campañas.",
    entregables: [
      "Definición o ajuste de paleta, tipografías y uso del logo",
      "Aplicación a piezas de contenido y publicidad",
      "Lineamientos para mantener consistencia en el tiempo",
    ],
    exclusion: null,
  },
};

/**
 * El texto confirmado de una línea, o `null` si no hay ninguno. `null`
 * significa **pendiente**, y quien lo reciba debe decirlo — nunca rellenarlo.
 */
export function textoDeLinea(lineaId: LineaId): TextoServicioV2 | null {
  return TEXTOS[lineaId] ?? null;
}

/** Las líneas que hoy no tienen texto confirmado. Vacío al 2026-08-31. */
export function lineasSinTextoConfirmado(): LineaId[] {
  return LINEAS_V2_IDS.filter((id) => textoDeLinea(id) === null);
}

export { TEXTOS as TEXTOS_SERVICIOS_V2 };
