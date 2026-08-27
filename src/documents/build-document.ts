/**
 * Punto único de armado de documentos a partir de un diagnóstico persistido.
 *
 * La interfaz sólo conoce este módulo: elige una plantilla del catálogo y recibe
 * un `DocumentModel` listo para el renderer web o el renderer PDF. El catálogo
 * es la única lista de documentos ofrecidos, para que la vista previa y la
 * descarga no puedan divergir.
 */

import { inversionCanal } from "../lib/calculo-diagnostico";
import type { DatosDiagnostico } from "../lib/diagnostico-form";
import {
  buildDocumentContextDesdeDiagnostico,
  type DiagnosticoAlmacenado,
} from "./domain/from-diagnostico";
import { valorRetenido } from "./domain/publishing-policy";
import type { DocumentContextV1, TipoDocumento } from "./domain/types";
import {
  getVelocentumV1Template,
  type DocumentModel,
  type VelocentumTemplateId,
} from "./templates/velocentum-v1";

/** Segmento de URL estable para cada plantilla: nunca cambia aunque cambie la etiqueta. */
export type DocumentoSlug = "diagnostico" | "proyeccion-90d" | "propuesta" | "proyeccion-propuesta";

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
  if (!fila.datos) {
    throw new Error("El diagnóstico guardado no tiene datos: no se puede armar el documento.");
  }
  return getVelocentumV1Template(templateId).build(preservarSalidaV1(context, fila.datos));
}
