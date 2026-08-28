import { describe, expect, it } from "vitest";
import { esSupuesto, textoEstadoV2 } from "./estado";
import type { ValorV2 } from "../templates/velocentum-v2/types";

describe("textoEstadoV2", () => {
  it("calculado: devuelve el número formateado, nunca un texto de estado", () => {
    const valor: ValorV2 = {
      estado: "disponible",
      valor: 15000000,
      formato: "money",
      confianza: "alta",
      evidenciaIds: [],
      supuestos: [],
    };
    const resultado = textoEstadoV2(valor);
    expect(resultado.esNumero).toBe(true);
    expect(resultado.texto).toBe("$ 15.000.000");
    expect(resultado.texto).not.toContain("Sin datos");
  });

  it("retenido: copy D4 con motivo real, nunca 'Sin datos' ni 'Retenido' a secas", () => {
    const valor: ValorV2 = {
      estado: "retenido",
      formato: "money",
      motivos: ["No hay ahorro publicitario calculable con los datos actuales."],
    };
    const resultado = textoEstadoV2(valor);
    expect(resultado.esNumero).toBe(false);
    expect(resultado.texto).toBe(
      "No se muestra hasta validar: No hay ahorro publicitario calculable con los datos actuales.",
    );
    expect(resultado.texto).not.toBe("Sin datos");
    expect(resultado.texto).not.toBe("Retenido");
  });

  it("no_aplica: copy D4 exacto, motivo real como detalle separado", () => {
    const valor: ValorV2 = {
      estado: "no_aplica",
      formato: "ratio",
      motivo: "No corresponde a este canal.",
    };
    const resultado = textoEstadoV2(valor);
    expect(resultado.esNumero).toBe(false);
    expect(resultado.texto).toBe("Este cálculo no corresponde a este caso");
    expect(resultado.detalle).toBe("No corresponde a este canal.");
  });
});

describe("esSupuesto", () => {
  it("true sólo si es calculado con supuestos", () => {
    expect(
      esSupuesto({
        estado: "disponible",
        valor: 1,
        formato: "number",
        confianza: "alta",
        evidenciaIds: [],
        supuestos: ["x"],
      }),
    ).toBe(true);
    expect(
      esSupuesto({
        estado: "disponible",
        valor: 1,
        formato: "number",
        confianza: "alta",
        evidenciaIds: [],
        supuestos: [],
      }),
    ).toBe(false);
    expect(esSupuesto({ estado: "retenido", formato: "number", motivos: ["x"] })).toBe(false);
  });
});
