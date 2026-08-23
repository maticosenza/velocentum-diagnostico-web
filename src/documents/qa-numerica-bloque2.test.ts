/**
 * LOOP NOCTURNO, bloque 2 (2026-08-22): QA numérico completo.
 *
 * Cubre, con el motor real (nunca con un `DocumentContextV1` armado a
 * mano), los seis puntos pedidos explícitamente:
 *  1. cada cifra publicada coincide exactamente con su derivado de origen;
 *  2. ninguna suma cruza magnitudes económicas distintas;
 *  3. los valores retenidos se muestran como retenidos, nunca como cero;
 *  4. un cero real nunca se muestra como dato ausente;
 *  5. el margen total no aparece cuando la cobertura de productos es parcial;
 *  6. los precios están vacíos salvo confirmación manual explícita.
 *
 * Las frases prohibidas ya tienen cobertura exhaustiva y dedicada en
 * `copy-guardrails.test.ts` (recorre cada string de cada bloque, en las
 * tres plantillas, para varios casos): este archivo no la duplica, sólo la
 * referencia en el describe correspondiente.
 *
 * La prueba de punta a punta pedida (formulario → cálculo → contexto
 * documental → modelo → render web y PDF) vive aparte, en
 * `renderers/pdf/qa-e2e-formulario-a-pdf.test.ts`, porque necesita el
 * renderer de PDF real.
 */
import { describe, expect, it } from "vitest";
import { calcularDiagnostico } from "../lib/calculo-diagnostico";
import {
  casoSnakeStore,
  casoSnakeStoreCoberturaCompleta,
  configuracionRegresionFase2,
} from "../lib/fixtures-casos";
import type { DatosDiagnostico } from "../lib/diagnostico-form";
import { buildDocumentContext } from "./domain";
import { fraseProhibidaEncontrada } from "./domain/resumen-comercial";
import { impactoCalculado, impactoRetenido, sumarImpactosPorTipo } from "../lib/impacto-economico";
import { buildDiagnosticoDocument } from "./templates/velocentum-v1/diagnostico";
import { buildPropuestaDocument } from "./templates/velocentum-v1/propuesta";
import { buildCommercialOffer } from "./templates/velocentum-v1/blocks";
import type { DocumentBlock, DocumentModel } from "./templates/velocentum-v1/types";
import type { SeleccionComercial } from "./domain/types";

function contexto(datos: DatosDiagnostico, tipoDocumento: "diagnostico" | "proyeccion_90d" | "propuesta") {
  const resultado = calcularDiagnostico(datos, configuracionRegresionFase2);
  return {
    resultado,
    contexto: buildDocumentContext({
      datos,
      resultado,
      diagnostico: { id: `qa-bloque2-${datos.nombre_tienda}`, version: 1, fecha: "2026-08-22" },
      tipoDocumento,
    }),
  };
}

function blocksOf<T extends DocumentBlock["type"]>(
  model: DocumentModel,
  type: T,
): Array<Extract<DocumentBlock, { type: T }>> {
  return model.sections
    .flatMap((section) => section.blocks)
    .filter((block): block is Extract<DocumentBlock, { type: T }> => block.type === type);
}

function stringsDe(valor: unknown, acc: string[] = []): string[] {
  if (typeof valor === "string") acc.push(valor);
  else if (Array.isArray(valor)) for (const item of valor) stringsDe(item, acc);
  else if (valor && typeof valor === "object") {
    for (const clave of Object.keys(valor)) stringsDe((valor as Record<string, unknown>)[clave], acc);
  }
  return acc;
}

// `casoSnakeStore`/`casoSnakeStoreCoberturaCompleta` no traen facturación ni
// política de envío: ambas quedan implícitas ("no declarada"/"no
// confirmada") a propósito, para que cada prueba de fixtures-casos.ts las
// fije según lo que necesita probar (mismo patrón que usan
// `copy-guardrails.test.ts` y `document-renderer.test.tsx`). Este archivo
// fija ambas explícitamente para que cada describe aísle una sola variable.
const FACTURACION_BASE = 24_681_357;

function conFacturacionYEnvioConfirmado(datos: DatosDiagnostico): DatosDiagnostico {
  return { ...datos, facturacion_mensual: FACTURACION_BASE, absorbe_costo_envio: false };
}

describe("1 · cada cifra publicada coincide exactamente con su derivado de origen", () => {
  it("facturación, ticket, pedidos y margen total del diagnóstico igualan a `derivados`, sin redondeo propio", () => {
    const datos = conFacturacionYEnvioConfirmado(casoSnakeStoreCoberturaCompleta);
    const { resultado, contexto: ctx } = contexto(datos, "diagnostico");

    expect(ctx.actual.facturacion.estado).toBe("calculado");
    expect(ctx.actual.facturacion.valor).toBe(FACTURACION_BASE);

    expect(ctx.actual.pedidos.estado).toBe("calculado");
    expect(ctx.actual.pedidos.valor).toBe(resultado.derivados.pedidos_mensuales);

    expect(ctx.actual.margenTotal.estado).toBe("calculado");
    expect(ctx.actual.margenTotal.valor).toBe(resultado.derivados.margen_contribucion);

    const model = buildDiagnosticoDocument(ctx);
    const metricas = blocksOf(model, "metric-grid").flatMap((b) => b.items);
    const margenItem = metricas.find((m) => m.id === "margenTotal");
    expect(margenItem).toBeDefined();
    expect(margenItem!.value?.value).toBe(resultado.derivados.margen_contribucion);
    const facturacionItem = metricas.find((m) => m.id === "facturacion");
    expect(facturacionItem!.value?.value).toBe(FACTURACION_BASE);
  });

  it("cada hallazgo con monto calculable coincide con el monto de la fuga que lo originó", () => {
    const datos = conFacturacionYEnvioConfirmado(casoSnakeStoreCoberturaCompleta);
    const { resultado, contexto: ctx } = contexto(datos, "diagnostico");
    const fugasPorId = new Map(resultado.fugas.map((f) => [f.id, f]));

    for (const hallazgo of ctx.hallazgos) {
      const fuga = fugasPorId.get(hallazgo.id);
      if (!fuga || fuga.monto === null || !fuga.calculable) continue;
      expect(hallazgo.monto).not.toBeNull();
      if (hallazgo.monto!.estado === "calculado") {
        expect(hallazgo.monto!.valor).toBe(fuga.monto);
      }
    }
  });
});

describe("2 · ninguna suma cruza magnitudes económicas", () => {
  it("sumarImpactosPorTipo nunca mezcla facturación, contribución y ahorro entre sí", () => {
    const impactos = [
      [
        impactoCalculado({ tipo: "facturacion_incremental", montoMensual: 1_000_000, confianza: "alta" }),
        impactoCalculado({ tipo: "contribucion_incremental", montoMensual: 300_000, confianza: "alta" }),
      ],
      [impactoCalculado({ tipo: "ahorro_publicitario", montoMensual: 50_000, confianza: "alta" })],
      [impactoCalculado({ tipo: "facturacion_incremental", montoMensual: 500_000, confianza: "alta" })],
    ];

    const facturacion = sumarImpactosPorTipo(impactos, "facturacion_incremental");
    const contribucion = sumarImpactosPorTipo(impactos, "contribucion_incremental");
    const ahorro = sumarImpactosPorTipo(impactos, "ahorro_publicitario");

    expect(facturacion).toEqual({ calculable: true, montoMensual: 1_500_000 });
    expect(contribucion).toEqual({ calculable: true, montoMensual: 300_000 });
    expect(ahorro).toEqual({ calculable: true, montoMensual: 50_000 });
    // Las tres magnitudes de un mismo escenario no son la misma cifra ni una
    // fracción entera la una de la otra "por casualidad de la suma".
    expect(facturacion.calculable && contribucion.calculable && facturacion.montoMensual).not.toBe(
      contribucion.calculable && contribucion.montoMensual,
    );
  });

  it("un impacto retenido en el tipo pedido bloquea todo el agregado, nunca suma sólo lo calculable", () => {
    const impactos = [
      [
        impactoCalculado({ tipo: "contribucion_incremental", montoMensual: 400_000, confianza: "alta" }),
      ],
      [impactoRetenido({ tipo: "contribucion_incremental", motivo: "Falta confirmar envío." })],
    ];
    const resultado = sumarImpactosPorTipo(impactos, "contribucion_incremental");
    expect(resultado.calculable).toBe(false);
  });

  it("el detalle mensual de un escenario real (motor real) nunca iguala facturación proyectada a la suma con contribución o ahorro", () => {
    const datosConOportunidad: DatosDiagnostico = {
      ...casoSnakeStoreCoberturaCompleta,
      facturacion_mensual: 22_522_600,
      visitas_mensuales: 5000,
      agregados_carrito: 1000,
      checkouts_iniciados: 300,
      absorbe_costo_envio: true,
      // Con inversión publicitaria en 0 (implícito, ni siquiera declarado)
      // `ahorroPublicitarioHabilitado` queda retenido en los tres meses y el
      // `continue` de abajo se dispara siempre: el `expect` nunca corre.
      // Con inversión real, al menos el mes 1 lo calcula.
      inversion_meta: 300_000,
      inversion_google: 200_000,
    };
    const { contexto: ctx } = contexto(datosConOportunidad, "proyeccion_90d");
    let mesesComparados = 0;
    let mesesConAhorroComparado = 0;
    for (const escenario of ctx.escenarios90d) {
      for (const mes of escenario.mensual) {
        if (
          mes.facturacionProyectada.estado !== "calculado" ||
          mes.contribucionIncrementalHabilitada.estado !== "calculado"
        ) {
          continue;
        }
        mesesComparados++;
        // facturacionProyectada ya es facturación actual + incremental habilitada:
        // sumarle contribución u ahorro daría una magnitud sin sentido de negocio.
        const facturacionMasContribucion =
          mes.facturacionProyectada.valor + mes.contribucionIncrementalHabilitada.valor;
        expect(mes.facturacionProyectada.valor).not.toBe(facturacionMasContribucion);

        if (mes.ahorroPublicitarioHabilitado.estado === "calculado") {
          mesesConAhorroComparado++;
          const facturacionMasAhorro =
            mes.facturacionProyectada.valor + mes.ahorroPublicitarioHabilitado.valor;
          expect(mes.facturacionProyectada.valor).not.toBe(facturacionMasAhorro);
        }
      }
    }
    // Sanity: si esto diera 0, el bloque de arriba pasaría sin haber
    // comparado nada (mismo defecto que auditoría encontró antes del fix:
    // el `continue` se disparaba siempre y ningún expect corría).
    expect(mesesComparados).toBeGreaterThan(0);
    // NOTA (investigado 2026-08-23, ver docs/loop-nocturno-2026-08-22-cierre.md
    // sección 3): con inversión declarada, `ahorroPublicitarioHabilitado`
    // sigue retenido en los tres meses de este fixture porque, con estos
    // datos, genuinamente no hay ahorro publicitario que recuperar — no es
    // un bug del motor. `mer_actual` (45.05) queda muy por encima de
    // `breakeven_roas` (1.565): la cuenta es rentable, así que la fuga
    // `gasto_no_rentable` ni siquiera se crea (sólo se agrega cuando
    // mer < breakeven). `sobrefragmentacion` queda retenida porque el
    // fixture no declara `conjuntos_activos`/`presupuesto_diario`. Sin
    // ninguna de las dos fuentes, `consolidarAhorroPublicitario()` no tiene
    // qué consolidar — la inversión declarada es sólo el tope del ahorro,
    // nunca una fuente de ahorro por sí misma. Por eso esta pierna no lleva
    // un `toBeGreaterThan(0)` propio: para ejercitarla, un fixture futuro
    // necesitaría un MER por debajo del breakeven o una estructura de
    // cuenta fragmentada (conjuntos_activos por encima del umbral
    // sostenible + presupuesto_diario), ninguno de los dos aplicado acá a
    // propósito (no se pidió corregir el fixture, sólo investigar). La
    // comparación de facturación vs. contribución arriba sí se ejercita
    // siempre (mesesComparados > 0).
    if (mesesConAhorroComparado === 0) {
      console.warn(
        "qa-numerica-bloque2: ningún mes calculó ahorroPublicitarioHabilitado; " +
          "la comparación facturación-vs-ahorro no se ejercitó en esta corrida.",
      );
    }
  });
});

describe("3 · los valores retenidos se muestran como retenidos, nunca como cero", () => {
  it("margen retenido por cobertura parcial (60%) nunca aparece como 0 en el contexto ni en el modelo", () => {
    // Envío confirmado a propósito (mismo motivo que en el punto 5): sin
    // esto, `envioBloqueaRentabilidad` retiene el margen por la política de
    // envío sin confirmar, no por la cobertura de productos, y el título de
    // esta prueba dejaría de ser cierto.
    const datos = conFacturacionYEnvioConfirmado(casoSnakeStore);
    const { resultado, contexto: ctx } = contexto(datos, "diagnostico");
    expect(resultado.derivados.cobertura_productos).toBeLessThan(100);
    expect(resultado.derivados.margen_contribucion).toBeNull();
    const margenTotal = ctx.actual.margenTotal;
    if (margenTotal.estado !== "retenido") throw new Error("margenTotal debía quedar retenido");
    expect(margenTotal.valor).toBeNull();
    expect(margenTotal.motivos.join(" ")).not.toMatch(/envío/i);

    const model = buildDiagnosticoDocument(ctx);
    const metricas = blocksOf(model, "metric-grid").flatMap((b) => b.items);
    expect(metricas.map((m) => m.id)).not.toContain("margenTotal");

    const restricciones = blocksOf(model, "restrictions").flatMap((b) => b.items);
    expect(restricciones.some((r) => r.id.includes("margenTotal") || r.id.includes("margen"))).toBe(
      true,
    );
  });
});

describe("4 · un cero real nunca se muestra como dato ausente", () => {
  const datosSinPauta: DatosDiagnostico = {
    ...conFacturacionYEnvioConfirmado(casoSnakeStoreCoberturaCompleta),
    inversion_meta: 0,
    inversion_google: 0,
  };

  it("inversión publicitaria en cero explícito llega calculada (no retenida, no ausente) al contexto documental", () => {
    const { resultado, contexto: ctx } = contexto(datosSinPauta, "diagnostico");
    expect(resultado.derivados.inversion_publicitaria_total).toBe(0);
    expect(resultado.derivados.hay_inversion_publicitaria).toBe(false);

    expect(ctx.actual.inversionTotal.estado).toBe("calculado");
    expect(ctx.actual.inversionTotal.valor).toBe(0);

    const model = buildDiagnosticoDocument(ctx);
    const metricas = blocksOf(model, "metric-grid").flatMap((b) => b.items);
    const inversionItem = metricas.find((m) => m.id === "inversionTotal");
    // Presencia en metric-grid ya implica "calculado" (buildMetricGrid
    // filtra cualquier ValorPublicable que no lo esté: ver blocks.ts).
    expect(inversionItem).toBeDefined();
    expect(inversionItem!.value.value).toBe(0);
  });
});

describe("5 · el margen total no aparece cuando la cobertura de productos es parcial", () => {
  it("60% de cobertura (casoSnakeStore) retiene el margen; 100% (CoberturaCompleta) lo calcula — con el resto de las variables (envío) fijo en ambas, para aislar la cobertura como única diferencia", () => {
    const parcial = contexto(conFacturacionYEnvioConfirmado(casoSnakeStore), "diagnostico");
    const completa = contexto(conFacturacionYEnvioConfirmado(casoSnakeStoreCoberturaCompleta), "diagnostico");

    expect(parcial.resultado.derivados.cobertura_productos).toBeLessThan(100);
    expect(parcial.resultado.derivados.margen_contribucion).toBeNull();
    expect(parcial.contexto.actual.margenTotal.estado).toBe("retenido");

    expect(completa.resultado.derivados.cobertura_productos).toBe(100);
    expect(completa.resultado.derivados.margen_contribucion).not.toBeNull();
    expect(completa.contexto.actual.margenTotal.estado).toBe("calculado");
  });
});

describe("6 · frases prohibidas: referencia a la cobertura exhaustiva existente", () => {
  it("los modelos armados en este archivo (motor real) tampoco contienen ninguna frase prohibida", () => {
    const { contexto: ctx } = contexto(casoSnakeStoreCoberturaCompleta, "diagnostico");
    const model = buildDiagnosticoDocument(ctx);
    for (const texto of stringsDe(model)) {
      expect(fraseProhibidaEncontrada(texto)).toBeNull();
    }
  });
});

describe("7 · los precios están vacíos salvo confirmación manual explícita", () => {
  it("el motor real nunca produce una selección comercial: el bloque de propuesta comercial no existe por defecto", () => {
    const { contexto: ctx } = contexto(casoSnakeStoreCoberturaCompleta, "propuesta");
    expect(ctx.comercial).toBeNull();
    const model = buildPropuestaDocument(ctx);
    expect(blocksOf(model, "commercial-offer")).toHaveLength(0);
  });

  it("buildCommercialOffer: sin aprobación manual no hay bloque; con aprobación pero sin `incluirPrecioEnPdf` el precio queda null", () => {
    const { contexto: ctx } = contexto(casoSnakeStoreCoberturaCompleta, "propuesta");

    const sinAprobar = buildCommercialOffer(ctx);
    expect(sinAprobar.block).toBeNull();

    const seleccion: SeleccionComercial = {
      aprobadaManualmente: true,
      paqueteId: "growth",
      nombre: "Growth 90 días",
      alcance: ["Medición"],
      exclusiones: [],
      entregables: ["Tablero"],
      duracionDias: 90,
      precio: { estado: "declarado", valor: 900_000, fuente: "seleccion-manual", periodo: null },
      formaPago: "Mensual",
      inicio: null,
      incluirPrecioEnPdf: false,
    };

    const aprobadaSinPrecio = buildCommercialOffer({ ...ctx, comercial: seleccion });
    expect(aprobadaSinPrecio.block).not.toBeNull();
    expect((aprobadaSinPrecio.block as { price: unknown }).price).toBeNull();

    const aprobadaConPrecio = buildCommercialOffer({
      ...ctx,
      comercial: { ...seleccion, incluirPrecioEnPdf: true },
    });
    expect((aprobadaConPrecio.block as { price: { value: number } }).price?.value).toBe(900_000);
  });
});
