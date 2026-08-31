/**
 * BV4 · F2a etapa 4 — cantidades precargadas por nivel y selección inicial.
 */
import { describe, expect, it } from "vitest";
import {
  CANTIDAD_PRECARGADA_POR_NIVEL,
  cambiarNivelV2,
  cantidadPrecargada,
  ETIQUETA_UNIDAD_V2,
  seleccionInicialV2,
} from "./precargas-v2";
import { CATALOGO_COMERCIAL_V2, LINEAS_V2_IDS, lineasSugeridasV2 } from "./catalogo-v2";
import { totalDeLinea, type SeleccionComercialV2 } from "./seleccion-comercial-v2";
import type { HallazgoMapeado } from "./propuesta";

function hallazgo(id: string, servicio: string): HallazgoMapeado {
  return { id, titulo: `Hallazgo ${id}`, capa: "servicio", servicio };
}

function cantidadDe(seleccion: SeleccionComercialV2, lineaId: string): number | null {
  const linea = seleccion.lineas.find((l) => l.lineaId === lineaId)!;
  return linea.precio.modo === "unitario" ? linea.precio.cantidad : null;
}

describe("cantidades precargadas por nivel (§4 de la espec. original)", () => {
  it("contenido audiovisual 10/15/20 y estático 12/18/24", () => {
    expect(CANTIDAD_PRECARGADA_POR_NIVEL["contenido_audiovisual"]).toEqual({
      impulso: 10,
      traccion: 15,
      escala: 20,
    });
    expect(CANTIDAD_PRECARGADA_POR_NIVEL["contenido_estatico"]).toEqual({
      impulso: 12,
      traccion: 18,
      escala: 24,
    });
  });

  it("campañas hasta 3/5/7 CON CUPO POR PLATAFORMA: cada línea de pauta lleva el suyo", () => {
    for (const plataforma of ["meta_ads", "google_ads", "product_ads"] as const) {
      expect(CANTIDAD_PRECARGADA_POR_NIVEL[plataforma]).toEqual({
        impulso: 3,
        traccion: 5,
        escala: 7,
      });
    }
    // El cupo no es total: las tres juntas suman 21 en ESCALA, no 7.
    const total = (["meta_ads", "google_ads", "product_ads"] as const).reduce(
      (acc, id) => acc + (cantidadPrecargada(id, "escala") ?? 0),
      0,
    );
    expect(total).toBe(21);
  });

  it("las líneas sin cifra confirmada quedan sin precarga: no se inventa ninguna", () => {
    for (const nivel of ["impulso", "traccion", "escala"] as const) {
      expect(cantidadPrecargada("influencer_marketing", nivel)).toBeNull();
      expect(cantidadPrecargada("desarrollo_web_custom", nivel)).toBeNull();
      expect(cantidadPrecargada("branding", nivel)).toBeNull();
      expect(cantidadPrecargada("diseno_web", nivel)).toBeNull();
      expect(cantidadPrecargada("planificacion_contenido", nivel)).toBeNull();
    }
  });

  it("toda precarga crece o se mantiene al subir de nivel, nunca baja", () => {
    for (const [, porNivel] of Object.entries(CANTIDAD_PRECARGADA_POR_NIVEL)) {
      expect(porNivel!.traccion).toBeGreaterThanOrEqual(porNivel!.impulso);
      expect(porNivel!.escala).toBeGreaterThanOrEqual(porNivel!.traccion);
    }
  });

  it("hay una etiqueta de unidad para cada unidad del catálogo", () => {
    for (const linea of CATALOGO_COMERCIAL_V2.lineas) {
      expect(ETIQUETA_UNIDAD_V2[linea.unidad]).toBeTruthy();
    }
  });
});

describe("seleccionInicialV2: con qué abre el panel", () => {
  it("siempre las diez líneas, en el orden del catálogo", () => {
    const seleccion = seleccionInicialV2({ nivel: "impulso", sugeridas: [] });
    expect(seleccion.lineas.map((l) => l.lineaId)).toEqual([...LINEAS_V2_IDS]);
  });

  it("marca las sugeridas por el diagnóstico y deja el resto desmarcado", () => {
    const sugeridas = lineasSugeridasV2([hallazgo("H1", "Meta Ads")]);
    const seleccion = seleccionInicialV2({ nivel: "impulso", sugeridas });
    const marcadas = seleccion.lineas.filter((l) => l.seleccionada).map((l) => l.lineaId);
    expect(marcadas).toEqual(["meta_ads"]);
  });

  it("Q1: un hallazgo de contenido marca las tres líneas del grupo", () => {
    const sugeridas = lineasSugeridasV2([hallazgo("H2", "Planificación y creación de contenido")]);
    const seleccion = seleccionInicialV2({ nivel: "traccion", sugeridas });
    const marcadas = seleccion.lineas.filter((l) => l.seleccionada).map((l) => l.lineaId);
    expect(marcadas).toEqual([
      "contenido_audiovisual",
      "contenido_estatico",
      "planificacion_contenido",
    ]);
  });

  it("Q8: elegir TRACCIÓN o ESCALA no preselecciona diseño web", () => {
    for (const nivel of ["impulso", "traccion", "escala"] as const) {
      const seleccion = seleccionInicialV2({ nivel, sugeridas: [] });
      expect(seleccion.lineas.find((l) => l.lineaId === "diseno_web")!.seleccionada).toBe(false);
    }
  });

  it("Q8: diseño web sólo llega marcado por un hallazgo compatible", () => {
    const sugeridas = lineasSugeridasV2([hallazgo("H3", "Desarrollo y optimización web")]);
    const seleccion = seleccionInicialV2({ nivel: "escala", sugeridas });
    expect(seleccion.lineas.find((l) => l.lineaId === "diseno_web")!.seleccionada).toBe(true);
  });

  it("carga las cantidades del nivel, incluso en las líneas desmarcadas", () => {
    const seleccion = seleccionInicialV2({ nivel: "escala", sugeridas: [] });
    expect(cantidadDe(seleccion, "contenido_audiovisual")).toBe(20);
    expect(cantidadDe(seleccion, "contenido_estatico")).toBe(24);
    expect(cantidadDe(seleccion, "meta_ads")).toBe(7);
    expect(cantidadDe(seleccion, "influencer_marketing")).toBeNull();
  });

  it("el precio queda SIEMPRE vacío: el sistema nunca inventa un precio", () => {
    const sugeridas = lineasSugeridasV2([hallazgo("H4", "Meta Ads")]);
    const seleccion = seleccionInicialV2({ nivel: "escala", sugeridas });
    for (const linea of seleccion.lineas) expect(totalDeLinea(linea)).toBeNull();
  });

  it("no arranca con ningún agregado marcado", () => {
    expect(seleccionInicialV2({ nivel: "escala", sugeridas: [] }).agregados).toEqual([]);
  });
});

describe("cambiarNivelV2: la sugerencia no pisa una decisión", () => {
  it("reajusta las cantidades que seguían en la precarga anterior", () => {
    const inicial = seleccionInicialV2({ nivel: "impulso", sugeridas: [] });
    expect(cantidadDe(inicial, "contenido_audiovisual")).toBe(10);

    const enEscala = cambiarNivelV2(inicial, "escala");
    expect(enEscala.nivel).toBe("escala");
    expect(cantidadDe(enEscala, "contenido_audiovisual")).toBe(20);
    expect(cantidadDe(enEscala, "meta_ads")).toBe(7);
  });

  it("NO pisa una cantidad editada a mano", () => {
    const inicial = seleccionInicialV2({ nivel: "impulso", sugeridas: [] });
    const editada: SeleccionComercialV2 = {
      ...inicial,
      lineas: inicial.lineas.map((l) =>
        l.lineaId === "contenido_audiovisual" && l.precio.modo === "unitario"
          ? { ...l, precio: { ...l.precio, cantidad: 33 } }
          : l,
      ),
    };
    const enEscala = cambiarNivelV2(editada, "escala");
    expect(cantidadDe(enEscala, "contenido_audiovisual")).toBe(33);
    // Las que no se tocaron sí se reajustan.
    expect(cantidadDe(enEscala, "contenido_estatico")).toBe(24);
  });

  it("completa una cantidad vacía con la precarga del nivel nuevo", () => {
    const inicial = seleccionInicialV2({ nivel: "impulso", sugeridas: [] });
    const vaciada: SeleccionComercialV2 = {
      ...inicial,
      lineas: inicial.lineas.map((l) =>
        l.lineaId === "meta_ads" && l.precio.modo === "unitario"
          ? { ...l, precio: { ...l.precio, cantidad: null } }
          : l,
      ),
    };
    expect(cantidadDe(cambiarNivelV2(vaciada, "traccion"), "meta_ads")).toBe(5);
  });

  it("no toca precios, marcas, recurrencias ni rutas", () => {
    const inicial = seleccionInicialV2({
      nivel: "impulso",
      sugeridas: lineasSugeridasV2([hallazgo("H5", "Desarrollo y optimización web")]),
    });
    const cargada: SeleccionComercialV2 = {
      ...inicial,
      lineas: inicial.lineas.map((l) =>
        l.lineaId === "diseno_web"
          ? {
              ...l,
              recurrencia: "mensual",
              ruta: "ambas",
              precio: { modo: "total", precioLinea: 700000 },
            }
          : l,
      ),
    };
    const enEscala = cambiarNivelV2(cargada, "escala");
    const web = enEscala.lineas.find((l) => l.lineaId === "diseno_web")!;
    expect(web.seleccionada).toBe(true);
    expect(web.recurrencia).toBe("mensual");
    expect(web.ruta).toBe("ambas");
    expect(totalDeLinea(web)).toBe(700000);
  });

  it("cambiar de nivel no cambia qué líneas están marcadas", () => {
    const inicial = seleccionInicialV2({
      nivel: "impulso",
      sugeridas: lineasSugeridasV2([hallazgo("H6", "Meta Ads")]),
    });
    const antes = inicial.lineas.map((l) => l.seleccionada);
    for (const nivel of ["traccion", "escala", "impulso"] as const) {
      expect(cambiarNivelV2(inicial, nivel).lineas.map((l) => l.seleccionada)).toEqual(antes);
    }
  });
});
