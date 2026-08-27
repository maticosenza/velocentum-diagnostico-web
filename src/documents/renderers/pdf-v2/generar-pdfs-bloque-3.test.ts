/**
 * PASO 6 (Bloque 3 Funcional): genera los 48 PDFs de revisión visual —
 * ocho casos (los seis escenarios demostrativos más mayorista y mixto),
 * tres documentos, dos perfiles, con v2 (dos pasadas). Mismo criterio
 * que el generador hermano de v1
 * (`renderers/pdf/generar-pdfs-escenarios-demo.test.ts`): sólo escribe a
 * disco si se define `VELOCENTUM_BLOQUE3_QA_DIR`, pero siempre verifica
 * que los 48 documentos son PDFs válidos.
 *
 * R-03 (2026-08-27): esta ronda de corrección agregó verificación
 * automática permanente sobre los mismos 48 documentos/329 páginas —
 * H1 (contraste de título en secciones oscuras), H2 (páginas sin
 * contenido real / anomalías de paginación), H3 (mojibake / cobertura de
 * fuente en los glifos no-ASCII usados). Generar una sola vez
 * (`beforeAll`) y compartir el resultado entre los `it()` de verificación
 * evita pagar el costo de generación más de una vez por corrida de
 * suite.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { getDocument, GlobalWorkerOptions, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildDiagnosticoDocumentV2,
  buildProyeccion90dDocumentV2,
  buildPropuestaDocumentV2,
} from "../../templates/velocentum-v2";
import { buildMayoristaContext, buildMixtoContext } from "../../templates/velocentum-v2/test-fixtures";
import { renderPdfV2ConDosPasadas } from "./paginacion";
import type { PdfProfileV2 } from "./document";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import {
  ESCENARIOS_DEMOSTRATIVOS,
  configuracionEscenariosDemo,
} from "../../../lib/fixtures-escenarios-demo";
import { buildDocumentContext, type DocumentContextV1 } from "../../domain";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

const TIPOS = ["diagnostico", "proyeccion_90d", "propuesta"] as const;
type Tipo = (typeof TIPOS)[number];
const PERFILES: PdfProfileV2[] = ["pantalla", "impresion"];

function modelFor(tipo: Tipo, context: DocumentContextV1) {
  return tipo === "diagnostico"
    ? buildDiagnosticoDocumentV2(context)
    : tipo === "proyeccion_90d"
      ? buildProyeccion90dDocumentV2(context)
      : buildPropuestaDocumentV2(context);
}

type PaginaGenerada = { caso: string; tipo: Tipo; perfil: PdfProfileV2; pagina: number; texto: string };
type DocumentoGenerado = {
  caso: string;
  tipo: Tipo;
  perfil: PdfProfileV2;
  buffer: Buffer;
  numPaginas: number;
};

const documentos: DocumentoGenerado[] = [];
const paginas: PaginaGenerada[] = [];

/**
 * `pdfjs` extrae texto con letter-spacing separado en runs irregulares
 * ("P O R Q U É"), así que toda comparación contra un literal se hace
 * sin espacios de por medio — nunca contra el string con espacios tal
 * cual aparece en el código fuente del renderer.
 */
function sinEspacios(s: string): string {
  return s.replace(/\s+/g, "");
}

/**
 * Color de relleno REAL con el que el visor pinta el primer carácter de
 * `textoObjetivo` en `pagina` — no el par de tokens del tema, el color
 * que efectivamente quedó en el stream del PDF. Camina la lista de
 * operadores (`getOperatorList`), reconstruye el texto mostrado
 * carácter por carácter (cada `showText` en este renderer trae 1-2
 * glifos) y recuerda el último `setFillRGBColor` visto antes de que el
 * texto reconstruido empiece a coincidir con `textoObjetivo` (sin
 * espacios, mismo criterio que el resto del archivo). Ver H1.4 (R-03):
 * "el check debe contemplar contraste, no sólo texto".
 */
async function colorAlMostrar(
  pagina: { getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[] }> },
  textoObjetivo: string,
): Promise<string | null> {
  const objetivo = sinEspacios(textoObjetivo);
  const opList = await pagina.getOperatorList();
  const OPS_POR_CODIGO: Record<number, string> = {};
  for (const [nombre, codigo] of Object.entries(OPS)) OPS_POR_CODIGO[codigo as number] = nombre;

  let colorActual: string | null = null;
  let acumulado = "";
  for (let i = 0; i < opList.fnArray.length; i++) {
    const nombre = OPS_POR_CODIGO[opList.fnArray[i]!];
    const args = opList.argsArray[i];
    if (nombre === "setFillRGBColor" && Array.isArray(args) && typeof args[0] === "string") {
      colorActual = args[0];
    }
    if (nombre === "showText" && Array.isArray(args) && Array.isArray(args[0])) {
      const antes = acumulado.length;
      for (const glifo of args[0]) {
        if (glifo && typeof glifo === "object" && typeof glifo.unicode === "string") {
          acumulado += glifo.unicode;
        }
      }
      const acumuladoSinEspacios = sinEspacios(acumulado);
      const antesSinEspacios = sinEspacios(acumulado.slice(0, antes));
      if (acumuladoSinEspacios.includes(objetivo) && !antesSinEspacios.includes(objetivo)) {
        return colorActual;
      }
    }
  }
  return null;
}

/** WCAG 2.x: luminancia relativa + ratio de contraste, self-contained. */
function luminanciaRelativa(hex: string): number {
  const limpio = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(limpio.substring(i, i + 2), 16) / 255);
  const canal = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * canal(r!) + 0.7152 * canal(g!) + 0.0722 * canal(b!);
}
function ratioContraste(a: string, b: string): number {
  const [l1, l2] = [luminanciaRelativa(a), luminanciaRelativa(b)];
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

describe("PDFs de revisión de los ocho casos (Bloque 3 Funcional, v2)", () => {
  beforeAll(async () => {
    const qaDir = process.env["VELOCENTUM_BLOQUE3_QA_DIR"];

    const casos: { id: string; contexto: (tipo: Tipo) => DocumentContextV1 }[] = [
      ...ESCENARIOS_DEMOSTRATIVOS.map((escenario) => ({
        id: escenario.id,
        contexto: (tipo: Tipo) => {
          const resultado = calcularDiagnostico(escenario.datos, configuracionEscenariosDemo);
          return buildDocumentContext({
            datos: escenario.datos,
            resultado,
            diagnostico: { id: `demo-${escenario.id}-${tipo}`, version: 1, fecha: "2026-08-27" },
            tipoDocumento: tipo,
          });
        },
      })),
      { id: "mayorista", contexto: () => buildMayoristaContext() },
      { id: "mixto", contexto: () => buildMixtoContext() },
    ];

    for (const caso of casos) {
      for (const tipo of TIPOS) {
        const context = caso.contexto(tipo);
        const model = modelFor(tipo, context);

        for (const perfil of PERFILES) {
          const { buffer } = await renderPdfV2ConDosPasadas(model, perfil);
          documentos.push({ caso: caso.id, tipo, perfil, buffer, numPaginas: 0 });

          if (qaDir) {
            const archivo = join(qaDir, caso.id, `${tipo}-${perfil}.pdf`);
            await mkdir(dirname(archivo), { recursive: true });
            await writeFile(archivo, buffer);
          }
        }
      }
    }

    // Segunda pasada: extraer texto de cada página (pdfjs), una sola vez,
    // reutilizado por todas las verificaciones de abajo.
    for (const doc of documentos) {
      const pdf = await getDocument({ data: new Uint8Array(doc.buffer) }).promise;
      doc.numPaginas = pdf.numPages;
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const texto = content.items.map((i) => ("str" in i ? i.str : "")).join(" ");
        paginas.push({ caso: doc.caso, tipo: doc.tipo, perfil: doc.perfil, pagina: p, texto });
      }
    }
  }, 180_000);

  it("genera diagnóstico, proyección y propuesta en pantalla e impresión para los ocho casos (48 PDFs válidos)", () => {
    expect(documentos.length).toBe(8 * TIPOS.length * 2);
    for (const doc of documentos) {
      expect(doc.buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
      expect(doc.buffer.byteLength).toBeGreaterThan(3_000);
    }
  });

  // ── H3 (R-03): mojibake / cobertura de fuente ──────────────────────
  describe("H3 — cero mojibake en los 329 páginas reales", () => {
    // Símbolos no-ASCII que el propio código de pdf-v2 usa a propósito
    // (`grep` real sobre el árbol, no una lista inventada) — cualquier
    // OTRO carácter no-ASCII fuera de la prosa española normal es
    // sospechoso.
    const SIMBOLOS_ESPERADOS = ["■", "→", "●", "†", "×", "▲", "▽", "✓", "·"];
    const PROSA_PERMITIDA = /[\x00-\x7F áéíóúñÁÉÍÓÚÑüÜ¿¡—–''""€]/;

    it("ningún carácter fuera de la prosa española y los símbolos esperados aparece en ninguna página", () => {
      const sospechosos: { caso: string; tipo: string; perfil: string; pagina: number; char: string }[] = [];
      for (const p of paginas) {
        for (const ch of p.texto) {
          if (
            ch.charCodeAt(0) > 127 &&
            !PROSA_PERMITIDA.test(ch) &&
            !SIMBOLOS_ESPERADOS.includes(ch)
          ) {
            sospechosos.push({ caso: p.caso, tipo: p.tipo, perfil: p.perfil, pagina: p.pagina, char: ch });
          }
        }
      }
      expect(sospechosos, JSON.stringify(sospechosos.slice(0, 10))).toEqual([]);
    });

    it("el glifo roto conocido (Æ, U+00C6) nunca aparece — regresión directa del hallazgo H3", () => {
      const conAe = paginas.filter((p) => p.texto.includes("Æ"));
      expect(conAe, JSON.stringify(conAe.map((p) => `${p.caso}/${p.tipo}/${p.perfil} p${p.pagina}`))).toEqual([]);
    });

    it("cada símbolo esperado aparece al menos una vez en el set real (evita un falso verde por lista vacía)", () => {
      const texto = paginas.map((p) => p.texto).join("");
      for (const simbolo of SIMBOLOS_ESPERADOS) {
        expect(texto.includes(simbolo), `símbolo esperado ausente: ${simbolo}`).toBe(true);
      }
    });
  });

  // ── H2 (R-03): páginas sin contenido real / anomalías de paginación ─
  describe("H2 — ninguna página queda sin contenido real más allá del header", () => {
    // Un header ("eyebrow" + título de sección) más pie de página ronda
    // sólo header+pie ronda 80-100 caracteres (verificado reproduciendo
    // el hallazgo H2 real: la página vacía encontrada en el caso 1 medía
    // ~90-100). El contenido real MÁS corto observado en los 329 páginas
    // reales (un solo servicio o un solo nivel comercial) ronda 130-145.
    // 115 separa ambos con margen sin acoplarse a un caso puntual.
    const UMBRAL_MINIMO = 115;

    it("ninguna página de contenido (no portada/transición) cae bajo el umbral mínimo de texto", () => {
      const sospechosas = paginas.filter((p) => {
        if (p.pagina === 1) return false; // portada, corta por diseño
        // Transición/próximo paso son intencionalmente breves. `pdfjs`
        // extrae el texto con letter-spacing separado en runs
        // irregulares ("V E LO C E N T U M / S I G U I E N T E"), así
        // que se compara sin espacios en vez de buscar el substring literal.
        if (sinEspacios(p.texto).includes("VELOCENTUM/")) return false;
        return p.texto.trim().length < UMBRAL_MINIMO;
      });
      expect(
        sospechosas,
        JSON.stringify(sospechosas.map((p) => `${p.caso}/${p.tipo}/${p.perfil} p${p.pagina}: "${p.texto.trim()}"`)),
      ).toEqual([]);
    });

    it("diagnóstico: impresión nunca tiene MÁS páginas que pantalla (impresión apila, nunca expande)", () => {
      const porCaso = new Map<string, { pantalla?: number; impresion?: number }>();
      for (const doc of documentos) {
        if (doc.tipo !== "diagnostico") continue;
        const entry = porCaso.get(doc.caso) ?? {};
        entry[doc.perfil] = doc.numPaginas;
        porCaso.set(doc.caso, entry);
      }
      const anomalias: string[] = [];
      for (const [caso, { pantalla, impresion }] of porCaso) {
        if (pantalla === undefined || impresion === undefined) continue;
        if (impresion > pantalla) {
          anomalias.push(`${caso}: pantalla=${pantalla}, impresion=${impresion}`);
        }
      }
      expect(anomalias).toEqual([]);
    });
  });

  // ── H1 (R-03): presencia Y contraste REAL (color efectivamente
  // renderizado, no sólo el par de tokens del tema) del título en
  // secciones oscuras.
  describe("H1 — título de sección oscura: presente y con contraste real", () => {
    async function colorDelTitulo(caso: string, textoTitulo: string, textoEyebrow: string) {
      const doc = documentos.find(
        (d) => d.caso === caso && d.tipo === "propuesta" && d.perfil === "pantalla",
      )!;
      const pagina = paginas.find(
        (p) =>
          p.caso === caso &&
          p.tipo === "propuesta" &&
          p.perfil === "pantalla" &&
          sinEspacios(p.texto).includes(sinEspacios(textoEyebrow)),
      );
      expect(pagina, `no se encontró la página con eyebrow "${textoEyebrow}"`).toBeDefined();
      const pdf = await getDocument({ data: new Uint8Array(doc.buffer) }).promise;
      const page = await pdf.getPage(pagina!.pagina);
      return colorAlMostrar(page, textoTitulo);
    }

    it("caso normal: el título 'Contribución incremental proyectada' se pinta con el color claro (titleDark), no con ink", async () => {
      const color = await colorDelTitulo(
        "1-marketplace-fuerte-tienda-floja",
        "Contribución incremental proyectada",
        "LO QUE IMPORTA",
      );
      expect(color, "no se encontró el color de relleno para el título").not.toBeNull();
      // `#0d0b2d` es `theme.colors.ink` — el bug exacto de H1 (título
      // invisible) era usar este color sobre fondo también `ink`.
      expect(color?.toLowerCase()).not.toBe("#0d0b2d");
      const ratio = ratioContraste(color!, "#0d0b2d");
      expect(ratio, `contraste insuficiente: ${color} sobre #0d0b2d (fondo oscuro real de la sección)`).toBeGreaterThanOrEqual(3);
    });

    it("caso DHB-2 (margen negativo): el título 'Margen negativo: foco en la causa raíz' se pinta con el color claro, no con ink", async () => {
      const color = await colorDelTitulo(
        "4-roas-bueno-margen-negativo",
        "Margen negativo: foco en la causa raíz",
        "POR QUÉ NO PROYECTAMOS",
      );
      expect(color, "no se encontró el color de relleno para el título").not.toBeNull();
      expect(color?.toLowerCase()).not.toBe("#0d0b2d");
      const ratio = ratioContraste(color!, "#0d0b2d");
      expect(ratio, `contraste insuficiente: ${color} sobre #0d0b2d (fondo oscuro real de la sección)`).toBeGreaterThanOrEqual(3);
    });

    it("el cuerpo de la alerta DHB-2 también está presente y no repite el titular ausente (H1.6)", () => {
      const paginaAlerta = paginas.find(
        (p) =>
          p.caso === "4-roas-bueno-margen-negativo" &&
          p.tipo === "propuesta" &&
          p.perfil === "pantalla" &&
          sinEspacios(p.texto).includes("PORQUÉNOPROYECTAMOS"),
      );
      expect(paginaAlerta).toBeDefined();
      expect(sinEspacios(paginaAlerta!.texto)).toContain(sinEspacios("Margen negativo: foco en la causa raíz"));
      expect(sinEspacios(paginaAlerta!.texto)).toContain(sinEspacios("Alerta: Margen de contribución negativo"));
    });
  });
});
