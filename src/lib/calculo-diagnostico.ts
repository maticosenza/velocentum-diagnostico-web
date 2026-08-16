/**
 * Capa de cálculo del diagnóstico. Aritmética pura: sin llamadas externas.
 * Todos los parámetros salen de la tabla `configuracion`; nunca hay valores fijos acá.
 */

import type { DatosDiagnostico } from "./diagnostico-form";

// ---------------------------------------------------------------- configuración

export type TramoFatiga = { hasta: number | null; factor: number };
export type Umbral = { verde: number; rojo: number };

export type ConfiguracionCalculo = {
  reserva_default?: number;
  comision_plataforma?: Record<string, number>;
  comision_pasarela?: Record<string, number>;
  umbrales_funnel_web?: Record<string, Umbral>;
  umbrales_creativos?: Record<string, Umbral>;
  factor_fatiga?: TramoFatiga[];
  delta_medicion?: Umbral;
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
  comision_plataforma: number | null;
  comision_pasarela: number | null;
  breakeven_roas: number | null;
  cpa_breakeven: number | null;
  reserva: number | null;
  cpa_objetivo: number | null;
  roas_objetivo: number | null;
  mer_actual: number | null;
  contribucion_marginal: number | null;
  piso_semanal_por_conjunto: number | null;
  conjuntos_sostenibles: number | null;
  piso_mensual_un_conjunto: number | null;
  inversion_actual_mensual: number | null;
  techo_operativo_inversion: number | null;
};

export type Fuga = {
  id: string;
  etiqueta: string;
  tipo: "monto" | "riesgo";
  monto: number | null;
  calculable: boolean;
  faltantes: string[];
  detalle?: string;
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

/** Redondea a `decimales` y devuelve null si el valor no es finito. */
function red(n: number | null | undefined, decimales = 0): number | null {
  if (!finito(n)) return null;
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
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

/** Clave compuesta plataforma_plan usada en la configuración de comisiones. */
export function claveComisionPlataforma(plataforma: string, plan: string): string {
  const p = (plataforma || "").trim();
  const pl = (plan || "").trim();
  if (!p) return "";
  return pl ? `${p}_${pl}` : p;
}

function comisionPlataformaDe(cfg: ConfiguracionCalculo, datos: DatosDiagnostico): number | null {
  const tabla = cfg.comision_plataforma ?? {};
  const compuesta = claveComisionPlataforma(datos.plataforma, datos.plan_plataforma);
  if (finito(tabla[compuesta])) return tabla[compuesta] as number;
  const simple = (datos.plataforma || "").trim();
  if (finito(tabla[simple])) return tabla[simple] as number;
  return null;
}

function factorFatigaDe(cfg: ConfiguracionCalculo, frecuencia: number): number | null {
  const tramos = cfg.factor_fatiga;
  if (!Array.isArray(tramos) || tramos.length === 0) return null;
  for (const t of tramos) {
    if (t.hasta === null || t.hasta === undefined) return finito(t.factor) ? t.factor : null;
    if (frecuencia <= t.hasta) return finito(t.factor) ? t.factor : null;
  }
  const ultimo = tramos[tramos.length - 1];
  return finito(ultimo?.factor) ? (ultimo!.factor as number) : null;
}

// ---------------------------------------------------------------- cálculo

export function calcularDiagnostico(
  datos: DatosDiagnostico,
  cfg: ConfiguracionCalculo,
): ResultadoCalculo {
  const d = datos;

  // --- Delta de medición
  let delta: number | null = null;
  if (finito(d.ventas_backoffice) && d.ventas_backoffice !== 0 && finito(d.facturacion_pixel)) {
    delta = Math.abs(d.facturacion_pixel - d.ventas_backoffice) / d.ventas_backoffice;
  }

  // --- Margen de contribución
  const comPlataforma = comisionPlataformaDe(cfg, d);
  const comPasarela = finito(cfg.comision_pasarela?.[d.pasarela])
    ? (cfg.comision_pasarela![d.pasarela] as number)
    : null;

  let margen: number | null = null;
  if (
    finito(d.costo_producto_pct) &&
    finito(d.costo_envio_promedio) &&
    finito(d.ticket_promedio) &&
    d.ticket_promedio !== 0 &&
    comPlataforma !== null &&
    comPasarela !== null
  ) {
    const m =
      1 -
      (d.costo_producto_pct / 100 +
        comPlataforma +
        comPasarela +
        d.costo_envio_promedio / d.ticket_promedio);
    margen = finito(m) ? m : null;
  }

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

  // --- Presupuesto
  const pisoSemanalPorConjunto = cpaObjetivo !== null ? 50 * cpaObjetivo : null;
  const conjuntosSostenibles =
    pisoSemanalPorConjunto !== null && pisoSemanalPorConjunto > 0 && finito(d.presupuesto_diario)
      ? (d.presupuesto_diario * 7) / pisoSemanalPorConjunto
      : null;
  const pisoMensualUnConjunto = cpaObjetivo !== null ? 50 * cpaObjetivo * 4.3 : null;
  const inversionActualMensual = finito(d.presupuesto_diario) ? d.presupuesto_diario * 30 : null;
  const techoOperativoInversion =
    finito(d.techo_operativo) && roasObjetivo !== null && roasObjetivo > 0
      ? d.techo_operativo / roasObjetivo
      : null;

  const derivados: Derivados = {
    delta_medicion: red(delta, 4),
    margen_contribucion: red(margen, 4),
    comision_plataforma: comPlataforma,
    comision_pasarela: comPasarela,
    breakeven_roas: red(breakevenRoas, 2),
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
    techo_operativo_inversion: red(techoOperativoInversion, 0),
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
    finito(d.presupuesto_diario) &&
    finito(d.conjuntos_activos) &&
    d.conjuntos_activos > 0 &&
    pisoSemanalPorConjunto !== null &&
    pisoSemanalPorConjunto > 0
  ) {
    const real = (d.presupuesto_diario * 7) / d.conjuntos_activos;
    const ratio = real / pisoSemanalPorConjunto;
    estadoCuenta = ratio >= 1 ? "verde" : ratio >= 0.6 ? "amarillo" : "rojo";
  }

  const uCr = cfg.umbrales_funnel_web?.["cr_tienda"];
  const crNormalizado = finito(d.cr_tienda) ? d.cr_tienda / 100 : null;
  const estadoFunnel: EstadoBloque =
    crNormalizado !== null && uCr ? porUmbral(crNormalizado, uCr, true) : "sin_datos";

  const uCreativos = cfg.umbrales_creativos?.["creativos_nuevos_mes"];
  const estadoCreativos: EstadoBloque =
    finito(d.creativos_nuevos_mes) && uCreativos
      ? porUmbral(d.creativos_nuevos_mes, uCreativos, true)
      : "sin_datos";

  const estados_bloque: EstadosBloque = {
    medicion: estadoMedicion,
    economia: estadoEconomia,
    cuenta: estadoCuenta,
    funnel_web: estadoFunnel,
    creativos: estadoCreativos,
  };

  // --- Fugas
  const fugas: Fuga[] = [];

  // Conversión
  {
    const faltan = faltantes(datos, ["sesiones_mensuales", "cr_tienda", "ticket_promedio"]);
    if (margen === null) faltan.push("margen_contribucion");
    if (!uCr) faltan.push("umbrales_funnel_web.cr_tienda");
    if (faltan.length > 0) {
      fugas.push({
        id: "conversion",
        etiqueta: "Fuga por conversión",
        tipo: "monto",
        monto: null,
        calculable: false,
        faltantes: faltan,
      });
    } else if (crNormalizado !== null && crNormalizado < uCr!.verde) {
      const monto =
        (d.sesiones_mensuales as number) *
        (uCr!.verde - crNormalizado) *
        (d.ticket_promedio as number) *
        (margen as number);
      fugas.push({
        id: "conversion",
        etiqueta: "Fuga por conversión",
        tipo: "monto",
        monto: Math.max(0, red(monto, 0) ?? 0),
        calculable: true,
        faltantes: [],
      });
    }
  }

  // Gasto no rentable
  {
    const faltan: string[] = [];
    if (inversionAds === null) faltan.push("inversion_meta", "inversion_google");
    if (mer === null) faltan.push("facturacion_mensual");
    if (breakevenRoas === null) faltan.push("margen_contribucion");
    if (faltan.length > 0) {
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

  // Fatiga creativa
  {
    const faltan = faltantes(datos, ["inversion_meta", "frecuencia_30d"]);
    const factor = finito(d.frecuencia_30d) ? factorFatigaDe(cfg, d.frecuencia_30d) : null;
    if (factor === null) faltan.push("factor_fatiga");
    if (faltan.length > 0) {
      fugas.push({
        id: "fatiga_creativa",
        etiqueta: "Fuga por fatiga creativa",
        tipo: "monto",
        monto: null,
        calculable: false,
        faltantes: faltan,
      });
    } else if ((factor as number) > 0) {
      fugas.push({
        id: "fatiga_creativa",
        etiqueta: "Fuga por fatiga creativa",
        tipo: "monto",
        monto: Math.max(0, red((d.inversion_meta as number) * (factor as number), 0) ?? 0),
        calculable: true,
        faltantes: [],
      });
    }
  }

  // Sobrefragmentación
  {
    const faltan = faltantes(datos, ["conjuntos_activos", "presupuesto_diario"]);
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

  // Medición: hallazgo de riesgo, nunca valorizado en pesos
  if (estadoMedicion === "rojo") {
    fugas.push({
      id: "medicion",
      etiqueta: "Riesgo de medición",
      tipo: "riesgo",
      monto: null,
      calculable: true,
      faltantes: [],
      detalle: "El desvío entre backoffice y Pixel invalida cualquier valorización en pesos.",
    });
  }

  const total = fugas.reduce(
    (acc, f) => (f.tipo === "monto" && finito(f.monto) ? acc + (f.monto as number) : acc),
    0,
  );

  return {
    derivados,
    estados_bloque,
    fugas,
    oportunidad_total: red(total, 0) ?? 0,
    oportunidad_conservadora: red(total * 0.6, 0) ?? 0,
  };
}
