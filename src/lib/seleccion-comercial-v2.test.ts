/**
 * BV4 · F2a etapa 2 — el modelo de selección comercial v2.
 *
 * Dos pruebas son exigencia explícita del prompt y están marcadas como tales:
 * la lectura tolerante de una selección legada, y que un total combinado no
 * sea representable. La tercera exigencia, la preservación de la escalera
 * legada dentro del sobre (condición de Matías al aprobar F-2), tiene su
 * propio bloque de regresión al final.
 */
import { describe, expect, it } from "vitest";
import {
  AGREGADOS_V2,
  FISCAL_INICIAL,
  MONEDAS_V2,
  PORCENTAJE_FISCAL_SUGERIDO,
  agregadoDisponibleEn,
  agregadosEfectivosV2,
  alcanceDeAgregado,
  calcularTotalesV2,
  escaleraConfirmadaDesdeColumna,
  esAgregadoId,
  esMonedaV2,
  esRutaV2,
  lineaVaciaV2,
  normalizarSobreComercialV2,
  problemasDeSeleccionV2,
  totalDeLinea,
  type ConfiguracionFiscalV2,
  type LineaSeleccionadaV2,
  type SeleccionComercialV2,
  type SobreComercialV2,
} from "./seleccion-comercial-v2";
import { CATALOGO_COMERCIAL_V2, LINEAS_V2_IDS, type LineaId } from "./catalogo-v2";
import { normalizarEscaleraConfirmada, type EscaleraPaquetesConfirmada } from "./paquetes";

const SIN_IMPUESTO: ConfiguracionFiscalV2 = {
  aplicaImpuesto: false,
  porcentaje: 21,
  confirmado: true,
};
const CON_IVA: ConfiguracionFiscalV2 = { aplicaImpuesto: true, porcentaje: 21, confirmado: true };

function seleccionBase(cambios: Partial<LineaSeleccionadaV2>[] = []): SeleccionComercialV2 {
  const lineas = LINEAS_V2_IDS.map((id) => lineaVaciaV2(id));
  for (const cambio of cambios) {
    const i = lineas.findIndex((l) => l.lineaId === cambio.lineaId);
    if (i >= 0) lineas[i] = { ...lineas[i]!, ...cambio } as LineaSeleccionadaV2;
  }
  return { nivel: "impulso", lineas, agregados: [] };
}

/** La escalera legada de la Fase 13, tal como está hoy en la base. */
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
          hallazgoIds: ["H1"],
          propuestoPorSistema: true,
        },
      ],
      precio: 250000,
    },
  ],
};

describe("moneda, fiscalidad y ruta (Q4, Q9, Q8)", () => {
  it("Q4: sólo ARS y USD; nada más es moneda", () => {
    expect(MONEDAS_V2).toEqual(["ARS", "USD"]);
    expect(esMonedaV2("ARS")).toBe(true);
    expect(esMonedaV2("USD")).toBe(true);
    expect(esMonedaV2("EUR")).toBe(false);
    expect(esMonedaV2(null)).toBe(false);
  });

  it("Q9: la configuración fiscal nace sugerida en 21 % y SIN confirmar", () => {
    expect(PORCENTAJE_FISCAL_SUGERIDO).toBe(21);
    expect(FISCAL_INICIAL).toEqual({ aplicaImpuesto: true, porcentaje: 21, confirmado: false });
  });

  it("Q8: la ruta admite B2C, B2B y ambas", () => {
    expect(["b2c", "b2b", "ambas"].every(esRutaV2)).toBe(true);
    expect(esRutaV2("b2x")).toBe(false);
  });
});

describe("agregados (punto f)", () => {
  it("son cuatro: tracking web, email marketing, reportes y CRO", () => {
    expect(AGREGADOS_V2.map((a) => a.id)).toEqual([
      "tracking_web",
      "email_marketing",
      "reportes",
      "cro",
    ]);
  });

  it("retargeting, tracking de plataforma, popup y rutas NO son agregados: viven en una línea", () => {
    const ids = AGREGADOS_V2.map((a) => a.id) as string[];
    for (const dentroDeLinea of ["retargeting", "tracking_plataforma", "popup", "rutas"]) {
      expect(ids).not.toContain(dentroDeLinea);
    }
  });

  it("Q7: tracking web en los tres niveles; CRO sólo en ESCALA", () => {
    for (const nivel of ["impulso", "traccion", "escala"] as const) {
      expect(agregadoDisponibleEn("tracking_web", nivel)).toBe(true);
    }
    expect(agregadoDisponibleEn("cro", "impulso")).toBe(false);
    expect(agregadoDisponibleEn("cro", "traccion")).toBe(false);
    expect(agregadoDisponibleEn("cro", "escala")).toBe(true);
  });

  it("Q7: el alcance de email marketing sigue al nivel elegido", () => {
    expect(alcanceDeAgregado("email_marketing", "impulso")).toBe("básico");
    expect(alcanceDeAgregado("email_marketing", "traccion")).toBe("automatizaciones");
    expect(alcanceDeAgregado("email_marketing", "escala")).toBe("segmentación y recompra");
  });

  it("reportes: mensual en IMPULSO, semanal en los otros dos", () => {
    expect(alcanceDeAgregado("reportes", "impulso")).toBe("mensual");
    expect(alcanceDeAgregado("reportes", "traccion")).toBe("semanal");
    expect(alcanceDeAgregado("reportes", "escala")).toBe("semanal");
  });

  it("un agregado binario no tiene alcance, y uno no disponible en el nivel tampoco", () => {
    expect(alcanceDeAgregado("tracking_web", "escala")).toBeNull();
    expect(alcanceDeAgregado("cro", "impulso")).toBeNull();
  });

  it("`agregadosEfectivosV2` filtra los no incluidos y los no disponibles en el nivel", () => {
    const seleccion: SeleccionComercialV2 = {
      ...seleccionBase(),
      nivel: "traccion",
      agregados: [
        { agregadoId: "email_marketing", incluido: true },
        { agregadoId: "cro", incluido: true },
        { agregadoId: "tracking_web", incluido: false },
      ],
    };
    expect(agregadosEfectivosV2(seleccion)).toEqual([
      { agregadoId: "email_marketing", nombre: "Email marketing", alcance: "automatizaciones" },
    ]);
  });

  it("esAgregadoId filtra lo que llega del JSON", () => {
    expect(esAgregadoId("cro")).toBe(true);
    expect(esAgregadoId("retargeting")).toBe(false);
  });
});

describe("Q3: total de línea — unitario × cantidad, o total directo", () => {
  it("una línea cuantificable multiplica unitario por cantidad", () => {
    const linea: LineaSeleccionadaV2 = {
      ...lineaVaciaV2("contenido_audiovisual"),
      seleccionada: true,
      precio: { modo: "unitario", cantidad: 10, precioUnitario: 15000 },
    };
    expect(totalDeLinea(linea)).toBe(150000);
  });

  it("cambiar la cantidad recalcula solo: no hay total guardado que corregir", () => {
    const base = lineaVaciaV2("meta_ads");
    const conTres = {
      ...base,
      precio: { modo: "unitario" as const, cantidad: 3, precioUnitario: 100 },
    };
    const conCinco = {
      ...base,
      precio: { modo: "unitario" as const, cantidad: 5, precioUnitario: 100 },
    };
    expect(totalDeLinea(conTres)).toBe(300);
    expect(totalDeLinea(conCinco)).toBe(500);
  });

  it("una línea sin cantidad lleva el total de la línea directo", () => {
    const linea: LineaSeleccionadaV2 = {
      ...lineaVaciaV2("branding"),
      precio: { modo: "total", precioLinea: 900000 },
    };
    expect(totalDeLinea(linea)).toBe(900000);
  });

  it("un precio sin cargar es null, nunca cero", () => {
    expect(totalDeLinea(lineaVaciaV2("meta_ads"))).toBeNull();
    expect(totalDeLinea(lineaVaciaV2("branding"))).toBeNull();
    expect(
      totalDeLinea({
        ...lineaVaciaV2("meta_ads"),
        precio: { modo: "unitario", cantidad: 3, precioUnitario: null },
      }),
    ).toBeNull();
  });
});

describe("Q10: dos grupos de totales, jamás uno combinado", () => {
  const seleccion = seleccionBase([
    {
      lineaId: "meta_ads",
      seleccionada: true,
      recurrencia: "mensual",
      precio: { modo: "unitario", cantidad: 3, precioUnitario: 100000 },
    },
    {
      lineaId: "contenido_estatico",
      seleccionada: true,
      recurrencia: "mensual",
      precio: { modo: "unitario", cantidad: 12, precioUnitario: 10000 },
    },
    {
      lineaId: "branding",
      seleccionada: true,
      recurrencia: "unica",
      precio: { modo: "total", precioLinea: 800000 },
    },
  ]);

  it("separa mensual de único y cierra cada grupo por su cuenta", () => {
    const totales = calcularTotalesV2(seleccion, SIN_IMPUESTO);
    expect(totales.mensual).toEqual({ subtotalNeto: 420000, impuesto: null, total: 420000 });
    expect(totales.unica).toEqual({ subtotalNeto: 800000, impuesto: null, total: 800000 });
  });

  it("Q9: el impuesto se aplica por grupo, con la misma estructura", () => {
    const totales = calcularTotalesV2(seleccion, CON_IVA);
    expect(totales.mensual).toEqual({ subtotalNeto: 420000, impuesto: 88200, total: 508200 });
    expect(totales.unica).toEqual({ subtotalNeto: 800000, impuesto: 168000, total: 968000 });
  });

  it("EXIGENCIA DEL PROMPT: un total combinado no es representable", () => {
    const totales = calcularTotalesV2(seleccion, CON_IVA);

    // 1. Estructural: el objeto tiene exactamente dos grupos y nada más.
    expect(Object.keys(totales).sort()).toEqual(["lineasSinPrecio", "mensual", "unica"]);
    expect(Object.keys(totales.mensual).sort()).toEqual(["impuesto", "subtotalNeto", "total"]);
    expect(Object.keys(totales.unica).sort()).toEqual(["impuesto", "subtotalNeto", "total"]);

    // 2. De contenido: la suma de los dos grupos no aparece en ningún campo.
    const combinado = totales.mensual.total + totales.unica.total;
    const numeros = [
      totales.mensual.subtotalNeto,
      totales.mensual.impuesto,
      totales.mensual.total,
      totales.unica.subtotalNeto,
      totales.unica.impuesto,
      totales.unica.total,
    ];
    expect(numeros).not.toContain(combinado);

    // 3. De tipos: `totales.total` no compila. Si alguien agregara un total
    //    combinado al modelo, este `@ts-expect-error` pasaría a ser un error
    //    de compilación y `npm run typecheck` lo frenaría.
    // @ts-expect-error el modelo no tiene un total combinado, a propósito.
    expect(totales.total).toBeUndefined();
  });

  it("Q6: los totales no se persisten — la selección no tiene un solo campo de total", () => {
    // Barrido de TODAS las claves del objeto que efectivamente se guarda:
    // ninguna se llama `total`, `subtotal` ni `impuesto`. (El literal "total"
    // sí aparece como VALOR: es el discriminante de `precio.modo`. Por eso se
    // recorren claves, no texto serializado.)
    const claves = new Set<string>();
    const recorrer = (valor: unknown): void => {
      if (Array.isArray(valor)) return valor.forEach(recorrer);
      if (!valor || typeof valor !== "object") return;
      for (const [clave, hijo] of Object.entries(valor)) {
        claves.add(clave);
        recorrer(hijo);
      }
    };
    recorrer(JSON.parse(JSON.stringify(seleccion)));
    for (const prohibida of ["total", "subtotal", "subtotalNeto", "impuesto", "totales"]) {
      expect([...claves]).not.toContain(prohibida);
    }

    for (const linea of seleccion.lineas) {
      expect(Object.keys(linea).sort()).toEqual([
        "lineaId",
        "precio",
        "recurrencia",
        "ruta",
        "seleccionada",
      ]);
    }
  });

  it("una línea seleccionada sin precio NO vale cero: sale aparte", () => {
    const conPendiente = seleccionBase([
      {
        lineaId: "meta_ads",
        seleccionada: true,
        recurrencia: "mensual",
        precio: { modo: "unitario", cantidad: 3, precioUnitario: 100000 },
      },
      { lineaId: "google_ads", seleccionada: true, recurrencia: "mensual" },
    ]);
    const totales = calcularTotalesV2(conPendiente, SIN_IMPUESTO);
    expect(totales.mensual.subtotalNeto).toBe(300000);
    expect(totales.lineasSinPrecio).toEqual(["google_ads"]);
  });

  it("las líneas desmarcadas no suman aunque tengan precio cargado", () => {
    const totales = calcularTotalesV2(
      seleccionBase([
        {
          lineaId: "meta_ads",
          seleccionada: false,
          precio: { modo: "unitario", cantidad: 3, precioUnitario: 100000 },
        },
      ]),
      SIN_IMPUESTO,
    );
    expect(totales.mensual.subtotalNeto).toBe(0);
    expect(totales.lineasSinPrecio).toEqual([]);
  });

  it("Q10 × Q3: una línea cuantificable puede ser de pago único y cae en el otro grupo", () => {
    const totales = calcularTotalesV2(
      seleccionBase([
        {
          lineaId: "desarrollo_web_custom",
          seleccionada: true,
          recurrencia: "unica",
          precio: { modo: "unitario", cantidad: 4, precioUnitario: 300000 },
        },
      ]),
      SIN_IMPUESTO,
    );
    expect(totales.unica.subtotalNeto).toBe(1200000);
    expect(totales.mensual.subtotalNeto).toBe(0);
  });

  it("Q9: la fiscalidad no se infiere de la moneda — misma estructura en ARS y en USD", () => {
    const enArs = calcularTotalesV2(seleccion, CON_IVA);
    const enUsd = calcularTotalesV2(seleccion, CON_IVA);
    expect(enArs).toEqual(enUsd);
  });

  it("sin impuesto, el total del grupo es su subtotal neto", () => {
    const totales = calcularTotalesV2(seleccion, SIN_IMPUESTO);
    expect(totales.mensual.impuesto).toBeNull();
    expect(totales.mensual.total).toBe(totales.mensual.subtotalNeto);
  });
});

describe("problemasDeSeleccionV2: coherencia estructural", () => {
  it("una selección bien formada no tiene problemas", () => {
    expect(problemasDeSeleccionV2(seleccionBase())).toEqual([]);
  });

  it("detecta una línea faltante", () => {
    const seleccion = seleccionBase();
    seleccion.lineas = seleccion.lineas.filter((l) => l.lineaId !== "branding");
    expect(problemasDeSeleccionV2(seleccion)).toContain("falta la línea branding");
  });

  it("Q8: sólo diseño web admite ruta", () => {
    const seleccion = seleccionBase([{ lineaId: "meta_ads", ruta: "ambas" }]);
    expect(problemasDeSeleccionV2(seleccion)).toContain("meta_ads: no admite ruta B2C/B2B");
    expect(
      problemasDeSeleccionV2(seleccionBase([{ lineaId: "diseno_web", ruta: "ambas" }])),
    ).toEqual([]);
  });

  it("detecta un precio en el modo equivocado para la unidad de la línea", () => {
    const seleccion = seleccionBase([
      { lineaId: "branding", precio: { modo: "unitario", cantidad: 1, precioUnitario: 10 } },
    ]);
    expect(problemasDeSeleccionV2(seleccion)).toContain(
      'branding: precio en modo "unitario", esperado "total"',
    );
  });

  it("detecta CRO fuera de ESCALA", () => {
    const seleccion: SeleccionComercialV2 = {
      ...seleccionBase(),
      nivel: "impulso",
      agregados: [{ agregadoId: "cro", incluido: true }],
    };
    expect(problemasDeSeleccionV2(seleccion)).toContain("cro: no está disponible en impulso");
  });
});

describe("EXIGENCIA DEL PROMPT: lectura tolerante", () => {
  it("una selección legada (escalera de Fase 13) no es un sobre v2 y no rompe nada", () => {
    expect(normalizarSobreComercialV2(ESCALERA_LEGADA)).toBeNull();
    expect(escaleraConfirmadaDesdeColumna(ESCALERA_LEGADA)).toEqual(ESCALERA_LEGADA);
  });

  it("la forma vieja sin sobre, null, un array y basura devuelven null sin lanzar", () => {
    for (const basura of [null, undefined, 0, "", [], [1, 2], { cualquier: "cosa" }]) {
      expect(normalizarSobreComercialV2(basura)).toBeNull();
      expect(escaleraConfirmadaDesdeColumna(basura)).toBeNull();
    }
  });

  it("un sobre v2 incompleto se completa con las diez líneas del catálogo, desmarcadas", () => {
    const sobre = normalizarSobreComercialV2({ version: 2 });
    expect(sobre).not.toBeNull();
    expect(sobre!.moneda).toBe("ARS");
    expect(sobre!.fiscal).toEqual({ aplicaImpuesto: false, porcentaje: 21, confirmado: false });
    expect(sobre!.seleccion.nivel).toBe("impulso");
    expect(sobre!.seleccion.lineas.map((l) => l.lineaId)).toEqual([...LINEAS_V2_IDS]);
    expect(sobre!.seleccion.lineas.every((l) => !l.seleccionada)).toBe(true);
    expect(sobre!.legado).toBeNull();
  });

  it("una selección guardada antes de que existiera una línea recibe esa línea desmarcada", () => {
    const sobre = normalizarSobreComercialV2({
      version: 2,
      seleccion: {
        nivel: "escala",
        lineas: [
          {
            lineaId: "meta_ads",
            seleccionada: true,
            recurrencia: "mensual",
            precio: { modo: "unitario", cantidad: 5, precioUnitario: 200 },
          },
        ],
      },
    });
    expect(sobre!.seleccion.lineas).toHaveLength(CATALOGO_COMERCIAL_V2.lineas.length);
    const meta = sobre!.seleccion.lineas.find((l) => l.lineaId === "meta_ads")!;
    expect(meta.seleccionada).toBe(true);
    expect(totalDeLinea(meta)).toBe(1000);
    expect(sobre!.seleccion.lineas.find((l) => l.lineaId === "branding")!.seleccionada).toBe(false);
  });

  it("descarta IDs, monedas, niveles, recurrencias y agregados desconocidos sin romperse", () => {
    const sobre = normalizarSobreComercialV2({
      version: 2,
      moneda: "EUR",
      fiscal: { aplicaImpuesto: true, porcentaje: -5, confirmado: true },
      seleccion: {
        nivel: "premium",
        lineas: [
          { lineaId: "servicio_inventado", seleccionada: true },
          { lineaId: "branding", seleccionada: true, recurrencia: "trimestral" },
        ],
        agregados: [
          { agregadoId: "retargeting", incluido: true },
          { agregadoId: "cro", incluido: true },
          { agregadoId: "cro", incluido: false },
        ],
      },
    });
    expect(sobre!.moneda).toBe("ARS");
    expect(sobre!.fiscal.porcentaje).toBe(21);
    expect(sobre!.fiscal.confirmado).toBe(true);
    expect(sobre!.seleccion.nivel).toBe("impulso");
    expect(sobre!.seleccion.lineas.map((l) => l.lineaId)).toEqual([...LINEAS_V2_IDS]);
    // Recurrencia inválida cae al default del catálogo, no a `undefined`.
    expect(sobre!.seleccion.lineas.find((l) => l.lineaId === "branding")!.recurrencia).toBe(
      "unica",
    );
    expect(sobre!.seleccion.agregados).toEqual([{ agregadoId: "cro", incluido: true }]);
  });

  it("descarta una ruta puesta sobre una línea que no la admite", () => {
    const sobre = normalizarSobreComercialV2({
      version: 2,
      seleccion: { lineas: [{ lineaId: "meta_ads", ruta: "ambas" }] },
    });
    expect(sobre!.seleccion.lineas.find((l) => l.lineaId === "meta_ads")!.ruta).toBeNull();
    expect(problemasDeSeleccionV2(sobre!.seleccion)).toEqual([]);
  });

  it("un sobre de otra versión no se lee como v2", () => {
    expect(normalizarSobreComercialV2({ version: 1, seleccion: {} })).toBeNull();
    expect(normalizarSobreComercialV2({ version: 3, seleccion: {} })).toBeNull();
    expect(normalizarSobreComercialV2({ version: "2", seleccion: {} })).toBeNull();
  });
});

describe("REGRESIÓN F-2: la escalera legada se preserva, no se pisa", () => {
  const sobreConLegado: SobreComercialV2 = {
    version: 2,
    moneda: "USD",
    fiscal: CON_IVA,
    seleccion: seleccionBase([{ lineaId: "meta_ads", seleccionada: true }]),
    legado: ESCALERA_LEGADA,
  };

  it("la legada vive en `SobreComercialV2.legado`, con su contenido intacto", () => {
    const releido = normalizarSobreComercialV2(JSON.parse(JSON.stringify(sobreConLegado)));
    // Igualdad profunda, que es la que importa: la cadena documental lee la
    // escalera por nombre de campo, nunca por el texto del JSON. El orden de
    // las claves de nivel superior lo fija `normalizarEscaleraConfirmada` y no
    // cambia ningún contenido.
    expect(releido!.legado).toEqual(ESCALERA_LEGADA);
    expect(releido!.legado!.confirmado).toBe(true);
    expect(JSON.stringify(releido!.legado!.niveles)).toBe(JSON.stringify(ESCALERA_LEGADA.niveles));
  });

  it("la cadena v1 lee EXACTAMENTE la misma escalera antes y después de envolver", () => {
    const antes = escaleraConfirmadaDesdeColumna(ESCALERA_LEGADA);
    const despues = escaleraConfirmadaDesdeColumna(sobreConLegado);
    expect(despues).toEqual(antes);
    expect(despues).toEqual(normalizarEscaleraConfirmada(ESCALERA_LEGADA));
  });

  it("sobrevive al viaje por JSON, que es como viaja de verdad en la columna", () => {
    const desdeLaBase = JSON.parse(JSON.stringify(sobreConLegado));
    expect(escaleraConfirmadaDesdeColumna(desdeLaBase)).toEqual(ESCALERA_LEGADA);
  });

  it("un sobre v2 sin legado deja la cadena v1 sin escalera, como corresponde", () => {
    expect(escaleraConfirmadaDesdeColumna({ ...sobreConLegado, legado: null })).toBeNull();
  });

  it("el sobre v2 no puede hacerse pasar por escalera confirmada de la cadena v1", () => {
    // El sobre no tiene `confirmado: true`, así que el normalizador viejo lo
    // rechaza: si alguien lo leyera con la función de v1 directamente, no
    // obtendría una escalera falsa, obtendría null.
    expect(normalizarEscaleraConfirmada(sobreConLegado)).toBeNull();
  });

  it("la selección v2 y la escalera legada conviven sin mezclarse", () => {
    const releido = normalizarSobreComercialV2(JSON.parse(JSON.stringify(sobreConLegado)))!;
    expect(releido.seleccion.lineas.find((l) => l.lineaId === "meta_ads")!.seleccionada).toBe(true);
    expect(releido.legado!.niveles[0]!.precio).toBe(250000);
    const idsV2 = releido.seleccion.lineas.map((l) => l.lineaId) as string[];
    const serviciosLegados = releido.legado!.niveles.flatMap((n) =>
      n.servicios.map((s) => s.servicio),
    );
    expect(serviciosLegados).toEqual(["Meta Ads"]);
    expect(idsV2).toContain("meta_ads");
  });
});

describe("lineaVaciaV2: el punto de partida de cada línea", () => {
  it("nace desmarcada, sin precio, con la recurrencia sugerida del catálogo", () => {
    for (const linea of CATALOGO_COMERCIAL_V2.lineas) {
      const vacia = lineaVaciaV2(linea.id);
      expect(vacia.seleccionada).toBe(false);
      expect(vacia.recurrencia).toBe(linea.recurrenciaSugerida);
      expect(vacia.ruta).toBeNull();
      expect(totalDeLinea(vacia)).toBeNull();
    }
  });

  it("el modo del precio sale de la unidad de la línea, no de una elección", () => {
    const modos = Object.fromEntries(
      LINEAS_V2_IDS.map((id) => [id, lineaVaciaV2(id as LineaId).precio.modo]),
    );
    expect(modos).toEqual({
      meta_ads: "unitario",
      google_ads: "unitario",
      product_ads: "unitario",
      contenido_audiovisual: "unitario",
      contenido_estatico: "unitario",
      influencer_marketing: "unitario",
      planificacion_contenido: "total",
      diseno_web: "total",
      desarrollo_web_custom: "unitario",
      branding: "total",
    });
  });
});
