import { describe, expect, it } from "vitest";
import { VELOCENTUM_LIGHT_V1 } from "./velocentum-light-v1";

describe("tema documental Velocentum", () => {
  it("mantiene el tema claro, versionado y con estados no dependientes sólo del violeta", () => {
    expect(VELOCENTUM_LIGHT_V1.id).toBe("velocentum-light/v1");
    expect(VELOCENTUM_LIGHT_V1.colors.background).toBe("#FAF9FF");
    expect(VELOCENTUM_LIGHT_V1.colors.surface).toBe("#FFFFFF");
    expect(
      new Set([
        VELOCENTUM_LIGHT_V1.colors.success,
        VELOCENTUM_LIGHT_V1.colors.warning,
        VELOCENTUM_LIGHT_V1.colors.risk,
      ]).size,
    ).toBe(3);
  });

  it("usa los 14 tokens de color de la especificación visual, sin aproximar ningún valor", () => {
    expect(VELOCENTUM_LIGHT_V1.colors).toEqual({
      primary: "#3B2EF5",
      primaryBright: "#4B39FF",
      accent: "#7A6BFF",
      ink: "#0D0B2D",
      text: "#171437",
      muted: "#55546B",
      background: "#FAF9FF",
      surface: "#FFFFFF",
      surfaceSoft: "#F2EFFF",
      border: "#D9D3FF",
      borderSoft: "#E9E5FF",
      success: "#20A464",
      warning: "#FBBF24",
      risk: "#D64A4A",
    });
  });

  it("declara Satoshi para títulos/cifras e Inter para cuerpo, con los pesos que existen como archivo", () => {
    expect(VELOCENTUM_LIGHT_V1.typography.heading).toBe("Satoshi");
    expect(VELOCENTUM_LIGHT_V1.typography.body).toBe("Inter");
    expect(VELOCENTUM_LIGHT_V1.typography.weightRegular).toBe(400);
    expect(VELOCENTUM_LIGHT_V1.typography.weightBold).toBe(700);
    expect(VELOCENTUM_LIGHT_V1.typography.weightBlack).toBe(900);
  });
});
