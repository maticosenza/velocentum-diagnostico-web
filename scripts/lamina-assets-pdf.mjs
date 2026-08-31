#!/usr/bin/env node
/**
 * Lámina "PDF contra navegador" de los assets con filtro SVG — BV4 F1,
 * etapa 4.1 bis (a).
 *
 * Renderiza cada asset de `src/documents/theme/marca/` con
 * `@react-pdf/renderer` (vía `scripts/render-marca-pdf.mjs`, que transcribe
 * el SVG a primitivas sin redibujar nada y registra lo que descarta),
 * rasteriza esos PDF, y los pone lado a lado con el render del navegador del
 * MISMO archivo SVG.
 *
 * REPORTA; NO DECIDE. La variante sin filtro, si corresponde, es decisión de
 * Matías.
 *
 *   node scripts/lamina-assets-pdf.mjs [dir-trabajo]
 *
 * Requiere Google Chrome y `qlmanage` (macOS). Escribe
 * `docs/bv4-f1-assets-pdf-vs-navegador.png`.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, copyFileSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { recortarBlancoInferior } from "./lib/png.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MARCA = join(RAIZ, "src/documents/theme/marca");
const DESTINO = join(RAIZ, "docs/bv4-f1-assets-pdf-vs-navegador.png");
const CHROME = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const TRABAJO = process.argv[2] ? resolve(process.argv[2]) : mkdtempSync(join(tmpdir(), "bv4-assets-"));
mkdirSync(TRABAJO, { recursive: true });

// 1 · PDFs por asset + informe de descartes.
execFileSync("node", [join(RAIZ, "scripts/render-marca-pdf.mjs"), TRABAJO], { stdio: "inherit" });

// 2 · Rasterizado de cada PDF de una sola página.
const PNG = join(TRABAJO, "png");
mkdirSync(PNG, { recursive: true });
const porAsset = join(TRABAJO, "por-asset");
for (const f of readdirSync(porAsset).filter((n) => n.endsWith(".pdf"))) {
  execFileSync("qlmanage", ["-t", "-s", "1600", "-o", PNG, join(porAsset, f)], { stdio: "ignore" });
}

// 3 · Los assets con feGaussianBlur, detectados leyendo cada archivo.
function svgs(dir, base = "", out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.isDirectory()) svgs(join(dir, e.name), `${base}${e.name}/`, out);
    else if (e.name.endsWith(".svg")) out.push(`${base}${e.name}`);
  }
  return out;
}
const todos = svgs(MARCA);
const conFiltro = todos.filter((n) => readFileSync(join(MARCA, n), "utf8").includes("feGaussianBlur"));

const descartes = JSON.parse(readFileSync(join(TRABAJO, "marca-descartes.json"), "utf8"));
const b64 = (p) => readFileSync(p).toString("base64");
const pngDe = (n) => `data:image/png;base64,${b64(join(PNG, `${n.replace(/\//g, "__").replace(/\.svg$/, "")}.pdf.png`))}`;
const svgDe = (n) => `data:image/svg+xml;base64,${b64(join(MARCA, n))}`;

const filas = conFiltro.map((nombre) => {
  const info = descartes.find((d) => d.archivo === nombre);
  const lista = [...new Set(info.descartes)].filter((d) => /filter/i.test(d));
  return `
  <section class="fila">
    <h2>${nombre}<span class="vb">viewBox ${info.viewBox}</span></h2>
    <div class="par">
      <figure><figcaption>Navegador — SVG original, filtro aplicado</figcaption><div class="caja"><img src="${svgDe(nombre)}"></div></figure>
      <figure><figcaption>PDF (@react-pdf/renderer 4.6.1) — transcripción mecánica del mismo SVG</figcaption><div class="caja"><img src="${pngDe(nombre)}"></div></figure>
    </div>
    <ul class="desc">${lista.map((d) => `<li>${d.replace(/</g, "&lt;")}</li>`).join("")}</ul>
  </section>`;
}).join("\n");

const html = `<!doctype html><meta charset="utf-8"><title>BV4 F1 · assets con feGaussianBlur — PDF vs navegador</title>
<style>
:root{--ink:#0E0E13;--muted:#6E6E7A;--line:#E9E9EE;--soft:#F5F5F7;--pink:#D92F6E}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;padding:40px 44px;width:1300px}
h1{font-size:26px;margin:0 0 6px;letter-spacing:-.01em}
.sub{color:var(--muted);margin:0 0 4px}
.aviso{margin:18px 0 30px;padding:14px 16px;border:1px solid var(--line);border-left:3px solid var(--pink);background:var(--soft)}
.aviso b{color:var(--pink)}
.fila{border-top:1px solid var(--line);padding:26px 0 4px}
h2{font-size:15px;margin:0 0 14px;font-weight:600}
h2 .vb{color:var(--muted);font-weight:400;margin-left:12px;font-size:13px}
.par{display:grid;grid-template-columns:1fr 1fr;gap:26px}
figcaption{color:var(--muted);font-size:12px;margin-bottom:8px}
.caja{border:1px solid var(--line);height:230px;display:flex;align-items:center;justify-content:center;padding:14px;background:#fff}
.caja img{max-width:100%;max-height:100%;object-fit:contain}
.desc{margin:12px 0 0;padding-left:18px;color:var(--muted);font-size:12px}
code{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:12.5px}
footer{margin-top:34px;border-top:1px solid var(--line);padding-top:16px;color:var(--muted);font-size:12px}
</style>
<h1>Assets con <code>feGaussianBlur</code> — render en PDF contra render en navegador</h1>
<p class="sub">Bloque Visual 4 · F1 Foundation, etapa 4.1 bis (a). Generado desde <code>src/documents/theme/marca/</code>, sin modificar ningún archivo fuente.</p>
<div class="aviso">
<p style="margin:0 0 8px"><b>Son ${conFiltro.length}, no cinco.</b> El manifiesto y el prompt de F1 listan cinco assets con <code>feGaussianBlur</code> (isotipo, prism, bars, target, lightning). La lectura de los archivos encuentra además <code>treatments/solid.svg</code>. Los ${conFiltro.length} están abajo.</p>
<p style="margin:0 0 8px"><b>La causa no es "soporte limitado".</b> <code>@react-pdf/primitives</code> 4.x declara 31 primitivas y <b>ninguna es de filtro</b>: no existen <code>Filter</code> ni <code>FeGaussianBlur</code>. El desenfoque no es representable en PDF con esta biblioteca. La columna derecha es la transcripción mecánica del mismo SVG a primitivas de react-pdf, con el filtro descartado — que es exactamente lo que el motor puede dibujar.</p>
<p style="margin:0 0 8px"><b>Aparecieron dos incompatibilidades más, independientes del filtro.</b></p>
<p style="margin:0 0 6px">(1) <b><code>stroke="url(#gradiente)"</code> no se resuelve en react-pdf</b>: el trazo sale negro sólido. Afecta a <code>objects/prism.svg</code> (el haz espectral, dos veces), <code>objects/bars.svg</code> (<code>#inner</code>, tres veces) y <code>isotipo-approved.svg</code> (<code>#iso-edge</code>, dos veces). Es la barra negra del prisma de la derecha. Los <code>fill="url(#gradiente)"</code> sí funcionan.</p>
<p style="margin:0">(2) <b>Defecto en el asset, visible en el navegador:</b> <code>objects/prism.svg</code> trae <code>&lt;path d="M250 28L250 218M164 218L250 122 337 218" stroke="#fff" stroke-opacity=".18"/&gt;</code> <b>sin declarar <code>fill</code></b>. El valor inicial de <code>fill</code> en SVG es <code>black</code>, así que el navegador rellena de negro el triángulo que esos subtrazos encierran — el bloque oscuro dentro del prisma de la izquierda. Es casi seguro no intencional. Los otros casos sin <code>fill</code> (<code>bars</code>, <code>scroll-axis</code>, dos líneas del propio <code>prism</code>) son trazos rectos que no encierran área y no se ven.</p>
</div>
${filas}
<footer>La transcripción la hace <code>scripts/render-marca-pdf.mjs</code>: mapea cada elemento del SVG a su primitiva de react-pdf sin redibujar nada, y registra todo lo que descarta (informe completo en <code>marca-descartes.json</code>). Ningún archivo de <code>marca/</code> fue modificado. <b>Este documento reporta; no decide.</b></footer>`;

writeFileSync(join(TRABAJO, "lamina.html"), html);
execFileSync(CHROME, ["--headless", "--disable-gpu", "--hide-scrollbars", "--window-size=1300,4400",
  `--screenshot=${join(TRABAJO, "lamina.png")}`, `file://${join(TRABAJO, "lamina.html")}`], { stdio: "ignore" });
copyFileSync(join(TRABAJO, "lamina.png"), DESTINO);
const r = recortarBlancoInferior(DESTINO);
console.log(`\nassets con feGaussianBlur: ${conFiltro.length} de ${todos.length} — ${conFiltro.join(", ")}`);
console.log(`lámina: ${DESTINO} — ${r.w} x ${r.h}`);
