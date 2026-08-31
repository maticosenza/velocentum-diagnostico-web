#!/usr/bin/env node
/**
 * ZIP de artefactos para la auditoría externa — BV4 F1, etapa 6.3.
 *
 * Crea un worktree LIMPIO del commit candidato, copia desde ahí los
 * artefactos que la auditoría necesita, suma los logs de QA que se le pasen,
 * y empaqueta todo. El worktree se elimina al terminar.
 *
 * Trabaja siempre sobre el commit, nunca sobre el árbol de trabajo: si algo
 * no está commiteado, no entra al ZIP. Es a propósito.
 *
 *   node scripts/empaquetar-artefactos.mjs <commit> <dir-logs-qa> [salida.zip]
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
const salida = resolve(process.argv[4] ?? join(RAIZ, "artefactos", `bv4-f1-artefactos-${(commit ?? "HEAD").slice(0, 7)}.zip`));
if (!commit) { console.error("uso: node scripts/empaquetar-artefactos.mjs <commit> <dir-logs-qa> [salida.zip]"); process.exit(1); }

const sucio = git("status", "--short");
if (sucio) { console.error(`El árbol de trabajo no está limpio:\n${sucio}`); process.exit(1); }

const hash = git("rev-parse", commit);
const corto = hash.slice(0, 7);

/** Lo que la auditoría externa necesita, tal como quedó commiteado. */
const ARTEFACTOS = [
  "docs/bv4-f1-inventario.md",
  "docs/bv4-f1-isotipo-test.png",
  "docs/bv4-f1-assets-pdf-vs-navegador.png",
  "docs/bv4-f1-muestra-visual.html",
  "docs/bv4-contrato-maestro.md",
  "docs/prompts/bv4-f1-foundation-prompt.md",
  "src/documents/theme/marca/PROCEDENCIA.md",
  "src/assets/fuentes/geist-mono/PROCEDENCIA.md",
];

const wt = mkdtempSync(join(tmpdir(), "bv4-worktree-"));
const staging = mkdtempSync(join(tmpdir(), "bv4-zip-"));
const raizZip = join(staging, `bv4-f1-artefactos-${corto}`);
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

  if (dirLogs && existsSync(dirLogs)) {
    const destino = join(raizZip, "qa");
    mkdirSync(destino, { recursive: true });
    for (const f of readdirSync(dirLogs)) {
      if (statSync(join(dirLogs, f)).isFile()) cpSync(join(dirLogs, f), join(destino, f));
    }
  }

  writeFileSync(join(raizZip, "LEEME.txt"), [
    "BV4 · F1 Foundation — artefactos para auditoría externa",
    "",
    `Commit candidato: ${hash}`,
    `Rama: feat/bv4-rebranding (LOCAL, sin push)`,
    `Base: ${git("rev-parse", "831ef34")}`,
    `Generado: ${new Date().toISOString()}`,
    "",
    "Todo lo de acá salió de un worktree limpio de ese commit: nada viene del",
    "árbol de trabajo. Los logs de qa/ son la salida cruda de las corridas.",
    "",
    "Contenido:",
    ...ARTEFACTOS.map((a) => `  ${a}`),
    "  qa/*  — logs de npm test, typecheck, build y verificaciones",
    "",
  ].join("\n"));

  mkdirSync(dirname(salida), { recursive: true });
  rmSync(salida, { force: true });
  execFileSync("zip", ["-r", "-q", salida, basename(raizZip)], { cwd: staging });
  const bytes = statSync(salida).size;
  const sha = execFileSync("shasum", ["-a", "256", salida], { encoding: "utf8" }).split(" ")[0];
  console.log(`ZIP: ${salida}`);
  console.log(`     ${(bytes / 1024 / 1024).toFixed(2)} MB · SHA-256 ${sha}`);
  console.log(`     desde worktree limpio de ${hash}`);
} finally {
  try { git("worktree", "remove", "--force", wt); } catch { rmSync(wt, { recursive: true, force: true }); }
  rmSync(staging, { recursive: true, force: true });
}
