/**
 * Helpers puros de formato para la pantalla de detalle de diagnóstico.
 *
 * Envuelven `format.ts` con la política de "ausente o no finito se muestra
 * como guión", en vez de como cero o `NaN`, para no confundir un dato que
 * falta con un valor real.
 */

import type { Derivados, EstadosBloque } from "./calculo-diagnostico";
import { estadoCanal, type CanalId } from "./canales";
import type { DatosDiagnostico } from "./diagnostico-form";
import { formatARS, formatNumero, formatPorcentaje } from "./format";

export const GUION = "—";

export function etiqueta(
  lista: readonly { value: string; label: string }[],
  value?: string | null,
): string | null {
  if (!value) return null;
  return lista.find((o) => o.value === value)?.label ?? value;
}

export function pesos(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? formatARS(n) : GUION;
}

export function numero(n: number | null | undefined, decimales = 2): string {
  return typeof n === "number" && Number.isFinite(n) ? formatNumero(n, decimales) : GUION;
}

export function pct(n: number | null | undefined, decimales = 1): string {
  return typeof n === "number" && Number.isFinite(n) ? formatPorcentaje(n * 100, decimales) : GUION;
}

// ---------------------------------------------------------------- faltantes

/**
 * Nombre legible de cada id que el motor puede poner en `Fuga.faltantes`
 * (H-42). Sin entrada, el usuario lee el id crudo ("retencion_recuperacion_pct_actual").
 * Se leen en "Faltan: …" y en "Falta … para realizar este cálculo".
 */
export const ETIQUETAS_CAMPO: Record<string, string> = {
  // Funnel web (src/lib/funnel.ts)
  visitas_mensuales: "visitas mensuales",
  agregados_carrito: "agregados al carrito",
  checkouts_iniciados: "checkouts iniciados",
  facturacion_mensual: "facturación mensual",
  ticket_promedio: "ticket promedio",
  // H-28: el funnel pide la facturación de la tienda, no la del negocio.
  canal_tienda_facturacion: "facturación de la tienda propia",
  margen_contribucion: "margen de contribución",
  // Margen (faltantesMargen, faltantesMargenTotal)
  envio_neto_vendedor: "costo de envío que absorbe el vendedor",
  financiacion_pct_ventas: "% de ventas en cuotas",
  financiacion_costo_pct: "costo de las cuotas",
  descuento_pct_ventas: "% de ventas con descuento",
  descuento_pct: "porcentaje de descuento",
  // H-31: lo que el motor pide en lugar de "margen de contribución" cuando lo
  // retiene la cobertura del catálogo o del mix de canales.
  ...Object.fromEntries(
    [1, 2, 3, 4, 5].flatMap((n) => [
      [`producto_${n}_pct_facturacion`, `% de facturación del producto ${n}`],
      [`producto_${n}_costo`, `costo del producto ${n}`],
      [`producto_${n}_precio`, `precio del producto ${n}`],
    ]),
  ),
  canal_tienda_pct: "% de facturación de la tienda propia",
  canal_ml_pct: "% de facturación de Mercado Libre",
  // Comisiones y costos variables de cada canal (src/lib/canales.ts, margenDeCanal)
  comision_plataforma: "comisión de la plataforma",
  comision_plataforma_negociada: "comisión negociada con la plataforma",
  comision_pasarela: "comisión de la pasarela de pago",
  comision_marketplace: "tipo de publicación en Mercado Libre",
  canal_tienda_financiacion_pct_ventas: "% de ventas en cuotas de la tienda propia",
  canal_tienda_financiacion_costo_pct: "costo de las cuotas de la tienda propia",
  canal_tienda_descuento_pct_ventas: "% de ventas con descuento de la tienda propia",
  canal_tienda_descuento_pct: "porcentaje de descuento de la tienda propia",
  canal_ml_financiacion_pct_ventas: "% de ventas en cuotas de Mercado Libre",
  canal_ml_financiacion_costo_pct: "costo de las cuotas de Mercado Libre",
  canal_ml_descuento_pct_ventas: "% de ventas con descuento de Mercado Libre",
  canal_ml_descuento_pct: "porcentaje de descuento de Mercado Libre",
  // Sobrefragmentación
  conjuntos_activos: "conjuntos activos",
  presupuesto_diario: "presupuesto diario",
  cpa_objetivo: "CPA objetivo",
  // Recuperación de carrito
  retencion_recuperacion_pct_actual: "porcentaje de recuperación de carritos actual",
  recuperacion_carrito_esperada: "recuperación de carrito esperada (configuración)",
  // Recompra
  recompra_compradores_unicos: "compradores únicos",
  recompra_tasa_actual_pct: "tasa de recompra actual",
  recompra_ventana_dias: "ventana de recompra en días",
  recompra_ticket_segunda_compra: "ticket de la segunda compra",
  recompra_tiene_secuencia_postventa: "si tiene secuencia postventa",
  recompra_esperada: "recompra esperada (configuración)",
  // Retenciones por margen
  margen_en_contradiccion: "resolver la contradicción con el margen declarado",
  margen_negativo: "un margen de contribución positivo",
  // Ids de fugas guardadas con versiones anteriores del motor.
  cr_tienda: "tasa de conversión",
  inversion_meta: "inversión en Meta",
  inversion_google: "inversión en Google",
  factor_fatiga: "parámetro de fatiga",
  "umbrales_funnel_web.cr_tienda": "umbral de conversión",
};

export function etiquetaCampo(id: string): string {
  return ETIQUETAS_CAMPO[id] ?? id;
}

// ---------------------------------------------------------------- perímetro

/**
 * Qué muestra la pantalla de detalle según lo que el cliente tiene y usa.
 * Lo que no tiene (canal de venta en "no aplica") no se muestra; lo que no usa
 * para pautar no muestra métricas. Sólo un "no" explícito oculta algo: sin
 * respuesta (los diagnósticos guardados antes de las preguntas) se ve todo,
 * como antes.
 */
export type PerimetroVista = {
  tiendaPropia: boolean;
  mercadoLibre: boolean;
  /** MER tienda propia, en la tarjeta de la tienda de Resumen. */
  pautaTienda: boolean;
  /** Estructura de cuenta de Meta: la píldora de cuenta (conjuntos activos y sostenibles). */
  pautaMeta: boolean;
  /** MER y ROAS de Product Ads, en la tarjeta de Mercado Libre de Resumen. */
  productAds: boolean;
  funnelWeb: boolean;
};

function canalNoAplica(datos: DatosDiagnostico, derivados: Derivados, id: CanalId): boolean {
  const derivado = (derivados.canales ?? []).find((c) => c.id === id);
  return derivado?.estado === "no_aplica" || estadoCanal(datos, id) === "no_aplica";
}

export function perimetroVista(
  datos: DatosDiagnostico | null | undefined,
  derivados: Derivados | null | undefined,
): PerimetroVista {
  const d = datos ?? ({} as DatosDiagnostico);
  const der = derivados ?? ({} as Derivados);
  const tiendaPropia = !canalNoAplica(d, der, "tienda_propia");
  // "No vende en Mercado Libre" también lo saca, aunque el diagnóstico se haya
  // guardado antes de que la respuesta escribiera `canal_ml_no_aplica`. Salvo
  // que el canal esté declarado con porcentaje: entra en el margen y no se esconde.
  const estadoML =
    (der.canales ?? []).find((c) => c.id === "mercado_libre")?.estado ??
    estadoCanal(d, "mercado_libre");
  const mercadoLibre =
    !canalNoAplica(d, der, "mercado_libre") &&
    !(d.vende_mercado_libre === false && estadoML !== "declarado");
  return {
    tiendaPropia,
    mercadoLibre,
    pautaTienda: tiendaPropia && !(d.pauta_meta === false && d.pauta_google === false),
    pautaMeta: d.pauta_meta !== false,
    productAds: mercadoLibre && d.ml_product_ads !== false,
    funnelWeb: tiendaPropia && der.funnel?.estado !== "no_aplica",
  };
}

/** Píldoras del semáforo que aplican al perímetro, en el orden de la pantalla. */
export function bloquesSemaforo(p: PerimetroVista): (keyof EstadosBloque)[] {
  const aplica: Record<keyof EstadosBloque, boolean> = {
    // El Pixel mide las ventas del sitio: sin tienda propia no hay qué medir.
    medicion: p.tiendaPropia,
    economia: true,
    cuenta: p.pautaMeta,
    funnel_web: p.funnelWeb,
    creativos: true,
  };
  return (["medicion", "economia", "cuenta", "funnel_web", "creativos"] as const).filter(
    (id) => aplica[id],
  );
}

// ---------------------------------------------------------------- presupuesto

/**
 * Compras semanales que necesita un conjunto optimizado por compra para salir
 * de aprendizaje. Es la misma heurística de Meta que usa el motor para
 * `volumen_suficiente` y para el piso (calculo-diagnostico.ts, "50 × CPA objetivo").
 */
export const COMPRAS_SEMANALES_POR_CONJUNTO = 50;

export type VistaPresupuesto = {
  /**
   * El motor determinó que el negocio no llega a las compras semanales que
   * necesita un conjunto optimizado por compra. Sólo un `false` explícito lo
   * activa: sin dato (`null`, o un diagnóstico guardado antes del campo) la
   * sección se ve como siempre, sin afirmar nada sobre el volumen.
   */
  sinVolumen: boolean;
  /** Compras semanales de hoy, tal como vienen del motor. */
  comprasSemanales: number | null;
  /** Por qué el piso por compra queda como referencia. Sólo con `sinVolumen`. */
  notaReferencia: string | null;
};

export function vistaPresupuesto(derivados: Derivados | null | undefined): VistaPresupuesto {
  const d = derivados ?? ({} as Derivados);
  const sinVolumen = d.volumen_suficiente === false;
  // Se lee de los derivados. Sólo si no vino se deriva de los pedidos
  // mensuales, con el mismo divisor que usa el motor (pedidos / 4,3).
  const comprasSemanales =
    typeof d.pedidos_semanales === "number" && Number.isFinite(d.pedidos_semanales)
      ? d.pedidos_semanales
      : typeof d.pedidos_mensuales === "number" && Number.isFinite(d.pedidos_mensuales)
        ? Math.round((d.pedidos_mensuales / 4.3) * 10) / 10
        : null;
  if (!sinVolumen) return { sinVolumen, comprasSemanales, notaReferencia: null };

  const hoy =
    comprasSemanales !== null
      ? `hoy el negocio hace ${numero(comprasSemanales, 1)}`
      : "hoy el negocio no llega a ese volumen";
  return {
    sinVolumen,
    comprasSemanales,
    notaReferencia:
      `Un conjunto optimizado por compra necesita ${COMPRAS_SEMANALES_POR_CONJUNTO} compras por semana para salir de aprendizaje; ${hoy}. ` +
      "Con menos compras, invertir este monto no le da al algoritmo la señal que necesita para aprender. " +
      "Queda como referencia de hacia dónde escalar cuando el volumen de compras lo sostenga, no como recomendación para hoy.",
  };
}

/**
 * ¿Va el aviso "el margen que se muestra es el de la muestra declarada"? Sólo
 * cuando es cierto: hay mix declarado que no llega al 100% y el motor retuvo el
 * margen total. Sin mix declarado el motor calcula como canal único y publica
 * el total, y la tarjeta de Economía de Resumen lo imprime: el aviso la contradecía.
 */
export function avisoMargenMuestra(derivados: Derivados | null | undefined): boolean {
  const cobertura = derivados?.cobertura_canales ?? 0;
  return (
    cobertura > 0 &&
    cobertura < 100 &&
    typeof derivados?.margen_contribucion !== "number" &&
    typeof derivados?.margen_muestra === "number"
  );
}
