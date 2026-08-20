/**
 * Política única de aritmética y redondeo para dinero y tasas.
 *
 * Reglas (declaradas acá y en ningún otro lado):
 *  - Los montos se manipulan en centavos enteros, nunca en punto flotante.
 *  - Las tasas se redondean a 4 decimales.
 *  - Los montos se redondean a peso entero.
 *  - El modo de redondeo es media hacia arriba (half up), simétrico por signo:
 *    2,5 -> 3 y -2,5 -> -3.
 */

export const DECIMALES_TASA = 4;
export const DECIMALES_MONTO = 0;

function esFinito(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Media hacia arriba, simétrico respecto del cero. */
function mediaHaciaArriba(n: number): number {
  return n < 0 ? -Math.floor(-n + 0.5) : Math.floor(n + 0.5);
}

/** Redondeo genérico con la política única. Devuelve null si el valor no es finito. */
export function redondear(n: number | null | undefined, decimales: number): number | null {
  if (!esFinito(n)) return null;
  const f = 10 ** decimales;
  const r = mediaHaciaArriba(n * f) / f;
  return Number.isFinite(r) ? r : null;
}

/** Redondea una tasa (margen, comisión, ratio) a 4 decimales. */
export function redondearTasa(n: number | null | undefined): number | null {
  return redondear(n, DECIMALES_TASA);
}

/** Redondea un monto a peso entero. */
export function redondearMonto(n: number | null | undefined): number | null {
  return redondear(n, DECIMALES_MONTO);
}

/** Pasa un importe en pesos a centavos enteros. */
export function aCentavos(pesos: number | null | undefined): number | null {
  if (!esFinito(pesos)) return null;
  const c = mediaHaciaArriba(pesos * 100);
  return Number.isFinite(c) ? c : null;
}

/** Pasa centavos enteros a pesos. */
export function aPesos(centavos: number | null | undefined): number | null {
  if (!esFinito(centavos)) return null;
  return centavos / 100;
}

/** Resta en centavos: devuelve null si falta alguno de los dos importes. */
export function restarPesos(a: number | null | undefined, b: number | null | undefined): number | null {
  const ca = aCentavos(a);
  const cb = aCentavos(b);
  if (ca === null || cb === null) return null;
  return aPesos(ca - cb);
}

/**
 * Cociente de dos importes en pesos, calculado sobre centavos enteros.
 * Devuelve null si el divisor es cero o si algún importe falta.
 * El resultado NO se redondea acá: el redondeo se aplica una sola vez, al final.
 */
export function ratioPesos(
  numerador: number | null | undefined,
  denominador: number | null | undefined,
): number | null {
  const cn = aCentavos(numerador);
  const cd = aCentavos(denominador);
  if (cn === null || cd === null || cd === 0) return null;
  const r = cn / cd;
  return Number.isFinite(r) ? r : null;
}
