import { describe, expect, it } from "vitest";
import { etiqueta, GUION, numero, pct, pesos } from "./vista-diagnostico";

const LISTA = [
  { value: "tiendanube", label: "Tiendanube" },
  { value: "shopify", label: "Shopify" },
];

describe("etiqueta", () => {
  it("resuelve el label conocido de la lista", () => {
    expect(etiqueta(LISTA, "shopify")).toBe("Shopify");
  });

  it("devuelve el valor crudo si no está en la lista, sin inventar un label", () => {
    expect(etiqueta(LISTA, "vtex")).toBe("vtex");
  });

  it("devuelve null para valores vacíos, sin convertirlos en guión", () => {
    expect(etiqueta(LISTA, null)).toBeNull();
    expect(etiqueta(LISTA, undefined)).toBeNull();
    expect(etiqueta(LISTA, "")).toBeNull();
  });
});

describe("pesos", () => {
  it("formatea un número finito en ARS", () => {
    expect(pesos(125_000)).toContain("125.000");
  });

  it("un cero real se formatea como cero, no como guión", () => {
    expect(pesos(0)).not.toBe(GUION);
  });

  it("ausente o no finito se muestra como guión", () => {
    expect(pesos(null)).toBe(GUION);
    expect(pesos(undefined)).toBe(GUION);
    expect(pesos(NaN)).toBe(GUION);
    expect(pesos(Infinity)).toBe(GUION);
  });
});

describe("numero", () => {
  it("formatea con la cantidad de decimales pedida", () => {
    expect(numero(3.14159, 2)).toBe("3,14");
  });

  it("ausente o no finito se muestra como guión", () => {
    expect(numero(null)).toBe(GUION);
    expect(numero(NaN)).toBe(GUION);
  });
});

describe("pct", () => {
  it("convierte una tasa (0-1) a porcentaje formateado", () => {
    expect(pct(0.1834, 1)).toBe("18,3 %");
  });

  it("un cero real se formatea como 0%, no como guión", () => {
    expect(pct(0)).not.toBe(GUION);
  });

  it("ausente o no finito se muestra como guión", () => {
    expect(pct(null)).toBe(GUION);
    expect(pct(undefined)).toBe(GUION);
    expect(pct(NaN)).toBe(GUION);
  });
});
