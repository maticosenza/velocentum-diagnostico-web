import type { ReactNode } from "react";
import type {
  DocumentBlock,
  DocumentModel,
  DocumentSection,
  PublishedNumber,
} from "../../templates/velocentum-v1";
import { formatDocumentDate, formatPublishedNumber } from "./format";
import "./document-renderer.css";

export type DocumentWebRendererProps = {
  model: DocumentModel;
  className?: string;
};

const LABELS_CONFIANZA = {
  alta: "Confianza alta",
  media: "Confianza media",
  baja: "Confianza baja",
  bloqueada: "Cifra bloqueada",
} as const;

const LABELS_CAPA = {
  servicio: "Servicio",
  recomendacion: "Recomendación",
  contexto: "Contexto",
} as const;

const LABELS_ESCENARIO = {
  conservador: "Conservador",
  base: "Base",
  potencial: "Potencial",
} as const;

/** Etiqueta de magnitud económica (corrección aprobada 2026-08-21, punto 3). */
const LABELS_MAGNITUD = {
  facturacion_incremental: "Facturación incremental",
  contribucion_incremental: "Contribución incremental",
  ahorro_publicitario: "Ahorro publicitario",
} as const;

const LABELS_ORIGEN = {
  observado: "Observado",
  declarado: "Declarado",
  configuracion: "Configuración",
  derivado: "Derivado",
} as const;

function classNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function ConfidenceBadge({ value }: { value: keyof typeof LABELS_CONFIANZA }) {
  return (
    <span className={`vdoc-badge vdoc-badge--${value}`} data-confidence={value}>
      {LABELS_CONFIANZA[value]}
    </span>
  );
}

/**
 * Toda cifra que dependa de una curva de adopción configurable (no de
 * evidencia del cliente) lleva una marca visible distinta de un dato
 * observado, con acceso al supuesto (corrección aprobada 2026-08-21, punto
 * 5). La lista completa de supuestos ya se renderiza debajo de cada tarjeta
 * de escenario; esta marca es la señal de que hay que mirarla.
 */
export function PublishedNumberView({ value }: { value: PublishedNumber }) {
  const esSupuesto = value.assumptions.length > 0;
  const titulo = esSupuesto
    ? `${LABELS_CONFIANZA[value.confidence]} · Depende de un supuesto de curva de adopción (política comercial, no evidencia del cliente). Ver "Supuestos" abajo.`
    : LABELS_CONFIANZA[value.confidence];
  return (
    <span
      className={classNames("vdoc-number", esSupuesto && "vdoc-number--supuesto")}
      data-value={String(value.value)}
      data-value-format={value.format}
      data-supuesto={esSupuesto}
      title={titulo}
    >
      {formatPublishedNumber(value)}
      {esSupuesto ? (
        <sup className="vdoc-number__mark" aria-hidden="true">
          †
        </sup>
      ) : null}
    </span>
  );
}

function List({ items, emptyLabel }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) return emptyLabel ? <p className="vdoc-muted">{emptyLabel}</p> : null;
  return (
    <ul className="vdoc-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function BlockFrame({ type, children }: { type: DocumentBlock["type"]; children: ReactNode }) {
  return (
    <div className={`vdoc-block vdoc-block--${type}`} data-block-type={type}>
      {children}
    </div>
  );
}

function CoverBlock({ block }: { block: Extract<DocumentBlock, { type: "cover" }> }) {
  return (
    <BlockFrame type="cover">
      <div className="vdoc-cover__brand">Velocentum</div>
      <div className="vdoc-cover__content">
        <p className="vdoc-cover__client">{block.clientName}</p>
        <h1>{block.title}</h1>
        <p className="vdoc-cover__subtitle">{block.subtitle}</p>
      </div>
      <time className="vdoc-cover__date" dateTime={block.diagnosticDate}>
        {formatDocumentDate(block.diagnosticDate)}
      </time>
    </BlockFrame>
  );
}

function CoverageBlock({ block }: { block: Extract<DocumentBlock, { type: "coverage" }> }) {
  return (
    <BlockFrame type="coverage">
      <div className="vdoc-block__header">
        <h3>Cobertura del diagnóstico</h3>
        <ConfidenceBadge value={block.confidence} />
      </div>
      <div className="vdoc-coverage-grid">
        {block.items.map((item) => (
          <div className="vdoc-coverage" key={item.id}>
            <div className="vdoc-coverage__label">
              <span>{item.label}</span>
              <strong>{item.value}%</strong>
            </div>
            <progress aria-label={item.label} max={100} value={item.value}>
              {item.value}%
            </progress>
          </div>
        ))}
      </div>
    </BlockFrame>
  );
}

function MetricGridBlock({ block }: { block: Extract<DocumentBlock, { type: "metric-grid" }> }) {
  return (
    <BlockFrame type="metric-grid">
      <dl className="vdoc-metric-grid">
        {block.items.map((item) => (
          <div className="vdoc-metric" key={item.id}>
            <dt>{item.label}</dt>
            <dd>
              <PublishedNumberView value={item.value} />
            </dd>
            <ConfidenceBadge value={item.value.confidence} />
          </div>
        ))}
      </dl>
    </BlockFrame>
  );
}

function ShippingBlock({ block }: { block: Extract<DocumentBlock, { type: "shipping" }> }) {
  return (
    <BlockFrame type="shipping">
      <p className="vdoc-kicker">Envío</p>
      <div className="vdoc-inline-value">
        <span>{block.label}</span>
        <strong>
          <PublishedNumberView value={block.cost} />
        </strong>
      </div>
    </BlockFrame>
  );
}

function FindingsBlock({ block }: { block: Extract<DocumentBlock, { type: "findings" }> }) {
  return (
    <BlockFrame type="findings">
      <ol className="vdoc-findings">
        {block.items.map((item, index) => (
          <li className="vdoc-finding" key={item.id}>
            <div className="vdoc-finding__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="vdoc-finding__body">
              <div className="vdoc-tags">
                <span className={`vdoc-tag vdoc-tag--${item.prioridad}`}>
                  Prioridad {item.prioridad}
                </span>
                <span className="vdoc-tag">{LABELS_CAPA[item.capa]}</span>
                {item.magnitud ? (
                  <span className="vdoc-tag">{LABELS_MAGNITUD[item.magnitud]}</span>
                ) : null}
              </div>
              <h3>{item.titulo}</h3>
              {item.amount ? (
                <p className="vdoc-finding__amount">
                  Impacto estimado: <PublishedNumberView value={item.amount} />
                </p>
              ) : null}
              <ConfidenceBadge value={item.confianza} />
            </div>
          </li>
        ))}
      </ol>
    </BlockFrame>
  );
}

/**
 * Encabezado comercial de 90 días (corrección aprobada 2026-08-21, puntos
 * 2, 4, 6 y 7): una sola cifra —contribución incremental del escenario
 * conservador— o, cuando la dispersión es alta, el rango sin cifra
 * principal. La redacción obligatoria (`statement`) siempre acompaña al
 * número: nunca se muestra un valor sin la salvedad de que depende de
 * supuestos.
 */
function CommercialSummaryBlock({
  block,
}: {
  block: Extract<DocumentBlock, { type: "commercial-summary" }>;
}) {
  return (
    <BlockFrame type="commercial-summary">
      <div className="vdoc-commercial-summary">
        {block.headline ? (
          <div className="vdoc-commercial-summary__headline">
            <p className="vdoc-kicker">Contribución incremental a 90 días · Escenario conservador</p>
            <p className="vdoc-commercial-summary__number">
              <PublishedNumberView value={block.headline} />
            </p>
          </div>
        ) : (
          <div className="vdoc-commercial-summary__headline">
            <p className="vdoc-kicker">Rango de contribución incremental a 90 días</p>
            <p className="vdoc-commercial-summary__range">
              {block.range.lower ? <PublishedNumberView value={block.range.lower} /> : (
                <span className="vdoc-retained">Retenido</span>
              )}
              {" – "}
              {block.range.upper ? <PublishedNumberView value={block.range.upper} /> : (
                <span className="vdoc-retained">Retenido</span>
              )}
            </p>
            {block.dispersion.dataToCloseIt.length > 0 ? (
              <List items={block.dispersion.dataToCloseIt} />
            ) : null}
          </div>
        )}
        {block.statement ? <p className="vdoc-commercial-summary__statement">{block.statement}</p> : null}
      </div>
    </BlockFrame>
  );
}

function ScenariosBlock({ block }: { block: Extract<DocumentBlock, { type: "scenarios" }> }) {
  return (
    <BlockFrame type="scenarios">
      <div className="vdoc-scenario-grid">
        {block.items.map((item) => (
          <article className={`vdoc-scenario vdoc-scenario--${item.id}`} key={item.id}>
            <div className="vdoc-block__header">
              <h3>{LABELS_ESCENARIO[item.id]}</h3>
              <ConfidenceBadge value={item.confidence} />
            </div>
            <dl className="vdoc-scenario__metrics">
              {/*
                Contribución incremental es la cifra dominante (corrección
                aprobada 2026-08-21, punto 2): un cliente puede facturar más
                y ganar menos. Facturación queda en bloque secundario, nunca
                primero.
              */}
              <div className="vdoc-scenario__metric--primary">
                <dt>Contribución incremental acumulada a 90 días</dt>
                <dd>
                  {item.contribution90d ? (
                    <PublishedNumberView value={item.contribution90d} />
                  ) : (
                    <span className="vdoc-retained">Retenido</span>
                  )}
                </dd>
              </div>
              <div className="vdoc-scenario__metric--secondary">
                <dt>Facturación incremental acumulada a 90 días</dt>
                <dd>
                  {item.revenue90d ? (
                    <PublishedNumberView value={item.revenue90d} />
                  ) : (
                    <span className="vdoc-retained">Retenido</span>
                  )}
                </dd>
              </div>
              <div className="vdoc-scenario__metric--secondary">
                <dt>Ahorro publicitario acumulado a 90 días</dt>
                <dd>
                  {item.adSavings90d ? (
                    <PublishedNumberView value={item.adSavings90d} />
                  ) : (
                    <span className="vdoc-retained">Retenido</span>
                  )}
                </dd>
              </div>
            </dl>
            <p className="vdoc-scenario__note">
              El presupuesto liberado por consolidación de pauta puede reinvertirse; si eso ocurre,
              el efecto sería mayor al proyectado. Esta versión trata el ahorro de forma
              conservadora y no asume esa reinversión.
            </p>
            {item.levers.length > 0 ? (
              <div className="vdoc-subsection">
                <h4>Palancas</h4>
                <ul className="vdoc-levers">
                  {item.levers.map((lever) => (
                    <li key={`${lever.type}:${lever.id}`}>
                      <span>{lever.name}</span>
                      <PublishedNumberView value={lever.amount} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.assumptions.length > 0 ? (
              <div className="vdoc-subsection">
                <h4>Supuestos</h4>
                <List items={item.assumptions.map((assumption) => assumption.valor)} />
              </div>
            ) : null}
            {item.restrictions.length > 0 ? (
              <div className="vdoc-subsection">
                <h4>Restricciones del escenario</h4>
                <List items={item.restrictions.map((restriction) => restriction.detalle)} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </BlockFrame>
  );
}

function RoadmapBlock({ block }: { block: Extract<DocumentBlock, { type: "roadmap" }> }) {
  return (
    <BlockFrame type="roadmap">
      <ol className="vdoc-roadmap">
        {block.items.map((item) => (
          <li key={item.id}>
            <div className="vdoc-roadmap__days">
              Días {item.desdeDia}–{item.hastaDia}
            </div>
            <div>
              <h3>{item.etiqueta}</h3>
              <List items={item.acciones} />
              <p className="vdoc-roadmap__result">Resultado: {item.resultadoEsperado}</p>
            </div>
          </li>
        ))}
      </ol>
    </BlockFrame>
  );
}

function ServicesBlock({ block }: { block: Extract<DocumentBlock, { type: "services" }> }) {
  return (
    <BlockFrame type="services">
      <div className="vdoc-card-grid">
        {block.items.map((item) => (
          <article className="vdoc-card" key={item.id}>
            <h3>{item.nombre}</h3>
            <List items={item.alcance} emptyLabel="Alcance a validar" />
          </article>
        ))}
      </div>
    </BlockFrame>
  );
}

function CommercialOfferBlock({
  block,
}: {
  block: Extract<DocumentBlock, { type: "commercial-offer" }>;
}) {
  return (
    <BlockFrame type="commercial-offer">
      <article className="vdoc-offer">
        <div className="vdoc-offer__headline">
          <div>
            <p className="vdoc-kicker">Paquete seleccionado</p>
            <h3>{block.name}</h3>
          </div>
          {block.price ? <PublishedNumberView value={block.price} /> : null}
        </div>
        <div className="vdoc-offer__grid">
          <div>
            <h4>Alcance</h4>
            <List items={block.scope} />
          </div>
          <div>
            <h4>Entregables</h4>
            <List items={block.deliverables} />
          </div>
          <div>
            <h4>Exclusiones</h4>
            <List items={block.exclusions} />
          </div>
        </div>
        <div className="vdoc-offer__meta">
          <span>{block.durationDays} días</span>
          <span>{block.paymentTerms}</span>
          {block.startDate ? <span>Inicio: {formatDocumentDate(block.startDate)}</span> : null}
        </div>
      </article>
    </BlockFrame>
  );
}

function RestrictionsBlock({ block }: { block: Extract<DocumentBlock, { type: "restrictions" }> }) {
  return (
    <BlockFrame type="restrictions">
      <ul className="vdoc-restrictions">
        {block.items.map((item) => (
          <li key={item.id}>
            <span className="vdoc-restrictions__icon" aria-hidden="true">
              i
            </span>
            <div>
              <h3>{item.etiqueta}</h3>
              <p>{item.detalle}</p>
              {item.bloquea.length > 0 ? (
                <p className="vdoc-restrictions__scope">Condiciona: {item.bloquea.join(", ")}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </BlockFrame>
  );
}

function MethodologyBlock({ block }: { block: Extract<DocumentBlock, { type: "methodology" }> }) {
  return (
    <BlockFrame type="methodology">
      <dl className="vdoc-methodology">
        {block.items.map((item) => (
          <div key={item.id}>
            <dt>
              {item.etiqueta} <span>{LABELS_ORIGEN[item.origen]}</span>
            </dt>
            <dd>{item.valor}</dd>
          </div>
        ))}
      </dl>
    </BlockFrame>
  );
}

export function DocumentBlockView({ block }: { block: DocumentBlock }) {
  switch (block.type) {
    case "cover":
      return <CoverBlock block={block} />;
    case "coverage":
      return <CoverageBlock block={block} />;
    case "metric-grid":
      return <MetricGridBlock block={block} />;
    case "shipping":
      return <ShippingBlock block={block} />;
    case "findings":
      return <FindingsBlock block={block} />;
    case "commercial-summary":
      return <CommercialSummaryBlock block={block} />;
    case "scenarios":
      return <ScenariosBlock block={block} />;
    case "roadmap":
      return <RoadmapBlock block={block} />;
    case "services":
      return <ServicesBlock block={block} />;
    case "commercial-offer":
      return <CommercialOfferBlock block={block} />;
    case "restrictions":
      return <RestrictionsBlock block={block} />;
    case "methodology":
      return <MethodologyBlock block={block} />;
    case "transition":
      return (
        <BlockFrame type="transition">
          <p>{block.label}</p>
        </BlockFrame>
      );
    case "next-step":
      return (
        <BlockFrame type="next-step">
          <p className="vdoc-kicker">Próximo paso</p>
          <p>{block.label}</p>
        </BlockFrame>
      );
  }
}

export function DocumentSectionView({ section }: { section: DocumentSection }) {
  const headingId = section.title ? `vdoc-section-${section.id}` : undefined;
  return (
    <section
      className={`vdoc-section vdoc-section--${section.tone}`}
      data-section-id={section.id}
      data-section-tone={section.tone}
      aria-labelledby={headingId}
    >
      <div className="vdoc-section__inner">
        {section.eyebrow ? <p className="vdoc-eyebrow">{section.eyebrow}</p> : null}
        {section.title ? <h2 id={headingId}>{section.title}</h2> : null}
        <div className="vdoc-section__blocks">
          {section.blocks.map((block, index) => (
            <DocumentBlockView block={block} key={`${section.id}-${block.type}-${index}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function DocumentWebRenderer({ model, className }: DocumentWebRendererProps) {
  return (
    <article
      className={classNames("vdoc", className)}
      data-document-kind={model.kind}
      data-template-id={model.templateId}
      lang="es"
      aria-label={`${model.metadata.title} para ${model.metadata.clientName}`}
    >
      {model.sections.map((section) => (
        <DocumentSectionView key={section.id} section={section} />
      ))}
      <footer className="vdoc-footer">
        <span>Velocentum</span>
        <span>
          Diagnóstico {model.source.diagnosticId} · v{model.source.diagnosticVersion}
        </span>
      </footer>
    </article>
  );
}
