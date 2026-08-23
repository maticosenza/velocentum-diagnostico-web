/**
 * LOOP NOCTURNO, bloque 2 (2026-08-22): prueba de punta a punta pedida
 * explícitamente — datos del formulario → cálculo → contexto documental →
 * modelo de documento → render web → render PDF. Verifica que una cifra
 * cargada en el formulario llegue idéntica al PDF final.
 *
 * Usa `pdfjs-dist` para leer el texto real de las páginas del PDF: el
 * contenido de un PDF de @react-pdf/renderer viaja comprimido
 * (FlateDecode), así que una búsqueda de texto sobre el buffer crudo no
 * encuentra nada — hace falta un extractor de texto real. `pdfjs-dist` se
 * eligió por no traer dependencias propias (a diferencia de `pdf-parse`,
 * que arrastra un binario nativo de canvas que acá no hace falta: sólo se
 * necesita `getTextContent()`, no rasterizar).
 */
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import { casoSnakeStoreCoberturaCompleta, configuracionRegresionFase2 } from "../../../lib/fixtures-casos";
import type { DatosDiagnostico } from "../../../lib/diagnostico-form";
import { buildDocumentContext } from "../../domain";
import { buildDiagnosticoDocument } from "../../templates/velocentum-v1/diagnostico";
import { DocumentWebRenderer } from "../web/document-renderer";
import { formatPublishedNumber as formatPdfNumber } from "./format";
import { createPdfDocumentElement } from "./document";
import type { PdfProfile } from "./document";
import type { DocumentBlock, DocumentModel } from "../../templates/velocentum-v1/types";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

async function textoCompletoDelPdf(buffer: Buffer): Promise<string> {
  const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let texto = "";
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const contenido = await documento.getPage(pagina).then((p) => p.getTextContent());
    texto += contenido.items.map((item) => ("str" in item ? item.str : "")).join("");
  }
  return texto;
}

function blocksOf<T extends DocumentBlock["type"]>(
  model: DocumentModel,
  type: T,
): Array<Extract<DocumentBlock, { type: T }>> {
  return model.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<DocumentBlock, { type: T }> => block.type === type);
}

describe("punta a punta: una cifra cargada en el formulario llega idéntica al PDF final", () => {
  // Facturación mensual distintiva ("cargada en el formulario"): un valor
  // que no coincide con ningún otro fixture de la suite, para que un
  // eventual acoplamiento accidental con otro caso sea imposible de ocultar.
  const FACTURACION_DEL_FORMULARIO = 24_681_357;

  const datosDelFormulario: DatosDiagnostico = {
    ...casoSnakeStoreCoberturaCompleta,
    facturacion_mensual: FACTURACION_DEL_FORMULARIO,
  };

  it("formulario → cálculo → contexto → modelo → render web → PDF: mismo número en cada etapa", async () => {
    // 1) Formulario: el dato tal cual lo cargaría el operador.
    expect(datosDelFormulario.facturacion_mensual).toBe(FACTURACION_DEL_FORMULARIO);

    // 2) Cálculo: el motor no transforma un dato de entrada declarado.
    const resultado = calcularDiagnostico(datosDelFormulario, configuracionRegresionFase2);

    // 3) Contexto documental: la evidencia conserva el valor exacto.
    const contexto = buildDocumentContext({
      datos: datosDelFormulario,
      resultado,
      diagnostico: { id: "qa-e2e-formulario-a-pdf", version: 1, fecha: "2026-08-22" },
      tipoDocumento: "diagnostico",
    });
    expect(contexto.actual.facturacion.estado).toBe("calculado");
    expect(contexto.actual.facturacion.valor).toBe(FACTURACION_DEL_FORMULARIO);

    // 4) Modelo de documento: el bloque de métricas expone la misma cifra.
    const model = buildDiagnosticoDocument(contexto);
    const metricas = blocksOf(model, "metric-grid").flatMap((b) => b.items);
    const facturacionItem = metricas.find((m) => m.id === "facturacion");
    // Presencia en metric-grid ya implica "calculado" (buildMetricGrid
    // filtra cualquier ValorPublicable que no lo esté: ver blocks.ts).
    expect(facturacionItem).toBeDefined();
    expect(facturacionItem!.value.value).toBe(FACTURACION_DEL_FORMULARIO);
    const facturacionPublicada = facturacionItem!.value;

    // 5) Render web: el valor crudo viaja intacto en el atributo `data-value`
    // (el DOM nunca formatea el número que consume el resto del pipeline).
    const html = renderToStaticMarkup(DocumentWebRenderer({ model }));
    expect(html).toContain(`data-value="${FACTURACION_DEL_FORMULARIO}"`);

    // 6) Render PDF: extraemos el texto real de la página (no el buffer
    // crudo, que está comprimido) y confirmamos que aparece formateada con
    // el MISMO formateador que usa la app en producción — no una cadena
    // armada a mano en la prueba, que podría coincidir con el bug incluido.
    const buffer = await renderToBuffer(createPdfDocumentElement(model, "impresion" as PdfProfile));
    const textoPdf = await textoCompletoDelPdf(buffer);
    const cifraEsperadaEnPdf = formatPdfNumber(facturacionPublicada);
    expect(textoPdf).toContain(cifraEsperadaEnPdf.replace(" †", ""));
    // Control negativo: si el valor viajara redondeado o truncado, esta
    // cadena (con la cifra completa, sin ningún dígito recortado) no
    // aparecería.
    expect(textoPdf).toContain("24.681.357");
  }, 20_000);

  it("la misma cifra aparece igual en el perfil pantalla y en el perfil impresión", async () => {
    const resultado = calcularDiagnostico(datosDelFormulario, configuracionRegresionFase2);
    const contexto = buildDocumentContext({
      datos: datosDelFormulario,
      resultado,
      diagnostico: { id: "qa-e2e-perfiles", version: 1, fecha: "2026-08-22" },
      tipoDocumento: "diagnostico",
    });
    const model = buildDiagnosticoDocument(contexto);

    const [pantalla, impresion] = await Promise.all([
      renderToBuffer(createPdfDocumentElement(model, "pantalla")).then(textoCompletoDelPdf),
      renderToBuffer(createPdfDocumentElement(model, "impresion")).then(textoCompletoDelPdf),
    ]);

    expect(pantalla).toContain("24.681.357");
    expect(impresion).toContain("24.681.357");
  }, 20_000);
});
