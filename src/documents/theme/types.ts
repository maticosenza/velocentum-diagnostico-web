/**
 * Los 14 tokens de color de `docs/especificacion-visual-pdfs-fases-11-13.md`,
 * sección 3. Nombres en inglés (mismo criterio que el tema ya tenía) con un
 * comentario que apunta al nombre en español de la especificación.
 */
export type DocumentTheme = {
  id: string;
  colors: {
    /** Primario. */
    primary: string;
    /** Primario brillante: gradientes y estados activos. */
    primaryBright: string;
    /** Primario suave: gráficos y elementos secundarios. Antes "accent". */
    accent: string;
    /** Navy: títulos y cifras principales. */
    ink: string;
    /** Texto: cuerpo principal. */
    text: string;
    /** Texto secundario: explicaciones con contraste suficiente. Antes "muted". */
    muted: string;
    /** Fondo general. */
    background: string;
    /** Card: superficies. */
    surface: string;
    /** Fondo lavanda: secciones y destacados. */
    surfaceSoft: string;
    /** Borde: bordes visibles. */
    border: string;
    /** Borde suave: separadores. */
    borderSoft: string;
    /** Éxito: estado saludable. */
    success: string;
    /** Advertencia: datos pendientes y validaciones. */
    warning: string;
    /** Riesgo: alertas críticas. */
    risk: string;
  };
  typography: {
    heading: string;
    body: string;
    weightLight: number;
    weightRegular: number;
    weightMedium: number;
    weightSemiBold: number;
    weightBold: number;
    weightExtraBold: number;
    weightBlack: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
};
