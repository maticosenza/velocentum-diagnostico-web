#!/usr/bin/env node
/**
 * Lámina del test del isotipo — BV4 F1, etapa 4.2 (gate DH-6).
 *
 * Rasteriza `src/documents/theme/marca/isotipo-approved.svg` a 16, 24 y 32 px
 * en color, monocromo sobre claro y monocromo sobre oscuro; arma las
 * composiciones tipo avatar (círculo y cuadrado redondeado) con tres
 * encuadres; mide la geometría real del glifo leyendo el canal alfa; y
 * compone todo en una única lámina.
 *
 * NO declara si el isotipo pasa: el veredicto es humano, de Matías.
 * NO modifica el asset: el monocromo es un filtro CSS sobre el render y los
 * encuadres se aplican reemplazando el `viewBox` en una copia temporal fuera
 * del repositorio.
 *
 *   node scripts/lamina-isotipo.mjs [dir-trabajo]
 *
 * Requiere Google Chrome instalado (headless). Escribe
 * `docs/bv4-f1-isotipo-test.png`.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cajaDeTinta, recortarBlancoInferior } from "./lib/png.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ISOTIPO = join(RAIZ, "src/documents/theme/marca/isotipo-approved.svg");
const DESTINO = join(RAIZ, "docs/bv4-f1-isotipo-test.png");
const CHROME = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const TRABAJO = process.argv[2] ? resolve(process.argv[2]) : mkdtempSync(join(tmpdir(), "bv4-isotipo-"));
mkdirSync(TRABAJO, { recursive: true });
copyFileSync(ISOTIPO, join(TRABAJO, "isotipo-approved.svg"));

function chrome(html, png, ancho, alto) {
  execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
    `--window-size=${ancho},${alto}`, `--screenshot=${join(TRABAJO, png)}`, `file://${join(TRABAJO, html)}`,
  ], { stdio: "ignore" });
}

/** Copia del SVG con otro `viewBox`. El archivo del repositorio no se toca. */
function conViewBox(nombre, viewBox) {
  const s = readFileSync(ISOTIPO, "utf8")
    .replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`)
    .replace(/\swidth="[^"]*"/, "")
    .replace(/\sheight="[^"]*"/, "");
  writeFileSync(join(TRABAJO, `${nombre}.svg`), s);
  return `${nombre}.svg`;
}

const TRATAMIENTOS = {
  color: { filtro: "", fondo: "transparent" },
  light: { filtro: "filter:brightness(0);", fondo: "#FFFFFF" },
  dark: { filtro: "filter:brightness(0) invert(1);", fondo: "#0E0E13" },
  onwhite: { filtro: "", fondo: "#FFFFFF" },
  inkbg: { filtro: "", fondo: "#0E0E13" },
};
const FORMAS = { none: "", circle: "border-radius:50%;", square: "border-radius:22%;" };

function muestra(nombre, px, tratamiento, forma = "none", src = "isotipo-approved.svg") {
  const { filtro, fondo } = TRATAMIENTOS[tratamiento];
  writeFileSync(join(TRABAJO, `${nombre}.html`), `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}
.m{width:${px}px;height:${px}px;background:${fondo};${FORMAS[forma]}overflow:hidden;display:block}
img{display:block;width:${px}px;height:${px}px;object-fit:contain;${filtro}}</style>
<div class="m"><img src="${src}"></div>`);
  chrome(`${nombre}.html`, `${nombre}.png`, px, px);
  return `${nombre}.png`;
}

// --- Geometría real, medida sobre un render a 5 px por unidad de viewBox ---
writeFileSync(join(TRABAJO, "geo.html"), `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}img{display:block;width:1100px;height:1050px}</style>
<img src="isotipo-approved.svg">`);
chrome("geo.html", "geo.png", 1100, 1050);
const geo = cajaDeTinta(join(TRABAJO, "geo.png"), { escala: 5 });

// --- Encuadres derivados de la medición -----------------------------------
const [cx, cy] = geo.centroTinta;
const ladoA = +(Math.max(geo.caja.ancho, geo.caja.alto) * 1.16).toFixed(0); // 8% de aire por lado
const ladoB = +(geo.radioMaximo * 2 * 1.067).toFixed(0); // el círculo inscripto contiene toda la tinta
const vbA = `${+(cx - ladoA / 2).toFixed(1)} ${+(cy - ladoA / 2).toFixed(1)} ${ladoA} ${ladoA}`;
const vbB = `${+(cx - ladoB / 2).toFixed(1)} ${+(cy - ladoB / 2).toFixed(1)} ${ladoB} ${ladoB}`;
const srcA = conViewBox("enc-a", vbA);
const srcB = conViewBox("enc-b", vbB);

const PX = [16, 24, 32];
const Z = 7;
const b64 = (n) => `data:image/png;base64,${readFileSync(join(TRABAJO, n)).toString("base64")}`;

const tamanos = {};
for (const t of ["color", "light", "dark"]) for (const px of PX) tamanos[`${t}-${px}`] = muestra(`s-${t}-${px}`, px, t);

const avatares = {};
for (const px of [32, 64]) {
  avatares[`crudo-circ-${px}`] = muestra(`av-crudo-circ-${px}`, px, "onwhite", "circle");
  avatares[`A-circ-${px}`] = muestra(`av-A-circ-${px}`, px, "onwhite", "circle", srcA);
  avatares[`B-circ-${px}`] = muestra(`av-B-circ-${px}`, px, "onwhite", "circle", srcB);
  avatares[`crudo-cuad-${px}`] = muestra(`av-crudo-cuad-${px}`, px, "onwhite", "square");
  avatares[`A-cuad-${px}`] = muestra(`av-A-cuad-${px}`, px, "onwhite", "square", srcA);
  avatares[`B-cuad-${px}`] = muestra(`av-B-cuad-${px}`, px, "onwhite", "square", srcB);
  avatares[`A-circ-dark-${px}`] = muestra(`av-A-circ-dark-${px}`, px, "inkbg", "circle", srcA);
  avatares[`B-circ-dark-${px}`] = muestra(`av-B-circ-dark-${px}`, px, "inkbg", "circle", srcB);
}

const svgOriginal = `data:image/svg+xml;base64,${readFileSync(ISOTIPO).toString("base64")}`;
const fuente = readFileSync(ISOTIPO, "utf8");
const cuenta = (re) => (fuente.match(re) ?? []).length;
const hexUnicos = new Set((fuente.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? []).map((h) => h.toUpperCase())).size;

const TRAT_ROT = [
  ["color", "Color (asset tal cual)", "el asset sin tocar"],
  ["light", "Monocromo sobre claro (silueta en negro)", "silueta por filtro CSS; el archivo no se modifica"],
  ["dark", "Monocromo sobre oscuro (silueta en blanco, fondo #0E0E13)", "silueta por filtro CSS; el archivo no se modifica"],
];
const celdas = (t) => PX.map((px) => `
  <div class="celda">
    <div class="real"><img src="${b64(tamanos[`${t}-${px}`])}" width="${px}" height="${px}"></div>
    <div class="zoom"><img class="pix" src="${b64(tamanos[`${t}-${px}`])}" width="${px * Z}" height="${px * Z}"></div>
    <div class="px">${px} px real · ampliado ${Z}×</div>
  </div>`).join("");
const avatar = (clave, etiqueta, px) => `
  <div class="celda">
    <div class="realav"><img src="${b64(avatares[clave])}" width="${px}" height="${px}"><img class="pix" src="${b64(avatares[clave])}" width="${px * 3}" height="${px * 3}"></div>
    <div class="px">${etiqueta}</div>
  </div>`;
const n = (v) => String(v).replace(".", ",");

const html = `<!doctype html><meta charset="utf-8"><title>BV4 F1 · test del isotipo</title>
<style>
:root{--ink:#0E0E13;--muted:#6E6E7A;--line:#E9E9EE;--soft:#F5F5F7;--pink:#D92F6E}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;padding:38px 44px;width:1380px}
h1{font-size:26px;margin:0 0 6px;letter-spacing:-.01em}
.sub{color:var(--muted);margin:0 0 18px}
.aviso{padding:14px 16px;border:1px solid var(--line);border-left:3px solid var(--pink);background:var(--soft);margin:0 0 28px}
.aviso b{color:var(--pink)}
h2{font-size:16px;margin:30px 0 4px;padding-top:22px;border-top:1px solid var(--line)}
h3{font-size:13.5px;margin:20px 0 8px;font-weight:600;color:var(--muted)}
.nota{color:var(--muted);font-size:12.5px;margin:0 0 16px}
.grid{display:grid;grid-template-columns:300px repeat(3,1fr);gap:0 18px;align-items:start}
.rot{font-size:13px;padding-top:10px}
.rot small{display:block;color:var(--muted);margin-top:2px;font-size:12px}
.celda{margin-bottom:20px}
.real{height:56px;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);background:repeating-conic-gradient(#F0F0F3 0% 25%,#fff 0% 50%) 50%/10px 10px}
.zoom{padding:14px;overflow:hidden;border:1px solid var(--line);border-top:0;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#F0F0F3 0% 25%,#fff 0% 50%) 50%/10px 10px}
.pix{image-rendering:pixelated}
.realav{display:flex;gap:14px;align-items:center;justify-content:center;border:1px solid var(--line);padding:10px;min-height:96px;background:repeating-conic-gradient(#F0F0F3 0% 25%,#fff 0% 50%) 50%/10px 10px}
.px{font-size:12px;color:var(--muted);margin-top:6px;text-align:center}
.fila-av{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:10px}
table{border-collapse:collapse;font-size:13px}
td,th{border:1px solid var(--line);padding:6px 12px;text-align:left;vertical-align:top}
th{background:var(--soft);font-weight:600}
code{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:12.5px}
.ref{display:flex;gap:26px;align-items:flex-start}
.ref img{width:220px;height:210px;border:1px solid var(--line)}
footer{margin-top:34px;border-top:1px solid var(--line);padding-top:16px;color:var(--muted);font-size:12px}
</style>

<h1>Test del isotipo — <code>isotipo-approved.svg</code></h1>
<p class="sub">Bloque Visual 4 · F1 Foundation, etapa 4.2 — gate DH-6. Generado desde <code>src/documents/theme/marca/isotipo-approved.svg</code>, sin modificar el archivo.</p>

<div class="aviso"><b>El veredicto es humano.</b> Esta lámina no declara si el isotipo pasa o no pasa: sólo muestra el render real a cada tamaño y en cada tratamiento, medido y sin retocar. La decisión es de Matías. Hasta ese veredicto, todo uso del isotipo queda marcado provisional.</div>

<h2 style="border-top:0;padding-top:0">Geometría medida</h2>
<p class="nota">Medida sobre un render a 5 px por unidad de <code>viewBox</code>, leyendo el canal alfa del PNG.</p>
<div class="ref">
  <img src="${svgOriginal}">
  <table>
    <tr><th><code>viewBox</code> declarado</th><td>220 × 210 — <b>no cuadrado</b> (relación 1,048)</td></tr>
    <tr><th>Caja de tinta real</th><td>x [${n(geo.caja.x0)} – ${n(geo.caja.x1)}] · y [${n(geo.caja.y0)} – ${n(geo.caja.y1)}] → <b>${n(geo.caja.ancho)} × ${n(geo.caja.alto)}</b></td></tr>
    <tr><th>Centro de tinta</th><td>(${n(cx)} · ${n(cy)}) — el centro del <code>viewBox</code> es (110 · 105)</td></tr>
    <tr><th>Aire del asset</th><td>izq ${n(geo.margenes.izq)} · der ${n(geo.margenes.der)} · sup ${n(geo.margenes.sup)} · inf ${n(geo.margenes.inf)}</td></tr>
    <tr><th>Radio máximo desde el centro de tinta</th><td><b>${n(geo.radioMaximo)}</b> — ninguna tinta cae fuera de ese círculo</td></tr>
    <tr><th>Composición</th><td>${cuenta(/<path/g)} <code>&lt;path&gt;</code>, ${cuenta(/<linearGradient|<radialGradient/g)} gradientes, ${cuenta(/feGaussianBlur/g)} <code>feGaussianBlur</code>, sin raster embebido</td></tr>
    <tr><th>Color</th><td>${hexUnicos} tonos únicos, <b>ninguno de la paleta vinculante</b> (encapsulados por DH-7)</td></tr>
  </table>
</div>

<h2>1 · Tamaños reales: 16, 24 y 32 px</h2>
<p class="nota">Arriba, el tamaño real 1:1. Abajo, la misma imagen ampliada ${Z}× con <code>image-rendering: pixelated</code>: son exactamente los mismos píxeles, agrandados para poder inspeccionarlos. El damero indica transparencia.</p>
<div class="grid">
${TRAT_ROT.map(([t, etiqueta, pie]) => `<div class="rot">${etiqueta}<small>${pie}</small></div>${celdas(t)}`).join("\n")}
</div>

<h2>2 · Composiciones tipo avatar</h2>
<p class="nota">Círculo y cuadrado redondeado (radio 22%), a 32 y 64 px, con tres encuadres. <b>Crudo</b> = el <code>viewBox</code> tal como viene. <b>A</b> = cuadrado centrado en la tinta con 8% de aire (<code>viewBox="${vbA}"</code>). <b>B</b> = cuadrado cuyo círculo inscripto contiene toda la tinta (<code>viewBox="${vbB}"</code>). Cada celda muestra el tamaño real y una ampliación 3×.</p>
<h3>Círculo</h3>
<div class="fila-av">
${avatar("crudo-circ-32", "crudo · 32 px", 32)}${avatar("A-circ-32", "encuadre A · 32 px", 32)}${avatar("B-circ-32", "encuadre B · 32 px", 32)}
${avatar("crudo-circ-64", "crudo · 64 px", 64)}${avatar("A-circ-64", "encuadre A · 64 px", 64)}${avatar("B-circ-64", "encuadre B · 64 px", 64)}
</div>
<h3>Cuadrado redondeado</h3>
<div class="fila-av">
${avatar("crudo-cuad-32", "crudo · 32 px", 32)}${avatar("A-cuad-32", "encuadre A · 32 px", 32)}${avatar("B-cuad-32", "encuadre B · 32 px", 32)}
${avatar("crudo-cuad-64", "crudo · 64 px", 64)}${avatar("A-cuad-64", "encuadre A · 64 px", 64)}${avatar("B-cuad-64", "encuadre B · 64 px", 64)}
</div>
<h3>Círculo sobre <code>ink</code> (#0E0E13)</h3>
<div class="fila-av">
${avatar("A-circ-dark-32", "encuadre A · 32 px", 32)}${avatar("B-circ-dark-32", "encuadre B · 32 px", 32)}<div></div>
${avatar("A-circ-dark-64", "encuadre A · 64 px", 64)}${avatar("B-circ-dark-64", "encuadre B · 64 px", 64)}<div></div>
</div>

<h2>3 · Encuadre propuesto (verificación 4.1 bis b)</h2>
<table>
  <tr><th>Encuadre</th><th><code>viewBox</code></th><th>Lado</th><th>Qué garantiza</th><th>Glifo</th></tr>
  <tr><td><b>A</b> — favicon y avatar cuadrado</td><td><code>${vbA}</code></td><td>${ladoA}</td><td>Cuadrado perfecto, centrado en la <b>tinta</b> (no en el <code>viewBox</code>), con 8% de aire por lado sobre el eje mayor. Ningún trazo toca el borde.</td><td>${Math.round((geo.caja.ancho / ladoA) * 100)}% del lado</td></tr>
  <tr><td><b>B</b> — avatar circular sin recorte</td><td><code>${vbB}</code></td><td>${ladoB}</td><td>El círculo inscripto (radio ${ladoB / 2}) contiene el radio máximo de tinta (${n(geo.radioMaximo)}): un recorte circular no corta nada.</td><td>${Math.round((geo.caja.ancho / ladoB) * 100)}% del lado</td></tr>
</table>
<p class="nota" style="margin-top:12px">En los dos casos <code>preserveAspectRatio</code> queda en su valor por defecto (<code>xMidYMid meet</code>): <b>el glifo no se deforma nunca</b>, y el encuadre se logra cambiando el <code>viewBox</code> del envoltorio, <b>sin editar el asset</b>. La diferencia entre A y B es cuánta superficie ocupa el glifo: A lo muestra más grande pero un recorte circular le comería las puntas; B nunca recorta pero lo deja más chico. <b>Cuál usar en cada superficie es decisión de Matías.</b></p>

<footer>Generado por <code>scripts/lamina-isotipo.mjs</code> con Chrome headless. El asset no se modificó en ningún paso.</footer>`;

writeFileSync(join(TRABAJO, "lamina.html"), html);
chrome("lamina.html", "lamina.png", 1380, 4400);
copyFileSync(join(TRABAJO, "lamina.png"), DESTINO);
const r = recortarBlancoInferior(DESTINO);
console.log(`geometría: caja ${geo.caja.ancho} x ${geo.caja.alto}, centro (${cx}, ${cy}), radio máx ${geo.radioMaximo}`);
console.log(`encuadre A: viewBox="${vbA}"   ·   encuadre B: viewBox="${vbB}"`);
console.log(`lámina: ${DESTINO} — ${r.w} x ${r.h}`);
