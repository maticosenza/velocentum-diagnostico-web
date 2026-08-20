import { buildDiagnosticoDocument } from "./diagnostico";
import { buildProyeccionPropuestaDocument } from "./composicion";
import { buildPropuestaDocument } from "./propuesta";
import { buildProyeccion90dDocument } from "./proyeccion-90d";
import type { DocumentTemplate, VelocentumTemplateId } from "./types";

export const VELOCENTUM_V1_TEMPLATES = {
  "velocentum-diagnostico/v1": {
    id: "velocentum-diagnostico/v1",
    build: buildDiagnosticoDocument,
  },
  "velocentum-proyeccion-90d/v1": {
    id: "velocentum-proyeccion-90d/v1",
    build: buildProyeccion90dDocument,
  },
  "velocentum-propuesta/v1": {
    id: "velocentum-propuesta/v1",
    build: buildPropuestaDocument,
  },
  "velocentum-proyeccion-propuesta/v1": {
    id: "velocentum-proyeccion-propuesta/v1",
    build: buildProyeccionPropuestaDocument,
  },
} as const satisfies Record<VelocentumTemplateId, DocumentTemplate>;

export function getVelocentumV1Template(id: VelocentumTemplateId): DocumentTemplate {
  return VELOCENTUM_V1_TEMPLATES[id];
}
