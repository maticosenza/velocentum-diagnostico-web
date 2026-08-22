/**
 * Fase 13 (paquetes y precios, decisión comercial 7, 2026-08-22): la
 * escalera de hasta tres niveles, ligada a hallazgos concretos, precios
 * siempre vacíos.
 */
import { describe, expect, it } from "vitest";
import {
  generarEscaleraPaquetes,
  normalizarEscaleraConfirmada,
  serviciosCanonicosDe,
  serviciosJustificados,
  type ConfigPaquetes,
} from "./paquetes";
import type { HallazgoMapeado } from "./propuesta";

function hallazgo(id: string, servicio: string | null, capa: HallazgoMapeado["capa"] = "servicio"): HallazgoMapeado {
  return { id, titulo: `Hallazgo ${id}`, capa, servicio };
}

describe("serviciosCanonicosDe: extrae servicios del catálogo, incluso de strings compuestos", () => {
  it("un servicio simple se reconoce tal cual", () => {
    expect(serviciosCanonicosDe("Meta Ads")).toEqual(["Meta Ads"]);
  });

  it("un compuesto 'A y B' reconoce los dos servicios por separado", () => {
    expect(serviciosCanonicosDe("Desarrollo y optimización web y Meta Ads")).toEqual([
      "Meta Ads",
      "Desarrollo y optimización web",
    ]);
  });

  it("null no reconoce ningún servicio", () => {
    expect(serviciosCanonicosDe(null)).toEqual([]);
  });

  it("un string que no es ninguno de los seis no reconoce nada", () => {
    expect(serviciosCanonicosDe("Consultoría genérica")).toEqual([]);
  });
});

describe("serviciosJustificados: sólo hallazgos de capa servicio, en el orden del catálogo", () => {
  it("ignora hallazgos de capa recomendación o contexto", () => {
    const h = [
      hallazgo("a", "Meta Ads", "recomendacion"),
      hallazgo("b", "Google Ads", "contexto"),
    ];
    expect(serviciosJustificados(h)).toEqual([]);
  });

  it("agrupa varios hallazgos que justifican el mismo servicio, sin duplicar el id", () => {
    const h = [hallazgo("a", "Meta Ads"), hallazgo("b", "Meta Ads")];
    const r = serviciosJustificados(h);
    expect(r).toHaveLength(1);
    expect(r[0]!.servicio).toBe("Meta Ads");
    expect(r[0]!.hallazgoIds).toEqual(["a", "b"]);
  });

  it("respeta el orden fijo del catálogo, no el orden de llegada de los hallazgos", () => {
    const h = [hallazgo("a", "Diseño de marca"), hallazgo("b", "Meta Ads")];
    const r = serviciosJustificados(h);
    expect(r.map((x) => x.servicio)).toEqual(["Meta Ads", "Diseño de marca"]);
  });

  it("un hallazgo compuesto justifica los dos servicios que menciona", () => {
    const h = [hallazgo("a", "Meta Ads y Google Ads")];
    const r = serviciosJustificados(h);
    expect(r.map((x) => x.servicio)).toEqual(["Meta Ads", "Google Ads"]);
    expect(r[0]!.hallazgoIds).toEqual(["a"]);
    expect(r[1]!.hallazgoIds).toEqual(["a"]);
  });
});

describe("generarEscaleraPaquetes: escalera acumulativa, precios vacíos, nunca más de tres niveles", () => {
  it("sin ningún hallazgo de servicio, no hay ningún nivel (no se propone un paquete sin fundamento)", () => {
    const e = generarEscaleraPaquetes([hallazgo("a", "Meta Ads", "recomendacion")]);
    expect(e.niveles).toEqual([]);
    expect(e.confirmado).toBe(false);
  });

  it("con un solo servicio justificado, hay un solo nivel", () => {
    const e = generarEscaleraPaquetes([hallazgo("a", "Meta Ads")]);
    expect(e.niveles).toHaveLength(1);
    expect(e.niveles[0]!.id).toBe("impulso");
    expect(e.niveles[0]!.servicios.map((s) => s.servicio)).toEqual(["Meta Ads"]);
  });

  it("nunca genera más de tres niveles, aunque haya seis servicios justificados", () => {
    const h = [
      hallazgo("a", "Meta Ads"),
      hallazgo("b", "Google Ads"),
      hallazgo("c", "Product Ads"),
      hallazgo("d", "Desarrollo y optimización web"),
      hallazgo("e", "Planificación y creación de contenido"),
      hallazgo("f", "Diseño de marca"),
    ];
    const e = generarEscaleraPaquetes(h);
    expect(e.niveles).toHaveLength(3);
    expect(e.niveles.map((n) => n.id)).toEqual(["impulso", "traccion", "escala"]);
  });

  it("escalera acumulativa: cada nivel incluye todos los servicios del anterior, más alguno nuevo", () => {
    const h = [
      hallazgo("a", "Meta Ads"),
      hallazgo("b", "Google Ads"),
      hallazgo("c", "Product Ads"),
      hallazgo("d", "Desarrollo y optimización web"),
    ];
    const e = generarEscaleraPaquetes(h);
    const listasDeServicios = e.niveles.map((n) => n.servicios.map((s) => s.servicio));
    for (let i = 1; i < listasDeServicios.length; i++) {
      const anterior = listasDeServicios[i - 1]!;
      const actual = listasDeServicios[i]!;
      expect(actual.length).toBeGreaterThan(anterior.length);
      for (const servicio of anterior) expect(actual).toContain(servicio);
    }
  });

  it("los precios siempre quedan vacíos (null), el sistema nunca inventa uno", () => {
    const e = generarEscaleraPaquetes([hallazgo("a", "Meta Ads"), hallazgo("b", "Google Ads")]);
    for (const nivel of e.niveles) expect(nivel.precio).toBeNull();
  });

  it("cada servicio de cada nivel trae el/los hallazgos concretos que lo justifican, nunca vacío", () => {
    const e = generarEscaleraPaquetes([hallazgo("a", "Meta Ads")]);
    for (const nivel of e.niveles) {
      for (const s of nivel.servicios) {
        expect(s.hallazgoIds.length).toBeGreaterThan(0);
        expect(s.propuestoPorSistema).toBe(true);
      }
    }
  });

  it("Meta Ads y Google Ads usan la unidad 'campañas activas'", () => {
    const e = generarEscaleraPaquetes([hallazgo("a", "Meta Ads"), hallazgo("b", "Google Ads")]);
    const servicios = e.niveles.flatMap((n) => n.servicios);
    expect(servicios.find((s) => s.servicio === "Meta Ads")!.unidad).toBe("campañas_activas");
    expect(servicios.find((s) => s.servicio === "Google Ads")!.unidad).toBe("campañas_activas");
  });

  it("Product Ads usa la unidad 'campañas'", () => {
    const e = generarEscaleraPaquetes([hallazgo("a", "Product Ads")]);
    expect(e.niveles[0]!.servicios[0]!.unidad).toBe("campañas");
  });

  it("contenido usa la unidad 'piezas por mes'", () => {
    const e = generarEscaleraPaquetes([hallazgo("a", "Planificación y creación de contenido")]);
    expect(e.niveles[0]!.servicios[0]!.unidad).toBe("piezas_por_mes");
  });

  it("web y branding usan 'alcance descrito', sin cantidad numérica", () => {
    const e = generarEscaleraPaquetes([
      hallazgo("a", "Desarrollo y optimización web"),
      hallazgo("b", "Diseño de marca"),
    ]);
    const servicios = e.niveles.flatMap((n) => n.servicios);
    for (const s of servicios) {
      expect(s.unidad).toBe("alcance_descrito");
      expect(s.cantidad).toBeNull();
      expect(s.descripcion).not.toBeNull();
    }
  });

  it("la cantidad de un servicio numérico escala con el índice del nivel (nivel 1 = base, nivel 2 = base*2)", () => {
    const h = [
      hallazgo("a", "Meta Ads"),
      hallazgo("b", "Google Ads"),
      hallazgo("c", "Product Ads"),
      hallazgo("d", "Desarrollo y optimización web"),
    ];
    const cfg: ConfigPaquetes = { paquetes_cantidad_base_meta_ads: 2 };
    const e = generarEscaleraPaquetes(h, cfg);
    const metaAdsPorNivel = e.niveles.map(
      (n) => n.servicios.find((s) => s.servicio === "Meta Ads")?.cantidad ?? null,
    );
    // Meta Ads está en los tres niveles (es el primero en el orden del catálogo).
    expect(metaAdsPorNivel).toEqual([2, 4, 6]);
  });

  it("nombres de nivel configurables", () => {
    const cfg: ConfigPaquetes = { paquetes_nombres_niveles: ["Arranque", "Crecimiento", "Dominancia"] };
    const e = generarEscaleraPaquetes([hallazgo("a", "Meta Ads")], cfg);
    expect(e.niveles[0]!.nombre).toBe("Arranque");
  });

  it("un servicio sin ningún hallazgo que lo respalde nunca aparece en ningún nivel", () => {
    const e = generarEscaleraPaquetes([hallazgo("a", "Meta Ads")]);
    const servicios = new Set(e.niveles.flatMap((n) => n.servicios.map((s) => s.servicio)));
    expect(servicios.has("Diseño de marca")).toBe(false);
    expect(servicios.has("Google Ads")).toBe(false);
  });
});

describe("normalizarEscaleraConfirmada (lectura de la escalera persistida, decisión 9)", () => {
  it("acepta una escalera confirmada con la forma mínima esperada", () => {
    const guardado = { confirmado: true, niveles: [{ id: "impulso", nombre: "IMPULSO", servicios: [], precio: null }] };
    const r = normalizarEscaleraConfirmada(guardado);
    expect(r).toEqual(guardado);
  });

  it("rechaza un valor sin confirmado:true", () => {
    expect(normalizarEscaleraConfirmada({ confirmado: false, niveles: [] })).toBeNull();
    expect(normalizarEscaleraConfirmada({ niveles: [] })).toBeNull();
  });

  it("rechaza un valor sin niveles como array", () => {
    expect(normalizarEscaleraConfirmada({ confirmado: true })).toBeNull();
    expect(normalizarEscaleraConfirmada({ confirmado: true, niveles: "no es un array" })).toBeNull();
  });

  it("rechaza null, undefined y valores no-objeto", () => {
    expect(normalizarEscaleraConfirmada(null)).toBeNull();
    expect(normalizarEscaleraConfirmada(undefined)).toBeNull();
    expect(normalizarEscaleraConfirmada("texto")).toBeNull();
  });
});
