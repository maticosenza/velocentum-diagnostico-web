import { describe, expect, it } from "vitest";
import type { PublishedNumber } from "../../templates/velocentum-v1";
import { formatPublishedNumber } from "./format";

const value = (raw: number, format: PublishedNumber["format"]): PublishedNumber => ({
  value: raw,
  format,
  confidence: "alta",
  evidenceIds: ["fixture"],
  assumptions: [],
});

describe("PDF number formatting", () => {
  it("preserves a real zero instead of replacing it with missing data", () => {
    expect(formatPublishedNumber(value(0, "money"))).toBe("$ 0");
    expect(formatPublishedNumber(value(0, "percent"))).toBe("0,0%");
    expect(formatPublishedNumber(value(0, "ratio"))).toBe("0,0x");
  });

  it("formats only values already published by the document model", () => {
    expect(formatPublishedNumber(value(0.6375, "percent"))).toBe("63,75%");
    expect(formatPublishedNumber(value(27.8, "ratio"))).toBe("27,8x");
  });
});

describe("marca de supuesto (corrección aprobada 2026-08-21, punto 5)", () => {
  it("no marca un valor observado (sin supuestos)", () => {
    expect(formatPublishedNumber(value(1_000_000, "money"))).toBe("$ 1.000.000");
    expect(formatPublishedNumber(value(1_000_000, "money"))).not.toContain("†");
  });

  it("marca visiblemente un valor que depende de una curva de adopción, con el símbolo †", () => {
    const conSupuesto: PublishedNumber = {
      ...value(1_000_000, "money"),
      assumptions: ["rampa_escenario_conservador"],
    };
    expect(formatPublishedNumber(conSupuesto)).toBe("$ 1.000.000 †");
  });
});
