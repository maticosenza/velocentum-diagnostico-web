/**
 * LOOP NOCTURNO, bloque 1 (2026-08-22): genera (u opcionalmente persiste)
 * los 36 PDFs de revisión de los seis escenarios demostrativos —
 * diagnóstico, proyección a 90 días y propuesta, en pantalla e impresión,
 * por escenario. Sólo escribe a disco si se define
 * `VELOCENTUM_ESCENARIOS_QA_DIR`; sin esa variable, igual corre y verifica
 * que los 36 documentos son PDFs válidos. Mismo criterio que el resto de
 * las pruebas de QA opcional de este archivo hermano
 * (`document.test.tsx`).
 */
import { renderToBuffer } from "@react-pdf/renderer";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDiagnosticoDocument,
  buildProyeccion90dDocument,
  buildPropuestaDocument,
} from "../../templates/velocentum-v1";
import { createPdfDocumentElement, type PdfProfile } from "./document";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import {
  ESCENARIOS_DEMOSTRATIVOS,
  configuracionEscenariosDemo,
} from "../../../lib/fixtures-escenarios-demo";
import { buildDocumentContext } from "../../domain";

const TIPOS = ["diagnostico", "proyeccion_90d", "propuesta"] as const;

describe("PDFs de revisión de los seis escenarios demostrativos", () => {
  it("genera diagnóstico, proyección y propuesta en pantalla e impresión para los seis escenarios (36 PDFs)", async () => {
    const qaDir = process.env["VELOCENTUM_ESCENARIOS_QA_DIR"];
    let generados = 0;

    for (const escenario of ESCENARIOS_DEMOSTRATIVOS) {
      const resultado = calcularDiagnostico(escenario.datos, configuracionEscenariosDemo);

      for (const tipo of TIPOS) {
        const contexto = buildDocumentContext({
          datos: escenario.datos,
          resultado,
          diagnostico: { id: `demo-${escenario.id}-${tipo}`, version: 1, fecha: "2026-08-22" },
          tipoDocumento: tipo,
        });
        const model =
          tipo === "diagnostico"
            ? buildDiagnosticoDocument(contexto)
            : tipo === "proyeccion_90d"
              ? buildProyeccion90dDocument(contexto)
              : buildPropuestaDocument(contexto);

        for (const profile of ["pantalla", "impresion"] as PdfProfile[]) {
          const buffer = await renderToBuffer(createPdfDocumentElement(model, profile));
          expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
          expect(buffer.byteLength).toBeGreaterThan(3_000);
          generados++;

          if (qaDir) {
            const archivo = join(qaDir, escenario.id, `${tipo}-${profile}.pdf`);
            await mkdir(dirname(archivo), { recursive: true });
            await writeFile(archivo, buffer);
          }
        }
      }
    }

    expect(generados).toBe(ESCENARIOS_DEMOSTRATIVOS.length * TIPOS.length * 2);
  });
});
