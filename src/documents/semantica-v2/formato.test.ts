import { describe, expect, it } from "vitest";
import { formatearNumero, formatearNumeroConSupuesto } from "./formato";

describe("formatearNumero", () => {
  it("money: sin decimales, prefijo $", () => {
    expect(formatearNumero(15000000, "money")).toBe("$ 15.000.000");
  });

  it("percent: siempre 1 decimal fijo, nunca 0 ni 2", () => {
    expect(formatearNumero(-0.07, "percent")).toBe("-7,0%");
    expect(formatearNumero(0.15, "percent")).toBe("15,0%");
    expect(formatearNumero(0.1234, "percent")).not.toMatch(/,\d\d%$/);
  });

  it("ratio: 1 decimal + signo de multiplicación ×, nunca x latino", () => {
    const texto = formatearNumero(15, "ratio");
    expect(texto).toBe("15,0×");
    expect(texto).not.toContain("x");
  });

  it("number: sin decimales", () => {
    expect(formatearNumero(1500, "number")).toBe("1.500");
  });
});

describe("formatearNumeroConSupuesto", () => {
  it("agrega † cuando hay supuestos", () => {
    expect(formatearNumeroConSupuesto(100, "money", ["curva de adopción"])).toBe("$ 100 †");
  });

  it("no agrega † sin supuestos", () => {
    expect(formatearNumeroConSupuesto(100, "money", [])).toBe("$ 100");
  });
});
