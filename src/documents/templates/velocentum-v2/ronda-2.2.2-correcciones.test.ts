/**
 * Prueba exclusiva de la ronda correctiva 2.2.2 (T1 — Corrección A). No
 * toca v1, dominio, `src/lib/` ni ninguna prueba preexistente del Bloque
 * Visual 2, ronda 2.1, ronda 2.2 ni ronda 2.2.1.
 *
 * Usa los fixtures propios de v2 (`test-fixtures.ts`), no los seis
 * escenarios demostrativos de `src/lib/` (ese archivo de `src/lib/`
 * prohíbe explícitamente cualquier import fuera de una lista corta, y
 * `src/lib/` está fuera de alcance de esta ronda). Mismo criterio que el
 * resto de `test-fixtures.ts` (ver su comentario de cabecera): los
 * fixtures usados acá son análogos a los casos reales de la auditoría
 * (`buildMulticanalContext` ~ s1, `buildMargenNegativoContext` ~ s4),
 * más `buildTresEscenariosLargosContext`, `buildEstresContext`,
 * `buildMayoristaContext` y `buildMixtoContext` para cubrir variedad de
 * condiciones (con y sin `bridge-note`).
 *
 * T2 (Corrección B) NO se agrega en esta ronda: la auditoría externa
 * encontró que el marcador de continuación de una tarjeta larga en
 * cascada no siempre es el primer elemento de su página. Se investigó a
 * fondo (ver handoff de esta ronda) — un intento con el `render`-prop de
 * react-pdf reprodujo, de nuevo, la corrupción de texto ya documentada en
 * la ronda 2.2.1; un heurístico estático de altura, calibrado contra el
 * documento real de la auditoría, reprodujo esos quiebres exactamente
 * pero produjo marcadores duplicados (regresión real de D-2, detectada
 * por la prueba R1 preexistente) al validarlo contra otro contenido real
 * de esta misma ronda. Ninguna de las dos vías resultó segura dentro del
 * alcance de esta ronda (sin rediseño de la arquitectura de renderizado);
 * se revirtió al comportamiento seguro de la ronda 2.2.1 y se documenta
 * como pendiente para una ronda futura.
 */
import { createRequire } from "node:module";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import type { DocumentContextV1 } from "../../domain";
import { buildPropuestaDocumentV2 } from "./index";
import {
  buildEstresContext,
  buildMargenNegativoContext,
  buildMayoristaContext,
  buildMixtoContext,
  buildMulticanalContext,
  buildTresEscenariosLargosContext,
} from "./test-fixtures";
import { createPdfDocumentElementV2, type PdfProfileV2 } from "../../renderers/pdf-v2/document";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

async function textoCompleto(buffer: Buffer): Promise<string> {
  const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const paginas: string[] = [];
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const contenido = await documento.getPage(pagina).then((p) => p.getTextContent());
    paginas.push(contenido.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return paginas.join(" | ");
}

const CASOS: Array<{ nombre: string; contexto: () => DocumentContextV1 }> = [
  { nombre: "multicanal (~ s1)", contexto: buildMulticanalContext },
  { nombre: "margen negativo (~ s4)", contexto: buildMargenNegativoContext },
  { nombre: "tres escenarios largos", contexto: buildTresEscenariosLargosContext },
  { nombre: "estrés", contexto: buildEstresContext },
  { nombre: "mayorista", contexto: buildMayoristaContext },
  { nombre: "mixto", contexto: buildMixtoContext },
];

describe("Ronda 2.2.2 — T1 (Corrección A): la propuesta no pierde la sección de cifra principal", () => {
  it.each(CASOS)(
    "$nombre, ambos perfiles: la propuesta contiene 'Contribución incremental proyectada', y la frase puente de C-07 cuando el modelo la incluye",
    async ({ contexto }) => {
      const ctx = contexto();
      const model = buildPropuestaDocumentV2(ctx);
      const seccion = model.sections.find((s) => s.id === "commercial-summary");
      expect(seccion, "falta la sección commercial-summary en el modelo").toBeDefined();
      const tieneBridge = seccion!.blocks.some((b) => b.type === "bridge-note");
      for (const perfil of ["pantalla", "impresion"] as PdfProfileV2[]) {
        const buffer = await renderToBuffer(createPdfDocumentElementV2(model, perfil));
        const texto = await textoCompleto(buffer);
        expect(texto.includes("Contribución incremental proyectada"), `perfil ${perfil}: falta el encabezado de la sección`).toBe(
          true,
        );
        if (tieneBridge) {
          expect(
            texto.includes("son la base de la contribución incremental proyectada"),
            `perfil ${perfil}: el modelo incluye bridge-note pero la frase no aparece en el PDF`,
          ).toBe(true);
        }
      }
    },
  );
});
