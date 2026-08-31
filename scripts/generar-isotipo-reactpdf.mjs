#!/usr/bin/env node
/**
 * Genera `src/documents/theme/marca/isotipo.generated.ts` a partir de
 * `isotipo-approved.svg` — BV4 F1, etapa 5.
 *
 * react-pdf no puede leer un `.svg` de archivo de forma confiable en este
 * entorno (ver la cabecera de `src/documents/renderers/pdf/marca.tsx`), así
 * que el asset se transcribe a datos: gradientes, grupos y paths con sus
 * atributos EXACTOS, sin redibujar nada. `isotipo.test.ts` compara la salida
 * contra el SVG fuente para que nunca diverjan.
 *
 * Se descarta lo que react-pdf no puede dibujar, y el descarte queda en el
 * propio archivo generado: `@react-pdf/primitives` no tiene primitiva de
 * filtro, así que el `<filter id="iso-glow">` y el path que sólo existe para
 * llevar ese filtro no entran.
 *
 * Determinista: la salida depende sólo de los bytes del SVG.
 *
 *   node scripts/generar-isotipo-reactpdf.mjs [--verificar]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SVG = join(RAIZ, "src/documents/theme/marca/isotipo-approved.svg");
const SALIDA = join(RAIZ, "src/documents/theme/marca/isotipo.generated.ts");

function parsear(xml) {
  const limpio = xml.replace(/<\?xml[^>]*\?>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const re = /<\/?([A-Za-z][A-Za-z0-9:-]*)((?:\s+[A-Za-z_:][-A-Za-z0-9_:.]*\s*=\s*"[^"]*")*)\s*(\/?)>/g;
  const raiz = { nombre: "#raiz", attrs: {}, hijos: [] };
  const pila = [raiz];
  let m;
  while ((m = re.exec(limpio))) {
    const [todo, nombre, crudos, auto] = m;
    if (todo.startsWith("</")) { if (pila.length > 1) pila.pop(); continue; }
    const attrs = {};
    for (const a of crudos.matchAll(/([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = a[2];
    const nodo = { nombre, attrs, hijos: [] };
    pila[pila.length - 1].hijos.push(nodo);
    if (!auto) pila.push(nodo);
  }
  return raiz.hijos.find((n) => n.nombre === "svg");
}

const camel = (n) => n.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const NUM = new Set(["x1", "y1", "x2", "y2", "offset", "strokeWidth", "fillOpacity", "strokeOpacity", "stopOpacity", "opacity"]);
const descartes = [];

function atributos(nodo, indice) {
  const out = {};
  for (const [k, v] of Object.entries(nodo.attrs)) {
    if (k === "xmlns" || k === "id" || k === "width" || k === "height" || k === "viewBox") continue;
    if (k === "filter") { descartes.push(`filter="${v}" en <${nodo.nombre}> #${indice}`); continue; }
    const nombre = camel(k);
    out[nombre] = NUM.has(nombre) && /^-?[\d.]+$/.test(v) ? Number(v) : v;
  }
  return out;
}

const svg = parsear(readFileSync(SVG, "utf8"));
const defs = svg.hijos.find((n) => n.nombre === "defs");
const gradientes = defs.hijos
  .filter((n) => n.nombre === "linearGradient")
  .map((g) => ({
    id: g.attrs.id,
    ...atributos(g, g.attrs.id),
    stops: g.hijos.filter((s) => s.nombre === "stop").map((s) => atributos(s, g.attrs.id)),
  }));
for (const n of defs.hijos) if (n.nombre === "filter") descartes.push(`<filter id="${n.attrs.id}"> con <feGaussianBlur> — @react-pdf/primitives no tiene primitiva de filtro`);

let contador = 0;
function nodoDibujable(n) {
  if (n.nombre === "defs") return null;
  if (n.nombre === "path") {
    const i = contador++;
    if (n.attrs.filter) { descartes.push(`<path> #${i} descartado entero: sólo existe para llevar ${n.attrs.filter}`); return null; }
    return { tipo: "path", attrs: atributos(n, i) };
  }
  if (n.nombre === "g") {
    const hijos = n.hijos.map(nodoDibujable).filter(Boolean);
    return hijos.length ? { tipo: "g", attrs: atributos(n, "g"), hijos } : null;
  }
  descartes.push(`<${n.nombre}> sin mapeo`);
  return null;
}
const arbol = svg.hijos.map(nodoDibujable).filter(Boolean);

const json = (v) => JSON.stringify(v, null, 2).replace(/\n/g, "\n");
const contenido = `/**
 * Generado automáticamente por \`scripts/generar-isotipo-reactpdf.mjs\` a
 * partir de \`isotipo-approved.svg\`. No editar a mano.
 *
 * react-pdf no puede leer un \`.svg\` de archivo de forma confiable en este
 * entorno, así que el asset se transcribe a datos y \`isotipo.tsx\` los mapea
 * a primitivas. Los \`d\` son EXACTAMENTE los del SVG fuente, nunca
 * redibujados: \`isotipo.test.ts\` lo verifica.
 *
 * DESCARTES de esta transcripción (lo que react-pdf no puede dibujar):
${descartes.map((d) => ` *   - ${d}`).join("\n")}
 *
 * Consecuencia, a tener presente en toda superficie que use este componente:
 * el isotipo en PDF sale SIN el resplandor del asset. Además, react-pdf no
 * resuelve \`stroke="url(#gradiente)"\`, así que los filetes que usan
 * \`#iso-edge\` no salen con su degradado. Está documentado en
 * \`PROCEDENCIA.md\` (4.1 bis a) y comparado en
 * \`docs/bv4-f1-assets-pdf-vs-navegador.png\`.
 *
 * GATE DH-6 RESUELTO (veredicto humano de Matías, 2026-08-31): el isotipo
 * PASA y queda aprobado como isotipo de la herramienta. Deja de ser
 * provisional.
 */

export type ParadaGradienteIsotipo = {
  offset?: number;
  stopColor: string;
  stopOpacity?: number;
};

export type GradienteIsotipo = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  gradientUnits: "userSpaceOnUse" | "objectBoundingBox";
  stops: ParadaGradienteIsotipo[];
};

export type NodoIsotipo =
  | { tipo: "path"; attrs: Record<string, string | number> }
  | { tipo: "g"; attrs: Record<string, string | number>; hijos: NodoIsotipo[] };

/** \`viewBox\` del asset. No es cuadrado: ver PROCEDENCIA.md, 4.1 bis (b). */
export const ISOTIPO_VIEWBOX = ${JSON.stringify(svg.attrs.viewBox)} as const;

/** Relación de aspecto del \`viewBox\`, para no deformar el glifo nunca. */
export const ISOTIPO_RELACION = ${(() => { const [, , w, h] = svg.attrs.viewBox.split(/\s+/).map(Number); return +(w / h).toFixed(6); })()};

/** Encuadres cuadrados medidos en la etapa 4.1 bis (b). */
export const ISOTIPO_ENCUADRES = {
  /** Centrado en la tinta, 8% de aire por lado. El glifo ocupa el 86% del lado. */
  cuadrado: "-4.1 -5.4 226 226",
  /** El círculo inscripto contiene toda la tinta. El glifo ocupa el 70% del lado. */
  circular: "-31.1 -32.4 280 280",
} as const;

/**
 * Qué encuadre le toca a cada superficie. **Veredicto humano de Matías,
 * 2026-08-31**, sobre la lámina \`docs/bv4-f1-isotipo-test.png\`: encuadre B
 * (\`circular\`) para el avatar circular; encuadre A (\`cuadrado\`) para el
 * avatar cuadrado y para el favicon.
 *
 * Declarado como dato y no como comentario, para que se pueda verificar.
 *
 * El favicon lleva además la **variante monocroma**, no el asset a color: a
 * 16 px el color se empasta y se pierde la V. Eso no se resuelve acá —
 * generar el favicon y cablearlo toca una superficie de producción y es
 * alcance de F2/F3. Ver \`PROCEDENCIA.md\`, "Gate DH-6 — RESUELTO".
 */
export const ISOTIPO_USO = {
  favicon: "cuadrado",
  avatarCuadrado: "cuadrado",
  avatarCircular: "circular",
} as const satisfies Record<string, keyof typeof ISOTIPO_ENCUADRES>;

export const ISOTIPO_GRADIENTES: GradienteIsotipo[] = ${json(gradientes)};

export const ISOTIPO_NODOS: NodoIsotipo[] = ${json(arbol)};

/** Lo que la transcripción descartó, expuesto para que el test lo fije. */
export const ISOTIPO_DESCARTES: readonly string[] = ${json(descartes)};
`;

if (process.argv.includes("--verificar")) {
  const actual = existsSync(SALIDA) ? readFileSync(SALIDA, "utf8") : "";
  if (actual === contenido) { console.log("ok       isotipo.generated.ts"); process.exit(0); }
  console.log("DIFIERE  isotipo.generated.ts"); process.exit(1);
}
writeFileSync(SALIDA, contenido);
const paths = JSON.stringify(arbol).match(/"tipo":"path"/g)?.length ?? 0;
console.log(`escrito  isotipo.generated.ts — ${gradientes.length} gradientes, ${paths} paths, ${descartes.length} descartes`);
for (const d of descartes) console.log(`   descarta  ${d}`);
