#!/usr/bin/env node
/**
 * Renderiza los SVG de `src/documents/theme/marca/` a PDF con
 * `@react-pdf/renderer`, para la verificación 4.1 bis (a) de BV4 F1: comparar
 * el render en PDF contra el del navegador.
 *
 * NO modifica los archivos fuente. Transcribe cada SVG a las primitivas de
 * react-pdf de forma mecánica —mismo criterio que
 * `src/documents/renderers/pdf/marca.tsx`, que copia los `d` de los SVG sin
 * redibujarlos— y REPORTA todo lo que la transcripción tuvo que descartar
 * porque react-pdf no lo soporta.
 *
 * `@react-pdf/primitives` declara 31 primitivas y ninguna es de filtro: no
 * hay `Filter` ni `FeGaussianBlur`. Todo `<filter>` y todo atributo
 * `filter="url(#…)"` se descarta, y el descarte queda en el informe.
 *
 *   node scripts/render-marca-pdf.mjs <dir-salida>
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { Document, Page, Text, Tspan, Svg, Defs, LinearGradient, RadialGradient, Stop, G, Path, Polygon, Polyline, Circle, Ellipse, Rect, Line, renderToFile } from "@react-pdf/renderer";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MARCA = join(RAIZ, "src/documents/theme/marca");
const SALIDA = resolve(process.argv[2] ?? join(RAIZ, "artefactos"));

/** Elementos SVG que react-pdf sí sabe dibujar. */
const PRIMITIVAS = {
  svg: Svg, defs: Defs, lineargradient: LinearGradient, radialgradient: RadialGradient,
  stop: Stop, g: G, path: Path, polygon: Polygon, polyline: Polyline,
  circle: Circle, ellipse: Ellipse, rect: Rect, line: Line,
  text: Text, tspan: Tspan,
};
/** Elementos que NO tienen primitiva y se descartan, con su motivo. */
const SIN_SOPORTE = {
  filter: "no existe primitiva de filtro en @react-pdf/primitives",
  fegaussianblur: "no existe primitiva de filtro",
  femerge: "no existe primitiva de filtro",
  femergenode: "no existe primitiva de filtro",
  feblend: "no existe primitiva de filtro",
  fecolormatrix: "no existe primitiva de filtro",
  feoffset: "no existe primitiva de filtro",
  feflood: "no existe primitiva de filtro",
  fecomposite: "no existe primitiva de filtro",
  clippath: "ClipPath existe pero requiere reescribir el asset; se descarta para no modificarlo",
  mask: "no existe primitiva de máscara",
  title: "metadato, no dibuja",
  desc: "metadato, no dibuja",
  style: "react-pdf no aplica CSS dentro de <svg>",
  use: "no existe primitiva <use>",
};

const camel = (n) => n.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const NUMERICOS = new Set(["x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "offset", "strokeWidth", "fillOpacity", "strokeOpacity", "stopOpacity", "opacity", "fx", "fy"]);

/** Parser XML mínimo: alcanza para estos assets, que son XML plano sin CDATA ni entidades. */
function parsear(xml) {
  const limpio = xml.replace(/<\?xml[^>]*\?>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const re = /<\/?([A-Za-z][A-Za-z0-9:-]*)((?:\s+[A-Za-z_:][-A-Za-z0-9_:.]*\s*=\s*"[^"]*")*)\s*(\/?)>/g;
  const raiz = { nombre: "#raiz", attrs: {}, hijos: [] };
  const pila = [raiz];
  let m;
  while ((m = re.exec(limpio))) {
    const [todo, nombre, attrsCrudos, autoCierra] = m;
    if (todo.startsWith("</")) { if (pila.length > 1) pila.pop(); continue; }
    const attrs = {};
    for (const a of attrsCrudos.matchAll(/([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = a[2];
    const nodo = { nombre: nombre.toLowerCase(), attrs, hijos: [], texto: "" };
    pila[pila.length - 1].hijos.push(nodo);
    if (!autoCierra) {
      pila.push(nodo);
      const cierre = limpio.indexOf(`</${nombre}`, re.lastIndex);
      if (cierre !== -1) {
        const dentro = limpio.slice(re.lastIndex, cierre);
        if (!dentro.includes("<")) nodo.texto = dentro.trim();
      }
    }
  }
  return raiz.hijos.find((n) => n.nombre === "svg") ?? null;
}

function props(nodo, descartes) {
  const p = {};
  for (const [k, v] of Object.entries(nodo.attrs)) {
    if (k === "xmlns" || k.startsWith("xmlns:")) continue;
    if (k === "filter") { descartes.push(`atributo filter="${v}" en <${nodo.nombre}>`); continue; }
    if (k === "id" && nodo.nombre !== "lineargradient" && nodo.nombre !== "radialgradient") continue;
    if (k === "class" || k === "style") { descartes.push(`atributo ${k} en <${nodo.nombre}>`); continue; }
    if (k === "font-family") {
      // react-pdf sólo dibuja texto con una familia registrada: Arial no lo
      // está y lanza "Font family not registered". Se sustituye por Inter
      // SÓLO para que la sonda pueda terminar de renderizar el resto del
      // asset, y la sustitución queda registrada como descarte.
      descartes.push(`font-family="${v}" en <${nodo.nombre}> — sustituida por Helvetica (Arial no es built-in de react-pdf y lanza excepción; Helvetica es su clon métrico y es el sustituto más fiel disponible sin registrar nada)`);
      p.fontFamily = "Helvetica";
      continue;
    }
    if (k === "letter-spacing" || k === "text-anchor" || k === "font-weight") {
      // No hay equivalente fiable dentro de <Svg> en react-pdf 4.6.1.
      descartes.push(`atributo ${k}="${v}" en <${nodo.nombre}> — sin equivalente en <Svg> de react-pdf`);
      continue;
    }
    const nombre = camel(k);
    p[nombre] = NUMERICOS.has(nombre) && /^-?[\d.]+$/.test(v) ? Number(v) : v;
  }
  return p;
}

function construir(nodo, descartes, clave = "0") {
  const motivo = SIN_SOPORTE[nodo.nombre];
  if (motivo) { descartes.push(`<${nodo.nombre}> — ${motivo}`); return null; }
  const Prim = PRIMITIVAS[nodo.nombre];
  if (!Prim) { descartes.push(`<${nodo.nombre}> — elemento no mapeado`); return null; }
  const hijos = nodo.hijos.map((h, i) => construir(h, descartes, `${clave}.${i}`)).filter(Boolean);
  const contenido = hijos.length ? hijos : nodo.texto ? nodo.texto : undefined;
  return React.createElement(Prim, { key: clave, ...props(nodo, descartes) }, contenido);
}

function svgs(dir, out = []) {
  for (const e of readdirSync(dir).sort()) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) svgs(f, out);
    else if (e.endsWith(".svg")) out.push(f);
  }
  return out;
}

const ANCHO_CAJA = 360;
const informe = [];
const paginas = [];
const limpias = [];

for (const ruta of svgs(MARCA)) {
  const nombre = relative(MARCA, ruta);
  const raiz = parsear(readFileSync(ruta, "utf8"));
  if (!raiz) { informe.push({ archivo: nombre, error: "sin elemento <svg>" }); continue; }
  const descartes = [];
  const arbol = construir(raiz, descartes);
  const [, , vw, vh] = (raiz.attrs.viewBox ?? "0 0 100 100").split(/\s+/).map(Number);
  const escala = ANCHO_CAJA / vw;
  const alto = Math.round(vh * escala);
  informe.push({ archivo: nombre, viewBox: raiz.attrs.viewBox, descartes });
  // Página limpia: exactamente el tamaño del gráfico, sin rótulo ni margen.
  // Es la que se compara pixel a pixel contra el render del navegador.
  limpias.push(
    React.createElement(
      Page,
      { key: nombre, size: [ANCHO_CAJA, alto], style: { backgroundColor: "#FFFFFF" } },
      React.cloneElement(arbol, { width: ANCHO_CAJA, height: alto }),
    ),
  );
  paginas.push(
    React.createElement(
      Page,
      { key: nombre, size: [ANCHO_CAJA + 80, alto + 120], style: { backgroundColor: "#FFFFFF", padding: 40 } },
      React.createElement(
        Text,
        { style: { fontSize: 10, marginBottom: 8, color: "#0E0E13" } },
        `${nombre}  ·  viewBox ${raiz.attrs.viewBox}  ·  descartes: ${descartes.length}`,
      ),
      React.cloneElement(arbol, { width: ANCHO_CAJA, height: alto }),
    ),
  );
}

mkdirSync(SALIDA, { recursive: true });
mkdirSync(join(SALIDA, "por-asset"), { recursive: true });
const pdf = join(SALIDA, "marca-en-react-pdf.pdf");
await renderToFile(React.createElement(Document, null, paginas), pdf);

// Un PDF por asset: `qlmanage` sólo rasteriza la primera página, así que la
// comparación contra el navegador necesita archivos de una sola página.
for (const pagina of limpias) {
  const nombre = pagina.key.replace(/\//g, "__").replace(/\.svg$/, "");
  await renderToFile(
    React.createElement(Document, null, React.cloneElement(pagina, { key: "0" })),
    join(SALIDA, "por-asset", `${nombre}.pdf`),
  );
}
writeFileSync(join(SALIDA, "marca-descartes.json"), JSON.stringify(informe, null, 2));

const conDescartes = informe.filter((i) => (i.descartes ?? []).length > 0);
console.log(`PDF escrito: ${pdf}`);
console.log(`assets transcriptos: ${informe.length} · con elementos descartados: ${conDescartes.length}\n`);
for (const i of conDescartes) {
  console.log(`${i.archivo}`);
  for (const d of [...new Set(i.descartes)]) console.log(`   descarta  ${d}`);
}
