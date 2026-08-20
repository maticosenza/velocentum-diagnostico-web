import { describe, it, expect } from "vitest";
import { redondear } from "./dinero";

describe("redondeo media hacia arriba, simétrico", () => {
  it("cuatro decimales", () => {
    expect(redondear(0.38625, 4)).toBe(0.3863);
    expect(redondear(-0.38625, 4)).toBe(-0.3863);
    expect(redondear(0.123456789, 4)).toBe(0.1235);
    expect(redondear(0.00005, 4)).toBe(0.0001);
  });

  it("dos decimales", () => {
    expect(redondear(1.005, 2)).toBe(1.01);
    expect(redondear(-1.005, 2)).toBe(-1.01);
    expect(redondear(2.675, 2)).toBe(2.68);
    expect(redondear(1.0049999, 2)).toBe(1.0);
  });

  it("sin decimales", () => {
    expect(redondear(2.5, 0)).toBe(3);
    expect(redondear(-2.5, 0)).toBe(-3);
    expect(redondear(0.5, 0)).toBe(1);
    expect(redondear(-0.5, 0)).toBe(-1);
    expect(redondear(999999999.5, 0)).toBe(1000000000);
    expect(redondear(1234567890123.5, 0)).toBe(1234567890124);
  });

  it("casos degenerados devuelven null", () => {
    expect(redondear(null, 2)).toBeNull();
    expect(redondear(undefined, 2)).toBeNull();
    expect(redondear(NaN, 2)).toBeNull();
    expect(redondear(Infinity, 2)).toBeNull();
    expect(redondear(-Infinity, 2)).toBeNull();
  });

  it("notación exponencial y ceros", () => {
    expect(redondear(1e-7, 4)).toBe(0);
    expect(redondear(0, 4)).toBe(0);
    expect(redondear(1.5e3, 0)).toBe(1500);
  });
});
