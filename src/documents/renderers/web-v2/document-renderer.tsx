import type { ReactNode } from "react";
import { formatDocumentDate } from "../web/format";
import { textoEstadoV2, esSupuesto } from "../../semantica-v2/estado";
import {
  ICONOS_PRIORIDAD,
  LABELS_CAPA,
  LABELS_ESCENARIO,
  LABELS_MAGNITUD,
  LABELS_ORIGEN_SUPUESTO,
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
import "./document-renderer.css";

export type DocumentWebRendererV2Props = {
  model: DocumentModelV2;
  className?: string;
};

function classNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

/** Toda cifra pasa por la capa semántica compartida — regla dura del contrato v2 sección 1. */
function ValorV2View({ value }: { value: ValorV2 }) {
  const resultado = textoEstadoV2(value);
  const supuesto = esSupuesto(value);
  if (!resultado.esNumero) {
    return (
      <span className="vdoc2-estado" title={resultado.detalle ?? undefined}>
        {resultado.texto}
      </span>
    );
  }
  return (
    <span
      className={classNames("vdoc2-number", supuesto && "vdoc2-number--supuesto")}
      title={resultado.detalle ?? undefined}
    >
      {resultado.texto}
      {supuesto ? (
        <sup className="vdoc2-number__mark" aria-hidden="true">
          †
        </sup>
      ) : null}
    </span>
  );
}

function List({ items, emptyLabel }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) return emptyLabel ? <p className="vdoc2-muted">{emptyLabel}</p> : null;
  return (
    <ul className="vdoc2-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function BlockFrame({ type, children }: { type: DocumentBlockV2["type"]; children: ReactNode }) {
  return (
    <div className={`vdoc2-block vdoc2-block--${type}`} data-block-type={type}>
      {children}
    </div>
  );
}

function CoverBlock({ block }: { block: Extract<DocumentBlockV2, { type: "cover" }> }) {
  return (
    <BlockFrame type="cover">
      <div className="vdoc2-cover__gradient" aria-hidden="true" />
      <div className="vdoc2-cover__brand">Velocentum</div>
      <div className="vdoc2-cover__content">
        <p className="vdoc2-cover__client">{block.clientName}</p>
        <h1>{block.title}</h1>
        <p className="vdoc2-cover__subtitle">{block.subtitle}</p>
      </div>
      <time className="vdoc2-cover__date" dateTime={block.diagnosticDate}>
        {formatDocumentDate(block.diagnosticDate)}
      </time>
    </BlockFrame>
  );
}

function CoverageBlock({ block }: { block: Extract<DocumentBlockV2, { type: "coverage" }> }) {
  return (
    <BlockFrame type="coverage">
      <div className="vdoc2-block__header">
        <h3>Cobertura del diagnóstico</h3>
        <span className="vdoc2-badge">Confianza {block.confidence}</span>
      </div>
      <div className="vdoc2-coverage-grid">
        {block.items.map((item) => (
          <div className="vdoc2-coverage" key={item.id}>
            <div className="vdoc2-coverage__label">
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

function MetricGridBlock({ block }: { block: Extract<DocumentBlockV2, { type: "metric-grid" }> }) {
  return (
    <BlockFrame type="metric-grid">
      <dl className="vdoc2-metric-grid">
        {block.items.map((item) => (
          <div className="vdoc2-metric" key={item.id}>
            <dt>{item.label}</dt>
            <dd>
              <ValorV2View value={item.value} />
            </dd>
          </div>
        ))}
      </dl>
    </BlockFrame>
  );
}

function ChannelComparisonBlock({
  block,
}: {
  block: Extract<DocumentBlockV2, { type: "channel-comparison" }>;
}) {
  const tVal = block.tienda.value.estado === "calculado" ? block.tienda.value.valor : 0;
  const mVal = block.marketplace.value.estado === "calculado" ? block.marketplace.value.valor : 0;
  const max = Math.max(tVal, mVal, 0.001);
  return (
    <BlockFrame type="channel-comparison">
      <h3>Comparación entre canales</h3>
      <div className="vdoc2-channel">
        <div className="vdoc2-channel__row">
          <span>{block.tienda.label}</span>
          <ValorV2View value={block.tienda.value} />
        </div>
        <div className="vdoc2-channel__bar">
          <div className="vdoc2-channel__fill" style={{ width: `${Math.max(4, (tVal / max) * 100)}%` }} />
        </div>
        <div className="vdoc2-channel__row">
          <span>{block.marketplace.label}</span>
          <ValorV2View value={block.marketplace.value} />
        </div>
        <div className="vdoc2-channel__bar">
          <div className="vdoc2-channel__fill" style={{ width: `${Math.max(4, (mVal / max) * 100)}%` }} />
        </div>
      </div>
    </BlockFrame>
  );
}

function ShippingBlock({ block }: { block: Extract<DocumentBlockV2, { type: "shipping" }> }) {
  return (
    <BlockFrame type="shipping">
      <p className="vdoc2-kicker">Envío</p>
      <div className="vdoc2-inline-value">
        <span>{block.label}</span>
        <strong>
          <ValorV2View value={block.cost} />
        </strong>
      </div>
    </BlockFrame>
  );
}

function FindingsBlock({ block }: { block: Extract<DocumentBlockV2, { type: "findings" }> }) {
  return (
    <BlockFrame type="findings">
      <ol className="vdoc2-findings">
        {block.items.map((item, index) => (
          <li
            className={classNames("vdoc2-finding", item.esMargenNegativo && "vdoc2-finding--alerta")}
            key={item.id}
          >
            <div className="vdoc2-finding__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="vdoc2-finding__body">
              <div className="vdoc2-tags">
                {item.esMargenNegativo ? (
                  <span className="vdoc2-tag vdoc2-tag--alta">▲ ALERTA CRÍTICA · MARGEN NEGATIVO</span>
                ) : (
                  <span className={`vdoc2-tag vdoc2-tag--${item.prioridad}`}>
                    {ICONOS_PRIORIDAD[item.prioridad]} {LABELS_PRIORIDAD[item.prioridad]}
                  </span>
                )}
                <span className="vdoc2-tag">{LABELS_CAPA[item.capa]}</span>
                {item.magnitud ? <span className="vdoc2-tag">{LABELS_MAGNITUD[item.magnitud]}</span> : null}
              </div>
              <h3>{item.titulo}</h3>
              {item.monto ? (
                <p className="vdoc2-finding__amount">
                  Impacto estimado: <ValorV2View value={item.monto} />
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </BlockFrame>
  );
}

function CommercialSummaryBlock({
  block,
}: {
  block: Extract<DocumentBlockV2, { type: "commercial-summary" }>;
}) {
  return (
    <BlockFrame type="commercial-summary">
      <div className="vdoc2-commercial-summary">
        {block.headline ? (
          <div className="vdoc2-commercial-summary__headline">
            <p className="vdoc2-kicker">Contribución incremental a 90 días · Escenario conservador</p>
            <p className="vdoc2-commercial-summary__number">
              <ValorV2View value={block.headline} />
            </p>
          </div>
        ) : (
          <div className="vdoc2-commercial-summary__headline">
            <p className="vdoc2-kicker">Rango de contribución incremental a 90 días</p>
            <p className="vdoc2-commercial-summary__range">
              {block.range.lower ? <ValorV2View value={block.range.lower} /> : null}
              {" – "}
              {block.range.upper ? <ValorV2View value={block.range.upper} /> : null}
            </p>
            {block.dispersion.dataToCloseIt.length > 0 ? <List items={block.dispersion.dataToCloseIt} /> : null}
          </div>
        )}
        {block.statement ? <p className="vdoc2-commercial-summary__statement">{block.statement}</p> : null}
        {block.assumptionsDetail.length > 0 ? (
          <div className="vdoc2-subsection">
            <h4>Supuestos</h4>
            <List items={block.assumptionsDetail.map((s) => s.valor)} />
          </div>
        ) : null}
      </div>
    </BlockFrame>
  );
}

function BridgeNoteBlock({ block }: { block: Extract<DocumentBlockV2, { type: "bridge-note" }> }) {
  return (
    <BlockFrame type="bridge-note">
      <p className="vdoc2-bridge-note">{block.text}</p>
    </BlockFrame>
  );
}

function ScenarioCard({ item }: { item: EscenarioV2 }) {
  const grupos = ["facturacion_incremental", "contribucion_incremental", "ahorro_publicitario"] as const;
  return (
    <article className={classNames("vdoc2-scenario", `vdoc2-scenario--${item.id}`, !item.esCorta && "vdoc2-scenario--larga")}>
      <div className="vdoc2-block__header">
        <h3>{LABELS_ESCENARIO[item.id]}</h3>
        <span className="vdoc2-badge">{item.confianza}</span>
      </div>
      <dl className="vdoc2-scenario__metrics">
        <div className="vdoc2-scenario__metric--primary">
          <dt>Contribución incremental acumulada a 90 días</dt>
          <dd>
            <ValorV2View value={item.contribucion90d} />
          </dd>
        </div>
        <div className="vdoc2-scenario__metric--secondary">
          <dt>Facturación incremental acumulada a 90 días</dt>
          <dd>
            <ValorV2View value={item.facturacion90d} />
          </dd>
        </div>
        <div className="vdoc2-scenario__metric--secondary">
          <dt>Ahorro publicitario acumulado a 90 días</dt>
          <dd>
            <ValorV2View value={item.ahorroPublicitario90d} />
          </dd>
        </div>
      </dl>
      <p className="vdoc2-scenario__note">
        El presupuesto liberado por consolidación de pauta puede reinvertirse; si eso ocurre, el efecto sería
        mayor al proyectado. Esta versión trata el ahorro de forma conservadora y no asume esa reinversión.
      </p>
      {item.mensual.length > 0 ? (
        <div className="vdoc2-subsection">
          <h4>Detalle mensual</h4>
          <div className="vdoc2-table-wrap">
            <table className="vdoc2-monthly-table">
              <thead>
                <tr>
                  <th scope="col">Mes</th>
                  <th scope="col">Contribución incremental</th>
                  <th scope="col">Facturación proyectada</th>
                  <th scope="col">Facturación incremental</th>
                  <th scope="col">Ahorro publicitario</th>
                </tr>
              </thead>
              <tbody>
                {item.mensual.map((mes) => (
                  <tr key={mes.mes}>
                    <th scope="row">Mes {mes.mes}</th>
                    <td>
                      <ValorV2View value={mes.contribucionIncrementalHabilitada} />
                    </td>
                    <td>
                      <ValorV2View value={mes.facturacionProyectada} />
                    </td>
                    <td>
                      <ValorV2View value={mes.facturacionIncrementalHabilitada} />
                    </td>
                    <td>
                      <ValorV2View value={mes.ahorroPublicitarioHabilitado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {item.palancas.length > 0
        ? grupos.map((tipo) => {
            const palancasDelGrupo = item.palancas.filter((p) => p.tipo === tipo);
            if (palancasDelGrupo.length === 0) return null;
            return (
              <div className="vdoc2-subsection" key={tipo}>
                <h4>{LABELS_MAGNITUD[tipo]}</h4>
                <ul className="vdoc2-levers">
                  {palancasDelGrupo.map((palanca) => (
                    <li key={palanca.id}>
                      <span>{palanca.nombre}</span>
                      <span>
                        <ValorV2View value={palanca.monto} /> ({LABELS_PERIODO[palanca.periodo]})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        : null}
      {item.supuestos.length > 0 ? (
        <div className="vdoc2-subsection">
          <h4>Supuestos</h4>
          <ul className="vdoc2-list">
            {item.supuestos.map((s) => (
              <li key={s.id}>
                {s.valor} <span className="vdoc2-muted">({LABELS_ORIGEN_SUPUESTO[s.origen]})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {item.restricciones.length > 0 ? (
        <div className="vdoc2-subsection">
          <h4>Restricciones del escenario</h4>
          <List items={item.restricciones.map((r) => r.detalle)} />
        </div>
      ) : null}
    </article>
  );
}

function ScenariosBlock({ block }: { block: Extract<DocumentBlockV2, { type: "scenarios" }> }) {
  return (
    <BlockFrame type="scenarios">
      <div className="vdoc2-scenario-grid">
        {block.items.map((item) => (
          <ScenarioCard item={item} key={item.id} />
        ))}
      </div>
    </BlockFrame>
  );
}

function RoadmapBlock({ block }: { block: Extract<DocumentBlockV2, { type: "roadmap" }> }) {
  return (
    <BlockFrame type="roadmap">
      <ol className="vdoc2-roadmap">
        {block.items.map((item) => (
          <li key={item.id}>
            <div className="vdoc2-roadmap__days">
              Días {item.desdeDia}–{item.hastaDia}
            </div>
            <div>
              <h3>{item.etiqueta}</h3>
              <List items={item.acciones} />
              <p className="vdoc2-roadmap__result">Resultado: {item.resultadoEsperado}</p>
            </div>
          </li>
        ))}
      </ol>
    </BlockFrame>
  );
}

function ServicesBlock({ block }: { block: Extract<DocumentBlockV2, { type: "services" }> }) {
  return (
    <BlockFrame type="services">
      <div className="vdoc2-card-grid">
        {block.items.map((item, index) => (
          <article className="vdoc2-card" key={item.id}>
            <div className="vdoc2-finding__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </div>
            <h3>{item.nombre}</h3>
            <List items={item.alcance} emptyLabel="Alcance a validar" />
          </article>
        ))}
      </div>
    </BlockFrame>
  );
}

function ServicioNivelList({
  services,
}: {
  services: Extract<DocumentBlockV2, { type: "commercial-offer" }>["niveles"][number]["servicios"];
}) {
  if (services.length === 0) return <p className="vdoc2-muted">Sin servicios en este nivel.</p>;
  return (
    <ul className="vdoc2-list">
      {services.map((servicio, index) => (
        <li key={`${servicio.servicio}-${index}`}>
          <strong>{servicio.servicio}</strong>
          {servicio.unidad === "alcance_descrito"
            ? servicio.descripcion
              ? ` — ${servicio.descripcion}`
              : null
            : ` — ${servicio.cantidad ?? 0} ${LABELS_UNIDAD_COMERCIAL[servicio.unidad]}`}
        </li>
      ))}
    </ul>
  );
}

function CommercialOfferBlock({
  block,
}: {
  block: Extract<DocumentBlockV2, { type: "commercial-offer" }>;
}) {
  if (block.pendiente) {
    return (
      <BlockFrame type="commercial-offer">
        <div className="vdoc2-finding--alerta vdoc2-card">
          <h3>Selección comercial pendiente</h3>
          <p className="vdoc2-muted">
            No hay una escalera de paquetes confirmada para este cliente todavía.
          </p>
        </div>
      </BlockFrame>
    );
  }
  return (
    <BlockFrame type="commercial-offer">
      <div className="vdoc2-scenario-grid">
        {block.niveles.map((nivel) => (
          <article className="vdoc2-scenario" key={nivel.id}>
            <div className="vdoc2-block__header">
              <h3>{nivel.nombre}</h3>
              {nivel.precio ? (
                <ValorV2View value={nivel.precio} />
              ) : (
                <span className="vdoc2-muted">Precio a definir</span>
              )}
            </div>
            <ServicioNivelList services={nivel.servicios} />
          </article>
        ))}
      </div>
    </BlockFrame>
  );
}

function RestrictionsGroupedBlock({
  block,
}: {
  block: Extract<DocumentBlockV2, { type: "restrictions-grouped" }>;
}) {
  return (
    <BlockFrame type="restrictions-grouped">
      <ul className="vdoc2-restrictions">
        {block.items.map((grupo) => (
          <li key={grupo.motivo}>
            <span className="vdoc2-restrictions__icon" aria-hidden="true">
              i
            </span>
            <div>
              <h3>{grupo.motivo}</h3>
              <List items={grupo.etiquetas} />
            </div>
          </li>
        ))}
      </ul>
    </BlockFrame>
  );
}

function MethodologyBlock({ block }: { block: Extract<DocumentBlockV2, { type: "methodology" }> }) {
  return (
    <BlockFrame type="methodology">
      <dl className="vdoc2-methodology">
        {block.items.map((item) => (
          <div key={item.id}>
            <dt>
              {item.etiqueta} <span>{LABELS_ORIGEN_SUPUESTO[item.origen]}</span>
            </dt>
            <dd>{item.valor}</dd>
          </div>
        ))}
      </dl>
    </BlockFrame>
  );
}

export function DocumentBlockViewV2({ block }: { block: DocumentBlockV2 }) {
  switch (block.type) {
    case "cover":
      return <CoverBlock block={block} />;
    case "coverage":
      return <CoverageBlock block={block} />;
    case "metric-grid":
      return <MetricGridBlock block={block} />;
    case "channel-comparison":
      return <ChannelComparisonBlock block={block} />;
    case "shipping":
      return <ShippingBlock block={block} />;
    case "findings":
      return <FindingsBlock block={block} />;
    case "commercial-summary":
      return <CommercialSummaryBlock block={block} />;
    case "bridge-note":
      return <BridgeNoteBlock block={block} />;
    case "scenarios":
      return <ScenariosBlock block={block} />;
    case "roadmap":
      return <RoadmapBlock block={block} />;
    case "services":
      return <ServicesBlock block={block} />;
    case "commercial-offer":
      return <CommercialOfferBlock block={block} />;
    case "restrictions":
      return (
        <BlockFrame type="restrictions">
          <ul className="vdoc2-restrictions">
            {block.items.map((item) => (
              <li key={item.id}>
                <div>
                  <h3>{item.etiqueta}</h3>
                  <p>{item.detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        </BlockFrame>
      );
    case "restrictions-grouped":
      return <RestrictionsGroupedBlock block={block} />;
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
          <p className="vdoc2-kicker">Próximo paso</p>
          <p>{block.label}</p>
        </BlockFrame>
      );
  }
}

export function DocumentSectionViewV2({ section }: { section: DocumentSectionV2 }) {
  const headingId = section.title ? `vdoc2-section-${section.id}` : undefined;
  return (
    <section
      className={`vdoc2-section vdoc2-section--${section.tone}`}
      data-section-id={section.id}
      aria-labelledby={headingId}
    >
      <div className="vdoc2-section__inner">
        {section.eyebrow ? <p className="vdoc2-eyebrow">{section.eyebrow}</p> : null}
        {section.title ? <h2 id={headingId}>{section.title}</h2> : null}
        <div className="vdoc2-section__blocks">
          {section.blocks.map((block, index) => (
            <DocumentBlockViewV2 block={block} key={`${section.id}-${block.type}-${index}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function DocumentWebRendererV2({ model, className }: DocumentWebRendererV2Props) {
  return (
    <article
      className={classNames("vdoc2", className)}
      data-document-kind={model.kind}
      lang="es"
      aria-label={`${model.metadata.title} para ${model.metadata.clientName}`}
    >
      {model.sections.map((section) => (
        <DocumentSectionViewV2 key={section.id} section={section} />
      ))}
      <footer className="vdoc2-footer">
        <span>Velocentum</span>
        <span>
          Diagnóstico {model.source.diagnosticId} · v{model.source.diagnosticVersion}
        </span>
      </footer>
    </article>
  );
}
