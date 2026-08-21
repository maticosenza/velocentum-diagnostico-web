/**
 * Helpers puros de formato para la pantalla de detalle de diagnóstico.
 *
 * Envuelven `format.ts` con la política de "ausente o no finito se muestra
 * como guión", en vez de como cero o `NaN`, para no confundir un dato que
 * falta con un valor real.
 */

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
