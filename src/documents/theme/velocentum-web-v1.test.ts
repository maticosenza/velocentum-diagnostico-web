import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ACENTOS_WEB_V1,
  PALETA_WEB_V1,
  REBAJADOS_WEB_V1,
  ROLES_WEB_V1,
  TOKENS_CSS_EXCLUIDOS_WEB_V1,
  TOKENS_CSS_WEB_V1,
  TOKENS_PROPIOS_WEB_V1,
  VELOCENTUM_WEB_V1,
} from "./velocentum-web-v1";
import { VELOCENTUM_LIGHT_V1 } from "./velocentum-light-v1";
import { TEMAS_DOCUMENTALES, TEMA_DOCUMENTAL_ACTIVO, temaDocumentalActivo } from "./tema-activo";
import { mezclar } from "./contraste";
import { variablesEnMedia, variablesRaiz } from "./leer-css";

/**
 * Test del tema `velocentum-web/v1` (BV4 F2b). Reemplaza al de
 * `velocentum-crystal/v1`, retirado por DH-10.
 *
 * `tokens.css` manda en los valores (DH-4): este test lee el archivo y
 * falla si el tema en TS o `src/styles.css` se separan de él, o si tokens.css
 * trae un token nuevo que nadie decidió si entra.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const TOKENS_CSS = readFileSync(join(AQUI, "fuente-web-v1/tokens.css"), "utf-8");
const STYLES_CSS = readFileSync(join(AQUI, "../../styles.css"), "utf-8");
const ROOT_TSX = readFileSync(join(AQUI, "../../routes/__root.tsx"), "utf-8");

/** Hex sin distinguir mayúsculas; el resto, con espacios normalizados. */
const igual = (v: string) => v.replace(/\s+/g, " ").trim().toLowerCase();

const fuente = variablesRaiz(TOKENS_CSS);
const hoja = variablesRaiz(STYLES_CSS);

describe("velocentum-web/v1 — tokens.css manda en los valores", () => {
  it("lee tokens.css", () => {
    expect(fuente.get("--fondo")).toBe("#FDFCFA");
    expect(fuente.size).toBeGreaterThan(40);
  });

  it("cada token de tokens.css entra con su valor exacto, o está excluido con motivo", () => {
    const tema = TOKENS_CSS_WEB_V1 as Record<string, string>;
    const excluidos = TOKENS_CSS_EXCLUIDOS_WEB_V1 as Record<string, string>;
    const sinDecidir: string[] = [];
    for (const [nombre, valor] of fuente) {
      if (nombre in excluidos) continue;
      if (!(nombre in tema)) {
        sinDecidir.push(nombre);
        continue;
      }
      expect(igual(tema[nombre]!), nombre).toBe(igual(valor));
    }
    expect(sinDecidir).toEqual([]);
  });

  it("el tema no inventa tokens: todo lo que declara está en tokens.css", () => {
    for (const nombre of Object.keys(TOKENS_CSS_WEB_V1))
      expect(fuente.has(nombre), nombre).toBe(true);
    for (const nombre of Object.keys(TOKENS_CSS_EXCLUIDOS_WEB_V1))
      expect(fuente.has(nombre), nombre).toBe(true);
  });

  it("navy es el único token propio, y tokens.css no lo trae (DH-4)", () => {
    expect(TOKENS_PROPIOS_WEB_V1).toEqual({ "--navy": "#0F2050" });
    expect(fuente.has("--navy")).toBe(false);
  });

  it("los acentos llevan el par de texto que declara tokens.css", () => {
    for (const { token, color, texto } of Object.values(ACENTOS_WEB_V1)) {
      expect(igual(fuente.get(`--acento-${token}`)!)).toBe(igual(color));
      expect(igual(fuente.get(`--texto-sobre-${token}`)!)).toBe(igual(texto));
    }
  });
});

describe("velocentum-web/v1 — src/styles.css aplica el tema", () => {
  it("declara cada token que entra, con el valor de tokens.css", () => {
    for (const [nombre, valor] of Object.entries(TOKENS_CSS_WEB_V1)) {
      expect(hoja.get(nombre), nombre).toBeDefined();
      expect(igual(hoja.get(nombre)!), nombre).toBe(igual(valor));
    }
    expect(hoja.get("--navy")).toBe(PALETA_WEB_V1.navy);
  });

  it("no declara nada de lo excluido: ni el rosa (DH-5) ni las mecánicas del sitio (DH-13)", () => {
    for (const nombre of Object.keys(TOKENS_CSS_EXCLUIDOS_WEB_V1))
      expect(hoja.has(nombre), nombre).toBe(false);
    expect(STYLES_CSS.toUpperCase()).not.toContain("#FF1F6B");
  });

  it("copia la escala responsive y el movimiento reducido de tokens.css", () => {
    expect([...variablesEnMedia(STYLES_CSS, "max-width: 809px")]).toEqual([
      ...variablesEnMedia(TOKENS_CSS, "max-width: 809px"),
    ]);
    const reducido = variablesEnMedia(TOKENS_CSS, "prefers-reduced-motion: reduce");
    expect(reducido.size).toBe(4);
    expect([...variablesEnMedia(STYLES_CSS, "prefers-reduced-motion: reduce")]).toEqual([
      ...reducido,
    ]);
  });

  it("escribe cada rebajado como color-mix de la paleta, con el porcentaje del tema", () => {
    for (const [nombre, { color, pct, sobre }] of Object.entries(REBAJADOS_WEB_V1)) {
      expect(hoja.get(nombre), nombre).toBe(
        `color-mix(in srgb, var(${color}) ${pct}%, var(${sobre}))`,
      );
    }
  });

  it("los roles de la interfaz no tienen valor propio: todos apuntan a una variable", () => {
    const roles = [
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--destructive-foreground",
      "--estado-verde",
      "--estado-amarillo",
      "--estado-rojo",
      "--estado-sin-datos",
      "--border",
      "--input",
      "--ring",
      "--chart-1",
      "--chart-2",
      "--chart-3",
      "--chart-4",
      "--chart-5",
      "--sidebar",
      "--sidebar-foreground",
      "--sidebar-primary",
      "--sidebar-primary-foreground",
      "--sidebar-accent",
      "--sidebar-accent-foreground",
      "--sidebar-border",
      "--sidebar-ring",
    ];
    for (const rol of roles) expect(hoja.get(rol), rol).toMatch(/^var\(--[\w-]+\)$/);
  });

  it("CTA violeta con texto blanco (DH-5, enmienda de Matías del 2026-09-15)", () => {
    expect(ROLES_WEB_V1.cta).toBe("violeta");
    expect(hoja.get("--primary")).toBe("var(--acento-4)");
    expect(hoja.get("--primary-foreground")).toBe("var(--texto-sobre-4)");
  });

  it("estados: error bermellón, advertencia amarillo, éxito verde (DH-5)", () => {
    expect(ROLES_WEB_V1.estados).toEqual({
      error: "bermellon",
      advertencia: "amarillo",
      exito: "verde",
    });
    expect(hoja.get("--destructive")).toBe("var(--acento-2)");
    expect(hoja.get("--destructive-foreground")).toBe("var(--texto-sobre-2)");
    expect(hoja.get("--estado-rojo")).toBe("var(--acento-2)");
    expect(hoja.get("--estado-amarillo")).toBe("var(--acento-5)");
    expect(hoja.get("--estado-verde")).toBe("var(--acento-3)");
  });

  it("navegación en navy con blanco (DH-3)", () => {
    expect(hoja.get("--sidebar")).toBe("var(--navy)");
    expect(hoja.get("--sidebar-foreground")).toBe("var(--logo-blanco)");
  });

  it("carga las tres tipografías de DH-9 de archivos locales, sin CDN", () => {
    for (const familia of ["Anton", "Manrope", "Geist Mono"]) {
      expect(STYLES_CSS).toContain(`font-family: "${familia}";`);
    }
    expect(STYLES_CSS).not.toMatch(/https?:\/\//);
    expect(ROOT_TSX).not.toContain("fonts.googleapis");
    expect(ROOT_TSX).not.toContain("fonts.gstatic");
  });
});

describe("velocentum-web/v1 — el tema en TS", () => {
  const { colors, typography, spacing, radius } = VELOCENTUM_WEB_V1;

  it("se llama por su identidad, no 'v2': ese nombre es del motor documental (DH-10)", () => {
    expect(VELOCENTUM_WEB_V1.id).toBe("velocentum-web/v1");
  });

  it("mapea los 14 tokens del contrato original sobre la paleta, sin valores propios", () => {
    const { fondo, tinta, texto2, blanco } = PALETA_WEB_V1;
    const { azul, bermellon, verde, violeta, amarillo } = ACENTOS_WEB_V1;
    expect(colors).toMatchObject({
      primary: violeta.color,
      primaryBright: violeta.color,
      accent: azul.color,
      ink: tinta,
      text: tinta,
      muted: texto2,
      background: fondo,
      surface: blanco,
      surfaceSoft: mezclar(tinta, fondo, 0.04),
      border: mezclar(tinta, fondo, 0.14),
      borderSoft: mezclar(tinta, fondo, 0.14),
      success: verde.color,
      warning: amarillo.color,
      risk: bermellon.color,
      action: violeta.color,
    });
    expect(colors.chart).toEqual([
      azul.color,
      bermellon.color,
      verde.color,
      violeta.color,
      amarillo.color,
    ]);
  });

  it("no usa el rosa en ningún color (DH-5)", () => {
    expect(JSON.stringify(colors).toUpperCase()).not.toContain("#FF1F6B");
  });

  it("tipografías de DH-9", () => {
    expect(typography.heading).toBe("Anton");
    expect(typography.body).toBe("Manrope");
    expect(typography.mono).toBe("Geist Mono");
    // Manrope llega a 800: pedir 900 sería pedir un peso que no existe.
    expect(typography.weightBlack).toBe(800);
  });

  it("espaciado y radios salen de las escalas de tokens.css (DH-13)", () => {
    const px = (n: string) =>
      Number.parseInt(TOKENS_CSS_WEB_V1[n as keyof typeof TOKENS_CSS_WEB_V1], 10);
    expect(spacing).toEqual({
      xs: px("--space-1"),
      sm: px("--space-2"),
      md: px("--space-3"),
      lg: px("--space-4"),
      xl: px("--space-5"),
    });
    expect(radius).toEqual({ sm: px("--r-campo"), md: px("--r-media"), lg: px("--r-card") });
  });

  it("no modifica el tema v1: sigue siendo el ancla de rollback de los documentos", () => {
    expect(VELOCENTUM_LIGHT_V1.id).toBe("velocentum-light/v1");
    expect(VELOCENTUM_LIGHT_V1.colors.primary).toBe("#3B2EF5");
    expect(VELOCENTUM_LIGHT_V1.typography.heading).toBe("Satoshi");
    expect(VELOCENTUM_LIGHT_V1.typography.body).toBe("Inter");
  });
});

describe("interruptor de tema documental", () => {
  it("sigue en v1: los documentos adoptan el tema nuevo en F3b", () => {
    expect(TEMA_DOCUMENTAL_ACTIVO).toBe("velocentum-light-v1");
    expect(temaDocumentalActivo()).toBe(VELOCENTUM_LIGHT_V1);
  });

  it("expone v1 y el tema nuevo, y crystal ya no está (DH-10)", () => {
    expect(Object.keys(TEMAS_DOCUMENTALES).sort()).toEqual([
      "velocentum-light-v1",
      "velocentum-web-v1",
    ]);
    expect(TEMAS_DOCUMENTALES["velocentum-web-v1"]).toBe(VELOCENTUM_WEB_V1);
  });
});
