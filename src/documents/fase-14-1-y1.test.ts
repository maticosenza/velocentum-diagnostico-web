/**
 * Fase 14.1 — Y1: el umbral de ocupación es 50% (decisión humana, E-19
 * resuelto) y las pruebas lo verifican.
 *
 * Y2 (hash PDF interfaz vs pipeline) e Y3 (marca de continuación desde
 * el camino de la interfaz) quedan PENDIENTES — dependen de C-3
 * (mover la descarga a una función de servidor), que esta ronda no
 * implementó por el bloqueo de arquitectura reportado en el handoff
 * (`docs/fase-14/handoff-fase-14-1.md`).
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../lib/calculo-diagnostico";
import { casoSnakeStore, configuracionRegresionFase2 } from "../lib/fixtures-casos";
import { ESCENARIOS_DEMOSTRATIVOS, configuracionEscenariosDemo } from "../lib/fixtures-escenarios-demo";
import type { EscaleraPaquetesConfirmada } from "../lib/paquetes";
import { buildDocumentContext, type DocumentContextV1 } from "./domain";
import { buildMayoristaContext, buildMixtoContext } from "./templates/velocentum-v2/test-fixtures";
import {
  buildDiagnosticoDocumentV2,
  buildProyeccion90dDocumentV2,
  buildPropuestaDocumentV2,
} from "./templates/velocentum-v2";
import { renderPdfV2ConDosPasadas } from "./renderers/pdf-v2/paginacion";

describe("Y1: el umbral de ocupación es 50% (E-19 resuelto, Fase 14.1) y las pruebas lo verifican", () => {
  it("contrato-composicion-v2.md sección 5.1 declara el umbral vigente en 50%, con la decisión humana citada", async () => {
    const contrato = await readFile(
      join(__dirname, "../../docs/visual/contrato-composicion-v2.md"),
      "utf-8",
    );
    expect(contrato).toContain("Vigente desde Fase 14.1");
    expect(contrato).toContain("≥50% del alto útil, mismo umbral para pantalla e impresión");
  });

  it("auditoria-visual-2026-08-23.md registra E-19 RESUELTO, E-20 RECLASIFICADO y el nuevo E-21", async () => {
    const auditoria = await readFile(
      join(__dirname, "../../docs/visual/auditoria-visual-2026-08-23.md"),
      "utf-8",
    );
    expect(auditoria).toContain("E-19 · RESUELTO");
    expect(auditoria).toContain("E-20 · RECLASIFICADO");
    expect(auditoria).toContain("E-21 · NORMATIVO (nuevo, 2026-08-28, Fase 14.1)");
  });

  // ── Mismo método declarado que X4/analisis-e19.md (posición Y de
  // texto vía pdfjs) — barre los nueve casos de referencia y confirma,
  // con una medición propia y no sólo con la cifra ya reportada en
  // docs/fase-14/analisis-e19.md, que ninguna de las excepciones
  // documentadas en contrato-composicion-v2.md (5.8/5.8.1) supera el
  // 50% nuevo — si alguna las superara, "graduaría" de la lista, y eso
  // exigiría revisar la documentación (esta prueba lo atraparía).
  const PAGE_HEIGHT = { pantalla: 540, impresion: 841.89 } as const;
  const PAGE_PADDING_TOP = { pantalla: 84, impresion: 78 } as const;
  const PAGE_PADDING_BOTTOM = { pantalla: 48, impresion: 46 } as const;
  const FOOTER_ZONA_MAX_Y = { pantalla: 34, impresion: 53 } as const;

  function esTextoDelPie(s: string): boolean {
    const t = s.trim();
    return t === "" || t === "Velocentum" || /^[\d\s/]+$/.test(t);
  }

  async function ocupacion(
    page: { getTextContent: () => Promise<{ items: unknown[] }> },
    perfil: "pantalla" | "impresion",
  ): Promise<number> {
    const content = await page.getTextContent();
    let yMax = -Infinity;
    let yMin = Infinity;
    let hubo = false;
    for (const raw of content.items) {
      const item = raw as { str?: string; transform?: number[] };
      if (typeof item.str !== "string" || item.str.trim() === "" || !item.transform) continue;
      const y = item.transform[5]!;
      if (y < FOOTER_ZONA_MAX_Y[perfil] && esTextoDelPie(item.str)) continue;
      hubo = true;
      if (y > yMax) yMax = y;
      if (y < yMin) yMin = y;
    }
    if (!hubo) return 0;
    const usable = PAGE_HEIGHT[perfil] - PAGE_PADDING_TOP[perfil] - PAGE_PADDING_BOTTOM[perfil];
    return Math.max(0, Math.min(1, (yMax - yMin) / usable));
  }

  function esPaginaTransicionOPortada(texto: string, pagina: number): boolean {
    return pagina === 1 || texto.replace(/\s+/g, "").includes("VELOCENTUM/");
  }

  const TIPOS = ["diagnostico", "proyeccion_90d", "propuesta"] as const;
  type Tipo = (typeof TIPOS)[number];

  function modelFor(tipo: Tipo, context: DocumentContextV1) {
    return tipo === "diagnostico"
      ? buildDiagnosticoDocumentV2(context)
      : tipo === "proyeccion_90d"
        ? buildProyeccion90dDocumentV2(context)
        : buildPropuestaDocumentV2(context);
  }

  const ESCALERA_CONFIRMADA: EscaleraPaquetesConfirmada = {
    confirmado: true,
    niveles: [
      {
        id: "impulso",
        nombre: "IMPULSO",
        servicios: [
          {
            servicio: "Planificación y creación de contenido",
            unidad: "piezas_por_mes",
            cantidad: 4,
            descripcion: null,
            hallazgoIds: ["retencion_recuperacion_carrito"],
            propuestoPorSistema: true,
          },
          {
            servicio: "Meta Ads",
            unidad: "campañas_activas",
            cantidad: 2,
            descripcion: null,
            hallazgoIds: [],
            propuestoPorSistema: true,
          },
        ],
        precio: 850_000,
      },
    ],
  };

  it(
    "ninguna de las excepciones documentadas (5.8/5.8.1) supera el 50% — ninguna 'gradúa' de la lista",
    async () => {
      const casos: { id: string; contexto: (tipo: Tipo) => DocumentContextV1 }[] = [
        ...ESCENARIOS_DEMOSTRATIVOS.map((escenario) => ({
          id: escenario.id,
          contexto: (tipo: Tipo) => {
            const resultado = calcularDiagnostico(escenario.datos, configuracionEscenariosDemo);
            return buildDocumentContext({
              datos: escenario.datos,
              resultado,
              diagnostico: { id: `y1-${escenario.id}-${tipo}`, version: 1, fecha: "2026-08-28" },
              tipoDocumento: tipo,
            });
          },
        })),
        { id: "mayorista", contexto: () => buildMayoristaContext() },
        { id: "mixto", contexto: () => buildMixtoContext() },
        {
          id: "confirmada",
          contexto: (tipo: Tipo) => {
            const resultado = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2);
            return buildDocumentContext({
              datos: casoSnakeStore,
              resultado,
              diagnostico: { id: `y1-confirmada-${tipo}`, version: 1, fecha: "2026-08-28" },
              tipoDocumento: tipo,
              paquetesConfirmados: ESCALERA_CONFIRMADA,
            });
          },
        },
      ];

      // Las 16 páginas de E-20 (5.8.1) — mismas claves que X4.
      const EXCEPCIONES_E20 = new Set([
        "2-margen-alto-volumen-bajo/diagnostico/pantalla/4",
        "3-margen-fino-volumen-alto/diagnostico/pantalla/4",
        "5-todo-sano/diagnostico/pantalla/4",
        "confirmada/diagnostico/pantalla/3",
        "4-roas-bueno-margen-negativo/diagnostico/impresion/4",
        "mayorista/propuesta/impresion/3",
        "mixto/propuesta/impresion/3",
        "confirmada/diagnostico/impresion/5",
        "confirmada/propuesta/impresion/7",
        "confirmada/proyeccion_90d/impresion/4",
        "mixto/diagnostico/impresion/5",
        "mixto/proyeccion_90d/impresion/7",
        "confirmada/propuesta/impresion/6",
        "confirmada/propuesta/pantalla/6",
        "mayorista/proyeccion_90d/impresion/6",
        "mixto/proyeccion_90d/impresion/6",
      ]);
      // Las páginas "Alcance" (services, 5.8), p5 de `propuesta` en pantalla
      // e impresión — presentes en ocho de los nueve casos. Confirmado por
      // inspección directa del PDF: "4-roas-bueno-margen-negativo" no
      // genera esta página porque `context.servicios.length === 0` en su
      // variante cualitativa (`propuesta.ts`: la sección "services" no
      // renderiza ningún `<Page>` cuando no hay servicios reales, a
      // diferencia de "commercial-offer" que sí renderiza su página con
      // el aviso "Selección comercial pendiente" aun sin datos).
      const EXCEPCIONES_ALCANCE = new Set([
        "1-marketplace-fuerte-tienda-floja/propuesta/pantalla/5",
        "1-marketplace-fuerte-tienda-floja/propuesta/impresion/5",
        "2-margen-alto-volumen-bajo/propuesta/pantalla/5",
        "2-margen-alto-volumen-bajo/propuesta/impresion/5",
        "3-margen-fino-volumen-alto/propuesta/pantalla/5",
        "3-margen-fino-volumen-alto/propuesta/impresion/5",
        "5-todo-sano/propuesta/pantalla/5",
        "5-todo-sano/propuesta/impresion/5",
        "6-solo-organico/propuesta/pantalla/5",
        "6-solo-organico/propuesta/impresion/5",
        "mayorista/propuesta/pantalla/5",
        "mayorista/propuesta/impresion/5",
        "mixto/propuesta/pantalla/5",
        "mixto/propuesta/impresion/5",
        "confirmada/propuesta/pantalla/5",
        "confirmada/propuesta/impresion/5",
      ]);
      const TODAS_LAS_EXCEPCIONES = new Set([...EXCEPCIONES_E20, ...EXCEPCIONES_ALCANCE]);

      let totalEvaluable = 0;
      let totalBajo50 = 0;
      const graduadas: string[] = [];

      for (const caso of casos) {
        for (const tipo of TIPOS) {
          const context = caso.contexto(tipo);
          const model = modelFor(tipo, context);
          for (const perfil of ["pantalla", "impresion"] as const) {
            const { buffer } = await renderPdfV2ConDosPasadas(model, perfil);
            const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
            for (let p = 1; p <= pdf.numPages; p++) {
              const page = await pdf.getPage(p);
              const content = await page.getTextContent();
              const texto = content.items
                .map((i) => ("str" in i ? (i as { str: string }).str : ""))
                .join(" ");
              if (esPaginaTransicionOPortada(texto, p)) continue;
              totalEvaluable++;
              const o = await ocupacion(page, perfil);
              const clave = `${caso.id}/${tipo}/${perfil}/${p}`;
              if (o < 0.5) totalBajo50++;
              if (TODAS_LAS_EXCEPCIONES.has(clave) && o >= 0.5) {
                graduadas.push(`${clave}: ${(o * 100).toFixed(1)}%`);
              }
            }
          }
        }
      }

      expect(graduadas, JSON.stringify(graduadas)).toEqual([]);
      // Cota amplia de sanidad, no un umbral duro: confirma que el
      // barrido corre sobre el universo esperado (218 páginas de
      // contenido, coherente con docs/fase-14/analisis-e19.md sección
      // 3) sin fijar un número exacto que una prueba futura pueda
      // "romper" por una razón legítima (un caso nuevo, un documento
      // nuevo). El propósito de este test es "nada gradúa", no
      // reproducir la cifra exacta de esta ronda.
      expect(totalEvaluable).toBeGreaterThan(150);
      expect(totalBajo50).toBeGreaterThan(0);
    },
    120_000,
  );
});
