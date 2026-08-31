import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ISOTIPO_DESCARTES,
  ISOTIPO_ENCUADRES,
  ISOTIPO_GRADIENTES,
  ISOTIPO_NODOS,
  ISOTIPO_USO,
  ISOTIPO_VIEWBOX,
  type NodoIsotipo,
} from "./isotipo.generated";

/**
 * Los datos de `isotipo.generated.ts` tienen que ser EXACTAMENTE los del SVG
 * fuente: nunca redibujados, sólo transcriptos. Mismo criterio que
 * `src/documents/renderers/pdf/marca.test.ts` para el símbolo y el wordmark
 * de v1. Esta prueba lee el SVG real y compara.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const SVG = readFileSync(join(AQUI, "isotipo-approved.svg"), "utf8");

function pathsDelSvg(): string[] {
  return [...SVG.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map((m) => m[1] as string);
}
function aplanar(nodos: NodoIsotipo[], out: string[] = []): string[] {
  for (const n of nodos) {
    if (n.tipo === "g") aplanar(n.hijos, out);
    else out.push(String(n.attrs["d"]));
  }
  return out;
}

describe("isotipo.generated.ts: transcripción exacta del SVG aprobado", () => {
  it("conserva el viewBox del asset, que no es cuadrado", () => {
    expect(ISOTIPO_VIEWBOX).toBe("0 0 220 210");
    expect(SVG).toContain(`viewBox="${ISOTIPO_VIEWBOX}"`);
  });

  it("transcribe los mismos paths, en el mismo orden, salvo el que sólo lleva el filtro", () => {
    const delSvg = pathsDelSvg();
    const transcriptos = aplanar(ISOTIPO_NODOS);
    // El SVG tiene 31 paths; el primero existe únicamente para llevar
    // filter="url(#iso-glow)" y react-pdf no puede dibujar filtros.
    expect(delSvg).toHaveLength(31);
    expect(transcriptos).toHaveLength(30);
    expect(transcriptos).toEqual(delSvg.slice(1));
  });

  it("ningún path fue redibujado: cada `d` aparece literal en el archivo fuente", () => {
    for (const d of aplanar(ISOTIPO_NODOS)) expect(SVG).toContain(`d="${d}"`);
  });

  it("transcribe los seis gradientes con sus paradas exactas", () => {
    expect(ISOTIPO_GRADIENTES).toHaveLength(6);
    expect(ISOTIPO_GRADIENTES.map((g) => g.id)).toEqual([
      "iso-left-light", "iso-left-hot", "iso-right-light",
      "iso-right-hot", "iso-deep", "iso-edge",
    ]);
    for (const g of ISOTIPO_GRADIENTES) {
      expect(SVG).toContain(`id="${g.id}"`);
      expect(g.gradientUnits).toBe("userSpaceOnUse");
      for (const s of g.stops) expect(SVG).toContain(`stop-color="${s.stopColor}"`);
    }
  });

  it("deja asentado exactamente qué descartó, y por qué", () => {
    expect(ISOTIPO_DESCARTES).toHaveLength(2);
    expect(ISOTIPO_DESCARTES[0]).toContain("iso-glow");
    expect(ISOTIPO_DESCARTES[0]).toContain("no tiene primitiva de filtro");
    expect(ISOTIPO_DESCARTES[1]).toContain("sólo existe para llevar");
    // Nada más se descarta: si alguien cambia el asset y aparece otro
    // elemento no soportado, esta prueba lo detiene.
  });

  it("no arrastra ningún atributo de filtro a los datos", () => {
    expect(JSON.stringify(ISOTIPO_NODOS)).not.toContain("filter");
  });

  it("expone los dos encuadres medidos en la etapa 4.1 bis (b)", () => {
    expect(ISOTIPO_ENCUADRES.cuadrado).toBe("-4.1 -5.4 226 226");
    expect(ISOTIPO_ENCUADRES.circular).toBe("-31.1 -32.4 280 280");
  });

  it("fija el veredicto humano sobre qué encuadre va en cada superficie", () => {
    // Matías, 2026-08-31, sobre docs/bv4-f1-isotipo-test.png: encuadre B
    // (circular) para el avatar circular; encuadre A (cuadrado) para el
    // avatar cuadrado y para el favicon.
    expect(ISOTIPO_USO).toEqual({
      favicon: "cuadrado",
      avatarCuadrado: "cuadrado",
      avatarCircular: "circular",
    });
    // Cada uso apunta a un encuadre que existe de verdad.
    for (const encuadre of Object.values(ISOTIPO_USO)) {
      expect(Object.keys(ISOTIPO_ENCUADRES)).toContain(encuadre);
    }
  });

  it("no introduce ningún color de la paleta vinculante: DH-7 encapsula el asset", () => {
    const paleta = ["#FF4B8D", "#FF85B8", "#D92F6E", "#0E0E13", "#1A1A23"];
    const usados = JSON.stringify([ISOTIPO_GRADIENTES, ISOTIPO_NODOS]).toUpperCase();
    for (const hex of paleta) expect(usados).not.toContain(hex);
  });
});
