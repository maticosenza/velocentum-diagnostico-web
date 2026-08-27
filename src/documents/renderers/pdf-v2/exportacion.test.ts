import { describe, expect, it } from "vitest";
import { buildDiagnosticoDocumentV2 } from "../../templates/velocentum-v2/diagnostico";
import { buildPropuestaDocumentV2 } from "../../templates/velocentum-v2/propuesta";
import { buildMulticanalContext } from "../../templates/velocentum-v2/test-fixtures";
import {
  MENSAJE_EXPORTACION_BLOQUEADA_V2,
  exportarDocumentModelV2,
  verificarExportacionPermitidaV2,
} from "./exportacion";

describe("D1/C-04: bloqueo de exportación v2 (S10, testeable sin UI)", () => {
  it("bloquea una propuesta sin selección comercial confirmada", () => {
    const context = { ...buildMulticanalContext(), comercial: null };
    const model = buildPropuestaDocumentV2(context);

    expect(() => verificarExportacionPermitidaV2(model)).toThrowError(
      MENSAJE_EXPORTACION_BLOQUEADA_V2,
    );
  });

  it("permite exportar una propuesta con selección comercial confirmada", () => {
    const context = buildMulticanalContext();
    const model = buildPropuestaDocumentV2(context);

    expect(() => verificarExportacionPermitidaV2(model)).not.toThrow();
  });

  it("nunca bloquea un diagnóstico, aunque no tenga selección comercial (D1 sólo aplica a propuesta)", () => {
    const context = { ...buildMulticanalContext(), comercial: null };
    const model = buildDiagnosticoDocumentV2(context);

    expect(() => verificarExportacionPermitidaV2(model)).not.toThrow();
  });

  it("S10: invocando exportarDocumentModelV2 DIRECTAMENTE (sin pasar por la interfaz), sin selección confirmada, lanza antes de renderizar nada", async () => {
    const context = { ...buildMulticanalContext(), comercial: null };
    const model = buildPropuestaDocumentV2(context);

    await expect(exportarDocumentModelV2(model, "pantalla")).rejects.toThrow(
      MENSAJE_EXPORTACION_BLOQUEADA_V2,
    );
  });

  it("S11: con selección comercial confirmada, exportarDocumentModelV2 procede y produce un PDF real", async () => {
    const context = buildMulticanalContext();
    const model = buildPropuestaDocumentV2(context);

    const resultado = await exportarDocumentModelV2(model, "pantalla");
    expect(resultado.buffer.length).toBeGreaterThan(0);
    // Firma de un PDF real (%PDF-), no un buffer vacío o basura.
    expect(resultado.buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  }, 20_000);
});
