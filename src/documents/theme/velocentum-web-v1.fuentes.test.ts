import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Fuentes de la interfaz con el tema `velocentum-web/v1` (DH-9, BV4 F2b).
 *
 * Fija cada woff2 por su SHA-256 (los mismos de los `PROCEDENCIA.md`) y
 * exige la licencia al lado de cada familia: DH-9 dice que una fuente sin
 * licencia no entra. También verifica que `styles.css` apunte a archivos que
 * existen. La verificación de glyphs se hizo con `fontkit` y está registrada
 * en cada `PROCEDENCIA.md` (fontkit no es dependencia directa de la suite).
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, "../..");
const FUENTES = join(SRC, "assets/fuentes");

const ARCHIVOS: [familia: string, archivo: string, sha256: string][] = [
  [
    "anton",
    "anton-latin.woff2",
    "23aab0b2692a0c89eb7997d3c7cf5bda41276d6cd4ab6cc0edc3edfcece32b09",
  ],
  [
    "anton",
    "anton-latin-ext.woff2",
    "ae1a8ac1c2899a66eed47a851201bb78a56664bf8da6d34a9ee226582d15ac19",
  ],
  [
    "manrope",
    "manrope-latin.woff2",
    "e310b55a7fd9677f5e3555e6c6c4d064fa1f1d24393f0ddbe217cea12a8c432f",
  ],
  [
    "manrope",
    "manrope-latin-ext.woff2",
    "ce093b341d9c10658ee1eaa85c5f8042ff3307bc6ccfc5f405616eb437f0009e",
  ],
  [
    "geist-mono",
    "geist-mono-latin.woff2",
    "5f3d6ad60f29d6cb708414ec6887163d63bf197377ef5417d2483ff31ace6c3b",
  ],
  [
    "geist-mono",
    "geist-mono-latin-ext.woff2",
    "745994b5cd950ec201b66526375f057d540847cccfc70f4f24f5f571d26d3923",
  ],
];

const COPYRIGHT: Record<string, string> = {
  anton: "The Anton Project Authors",
  manrope: "The Manrope Project Authors",
  "geist-mono": "The Geist Project Authors",
};

describe("fuentes de velocentum-web/v1", () => {
  it.each(ARCHIVOS)("%s/%s es el archivo provisto, byte a byte", (familia, archivo, sha256) => {
    const bytes = readFileSync(join(FUENTES, familia, "woff2", archivo));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(sha256);
  });

  it.each(Object.keys(COPYRIGHT))(
    "%s tiene su licencia OFL y su procedencia al lado",
    (familia) => {
      const licencia = readFileSync(join(FUENTES, familia, "LICENSE.txt"), "utf-8");
      expect(licencia).toContain("SIL Open Font License, Version 1.1");
      expect(licencia).toContain(COPYRIGHT[familia]);
      expect(existsSync(join(FUENTES, familia, "PROCEDENCIA.md"))).toBe(true);
    },
  );

  it("cada url() de styles.css apunta a un archivo que existe", () => {
    const hoja = readFileSync(join(SRC, "styles.css"), "utf-8");
    const urls = [...hoja.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]!);
    expect(urls).toHaveLength(ARCHIVOS.length);
    for (const url of urls) expect(existsSync(resolve(SRC, url)), url).toBe(true);
  });
});
