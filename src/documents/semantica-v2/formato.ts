/**
 * Formato numérico único para los renderers v2 (PDF y web). Reemplaza la
 * doble implementación divergente de v1 (`renderers/pdf/format.ts` vs.
 * `renderers/web/format.ts` — E-14, contrato-composicion-v2.md sección 1.2):
 * percent siempre a 1 decimal fijo, ratio con el signo de multiplicación
 * "×" en vez de "x" latino, ambos renderers llaman esta misma función.
 */
import type { FormatoValorV2 } from "../templates/velocentum-v2/types";

const ENTERO = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const UN_DECIMAL_FIJO = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatearNumero(valor: number, formato: FormatoValorV2): string {
  switch (formato) {
    case "money":
      return `$ ${ENTERO.format(valor)}`;
    case "percent":
      return `${UN_DECIMAL_FIJO.format(valor * 100)}%`;
    case "ratio":
      return `${UN_DECIMAL_FIJO.format(valor)}×`;
    case "number":
      return ENTERO.format(valor);
  }
}

/**
 * Marca de supuesto (†), idéntica en PDF y web (E-13/contrato sección 1.2):
 * toda cifra con `supuestos.length > 0` la lleva, sin excepción por
 * renderer.
 */
export function formatearNumeroConSupuesto(
  valor: number,
  formato: FormatoValorV2,
  supuestos: string[],
): string {
  const base = formatearNumero(valor, formato);
  return supuestos.length > 0 ? `${base} †` : base;
}
