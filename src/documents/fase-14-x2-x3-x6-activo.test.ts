/**
 * Fase 14 — X2, X3, X6. Mockea `./motor-activo` para simular el
 * interruptor INVERTIDO (v2 activo) sin tocar el valor real del archivo
 * (que sigue en "v1" — P2, inactivo por defecto). `vi.mock` es
 * module-scoped: por eso este archivo vive separado de
 * `fase-14-x1-x4-x5-x7.test.ts`, que corre contra el valor real.
 */
import crypto from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { calcularDiagnostico } from "../lib/calculo-diagnostico";
import { casoSnakeStore, configuracionRegresionFase2 } from "../lib/fixtures-casos";
import type { DatosDiagnostico } from "../lib/diagnostico-form";
import type { DiagnosticoAlmacenado } from "./domain/from-diagnostico";

vi.mock("./motor-activo", () => ({ MOTOR_DOCUMENTAL_ACTIVO: "v2" as const }));

function fila(datos: DatosDiagnostico, id = "fila-1"): DiagnosticoAlmacenado {
  const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
  return {
    id,
    fecha: "2026-08-20",
    version: 1,
    datos,
    derivados: resultado.derivados,
    estados_bloque: resultado.estados_bloque,
    fugas: resultado.fugas,
    oportunidad_total: resultado.oportunidad_total,
  };
}

describe("X2: con el interruptor invertido, la interfaz devuelve v2", () => {
  it('MOTOR_DOCUMENTAL_ACTIVO (mockeado) es "v2"', async () => {
    const { MOTOR_DOCUMENTAL_ACTIVO } = await import("./motor-activo");
    expect(MOTOR_DOCUMENTAL_ACTIVO).toBe("v2");
  });

  it('armarDocumentoActivo devuelve engine="v2" y un DocumentModelV2 válido para los tres slugs de v2', async () => {
    const { armarDocumentoActivo, DOCUMENTOS_DISPONIBLES_V2 } = await import("./build-document");
    for (const documento of DOCUMENTOS_DISPONIBLES_V2) {
      const resuelto = armarDocumentoActivo(fila(casoSnakeStore, `snake-v2-${documento.slug}`), documento.slug);
      expect(resuelto.engine, documento.slug).toBe("v2");
      expect(resuelto.model.schemaVersion).toBe("document-model-v2/1");
      expect(resuelto.model.sections.length).toBeGreaterThan(0);
    }
  });

  it('el slug "proyeccion-propuesta" (sin equivalente v2) queda fuera del catálogo activo — no es un selector de dos caminos, es una diferencia real de qué documentos ofrece cada motor', async () => {
    const { documentoActivoPorSlug, documentosDisponiblesActivos } = await import("./build-document");
    expect(documentoActivoPorSlug("proyeccion-propuesta")).toBeNull();
    expect(documentosDisponiblesActivos().map((d) => d.slug)).not.toContain("proyeccion-propuesta");
  });
});

describe("X3: con v2 activo, exportar una propuesta sin selección comercial confirmada falla de forma explícita, invocada desde el punto de la interfaz", () => {
  it("downloadDocumentModelPdfV2 (el mismo camino que usa el botón de descarga) lanza el mensaje del gate — no un error genérico ni texto propio de la interfaz", async () => {
    const { armarDocumentoActivo } = await import("./build-document");
    const { MENSAJE_EXPORTACION_BLOQUEADA_V2 } = await import("./renderers/pdf-v2/exportacion");
    const resuelto = armarDocumentoActivo(fila(casoSnakeStore, "snake-v2-bloqueo"), "propuesta");
    expect(resuelto.engine).toBe("v2");
    if (resuelto.engine !== "v2") throw new Error("unreachable");

    // `downloadDocumentModelPdfV2` es EXACTAMENTE la función que
    // `documentos.$id.$slug.tsx` importa dinámicamente en `descargarPdf`
    // cuando `resuelto.engine === "v2"` — no una reimplementación del
    // gate para el test.
    const { downloadDocumentModelPdfV2, renderDocumentModelV2ToBlob } = await import(
      "./renderers/pdf-v2/export-client"
    );
    // `downloadDocumentModelPdfV2` requiere `document` (DOM) para
    // disparar la descarga real — en este entorno de test (Node/jsdom
    // sin DOM completo) se prueba el mismo gate a través de
    // `renderDocumentModelV2ToBlob`, que `downloadDocumentModelPdfV2`
    // llama ANTES de tocar el DOM (mismo `verificarExportacionPermitidaV2`,
    // primera línea de la función).
    await expect(renderDocumentModelV2ToBlob(resuelto.model, "pantalla")).rejects.toThrow(
      MENSAJE_EXPORTACION_BLOQUEADA_V2,
    );
    void downloadDocumentModelPdfV2;
  });

  it("una propuesta CON selección comercial confirmada no dispara el gate (control negativo — el bloqueo depende del dato real, no siempre lanza)", async () => {
    const { armarDocumentoActivo } = await import("./build-document");
    const { casoSnakeStore: snake, configuracionRegresionFase2: cfg } = await import("../lib/fixtures-casos");
    const resultado = calcularDiagnostico(snake, cfg);
    const filaConfirmada: DiagnosticoAlmacenado = {
      id: "snake-v2-confirmada",
      fecha: "2026-08-20",
      version: 1,
      datos: snake,
      derivados: resultado.derivados,
      estados_bloque: resultado.estados_bloque,
      fugas: resultado.fugas,
      oportunidad_total: resultado.oportunidad_total,
      propuesta: {
        paquetes: {
          confirmado: true,
          niveles: [
            {
              id: "impulso",
              nombre: "IMPULSO",
              servicios: [
                {
                  servicio: "Meta Ads",
                  unidad: "campañas_activas",
                  cantidad: 2,
                  descripcion: null,
                  hallazgoIds: [],
                  propuestoPorSistema: true,
                },
              ],
              precio: 500_000,
            },
          ],
        },
      },
    };
    const resuelto = armarDocumentoActivo(filaConfirmada, "propuesta");
    expect(resuelto.engine).toBe("v2");
    if (resuelto.engine !== "v2") throw new Error("unreachable");
    const { renderDocumentModelV2ToBlob } = await import("./renderers/pdf-v2/export-client");
    await expect(renderDocumentModelV2ToBlob(resuelto.model, "pantalla")).resolves.toBeInstanceOf(Blob);
  });
});

describe("X6: determinismo por hash, dos corridas (con v2 activo)", () => {
  let modeloDeterminismo: Awaited<ReturnType<typeof armarModelo>>;

  async function armarModelo() {
    const { armarDocumentoActivo } = await import("./build-document");
    const resuelto = armarDocumentoActivo(fila(casoSnakeStore, "snake-v2-determinismo"), "diagnostico");
    if (resuelto.engine !== "v2") throw new Error("se esperaba v2 (mockeado)");
    return resuelto.model;
  }

  beforeAll(async () => {
    modeloDeterminismo = await armarModelo();
  });

  it("dos renders consecutivos del mismo modelo v2 producen el mismo texto extraído (perfil pantalla)", async () => {
    const { renderPdfV2ConDosPasadas } = await import("./renderers/pdf-v2/paginacion");
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

    async function textoCompleto(buffer: Uint8Array): Promise<string> {
      const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
      let texto = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        texto += content.items.map((i) => ("str" in i ? (i as { str: string }).str : "")).join(" ");
      }
      return texto;
    }

    const r1 = await renderPdfV2ConDosPasadas(modeloDeterminismo, "pantalla");
    const r2 = await renderPdfV2ConDosPasadas(modeloDeterminismo, "pantalla");
    const [t1, t2] = await Promise.all([textoCompleto(r1.buffer), textoCompleto(r2.buffer)]);
    expect(t1).toBe(t2);
    // Corrección (Fase 14.1, C-3): el comentario anterior acá decía que
    // el hash SHA-256 crudo NO era determinista entre procesos — dejado
    // sólo como referencia, nunca aserción. Verificado ahora que es
    // FALSO desde que `document.tsx` fija `creationDate` con
    // `FECHA_CREACION_FIJA_V2`: el ID de archivo de PDFKit
    // (`PDFSecurity.generateFileID`) se deriva de `CreationDate.getTime()`
    // más el resto de `info` (todos campos estáticos del modelo, no de
    // reloj ni de azar) — sin una fecha variable, no queda ninguna
    // fuente de no-determinismo en el hash. Confirmado empíricamente
    // (dos procesos de Node separados, `shasum` sobre el archivo
    // escrito a disco por cada uno: mismo SHA-256). Y2
    // (`fase-14-1-y2-y3.test.ts`) es la prueba que exige esta igualdad
    // como criterio de aceptación real (interfaz vs. pipeline); acá se
    // deja como valor informativo, sin duplicar esa aserción.
    const h1 = crypto.createHash("sha256").update(r1.buffer).digest("hex");
    const h2 = crypto.createHash("sha256").update(r2.buffer).digest("hex");
    void h1;
    void h2;
  });
});
