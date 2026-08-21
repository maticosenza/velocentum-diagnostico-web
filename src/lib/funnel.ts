/**
 * Cascada de atribución del funnel web.
 *
 * El bug que corrige: antes la fuga por conversión medía todas las visitas que
 * no compraron y la fuga por carritos medía a los que abandonaron el carrito.
 * Los segundos son un subconjunto de los primeros, así que la misma gente se
 * contaba dos veces. Acá el funnel se parte en tres tramos que no se solapan.
 *
 * Reglas duras de esta capa:
 *  - las cuatro etapas pertenecen al mismo canal y al mismo período;
 *  - el funnel de tienda propia NUNCA se aplica a Mercado Libre;
 *  - si la cadena visitas ≥ carrito ≥ checkout ≥ compras se rompe, no se
 *    calcula nada: los datos son incompatibles y se reportan como tales;
 *  - cero, ausente y "no aplica" son tres estados distintos.
 */

import { canalPrincipal, estadoCanal, numeroCanal } from "./canales";
import type { DatosDiagnostico } from "./diagnostico-form";
import { redondear } from "./dinero";
import { impactoCalculado, impactoRetenido, type ImpactoEconomico } from "./impacto-economico";

/** Mejoras objetivo, en PUNTOS PORCENTUALES. Editables desde `configuracion`. */
export const MEJORAS_FUNNEL_DEFECTO = {
  mejora_agregado_pts: 2,
  mejora_checkout_pts: 10,
  mejora_compra_pts: 10,
} as const;

export type ConfigFunnel = {
  mejora_agregado_pts?: number;
  mejora_checkout_pts?: number;
  mejora_compra_pts?: number;
};

export type EtapaFunnel = "visitas" | "agregados_carrito" | "checkouts_iniciados" | "compras";

export const NOMBRE_ETAPA: Record<EtapaFunnel, string> = {
  visitas: "visitas",
  agregados_carrito: "agregados al carrito",
  checkouts_iniciados: "checkouts iniciados",
  compras: "compras",
};

export type EstadoFunnel =
  /** Las cuatro etapas están y la cadena cierra: hay desglose por tramo. */
  | "calculado"
  /** Faltan etapas intermedias: una sola oportunidad combinada, sin desglose. */
  | "combinado"
  /** El canal no tiene funnel web (por ejemplo, negocio 100% marketplace). */
  | "no_aplica"
  /** Los números son incompatibles entre sí. No se calcula ninguna fuga. */
  | "error"
  /** Faltan visitas o compras: no hay funnel que evaluar. */
  | "sin_datos";

export type FunnelDerivado = {
  estado: EstadoFunnel;
  visitas: number | null;
  agregados_carrito: number | null;
  checkouts_iniciados: number | null;
  compras: number | null;
  /** checkouts iniciados ÷ agregados al carrito */
  p_checkout_dado_carrito: number | null;
  /** compras ÷ checkouts iniciados */
  p_compra_dado_checkout: number | null;
  /** agregados al carrito ÷ visitas */
  p_carrito_dado_visita: number | null;
  /** compras ÷ visitas: conversión global observada */
  cr_global: number | null;
  /** Etapa donde se rompe la cadena, si se rompe. */
  etapa_error: EtapaFunnel | null;
  error: string | null;
  faltantes: string[];
  /** true cuando hay las cuatro etapas y se puede desglosar por tramo. */
  desglosado: boolean;
  ticket: number | null;
  /** Probabilidades sin redondear, para el cálculo intermedio. */
  exactas: {
    p_carrito_dado_visita: number | null;
    p_checkout_dado_carrito: number | null;
    p_compra_dado_checkout: number | null;
    cr_global: number | null;
  };
};

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function valor(n: unknown): number | null {
  return finito(n) ? n : null;
}

/** Lee el parámetro de mejora en puntos porcentuales y lo devuelve como tasa. */
export function mejoraPts(cfg: ConfigFunnel, clave: keyof typeof MEJORAS_FUNNEL_DEFECTO): number {
  const v = (cfg as Record<string, unknown>)[clave];
  const pts = finito(v) ? v : MEJORAS_FUNNEL_DEFECTO[clave];
  return pts / 100;
}

/**
 * ¿Corresponde evaluar el funnel web de tienda propia?
 * Si la tienda propia está marcada como "no aplica", o si el canal principal es
 * un marketplace y no hay ni un dato de funnel de tienda propia, queda en no aplica.
 */
function funnelNoAplica(d: DatosDiagnostico, etapas: (number | null)[]): boolean {
  if (estadoCanal(d, "tienda_propia") === "no_aplica") return true;
  const sinDatosDeTienda = etapas.every((e) => e === null);
  return canalPrincipal(d) === "mercado_libre" && sinDatosDeTienda;
}

/**
 * Arma el funnel del canal de tienda propia y valida su coherencia interna.
 * Las compras se derivan de facturación sobre ticket, del mismo canal.
 */
export function evaluarFunnel(d: DatosDiagnostico, cfg: ConfigFunnel = {}): FunnelDerivado {
  void cfg;
  const ticket =
    numeroCanal(d, "tienda_propia", "ticket") ??
    (finito(d.ticket_promedio) && d.ticket_promedio > 0 ? d.ticket_promedio : null);
  const facturacion =
    numeroCanal(d, "tienda_propia", "facturacion") ??
    (finito(d.facturacion_mensual) ? d.facturacion_mensual : null);

  const visitas = valor(d.visitas_mensuales);
  const agregados = valor(d.agregados_carrito);
  const checkouts = valor(d.checkouts_iniciados);
  const compras =
    facturacion !== null && ticket !== null && ticket > 0 ? facturacion / ticket : null;

  const base: FunnelDerivado = {
    estado: "sin_datos",
    visitas,
    agregados_carrito: agregados,
    checkouts_iniciados: checkouts,
    compras: compras === null ? null : (redondear(compras, 2) ?? null),
    p_checkout_dado_carrito: null,
    p_compra_dado_checkout: null,
    p_carrito_dado_visita: null,
    cr_global: null,
    etapa_error: null,
    error: null,
    faltantes: [],
    desglosado: false,
    ticket,
    exactas: {
      p_carrito_dado_visita: null,
      p_checkout_dado_carrito: null,
      p_compra_dado_checkout: null,
      cr_global: null,
    },
  };

  if (funnelNoAplica(d, [visitas, agregados, checkouts])) {
    return { ...base, estado: "no_aplica" };
  }

  // Ningún valor de etapa puede ser negativo.
  const negativa = (
    [
      ["visitas", visitas],
      ["agregados_carrito", agregados],
      ["checkouts_iniciados", checkouts],
      ["compras", compras],
    ] as [EtapaFunnel, number | null][]
  ).find(([, v]) => v !== null && v < 0);
  if (negativa) {
    return {
      ...base,
      estado: "error",
      etapa_error: negativa[0],
      error: `El valor de ${NOMBRE_ETAPA[negativa[0]]} es negativo: los datos no son utilizables.`,
      faltantes: ["visitas_mensuales", "agregados_carrito", "checkouts_iniciados"],
    };
  }

  // Cadena de coherencia: visitas ≥ carrito ≥ checkout ≥ compras.
  // Se comparan sólo las etapas presentes, en orden, sin reordenar ni corregir nada.
  const orden: [EtapaFunnel, number | null][] = [
    ["visitas", visitas],
    ["agregados_carrito", agregados],
    ["checkouts_iniciados", checkouts],
    ["compras", compras],
  ];
  const presentes = orden.filter(([, v]) => v !== null) as [EtapaFunnel, number][];
  for (let i = 1; i < presentes.length; i++) {
    const [etapaPrevia, previo] = presentes[i - 1]!;
    const [etapa, actual] = presentes[i]!;
    // Tolerancia mínima: las compras se derivan de una división y pueden traer ruido.
    if (actual > previo + 1e-9) {
      return {
        ...base,
        estado: "error",
        etapa_error: etapa,
        error: `Hay más ${NOMBRE_ETAPA[etapa]} (${actual}) que ${NOMBRE_ETAPA[etapaPrevia]} (${previo}). La cadena del funnel no cierra: no se calcula ninguna fuga.`,
        faltantes: ["visitas_mensuales", "agregados_carrito", "checkouts_iniciados"],
      };
    }
  }

  if (visitas === null || compras === null) {
    const faltan: string[] = [];
    if (visitas === null) faltan.push("visitas_mensuales");
    if (compras === null) faltan.push("facturacion_mensual", "ticket_promedio");
    return { ...base, estado: "sin_datos", faltantes: faltan };
  }

  const tasa = (num: number | null, den: number | null) =>
    num !== null && den !== null && den > 0 ? num / den : null;

  const pCarrito = tasa(agregados, visitas);
  const pCheckout = tasa(checkouts, agregados);
  const pCompra = tasa(compras, checkouts);
  const crGlobal = tasa(compras, visitas);

  // Una tasa derivada por encima del 100% es un dato incompatible, no un caso borde.
  const sospechosa = (
    [
      ["agregados_carrito", pCarrito],
      ["checkouts_iniciados", pCheckout],
      ["compras", pCompra],
    ] as [EtapaFunnel, number | null][]
  ).find(([, v]) => v !== null && v > 1 + 1e-9);
  if (sospechosa) {
    return {
      ...base,
      estado: "error",
      etapa_error: sospechosa[0],
      error: `La tasa derivada de ${NOMBRE_ETAPA[sospechosa[0]]} supera el 100%: los datos no son compatibles entre sí.`,
      faltantes: ["visitas_mensuales", "agregados_carrito", "checkouts_iniciados"],
    };
  }

  const desglosado = agregados !== null && checkouts !== null;
  const faltan: string[] = [];
  if (agregados === null) faltan.push("agregados_carrito");
  if (checkouts === null) faltan.push("checkouts_iniciados");

  return {
    ...base,
    estado: desglosado ? "calculado" : "combinado",
    p_checkout_dado_carrito: pCheckout === null ? null : (redondear(pCheckout, 4) ?? null),
    p_compra_dado_checkout: pCompra === null ? null : (redondear(pCompra, 4) ?? null),
    p_carrito_dado_visita: pCarrito === null ? null : (redondear(pCarrito, 4) ?? null),
    cr_global: crGlobal === null ? null : (redondear(crGlobal, 4) ?? null),
    desglosado,
    faltantes: faltan,
    exactas: {
      p_carrito_dado_visita: pCarrito,
      p_checkout_dado_carrito: pCheckout,
      p_compra_dado_checkout: pCompra,
      cr_global: crGlobal,
    },
  };
}

export type ConfianzaTramo = "alta" | "parcial";

export type TramoFunnel = {
  id: "funnel_navegacion" | "funnel_carrito" | "funnel_checkout" | "funnel_combinado";
  etiqueta: string;
  detalle: string;
  /** null cuando no se puede calcular con los datos disponibles. */
  monto: number | null;
  calculable: boolean;
  faltantes: string[];
  /**
   * "alta" para los tramos disjuntos de la cascada completa; "parcial" para la
   * oportunidad combinada, que estima sin poder repartir entre tramos.
   */
  confianza: ConfianzaTramo;
  /**
   * Facturación incremental (unidades × ticket) y contribución incremental
   * (facturación incremental × margen) de este tramo, con retención
   * independiente: sin ticket se retiene la primera, sin margen se retiene
   * sólo la segunda. `monto` arriba sigue siendo exactamente la contribución
   * (así se calculaba antes de este modelo): este array no lo reemplaza, lo
   * tipa.
   */
  impactos: ImpactoEconomico[];
};


/**
 * La mejora nunca puede llevar una tasa por encima del 100%: el techo es el
 * espacio que queda. Esto además garantiza monotonía: mejorar la tasa real del
 * negocio nunca aumenta la oportunidad del tramo.
 */
function mejoraConTecho(pts: number, tasaActual: number | null): number {
  if (tasaActual === null) return pts;
  return Math.max(0, Math.min(pts, 1 - tasaActual));
}

/**
 * Los tres tramos de la cascada, valorizados.
 *
 * @param margen margen total confiable. Si es null, los tramos se devuelven sin
 * monto: el margen de una muestra parcial no representa al negocio.
 */
export function tramosFunnel(
  f: FunnelDerivado,
  cfg: ConfigFunnel,
  margen: number | null,
): TramoFunnel[] {
  if (f.estado === "no_aplica" || f.estado === "error") return [];

  const ticket = f.ticket;
  const {
    p_carrito_dado_visita: pCarrito,
    p_checkout_dado_carrito: pCheckout,
    p_compra_dado_checkout: pCompra,
    cr_global: crGlobal,
  } = f.exactas;
  const faltanBase: string[] = [];
  if (ticket === null || ticket <= 0) faltanBase.push("ticket_promedio");
  if (margen === null) faltanBase.push("margen_contribucion");

  const valorizar = (unidades: number | null): TramoFunnel["monto"] => {
    if (unidades === null || ticket === null || ticket <= 0 || margen === null) return null;
    return unidades * ticket * margen;
  };

  const confianzaImpacto = (c: ConfianzaTramo): "alta" | "media" => (c === "alta" ? "alta" : "media");

  /** Facturación incremental (unidades × ticket), retenida sin unidades o sin ticket. */
  const impactoFacturacion = (unidades: number | null, confianza: ConfianzaTramo): ImpactoEconomico => {
    if (unidades === null) {
      return impactoRetenido({
        tipo: "facturacion_incremental",
        motivo:
          "Faltan etapas del funnel para calcular las unidades recuperables de este tramo.",
        dependencias: ["visitas_mensuales", "agregados_carrito", "checkouts_iniciados"],
      });
    }
    if (ticket === null || ticket <= 0) {
      return impactoRetenido({
        tipo: "facturacion_incremental",
        motivo: "No se declaró el ticket promedio.",
        dependencias: ["ticket_promedio"],
      });
    }
    return impactoCalculado({
      tipo: "facturacion_incremental",
      montoMensual: Math.max(0, redondear(unidades * ticket, 0) ?? 0),
      confianza: confianzaImpacto(confianza),
      dependencias: ["ticket_promedio"],
    });
  };

  /** Contribución incremental (facturación incremental × margen), retenida sin margen. */
  const impactoContribucion = (
    facturacion: ImpactoEconomico,
    confianza: ConfianzaTramo,
  ): ImpactoEconomico => {
    if (facturacion.confianza === "retenida") {
      return impactoRetenido({
        tipo: "contribucion_incremental",
        motivo: facturacion.motivoRetencion as string,
        dependencias: facturacion.dependencias,
      });
    }
    if (margen === null) {
      return impactoRetenido({
        tipo: "contribucion_incremental",
        motivo: "No se declaró (o no es válido) el margen de contribución.",
        dependencias: ["margen_contribucion"],
      });
    }
    return impactoCalculado({
      tipo: "contribucion_incremental",
      montoMensual: Math.max(
        0,
        redondear((facturacion.montoMensual as number) * margen, 0) ?? 0,
      ),
      confianza: confianzaImpacto(confianza),
      dependencias: ["ticket_promedio", "margen_contribucion"],
    });
  };

  /**
   * `faltan` es informativo: dice qué datos harían más preciso al tramo. Lo que
   * bloquea el monto es no tener unidades, ticket o margen confiable.
   */
  const armar = (
    id: TramoFunnel["id"],
    etiqueta: string,
    detalle: string,
    unidades: number | null,
    faltan: string[],
    confianza: ConfianzaTramo = "alta",
  ): TramoFunnel => {
    const todos = [...faltanBase, ...faltan];
    const monto = valorizar(unidades);
    const facturacion = impactoFacturacion(unidades, confianza);
    const contribucion = impactoContribucion(facturacion, confianza);
    return {
      id,
      etiqueta,
      detalle,
      monto: monto === null ? null : Math.max(0, redondear(monto, 0) ?? 0),
      calculable: monto !== null,
      faltantes: todos,
      confianza,
      impactos: [facturacion, contribucion],
    };
  };

  if (f.estado === "sin_datos") return [];

  if (!f.desglosado) {
    // Sin las etapas intermedias no se puede repartir la oportunidad entre
    // tramos. Se muestra una sola, calculada sobre visitas y compras, usando la
    // conversión global observada como proxy: no se inventa el reparto.
    const pts = mejoraConTecho(mejoraPts(cfg, "mejora_agregado_pts"), pCarrito);
    const unidades =
      f.visitas !== null && crGlobal !== null ? f.visitas * pts * crGlobal : null;
    return [
      armar(
        "funnel_combinado",
        "Oportunidad de funnel (sin desglose)",
        "Faltan las etapas intermedias del funnel, así que la oportunidad no se puede repartir entre navegación, carrito y checkout. Se calcula una sola sobre visitas y compras, con la conversión global observada.",
        unidades,
        f.faltantes,
        "parcial",
      ),
    ];
  }

  const visitas = f.visitas as number;
  const agregados = f.agregados_carrito as number;
  const checkouts = f.checkouts_iniciados as number;

  const ptsAgregado = mejoraConTecho(mejoraPts(cfg, "mejora_agregado_pts"), pCarrito);
  const ptsCheckout = mejoraConTecho(mejoraPts(cfg, "mejora_checkout_pts"), pCheckout);
  const ptsCompra = mejoraConTecho(mejoraPts(cfg, "mejora_compra_pts"), pCompra);

  // Base en cero: el tramo vale cero aunque falte la probabilidad de más abajo.
  const navegacion =
    visitas === 0
      ? 0
      : pCheckout !== null && pCompra !== null
        ? visitas * ptsAgregado * pCheckout * pCompra
        : null;
  const carrito =
    agregados === 0 ? 0 : pCompra !== null ? agregados * ptsCheckout * pCompra : null;
  const checkout = checkouts === 0 ? 0 : checkouts * ptsCompra;

  const faltaP = (necesita: (number | null)[], campos: string[]) =>
    necesita.some((p) => p === null) ? campos : [];

  return [
    armar(
      "funnel_navegacion",
      "Fuga por navegación",
      "Visitas que se van antes de agregar al carrito, valorizadas con las probabilidades del propio negocio de llegar al checkout y de comprar.",
      navegacion,
      faltaP([pCheckout, pCompra], ["agregados_carrito", "checkouts_iniciados"]),
    ),
    armar(
      "funnel_carrito",
      "Fuga por carrito",
      "Carritos armados que nunca llegan al checkout, valorizados con la probabilidad de compra del propio negocio.",
      carrito,
      faltaP([pCompra], ["checkouts_iniciados"]),
    ),
    armar(
      "funnel_checkout",
      "Fuga por checkout",
      "Checkouts iniciados que no terminan en compra.",
      checkout,
      [],
    ),
  ];
}
