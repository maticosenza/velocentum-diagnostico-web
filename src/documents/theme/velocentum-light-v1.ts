import type { DocumentTheme } from "./types";

/** Tema claro obligatorio para documentos compartidos e imprimibles. */
export const VELOCENTUM_LIGHT_V1 = {
  id: "velocentum-light/v1",
  colors: {
    primary: "#2A1EC9",
    accent: "#7B5CFF",
    ink: "#0F0A2E",
    muted: "#6B6880",
    background: "#FAF9FF",
    surface: "#FFFFFF",
    surfaceSoft: "#F2EFFF",
    border: "#E8E7F2",
    success: "#20A464",
    warning: "#FBBF24",
    risk: "#D64A4A",
  },
  typography: {
    heading: "Satoshi",
    body: "Inter",
    weightRegular: 400,
    weightMedium: 500,
    weightBold: 700,
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
