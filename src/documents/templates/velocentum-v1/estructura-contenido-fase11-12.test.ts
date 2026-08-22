/**
 * Fase 11/12 (estructura de contenido, 2026-08-22): invariantes de la
 * reestructuración de secciones del diagnóstico y la proyección. No prueba
 * diseño visual (fuera de alcance de este bloque) — sólo que los datos se
 * particionan y filtran correctamente entre las nuevas secciones.
 */
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import {
  casoSnakeStore,
  casoSnakeStoreCoberturaCompleta,
  casoTitanWebB1,
  configuracionRegresionFase2,
} from "../../../lib/fixtures-casos";
import type { DatosDiagnostico } from "../../../lib/diagnostico-form";
import { buildDocumentContext } from "../../domain";
import { buildDiagnosticoDocument } from "./diagnostico";
import { buildProyeccion90dDocument } from "./proyeccion-90d";
import type { DocumentBlock, DocumentModel } from "./types";

function contexto(datos: DatosDiagnostico, tipoDocumento: "diagnostico" | "proyeccion_90d") {
  const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
  return buildDocumentContext({
    datos,
    resultado,
    diagnostico: { id: `estructura-${datos.nombre_tienda}`, version: 1, fecha: "2026-08-22" },
    tipoDocumento,
  });
}

function bloquesDe<T extends DocumentBlock["type"]>(
  model: DocumentModel,
  type: T,
): Array<Extract<DocumentBlock, { type: T }>> {
  return model.sections
    .flatMap((s) => s.blocks)
    .filter((b): b is Extract<DocumentBlock, { type: T }> => b.type === type);
}

const casoConOportunidad: DatosDiagnostico = {
  ...casoSnakeStoreCoberturaCompleta,
  facturacion_mensual: 22_522_600,
  visitas_mensuales: 5000,
  agregados_carrito: 1000,
  checkouts_iniciados: 300,
  absorbe_costo_envio: true,
};

/** Mix de canales inválido (suman más de 100%): dispara bloquea:["...","escalamiento"]. */
const casoConMixInvalido: DatosDiagnostico = {
  ...casoSnakeStore,
  vende_mercado_libre: true,
  canal_ml_no_aplica: false,
  canal_ml_pct: 50, // + canal_tienda_pct: 100 (heredado) = 150%
};

describe("diagnóstico: nunca muestra escenarios, promesas futuras, paquete ni precio", () => {
  for (const [nombre, datos] of [
    ["Snake Store (cobertura parcial)", casoSnakeStore],
    ["Titan Web B1", casoTitanWebB1],
    ["Snake Store con oportunidad", casoConOportunidad],
  ] as const) {
    it(`${nombre}: sin bloques scenarios/commercial-summary/commercial-offer`, () => {
      const model = buildDiagnosticoDocument(contexto(datos, "diagnostico"));
      expect(bloquesDe(model, "scenarios")).toEqual([]);
      expect(bloquesDe(model, "commercial-summary")).toEqual([]);
      expect(bloquesDe(model, "commercial-offer")).toEqual([]);
    });
  }
});

describe("riesgos y contradicciones vs. datos faltantes: mismo array, particiones disjuntas", () => {
  it("Snake Store (cobertura parcial): la sección de riesgos existe y tiene al menos un ítem", () => {
    const model = buildDiagnosticoDocument(contexto(casoSnakeStore, "diagnostico"));
    const seccionRiesgos = model.sections.find((s) => s.id === "risks");
    expect(seccionRiesgos).toBeDefined();
    const items = (seccionRiesgos!.blocks[0] as Extract<DocumentBlock, { type: "restrictions" }>)
      .items;
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item.bloquea.length).toBeGreaterThan(0);
  });

  it("toda restricción del diagnóstico aparece en exactamente una de las dos secciones (riesgos o faltantes)", () => {
    for (const datos of [casoSnakeStore, casoTitanWebB1, casoConOportunidad]) {
      const model = buildDiagnosticoDocument(contexto(datos, "diagnostico"));
      const seccionRiesgos = model.sections.find((s) => s.id === "risks");
      const seccionFaltantes = model.sections.find((s) => s.id === "missing-data");
      const idsRiesgos = new Set(
        seccionRiesgos
          ? (seccionRiesgos.blocks[0] as Extract<DocumentBlock, { type: "restrictions" }>).items.map(
              (r) => r.id,
            )
          : [],
      );
      const idsFaltantes = new Set(
        seccionFaltantes
          ? (
              seccionFaltantes.blocks[0] as Extract<DocumentBlock, { type: "restrictions" }>
            ).items.map((r) => r.id)
          : [],
      );
      for (const id of idsRiesgos) expect(idsFaltantes.has(id)).toBe(false);
      for (const id of idsFaltantes) expect(idsRiesgos.has(id)).toBe(false);
    }
  });
});

describe("prioridades inmediatas ⊆ hallazgos priorizados", () => {
  for (const [nombre, datos] of [
    ["Snake Store (cobertura parcial)", casoSnakeStore],
    ["Titan Web B1", casoTitanWebB1],
    ["Snake Store con oportunidad", casoConOportunidad],
  ] as const) {
    it(`${nombre}: todo hallazgo de 'prioridades inmediatas' ya apareció en 'hallazgos priorizados', con prioridad alta`, () => {
      const model = buildDiagnosticoDocument(contexto(datos, "diagnostico"));
      const seccionHallazgos = model.sections.find((s) => s.id === "findings");
      const seccionPrioridades = model.sections.find((s) => s.id === "immediate-priorities");
      expect(seccionHallazgos).toBeDefined();
      const hallazgos = (
        seccionHallazgos!.blocks[0] as Extract<DocumentBlock, { type: "findings" }>
      ).items;
      const idsHallazgos = new Set(hallazgos.map((h) => h.id));

      if (!seccionPrioridades) {
        // Sin ningún hallazgo de prioridad alta, la sección ni siquiera existe: correcto.
        expect(hallazgos.some((h) => h.prioridad === "alta")).toBe(false);
        return;
      }
      const prioridades = (
        seccionPrioridades.blocks[0] as Extract<DocumentBlock, { type: "findings" }>
      ).items;
      expect(prioridades.length).toBeGreaterThan(0);
      for (const p of prioridades) {
        expect(idsHallazgos.has(p.id)).toBe(true);
        expect(p.prioridad).toBe("alta");
      }
    });
  }

  it("al menos uno de los tres datasets ejercita cada rama (con y sin prioridades inmediatas)", () => {
    const conSeccion = [casoSnakeStore, casoTitanWebB1, casoConOportunidad].map((datos) =>
      buildDiagnosticoDocument(contexto(datos, "diagnostico")).sections.some(
        (s) => s.id === "immediate-priorities",
      ),
    );
    expect(conSeccion).toContain(true);
    expect(conSeccion).toContain(false);
  });
});

describe("proyección: condiciones para escalar es un subconjunto de restricciones etiquetado 'escalamiento'", () => {
  it("Snake Store con mix de canales inválido (>100%): la sección existe y sólo trae restricciones con 'escalamiento'", () => {
    const model = buildProyeccion90dDocument(contexto(casoConMixInvalido, "proyeccion_90d"));
    const seccion = model.sections.find((s) => s.id === "scaling-conditions");
    expect(seccion).toBeDefined();
    const items = (seccion!.blocks[0] as Extract<DocumentBlock, { type: "restrictions" }>).items;
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item.bloquea).toContain("escalamiento");
  });

  it("sólo incluye restricciones cuyo bloquea contiene 'escalamiento', para varios datasets", () => {
    for (const datos of [casoSnakeStore, casoTitanWebB1, casoConOportunidad, casoConMixInvalido]) {
      const model = buildProyeccion90dDocument(contexto(datos, "proyeccion_90d"));
      const seccion = model.sections.find((s) => s.id === "scaling-conditions");
      if (!seccion) continue;
      const items = (seccion.blocks[0] as Extract<DocumentBlock, { type: "restrictions" }>).items;
      for (const item of items) expect(item.bloquea).toContain("escalamiento");
    }
  });
});
