#!/usr/bin/env node
/**
 * Verificación de las fuentes commiteadas en `src/assets/fuentes/`
 * (BV4 F1, etapas 1 y 3).
 *
 * Comprueba, por archivo y con fontkit, la cobertura de los quince glyphs
 * exigidos por el contrato —`á é í ó ú ü ñ ¿ ¡ · — † × % $`—, la presencia
 * de los diez dígitos, la disponibilidad de la feature OpenType `tnum`, y si
 * la fuente es monoespaciada (en cuyo caso las cifras ya son tabulares por
 * construcción y `tnum` no hace falta).
 *
 * `fontkit` es dependencia TRANSITIVA de @react-pdf, no directa: por eso se
 * resuelve acá con `createRequire` y no se importa desde la suite de pruebas.
 *
 *   node scripts/verificar-fuentes.mjs
 */
import { createRequire } from "node:module";
import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const fontkit = require("fontkit");

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(RAIZ, "src/assets/fuentes");

const GLIFOS = [..."áéíóúüñ¿¡·—†×%$"];
const DIGITOS = [..."0123456789"];
const MUESTRA_AVANCE = [..."0123456789abcXYZ.,:-"];

function archivos(dir, salida = []) {
  for (const entrada of readdirSync(dir).sort()) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) archivos(ruta, salida);
    else if (/\.(otf|ttf|woff2)$/i.test(entrada)) salida.push(ruta);
  }
  return salida;
}

let fallas = 0;
const filas = [];
for (const ruta of archivos(ASSETS)) {
  const nombre = relative(ASSETS, ruta);
  let font;
  try {
    font = fontkit.openSync(ruta);
  } catch (error) {
    filas.push(`ERROR    ${nombre} — ${error.message}`);
    fallas += 1;
    continue;
  }
  const faltanGlifos = GLIFOS.filter((g) => !font.hasGlyphForCodePoint(g.codePointAt(0)));
  const faltanDigitos = DIGITOS.filter((g) => !font.hasGlyphForCodePoint(g.codePointAt(0)));
  const features = font.availableFeatures ?? [];
  const avances = new Set(
    MUESTRA_AVANCE.map((ch) => {
      try {
        return font.layout(ch).glyphs[0].advanceWidth;
      } catch {
        return null;
      }
    }),
  );
  const monoespaciada = avances.size === 1;
  const tabulares = features.includes("tnum") || monoespaciada;
  const ok = faltanGlifos.length === 0 && faltanDigitos.length === 0 && tabulares;
  if (!ok) fallas += 1;
  filas.push(
    [
      ok ? "ok    " : "FALLA ",
      nombre.padEnd(42),
      `glyphs=${String(font.numGlyphs).padStart(4)}`,
      faltanGlifos.length === 0 ? "15/15 glyphs" : `FALTAN ${faltanGlifos.join("")}`,
      faltanDigitos.length === 0 ? "0-9 ok" : "FALTAN DIGITOS",
      features.includes("tnum") ? "tnum" : "sin tnum",
      monoespaciada ? `monoespaciada (avance ${[...avances][0]})` : "proporcional",
    ].join("  "),
  );
}

console.log(filas.join("\n"));
console.log(`\narchivos verificados: ${filas.length} · con problemas: ${fallas}`);
process.exit(fallas === 0 ? 0 : 1);
