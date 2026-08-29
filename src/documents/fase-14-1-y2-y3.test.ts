/**
 * Fase 14.1 — Y2/Y3 (ítem C-3, decisión humana de Matías: dos pasadas
 * en el navegador, `docs/fase-14/investigacion-c3.md` sección 3).
 *
 * Y2 · los PDFs generados desde el punto de la interfaz
 *      (`renderDocumentModelV2ToBlob`, `export-client.ts` — la MISMA
 *      función que llama el botón "Descargar PDF") son idénticos por
 *      hash a los del pipeline de dos pasadas (`renderPdfV2ConDosPasadas`,
 *      `paginacion.ts` — la misma función que generan los 54 PDFs de los
 *      ZIPs de revisión), para Snake Store y Titan Web B1, los tres
 *      documentos, ambos perfiles.
 *
 *      Ninguno de los dos casos tiene selección comercial confirmada
 *      (mismo estado real verificado en el ítem 5 de Fase 14,
 *      `docs/fase-14/validacion-flujo-real.md` sección 4: "Propuesta:
 *      🛑 Bloqueada por el gate" para los dos) — así que "propuesta"
 *      no produce bytes que hashear: el criterio real ahí es que las
 *      DOS rutas bloqueen con el mismo mensaje, no que produzcan el
 *      mismo PDF (no hay PDF). diagnóstico y proyección 90 días sí
 *      renderizan en los dos casos, ahí se compara por hash de verdad.
 *
 * Y3 · toda página de continuación tiene su marca ("{escenario}
 *      (continuación)", `document.tsx`), también en los PDFs generados
 *      por el camino de la interfaz. Snake Store y Titan Web B1 (sin
 *      selección confirmada) no generan ninguna tarjeta de escenario
 *      larga que necesite continuación — verificado por barrido
 *      completo antes de escribir esta prueba (ningún intento > 1 en
 *      los dos casos, los 3 documentos, los 2 perfiles). Los casos con
 *      continuación real y ya documentada (E-20, grupo 6,
 *      `contrato-composicion-v2.md` sección 5.8.1) son
 *      `mayorista`/`mixto`, proyección 90 días, perfil impresión — se
 *      usan acá para tener una prueba real, no un caso vacío de
 *      antemano.
 */
import crypto from "node:crypto";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../lib/calculo-diagnostico";
import { casoSnakeStore, casoTitanWebB1, configuracionRegresionFase2 } from "../lib/fixtures-casos";
import { buildDocumentContext, type DocumentContextV1 } from "./domain";
import { buildMayoristaContext, buildMixtoContext } from "./templates/velocentum-v2/test-fixtures";
import {
  buildDiagnosticoDocumentV2,
  buildProyeccion90dDocumentV2,
  buildPropuestaDocumentV2,
} from "./templates/velocentum-v2";
import { renderPdfV2ConDosPasadas } from "./renderers/pdf-v2/paginacion";
import { renderDocumentModelV2ToBlob } from "./renderers/pdf-v2/export-client";
import { MENSAJE_EXPORTACION_BLOQUEADA_V2, exportarDocumentModelV2 } from "./renderers/pdf-v2/exportacion";

const TIPOS = ["diagnostico", "proyeccion_90d", "propuesta"] as const;
type Tipo = (typeof TIPOS)[number];
const PERFILES = ["pantalla", "impresion"] as const;

function modelFor(tipo: Tipo, context: DocumentContextV1) {
  return tipo === "diagnostico"
    ? buildDiagnosticoDocumentV2(context)
    : tipo === "proyeccion_90d"
      ? buildProyeccion90dDocumentV2(context)
      : buildPropuestaDocumentV2(context);
}

async function blobABuffer(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function sha256(buffer: Uint8Array): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

describe("Y2: PDFs de la interfaz idénticos por hash al pipeline (Snake Store, Titan Web B1)", () => {
  const CASOS = [
    { id: "Snake Store", datos: casoSnakeStore },
    { id: "Titan Web B1", datos: casoTitanWebB1 },
  ];

  it.each(
    CASOS.flatMap((caso) =>
      (["diagnostico", "proyeccion_90d"] as const).flatMap((tipo) =>
        PERFILES.map((perfil) => ({ caso: caso.id, datos: caso.datos, tipo, perfil })),
      ),
    ),
  )("$caso / $tipo / $perfil: mismo SHA-256 en interfaz y pipeline", async ({ datos, tipo, perfil }) => {
    const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
    const context = buildDocumentContext({
      datos,
      resultado,
      diagnostico: { id: `y2-${tipo}-${perfil}`, version: 1, fecha: "2026-08-28" },
      tipoDocumento: tipo,
    });
    const model = modelFor(tipo, context);

    const blobInterfaz = await renderDocumentModelV2ToBlob(model, perfil);
    const { buffer: bufferPipeline } = await renderPdfV2ConDosPasadas(model, perfil);

    const hashInterfaz = sha256(await blobABuffer(blobInterfaz));
    const hashPipeline = sha256(bufferPipeline);
    expect(hashInterfaz).toBe(hashPipeline);
  });

  it.each(CASOS.flatMap((caso) => PERFILES.map((perfil) => ({ caso: caso.id, datos: caso.datos, perfil }))))(
    "$caso / propuesta / $perfil: las dos rutas bloquean con el mismo mensaje (sin selección comercial confirmada)",
    async ({ datos, perfil }) => {
      const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
      const context = buildDocumentContext({
        datos,
        resultado,
        diagnostico: { id: `y2-propuesta-${perfil}`, version: 1, fecha: "2026-08-28" },
        tipoDocumento: "propuesta",
      });
      const model = buildPropuestaDocumentV2(context);

      // El gate (`verificarExportacionPermitidaV2`) vive en los dos
      // puntos de entrada "de exportación" — `renderDocumentModelV2ToBlob`
      // (interfaz) y `exportarDocumentModelV2` (pipeline Node, el mismo
      // que generan los 54 PDFs de los ZIPs) — no en
      // `renderPdfV2ConDosPasadas`, que es un renderer de bajo nivel sin
      // conocimiento de la regla de negocio de exportación.
      await expect(renderDocumentModelV2ToBlob(model, perfil)).rejects.toThrow(MENSAJE_EXPORTACION_BLOQUEADA_V2);
      await expect(exportarDocumentModelV2(model, perfil)).rejects.toThrow(MENSAJE_EXPORTACION_BLOQUEADA_V2);
    },
  );
});

describe("Y3: la marca de continuación aparece también en los PDFs de la interfaz", () => {
  it.each([
    { id: "mayorista", contexto: buildMayoristaContext },
    { id: "mixto", contexto: buildMixtoContext },
  ])("$id / proyección 90 días / impresión: el texto '(continuación)' está presente", async ({ contexto }) => {
    const context = contexto();
    const model = buildProyeccion90dDocumentV2(context);

    // Confirma primero que ESTE caso realmente ejercita el mecanismo de
    // dos pasadas (si esto alguna vez deja de converger en 2 intentos
    // porque el contenido cambió, la prueba de abajo dejaría de probar
    // lo que dice probar sin este chequeo).
    const pipeline = await renderPdfV2ConDosPasadas(model, "impresion");
    expect(pipeline.intentos).toBeGreaterThan(1);
    const totalMarcadores = [...pipeline.mapa.values()].reduce((acc, s) => acc + s.size, 0);
    expect(totalMarcadores).toBeGreaterThan(0);

    const blobInterfaz = await renderDocumentModelV2ToBlob(model, "impresion");
    const pdf = await getDocument({ data: await blobABuffer(blobInterfaz) }).promise;
    let textoCompleto = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      textoCompleto += content.items.map((i) => ("str" in i ? (i as { str: string }).str : "")).join(" ");
    }
    // El JSX fuente escribe "(continuación)" en minúscula
    // (`document.tsx`), pero el estilo del texto lleva `textTransform:
    // uppercase` — react-pdf hornea la transformación en los glifos
    // reales, así que el texto extraído (y lo que ve el ojo humano en
    // el PDF) es "(CONTINUACIÓN)". Confirmado leyendo el texto
    // extraído real de este caso antes de fijar esta aserción.
    expect(textoCompleto).toContain("(CONTINUACIÓN)");

    // Y2, extendido a este caso: mismo hash que el pipeline, para que
    // Y3 no quede aislada del criterio de identidad byte a byte.
    const hashInterfaz = sha256(await blobABuffer(blobInterfaz));
    const hashPipeline = sha256(pipeline.buffer);
    expect(hashInterfaz).toBe(hashPipeline);
  });
});
