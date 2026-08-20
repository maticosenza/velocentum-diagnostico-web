import type { PublishedNumber } from "../../templates/velocentum-v1";

const integer = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function formatPublishedNumber(value: PublishedNumber): string {
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

export function labelConfidence(value: string): string {
  return value.replaceAll("_", " ").toUpperCase();
}
