/**
 * Punto único de armado de documentos a partir de un diagnóstico persistido.
 *
 * La interfaz sólo conoce este módulo: elige una plantilla del catálogo y recibe
 * un `DocumentModel` listo para el renderer web o el renderer PDF. El catálogo
 * es la única lista de documentos ofrecidos, para que la vista previa y la
 * descarga no puedan divergir.
 */

import {
  buildDocumentContextDesdeDiagnostico,
  type DiagnosticoAlmacenado,
} from "./domain/from-diagnostico";
import type { TipoDocumento } from "./domain/types";
import {
  getVelocentumV1Template,
  type DocumentModel,
  type VelocentumTemplateId,
} from "./templates/velocentum-v1";

export type DocumentoDisponible = {
  id: VelocentumTemplateId;
  etiqueta: string;
  descripcion: string;
  tipoDocumento: TipoDocumento;
};

/**
 * `tipoDocumento` viaja al contexto y por eso se mantiene dentro del contrato de
 * dominio: la combinación proyección + propuesta se declara como `propuesta`,
 * que es el documento que efectivamente se entrega.
 */
export const DOCUMENTOS_DISPONIBLES: readonly DocumentoDisponible[] = [
  {
    id: "velocentum-diagnostico/v1",
    etiqueta: "Diagnóstico",
    descripcion: "Situación actual, cobertura, hallazgos y restricciones.",
    tipoDocumento: "diagnostico",
  },
  {
    id: "velocentum-proyeccion-90d/v1",
    etiqueta: "Proyección 90 días",
    descripcion: "Línea de base y escenarios, sólo cuando el motor los respalda.",
    tipoDocumento: "proyeccion_90d",
  },
  {
    id: "velocentum-propuesta/v1",
    etiqueta: "Propuesta",
    descripcion: "Prioridades, alcance y paquete comercial aprobado.",
    tipoDocumento: "propuesta",
  },
  {
    id: "velocentum-proyeccion-propuesta/v1",
    etiqueta: "Proyección + propuesta",
    descripcion: "Documento combinado para presentar plan e intervención juntos.",
    tipoDocumento: "propuesta",
  },
] as const;

export function esDocumentoDisponible(valor: unknown): valor is VelocentumTemplateId {
  return DOCUMENTOS_DISPONIBLES.some((documento) => documento.id === valor);
}

export function documentoDisponible(id: VelocentumTemplateId): DocumentoDisponible {
  const encontrado = DOCUMENTOS_DISPONIBLES.find((documento) => documento.id === id);
  if (!encontrado) throw new Error(`Plantilla desconocida: ${id}`);
  return encontrado;
}

/** Arma el modelo del documento sin recalcular el diagnóstico. */
export function buildDocumentModelDesdeDiagnostico(
  fila: DiagnosticoAlmacenado,
  templateId: VelocentumTemplateId,
): DocumentModel {
  const documento = documentoDisponible(templateId);
  const context = buildDocumentContextDesdeDiagnostico({
    fila,
    tipoDocumento: documento.tipoDocumento,
  });
  return getVelocentumV1Template(templateId).build(context);
}
