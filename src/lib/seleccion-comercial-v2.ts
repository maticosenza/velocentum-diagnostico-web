/**
 * BV4 · F2a etapa 2 — modelo de selección comercial v2.
 *
 * Extensión ADITIVA sobre lo que existe: el modelo v1 (`EscaleraPaquetes`,
 * `src/lib/paquetes.ts`) no se toca ni se importa para escribir, sólo para
 * conservar lo ya guardado. Este módulo declara la forma del sobre versionado
 * que la etapa 3 persiste en `diagnostico.propuesta`, el cálculo de totales, y
 * la lectura tolerante de todo lo anterior.
 *
 * Fuente normativa: `docs/funcional/f2a-panel-comercial-reconciliado.md`,
 * puntos d, e, f y g, con Q3–Q10 cerradas.
 *
 * ## Cinco garantías estructurales de este archivo
 *
 * 1. **No existe el total combinado** (Q10). `TotalesV2` tiene dos grupos
 *    independientes —"Inversión mensual" e "Inversión inicial / pago único"—
 *    y ningún campo que los sume. No es una regla que haya que recordar: no
 *    hay dónde escribirla.
 *
 * 2. **Los totales no se persisten** (Q6). `SeleccionComercialV2` no tiene un
 *    solo campo de total: se calculan con `calcularTotalesV2` cada vez que se
 *    muestran. Un total no editable es un total que no existe como dato.
 *    Tampoco hay redondeo: redondear es del formateo, no del cálculo.
 *
 * 3. **Precio unitario y precio de línea son excluyentes** (Q3). El precio es
 *    una unión discriminada por `modo`: o se carga unitario y se multiplica
 *    por la cantidad, o se carga el total de la línea. No hay forma de
 *    escribir los dos.
 *
 * 4. **Una línea seleccionada sin precio no vale cero.** El sistema nunca
 *    inventa un precio: esas líneas salen aparte, en `lineasSinPrecio`, para
 *    que el panel y la propuesta las marquen pendientes en vez de sumar un
 *    cero silencioso que subestima la inversión.
 *
 * 5. **La escalera legada se preserva, no se pisa** (condición de Matías al
 *    aprobar F-2, 2026-08-31). Vive en `SobreComercialV2.legado`, intacta, y
 *    la cadena v1 la sigue leyendo desde ahí: el documento v1 de un
 *    diagnóstico que pase a v2 produce exactamente lo mismo que antes.
 *
 * La condición fiscal **jamás se infiere de la moneda** (Q9): ARS y USD
 * llevan la misma estructura de subtotal neto, impuesto si corresponde y
 * total final.
 */

import {
  CATALOGO_COMERCIAL_V2,
  VERSION_CATALOGO_V2,
  esCuantificable,
  esLineaId,
  lineaV2,
  type LineaId,
  type RecurrenciaV2,
} from "./catalogo-v2";
import {
  normalizarEscaleraConfirmada,
  type EscaleraPaquetesConfirmada,
  type IdNivel,
} from "./paquetes";

/** Q4: una sola moneda por propuesta, consistente en panel y PDF. */
export type MonedaV2 = "ARS" | "USD";

export const MONEDAS_V2: readonly MonedaV2[] = ["ARS", "USD"];

export function esMonedaV2(valor: unknown): valor is MonedaV2 {
  return valor === "ARS" || valor === "USD";
}

/**
 * Q9: configuración fiscal explícita por propuesta. `confirmado: false`
 * bloquea la exportación, sumándose al candado de selección que ya existe.
 * El porcentaje sugerido es 21, pero es sugerencia: se confirma a mano.
 */
export type ConfiguracionFiscalV2 = {
  aplicaImpuesto: boolean;
  porcentaje: number;
  confirmado: boolean;
};

export const PORCENTAJE_FISCAL_SUGERIDO = 21;

export const FISCAL_INICIAL: ConfiguracionFiscalV2 = {
  aplicaImpuesto: true,
  porcentaje: PORCENTAJE_FISCAL_SUGERIDO,
  confirmado: false,
};

/** Q8: ruta de Diseño web. "ambas" existe por el precedente Titan Web. */
export type RutaDisenoWebV2 = "b2c" | "b2b" | "ambas";

export function esRutaV2(valor: unknown): valor is RutaDisenoWebV2 {
  return valor === "b2c" || valor === "b2b" || valor === "ambas";
}

/**
 * Q3: unión discriminada. `unitario` para las líneas cuantificables del
 * catálogo (el total de línea se calcula), `total` para las que no llevan
 * cantidad (se carga el total directo). `null` es "sin cargar", nunca cero.
 */
export type PrecioLineaV2 =
  | { modo: "unitario"; cantidad: number | null; precioUnitario: number | null }
  | { modo: "total"; precioLinea: number | null };

export type LineaSeleccionadaV2 = {
  lineaId: LineaId;
  seleccionada: boolean;
  /** Q10: efectiva, editable por línea. El catálogo sólo sugiere el default. */
  recurrencia: RecurrenciaV2;
  precio: PrecioLineaV2;
  /** Q8: sólo `diseno_web` la admite; `null` en las otras nueve. */
  ruta: RutaDisenoWebV2 | null;
};

/** Punto f del reconciliado: los agregados que son entidad propia. */
export type AgregadoId = "tracking_web" | "email_marketing" | "reportes" | "cro";

export type AgregadoCatalogoV2 = {
  id: AgregadoId;
  nombre: string;
  /** `por_nivel` lleva alcance que sigue al nivel elegido; `binario` es sí/no. */
  forma: "binario" | "por_nivel";
  disponibleEn: readonly IdNivel[];
  /** Textos del punto f, verbatim. `null` cuando la forma es binaria. */
  alcancePorNivel: Readonly<Record<IdNivel, string>> | null;
};

const TODOS_LOS_NIVELES: readonly IdNivel[] = ["impulso", "traccion", "escala"];

/**
 * Matriz de agregados del punto f. Retargeting, tracking de plataforma y
 * popup NO están acá a propósito: viven dentro de una línea (`meta_ads`,
 * cada línea de pauta, y `diseno_web` respectivamente), no son agregados.
 * Las rutas B2C/B2B tampoco: son atributo de `diseno_web` (Q8).
 *
 * Los agregados describen alcance incluido, no líneas facturables: no llevan
 * precio y por lo tanto no entran en ningún subtotal. Si alguna vez uno se
 * cobrara aparte, es una línea del catálogo, no un agregado.
 */
export const AGREGADOS_V2: readonly AgregadoCatalogoV2[] = [
  {
    id: "tracking_web",
    nombre: "Tracking web",
    forma: "binario",
    disponibleEn: TODOS_LOS_NIVELES,
    alcancePorNivel: null,
  },
  {
    id: "email_marketing",
    nombre: "Email marketing",
    forma: "por_nivel",
    disponibleEn: TODOS_LOS_NIVELES,
    alcancePorNivel: {
      impulso: "básico",
      traccion: "automatizaciones",
      escala: "segmentación y recompra",
    },
  },
  {
    id: "reportes",
    nombre: "Reportes",
    forma: "por_nivel",
    disponibleEn: TODOS_LOS_NIVELES,
    alcancePorNivel: { impulso: "mensual", traccion: "semanal", escala: "semanal" },
  },
  {
    id: "cro",
    nombre: "CRO",
    forma: "binario",
    disponibleEn: ["escala"],
    alcancePorNivel: null,
  },
];

const AGREGADO_POR_ID = new Map<AgregadoId, AgregadoCatalogoV2>(AGREGADOS_V2.map((a) => [a.id, a]));

export function esAgregadoId(valor: unknown): valor is AgregadoId {
  return typeof valor === "string" && AGREGADO_POR_ID.has(valor as AgregadoId);
}

export function agregadoDisponibleEn(id: AgregadoId, nivel: IdNivel): boolean {
  return AGREGADO_POR_ID.get(id)?.disponibleEn.includes(nivel) ?? false;
}

/**
 * El alcance sigue al nivel elegido (punto d): no se guarda, se deriva.
 * `null` para los binarios y para un agregado no disponible en ese nivel. Un
 * override futuro se modelaría explícito, nunca pisando esta derivación.
 */
export function alcanceDeAgregado(id: AgregadoId, nivel: IdNivel): string | null {
  const agregado = AGREGADO_POR_ID.get(id);
  if (!agregado || !agregado.disponibleEn.includes(nivel)) return null;
  return agregado.alcancePorNivel?.[nivel] ?? null;
}

export type AgregadoSeleccionadoV2 = { agregadoId: AgregadoId; incluido: boolean };

/**
 * La selección completa de una propuesta. `lineas` lleva SIEMPRE las diez del
 * catálogo, en su orden: el panel las muestra todas y la desmarcada es un
 * dato, no una ausencia.
 *
 * `nivel` es el nivel elegido para esta propuesta. Es lo que resuelve el
 * alcance de los agregados por nivel (punto d: "el alcance sigue al nivel
 * elegido") y las cantidades precargadas del panel (etapa 4). Q8 sigue
 * valiendo: elegir TRACCIÓN o ESCALA no preselecciona `diseno_web`.
 */
export type SeleccionComercialV2 = {
  nivel: IdNivel;
  lineas: LineaSeleccionadaV2[];
  agregados: AgregadoSeleccionadoV2[];
};

/**
 * El sobre versionado que vive en la clave `paquetes` de la columna
 * `diagnostico.propuesta` (F-2, opción (a) aprobada por Matías el
 * 2026-08-31). Se distingue de la escalera legada por `version === 2`: la
 * legada no tiene `version` y sí tiene `confirmado: true`.
 */
export type SobreComercialV2 = {
  version: typeof VERSION_CATALOGO_V2;
  moneda: MonedaV2;
  fiscal: ConfiguracionFiscalV2;
  seleccion: SeleccionComercialV2;
  /**
   * Condición de Matías al aprobar F-2: la escalera confirmada que hubiera
   * antes se PRESERVA acá, intacta. Si se pisara, el documento v1 de ese
   * diagnóstico cambiaría de contenido y se violaría el invariante de que
   * toda salida v1 siga produciendo lo mismo. `null` cuando no había ninguna.
   */
  legado: EscaleraPaquetesConfirmada | null;
};

// ---------------------------------------------------------------- totales

/** Un grupo de recurrencia cerrado: neto, impuesto si aplica, total. */
export type GrupoTotalesV2 = {
  subtotalNeto: number;
  /** `null` cuando la configuración fiscal no aplica impuesto (Q9). */
  impuesto: number | null;
  total: number;
};

/**
 * Q10: dos grupos, jamás uno solo. Este tipo es la garantía: no tiene ningún
 * campo que sume `mensual` con `unica`, así que un total combinado no es
 * representable. Un test lo verifica sobre el objeto devuelto.
 */
export type TotalesV2 = {
  mensual: GrupoTotalesV2;
  unica: GrupoTotalesV2;
  /**
   * Líneas seleccionadas cuyo precio no está cargado. NO se cuentan como
   * cero: el subtotal es parcial y quien lo muestre debe decirlo.
   */
  lineasSinPrecio: LineaId[];
};

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Total de una línea seleccionada. `null` = precio sin cargar; nunca cero por
 * defecto. Cuantificable: unitario × cantidad (Q3). Sin cantidad: el total
 * cargado. La recurrencia no interviene en el cálculo: define en qué grupo
 * cae, no cuánto vale.
 */
export function totalDeLinea(linea: LineaSeleccionadaV2): number | null {
  if (linea.precio.modo === "unitario") {
    const { cantidad, precioUnitario } = linea.precio;
    if (!finito(cantidad) || !finito(precioUnitario)) return null;
    return cantidad * precioUnitario;
  }
  return finito(linea.precio.precioLinea) ? linea.precio.precioLinea : null;
}

function cerrarGrupo(subtotalNeto: number, fiscal: ConfiguracionFiscalV2): GrupoTotalesV2 {
  const aplica = fiscal.aplicaImpuesto && finito(fiscal.porcentaje) && fiscal.porcentaje > 0;
  const impuesto = aplica ? (subtotalNeto * fiscal.porcentaje) / 100 : null;
  return { subtotalNeto, impuesto, total: subtotalNeto + (impuesto ?? 0) };
}

/**
 * Q6: totales calculados, nunca guardados ni editables. Sin redondeos ni
 * overrides — redondear es del formateo. Sólo suman las líneas seleccionadas
 * con precio cargado; las seleccionadas sin precio salen en `lineasSinPrecio`.
 *
 * La estructura es idéntica en ARS y USD: la moneda no interviene acá (Q9).
 */
export function calcularTotalesV2(
  seleccion: SeleccionComercialV2,
  fiscal: ConfiguracionFiscalV2,
): TotalesV2 {
  let netoMensual = 0;
  let netoUnico = 0;
  const lineasSinPrecio: LineaId[] = [];

  for (const linea of seleccion.lineas) {
    if (!linea.seleccionada) continue;
    const total = totalDeLinea(linea);
    if (total === null) {
      lineasSinPrecio.push(linea.lineaId);
      continue;
    }
    if (linea.recurrencia === "mensual") netoMensual += total;
    else netoUnico += total;
  }

  return {
    mensual: cerrarGrupo(netoMensual, fiscal),
    unica: cerrarGrupo(netoUnico, fiscal),
    lineasSinPrecio,
  };
}

/** Los agregados realmente aplicables: incluidos y disponibles en el nivel. */
export function agregadosEfectivosV2(
  seleccion: SeleccionComercialV2,
): { agregadoId: AgregadoId; nombre: string; alcance: string | null }[] {
  return seleccion.agregados
    .filter((a) => a.incluido && agregadoDisponibleEn(a.agregadoId, seleccion.nivel))
    .map((a) => ({
      agregadoId: a.agregadoId,
      nombre: AGREGADO_POR_ID.get(a.agregadoId)!.nombre,
      alcance: alcanceDeAgregado(a.agregadoId, seleccion.nivel),
    }));
}

// ---------------------------------------------------------------- validación

/**
 * Coherencia estructural de una selección, para pruebas y para el panel. No
 * valida importes (un precio sin cargar es un estado legítimo), sólo que la
 * forma respete el catálogo y las decisiones cerradas.
 */
export function problemasDeSeleccionV2(seleccion: SeleccionComercialV2): string[] {
  const problemas: string[] = [];

  const ids = seleccion.lineas.map((l) => l.lineaId);
  for (const linea of CATALOGO_COMERCIAL_V2.lineas) {
    if (!ids.includes(linea.id)) problemas.push(`falta la línea ${linea.id}`);
  }
  if (new Set(ids).size !== ids.length) problemas.push("hay líneas repetidas");

  for (const linea of seleccion.lineas) {
    const delCatalogo = lineaV2(linea.lineaId);
    const esperado = esCuantificable(delCatalogo) ? "unitario" : "total";
    if (linea.precio.modo !== esperado) {
      problemas.push(
        `${linea.lineaId}: precio en modo "${linea.precio.modo}", esperado "${esperado}"`,
      );
    }
    if (linea.ruta !== null && !delCatalogo.admiteRuta) {
      problemas.push(`${linea.lineaId}: no admite ruta B2C/B2B`);
    }
  }

  for (const agregado of seleccion.agregados) {
    if (agregado.incluido && !agregadoDisponibleEn(agregado.agregadoId, seleccion.nivel)) {
      problemas.push(`${agregado.agregadoId}: no está disponible en ${seleccion.nivel}`);
    }
  }

  return problemas;
}

// ---------------------------------------------------------------- lectura tolerante

function esNivel(valor: unknown): valor is IdNivel {
  return valor === "impulso" || valor === "traccion" || valor === "escala";
}

function normalizarPrecio(valor: unknown, cuantificable: boolean): PrecioLineaV2 {
  const v = (valor ?? {}) as Record<string, unknown>;
  if (cuantificable) {
    return {
      modo: "unitario",
      cantidad: finito(v["cantidad"]) ? v["cantidad"] : null,
      precioUnitario: finito(v["precioUnitario"]) ? v["precioUnitario"] : null,
    };
  }
  return { modo: "total", precioLinea: finito(v["precioLinea"]) ? v["precioLinea"] : null };
}

function normalizarLinea(valor: unknown): LineaSeleccionadaV2 | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;
  if (!esLineaId(v["lineaId"])) return null;
  const delCatalogo = lineaV2(v["lineaId"]);
  const recurrencia: RecurrenciaV2 =
    v["recurrencia"] === "mensual" || v["recurrencia"] === "unica"
      ? v["recurrencia"]
      : delCatalogo.recurrenciaSugerida;
  return {
    lineaId: delCatalogo.id,
    seleccionada: v["seleccionada"] === true,
    recurrencia,
    precio: normalizarPrecio(v["precio"], esCuantificable(delCatalogo)),
    ruta: delCatalogo.admiteRuta && esRutaV2(v["ruta"]) ? v["ruta"] : null,
  };
}

function normalizarFiscal(valor: unknown): ConfiguracionFiscalV2 {
  const v = (valor ?? {}) as Record<string, unknown>;
  return {
    aplicaImpuesto: v["aplicaImpuesto"] === true,
    porcentaje:
      finito(v["porcentaje"]) && v["porcentaje"] >= 0
        ? v["porcentaje"]
        : PORCENTAJE_FISCAL_SUGERIDO,
    confirmado: v["confirmado"] === true,
  };
}

/**
 * Lee el sobre v2 de un valor crudo de la columna. `null` si lo guardado no
 * es un sobre v2 — una escalera legada, la forma vieja sin sobre, `null`, o
 * cualquier otra cosa. Mismo criterio de validación superficial que
 * `normalizarEscaleraConfirmada`: el JSON es de origen interno, no
 * adversarial.
 *
 * Las líneas ausentes se completan desde el catálogo (desmarcadas, sin
 * precio) para que la selección siempre tenga las diez: una línea nueva del
 * catálogo no rompe una selección guardada antes de que existiera.
 */
export function normalizarSobreComercialV2(valor: unknown): SobreComercialV2 | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const v = valor as Record<string, unknown>;
  if (v["version"] !== VERSION_CATALOGO_V2) return null;

  const seleccionCruda = (v["seleccion"] ?? {}) as Record<string, unknown>;
  const lineasCrudas = Array.isArray(seleccionCruda["lineas"]) ? seleccionCruda["lineas"] : [];
  const leidas = new Map<LineaId, LineaSeleccionadaV2>();
  for (const cruda of lineasCrudas) {
    const linea = normalizarLinea(cruda);
    if (linea && !leidas.has(linea.lineaId)) leidas.set(linea.lineaId, linea);
  }

  const lineas = CATALOGO_COMERCIAL_V2.lineas.map(
    (delCatalogo) => leidas.get(delCatalogo.id) ?? lineaVaciaV2(delCatalogo.id),
  );

  const agregadosCrudos = Array.isArray(seleccionCruda["agregados"])
    ? seleccionCruda["agregados"]
    : [];
  const agregados: AgregadoSeleccionadoV2[] = [];
  for (const crudo of agregadosCrudos) {
    if (!crudo || typeof crudo !== "object") continue;
    const a = crudo as Record<string, unknown>;
    if (!esAgregadoId(a["agregadoId"])) continue;
    if (agregados.some((x) => x.agregadoId === a["agregadoId"])) continue;
    agregados.push({ agregadoId: a["agregadoId"], incluido: a["incluido"] === true });
  }

  return {
    version: VERSION_CATALOGO_V2,
    moneda: esMonedaV2(v["moneda"]) ? v["moneda"] : "ARS",
    fiscal: normalizarFiscal(v["fiscal"]),
    seleccion: {
      nivel: esNivel(seleccionCruda["nivel"]) ? seleccionCruda["nivel"] : "impulso",
      lineas,
      agregados,
    },
    legado: normalizarEscaleraConfirmada(v["legado"]),
  };
}

/** Una línea del catálogo sin tocar: desmarcada, sin precio, recurrencia sugerida. */
export function lineaVaciaV2(lineaId: LineaId): LineaSeleccionadaV2 {
  const delCatalogo = lineaV2(lineaId);
  return {
    lineaId,
    seleccionada: false,
    recurrencia: delCatalogo.recurrenciaSugerida,
    precio: esCuantificable(delCatalogo)
      ? { modo: "unitario", cantidad: null, precioUnitario: null }
      : { modo: "total", precioLinea: null },
    ruta: null,
  };
}

/**
 * Resuelve QUÉ escalera confirmada debe leer la cadena documental a partir
 * del valor crudo de la clave `paquetes`, cualquiera sea su forma:
 *
 *  - sobre v2  → la escalera preservada en `legado` (puede ser `null`);
 *  - escalera legada → ella misma;
 *  - cualquier otra cosa → `null`.
 *
 * Es el punto único que hace cumplir la condición de F-2: un diagnóstico que
 * pasa a v2 sigue produciendo el MISMO documento v1 que antes, porque su
 * escalera nunca se pisó.
 */
export function escaleraConfirmadaDesdeColumna(
  paquetesCrudo: unknown,
): EscaleraPaquetesConfirmada | null {
  const sobre = normalizarSobreComercialV2(paquetesCrudo);
  if (sobre) return sobre.legado;
  return normalizarEscaleraConfirmada(paquetesCrudo);
}
