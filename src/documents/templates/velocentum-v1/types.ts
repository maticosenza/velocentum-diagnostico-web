import type {
  ConfianzaDocumento,
  EtapaRoadmap,
  HallazgoDocumento,
  RestriccionDocumento,
  ServicioDocumento,
  SupuestoDocumento,
} from "../../domain";

export type VelocentumTemplateId =
  | "velocentum-diagnostico/v1"
  | "velocentum-proyeccion-90d/v1"
  | "velocentum-propuesta/v1"
  | "velocentum-proyeccion-propuesta/v1";

export type DocumentKind = "diagnostico" | "proyeccion_90d" | "propuesta" | "proyeccion_propuesta";

export type DocumentSectionTone = "dark" | "light" | "soft";
export type DocumentValueFormat = "money" | "number" | "percent" | "ratio";

export type PublishedNumber = {
  value: number;
  format: DocumentValueFormat;
  confidence: Exclude<ConfianzaDocumento, "bloqueada">;
  evidenceIds: string[];
  assumptions: string[];
};

export type DocumentBlock =
  | {
      type: "cover";
      title: string;
      subtitle: string;
      clientName: string;
      diagnosticDate: string;
    }
  | {
      type: "coverage";
      confidence: ConfianzaDocumento;
      items: { id: "general" | "canales" | "productos"; label: string; value: number }[];
    }
  | {
      type: "metric-grid";
      items: { id: string; label: string; value: PublishedNumber }[];
    }
  | {
      type: "shipping";
      label: string;
      cost: PublishedNumber;
    }
  | {
      type: "findings";
      items: Array<
        Pick<
          HallazgoDocumento,
          "id" | "titulo" | "capa" | "prioridad" | "confianza" | "evidenciaIds" | "magnitud"
        > & {
          amount: PublishedNumber | null;
        }
      >;
    }
  | {
      type: "scenarios";
      items: {
        id: "conservador" | "base" | "potencial";
        confidence: ConfianzaDocumento;
        /**
         * Tres magnitudes independientes: nunca se suman entre sí ni se
         * combinan en un "impacto total". `revenue90d` es facturación
         * incremental (unidades × ticket), `contribution90d` es esa misma
         * facturación incremental × margen, y `adSavings90d` es ahorro
         * publicitario consolidado (máximo entre gasto no rentable y
         * sobrefragmentación, nunca la suma).
         */
        revenue90d: PublishedNumber | null;
        contribution90d: PublishedNumber | null;
        adSavings90d: PublishedNumber | null;
        revenuePaceDay90: PublishedNumber | null;
        contributionPaceDay90: PublishedNumber | null;
        adSavingsPaceDay90: PublishedNumber | null;
        /** Los tres meses del trimestre, vacío cuando las tres magnitudes están retenidas. */
        monthly: {
          month: 1 | 2 | 3;
          /** facturación actual + facturación incremental habilitada. Nunca incluye contribución ni ahorro. */
          revenueProjected: PublishedNumber | null;
          revenueEnabled: PublishedNumber | null;
          contributionEnabled: PublishedNumber | null;
          adSavingsEnabled: PublishedNumber | null;
        }[];
        levers: {
          id: string;
          name: string;
          type: "facturacion_incremental" | "contribucion_incremental" | "ahorro_publicitario";
          amount: PublishedNumber;
        }[];
        assumptions: SupuestoDocumento[];
        restrictions: RestriccionDocumento[];
      }[];
    }
  | {
      /**
       * Encabezado comercial de 90 días (corrección aprobada 2026-08-21,
       * puntos 2, 4, 6 y 7): la cifra dominante es SIEMPRE contribución
       * incremental del escenario conservador, nunca facturación. `headline`
       * es `null` cuando la dispersión es alta o el conservador no es
       * calculable — en ese caso sólo se muestra el rango (`range`), nunca
       * un número principal inventado.
       */
      type: "commercial-summary";
      scenarioCommunicated: "conservador";
      headline: PublishedNumber | null;
      range: {
        lower: PublishedNumber | null;
        upper: PublishedNumber | null;
        upperScenarioId: "base" | "potencial" | null;
      };
      /** Redacción obligatoria ya armada (punto 6). `null` sin rango calculable que describir. */
      statement: string | null;
      dispersion: {
        ratio: number | null;
        threshold: number;
        high: boolean;
        dataToCloseIt: string[];
      };
    }
  | { type: "roadmap"; items: EtapaRoadmap[] }
  | { type: "services"; items: ServicioDocumento[] }
  | {
      type: "commercial-offer";
      packageId: string;
      name: string;
      scope: string[];
      exclusions: string[];
      deliverables: string[];
      durationDays: number;
      paymentTerms: string;
      startDate: string | null;
      price: PublishedNumber | null;
    }
  | { type: "restrictions"; items: RestriccionDocumento[] }
  | { type: "methodology"; items: SupuestoDocumento[] }
  | { type: "transition"; label: string }
  | { type: "next-step"; label: string };

export type DocumentSection = {
  id: string;
  tone: DocumentSectionTone;
  eyebrow: string | null;
  title: string | null;
  blocks: DocumentBlock[];
};

export type DocumentModel = {
  schemaVersion: "document-model/1";
  templateId: VelocentumTemplateId;
  themeId: "velocentum-light/v1";
  kind: DocumentKind;
  source: {
    contextSchemaVersion: "document-context/1";
    templateVersion: string;
    rulesetVersion: string;
    diagnosticId: string;
    diagnosticVersion: number;
  };
  metadata: {
    title: string;
    clientName: string;
    date: string;
  };
  sections: DocumentSection[];
};

export type DocumentTemplate = {
  id: VelocentumTemplateId;
  build: (context: import("../../domain").DocumentContextV1) => DocumentModel;
};
