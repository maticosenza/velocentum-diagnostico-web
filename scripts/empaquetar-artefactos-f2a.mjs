#!/usr/bin/env node
/**
 * ZIP de artefactos para la auditoría externa — BV4 F2a, etapa 6.
 *
 * Hermano de `empaquetar-artefactos.mjs` (F1), con la lista de artefactos de
 * esta fase. Se escribió al lado en vez de generalizar el de F1 para que el
 * ZIP de F1 siga siendo reproducible exactamente como fue auditado.
 *
 * Crea un worktree LIMPIO del commit candidato, copia desde ahí los
 * documentos que la auditoría necesita, suma los logs de QA y los PDFs
 * generados, y empaqueta todo. El worktree se elimina al terminar.
 *
 * Trabaja siempre sobre el commit, nunca sobre el árbol de trabajo: si algo
 * no está commiteado, no entra al ZIP. Es a propósito.
 *
 *   node scripts/empaquetar-artefactos-f2a.mjs <commit> <dir-logs-qa> <dir-pdfs> [salida.zip]
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...args) => execFileSync("git", args, { cwd: RAIZ, encoding: "utf8" }).trim();

const commit = process.argv[2];
const dirLogs = process.argv[3] ? resolve(process.argv[3]) : null;
const dirPdfs = process.argv[4] ? resolve(process.argv[4]) : null;
if (!commit) {
  console.error("uso: node scripts/empaquetar-artefactos-f2a.mjs <commit> <dir-logs-qa> <dir-pdfs> [salida.zip]");
  process.exit(1);
}

const sucio = git("status", "--short");
if (sucio) { console.error(`El árbol de trabajo no está limpio:\n${sucio}`); process.exit(1); }

const hash = git("rev-parse", commit);
const corto = hash.slice(0, 7);
const salida = resolve(process.argv[5] ?? join(RAIZ, "artefactos", `bv4-f2a-artefactos-${corto}.zip`));

/** Lo que la auditoría externa necesita, tal como quedó commiteado. */
const ARTEFACTOS = [
  "docs/bv4-f2a-diagnostico.md",
  "docs/bv4-f2a-gate-navegador.md",
  "docs/bv4-f2a-handoff.md",
  "docs/bv4-contrato-maestro.md",
  "docs/prompts/bv4-f2a-panel-comercial-prompt.md",
  // Ronda 3: el prompt verbatim de la excepción autorizada y lo que la ronda
  // encontró sin corregir, con ID.
  "docs/prompts/bv4-f2a-ronda3-roadmap-prompt.md",
  "docs/bv4-f2a-hallazgos-diferidos.md",
  "docs/funcional/f2a-panel-comercial-reconciliado.md",
  "docs/funcional/f2a-textos-servicios.md",
];

const wt = mkdtempSync(join(tmpdir(), "bv4-f2a-worktree-"));
const staging = mkdtempSync(join(tmpdir(), "bv4-f2a-zip-"));
const raizZip = join(staging, `bv4-f2a-artefactos-${corto}`);
try {
  git("worktree", "add", "--detach", wt, hash);
  const suciedad = execFileSync("git", ["status", "--short"], { cwd: wt, encoding: "utf8" }).trim();
  if (suciedad) throw new Error(`El worktree no salió limpio:\n${suciedad}`);

  mkdirSync(raizZip, { recursive: true });
  const faltan = [];
  for (const rel of ARTEFACTOS) {
    const origen = join(wt, rel);
    if (!existsSync(origen)) { faltan.push(rel); continue; }
    const destino = join(raizZip, rel);
    mkdirSync(dirname(destino), { recursive: true });
    cpSync(origen, destino);
  }
  if (faltan.length) throw new Error(`Faltan artefactos en el commit ${corto}:\n  ${faltan.join("\n  ")}`);

  const copiarDir = (origen, nombre) => {
    if (!origen || !existsSync(origen)) return [];
    const destino = join(raizZip, nombre);
    mkdirSync(destino, { recursive: true });
    const copiados = [];
    for (const f of readdirSync(origen)) {
      if (statSync(join(origen, f)).isFile()) { cpSync(join(origen, f), join(destino, f)); copiados.push(f); }
    }
    return copiados.sort();
  };
  // El LEEME nombra los archivos que EFECTIVAMENTE entraron, uno por uno.
  // Antes describía de memoria lo que solía haber ("candidato y base"), y en
  // la ronda 3 esa descripción ya no era cierta: el ZIP no lleva logs del
  // base. Un índice que no coincide con el contenido es peor que no tenerlo.
  const logs = copiarDir(dirLogs, "qa");
  const pdfs = copiarDir(dirPdfs, "pdfs");

  writeFileSync(join(raizZip, "LEEME.txt"), [
    "BV4 · F2a Panel de selección comercial — artefactos para auditoría externa",
    "",
    `Commit candidato: ${hash}`,
    "Rama: feat/bv4-rebranding (LOCAL, sin push)",
    `Base de la fase: ${git("rev-parse", "043ba08")}`,
    `Generado: ${new Date().toISOString()}`,
    "",
    "Todo lo de acá salió de un worktree limpio de ese commit: nada viene del",
    "árbol de trabajo. Los logs de qa/ son la salida cruda de las corridas.",
    "",
    "Contenido:",
    ...ARTEFACTOS.map((a) => `  ${a}`),
    `  qa/     — ${logs.length} archivos, salida cruda de las corridas:`,
    ...logs.map((f) => `    qa/${f}`),
    `  pdfs/   — ${pdfs.length} archivos, propuestas de los dos casos × dos perfiles:`,
    ...pdfs.map((f) => `    pdfs/${f}`),
    "",
    "El gate en navegador lo ejecuta Matías; los pasos exactos están en",
    "docs/bv4-f2a-gate-navegador.md.",
    "",
  ].join("\n"));

  mkdirSync(dirname(salida), { recursive: true });
  rmSync(salida, { force: true });
  execFileSync("zip", ["-rq", salida, basename(raizZip)], { cwd: staging });
  const sha = execFileSync("shasum", ["-a", "256", salida], { encoding: "utf8" }).trim();
  console.log(`ZIP: ${salida}`);
  console.log(`SHA-256: ${sha.split(/\s+/)[0]}`);
  console.log(`Commit candidato: ${hash}`);
} finally {
  git("worktree", "remove", wt, "--force");
  rmSync(staging, { recursive: true, force: true });
}
