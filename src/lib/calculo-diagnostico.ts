/**
 * Capa de cálculo del diagnóstico. Aritmética pura: sin llamadas externas.
 * Todos los parámetros salen de la tabla `configuracion`; nunca hay valores fijos acá.
 */

import type { DatosDiagnostico } from "./diagnostico-form";
import { DECIMALES_TASA, ratioPesos, redondear, restarPesos, sumarDecimal } from "./dinero";
import {
  CANALES,
  CAMPOS_PCT_CANAL,
  canalPrincipal,
  canalesDeclarados,
  canalesSuperan100,
  coberturaCanales,
  comisionEfectivaCanal,
  comisionPlataformaDe,
  claveComisionPlataforma,
  estadoCanal,
  hayCanalesDeclarados,
  numeroCanal,
  pctCanal,
  type CanalId,
  COMISIONES_MARKETPLACE_DEFECTO,
  comisionEnEscalaSospechosa,
  type CargoFijoDisponible,
  type ComisionMarketplace,
  type EstadoCanal,
} from "./canales";
import {
  evaluarContradiccion,
  rangoDeclarado,
  type Contradiccion,
} from "./contradiccion";
import {
  evaluarFunnel,
  tramosFunnel,
  MEJORAS_FUNNEL_DEFECTO,
  type FunnelDerivado,
} from "./funnel";

export { comisionEnEscalaSospechosa, COMISIONES_MARKETPLACE_DEFECTO, claveComisionPlataforma, comisionPlataformaDe, canalesSuperan100, coberturaCanales, canalPrincipal, estadoCanal, comisionEfectivaCanal };
export type { CanalId } from "./canales";
export { evaluarFunnel, tramosFunnel, MEJORAS_FUNNEL_DEFECTO };
export { evaluarContradiccion, rangoDeclarado };
export type { Contradiccion } from "./contradiccion";
export type { FunnelDerivado } from "./funnel";

// ---------------------------------------------------------------- configuración

export type TramoFatiga = { hasta: number | null; factor: number };
export type Umbral = { verde: number; rojo: number };
/** Umbral de conversión por tramo de ticket promedio. `hasta: null` = tramo final. */
export type TramoCr = { hasta: number | null; verde: number; rojo: number };

export type ConfiguracionCalculo = {
  reserva_default?: number;
  comision_plataforma?: Record<string, number>;
  comision_pasarela?: Record<string, number>;
  comision_marketplace?: Record<string, ComisionMarketplace>;
  umbrales_funnel_web?: Record<string, Umbral>;
  umbrales_cr_por_ticket?: TramoCr[];
  umbrales_creativos?: Record<string, Umbral>;
  factor_fatiga?: TramoFatiga[];
  delta_medicion?: Umbral;
  recuperacion_carrito_esperada?: number;
  tope_fuga_individual?: number;
  tope_fuga_total?: number;
  /** Mejoras objetivo del funnel, en PUNTOS PORCENTUALES. */
  mejora_agregado_pts?: number;
  mejora_checkout_pts?: number;
  mejora_compra_pts?: number;
  /** Umbrales de la regla de contradicción del margen declarado, en tasa. */
  umbral_contradiccion_critico?: number;
  umbral_contradiccion_validacion?: number;
};


/** Arma el objeto de configuración a partir de las filas crudas de la tabla. */
export function armarConfiguracion(
  filas: { clave: string; valor: unknown }[],
): ConfiguracionCalculo {
  const mapa: Record<string, unknown> = {};
  for (const f of filas) mapa[f.clave] = f.valor;
  return mapa as ConfiguracionCalculo;
}

// ---------------------------------------------------------------- tipos de salida

export type EstadoBloque = "verde" | "amarillo" | "rojo" | "sin_datos";

export type Derivados = {
  delta_medicion: number | null;
  margen_contribucion: number | null;
  envio_neto_vendedor: number | null;
  componente_envio: number | null;
  comision_plataforma: number | null;
  comision_pasarela: number | null;
  costo_financiacion_efectivo: number | null;
  costo_descuento_efectivo: number | null;
  margenes_producto: (number | null)[];

  pesos_producto: (number | null)[];
  canales: CanalDerivado[];
  cobertura_canales: number;
  canal_principal: CanalId | null;
  margen_muestra: number | null;
  pedidos_mensuales: number | null;
  cr_tienda: number | null;
  cr_umbral_verde: number | null;
  breakeven_roas: number | null;
  cpa_breakeven: number | null;
  reserva: number | null;
  cpa_objetivo: number | null;
  roas_objetivo: number | null;
  mer_actual: number | null;
  /** MER por perímetro: nunca mezcla canales ni plataformas de pauta. */
  mer_tienda_propia: number | null;
  mer_marketplace: number | null;
  /** ROAS de Product Ads: ventas atribuidas sobre inversión en Product Ads. */
  roas_product_ads: number | null;
  /** Inversión publicitaria del negocio: Meta + Google + Product Ads. */
  inversion_publicitaria_total: number | null;
  /** null = no sabemos. false = declaró explícitamente que no invierte. */
  hay_inversion_publicitaria: boolean | null;
  /** Contradicción entre el margen calculado y el margen declarado por el cliente. */
  contradiccion_margen: Contradiccion | null;
  contribucion_marginal: number | null;
  piso_semanal_por_conjunto: number | null;
  conjuntos_sostenibles: number | null;
  piso_mensual_un_conjunto: number | null;
  inversion_actual_mensual: number | null;
  pedidos_semanales: number | null;
  volumen_suficiente: boolean | null;
  /** Cascada del funnel web del canal de tienda propia. */
  funnel: FunnelDerivado;
};


export type Fuga = {
  id: string;
  etiqueta: string;
  tipo: "monto" | "riesgo";
  monto: number | null;
  calculable: boolean;
  faltantes: string[];
  detalle?: string;
  /** true cuando el monto superó el rango razonable y quedó topeado. */
  sospechosa?: boolean;
  /** Confianza del cálculo: "parcial" marca estimaciones sin desglose. */
  confianza?: "alta" | "parcial";
};


export type EstadosBloque = {
  medicion: EstadoBloque;
  economia: EstadoBloque;
  cuenta: EstadoBloque;
  funnel_web: EstadoBloque;
  creativos: EstadoBloque;
};

export type ResultadoCalculo = {
  derivados: Derivados;
  estados_bloque: EstadosBloque;
  fugas: Fuga[];
  oportunidad_total: number;
  oportunidad_conservadora: number;
};

// ---------------------------------------------------------------- helpers

function finito(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Redondea con la política única de `dinero.ts` (media hacia arriba). */
function red(n: number | null | undefined, decimales = 0): number | null {
  return redondear(n, decimales);
}

/** Devuelve los nombres de los campos que faltan (null, vacío o no numérico). */
function faltantes(datos: DatosDiagnostico, campos: (keyof DatosDiagnostico)[]): string[] {
  return campos.filter((c) => {
    const v = datos[c];
    if (typeof v === "string") return v.trim() === "";
    return !finito(v as number);
  }) as string[];
}

function porUmbral(valor: number, u: Umbral, mayorEsMejor: boolean): EstadoBloque {
  if (mayorEsMejor) {
    if (valor >= u.verde) return "verde";
    if (valor < u.rojo) return "rojo";
    return "amarillo";
  }
  if (valor <= u.verde) return "verde";
  if (valor > u.rojo) return "rojo";
  return "amarillo";
}

/**
 * Umbral de conversión de tienda según el tramo de ticket promedio.
 * Sin ticket cargado no se puede evaluar la conversión (devuelve null).
 * `umbrales_funnel_web.cr_tienda` queda como respaldo si la clave nueva no existe.
 */
export function umbralCr(cfg: ConfiguracionCalculo, ticket: number | null): Umbral | null {
  if (!finito(ticket) || ticket <= 0) return null;
  const tramos = cfg.umbrales_cr_por_ticket;
  if (Array.isArray(tramos) && tramos.length > 0) {
    const ordenados = [...tramos].sort(
      (a, b) => (a.hasta ?? Number.POSITIVE_INFINITY) - (b.hasta ?? Number.POSITIVE_INFINITY),
    );
    const tramo = ordenados.find((t) => t.hasta === null || ticket <= t.hasta) ?? ordenados.at(-1)!;
    if (finito(tramo.verde) && finito(tramo.rojo)) return { verde: tramo.verde, rojo: tramo.rojo };
  }
  const respaldo = cfg.umbrales_funnel_web?.["cr_tienda"];
  return respaldo && finito(respaldo.verde) && finito(respaldo.rojo) ? respaldo : null;
}

/**
 * Lectura textual del presupuesto. Si el negocio no tiene volumen de compras
 * suficiente, el diagnóstico no es de subinversión sino de falta de señal.
 */
export function lecturaPresupuesto(d: Derivados): string | null {
  if (d.volumen_suficiente === false) {
    return "El volumen de compras del negocio no alcanza para que un conjunto optimizado por compra salga del aprendizaje, invierta lo que invierta. La salida es consolidar en un solo conjunto y optimizar por un evento intermedio (agregar al carrito o iniciar checkout) hasta juntar señal.";
  }
  const piso = d.piso_mensual_un_conjunto;
  const actual = d.inversion_actual_mensual;
  if (typeof piso !== "number" || typeof actual !== "number") return null;
  if (actual < piso) {
    return "Subinversión estructural: el presupuesto está por debajo del piso que necesita un solo conjunto para aprender. Hay que consolidar conjuntos o subir el presupuesto.";
  }
  return "El presupuesto alcanza el piso que necesita un conjunto para aprender. El problema no es de plata, es de estructura de cuenta o de creativo.";
}



// ---------------------------------------------------------------- productos

export type ProductoCargado = {
  indice: number;
  nombre: string;
  costo: number;
  precio: number;
  margen: number;
};

/** Devuelve los productos que tienen costo y precio válidos cargados. */
export function productosCargados(d: DatosDiagnostico) {
  const crudos = [
    { indice: 1, nombre: d.producto_1_nombre, costo: d.producto_1_costo, precio: d.producto_1_precio, pct: d.producto_1_pct_facturacion },
    { indice: 2, nombre: d.producto_2_nombre, costo: d.producto_2_costo, precio: d.producto_2_precio, pct: d.producto_2_pct_facturacion },
    { indice: 3, nombre: d.producto_3_nombre, costo: d.producto_3_costo, precio: d.producto_3_precio, pct: d.producto_3_pct_facturacion },
  ];
  return crudos.filter((p) => finito(p.costo) && finito(p.precio) && (p.precio as number) > 0) as {
    indice: number;
    nombre: string;
    costo: number;
    precio: number;
    pct: number | null;
  }[];
}

/**
 * Envío neto que efectivamente pone el vendedor por pedido.
 * Prioridad: bruto menos lo cobrado al comprador. Si sólo hay bruto cargado
 * no se asume cero cobrado: el neto queda en null hasta que se cargue el importe.
 * El campo legado `costo_envio_promedio` se interpreta como neto.
 */
export function envioNetoVendedor(d: DatosDiagnostico): number | null {
  const bruto = finito(d.envio_bruto) ? d.envio_bruto : null;
  const cobrado = finito(d.envio_cobrado_comprador) ? d.envio_cobrado_comprador : null;
  if (bruto !== null) {
    if (cobrado === null) return null;
    return restarPesos(bruto, cobrado);
  }
  if (cobrado !== null && finito(d.costo_envio_promedio)) {
    return restarPesos(d.costo_envio_promedio, cobrado);
  }
  return finito(d.costo_envio_promedio) ? d.costo_envio_promedio : null;
}

/** true cuando hay bruto cargado pero falta el importe que paga el comprador. */
export function faltaEnvioCobrado(d: DatosDiagnostico): boolean {
  return finito(d.envio_bruto) && !finito(d.envio_cobrado_comprador);
}

/**
 * Componente ponderado de costo variable (financiación o descuento).
 * Cero y ausente son distintos de "cargado a medias":
 *  - los dos ausentes: el componente vale cero y el margen se calcula normal;
 *  - uno cargado sin el otro: no se calcula y se pide el campo faltante;
 *  - valores negativos: no se calcula (el formulario ya los rechaza).
 */
function componentePonderado(
  pct: number | null | undefined,
  costo: number | null | undefined,
  nombrePct: string,
  nombreCosto: string,
): { valor: number | null; faltan: string[] } {
  const p = finito(pct) ? pct : null;
  const c = finito(costo) ? costo : null;
  if (p === null && c === null) return { valor: 0, faltan: [] };
  if (p === null) return { valor: null, faltan: [nombrePct] };
  if (c === null) return { valor: null, faltan: [nombreCosto] };
  if (p < 0) return { valor: null, faltan: [nombrePct] };
  if (c < 0) return { valor: null, faltan: [nombreCosto] };
  return { valor: (p / 100) * (c / 100), faltan: [] };
}

/**
 * Vocabulario de montos:
 *  - bruto: precio de lista, antes de cualquier deducción;
 *  - neto de descuento: ingreso ya con los descuentos comerciales aplicados;
 *  - neto de financiación: ingreso después de que el procesador retuvo el costo
 *    de las cuotas.
 * Los dos indicadores son independientes. El legado `base_montos = "neto"` se
 * lee como neto de descuento y bruto de financiación.
 */
export function montosNetosDeDescuento(d: DatosDiagnostico): boolean {
  // El legado gana: los diagnósticos guardados con "neto" siguen leyéndose así.
  if (d.base_montos === "neto") return true;
  return d.montos_netos_de_descuento === true;
}

export function montosNetosDeFinanciacion(d: DatosDiagnostico): boolean {
  return d.montos_netos_de_financiacion === true;
}

/** Costo efectivo de la financiación en cuotas, ponderado por su participación en las ventas. */
export function costoFinanciacion(d: DatosDiagnostico) {
  if (montosNetosDeFinanciacion(d)) return { valor: 0, faltan: [], aplicado: false };
  const r = componentePonderado(
    d.financiacion_pct_ventas,
    d.financiacion_costo_pct,
    "financiacion_pct_ventas",
    "financiacion_costo_pct",
  );
  return { ...r, aplicado: true };
}

/**
 * Costo efectivo del descuento (transferencia y similares).
 * Si los montos ya vienen netos de descuento no se resta: volver a restarlo
 * sería contarlo dos veces.
 */
export function costoDescuento(d: DatosDiagnostico) {
  if (montosNetosDeDescuento(d)) return { valor: 0, faltan: [], aplicado: false };
  const r = componentePonderado(
    d.descuento_pct_ventas,
    d.descuento_pct,
    "descuento_pct_ventas",
    "descuento_pct",
  );
  return { ...r, aplicado: true };
}

/** true cuando la suma de participaciones declaradas supera el 100%. */
export function participacionesSuperan100(d: DatosDiagnostico): boolean {
  const a = finito(d.financiacion_pct_ventas) ? d.financiacion_pct_ventas : 0;
  const b = finito(d.descuento_pct_ventas) ? d.descuento_pct_ventas : 0;
  return a + b > 100;
}

/**
 * Participaciones imposibles: si cuotas y descuento son excluyentes, no pueden
 * cubrir juntas más del 100% de las ventas. En ese caso el margen no se calcula.
 */
export function participacionesIncompatibles(d: DatosDiagnostico): boolean {
  const relacion = d.relacion_financiacion_descuento ?? "excluyentes";
  return relacion === "excluyentes" && participacionesSuperan100(d);
}

/** Campos que impiden calcular el margen de contribución. */
export function faltantesMargen(d: DatosDiagnostico): string[] {
  const faltan: string[] = [];
  if (envioNetoVendedor(d) === null) faltan.push("envio_neto_vendedor");
  if (!finito(d.ticket_promedio) || (d.ticket_promedio as number) <= 0) {
    faltan.push("ticket_promedio");
  }
  faltan.push(...costoFinanciacion(d).faltan);
  faltan.push(...costoDescuento(d).faltan);
  if (canalesSuperan100(d)) {
    for (const c of Object.values(CAMPOS_PCT_CANAL)) if (!faltan.includes(c)) faltan.push(c);
  }
  if (participacionesIncompatibles(d)) {
    for (const c of ["financiacion_pct_ventas", "descuento_pct_ventas"]) {
      if (!faltan.includes(c)) faltan.push(c);
    }
  }
  return faltan;
}



// ---------------------------------------------------------------- inversión publicitaria

/**
 * Inversión en Product Ads de Mercado Libre.
 * Tres estados distintos: positivo (se evalúa), cero explícito (el cliente
 * declaró que no invierte) y null (no sabemos).
 */
export function inversionProductAds(d: DatosDiagnostico): number | null {
  const delCanal = numeroCanal(d, "mercado_libre", "inversion");
  if (delCanal !== null) return delCanal;
  return finito(d.ml_inversion_product_ads) ? d.ml_inversion_product_ads : null;
}

/** Inversión en pauta de tienda propia: Meta más Google. */
export function inversionMetaGoogle(d: DatosDiagnostico): number | null {
  if (!finito(d.inversion_meta) && !finito(d.inversion_google)) return null;
  return (finito(d.inversion_meta) ? d.inversion_meta : 0) +
    (finito(d.inversion_google) ? d.inversion_google : 0);
}

/**
 * Inversión publicitaria del negocio: Meta más Google más Product Ads.
 * Sin ningún dato cargado devuelve null: no sabemos, no afirmamos.
 */
export function inversionPublicitariaTotal(d: DatosDiagnostico): number | null {
  const propia = numeroCanal(d, "tienda_propia", "inversion") ?? inversionMetaGoogle(d);
  const ads = inversionProductAds(d);
  if (propia === null && ads === null) return null;
  return (propia ?? 0) + (ads ?? 0);
}

/**
 * ¿El negocio invierte en publicidad? Considera los tres frentes.
 * null cuando no hay ningún dato cargado; false sólo con ceros explícitos.
 */
export function hayInversionPublicitaria(d: DatosDiagnostico): boolean | null {
  const total = inversionPublicitariaTotal(d);
  if (total === null) return null;
  return total > 0;
}

/** Inversión publicitaria del perímetro de un canal. */
export function inversionCanal(d: DatosDiagnostico, canal: CanalId): number | null {
  if (canal === "mercado_libre") return inversionProductAds(d);
  return numeroCanal(d, canal, "inversion") ?? inversionMetaGoogle(d);
}

/** Facturación del canal: la declarada o, en su defecto, la derivada del mix. */
export function facturacionCanal(d: DatosDiagnostico, canal: CanalId): number | null {
  const propia = numeroCanal(d, canal, "facturacion");
  if (propia !== null) return propia;
  const pct = pctCanal(d, canal);
  if (pct !== null && finito(d.facturacion_mensual) && d.facturacion_mensual > 0) {
    return (d.facturacion_mensual * pct) / 100;
  }
  return null;
}

// ---------------------------------------------------------------- canales

export type CanalDerivado = {
  id: CanalId;
  estado: EstadoCanal;
  pct: number | null;
  ticket: number | null;
  facturacion: number | null;
  inversion: number | null;
  envio_neto: number | null;
  componente_envio: number | null;
  comision_efectiva: number | null;
  comision_origen: string | null;
  comision_provisional: boolean;
  /** Vigencia de la regla de comisión, si la configuración la declara. */
  comision_vigencia: string | null;
  /** Qué respalda a la comisión: liquidación, declaración del cliente o benchmark. */
  comision_evidencia: "liquidacion_cliente" | "declarado_cliente" | "benchmark_sin_verificar";
  cargo_fijo_aplicado: boolean;
  /** Cargo fijo conocido de la regla, aplicado o no. Si no está verificado, no entra al cálculo. */
  cargo_fijo_disponible: CargoFijoDisponible | null;
  /** true si la comisión verificada parece cargada en tasa (0,1694) y no en porcentaje (16,94). */
  comision_escala_sospechosa: boolean;
  /** Comisión efectiva usada en cada producto: puede variar si el cargo depende del precio. */
  comisiones_producto: (number | null)[];
  costo_financiacion_efectivo: number | null;
  costo_descuento_efectivo: number | null;
  margen: number | null;
  margenes_producto: (number | null)[];
  mer: number | null;
  /** Facturación del canal por su margen, ANTES de descontar publicidad. */
  contribucion_antes_publicidad: number | null;
  /** Inversión publicitaria del perímetro del canal. */
  inversion_publicitaria: number | null;
  /** Contribución antes de publicidad menos la inversión del canal. */
  resultado_despues_publicidad: number | null;
  /** ROAS de la pauta del canal: ventas atribuidas sobre inversión. */
  roas_pauta: number | null;
  breakeven_roas: number | null;
  faltantes: string[];
  /** Margen sin redondear, para ponderar el mix sin arrastrar error. */
  margen_exacto: number | null;
  margenes_producto_exactos: (number | null)[];
  pesos_producto: (number | null)[];
};

/**
 * Costo variable ponderado propio del canal. Si el canal no declara ninguno de
 * los dos campos, hereda el valor compartido del diagnóstico.
 */
function componenteCanal(
  d: DatosDiagnostico,
  canal: CanalId,
  base: { valor: number | null; faltan: string[] },
  sufijoPct: string,
  sufijoCosto: string,
): { valor: number | null; faltan: string[] } {
  const pct = numeroCanal(d, canal, sufijoPct);
  const costo = numeroCanal(d, canal, sufijoCosto);
  if (pct === null && costo === null) return base;
  const prefijo = `${canal === "tienda_propia" ? "canal_tienda" : "canal_ml"}_`;
  if (pct === null) return { valor: null, faltan: [`${prefijo}${sufijoPct}`] };
  if (costo === null) return { valor: null, faltan: [`${prefijo}${sufijoCosto}`] };
  if (pct < 0 || costo < 0) return { valor: null, faltan: [`${prefijo}${sufijoPct}`] };
  return { valor: (pct / 100) * (costo / 100), faltan: [] };
}

/** Margen de contribución de un canal, ponderado por los productos más vendidos. */
function margenDeCanal(
  d: DatosDiagnostico,
  cfg: ConfiguracionCalculo,
  canal: CanalId,
  cargados: ReturnType<typeof productosCargados>,
): CanalDerivado {
  const estado = estadoCanal(d, canal);
  const pct = pctCanal(d, canal);
  const ticket =
    numeroCanal(d, canal, "ticket") ??
    (finito(d.ticket_promedio) && d.ticket_promedio > 0 ? d.ticket_promedio : null);
  const envioNeto = numeroCanal(d, canal, "envio_neto") ?? envioNetoVendedor(d);
  const facturacion = facturacionCanal(d, canal);
  const inversion = inversionCanal(d, canal);

  const faltan: string[] = [];
  if (ticket === null || ticket <= 0) faltan.push("ticket_promedio");
  if (envioNeto === null) faltan.push("envio_neto_vendedor");

  // El envío se paga por pedido, no por unidad: se divide por el ticket del canal.
  const componenteEnvio =
    envioNeto !== null && ticket !== null && ticket > 0 ? ratioPesos(envioNeto, ticket) : null;

  const comision = comisionEfectivaCanal(d, cfg, canal, ticket);
  faltan.push(...comision.faltantes);

  const fin = componenteCanal(
    d,
    canal,
    costoFinanciacion(d),
    "financiacion_pct_ventas",
    "financiacion_costo_pct",
  );
  const desc = componenteCanal(d, canal, costoDescuento(d), "descuento_pct_ventas", "descuento_pct");
  faltan.push(...fin.faltan, ...desc.faltan);
  if (participacionesIncompatibles(d)) {
    for (const c of ["financiacion_pct_ventas", "descuento_pct_ventas"]) {
      if (!faltan.includes(c)) faltan.push(c);
    }
  }

  const margenesExactos: (number | null)[] = [null, null, null];
  const comisionesProducto: (number | null)[] = [null, null, null];
  const pesos: (number | null)[] = [null, null, null];
  const calculables: { indice: number; margen: number; pct: number | null }[] = [];

  if (
    comision.valor !== null &&
    componenteEnvio !== null &&
    fin.valor !== null &&
    desc.valor !== null &&
    !participacionesIncompatibles(d)
  ) {
    for (const p of cargados) {
      const costoRelativo = ratioPesos(p.costo, p.precio);
      if (costoRelativo === null) continue;
      // El cargo fijo puede depender del precio del producto (base por unidad o
      // umbral comparado contra el precio): se resuelve la comisión por producto.
      const comisionProducto = comisionEfectivaCanal(d, cfg, canal, ticket, p.precio);
      const tasaComision = comisionProducto.valor ?? comision.valor;
      if (tasaComision === null) continue;
      comisionesProducto[p.indice - 1] = red(tasaComision, DECIMALES_TASA);
      const m = sumarDecimal(
        1,
        -costoRelativo,
        -tasaComision,
        -componenteEnvio,
        -fin.valor,
        -desc.valor,
      );

      if (!finito(m)) continue;
      margenesExactos[p.indice - 1] = m;
      calculables.push({
        indice: p.indice,
        margen: m,
        pct: finito(p.pct) && (p.pct as number) > 0 ? (p.pct as number) : null,
      });
    }
  }

  let margenExacto: number | null = null;
  if (calculables.length === 1) {
    const uno = calculables[0]!;
    margenExacto = uno.margen;
    pesos[uno.indice - 1] = 1;
  } else if (calculables.length > 1) {
    // Peso = participación de cada producto en la facturación del catálogo cargado.
    const conPct = calculables.filter((c) => c.pct !== null);
    const usados = conPct.length > 0 ? conPct : calculables;
    const sumaPesos = usados.reduce((a, c) => a + (conPct.length > 0 ? (c.pct as number) : 1), 0);
    if (sumaPesos > 0) {
      let acumulado = 0;
      for (const c of usados) {
        const peso = (conPct.length > 0 ? (c.pct as number) : 1) / sumaPesos;
        pesos[c.indice - 1] = red(peso, 4);
        acumulado += c.margen * peso;
      }
      margenExacto = finito(acumulado) ? acumulado : null;
    }
  }

  const margenPositivo = margenExacto !== null && margenExacto > 0 ? margenExacto : null;
  // MER por perímetro: la facturación del canal sobre la inversión del canal.
  const mer =
    facturacion !== null && inversion !== null && inversion > 0 ? facturacion / inversion : null;

  // Tres números separados que nunca se mezclan. La inversión publicitaria se
  // resta una sola vez, acá: NO entra en el margen de contribución.
  const contribucionAntes =
    facturacion !== null && margenExacto !== null ? facturacion * margenExacto : null;
  const resultadoDespues =
    contribucionAntes !== null ? contribucionAntes - (inversion ?? 0) : null;

  // ROAS de la pauta: sólo lo atribuido. Sin ventas atribuidas queda sin datos,
  // aunque el MER del canal sí se calcule.
  const ventasAtribuidas =
    canal === "mercado_libre" && finito(d.ml_ventas_product_ads) ? d.ml_ventas_product_ads : null;
  const roasPauta =
    ventasAtribuidas !== null && inversion !== null && inversion > 0
      ? ventasAtribuidas / inversion
      : null;

  return {
    id: canal,
    estado,
    pct,
    ticket,
    facturacion,
    inversion,
    envio_neto: envioNeto,
    componente_envio: red(componenteEnvio, DECIMALES_TASA),
    comision_efectiva: comision.valor,
    comision_origen: comision.origen,
    comision_provisional: comision.provisional,
    comision_vigencia: comision.vigencia,
    comision_evidencia: comision.evidencia,
    cargo_fijo_aplicado: comision.cargo_fijo_aplicado,
    cargo_fijo_disponible: comision.cargo_fijo_disponible,
    comision_escala_sospechosa: comision.escala_sospechosa,
    comisiones_producto: comisionesProducto,
    costo_financiacion_efectivo: red(fin.valor, DECIMALES_TASA),
    costo_descuento_efectivo: red(desc.valor, DECIMALES_TASA),
    margen: red(margenExacto, DECIMALES_TASA),
    margenes_producto: margenesExactos.map((m) => red(m, DECIMALES_TASA)),
    mer: red(mer, 2),
    contribucion_antes_publicidad: red(contribucionAntes, 0),
    inversion_publicitaria: inversion,
    resultado_despues_publicidad: red(resultadoDespues, 0),
    roas_pauta: red(roasPauta, 2),
    breakeven_roas: margenPositivo !== null ? red(1 / margenPositivo, DECIMALES_TASA) : null,
    faltantes: faltan,
    margen_exacto: margenExacto,
    margenes_producto_exactos: margenesExactos,
    pesos_producto: pesos,
  };
}

// ---------------------------------------------------------------- cálculo

export function calcularDiagnostico(
  datos: DatosDiagnostico,
  cfg: ConfiguracionCalculo,
): ResultadoCalculo {
  const d = datos;

  // --- Delta de medición: sólo si hay Pixel midiendo compras y facturación real cargada.
  // Una tienda que no pautea no tiene Pixel: eso es falta de dato, no medición rota.
  let delta: number | null = null;
  if (
    finito(d.facturacion_mensual) &&
    d.facturacion_mensual > 0 &&
    finito(d.facturacion_pixel) &&
    d.facturacion_pixel > 0
  ) {
    delta = Math.abs(d.facturacion_pixel - d.facturacion_mensual) / d.facturacion_mensual;
  }


  // --- Margen por canal. Cada canal se calcula con sus propias comisiones,
  // su propio ticket y su propio envío: no hay contaminación entre canales.
  const cargados = productosCargados(d);
  const canalesCalc: CanalDerivado[] = CANALES.map((c) => margenDeCanal(d, cfg, c.id, cargados));
  const porId = (id: CanalId) => canalesCalc.find((c) => c.id === id)!;

  const cobertura = coberturaCanales(d);
  const hayCanales = hayCanalesDeclarados(d);
  const principal = canalPrincipal(d);
  const canalMuestra = principal !== null ? porId(principal) : porId("tienda_propia");

  let margen: number | null = null;
  let margenMuestra: number | null = null;

  if (!hayCanales) {
    // Diagnóstico sin mix declarado: se mantiene el cálculo de canal único
    // (tienda propia con los datos compartidos), sin asumir que factura el 100%.
    margen = porId("tienda_propia").margen_exacto;
    margenMuestra = margen;
  } else if (!canalesSuperan100(d) && cobertura > 0) {
    const contribuyentes = canalesDeclarados(d)
      .filter((c) => c.pct > 0)
      .map((c) => ({ pct: c.pct, canal: porId(c.id) }));
    const todosCalculables = contribuyentes.every((c) => c.canal.margen_exacto !== null);
    if (todosCalculables && contribuyentes.length > 0) {
      let acumulado = 0;
      for (const c of contribuyentes) acumulado += (c.canal.margen_exacto as number) * (c.pct / 100);
      // Margen de la muestra: sobre la cobertura conocida, sin reescalar el mix.
      margenMuestra = finito(acumulado) ? acumulado / (cobertura / 100) : null;
      // El margen total sólo existe si el mix cubre el 100% de la facturación.
      margen = cobertura >= 100 ? margenMuestra : null;
    }
  }

  const margenesProducto = canalMuestra.margenes_producto_exactos.map((m) => red(m, 4));
  const pesosProducto = canalMuestra.pesos_producto;
  const componenteEnvio = canalMuestra.componente_envio;
  // Garantía 5: las comisiones de la tienda propia no se informan si no participa.
  const tiendaParticipa = !hayCanales || estadoCanal(d, "tienda_propia") === "declarado";
  const comPlataforma = tiendaParticipa ? comisionPlataformaDe(cfg, d) : null;
  const comPasarela =
    tiendaParticipa && finito(cfg.comision_pasarela?.[d.pasarela])
      ? (cfg.comision_pasarela![d.pasarela] as number)
      : null;
  const finComp = costoFinanciacion(d);
  const descComp = costoDescuento(d);

  const margenPositivo = margen !== null && margen > 0 ? margen : null;

  const breakevenRoas = margenPositivo !== null ? 1 / margenPositivo : null;
  const cpaBreakeven =
    margenPositivo !== null && finito(d.ticket_promedio) ? d.ticket_promedio * margenPositivo : null;

  const reserva = finito(cfg.reserva_default) ? (cfg.reserva_default as number) : null;
  const cpaObjetivo =
    cpaBreakeven !== null && reserva !== null && reserva < 1 ? cpaBreakeven * (1 - reserva) : null;
  const roasObjetivo =
    cpaObjetivo !== null && cpaObjetivo > 0 && finito(d.ticket_promedio)
      ? d.ticket_promedio / cpaObjetivo
      : null;

  // --- Pedidos y conversión (ya no se cargan: se calculan)
  const pedidos =
    finito(d.facturacion_mensual) && finito(d.ticket_promedio) && d.ticket_promedio > 0
      ? d.facturacion_mensual / d.ticket_promedio
      : null;
  const crTienda =
    pedidos !== null && finito(d.visitas_mensuales) && d.visitas_mensuales > 0
      ? pedidos / d.visitas_mensuales
      : null;

  const inversionAds =
    finito(d.inversion_meta) || finito(d.inversion_google)
      ? (finito(d.inversion_meta) ? d.inversion_meta : 0) +
        (finito(d.inversion_google) ? d.inversion_google : 0)
      : null;

  const mer =
    finito(d.facturacion_mensual) && inversionAds !== null && inversionAds > 0
      ? d.facturacion_mensual / inversionAds
      : null;

  const contribucionMarginal =
    margen !== null && finito(d.facturacion_mensual) && inversionAds !== null
      ? d.facturacion_mensual * margen - inversionAds
      : null;

  // --- Presupuesto (modo A: presupuesto observado; modo B: gasto declarado)
  const presupuestoDiario = finito(d.presupuesto_diario)
    ? d.presupuesto_diario
    : finito(d.gasto_diario)
      ? d.gasto_diario
      : null;

  const pisoSemanalPorConjunto = cpaObjetivo !== null ? 50 * cpaObjetivo : null;
  const conjuntosSostenibles =
    pisoSemanalPorConjunto !== null && pisoSemanalPorConjunto > 0 && presupuestoDiario !== null
      ? (presupuestoDiario * 7) / pisoSemanalPorConjunto
      : null;
  const pisoMensualUnConjunto = cpaObjetivo !== null ? 50 * cpaObjetivo * 4.3 : null;
  const inversionActualMensual = presupuestoDiario !== null ? presupuestoDiario * 30 : null;

  // --- Volumen del negocio: ¿alcanza para sostener un conjunto optimizado por compra?
  const pedidosSemanales = pedidos !== null ? pedidos / 4.3 : null;
  const volumenSuficiente = pedidosSemanales !== null ? pedidosSemanales >= 50 : null;

  // --- Umbral de conversión escalado por tramo de ticket promedio
  const uCr = umbralCr(cfg, d.ticket_promedio);

  // --- Cascada del funnel: etapas del mismo canal y del mismo período.
  const funnel = evaluarFunnel(d, cfg);

  const derivados: Derivados = {
    delta_medicion: red(delta, 4),
    margen_contribucion: red(margen, DECIMALES_TASA),
    envio_neto_vendedor: red(canalMuestra.envio_neto, 0),
    componente_envio: red(componenteEnvio, DECIMALES_TASA),
    comision_plataforma: comPlataforma,
    comision_pasarela: comPasarela,
    costo_financiacion_efectivo: red(finComp.valor, DECIMALES_TASA),
    costo_descuento_efectivo: red(descComp.valor, DECIMALES_TASA),

    canales: canalesCalc,
    cobertura_canales: cobertura,
    canal_principal: principal,
    margen_muestra: red(margenMuestra, DECIMALES_TASA),
    margenes_producto: margenesProducto,
    pesos_producto: pesosProducto,
    pedidos_mensuales: red(pedidos, 0),
    cr_tienda: red(crTienda, 4),
    cr_umbral_verde: uCr ? uCr.verde : null,
    breakeven_roas: red(breakevenRoas, DECIMALES_TASA),
    cpa_breakeven: red(cpaBreakeven, 0),

    reserva,
    cpa_objetivo: red(cpaObjetivo, 0),
    roas_objetivo: red(roasObjetivo, 2),
    mer_actual: red(mer, 2),
    contribucion_marginal: red(contribucionMarginal, 0),
    piso_semanal_por_conjunto: red(pisoSemanalPorConjunto, 0),
    conjuntos_sostenibles: red(conjuntosSostenibles, 1),
    piso_mensual_un_conjunto: red(pisoMensualUnConjunto, 0),
    inversion_actual_mensual: red(inversionActualMensual, 0),
    pedidos_semanales: red(pedidosSemanales, 1),
    volumen_suficiente: volumenSuficiente,
    funnel,
  };


  // --- Estados por bloque
  const uDelta = cfg.delta_medicion;
  const estadoMedicion: EstadoBloque =
    delta !== null && uDelta ? porUmbral(delta, uDelta, false) : "sin_datos";

  let estadoEconomia: EstadoBloque = "sin_datos";
  if (mer !== null && breakevenRoas !== null && reserva !== null && reserva < 1) {
    const objetivo = breakevenRoas / (1 - reserva);
    if (mer >= objetivo) estadoEconomia = "verde";
    else if (mer < breakevenRoas) estadoEconomia = "rojo";
    else estadoEconomia = "amarillo";
  }

  let estadoCuenta: EstadoBloque = "sin_datos";
  if (
    presupuestoDiario !== null &&
    finito(d.conjuntos_activos) &&
    d.conjuntos_activos > 0 &&
    pisoSemanalPorConjunto !== null &&
    pisoSemanalPorConjunto > 0
  ) {
    const real = (presupuestoDiario * 7) / d.conjuntos_activos;
    const ratio = real / pisoSemanalPorConjunto;
    estadoCuenta = ratio >= 1 ? "verde" : ratio >= 0.6 ? "amarillo" : "rojo";
  }

  // uCr ya viene resuelto por tramo de ticket
  // Si la cadena del funnel no cierra, los datos web no son utilizables.
  const estadoFunnel: EstadoBloque =
    funnel.estado === "error"
      ? "sin_datos"
      : crTienda !== null && uCr
        ? porUmbral(crTienda, uCr, true)
        : "sin_datos";

  // Contenido: cualitativo, no se semaforiza con umbrales numéricos.
  const camposContenido = [
    d.frecuencia_creativos,
    d.formato_creativos,
    d.angulo_que_funciona,
    d.dolor_cliente,
  ].filter((t) => typeof t === "string" && t.trim() !== "").length;
  const estadoCreativos: EstadoBloque =
    camposContenido === 0 ? "sin_datos" : camposContenido >= 3 ? "verde" : "amarillo";

  const estados_bloque: EstadosBloque = {
    medicion: estadoMedicion,
    economia: estadoEconomia,
    cuenta: estadoCuenta,
    funnel_web: estadoFunnel,
    creativos: estadoCreativos,
  };

  // --- Fugas
  const fugas: Fuga[] = [];

  // Cascada del funnel. Reemplaza a la vieja fuga por conversión y a la de
  // carritos abandonados: aquellas dos se solapaban y contaban la misma gente
  // dos veces. Los tres tramos de la cascada son disjuntos.
  for (const t of tramosFunnel(funnel, cfg, margen)) {
    const faltan = [...t.faltantes];
    if (margen === null && faltan.includes("margen_contribucion")) {
      for (const f of faltantesMargen(datos)) if (!faltan.includes(f)) faltan.push(f);
    }
    if (t.calculable && t.monto === 0) continue;
    fugas.push({
      id: t.id,
      etiqueta: t.etiqueta,
      tipo: "monto",
      monto: t.monto,
      calculable: t.calculable,
      faltantes: faltan,
      detalle: t.detalle,
      confianza: t.confianza,
    });
  }


  // Gasto no rentable: sin inversión publicitaria la fuga no existe (ni como no calculable).
  if (inversionAds !== null && inversionAds > 0) {
    const faltan: string[] = [];
    if (!finito(d.facturacion_mensual) || d.facturacion_mensual <= 0) faltan.push("facturacion_mensual");
    if (breakevenRoas === null) faltan.push("margen_contribucion");
    if (faltan.length > 0 || mer === null) {
      if (mer === null && faltan.length === 0) faltan.push("facturacion_mensual");
      fugas.push({

        id: "gasto_no_rentable",
        etiqueta: "Fuga por gasto no rentable",
        tipo: "monto",
        monto: null,
        calculable: false,
        faltantes: faltan,
      });
    } else if ((mer as number) < (breakevenRoas as number)) {
      const monto = (inversionAds as number) * (1 - (mer as number) / (breakevenRoas as number));
      fugas.push({
        id: "gasto_no_rentable",
        etiqueta: "Fuga por gasto no rentable",
        tipo: "monto",
        monto: Math.max(0, red(monto, 0) ?? 0),
        calculable: true,
        faltantes: [],
      });
    }
  }

  // Sobrefragmentación
  {
    const faltan = faltantes(datos, ["conjuntos_activos"]);
    if (presupuestoDiario === null) faltan.push("presupuesto_diario");
    if (cpaObjetivo === null) faltan.push("cpa_objetivo");
    if (faltan.length > 0) {
      fugas.push({
        id: "sobrefragmentacion",
        etiqueta: "Fuga por sobrefragmentación",
        tipo: "monto",
        monto: null,
        calculable: false,
        faltantes: faltan,
      });
    } else if (
      conjuntosSostenibles !== null &&
      (d.conjuntos_activos as number) > conjuntosSostenibles
    ) {
      const monto =
        (((d.conjuntos_activos as number) - conjuntosSostenibles) * 50 * (cpaObjetivo as number)) /
        4;
      fugas.push({
        id: "sobrefragmentacion",
        etiqueta: "Fuga por sobrefragmentación",
        tipo: "monto",
        monto: Math.max(0, red(monto, 0) ?? 0),
        calculable: true,
        faltantes: [],
      });
    }
  }

  // La vieja fuga por carritos abandonados quedó absorbida por el tramo de
  // carrito de la cascada: no pueden coexistir sin contar dos veces a la misma
  // gente.


  // Medición: hallazgo de riesgo, nunca valorizado en pesos
  if (estadoMedicion === "rojo") {
    fugas.push({
      id: "medicion",
      etiqueta: "Riesgo de medición",
      tipo: "riesgo",
      monto: null,
      calculable: true,
      faltantes: [],
      detalle: "El desvío entre la facturación real y el Pixel invalida cualquier valorización en pesos.",
    });
  }

  // --- Red de seguridad: ninguna fuga puede salirse del rango razonable
  const DETALLE_SOSPECHOSA =
    "El cálculo superó el rango razonable para la facturación de la tienda. El umbral usado puede no aplicar a este tipo de negocio: el monto quedó topeado.";
  const facturacion = finito(d.facturacion_mensual) && d.facturacion_mensual > 0 ? d.facturacion_mensual : null;
  const topeInd = finito(cfg.tope_fuga_individual) ? (cfg.tope_fuga_individual as number) : null;
  const topeTot = finito(cfg.tope_fuga_total) ? (cfg.tope_fuga_total as number) : null;

  if (facturacion !== null && topeInd !== null) {
    const limite = facturacion * topeInd;
    for (const f of fugas) {
      if (f.tipo === "monto" && finito(f.monto) && (f.monto as number) > limite) {
        f.monto = red(limite, 0) ?? 0;
        f.sospechosa = true;
        f.detalle = DETALLE_SOSPECHOSA;
      }
    }
  }

  let total = fugas.reduce(
    (acc, f) => (f.tipo === "monto" && finito(f.monto) ? acc + (f.monto as number) : acc),
    0,
  );

  if (facturacion !== null && topeTot !== null && total > facturacion * topeTot && total > 0) {
    const factor = (facturacion * topeTot) / total;
    for (const f of fugas) {
      if (f.tipo === "monto" && finito(f.monto)) {
        f.monto = red((f.monto as number) * factor, 0) ?? 0;
        f.sospechosa = true;
        f.detalle = DETALLE_SOSPECHOSA;
      }
    }
    total = fugas.reduce(
      (acc, f) => (f.tipo === "monto" && finito(f.monto) ? acc + (f.monto as number) : acc),
      0,
    );
  }


  return {
    derivados,
    estados_bloque,
    fugas,
    oportunidad_total: red(total, 0) ?? 0,
    oportunidad_conservadora: red(total * 0.6, 0) ?? 0,
  };
}
