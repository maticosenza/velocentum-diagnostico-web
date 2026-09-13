/**
 * Pantalla de detalle y formulario según el perímetro del cliente: lo que no
 * tiene no se muestra; lo que no usa para pautar no muestra métricas. Sólo un
 * "no" explícito oculta algo: los diagnósticos guardados antes de las preguntas
 * de Identificación se ven como antes (caso 1ac7186c, copiado de la base).
 * También: el aviso de margen de muestra dice lo mismo que la tabla de
 * Economía, y todo faltante que el motor emite tiene nombre legible (H-42).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  calcularDiagnostico,
  inversionPublicitariaTotal,
  type ConfiguracionCalculo,
  type Derivados,
} from "./calculo-diagnostico";
import { canalPrincipal, coberturaCanales, estadoCanal } from "./canales";
import {
  DATOS_INICIALES,
  bloquesAplicables,
  respuestaVendeMercadoLibre,
  type DatosDiagnostico,
} from "./diagnostico-form";
import { CASO_1AC7186C as caso } from "./fixtures-caso-1ac7186c";
import {
  casoSnakeStore,
  casoSnakeStoreCoberturaCompleta,
  casoTitanWebB1,
  casoTitanWebB1AntesDeCanales,
  casoTitanWebB1CoberturaCompleta,
  configuracionRegresionFase2 as cfg,
} from "./fixtures-casos";
import {
  ETIQUETAS_CAMPO,
  avisoMargenMuestra,
  bloquesSemaforo,
  etiquetaCampo,
  perimetroVista,
  type PerimetroVista,
} from "./vista-diagnostico";

const TODO_VISIBLE: PerimetroVista = {
  tiendaPropia: true,
  mercadoLibre: true,
  pautaTienda: true,
  pautaMeta: true,
  productAds: true,
  funnelWeb: true,
};
const SIN_ML: PerimetroVista = { ...TODO_VISIBLE, mercadoLibre: false, productAds: false };
const CINCO = ["medicion", "economia", "cuenta", "funnel_web", "creativos"];

const calcular = (d: DatosDiagnostico) => calcularDiagnostico(d, cfg, "A").derivados;

/**
 * Titan con los dos canales de venta activos y mix al 100%. Con las visitas de
 * la tienda: sin ningún dato de funnel y con ML de principal, el motor deja el
 * funnel en no aplica aunque haya tienda.
 */
const titanDosCanales: DatosDiagnostico = {
  ...casoTitanWebB1,
  canal_tienda_no_aplica: false,
  canal_tienda_pct: 40,
  canal_ml_pct: 60,
  visitas_mensuales: 200_000,
};

describe("Guardados antes de las preguntas: la pantalla se ve como antes", () => {
  const cargado: DatosDiagnostico = { ...DATOS_INICIALES, ...caso.datos };

  it("el caso 1ac7186c, guardado con 'No vende en ML', pierde sólo la tarjeta de ML", () => {
    expect(caso.datos.vende_mercado_libre).toBe(false);
    expect(caso.derivados.canales.map((c) => c.estado)).toEqual(["ausente", "ausente"]);
    const p = perimetroVista(caso.datos, caso.derivados);
    expect(p).toEqual(SIN_ML);
    expect(bloquesSemaforo(p)).toEqual(CINCO);
  });

  it("abierto en el formulario (preguntas nuevas en null) da el mismo perímetro", () => {
    expect(perimetroVista(cargado, caso.derivados)).toEqual(SIN_ML);
    expect(perimetroVista(cargado, calcular(cargado))).toEqual(SIN_ML);
  });

  it("sin responder '¿Vende en Mercado Libre?' se ve todo, como hoy", () => {
    const sinResponder = { ...cargado, vende_mercado_libre: null };
    expect(perimetroVista(sinResponder, calcular(sinResponder))).toEqual(TODO_VISIBLE);
  });

  it("datos o derivados vacíos o sin canales ni funnel no rompen y muestran todo", () => {
    expect(perimetroVista(null, null)).toEqual(TODO_VISIBLE);
    expect(perimetroVista({} as DatosDiagnostico, {} as Derivados)).toEqual(TODO_VISIBLE);
    const sinCanales = { ...caso.derivados, canales: undefined, funnel: undefined };
    // 1ac7186c trae el "No vende en ML" guardado: sólo esa tarjeta sale.
    expect(perimetroVista(caso.datos, sinCanales as unknown as Derivados)).toEqual(SIN_ML);
    expect(avisoMargenMuestra(null)).toBe(false);
    expect(avisoMargenMuestra({} as Derivados)).toBe(false);
  });

  it("Sí a las tres preguntas es lo mismo que no responderlas", () => {
    const si = { ...cargado, canal_tienda_no_aplica: false, pauta_meta: true, pauta_google: true };
    expect(perimetroVista(si, calcular(si))).toEqual(perimetroVista(cargado, calcular(cargado)));
  });

  it("el formulario muestra Web, y Mercado Libre y Mayorista siguen como antes", () => {
    const ids = (d: Parameters<typeof bloquesAplicables>[0]) =>
      bloquesAplicables(d).map((b) => b.id);
    expect(ids(cargado)).toContain("web");
    expect(ids({ ...cargado, canal_tienda_no_aplica: null })).toContain("web");
    expect(ids({ ...cargado, canal_tienda_no_aplica: undefined })).toContain("web");
    expect(ids(cargado)).not.toContain("mercado_libre");
    expect(ids({ ...cargado, vende_mercado_libre: null })).not.toContain("mercado_libre");
    expect(ids({ ...cargado, vende_mercado_libre: true })).toContain("mercado_libre");
    expect(ids(cargado)).not.toContain("mayorista");
    expect(ids({ ...cargado, venta_mayorista_activa: true })).toContain("mayorista");
  });
});

describe("Sin tienda propia, con Mercado Libre", () => {
  const datos: DatosDiagnostico = { ...titanDosCanales, canal_tienda_no_aplica: true };
  const derivados = calcular(datos);
  const p = perimetroVista(datos, derivados);

  it("el motor sigue trayendo las dos entradas de canal: la pantalla es la que filtra", () => {
    expect(derivados.canales.map((c) => [c.id, c.estado])).toEqual([
      ["tienda_propia", "no_aplica"],
      ["mercado_libre", "declarado"],
    ]);
  });

  it("fuera la tarjeta de la tienda, el funnel web, la conversión del sitio y el MER tienda propia", () => {
    expect(p.tiendaPropia).toBe(false);
    expect(p.funnelWeb).toBe(false);
    expect(p.pautaTienda).toBe(false);
    expect(p.mercadoLibre).toBe(true);
    expect(p.productAds).toBe(true);
  });

  it("fuera las píldoras de Funnel web y de Medición (el Pixel mide el sitio)", () => {
    expect(bloquesSemaforo(p)).toEqual(["economia", "cuenta", "creativos"]);
  });

  it("el formulario oculta la pestaña Web", () => {
    expect(bloquesAplicables(datos).map((b) => b.id)).not.toContain("web");
  });

  it("aunque el motor calcule el funnel, sin tienda la pantalla no lo muestra", () => {
    const conFunnel = { ...derivados, funnel: { ...derivados.funnel, estado: "calculado" } };
    expect(perimetroVista(datos, conFunnel as Derivados).funnelWeb).toBe(false);
  });
});

describe("Sin Mercado Libre", () => {
  const datos: DatosDiagnostico = {
    ...titanDosCanales,
    canal_ml_pct: null,
    canal_ml_no_aplica: true,
  };
  const p = perimetroVista(datos, calcular(datos));

  it("fuera la tarjeta de ML, el MER Mercado Libre y el ROAS de Product Ads", () => {
    expect(p.mercadoLibre).toBe(false);
    expect(p.productAds).toBe(false);
    expect(p.tiendaPropia).toBe(true);
    expect(bloquesSemaforo(p)).toEqual(CINCO);
  });

  it("Mercado Libre ausente (no respondido en Canales) sigue a la vista, como hoy", () => {
    const ausente = { ...titanDosCanales, canal_ml_pct: null, canal_ml_no_aplica: false };
    expect(perimetroVista(ausente, calcular(ausente)).mercadoLibre).toBe(true);
  });
});

describe("¿Vende en Mercado Libre? escribe canal_ml_no_aplica, como la tienda propia", () => {
  const conRespuesta = (d: DatosDiagnostico, v: boolean | null): DatosDiagnostico => ({
    ...d,
    ...respuestaVendeMercadoLibre(v),
  });

  it("el formulario arranca sin responder", () => {
    expect(DATOS_INICIALES.vende_mercado_libre).toBeNull();
    expect(DATOS_INICIALES.canal_ml_no_aplica).toBe(false);
  });

  it("No deja ML en no aplica; Sí y sin responder lo sacan", () => {
    expect(respuestaVendeMercadoLibre(false)).toEqual({
      vende_mercado_libre: false,
      canal_ml_no_aplica: true,
    });
    expect(respuestaVendeMercadoLibre(true)).toEqual({
      vende_mercado_libre: true,
      canal_ml_no_aplica: false,
    });
    expect(respuestaVendeMercadoLibre(null)).toEqual({
      vende_mercado_libre: null,
      canal_ml_no_aplica: false,
    });
    const no = conRespuesta(titanDosCanales, false);
    expect(estadoCanal(no, "mercado_libre")).toBe("no_aplica");
    expect(estadoCanal(conRespuesta(no, true), "mercado_libre")).toBe("declarado");
    expect(estadoCanal(conRespuesta(no, null), "mercado_libre")).toBe("declarado");
  });

  it("con el No, el porcentaje de ML deja de contar para cobertura y canal principal", () => {
    const no = conRespuesta(
      { ...titanDosCanales, canal_ml_pct: null, ml_pct_facturacion: 60 },
      false,
    );
    expect(coberturaCanales(no)).toBe(40);
    expect(canalPrincipal(no)).toBe("tienda_propia");
  });

  it("con el No, Product Ads cargado sigue sumando a la inversión (H-21 sigue abierto)", () => {
    // La tienda en cero explícito para que el total sea sólo Product Ads.
    const no = conRespuesta({ ...titanDosCanales, pauta_meta: false, pauta_google: false }, false);
    expect(estadoCanal(no, "mercado_libre")).toBe("no_aplica");
    expect(inversionPublicitariaTotal(no)).toBe(1_800_000);
  });

  it("No a los dos canales de venta: el motor deja los dos en no aplica y la pantalla no pinta ninguno", () => {
    const d = conRespuesta({ ...titanDosCanales, canal_tienda_no_aplica: true }, false);
    const derivados = calcular(d);
    expect(derivados.canales.map((c) => c.estado)).toEqual(["no_aplica", "no_aplica"]);
    const p = perimetroVista(d, derivados);
    expect(p.tiendaPropia).toBe(false);
    expect(p.mercadoLibre).toBe(false);
  });

  it("sin responder se calcula igual que con el false que se guardaba por defecto", () => {
    const base = { ...titanDosCanales, canal_ml_no_aplica: false };
    expect(calcularDiagnostico({ ...base, vende_mercado_libre: null }, cfg, "A")).toEqual(
      calcularDiagnostico({ ...base, vende_mercado_libre: false }, cfg, "A"),
    );
  });

  it("guardado con No pero ML declarado con porcentaje: la tarjeta queda, entra en el margen", () => {
    const d = { ...titanDosCanales, vende_mercado_libre: false, canal_ml_no_aplica: false };
    const derivados = calcular(d);
    expect(derivados.canales.find((c) => c.id === "mercado_libre")?.estado).toBe("declarado");
    expect(perimetroVista(d, derivados).mercadoLibre).toBe(true);
  });

  it("guardado sin derivados de canales: el No igual saca ML", () => {
    const d = { ...caso.datos, vende_mercado_libre: false };
    const sinCanales = { ...caso.derivados, canales: undefined } as unknown as Derivados;
    expect(perimetroVista(d, sinCanales).mercadoLibre).toBe(false);
  });
});

describe("Canal de pauta declarado como no usado: sin métricas", () => {
  const con = (extra: Partial<DatosDiagnostico>) => {
    const d = { ...titanDosCanales, ...extra };
    return perimetroVista(d, calcular(d));
  };

  it("sin Meta ni Google: fuera el MER de la tienda y la estructura de cuenta", () => {
    const p = con({ pauta_meta: false, pauta_google: false });
    expect(p.pautaTienda).toBe(false);
    expect(p.pautaMeta).toBe(false);
    expect(p.tiendaPropia).toBe(true);
    expect(bloquesSemaforo(p)).toEqual(["medicion", "economia", "funnel_web", "creativos"]);
  });

  it("sólo sin Meta: el MER de la tienda queda (Google), la cuenta de Meta no", () => {
    const p = con({ pauta_meta: false, pauta_google: true });
    expect(p.pautaTienda).toBe(true);
    expect(p.pautaMeta).toBe(false);
  });

  it("sólo sin Google: todo sigue a la vista", () => {
    expect(con({ pauta_meta: true, pauta_google: false })).toEqual(TODO_VISIBLE);
  });

  it("sin Product Ads: fuera el MER Mercado Libre y el ROAS; la tarjeta de ML queda", () => {
    const p = con({ ml_product_ads: false });
    expect(p.productAds).toBe(false);
    expect(p.mercadoLibre).toBe(true);
  });
});

describe("Aviso de margen de muestra y tabla de Economía dicen lo mismo", () => {
  it("1ac7186c: sin mix declarado el motor publica el total, así que no hay aviso de muestra", () => {
    expect(caso.derivados.cobertura_canales).toBe(0);
    expect(caso.derivados.margen_contribucion).toBe(0.639);
    expect(avisoMargenMuestra(caso.derivados)).toBe(false);
  });

  it("mix declarado por debajo de 100: el total queda retenido y el aviso sale", () => {
    const d = calcular({ ...titanDosCanales, canal_ml_pct: null });
    expect(d.cobertura_canales).toBe(40);
    expect(d.margen_contribucion).toBeNull();
    expect(typeof d.margen_muestra).toBe("number");
    expect(avisoMargenMuestra(d)).toBe(true);
  });

  it("mix al 100%: sin aviso", () => {
    expect(avisoMargenMuestra(calcular(titanDosCanales))).toBe(false);
  });

  it("en todos los fixtures, aviso implica total retenido", () => {
    const todos = [
      casoSnakeStore,
      casoSnakeStoreCoberturaCompleta,
      casoTitanWebB1,
      casoTitanWebB1CoberturaCompleta,
      casoTitanWebB1AntesDeCanales,
      titanDosCanales,
      { ...titanDosCanales, canal_ml_pct: 30 },
    ];
    for (const datos of todos) {
      const d = calcular(datos);
      if (avisoMargenMuestra(d)) expect(d.margen_contribucion).toBeNull();
      if (typeof d.margen_contribucion === "number") expect(avisoMargenMuestra(d)).toBe(false);
    }
  });
});

describe("H-42: todo faltante del motor tiene nombre legible", () => {
  const BASES: DatosDiagnostico[] = [
    DATOS_INICIALES,
    { ...DATOS_INICIALES, ...caso.datos },
    casoSnakeStore,
    casoSnakeStoreCoberturaCompleta,
    casoTitanWebB1,
    casoTitanWebB1CoberturaCompleta,
    casoTitanWebB1AntesDeCanales,
    titanDosCanales,
  ];
  const VARIANTES: Partial<DatosDiagnostico>[] = [
    {},
    { carritos_abandonados: 500, retencion_recuperacion_pct_actual: null },
    { recompra_compradores_unicos: 100 },
    { financiacion_pct_ventas: 30, financiacion_costo_pct: null },
    { descuento_pct: 10, descuento_pct_ventas: null },
    {
      financiacion_pct_ventas: 70,
      descuento_pct_ventas: 60,
      financiacion_costo_pct: 10,
      descuento_pct: 10,
    },
    {
      canal_tienda_pct: 40,
      canal_tienda_no_aplica: false,
      canal_tienda_financiacion_pct_ventas: 20,
    },
    { canal_tienda_pct: 40, canal_tienda_no_aplica: false, canal_tienda_descuento_pct: 10 },
    { canal_ml_pct: 50, canal_ml_financiacion_costo_pct: 10 },
    { canal_ml_pct: 50, canal_ml_descuento_pct_ventas: 10 },
    { canal_tienda_pct: 70, canal_tienda_no_aplica: false, canal_ml_pct: 60 },
    { producto_1_pct_facturacion: 150 },
    { producto_1_pct_facturacion: 30, producto_2_pct_facturacion: null },
    { margen_declarado_min: 90, margen_declarado_max: 95, margen_declarado_confirmado: true },
    { producto_1_costo: 100_000_000, producto_2_costo: 100_000_000, producto_3_costo: 100_000_000 },
    { visitas_mensuales: 1000, facturacion_mensual: null },
    { inversion_meta: 100_000, facturacion_mensual: null },
    { ticket_promedio: null, costo_envio_promedio: null },
    { visitas_mensuales: -5 },
  ];
  // Sin configuración: comisiones sin resolver y parámetros de retención ausentes.
  const CONFIGS: ConfiguracionCalculo[] = [cfg, {}];

  const emitidos = new Set<string>();
  for (const base of BASES)
    for (const variante of VARIANTES)
      for (const config of CONFIGS)
        for (const modo of ["A", "B"] as const)
          for (const f of calcularDiagnostico({ ...base, ...variante }, config, modo).fugas)
            for (const c of f.faltantes) emitidos.add(c);

  it("los recorridos del motor ejercitan las ramas (el barrido no está vacío)", () => {
    for (const c of [
      "retencion_recuperacion_pct_actual",
      "recuperacion_carrito_esperada",
      "recompra_esperada",
      "margen_en_contradiccion",
      "comision_plataforma",
    ]) {
      expect(emitidos).toContain(c);
    }
  });

  it("ningún faltante emitido cae al id crudo", () => {
    const sinEtiqueta = [...emitidos].filter((c) => !(c in ETIQUETAS_CAMPO));
    expect(sinEtiqueta).toEqual([]);
  });

  it("ningún id literal que el motor pone en faltantes queda sin etiqueta", () => {
    const fuentes = ["calculo-diagnostico.ts", "funnel.ts", "canales.ts"].map((f) =>
      readFileSync(resolve(__dirname, f), "utf8"),
    );
    const patrones = [
      /\bfaltan(?:Base)?\.push\(([^;]*?)\);/g,
      /\bfaltantes: \[([^\]]*)\]/g,
      /\bfaltantes\(datos, \[([^\]]*)\]\)/g,
      /for \(const c of \[([^\]]*)\]\)/g,
    ];
    const literales = new Set<string>();
    for (const fuente of fuentes)
      for (const patron of patrones)
        for (const m of fuente.matchAll(patron))
          for (const s of m[1]!.matchAll(/"([a-z0-9_.]+)"/g)) literales.add(s[1]!);
    expect(literales.size).toBeGreaterThan(20);
    expect([...literales].filter((c) => !(c in ETIQUETAS_CAMPO))).toEqual([]);
  });

  it("los ids armados por prefijo de canal también tienen etiqueta", () => {
    for (const canal of ["canal_tienda", "canal_ml"])
      for (const sufijo of [
        "financiacion_pct_ventas",
        "financiacion_costo_pct",
        "descuento_pct_ventas",
        "descuento_pct",
      ])
        expect(etiquetaCampo(`${canal}_${sufijo}`)).not.toBe(`${canal}_${sufijo}`);
  });

  it("el caso reportado ya no muestra el id", () => {
    expect(etiquetaCampo("retencion_recuperacion_pct_actual")).toBe(
      "porcentaje de recuperación de carritos actual",
    );
  });
});
