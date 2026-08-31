/**
 * Los 14 tokens de color de `docs/especificacion-visual-pdfs-fases-11-13.md`,
 * sección 3. Nombres en inglés (mismo criterio que el tema ya tenía) con un
 * comentario que apunta al nombre en español de la especificación.
 *
 * EXTENSIÓN BV4 F1, 2026-08-31: `colors` suma campos OPCIONALES al final.
 * Aditiva y retrocompatible por construcción — `velocentum-light/v1` no se
 * modificó y sigue satisfaciendo el tipo, con su test intacto. Ver
 * `velocentum-crystal-v1.ts` para el porqué de cada campo nuevo.
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

    // --- Extensión aditiva BV4 F1 (2026-08-31) ---------------------------
    // Todos opcionales: `velocentum-light/v1` no los declara y sigue
    // satisfaciendo el contrato sin ningún cambio. Los usa
    // `velocentum-crystal/v1`, que necesita nombres que el juego original
    // de 14 no tiene (acentos con regla de uso, superficies oscuras y los
    // pares de contraste que hoy pdf-v2 resuelve con 17 literales sueltos).

    /** Acento de acción. CTA, display y gráfica. NUNCA texto chico sobre claro. */
    action?: string;
    /** Acento suave: gráficos, elementos secundarios y texto sobre oscuro. */
    accentSoft?: string;
    /** Acento profundo: el ÚNICO acento permitido como texto chico sobre claro. */
    accentDeep?: string;
    /** Superficie oscura: tarjetas y bloques sobre fondo `ink`. */
    surfaceDark?: string;
    /** Borde sobre superficie clara. */
    borderLight?: string;
    /** Borde sobre superficie oscura. */
    borderDark?: string;
    /** Deshabilitado sobre claro. Exento de AA (WCAG 1.4.3, componentes inactivos). */
    disabled?: string;
    /** Informativo. Neutro por regla: los estados funcionales nunca van en acento. */
    info?: string;
    /** Par de contraste de `success` como texto sobre claro (patrón `--vdoc-success-ink`). */
    successInk?: string;
    /** Par de contraste de `warning` como texto sobre claro (patrón `--vdoc-warning-ink`). */
    warningInk?: string;
    /** Par de contraste de `risk` como texto sobre claro (patrón `--vdoc-risk-ink`). */
    riskInk?: string;
    /** Serie de gráficos, en orden de uso. */
    chart?: readonly string[];
    /** Tabla: cabecera, cebra y filete. */
    table?: {
      headerBackground: string;
      headerText: string;
      stripe: string;
      rule: string;
    };
    /** Impresión: regla de perfil A4 (contenido claro, ink de texto, acento controlado). */
    print?: {
      surface: string;
      ink: string;
      rule: string;
      accent: string;
      /** Oscuro reservado: SOLO portada, separadores y cierre. */
      dark: string;
    };
    /** Pares de contraste sobre superficie oscura (`ink` y `surfaceDark`). */
    onDark?: {
      text: string;
      body: string;
      muted: string;
      border: string;
      disabled: string;
      success: string;
      warning: string;
      risk: string;
    };
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
