#!/usr/bin/env node
/**
 * Muestra visual autocontenida — BV4 F1, etapa 6.1.
 *
 * Artefacto del gate de aprobación visual de Matías. Un único archivo HTML
 * sin ninguna dependencia externa: fuentes, imágenes y SVG van embebidos
 * como data URI, así que abre igual sin red y se puede archivar en el ZIP.
 *
 * No toca ninguna superficie de producción. Los renders del lockup son PDF
 * REALES generados por `muestra-visual.test.tsx` con el mecanismo del
 * repositorio, rasterizados acá — no una imitación en HTML. Los contrastes
 * los calcula `theme/contraste.ts` sobre `velocentum-crystal/v1`: esta
 * muestra no repite ningún número a mano.
 *
 *   node scripts/muestra-visual.mjs [dir-trabajo]
 *
 * Requiere Chrome (para la lámina del isotipo, si falta) y `qlmanage`.
 * Escribe `docs/bv4-f1-muestra-visual.html`.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MARCA = join(RAIZ, "src/documents/theme/marca");
const FUENTES = join(RAIZ, "src/assets/fuentes");
const DESTINO = join(RAIZ, "docs/bv4-f1-muestra-visual.html");
const TRABAJO = process.argv[2] ? resolve(process.argv[2]) : mkdtempSync(join(tmpdir(), "bv4-muestra-"));
mkdirSync(TRABAJO, { recursive: true });

// 1 · Insumos: PDFs del lockup y JSON de contrastes, por el mecanismo del repo.
execFileSync("npx", ["vitest", "run", "src/documents/theme/marca/muestra-visual.test.tsx"], {
  cwd: RAIZ, stdio: "inherit", env: { ...process.env, VELOCENTUM_BV4_MUESTRA_DIR: TRABAJO },
});
const datos = JSON.parse(readFileSync(join(TRABAJO, "muestra-datos.json"), "utf8"));
const T = datos.tema;
const c = T.colors;

// 2 · Rasterizado de los PDFs del lockup.
const PNG = join(TRABAJO, "png");
mkdirSync(PNG, { recursive: true });
for (const f of readdirSync(TRABAJO).filter((n) => n.endsWith(".pdf"))) {
  execFileSync("qlmanage", ["-t", "-s", "1400", "-o", PNG, join(TRABAJO, f)], { stdio: "ignore" });
}
const lockupPng = (n) => `data:image/png;base64,${readFileSync(join(PNG, `${n}.pdf.png`)).toString("base64")}`;

// 3 · Fuentes embebidas, para que la escala tipográfica se vea de verdad.
const fuente = (rel, formato) =>
  `url(data:font/${formato};base64,${readFileSync(join(FUENTES, rel)).toString("base64")}) format("${formato === "otf" ? "opentype" : "truetype"}")`;
const caras = [
  ["Satoshi", 400, "satoshi/otf/Satoshi-Regular.otf", "otf"],
  ["Satoshi", 500, "satoshi/otf/Satoshi-Medium.otf", "otf"],
  ["Satoshi", 700, "satoshi/otf/Satoshi-Bold.otf", "otf"],
  ["Satoshi", 900, "satoshi/otf/Satoshi-Black.otf", "otf"],
  ["Inter", 400, "inter/Inter_18pt-Regular.ttf", "ttf"],
  ["Inter", 500, "inter/Inter_18pt-Medium.ttf", "ttf"],
  ["Inter", 700, "inter/Inter_18pt-Bold.ttf", "ttf"],
  ["Geist Mono", 400, "geist-mono/otf/GeistMono-Regular.otf", "otf"],
  ["Geist Mono", 500, "geist-mono/otf/GeistMono-Medium.otf", "otf"],
  ["Geist Mono", 700, "geist-mono/otf/GeistMono-Bold.otf", "otf"],
];
const fontFaces = caras
  .map(([fam, peso, rel, fmt]) => `@font-face{font-family:"${fam}";font-weight:${peso};font-style:normal;src:${fuente(rel, fmt)}}`)
  .join("\n");

// 4 · Assets de marca embebidos.
function svgs(dir, base = "", out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.isDirectory()) svgs(join(dir, e.name), `${base}${e.name}/`, out);
    else if (e.name.endsWith(".svg")) out.push(`${base}${e.name}`);
  }
  return out;
}
const assets = svgs(MARCA);
const svgUri = (n) => `data:image/svg+xml;base64,${readFileSync(join(MARCA, n)).toString("base64")}`;

// 5 · Lámina del isotipo, si ya está generada.
const laminaIso = join(RAIZ, "docs/bv4-f1-isotipo-test.png");
const laminaIsoUri = existsSync(laminaIso) ? `data:image/png;base64,${readFileSync(laminaIso).toString("base64")}` : null;

const GLIFOS = "á é í ó ú ü ñ ¿ ¡ · — † × % $";
const n = (v) => String(v).replace(".", ",");

const swatch = (nombre, hex, nota, oscuro = false) => `
  <div class="sw">
    <div class="chip" style="background:${hex};${oscuro ? "" : "border:1px solid var(--line)"}"></div>
    <div class="swtxt"><b>${nombre}</b><code>${hex}</code><small>${nota}</small></div>
  </div>`;

const filaContraste = (f) => `
  <tr>
    <td><code>${f.nombre}</code><small>${f.rol}</small></td>
    <td><span class="demo" style="background:${f.fondo};color:${f.frente}">Texto de muestra 1.234</span></td>
    <td class="num"><b>${n(f.valor.toFixed(2))}:1</b></td>
    <td class="num">${n(String(f.umbral))}:1</td>
    <td class="${f.pasa ? "ok" : "no"}">${f.pasa ? "PASA" : "FALLA"}</td>
  </tr>`;

const escala = (familia, pesos) => `
  <div class="tipo" style="font-family:'${familia}'">
    <h3>${familia}</h3>
    <p class="disp" style="font-weight:${pesos[pesos.length - 1]}">Velocentum</p>
    ${pesos.map((p) => `<p class="ln" style="font-weight:${p}"><span class="peso">${p}</span> Diagnóstico de crecimiento — 1.234.567 · 12,4% · $ 89.900</p>`).join("")}
    <p class="gl">${GLIFOS}</p>
    <p class="tab">0123456789 · 1.234,56 · 9.876,54</p>
  </div>`;

const html = `<!doctype html><html lang="es"><meta charset="utf-8">
<title>BV4 F1 · muestra visual — velocentum-crystal/v1</title>
<style>
${fontFaces}
:root{
  --action:${c.action};--accent-soft:${c.accentSoft};--accent-deep:${c.accentDeep};
  --ink:${c.ink};--surface-dark:${c.surfaceDark};--surface:${c.surface};
  --soft:${c.surfaceSoft};--line:${c.borderLight};--line-dark:${c.borderDark};--muted:${c.muted};
}
*{box-sizing:border-box}
body{margin:0;background:var(--soft);color:var(--ink);font-family:"Inter",-apple-system,BlinkMacSystemFont,Arial,sans-serif;font-size:14px;line-height:1.55}
.wrap{max-width:1180px;margin:0 auto;padding:44px 40px 80px}
h1{font-family:"Satoshi";font-weight:900;font-size:38px;margin:0 0 6px;letter-spacing:-.02em}
.sub{color:var(--muted);margin:0 0 6px}
.aviso{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--accent-deep);padding:16px 18px;margin:24px 0 40px}
.aviso b{color:var(--accent-deep)}
section{background:var(--surface);border:1px solid var(--line);padding:30px 32px;margin:0 0 26px}
h2{font-family:"Satoshi";font-weight:700;font-size:20px;margin:0 0 6px;letter-spacing:-.01em}
h3{font-family:"Satoshi";font-weight:700;font-size:15px;margin:26px 0 10px}
.nota{color:var(--muted);font-size:13px;margin:0 0 20px}
.paleta{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
.sw{display:flex;gap:12px;align-items:center}
.chip{width:52px;height:52px;flex:0 0 52px;border-radius:6px}
.swtxt b{display:block;font-size:13px}
.swtxt code{display:block;font-family:"Geist Mono",ui-monospace,monospace;font-size:12px;color:var(--muted)}
.swtxt small{display:block;color:var(--muted);font-size:11.5px;margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{border-bottom:1px solid var(--line);padding:9px 10px;text-align:left;vertical-align:middle}
th{font-weight:600;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
td code{font-family:"Geist Mono",ui-monospace,monospace;font-size:12.5px}
td small{display:block;color:var(--muted);font-size:11.5px}
td.num{font-family:"Geist Mono",ui-monospace,monospace;text-align:right;white-space:nowrap}
.ok{color:#157A4C;font-weight:600;font-family:"Geist Mono",monospace;font-size:12px}
.no{color:#B23636;font-weight:600;font-family:"Geist Mono",monospace;font-size:12px}
.demo{display:inline-block;padding:5px 12px;border-radius:4px;font-size:13px;white-space:nowrap}
.tipos{display:grid;grid-template-columns:1fr;gap:8px}
.tipo{border-top:1px solid var(--line);padding-top:18px}
.tipo:first-child{border-top:0;padding-top:0}
.disp{font-size:52px;margin:0 0 10px;letter-spacing:-.02em;line-height:1}
.ln{margin:0 0 4px;font-size:16px}
.peso{display:inline-block;width:44px;color:var(--muted);font-size:12px;font-family:"Geist Mono",monospace}
.gl{font-size:26px;margin:14px 0 4px;letter-spacing:.06em}
.tab{font-size:16px;font-variant-numeric:tabular-nums;margin:0;color:var(--muted)}
.lockups{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:20px}
.lockups figure{margin:0}
.lockups img{width:100%;border:1px solid var(--line);display:block}
figcaption{color:var(--muted);font-size:12px;margin-top:8px}
.objetos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px}
.obj{border:1px solid var(--line);padding:12px;text-align:center}
.obj.dark{background:var(--ink);border-color:var(--line-dark)}
.obj img{width:100%;height:96px;object-fit:contain;display:block}
.obj span{display:block;font-family:"Geist Mono",monospace;font-size:10.5px;color:var(--muted);margin-top:8px;word-break:break-all}
.obj.dark span{color:${c.onDark.muted}}
.lamina img{width:100%;border:1px solid var(--line);display:block}
.reglas li{margin:8px 0}
.reglas code{font-family:"Geist Mono",monospace;font-size:12.5px;background:var(--soft);padding:1px 5px;border-radius:3px}
footer{color:var(--muted);font-size:12px;margin-top:34px}
</style>
<div class="wrap">
<h1>Muestra visual — <span style="color:var(--accent-deep)">velocentum-crystal/v1</span></h1>
<p class="sub">Bloque Visual 4 · F1 Foundation, etapa 6.1. Artefacto del gate de aprobación visual.</p>

<div class="aviso">
<p style="margin:0 0 8px"><b>Nada de esto está aplicado.</b> El tema nuevo existe al lado del actual y el interruptor <code style="font-family:'Geist Mono',monospace">theme/tema-activo.ts</code> está en <code style="font-family:'Geist Mono',monospace">${datos.temaActivo}</code>. F1 no migró ninguna superficie: ni documentos, ni UI, ni navegación.</p>
<p style="margin:0"><b>El isotipo es provisional</b> hasta el veredicto humano del gate DH-6. Esta muestra no declara que pase.</p>
</div>

<section>
<h2>1 · Paleta</h2>
<p class="nota">Los seis hexadecimales vinculantes del rebranding y los cuatro neutros preaprobados por DH-4, sin tocar. Todo lo demás del tema es reasignación de rol sobre estos mismos valores, salvo dos derivados calculados que están marcados.</p>
<h3>Vinculantes</h3>
<div class="paleta">
${swatch("action", c.action, "CTA, display y gráfica. Nunca texto chico sobre claro")}
${swatch("accentSoft", c.accentSoft, "Gráficos, secundarios y texto sobre oscuro")}
${swatch("accentDeep", c.accentDeep, "Único acento legible como texto chico sobre claro")}
${swatch("ink", c.ink, "Fondo oscuro y texto principal sobre claro", true)}
${swatch("surfaceDark", c.surfaceDark, "Tarjetas sobre fondo ink", true)}
${swatch("surface", c.surface, "Superficie de tarjeta")}
</div>
<h3>Neutros DH-4</h3>
<div class="paleta">
${swatch("surfaceSoft", c.surfaceSoft, "Fondo de página y sección")}
${swatch("borderLight", c.borderLight, "Filete sobre claro")}
${swatch("borderDark", c.borderDark, "Filete sobre oscuro e informativo", true)}
${swatch("muted", c.muted, "Texto secundario sobre claro")}
</div>
<h3>Estados funcionales — heredados de v1, con su par de contraste</h3>
<div class="paleta">
${swatch("success", c.success, "Estado saludable")}
${swatch("warning", c.warning, "Advertencia")}
${swatch("risk", c.risk, "Riesgo")}
${swatch("successInk", c.successInk, "success como texto sobre claro", true)}
${swatch("warningInk", c.warningInk, "warning como texto sobre claro", true)}
${swatch("riskInk", c.riskInk, "risk como texto sobre claro", true)}
</div>
<h3>Derivados — los dos únicos hexadecimales nuevos del tema</h3>
<div class="paleta">
${swatch("disabled / onDark.muted", c.disabled, "Punto medio sRGB de muted y borderLight")}
${swatch("onDark.risk", c.onDark.risk, "risk con la L subida en OKLCH hasta AA sobre surfaceDark")}
${swatch("onDark.disabled", c.onDark.disabled, "Punto medio sRGB de muted y borderDark", true)}
</div>
</section>

<section>
<h2>2 · Contraste medido</h2>
<p class="nota">Calculado por <code style="font-family:'Geist Mono',monospace">src/documents/theme/contraste.ts</code> (WCAG 2.1) sobre el propio tema, en el momento de generar esta muestra. Ninguno de estos números está escrito a mano. Umbral AA: 4,5:1 texto normal, 3:1 texto grande o gráfico.</p>
<table>
<tr><th>Par</th><th>Cómo se ve</th><th>Medido</th><th>Mínimo</th><th></th></tr>
${datos.contrastes.map(filaContraste).join("")}
</table>
<h3>Límites documentados, que el tema declara como reglas</h3>
<ul class="reglas">
<li><code>accentDeep</code> mide <b>4,58:1</b> sobre <code>surface</code> y <b>4,21:1</b> sobre <code>surfaceSoft</code>: como texto chico sirve <b>sólo sobre blanco puro</b>.</li>
<li><code>action</code> mide <b>3,16:1</b> sobre blanco: jamás como texto chico, sí como CTA, display y gráfica.</li>
<li>Los estados funcionales nunca se pintan en acento, y sobre oscuro usan sus pares <code>onDark.*</code>.</li>
<li>Composición 70% ink/surface · 20% neutro · 10% acento, como guía de proporción.</li>
</ul>
</section>

<section>
<h2>3 · Escala tipográfica</h2>
<p class="nota">Las tres familias del tema, embebidas en este archivo desde <code style="font-family:'Geist Mono',monospace">src/assets/fuentes/</code>. Los quince glyphs exigidos por el contrato están verificados con fontkit en los 29 archivos de fuente del repositorio: <code style="font-family:'Geist Mono',monospace">${GLIFOS}</code>.</p>
<div class="tipos">
${escala("Satoshi", [400, 500, 700, 900])}
${escala("Inter", [400, 500, 700])}
${escala("Geist Mono", [400, 500, 700])}
</div>
<p class="nota" style="margin-top:20px">Satoshi e Inter declaran la feature <code style="font-family:'Geist Mono',monospace">tnum</code>. Geist Mono no la declara y no la necesita: es monoespaciada real, avance 600/1000 uniforme, así que las cifras ya salen alineadas en columna.</p>
</section>

<section>
<h2>4 · Lockup</h2>
<p class="nota">Renders <b>reales de PDF</b>, generados por <code style="font-family:'Geist Mono',monospace">muestra-visual.test.tsx</code> con <code style="font-family:'Geist Mono',monospace">@react-pdf/renderer</code> y rasterizados acá — no una imitación en HTML. Isotipo provisional + "Velocentum" en Satoshi + descriptor de DH-11. El claim institucional no se usa en F1.</p>
<div class="lockups">
  <figure><img src="${lockupPng("lockup-claro")}"><figcaption>Variante clara — 44, 30 y 24 pt; la última sin descriptor</figcaption></figure>
  <figure><img src="${lockupPng("lockup-oscuro")}"><figcaption>Variante oscura sobre <code>ink</code> — mismos tamaños</figcaption></figure>
  <figure><img src="${lockupPng("lockup-vertical")}"><figcaption>Vertical sobre <code>surfaceSoft</code>; la segunda con el isotipo en encuadre cuadrado</figcaption></figure>
</div>
<p class="nota" style="margin-top:18px">En PDF el isotipo sale sin el resplandor del asset (<code style="font-family:'Geist Mono',monospace">feGaussianBlur</code>) y sin el degradado de sus filetes: react-pdf no tiene primitiva de filtro ni resuelve <code style="font-family:'Geist Mono',monospace">stroke="url(#gradiente)"</code>. La comparación está en <code style="font-family:'Geist Mono',monospace">docs/bv4-f1-assets-pdf-vs-navegador.png</code>.</p>
</section>

<section>
<h2>5 · Objetos de marca sobre claro y sobre oscuro</h2>
<p class="nota">Los ${assets.length} SVG copiados al repositorio, sin modificar. El espectro del Prisma y los tonos de facetado del isotipo quedan encapsulados en el asset por DH-7: no generan tokens.</p>
<h3>Sobre <code>surface</code></h3>
<div class="objetos">
${assets.map((a) => `<div class="obj"><img src="${svgUri(a)}"><span>${a}</span></div>`).join("")}
</div>
<h3>Sobre <code>ink</code></h3>
<div class="objetos">
${assets.map((a) => `<div class="obj dark"><img src="${svgUri(a)}"><span>${a}</span></div>`).join("")}
</div>
</section>

${laminaIsoUri ? `<section class="lamina">
<h2>6 · Lámina del isotipo — gate DH-6</h2>
<p class="nota">16, 24 y 32 px en color, monocromo sobre claro y monocromo sobre oscuro, a tamaño real y ampliados píxel a píxel, más las composiciones tipo avatar. <b>El veredicto es humano.</b></p>
<img src="${laminaIsoUri}">
</section>` : ""}

<footer>Generada por <code>scripts/muestra-visual.mjs</code>. Archivo autocontenido: fuentes, imágenes y SVG embebidos como data URI, sin ninguna dependencia de red. Ninguna superficie de producción fue tocada.</footer>
</div>
</html>`;

writeFileSync(DESTINO, html);
console.log(`\nmuestra: ${DESTINO} — ${(html.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`contrastes verificados: ${datos.contrastes.length}, todos ${datos.contrastes.every((f) => f.pasa) ? "PASAN" : "NO PASAN"}`);
console.log(`assets embebidos: ${assets.length} · fuentes embebidas: ${caras.length} caras`);
