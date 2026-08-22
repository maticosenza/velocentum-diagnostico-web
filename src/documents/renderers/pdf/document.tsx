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
import type {
  DocumentBlock,
  DocumentModel,
  DocumentSection,
  PublishedNumber,
} from "../../templates/velocentum-v1";
import { formatPublishedNumber, labelConfidence } from "./format";

const theme = VELOCENTUM_LIGHT_V1;
const PAGE_SIZE: [number, number] = [960, 540];

/** Etiqueta de magnitud económica (corrección aprobada 2026-08-21, punto 3). */
const LABELS_MAGNITUD = {
  facturacion_incremental: "Facturación incremental",
  contribucion_incremental: "Contribución incremental",
  ahorro_publicitario: "Ahorro publicitario",
} as const;

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 84,
    paddingRight: 54,
    paddingBottom: 48,
    paddingLeft: 54,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: theme.colors.ink,
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
    left: 54,
    right: 54,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.1,
    color: theme.colors.primary,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  eyebrowDark: { color: "#C8C2FF" },
  title: {
    fontSize: 25,
    lineHeight: 1.08,
    fontFamily: "Helvetica-Bold",
    maxWidth: 720,
  },
  footer: {
    position: "absolute",
    left: 54,
    right: 54,
    bottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: theme.colors.muted,
    fontSize: 8,
  },
  footerDark: { color: "#B8B4C8" },
  wordmark: { fontFamily: "Helvetica-Bold", letterSpacing: 0.8 },
  pageNumber: { fontFamily: "Helvetica" },
  content: { flexDirection: "column", gap: 12 },
  coverPage: {
    padding: 64,
    fontFamily: "Helvetica",
    color: theme.colors.surface,
    backgroundColor: theme.colors.ink,
  },
  coverAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 300,
    backgroundColor: theme.colors.primary,
  },
  coverAccentSoft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 210,
    width: 170,
    backgroundColor: theme.colors.accent,
    opacity: 0.34,
  },
  coverMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    textAlign: "center",
    paddingTop: 9,
    marginBottom: 78,
  },
  coverTitle: {
    width: 500,
    fontFamily: "Helvetica-Bold",
    fontSize: 46,
    lineHeight: 1.02,
    marginBottom: 18,
  },
  coverSubtitle: { width: 490, fontSize: 15, lineHeight: 1.45, color: "#DEDCEA" },
  coverMeta: {
    position: "absolute",
    left: 64,
    right: 64,
    bottom: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#CBC7D8",
  },
  transitionPage: {
    padding: 64,
    justifyContent: "center",
    fontFamily: "Helvetica",
    color: theme.colors.surface,
    backgroundColor: theme.colors.primary,
  },
  transitionMark: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 18,
    color: "#D8D4FF",
  },
  transitionTitle: {
    width: 790,
    fontFamily: "Helvetica-Bold",
    fontSize: 38,
    lineHeight: 1.08,
  },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "31.8%",
    minHeight: 72,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cardWide: { width: "48.8%" },
  cardFull: { width: "100%" },
  cardDark: {
    color: theme.colors.surface,
    borderColor: "#39345A",
    backgroundColor: "#1C173E",
  },
  cardLabel: { fontSize: 8.5, color: theme.colors.muted, marginBottom: 7 },
  cardLabelDark: { color: "#C8C4D5" },
  cardValue: { fontFamily: "Helvetica-Bold", fontSize: 19, color: theme.colors.ink },
  cardValueDark: { color: theme.colors.surface },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 7,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: theme.colors.primary,
    backgroundColor: theme.colors.surfaceSoft,
    marginBottom: 7,
  },
  badgeDark: { color: theme.colors.surface, backgroundColor: theme.colors.accent },
  itemTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, lineHeight: 1.25, marginBottom: 5 },
  itemBody: { fontSize: 9, lineHeight: 1.35, color: theme.colors.muted },
  itemBodyDark: { color: "#D5D1E0" },
  amount: { fontFamily: "Helvetica-Bold", fontSize: 13, color: theme.colors.primary, marginTop: 7 },
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
  listDash: { width: 12, color: theme.colors.primary, fontFamily: "Helvetica-Bold" },
  listText: { flex: 1, fontSize: 9, lineHeight: 1.35 },
  blockTitle: { fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 9 },
  scenarioHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 9 },
  scenarioMetrics: { flexDirection: "row", gap: 8, marginBottom: 9 },
  scenarioMetric: { flex: 1 },
  scenarioMetricLabel: { fontSize: 7.5, color: theme.colors.muted, marginBottom: 3 },
  scenarioMetricValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  // Contribución incremental es la cifra dominante (corrección aprobada
  // 2026-08-21, punto 2): más grande y con el color de acento.
  scenarioMetricValuePrimary: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: theme.colors.primary,
  },
  scenarioNote: { fontSize: 8, color: theme.colors.muted, marginTop: 4, lineHeight: 1.3 },
  commercialSummaryKicker: {
    fontSize: 9,
    color: theme.colors.accent,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  commercialSummaryNumber: { fontSize: 34, fontFamily: "Helvetica-Bold" },
  commercialSummaryRange: { fontSize: 24, fontFamily: "Helvetica-Bold" },
  commercialSummaryStatement: {
    maxWidth: 480,
    marginTop: 10,
    fontSize: 9.5,
    color: theme.colors.muted,
    lineHeight: 1.4,
  },
  roadmapCard: { flexDirection: "row", gap: 13, paddingVertical: 10 },
  roadmapDays: {
    width: 84,
    fontFamily: "Helvetica-Bold",
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
  commercialName: { fontFamily: "Helvetica-Bold", fontSize: 20, marginBottom: 5 },
  commercialPrice: { fontFamily: "Helvetica-Bold", fontSize: 25, marginTop: 10 },
  columns: { flexDirection: "row", gap: 16 },
  column: { flex: 1 },
});

function ValueText({ value, dark = false }: { value: PublishedNumber; dark?: boolean }) {
  return (
    <Text style={[styles.cardValue, dark ? styles.cardValueDark : {}]}>
      {formatPublishedNumber(value)}
    </Text>
  );
}

function BulletList({ items }: { items: string[] }) {
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

function renderBlock(block: DocumentBlock, dark: boolean): React.ReactNode {
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
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{item.value}%</Text>
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
              <ValueText value={item.value} dark={dark} />
              <Text style={bodyStyle}>Confianza {item.value.confidence}</Text>
            </View>
          ))}
        </View>
      );
    case "shipping":
      return (
        <View key="shipping" style={[...cardStyle, styles.cardWide]} wrap={false}>
          <Text style={[styles.cardLabel, dark ? styles.cardLabelDark : {}]}>{block.label}</Text>
          <ValueText value={block.cost} dark={dark} />
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
                {block.range.lower ? formatPublishedNumber(block.range.lower) : "Retenido"}
                {" – "}
                {block.range.upper ? formatPublishedNumber(block.range.upper) : "Retenido"}
              </Text>
              {block.dispersion.dataToCloseIt.length > 0 ? (
                <BulletList items={block.dispersion.dataToCloseIt} />
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
                <BulletList items={item.acciones} />
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
              <BulletList items={item.alcance} />
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
              <BulletList items={[...block.scope, ...block.deliverables]} />
            </View>
            <View style={styles.column}>
              <Text style={styles.blockTitle}>No incluye</Text>
              <BulletList items={block.exclusions} />
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

function Footer({ dark }: { dark: boolean }) {
  return (
    <View style={[styles.footer, dark ? styles.footerDark : {}]} fixed>
      <Text style={styles.wordmark}>VELOCENTUM</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function CoverPage({ block }: { block: Extract<DocumentBlock, { type: "cover" }> }) {
  return (
    <Page size={PAGE_SIZE} style={styles.coverPage}>
      <View style={styles.coverAccent} />
      <View style={styles.coverAccentSoft} />
      <Text style={styles.coverMark}>V</Text>
      <Text style={styles.coverTitle}>{block.title}</Text>
      <Text style={styles.coverSubtitle}>{block.subtitle}</Text>
      <View style={styles.coverMeta}>
        <Text>{block.clientName}</Text>
        <Text>{block.diagnosticDate} - velocentum</Text>
      </View>
    </Page>
  );
}

function TransitionPage({ section }: { section: DocumentSection }) {
  const block = section.blocks.find(
    (candidate): candidate is Extract<DocumentBlock, { type: "transition" | "next-step" }> =>
      candidate.type === "transition" || candidate.type === "next-step",
  );
  return (
    <Page size={PAGE_SIZE} style={styles.transitionPage}>
      <Text style={styles.transitionMark}>VELOCENTUM / {section.eyebrow ?? "SIGUIENTE"}</Text>
      <Text style={styles.transitionTitle}>{block?.label ?? section.title ?? "Próximo paso"}</Text>
      <Footer dark />
    </Page>
  );
}

function ContentPage({ section }: { section: DocumentSection }) {
  const dark = section.tone === "dark";
  return (
    <Page
      size={PAGE_SIZE}
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
      <View style={styles.content}>{section.blocks.map((block) => renderBlock(block, dark))}</View>
      <Footer dark={dark} />
    </Page>
  );
}

function VelocentumPdfDocument({ model }: { model: DocumentModel }) {
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
        if (cover) return <CoverPage key={section.id} block={cover} />;
        if (
          section.blocks.some((block) => block.type === "transition" || block.type === "next-step")
        ) {
          return <TransitionPage key={section.id} section={section} />;
        }
        return <ContentPage key={section.id} section={section} />;
      })}
    </Document>
  );
}

export function createPdfDocumentElement(model: DocumentModel): React.ReactElement<DocumentProps> {
  return <VelocentumPdfDocument model={model} />;
}
