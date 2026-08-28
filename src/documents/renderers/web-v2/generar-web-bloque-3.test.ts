/**
 * C-3 (Bloque Visual 3.1): genera los 54 renders web de revisión — mismos
 * nueve casos, tres documentos y dos perfiles que
 * `renderers/pdf-v2/generar-pdfs-bloque-3.test.ts` (el generador hermano
 * de PDFs), uno por cada PDF. Mismo criterio: sólo escribe a disco si se
 * define `VELOCENTUM_BLOQUE3_WEB_QA_DIR`, pero siempre verifica que los 54
 * documentos son HTML válidos con los dos perfiles presentes.
 *
 * Causa real de C-3 (web/ traía 27 en vez de 54 en la ronda anterior): el
 * ZIP anterior sólo iteró perfil "pantalla" — a diferencia del renderer
 * PDF, el renderer web es HTML continuo sin paginación real, así que
 * "impresión" sólo cambia una clase CSS (`vdoc2--impresion`, ancho A4) y
 * un par de custom properties de sombra/textura (`document-renderer.tsx`,
 * `profile`), no la composición estructural — fácil de asumir que "no
 * agrega nada" y omitirlo. Pero C-08 (`c-08-perfil-a4.test.ts`) ya prueba
 * que los dos perfiles producen HTML distinto, y el ZIP original de
 * Bloque Visual 3 prometía 54 (un render por PDF, sección 17 del
 * contrato) — se generan los 54 acá, sin excepción de perfil.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildDiagnosticoDocumentV2,
  buildProyeccion90dDocumentV2,
  buildPropuestaDocumentV2,
} from "../../templates/velocentum-v2";
import { buildMayoristaContext, buildMixtoContext } from "../../templates/velocentum-v2/test-fixtures";
import { DocumentWebRendererV2, type PerfilWebV2 } from "./document-renderer";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import { ESCENARIOS_DEMOSTRATIVOS, configuracionEscenariosDemo } from "../../../lib/fixtures-escenarios-demo";
import { casoSnakeStore, configuracionRegresionFase2 } from "../../../lib/fixtures-casos";
import type { EscaleraPaquetesConfirmada } from "../../../lib/paquetes";
import { buildDocumentContext, type DocumentContextV1 } from "../../domain";

const TIPOS = ["diagnostico", "proyeccion_90d", "propuesta"] as const;
type Tipo = (typeof TIPOS)[number];
const PERFILES: PerfilWebV2[] = ["pantalla", "impresion"];

function modelFor(tipo: Tipo, context: DocumentContextV1) {
  return tipo === "diagnostico"
    ? buildDiagnosticoDocumentV2(context)
    : tipo === "proyeccion_90d"
      ? buildProyeccion90dDocumentV2(context)
      : buildPropuestaDocumentV2(context);
}

/** Misma escalera confirmada real que usa el generador de PDFs, para el caso "confirmada". */
const ESCALERA_CONFIRMADA_SNAKE_STORE: EscaleraPaquetesConfirmada = {
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

type RenderGenerado = { caso: string; tipo: Tipo; perfil: PerfilWebV2; html: string };

const renders: RenderGenerado[] = [];

describe("Renders web de revisión de los nueve casos (Bloque Visual 3.1, v2)", () => {
  beforeAll(async () => {
    const qaDir = process.env["VELOCENTUM_BLOQUE3_WEB_QA_DIR"];
    const css = await readFile(join(__dirname, "document-renderer.css"), "utf-8");

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
      {
        id: "confirmada",
        contexto: (tipo: Tipo) => {
          const resultado = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2);
          return buildDocumentContext({
            datos: casoSnakeStore,
            resultado,
            diagnostico: { id: `confirmada-${tipo}`, version: 1, fecha: "2026-08-27" },
            tipoDocumento: tipo,
            paquetesConfirmados: ESCALERA_CONFIRMADA_SNAKE_STORE,
          });
        },
      },
    ];

    for (const caso of casos) {
      for (const tipo of TIPOS) {
        const context = caso.contexto(tipo);
        const model = modelFor(tipo, context);

        for (const perfil of PERFILES) {
          const body = renderToStaticMarkup(
            React.createElement(DocumentWebRendererV2, { model, profile: perfil }),
          );
          const html = `<!doctype html>\n<html lang="es"><head><meta charset="utf-8" />` +
            `<title>${caso.id} / ${tipo} / ${perfil}</title><style>${css}</style></head>` +
            `<body>${body}</body></html>\n`;
          renders.push({ caso: caso.id, tipo, perfil, html });

          if (qaDir) {
            const archivo = join(qaDir, caso.id, `${tipo}-${perfil}.html`);
            await mkdir(dirname(archivo), { recursive: true });
            await writeFile(archivo, html);
          }
        }
      }
    }
  }, 60_000);

  it("genera diagnóstico, proyección y propuesta en pantalla e impresión para los nueve casos (54 renders válidos)", () => {
    expect(renders.length).toBe(9 * TIPOS.length * 2);
    for (const r of renders) {
      expect(r.html).toContain("<!doctype html>");
      expect(r.html).toContain(`data-profile="${r.perfil}"`);
      expect(r.html).toContain(`vdoc2--${r.perfil}`);
      expect(r.html.length).toBeGreaterThan(2_000);
    }
  });

  it("pantalla e impresión producen HTML distinto para cada caso/documento (mismo criterio que C-08)", () => {
    const porCasoTipo = new Map<string, Partial<Record<PerfilWebV2, string>>>();
    for (const r of renders) {
      const key = `${r.caso}/${r.tipo}`;
      const entry = porCasoTipo.get(key) ?? {};
      entry[r.perfil] = r.html;
      porCasoTipo.set(key, entry);
    }
    for (const [key, { pantalla, impresion }] of porCasoTipo) {
      expect(pantalla, key).toBeDefined();
      expect(impresion, key).toBeDefined();
      expect(pantalla, key).not.toBe(impresion);
    }
  });
});
