/**
 * Fixtures numéricas manuales para la corrección de producto aprobada
 * 2026-08-21 (veredicto sobre 2685999). Complementan
 * `fixtures-impactos-manual.ts` (bloque 1, cálculo base) con dos
 * invariantes específicas de esta corrección:
 *
 *  1. Ninguna suma cruza magnitudes al nivel de ESCENARIO completo
 *     (facturación incremental, contribución incremental y ahorro
 *     publicitario acumulados a 90 días nunca se suman entre sí para
 *     ninguna cifra publicada — ni como "impacto total", ni como
 *     facturación proyectada).
 *  2. La regla de dispersión (potencial/conservador de contribución
 *     incremental) sí puede disparar: con las curvas hoy aprobadas es un
 *     cociente fijo de ~1,57 (nunca dispara con el umbral por defecto de
 *     2,5 — ver bloque A), pero con una configuración de rampas distinta
 *     (que la arquitectura permite sin tocar código) el cociente puede
 *     superar el umbral. Estos números lo demuestran sin ambigüedad.
 *
 * Como en `fixtures-impactos-manual.ts`, estas cuentas están hechas a mano:
 * no se derivan llamando al código bajo prueba.
 */

// ---------------------------------------------------------------------------
// 1. Ninguna suma cruza magnitudes, a nivel de escenario completo.
// ---------------------------------------------------------------------------

/**
 * Escenario "base" (rampa facturación/contribución 40/70/100; rampa ahorro
 * 75/100/100), con bases mensuales hipotéticas pero redondas:
 *   facturación incremental base = 200.000
 *   contribución incremental base =  90.000 (margen implícito ~45%, no importa cuál)
 *   ahorro publicitario base      =  30.000
 *   facturación actual            = 5.000.000
 */
export const ESCENARIO_BASE_MANUAL = {
  facturacionActual: 5_000_000,
  bases: {
    facturacionIncremental: 200_000,
    contribucionIncremental: 90_000,
    ahorroPublicitario: 30_000,
  },
  rampaFacturacionContribucion: { mes1: 0.4, mes2: 0.7, mes3: 1 },
  rampaAhorro: { mes1: 0.75, mes2: 1, mes3: 1 },

  /** unidades×ticket habilitado por mes = base × rampa. */
  facturacionIncrementalPorMes: {
    mes1: 200_000 * 0.4, // 80.000
    mes2: 200_000 * 0.7, // 140.000
    mes3: 200_000 * 1, // 200.000
  },
  contribucionIncrementalPorMes: {
    mes1: 90_000 * 0.4, // 36.000
    mes2: 90_000 * 0.7, // 63.000
    mes3: 90_000 * 1, // 90.000
  },
  ahorroPublicitarioPorMes: {
    mes1: 30_000 * 0.75, // 22.500
    mes2: 30_000 * 1, // 30.000
    mes3: 30_000 * 1, // 30.000
  },

  acumulados90d: {
    facturacionIncremental: 80_000 + 140_000 + 200_000, // 420.000
    contribucionIncremental: 36_000 + 63_000 + 90_000, // 189.000
    ahorroPublicitario: 22_500 + 30_000 + 30_000, // 82.500
  },

  /**
   * Facturación proyectada por mes = facturación actual + facturación
   * incremental habilitada ESE mes. Nunca + contribución ni + ahorro.
   */
  facturacionProyectadaPorMes: {
    mes1: 5_000_000 + 80_000, // 5.080.000
    mes2: 5_000_000 + 140_000, // 5.140.000
    mes3: 5_000_000 + 200_000, // 5.200.000
  },

  /**
   * Lo que NUNCA debe aparecer en ningún lado: un "impacto total" que sume
   * las tres magnitudes acumuladas a 90 días.
   */
  sumaTotalIncompatibleQueNuncaDebeAparecer: 420_000 + 189_000 + 82_500, // 691.500

  /**
   * Tampoco debe aparecer nunca una facturación proyectada que incluya
   * contribución o ahorro (por ejemplo, en el mes 3).
   */
  facturacionProyectadaMes3IncompatibleQueNuncaDebeAparecer: 5_000_000 + 200_000 + 90_000 + 30_000, // 5.320.000
} as const;

// ---------------------------------------------------------------------------
// 2. La regla de dispersión SÍ dispara con una configuración de rampas
//    distinta a la aprobada (la arquitectura lo permite sin tocar código).
// ---------------------------------------------------------------------------

/**
 * Caso A — curvas HOY aprobadas (ver bloque A): el cociente converge a
 * 235/150 ≈ 1,5667, muy por debajo del umbral por defecto de 2,5. Nunca
 * dispara con la configuración vigente.
 */
export const DISPERSION_CURVAS_APROBADAS_MANUAL = {
  rampaConservador: { mes1: 0.25, mes2: 0.5, mes3: 0.75 },
  rampaPotencial: { mes1: 0.5, mes2: 0.85, mes3: 1 },
  sumaConservador: 0.25 + 0.5 + 0.75, // 1,5 (150%)
  sumaPotencial: 0.5 + 0.85 + 1, // 2,35 (235%)
  ratioEsperado: (0.5 + 0.85 + 1) / (0.25 + 0.5 + 0.75), // ≈ 1,5667
  umbral: 2.5,
  disparaEsperado: false,
} as const;

/**
 * Caso B — configuración HIPOTÉTICA (una reconfiguración futura de rampas,
 * que `ConfigEscenarios90d` ya permite sin tocar código): conservador mucho
 * más lento (10/20/30) y potencial captura todo desde el mes 1 (100/100/100).
 *   suma conservador = 10+20+30 = 60% → 0,6
 *   suma potencial    = 100+100+100 = 300% → 3,0
 *   cociente = 3,0 / 0,6 = 5,0 > 2,5 → DISPARA.
 * Por diseño (misma oportunidad mensual base para los tres escenarios), este
 * cociente es independiente del monto real del cliente: da 5,0 para
 * cualquier base de contribución incremental positiva.
 */
export const DISPERSION_CURVAS_RECONFIGURADAS_MANUAL = {
  rampaConservador: { mes1: 0.1, mes2: 0.2, mes3: 0.3 },
  rampaPotencial: { mes1: 1, mes2: 1, mes3: 1 },
  sumaConservador: 0.1 + 0.2 + 0.3, // 0,6 (60%)
  sumaPotencial: 1 + 1 + 1, // 3,0 (300%)
  ratioEsperado: (1 + 1 + 1) / (0.1 + 0.2 + 0.3), // 5,0
  umbral: 2.5,
  disparaEsperado: true,

  /** Ejemplo con una base concreta, para verificar acumulados exactos. */
  baseContribucionIncremental: 100_000,
  acumuladoConservadorEsperado: 100_000 * 0.1 + 100_000 * 0.2 + 100_000 * 0.3, // 60.000
  acumuladoPotencialEsperado: 100_000 * 1 + 100_000 * 1 + 100_000 * 1, // 300.000
} as const;
