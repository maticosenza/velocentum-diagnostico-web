/**
 * BV4 · F2a etapa 1 — el catálogo comercial v2 y su traducción desde el v1.
 *
 * Las aserciones de IDs son deliberadamente literales: los IDs quedan
 * escritos en la columna `diagnostico.propuesta` de cada diagnóstico
 * guardado, así que un renombre tiene que romper la suite ANTES de romper
 * los datos. Lo mismo con la tabla de traducción, que es la única fuente de
 * sugerencias automáticas.
 */
import { describe, expect, it } from "vitest";
import {
  CATALOGO_COMERCIAL_V2,
  LINEAS_SIN_ACTIVADOR_AUTOMATICO,
  LINEAS_V2_IDS,
  SERVICIOS_V2,
  TRADUCCION_V1_A_V2,
  VERSION_CATALOGO_V2,
  esCuantificable,
  esLineaId,
  lineaV2,
  lineasSugeridasV2,
  type LineaId,
} from "./catalogo-v2";
import { SERVICIOS, type HallazgoMapeado } from "./propuesta";

function hallazgo(
  id: string,
  servicio: string | null,
  capa: HallazgoMapeado["capa"] = "servicio",
): HallazgoMapeado {
  return { id, titulo: `Hallazgo ${id}`, capa, servicio };
}

describe("catálogo v2: diez líneas con IDs estables (contrato, punto b del reconciliado)", () => {
  it("los diez IDs son exactamente estos y en este orden", () => {
    expect(LINEAS_V2_IDS).toEqual([
      "meta_ads",
      "google_ads",
      "product_ads",
      "contenido_audiovisual",
      "contenido_estatico",
      "influencer_marketing",
      "planificacion_contenido",
      "diseno_web",
      "desarrollo_web_custom",
      "branding",
    ]);
  });

  it("el catálogo tiene diez líneas, versión 2, y ningún ID repetido", () => {
    expect(CATALOGO_COMERCIAL_V2.version).toBe(2);
    expect(VERSION_CATALOGO_V2).toBe(2);
    expect(CATALOGO_COMERCIAL_V2.lineas).toHaveLength(10);
    const ids = CATALOGO_COMERCIAL_V2.lineas.map((l) => l.id);
    expect(new Set(ids).size).toBe(10);
    expect(ids).toEqual([...LINEAS_V2_IDS]);
  });

  it("son nueve servicios: Contenido es un servicio con dos líneas", () => {
    expect(SERVICIOS_V2).toEqual([
      "Meta Ads",
      "Google Ads",
      "Product Ads",
      "Contenido",
      "Influencer marketing",
      "Planificación de contenido",
      "Diseño web",
      "Desarrollo web custom",
      "Branding",
    ]);
    expect(SERVICIOS_V2).toHaveLength(9);
    const lineasDeContenido = CATALOGO_COMERCIAL_V2.lineas.filter(
      (l) => l.servicio === "Contenido",
    );
    expect(lineasDeContenido.map((l) => l.id)).toEqual([
      "contenido_audiovisual",
      "contenido_estatico",
    ]);
  });

  it("cada línea lleva la unidad del punto b", () => {
    const unidades = Object.fromEntries(CATALOGO_COMERCIAL_V2.lineas.map((l) => [l.id, l.unidad]));
    expect(unidades).toEqual({
      meta_ads: "campañas",
      google_ads: "campañas",
      product_ads: "campañas",
      contenido_audiovisual: "piezas_por_mes",
      contenido_estatico: "piezas_por_mes",
      influencer_marketing: "creadores_por_mes",
      planificacion_contenido: "sin_cantidad",
      diseno_web: "sin_cantidad",
      desarrollo_web_custom: "paginas",
      branding: "sin_cantidad",
    });
  });

  it("Q10: únicas para diseño web, desarrollo custom y branding; mensuales las otras siete", () => {
    const unicas = CATALOGO_COMERCIAL_V2.lineas
      .filter((l) => l.recurrenciaSugerida === "unica")
      .map((l) => l.id);
    expect(unicas).toEqual(["diseno_web", "desarrollo_web_custom", "branding"]);

    const mensuales = CATALOGO_COMERCIAL_V2.lineas
      .filter((l) => l.recurrenciaSugerida === "mensual")
      .map((l) => l.id);
    expect(mensuales).toHaveLength(7);
    expect(mensuales).not.toContain("branding");
  });

  it("Q8: la ruta B2C/B2B/ambas es atributo de Diseño web, y de ninguna otra línea", () => {
    const conRuta = CATALOGO_COMERCIAL_V2.lineas.filter((l) => l.admiteRuta).map((l) => l.id);
    expect(conRuta).toEqual(["diseno_web"]);
  });

  it("Q3: son cuantificables todas menos las tres de unidad `sin_cantidad`", () => {
    const cuantificables = CATALOGO_COMERCIAL_V2.lineas.filter(esCuantificable).map((l) => l.id);
    expect(cuantificables).toEqual([
      "meta_ads",
      "google_ads",
      "product_ads",
      "contenido_audiovisual",
      "contenido_estatico",
      "influencer_marketing",
      "desarrollo_web_custom",
    ]);
  });

  it("`lineaV2` devuelve la línea por ID y `esLineaId` filtra lo que llega del JSON", () => {
    expect(lineaV2("diseno_web").nombre).toBe("Diseño web");
    expect(esLineaId("branding")).toBe(true);
    expect(esLineaId("desarrollo_web")).toBe(false);
    expect(esLineaId(null)).toBe(false);
    expect(esLineaId(7)).toBe(false);
    expect(() => lineaV2("no_existe" as LineaId)).toThrow(/Línea comercial desconocida/);
  });
});

describe("catálogo v1: intacto (alimenta el mapeo y toda la salida v1)", () => {
  it("los seis servicios v1 siguen siendo exactamente los seis", () => {
    expect(SERVICIOS).toEqual([
      "Meta Ads",
      "Google Ads",
      "Product Ads",
      "Desarrollo y optimización web",
      "Planificación y creación de contenido",
      "Diseño de marca",
    ]);
  });
});

describe("matriz de traducción v1 → v2 (punto c del reconciliado)", () => {
  it("cubre los seis servicios v1, sin sobrantes ni faltantes", () => {
    expect(Object.keys(TRADUCCION_V1_A_V2).sort()).toEqual([...SERVICIOS].sort());
  });

  it("los cinco directos traducen uno a uno", () => {
    expect(TRADUCCION_V1_A_V2["Meta Ads"]).toEqual(["meta_ads"]);
    expect(TRADUCCION_V1_A_V2["Google Ads"]).toEqual(["google_ads"]);
    expect(TRADUCCION_V1_A_V2["Product Ads"]).toEqual(["product_ads"]);
    expect(TRADUCCION_V1_A_V2["Desarrollo y optimización web"]).toEqual(["diseno_web"]);
    expect(TRADUCCION_V1_A_V2["Diseño de marca"]).toEqual(["branding"]);
  });

  it("Q1: 'Planificación y creación de contenido' sugiere el grupo de tres líneas", () => {
    expect(TRADUCCION_V1_A_V2["Planificación y creación de contenido"]).toEqual([
      "planificacion_contenido",
      "contenido_audiovisual",
      "contenido_estatico",
    ]);
  });

  it("Q2: la tabla no nombra influencer marketing ni desarrollo web custom", () => {
    const destinos = Object.values(TRADUCCION_V1_A_V2).flat();
    for (const manual of LINEAS_SIN_ACTIVADOR_AUTOMATICO) {
      expect(destinos).not.toContain(manual);
    }
    expect(LINEAS_SIN_ACTIVADOR_AUTOMATICO).toEqual([
      "influencer_marketing",
      "desarrollo_web_custom",
    ]);
  });

  it("todo destino de la tabla es una línea real del catálogo", () => {
    for (const destino of Object.values(TRADUCCION_V1_A_V2).flat()) {
      expect(esLineaId(destino)).toBe(true);
    }
  });
});

describe("lineasSugeridasV2: qué llega premarcado al panel", () => {
  it("un hallazgo de Meta Ads sugiere sólo meta_ads, con su justificación", () => {
    expect(lineasSugeridasV2([hallazgo("H1", "Meta Ads")])).toEqual([
      { lineaId: "meta_ads", hallazgoIds: ["H1"] },
    ]);
  });

  it("Q1: un hallazgo de contenido premarca las tres líneas del grupo, con el mismo hallazgo", () => {
    expect(lineasSugeridasV2([hallazgo("H2", "Planificación y creación de contenido")])).toEqual([
      { lineaId: "contenido_audiovisual", hallazgoIds: ["H2"] },
      { lineaId: "contenido_estatico", hallazgoIds: ["H2"] },
      { lineaId: "planificacion_contenido", hallazgoIds: ["H2"] },
    ]);
  });

  it("un servicio compuesto justifica las dos líneas que lo componen", () => {
    expect(lineasSugeridasV2([hallazgo("H3", "Desarrollo y optimización web y Meta Ads")])).toEqual(
      [
        { lineaId: "meta_ads", hallazgoIds: ["H3"] },
        { lineaId: "diseno_web", hallazgoIds: ["H3"] },
      ],
    );
  });

  it("varios hallazgos sobre la misma línea acumulan sin repetir", () => {
    const sugeridas = lineasSugeridasV2([
      hallazgo("H4", "Meta Ads"),
      hallazgo("H5", "Meta Ads y Google Ads"),
      hallazgo("H4", "Meta Ads"),
    ]);
    expect(sugeridas).toEqual([
      { lineaId: "meta_ads", hallazgoIds: ["H4", "H5"] },
      { lineaId: "google_ads", hallazgoIds: ["H5"] },
    ]);
  });

  it("las sugerencias salen en el orden del catálogo, no en el de los hallazgos", () => {
    const sugeridas = lineasSugeridasV2([
      hallazgo("H6", "Diseño de marca"),
      hallazgo("H7", "Meta Ads"),
      hallazgo("H8", "Desarrollo y optimización web"),
    ]);
    expect(sugeridas.map((s) => s.lineaId)).toEqual(["meta_ads", "diseno_web", "branding"]);
  });

  it("los hallazgos que no son de capa 'servicio' no sugieren nada", () => {
    expect(
      lineasSugeridasV2([
        hallazgo("H9", "Meta Ads", "recomendacion"),
        hallazgo("H10", "Meta Ads", "contexto"),
        hallazgo("H11", null),
      ]),
    ).toEqual([]);
  });

  it("sin hallazgos, ninguna línea llega premarcada: las diez arrancan desmarcadas", () => {
    expect(lineasSugeridasV2([])).toEqual([]);
  });

  it("un servicio fuera del catálogo v1 no sugiere nada (no se inventa traducción)", () => {
    expect(lineasSugeridasV2([hallazgo("H12", "Email marketing")])).toEqual([]);
    expect(lineasSugeridasV2([hallazgo("H13", "Influencer marketing")])).toEqual([]);
  });

  it("Q2: NINGUNA combinación de servicios v1 puede sugerir las dos líneas manuales", () => {
    // Barrido exhaustivo de los 64 subconjuntos de los seis servicios v1,
    // más los compuestos que el mapeo real emite.
    const compuestos = ["Desarrollo y optimización web y Meta Ads", "Meta Ads y Google Ads"];
    const universo = [...SERVICIOS, ...compuestos];

    for (let mascara = 0; mascara < 1 << universo.length; mascara++) {
      const hallazgos = universo
        .filter((_, i) => (mascara >> i) & 1)
        .map((servicio, i) => hallazgo(`H-${mascara}-${i}`, servicio));
      const sugeridas = lineasSugeridasV2(hallazgos).map((s) => s.lineaId);
      for (const manual of LINEAS_SIN_ACTIVADOR_AUTOMATICO) {
        expect(sugeridas).not.toContain(manual);
      }
    }
  });

  it("toda sugerencia llega con al menos un hallazgo que la justifica", () => {
    const sugeridas = lineasSugeridasV2([
      hallazgo("H14", "Planificación y creación de contenido"),
      hallazgo("H15", "Product Ads"),
    ]);
    expect(sugeridas.length).toBeGreaterThan(0);
    for (const s of sugeridas) expect(s.hallazgoIds.length).toBeGreaterThan(0);
  });
});
