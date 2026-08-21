/**
 * Fixtures calculadas a mano para el modelo de impactos económicos.
 *
 * Bloque 1 de `docs/decision-2026-08-21-impactos-economicos.md`. Los números
 * de este archivo NO se derivan llamando al código bajo prueba: son cuentas
 * hechas a mano, documentadas paso a paso en los comentarios, para que un
 * test que compare contra ellas no sea circular. Los bloques 2 a 5 escriben
 * las funciones puras que estos números describen (`tramosFunnel` con
 * impactos, `aplicarRampa`, `consolidarAhorroPublicitario`,
 * `impactosDeFugaLegado`) y los tests correspondientes importan estas
 * constantes para verificar el resultado real contra la cuenta manual.
 *
 * No se importa nada de `./funnel`, `./calculo-diagnostico` ni
 * `./escenarios-90d`: si un import de ese tipo aparece acá, este archivo dejó
 * de ser independiente del código probado.
 */

// ---------------------------------------------------------------------------
// 1. Funnel: facturación incremental vs. contribución incremental, por tramo
//    y agregado (los tres tramos son disjuntos y sí se suman entre sí).
// ---------------------------------------------------------------------------

/**
 * Funnel de entrada, construido a mano (no viene de `evaluarFunnel`):
 *   visitas = 10.000, agregados = 1.000, checkouts = 200, compras = 100.
 * Probabilidades exactas:
 *   p_carrito_dado_visita   = 1.000 / 10.000 = 0,10
 *   p_checkout_dado_carrito =   200 /  1.000 = 0,20
 *   p_compra_dado_checkout  =   100 /    200 = 0,50
 * Mejoras (defaults de `MEJORAS_FUNNEL_DEFECTO`): 2 / 10 / 10 puntos.
 * Ningún techo se activa (todas las mejoras quedan muy por debajo de
 * `1 - tasa_actual`), así que las mejoras aplicadas son exactamente
 * 0,02 / 0,10 / 0,10.
 *
 * Unidades recuperables por tramo:
 *   navegación = visitas   × 0,02 × p_checkout × p_compra = 10.000×0,02×0,2×0,5 = 20
 *   carrito    = agregados ×        0,10 × p_compra        =  1.000×0,10×0,5    = 50
 *   checkout   = checkouts ×               0,10             =    200×0,10       = 20
 *
 * ticket = 1.000. margen = 0,5 (parámetro directo de `tramosFunnel`, no
 * pasa por la cascada de comisiones/envío/financiación: eso es harina de
 * otro costal — margen ya es un input de esa función hoy).
 */
export const FUNNEL_MANUAL = {
  entrada: {
    visitas: 10_000,
    agregados_carrito: 1_000,
    checkouts_iniciados: 200,
    compras: 100,
    p_carrito_dado_visita: 0.1,
    p_checkout_dado_carrito: 0.2,
    p_compra_dado_checkout: 0.5,
    cr_global: 0.01,
  },
  ticket: 1_000,
  margen: 0.5,
  mejoras_pts: { agregado: 2, checkout: 10, compra: 10 },

  unidadesPorTramo: {
    funnel_navegacion: 20,
    funnel_carrito: 50,
    funnel_checkout: 20,
  },

  /** unidades × ticket, por tramo. */
  facturacionIncrementalPorTramo: {
    funnel_navegacion: 20 * 1_000, // 20.000
    funnel_carrito: 50 * 1_000, // 50.000
    funnel_checkout: 20 * 1_000, // 20.000
  },

  /**
   * facturación incremental × margen, por tramo. Coincide con el
   * `monto` legado de cada tramo (unidades × ticket × margen): eso ya era
   * contribución, aunque nunca se llamó así.
   */
  contribucionIncrementalPorTramo: {
    funnel_navegacion: 20 * 1_000 * 0.5, // 10.000
    funnel_carrito: 50 * 1_000 * 0.5, // 25.000
    funnel_checkout: 20 * 1_000 * 0.5, // 10.000
  },

  /** Suma de los tres tramos disjuntos, por magnitud. Nunca se cruzan entre sí. */
  totales: {
    facturacionIncremental: 20_000 + 50_000 + 20_000, // 90.000
    contribucionIncremental: 10_000 + 25_000 + 10_000, // 45.000
  },

  /**
   * Lo que NUNCA debe aparecer en ningún cálculo: la suma de facturación +
   * contribución tratada como si fuera una sola magnitud.
   */
  sumaIncompatibleQueNuncaDebeAparecer: 90_000 + 45_000, // 135.000
} as const;

// ---------------------------------------------------------------------------
// 2. Curvas de rampa: misma base, familias distintas según la magnitud.
// ---------------------------------------------------------------------------

/**
 * Aplicar la curva "conservador" de facturación/contribución (25 % / 50 % /
 * 75 %) a una base mensual de 90.000 (la facturación incremental total del
 * fixture de funnel de arriba):
 *   mes1 = 90.000 × 0,25 = 22.500
 *   mes2 = 90.000 × 0,50 = 45.000
 *   mes3 = 90.000 × 0,75 = 67.500
 *   acumulado90d = 22.500 + 45.000 + 67.500 = 135.000
 *   ritmoMensualDia90 = 67.500 (el nivel del mes 3, NO acumulado90d / 3 = 45.000)
 */
export const RAMPA_FACTURACION_CONSERVADOR_SOBRE_90000 = {
  base: 90_000,
  mes1: 22_500,
  mes2: 45_000,
  mes3: 67_500,
  acumulado90d: 135_000,
  ritmoMensualDia90: 67_500,
} as const;

/** Misma curva, aplicada a la contribución incremental total (45.000). */
export const RAMPA_CONTRIBUCION_CONSERVADOR_SOBRE_45000 = {
  base: 45_000,
  mes1: 11_250,
  mes2: 22_500,
  mes3: 33_750,
  acumulado90d: 67_500,
  ritmoMensualDia90: 33_750,
} as const;

/**
 * Curva "conservador" de ahorro publicitario (50 % / 75 % / 100 %) aplicada
 * a una base de 40.000 (el ahorro consolidado del fixture 3 más abajo):
 *   mes1 = 40.000 × 0,50 = 20.000
 *   mes2 = 40.000 × 0,75 = 30.000
 *   mes3 = 40.000 × 1,00 = 40.000
 *   acumulado90d = 20.000 + 30.000 + 40.000 = 90.000
 *   ritmoMensualDia90 = 40.000
 */
export const RAMPA_AHORRO_CONSERVADOR_SOBRE_40000 = {
  base: 40_000,
  mes1: 20_000,
  mes2: 30_000,
  mes3: 40_000,
  acumulado90d: 90_000,
  ritmoMensualDia90: 40_000,
} as const;

/**
 * Demostración aislada de "curvas distintas por magnitud": la MISMA base
 * (100.000) bajo las dos familias conservadoras da mes 1 distinto.
 *   familia facturación/contribución: 100.000 × 0,25 = 25.000
 *   familia ahorro publicitario:      100.000 × 0,50 = 50.000
 */
export const MISMA_BASE_CURVAS_DISTINTAS = {
  base: 100_000,
  mes1FamiliaFacturacionContribucion: 25_000,
  mes1FamiliaAhorro: 50_000,
} as const;

// ---------------------------------------------------------------------------
// 3. Consolidación de ahorro publicitario: máximo, no suma; nunca supera la
//    inversión elegible.
// ---------------------------------------------------------------------------

export const AHORRO_PUBLICITARIO_MANUAL = {
  /**
   * Caso A — solapamiento sin necesidad de topear.
   * gasto_no_rentable = 250.000, sobrefragmentacion = 300.000,
   * inversión elegible = 500.000.
   * max(250.000, 300.000) = 300.000 (NUNCA 250.000 + 300.000 = 550.000).
   * 300.000 ≤ 500.000, no hace falta topear.
   */
  casoA_solapamientoSinTope: {
    gastoNoRentable: 250_000,
    sobrefragmentacion: 300_000,
    inversionElegible: 500_000,
    consolidadoEsperado: 300_000,
    sumaIncompatibleQueNuncaDebeAparecer: 550_000,
    origenEsperado: "sobrefragmentacion",
  },

  /**
   * Caso B — el máximo supera la inversión elegible: se topea.
   * gasto_no_rentable = 90.000, sobrefragmentacion = 150.000,
   * inversión elegible = 100.000.
   * max(90.000, 150.000) = 150.000 > 100.000 → se topea a 100.000.
   */
  casoB_topeAplicado: {
    gastoNoRentable: 90_000,
    sobrefragmentacion: 150_000,
    inversionElegible: 100_000,
    consolidadoEsperado: 100_000,
  },

  /**
   * Caso C — sólo una de las dos fugas es calculable: se usa esa sola,
   * no hay "máximo" que tomar entre dos números, pero tampoco se inventa
   * el otro lado como cero.
   * gasto_no_rentable = no calculable (null), sobrefragmentacion = 70.000,
   * inversión elegible = 200.000.
   */
  casoC_soloUnaCalculable: {
    gastoNoRentable: null,
    sobrefragmentacion: 70_000,
    inversionElegible: 200_000,
    consolidadoEsperado: 70_000,
    origenEsperado: "sobrefragmentacion",
  },

  /** Caso D1 — no hay inversión publicitaria declarada: no es un cero, es "no aplica". */
  casoD1_sinInversionPublicitaria: {
    gastoNoRentable: null,
    sobrefragmentacion: null,
    inversionElegible: null,
    consolidadoEsperado: null,
    calculableEsperado: false,
  },

  /** Caso D2 — hay inversión, pero ninguna de las dos fugas es calculable con los datos actuales. */
  casoD2_inversionSinAhorroCalculable: {
    gastoNoRentable: null,
    sobrefragmentacion: null,
    inversionElegible: 500_000,
    consolidadoEsperado: null,
    calculableEsperado: false,
  },
} as const;

// ---------------------------------------------------------------------------
// 4. Facturación proyectada: nunca se suma contribución ni ahorro.
// ---------------------------------------------------------------------------

/**
 * facturación actual = 1.000.000.
 * facturación incremental habilitada (mes 1, curva conservador sobre la base
 * de 90.000 del fixture 1) = 22.500 (de `RAMPA_FACTURACION_CONSERVADOR_SOBRE_90000`).
 * contribución incremental habilitada (mes 1, sobre 45.000) = 11.250 — no
 * participa de la proyección.
 * ahorro publicitario habilitado (mes 1, sobre 40.000) = 20.000 — tampoco
 * participa.
 *
 * facturación proyectada mes 1 = 1.000.000 + 22.500 = 1.022.500.
 * Lo que NUNCA debe aparecer: 1.000.000 + 22.500 + 11.250 + 20.000 = 1.053.750.
 */
export const FACTURACION_PROYECTADA_MANUAL = {
  facturacionActual: 1_000_000,
  facturacionIncrementalHabilitadaMes1: 22_500,
  contribucionIncrementalHabilitadaMes1: 11_250,
  ahorroPublicitarioHabilitadoMes1: 20_000,
  facturacionProyectadaMes1Esperada: 1_022_500,
  sumaIncompatibleQueNuncaDebeAparecer: 1_053_750,
} as const;

// ---------------------------------------------------------------------------
// 5. Compatibilidad con diagnósticos legados: el monto no se reclasifica.
// ---------------------------------------------------------------------------

/**
 * Fuga tal como la persistió un diagnóstico calculado ANTES de este cambio:
 * sólo trae `monto`/`calculable`/`tipo`, nunca `impactos` (el campo no
 * existía). `impactosDeFugaLegado` debe producir un único impacto de tipo
 * "no_clasificado", con `montoMensual: null` (nunca 50.000 reinterpretado
 * como facturación, contribución o ahorro) y `confianza: "retenida"`.
 */
export const FUGA_LEGADA_MANUAL = {
  fugaPersistida: {
    id: "funnel_carrito",
    etiqueta: "Fuga por carrito",
    tipo: "monto" as const,
    monto: 50_000,
    calculable: true,
    faltantes: [] as string[],
  },
  impactoEsperado: {
    tipo: "no_clasificado" as const,
    montoMensual: null,
    moneda: "ARS" as const,
    periodo: "mensual" as const,
    confianza: "retenida" as const,
  },
} as const;

// ---------------------------------------------------------------------------
// 6. Retenido nunca es cero real: dos ceros distintos en el mismo escenario.
// ---------------------------------------------------------------------------

/**
 * Caso A: cero real. Si las unidades recuperables de un tramo son 0 (por
 * ejemplo, checkouts = 0), la facturación incremental de ese tramo es
 * 0 × ticket = 0. Es un cero verdadero: el negocio no tiene nada que
 * recuperar ahí, y el dato existe (`confianza: "alta"`, `montoMensual: 0`).
 *
 * Caso B: retenido. Si falta el margen de contribución, la contribución
 * incremental de ese mismo tramo NO es 0: es `montoMensual: null`,
 * `confianza: "retenida"`. Nunca deben verse iguales.
 */
export const RETENIDO_NO_ES_CERO_MANUAL = {
  ceroReal: { unidades: 0, ticket: 1_000, facturacionIncrementalEsperada: 0 },
  retenido: { motivo: "No se declaró (o no es válido) el margen de contribución." },
} as const;
