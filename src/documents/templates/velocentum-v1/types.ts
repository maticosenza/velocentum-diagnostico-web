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
          "id" | "titulo" | "capa" | "prioridad" | "confianza" | "evidenciaIds"
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
        contribution90d: PublishedNumber | null;
        monthlyPaceDay90: PublishedNumber | null;
        /** Los tres meses del trimestre, vacío cuando el escenario está retenido. */
        monthly: {
          month: 1 | 2 | 3;
          revenueProjected: PublishedNumber | null;
          opportunityEnabled: PublishedNumber | null;
        }[];
        levers: { id: string; name: string; contribution: PublishedNumber }[];
        assumptions: SupuestoDocumento[];
        restrictions: RestriccionDocumento[];
      }[];
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
