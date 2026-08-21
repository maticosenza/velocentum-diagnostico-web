/**
 * Armado del insumo que se le manda al modelo para redactar la propuesta.
 * Lógica pura: no hay llamadas externas acá.
 */

import type { DatosDiagnostico, NotasDiagnostico } from "./diagnostico-form";
import type { Derivados, EstadosBloque, Fuga } from "./calculo-diagnostico";
import { productosCargados } from "./calculo-diagnostico";

export const SERVICIOS = [
  "Meta Ads",
  "Google Ads",
  "Product Ads en Mercado Libre",
  "Planificación de contenido",
  "Web e-commerce",
] as const;

export type Capa = "servicio" | "recomendacion" | "contexto";

export type HallazgoMapeado = {
  id: string;
  titulo: string;
  capa: Capa;
  servicio: string | null;
  nota?: string;
  /** Condiciones que dispararon el hallazgo, para que el modelo redacte con todo el cuadro. */
  contexto?: string[];
};

export type PropuestaGenerada = {
  resumen: string;
  hallazgos: {
    titulo: string;
    capa: Capa;
    que_encontramos: string;
    que_significa: string;
    que_hacemos: string;
    servicio: string | null;
  }[];
  plan_90_dias: { etapa: string; acciones: string[] }[];
  servicios_recomendados: string[];
  proximos_pasos: string;
};

function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Respuestas que, aunque estén cargadas, dicen que el cliente no lo tiene claro. */
const INDICA_FALTA =
  /(^|\W)(no s[eé]|no sabe|ni idea|ninguno|ninguna|nada|no tiene|no hay|no lo tiene|no est[aá] claro|sin definir|todav[ií]a no)(\W|$)/i;

/** Hallazgos detectados a partir del diagnóstico, con su capa y servicio mapeados. */
export function mapearHallazgos(
  datos: DatosDiagnostico,
  derivados: Derivados,
  estados: Partial<EstadosBloque>,
  fugas: Fuga[],
): HallazgoMapeado[] {
  const h: HallazgoMapeado[] = [];
  // Una contradicción crítica confirmada tira abajo todo lo que se apoya en el margen.
  const margenBloqueado = derivados.contradiccion_margen?.bloquea === true;
  const fuga = (id: string) => fugas.find((f) => f.id === id);
  const conMonto = (id: string) => {
    const f = fuga(id);
    return f && f.tipo === "monto" && typeof f.monto === "number" && f.monto > 0;
  };

  // Solo con el bloque en rojo. "sin_datos" significa que no sabemos: no afirmamos nada.
  if (estados.medicion === "rojo") {
    h.push({
      id: "medicion",
      titulo: "Medición desalineada entre el Pixel y la facturación real",
      capa: "servicio",
      servicio: null,
      nota: "Se resuelve dentro del plan como parte del seteo inicial, no se cobra aparte.",
    });
  }

  if (!margenBloqueado && (conMonto("gasto_no_rentable") || estados.economia === "rojo")) {
    h.push({
      id: "mer_bajo",
      titulo: "MER por debajo del breakeven",
      capa: "servicio",
      servicio: "Meta Ads",
    });
  }

  // Los tres síntomas de estructura de cuenta se leen como un solo problema.
  // Sin campañas corriendo no hay estructura que criticar.
  {
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    // La inversión publicitaria del negocio incluye Product Ads: la ausencia de
    // Meta y Google no significa que el cliente no invierta.
    const hayInversion =
      derivados.hay_inversion_publicitaria === true || num(datos.presupuesto_diario) > 0;

    const condiciones: string[] = [];
    if (hayInversion) {
      if (conMonto("sobrefragmentacion")) {
        condiciones.push(
          "Hay más conjuntos activos que los que el presupuesto puede sostener por encima del piso de aprendizaje.",
        );
      }
      if (derivados.volumen_suficiente === false) {
        condiciones.push(
          "El volumen de compras del negocio no alcanza para que un conjunto optimizado por compra salga del aprendizaje.",
        );
      }
      if (
        typeof derivados.inversion_actual_mensual === "number" &&
        typeof derivados.piso_mensual_un_conjunto === "number" &&
        derivados.inversion_actual_mensual < derivados.piso_mensual_un_conjunto
      ) {
        condiciones.push(
          "La inversión mensual actual está por debajo del piso que necesita un solo conjunto para aprender.",
        );
      }
    }
    if (condiciones.length > 0) {
      h.push({
        id: "estructura_cuenta",
        titulo: "Estructura de cuenta fragmentada para el volumen del negocio",
        capa: "servicio",
        servicio: "Meta Ads",
        contexto: condiciones,
        nota: "Redactalo como un único hallazgo, en un solo párrafo, integrando todas las condiciones del contexto.",
      });
    }
  }

  // Mix desalineado: el producto que más factura tiene margen por debajo del ponderado.
  // Solo si el bloque de economía tiene datos suficientes.
  if (estados.economia !== "sin_datos" && !margenBloqueado) {
    const cargados = productosCargados(datos);
    const margenes = derivados.margenes_producto ?? [];
    const ponderado = derivados.margen_contribucion;
    const principal = cargados
      .filter((p) => typeof p.pct === "number" && (p.pct as number) > 0)
      .sort((a, b) => (b.pct as number) - (a.pct as number))[0];
    const margenPrincipal = principal ? margenes[principal.indice - 1] : null;
    if (
      typeof ponderado === "number" &&
      typeof margenPrincipal === "number" &&
      margenPrincipal < ponderado
    ) {
      h.push({
        id: "mix_producto",
        titulo: "Mix de producto desalineado con el margen",
        capa: "servicio",
        servicio: "Meta Ads",
      });
    }
  }

  // Un hallazgo por tramo del funnel: los tramos son disjuntos, así que no
  // hay riesgo de contar dos veces a la misma gente.
  const tramos: { fuga: string; id: string; titulo: string; servicio: string }[] = [
    {
      fuga: "funnel_navegacion",
      id: "funnel_navegacion",
      titulo: "Pocas visitas llegan a agregar al carrito",
      servicio: "Web e-commerce",
    },
    {
      fuga: "funnel_carrito",
      id: "funnel_carrito",
      titulo: "Carritos que no llegan al checkout",
      servicio: "Web e-commerce y Meta Ads",
    },
    {
      fuga: "funnel_checkout",
      id: "funnel_checkout",
      titulo: "Checkouts iniciados que no terminan en compra",
      servicio: "Web e-commerce",
    },
    {
      fuga: "funnel_combinado",
      id: "funnel_combinado",
      titulo: "Conversión del sitio por debajo del umbral",
      servicio: "Web e-commerce",
    },
  ];
  for (const t of tramos) {
    if (estados.funnel_web !== "sin_datos" && conMonto(t.fuga)) {
      h.push({ id: t.id, titulo: t.titulo, capa: "servicio", servicio: t.servicio });
    }
  }

  if (datos.retargeting_abandono === false) {
    h.push({
      id: "sin_retargeting",
      titulo: "Sin retargeting a abandonos",
      capa: "servicio",
      servicio: "Meta Ads",
    });
  }

  // Vender en Mercado Libre no prueba que falten clips: sólo el triestado
  // explícito en false activa el hallazgo. null o true no afirman nada.
  if (datos.vende_mercado_libre === true && datos.ml_tiene_clips === false) {
    h.push({
      id: "clips_ml",
      titulo: "Publicaciones de Mercado Libre sin clips",
      capa: "servicio",
      servicio: "Product Ads en Mercado Libre",
    });
  }

  if (estados.creativos === "amarillo" || estados.creativos === "rojo") {
    h.push({
      id: "creativos",
      titulo: "Ritmo de creativos nuevos por mes",
      capa: "servicio",
      servicio: "Planificación de contenido",
    });
  }

  // Solo si algo se cargó y lo cargado dice que no lo tienen claro.
  // Con los dos campos vacíos no hay hallazgo: no anunciamos lo que no preguntamos.
  {
    const angulo = texto(datos.angulo_que_funciona);
    const dolor = texto(datos.dolor_cliente);
    const cargados = [angulo, dolor].filter((t): t is string => t !== null);
    const sinClaridad = cargados.some((t) => INDICA_FALTA.test(t));
    if (cargados.length > 0 && (sinClaridad || cargados.length === 1)) {
      h.push({
        id: "angulo",
        titulo: "Sin ángulo identificado o sin dolor del cliente definido",
        capa: "servicio",
        servicio: "Planificación de contenido",
      });
    }
  }

  if (datos.vende_mercado_libre) {
    if (datos.ml_product_ads === true) {
      h.push({
        id: "product_ads",
        titulo: "Product Ads sin ROAS objetivo por familia",
        capa: "servicio",
        servicio: "Product Ads en Mercado Libre",
      });
    }
  }

  const financiacionConfirmada = [
    [datos.financiacion_pct_ventas, datos.financiacion_costo_pct],
    [datos.canal_tienda_financiacion_pct_ventas, datos.canal_tienda_financiacion_costo_pct],
    [datos.canal_ml_financiacion_pct_ventas, datos.canal_ml_financiacion_costo_pct],
  ].some(
    ([participacion, costo]) =>
      typeof participacion === "number" &&
      Number.isFinite(participacion) &&
      participacion > 0 &&
      typeof costo === "number" &&
      Number.isFinite(costo) &&
      costo > 0,
  );
  if (
    !margenBloqueado &&
    financiacionConfirmada &&
    typeof derivados.margen_contribucion === "number" &&
    derivados.margen_contribucion < 0.35
  ) {
    h.push({
      id: "cuotas",
      titulo: "Cuotas sin interés sobre producto de margen fino",
      capa: "recomendacion",
      servicio: null,
    });
  }

  if (
    typeof derivados.comision_plataforma === "number" ||
    typeof derivados.comision_pasarela === "number" ||
    datos.vende_mercado_libre
  ) {
    h.push({
      id: "comisiones",
      titulo: "Comisiones de la plataforma y del marketplace",
      capa: "contexto",
      servicio: null,
    });
  }

  return h;
}

/** JSON que recibe el modelo. Solo datos ya calculados, nunca cálculos nuevos. */
export function armarInsumoPropuesta(args: {
  datos: DatosDiagnostico;
  derivados: Derivados;
  estados: Partial<EstadosBloque>;
  fugas: Fuga[];
  notas: NotasDiagnostico;
  oportunidad_total: number;
  nombre_tienda: string;
  vertical: string | null;
  plataforma: string | null;
}) {
  const { datos, derivados, estados, fugas, notas } = args;
  return {
    tienda: {
      nombre: args.nombre_tienda,
      vertical: args.vertical,
      plataforma: args.plataforma,
      vende_mercado_libre: datos.vende_mercado_libre === true,
    },
    derivados: {
      margen_contribucion: derivados.margen_contribucion,
      breakeven_roas: derivados.breakeven_roas,
      cpa_objetivo: derivados.cpa_objetivo,
      roas_objetivo: derivados.roas_objetivo,
      mer_actual: derivados.mer_actual,
      mer_tienda_propia: derivados.mer_tienda_propia,
      mer_marketplace: derivados.mer_marketplace,
      roas_product_ads: derivados.roas_product_ads,
      inversion_publicitaria_total: derivados.inversion_publicitaria_total,
      hay_inversion_publicitaria: derivados.hay_inversion_publicitaria,
      contradiccion_margen: derivados.contradiccion_margen,
      piso_mensual_un_conjunto: derivados.piso_mensual_un_conjunto,
      inversion_actual_mensual: derivados.inversion_actual_mensual,
      pedidos_semanales: derivados.pedidos_semanales,
      volumen_suficiente: derivados.volumen_suficiente,
    },
    estados_bloque: estados,
    oportunidad_total: args.oportunidad_total,
    fugas: fugas
      .filter((f) => f.calculable !== false)
      .map((f) => ({
        id: f.id,
        etiqueta: f.etiqueta,
        tipo: f.tipo,
        monto: f.monto,
        sospechosa: f.sospechosa === true,
        detalle: f.detalle ?? null,
      })),
    contenido: {
      frecuencia_creativos: texto(datos.frecuencia_creativos),
      formato_creativos: texto(datos.formato_creativos),
      angulo_que_funciona: texto(datos.angulo_que_funciona),
      dolor_cliente: texto(datos.dolor_cliente),
      consultas_por_organico:
        typeof datos.consultas_por_organico === "boolean" ? datos.consultas_por_organico : null,
    },
    notas_del_cliente: Object.fromEntries(
      Object.entries(notas ?? {}).filter(([, v]) => texto(v) !== null),
    ),
    hallazgos: mapearHallazgos(datos, derivados, estados, fugas),
    servicios_disponibles: SERVICIOS,
  };
}

export const PROMPT_PROPUESTA = `Sos analista de Velocentum, una agencia argentina de performance marketing para e-commerce.
Escribís en español rioplatense, usando "vos". Registro profesional y directo, sin emojis,
sin signos de exclamación, sin lenguaje de venta inflado.

Recibís un diagnóstico ya calculado. Tu trabajo es redactarlo como propuesta, no analizarlo
ni recalcularlo.

Reglas duras:
- No inventes ni recalcules ningún número. Usá exactamente los que recibís.
- Cada hallazgo llega con una etiqueta de capa. Respetala sin excepción:
  · "servicio": presentás el hallazgo primero y después el servicio de Velocentum que lo resuelve.
  · "recomendacion": presentás el hallazgo y qué debería hacer el cliente. No menciones ningún
    servicio de Velocentum ni sugieras que podríamos ayudarlo con esto.
  · "contexto": solo explicás qué significa el dato. No hay acción ni servicio.
- Nunca fuerces un servicio sobre un hallazgo que no lo tiene mapeado. Un informe con hallazgos
  que no vendemos es más creíble que uno donde todo coincide con nuestra oferta.
- Si una fuga viene marcada como sospechosa, no uses su monto como si fuera certero. Presentala
  como un orden de magnitud a confirmar con más datos.
- Si un bloque está en verde, decilo. Un diagnóstico donde todo está mal no es creíble.
- No prometas resultados ni cifras de mejora que no estén en los datos de entrada.
- No menciones precios ni honorarios. Eso se conversa aparte.
- Nunca menciones que un dato no fue cargado, que un campo llegó vacío o que falta
  información. Si no tenés un dato, simplemente no hables de ese tema.
- Un hallazgo, un párrafo corto. Qué encontramos, qué significa en plata, qué se hace.

Devolvé únicamente un objeto JSON, sin markdown ni texto alrededor, con esta forma:
{
  "resumen": "dos o tres oraciones con la lectura general del negocio",
  "hallazgos": [
    { "titulo": "...", "capa": "servicio|recomendacion|contexto",
      "que_encontramos": "...", "que_significa": "...",
      "que_hacemos": "...", "servicio": "nombre del servicio o null" }
  ],
  "plan_90_dias": [
    { "etapa": "Días 1 a 30", "acciones": ["...", "..."] }
  ],
  "servicios_recomendados": ["..."],
  "proximos_pasos": "una o dos oraciones"
}`;

/** Valida y normaliza lo que devolvió el modelo. Devuelve null si no sirve. */
export function normalizarPropuesta(valor: unknown): PropuestaGenerada | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;
  const resumen = texto(v["resumen"]);
  if (!resumen) return null;

  const hallazgos = Array.isArray(v["hallazgos"])
    ? (v["hallazgos"] as unknown[])
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const o = x as Record<string, unknown>;
          const titulo = texto(o["titulo"]);
          if (!titulo) return null;
          const capaCruda = texto(o["capa"]);
          const capa: Capa =
            capaCruda === "recomendacion" || capaCruda === "contexto" ? capaCruda : "servicio";
          const servicio = texto(o["servicio"]);
          return {
            titulo,
            capa,
            que_encontramos: texto(o["que_encontramos"]) ?? "",
            que_significa: texto(o["que_significa"]) ?? "",
            que_hacemos: texto(o["que_hacemos"]) ?? "",
            servicio: capa === "servicio" ? servicio : null,
          };
        })
        .filter((x): x is PropuestaGenerada["hallazgos"][number] => x !== null)
    : [];

  if (hallazgos.length === 0) return null;

  const plan = Array.isArray(v["plan_90_dias"])
    ? (v["plan_90_dias"] as unknown[])
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const o = x as Record<string, unknown>;
          const etapa = texto(o["etapa"]);
          const acciones = Array.isArray(o["acciones"])
            ? (o["acciones"] as unknown[]).map((a) => texto(a)).filter((a): a is string => !!a)
            : [];
          if (!etapa || acciones.length === 0) return null;
          return { etapa, acciones };
        })
        .filter((x): x is { etapa: string; acciones: string[] } => x !== null)
    : [];

  const servicios = Array.isArray(v["servicios_recomendados"])
    ? (v["servicios_recomendados"] as unknown[])
        .map((s) => texto(s))
        .filter((s): s is string => !!s)
    : [];

  return {
    resumen,
    hallazgos,
    plan_90_dias: plan,
    servicios_recomendados: servicios,
    proximos_pasos: texto(v["proximos_pasos"]) ?? "",
  };
}

/** Extrae el JSON del texto devuelto por el modelo, tolerando cercos de markdown. */
export function parsearRespuestaModelo(texto_: string): PropuestaGenerada | null {
  const limpio = texto_
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const candidatos = [limpio];
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio >= 0 && fin > inicio) candidatos.push(limpio.slice(inicio, fin + 1));
  for (const c of candidatos) {
    try {
      const parsed = normalizarPropuesta(JSON.parse(c));
      if (parsed) return parsed;
    } catch {
      // seguimos con el próximo candidato
    }
  }
  return null;
}
