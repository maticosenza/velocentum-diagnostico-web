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

/**
 * Expande la notación exponencial a decimal plana ("1e-7" -> "0.0000001").
 * Trabaja sobre la representación más corta que redondea al mismo double,
 * que es la que escribió la persona: 0,38625 es "0.38625" y no
 * "0.3862499999999999822...".
 */
function aDecimalPlano(n: number): string {
  const s = String(n);
  if (!/e/i.test(s)) return s;
  const [mantisa, expTxt] = s.split(/e/i) as [string, string];
  const exp = Number(expTxt);
  const neg = mantisa.startsWith("-");
  const cuerpo = neg ? mantisa.slice(1) : mantisa;
  const [ent, frac = ""] = cuerpo.split(".") as [string, string?];
  const digitos = ent + frac;
  const punto = ent.length + exp;
  let out: string;
  if (punto <= 0) out = "0." + "0".repeat(-punto) + digitos;
  else if (punto >= digitos.length) out = digitos + "0".repeat(punto - digitos.length);
  else out = digitos.slice(0, punto) + "." + digitos.slice(punto);
  return (neg ? "-" : "") + out;
}

/**
 * Redondeo con la política única, sobre enteros escalados en base decimal.
 * No multiplica en punto flotante ni usa epsilon: desplaza el punto decimal
 * en la cadena y aplica media hacia arriba simétrica sobre el entero.
 * Devuelve null si el valor no es finito.
 */
export function redondear(n: number | null | undefined, decimales: number): number | null {
  if (!esFinito(n)) return null;
  const plano = aDecimalPlano(n);
  const neg = plano.startsWith("-");
  const cuerpo = neg ? plano.slice(1) : plano;
  const [entTxt, fracTxt = ""] = cuerpo.split(".") as [string, string?];
  const digitos = entTxt + fracTxt;
  const punto = entTxt.length + decimales;

  let enteroTxt: string;
  let resto: string;
  if (punto <= 0) {
    enteroTxt = "0";
    resto = "0".repeat(-punto) + digitos;
  } else if (punto >= digitos.length) {
    enteroTxt = digitos + "0".repeat(punto - digitos.length);
    resto = "";
  } else {
    enteroTxt = digitos.slice(0, punto);
    resto = digitos.slice(punto);
  }

  let entero = BigInt(enteroTxt === "" ? "0" : enteroTxt);
  if (resto !== "" && resto.charCodeAt(0) >= 53) entero += 1n; // primer dígito >= '5'

  let salida = entero.toString();
  if (decimales > 0) {
    salida = salida.padStart(decimales + 1, "0");
    salida = salida.slice(0, salida.length - decimales) + "." + salida.slice(salida.length - decimales);
  }
  const r = Number((neg ? "-" : "") + salida);
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

/**
 * Suma exacta en base decimal: escala cada término a enteros de 12 decimales
 * usando su representación decimal en cadena, suma en BigInt y vuelve a número.
 * Evita que el ruido binario de las sumas encadenadas (1 - 0,4 - 0,05375 ...)
 * corra el medio punto justo antes de redondear.
 */
export function sumarDecimal(...valores: number[]): number {
  const ESCALA = 12;
  let acc = 0n;
  for (const v of valores) {
    if (!Number.isFinite(v)) return NaN;
    acc += escalarADecimales(v, ESCALA);
  }
  const neg = acc < 0n;
  let txt = (neg ? -acc : acc).toString().padStart(ESCALA + 1, "0");
  txt = txt.slice(0, txt.length - ESCALA) + "." + txt.slice(txt.length - ESCALA);
  return Number((neg ? "-" : "") + txt);
}

/** Convierte un número a entero BigInt escalado por 10^decimales, sin punto flotante. */
function escalarADecimales(n: number, decimales: number): bigint {
  const plano = aDecimalPlano(n);
  const neg = plano.startsWith("-");
  const cuerpo = neg ? plano.slice(1) : plano;
  const [ent, frac = ""] = cuerpo.split(".") as [string, string?];
  const fracRec = (frac + "0".repeat(decimales)).slice(0, decimales);
  const v = BigInt(ent === "" ? "0" : ent) * 10n ** BigInt(decimales) + BigInt(fracRec || "0");
  return neg ? -v : v;
}
