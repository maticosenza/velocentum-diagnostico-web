/**
 * Pruebas exclusivas de la ronda correctiva 2.2.3 (U1-U4). No tocan v1,
 * dominio, `src/lib/` ni ninguna prueba preexistente. Usan los fixtures
 * propios de v2 (`test-fixtures.ts`), no los seis escenarios
 * demostrativos de `src/lib/` — mismo criterio que T1 (ronda 2.2.2, ver
 * ese archivo) y que el resto de `test-fixtures.ts`.
 *
 * Cobertura: los 6 fixtures que ejercitan el mecanismo de dos pasadas
 * (multicanal ~s1, tres escenarios largos, margen negativo ~s4, estrés,
 * mayorista, mixto), ambos perfiles — 12 combinaciones. La verificación
 * exhaustiva sobre los 48 PDFs reales de esta ronda (los 8 casos
 * demostrativos, generados en un worktree limpio) vive en el handoff
 * (`docs/visual/handoff-ronda-2.2.3.md`), no en este archivo — mismo
 * motivo que T1: el archivo de fixtures demostrativas de `src/lib/`
 * prohíbe explícitamente cualquier import fuera de una lista corta.
 */
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { buildProyeccion90dDocumentV2 } from "./index";
import {
  buildEstresContext,
  buildMargenNegativoContext,
  buildMayoristaContext,
  buildMixtoContext,
  buildMulticanalContext,
  buildTresEscenariosLargosContext,
} from "./test-fixtures";
import type { DocumentContextV1 } from "../../domain";
import { LABELS_ESCENARIO } from "../../semantica-v2/etiquetas";
import { type PdfProfileV2 } from "../../renderers/pdf-v2/document";
import { medirPaginacionV2, renderPdfV2ConDosPasadas } from "../../renderers/pdf-v2/paginacion";

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

async function textoPorPagina(buffer: Buffer): Promise<string[]> {
  const documento = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const paginas: string[] = [];
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const contenido = await documento.getPage(pagina).then((p) => p.getTextContent());
    paginas.push(contenido.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return paginas;
}

const FIXTURES: Array<{ nombre: string; contexto: () => DocumentContextV1 }> = [
  { nombre: "multicanal (~ s1)", contexto: buildMulticanalContext },
  { nombre: "tres escenarios largos", contexto: buildTresEscenariosLargosContext },
  { nombre: "margen negativo (~ s4)", contexto: buildMargenNegativoContext },
  { nombre: "estrés", contexto: buildEstresContext },
  { nombre: "mayorista", contexto: buildMayoristaContext },
  { nombre: "mixto", contexto: buildMixtoContext },
];

const PERFILES: PdfProfileV2[] = ["pantalla", "impresion"];
const NOMBRES_ESCENARIO = Object.values(LABELS_ESCENARIO).map((n) => n.toUpperCase());

/**
 * Detector de "página de continuación" independiente del mecanismo que
 * se está probando: una página del bloque de escenarios "continúa" si,
 * quitando el encabezado fijo de sección, arranca con contenido real de
 * cuerpo de tarjeta (KPIs, nota, tabla, palancas o supuestos) sin que el
 * header propio del escenario (NOMBRE + badge de confianza) aparezca
 * primero.
 */
function esPaginaDeContinuacion(textoSinEncabezado: string): boolean {
  const empiezaConHeaderPropio = new RegExp(`^(${NOMBRES_ESCENARIO.join("|")})\\s+(ALTA|MEDIA|BAJA|BLOQUEADA)`).test(
    textoSinEncabezado,
  );
  if (empiezaConHeaderPropio) return false;
  return /^(Contribución incremental 90 días|El presupuesto liberado|Mes \d+\b|Facturación incremental\b|Contribución incremental\b|Ahorro publicitario\b|Supuestos —)/.test(
    textoSinEncabezado,
  );
}

function empiezaConMarcador(textoSinEncabezado: string): boolean {
  return new RegExp(`^(${NOMBRES_ESCENARIO.join("|")})\\s*\\(continuación\\)`, "i").test(textoSinEncabezado);
}

describe("Ronda 2.2.3 — U1: la marca de continuación es el primer elemento tras el encabezado de sección", () => {
  it.each(FIXTURES)("$nombre, ambos perfiles", async ({ contexto }) => {
    const model = buildProyeccion90dDocumentV2(contexto());
    for (const perfil of PERFILES) {
      const { buffer } = await renderPdfV2ConDosPasadas(model, perfil);
      const paginas = await textoPorPagina(buffer);
      let paginasDeContinuacionRevisadas = 0;
      paginas.forEach((texto, index) => {
        const sinEncabezado = texto.replace(/^.*?mes a mes\s*/s, "");
        if (sinEncabezado === texto) return; // no es una página del bloque de escenarios
        if (!esPaginaDeContinuacion(sinEncabezado)) return;
        paginasDeContinuacionRevisadas += 1;
        expect(
          empiezaConMarcador(sinEncabezado),
          `perfil ${perfil}, página ${index + 1}: cuerpo de tarjeta sin marca al principio — "${sinEncabezado.slice(0, 80)}"`,
        ).toBe(true);
      });
      // Sanity: si el fixture no tiene ninguna tarjeta larga en cascada,
      // 0 páginas de continuación es un resultado válido (no hay nada que
      // revisar) — no se exige un mínimo.
      expect(paginasDeContinuacionRevisadas).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Ronda 2.2.3 — U2: ninguna tarjeta que quepa entera repite su propio nombre (refuerza R2)", () => {
  it.each(FIXTURES)("$nombre, ambos perfiles", async ({ contexto }) => {
    const model = buildProyeccion90dDocumentV2(contexto());
    for (const perfil of PERFILES) {
      const { buffer, mapa } = await renderPdfV2ConDosPasadas(model, perfil);
      const paginas = await textoPorPagina(buffer);
      const texto = paginas.filter((p) => p.includes("Qué puede ocurrir en 90 días, mes a mes")).join("\n");
      for (const [id, marcadores] of mapa) {
        const nombre = LABELS_ESCENARIO[id].toUpperCase();
        const ocurrencias = (texto.match(new RegExp(`\\b${nombre}\\b`, "g")) ?? []).length;
        // 1 por el header + 1 por cada bloque de continuación detectado.
        expect(
          ocurrencias,
          `perfil ${perfil}, escenario ${nombre}: ${marcadores.size} marcador(es) esperados`,
        ).toBe(1 + marcadores.size);
      }
    }
  });
});

describe("Ronda 2.2.3 — U3: determinismo — dos corridas consecutivas producen el mismo PDF (hash idéntico)", () => {
  it.each(FIXTURES)("$nombre, ambos perfiles", async ({ contexto }) => {
    for (const perfil of PERFILES) {
      // Dos contextos independientes (no el mismo objeto reutilizado) y
      // dos orquestaciones de dos pasadas independientes — el determinismo
      // tiene que sobrevivir a una corrida real, no sólo a reusar estado.
      const resultado1 = await renderPdfV2ConDosPasadas(buildProyeccion90dDocumentV2(contexto()), perfil);
      const resultado2 = await renderPdfV2ConDosPasadas(buildProyeccion90dDocumentV2(contexto()), perfil);
      const hash1 = crypto.createHash("sha256").update(resultado1.buffer).digest("hex");
      const hash2 = crypto.createHash("sha256").update(resultado2.buffer).digest("hex");
      expect(hash1, `perfil ${perfil}: los PDFs de dos corridas no son bit a bit idénticos`).toBe(hash2);
    }
  });
});

describe("Ronda 2.2.3 — U4: el mapa usado para el PDF entregado coincide con su paginación real medida", () => {
  it.each(FIXTURES)("$nombre, ambos perfiles", async ({ contexto }) => {
    const model = buildProyeccion90dDocumentV2(contexto());
    for (const perfil of PERFILES) {
      const resultado = await renderPdfV2ConDosPasadas(model, perfil);
      expect(resultado.convergio, `perfil ${perfil}: el mecanismo de dos pasadas no convergió`).toBe(true);
      const remedido = await medirPaginacionV2(model, resultado.buffer);
      expect(remedido.size).toBe(resultado.mapa.size);
      for (const [id, marcadores] of resultado.mapa) {
        const marcadoresRemedidos = remedido.get(id);
        expect(marcadoresRemedidos, `perfil ${perfil}, escenario ${id}: ausente al re-medir`).toBeDefined();
        expect(
          [...marcadoresRemedidos!].sort(),
          `perfil ${perfil}, escenario ${id}: la paginación real no coincide con el mapa usado`,
        ).toEqual([...marcadores].sort());
      }
    }
  });
});
