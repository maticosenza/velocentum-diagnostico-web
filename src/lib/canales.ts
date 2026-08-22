/**
 * Mix de canales de venta. Cada canal es independiente: tiene su propia
 * facturación, ticket, comisiones, envío, financiación, descuento e inversión.
 *
 * Reglas duras de esta capa:
 *  - nunca se reescalan los porcentajes declarados para que sumen 100;
 *  - cero, ausente y "no aplica" son tres estados distintos;
 *  - el canal principal se deriva del porcentaje mayor, jamás se declara.
 */

import { PLANES_POR_PLATAFORMA, type DatosDiagnostico } from "./diagnostico-form";
import { redondear } from "./dinero";

export type CanalId = "tienda_propia" | "mercado_libre";

export const CANALES: { id: CanalId; label: string }[] = [
  { id: "tienda_propia", label: "Tienda propia" },
  { id: "mercado_libre", label: "Mercado Libre" },
];

/** Prefijo de los campos planos de cada canal dentro de `DatosDiagnostico`. */
export const PREFIJO_CANAL: Record<CanalId, string> = {
  tienda_propia: "canal_tienda",
  mercado_libre: "canal_ml",
};

/**
 * - declarado: hay un porcentaje cargado (puede ser 0: el canal existe y no factura);
 * - ausente: no sabemos si vende ahí. Baja la cobertura;
 * - no_aplica: el cliente declaró que no vende ahí. No baja la cobertura.
 */
export type EstadoCanal = "declarado" | "ausente" | "no_aplica";

/** Sobre qué unidad se cobra el cargo fijo del marketplace. */
export type BaseAplicacionCargo = "pedido" | "unidad" | "publicacion";
/** Qué precio se compara contra el umbral del cargo fijo. */
export type PrecioUmbral = "precio_producto" | "ticket_promedio";

/** Comisión de marketplace con sus metadatos de origen y vigencia. */
export type ComisionMarketplace = {
  comision: number;
  cargo_fijo?: number;
  /** El cargo fijo sólo aplica en ventas por debajo de este importe. */
  cargo_fijo_hasta?: number;
  /** Sobre qué se cobra el cargo fijo. Por defecto, por pedido. */
  base_aplicacion?: BaseAplicacionCargo;
  /** Qué precio se compara contra el umbral. Por defecto, el ticket promedio. */
  precio_umbral?: PrecioUmbral;
  /** De dónde salió la regla. */
  fuente?: string;
  /** Mientras sea false, el cargo fijo NO entra en la comisión efectiva. */
  verificado?: boolean;
  marketplace?: string;
  tipo_publicacion?: string;
  vigencia_desde?: string;
  vigencia_hasta?: string;
  pais?: string;
  origen?: string;
  /** true cuando el número es un benchmark pendiente de verificar con la liquidación real. */
  provisional?: boolean;
};

/**
 * Valores por defecto de comisión de marketplace, definidos en el código.
 * La tabla `configuracion` los sobreescribe únicamente si la fila existe:
 * así el sistema funciona sin tocar la base de datos.
 */
export const COMISIONES_MARKETPLACE_DEFECTO: Record<string, ComisionMarketplace> = {
  mercado_libre: {
    comision: 0.1694,
    marketplace: "mercado_libre",
    pais: "AR",
    origen: "benchmark_provisional",
    provisional: true,
    cargo_fijo: 1095,
    cargo_fijo_hasta: 33000,
    base_aplicacion: "pedido",
    precio_umbral: "precio_producto",
    fuente: "benchmark_provisional_pendiente_liquidacion",
    verificado: false,
  },
};

/**
 * Comisión de plataforma (Tiendanube, Shopify, WooCommerce, Empretienda...)
 * con los mismos metadatos de vigencia y evidencia que `ComisionMarketplace`
 * (fase 4, auditoría de planes y comisiones, 2026-08-21). El plan puntual
 * (`inicial`, `esencial`, `grow`, etc.) ya viaja en la clave compuesta
 * (`claveComisionPlataforma`); `plan` acá es sólo para mostrarlo sin tener
 * que parsear la clave de vuelta.
 */
export type ComisionPlataforma = {
  /**
   * `null` cuando la regla existe (se conoce el plan) pero no tiene un
   * porcentaje público — ver `comision_negociada`. Es un caso DISTINTO de
   * "no hay ninguna entrada para este plan" (ese caso ni siquiera llega a
   * `ComisionPlataforma`: `entradaPlataforma()` devuelve `null` directo).
   */
  comision: number | null;
  /**
   * true cuando el plan es conocido pero la plataforma no publica un
   * porcentaje fijo (lo negocia con cada comercio). `comision` queda en
   * `null` a propósito: nunca se inventa un número para rellenarlo.
   */
  comision_negociada?: boolean;
  plataforma?: string;
  plan?: string;
  vigencia_desde?: string;
  vigencia_hasta?: string;
  pais?: string;
  origen?: string;
  fuente?: string;
  /** true sólo cuando el número viene de una liquidación real, nunca de un benchmark. */
  verificado?: boolean;
  /** true cuando el número es un benchmark pendiente de verificar. */
  provisional?: boolean;
};

/**
 * Valores por defecto de comisión de plataforma, definidos en el código
 * (igual que `COMISIONES_MARKETPLACE_DEFECTO`): la tabla `configuracion` los
 * sobreescribe únicamente si la fila existe. Todos `verificado: false` y
 * `provisional: true` porque son benchmarks públicos, no una liquidación ni
 * una factura del cliente.
 *
 * WooCommerce y Empretienda: comisión de plataforma en 0 porque ninguna de
 * las dos cobra un take-rate por venta (WooCommerce es autohosteado —el
 * costo es hosting/plugins, fuera de este modelo—; Empretienda cobra
 * suscripción mensual fija, no comisión variable). El costo de la pasarela
 * de pago sigue aplicando por separado (`comision_pasarela`), igual que en
 * las demás plataformas.
 *
 * Tiendanube Escala y Evolución (relevado 2026-08-22,
 * `docs/relevamiento-planes-tiendanube.md`): la página oficial de precios
 * muestra su comisión por venta como "a convenir" por comercio, sin un
 * porcentaje público fijo — agregar un número sería inventarlo. Por eso
 * tienen entrada acá con `comision: null, comision_negociada: true`, en vez
 * de no tener entrada: son un plan CONOCIDO con una comisión SIN VALOR
 * PÚBLICO, no un plan desconocido. `comisionPlataformaDe()` sigue
 * resolviendo `null` para los dos (no cambia el número), pero
 * `entradaPlataforma()` devuelve la entrada completa (no `null`), así que
 * quien la consuma puede distinguir "sabemos el plan, la comisión se
 * negocia" de "no sabemos qué plan tiene" (corrección 2026-08-22,
 * `comisionEfectivaCanal` en este archivo).
 */
export const COMISIONES_PLATAFORMA_DEFECTO: Record<string, ComisionPlataforma> = {
  tiendanube_inicial: {
    comision: 0.02,
    plataforma: "tiendanube",
    plan: "inicial",
    pais: "AR",
    vigencia_desde: "2026-08-21",
    origen: "benchmark_provisional",
    fuente: "benchmark_provisional_pendiente_verificacion",
    verificado: false,
    provisional: true,
  },
  tiendanube_esencial: {
    comision: 0.01,
    plataforma: "tiendanube",
    plan: "esencial",
    pais: "AR",
    vigencia_desde: "2026-08-21",
    origen: "benchmark_provisional",
    fuente: "benchmark_provisional_pendiente_verificacion",
    verificado: false,
    provisional: true,
  },
  tiendanube_impulso: {
    comision: 0.007,
    plataforma: "tiendanube",
    plan: "impulso",
    pais: "AR",
    vigencia_desde: "2026-08-21",
    origen: "benchmark_provisional",
    fuente: "benchmark_provisional_pendiente_verificacion",
    verificado: false,
    provisional: true,
  },
  shopify_basic: {
    comision: 0.02,
    plataforma: "shopify",
    plan: "basic",
    vigencia_desde: "2026-08-21",
    origen: "benchmark_provisional",
    fuente: "benchmark_provisional_pendiente_verificacion",
    verificado: false,
    provisional: true,
  },
  shopify_grow: {
    comision: 0.01,
    plataforma: "shopify",
    plan: "grow",
    vigencia_desde: "2026-08-21",
    origen: "benchmark_provisional",
    fuente: "benchmark_provisional_pendiente_verificacion",
    verificado: false,
    provisional: true,
  },
  shopify_advanced: {
    comision: 0.005,
    plataforma: "shopify",
    plan: "advanced",
    vigencia_desde: "2026-08-21",
    origen: "benchmark_provisional",
    fuente: "benchmark_provisional_pendiente_verificacion",
    verificado: false,
    provisional: true,
  },
  shopify_plus: {
    comision: 0.002,
    plataforma: "shopify",
    plan: "plus",
    vigencia_desde: "2026-08-21",
    origen: "benchmark_provisional",
    fuente: "benchmark_provisional_pendiente_verificacion",
    verificado: false,
    provisional: true,
  },
  woocommerce: {
    comision: 0,
    plataforma: "woocommerce",
    vigencia_desde: "2026-08-21",
    origen: "benchmark_provisional",
    fuente: "autohosteado_sin_take_rate",
    verificado: false,
    provisional: true,
  },
  empretienda: {
    comision: 0,
    plataforma: "empretienda",
    pais: "AR",
    vigencia_desde: "2026-08-21",
    origen: "benchmark_provisional",
    fuente: "suscripcion_fija_sin_take_rate",
    verificado: false,
    provisional: true,
  },
  tiendanube_escala: {
    comision: null,
    comision_negociada: true,
    plataforma: "tiendanube",
    plan: "escala",
    pais: "AR",
    vigencia_desde: "2026-08-22",
    origen: "comision_negociada_sin_valor_publico",
    fuente: "https://www.tiendanube.com/planes-y-precios",
    verificado: false,
    provisional: true,
  },
  tiendanube_evolucion: {
    comision: null,
    comision_negociada: true,
    plataforma: "tiendanube",
    plan: "evolucion",
    pais: "AR",
    vigencia_desde: "2026-08-22",
    origen: "comision_negociada_sin_valor_publico",
    fuente: "https://www.tiendanube.com/planes-y-precios",
    verificado: false,
    provisional: true,
  },
};

/**
 * Capacidades de plataforma/plan, ajenas a la comisión (fase de retención y
 * mayorista, 2026-08-22): estructura de datos únicamente. El mapeo de
 * hallazgos que las consume (encadenamiento de retención, detección de
 * mayorista) es un bloque técnico posterior, no implementado acá — ver
 * docs/decisiones-pendientes.md, entradas 4 y 6.
 *
 * Relevada contra documentación oficial de cada plataforma, nunca
 * inventada: ver docs/relevamiento-carrito-mayorista-plataformas.md para la
 * fuente y la cita completa de cada valor. `verificado` queda en `false`
 * hasta que un cliente real lo confirme; un relevamiento de documentación
 * pública nunca cuenta como verificación directa.
 */
export type CapacidadesPlataforma = {
  plataforma?: string;
  plan?: string;
  pais?: string;
  /**
   * Atributo A (decisión 4, retención): si el plan incluye recuperación de
   * carrito nativa. `null` = no se encontró una fuente oficial confiable;
   * nunca se completa con una suposición.
   */
  recuperacion_carrito_nativa: boolean | null;
  /**
   * Atributo B (decisión 6, mayorista): si la plataforma/plan ofrece un
   * canal o función de venta mayorista propia. `null` = no se encontró una
   * fuente oficial confiable.
   */
  canal_mayorista: boolean | null;
  /** Nombre o detalle del canal/función mayorista, si existe (p. ej. "Mercado Libre Negocios"). */
  canal_mayorista_detalle?: string;
  /** Fecha de la regla (vigencia desde), en formato ISO. */
  vigencia_desde?: string;
  vigencia_hasta?: string;
  /** URL(s) de la fuente oficial relevada, separadas por "; " si hay más de una. */
  fuente?: string;
  /** true sólo con confirmación directa de un cliente; false mientras sea sólo relevamiento de documentación pública. */
  verificado?: boolean;
};

/**
 * Relevado el 2026-08-22 contra documentación oficial de cada plataforma
 * (fuentes y citas completas en
 * docs/relevamiento-carrito-mayorista-plataformas.md). Ningún valor es
 * inventado: donde no hubo fuente oficial confiable, queda `null`
 * explícito, no una suposición.
 *
 * Nota (actualizada 2026-08-22): Tiendanube tiene cinco planes activos
 * (Inicial, Esencial, Impulso, Escala, Evolución) según su página oficial
 * de precios. Los cinco ya están modelados en `PLANES_POR_PLATAFORMA`
 * (`src/lib/diagnostico-form.ts`) y acá. Detalle completo, con fuente y
 * fecha por plan, en `docs/relevamiento-planes-tiendanube.md`.
 */
export const CAPACIDADES_PLATAFORMA_DEFECTO: Record<string, CapacidadesPlataforma> = {
  tiendanube_inicial: {
    plataforma: "tiendanube",
    plan: "inicial",
    pais: "AR",
    recuperacion_carrito_nativa: false,
    canal_mayorista: false,
    vigencia_desde: "2026-08-22",
    fuente: "https://www.tiendanube.com/planes-y-precios",
    verificado: false,
  },
  tiendanube_esencial: {
    plataforma: "tiendanube",
    plan: "esencial",
    pais: "AR",
    recuperacion_carrito_nativa: true,
    canal_mayorista: false,
    vigencia_desde: "2026-08-22",
    fuente: "https://www.tiendanube.com/planes-y-precios",
    verificado: false,
  },
  tiendanube_impulso: {
    plataforma: "tiendanube",
    plan: "impulso",
    pais: "AR",
    recuperacion_carrito_nativa: true,
    canal_mayorista: true,
    canal_mayorista_detalle: "Ventas mayoristas: 1 tabla de precios",
    vigencia_desde: "2026-08-22",
    fuente:
      "https://www.tiendanube.com/planes-y-precios; https://ayuda.tiendanube.com/es_ES/ventas-mayoristas/que-es-y-como-configurar-la-funcion-de-ventas-mayoristas-y-minoristas-de-tiendanube",
    verificado: false,
  },
  tiendanube_escala: {
    plataforma: "tiendanube",
    plan: "escala",
    pais: "AR",
    recuperacion_carrito_nativa: true,
    canal_mayorista: true,
    canal_mayorista_detalle: "Ventas mayoristas: hasta 3 tablas de precios",
    vigencia_desde: "2026-08-22",
    fuente:
      "https://www.tiendanube.com/planes-y-precios; https://ayuda.tiendanube.com/es_ES/ventas-mayoristas/que-es-y-como-configurar-la-funcion-de-ventas-mayoristas-y-minoristas-de-tiendanube",
    verificado: false,
  },
  tiendanube_evolucion: {
    plataforma: "tiendanube",
    plan: "evolucion",
    pais: "AR",
    recuperacion_carrito_nativa: true,
    canal_mayorista: true,
    canal_mayorista_detalle: "Ventas mayoristas: tablas de precios ilimitadas",
    vigencia_desde: "2026-08-22",
    fuente:
      "https://www.tiendanube.com/planes-y-precios; https://ayuda.tiendanube.com/es_ES/ventas-mayoristas/que-es-y-como-configurar-la-funcion-de-ventas-mayoristas-y-minoristas-de-tiendanube",
    verificado: false,
  },
  shopify_basic: {
    plataforma: "shopify",
    plan: "basic",
    recuperacion_carrito_nativa: true,
    canal_mayorista: true,
    canal_mayorista_detalle: "Shopify B2B: hasta 3 catálogos activos (vía Shopify Markets)",
    vigencia_desde: "2026-08-22",
    fuente: "https://www.shopify.com/pricing; https://help.shopify.com/en/manual/b2b/getting-started/plan-features",
    verificado: false,
  },
  shopify_grow: {
    plataforma: "shopify",
    plan: "grow",
    recuperacion_carrito_nativa: true,
    canal_mayorista: true,
    canal_mayorista_detalle: "Shopify B2B: hasta 3 catálogos activos (vía Shopify Markets)",
    vigencia_desde: "2026-08-22",
    fuente: "https://www.shopify.com/pricing; https://help.shopify.com/en/manual/b2b/getting-started/plan-features",
    verificado: false,
  },
  shopify_advanced: {
    plataforma: "shopify",
    plan: "advanced",
    recuperacion_carrito_nativa: true,
    canal_mayorista: true,
    canal_mayorista_detalle:
      "Shopify B2B: hasta 3 catálogos activos, checkout/storefront contextual",
    vigencia_desde: "2026-08-22",
    fuente: "https://www.shopify.com/pricing; https://help.shopify.com/en/manual/b2b/getting-started/plan-features",
    verificado: false,
  },
  shopify_plus: {
    plataforma: "shopify",
    plan: "plus",
    recuperacion_carrito_nativa: true,
    canal_mayorista: true,
    canal_mayorista_detalle:
      "Shopify B2B: catálogos ilimitados, asignación directa a compañías, depósito/pago parcial",
    vigencia_desde: "2026-08-22",
    fuente: "https://www.shopify.com/pricing; https://help.shopify.com/en/manual/b2b/getting-started/plan-features",
    verificado: false,
  },
  woocommerce: {
    plataforma: "woocommerce",
    recuperacion_carrito_nativa: false,
    canal_mayorista: false,
    canal_mayorista_detalle:
      "Sin función nativa en el núcleo: sólo extensiones pagas de terceros vendidas en el marketplace oficial (p. ej. B2B for WooCommerce, Wholesale for WooCommerce, B2B & Wholesale Suite; recuperación de carrito: Abandoned Cart Recovery de Addify)",
    vigencia_desde: "2026-08-22",
    fuente:
      "https://woocommerce.com/products/abandoned-cart-recovery/; https://woocommerce.com/products/b2b-for-woocommerce/; https://woocommerce.com/products/wholesale-for-woocommerce/; https://woocommerce.com/products/b2b-wholesale-suite/",
    verificado: false,
  },
  empretienda: {
    plataforma: "empretienda",
    pais: "AR",
    /** Sin mención en la página oficial ni en el centro de ayuda: desconocido, no se asume "no". */
    recuperacion_carrito_nativa: null,
    canal_mayorista: true,
    canal_mayorista_detalle: "Vender por mayor (Productos → Configuraciones avanzadas)",
    vigencia_desde: "2026-08-22",
    fuente: "https://www.empretienda.com/; https://empretienda.helpjuice.com/es_AR/venta-mayorista",
    verificado: false,
  },
  /** Marketplace, no plataforma de tienda propia: el atributo A no aplica (queda `null`), sólo el B. */
  mercado_libre: {
    plataforma: "mercado_libre",
    recuperacion_carrito_nativa: null,
    canal_mayorista: true,
    canal_mayorista_detalle: "Mercado Libre Negocios (requiere CUIT válido)",
    vigencia_desde: "2026-08-22",
    fuente: "https://news.mercadolibre.com/mercado-libre-b2b-en-argentina",
    verificado: false,
  },
};

/**
 * Resuelve las capacidades de plataforma/plan (recuperación de carrito
 * nativa, canal mayorista) por la misma clave compuesta que
 * `entradaPlataforma`. Sólo lectura de `CAPACIDADES_PLATAFORMA_DEFECTO`:
 * todavía no hay una tabla de configuración hermana para pisar estos
 * valores (no se relevan por cliente, a diferencia de la comisión), así
 * que no hace falta el merge de `entradaPlataforma`. Un plan sin entrada
 * (por ejemplo, sin comisión pública, o una plataforma no relevada) resuelve
 * `null`, igual que `entradaPlataforma` con una plataforma sin benchmark.
 */
export function entradaCapacidadesPlataforma(d: DatosDiagnostico): CapacidadesPlataforma | null {
  const compuesta = claveComisionPlataforma(d.plataforma, d.plan_plataforma);
  const porCompuesta = CAPACIDADES_PLATAFORMA_DEFECTO[compuesta];
  if (porCompuesta) return porCompuesta;
  const simple = (d.plataforma || "").trim();
  return CAPACIDADES_PLATAFORMA_DEFECTO[simple] ?? null;
}

/**
 * Primer plan (en el orden en que los ofrece el formulario) de una
 * plataforma que sí incluye recuperación de carrito nativa — para poder
 * recomendar concretamente a qué plan subir (fase 8, retención,
 * 2026-08-22, decisión comercial 4). `null` si la plataforma no tiene
 * planes modelados (autohosteada o de plan único) o si ninguno de sus
 * planes conocidos la incluye.
 */
export function planConCarritoNativoDe(plataforma: string): string | null {
  const planes = PLANES_POR_PLATAFORMA[plataforma];
  if (!planes) return null;
  for (const p of planes) {
    const clave = claveComisionPlataforma(plataforma, p.value);
    if (CAPACIDADES_PLATAFORMA_DEFECTO[clave]?.recuperacion_carrito_nativa === true) {
      return p.label;
    }
  }
  return null;
}

/**
 * Mismo criterio que `planConCarritoNativoDe`, para el canal mayorista
 * (fase 9, decisión comercial 6, 2026-08-22): primer plan de la plataforma
 * que sí ofrece un canal o función de venta mayorista propia.
 */
export function planConCanalMayoristaDe(plataforma: string): string | null {
  const planes = PLANES_POR_PLATAFORMA[plataforma];
  if (!planes) return null;
  for (const p of planes) {
    const clave = claveComisionPlataforma(plataforma, p.value);
    if (CAPACIDADES_PLATAFORMA_DEFECTO[clave]?.canal_mayorista === true) {
      return p.label;
    }
  }
  return null;
}

export type ConfigComisiones = {
  /**
   * Acepta el formato legado (número plano) o el nuevo con metadatos
   * (`ComisionPlataforma`). Un número plano se trata como
   * `{ comision: valor }`, sin metadatos de vigencia/evidencia.
   */
  comision_plataforma?: Record<string, number | ComisionPlataforma>;
  comision_pasarela?: Record<string, number>;
  comision_marketplace?: Record<string, ComisionMarketplace>;
};

/**
 * Una comisión verificada menor al 1% casi siempre es un error de escala:
 * alguien cargó la tasa (0,1694) en un campo que espera porcentaje (16,94).
 */
export function comisionEnEscalaSospechosa(valorEnPorcentaje: number | null | undefined): boolean {
  return typeof valorEnPorcentaje === "number" && valorEnPorcentaje > 0 && valorEnPorcentaje < 1;
}


function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Lee un campo del canal por sufijo, sin castear a un tipo concreto. */
export function campoCanal(d: DatosDiagnostico, canal: CanalId, sufijo: string): unknown {
  return (d as unknown as Record<string, unknown>)[`${PREFIJO_CANAL[canal]}_${sufijo}`];
}

export function numeroCanal(d: DatosDiagnostico, canal: CanalId, sufijo: string): number | null {
  const v = campoCanal(d, canal, sufijo);
  return finito(v) ? v : null;
}

/**
 * Porcentaje declarado del canal.
 * Migración conservadora: un diagnóstico viejo con `ml_pct_facturacion` cargado
 * usa ese valor para Mercado Libre. La tienda propia NO se asume por diferencia.
 */
export function pctCanal(d: DatosDiagnostico, canal: CanalId): number | null {
  const propio = numeroCanal(d, canal, "pct");
  if (propio !== null) return propio;
  if (canal === "mercado_libre" && finito(d.ml_pct_facturacion)) return d.ml_pct_facturacion;
  return null;
}

export function estadoCanal(d: DatosDiagnostico, canal: CanalId): EstadoCanal {
  if (campoCanal(d, canal, "no_aplica") === true) return "no_aplica";
  return pctCanal(d, canal) !== null ? "declarado" : "ausente";
}

export function canalesDeclarados(d: DatosDiagnostico): { id: CanalId; pct: number }[] {
  return CANALES.filter((c) => estadoCanal(d, c.id) === "declarado").map((c) => ({
    id: c.id,
    pct: pctCanal(d, c.id) as number,
  }));
}

/** Suma de los porcentajes declarados. Sin canales declarados devuelve 0. */
export function coberturaCanales(d: DatosDiagnostico): number {
  const suma = canalesDeclarados(d).reduce((a, c) => a + c.pct, 0);
  return redondear(suma, 4) ?? 0;
}

export function hayCanalesDeclarados(d: DatosDiagnostico): boolean {
  return canalesDeclarados(d).length > 0;
}

/** Los porcentajes de canal no pueden superar el total de la facturación. */
export function canalesSuperan100(d: DatosDiagnostico): boolean {
  return hayCanalesDeclarados(d) && coberturaCanales(d) > 100;
}

/** Campos de canal que quedan en falta cuando el mix es imposible. */
export const CAMPOS_PCT_CANAL: Record<CanalId, string> = {
  tienda_propia: "canal_tienda_pct",
  mercado_libre: "canal_ml_pct",
};

/**
 * Canal con mayor participación. Un empate exacto no se desempata: devuelve null.
 * Los canales en 0% no compiten por el primer puesto.
 */
export function canalPrincipal(d: DatosDiagnostico): CanalId | null {
  const conVenta = canalesDeclarados(d).filter((c) => c.pct > 0);
  if (conVenta.length === 0) return null;
  const max = Math.max(...conVenta.map((c) => c.pct));
  const empatados = conVenta.filter((c) => c.pct === max);
  return empatados.length === 1 ? (empatados[0] as { id: CanalId }).id : null;
}

/** Cargo fijo conocido pero no aplicado, con sus metadatos, para mostrarlo en el detalle. */
export type CargoFijoDisponible = {
  valor: number;
  hasta: number | null;
  base_aplicacion: BaseAplicacionCargo;
  precio_umbral: PrecioUmbral;
  fuente: string | null;
  verificado: boolean;
};

export type ComisionResuelta = {
  valor: number | null;
  origen: string | null;
  provisional: boolean;
  cargo_fijo_aplicado: boolean;
  /** Cargo fijo declarado en la regla, esté o no aplicado al cálculo. */
  cargo_fijo_disponible: CargoFijoDisponible | null;
  /** true si la comisión verificada parece cargada en tasa y no en porcentaje. */
  escala_sospechosa: boolean;
  /** Vigencia declarada de la regla, si la configuración la trae. */
  vigencia: string | null;
  /**
   * Qué respalda al número. Un benchmark NUNCA se muestra como verificado:
   * `liquidacion_cliente` es un valor cargado en ESTE diagnóstico puntual;
   * `liquidacion_verificada` es una regla de configuración marcada
   * `verificado: true` (una liquidación real ya cargada para todos los
   * diagnósticos de esa plataforma/plan, no sólo éste — ver fase 4); el resto
   * es benchmark sin verificar.
   */
  evidencia:
    | "liquidacion_cliente"
    | "declarado_cliente"
    | "liquidacion_verificada"
    | "benchmark_sin_verificar";
  /** Plan o tipo de publicación de la regla resuelta, cuando lo trae (fase 4). */
  plan: string | null;
  /** País de la regla resuelta, cuando lo trae (fase 4). */
  pais: string | null;
  faltantes: string[];
};

/** Texto de vigencia a partir de las fechas de la regla. */
function vigenciaDe(e: { vigencia_desde?: string; vigencia_hasta?: string } | null): string | null {
  if (!e) return null;
  const desde = (e.vigencia_desde ?? "").trim();
  const hasta = (e.vigencia_hasta ?? "").trim();
  if (!desde && !hasta) return null;
  if (desde && hasta) return `${desde} a ${hasta}`;
  return desde ? `desde ${desde}` : `hasta ${hasta}`;
}


/** Clave compuesta plataforma_plan usada en la configuración de comisiones. */
export function claveComisionPlataforma(plataforma: string, plan: string): string {
  const p = (plataforma || "").trim();
  const pl = (plan || "").trim();
  if (!p) return "";
  return pl ? `${p}_${pl}` : p;
}

/**
 * Un número plano legado se trata como `{ comision: valor }`, sin metadatos.
 * `comision: null` explícito (plan conocido, comisión negociada sin valor
 * público — ver `ComisionPlataforma.comision_negociada`) se conserva tal
 * cual: es una entrada real, distinta de "no hay ninguna entrada" (`undefined`).
 */
function normalizarEntradaPlataforma(
  v: number | ComisionPlataforma | undefined,
): ComisionPlataforma | null {
  if (v === undefined) return null;
  if (typeof v === "number") return finito(v) ? { comision: v } : null;
  if (v.comision === null) return v;
  return finito(v.comision) ? v : null;
}

/**
 * Entrada de comisión de plataforma (Tiendanube, Shopify, WooCommerce,
 * Empretienda...), con metadatos completos (fase 4, 2026-08-21). La
 * configuración de la tabla `configuracion` pisa al valor por defecto del
 * código; si la fila no existe, se usa `COMISIONES_PLATAFORMA_DEFECTO`.
 */
export function entradaPlataforma(
  cfg: ConfigComisiones,
  d: DatosDiagnostico,
): ComisionPlataforma | null {
  const tabla: Record<string, number | ComisionPlataforma> = {
    ...COMISIONES_PLATAFORMA_DEFECTO,
    ...(cfg.comision_plataforma ?? {}),
  };
  const compuesta = claveComisionPlataforma(d.plataforma, d.plan_plataforma);
  const porCompuesta = normalizarEntradaPlataforma(tabla[compuesta]);
  if (porCompuesta) return porCompuesta;
  const simple = (d.plataforma || "").trim();
  return normalizarEntradaPlataforma(tabla[simple]);
}

export function comisionPlataformaDe(cfg: ConfigComisiones, d: DatosDiagnostico): number | null {
  return entradaPlataforma(cfg, d)?.comision ?? null;
}

/**
 * true cuando el plan de plataforma es conocido pero su comisión se
 * negocia por comercio, sin porcentaje público (corrección 2026-08-22).
 * Sirve para que el formulario muestre un aviso pidiendo la comisión real
 * del cliente, en vez de un "falta un dato" genérico. Se resuelve sólo
 * contra el benchmark del código: el formulario no tiene la configuración
 * de la base cargada en vivo, y esta bandera es una propiedad del plan, no
 * de una liquidación particular.
 */
export function comisionPlataformaNegociada(d: DatosDiagnostico): boolean {
  return entradaPlataforma({}, d)?.comision_negociada === true;
}

/**
 * Entrada de comisión de marketplace, por tipo de publicación si está declarado.
 * La configuración pisa al valor por defecto del código; si la fila no existe,
 * se usa el valor por defecto.
 */
export function entradaMarketplace(
  cfg: ConfigComisiones,
  canal: CanalId,
  tipoPublicacion: string,
): ComisionMarketplace | null {
  const tabla = { ...COMISIONES_MARKETPLACE_DEFECTO, ...(cfg.comision_marketplace ?? {}) };
  const base = canal === "mercado_libre" ? "mercado_libre" : canal;
  const tipo = (tipoPublicacion || "").trim();
  const candidatas = tipo ? [`${base}_${tipo}`, base] : [base];
  for (const clave of candidatas) {
    const e = tabla[clave];
    if (e && finito(e.comision)) return e;
  }
  return null;
}

/**
 * Comisión efectiva del canal sobre el precio.
 *
 * Precedencia: el valor verificado con el cliente le gana al benchmark de
 * configuración, y la configuración le gana al valor por defecto del código.
 *
 * Cargo fijo: sólo entra en la comisión efectiva cuando la regla está
 * verificada. Mientras `verificado` sea false el cargo se informa como
 * `cargo_fijo_disponible` y no toca el cálculo.
 *
 * @param precioProducto precio del producto en cuestión, cuando el cargo se
 * cobra por unidad o el umbral se compara contra el precio del producto.
 */
export function comisionEfectivaCanal(
  d: DatosDiagnostico,
  cfg: ConfigComisiones,
  canal: CanalId,
  ticket: number | null,
  precioProducto: number | null = null,
): ComisionResuelta {
  const verificada = numeroCanal(d, canal, "comision_pct");
  const cargoDeclarado = numeroCanal(d, canal, "cargo_fijo");
  const precio = finito(precioProducto) && precioProducto > 0 ? precioProducto : null;
  const tkt = finito(ticket) && ticket > 0 ? ticket : null;

  type OpcionesCargo = {
    cargo: number | null;
    hasta?: number | null | undefined;
    base?: BaseAplicacionCargo | undefined;
    umbral?: PrecioUmbral | undefined;
    fuente?: string | null | undefined;
    verificado?: boolean | undefined;
  };

  const conCargo = (base: number, o: OpcionesCargo) => {
    const cargo = o.cargo;
    const hasta = o.hasta ?? null;
    const baseAplicacion: BaseAplicacionCargo = o.base ?? "pedido";
    const precioUmbral: PrecioUmbral = o.umbral ?? "ticket_promedio";
    const verificado = o.verificado !== false;

    const disponible: CargoFijoDisponible | null =
      cargo !== null && cargo > 0
        ? {
            valor: cargo,
            hasta,
            base_aplicacion: baseAplicacion,
            precio_umbral: precioUmbral,
            fuente: o.fuente ?? null,
            verificado,
          }
        : null;

    // El cargo por publicación no se paga por venta: nunca entra en la comisión.
    const divisor =
      baseAplicacion === "unidad" ? (precio ?? tkt) : baseAplicacion === "pedido" ? tkt : null;
    const comparado = precioUmbral === "precio_producto" ? (precio ?? tkt) : tkt;

    const aplica =
      verificado &&
      cargo !== null &&
      cargo > 0 &&
      divisor !== null &&
      divisor > 0 &&
      (hasta === null || (comparado !== null && comparado < hasta));

    const valor = aplica ? base + cargo / (divisor as number) : base;
    return { valor: redondear(valor, 4), aplicado: aplica, disponible };
  };

  if (verificada !== null) {
    // El formulario carga la comisión verificada en porcentaje (16,94), no en tasa.
    // Este es el único lugar del código donde se divide por 100.
    const r = conCargo(verificada / 100, { cargo: cargoDeclarado });
    return {
      valor: r.valor,
      origen: "verificado_cliente",
      provisional: false,
      cargo_fijo_aplicado: r.aplicado,
      cargo_fijo_disponible: r.disponible,
      escala_sospechosa: comisionEnEscalaSospechosa(verificada),
      vigencia: null,
      evidencia: "liquidacion_cliente",
      plan: null,
      pais: null,
      faltantes: [],
    };
  }

  if (canal === "tienda_propia") {
    const plataforma = entradaPlataforma(cfg, d);
    const pasarela = finito(cfg.comision_pasarela?.[d.pasarela])
      ? (cfg.comision_pasarela![d.pasarela] as number)
      : null;
    // Dos motivos distintos por los que puede faltar la comisión de
    // plataforma: no reconocemos el plan (`comision_plataforma`) o SÍ lo
    // reconocemos pero su comisión se negocia por comercio, sin porcentaje
    // público (`comision_plataforma_negociada`) — corrección 2026-08-22. El
    // segundo caso no es "plan desconocido": el aviso que debe mostrar el
    // formulario es distinto (pedirle la comisión al cliente y cargarla en
    // el campo verificado), no un genérico "falta un dato".
    //
    // El gate de seguridad es `plataforma.comision === null` en sí mismo,
    // no la bandera `comision_negociada`: así, si algún día una fila de
    // `configuracion` trajera `comision: null` sin marcar
    // `comision_negociada` (un dato mal cargado, no el caso previsto), la
    // comisión igual queda retenida en vez de sumarse como si fuera cero
    // (`null + pasarela` en JS da `pasarela`, un cero disfrazado). La
    // bandera sólo decide QUÉ aviso mostrar, nunca si se calcula o no.
    const comisionAusente = plataforma !== null && plataforma.comision === null;
    const comisionNegociada = comisionAusente && plataforma?.comision_negociada === true;
    const faltan: string[] = [];
    if (plataforma === null) faltan.push("comision_plataforma");
    else if (comisionAusente) faltan.push(comisionNegociada ? "comision_plataforma_negociada" : "comision_plataforma");
    if (pasarela === null) faltan.push("comision_pasarela");
    if (plataforma === null || comisionAusente || pasarela === null) {
      return {
        valor: null,
        origen: comisionNegociada ? "comision_negociada_sin_valor_publico" : "benchmark_configuracion",
        provisional: false,
        cargo_fijo_aplicado: false,
        cargo_fijo_disponible: null,
        escala_sospechosa: false,
        vigencia: null,
        evidencia: "benchmark_sin_verificar",
        plan: plataforma?.plan ?? null,
        pais: plataforma?.pais ?? null,
        faltantes: faltan,
      };
    }
    // A esta altura `plataforma !== null` y `!comisionAusente`: el runtime
    // ya garantizó que `comision` es un número (el guard de arriba), aunque
    // el tipo siga siendo `number | null`.
    const r = conCargo((plataforma as ComisionPlataforma).comision as number + (pasarela as number), {
      cargo: cargoDeclarado,
    });
    // Una regla de plataforma marcada `verificado: true` es una liquidación
    // real cargada en configuración (fase 4), no un benchmark del código.
    const plataformaVerificada = (plataforma as ComisionPlataforma).verificado === true;
    return {
      valor: r.valor,
      origen: (plataforma as ComisionPlataforma).origen ?? "benchmark_configuracion",
      provisional: !plataformaVerificada,
      cargo_fijo_aplicado: r.aplicado,
      cargo_fijo_disponible: r.disponible,
      escala_sospechosa: false,
      vigencia: vigenciaDe(plataforma),
      evidencia: plataformaVerificada ? "liquidacion_verificada" : "benchmark_sin_verificar",
      plan: (plataforma as ComisionPlataforma).plan ?? null,
      pais: (plataforma as ComisionPlataforma).pais ?? null,
      faltantes: [],
    };
  }

  const entrada = entradaMarketplace(cfg, canal, String(campoCanal(d, canal, "tipo_publicacion") ?? ""));
  if (!entrada) {
    return {
      valor: null,
      origen: null,
      provisional: false,
      cargo_fijo_aplicado: false,
      cargo_fijo_disponible: null,
      escala_sospechosa: false,
      vigencia: null,
      evidencia: "benchmark_sin_verificar",
      plan: null,
      pais: null,
      faltantes: ["comision_marketplace"],
    };
  }
  // El cargo declarado por el cliente sí está verificado: lo dijo él.
  const usaDeclarado = cargoDeclarado !== null;
  const cargo = usaDeclarado
    ? cargoDeclarado
    : finito(entrada.cargo_fijo)
      ? (entrada.cargo_fijo as number)
      : null;
  const r = conCargo(entrada.comision, {
    cargo,
    hasta: usaDeclarado ? null : finito(entrada.cargo_fijo_hasta) ? entrada.cargo_fijo_hasta : null,
    base: usaDeclarado ? "pedido" : entrada.base_aplicacion,
    umbral: usaDeclarado ? "ticket_promedio" : entrada.precio_umbral,
    fuente: usaDeclarado ? "declarado_cliente" : (entrada.fuente ?? null),
    verificado: usaDeclarado ? true : entrada.verificado === true,
  });
  // Una regla de marketplace marcada `verificado: true` es una liquidación
  // real cargada en configuración (fase 4: "dejar preparada la estructura
  // para cargar una liquidación real de marketplace"), no un benchmark del
  // código. El cargo declarado por el cliente sigue respaldando sólo al
  // cargo (rama `usaDeclarado`), nunca a la comisión entera.
  const entradaVerificada = !usaDeclarado && entrada.verificado === true;
  return {
    valor: r.valor,
    origen: entrada.origen ?? "benchmark_configuracion",
    provisional: !entradaVerificada && entrada.provisional === true,
    cargo_fijo_aplicado: r.aplicado,
    cargo_fijo_disponible: r.disponible,
    escala_sospechosa: false,
    vigencia: vigenciaDe(entrada),
    evidencia: usaDeclarado
      ? "declarado_cliente"
      : entradaVerificada
        ? "liquidacion_verificada"
        : "benchmark_sin_verificar",
    plan: entrada.tipo_publicacion ?? null,
    pais: entrada.pais ?? null,
    faltantes: [],
  };
}
