import { describe, expect, it } from "vitest";
import { VELOCENTUM_CRYSTAL_V1 } from "./velocentum-crystal-v1";
import { VELOCENTUM_LIGHT_V1 } from "./velocentum-light-v1";
import {
  TEMAS_DOCUMENTALES,
  TEMA_DOCUMENTAL_ACTIVO,
  temaDocumentalActivo,
} from "./tema-activo";

/**
 * Test propio del tema de marca (BV4 F1, etapa 2). Análogo al de
 * `velocentum-light-v1`, que NO se toca: v1 es el ancla de rollback y
 * conserva su test tal cual estaba.
 */
describe("tema de marca velocentum-crystal/v1", () => {
  it("se llama por su identidad, no 'v2': ese nombre es del motor documental", () => {
    expect(VELOCENTUM_CRYSTAL_V1.id).toBe("velocentum-crystal/v1");
    expect(VELOCENTUM_CRYSTAL_V1.id).not.toBe(VELOCENTUM_LIGHT_V1.id);
  });

  it("fija los 14 tokens del contrato original sin aproximar ningún valor", () => {
    const { colors } = VELOCENTUM_CRYSTAL_V1;
    expect(colors.primary).toBe("#D92F6E");
    expect(colors.primaryBright).toBe("#FF4B8D");
    expect(colors.accent).toBe("#FF85B8");
    expect(colors.ink).toBe("#0E0E13");
    expect(colors.text).toBe("#1A1A23");
    expect(colors.muted).toBe("#6E6E7A");
    expect(colors.background).toBe("#F5F5F7");
    expect(colors.surface).toBe("#FFFFFF");
    expect(colors.surfaceSoft).toBe("#F5F5F7");
    expect(colors.border).toBe("#E9E9EE");
    expect(colors.borderSoft).toBe("#E9E9EE");
    expect(colors.success).toBe("#20A464");
    expect(colors.warning).toBe("#FBBF24");
    expect(colors.risk).toBe("#D64A4A");
  });

  it("conserva intactos los seis hexes vinculantes de la paleta del rebranding", () => {
    const { colors } = VELOCENTUM_CRYSTAL_V1;
    expect({
      action: colors.action,
      accentSoft: colors.accentSoft,
      accentDeep: colors.accentDeep,
      ink: colors.ink,
      surfaceDark: colors.surfaceDark,
      surface: colors.surface,
    }).toEqual({
      action: "#FF4B8D",
      accentSoft: "#FF85B8",
      accentDeep: "#D92F6E",
      ink: "#0E0E13",
      surfaceDark: "#1A1A23",
      surface: "#FFFFFF",
    });
  });

  it("conserva intactos los cuatro neutros preaprobados por DH-4", () => {
    const { colors } = VELOCENTUM_CRYSTAL_V1;
    expect({
      surfaceSoft: colors.surfaceSoft,
      borderLight: colors.borderLight,
      borderDark: colors.borderDark,
      muted: colors.muted,
    }).toEqual({
      surfaceSoft: "#F5F5F7",
      borderLight: "#E9E9EE",
      borderDark: "#2A2A35",
      muted: "#6E6E7A",
    });
  });

  it("hereda los estados funcionales de v1 sin cambiar un dígito", () => {
    expect(VELOCENTUM_CRYSTAL_V1.colors.success).toBe(VELOCENTUM_LIGHT_V1.colors.success);
    expect(VELOCENTUM_CRYSTAL_V1.colors.warning).toBe(VELOCENTUM_LIGHT_V1.colors.warning);
    expect(VELOCENTUM_CRYSTAL_V1.colors.risk).toBe(VELOCENTUM_LIGHT_V1.colors.risk);
  });

  it("no pinta ningún estado funcional en acento", () => {
    const { colors } = VELOCENTUM_CRYSTAL_V1;
    const acentos = new Set<string>([colors.action, colors.accentSoft, colors.accentDeep]);
    const estados = [
      colors.success,
      colors.warning,
      colors.risk,
      colors.successInk,
      colors.warningInk,
      colors.riskInk,
      colors.onDark?.success,
      colors.onDark?.warning,
      colors.onDark?.risk,
      colors.info,
    ];
    for (const estado of estados) {
      expect(acentos.has(estado)).toBe(false);
    }
  });

  it("replica el par de contraste web de v1 (patrón --vdoc-*-ink), en mayúsculas", () => {
    const { colors } = VELOCENTUM_CRYSTAL_V1;
    expect(colors.successInk).toBe("#157A4C");
    expect(colors.warningInk).toBe("#92400E");
    expect(colors.riskInk).toBe("#B23636");
  });

  it("declara sólo dos hexes derivados en todo el tema, y son los documentados", () => {
    const { colors } = VELOCENTUM_CRYSTAL_V1;
    // #ACACB4 = punto medio sRGB de muted y borderLight; #4C4C58 = punto
    // medio sRGB de muted y borderDark; #E05352 = risk con L subida en OKLCH.
    const medio = (a: string, b: string) => {
      const A = Number.parseInt(a.slice(1), 16);
      const B = Number.parseInt(b.slice(1), 16);
      const c = (sh: number) => Math.round((((A >> sh) & 255) + ((B >> sh) & 255)) / 2);
      return `#${[c(16), c(8), c(0)].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    };
    expect(colors.disabled).toBe(medio(colors.muted, colors.borderLight as string));
    expect(colors.disabled).toBe("#ACACB4");
    expect(colors.onDark?.muted).toBe(colors.disabled);
    expect(colors.onDark?.disabled).toBe(medio(colors.muted, colors.borderDark as string));
    expect(colors.onDark?.disabled).toBe("#4C4C58");
    expect(colors.onDark?.risk).toBe("#E05352");
  });

  it("arma las series de gráfico y la tabla sólo con hexes ya definidos en el tema", () => {
    const { colors } = VELOCENTUM_CRYSTAL_V1;
    const definidos = new Set<string>([
      colors.action as string,
      colors.accentSoft as string,
      colors.accentDeep as string,
      colors.ink,
      colors.surfaceDark as string,
      colors.surface,
      colors.surfaceSoft,
      colors.borderLight as string,
      colors.borderDark as string,
      colors.muted,
    ]);
    expect(colors.chart).toEqual(["#FF4B8D", "#0E0E13", "#6E6E7A", "#FF85B8", "#2A2A35"]);
    for (const serie of colors.chart ?? []) expect(definidos.has(serie)).toBe(true);
    for (const valor of Object.values(colors.table ?? {})) expect(definidos.has(valor)).toBe(true);
    for (const valor of Object.values(colors.print ?? {})) expect(definidos.has(valor)).toBe(true);
  });

  it("respeta la regla de impresión: contenido claro, ink de texto, acento controlado", () => {
    const { print } = VELOCENTUM_CRYSTAL_V1.colors;
    expect(print?.surface).toBe("#FFFFFF");
    expect(print?.ink).toBe("#0E0E13");
    expect(print?.accent).toBe("#D92F6E");
    // El acento de impresión es accentDeep, nunca `action`: en A4 el texto
    // acentuado va sobre claro y `action` no llega a AA como texto chico.
    expect(print?.accent).not.toBe(VELOCENTUM_CRYSTAL_V1.colors.action);
  });

  it("hereda de v1 familias, pesos, espaciado y radios (nada de eso es vinculante en BV4)", () => {
    const { mono, monoRoles, ...heredado } = VELOCENTUM_CRYSTAL_V1.typography;
    expect(heredado).toEqual(VELOCENTUM_LIGHT_V1.typography);
    expect(VELOCENTUM_CRYSTAL_V1.spacing).toEqual(VELOCENTUM_LIGHT_V1.spacing);
    expect(VELOCENTUM_CRYSTAL_V1.radius).toEqual(VELOCENTUM_LIGHT_V1.radius);
    // Lo único que crystal suma a la tipografía es el rol mono (etapa 3).
    expect(mono).toBe("Geist Mono");
    expect(monoRoles).toEqual(["labels", "estados", "identificadores", "microcopy-tecnico"]);
  });

  it("v1 sigue sin declarar mono: la extensión de tipografía es aditiva", () => {
    expect(VELOCENTUM_LIGHT_V1.typography).not.toHaveProperty("mono");
  });

  it("los pesos que el rol mono puede pedir están declarados en el tema", () => {
    const { weightRegular, weightMedium, weightSemiBold, weightBold } = VELOCENTUM_CRYSTAL_V1.typography;
    // Son exactamente los cuatro que `registrar-fuentes.ts` registra para
    // "Geist Mono". react-pdf no degrada: pedir otro peso rompe el render.
    expect([weightRegular, weightMedium, weightSemiBold, weightBold]).toEqual([400, 500, 600, 700]);
  });

  it("no modifica el tema v1: sigue siendo el ancla de rollback", () => {
    expect(VELOCENTUM_LIGHT_V1.id).toBe("velocentum-light/v1");
    expect(VELOCENTUM_LIGHT_V1.colors.primary).toBe("#3B2EF5");
    expect(VELOCENTUM_LIGHT_V1.colors.surface).toBe("#FFFFFF");
  });
});

describe("interruptor de tema documental", () => {
  it("arranca en el tema actual: ningún commit deja crystal activo por defecto", () => {
    expect(TEMA_DOCUMENTAL_ACTIVO).toBe("velocentum-light-v1");
    expect(temaDocumentalActivo()).toBe(VELOCENTUM_LIGHT_V1);
    expect(temaDocumentalActivo().id).toBe("velocentum-light/v1");
  });

  it("expone los dos temas y sólo esos", () => {
    expect(Object.keys(TEMAS_DOCUMENTALES).sort()).toEqual([
      "velocentum-crystal-v1",
      "velocentum-light-v1",
    ]);
    expect(TEMAS_DOCUMENTALES["velocentum-crystal-v1"]).toBe(VELOCENTUM_CRYSTAL_V1);
  });
});
