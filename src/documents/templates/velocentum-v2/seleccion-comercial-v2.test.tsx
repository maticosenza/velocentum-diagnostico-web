/**
 * BV4 · F2a etapa 5 — la selección comercial v2 en la propuesta.
 *
 * Cubre el contrato documental, el bloque, el candado de exportación, los
 * textos verbatim, el desglose impreso en los dos perfiles, y el invariante
 * de Semana 0.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildDocumentContext, ofertaComercialDesdeSobreV2 } from "../../domain/build-context";
import { buildPropuestaDocumentV2 } from "./propuesta";
import { buildCommercialSelectionV2 } from "./blocks";
import type { DocumentBlockV2, DocumentModelV2 } from "./types";
import {
  MENSAJE_EXPORTACION_BLOQUEADA_FISCAL_V2,
  MENSAJE_EXPORTACION_BLOQUEADA_V2,
  verificarExportacionPermitidaV2,
} from "../../renderers/pdf-v2/gate-exportacion";
import { exportarDocumentModelV2 } from "../../renderers/pdf-v2/exportacion";
import { DocumentWebRendererV2 } from "../../renderers/web-v2/document-renderer";
import { calcularDiagnostico } from "../../../lib/calculo-diagnostico";
import { casoSnakeStore, configuracionRegresionFase2 } from "../../../lib/fixtures-casos";
import { LINEAS_V2_IDS, type LineaId } from "../../../lib/catalogo-v2";
import type { EscaleraPaquetesConfirmada } from "../../../lib/paquetes";
import { seleccionInicialV2 } from "../../../lib/precargas-v2";
import {
  lineaVaciaV2,
  type ConfiguracionFiscalV2,
  type SeleccionComercialV2,
  type SobreComercialV2,
} from "../../../lib/seleccion-comercial-v2";
import { TEXTOS_SERVICIOS_V2, NOTA_AL_PIE_CONTENIDO } from "../../../lib/textos-servicios-v2";

const FISCAL_OK: ConfiguracionFiscalV2 = { aplicaImpuesto: true, porcentaje: 21, confirmado: true };

function seleccionCargada(): SeleccionComercialV2 {
  const lineas = LINEAS_V2_IDS.map((id) => lineaVaciaV2(id as LineaId));
  const poner = (id: LineaId, cambios: Partial<(typeof lineas)[number]>) => {
    const i = lineas.findIndex((l) => l.lineaId === id);
    lineas[i] = { ...lineas[i]!, ...cambios } as (typeof lineas)[number];
  };
  poner("meta_ads", {
    seleccionada: true,
    recurrencia: "mensual",
    precio: { modo: "unitario", cantidad: 3, precioUnitario: 100000 },
  });
  poner("contenido_audiovisual", {
    seleccionada: true,
    recurrencia: "mensual",
    precio: { modo: "unitario", cantidad: 10, precioUnitario: 20000 },
  });
  poner("diseno_web", {
    seleccionada: true,
    recurrencia: "unica",
    ruta: "ambas",
    precio: { modo: "total", precioLinea: 800000 },
  });
  return {
    nivel: "traccion",
    lineas,
    agregados: [
      { agregadoId: "email_marketing", incluido: true },
      { agregadoId: "cro", incluido: true },
    ],
  };
}

function sobre(cambios: Partial<SobreComercialV2> = {}): SobreComercialV2 {
  return {
    version: 2,
    moneda: "ARS",
    fiscal: FISCAL_OK,
    seleccion: seleccionCargada(),
    legado: null,
    ...cambios,
  };
}

/** Una escalera de la Fase 13 ya confirmada, con precio cargado. */
const ESCALERA_LEGADA: EscaleraPaquetesConfirmada = {
  confirmado: true,
  niveles: [
    {
      id: "impulso",
      nombre: "IMPULSO",
      servicios: [
        {
          servicio: "Meta Ads",
          unidad: "campañas_activas",
          cantidad: 1,
          descripcion: null,
          hallazgoIds: ["H-legado"],
          propuestoPorSistema: true,
        },
      ],
      precio: 250_000,
    },
  ],
};

function contexto(
  sobreV2: SobreComercialV2 | null,
  legada: EscaleraPaquetesConfirmada | null = null,
) {
  const resultado = calcularDiagnostico(casoSnakeStore, configuracionRegresionFase2);
  return buildDocumentContext({
    datos: casoSnakeStore,
    resultado,
    diagnostico: { id: "d-f2a", version: 1, fecha: "2026-08-20" },
    tipoDocumento: "propuesta",
    ...(sobreV2 ? { sobreComercialV2: sobreV2 } : {}),
    ...(legada ? { paquetesConfirmados: legada } : {}),
  });
}

function modelo(
  sobreV2: SobreComercialV2 | null,
  legada: EscaleraPaquetesConfirmada | null = null,
): DocumentModelV2 {
  return buildPropuestaDocumentV2(contexto(sobreV2, legada));
}

function bloqueEscaleraV1(
  model: DocumentModelV2,
): Extract<DocumentBlockV2, { type: "commercial-offer" }> | null {
  for (const seccion of model.sections) {
    for (const bloque of seccion.blocks) {
      if (bloque.type === "commercial-offer") return bloque;
    }
  }
  return null;
}

function bloqueSeleccion(
  model: DocumentModelV2,
): Extract<DocumentBlockV2, { type: "commercial-selection" }> | null {
  for (const seccion of model.sections) {
    for (const bloque of seccion.blocks) {
      if (bloque.type === "commercial-selection") return bloque;
    }
  }
  return null;
}

describe("sin selección v2, la propuesta queda exactamente como antes de F2a", () => {
  it("el contrato no trae oferta v2 y el modelo no trae el bloque ni la sección", () => {
    expect(contexto(null).comercialV2).toBeNull();
    expect(buildCommercialSelectionV2(contexto(null))).toBeNull();
    const model = modelo(null);
    expect(bloqueSeleccion(model)).toBeNull();
    expect(model.sections.some((s) => s.id === "commercial-selection")).toBe(false);
  });
});

describe("el contrato documental de la selección v2", () => {
  it("sólo viajan las líneas seleccionadas, con su recurrencia y su ruta", () => {
    const oferta = ofertaComercialDesdeSobreV2(sobre())!;
    expect(oferta.lineas.map((l) => l.lineaId)).toEqual([
      "meta_ads",
      "contenido_audiovisual",
      "diseno_web",
    ]);
    expect(oferta.lineas.find((l) => l.lineaId === "diseno_web")!.ruta).toBe("B2C y B2B");
    expect(oferta.lineas.find((l) => l.lineaId === "diseno_web")!.recurrencia).toBe("unica");
    expect(oferta.nivel).toBe("TRACCIÓN");
  });

  it("Q3: el total de línea es unitario × cantidad", () => {
    const oferta = ofertaComercialDesdeSobreV2(sobre())!;
    const meta = oferta.lineas.find((l) => l.lineaId === "meta_ads")!;
    expect(meta.totalLinea).toMatchObject({ estado: "disponible", valor: 300000 });
    expect(meta.precioUnitario).toMatchObject({ estado: "disponible", valor: 100000 });
  });

  it("Q10: exactamente dos grupos, mensual y única, cada uno cerrado por su cuenta", () => {
    const oferta = ofertaComercialDesdeSobreV2(sobre())!;
    expect(oferta.grupos.map((g) => g.id)).toEqual(["mensual", "unica"]);
    expect(oferta.grupos[0]!.titulo).toBe("Inversión mensual");
    expect(oferta.grupos[1]!.titulo).toBe("Inversión inicial / pago único");
    // 300.000 + 200.000 mensual, 800.000 único.
    expect(oferta.grupos[0]!.subtotalNeto).toMatchObject({ valor: 500000 });
    expect(oferta.grupos[0]!.impuesto).toMatchObject({ valor: 105000 });
    expect(oferta.grupos[0]!.total).toMatchObject({ valor: 605000 });
    expect(oferta.grupos[1]!.subtotalNeto).toMatchObject({ valor: 800000 });
    expect(oferta.grupos[1]!.total).toMatchObject({ valor: 968000 });
  });

  it("Q10: no hay ningún campo que combine los dos grupos", () => {
    const oferta = ofertaComercialDesdeSobreV2(sobre())!;
    expect(Object.keys(oferta).sort()).toEqual([
      "agregados",
      "grupos",
      "lineas",
      "lineasSinPrecio",
      "moneda",
      "nivel",
      "pendiente",
    ]);
    expect(oferta.grupos).toHaveLength(2);
  });

  it("Q9: sin impuesto, la estructura es la misma y el impuesto viaja en null", () => {
    const oferta = ofertaComercialDesdeSobreV2(
      sobre({ fiscal: { aplicaImpuesto: false, porcentaje: 21, confirmado: true } }),
    )!;
    for (const grupo of oferta.grupos) {
      expect(grupo.impuesto).toBeNull();
      expect(grupo.porcentajeImpuesto).toBeNull();
      expect(grupo.total).toEqual(grupo.subtotalNeto);
    }
  });

  it("Q9: la moneda no cambia la estructura fiscal", () => {
    const enArs = ofertaComercialDesdeSobreV2(sobre({ moneda: "ARS" }))!;
    const enUsd = ofertaComercialDesdeSobreV2(sobre({ moneda: "USD" }))!;
    expect(enUsd.grupos).toEqual(enArs.grupos);
    expect(enUsd.moneda).toBe("USD");
  });

  it("un precio sin cargar viaja como evidencia faltante, nunca como cero", () => {
    const seleccion = seleccionCargada();
    const i = seleccion.lineas.findIndex((l) => l.lineaId === "meta_ads");
    seleccion.lineas[i] = {
      ...seleccion.lineas[i]!,
      precio: { modo: "unitario", cantidad: 3, precioUnitario: null },
    };
    const oferta = ofertaComercialDesdeSobreV2(sobre({ seleccion }))!;
    const meta = oferta.lineas.find((l) => l.lineaId === "meta_ads")!;
    expect(meta.totalLinea.estado).toBe("evidencia_faltante");
    expect(oferta.lineasSinPrecio).toEqual(["Meta Ads"]);
    expect(oferta.grupos[0]!.subtotalNeto).toMatchObject({ valor: 200000 });
  });

  it("los agregados viajan con el alcance del nivel, y CRO no si el nivel no lo permite", () => {
    const oferta = ofertaComercialDesdeSobreV2(sobre())!;
    expect(oferta.agregados).toEqual([{ nombre: "Email marketing", alcance: "automatizaciones" }]);
  });
});

describe("los textos de servicio viajan VERBATIM al documento", () => {
  it("descripción y entregables son los del módulo, sin recortar", () => {
    const oferta = ofertaComercialDesdeSobreV2(sobre())!;
    for (const linea of oferta.lineas) {
      const esperado = TEXTOS_SERVICIOS_V2[linea.lineaId as LineaId];
      expect(linea.descripcion).toBe(esperado.descripcion);
      expect(linea.entregables).toEqual([...esperado.entregables]);
      expect(linea.exclusion).toBe(esperado.exclusion);
      expect(linea.textoPendiente).toBe(false);
    }
  });

  it("la exclusión de Diseño web llega tal cual", () => {
    const oferta = ofertaComercialDesdeSobreV2(sobre())!;
    expect(oferta.lineas.find((l) => l.lineaId === "diseno_web")!.exclusion).toBe(
      "No incluye desarrollos web mayores: eso es Desarrollo web custom.",
    );
  });

  it("la nota al pie va sólo en las líneas de contenido", () => {
    const oferta = ofertaComercialDesdeSobreV2(sobre())!;
    expect(oferta.lineas.find((l) => l.lineaId === "contenido_audiovisual")!.notaContenido).toBe(
      NOTA_AL_PIE_CONTENIDO,
    );
    expect(oferta.lineas.find((l) => l.lineaId === "meta_ads")!.notaContenido).toBeNull();
  });
});

describe("Q9: el candado de exportación, uno solo, con la fiscal adentro", () => {
  it("con selección y fiscal confirmada, exporta", () => {
    const model = modelo(sobre());
    expect(bloqueSeleccion(model)!.pendiente).toBe(false);
    expect(() => verificarExportacionPermitidaV2(model)).not.toThrow();
  });

  it("sin confirmar la fiscal, bloquea y lo dice", () => {
    const model = modelo(sobre({ fiscal: { ...FISCAL_OK, confirmado: false } }));
    expect(bloqueSeleccion(model)!.pendiente).toBe(true);
    expect(() => verificarExportacionPermitidaV2(model)).toThrow(
      MENSAJE_EXPORTACION_BLOQUEADA_FISCAL_V2,
    );
  });

  it("sin ninguna línea seleccionada, bloquea", () => {
    const vacia: SeleccionComercialV2 = seleccionInicialV2({ nivel: "impulso", sugeridas: [] });
    const model = modelo(sobre({ seleccion: vacia }));
    expect(() => verificarExportacionPermitidaV2(model)).toThrow();
  });

  it("sin selección v2, el mensaje sigue siendo el de siempre", () => {
    expect(() => verificarExportacionPermitidaV2(modelo(null))).toThrow(
      MENSAJE_EXPORTACION_BLOQUEADA_V2,
    );
  });

  it("no hay un segundo mecanismo: el bloqueo sigue siendo esa única función", () => {
    const model = modelo(sobre({ fiscal: { ...FISCAL_OK, confirmado: false } }));
    // El modelo SIEMPRE se construye igual (D1): el gate no lo muta.
    expect(model.sections.length).toBeGreaterThan(0);
    expect(bloqueSeleccion(model)).not.toBeNull();
  });
});

describe("el desglose impreso, en los dos perfiles", () => {
  it("el renderer web imprime líneas, textos verbatim y los dos grupos", () => {
    const html = renderToStaticMarkup(<DocumentWebRendererV2 model={modelo(sobre())} />);
    expect(html).toContain("Meta Ads");
    expect(html).toContain(TEXTOS_SERVICIOS_V2.meta_ads.descripcion);
    expect(html).toContain(TEXTOS_SERVICIOS_V2.meta_ads.entregables[0]!);
    expect(html).toContain("Inversión mensual");
    expect(html).toContain("Inversión inicial / pago único");
    expect(html).toContain("Impuesto (21 %)");
    expect(html).toContain("B2C y B2B");
    expect(html).toContain("Email marketing");
  });

  it("Q4: el renderer web usa la moneda de la propuesta", () => {
    const enUsd = renderToStaticMarkup(
      <DocumentWebRendererV2 model={modelo(sobre({ moneda: "USD" }))} />,
    ).replace(/ /g, " ");
    expect(enUsd).toContain("US$ 300.000");
    const enArs = renderToStaticMarkup(<DocumentWebRendererV2 model={modelo(sobre())} />).replace(
      / /g,
      " ",
    );
    expect(enArs).toContain("$ 300.000");
    expect(enArs).not.toContain("US$");
  });

  it("bloqueada, el renderer web imprime el aviso y ningún precio", () => {
    const html = renderToStaticMarkup(
      <DocumentWebRendererV2
        model={modelo(sobre({ fiscal: { ...FISCAL_OK, confirmado: false } }))}
      />,
    );
    expect(html).toContain("Falta confirmar la selección de líneas o la configuración fiscal");
    expect(html).not.toContain("Inversión inicial / pago único");
  });

  it("el PDF sale en pantalla (16:9) y en impresión (A4), los dos válidos", async () => {
    for (const perfil of ["pantalla", "impresion"] as const) {
      const { buffer } = await exportarDocumentModelV2(modelo(sobre()), perfil);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(new TextDecoder("latin1").decode(buffer.subarray(0, 5))).toBe("%PDF-");
    }
  }, 120000);
});

describe("INVARIANTE §h: Semana 0 va sólo en proyección", () => {
  it("el modelo de propuesta no tiene dónde representarla", () => {
    const serializado = JSON.stringify(modelo(sobre()));
    expect(serializado.toLowerCase()).not.toContain("semana 0");
    expect(serializado.toLowerCase()).not.toContain("semana_0");
    expect(serializado.toLowerCase()).not.toContain("semanacero");
  });

  it("ni el contrato documental ni la oferta v2 tienen un campo para ella", () => {
    const claves = new Set<string>();
    const recorrer = (valor: unknown): void => {
      if (Array.isArray(valor)) return valor.forEach(recorrer);
      if (!valor || typeof valor !== "object") return;
      for (const [clave, hijo] of Object.entries(valor)) {
        claves.add(clave.toLowerCase());
        recorrer(hijo);
      }
    };
    recorrer(ofertaComercialDesdeSobreV2(sobre()));
    recorrer(contexto(sobre()));
    for (const prohibida of ["semana0", "semanacero", "semana_0", "semanas"]) {
      expect([...claves]).not.toContain(prohibida);
    }
  });

  it("un intento de inyectarla en la selección no llega al documento", () => {
    const conIntruso = {
      ...sobre(),
      seleccion: { ...seleccionCargada(), semana0: "Arranque en la semana 0" },
    } as unknown as SobreComercialV2;
    const oferta = ofertaComercialDesdeSobreV2(conIntruso)!;
    expect(JSON.stringify(oferta).toLowerCase()).not.toContain("semana 0");
    expect(JSON.stringify(oferta).toLowerCase()).not.toContain("semana0");
  });
});

describe("CORRECCIÓN de auditoría: una sola voz comercial por documento", () => {
  const TEXTO_PENDIENTE_V1 = "No hay una escalera de paquetes confirmada";

  it("con selección v2 confirmada, la escalera v1 NO se imprime", () => {
    const model = modelo(sobre());
    expect(bloqueSeleccion(model)!.pendiente).toBe(false);
    expect(bloqueEscaleraV1(model)).toBeNull();
    expect(model.sections.some((s) => s.id === "commercial-offer")).toBe(false);
  });

  it("tampoco se imprime cuando la escalera legada SÍ tiene contenido y precio", () => {
    // El caso fuerte: las dos podrían hablar. Habla la v2, que es la
    // confirmada para este documento.
    const model = modelo(sobre(), ESCALERA_LEGADA);
    expect(bloqueEscaleraV1(model)).toBeNull();
    expect(bloqueSeleccion(model)!.pendiente).toBe(false);
    const html = renderToStaticMarkup(<DocumentWebRendererV2 model={model} />);
    expect(html).not.toContain("Paquete seleccionado");
    expect(html).not.toContain("IMPULSO");
    expect(html).toContain("Selección comercial");
  });

  it("el documento renderizado no dice 'pendiente' y cotiza al mismo tiempo", () => {
    const html = renderToStaticMarkup(<DocumentWebRendererV2 model={modelo(sobre())} />);
    expect(html).not.toContain(TEXTO_PENDIENTE_V1);
    expect(html).not.toContain("Selección comercial pendiente");
    // Y sí muestra la propuesta cotizada.
    expect(html).toContain("Inversión mensual");
  });

  it("la escalera legada sigue viva en el contrato: es presentación, no borrado", () => {
    const ctx = contexto(sobre(), ESCALERA_LEGADA);
    expect(ctx.comercial).not.toBeNull();
    expect(ctx.comercial!.niveles).toHaveLength(1);
    expect(ctx.comercial!.niveles[0]!.precio).toMatchObject({
      estado: "disponible",
      valor: 250_000,
    });
  });

  it("sin selección v2, la escalera v1 se imprime como siempre", () => {
    const conLegada = modelo(null, ESCALERA_LEGADA);
    expect(bloqueEscaleraV1(conLegada)).not.toBeNull();
    expect(bloqueEscaleraV1(conLegada)!.pendiente).toBe(false);
    expect(bloqueSeleccion(conLegada)).toBeNull();

    const sinNada = modelo(null);
    expect(bloqueEscaleraV1(sinNada)).not.toBeNull();
    expect(bloqueEscaleraV1(sinNada)!.pendiente).toBe(true);
  });

  it("CASO ESPEJO: con selección v2 SIN confirmar, la escalera v1 tampoco se imprime", () => {
    // Ronda 2: la regla es "v2 presente, confirmada o no". Antes de esta
    // ronda, este caso imprimía la escalera legada cotizada y, después, la
    // v2 diciendo "pendiente" — el mismo defecto al revés.
    const model = modelo(sobre({ fiscal: { ...FISCAL_OK, confirmado: false } }), ESCALERA_LEGADA);
    expect(bloqueSeleccion(model)!.pendiente).toBe(true);
    expect(bloqueEscaleraV1(model)).toBeNull();

    const html = renderToStaticMarkup(<DocumentWebRendererV2 model={model} />);
    expect(html).not.toContain("Paquete seleccionado");
    expect(html).not.toContain("IMPULSO");
    // Y no cotiza nada: el bloque v2 está pendiente.
    expect(html).toContain("Falta confirmar la selección de líneas o la configuración fiscal");
    expect(html).not.toContain("Inversión mensual");
  });

  it("CASO ESPEJO: sin ninguna línea marcada tampoco habla la v1", () => {
    const vacia = seleccionInicialV2({ nivel: "impulso", sugeridas: [] });
    const model = modelo(sobre({ seleccion: vacia }), ESCALERA_LEGADA);
    expect(bloqueEscaleraV1(model)).toBeNull();
    expect(bloqueSeleccion(model)!.pendiente).toBe(true);
  });

  it("la plantilla v1 no se tocó: sigue armando su propia oferta comercial", async () => {
    const { buildPropuestaDocument } = await import("../velocentum-v1/propuesta");
    const model = buildPropuestaDocument(contexto(sobre(), ESCALERA_LEGADA));
    const tiposV1 = model.sections.flatMap((s) => s.blocks).map((b) => b.type);
    expect(tiposV1).toContain("commercial-offer");
  });
});

describe("RONDA 2: con selección v2 presente, el candado decide sólo ella", () => {
  it("v2 confirmada: exporta", () => {
    expect(() => verificarExportacionPermitidaV2(modelo(sobre()))).not.toThrow();
    expect(() => verificarExportacionPermitidaV2(modelo(sobre(), ESCALERA_LEGADA))).not.toThrow();
  });

  it("v2 pendiente por fiscal SIN confirmar + escalera legada confirmada: BLOQUEA", () => {
    // El caso que vaciaba Q9: antes se exportaba una propuesta con precios
    // sin configuración fiscal confirmada, entrando por la escalera vieja.
    const model = modelo(sobre({ fiscal: { ...FISCAL_OK, confirmado: false } }), ESCALERA_LEGADA);
    expect(() => verificarExportacionPermitidaV2(model)).toThrow(
      MENSAJE_EXPORTACION_BLOQUEADA_FISCAL_V2,
    );
  });

  it("v2 pendiente por falta de líneas + escalera legada confirmada: BLOQUEA", () => {
    const vacia = seleccionInicialV2({ nivel: "impulso", sugeridas: [] });
    const model = modelo(sobre({ seleccion: vacia }), ESCALERA_LEGADA);
    expect(() => verificarExportacionPermitidaV2(model)).toThrow(
      MENSAJE_EXPORTACION_BLOQUEADA_FISCAL_V2,
    );
  });

  it("la exportación real también se bloquea, no sólo el chequeo suelto", async () => {
    const model = modelo(sobre({ fiscal: { ...FISCAL_OK, confirmado: false } }), ESCALERA_LEGADA);
    await expect(exportarDocumentModelV2(model, "pantalla")).rejects.toThrow(
      MENSAJE_EXPORTACION_BLOQUEADA_FISCAL_V2,
    );
  });

  it("SIN selección v2, nada cambia: la escalera legada habilita como antes de F2a", () => {
    expect(() => verificarExportacionPermitidaV2(modelo(null, ESCALERA_LEGADA))).not.toThrow();
    expect(() => verificarExportacionPermitidaV2(modelo(null))).toThrow(
      MENSAJE_EXPORTACION_BLOQUEADA_V2,
    );
  });
});

describe("RONDA 2: el roadmap describe el paquete que el documento cotiza", () => {
  function roadmapDelModelo(model: DocumentModelV2) {
    for (const seccion of model.sections) {
      for (const bloque of seccion.blocks) {
        if (bloque.type === "roadmap") return bloque.items;
      }
    }
    return null;
  }

  it("con selección v2, el contexto trae `roadmapV2` y `roadmap` queda intacto", () => {
    const ctx = contexto(sobre(), ESCALERA_LEGADA);
    expect(ctx.roadmapV2).not.toBeNull();
    // El roadmap legado sigue existiendo, sin tocar: lo renderizan las v1.
    const ctxSoloLegada = contexto(null, ESCALERA_LEGADA);
    expect(ctx.roadmap).toEqual(ctxSoloLegada.roadmap);
  });

  it("el plan del documento v2 nombra las líneas cotizadas, no los servicios de la escalera", () => {
    const model = modelo(sobre(), ESCALERA_LEGADA);
    const items = roadmapDelModelo(model);
    expect(items).not.toBeNull();
    const texto = JSON.stringify(items);
    // Las tres líneas cotizadas de `seleccionCargada()`.
    expect(texto).toContain("Diseño web");
    expect(texto).toContain("Contenido audiovisual");
    // El servicio v1 de la escalera legada, que NO se cotiza, no aparece.
    expect(texto).not.toContain("Desarrollo y optimización web");
  });

  it("una línea marcada a mano sin hallazgo detrás cae en la etapa 90, sin regla nueva", () => {
    const conManual = seleccionCargada();
    const i = conManual.lineas.findIndex((l) => l.lineaId === "influencer_marketing");
    conManual.lineas[i] = {
      ...conManual.lineas[i]!,
      seleccionada: true,
      precio: { modo: "unitario", cantidad: 2, precioUnitario: 50_000 },
    };
    const items = roadmapDelModelo(modelo(sobre({ seleccion: conManual })));
    const etapa90 = items!.find((e) => e.id === "etapa_90");
    expect(etapa90).toBeDefined();
    expect(etapa90!.acciones).toContain("Influencer marketing");
  });

  it("Q1: un hallazgo que justifica tres líneas no imprime tres veces el mismo renglón", () => {
    // "Planificación y creación de contenido" sugiere las tres líneas de
    // contenido; sin deduplicar, cada una empujaba la misma acción y el plan
    // repetía el renglón. Se descartan sólo los repetidos literales.
    const seleccion = seleccionCargada();
    for (const id of ["contenido_estatico", "planificacion_contenido"] as const) {
      const i = seleccion.lineas.findIndex((l) => l.lineaId === id);
      seleccion.lineas[i] = {
        ...seleccion.lineas[i]!,
        seleccionada: true,
        precio:
          seleccion.lineas[i]!.precio.modo === "unitario"
            ? { modo: "unitario", cantidad: 10, precioUnitario: 5_000 }
            : { modo: "total", precioLinea: 50_000 },
      };
    }
    const items = roadmapDelModelo(modelo(sobre({ seleccion })));
    expect(items).not.toBeNull();
    for (const etapa of items!) {
      expect(new Set(etapa.acciones).size).toBe(etapa.acciones.length);
    }
  });

  it("el camino v1 NO deduplica: su salida queda idéntica", () => {
    // La deduplicación es exclusiva del camino v2. `roadmapDocumento` se
    // sigue comportando igual, y las pruebas de DHB-3 lo fijan aparte.
    const ctx = contexto(null, ESCALERA_LEGADA);
    const ctxConV2 = contexto(sobre(), ESCALERA_LEGADA);
    expect(ctxConV2.roadmap).toEqual(ctx.roadmap);
  });

  it("sin ninguna línea marcada no se propone plan, igual que sin escalera confirmada", () => {
    const vacia = seleccionInicialV2({ nivel: "impulso", sugeridas: [] });
    const ctx = contexto(sobre({ seleccion: vacia }), ESCALERA_LEGADA);
    expect(ctx.roadmapV2).toEqual([]);
    expect(roadmapDelModelo(modelo(sobre({ seleccion: vacia }), ESCALERA_LEGADA))).toBeNull();
  });

  it("sin selección v2, el plan del documento v2 sigue saliendo de la escalera legada", () => {
    const ctx = contexto(null, ESCALERA_LEGADA);
    expect(ctx.roadmapV2).toBeNull();
    const items = roadmapDelModelo(modelo(null, ESCALERA_LEGADA));
    expect(JSON.stringify(items)).toContain("Meta Ads");
  });

  it("la plantilla v1 sigue armando su plan desde `roadmap`, sin enterarse de la v2", async () => {
    const { buildPropuestaDocument } = await import("../velocentum-v1/propuesta");
    const ctx = contexto(sobre(), ESCALERA_LEGADA);
    const conV2 = buildPropuestaDocument(ctx);
    const sinV2 = buildPropuestaDocument(contexto(null, ESCALERA_LEGADA));
    const roadmapDe = (m: ReturnType<typeof buildPropuestaDocument>) =>
      m.sections.flatMap((s) => s.blocks).find((b) => b.type === "roadmap");
    expect(roadmapDe(conV2)).toEqual(roadmapDe(sinV2));
  });
});
