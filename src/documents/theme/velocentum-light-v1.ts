import type { DocumentTheme } from "./types";

/**
 * Tema claro obligatorio para documentos compartidos e imprimibles.
 * Paleta y tipografía reconciliadas con
 * `docs/especificacion-visual-pdfs-fases-11-13.md` (bloque visual,
 * 2026-08-22): los 14 tokens de color son los de la sección 3, sin
 * aproximar ningún valor.
 */
export const VELOCENTUM_LIGHT_V1 = {
  id: "velocentum-light/v1",
  colors: {
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
  },
  typography: {
    heading: "Satoshi",
    body: "Inter",
    weightLight: 300,
    weightRegular: 400,
    weightMedium: 500,
    weightSemiBold: 600,
    weightBold: 700,
    weightExtraBold: 800,
    weightBlack: 900,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 28,
  },
} as const satisfies DocumentTheme;
