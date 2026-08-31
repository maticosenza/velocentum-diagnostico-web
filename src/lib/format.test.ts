/**
 * BV4 · F2a etapa 4 (F-4, aprobado por Matías el 2026-08-31): la moneda pasa
 * a ser parámetro. `formatARS` queda como envoltorio de `formatMoneda` y su
 * salida NO cambia.
 *
 * El ancla de esa afirmación es `formatARS_ANTES_DE_F2A`: una copia literal
 * de la implementación anterior, inlineada acá. Si alguien cambiara
 * `formatMoneda` de una forma que altere la salida en ARS, esta prueba lo
 * frena — y lo hace sin depender de cómo `Intl` escriba los espacios, que en
 * es-AR son duros (U+00A0) y no los que uno teclea.
 */
import { describe, expect, it } from "vitest";
import { formatARS, formatFecha, formatMoneda, formatNumero, formatPorcentaje } from "./format";

/** Copia exacta de `formatARS` tal como era antes de F2a. No se toca. */
function formatARS_ANTES_DE_F2A(value: number, opts?: { decimales?: boolean }) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: opts?.decimales ? 2 : 0,
    maximumFractionDigits: opts?.decimales ? 2 : 0,
  }).format(value);
}

const CASOS = [0, 1, 999, 1000, 1250000, 1234.56, -4500, 1e9, 0.4, -0.5];

/** Espacios dueros a espacios comunes, para poder afirmar sobre texto legible. */
const legible = (s: string) => s.replace(/ /g, " ");

describe("formatARS: salida idéntica a la de antes de F2a (ancla de la cadena v1)", () => {
  it("coincide carácter por carácter con la implementación anterior, con y sin decimales", () => {
    for (const n of CASOS) {
      expect(formatARS(n)).toBe(formatARS_ANTES_DE_F2A(n));
      expect(formatARS(n, { decimales: true })).toBe(
        formatARS_ANTES_DE_F2A(n, { decimales: true }),
      );
      expect(formatARS(n, { decimales: false })).toBe(
        formatARS_ANTES_DE_F2A(n, { decimales: false }),
      );
    }
  });

  it("sigue siendo el formato argentino de siempre", () => {
    expect(legible(formatARS(1250000))).toBe("$ 1.250.000");
    expect(legible(formatARS(1234.56))).toBe("$ 1.235");
    expect(legible(formatARS(1234.56, { decimales: true }))).toBe("$ 1.234,56");
    expect(legible(formatARS(-4500))).toBe("-$ 4.500");
  });

  it('es exactamente `formatMoneda(valor, "ARS")`', () => {
    for (const n of CASOS) {
      expect(formatARS(n)).toBe(formatMoneda(n, "ARS"));
    }
  });
});

describe("formatMoneda: Q4, la moneda es parámetro y no se infiere de nada", () => {
  it("ARS es el default, para que ningún llamador viejo cambie de salida", () => {
    for (const n of CASOS) expect(formatMoneda(n)).toBe(formatMoneda(n, "ARS"));
  });

  it("USD produce una salida distinta y reconocible", () => {
    const enUsd = formatMoneda(1250000, "USD");
    expect(enUsd).not.toBe(formatMoneda(1250000, "ARS"));
    expect(enUsd).toContain("1.250.000");
    expect(legible(enUsd)).toContain("US$");
  });

  it("la estructura numérica es la misma en las dos monedas: sólo cambia el símbolo", () => {
    const soloDigitos = (s: string) => s.replace(/[^\d.,]/g, "");
    for (const n of CASOS) {
      expect(soloDigitos(formatMoneda(n, "USD"))).toBe(soloDigitos(formatMoneda(n, "ARS")));
    }
  });

  it("los decimales funcionan igual en las dos monedas", () => {
    expect(legible(formatMoneda(1234.56, "USD", { decimales: true }))).toContain("1.234,56");
    expect(legible(formatMoneda(1234.56, "ARS", { decimales: true }))).toContain("1.234,56");
  });
});

describe("el resto de los formateadores queda intacto", () => {
  it("números y porcentajes", () => {
    expect(formatNumero(1250000)).toBe("1.250.000");
    expect(formatNumero(12.35, 1)).toBe("12,4");
    expect(legible(formatPorcentaje(12.35))).toBe("12,4 %");
  });

  it("fechas: el mismo `Intl` de siempre, sin suponer huso horario", () => {
    const fecha = new Date("2026-08-16T12:00:00Z");
    expect(formatFecha(fecha)).toBe(
      new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(fecha),
    );
  });
});
