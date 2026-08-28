/**
 * Bloque de corrección de las tres incoherencias detectadas en los seis
 * escenarios demostrativos (`docs/loop-nocturno-2026-08-22-escenarios.md`),
 * verificadas acá contra el motor real (nunca un `DocumentContextV1` armado
 * a mano) y contra los mismos seis fixtures que originaron el hallazgo.
 *
 * Las tres correcciones:
 *  1. Un margen de contribución negativo calculado genera un hallazgo
 *     propio ("margen_negativo"), de prioridad máxima, por encima de
 *     cualquier otro; ninguna fuga que dependa del margen se valoriza
 *     mientras siga negativo (`src/lib/calculo-diagnostico.ts`,
 *     `src/lib/propuesta.ts`).
 *  2. La prioridad de un hallazgo ya no depende sólo de su monto absoluto:
 *     con el bloque económico en verde y la fuga por debajo de un umbral
 *     configurable de la facturación, baja de "alta" a "media"
 *     (`src/documents/domain/build-context.ts`).
 *  3. `mix_producto` y `product_ads` exigen evidencia real del problema
 *     (más de un producto declarado; ROAS real por debajo del breakeven),
 *     no sólo que el canal/estructura exista (`src/lib/propuesta.ts`).
 */
import { describe, expect, it } from "vitest";
import { calcularDiagnostico, type ConfiguracionCalculo } from "../lib/calculo-diagnostico";
import { ESCENARIOS_DEMOSTRATIVOS, configuracionEscenariosDemo } from "../lib/fixtures-escenarios-demo";
import { DATOS_INICIALES, type DatosDiagnostico } from "../lib/diagnostico-form";
import { mapearHallazgos } from "../lib/propuesta";
import { buildDocumentContext } from "./domain";
import { buildDiagnosticoDocument } from "./templates/velocentum-v1/diagnostico";
import type { DocumentBlock, DocumentModel } from "./templates/velocentum-v1/types";

function blocksOf<T extends DocumentBlock["type"]>(
  model: DocumentModel,
  type: T,
): Array<Extract<DocumentBlock, { type: T }>> {
  return model.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<DocumentBlock, { type: T }> => block.type === type);
}

function contextoDeEscenario(id: string) {
  const escenario = ESCENARIOS_DEMOSTRATIVOS.find((e) => e.id === id);
  if (!escenario) throw new Error(`Escenario demostrativo no encontrado: ${id}`);
  const resultado = calcularDiagnostico(escenario.datos, configuracionEscenariosDemo);
  const contexto = buildDocumentContext({
    datos: escenario.datos,
    resultado,
    diagnostico: { id: `correccion-${id}`, version: 1, fecha: "2026-08-23" },
    tipoDocumento: "diagnostico",
  });
  return { escenario, resultado, contexto };
}

describe("1 · margen negativo (escenario 4) genera un hallazgo propio de prioridad máxima", () => {
  it("'margen_negativo' aparece primero, con prioridad alta, y ninguna fuga que dependa del margen queda valorizada", () => {
    const { resultado, contexto } = contextoDeEscenario("4-roas-bueno-margen-negativo");

    // Premisa: el margen está calculado y es negativo (no retenido, no nulo).
    expect(resultado.derivados.margen_contribucion).not.toBeNull();
    expect(resultado.derivados.margen_contribucion as number).toBeLessThan(0);

    expect(contexto.hallazgos.length).toBeGreaterThan(0);
    expect(contexto.hallazgos[0]?.id).toBe("margen_negativo");
    expect(contexto.hallazgos[0]?.prioridad).toBe("alta");

    // Por encima de cualquier otro en "Hallazgos priorizados" y en
    // "Prioridades inmediatas" (el orden del array es el que consumen
    // ambas secciones, ver shared.ts).
    const model = buildDiagnosticoDocument(contexto);
    const hallazgosBlock = blocksOf(model, "findings")[0];
    expect(hallazgosBlock?.items[0]?.id).toBe("margen_negativo");
    const seccionPrioridades = model.sections.find((s) => s.id === "immediate-priorities");
    expect(seccionPrioridades).toBeDefined();
    const itemsPrioridades = (
      seccionPrioridades!.blocks[0] as Extract<DocumentBlock, { type: "findings" }>
    ).items;
    expect(itemsPrioridades[0]?.id).toBe("margen_negativo");

    // Ninguna fuga que dependa del margen queda valorizada: ni calculable
    // ni con un monto (multiplicar por un margen negativo daría una
    // "oportunidad" negativa, que no significa nada).
    for (const fuga of resultado.fugas) {
      if (fuga.usa_margen === true) {
        expect(fuga.calculable).toBe(false);
        expect(fuga.monto).toBeNull();
      }
    }
    expect(resultado.oportunidad_total).toBe(0);
  });
});

describe("2 · la prioridad pondera el peso de la fuga contra la facturación y la salud del bloque económico (escenario 5)", () => {
  it("un negocio sano (economía en verde) con fugas individualmente chicas frente a la facturación no queda con prioridad alta en ninguna, o a lo sumo en una que realmente lo justifique", () => {
    const { resultado, contexto } = contextoDeEscenario("5-todo-sano");

    expect(resultado.estados_bloque.economia).toBe("verde");

    const altas = contexto.hallazgos.filter((h) => h.prioridad === "alta");
    expect(altas.length).toBeLessThanOrEqual(1);

    // Sanity: el escenario sigue teniendo hallazgos reales (no se vació la
    // lectura, sólo bajó la urgencia).
    expect(contexto.hallazgos.length).toBeGreaterThan(0);
  });
});

describe("3 · mix_producto y product_ads exigen evidencia real del problema, no sólo estructura de canal (escenario 1)", () => {
  it("con un solo producto declarado (100% de participación en uno solo), mix_producto no se genera aunque haya dos canales de comisión distinta", () => {
    const { escenario, contexto } = contextoDeEscenario("1-marketplace-fuerte-tienda-floja");

    // Premisa: efectivamente hay un solo producto cargado.
    expect(escenario.datos.producto_1_pct_facturacion).toBe(100);
    expect(escenario.datos.producto_2_pct_facturacion).toBeNull();
    expect(escenario.datos.producto_3_pct_facturacion).toBeNull();

    expect(contexto.hallazgos.map((h) => h.id)).not.toContain("mix_producto");
  });

  it("con Product Ads rindiendo 10x, muy por encima del punto de equilibrio (2,69x), product_ads no se genera", () => {
    const { resultado, contexto } = contextoDeEscenario("1-marketplace-fuerte-tienda-floja");

    // Premisa: hay ROAS real calculable y está por encima del breakeven —
    // el caso exacto que antes disparaba el hallazgo igual, sin comparar nada.
    expect(resultado.derivados.roas_product_ads).not.toBeNull();
    expect(resultado.derivados.breakeven_roas).not.toBeNull();
    expect(resultado.derivados.roas_product_ads as number).toBeGreaterThan(
      resultado.derivados.breakeven_roas as number,
    );

    expect(contexto.hallazgos.map((h) => h.id)).not.toContain("product_ads");
  });

  it("otros hallazgos reales del escenario 1 (estructura de cuenta, tramos de funnel) siguen intactos: el filtro no se llevó nada de más", () => {
    const { contexto } = contextoDeEscenario("1-marketplace-fuerte-tienda-floja");
    const ids = contexto.hallazgos.map((h) => h.id);
    expect(ids).toContain("estructura_cuenta");
    expect(ids).toContain("funnel_navegacion");
    expect(ids).toContain("funnel_carrito");
    expect(ids).toContain("funnel_checkout");
  });
});

describe("3b · mix_producto y product_ads SÍ disparan con evidencia real (caso positivo, datos sintéticos, no los seis escenarios demostrativos)", () => {
  const cfgMinima: ConfiguracionCalculo = {
    reserva_default: 0.35,
    comision_plataforma: { tiendanube_esencial: 0 },
    comision_pasarela: { mercado_pago: 0 },
  };

  it("mix_producto dispara cuando el producto de mayor facturación tiene margen real por debajo del ponderado (dos productos, mismo canal)", () => {
    const datos: DatosDiagnostico = {
      ...DATOS_INICIALES,
      nombre_tienda: "Mix positivo",
      plataforma: "tiendanube",
      plan_plataforma: "esencial",
      pasarela: "mercado_pago",
      facturacion_mensual: 5_000_000,
      ticket_promedio: 20_000,
      costo_envio_promedio: 0,
      canal_tienda_pct: 100,
      canal_ml_no_aplica: true,
      producto_1_nombre: "Producto caro de fabricar",
      producto_1_costo: 78,
      producto_1_precio: 100,
      producto_1_pct_facturacion: 70,
      producto_2_nombre: "Producto barato de fabricar",
      producto_2_costo: 30,
      producto_2_precio: 100,
      producto_2_pct_facturacion: 30,
      inversion_meta: 100_000,
    };
    const resultado = calcularDiagnostico(datos, cfgMinima);
    // Premisa: el producto principal (70% de la facturación) tiene margen
    // real por debajo del ponderado — el desalineamiento que el hallazgo
    // dice describir.
    expect(resultado.derivados.margenes_producto[0]).toBeLessThan(
      resultado.derivados.margen_contribucion as number,
    );
    const hallazgos = mapearHallazgos(
      datos,
      resultado.derivados,
      resultado.estados_bloque,
      resultado.fugas,
    );
    expect(hallazgos.map((h) => h.id)).toContain("mix_producto");
  });

  it("product_ads dispara cuando el ROAS real de Product Ads está por debajo del punto de equilibrio", () => {
    const datos: DatosDiagnostico = {
      ...DATOS_INICIALES,
      nombre_tienda: "Product Ads positivo",
      plataforma: "tiendanube",
      plan_plataforma: "esencial",
      pasarela: "mercado_pago",
      facturacion_mensual: 5_000_000,
      ticket_promedio: 20_000,
      costo_envio_promedio: 0,
      canal_tienda_pct: 0,
      vende_mercado_libre: true,
      canal_ml_pct: 100,
      producto_1_nombre: "Producto",
      producto_1_costo: 50,
      producto_1_precio: 100,
      producto_1_pct_facturacion: 100,
      ml_product_ads: true,
      ml_ventas_product_ads: 100_000,
      ml_inversion_product_ads: 100_000,
    };
    const resultado = calcularDiagnostico(datos, cfgMinima);
    // Premisa: ROAS real calculable y por debajo del breakeven.
    expect(resultado.derivados.roas_product_ads).not.toBeNull();
    expect(resultado.derivados.breakeven_roas).not.toBeNull();
    expect(resultado.derivados.roas_product_ads as number).toBeLessThan(
      resultado.derivados.breakeven_roas as number,
    );
    const hallazgos = mapearHallazgos(
      datos,
      resultado.derivados,
      resultado.estados_bloque,
      resultado.fugas,
    );
    expect(hallazgos.map((h) => h.id)).toContain("product_ads");
  });
});

describe("4 · los cinco escenarios restantes no cambian su lectura salvo por la prioridad", () => {
  const restantes = [
    "1-marketplace-fuerte-tienda-floja",
    "2-margen-alto-volumen-bajo",
    "3-margen-fino-volumen-alto",
    "5-todo-sano",
    "6-solo-organico",
  ];

  it.each(restantes)("%s: nunca aparece 'margen_negativo' (ninguno tiene margen calculado negativo)", (id) => {
    const { resultado, contexto } = contextoDeEscenario(id);
    if (resultado.derivados.margen_contribucion !== null) {
      expect(resultado.derivados.margen_contribucion).toBeGreaterThanOrEqual(0);
    }
    expect(contexto.hallazgos.map((h) => h.id)).not.toContain("margen_negativo");
  });

  it.each(restantes)(
    "%s: cada hallazgo con monto sigue coincidiendo exactamente con la fuga que lo originó (sólo la prioridad puede cambiar)",
    (id) => {
      const { resultado, contexto } = contextoDeEscenario(id);
      const fugasPorId = new Map(resultado.fugas.map((f) => [f.id, f]));
      for (const hallazgo of contexto.hallazgos) {
        const fuga = fugasPorId.get(hallazgo.id);
        if (!fuga || fuga.monto === null || !fuga.calculable) continue;
        expect(hallazgo.monto).not.toBeNull();
        if (hallazgo.monto!.estado === "disponible") {
          expect(hallazgo.monto!.valor).toBe(fuga.monto);
        }
      }
    },
  );

  it("escenario 3 (economía en amarillo, no verde): la regla de ponderación no aplica, los tres tramos de funnel siguen en prioridad alta", () => {
    const { resultado, contexto } = contextoDeEscenario("3-margen-fino-volumen-alto");
    expect(resultado.estados_bloque.economia).toBe("amarillo");
    const prioridades = new Map(contexto.hallazgos.map((h) => [h.id, h.prioridad]));
    expect(prioridades.get("funnel_navegacion")).toBe("alta");
    expect(prioridades.get("funnel_carrito")).toBe("alta");
    expect(prioridades.get("funnel_checkout")).toBe("alta");
  });

  it("escenario 6 (sin inversión publicitaria, economía sin datos): la regla no aplica, los tres tramos de funnel siguen en prioridad alta", () => {
    const { resultado, contexto } = contextoDeEscenario("6-solo-organico");
    expect(resultado.estados_bloque.economia).toBe("sin_datos");
    const prioridades = new Map(contexto.hallazgos.map((h) => [h.id, h.prioridad]));
    expect(prioridades.get("funnel_navegacion")).toBe("alta");
    expect(prioridades.get("funnel_carrito")).toBe("alta");
    expect(prioridades.get("funnel_checkout")).toBe("alta");
  });
});
