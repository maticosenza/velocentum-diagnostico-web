/**
 * Punto único de armado de documentos a partir de un diagnóstico persistido.
 *
 * La interfaz sólo conoce este módulo: elige una plantilla del catálogo y recibe
 * un `DocumentModel` listo para el renderer web o el renderer PDF. El catálogo
 * es la única lista de documentos ofrecidos, para que la vista previa y la
 * descarga no puedan divergir.
 *
 * Fase 14: el motor (v1/v2) lo decide `MOTOR_DOCUMENTAL_ACTIVO`
 * (`../motor-activo`), el único interruptor — ver
 * `docs/fase-14/plan-reversion.md`. Con el valor por defecto ("v1") este
 * archivo se comporta exactamente igual que antes de esta fase (X1/X7):
 * la rama v2 es código nuevo, aditivo, nunca alcanzado por el camino por
 * defecto.
 */

import { inversionCanal } from "../lib/calculo-diagnostico";
import type { DatosDiagnostico } from "../lib/diagnostico-form";
import {
  buildDocumentContextDesdeDiagnostico,
  type DiagnosticoAlmacenado,
} from "./domain/from-diagnostico";
import { valorRetenido } from "./domain/publishing-policy";
import type { DocumentContextV1, TipoDocumento } from "./domain/types";
import { MOTOR_DOCUMENTAL_ACTIVO } from "./motor-activo";
import {
  getVelocentumV1Template,
  type DocumentModel,
  type VelocentumTemplateId,
} from "./templates/velocentum-v1";
import {
  buildDiagnosticoDocumentV2,
  buildProyeccion90dDocumentV2,
  buildPropuestaDocumentV2,
  type DocumentModelV2,
} from "./templates/velocentum-v2";

/** Segmento de URL estable para cada plantilla: nunca cambia aunque cambie la etiqueta. */
export type DocumentoSlug = "diagnostico" | "proyeccion-90d" | "propuesta" | "proyeccion-propuesta";

/**
 * Resultado de armar un documento: trae el motor que efectivamente lo
 * generó (nunca lo decide el consumidor) junto con el modelo — así
 * `documentos.$id.$slug.tsx` y los `export-client.ts` de PDF (v1 y v2)
 * sólo hacen `switch` sobre `engine` para elegir el renderer que
 * corresponde, sin volver a consultar el interruptor por su cuenta.
 */
export type DocumentModelResuelto =
  | { engine: "v1"; model: DocumentModel }
  | { engine: "v2"; model: DocumentModelV2 };

export type DocumentoDisponible = {
  id: VelocentumTemplateId;
  slug: DocumentoSlug;
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
    slug: "diagnostico",
    etiqueta: "Diagnóstico",
    descripcion: "Situación actual, cobertura, hallazgos y restricciones.",
    tipoDocumento: "diagnostico",
  },
  {
    id: "velocentum-proyeccion-90d/v1",
    slug: "proyeccion-90d",
    etiqueta: "Proyección 90 días",
    descripcion: "Línea de base y escenarios, sólo cuando el motor los respalda.",
    tipoDocumento: "proyeccion_90d",
  },
  {
    id: "velocentum-propuesta/v1",
    slug: "propuesta",
    etiqueta: "Propuesta",
    descripcion: "Prioridades, alcance y paquete comercial aprobado.",
    tipoDocumento: "propuesta",
  },
  {
    id: "velocentum-proyeccion-propuesta/v1",
    slug: "proyeccion-propuesta",
    etiqueta: "Proyección + propuesta",
    descripcion: "Documento combinado para presentar plan e intervención juntos.",
    tipoDocumento: "propuesta",
  },
] as const;

export function documentoDisponible(id: VelocentumTemplateId): DocumentoDisponible {
  const encontrado = DOCUMENTOS_DISPONIBLES.find((documento) => documento.id === id);
  if (!encontrado) throw new Error(`Plantilla desconocida: ${id}`);
  return encontrado;
}

export function documentoPorSlug(slug: string): DocumentoDisponible | null {
  return DOCUMENTOS_DISPONIBLES.find((documento) => documento.slug === slug) ?? null;
}

/**
 * Fase 14 — catálogo v2: sólo tres documentos (v2 no tiene un
 * equivalente de "proyeccion-propuesta", el documento combinado de v1;
 * construir uno no está en el alcance acotado de esta fase, sección 4.2
 * EXCLUIDO "Rediseño visual"). Con el motor v2 activo, ese único slug
 * deja de estar disponible — no es un selector entre dos caminos para
 * el MISMO documento (P1), es una diferencia real de qué documentos
 * ofrece cada motor, tratada con la misma honestidad que cualquier otro
 * hueco de v2 documentado en `docs/visual/`.
 */
export type DocumentoDisponibleV2 = {
  slug: "diagnostico" | "proyeccion-90d" | "propuesta";
  etiqueta: string;
  descripcion: string;
  tipoDocumento: TipoDocumento;
};

export const DOCUMENTOS_DISPONIBLES_V2: readonly DocumentoDisponibleV2[] = [
  {
    slug: "diagnostico",
    etiqueta: "Diagnóstico",
    descripcion: "Situación actual, cobertura, hallazgos y restricciones.",
    tipoDocumento: "diagnostico",
  },
  {
    slug: "proyeccion-90d",
    etiqueta: "Proyección 90 días",
    descripcion: "Línea de base y escenarios, sólo cuando el motor los respalda.",
    tipoDocumento: "proyeccion_90d",
  },
  {
    slug: "propuesta",
    etiqueta: "Propuesta",
    descripcion: "Prioridades, alcance y paquete comercial aprobado.",
    tipoDocumento: "propuesta",
  },
] as const;

/**
 * Catálogo que la interfaz debe ofrecer HOY, según el único interruptor
 * (`MOTOR_DOCUMENTAL_ACTIVO`). Con el valor por defecto ("v1") devuelve
 * exactamente `DOCUMENTOS_DISPONIBLES` — mismo array, mismo orden,
 * ninguna diferencia (X1).
 */
export function documentosDisponiblesActivos(): readonly (DocumentoDisponible | DocumentoDisponibleV2)[] {
  return MOTOR_DOCUMENTAL_ACTIVO === "v2" ? DOCUMENTOS_DISPONIBLES_V2 : DOCUMENTOS_DISPONIBLES;
}

/** Igual que `documentoPorSlug`, pero contra el catálogo activo (v1 o v2). */
export function documentoActivoPorSlug(
  slug: string,
): DocumentoDisponible | DocumentoDisponibleV2 | null {
  return documentosDisponiblesActivos().find((documento) => documento.slug === slug) ?? null;
}

/**
 * S16 (Bloque 3 Funcional): revierte, sólo para v1, un ratio que DHB-1
 * reclasificó de `retenido` a `no_aplica` — v1 no conoce esa
 * reclasificación y mostraba una restricción (`retainedRestriction`,
 * `templates/velocentum-v1/blocks.ts`) para el caso "inversión $0
 * declarada" antes de este bloque. Discriminador estructural (lee la
 * inversión declarada REAL vía la misma `inversionCanal` que usa el
 * dominio), nunca parseo de `motivo`. Guarda explícita contra el `no_aplica`
 * LEGÍTIMO y preexistente (canal declarado no aplicable por el cliente,
 * `condicionNoAplicaDeNegocio`) — ese nunca se revierte, hoy ni antes de
 * Bloque 3.
 */
function revertirRatioDHB1SoloParaV1(
  valor: DocumentContextV1["actual"]["merTienda"],
  condicionNoAplicaDeNegocio: boolean,
  inversionDeclarada: number | null,
  motivoV1Original: string,
): DocumentContextV1["actual"]["merTienda"] {
  if (valor.estado !== "no_aplica") return valor;
  if (condicionNoAplicaDeNegocio) return valor;
  if (inversionDeclarada !== 0) return valor;
  return valorRetenido<number>(motivoV1Original);
}

/**
 * S16 (Bloque 3 Funcional): preserva exactamente la salida de v1 frente a
 * tres cambios de dominio compartidos con v2 que v1 nunca debe reflejar —
 * DHB-3 (roadmap real), DHB-1 (ratios sobre inversión $0 declarada) y
 * E-07 (confianza por escenario derivada de sus propias magnitudes, en
 * vez de copiar `confianzaDocumento` literal — `context.cobertura.confianza`
 * es exactamente ese valor anterior, verificado en `build-context.ts`,
 * misma variable que antes se pasaba a cada escenario sin acotar). El
 * borde real de v1 es este archivo (único consumidor de
 * `getVelocentumV1Template`); v2 nunca pasa por acá, así que ninguno de
 * los tres ajustes le llega.
 */
function preservarSalidaV1(context: DocumentContextV1, datos: DatosDiagnostico): DocumentContextV1 {
  return {
    ...context,
    roadmap: [],
    escenarios90d: context.escenarios90d.map((escenario) => {
      const confianza = context.cobertura.confianza;
      return {
        ...escenario,
        confianza,
        // `visible` se derivaba de la misma confianza revertida arriba —
        // misma regla que `visiblePara` en `documents/domain/escenarios-90d.ts`
        // ("potencial" sólo visible con "alta"), para no dejar un
        // `visible`/`confianza` inconsistentes entre sí en la salida de v1.
        visible: escenario.id !== "potencial" || confianza === "alta",
      };
    }),
    actual: {
      ...context.actual,
      merTienda: revertirRatioDHB1SoloParaV1(
        context.actual.merTienda,
        datos.canal_tienda_no_aplica === true,
        inversionCanal(datos, "tienda_propia"),
        "Faltan facturación o inversión del perímetro de tienda propia.",
      ),
      merMarketplace: revertirRatioDHB1SoloParaV1(
        context.actual.merMarketplace,
        datos.canal_ml_no_aplica === true || datos.vende_mercado_libre === false,
        inversionCanal(datos, "mercado_libre"),
        "Faltan facturación o inversión del perímetro de marketplace.",
      ),
      roasProductAds: revertirRatioDHB1SoloParaV1(
        context.actual.roasProductAds,
        datos.ml_product_ads === false,
        inversionCanal(datos, "mercado_libre"),
        "Faltan ventas atribuidas o inversión de Product Ads.",
      ),
    },
  };
}

/** Arma el modelo del documento (v1) sin recalcular el diagnóstico. Sin cambios de esta fase. */
export function buildDocumentModelDesdeDiagnostico(
  fila: DiagnosticoAlmacenado,
  templateId: VelocentumTemplateId,
): DocumentModel {
  const documento = documentoDisponible(templateId);
  const context = buildDocumentContextDesdeDiagnostico({
    fila,
    tipoDocumento: documento.tipoDocumento,
  });
  if (!fila.datos) {
    throw new Error("El diagnóstico guardado no tiene datos: no se puede armar el documento.");
  }
  return getVelocentumV1Template(templateId).build(preservarSalidaV1(context, fila.datos));
}

function buildDocumentModelV2DesdeDiagnostico(
  fila: DiagnosticoAlmacenado,
  slug: DocumentoDisponibleV2["slug"],
): DocumentModelV2 {
  const documento = DOCUMENTOS_DISPONIBLES_V2.find((d) => d.slug === slug);
  if (!documento) throw new Error(`Plantilla v2 desconocida: ${slug}`);
  // v2 consume el MISMO `DocumentContextV1` que v1 (`buildDocumentContextDesdeDiagnostico`),
  // sin el ajuste `preservarSalidaV1` — ese ajuste existe únicamente para
  // que v1 siga mostrando lo que mostraba antes de DHB-1/DHB-3/E-07;
  // v2 ya refleja esos tres correctamente por diseño (ver el comentario
  // de `preservarSalidaV1` arriba).
  const context = buildDocumentContextDesdeDiagnostico({ fila, tipoDocumento: documento.tipoDocumento });
  if (!fila.datos) {
    throw new Error("El diagnóstico guardado no tiene datos: no se puede armar el documento.");
  }
  switch (slug) {
    case "diagnostico":
      return buildDiagnosticoDocumentV2(context);
    case "proyeccion-90d":
      return buildProyeccion90dDocumentV2(context);
    case "propuesta":
      return buildPropuestaDocumentV2(context);
  }
}

/**
 * Punto único real de armado (Fase 14): lee `MOTOR_DOCUMENTAL_ACTIVO` UNA
 * sola vez acá — ningún otro archivo vuelve a consultarlo — y devuelve el
 * modelo junto con el motor que lo generó, para que el renderer
 * correspondiente se elija por `engine`, no por adivinar el tipo del
 * modelo.
 */
export function armarDocumentoActivo(
  fila: DiagnosticoAlmacenado,
  slug: DocumentoSlug,
): DocumentModelResuelto {
  if (MOTOR_DOCUMENTAL_ACTIVO === "v2") {
    if (slug === "proyeccion-propuesta") {
      throw new Error(
        "Este documento combinado todavía no existe en el motor v2 (Fase 14, alcance acotado).",
      );
    }
    return { engine: "v2", model: buildDocumentModelV2DesdeDiagnostico(fila, slug) };
  }
  const documento = documentoPorSlug(slug);
  if (!documento) throw new Error(`Plantilla desconocida: ${slug}`);
  return { engine: "v1", model: buildDocumentModelDesdeDiagnostico(fila, documento.id) };
}
