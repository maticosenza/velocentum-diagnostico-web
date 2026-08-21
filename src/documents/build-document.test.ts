import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../lib/calculo-diagnostico";
import { casoSnakeStore, casoTitanWebB1, configuracionRegresionFase2 } from "../lib/fixtures-casos";
import type { DatosDiagnostico } from "../lib/diagnostico-form";
import type { DiagnosticoAlmacenado } from "./domain/from-diagnostico";
import {
  buildDocumentModelDesdeDiagnostico,
  documentoDisponible,
  documentoPorSlug,
  DOCUMENTOS_DISPONIBLES,
} from "./build-document";
import { VELOCENTUM_V1_TEMPLATES } from "./templates/velocentum-v1";

function fila(datos: DatosDiagnostico, id = "fila-1"): DiagnosticoAlmacenado {
  const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
  return {
    id,
    fecha: "2026-08-20",
    version: 1,
    datos,
    derivados: resultado.derivados,
    estados_bloque: resultado.estados_bloque,
    fugas: resultado.fugas,
    oportunidad_total: resultado.oportunidad_total,
  };
}

describe("catálogo de documentos", () => {
  it("ofrece exactamente las plantillas registradas", () => {
    expect(DOCUMENTOS_DISPONIBLES.map((documento) => documento.id).sort()).toEqual(
      Object.keys(VELOCENTUM_V1_TEMPLATES).sort(),
    );
  });

  it("rechaza un identificador de plantilla desconocido", () => {
    expect(() => documentoDisponible("velocentum-inexistente/v9" as never)).toThrow(/desconocida/);
  });

  it("resuelve cada slug de URL a una plantilla única y rechaza slugs desconocidos", () => {
    for (const documento of DOCUMENTOS_DISPONIBLES) {
      expect(documentoPorSlug(documento.slug)).toEqual(documento);
    }
    expect(documentoPorSlug("no-existe")).toBeNull();
  });
});

describe("armado del modelo desde un diagnóstico persistido", () => {
  it("arma las cuatro plantillas conservando el origen del diagnóstico", () => {
    for (const documento of DOCUMENTOS_DISPONIBLES) {
      const model = buildDocumentModelDesdeDiagnostico(
        fila(casoSnakeStore, "snake-1"),
        documento.id,
      );

      expect(model.templateId).toBe(documento.id);
      expect(model.source.diagnosticId).toBe("snake-1");
      expect(model.source.diagnosticVersion).toBe(1);
      expect(model.metadata.clientName).toBe(casoSnakeStore.nombre_tienda);
      expect(model.metadata.date).toBe("2026-08-20");
      expect(model.sections.length).toBeGreaterThan(0);
    }
  });

  it("publica el bloque de escenarios retenido mientras Titan no confirme la política de envío", () => {
    const model = buildDocumentModelDesdeDiagnostico(
      fila(casoTitanWebB1),
      "velocentum-proyeccion-90d/v1",
    );
    const bloques = model.sections.flatMap((seccion) => seccion.blocks);
    const bloqueEscenarios = bloques.find((bloque) => bloque.type === "scenarios");

    expect(bloqueEscenarios).toBeDefined();
    const items = bloqueEscenarios && "items" in bloqueEscenarios ? bloqueEscenarios.items : [];
    // Envío sin confirmar: se muestran retenidos, nunca con un acumulado fabricado.
    for (const item of items) {
      expect(item.contribution90d).toBeNull();
      expect(item.monthlyPaceDay90).toBeNull();
    }
  });

  it("no publica el bloque comercial sin una selección aprobada", () => {
    const model = buildDocumentModelDesdeDiagnostico(
      fila(casoSnakeStore),
      "velocentum-propuesta/v1",
    );
    const bloques = model.sections.flatMap((seccion) => seccion.blocks);

    expect(bloques.some((bloque) => bloque.type === "commercial-offer")).toBe(false);
  });
});
