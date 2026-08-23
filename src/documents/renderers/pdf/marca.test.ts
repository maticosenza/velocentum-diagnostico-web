/**
 * Los paths hardcodeados en `marca.tsx` (react-pdf no puede leer un .svg de
 * archivo de forma confiable en este entorno) deben ser EXACTAMENTE los
 * mismos que los SVG fuente en `src/assets/marca/`: nunca redibujados, sólo
 * copiados. Esta prueba lee los SVG reales y compara cada `d`/`transform`
 * contra las constantes usadas para renderizar.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SIMBOLO_PATHS, WORDMARK_LETRAS } from "./marca";

const RAIZ_ASSETS = join(__dirname, "../../../assets/marca");

function extraerPaths(svgPath: string): { d: string; transform: string | null }[] {
  const contenido = readFileSync(svgPath, "utf-8");
  const paths: { d: string; transform: string | null }[] = [];
  const regex = /<path\b[^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(contenido))) {
    const tag = match[0];
    const d = /\sd="([^"]+)"/.exec(tag)?.[1];
    const transform = /\stransform="([^"]+)"/.exec(tag)?.[1] ?? null;
    if (d) paths.push({ d, transform });
  }
  return paths;
}

describe("marca.tsx: los paths hardcodeados coinciden exactamente con los SVG fuente", () => {
  it("símbolo (simbolo-violeta.svg): mismos dos paths, mismo orden", () => {
    const paths = extraerPaths(join(RAIZ_ASSETS, "simbolo-violeta.svg"));
    expect(paths.map((p) => p.d)).toEqual(SIMBOLO_PATHS);
  });

  it("símbolo blanco (simbolo-blanco.svg): mismos paths que el violeta (mismo dibujo, sólo cambia el color)", () => {
    const paths = extraerPaths(join(RAIZ_ASSETS, "simbolo-blanco.svg"));
    expect(paths.map((p) => p.d)).toEqual(SIMBOLO_PATHS);
  });

  it("wordmark violeta (wordmark-violeta.svg): mismos 10 paths con su transform, mismo orden", () => {
    const paths = extraerPaths(join(RAIZ_ASSETS, "wordmark-violeta.svg"));
    expect(paths).toHaveLength(10);
    expect(paths).toEqual(WORDMARK_LETRAS);
  });

  it("wordmark blanco (wordmark-blanco.svg): mismos paths que el violeta (mismo dibujo, sólo cambia el color)", () => {
    const paths = extraerPaths(join(RAIZ_ASSETS, "wordmark-blanco.svg"));
    expect(paths).toEqual(WORDMARK_LETRAS);
  });
});
