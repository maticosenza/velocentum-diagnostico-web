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
  margenes_producto: (number | null)[];
  pedidos_mensuales: number | null;
  cr_tienda: number | null;
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

