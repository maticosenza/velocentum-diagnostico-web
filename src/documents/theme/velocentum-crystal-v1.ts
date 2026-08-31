import type { DocumentTheme } from "./types";

/**
 * Tema de marca `velocentum-crystal/v1` — Bloque Visual 4, fase F1
 * (2026-08-31).
 *
 * Vive AL LADO de `velocentum-light/v1`, no lo reemplaza. v1 sigue siendo el
 * ancla de rollback y no se toca. Ningún commit de F1 deja este tema activo:
 * el interruptor está en `tema-activo.ts` y arranca en `velocentum-light-v1`.
 *
 * El nombre evita deliberadamente "v2": en este repositorio "v2" ya nombra al
 * MOTOR documental (`motor-activo.ts`, `renderers/pdf-v2/`). Llamar "v2" al
 * tema garantizaría confusión en registro y handoffs.
 *
 * ---------------------------------------------------------------------------
 * REGLAS VINCULANTES DE USO. No son sugerencias: son el contrato del tema.
 * ---------------------------------------------------------------------------
 *
 * 1. `accentDeep` (#D92F6E) es el ÚNICO acento permitido como texto chico
 *    sobre superficie clara. Mide 4,58:1 sobre `surface` (#FFFFFF).
 *    Límite medido: sobre `surfaceSoft` (#F5F5F7) baja a 4,21:1 y NO llega a
 *    AA. Texto chico en acento va sobre blanco puro, nunca sobre el neutro.
 * 2. `action` (#FF4B8D) JAMÁS como texto chico sobre blanco: mide 3,16:1.
 *    Sí para CTA, display (texto grande) y gráfica, donde el umbral es 3:1.
 * 3. Los estados funcionales (`success`, `warning`, `risk`) NUNCA se pintan
 *    en acento. Se heredan de v1 sin cambiar un dígito, con su par de
 *    contraste para texto sobre claro (`successInk`/`warningInk`/`riskInk`,
 *    el patrón `--vdoc-*-ink` que el renderer web v1 ya usa) y su par sobre
 *    oscuro (`onDark.*`).
 * 4. Composición 70% ink/surface · 20% neutro · 10% acento. Es una guía de
 *    proporción visual, NO un reemplazo uno a uno de los tokens de v1.
 *
 * ---------------------------------------------------------------------------
 * PROCEDENCIA DE CADA VALOR
 * ---------------------------------------------------------------------------
 *
 * Vinculantes (paleta del rebranding, `bv4-contrato-maestro.md`), sin tocar:
 *   action #FF4B8D · accentSoft #FF85B8 · accentDeep #D92F6E · ink #0E0E13
 *   surfaceDark #1A1A23 · surface #FFFFFF
 * Neutros DH-4 (preaprobados), sin tocar:
 *   surfaceSoft #F5F5F7 · borderLight #E9E9EE · borderDark #2A2A35
 *   muted #6E6E7A
 * Heredados de `velocentum-light/v1`, sin tocar:
 *   success #20A464 · warning #FBBF24 · risk #D64A4A
 *   successInk #157A4C · warningInk #92400E · riskInk #B23636
 *   (los tres `*Ink` son los mismos valores que `--vdoc-success-ink`,
 *   `--vdoc-warning-ink` y `--vdoc-risk-ink` de
 *   `renderers/web/document-renderer.css:99-101`, en mayúsculas por
 *   consistencia con el resto del archivo)
 *   typography, spacing y radius: idénticos a v1. El rebranding vinculante
 *   no define escala tipográfica de pesos, escala espacial ni radios;
 *   cambiarlos sería inventar.
 *
 * Derivados (dos hexes nuevos en todo el tema, ambos calculados, ninguno
 * elegido a ojo; la verificación está en `velocentum-crystal-v1.contraste.test.ts`):
 *
 *   `disabled` y `onDark.muted` = #ACACB4
 *      Punto medio exacto en sRGB entre `muted` (#6E6E7A) y `borderLight`
 *      (#E9E9EE): ((0x6E+0xE9)/2, (0x6E+0xE9)/2, (0x7A+0xEE)/2).
 *      Dos roles, un hex: sobre claro es el gris de deshabilitado (2,25:1,
 *      exento de AA por WCAG 1.4.3, componentes inactivos); sobre oscuro es
 *      el texto secundario (7,58:1 sobre `surfaceDark`, 8,45:1 sobre `ink`),
 *      donde `muted` crudo no llega (3,43:1 sobre `surfaceDark`).
 *
 *   `onDark.risk` = #E05352
 *      `risk` (#D64A4A) es oklch(0.603 0.176 24.1) y sobre `surfaceDark`
 *      mide 4,06:1 — no llega a AA. Se sube SOLO la luminosidad en OKLCH,
 *      conservando croma y matiz exactos, hasta el primer múltiplo de 0,01
 *      que alcanza el umbral: L = 0,63 → #E05352 → 4,55:1 sobre
 *      `surfaceDark` y 5,07:1 sobre `ink`. `success` y `warning` no
 *      necesitan variante: pasan crudos sobre ambas superficies oscuras.
 *
 *   `onDark.disabled` = #4C4C58
 *      Mismo método que `disabled`, punto medio en sRGB entre `muted`
 *      (#6E6E7A) y `borderDark` (#2A2A35).
 *
 * Derivaciones por reasignación de rol (ningún hex nuevo):
 *   `primary` = `accentDeep`. `primary` es el token que `pdf-v2` usa 23
 *      veces, texto incluido; asignarle el único acento legible como texto
 *      chico hace que el contrato de 14 tokens sea seguro por construcción.
 *   `primaryBright` = `action` ("gradientes y estados activos" ≡ CTA/display).
 *   `accent` = `accentSoft` ("primario suave: gráficos y secundarios").
 *   `text` = `surfaceDark` (#1A1A23). Misma relación que en v1, donde `text`
 *      (#171437) es un escalón más claro que `ink` (#0D0B2D).
 *   `background` = `surfaceSoft` (#F5F5F7) y `borderSoft` = `border`
 *      (#E9E9EE). La familia clara tiene tres neutros (#FFFFFF, #F5F5F7,
 *      #E9E9EE) para cinco roles, así que dos colisiones son inevitables. Se
 *      eligió conservar la distinción que importa —tarjeta blanca sobre
 *      fondo neutro, igual que v1— y perder los dos escalones de filete.
 *      Punto abierto para F2/F3: si aparece una necesidad real de un
 *      segundo filete, se agrega un neutro de la familia DH-4.
 *   `info` = `borderDark` (#2A2A35). Los estados funcionales nunca van en
 *      acento (regla 3) y la paleta vinculante no tiene ningún matiz
 *      informativo, así que el aviso informativo es neutro oscuro.
 *   `chart` = [action, ink, muted, accentSoft, borderDark]. Cinco series con
 *      la única paleta disponible: el acento primero, después la rampa
 *      neutra alternando claro y oscuro para que dos series contiguas nunca
 *      se confundan.
 *   `table` y `print`: sólo hexes ya definidos arriba. La regla de impresión
 *      es la de la directiva §4 — contenido claro, ink de texto, acento
 *      controlado, oscuro reservado a portada, separadores y cierre.
 */
export const VELOCENTUM_CRYSTAL_V1 = {
  id: "velocentum-crystal/v1",
  colors: {
    // --- Los 14 del contrato original -----------------------------------
    primary: "#D92F6E",
    primaryBright: "#FF4B8D",
    accent: "#FF85B8",
    ink: "#0E0E13",
    text: "#1A1A23",
    muted: "#6E6E7A",
    background: "#F5F5F7",
    surface: "#FFFFFF",
    surfaceSoft: "#F5F5F7",
    border: "#E9E9EE",
    borderSoft: "#E9E9EE",
    success: "#20A464",
    warning: "#FBBF24",
    risk: "#D64A4A",

    // --- Extensión aditiva de BV4 ---------------------------------------
    action: "#FF4B8D",
    accentSoft: "#FF85B8",
    accentDeep: "#D92F6E",
    surfaceDark: "#1A1A23",
    borderLight: "#E9E9EE",
    borderDark: "#2A2A35",
    disabled: "#ACACB4",
    info: "#2A2A35",
    successInk: "#157A4C",
    warningInk: "#92400E",
    riskInk: "#B23636",
    chart: ["#FF4B8D", "#0E0E13", "#6E6E7A", "#FF85B8", "#2A2A35"],
    table: {
      headerBackground: "#E9E9EE",
      headerText: "#0E0E13",
      stripe: "#F5F5F7",
      rule: "#E9E9EE",
    },
    print: {
      surface: "#FFFFFF",
      ink: "#0E0E13",
      rule: "#E9E9EE",
      accent: "#D92F6E",
      dark: "#0E0E13",
    },
    onDark: {
      text: "#FFFFFF",
      body: "#E9E9EE",
      muted: "#ACACB4",
      border: "#2A2A35",
      disabled: "#4C4C58",
      success: "#20A464",
      warning: "#FBBF24",
      risk: "#E05352",
    },
  },
  typography: {
    heading: "Satoshi",
    body: "Inter",
    // BV4 F1 etapa 3: Geist Mono, bajada de la fuente oficial (repositorio
    // de Vercel, release v1.7.2) y registrada como data URI en
    // `fuentes/registrar-fuentes.ts` con los pesos 400/500/600/700 romanos.
    // Sin CDN en ningún punto del render. F1 DEFINE el rol; aplicarlo a
    // navegación, documentos o UI es alcance de F2/F3.
    mono: "Geist Mono",
    monoRoles: ["labels", "estados", "identificadores", "microcopy-tecnico"],
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
