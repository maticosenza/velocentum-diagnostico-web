/** Formato de moneda argentina: $ 1.250.000 (separador de miles con punto). */
export function formatARS(value: number, opts?: { decimales?: boolean }) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: opts?.decimales ? 2 : 0,
    maximumFractionDigits: opts?.decimales ? 2 : 0,
  }).format(value);
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
