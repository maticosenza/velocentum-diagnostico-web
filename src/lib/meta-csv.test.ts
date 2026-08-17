import { describe, expect, it } from "vitest";
import { ErrorCsvMeta, leerCsvMeta } from "./meta-csv";

const CSV = [
  '"Nombre de la campaña","Nombre del conjunto de anuncios","Importe gastado (ARS)","Frecuencia","Impresiones","Clics en el enlace","Inicio del informe","Fin del informe"',
  '"C1","Conj A","100000","1.50","50000","1000","2026-07-01","2026-07-10"',
  '"C1","Conj B","98000","2.50","40000","800","2026-07-01","2026-07-10"',
  '"C2","Conj C","2000","3.00","1000","20","2026-07-01","2026-07-10"',
  '"C2","Conj D","0","1.00","0","0","2026-07-01","2026-07-10"',
].join("\n");

describe("leerCsvMeta", () => {
  it("lee conjuntos, gasto y métricas globales", () => {
    const r = leerCsvMeta(CSV);
    expect(r.conjuntos_activos).toBe(3);
    expect(r.conto_campanas).toBe(false);
    expect(r.gasto_total).toBe(200000);
    expect(r.dias).toBe(10);
    expect(r.presupuesto_diario).toBe(20000);
    expect(r.ctr_global).toBeCloseTo(2, 2);
    expect(r.conjuntos_bajo_gasto).toBe(1);
    expect(r.frecuencia_promedio).toBeCloseTo(2.01, 2);
    expect(r.advertencias).toHaveLength(0);
  });

  it("avisa cuando cuenta campañas en vez de conjuntos", () => {
    const sinConjunto = CSV.split("\n")
      .map((l) => l.split('","').filter((_, i) => i !== 1).join('","'))
      .join("\n");
    const r = leerCsvMeta(sinConjunto);
    expect(r.conto_campanas).toBe(true);
    expect(r.conjuntos_activos).toBe(2);
    expect(r.advertencias.join(" ")).toContain("campañas");
  });

  it("falla claro si no hay columna de importe gastado", () => {
    expect(() => leerCsvMeta('"Nombre de la campaña"\n"C1"')).toThrow(ErrorCsvMeta);
  });
});
