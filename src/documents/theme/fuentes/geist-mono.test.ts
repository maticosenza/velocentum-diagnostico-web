import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { Font } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { GEIST_MONO_DATA_URIS } from "./geist-mono-datos.generated";
import { registrarFuentesVelocentum } from "./registrar-fuentes";
import { VELOCENTUM_CRYSTAL_V1 } from "../velocentum-crystal-v1";
import { VELOCENTUM_LIGHT_V1 } from "../velocentum-light-v1";

/**
 * Geist Mono — BV4 F1, etapa 3.
 *
 * Fija el artefacto exacto que se bajó de la fuente oficial (repositorio de
 * Vercel, release v1.7.2) por su SHA-256, y verifica que el archivo de data
 * URIs siga byte a byte a esos archivos. Si alguien reemplaza una fuente por
 * otra versión, o edita a mano el `.generated.ts`, esto falla.
 *
 * La verificación de glyphs y de monoespaciado se hace con `fontkit` en
 * `scripts/verificar-fuentes.mjs` (fontkit es dependencia transitiva de
 * @react-pdf, no directa: no se importa desde la suite). Su salida está
 * registrada en `src/assets/fuentes/geist-mono/PROCEDENCIA.md`.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const OTF = join(AQUI, "../../../assets/fuentes/geist-mono/otf");

const ARCHIVOS: [clave: string, archivo: string, sha256: string][] = [
  ["400-normal", "GeistMono-Regular.otf", "1901cc38fc520e53a6ab4f19528f32cf7228dfcac676466377ca0816de03b49c"],
  ["500-normal", "GeistMono-Medium.otf", "24c946d8665495a8eb00bdfc666de2abea785dab3633be628a927f188a055b01"],
  ["600-normal", "GeistMono-SemiBold.otf", "d56bfbe7b7f9f7611d6b6b2e36be4badd7a6d2b6521ea826ec5bc734b25ec8d4"],
  ["700-normal", "GeistMono-Bold.otf", "7338b63c209b5d01cba6beb6f0ac3cae48ec92d09abd1e909ec3f3ad9057c376"],
];

describe("Geist Mono: archivos de la fuente oficial", () => {
  it.each(ARCHIVOS)("%s — %s conserva su SHA-256 de origen", (_clave, archivo, sha) => {
    const bytes = readFileSync(join(OTF, archivo));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(sha);
  });

  it("commitea la licencia junto a las fuentes: SIL OFL 1.1", () => {
    const licencia = readFileSync(join(OTF, "../LICENSE.txt"), "utf8");
    expect(licencia).toContain("SIL Open Font License, Version 1.1");
    expect(licencia).toContain("The Geist Project Authors");
  });
});

describe("Geist Mono: data URIs generados", () => {
  it("tiene exactamente las cuatro claves de peso registradas, y ninguna más", () => {
    expect(Object.keys(GEIST_MONO_DATA_URIS)).toEqual([
      "400-normal",
      "500-normal",
      "600-normal",
      "700-normal",
    ]);
  });

  it.each(ARCHIVOS)("%s decodifica byte a byte al archivo %s", (clave, archivo) => {
    const uri = GEIST_MONO_DATA_URIS[clave as keyof typeof GEIST_MONO_DATA_URIS];
    const prefijo = "data:font/otf;base64,";
    expect(uri.startsWith(prefijo)).toBe(true);
    const decodificado = Buffer.from(uri.slice(prefijo.length), "base64");
    expect(decodificado.equals(readFileSync(join(OTF, archivo)))).toBe(true);
  });

  it("no apunta a ninguna URL: el render no depende de red ni de filesystem", () => {
    for (const uri of Object.values(GEIST_MONO_DATA_URIS)) {
      expect(uri.startsWith("data:")).toBe(true);
      expect(uri).not.toMatch(/https?:\/\//);
    }
  });
});

describe("Geist Mono: registro en @react-pdf/renderer", () => {
  it("queda registrada como familia 'Geist Mono' con sus cuatro pesos romanos", () => {
    registrarFuentesVelocentum();
    const familias = Font.getRegisteredFonts();
    expect(Object.keys(familias)).toContain("Geist Mono");
    const geist = familias["Geist Mono"]!;
    const fuentes = Object.values(geist.sources ?? geist);
    expect(fuentes.length).toBe(4);
  });

  it("no desplaza a Satoshi ni a Inter: las tres familias conviven", () => {
    registrarFuentesVelocentum();
    const familias = Object.keys(Font.getRegisteredFonts());
    expect(familias).toContain("Satoshi");
    expect(familias).toContain("Inter");
    expect(familias).toContain("Geist Mono");
  });
});

describe("Geist Mono: rol tipográfico en el tema", () => {
  it("lo declara sólo el tema de marca, y v1 sigue sin conocerlo", () => {
    expect(VELOCENTUM_CRYSTAL_V1.typography.mono).toBe("Geist Mono");
    expect(VELOCENTUM_LIGHT_V1.typography).not.toHaveProperty("mono");
  });

  it("define el rol como dato verificable, no como comentario", () => {
    expect(VELOCENTUM_CRYSTAL_V1.typography.monoRoles).toEqual([
      "labels",
      "estados",
      "identificadores",
      "microcopy-tecnico",
    ]);
  });
});
