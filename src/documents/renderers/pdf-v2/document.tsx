/* eslint-disable react-refresh/only-export-components -- PDF primitives are not Fast Refresh UI components. */
import React from "react";
import {
  Circle,
  Defs,
  Document,
  Font,
  Line,
  LinearGradient,
  Page,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { VELOCENTUM_LIGHT_V1 } from "../../theme";
import { registrarFuentesVelocentum } from "../../theme/fuentes/registrar-fuentes";
import { SimboloVelocentum } from "../pdf/marca";
import { filasBalanceadas } from "../../semantica-v2/balanceo";
import { textoEstadoV2, textoOrigenV2 } from "../../semantica-v2/estado";
import {
  ICONOS_PRIORIDAD,
  LABELS_CAPA,
  LABELS_ESCENARIO,
  LABELS_MAGNITUD,
  LABELS_PERIODO,
  LABELS_PRIORIDAD,
  LABELS_TIPO_DOCUMENTO,
  LABELS_UNIDAD_COMERCIAL,
  TITULO_SUPUESTOS_CON_DAGA,
} from "../../semantica-v2/etiquetas";
import { PERSONALIDAD_POR_DOCUMENTO, colorProfundidadTarjeta } from "../../semantica-v2/direccion-arte";
import type {
  DocumentBlockV2,
  DocumentKindV2,
  DocumentModelV2,
  DocumentSectionV2,
  EscenarioV2,
  ValorV2,
} from "../../templates/velocentum-v2/types";

const theme = VELOCENTUM_LIGHT_V1;

/**
 * Colores introducidos en la ronda de correcciones 2.1 para resolver C4
 * (contraste calculado, no a ojo) — centralizados acá para que el test
 * P4 verifique EXACTAMENTE los valores que usan los estilos reales, sin
 * duplicar literales que puedan divergir con el tiempo.
 */
export const V2_CONTRAST_TOKENS = {
  darkCardBackground: "#1C173E",
  altaBadgeBackground: "#FBEAEA",
  altaBadgeText: "#992D2D",
  onDarkCard: "#C8C2FF",
  onDarkCardBody: "#D5D1E0",
  onDarkCardBodyAlt: "#DEDCEA",
  onLightPrimary: theme.colors.primary,
  onLightBody: theme.colors.text,
  onLightMuted: theme.colors.muted,
} as const;

registrarFuentesVelocentum();
Font.registerHyphenationCallback((word) => [word]);

export type PdfProfileV2 = "pantalla" | "impresion";

const HEADING = theme.typography.heading;
const BODY = theme.typography.body;
const W = {
  regular: theme.typography.weightRegular,
  medium: theme.typography.weightMedium,
  semiBold: theme.typography.weightSemiBold,
  bold: theme.typography.weightBold,
  black: theme.typography.weightBlack,
};

/** Escala tipográfica completa por rol y por perfil (contrato sección 2.1). */
type EscalaTipografica = {
  titulo: number;
  subtitulo: number;
  label: number;
  valor: number;
  valorGrande: number;
  badge: number;
  nota: number;
  pie: number;
};

type ProfileTokensV2 = {
  pageSize: [number, number] | "A4";
  pagePaddingH: number;
  pagePaddingTop: number;
  pagePaddingBottom: number;
  escala: EscalaTipografica;
  coverPadding: number;
  coverTitleFontSize: number;
  coverTitleWidth: number;
  transitionTitleFontSize: number;
  transitionTitleWidth: number;
  /** Columnas nominales por tipo de grilla (contrato sección 2.2). */
  colsMetricGrid: number;
  colsFindings: number;
  colsScenarios: number;
  colsServices: number;
  /** Ancho mínimo de columna de la tabla mensual (contrato sección 2.4). */
  monthlyColMinWidth: number;
  /**
   * C1, ronda 2.1: la tabla mensual horizontal de 5 columnas se sale del
   * borde de la tarjeta en A4 (ancho de card insuficiente incluso con el
   * mínimo de columna de la sección 2.4). En impresión se apila en
   * formato etiqueta/valor por mes en vez de columnas; pantalla no cambia.
   */
  monthlyStacked: boolean;
};

export const PROFILES_V2: Record<PdfProfileV2, ProfileTokensV2> = {
  pantalla: {
    pageSize: [960, 540],
    pagePaddingH: 54,
    pagePaddingTop: 84,
    pagePaddingBottom: 48,
    escala: { titulo: 22, subtitulo: 10, label: 9, valor: 17, valorGrande: 30, badge: 8, nota: 8.5, pie: 8 },
    coverPadding: 64,
    coverTitleFontSize: 46,
    coverTitleWidth: 500,
    transitionTitleFontSize: 38,
    transitionTitleWidth: 790,
    colsMetricGrid: 3,
    colsFindings: 2,
    colsScenarios: 3,
    colsServices: 2,
    monthlyColMinWidth: 95,
    monthlyStacked: false,
  },
  impresion: {
    pageSize: "A4",
    pagePaddingH: 48,
    pagePaddingTop: 78,
    pagePaddingBottom: 46,
    escala: { titulo: 18, subtitulo: 9.5, label: 9.5, valor: 15, valorGrande: 24, badge: 8, nota: 9, pie: 8 },
    coverPadding: 48,
    coverTitleFontSize: 30,
    // 260 (antes 300): con el acento contenido de C3
    // (`coverAccentBounded`, 200pt de ancho anclado a la derecha), 300
    // dejaba el título prácticamente tocando el borde del bloque —
    // verificado en inspección a 150dpi tras la primera generación.
    coverTitleWidth: 260,
    transitionTitleFontSize: 26,
    transitionTitleWidth: 420,
    colsMetricGrid: 2,
    colsFindings: 1,
    // C2, ronda 2.1: 3 tarjetas "cortas" a colsNominal=2 dejaban un
    // huérfano de 1 que `filasBalanceadas` resolvía saltando a una sola
    // fila de 3 (colsNominal+1 = n), y 3 tarjetas de escenario en una
    // fila de A4 no entran sin colisionar. 1 columna = 1 tarjeta por fila
    // en impresión, tal como el prompt lista como opción aceptable.
    colsScenarios: 1,
    colsServices: 1,
    monthlyColMinWidth: 110,
    monthlyStacked: true,
  },
};

/**
 * Geometría de los acentos contenidos en impresión (C3, ronda 2.1): áreas
 * fijas, conocidas en tiempo de compilación, usadas por el test P3 para
 * calcular el porcentaje de superficie de página que ocupan — nunca a
 * sangre completa, siempre muy por debajo del 25% exigido.
 */
export const IMPRESION_ACCENT_GEOMETRY = {
  pageWidthPt: 595.28,
  pageHeightPt: 841.89,
  coverAccentWidthPt: 200,
  coverAccentHeightPt: 160,
  transitionBandHeightPt: 220,
  contentAccentBandHeightPt: 8,
} as const;

function makeStylesV2(profile: PdfProfileV2) {
  const p = PROFILES_V2[profile];
  const e = p.escala;
  return StyleSheet.create({
    page: {
      paddingTop: p.pagePaddingTop,
      paddingRight: p.pagePaddingH,
      paddingBottom: p.pagePaddingBottom,
      paddingLeft: p.pagePaddingH,
      fontFamily: BODY,
      fontWeight: W.regular,
      fontSize: e.label,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    pageDark: { color: theme.colors.surface, backgroundColor: theme.colors.ink },
    pageSoft: { backgroundColor: theme.colors.surfaceSoft },
    header: { position: "absolute", top: 30, left: p.pagePaddingH, right: p.pagePaddingH },
    eyebrow: {
      fontSize: e.subtitulo,
      fontFamily: HEADING,
      fontWeight: W.bold,
      letterSpacing: 1.1,
      color: theme.colors.primary,
      textTransform: "uppercase",
      marginBottom: 7,
    },
    eyebrowDark: { color: "#C8C2FF" },
    title: {
      fontSize: e.titulo,
      lineHeight: 1.08,
      fontFamily: HEADING,
      fontWeight: W.bold,
      color: theme.colors.ink,
      maxWidth: 720,
    },
    footer: {
      position: "absolute",
      left: p.pagePaddingH,
      right: p.pagePaddingH,
      bottom: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      color: theme.colors.muted,
      fontSize: e.pie,
    },
    footerDark: { color: "#B8B4C8" },
    footerRow: { flexDirection: "row", alignItems: "center" },
    // Wordmark único, caja mixta "Velocentum" (R-06) — nunca mayúscula sostenida.
    wordmark: { fontFamily: HEADING, fontWeight: W.bold, letterSpacing: 0.4 },
    pageNumber: { fontFamily: BODY, fontWeight: W.regular },
    content: { flexDirection: "column", gap: 12 },
    coverPage: {
      padding: p.coverPadding,
      fontFamily: BODY,
      fontWeight: W.regular,
      color: theme.colors.surface,
      backgroundColor: theme.colors.ink,
    },
    coverGradientLayer: { position: "absolute", top: 0, bottom: 0, right: 0, width: "45%" },
    coverMark: { marginBottom: 56 },
    coverTitle: {
      width: p.coverTitleWidth,
      fontFamily: HEADING,
      fontWeight: W.black,
      fontSize: p.coverTitleFontSize,
      lineHeight: 1.02,
      marginBottom: 18,
    },
    coverSubtitle: { width: p.coverTitleWidth - 10, fontSize: 15, lineHeight: 1.45, color: "#DEDCEA" },
    // C10, ronda 2.1: columna en vez de fila con `justify-content:
    // space-between` — con 4 campos (antes 2) un nombre de cliente largo
    // rompería el espaciado de una fila; en columna cada campo tiene su
    // propio ancho disponible y el texto simplemente pasa a una segunda
    // línea si hace falta, sin desbordar la página (verificado con un
    // nombre de 100+ caracteres en el test de estrés P10).
    coverMeta: {
      position: "absolute",
      left: p.coverPadding,
      right: p.coverPadding,
      bottom: 30,
      flexDirection: "column",
      gap: 3,
      fontSize: 10,
      color: "#CBC7D8",
    },
    // bottom:100 (antes 78) para no solapar con `coverMeta`, que ahora
    // apila 4 campos en columna en vez de 2 en fila (C10).
    coverWordmark: { position: "absolute", left: p.coverPadding, bottom: 100 },
    // C9, ronda 2.1: un solo tratamiento del wordmark ("Velocentum", caja
    // mixta) en portada y pie, en vez del logotipo SVG en minúscula que
    // sólo usaba la portada.
    coverWordmarkText: { fontFamily: HEADING, fontWeight: W.bold, fontSize: 22, letterSpacing: 0.4 },
    transitionPage: {
      padding: p.coverPadding,
      justifyContent: "center",
      fontFamily: BODY,
      fontWeight: W.regular,
      color: theme.colors.surface,
      backgroundColor: theme.colors.primary,
    },
    transitionMark: {
      fontFamily: HEADING,
      fontWeight: W.bold,
      fontSize: 11,
      letterSpacing: 1.4,
      marginBottom: 18,
      color: "#D8D4FF",
    },
    transitionTitle: {
      width: p.transitionTitleWidth,
      fontFamily: HEADING,
      fontWeight: W.black,
      fontSize: p.transitionTitleFontSize,
      lineHeight: 1.08,
    },
    cardGrid: { flexDirection: "column", gap: 10 },
    // `alignItems: "flex-start"` (C8, ronda 2.1): sin esto, Yoga estira
    // todas las tarjetas de una fila a la altura de la más alta (stretch
    // por defecto en el eje cruzado de un `flexDirection: row`), dejando
    // espacio en blanco reservado en las tarjetas con menos contenido
    // (ej. tarjetas de servicio sin alcance). Con flex-start cada tarjeta
    // se compacta a su altura real.
    cardRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    // `flex: 1` es correcto SOLO para tarjetas dentro de una fila de grilla
    // (`cardRow`, ver `CardGrid`): reparte el ancho de la fila entre las
    // tarjetas. Aplicarlo a una tarjeta de ancho completo, hija directa de
    // `cardGrid` (columna), hace que Yoga la trate con `flexBasis: 0%` y
    // colapse su contenido (bug encontrado en verificación del PASO 3 —
    // las tarjetas de escenario "largas" quedaban con el encabezado
    // visible y el resto del contenido invisible). Las tarjetas de ancho
    // completo usan `standaloneCard`, sin `flex`.
    // D-5, contrato 6.3: `@react-pdf/renderer` no soporta `boxShadow` en
    // `View` — la profundidad se logra con un borde inferior/derecho más
    // grueso y teñido (selvedge), sin agregar un nodo `View` extra (evita
    // el riesgo de reabrir los bugs de `wrap`/`fixed` ya documentados en
    // la ronda 2.1 para tarjetas con paginación ajustada).
    card: {
      flex: 1,
      minHeight: 72,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderBottomWidth: profile === "pantalla" ? 3 : 2,
      borderRightWidth: profile === "pantalla" ? 2 : 1.5,
      borderBottomColor: colorProfundidadTarjeta(profile),
      borderRightColor: colorProfundidadTarjeta(profile),
      backgroundColor: theme.colors.surface,
    },
    standaloneCard: {
      minHeight: 72,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderBottomWidth: profile === "pantalla" ? 3 : 2,
      borderRightWidth: profile === "pantalla" ? 2 : 1.5,
      borderBottomColor: colorProfundidadTarjeta(profile),
      borderRightColor: colorProfundidadTarjeta(profile),
      backgroundColor: theme.colors.surface,
    },
    cardFull: { width: "100%" },
    cardDark: { color: theme.colors.surface, borderColor: "#39345A", backgroundColor: "#1C173E" },
    cardAlerta: {
      borderColor: theme.colors.risk,
      borderWidth: 1.5,
      backgroundColor: "#FBEAEA",
    },
    cardLabel: { fontSize: e.label, color: theme.colors.muted, marginBottom: 7 },
    cardLabelDark: { color: "#C8C4D5" },
    cardValue: { fontFamily: HEADING, fontWeight: W.bold, fontSize: e.valor, color: theme.colors.ink },
    cardValueDark: { color: theme.colors.surface },
    // C4(b), ronda 2.1: el texto de estado (retenido/no_aplica) es una
    // oración completa — el ámbar (`warning`) no cumple 4,5:1 sobre fondo
    // claro como color de párrafo (1,67:1, calculado) y sólo debe usarse
    // como acento de borde/badge. El acento queda en `estadoBox`
    // (borde izquierdo), el texto pasa a un color de cuerpo con contraste
    // suficiente en ambos perfiles.
    estadoBox: { borderLeftWidth: 3, borderLeftColor: theme.colors.warning, paddingLeft: 6 },
    estadoTexto: {
      fontFamily: BODY,
      fontWeight: W.semiBold,
      fontSize: e.nota,
      color: theme.colors.text,
    },
    estadoTextoDark: { color: V2_CONTRAST_TOKENS.onDarkCardBodyAlt },
    estadoDetalle: { fontSize: e.nota - 1, color: theme.colors.muted, marginTop: 2 },
    estadoDetalleDark: { color: V2_CONTRAST_TOKENS.onDarkCardBody },
    badge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 7,
      fontSize: e.badge,
      fontFamily: BODY,
      fontWeight: W.bold,
      color: theme.colors.primary,
      backgroundColor: theme.colors.surfaceSoft,
      marginBottom: 7,
    },
    badgeDark: { color: theme.colors.surface, backgroundColor: theme.colors.accent },
    // C4, ronda 2.1: `theme.colors.risk` (#D64A4A) sobre "#FBEAEA" da
    // 3,66:1 (calculado), por debajo del 4,5:1 exigido para texto de
    // badge (8pt, no califica como texto grande). "#992D2D" sobre el
    // mismo fondo da 6,52:1. El borde/fondo de `cardAlerta` no cambia
    // (no son texto, no están sujetos al mismo umbral).
    badgeAlta: { color: V2_CONTRAST_TOKENS.altaBadgeText, backgroundColor: V2_CONTRAST_TOKENS.altaBadgeBackground },
    badgeMedia: { color: "#8A6417", backgroundColor: "#FEF3D6" },
    badgeBaja: { color: theme.colors.muted, backgroundColor: theme.colors.surfaceSoft },
    // C4, ronda 2.1: `theme.colors.accent` (#7A6BFF) sobre tarjeta clara
    // (`surface`, blanco) da 3,91:1, por debajo de 4,5:1 — `primary`
    // sobre blanco da 7,25:1. Sobre tarjeta oscura (`cardDark`,
    // "#1C173E") se usa `findingIndexDark` ("#C8C2FF", 10,16:1).
    findingIndex: {
      fontFamily: HEADING,
      fontWeight: W.bold,
      fontSize: e.label,
      color: theme.colors.primary,
      marginBottom: 4,
    },
    findingIndexDark: { color: V2_CONTRAST_TOKENS.onDarkCard },
    itemTitle: {
      fontFamily: HEADING,
      fontWeight: W.bold,
      fontSize: e.label + 2,
      lineHeight: 1.25,
      marginBottom: 5,
      color: theme.colors.ink,
    },
    itemBody: { fontSize: e.nota, lineHeight: 1.35, color: theme.colors.muted },
    itemBodyDark: { color: "#D5D1E0" },
    amount: { fontFamily: HEADING, fontWeight: W.bold, fontSize: e.valor - 4, color: theme.colors.primary, marginTop: 7 },
    amountDark: { color: "#CEC9FF" },
    progressRow: { marginBottom: 12 },
    progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    progressTrack: { height: 7, borderRadius: 4, backgroundColor: theme.colors.border, overflow: "hidden" },
    progressBar: { height: 7, borderRadius: 4, backgroundColor: theme.colors.accent },
    sectionNote: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
    },
    listItem: { flexDirection: "row", marginBottom: 5 },
    listDash: { width: 12, color: theme.colors.primary, fontFamily: HEADING, fontWeight: W.bold },
    listText: { flex: 1, fontSize: e.nota, lineHeight: 1.35 },
    blockTitle: { fontFamily: HEADING, fontWeight: W.bold, fontSize: e.label + 3, marginBottom: 9, color: theme.colors.ink },
    blockTitleDark: { color: theme.colors.surface },
    scenarioHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 9 },
    scenarioMetrics: { flexDirection: "row", gap: 8, marginBottom: 9 },
    scenarioMetric: { flex: 1 },
    scenarioMetricLabel: { fontSize: e.nota - 1, color: theme.colors.muted, marginBottom: 3 },
    scenarioMetricValue: { fontSize: e.valor - 3, fontFamily: HEADING, fontWeight: W.bold },
    scenarioMetricValuePrimary: { fontSize: e.valorGrande - 12, fontFamily: HEADING, fontWeight: W.black, color: theme.colors.primary },
    scenarioNote: { fontSize: e.nota, color: theme.colors.muted, marginTop: 4, lineHeight: 1.3 },
    // C3/C4, ronda 2.1: antes fijo en `accent` (pensado sólo para la
    // tarjeta oscura de siempre). Ahora que en impresión las secciones
    // "dark" pueden renderizar en modo claro (sección 2.3 del contrato,
    // corrección C3), el kicker necesita su propio color por modo:
    // `primary` sobre superficie clara (7,25:1), `commercialSummaryKickerDark`
    // ("#C8C2FF", 10,16:1 sobre `cardDark`) en modo oscuro.
    commercialSummaryKicker: {
      fontSize: e.subtitulo,
      color: theme.colors.primary,
      fontFamily: HEADING,
      fontWeight: W.bold,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    commercialSummaryKickerDark: { color: V2_CONTRAST_TOKENS.onDarkCard },
    commercialSummaryNumber: { fontSize: e.valorGrande, fontFamily: HEADING, fontWeight: W.black },
    commercialSummaryRange: { fontSize: e.valorGrande - 6, fontFamily: HEADING, fontWeight: W.black },
    // C4(a), ronda 2.1: `theme.colors.muted` sobre `cardDark`
    // ("#1C173E") da 2,31:1 (calculado) — exactamente el defecto
    // reportado ("gris apagado sobre fondo navy"). Ahora depende del
    // modo: `muted` sobre superficie clara (7,33:1),
    // `commercialSummaryStatementDark` ("#D5D1E0", 11,30:1) en oscuro.
    commercialSummaryStatement: { maxWidth: 480, marginTop: 10, fontSize: e.nota, color: theme.colors.muted, lineHeight: 1.4 },
    commercialSummaryStatementDark: { color: V2_CONTRAST_TOKENS.onDarkCardBody },
    bridgeNote: { fontSize: e.nota, color: theme.colors.muted, lineHeight: 1.4, marginTop: 10, maxWidth: 480 },
    bridgeNoteDark: { color: V2_CONTRAST_TOKENS.onDarkCardBodyAlt },
    // C1, ronda 2.1: tabla mensual apilada etiqueta/valor por mes, sólo
    // en impresión (`monthlyStacked`) — evita el desborde de la tabla
    // horizontal de 5 columnas en el ancho de tarjeta A4, sin bajar la
    // tipografía ni eliminar ninguna magnitud (D2).
    monthlyStackedMonth: {
      marginBottom: 8,
      paddingBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    monthlyStackedMonthLabel: {
      fontFamily: HEADING,
      fontWeight: W.bold,
      fontSize: e.label,
      marginBottom: 4,
      color: theme.colors.ink,
    },
    monthlyStackedMonthLabelDark: { color: theme.colors.surface },
    monthlyStackedRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      paddingVertical: 2,
    },
    monthlyStackedLabel: { flex: 1, fontSize: e.nota, color: theme.colors.muted },
    monthlyStackedLabelDark: { color: V2_CONTRAST_TOKENS.onDarkCardBody },
    monthlyStackedValue: { fontSize: e.nota, fontFamily: HEADING, fontWeight: W.bold, color: theme.colors.ink },
    monthlyStackedValueDark: { color: theme.colors.surface },
    // C5, ronda 2.1: identidad del escenario repetida antes de cada
    // subsección que podría quedar sola al inicio de una página nueva si
    // la tarjeta se parte entre páginas (el header de arriba puede
    // quedar en la página anterior).
    scenarioKicker: {
      fontSize: e.badge,
      fontFamily: HEADING,
      fontWeight: W.bold,
      color: theme.colors.accent,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 4,
    },
    scenarioKickerDark: { color: V2_CONTRAST_TOKENS.onDarkCard },
    // C3, ronda 2.1: acento contenido (no a sangre completa) para
    // secciones de tono oscuro en impresión — franja delgada en vez de
    // fondo íntegro. Área << 25% de la página (verificado en
    // `IMPRESION_ACCENT_GEOMETRY`).
    impresionAccentBand: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: IMPRESION_ACCENT_GEOMETRY.contentAccentBandHeightPt,
      backgroundColor: theme.colors.primary,
    },
    coverPageLight: {
      padding: p.coverPadding,
      fontFamily: BODY,
      fontWeight: W.regular,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    coverAccentBounded: {
      position: "absolute",
      top: p.coverPadding,
      right: p.coverPadding,
      width: IMPRESION_ACCENT_GEOMETRY.coverAccentWidthPt,
      height: IMPRESION_ACCENT_GEOMETRY.coverAccentHeightPt,
      borderRadius: 16,
      overflow: "hidden",
    },
    coverTitleLight: { color: theme.colors.ink },
    coverSubtitleLight: { color: theme.colors.muted },
    coverMetaLight: { color: theme.colors.muted },
    transitionPageLight: {
      padding: p.coverPadding,
      justifyContent: "center",
      fontFamily: BODY,
      fontWeight: W.regular,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    // Ancho explícito (no `alignSelf: flex-start`, que en la primera
    // versión combinado con `maxHeight` cortaba el título a mitad de
    // frase — Yoga recorta contenido que excede una altura fija). El
    // alto queda libre para crecer con el texto; el área "worst-case"
    // que usa el test P3 asume un ancho igual a `transitionTitleWidth`
    // y una altura generosa (`transitionBandHeightPt`), sin forzar un
    // límite real que pueda truncar contenido.
    transitionBandLight: {
      width: p.transitionTitleWidth + 48,
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      padding: 24,
    },
    monthlyTable: { marginTop: 6, marginBottom: 6 },
    monthlyTableHeaderRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
      paddingVertical: 4,
    },
    monthlyTableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
      paddingVertical: 4,
    },
    monthlyTableHeaderCell: {
      minWidth: p.monthlyColMinWidth,
      flex: 1,
      fontSize: 6.5,
      color: theme.colors.muted,
      fontFamily: BODY,
      fontWeight: W.bold,
      textTransform: "uppercase",
    },
    monthlyTableMonthCell: { minWidth: p.monthlyColMinWidth, flex: 1, fontSize: e.nota, fontFamily: BODY, fontWeight: W.bold },
    monthlyTableCell: { minWidth: p.monthlyColMinWidth, flex: 1, fontSize: e.nota },
    palancaGroup: { marginTop: 6 },
    palancaGroupTitle: { fontSize: e.label, fontFamily: HEADING, fontWeight: W.bold, marginBottom: 3, color: theme.colors.ink },
    roadmapCard: { flexDirection: "row", gap: 13, paddingVertical: 10 },
    roadmapDays: { width: 84, fontFamily: HEADING, fontWeight: W.bold, color: theme.colors.primary, fontSize: e.label },
    roadmapBody: { flex: 1 },
    channelBar: { height: 10, borderRadius: 5, backgroundColor: theme.colors.border, overflow: "hidden", marginTop: 4 },
    channelBarFill: { height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
    // D-5, contrato 6.7: motivo de línea + puntos bajo un título/subtítulo,
    // fiel a la referencia. Contribuye a D-1 (ocupa espacio con intención)
    // y D-3 (portada A4 menos vacía entre subtítulo y pie).
    headingRuleRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, marginBottom: 12 },
    headingRuleLine: { width: 28, height: 2, backgroundColor: theme.colors.primary, borderRadius: 1 },
    headingRuleDots: { fontSize: e.label, color: theme.colors.primary, letterSpacing: 2 },
    // Corrección 3, ronda 2.2.1: variante clara de HeadingRule para la
    // transición en pantalla (fondo `theme.colors.primary`, ver
    // `transitionPage` más abajo).
    headingRuleLineLight: { backgroundColor: theme.colors.surface },
    headingRuleDotsLight: { color: theme.colors.surface },
    // Corrección 3, ronda 2.2.1: acento contenido de dirección de arte para
    // que la transición/cierre en pantalla deje de ser un bloque de color
    // liso con una sola línea de texto (D-5 viñeta 7). Mismo patrón seguro
    // que `coverAccentBounded`: `Svg` anidado dentro de un `View` de tamaño
    // fijo, nunca `position: absolute` directo sobre un `Page` con `wrap`
    // (ver nota de ContentPage sobre el hallazgo real de esta ronda con
    // `Svg` bajo posicionamiento absoluto). El fondo violeta a sangre
    // completa se conserva (C3 sólo exige fondo claro en A4); esto agrega
    // textura sobre ese fondo, no lo reemplaza.
    transitionAccentBounded: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 260,
      height: 260,
      overflow: "hidden",
    },
    // D-5, contrato 6.5: glifo de personalidad por documento junto al eyebrow.
    personalityGlyph: { color: theme.colors.primary, marginRight: 5 },
    // D-5, contrato 6.4: ícono lineal en círculo, sólo en encabezado de
    // escenario y comparación entre canales.
    iconCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
  });
}

type Styles = ReturnType<typeof makeStylesV2>;

/**
 * D-5, contrato 6.7: línea corta + puntos, bajo un título/subtítulo.
 * `light` (ronda 2.2.1, Corrección 3): variante clara para fondos donde el
 * acento violeta por defecto (`theme.colors.primary`) quedaría invisible
 * sobre un fondo del mismo color — p. ej. la transición en pantalla, que
 * sigue a sangre completa en violeta (C3 sólo aplica a A4).
 */
function HeadingRule({ styles, light }: { styles: Styles; light?: boolean }) {
  return (
    <View style={styles.headingRuleRow} wrap={false}>
      <View style={[styles.headingRuleLine, light ? styles.headingRuleLineLight : {}]} />
      <Text style={[styles.headingRuleDots, light ? styles.headingRuleDotsLight : {}]}>····</Text>
    </View>
  );
}

/**
 * D-5, contrato 6.1: textura de fondo — líneas diagonales muy sutiles,
 * pintadas ANTES que el contenido (queda detrás, el orden de render en
 * `@react-pdf/renderer` define el z-order). Nunca se superpone a cifras,
 * badges ni filas de tabla porque siempre se renderiza primero (contrato
 * 6.6) y su opacidad está muy por debajo del umbral de tinta plena de A4.
 */
/** D-5, contrato 6.5: glifo de personalidad, un carácter junto al eyebrow. */
function PersonalityGlyph({ kind, styles }: { kind: DocumentKindV2; styles: Styles }) {
  return <Text style={styles.personalityGlyph}>{PERSONALIDAD_POR_DOCUMENTO[kind].glifo} </Text>;
}

/** D-5, contrato 6.4: ícono lineal en círculo — sólo escenario y canales. */
function IconCircle({ kind, styles }: { kind: "conservador" | "base" | "potencial" | "tienda" | "marketplace"; styles: Styles }) {
  const color = theme.colors.primary;
  return (
    <View style={styles.iconCircle}>
      <Svg width={12} height={12} viewBox="0 0 12 12">
        {kind === "conservador" ? <Circle cx={6} cy={6} r={3.5} stroke={color} strokeWidth={1.2} fill="none" /> : null}
        {kind === "base" ? (
          <>
            <Line x1={2} y1={6} x2={10} y2={6} stroke={color} strokeWidth={1.2} />
            <Line x1={6} y1={2} x2={6} y2={10} stroke={color} strokeWidth={1.2} />
          </>
        ) : null}
        {kind === "potencial" ? (
          <>
            <Line x1={2} y1={9} x2={10} y2={3} stroke={color} strokeWidth={1.2} />
            <Line x1={6} y1={3} x2={10} y2={3} stroke={color} strokeWidth={1.2} />
            <Line x1={10} y1={3} x2={10} y2={7} stroke={color} strokeWidth={1.2} />
          </>
        ) : null}
        {kind === "tienda" ? (
          <>
            <Line x1={2} y1={5} x2={10} y2={5} stroke={color} strokeWidth={1.2} />
            <Line x1={3} y1={5} x2={3} y2={10} stroke={color} strokeWidth={1.2} />
            <Line x1={9} y1={5} x2={9} y2={10} stroke={color} strokeWidth={1.2} />
          </>
        ) : null}
        {kind === "marketplace" ? (
          <>
            <Circle cx={4} cy={4} r={1.4} stroke={color} strokeWidth={1} fill="none" />
            <Circle cx={8} cy={8} r={1.4} stroke={color} strokeWidth={1} fill="none" />
            <Line x1={5} y1={5} x2={7} y2={7} stroke={color} strokeWidth={1} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

function ValorTexto({ value, dark, styles }: { value: ValorV2; dark: boolean; styles: Styles }) {
  const resultado = textoEstadoV2(value);
  if (resultado.esNumero) {
    return <Text style={[styles.cardValue, dark ? styles.cardValueDark : {}]}>{resultado.texto}</Text>;
  }
  return (
    <View style={styles.estadoBox}>
      <Text style={[styles.estadoTexto, dark ? styles.estadoTextoDark : {}]}>{resultado.texto}</Text>
      {resultado.detalle ? (
        <Text style={[styles.estadoDetalle, dark ? styles.estadoDetalleDark : {}]}>{resultado.detalle}</Text>
      ) : null}
    </View>
  );
}

function PrioridadBadge({ prioridad, styles }: { prioridad: "alta" | "media" | "baja"; styles: Styles }) {
  const estilo =
    prioridad === "alta" ? styles.badgeAlta : prioridad === "media" ? styles.badgeMedia : styles.badgeBaja;
  return (
    <Text style={[styles.badge, estilo]}>
      {ICONOS_PRIORIDAD[prioridad]} {LABELS_PRIORIDAD[prioridad]}
    </Text>
  );
}

function BulletList({ items, styles }: { items: string[]; styles: Styles }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.listItem} wrap={false}>
          <Text style={styles.listDash}>-</Text>
          <Text style={styles.listText} orphans={2} widows={2}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CardGrid({
  items,
  cols,
  render,
  styles,
}: {
  items: unknown[];
  cols: number;
  render: (item: unknown, index: number) => React.ReactNode;
  styles: Styles;
}) {
  const filas = filasBalanceadas(items.length, cols);
  let cursor = 0;
  return (
    <View style={styles.cardGrid}>
      {filas.map((cantidad, filaIndex) => {
        const fila = items.slice(cursor, cursor + cantidad);
        const inicio = cursor;
        cursor += cantidad;
        return (
          <View key={filaIndex} style={styles.cardRow}>
            {fila.map((item, i) => render(item, inicio + i))}
          </View>
        );
      })}
    </View>
  );
}

const MonthlyTableHeader = ({ styles }: { styles: Styles }) => (
  <View style={styles.monthlyTableHeaderRow} wrap={false}>
    <Text style={styles.monthlyTableHeaderCell}>Mes</Text>
    <Text style={styles.monthlyTableHeaderCell}>Contribución incremental</Text>
    <Text style={styles.monthlyTableHeaderCell}>Facturación proyectada</Text>
    <Text style={styles.monthlyTableHeaderCell}>Facturación incremental</Text>
    <Text style={styles.monthlyTableHeaderCell}>Ahorro publicitario</Text>
  </View>
);

const MONTHLY_STACKED_ROWS: Array<{
  key: "contribucionIncrementalHabilitada" | "facturacionProyectada" | "facturacionIncrementalHabilitada" | "ahorroPublicitarioHabilitado";
  label: string;
}> = [
  { key: "contribucionIncrementalHabilitada", label: "Contribución incremental" },
  { key: "facturacionProyectada", label: "Facturación proyectada" },
  { key: "facturacionIncrementalHabilitada", label: "Facturación incremental" },
  { key: "ahorroPublicitarioHabilitado", label: "Ahorro publicitario" },
];

/** C1, ronda 2.1: tabla mensual apilada etiqueta/valor por mes (perfil impresión). */
function MonthlyTableStacked({
  mensual,
  dark,
  styles,
  marcadorParaMes,
}: {
  mensual: EscenarioV2["mensual"];
  dark: boolean;
  styles: Styles;
  /**
   * Bloque Visual 2.2.3: se pinta DENTRO del `wrap={false}` de CADA mes
   * (no como hermano suelto antes de la tabla) — así nunca puede quedar
   * huérfano en la página anterior si ese mes se mueve entero a la
   * siguiente. El padre decide, mes por mes, si hace falta marcador.
   */
  marcadorParaMes: (mes: number) => React.ReactNode;
}) {
  return (
    <View>
      {mensual.map((mes) => (
        <View key={mes.mes} style={styles.monthlyStackedMonth} wrap={false}>
          {marcadorParaMes(mes.mes)}
          <Text style={[styles.monthlyStackedMonthLabel, dark ? styles.monthlyStackedMonthLabelDark : {}]}>
            Mes {mes.mes}
          </Text>
          {MONTHLY_STACKED_ROWS.map((row) => (
            <View key={row.key} style={styles.monthlyStackedRow}>
              <Text style={[styles.monthlyStackedLabel, dark ? styles.monthlyStackedLabelDark : {}]}>
                {row.label}
              </Text>
              <Text style={[styles.monthlyStackedValue, dark ? styles.monthlyStackedValueDark : {}]}>
                {textoEstadoV2(mes[row.key]).texto}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export type TipoPalancaV2 = "facturacion_incremental" | "contribucion_incremental" | "ahorro_publicitario";

/**
 * Bloque de una tarjeta de escenario que puede abrir una página de
 * continuación. Bloque Visual 2.2.3: reemplaza la regla estática de las
 * rondas 2.2.1/2.2.2 (marcador siempre antes de Supuestos, o un
 * heurístico de altura que no generalizó — ver
 * docs/visual/handoff-ronda-2.2.2.md) por un mapa MEDIDO sobre el PDF
 * real (`paginacion.ts`, `medirPaginacionV2`), consumido acá tal cual.
 * Este componente no decide SI ni DÓNDE continúa una tarjeta — sólo
 * pinta el marcador donde el mapa dice que hace falta.
 */
export type LimiteContinuacionV2Bloque =
  | "metricas"
  | "nota"
  | "tabla"
  | `mes:${number}`
  | `grupo:${TipoPalancaV2}`
  | "supuestos";

/** Por tarjeta (`EscenarioV2.id`), el conjunto de bloques que efectivamente abren una página nueva. */
export type MapaPaginacionV2 = ReadonlyMap<EscenarioV2["id"], ReadonlySet<LimiteContinuacionV2Bloque>>;

const SIN_MARCADORES: ReadonlySet<LimiteContinuacionV2Bloque> = new Set();
/** Mapa vacío: pasada 1 sin ninguna marca (L2) y valor por defecto de `createPdfDocumentElementV2`. */
export const MAPA_PAGINACION_VACIO_V2: MapaPaginacionV2 = new Map();

function ScenarioCard({
  item,
  dark,
  cardStyle,
  bodyStyle,
  styles,
  full,
  profile,
  marcadores,
}: {
  item: EscenarioV2;
  dark: boolean;
  cardStyle: Style[];
  bodyStyle: Style[];
  styles: Styles;
  full: boolean;
  profile: PdfProfileV2;
  /**
   * Bloque Visual 2.2.3 — mapa medido sobre el PDF real (ver
   * `paginacion.ts`), no una regla estática. `renderBlock` (caso
   * "scenarios") lo calcula una vez por documento con
   * `medirPaginacionV2` y lo pasa acá ya resuelto para esta tarjeta
   * puntual; `SIN_MARCADORES` cuando no hay mapa disponible todavía
   * (pasada 1, sin ninguna marca — L2 del prompt).
   */
  marcadores: ReadonlySet<LimiteContinuacionV2Bloque>;
}) {
  const grupos = ["facturacion_incremental", "contribucion_incremental", "ahorro_publicitario"] as const;
  const stacked = PROFILES_V2[profile].monthlyStacked;
  const nombreEscenario = LABELS_ESCENARIO[item.id];
  const Marcador = ({ bloque }: { bloque: LimiteContinuacionV2Bloque }) =>
    marcadores.has(bloque) ? (
      <Text style={[styles.scenarioKicker, dark ? styles.scenarioKickerDark : {}]}>{nombreEscenario} (continuación)</Text>
    ) : null;
  return (
    <View style={[...cardStyle, full ? styles.cardFull : {}]} wrap={full}>
      <View style={styles.scenarioHeader} wrap={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <IconCircle kind={item.id} styles={styles} />
          <Text style={styles.itemTitle}>{nombreEscenario.toUpperCase()}</Text>
        </View>
        <Text style={styles.badge}>{item.confianza.toUpperCase()}</Text>
      </View>
      {/* Bloque Visual 2.2.3: primer elemento de la continuación cuando el
          quiebre real cae justo antes de las métricas — el header quedó
          huérfano al pie de la página anterior (evidencia real, perfil
          impresión: "1-marketplace-fuerte-tienda-floja"). `wrap={false}`
          ENVUELVE al marcador junto con el bloque que introduce — sin
          esto, Yoga puede separarlos entre dos páginas (el marcador se
          queda en la página vieja, el bloque real arranca la nueva),
          exactamente el defecto que este mecanismo tiene que evitar. */}
      <View wrap={false}>
        <Marcador bloque="metricas" />
        <View style={styles.scenarioMetrics}>
          <View style={styles.scenarioMetric}>
            <Text style={styles.scenarioMetricLabel}>Contribución incremental 90 días</Text>
            <ValorTexto value={item.contribucion90d} dark={dark} styles={styles} />
          </View>
          <View style={styles.scenarioMetric}>
            <Text style={styles.scenarioMetricLabel}>Facturación incremental 90 días</Text>
            <ValorTexto value={item.facturacion90d} dark={dark} styles={styles} />
          </View>
          <View style={styles.scenarioMetric}>
            <Text style={styles.scenarioMetricLabel}>Ahorro publicitario 90 días</Text>
            <ValorTexto value={item.ahorroPublicitario90d} dark={dark} styles={styles} />
          </View>
        </View>
      </View>
      {/* Bloque Visual 2.2.3: primer elemento de la continuación cuando el
          quiebre real cae justo antes de la nota — evidencia real:
          "1-marketplace-fuerte-tienda-floja" en cascada, impresión: las
          métricas quedan con el header pero la nota (y todo lo que sigue)
          se va entera a la página siguiente. Mismo criterio de arriba:
          marcador y nota, un solo `wrap={false}`. */}
      {/* S8 (Bloque 3 Funcional): la nota sólo tiene sentido si hay un
          ahorro publicable del que hablar — nunca si está
          retenido/no_aplica/evidencia_faltante. */}
      {item.ahorroPublicitario90d.estado === "calculado" ? (
        <View wrap={false}>
          <Marcador bloque="nota" />
          <Text style={styles.scenarioNote}>
            El presupuesto liberado por consolidación de pauta puede reinvertirse; si eso ocurre, el efecto
            sería mayor al proyectado. Esta versión trata el ahorro de forma conservadora y no asume esa
            reinversión.
          </Text>
        </View>
      ) : null}
      {item.mensual.length > 0 ? (
        <View style={styles.monthlyTable}>
          {/* D-4: la nota de referencia va JUNTO al encabezado (mismo
              `wrap={false}`, bloque chico) — no en toda la tabla: un
              primer intento marcó la tabla ENTERA `wrap={false}` para
              garantizar que la nota y las dagas nunca quedaran en páginas
              distintas, pero eso obligaba a mover la tabla completa a la
              página siguiente en vez de partir filas, disparando un
              crecimiento desproporcionado de la paginación (hallazgo real,
              revertido: hasta +4 páginas por documento). Con la nota en el
              encabezado, la primera página de la tabla siempre la lleva;
              las filas individuales (cada una ya `wrap={false}`) se
              siguen partiendo entre páginas como antes de esta ronda. */}
          <View wrap={false}>
            {item.supuestos.length > 0 ? (
              <Text style={[styles.estadoDetalle, dark ? styles.estadoDetalleDark : {}]}>
                † remite a Supuestos, en este mismo escenario.
              </Text>
            ) : null}
          </View>
          {stacked ? (
            <MonthlyTableStacked
              mensual={item.mensual}
              dark={dark}
              styles={styles}
              marcadorParaMes={(mes) =>
                mes === item.mensual[0]?.mes ? <Marcador bloque="tabla" /> : <Marcador bloque={`mes:${mes}`} />
              }
            />
          ) : (
            <>
              {/* Bloque Visual 2.2.3: el marcador va DENTRO del mismo
                  `wrap={false}` que la fila de encabezado de la tabla
                  (no antes, suelto) — mismo criterio que arriba: nunca
                  puede quedar huérfano si el encabezado se mueve entero
                  a la página siguiente. */}
              <View wrap={false}>
                <Marcador bloque="tabla" />
                <MonthlyTableHeader styles={styles} />
              </View>
              {item.mensual.map((mes, index) => (
                <View key={mes.mes} wrap={false}>
                  {/* Bloque Visual 2.2.3: cada fila de mes ya se parte
                      individualmente entre páginas (D-4, sin cambios) —
                      la fila 1 la cubre el marcador "tabla" de arriba;
                      cualquier fila SIGUIENTE que abra su propia página
                      también necesita el primer elemento. Fuera de
                      `monthlyTableRow` (`flexDirection: row`): el
                      marcador es una línea propia, no una columna más. */}
                  {index > 0 ? <Marcador bloque={`mes:${mes.mes}`} /> : null}
                  <View style={styles.monthlyTableRow}>
                    <Text style={styles.monthlyTableMonthCell}>Mes {mes.mes}</Text>
                    <Text style={styles.monthlyTableCell}>{textoEstadoV2(mes.contribucionIncrementalHabilitada).texto}</Text>
                    <Text style={styles.monthlyTableCell}>{textoEstadoV2(mes.facturacionProyectada).texto}</Text>
                    <Text style={styles.monthlyTableCell}>{textoEstadoV2(mes.facturacionIncrementalHabilitada).texto}</Text>
                    <Text style={styles.monthlyTableCell}>{textoEstadoV2(mes.ahorroPublicitarioHabilitado).texto}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      ) : null}
      {grupos.map((tipo) => {
        const palancasDelGrupo = item.palancas.filter((p) => p.tipo === tipo);
        if (palancasDelGrupo.length === 0) return null;
        return (
          <View key={tipo} style={styles.palancaGroup} wrap={false}>
            {/* Bloque Visual 2.2.3: primer elemento de la continuación
                cuando el quiebre real cae justo antes de ESTE grupo. */}
            <Marcador bloque={`grupo:${tipo}`} />
            <Text style={styles.palancaGroupTitle}>{LABELS_MAGNITUD[tipo]}</Text>
            {palancasDelGrupo.map((palanca) => (
              <Text key={palanca.id} style={bodyStyle}>
                {palanca.nombre}: {textoEstadoV2(palanca.monto).texto} ({LABELS_PERIODO[palanca.periodo]})
              </Text>
            ))}
            {/* D-4: mismo criterio que en la tabla mensual — la nota vive
                en el mismo `wrap={false}` que los montos con daga. */}
            {item.supuestos.length > 0 && item.mensual.length === 0 ? (
              <Text style={[styles.estadoDetalle, dark ? styles.estadoDetalleDark : {}]}>
                † remite a Supuestos, en este mismo escenario.
              </Text>
            ) : null}
          </View>
        );
      })}
      {item.supuestos.length > 0 ? (
        <View style={styles.palancaGroup} wrap={false}>
          {/* Corrección 1, ronda 2.2.1: éste era el punto de quiebre real
              original (evidencia: "la página abre directamente con
              'Supuestos...' sin ninguna identidad de escenario"). Bloque
              Visual 2.2.3: ahora es uno más de los bloques que el mapa
              medido puede marcar — se pinta acá sólo cuando el quiebre
              real cae acá. */}
          <Marcador bloque="supuestos" />
          <Text style={styles.palancaGroupTitle}>{TITULO_SUPUESTOS_CON_DAGA}</Text>
          <BulletList items={item.supuestos.map((s) => s.valor)} styles={styles} />
        </View>
      ) : null}
      {item.restricciones.map((restriction) => (
        <Text key={restriction.id} style={bodyStyle}>
          Condición: {restriction.etiqueta}
        </Text>
      ))}
    </View>
  );
}

function renderBlock(
  block: DocumentBlockV2,
  dark: boolean,
  styles: Styles,
  profile: PdfProfileV2,
  mapaPaginacion: MapaPaginacionV2,
): React.ReactNode {
  const p = PROFILES_V2[profile];
  const cardStyle = [styles.card, dark ? styles.cardDark : {}];
  const standaloneCardStyle = [styles.standaloneCard, dark ? styles.cardDark : {}];
  const bodyStyle = [styles.itemBody, dark ? styles.itemBodyDark : {}];

  switch (block.type) {
    case "coverage":
      return (
        <View key="coverage">
          <Text style={[styles.blockTitle, dark ? styles.blockTitleDark : {}]}>
            Confianza: {block.confidence.toUpperCase()}
          </Text>
          {block.items.map((item) => (
            <View key={item.id} style={styles.progressRow} wrap={false}>
              <View style={styles.progressHeader}>
                <Text style={dark ? { color: theme.colors.surface } : {}}>{item.label}</Text>
                <Text
                  style={{
                    fontFamily: HEADING,
                    fontWeight: W.bold,
                    color: dark ? theme.colors.surface : theme.colors.text,
                  }}
                >
                  {item.value}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${Math.max(0, Math.min(100, item.value))}%` }]} />
              </View>
              {/* DA-1 (Bloque 3 Funcional): chip de Eje 1, sólo cuando hay origen inequívoco. */}
              {item.origen ? (
                <Text style={[styles.estadoDetalle, dark ? { color: theme.colors.surface } : {}]}>
                  {textoOrigenV2(item.origen)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      );
    case "metric-grid":
      return (
        <CardGrid
          key="metric-grid"
          items={block.items}
          cols={p.colsMetricGrid}
          styles={styles}
          render={(raw, index) => {
            const item = raw as (typeof block.items)[number];
            return (
              <View key={item.id ?? index} style={cardStyle} wrap={false}>
                <Text style={[styles.cardLabel, dark ? styles.cardLabelDark : {}]}>{item.label}</Text>
                <ValorTexto value={item.value} dark={dark} styles={styles} />
                {/* DA-1: chip de Eje 1, sólo cuando hay origen inequívoco. */}
                {item.origen ? (
                  <Text style={[styles.estadoDetalle, dark ? { color: theme.colors.surface } : {}]}>
                    {textoOrigenV2(item.origen)}
                  </Text>
                ) : null}
              </View>
            );
          }}
        />
      );
    case "channel-comparison": {
      const t = textoEstadoV2(block.tienda.value);
      const m = textoEstadoV2(block.marketplace.value);
      const tVal = block.tienda.value.estado === "calculado" ? block.tienda.value.valor : 0;
      const mVal = block.marketplace.value.estado === "calculado" ? block.marketplace.value.valor : 0;
      const max = Math.max(tVal, mVal, 0.001);
      return (
        <View key="channel-comparison" style={standaloneCardStyle} wrap={false}>
          <Text style={styles.blockTitle}>Comparación entre canales</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <IconCircle kind="tienda" styles={styles} />
            <Text style={[styles.cardLabel, dark ? styles.cardLabelDark : {}]}>{block.tienda.label}</Text>
          </View>
          <Text style={[styles.cardValue, dark ? styles.cardValueDark : {}]}>{t.texto}</Text>
          <View style={styles.channelBar}>
            <View style={[styles.channelBarFill, { width: `${Math.max(4, (tVal / max) * 100)}%` }]} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
            <IconCircle kind="marketplace" styles={styles} />
            <Text style={[styles.cardLabel, dark ? styles.cardLabelDark : {}]}>
              {block.marketplace.label}
            </Text>
          </View>
          <Text style={[styles.cardValue, dark ? styles.cardValueDark : {}]}>{m.texto}</Text>
          <View style={styles.channelBar}>
            <View style={[styles.channelBarFill, { width: `${Math.max(4, (mVal / max) * 100)}%` }]} />
          </View>
        </View>
      );
    }
    case "shipping":
      return (
        <View key="shipping" style={standaloneCardStyle} wrap={false}>
          <Text style={[styles.cardLabel, dark ? styles.cardLabelDark : {}]}>{block.label}</Text>
          <ValorTexto value={block.cost} dark={dark} styles={styles} />
        </View>
      );
    case "strengths":
      return (
        <CardGrid
          key="strengths"
          items={block.items}
          cols={p.colsServices}
          styles={styles}
          render={(raw, index) => {
            const item = raw as (typeof block.items)[number];
            const metrica = textoEstadoV2(item.metrica);
            const umbral = textoEstadoV2(item.umbral);
            return (
              <View key={item.id ?? index} style={cardStyle} wrap={false}>
                <Text style={[styles.findingIndex, dark ? styles.findingIndexDark : {}]}>✓</Text>
                <Text style={styles.itemTitle}>{item.etiqueta}</Text>
                <Text style={bodyStyle}>
                  {metrica.texto}, por encima del umbral de referencia ({umbral.texto}).
                </Text>
              </View>
            );
          }}
        />
      );
    case "findings":
      return (
        <CardGrid
          key="findings"
          items={block.items}
          cols={p.colsFindings}
          styles={styles}
          render={(raw, index) => {
            const item = raw as (typeof block.items)[number];
            const alerta = item.esMargenNegativo;
            return (
              <View
                key={item.id}
                style={[...cardStyle, alerta ? styles.cardAlerta : {}]}
                wrap={false}
              >
                <Text style={[styles.findingIndex, dark ? styles.findingIndexDark : {}]}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
                {alerta ? (
                  <Text style={[styles.badge, styles.badgeAlta]}>▲ ALERTA CRÍTICA · MARGEN NEGATIVO</Text>
                ) : (
                  <PrioridadBadge prioridad={item.prioridad} styles={styles} />
                )}
                <Text style={styles.itemTitle}>{item.titulo}</Text>
                <Text style={bodyStyle}>
                  {LABELS_CAPA[item.capa]} · confianza {item.confianza}
                  {item.magnitud ? ` · ${LABELS_MAGNITUD[item.magnitud]}` : ""}
                </Text>
                {item.monto ? (
                  <View style={{ marginTop: 7 }}>
                    <ValorTexto value={item.monto} dark={dark} styles={styles} />
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      );
    case "commercial-summary": {
      const kickerStyle = [styles.commercialSummaryKicker, dark ? styles.commercialSummaryKickerDark : {}];
      const statementStyle = [
        styles.commercialSummaryStatement,
        dark ? styles.commercialSummaryStatementDark : {},
      ];
      if (block.headline) {
        const t = textoEstadoV2(block.headline);
        return (
          <View key="commercial-summary" style={standaloneCardStyle} wrap={false}>
            <Text style={kickerStyle}>Contribución incremental a 90 días · Escenario conservador</Text>
            <Text style={styles.commercialSummaryNumber}>{t.texto}</Text>
            {block.statement ? <Text style={statementStyle}>{block.statement}</Text> : null}
            {block.assumptionsDetail.length > 0 ? (
              <View style={styles.palancaGroup} wrap={false}>
                <Text style={[styles.palancaGroupTitle, dark ? { color: theme.colors.surface } : {}]}>
                  {TITULO_SUPUESTOS_CON_DAGA}
                </Text>
                <BulletList items={block.assumptionsDetail.map((s) => s.valor)} styles={styles} />
              </View>
            ) : null}
          </View>
        );
      }
      const lower = block.range.lower ? textoEstadoV2(block.range.lower).texto : "";
      const upper = block.range.upper ? textoEstadoV2(block.range.upper).texto : "";
      return (
        <View key="commercial-summary" style={standaloneCardStyle} wrap={false}>
          <Text style={kickerStyle}>Rango de contribución incremental a 90 días</Text>
          <Text style={styles.commercialSummaryRange}>
            {lower} – {upper}
          </Text>
          {block.dispersion.dataToCloseIt.length > 0 ? (
            <BulletList items={block.dispersion.dataToCloseIt} styles={styles} />
          ) : null}
          {block.statement ? <Text style={statementStyle}>{block.statement}</Text> : null}
        </View>
      );
    }
    case "bridge-note":
      return (
        <Text key="bridge-note" style={[styles.bridgeNote, dark ? styles.bridgeNoteDark : {}]}>
          {block.text}
        </Text>
      );
    case "scenarios": {
      const cortas = block.items.filter((i) => i.esCorta);
      const largas = block.items.filter((i) => !i.esCorta);
      return (
        <View key="scenarios" style={styles.cardGrid}>
          {cortas.length > 0 ? (
            <CardGrid
              items={cortas}
              cols={p.colsScenarios}
              styles={styles}
              render={(raw) => {
                const item = raw as EscenarioV2;
                return (
                  <ScenarioCard
                    key={item.id}
                    item={item}
                    dark={dark}
                    cardStyle={cardStyle}
                    bodyStyle={bodyStyle}
                    styles={styles}
                    full={false}
                    profile={profile}
                    marcadores={mapaPaginacion.get(item.id) ?? SIN_MARCADORES}
                  />
                );
              }}
            />
          ) : null}
          {largas.map((item) => (
            <ScenarioCard
              key={item.id}
              item={item}
              dark={dark}
              cardStyle={standaloneCardStyle}
              bodyStyle={bodyStyle}
              styles={styles}
              full
              profile={profile}
              marcadores={mapaPaginacion.get(item.id) ?? SIN_MARCADORES}
            />
          ))}
        </View>
      );
    }
    case "roadmap":
      return (
        <View key="roadmap">
          {block.items.map((item, index) => (
            <View key={item.id} style={styles.roadmapCard} wrap={false}>
              <Text style={styles.roadmapDays}>
                {String(index + 1).padStart(2, "0")} · DÍAS {item.desdeDia}-{item.hastaDia}
              </Text>
              <View style={styles.roadmapBody}>
                <Text style={styles.itemTitle}>{item.etiqueta}</Text>
                <BulletList items={item.acciones} styles={styles} />
                <Text style={bodyStyle}>Resultado: {item.resultadoEsperado}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    case "services":
      return (
        <CardGrid
          key="services"
          items={block.items}
          cols={p.colsServices}
          styles={styles}
          render={(raw, index) => {
            const item = raw as (typeof block.items)[number];
            return (
              <View key={item.id} style={cardStyle} wrap={false}>
                <Text style={[styles.findingIndex, dark ? styles.findingIndexDark : {}]}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Text style={styles.itemTitle}>{item.nombre}</Text>
                <BulletList items={item.alcance} styles={styles} />
              </View>
            );
          }}
        />
      );
    case "commercial-offer":
      if (block.pendiente) {
        return (
          <View key="commercial-offer" style={[standaloneCardStyle, styles.cardAlerta]} wrap={false}>
            <Text style={styles.itemTitle}>Selección comercial pendiente</Text>
            <Text style={styles.itemBody}>
              No hay una escalera de paquetes confirmada para este cliente todavía.
            </Text>
          </View>
        );
      }
      return (
        <View key="commercial-offer" style={styles.cardGrid}>
          {block.niveles.map((nivel) => (
            <View key={nivel.id} style={standaloneCardStyle} wrap={false}>
              <Text style={styles.itemTitle}>{nivel.nombre}</Text>
              {nivel.precio ? (
                <ValorTexto value={nivel.precio} dark={dark} styles={styles} />
              ) : (
                <Text style={styles.estadoTexto}>Precio a definir</Text>
              )}
              <BulletList
                items={nivel.servicios.map((servicio) =>
                  servicio.unidad === "alcance_descrito"
                    ? servicio.descripcion
                      ? `${servicio.servicio} — ${servicio.descripcion}`
                      : servicio.servicio
                    : `${servicio.servicio} — ${servicio.cantidad ?? 0} ${LABELS_UNIDAD_COMERCIAL[servicio.unidad]}`,
                )}
                styles={styles}
              />
            </View>
          ))}
        </View>
      );
    case "restrictions":
      return (
        <View key="restrictions">
          {block.items.map((item) => (
            <View key={item.id} style={styles.sectionNote} wrap={false}>
              <Text style={styles.itemTitle}>{item.etiqueta}</Text>
              <Text style={styles.itemBody}>{item.detalle}</Text>
            </View>
          ))}
        </View>
      );
    case "restrictions-grouped":
      return (
        <View key="restrictions-grouped">
          {block.items.map((grupo) => (
            <View key={grupo.motivo} style={styles.sectionNote} wrap={false}>
              <Text style={styles.itemTitle}>{grupo.motivo}</Text>
              <BulletList items={grupo.etiquetas} styles={styles} />
            </View>
          ))}
        </View>
      );
    case "methodology":
      return (
        <View key="methodology" style={styles.cardGrid}>
          {block.items.map((item) => (
            <View key={item.id} style={standaloneCardStyle} wrap={false}>
              <Text style={styles.itemTitle}>{item.etiqueta}</Text>
              <Text style={bodyStyle}>{item.valor}</Text>
              <Text style={bodyStyle}>Origen: {item.origen}</Text>
            </View>
          ))}
        </View>
      );
    case "transition":
    case "next-step":
    case "cover":
      return null;
  }
}

function Footer({ dark, styles }: { dark: boolean; styles: Styles }) {
  return (
    <View style={[styles.footer, dark ? styles.footerDark : {}]} fixed>
      <View style={styles.footerRow}>
        <SimboloVelocentum color={dark ? theme.colors.surface : theme.colors.muted} width={12} height={12} />
        <Text style={[styles.wordmark, { marginLeft: 6 }]}>Velocentum</Text>
      </View>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

/**
 * C3, ronda 2.1: en impresión (A4), ningún elemento decorativo de tono
 * oscuro va a sangre completa — el fondo es claro y el acento queda
 * contenido en un bloque delimitado (nunca > 25% de la superficie de la
 * página, ver `IMPRESION_ACCENT_GEOMETRY`). El perfil pantalla no cambia:
 * conserva el tratamiento a sangre completa ya aprobado.
 */
function CoverPage({
  block,
  profile,
  styles,
}: {
  block: Extract<DocumentBlockV2, { type: "cover" }>;
  profile: PdfProfileV2;
  styles: Styles;
}) {
  const impresion = profile === "impresion";
  if (impresion) {
    return (
      <Page size={PROFILES_V2[profile].pageSize} style={styles.coverPageLight}>
        <View style={styles.coverAccentBounded}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="coverGradientA4" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={theme.colors.primary} stopOpacity={1} />
                <Stop offset="1" stopColor={theme.colors.primaryBright} stopOpacity={0.85} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#coverGradientA4)" />
            {/* D-3: líneas diagonales sutiles sobre el degradado — el
                acento deja de leerse como un bloque sólido sin función
                (D-5 criterio 2) y pasa a ser un elemento de dirección de
                arte con intención, fiel a la geometría de la referencia. */}
            {[10, 30, 50, 70, 90].map((offset) => (
              <Line
                key={offset}
                x1={offset - 20}
                y1={0}
                x2={offset + 20}
                y2={100}
                stroke="#FFFFFF"
                strokeWidth={0.6}
                strokeOpacity={0.22}
              />
            ))}
          </Svg>
        </View>
        <View style={styles.coverMark}>
          <SimboloVelocentum color={theme.colors.primary} width={40} height={40} />
        </View>
        <Text style={[styles.coverTitle, styles.coverTitleLight]}>{block.title}</Text>
        <Text style={[styles.coverSubtitle, styles.coverSubtitleLight]}>{block.subtitle}</Text>
        <HeadingRule styles={styles} />
        {/* C9: un solo tratamiento de wordmark ("Velocentum", caja mixta,
            texto) — reemplaza el logotipo SVG en minúscula por el mismo
            texto que ya usa el pie de página, sin tocar `marca.tsx` (v1,
            compartido). */}
        <View style={styles.coverWordmark}>
          <Text style={[styles.coverWordmarkText, { color: theme.colors.primary }]}>Velocentum</Text>
        </View>
        {/* C10: cliente, tipo de documento, fecha y versión — los cuatro campos. */}
        <View style={[styles.coverMeta, styles.coverMetaLight]}>
          <Text>{block.clientName}</Text>
          <Text>{LABELS_TIPO_DOCUMENTO[block.documentKind]}</Text>
          <Text>{block.diagnosticDate}</Text>
          <Text>{block.version}</Text>
        </View>
      </Page>
    );
  }
  return (
    <Page size={PROFILES_V2[profile].pageSize} style={styles.coverPage}>
      {/* Gradiente lineal primary -> primaryBright en vez de dos bloques sólidos (R-05). */}
      <Svg style={styles.coverGradientLayer} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="coverGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity={1} />
            <Stop offset="1" stopColor={theme.colors.primaryBright} stopOpacity={0.85} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#coverGradient)" />
      </Svg>
      <View style={styles.coverMark}>
        <SimboloVelocentum color={theme.colors.surface} width={46} height={46} />
      </View>
      <Text style={styles.coverTitle}>{block.title}</Text>
      <Text style={styles.coverSubtitle}>{block.subtitle}</Text>
      <HeadingRule styles={styles} />
      {/* C9: mismo tratamiento textual que el pie de página (ver nota arriba). */}
      <View style={styles.coverWordmark}>
        <Text style={[styles.coverWordmarkText, { color: theme.colors.surface }]}>Velocentum</Text>
      </View>
      {/* C10: cliente, tipo de documento, fecha y versión — los cuatro campos. */}
      <View style={styles.coverMeta}>
        <Text>{block.clientName}</Text>
        <Text>{LABELS_TIPO_DOCUMENTO[block.documentKind]}</Text>
        <Text>{block.diagnosticDate}</Text>
        <Text>{block.version}</Text>
      </View>
    </Page>
  );
}

function TransitionPage({
  section,
  profile,
  styles,
}: {
  section: DocumentSectionV2;
  profile: PdfProfileV2;
  styles: Styles;
}) {
  const block = section.blocks.find(
    (candidate): candidate is Extract<DocumentBlockV2, { type: "transition" | "next-step" }> =>
      candidate.type === "transition" || candidate.type === "next-step",
  );
  const impresion = profile === "impresion";
  if (impresion) {
    return (
      <Page size={PROFILES_V2[profile].pageSize} style={styles.transitionPageLight}>
        <View style={styles.transitionBandLight}>
          <Text style={styles.transitionMark}>VELOCENTUM / {section.eyebrow ?? "SIGUIENTE"}</Text>
          <Text style={[styles.transitionTitle, { color: theme.colors.surface }]}>
            {block?.label ?? section.title ?? "Próximo paso"}
          </Text>
        </View>
        <Footer dark={false} styles={styles} />
      </Page>
    );
  }
  return (
    <Page size={PROFILES_V2[profile].pageSize} style={styles.transitionPage}>
      {/* Corrección 3, ronda 2.2.1: D-5 viñeta 7 ("transiciones y cierres
          con intención visual, evitando bloques planos sin función")
          quedó sin atender en pantalla — el fondo violeta a sangre se
          conserva (C3 no aplica acá), pero ya no es un rectángulo liso con
          una sola línea de texto. */}
      <View style={styles.transitionAccentBounded}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[10, 30, 50, 70, 90].map((offset) => (
            <Line
              key={offset}
              x1={offset - 20}
              y1={0}
              x2={offset + 20}
              y2={100}
              stroke={theme.colors.surface}
              strokeWidth={0.6}
              strokeOpacity={0.16}
            />
          ))}
        </Svg>
      </View>
      <Text style={styles.transitionMark}>VELOCENTUM / {section.eyebrow ?? "SIGUIENTE"}</Text>
      <Text style={styles.transitionTitle}>{block?.label ?? section.title ?? "Próximo paso"}</Text>
      <HeadingRule styles={styles} light />
      <Footer dark styles={styles} />
    </Page>
  );
}

function ContentPage({
  section,
  profile,
  styles,
  kind,
  mapaPaginacion,
}: {
  section: DocumentSectionV2;
  profile: PdfProfileV2;
  styles: Styles;
  kind: DocumentKindV2;
  mapaPaginacion: MapaPaginacionV2;
}) {
  const wantsDark = section.tone === "dark";
  // C3, ronda 2.1: una sección "dark" en impresión no va a sangre
  // completa — se aplana a fondo claro con un acento contenido (franja
  // delgada), y todo el contenido interno se renderiza como si fuera
  // claro (evita el defecto de contraste C4(a): texto claro fijo sobre
  // una tarjeta que ya no es oscura).
  const impresionSoftened = wantsDark && profile === "impresion";
  const dark = wantsDark && !impresionSoftened;
  return (
    <Page
      size={PROFILES_V2[profile].pageSize}
      style={[
        styles.page,
        dark ? styles.pageDark : {},
        section.tone === "soft" || impresionSoftened ? styles.pageSoft : {},
      ]}
      wrap
    >
      {/* Sin `fixed`: combinado con `wrap={false}` en las tarjetas del
          contenido, `fixed` hacía que Yoga calculara mal la altura del
          primer bloque de la página y lo dejaba invisible (mismo patrón
          de bug ya reportado en el cierre del Bloque Visual 2 para
          `fixed` dentro de contenido con wrap). Sin `fixed`, la franja
          sólo se repite en la primera página de la sección si se parte
          entre páginas — trade-off aceptado, documentado acá. */}
      {/* D-5, hallazgo real de esta ronda: `Svg` en `@react-pdf/renderer` NO
          se comporta como `View` bajo `position: "absolute"` — combinado
          con `wrap` de página, generaba el warning "Node of type SVG can't
          wrap between pages and it's bigger than available page height",
          el color rgba() no se pintaba como se esperaba (aparecía como
          trazo amarillo opaco en vez del violeta translúcido pedido) y
          forzaba páginas adicionales completas ocupadas sólo por la
          textura (verificado comparando el conteo de páginas antes/después
          de esta ronda: hasta +4 páginas por documento). Se retira de
          `ContentPage` — la textura de fondo queda sólo en la portada
          (`CoverPage`), donde el `Svg` está anidado dentro de un `View`
          con tamaño fijo, no como hijo `position: absolute` de la página,
          y ahí sí se verificó correcta (ver captura de portada, sección 9
          del handoff). */}
      {impresionSoftened ? <View style={styles.impresionAccentBand} /> : null}
      <View style={styles.header} fixed>
        {section.eyebrow ? (
          <Text style={[styles.eyebrow, dark ? styles.eyebrowDark : {}]}>
            <PersonalityGlyph kind={kind} styles={styles} />
            {section.eyebrow}
          </Text>
        ) : null}
        {/* D-5: el motivo de línea+puntos se reserva para portada/hero
            (`CoverPage`) — agregarlo también acá, en el header absoluto de
            CADA página de contenido, exigía crecer `pagePaddingTop` en
            todas las páginas y eso disparó un crecimiento desproporcionado
            de la paginación (hallazgo real de esta ronda, verificado
            comparando el conteo de páginas antes/después: hasta +4 páginas
            por documento). Revertido: `pagePaddingTop` vuelve a su valor
            de la ronda 2.1 y el motivo no se repite en cada sección. */}
        {section.title ? <Text style={styles.title}>{section.title}</Text> : null}
      </View>
      <View style={styles.content}>
        {section.blocks.map((block) => renderBlock(block, dark, styles, profile, mapaPaginacion))}
      </View>
      <Footer dark={dark} styles={styles} />
    </Page>
  );
}

/**
 * Fecha de creación fija (no `new Date()`): el metadato `CreationDate`
 * de un PDF viaja al identificador de archivo (`PDFSecurity.generateFileID`,
 * hash de `CreationDate` + el resto de `info`), así que con la fecha real
 * dos renderizados del mismo documento nunca son bit a bit idénticos.
 * Bloque Visual 2.2.3, U3/L5: el determinismo (mismo hash en corridas
 * consecutivas) es un criterio de aceptación explícito de esta ronda.
 */
const FECHA_CREACION_FIJA_V2 = new Date("2026-01-01T00:00:00.000Z");

function VelocentumPdfDocumentV2({
  model,
  profile,
  mapaPaginacion,
}: {
  model: DocumentModelV2;
  profile: PdfProfileV2;
  mapaPaginacion: MapaPaginacionV2;
}) {
  const styles = makeStylesV2(profile);
  return (
    <Document
      title={model.metadata.title}
      author="Velocentum"
      subject={`${model.metadata.title} - ${model.metadata.clientName}`}
      creator={`Velocentum · ${model.templateId}`}
      language="es-AR"
      creationDate={FECHA_CREACION_FIJA_V2}
    >
      {model.sections.map((section) => {
        const cover = section.blocks.find(
          (block): block is Extract<DocumentBlockV2, { type: "cover" }> => block.type === "cover",
        );
        if (cover) return <CoverPage key={section.id} block={cover} profile={profile} styles={styles} />;
        if (section.blocks.some((block) => block.type === "transition" || block.type === "next-step")) {
          return <TransitionPage key={section.id} section={section} profile={profile} styles={styles} />;
        }
        return (
          <ContentPage
            key={section.id}
            section={section}
            profile={profile}
            styles={styles}
            kind={model.kind}
            mapaPaginacion={mapaPaginacion}
          />
        );
      })}
    </Document>
  );
}

export function createPdfDocumentElementV2(
  model: DocumentModelV2,
  profile: PdfProfileV2 = "pantalla",
  mapaPaginacion: MapaPaginacionV2 = MAPA_PAGINACION_VACIO_V2,
): React.ReactElement<DocumentProps> {
  return <VelocentumPdfDocumentV2 model={model} profile={profile} mapaPaginacion={mapaPaginacion} />;
}
