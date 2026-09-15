/**
 * Los 14 tokens de color de `docs/especificacion-visual-pdfs-fases-11-13.md`,
 * sección 3. Nombres en inglés (mismo criterio que el tema ya tenía) con un
 * comentario que apunta al nombre en español de la especificación.
 *
 * EXTENSIÓN BV4, 2026-08-31: `colors` suma campos OPCIONALES al final.
 * Aditiva y retrocompatible por construcción — `velocentum-light/v1` no se
 * modificó y sigue satisfaciendo el tipo, con su test intacto.
 *
 * F2b (2026-09-15): salen los campos opcionales que solo usaba
 * `velocentum-crystal/v1` (retirado, DH-10); ningún renderer los leía.
 * Quedan los que usa `velocentum-web/v1`.
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

    // --- Extensión aditiva BV4 --------------------------------------------
    // Opcionales: `velocentum-light/v1` no los declara y sigue satisfaciendo
    // el contrato sin ningún cambio.

    /** Color de acción: el CTA (DH-5). */
    action?: string;
    /** Serie de gráficos, en orden de uso. */
    chart?: readonly string[];
  };
  typography: {
    heading: string;
    body: string;
    /**
     * Monoespaciada (DH-9). Opcional: `velocentum-light/v1` no la declara y
     * sigue siendo válido.
     */
    mono?: string;
    /** Los roles que le corresponden a `mono`, declarados como dato para que se puedan verificar. */
    monoRoles?: readonly string[];
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
