/**
 * Tipos propios de v2 — nuevos, no modifican ni reemplazan
 * `templates/velocentum-v1/types.ts`. Se construyen a partir del mismo
 * `DocumentContextV1` que consume v1 (`src/documents/domain`), sin ningún
 * cambio de dominio.
 *
 * Diferencia clave con v1: `ValorV2` preserva el `ValorPublicable<T>`
 * completo (estado + motivo real) en vez de colapsar a
 * `PublishedNumber | null` como hace `publishValue` de v1 — necesario para
 * que la capa semántica (`semantica-v2/estado.ts`) pueda mostrar el motivo
 * real en vez de un genérico "Sin datos" (E-04, contrato-composicion-v2.md
 * sección 1.1).
 */
import type {
  ConfianzaDocumento,
  EtapaRoadmap,
  RestriccionDocumento,
  ServicioDocumento,
  SupuestoDocumento,
} from "../../domain";
import type { TipoImpactoClasificado } from "../../../lib/impacto-economico";

export type FormatoValorV2 = "money" | "percent" | "ratio" | "number";

export type ValorV2 =
  | {
      estado: "calculado";
      valor: number;
      formato: FormatoValorV2;
      confianza: Exclude<ConfianzaDocumento, "bloqueada">;
      evidenciaIds: string[];
      supuestos: string[];
    }
  | {
      estado: "retenido";
      formato: FormatoValorV2;
      motivos: string[];
    }
  | {
      estado: "no_aplica";
      formato: FormatoValorV2;
      motivo: string;
    };

export type DocumentKindV2 = "diagnostico" | "proyeccion_90d" | "propuesta";
export type DocumentSectionToneV2 = "dark" | "light" | "soft";

export type RestriccionAgrupadaV2 = {
  /** Motivo literal compartido por todas las etiquetas agrupadas. */
  motivo: string;
  etiquetas: string[];
};

export type PalancaV2 = {
  id: string;
  nombre: string;
  tipo: TipoImpactoClasificado;
  monto: ValorV2;
  /** Período explícito del monto (E-03): nunca un monto sin calificador. */
  periodo: "ritmo_mensual_dia_90";
};

export type MesEscenarioV2 = {
  mes: 1 | 2 | 3;
  facturacionProyectada: ValorV2;
  facturacionIncrementalHabilitada: ValorV2;
  contribucionIncrementalHabilitada: ValorV2;
  ahorroPublicitarioHabilitado: ValorV2;
};

export type EscenarioV2 = {
  id: "conservador" | "base" | "potencial";
  confianza: ConfianzaDocumento;
  contribucion90d: ValorV2;
  facturacion90d: ValorV2;
  ahorroPublicitario90d: ValorV2;
  mensual: MesEscenarioV2[];
  palancas: PalancaV2[];
  supuestos: SupuestoDocumento[];
  restricciones: RestriccionDocumento[];
  /**
   * Corta: sin tabla mensual ni palancas (ej. s4, sin datos de funnel) — usa
   * grilla de 3 columnas balanceada. Larga: con tabla mensual y/o palancas
   * (ej. s1) — se renderiza a ancho completo, una por fila (R-11, ataca
   * E-01/E-02 de raíz — contrato sección 2.5).
   */
  esCorta: boolean;
};

export type HallazgoV2 = {
  id: string;
  titulo: string;
  capa: "servicio" | "recomendacion" | "contexto";
  prioridad: "alta" | "media" | "baja";
  confianza: ConfianzaDocumento;
  evidenciaIds: string[];
  magnitud: TipoImpactoClasificado | null;
  monto: ValorV2 | null;
  /** Tratamiento visual distinto para el hallazgo de margen negativo (E-10/D5). */
  esMargenNegativo: boolean;
};

export type NivelComercialV2 = {
  id: string;
  nombre: string;
  servicios: {
    servicio: string;
    unidad: "campañas_activas" | "piezas_por_mes" | "campañas" | "alcance_descrito";
    cantidad: number | null;
    descripcion: string | null;
    hallazgoIds: string[];
  }[];
  precio: ValorV2 | null;
};

export type DocumentBlockV2 =
  | {
      type: "cover";
      title: string;
      subtitle: string;
      clientName: string;
      diagnosticDate: string;
      /** Tipo de documento explícito (C10, ronda 2.1) — distinto del título de marketing. */
      documentKind: DocumentKindV2;
      /** Versión, tomada del identificador de plantilla ya existente (C10, ronda 2.1). */
      version: string;
    }
  | {
      type: "coverage";
      confidence: ConfianzaDocumento;
      items: { id: "general" | "canales" | "productos"; label: string; value: number }[];
    }
  | { type: "metric-grid"; items: { id: string; label: string; value: ValorV2 }[] }
  | { type: "shipping"; label: string; cost: ValorV2 }
  | {
      type: "channel-comparison";
      tienda: { label: string; value: ValorV2 };
      marketplace: { label: string; value: ValorV2 };
    }
  | { type: "findings"; variante: "diagnostico" | "propuesta"; items: HallazgoV2[] }
  | { type: "scenarios"; items: EscenarioV2[] }
  | {
      type: "commercial-summary";
      scenarioCommunicated: "conservador";
      headline: ValorV2 | null;
      range: { lower: ValorV2 | null; upper: ValorV2 | null; upperScenarioId: "base" | "potencial" | null };
      statement: string | null;
      /** Nota resuelta de la marca † del headline (E-13) — vacío si el headline no depende de un supuesto. */
      assumptionsDetail: SupuestoDocumento[];
      dispersion: { ratio: number | null; threshold: number; high: boolean; dataToCloseIt: string[] };
    }
  | { type: "bridge-note"; text: string }
  | { type: "roadmap"; items: EtapaRoadmap[] }
  | { type: "services"; items: ServicioDocumento[] }
  // `pendiente: true` (D1): la propuesta se generó sin selección comercial
  // confirmada — `niveles` vacío y el renderer debe mostrar el texto
  // literal "Selección comercial pendiente", nunca omitir la sección.
  | { type: "commercial-offer"; pendiente: boolean; niveles: NivelComercialV2[] }
  | { type: "restrictions"; items: RestriccionDocumento[] }
  | { type: "restrictions-grouped"; items: RestriccionAgrupadaV2[] }
  | { type: "methodology"; items: SupuestoDocumento[] }
  | { type: "transition"; label: string }
  | { type: "next-step"; label: string };

export type DocumentSectionV2 = {
  id: string;
  tone: DocumentSectionToneV2;
  eyebrow: string | null;
  title: string | null;
  blocks: DocumentBlockV2[];
};

export type DocumentModelV2 = {
  schemaVersion: "document-model-v2/1";
  templateId: string;
  kind: DocumentKindV2;
  source: {
    contextSchemaVersion: string;
    templateVersion: string;
    rulesetVersion: string;
    diagnosticId: string;
    diagnosticVersion: number;
  };
  metadata: { title: string; clientName: string; date: string };
  sections: DocumentSectionV2[];
};
