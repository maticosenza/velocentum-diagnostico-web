/**
 * Regla de contradicción entre el margen calculado y el margen que declara el
 * cliente. Todo en TASA (0,10 = 10%): la conversión desde el porcentaje del
 * formulario se hace en el motor, no acá.
 *
 * Reglas duras:
 *  - si el calculado cae dentro del rango declarado no hay contradicción, sin
 *    importar cuán amplio sea el rango;
 *  - la diferencia se mide contra el límite MÁS CERCANO, nunca contra el centro;
 *  - sólo un margen declarado y confirmado por el cliente puede bloquear.
 */

export type NivelContradiccion = "sin_alerta" | "validacion_requerida" | "critica";

export type RangoDeclarado = {
  min: number;
  /** Si no se declara máximo, el rango es el valor exacto del mínimo. */
  max: number;
};

export type Contradiccion = {
  nivel: NivelContradiccion;
  calculado: number;
  declarado_min: number;
  declarado_max: number;
  dentro_del_rango: boolean;
  /** Límite del rango contra el que se midió la diferencia. */
  limite_cercano: number | null;
  diferencia: number;
  cambio_de_signo: boolean;
  confirmado: boolean;
  /** Sólo una contradicción crítica y confirmada bloquea los montos. */
  bloquea: boolean;
};

export const UMBRAL_CONTRADICCION_CRITICO = 0.1;
export const UMBRAL_CONTRADICCION_VALIDACION = 0.05;

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Rango declarado, en tasa, a partir de los porcentajes del formulario. */
export function rangoDeclarado(
  minPct: number | null | undefined,
  maxPct: number | null | undefined,
): RangoDeclarado | null {
  if (!finito(minPct)) return null;
  const min = minPct / 100;
  const max = finito(maxPct) ? maxPct / 100 : min;
  return max < min ? { min: max, max: min } : { min, max };
}

export function evaluarContradiccion(
  calculado: number | null | undefined,
  rango: RangoDeclarado | null,
  opciones: {
    confirmado?: boolean;
    umbral_critico?: number | null | undefined;
    umbral_validacion?: number | null | undefined;
  } = {},
): Contradiccion | null {
  if (!finito(calculado) || rango === null) return null;

  const critico = finito(opciones.umbral_critico)
    ? opciones.umbral_critico
    : UMBRAL_CONTRADICCION_CRITICO;
  const validacion = finito(opciones.umbral_validacion)
    ? opciones.umbral_validacion
    : UMBRAL_CONTRADICCION_VALIDACION;
  const confirmado = opciones.confirmado === true;

  const dentro = calculado >= rango.min && calculado <= rango.max;
  const limite = dentro ? null : calculado < rango.min ? rango.min : rango.max;
  const diferencia = limite === null ? 0 : Math.abs(calculado - limite);

  const cambioDeSigno =
    (calculado < 0 && rango.min > 0) || (calculado > 0 && rango.max < 0);

  let nivel: NivelContradiccion = "sin_alerta";
  if (cambioDeSigno) nivel = "critica";
  else if (!dentro && diferencia >= critico) nivel = "critica";
  else if (!dentro && diferencia >= validacion) nivel = "validacion_requerida";

  return {
    nivel,
    calculado,
    declarado_min: rango.min,
    declarado_max: rango.max,
    dentro_del_rango: dentro,
    limite_cercano: limite,
    diferencia: Math.round(diferencia * 1e6) / 1e6,
    cambio_de_signo: cambioDeSigno,
    confirmado,
    bloquea: nivel === "critica" && confirmado,
  };
}
