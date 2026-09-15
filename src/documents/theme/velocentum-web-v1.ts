import type { DocumentTheme } from "./types";
import { mezclar } from "./contraste";

/**
 * Tema de marca `velocentum-web/v1` — Bloque Visual 4, fase F2b
 * (2026-09-15). Reemplaza a `velocentum-crystal/v1`, retirado por DH-10.
 *
 * Los valores son los de `fuente-web-v1/tokens.css` (fuente de verdad, DH-4)
 * más navy `#0F2050`, que el docx pide y tokens.css no trae (decisión de
 * Matías, DH-4). `velocentum-web-v1.test.ts` compara este archivo contra
 * tokens.css y contra `src/styles.css`; ninguno puede separarse en silencio.
 *
 * Hoy lo consume la interfaz, vía `src/styles.css`. Los documentos siguen en
 * `velocentum-light/v1` (el interruptor `tema-activo.ts` no cambia) y
 * adoptan este tema recién en F3b.
 *
 * ---------------------------------------------------------------------------
 * REGLAS DE USO (contrato BV4)
 * ---------------------------------------------------------------------------
 *
 * 1. CTA en violeta `#8A3FFC` con texto blanco: 5,00:1 (DH-5). El azul no:
 *    como texto chico sobre el fondo da 4,45:1 y no llega a AA.
 * 2. Estados (DH-5): error bermellón, advertencia amarillo, éxito verde,
 *    los tres con texto tinta. Como texto sobre el fondo ninguno llega a AA,
 *    así que se pintan como relleno, chip o indicador con su par, y siempre
 *    los acompaña un texto o un ícono.
 * 3. Los acentos como capítulo (DH-3) van en portadas, divisores y
 *    encabezados de sección, nunca en el cuerpo; siempre como relleno con su
 *    par de texto. Los estados viven sobre el fondo crema.
 * 4. Un color dominante y un solo acento por página. Ningún acento funciona
 *    como baño general.
 * 5. El rosa `#FF1F6B` está en tokens.css pero no entra a la herramienta
 *    (DH-5): un CTA rosa, vecino del bermellón, confundiría CTA con error.
 */

/** Superficie, texto y fondos de tokens.css, más navy (DH-4). */
export const PALETA_WEB_V1 = {
  fondo: "#FDFCFA",
  tinta: "#141024",
  texto2: "#6B6880",
  /** `--logo-blanco`, y el `--texto-sobre-*` de azul y violeta. */
  blanco: "#FFFFFF",
  /** `--logo-negro`. */
  negro: "#000000",
  /** Tono de fondo, no acento (tokens.css). */
  cielo: "#65AAF5",
  /** DH-4: entra como token por decisión de Matías; tokens.css no lo trae. */
  navy: "#0F2050",
} as const;

export type AcentoWeb = "azul" | "bermellon" | "verde" | "violeta" | "amarillo";

/** Los cinco acentos con su par de texto obligatorio (`--acento-N` / `--texto-sobre-N`). */
export const ACENTOS_WEB_V1 = {
  azul: { token: 1, color: "#1F6BFF", texto: "#FFFFFF" },
  bermellon: { token: 2, color: "#F5451F", texto: "#141024" },
  verde: { token: 3, color: "#00C878", texto: "#141024" },
  violeta: { token: 4, color: "#8A3FFC", texto: "#FFFFFF" },
  amarillo: { token: 5, color: "#FFC300", texto: "#141024" },
} as const satisfies Record<AcentoWeb, { token: number; color: string; texto: string }>;

/** Roles fijados por el contrato. */
export const ROLES_WEB_V1 = {
  /** DH-5, enmendada 2026-09-15 por Matías: violeta, no azul. */
  cta: "violeta",
  /** DH-5. */
  estados: { error: "bermellon", advertencia: "amarillo", exito: "verde" },
} as const satisfies {
  cta: AcentoWeb;
  estados: Record<"error" | "advertencia" | "exito", AcentoWeb>;
};

/**
 * Un color de la paleta rebajado sobre la superficie donde se apoya. No son
 * tonos nuevos: el docx pide "filas destacadas con el acento rebajado", y la
 * interfaz necesita superficies suaves (hover, pestañas, avisos) que la
 * paleta no trae como valor propio. En `styles.css` se escriben como
 * `color-mix(in srgb, <color> <pct>%, <sobre>)` y el test de contraste
 * verifica cada par que se apoya en ellos. El porcentaje de cada uno es el
 * más alto que deja pasar AA a todo el texto que va encima.
 */
export const REBAJADOS_WEB_V1 = {
  /** Hover, pestañas, rieles: `--muted`, `--accent`, `--secondary`. */
  "--superficie-suave": { color: "--tinta", pct: 4, sobre: "--fondo" },
  /** Selección y avisos informativos en violeta. */
  "--violeta-suave": { color: "--acento-4", pct: 5, sobre: "--fondo" },
  /** Filetes y separadores: decorativos, exentos de 3:1. */
  "--filete": { color: "--tinta", pct: 14, sobre: "--fondo" },
  /** Texto de apoyo sobre navy. */
  "--navy-texto-2": { color: "--logo-blanco", pct: 72, sobre: "--navy" },
  /** Hover sobre navy. */
  "--navy-hover": { color: "--logo-blanco", pct: 10, sobre: "--navy" },
  /** Ítem activo sobre navy y filetes sobre navy. */
  "--navy-activo": { color: "--logo-blanco", pct: 14, sobre: "--navy" },
} as const;

/**
 * Los tokens de tokens.css que entran a la herramienta, con su nombre y su
 * valor tal cual (DH-4, DH-13), más `--navy`. El test exige que tokens.css
 * y `styles.css` digan exactamente esto.
 */
export const TOKENS_CSS_WEB_V1 = {
  "--fondo": PALETA_WEB_V1.fondo,
  "--tinta": PALETA_WEB_V1.tinta,
  "--texto-2": PALETA_WEB_V1.texto2,
  "--acento-1": ACENTOS_WEB_V1.azul.color,
  "--texto-sobre-1": ACENTOS_WEB_V1.azul.texto,
  "--acento-2": ACENTOS_WEB_V1.bermellon.color,
  "--texto-sobre-2": ACENTOS_WEB_V1.bermellon.texto,
  "--acento-3": ACENTOS_WEB_V1.verde.color,
  "--texto-sobre-3": ACENTOS_WEB_V1.verde.texto,
  "--acento-4": ACENTOS_WEB_V1.violeta.color,
  "--texto-sobre-4": ACENTOS_WEB_V1.violeta.texto,
  "--acento-5": ACENTOS_WEB_V1.amarillo.color,
  "--texto-sobre-5": ACENTOS_WEB_V1.amarillo.texto,
  "--logo-negro": PALETA_WEB_V1.negro,
  "--logo-blanco": PALETA_WEB_V1.blanco,
  "--cielo": PALETA_WEB_V1.cielo,
  "--font-display": "'Anton', Impact, sans-serif",
  "--font-texto": "'Manrope', Arial, sans-serif",
  "--font-mono": "'Geist Mono', monospace",
  "--space-1": "4px",
  "--space-2": "8px",
  "--space-3": "16px",
  "--space-4": "24px",
  "--space-5": "32px",
  "--space-6": "48px",
  "--space-7": "64px",
  "--space-section": "100px",
  "--page-gutter": "16px",
  "--control-min-height": "48px",
  "--control-comfort-height": "56px",
  "--max-exterior": "1440px",
  "--max-contenido": "1200px",
  "--medida-parrafo": "650px",
  "--medida-titular": "850px",
  "--r-card": "24px",
  "--r-media": "16px",
  "--r-campo": "16px",
  "--r-pill": "999px",
  "--motion-hover": "180ms",
  "--motion-reveal": "240ms",
  "--motion-stagger": "50ms",
  "--motion-curtain-phase": "300ms",
  "--motion-ease": "cubic-bezier(.22,1,.36,1)",
  "--layer-content": "0",
  "--layer-nav": "20",
  "--layer-menu": "30",
  "--layer-curtain": "50",
  "--layer-cursor": "60",
} as const;

/** Lo que tokens.css trae y no entra a la herramienta, con el motivo. */
export const TOKENS_CSS_EXCLUIDOS_WEB_V1 = {
  "--marca": "DH-5: el rosa no se usa en la herramienta",
  "--texto-sobre-marca": "DH-5: par del rosa",
  "--sticky-servicios": "DH-13: mecánica medida en el sitio",
  "--sticky-clientes": "DH-13: mecánica medida en el sitio",
  "--alto-caso": "DH-13: mecánica medida en el sitio",
  "--degradado-borde": "DH-13: mecánica medida en el sitio",
  "--grid-gap-trabajos": "DH-13: mecánica medida en el sitio",
} as const;

/** El único token que no sale de tokens.css (DH-4). */
export const TOKENS_PROPIOS_WEB_V1 = { "--navy": PALETA_WEB_V1.navy } as const;

const { fondo, tinta, texto2, blanco } = PALETA_WEB_V1;
const { azul, bermellon, verde, violeta, amarillo } = ACENTOS_WEB_V1;

/**
 * El tema en el contrato de `DocumentTheme`, para que el interruptor pueda
 * registrarlo. Mapeo de los 14 tokens originales:
 *
 *   primary / primaryBright / action = violeta: el CTA (DH-5), y además el
 *     único acento que llega a AA como texto chico sobre el fondo (4,88:1).
 *   accent = azul, capítulo de diagnóstico (DH-3).
 *   ink / text = tinta; muted = texto de apoyo.
 *   background = fondo crema; surface = blanco de tokens.css.
 *   surfaceSoft, border, borderSoft = rebajados de tinta (4 % y 14 %).
 *   success / warning / risk = verde / amarillo / bermellón (DH-5).
 *   chart = los cinco acentos, en el orden de tokens.css.
 *
 * `typography`: Anton, Manrope y Geist Mono (DH-9). Manrope llega hasta 800,
 * así que `weightBlack` es 800. Registrar estas familias en react-pdf es F3b:
 * hoy `registrar-fuentes.ts` registra Satoshi, Inter y Geist Mono.
 * `spacing` y `radius` salen de las escalas de tokens.css (DH-13).
 */
export const VELOCENTUM_WEB_V1 = {
  id: "velocentum-web/v1",
  colors: {
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
    chart: [azul.color, bermellon.color, verde.color, violeta.color, amarillo.color],
  },
  typography: {
    heading: "Anton",
    body: "Manrope",
    mono: "Geist Mono",
    monoRoles: [
      "labels",
      "estados",
      "identificadores",
      "fechas",
      "categorias",
      "metricas",
      "datos-tecnicos",
    ],
    weightLight: 300,
    weightRegular: 400,
    weightMedium: 500,
    weightSemiBold: 600,
    weightBold: 700,
    weightExtraBold: 800,
    weightBlack: 800,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 16,
    md: 16,
    lg: 24,
  },
} as const satisfies DocumentTheme;
