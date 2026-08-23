/* eslint-disable react-refresh/only-export-components -- PDF primitives are not Fast Refresh UI components. */
import React from "react";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  type DocumentProps,
} from "@react-pdf/renderer";
import { VELOCENTUM_LIGHT_V1 } from "../../theme";
import { registrarFuentesVelocentum } from "../../theme/fuentes/registrar-fuentes";
import type {
  DocumentBlock,
  DocumentModel,
  DocumentSection,
  PublishedNumber,
} from "../../templates/velocentum-v1";
import { formatPublishedNumber, labelConfidence } from "./format";
import { SimboloVelocentum, WordmarkVelocentum } from "./marca";

const theme = VELOCENTUM_LIGHT_V1;

registrarFuentesVelocentum();

/**
 * Dos formatos desde la misma fuente de datos (bloque visual, 2026-08-22,
 * `docs/especificacion-visual-pdfs-fases-11-13.md` sección 8): "pantalla"
 * (16:9, para videollamada y lectura digital) e "impresión" (A4, layout
 * propio — NUNCA una versión escalada de la de pantalla). Lo que cambia
 * entre perfiles son los tokens de abajo (tamaño de página, tipografía,
 * columnas de grilla); el árbol de secciones/bloques es el mismo
 * `DocumentModel`, sin ningún dato nuevo por perfil.
 */
export type PdfProfile = "pantalla" | "impresion";

type FontVariant = { weight: number; style?: "italic" };

/** Etiqueta de magnitud económica (corrección aprobada 2026-08-21, punto 3). */
const LABELS_MAGNITUD = {
  facturacion_incremental: "Facturación incremental",
  contribucion_incremental: "Contribución incremental",
  ahorro_publicitario: "Ahorro publicitario",
} as const;

Font.registerHyphenationCallback((word) => [word]);

const HEADING = theme.typography.heading;
const BODY = theme.typography.body;
const W = {
  regular: theme.typography.weightRegular,
  medium: theme.typography.weightMedium,
  semiBold: theme.typography.weightSemiBold,
  bold: theme.typography.weightBold,
  black: theme.typography.weightBlack,
};

type ProfileTokens = {
  pageSize: [number, number] | "A4";
  pagePaddingH: number;
  pagePaddingTop: number;
  pagePaddingBottom: number;
  baseFontSize: number;
  titleFontSize: number;
  titleMaxWidth: number;
  coverPadding: number;
  coverTitleFontSize: number;
  coverTitleWidth: number;
  /** Ancho de la franja sólida de acento, pegada al borde derecho de la portada. */
  coverAccentWidth: number;
  /** Ancho de la franja de acento suave, a la izquierda de la sólida. */
  coverAccentSoftWidth: number;
  /** Distancia desde el borde derecho hasta donde arranca la franja suave. */
  coverAccentSoftOffset: number;
  transitionTitleFontSize: number;
  transitionTitleWidth: number;
  /** Ancho de una tarjeta en la grilla de tres/dos columnas según el perfil. */
  cardWidthGrid: string;
  /** Ancho de una tarjeta "ancha": mitad de página en pantalla, página completa en impresión. */
  cardWidthWide: string;
};

/**
 * Impresión (A4) usa DOS columnas en vez de tres y tarjetas anchas a
 * página completa en vez de media página: es más angosta que la pantalla
 * 16:9 y el cuerpo tipográfico es mayor (mejor lectura en papel), así que
 * una grilla de tres columnas quedaría ilegible. Esto es un layout propio,
 * no una reducción del de pantalla.
 */
/** Exportado sólo para la prueba geométrica que verifica que el título/subtítulo de portada nunca invade la franja de acento. */
export const PROFILES: Record<PdfProfile, ProfileTokens> = {
  pantalla: {
    pageSize: [960, 540],
    pagePaddingH: 54,
    pagePaddingTop: 84,
    pagePaddingBottom: 48,
    baseFontSize: 10,
    titleFontSize: 25,
    titleMaxWidth: 720,
    coverPadding: 64,
    coverTitleFontSize: 46,
    coverTitleWidth: 500,
    coverAccentWidth: 300,
    coverAccentSoftWidth: 170,
    coverAccentSoftOffset: 210,
    transitionTitleFontSize: 38,
    transitionTitleWidth: 790,
    cardWidthGrid: "31.8%",
    cardWidthWide: "48.8%",
  },
  impresion: {
    pageSize: "A4",
    pagePaddingH: 48,
    pagePaddingTop: 78,
    pagePaddingBottom: 46,
    baseFontSize: 11,
    titleFontSize: 20,
    titleMaxWidth: 460,
    coverPadding: 48,
    coverTitleFontSize: 30,
    // El título/subtítulo de portada nunca puede superar
    // `coverPadding + coverTitleWidth` sin invadir la franja de acento
    // suave (arranca en pageWidth - coverAccentSoftOffset - coverAccentSoftWidth
    // = 595.28 - 130 - 105 = 360.28): 48 + 300 = 348, con margen de sobra.
    coverTitleWidth: 300,
    coverAccentWidth: 186,
    coverAccentSoftWidth: 105,
    coverAccentSoftOffset: 130,
    transitionTitleFontSize: 26,
    transitionTitleWidth: 420,
    cardWidthGrid: "48.8%",
    cardWidthWide: "100%",
  },
};

function makeStyles(profile: PdfProfile) {
  const p = PROFILES[profile];
  return StyleSheet.create({
    page: {
      paddingTop: p.pagePaddingTop,
      paddingRight: p.pagePaddingH,
      paddingBottom: p.pagePaddingBottom,
      paddingLeft: p.pagePaddingH,
      fontFamily: BODY,
      fontWeight: W.regular,
      fontSize: p.baseFontSize,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    pageDark: {
      color: theme.colors.surface,
      backgroundColor: theme.colors.ink,
    },
    pageSoft: {
      backgroundColor: theme.colors.surfaceSoft,
    },
    header: {
      position: "absolute",
      top: 30,
      left: p.pagePaddingH,
      right: p.pagePaddingH,
    },
    eyebrow: {
      fontSize: 9,
      fontFamily: HEADING,
      fontWeight: W.bold,
      letterSpacing: 1.1,
      color: theme.colors.primary,
      textTransform: "uppercase",
      marginBottom: 7,
    },
    eyebrowDark: { color: "#C8C2FF" },
    title: {
      fontSize: p.titleFontSize,
      lineHeight: 1.08,
      fontFamily: HEADING,
      fontWeight: W.bold,
      color: theme.colors.ink,
      maxWidth: p.titleMaxWidth,
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
      fontSize: 8,
    },
    footerDark: { color: "#B8B4C8" },
    footerMark: { width: 12, height: 12, marginRight: 6 },
    footerRow: { flexDirection: "row", alignItems: "center" },
    wordmark: { fontFamily: HEADING, fontWeight: W.bold, letterSpacing: 0.8 },
    pageNumber: { fontFamily: BODY, fontWeight: W.regular },
    content: { flexDirection: "column", gap: 12 },
    coverPage: {
      padding: p.coverPadding,
      fontFamily: BODY,
      fontWeight: W.regular,
      color: theme.colors.surface,
      backgroundColor: theme.colors.ink,
    },
    coverAccent: {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0,
      width: p.coverAccentWidth,
      backgroundColor: theme.colors.primary,
    },
    coverAccentSoft: {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: p.coverAccentSoftOffset,
      width: p.coverAccentSoftWidth,
      backgroundColor: theme.colors.primaryBright,
      opacity: 0.34,
    },
    coverMark: { marginBottom: 56 },
    coverTitle: {
      width: p.coverTitleWidth,
      fontFamily: HEADING,
      fontWeight: W.black,
      fontSize: p.coverTitleFontSize,
      lineHeight: 1.02,
      marginBottom: 18,
    },
    coverSubtitle: {
      width: p.coverTitleWidth - 10,
      fontSize: 15,
      lineHeight: 1.45,
      color: "#DEDCEA",
    },
    coverMeta: {
      position: "absolute",
      left: p.coverPadding,
      right: p.coverPadding,
      bottom: 42,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 10,
      color: "#CBC7D8",
    },
    coverWordmark: { position: "absolute", left: p.coverPadding, bottom: 78 },
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
    cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    card: {
      width: p.cardWidthGrid,
      minHeight: 72,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    cardWide: { width: p.cardWidthWide },
    cardFull: { width: "100%" },
    cardDark: {
      color: theme.colors.surface,
      borderColor: "#39345A",
      backgroundColor: "#1C173E",
    },
    cardLabel: { fontSize: 8.5, color: theme.colors.muted, marginBottom: 7 },
    cardLabelDark: { color: "#C8C4D5" },
    cardValue: {
      fontFamily: HEADING,
      fontWeight: W.bold,
      fontSize: 19,
      color: theme.colors.ink,
    },
    cardValueDark: { color: theme.colors.surface },
    /**
     * Sin datos / retenido (criterio de aceptación, sección 10 de la
     * especificación): nunca sólo un color — la palabra "Sin datos" en
     * sí misma es la marca, con la advertencia como acento.
     */
    sinDatos: {
      fontFamily: BODY,
      fontWeight: W.semiBold,
      fontSize: 11,
      fontStyle: "italic",
      color: theme.colors.warning,
    },
    badge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 7,
      fontSize: 7,
      fontFamily: BODY,
      fontWeight: W.bold,
      color: theme.colors.primary,
      backgroundColor: theme.colors.surfaceSoft,
      marginBottom: 7,
    },
    badgeDark: { color: theme.colors.surface, backgroundColor: theme.colors.accent },
    itemTitle: {
      fontFamily: HEADING,
      fontWeight: W.bold,
      fontSize: 11,
      lineHeight: 1.25,
      marginBottom: 5,
      color: theme.colors.ink,
    },
    itemBody: { fontSize: 9, lineHeight: 1.35, color: theme.colors.muted },
    itemBodyDark: { color: "#D5D1E0" },
    amount: {
      fontFamily: HEADING,
      fontWeight: W.bold,
      fontSize: 13,
      color: theme.colors.primary,
      marginTop: 7,
    },
    amountDark: { color: "#CEC9FF" },
    progressRow: { marginBottom: 12 },
    progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    progressTrack: {
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.border,
      overflow: "hidden",
    },
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
    listText: { flex: 1, fontSize: 9, lineHeight: 1.35 },
    blockTitle: {
      fontFamily: HEADING,
      fontWeight: W.bold,
      fontSize: 12,
      marginBottom: 9,
      color: theme.colors.ink,
    },
    scenarioHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 9 },
    scenarioMetrics: { flexDirection: "row", gap: 8, marginBottom: 9 },
    scenarioMetric: { flex: 1 },
    scenarioMetricLabel: { fontSize: 7.5, color: theme.colors.muted, marginBottom: 3 },
    scenarioMetricValue: { fontSize: 14, fontFamily: HEADING, fontWeight: W.bold },
    // Contribución incremental es la cifra dominante (corrección aprobada
    // 2026-08-21, punto 2): más grande y con el color primario.
    scenarioMetricValuePrimary: {
      fontSize: 18,
      fontFamily: HEADING,
      fontWeight: W.black,
      color: theme.colors.primary,
    },
    scenarioNote: { fontSize: 8, color: theme.colors.muted, marginTop: 4, lineHeight: 1.3 },
    commercialSummaryKicker: {
      fontSize: 9,
      color: theme.colors.accent,
      fontFamily: HEADING,
      fontWeight: W.bold,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    commercialSummaryNumber: { fontSize: 34, fontFamily: HEADING, fontWeight: W.black },
    commercialSummaryRange: { fontSize: 24, fontFamily: HEADING, fontWeight: W.black },
    commercialSummaryStatement: {
      maxWidth: 480,
      marginTop: 10,
      fontSize: 9.5,
      color: theme.colors.muted,
      lineHeight: 1.4,
    },
    monthlyTable: { marginTop: 6, marginBottom: 6 },
    monthlyTableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
      paddingVertical: 4,
    },
    monthlyTableHeaderRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
      paddingVertical: 4,
    },
    monthlyTableHeaderCell: {
      flex: 1,
      fontSize: 6.5,
      color: theme.colors.muted,
      fontFamily: BODY,
      fontWeight: W.bold,
      textTransform: "uppercase",
    },
    monthlyTableMonthCell: { flex: 1, fontSize: 8, fontFamily: BODY, fontWeight: W.bold },
    monthlyTableCell: { flex: 1, fontSize: 8 },
    roadmapCard: { flexDirection: "row", gap: 13, paddingVertical: 10 },
    roadmapDays: {
      width: 84,
      fontFamily: HEADING,
      fontWeight: W.bold,
      color: theme.colors.primary,
      fontSize: 10,
    },
    roadmapBody: { flex: 1 },
    commercialHero: {
      padding: 18,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      color: theme.colors.surface,
      marginBottom: 12,
    },
    commercialName: { fontFamily: HEADING, fontWeight: W.bold, fontSize: 20, marginBottom: 5 },
    commercialPrice: { fontFamily: HEADING, fontWeight: W.black, fontSize: 25, marginTop: 10 },
    columns: { flexDirection: "row", gap: 16 },
    column: { flex: 1 },
  });
}

type Styles = ReturnType<typeof makeStyles>;

function ValueOrSinDatos({
  value,
  dark,
  styles,
}: {
  value: PublishedNumber | null;
  dark: boolean;
  styles: Styles;
}) {
  if (!value) return <Text style={styles.sinDatos}>Sin datos</Text>;
  return (
    <Text style={[styles.cardValue, dark ? styles.cardValueDark : {}]}>
      {formatPublishedNumber(value)}
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

function renderBlock(block: DocumentBlock, dark: boolean, styles: Styles): React.ReactNode {
  const cardStyle = [styles.card, dark ? styles.cardDark : {}];
  const bodyStyle = [styles.itemBody, dark ? styles.itemBodyDark : {}];
  const badgeStyle = [styles.badge, dark ? styles.badgeDark : {}];

  switch (block.type) {
    case "coverage":
      return (
        <View key="coverage">
          <Text style={styles.blockTitle}>Confianza: {labelConfidence(block.confidence)}</Text>
          {block.items.map((item) => (
            <View key={item.id} style={styles.progressRow} wrap={false}>
              <View style={styles.progressHeader}>
                <Text>{item.label}</Text>
                <Text style={{ fontFamily: theme.typography.heading, fontWeight: theme.typography.weightBold }}>
                  {item.value}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.max(0, Math.min(100, item.value))}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      );
    case "metric-grid":
      return (
        <View key="metric-grid" style={styles.cardGrid}>
          {block.items.map((item) => (
            <View key={item.id} style={cardStyle} wrap={false}>
              <Text style={[styles.cardLabel, dark ? styles.cardLabelDark : {}]}>{item.label}</Text>
              <ValueOrSinDatos value={item.value} dark={dark} styles={styles} />
              <Text style={bodyStyle}>Confianza {item.value.confidence}</Text>
            </View>
          ))}
        </View>
      );
    case "shipping":
      return (
        <View key="shipping" style={[...cardStyle, styles.cardWide]} wrap={false}>
          <Text style={[styles.cardLabel, dark ? styles.cardLabelDark : {}]}>{block.label}</Text>
          <ValueOrSinDatos value={block.cost} dark={dark} styles={styles} />
        </View>
      );
    case "findings":
      return (
        <View key="findings" style={styles.cardGrid}>
          {block.items.map((item) => (
            <View key={item.id} style={[...cardStyle, styles.cardWide]} wrap={false}>
              <Text style={badgeStyle}>{item.prioridad.toUpperCase()}</Text>
              <Text style={styles.itemTitle}>{item.titulo}</Text>
              <Text style={bodyStyle}>
                {item.capa} - confianza {item.confianza}
                {item.magnitud ? ` - ${LABELS_MAGNITUD[item.magnitud]}` : ""}
              </Text>
              {item.amount ? (
                <Text style={[styles.amount, dark ? styles.amountDark : {}]}>
                  {formatPublishedNumber(item.amount)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      );
    case "commercial-summary":
      return (
        <View key="commercial-summary" style={[...cardStyle, styles.cardWide]} wrap={false}>
          {block.headline ? (
            <>
              <Text style={styles.commercialSummaryKicker}>
                Contribución incremental a 90 días · Escenario conservador
              </Text>
              <Text style={styles.commercialSummaryNumber}>
                {formatPublishedNumber(block.headline)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.commercialSummaryKicker}>
                Rango de contribución incremental a 90 días
              </Text>
              <Text style={styles.commercialSummaryRange}>
                {block.range.lower ? formatPublishedNumber(block.range.lower) : "Sin datos"}
                {" – "}
                {block.range.upper ? formatPublishedNumber(block.range.upper) : "Sin datos"}
              </Text>
              {block.dispersion.dataToCloseIt.length > 0 ? (
                <BulletList items={block.dispersion.dataToCloseIt} styles={styles} />
              ) : null}
            </>
          )}
          {block.statement ? (
            <Text style={styles.commercialSummaryStatement}>{block.statement}</Text>
          ) : null}
        </View>
      );
    case "scenarios":
      return (
        <View key="scenarios" style={styles.cardGrid}>
          {block.items.map((item) => (
            <View key={item.id} style={cardStyle} wrap={false}>
              <View style={styles.scenarioHeader}>
                <Text style={styles.itemTitle}>{item.id.toUpperCase()}</Text>
                <Text style={badgeStyle}>{labelConfidence(item.confidence)}</Text>
              </View>
              <View style={styles.scenarioMetrics}>
                {item.contribution90d ? (
                  <View style={styles.scenarioMetric}>
                    <Text style={styles.scenarioMetricLabel}>Contribución incremental 90 días</Text>
                    <Text style={styles.scenarioMetricValuePrimary}>
                      {formatPublishedNumber(item.contribution90d)}
                    </Text>
                  </View>
                ) : null}
                {item.revenue90d ? (
                  <View style={styles.scenarioMetric}>
                    <Text style={styles.scenarioMetricLabel}>Facturación incremental 90 días</Text>
                    <Text style={styles.scenarioMetricValue}>
                      {formatPublishedNumber(item.revenue90d)}
                    </Text>
                  </View>
                ) : null}
                {item.adSavings90d ? (
                  <View style={styles.scenarioMetric}>
                    <Text style={styles.scenarioMetricLabel}>Ahorro publicitario 90 días</Text>
                    <Text style={styles.scenarioMetricValue}>
                      {formatPublishedNumber(item.adSavings90d)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.scenarioNote}>
                El presupuesto liberado por consolidación de pauta puede reinvertirse; si eso
                ocurre, el efecto sería mayor al proyectado. Esta versión trata el ahorro de forma
                conservadora y no asume esa reinversión.
              </Text>
              {item.monthly.length > 0 ? (
                <View style={styles.monthlyTable}>
                  <View style={styles.monthlyTableHeaderRow}>
                    <Text style={styles.monthlyTableHeaderCell}>Mes</Text>
                    <Text style={styles.monthlyTableHeaderCell}>Contribución</Text>
                    <Text style={styles.monthlyTableHeaderCell}>Fact. proyectada</Text>
                    <Text style={styles.monthlyTableHeaderCell}>Fact. incremental</Text>
                    <Text style={styles.monthlyTableHeaderCell}>Ahorro</Text>
                  </View>
                  {item.monthly.map((mes) => (
                    <View key={mes.month} style={styles.monthlyTableRow} wrap={false}>
                      <Text style={styles.monthlyTableMonthCell}>Mes {mes.month}</Text>
                      <Text style={styles.monthlyTableCell}>
                        {mes.contributionEnabled ? formatPublishedNumber(mes.contributionEnabled) : "Sin datos"}
                      </Text>
                      <Text style={styles.monthlyTableCell}>
                        {mes.revenueProjected ? formatPublishedNumber(mes.revenueProjected) : "Sin datos"}
                      </Text>
                      <Text style={styles.monthlyTableCell}>
                        {mes.revenueEnabled ? formatPublishedNumber(mes.revenueEnabled) : "Sin datos"}
                      </Text>
                      <Text style={styles.monthlyTableCell}>
                        {mes.adSavingsEnabled ? formatPublishedNumber(mes.adSavingsEnabled) : "Sin datos"}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {item.levers.map((lever) => (
                <Text key={`${lever.type}:${lever.id}`} style={bodyStyle}>
                  {lever.name}: {formatPublishedNumber(lever.amount)}
                </Text>
              ))}
              {item.restrictions.map((restriction) => (
                <Text key={restriction.id} style={bodyStyle}>
                  Condición: {restriction.etiqueta}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    case "roadmap":
      return (
        <View key="roadmap">
          {block.items.map((item) => (
            <View key={item.id} style={styles.roadmapCard} wrap={false}>
              <Text style={styles.roadmapDays}>
                DÍAS {item.desdeDia}-{item.hastaDia}
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
        <View key="services" style={styles.cardGrid}>
          {block.items.map((item) => (
            <View key={item.id} style={[...cardStyle, styles.cardWide]} wrap={false}>
              <Text style={styles.itemTitle}>{item.nombre}</Text>
              <BulletList items={item.alcance} styles={styles} />
            </View>
          ))}
        </View>
      );
    case "commercial-offer":
      return (
        <View key="commercial-offer">
          <View style={styles.commercialHero} wrap={false}>
            <Text style={styles.commercialName}>{block.name}</Text>
            <Text>
              {block.durationDays} días - {block.paymentTerms}
            </Text>
            {block.price ? (
              <Text style={styles.commercialPrice}>{formatPublishedNumber(block.price)}</Text>
            ) : null}
          </View>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.blockTitle}>Incluye</Text>
              <BulletList items={[...block.scope, ...block.deliverables]} styles={styles} />
            </View>
            <View style={styles.column}>
              <Text style={styles.blockTitle}>No incluye</Text>
              <BulletList items={block.exclusions} styles={styles} />
            </View>
          </View>
        </View>
      );
    case "restrictions":
      return (
        <View key="restrictions">
          {block.items.map((item) => (
            <View key={item.id} style={styles.sectionNote} wrap={false}>
              <Text style={styles.itemTitle}>{item.etiqueta}</Text>
              <Text style={styles.itemBody}>{item.detalle}</Text>
              {item.bloquea.length > 0 ? (
                <Text style={styles.itemBody}>Condiciona: {item.bloquea.join(", ")}</Text>
              ) : null}
            </View>
          ))}
        </View>
      );
    case "methodology":
      return (
        <View key="methodology" style={styles.cardGrid}>
          {block.items.map((item) => (
            <View key={item.id} style={[...cardStyle, styles.cardWide]} wrap={false}>
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
        <SimboloVelocentum
          color={dark ? theme.colors.surface : theme.colors.muted}
          width={12}
          height={12}
        />
        <Text style={[styles.wordmark, { marginLeft: 6 }]}>VELOCENTUM</Text>
      </View>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function CoverPage({
  block,
  profile,
  styles,
}: {
  block: Extract<DocumentBlock, { type: "cover" }>;
  profile: PdfProfile;
  styles: Styles;
}) {
  return (
    <Page size={PROFILES[profile].pageSize} style={styles.coverPage}>
      <View style={styles.coverAccent} />
      <View style={styles.coverAccentSoft} />
      <View style={styles.coverMark}>
        <SimboloVelocentum color={theme.colors.surface} width={46} height={46} />
      </View>
      <Text style={styles.coverTitle}>{block.title}</Text>
      <Text style={styles.coverSubtitle}>{block.subtitle}</Text>
      <View style={styles.coverWordmark}>
        <WordmarkVelocentum color={theme.colors.surface} width={130} height={87} />
      </View>
      <View style={styles.coverMeta}>
        <Text>{block.clientName}</Text>
        <Text>{block.diagnosticDate}</Text>
      </View>
    </Page>
  );
}

function TransitionPage({
  section,
  profile,
  styles,
}: {
  section: DocumentSection;
  profile: PdfProfile;
  styles: Styles;
}) {
  const block = section.blocks.find(
    (candidate): candidate is Extract<DocumentBlock, { type: "transition" | "next-step" }> =>
      candidate.type === "transition" || candidate.type === "next-step",
  );
  return (
    <Page size={PROFILES[profile].pageSize} style={styles.transitionPage}>
      <Text style={styles.transitionMark}>VELOCENTUM / {section.eyebrow ?? "SIGUIENTE"}</Text>
      <Text style={styles.transitionTitle}>{block?.label ?? section.title ?? "Próximo paso"}</Text>
      <Footer dark styles={styles} />
    </Page>
  );
}

function ContentPage({
  section,
  profile,
  styles,
}: {
  section: DocumentSection;
  profile: PdfProfile;
  styles: Styles;
}) {
  const dark = section.tone === "dark";
  return (
    <Page
      size={PROFILES[profile].pageSize}
      style={[
        styles.page,
        dark ? styles.pageDark : {},
        section.tone === "soft" ? styles.pageSoft : {},
      ]}
      wrap
    >
      <View style={styles.header} fixed>
        {section.eyebrow ? (
          <Text style={[styles.eyebrow, dark ? styles.eyebrowDark : {}]}>{section.eyebrow}</Text>
        ) : null}
        {section.title ? <Text style={styles.title}>{section.title}</Text> : null}
      </View>
      <View style={styles.content}>
        {section.blocks.map((block) => renderBlock(block, dark, styles))}
      </View>
      <Footer dark={dark} styles={styles} />
    </Page>
  );
}

function VelocentumPdfDocument({ model, profile }: { model: DocumentModel; profile: PdfProfile }) {
  const styles = makeStyles(profile);
  return (
    <Document
      title={model.metadata.title}
      author="Velocentum"
      subject={`${model.metadata.title} - ${model.metadata.clientName}`}
      creator={`Velocentum · ${model.templateId}`}
      language="es-AR"
    >
      {model.sections.map((section) => {
        const cover = section.blocks.find(
          (block): block is Extract<DocumentBlock, { type: "cover" }> => block.type === "cover",
        );
        if (cover) return <CoverPage key={section.id} block={cover} profile={profile} styles={styles} />;
        if (
          section.blocks.some((block) => block.type === "transition" || block.type === "next-step")
        ) {
          return <TransitionPage key={section.id} section={section} profile={profile} styles={styles} />;
        }
        return <ContentPage key={section.id} section={section} profile={profile} styles={styles} />;
      })}
    </Document>
  );
}

export function createPdfDocumentElement(
  model: DocumentModel,
  profile: PdfProfile = "pantalla",
): React.ReactElement<DocumentProps> {
  return <VelocentumPdfDocument model={model} profile={profile} />;
}
