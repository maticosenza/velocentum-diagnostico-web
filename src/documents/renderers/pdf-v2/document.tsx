/* eslint-disable react-refresh/only-export-components -- PDF primitives are not Fast Refresh UI components. */
import React from "react";
import {
  Defs,
  Document,
  Font,
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
import { SimboloVelocentum, WordmarkVelocentum } from "../pdf/marca";
import { filasBalanceadas } from "../../semantica-v2/balanceo";
import { textoEstadoV2 } from "../../semantica-v2/estado";
import {
  ICONOS_PRIORIDAD,
  LABELS_CAPA,
  LABELS_ESCENARIO,
  LABELS_MAGNITUD,
  LABELS_PERIODO,
  LABELS_PRIORIDAD,
  LABELS_UNIDAD_COMERCIAL,
} from "../../semantica-v2/etiquetas";
import type {
  DocumentBlockV2,
  DocumentModelV2,
  DocumentSectionV2,
  EscenarioV2,
  ValorV2,
} from "../../templates/velocentum-v2/types";

const theme = VELOCENTUM_LIGHT_V1;

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
  },
  impresion: {
    pageSize: "A4",
    pagePaddingH: 48,
    pagePaddingTop: 78,
    pagePaddingBottom: 46,
    escala: { titulo: 18, subtitulo: 9.5, label: 9.5, valor: 15, valorGrande: 24, badge: 8, nota: 9, pie: 8 },
    coverPadding: 48,
    coverTitleFontSize: 30,
    coverTitleWidth: 300,
    transitionTitleFontSize: 26,
    transitionTitleWidth: 420,
    colsMetricGrid: 2,
    colsFindings: 1,
    colsScenarios: 2,
    colsServices: 1,
    monthlyColMinWidth: 110,
  },
};

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
    cardGrid: { flexDirection: "column", gap: 10 },
    cardRow: { flexDirection: "row", gap: 10 },
    // `flex: 1` es correcto SOLO para tarjetas dentro de una fila de grilla
    // (`cardRow`, ver `CardGrid`): reparte el ancho de la fila entre las
    // tarjetas. Aplicarlo a una tarjeta de ancho completo, hija directa de
    // `cardGrid` (columna), hace que Yoga la trate con `flexBasis: 0%` y
    // colapse su contenido (bug encontrado en verificación del PASO 3 —
    // las tarjetas de escenario "largas" quedaban con el encabezado
    // visible y el resto del contenido invisible). Las tarjetas de ancho
    // completo usan `standaloneCard`, sin `flex`.
    card: {
      flex: 1,
      minHeight: 72,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    standaloneCard: {
      minHeight: 72,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
    estadoTexto: {
      fontFamily: BODY,
      fontWeight: W.semiBold,
      fontSize: e.nota,
      color: theme.colors.warning,
    },
    estadoDetalle: { fontSize: e.nota - 1, color: theme.colors.muted, marginTop: 2 },
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
    badgeAlta: { color: theme.colors.risk, backgroundColor: "#FBEAEA" },
    badgeMedia: { color: "#8A6417", backgroundColor: "#FEF3D6" },
    badgeBaja: { color: theme.colors.muted, backgroundColor: theme.colors.surfaceSoft },
    findingIndex: {
      fontFamily: HEADING,
      fontWeight: W.bold,
      fontSize: e.label,
      color: theme.colors.accent,
      marginBottom: 4,
    },
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
    commercialSummaryKicker: {
      fontSize: e.subtitulo,
      color: theme.colors.accent,
      fontFamily: HEADING,
      fontWeight: W.bold,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    commercialSummaryNumber: { fontSize: e.valorGrande, fontFamily: HEADING, fontWeight: W.black },
    commercialSummaryRange: { fontSize: e.valorGrande - 6, fontFamily: HEADING, fontWeight: W.black },
    commercialSummaryStatement: { maxWidth: 480, marginTop: 10, fontSize: e.nota, color: theme.colors.muted, lineHeight: 1.4 },
    bridgeNote: { fontSize: e.nota, color: "#DEDCEA", lineHeight: 1.4, marginTop: 10, maxWidth: 480 },
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
  });
}

type Styles = ReturnType<typeof makeStylesV2>;

function ValorTexto({ value, dark, styles }: { value: ValorV2; dark: boolean; styles: Styles }) {
  const resultado = textoEstadoV2(value);
  if (resultado.esNumero) {
    return <Text style={[styles.cardValue, dark ? styles.cardValueDark : {}]}>{resultado.texto}</Text>;
  }
  return (
    <View>
      <Text style={styles.estadoTexto}>{resultado.texto}</Text>
      {resultado.detalle ? <Text style={styles.estadoDetalle}>{resultado.detalle}</Text> : null}
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

function ScenarioCard({
  item,
  dark,
  cardStyle,
  bodyStyle,
  styles,
  full,
}: {
  item: EscenarioV2;
  dark: boolean;
  cardStyle: Style[];
  bodyStyle: Style[];
  styles: Styles;
  full: boolean;
}) {
  const grupos = ["facturacion_incremental", "contribucion_incremental", "ahorro_publicitario"] as const;
  return (
    <View style={[...cardStyle, full ? styles.cardFull : {}]} wrap={full}>
      <View style={styles.scenarioHeader}>
        <Text style={styles.itemTitle}>{LABELS_ESCENARIO[item.id].toUpperCase()}</Text>
        <Text style={styles.badge}>{item.confianza.toUpperCase()}</Text>
      </View>
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
      <Text style={styles.scenarioNote}>
        El presupuesto liberado por consolidación de pauta puede reinvertirse; si eso ocurre, el efecto
        sería mayor al proyectado. Esta versión trata el ahorro de forma conservadora y no asume esa
        reinversión.
      </Text>
      {item.mensual.length > 0 ? (
        <View style={styles.monthlyTable}>
          <MonthlyTableHeader styles={styles} />
          {item.mensual.map((mes) => (
            <View key={mes.mes} style={styles.monthlyTableRow} wrap={false}>
              <Text style={styles.monthlyTableMonthCell}>Mes {mes.mes}</Text>
              <Text style={styles.monthlyTableCell}>{textoEstadoV2(mes.contribucionIncrementalHabilitada).texto}</Text>
              <Text style={styles.monthlyTableCell}>{textoEstadoV2(mes.facturacionProyectada).texto}</Text>
              <Text style={styles.monthlyTableCell}>{textoEstadoV2(mes.facturacionIncrementalHabilitada).texto}</Text>
              <Text style={styles.monthlyTableCell}>{textoEstadoV2(mes.ahorroPublicitarioHabilitado).texto}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {grupos.map((tipo) => {
        const palancasDelGrupo = item.palancas.filter((p) => p.tipo === tipo);
        if (palancasDelGrupo.length === 0) return null;
        return (
          <View key={tipo} style={styles.palancaGroup} wrap={false}>
            <Text style={styles.palancaGroupTitle}>{LABELS_MAGNITUD[tipo]}</Text>
            {palancasDelGrupo.map((palanca) => (
              <Text key={palanca.id} style={bodyStyle}>
                {palanca.nombre}: {textoEstadoV2(palanca.monto).texto} ({LABELS_PERIODO[palanca.periodo]})
              </Text>
            ))}
          </View>
        );
      })}
      {item.supuestos.length > 0 ? (
        <View style={styles.palancaGroup} wrap={false}>
          <Text style={styles.palancaGroupTitle}>Supuestos</Text>
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
          <Text style={[styles.cardLabel, dark ? styles.cardLabelDark : {}]}>{block.tienda.label}</Text>
          <Text style={[styles.cardValue, dark ? styles.cardValueDark : {}]}>{t.texto}</Text>
          <View style={styles.channelBar}>
            <View style={[styles.channelBarFill, { width: `${Math.max(4, (tVal / max) * 100)}%` }]} />
          </View>
          <Text style={[styles.cardLabel, dark ? styles.cardLabelDark : {}, { marginTop: 10 }]}>
            {block.marketplace.label}
          </Text>
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
                <Text style={styles.findingIndex}>{String(index + 1).padStart(2, "0")}</Text>
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
      if (block.headline) {
        const t = textoEstadoV2(block.headline);
        return (
          <View key="commercial-summary" style={standaloneCardStyle} wrap={false}>
            <Text style={styles.commercialSummaryKicker}>
              Contribución incremental a 90 días · Escenario conservador
            </Text>
            <Text style={styles.commercialSummaryNumber}>{t.texto}</Text>
            {block.statement ? <Text style={styles.commercialSummaryStatement}>{block.statement}</Text> : null}
            {block.assumptionsDetail.length > 0 ? (
              <View style={styles.palancaGroup} wrap={false}>
                <Text style={[styles.palancaGroupTitle, { color: theme.colors.surface }]}>Supuestos</Text>
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
          <Text style={styles.commercialSummaryKicker}>Rango de contribución incremental a 90 días</Text>
          <Text style={styles.commercialSummaryRange}>
            {lower} – {upper}
          </Text>
          {block.dispersion.dataToCloseIt.length > 0 ? (
            <BulletList items={block.dispersion.dataToCloseIt} styles={styles} />
          ) : null}
          {block.statement ? <Text style={styles.commercialSummaryStatement}>{block.statement}</Text> : null}
        </View>
      );
    }
    case "bridge-note":
      return (
        <Text key="bridge-note" style={styles.bridgeNote}>
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
                <Text style={styles.findingIndex}>{String(index + 1).padStart(2, "0")}</Text>
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

function CoverPage({
  block,
  profile,
  styles,
}: {
  block: Extract<DocumentBlockV2, { type: "cover" }>;
  profile: PdfProfileV2;
  styles: Styles;
}) {
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
  section: DocumentSectionV2;
  profile: PdfProfileV2;
  styles: Styles;
}) {
  const block = section.blocks.find(
    (candidate): candidate is Extract<DocumentBlockV2, { type: "transition" | "next-step" }> =>
      candidate.type === "transition" || candidate.type === "next-step",
  );
  return (
    <Page size={PROFILES_V2[profile].pageSize} style={styles.transitionPage}>
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
  section: DocumentSectionV2;
  profile: PdfProfileV2;
  styles: Styles;
}) {
  const dark = section.tone === "dark";
  return (
    <Page
      size={PROFILES_V2[profile].pageSize}
      style={[styles.page, dark ? styles.pageDark : {}, section.tone === "soft" ? styles.pageSoft : {}]}
      wrap
    >
      <View style={styles.header} fixed>
        {section.eyebrow ? <Text style={[styles.eyebrow, dark ? styles.eyebrowDark : {}]}>{section.eyebrow}</Text> : null}
        {section.title ? <Text style={styles.title}>{section.title}</Text> : null}
      </View>
      <View style={styles.content}>{section.blocks.map((block) => renderBlock(block, dark, styles, profile))}</View>
      <Footer dark={dark} styles={styles} />
    </Page>
  );
}

function VelocentumPdfDocumentV2({ model, profile }: { model: DocumentModelV2; profile: PdfProfileV2 }) {
  const styles = makeStylesV2(profile);
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
          (block): block is Extract<DocumentBlockV2, { type: "cover" }> => block.type === "cover",
        );
        if (cover) return <CoverPage key={section.id} block={cover} profile={profile} styles={styles} />;
        if (section.blocks.some((block) => block.type === "transition" || block.type === "next-step")) {
          return <TransitionPage key={section.id} section={section} profile={profile} styles={styles} />;
        }
        return <ContentPage key={section.id} section={section} profile={profile} styles={styles} />;
      })}
    </Document>
  );
}

export function createPdfDocumentElementV2(
  model: DocumentModelV2,
  profile: PdfProfileV2 = "pantalla",
): React.ReactElement<DocumentProps> {
  return <VelocentumPdfDocumentV2 model={model} profile={profile} />;
}
