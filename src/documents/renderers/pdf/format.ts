import type { PublishedNumber } from "../../templates/velocentum-v1";

const integer = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

function numeroFormateado(value: PublishedNumber): string {
  switch (value.format) {
    case "money":
      return `$ ${integer.format(value.value)}`;
    case "percent":
      return `${decimal.format(value.value * 100)}%`;
    case "ratio":
      return `${decimal.format(value.value)}x`;
    case "number":
      return integer.format(value.value);
  }
}

/**
 * Toda cifra que dependa de una curva de adopción configurable lleva una
 * marca visible distinta de un dato observado (corrección aprobada
 * 2026-08-21, punto 5). El PDF no tiene tooltip: la marca es el símbolo †
 * agregado al número mismo; el acceso al supuesto es la lista de
 * "Supuestos" ya impresa debajo de cada tarjeta de escenario.
 */
export function formatPublishedNumber(value: PublishedNumber): string {
  const base = numeroFormateado(value);
  return value.assumptions.length > 0 ? `${base} †` : base;
}

export function labelConfidence(value: string): string {
  return value.replaceAll("_", " ").toUpperCase();
}
