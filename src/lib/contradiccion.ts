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
 *
 * Contra qué margen se compara (corrección 2026-08-22): el margen TOTAL
 * exige 100% explícito de cobertura (productos y canales) y puede no existir.
 * Eso no significa que la contradicción deje de evaluarse: si el total está
 * retenido, se compara contra el margen de la MUESTRA, que sigue siendo una
 * base real aunque parcial. El caso que originó esta regla (Titan Web, 60%
 * de cobertura de productos) debe seguir disparando la alerta cuando el
 * cliente declara una rentabilidad que la muestra contradice. `origen_margen`
 * y `confianza_base` dejan trazado contra qué se comparó y cuán representativa
 * es esa base — son un eje distinto de `confirmado`/`bloquea`, que sigue
 * dependiendo únicamente de si el cliente confirmó su margen declarado.
 */

export type NivelContradiccion = "sin_alerta" | "validacion_requerida" | "critica";

export type RangoDeclarado = {
  min: number;
  /** Si no se declara máximo, el rango es el valor exacto del mínimo. */
  max: number;
};

/** Contra qué margen se comparó: el total (100% de cobertura explícita) o la muestra parcial. */
export type OrigenMargen = "total" | "muestra";

export type Contradiccion = {
  nivel: NivelContradiccion;
  calculado: number;
  /** "total" cuando había margen total disponible; "muestra" cuando estaba retenido y se usó el de la muestra. */
  origen_margen: OrigenMargen;
  /**
   * Cuán representativa es la base de comparación: "alta" con margen total
   * (100% de cobertura), "media" con margen de la muestra (cobertura
   * parcial) — un nivel menos, nunca "baja": la contradicción sigue siendo
   * una lectura real de la evidencia cargada, no una adivinanza.
   */
  confianza_base: "alta" | "media";
  /** Cobertura de productos y de canales de la evidencia usada en la comparación (trazabilidad, no afecta el cálculo). */
  cobertura_productos: number | null;
  cobertura_canales: number | null;
  declarado_min: number;
  declarado_max: number;
  dentro_del_rango: boolean;
  /** Límite del rango contra el que se midió la diferencia. */
  limite_cercano: number | null;
  diferencia: number;
  cambio_de_signo: boolean;
  /** Si el cliente confirmó su margen declarado. Eje independiente de origen_margen/confianza_base. */
  confirmado: boolean;
  /** Sólo una contradicción crítica y confirmada bloquea los montos, sin importar el origen del margen. */
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
  margenes: { total: number | null | undefined; muestra: number | null | undefined },
  rango: RangoDeclarado | null,
  opciones: {
    confirmado?: boolean;
    umbral_critico?: number | null | undefined;
    umbral_validacion?: number | null | undefined;
    cobertura_productos?: number | null | undefined;
    cobertura_canales?: number | null | undefined;
  } = {},
): Contradiccion | null {
  if (rango === null) return null;

  // El margen total (100% de cobertura explícita) le gana a la muestra como
  // base de comparación cuando está disponible. Si está retenido, se usa el
  // de la muestra: la contradicción sigue evaluándose sobre lo que sí se
  // pudo calcular, en vez de dejar de dispararse por falta de cobertura total.
  const usaTotal = finito(margenes.total);
  const calculado = usaTotal ? margenes.total : margenes.muestra;
  if (!finito(calculado)) return null;

  const origen: OrigenMargen = usaTotal ? "total" : "muestra";
  const confianzaBase: "alta" | "media" = usaTotal ? "alta" : "media";

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
    origen_margen: origen,
    confianza_base: confianzaBase,
    cobertura_productos: finito(opciones.cobertura_productos) ? opciones.cobertura_productos : null,
    cobertura_canales: finito(opciones.cobertura_canales) ? opciones.cobertura_canales : null,
    declarado_min: rango.min,
    declarado_max: rango.max,
    dentro_del_rango: dentro,
    limite_cercano: limite,
    diferencia: Math.round(diferencia * 1e6) / 1e6,
    cambio_de_signo: cambioDeSigno,
    confirmado,
    // Sólo depende de nivel + confirmado: el origen del margen nunca decide el bloqueo.
    bloquea: nivel === "critica" && confirmado,
  };
}
