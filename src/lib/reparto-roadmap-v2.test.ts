/**
 * BV4 · F2a ronda 3 — el reparto 30/60/90 no puede inventar una frase.
 *
 * Hermana de `textos-servicios-v2.test.ts` y con el mismo criterio: **lee el
 * documento fuente** (`docs/funcional/f2a-textos-servicios.md`) y confronta
 * contra él cada renglón que el reparto puede producir. Si alguien escribe
 * una frase nueva en el plan, la suite lo frena; si el documento cambia,
 * también, y ahí la decisión vuelve a ser humana.
 *
 * Fija además las tres reglas confirmadas por Matías (R1, R2, R3), R3
 * incluida **para las tres líneas de pauta**: la escala de Google Ads existe
 * desde que Matías aportó la sexta viñeta al documento fuente, resolviendo
 * H-4 (`docs/bv4-f2a-hallazgos-diferidos.md`). El camino importa: la ronda 3
 * se frenó antes que inventar esa frase, y la prueba de acá abajo la exige
 * viniendo del markdown, no del código.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LINEAS_V2_IDS, lineaV2, type LineaId } from "./catalogo-v2";
import { textoDeLinea } from "./textos-servicios-v2";
import {
  ETAPAS_ROADMAP_V2,
  REPARTO_ROADMAP_V2,
  SEPARADOR_RENGLON_PLAN,
  entregablesDeEtapa,
  lineasSinRenglon,
  renglonDePlan,
  type EtapaRoadmapV2,
} from "./reparto-roadmap-v2";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FUENTE = readFileSync(join(RAIZ, "docs", "funcional", "f2a-textos-servicios.md"), "utf8");

/** Todas las viñetas del documento fuente, sin pasar por el módulo de textos. */
const VINETAS_DEL_DOCUMENTO = new Set(
  FUENTE.split("\n")
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim()),
);

/** Todos los títulos de sección del documento fuente. */
const TITULOS_DEL_DOCUMENTO = new Set([...FUENTE.matchAll(/^## (.+)$/gm)].map((m) => m[1]!.trim()));

const CONTENIDO: LineaId[] = [
  "contenido_audiovisual",
  "contenido_estatico",
  "planificacion_contenido",
];
const PAUTA: LineaId[] = ["meta_ads", "google_ads", "product_ads"];

describe("ronda 3 · el reparto sale entero del documento fuente", () => {
  it("cada entregable repartido es una viñeta del documento, carácter por carácter", () => {
    for (const id of LINEAS_V2_IDS) {
      for (const etapa of ETAPAS_ROADMAP_V2) {
        for (const entregable of entregablesDeEtapa(id as LineaId, etapa)) {
          expect(VINETAS_DEL_DOCUMENTO.has(entregable)).toBe(true);
        }
      }
    }
  });

  it("cada renglón es el título de la sección del documento más sus viñetas", () => {
    for (const id of LINEAS_V2_IDS) {
      for (const etapa of ETAPAS_ROADMAP_V2) {
        const renglon = renglonDePlan(id as LineaId, etapa);
        if (renglon === null) continue;
        // Ojo con `split`: hay viñetas con dos puntos adentro ("Captura:
        // popup y formularios"), así que el corte es en el PRIMER ": ".
        const corte = renglon.indexOf(": ");
        const nombre = renglon.slice(0, corte);
        const resto = renglon.slice(corte + 2);
        expect(TITULOS_DEL_DOCUMENTO.has(nombre)).toBe(true);
        expect(nombre).toBe(lineaV2(id as LineaId).nombre);
        for (const parte of resto.split(SEPARADOR_RENGLON_PLAN)) {
          expect(VINETAS_DEL_DOCUMENTO.has(parte)).toBe(true);
        }
      }
    }
  });

  it("los índices del reparto existen: ninguna línea apunta a un entregable que no está", () => {
    for (const id of LINEAS_V2_IDS) {
      const entregables = textoDeLinea(id as LineaId)!.entregables;
      for (const etapa of ETAPAS_ROADMAP_V2) {
        for (const i of REPARTO_ROADMAP_V2[id as LineaId][etapa]) {
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(entregables.length);
        }
      }
    }
  });

  it("no se pierde nada: todo entregable de toda línea cae en alguna etapa", () => {
    for (const id of LINEAS_V2_IDS) {
      const repartidos = new Set(
        ETAPAS_ROADMAP_V2.flatMap((e) => [...REPARTO_ROADMAP_V2[id as LineaId][e]]),
      );
      const entregables = textoDeLinea(id as LineaId)!.entregables;
      expect([...repartidos].sort((a, b) => a - b)).toEqual(entregables.map((_, i) => i));
    }
  });

  it("las diez líneas están en la tabla, y nada más que las diez", () => {
    expect(Object.keys(REPARTO_ROADMAP_V2).sort()).toEqual([...LINEAS_V2_IDS].sort());
  });
});

describe("ronda 3 · las tres reglas confirmadas", () => {
  it("R1: diseño web va COMPLETO en 1-30, y no aparece después", () => {
    const entregables = textoDeLinea("diseno_web")!.entregables;
    expect(entregablesDeEtapa("diseno_web", "etapa_30")).toEqual([...entregables]);
    expect(renglonDePlan("diseno_web", "etapa_60")).toBeNull();
    expect(renglonDePlan("diseno_web", "etapa_90")).toBeNull();
  });

  it("branding también va completo en 1-30", () => {
    const entregables = textoDeLinea("branding")!.entregables;
    expect(entregablesDeEtapa("branding", "etapa_30")).toEqual([...entregables]);
    expect(renglonDePlan("branding", "etapa_60")).toBeNull();
    expect(renglonDePlan("branding", "etapa_90")).toBeNull();
  });

  it("R2: las tres líneas de contenido tienen renglón en las TRES etapas", () => {
    for (const id of CONTENIDO) {
      for (const etapa of ETAPAS_ROADMAP_V2) {
        expect(renglonDePlan(id, etapa)).not.toBeNull();
      }
    }
  });

  it("R3: las tres líneas de pauta progresan activar → optimizar → escalar", () => {
    for (const id of PAUTA) {
      for (const etapa of ETAPAS_ROADMAP_V2) {
        expect(renglonDePlan(id, etapa)).not.toBeNull();
      }
    }
  });

  it("H-4 RESUELTO: la escala de google ads sale del documento, no del código", () => {
    // La ronda 3 se frenó acá: R3 pedía escalar y el texto verbatim de Google
    // Ads no tenía ninguna viñeta de escala. La frase la aportó Matías al
    // documento fuente el 2026-09-01 —sexta viñeta— y recién entonces el
    // reparto la tomó. La prueba exige las dos cosas a la vez: que el renglón
    // exista y que su frase esté en el markdown.
    const escala = "Escala de las campañas y palabras clave con mejor rendimiento";
    expect(VINETAS_DEL_DOCUMENTO.has(escala)).toBe(true);
    expect(entregablesDeEtapa("google_ads", "etapa_90")).toEqual([escala]);
    expect(renglonDePlan("google_ads", "etapa_90")).toBe(`Google Ads: ${escala}`);
  });

  it("los únicos huecos del reparto son los declarados", () => {
    // Los únicos huecos que quedan son de R1: diseño web y branding van
    // completos en 1-30 y no reaparecen. Ninguna línea se queda sin renglón
    // por falta de texto.
    const huecos: Record<EtapaRoadmapV2, LineaId[]> = {
      etapa_30: [],
      etapa_60: ["diseno_web", "branding"],
      etapa_90: ["diseno_web", "branding"],
    };
    for (const etapa of ETAPAS_ROADMAP_V2) {
      expect(lineasSinRenglon(etapa).sort()).toEqual([...huecos[etapa]].sort());
    }
  });

  it("planificación de contenido repite su ciclo en 61-90, como dice la tabla", () => {
    // "ídem, cíclico": la lectura de resultados y el ajuste del calendario
    // son el ciclo mensual, y por eso el renglón de 31-60 vuelve en 61-90.
    // Es el único entregable repetido entre etapas de toda la tabla.
    expect(renglonDePlan("planificacion_contenido", "etapa_90")).toBe(
      renglonDePlan("planificacion_contenido", "etapa_60"),
    );

    const repetidos: string[] = [];
    for (const id of LINEAS_V2_IDS) {
      const vistos = new Set<string>();
      for (const etapa of ETAPAS_ROADMAP_V2) {
        for (const entregable of entregablesDeEtapa(id as LineaId, etapa)) {
          if (vistos.has(entregable)) repetidos.push(`${id}: ${entregable}`);
          vistos.add(entregable);
        }
      }
    }
    expect(repetidos).toEqual([
      "planificacion_contenido: Lectura de resultados y ajuste del calendario siguiente",
    ]);
  });

  it("una línea sin texto confirmado no produce renglón: no se rellena", () => {
    // Hoy las diez tienen texto; el invariante protege el día que una no.
    for (const id of LINEAS_V2_IDS) {
      if (textoDeLinea(id as LineaId) !== null) continue;
      for (const etapa of ETAPAS_ROADMAP_V2) {
        expect(renglonDePlan(id as LineaId, etapa)).toBeNull();
      }
    }
  });
});
