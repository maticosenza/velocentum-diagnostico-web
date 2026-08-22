/**
 * Fase 13 (paquetes y precios, decisión comercial 7,
 * `docs/decisiones-pendientes.md`, 2026-08-22): generador de la escalera de
 * hasta tres niveles (IMPULSO, TRACCIÓN, ESCALA por defecto, nombres
 * configurables). Reglas cerradas por la decisión:
 *
 *  - Escalera acumulativa: cada nivel incluye todo el anterior más
 *    servicios o alcance adicional.
 *  - Nunca más de tres niveles; menos si no hay hallazgos que justifiquen
 *    el escalón.
 *  - Cada servicio de cada nivel está ligado a un hallazgo concreto (capa
 *    "servicio" de `mapearHallazgos`, `src/lib/propuesta.ts`): sin
 *    hallazgo que lo justifique, no entra.
 *  - Cada servicio lleva alcance con su propia unidad: Meta/Google Ads en
 *    campañas activas, contenido en piezas por mes, Product Ads en
 *    campañas, web/branding en alcance descrito (no una cantidad).
 *  - Las cantidades salen de valores por defecto CONFIGURABLES, marcados
 *    como propuesta del sistema, nunca como decisión tomada
 *    (`propuestoPorSistema: true` en cada línea).
 *  - Los precios quedan SIEMPRE vacíos (`precio: null`): el sistema nunca
 *    inventa un precio.
 *  - `confirmado` nace siempre en `false`: sólo la confirmación manual
 *    explícita del vendedor (fuera de este módulo, en la UI) puede pasarlo
 *    a `true`; sin eso, no se genera ningún documento.
 *
 * Interpretación documentada, NO parte de la decisión comercial cerrada
 * (ver la entrada nueva en `docs/decisiones-pendientes.md` al cierre de
 * este bloque): la decisión no especifica CÓMO repartir los servicios
 * justificados entre los niveles, ni cuánto debe crecer la cantidad de un
 * servicio ya incluido al subir de nivel. Este módulo reparte los
 * servicios justificados en el orden fijo del catálogo `SERVICIOS`, lo más
 * parejo posible entre los niveles habilitados, y escala la cantidad de
 * cada servicio numérico linealmente con el índice del nivel (nivel 1 =
 * base configurada, nivel 2 = base × 2, nivel 3 = base × 3). Es un
 * default razonable y editable en la UI de confirmación, no una cifra de
 * negocio: nunca se presenta como precio ni como facturación.
 */

import { SERVICIOS, type HallazgoMapeado } from "./propuesta";

export type UnidadServicio = "campañas_activas" | "piezas_por_mes" | "campañas" | "alcance_descrito";

const UNIDAD_POR_SERVICIO: Record<string, UnidadServicio> = {
  "Meta Ads": "campañas_activas",
  "Google Ads": "campañas_activas",
  "Product Ads": "campañas",
  "Desarrollo y optimización web": "alcance_descrito",
  "Planificación y creación de contenido": "piezas_por_mes",
  "Diseño de marca": "alcance_descrito",
};

/** Valores por defecto de cantidad para el nivel 1 (IMPULSO). Configurables. */
const CANTIDAD_BASE_DEFECTO: Record<string, number> = {
  "Meta Ads": 1,
  "Google Ads": 1,
  "Product Ads": 1,
  "Planificación y creación de contenido": 4,
};

export const NOMBRES_NIVELES_DEFECTO: [string, string, string] = ["IMPULSO", "TRACCIÓN", "ESCALA"];

const IDS_NIVEL = ["impulso", "traccion", "escala"] as const;
export type IdNivel = (typeof IDS_NIVEL)[number];

export type ConfigPaquetes = {
  paquetes_nombres_niveles?: [string, string, string];
  paquetes_cantidad_base_meta_ads?: number;
  paquetes_cantidad_base_google_ads?: number;
  paquetes_cantidad_base_product_ads?: number;
  paquetes_cantidad_base_contenido?: number;
};

export type AlcanceServicioNivel = {
  servicio: string;
  unidad: UnidadServicio;
  /** null sólo cuando la unidad es "alcance_descrito": ese alcance no se cuantifica. */
  cantidad: number | null;
  /** Sólo para "alcance_descrito": placeholder editable, nunca un entregable inventado. */
  descripcion: string | null;
  /** Hallazgos concretos que justifican este servicio en este nivel. Nunca vacío. */
  hallazgoIds: string[];
  /** Siempre true: es una propuesta del sistema, nunca una decisión tomada. */
  propuestoPorSistema: true;
};

export type NivelPaquete = {
  id: IdNivel;
  nombre: string;
  servicios: AlcanceServicioNivel[];
  /** Siempre null al generar: el sistema nunca inventa un precio. */
  precio: number | null;
};

export type EscaleraPaquetes = {
  niveles: NivelPaquete[];
  /** Siempre false al generar: sólo la confirmación manual explícita lo cambia. */
  confirmado: false;
};

/**
 * Forma que toma la escalera DESPUÉS de la confirmación manual explícita
 * (fuera de este módulo, en la UI): tipo distinto a propósito, para que
 * `generarEscaleraPaquetes` nunca pueda devolver algo ya confirmado por
 * error de tipeo.
 */
export type EscaleraPaquetesConfirmada = {
  niveles: NivelPaquete[];
  confirmado: true;
};

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Extrae qué servicios canónicos del catálogo cerrado están mencionados en
 * un string de servicio, incluso compuesto (p. ej. "Desarrollo y
 * optimización web y Meta Ads" justifica tanto "Desarrollo y optimización
 * web" como "Meta Ads").
 */
export function serviciosCanonicosDe(servicio: string | null): string[] {
  if (!servicio) return [];
  return SERVICIOS.filter((s) => servicio.includes(s));
}

/** Agrupa los hallazgos de capa "servicio" por servicio canónico, en el orden fijo del catálogo. */
export function serviciosJustificados(
  hallazgos: HallazgoMapeado[],
): { servicio: string; hallazgoIds: string[] }[] {
  const mapa = new Map<string, string[]>();
  for (const h of hallazgos) {
    if (h.capa !== "servicio") continue;
    for (const s of serviciosCanonicosDe(h.servicio)) {
      const lista = mapa.get(s) ?? [];
      if (!lista.includes(h.id)) lista.push(h.id);
      mapa.set(s, lista);
    }
  }
  return SERVICIOS.filter((s) => mapa.has(s)).map((s) => ({ servicio: s, hallazgoIds: mapa.get(s)! }));
}

function cantidadBase(servicio: string, cfg: ConfigPaquetes): number {
  if (servicio === "Meta Ads" && finito(cfg.paquetes_cantidad_base_meta_ads)) {
    return cfg.paquetes_cantidad_base_meta_ads as number;
  }
  if (servicio === "Google Ads" && finito(cfg.paquetes_cantidad_base_google_ads)) {
    return cfg.paquetes_cantidad_base_google_ads as number;
  }
  if (servicio === "Product Ads" && finito(cfg.paquetes_cantidad_base_product_ads)) {
    return cfg.paquetes_cantidad_base_product_ads as number;
  }
  if (
    servicio === "Planificación y creación de contenido" &&
    finito(cfg.paquetes_cantidad_base_contenido)
  ) {
    return cfg.paquetes_cantidad_base_contenido as number;
  }
  return CANTIDAD_BASE_DEFECTO[servicio] ?? 1;
}

function alcanceDe(
  servicio: string,
  hallazgoIds: string[],
  indiceNivel: number,
  cfg: ConfigPaquetes,
): AlcanceServicioNivel {
  const unidad = UNIDAD_POR_SERVICIO[servicio] ?? "alcance_descrito";
  if (unidad === "alcance_descrito") {
    return {
      servicio,
      unidad,
      cantidad: null,
      descripcion: "Alcance a definir con el equipo (propuesta del sistema, editable).",
      hallazgoIds,
      propuestoPorSistema: true,
    };
  }
  return {
    servicio,
    unidad,
    cantidad: cantidadBase(servicio, cfg) * indiceNivel,
    descripcion: null,
    hallazgoIds,
    propuestoPorSistema: true,
  };
}

/**
 * Reparte N servicios justificados en `cantidadNiveles` niveles
 * acumulativos, lo más parejo posible: devuelve, para cada nivel, cuántos
 * servicios acumulados (desde el principio del catálogo) le corresponden.
 */
function repartoAcumulado(cantidadServicios: number, cantidadNiveles: number): number[] {
  const base = Math.floor(cantidadServicios / cantidadNiveles);
  const resto = cantidadServicios % cantidadNiveles;
  const porNivel: number[] = [];
  for (let i = 0; i < cantidadNiveles; i++) porNivel.push(base + (i < resto ? 1 : 0));
  const acumulado: number[] = [];
  let total = 0;
  for (const n of porNivel) {
    total += n;
    acumulado.push(total);
  }
  return acumulado;
}

/**
 * Genera la escalera de paquetes a partir de los hallazgos ya mapeados.
 * `[]` niveles si ningún hallazgo de capa "servicio" justifica nada
 * (nunca se propone un paquete sin fundamento).
 */
export function generarEscaleraPaquetes(
  hallazgos: HallazgoMapeado[],
  cfg: ConfigPaquetes = {},
): EscaleraPaquetes {
  const justificados = serviciosJustificados(hallazgos);
  if (justificados.length === 0) return { niveles: [], confirmado: false };

  const cantidadNiveles = Math.min(3, justificados.length);
  const acumulado = repartoAcumulado(justificados.length, cantidadNiveles);
  const nombres = cfg.paquetes_nombres_niveles ?? NOMBRES_NIVELES_DEFECTO;

  const niveles: NivelPaquete[] = [];
  for (let i = 0; i < cantidadNiveles; i++) {
    const hastaIndice = acumulado[i]!;
    const serviciosDelNivel = justificados.slice(0, hastaIndice);
    niveles.push({
      id: IDS_NIVEL[i]!,
      nombre: nombres[i] ?? NOMBRES_NIVELES_DEFECTO[i]!,
      servicios: serviciosDelNivel.map((s) => alcanceDe(s.servicio, s.hallazgoIds, i + 1, cfg)),
      precio: null,
    });
  }
  return { niveles, confirmado: false };
}
