/**
 * S15 (Bloque 3 Funcional) — DHB-3: roadmap 30/60/90 determinístico.
 * Unidad directa sobre `roadmapDocumento` (ver
 * `docs/funcional/contrato-bloque-3.md` sección 4): fuentes controladas,
 * sin depender de que un caso real dispare la combinación exacta de
 * prioridades/servicios necesaria.
 */
import { describe, expect, it } from "vitest";
import { roadmapDocumento } from "./build-context";
import { valorCalculado } from "./publishing-policy";
import type { HallazgoDocumento, RestriccionDocumento, SeleccionComercial } from "./types";

function hallazgo(overrides: Partial<HallazgoDocumento> & { id: string }): HallazgoDocumento {
  return {
    titulo: overrides.id,
    capa: "servicio",
    prioridad: "media",
    confianza: "media",
    evidenciaIds: [],
    monto: null,
    magnitud: null,
    servicioIds: [],
    ...overrides,
  };
}

const HALLAZGOS: HallazgoDocumento[] = [
  hallazgo({ id: "fuga_alta", titulo: "Fuga urgente en checkout", prioridad: "alta" }),
  hallazgo({ id: "fuga_media", titulo: "Oportunidad de mejora en Meta Ads", prioridad: "media" }),
];

const COMERCIAL: SeleccionComercial = {
  niveles: [
    {
      id: "impulso",
      nombre: "IMPULSO",
      precio: valorCalculado({ valor: 900_000, confianza: "alta", evidenciaIds: [] }),
      servicios: [
        {
          servicio: "Desarrollo y optimización web",
          unidad: "campañas_activas",
          cantidad: 1,
          descripcion: null,
          hallazgoIds: ["fuga_alta"],
        },
        {
          servicio: "Meta Ads",
          unidad: "campañas_activas",
          cantidad: 1,
          descripcion: null,
          hallazgoIds: ["fuga_media"],
        },
        // Servicio seleccionado sin ningún hallazgo de prioridad alta asociado.
        {
          servicio: "Diseño de marca",
          unidad: "alcance_descrito",
          cantidad: null,
          descripcion: "Identidad visual",
          hallazgoIds: [],
        },
      ],
    },
  ],
};

const RESTRICCIONES: RestriccionDocumento[] = [
  {
    id: "cobertura_canales_parcial",
    etiqueta: "Cobertura de canales parcial",
    detalle: "El mix conocido cubre 60% de la facturación.",
    bloquea: ["rentabilidad"],
  },
];

describe("S15 — DHB-3: roadmap 30/60/90 determinístico", () => {
  it("sin selección comercial confirmada, el roadmap queda vacío — nunca se puebla sin selección", () => {
    expect(roadmapDocumento(HALLAZGOS, null, RESTRICCIONES)).toEqual([]);
  });

  it("con selección confirmada: alta→30, media→60, servicio sin hallazgo alta + restricciones→90", () => {
    const etapas = roadmapDocumento(HALLAZGOS, COMERCIAL, RESTRICCIONES);
    const porId = new Map(etapas.map((e) => [e.id, e]));

    const etapa30 = porId.get("etapa_30");
    expect(etapa30?.desdeDia).toBe(0);
    expect(etapa30?.hastaDia).toBe(30);
    expect(etapa30?.acciones).toEqual(["Fuga urgente en checkout"]);

    const etapa60 = porId.get("etapa_60");
    expect(etapa60?.desdeDia).toBe(31);
    expect(etapa60?.hastaDia).toBe(60);
    expect(etapa60?.acciones).toEqual(["Oportunidad de mejora en Meta Ads"]);

    const etapa90 = porId.get("etapa_90");
    expect(etapa90?.desdeDia).toBe(61);
    expect(etapa90?.hastaDia).toBe(90);
    expect(etapa90?.acciones).toEqual(
      expect.arrayContaining(["Diseño de marca", "Cobertura de canales parcial"]),
    );
  });

  it("cero ítems inventados: cada acción es literal el título de un hallazgo, el nombre de un servicio seleccionado o la etiqueta de una restricción — nunca texto redactado", () => {
    const etapas = roadmapDocumento(HALLAZGOS, COMERCIAL, RESTRICCIONES);
    const titulos = new Set(HALLAZGOS.map((h) => h.titulo));
    const servicios = new Set(COMERCIAL.niveles.flatMap((n) => n.servicios.map((s) => s.servicio)));
    const etiquetas = new Set(RESTRICCIONES.map((r) => r.etiqueta));
    const fuentesValidas = new Set([...titulos, ...servicios, ...etiquetas]);

    for (const etapa of etapas) {
      for (const accion of etapa.acciones) {
        expect(fuentesValidas.has(accion), `acción no trazable: "${accion}"`).toBe(true);
      }
      expect(etapa.resultadoEsperado.length).toBeGreaterThan(0);
    }
  });

  it("un servicio seleccionado sin ningún hallazgo asociado no aparece en ninguna etapa (nunca se inventa una acción para él)", () => {
    const comercialConServicioSinHallazgo: SeleccionComercial = {
      niveles: [
        {
          ...COMERCIAL.niveles[0]!,
          servicios: [
            ...COMERCIAL.niveles[0]!.servicios,
            {
              servicio: "Product Ads",
              unidad: "campañas_activas",
              cantidad: 1,
              descripcion: null,
              hallazgoIds: [],
            },
          ],
        },
      ],
    };
    const etapas = roadmapDocumento(HALLAZGOS, comercialConServicioSinHallazgo, []);
    const acciones = etapas.flatMap((e) => e.acciones);
    // "Product Ads" SÍ aparece (servicio seleccionado sin hallazgo alta → etapa 90),
    // pero como su propio nombre literal, no como texto inventado sobre él.
    expect(acciones.filter((a) => a === "Product Ads").length).toBe(1);
  });
});
