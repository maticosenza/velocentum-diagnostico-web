import type { PublishedNumber } from "../../templates/velocentum-v1";

export function formatPublishedNumber(number: PublishedNumber): string {
  if (number.format === "money") {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(number.value);
  }
  if (number.format === "percent") {
    return new Intl.NumberFormat("es-AR", {
      style: "percent",
      maximumFractionDigits: 2,
    }).format(number.value);
  }
  if (number.format === "ratio") {
    return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(number.value)}×`;
  }
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(number.value);
}

export function formatDocumentDate(value: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
