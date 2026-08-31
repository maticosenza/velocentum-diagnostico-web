/**
 * BV4 F2a etapa 4 (Q4, y F-4 aprobado por Matías el 2026-08-31): la moneda
 * es un parámetro, no un literal en el código. Estructuralmente igual a
 * `MonedaV2` de `seleccion-comercial-v2.ts`; se repite el literal en vez de
 * importarlo para que este módulo siga siendo una hoja sin dependencias.
 */
export type MonedaFormato = "ARS" | "USD";

/**
 * Formato de moneda: $ 1.250.000 en ARS, US$ 1.250.000 en USD (separador de
 * miles con punto, locale es-AR en las dos). La moneda **no se infiere de
 * nada**: la elige la propuesta y se pasa acá.
 */
export function formatMoneda(
  value: number,
  moneda: MonedaFormato = "ARS",
  opts?: { decimales?: boolean },
) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: opts?.decimales ? 2 : 0,
    maximumFractionDigits: opts?.decimales ? 2 : 0,
  }).format(value);
}

/**
 * Formato de moneda argentina: $ 1.250.000 (separador de miles con punto).
 *
 * Ampliación aditiva de F2a: delega en `formatMoneda` con `"ARS"`, las
 * mismas opciones de `Intl` de siempre. La salida es idéntica carácter por
 * carácter — `format.test.ts` lo fija — así que toda la cadena v1 que la
 * consume sigue produciendo exactamente lo mismo.
 */
export function formatARS(value: number, opts?: { decimales?: boolean }) {
  return formatMoneda(value, "ARS", opts);
}

/** Número con separador de miles con punto, sin símbolo de moneda. */
export function formatNumero(value: number, decimales = 0) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(value);
}

/** Porcentaje al estilo local: 12,4 % */
export function formatPorcentaje(value: number, decimales = 1) {
  return `${formatNumero(value, decimales)} %`;
}

/** Fecha corta: 16/08/2026 */
export function formatFecha(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(d);
}
