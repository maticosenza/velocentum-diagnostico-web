#!/usr/bin/env node
/**
 * Genera los archivos `*-datos.generated.ts` de `src/documents/theme/fuentes/`
 * a partir de los archivos de fuente de `src/assets/fuentes/`.
 *
 * Existe desde BV4 F1 etapa 3 (2026-08-31). Los archivos generados de Satoshi
 * e Inter (2026-08-22) declaran en su cabecera "regenerar con el mismo script
 * que produjo este archivo", pero ese script nunca se commiteó. Éste lo
 * reemplaza y produce el mismo formato, así que la salida vuelve a ser
 * auditable y reproducible.
 *
 * Determinista por construcción: la salida depende únicamente de los bytes de
 * los archivos de entrada y del orden declarado acá. Dos corridas seguidas
 * producen archivos con el mismo hash.
 *
 *   node scripts/generar-datos-fuente.mjs            # escribe
 *   node scripts/generar-datos-fuente.mjs --verificar # no escribe; sale 1 si difiere
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(RAIZ, "src/assets/fuentes");
const DESTINO = join(RAIZ, "src/documents/theme/fuentes");

const MIME = { otf: "font/otf", ttf: "font/ttf" };

/** Cada familia: constante exportada, archivo de salida y sus pesos en orden. */
const FAMILIAS = [
  {
    constante: "GEIST_MONO_DATA_URIS",
    salida: "geist-mono-datos.generated.ts",
    archivos: [
      ["400-normal", "geist-mono/otf/GeistMono-Regular.otf"],
      ["500-normal", "geist-mono/otf/GeistMono-Medium.otf"],
      ["600-normal", "geist-mono/otf/GeistMono-SemiBold.otf"],
      ["700-normal", "geist-mono/otf/GeistMono-Bold.otf"],
    ],
  },
];

const CABECERA = `/**
 * Generado automáticamente a partir de los archivos de fuente en
 * src/assets/fuentes/ por \`scripts/generar-datos-fuente.mjs\`. No editar a
 * mano: si cambian los archivos de fuente, volver a correr el script.
 * Data URI en base64: cero dependencia de filesystem o red en runtime
 * (necesario para el entorno de despliegue serverless/edge).
 */
`;

function generar(familia) {
  const lineas = familia.archivos.map(([clave, relativo]) => {
    const ruta = join(ASSETS, relativo);
    if (!existsSync(ruta)) throw new Error(`Falta el archivo de fuente: ${ruta}`);
    const ext = relativo.split(".").pop();
    const mime = MIME[ext];
    if (!mime) throw new Error(`Extensión de fuente no soportada: ${ext}`);
    const b64 = readFileSync(ruta).toString("base64");
    return `  "${clave}": "data:${mime};base64,${b64}",`;
  });
  return `${CABECERA}export const ${familia.constante} = {\n${lineas.join("\n")}\n} as const;\n`;
}

const verificar = process.argv.includes("--verificar");
let diferencias = 0;
for (const familia of FAMILIAS) {
  const contenido = generar(familia);
  const salida = join(DESTINO, familia.salida);
  if (verificar) {
    const actual = existsSync(salida) ? readFileSync(salida, "utf8") : "";
    if (actual === contenido) {
      console.log(`ok       ${familia.salida}`);
    } else {
      console.log(`DIFIERE  ${familia.salida}`);
      diferencias += 1;
    }
  } else {
    writeFileSync(salida, contenido);
    console.log(`escrito  ${familia.salida} (${contenido.length} bytes)`);
  }
}
process.exit(diferencias === 0 ? 0 : 1);
