/**
 * Mayorista y mixto (fase 9, decisión comercial 6, `docs/decisiones-pendientes.md`,
 * 2026-08-22): "el mismo catálogo de seis servicios, aplicado a otro
 * objetivo. No hay servicios B2B nuevos: cambia el tipo de campaña... pero
 * Meta Ads sigue siendo Meta Ads."
 *
 * Mayorista es un CANAL COMBINABLE, no un tipo de diagnóstico separado: se
 * evalúa en paralelo al minorista, sobre el mismo `DatosDiagnostico`. Usa su
 * propia fórmula de piso de precio (cost-plus con componentes nombrados),
 * DISTINTA de la de `margenDeCanal()` en `calculo-diagnostico.ts` (que
 * modela comisión de plataforma/pasarela + envío, pensada para minorista):
 * forzarla a compartir esa maquinaria habría sido un mal ajuste conceptual,
 * no una simplificación.
 *
 * Nada de acá se suma a `oportunidad_total` ni a las tres magnitudes de
 * `impacto-economico.ts`: las salidas de este módulo son economía unitaria
 * y estado de cartera, no "fugas" mensuales de la misma naturaleza que el
 * gasto publicitario o el funnel de conversión. Mezclarlas sería sumar
 * bases incompatibles.
 *
 * REGLA DURA (instrucción explícita): la cartera actual (cuentas ya
 * activas, un hecho) y el escenario de activación (leads → cuentas nuevas,
 * una proyección con supuestos visibles) son dos cifras que NUNCA se
 * suman entre sí. Se devuelven como campos separados a propósito.
 */

import { entradaCapacidadesPlataforma, planConCanalMayoristaDe } from "./canales";
import type { DatosDiagnostico } from "./diagnostico-form";
import { redondear } from "./dinero";

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function red(n: number | null | undefined, decimales = 0): number | null {
  return redondear(n, decimales);
}

export type ConfigMayorista = {
  /**
   * Tasa de cierre (leads -> cuenta mayorista activada) del escenario de
   * activación. Sin este valor en configuración, el escenario documenta el
   * funnel declarado pero no proyecta una cantidad de cuentas: no hay un
   * benchmark de código para esto, a propósito.
   */
  mayorista_tasa_cierre_esperada?: number;
};

export type ModalidadComercial = "minorista" | "mayorista" | "mixto";

/**
 * Deriva la modalidad a partir de los dos canales activables. Nunca se
 * carga directamente: `venta_minorista_activa` es `true` por defecto
 * (compatibilidad con todo diagnóstico existente, que ya era minorista sin
 * este campo); `venta_mayorista_activa` sólo se activa de forma explícita.
 */
export function modalidadComercial(d: DatosDiagnostico): ModalidadComercial {
  const minorista = d.venta_minorista_activa !== false;
  const mayorista = d.venta_mayorista_activa === true;
  if (mayorista && minorista) return "mixto";
  if (mayorista) return "mayorista";
  return "minorista";
}

export function mayoristaActivo(d: DatosDiagnostico): boolean {
  return d.venta_mayorista_activa === true;
}

export type SalidaMayorista<T> = { valor: T | null; faltantes: string[] };

export type EscenarioActivacionMayorista = {
  /** false si no hay ningún lead declarado: el escenario ni siquiera existe (mismo criterio que una fuga sin datos). */
  existe: boolean;
  calculable: boolean;
  cuentas_nuevas_estimadas_90d: number | null;
  faltantes: string[];
  supuestos: string[];
  /** Siempre "baja": depende de un benchmark de configuración sin verificar con este cliente. */
  confianza: "baja";
};

export type MayoristaDerivado = {
  activo: boolean;
  modalidad: ModalidadComercial;
  /** Disponibilidad del canal mayorista en la plataforma/plan del cliente (CAPACIDADES_PLATAFORMA_DEFECTO). null = no relevado. */
  canal_disponible: boolean | null;
  /** Primer plan de la plataforma que sí ofrece canal mayorista, si el actual no lo tiene. */
  plan_sugerido: string | null;
  costos_variables_unitarios: SalidaMayorista<number>;
  precio_minimo: SalidaMayorista<number>;
  /** Tasa (0-1): 1 - precio_minimo/precio_minorista_referencia. */
  descuento_maximo_viable: SalidaMayorista<number>;
  /** Margen real con el precio efectivamente cobrado hoy (no el objetivo). */
  margen_contribucion: SalidaMayorista<number>;
  pedido_minimo_rentable: SalidaMayorista<number>;
  contribucion_por_pedido: SalidaMayorista<number>;
  cartera_actual_facturacion_recurrente_mensual: SalidaMayorista<number>;
  cuentas_necesarias_objetivo: SalidaMayorista<number>;
  capacidad_maxima_facturacion_mensual: SalidaMayorista<number>;
  recupero_cac_meses: SalidaMayorista<number>;
  escenario_activacion: EscenarioActivacionMayorista;
  /** true sólo si hay minorista activo (o no declarado en contra) Y el precio mayorista es visible en la misma plataforma. */
  riesgo_canibalizacion: boolean;
  /** Sin umbral de código: se informa el dato, no se clasifica en riesgo. */
  concentracion_pct_top_cliente: number | null;
};

function costosVariablesUnitarios(d: DatosDiagnostico): SalidaMayorista<number> {
  const partes: { valor: number | null; campo: string }[] = [
    {
      valor: finito(d.mayorista_costo_producto) ? d.mayorista_costo_producto : null,
      campo: "mayorista_costo_producto",
    },
    {
      valor: finito(d.mayorista_costo_logistica_b2b) ? d.mayorista_costo_logistica_b2b : null,
      campo: "mayorista_costo_logistica_b2b",
    },
    {
      valor: finito(d.mayorista_comision_comercial) ? d.mayorista_comision_comercial : null,
      campo: "mayorista_comision_comercial",
    },
    {
      valor: finito(d.mayorista_costo_financiacion) ? d.mayorista_costo_financiacion : null,
      campo: "mayorista_costo_financiacion",
    },
    {
      valor: finito(d.mayorista_impuestos_cobranza) ? d.mayorista_impuestos_cobranza : null,
      campo: "mayorista_impuestos_cobranza",
    },
  ];
  const faltan = partes.filter((p) => p.valor === null).map((p) => p.campo);
  if (faltan.length > 0) return { valor: null, faltantes: faltan };
  const suma = partes.reduce((acc, p) => acc + (p.valor as number), 0);
  return { valor: red(suma, 2), faltantes: [] };
}

function precioMinimo(
  costos: SalidaMayorista<number>,
  margenObjetivoPct: number | null,
): SalidaMayorista<number> {
  const faltan = [...costos.faltantes];
  const margenValido = finito(margenObjetivoPct) && margenObjetivoPct >= 0 && margenObjetivoPct < 100;
  if (!margenValido) faltan.push("mayorista_margen_objetivo_pct");
  if (costos.valor === null || !margenValido) return { valor: null, faltantes: faltan };
  const margen = (margenObjetivoPct as number) / 100;
  return { valor: red(costos.valor / (1 - margen), 2), faltantes: [] };
}

function descuentoMaximoViable(
  precioMin: SalidaMayorista<number>,
  precioMinorista: number | null,
): SalidaMayorista<number> {
  const faltan = [...precioMin.faltantes];
  const refValida = finito(precioMinorista) && precioMinorista > 0;
  if (!refValida) faltan.push("mayorista_precio_minorista_referencia");
  if (precioMin.valor === null || !refValida) return { valor: null, faltantes: faltan };
  const descuento = 1 - precioMin.valor / (precioMinorista as number);
  return { valor: red(descuento, 4), faltantes: [] };
}

function margenContribucionReal(
  costos: SalidaMayorista<number>,
  precioVentaReal: number | null,
): SalidaMayorista<number> {
  const faltan = [...costos.faltantes];
  const precioValido = finito(precioVentaReal) && precioVentaReal > 0;
  if (!precioValido) faltan.push("mayorista_precio_venta_real");
  if (costos.valor === null || !precioValido) return { valor: null, faltantes: faltan };
  const margen = ((precioVentaReal as number) - costos.valor) / (precioVentaReal as number);
  return { valor: red(margen, 4), faltantes: [] };
}

function pedidoMinimoRentable(
  precioMin: SalidaMayorista<number>,
  pedidoMinimoUnidades: number | null,
): SalidaMayorista<number> {
  const faltan = [...precioMin.faltantes];
  const unidadesValidas = finito(pedidoMinimoUnidades) && pedidoMinimoUnidades > 0;
  if (!unidadesValidas) faltan.push("mayorista_pedido_minimo_unidades");
  if (precioMin.valor === null || !unidadesValidas) return { valor: null, faltantes: faltan };
  return { valor: red(precioMin.valor * (pedidoMinimoUnidades as number), 0), faltantes: [] };
}

/** Contribución de un pedido recurrente "de régimen": usa el ticket de recompra, no el inicial. */
function contribucionPorPedido(
  margen: SalidaMayorista<number>,
  ticketRecompra: number | null,
): SalidaMayorista<number> {
  const faltan = [...margen.faltantes];
  const ticketValido = finito(ticketRecompra) && ticketRecompra > 0;
  if (!ticketValido) faltan.push("mayorista_ticket_recompra");
  if (margen.valor === null || !ticketValido) return { valor: null, faltantes: faltan };
  return { valor: red(margen.valor * (ticketRecompra as number), 0), faltantes: [] };
}

/** Cartera YA activa, un hecho: nunca se combina con el escenario de activación. */
function carteraActual(d: DatosDiagnostico): SalidaMayorista<number> {
  const faltan: string[] = [];
  const cuentas = finito(d.mayorista_cuentas_activas) ? d.mayorista_cuentas_activas : null;
  const ticket =
    finito(d.mayorista_ticket_recompra) && d.mayorista_ticket_recompra > 0
      ? d.mayorista_ticket_recompra
      : null;
  const frecuencia =
    finito(d.mayorista_frecuencia_recompra_dias) && d.mayorista_frecuencia_recompra_dias > 0
      ? d.mayorista_frecuencia_recompra_dias
      : null;
  if (cuentas === null) faltan.push("mayorista_cuentas_activas");
  if (ticket === null) faltan.push("mayorista_ticket_recompra");
  if (frecuencia === null) faltan.push("mayorista_frecuencia_recompra_dias");
  if (faltan.length > 0) return { valor: null, faltantes: faltan };
  const facturacion = (cuentas as number) * (ticket as number) * (30 / (frecuencia as number));
  return { valor: red(facturacion, 0), faltantes: [] };
}

function cuentasNecesarias(d: DatosDiagnostico): SalidaMayorista<number> {
  const faltan: string[] = [];
  const objetivo =
    finito(d.mayorista_objetivo_facturacion_mensual) && d.mayorista_objetivo_facturacion_mensual > 0
      ? d.mayorista_objetivo_facturacion_mensual
      : null;
  const ticket =
    finito(d.mayorista_ticket_recompra) && d.mayorista_ticket_recompra > 0
      ? d.mayorista_ticket_recompra
      : null;
  const frecuencia =
    finito(d.mayorista_frecuencia_recompra_dias) && d.mayorista_frecuencia_recompra_dias > 0
      ? d.mayorista_frecuencia_recompra_dias
      : null;
  if (objetivo === null) faltan.push("mayorista_objetivo_facturacion_mensual");
  if (ticket === null) faltan.push("mayorista_ticket_recompra");
  if (frecuencia === null) faltan.push("mayorista_frecuencia_recompra_dias");
  if (faltan.length > 0) return { valor: null, faltantes: faltan };
  const facturacionPorCuenta = (ticket as number) * (30 / (frecuencia as number));
  return { valor: Math.ceil((objetivo as number) / facturacionPorCuenta), faltantes: [] };
}

function capacidadMaximaFacturacion(d: DatosDiagnostico): SalidaMayorista<number> {
  const faltan: string[] = [];
  const unidades =
    finito(d.mayorista_capacidad_maxima_unidades_mes) && d.mayorista_capacidad_maxima_unidades_mes > 0
      ? d.mayorista_capacidad_maxima_unidades_mes
      : null;
  const precio =
    finito(d.mayorista_precio_venta_real) && d.mayorista_precio_venta_real > 0
      ? d.mayorista_precio_venta_real
      : null;
  if (unidades === null) faltan.push("mayorista_capacidad_maxima_unidades_mes");
  if (precio === null) faltan.push("mayorista_precio_venta_real");
  if (faltan.length > 0) return { valor: null, faltantes: faltan };
  return { valor: red((unidades as number) * (precio as number), 0), faltantes: [] };
}

function recuperoCacMeses(
  d: DatosDiagnostico,
  contribucionPedido: SalidaMayorista<number>,
): SalidaMayorista<number> {
  const faltan = [...contribucionPedido.faltantes];
  const cac =
    finito(d.mayorista_cac_por_cuenta) && d.mayorista_cac_por_cuenta > 0
      ? d.mayorista_cac_por_cuenta
      : null;
  const frecuencia =
    finito(d.mayorista_frecuencia_recompra_dias) && d.mayorista_frecuencia_recompra_dias > 0
      ? d.mayorista_frecuencia_recompra_dias
      : null;
  if (cac === null) faltan.push("mayorista_cac_por_cuenta");
  if (frecuencia === null) faltan.push("mayorista_frecuencia_recompra_dias");
  if (contribucionPedido.valor === null || cac === null || frecuencia === null) {
    return { valor: null, faltantes: faltan };
  }
  const contribucionMensual = contribucionPedido.valor * (30 / frecuencia);
  if (contribucionMensual <= 0) {
    return { valor: null, faltantes: [...faltan, "mayorista_ticket_recompra"] };
  }
  return { valor: red(cac / contribucionMensual, 1), faltantes: [] };
}

/**
 * Escenario de activación: leads -> cuentas nuevas. Nunca se muestra como
 * hecho (regla dura). Sin ningún lead declarado, el escenario ni siquiera
 * existe. Con leads pero sin tasa de cierre en configuración, documenta el
 * funnel declarado sin proyectar una cantidad.
 */
function escenarioActivacion(
  d: DatosDiagnostico,
  cfg: ConfigMayorista,
): EscenarioActivacionMayorista {
  const leads =
    finito(d.mayorista_leads_mensuales) && d.mayorista_leads_mensuales > 0
      ? d.mayorista_leads_mensuales
      : null;
  if (leads === null) {
    return {
      existe: false,
      calculable: false,
      cuentas_nuevas_estimadas_90d: null,
      faltantes: [],
      supuestos: [],
      confianza: "baja",
    };
  }

  const supuestos: string[] = [`${leads} leads mensuales declarados.`];
  if (finito(d.mayorista_cotizaciones_mensuales)) {
    supuestos.push(`${d.mayorista_cotizaciones_mensuales} cotizaciones mensuales declaradas.`);
  }
  if (finito(d.mayorista_tiempo_cierre_dias)) {
    supuestos.push(`Tiempo de cierre declarado: ${d.mayorista_tiempo_cierre_dias} días.`);
  }

  const tasaCierre = finito(cfg.mayorista_tasa_cierre_esperada)
    ? (cfg.mayorista_tasa_cierre_esperada as number)
    : null;
  if (tasaCierre === null) {
    supuestos.push(
      "Sin una tasa de cierre configurada, no se proyecta una cantidad de cuentas nuevas: sólo se documenta el funnel declarado.",
    );
    return {
      existe: true,
      calculable: false,
      cuentas_nuevas_estimadas_90d: null,
      faltantes: ["mayorista_tasa_cierre_esperada"],
      supuestos,
      confianza: "baja",
    };
  }

  supuestos.push(
    `Tasa de cierre estimada (leads -> cuenta activa) del ${Math.round(tasaCierre * 100)}%, benchmark de configuración sin verificar con datos reales de este cliente.`,
  );
  supuestos.push("Proyección a 90 días (3 meses de leads al ritmo actual).");
  const cuentasNuevas = Math.round(leads * 3 * tasaCierre);
  return {
    existe: true,
    calculable: true,
    cuentas_nuevas_estimadas_90d: cuentasNuevas,
    faltantes: [],
    supuestos,
    confianza: "baja",
  };
}

/**
 * Evalúa el canal mayorista. `null` si no está activo (mismo criterio que
 * una fuga sin ningún dato del tema: el bloque entero no existe, no se
 * muestra "sin datos").
 */
export function evaluarMayorista(d: DatosDiagnostico, cfg: ConfigMayorista): MayoristaDerivado | null {
  if (!mayoristaActivo(d)) return null;

  const capacidad = entradaCapacidadesPlataforma(d);
  const canalDisponible = capacidad?.canal_mayorista ?? null;
  const planSugerido =
    canalDisponible === false ? planConCanalMayoristaDe((d.plataforma || "").trim()) : null;

  const costos = costosVariablesUnitarios(d);
  const precioMin = precioMinimo(
    costos,
    finito(d.mayorista_margen_objetivo_pct) ? d.mayorista_margen_objetivo_pct : null,
  );
  const descuentoMax = descuentoMaximoViable(
    precioMin,
    finito(d.mayorista_precio_minorista_referencia) ? d.mayorista_precio_minorista_referencia : null,
  );
  const margenReal = margenContribucionReal(
    costos,
    finito(d.mayorista_precio_venta_real) ? d.mayorista_precio_venta_real : null,
  );
  const pedidoMinRentable = pedidoMinimoRentable(
    precioMin,
    finito(d.mayorista_pedido_minimo_unidades) ? d.mayorista_pedido_minimo_unidades : null,
  );
  const contribPedido = contribucionPorPedido(
    margenReal,
    finito(d.mayorista_ticket_recompra) ? d.mayorista_ticket_recompra : null,
  );
  const cartera = carteraActual(d);
  const cuentasObjetivo = cuentasNecesarias(d);
  const capacidadMax = capacidadMaximaFacturacion(d);
  const recuperoCac = recuperoCacMeses(d, contribPedido);
  const escenario = escenarioActivacion(d, cfg);

  const riesgoCanibalizacion =
    d.venta_minorista_activa !== false && d.mayorista_precio_visible_en_plataforma_minorista === true;

  return {
    activo: true,
    modalidad: modalidadComercial(d),
    canal_disponible: canalDisponible,
    plan_sugerido: planSugerido,
    costos_variables_unitarios: costos,
    precio_minimo: precioMin,
    descuento_maximo_viable: descuentoMax,
    margen_contribucion: margenReal,
    pedido_minimo_rentable: pedidoMinRentable,
    contribucion_por_pedido: contribPedido,
    cartera_actual_facturacion_recurrente_mensual: cartera,
    cuentas_necesarias_objetivo: cuentasObjetivo,
    capacidad_maxima_facturacion_mensual: capacidadMax,
    recupero_cac_meses: recuperoCac,
    escenario_activacion: escenario,
    riesgo_canibalizacion: riesgoCanibalizacion,
    concentracion_pct_top_cliente: finito(d.mayorista_concentracion_pct_top_cliente)
      ? d.mayorista_concentracion_pct_top_cliente
      : null,
  };
}

/** true si el precio efectivamente cobrado hoy está por debajo del piso rentable calculado. */
export function ventaPorDebajoDelPiso(d: DatosDiagnostico, m: MayoristaDerivado): boolean {
  return (
    m.precio_minimo.valor !== null &&
    finito(d.mayorista_precio_venta_real) &&
    (d.mayorista_precio_venta_real as number) < (m.precio_minimo.valor as number)
  );
}

/** true si el pedido mínimo que el cliente declara (en pesos) queda por debajo del piso rentable calculado. */
export function pedidoMinimoDeclaradoInsuficiente(d: DatosDiagnostico, m: MayoristaDerivado): boolean {
  return (
    m.pedido_minimo_rentable.valor !== null &&
    finito(d.mayorista_pedido_minimo_monto) &&
    (d.mayorista_pedido_minimo_monto as number) < (m.pedido_minimo_rentable.valor as number)
  );
}
