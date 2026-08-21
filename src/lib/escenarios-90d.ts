/**
 * Motor determinístico de escenarios a 90 días.
 *
 * Reutiliza los impactos tipados ya calculados por `calcularDiagnostico`
 * (`Fuga.impactos`, ver `impacto-economico.ts`) como única fuente de
 * oportunidad: ninguna palanca nueva se inventa acá. Lo único que cambia
 * entre escenarios es el ritmo de adopción (rampa) con el que cada magnitud
 * se habilita a lo largo de tres meses.
 *
 * Reglas duras de esta capa (ver `docs/decision-2026-08-21-impactos-economicos.md`):
 *  - facturación incremental, contribución incremental y ahorro publicitario
 *    son tres líneas independientes, cada una con su propia retención: nunca
 *    se suman entre sí, y ninguna "impacto total" las combina;
 *  - facturación proyectada = facturación actual + facturación incremental
 *    habilitada. Nunca se le suma contribución ni ahorro;
 *  - facturación y contribución incremental comparten la misma familia de
 *    curvas (describen la misma recuperación desde ángulos distintos); el
 *    ahorro publicitario usa una familia propia, más agresiva porque no
 *    depende de ejecución del funnel;
 *  - margen bloqueado o contradicho retiene contribución incremental y
 *    ahorro publicitario (ambos dependen de margen), pero NUNCA facturación
 *    incremental (unidades × ticket no depende de margen);
 *  - "habilitado" es acumulativo por mes (nivel de saturación alcanzado), no
 *    incremental: el mes 2 no se suma al mes 1, reemplaza su nivel;
 *  - gasto_no_rentable y sobrefragmentación se consolidan como ahorro
 *    publicitario por el máximo, nunca la suma (ver `ahorro-publicitario.ts`);
 *  - el acumulado de 90 días (suma de los tres meses) y el ritmo mensual al
 *    día 90 (el nivel del mes 3) son cifras distintas, nunca la misma.
 */

import { consolidarAhorroPublicitario } from "./ahorro-publicitario";
import type { Fuga, ResultadoCalculo } from "./calculo-diagnostico";
import type { DatosDiagnostico } from "./diagnostico-form";
import { redondear, sumarDecimal } from "./dinero";
import {
  impactosDeFuga,
  sumarImpactosPorTipo,
  type AgregadoImpacto,
  type TipoImpactoClasificado,
} from "./impacto-economico";

export type IdEscenario = "conservador" | "base" | "potencial";

export type RampaAdopcion = { mes1: number; mes2: number; mes3: number };

/**
 * % habilitado (acumulativo) en cada mes del trimestre para facturación y
 * contribución incremental. Aprobado por Matías el 2026-08-21. Política
 * comercial, no dato observado: debe poder reconfigurarse sin tocar código.
 */
export const RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO: Record<IdEscenario, RampaAdopcion> = {
  conservador: { mes1: 0.25, mes2: 0.5, mes3: 0.75 },
  base: { mes1: 0.4, mes2: 0.7, mes3: 1 },
  potencial: { mes1: 0.5, mes2: 0.85, mes3: 1 },
};

/**
 * % habilitado (acumulativo) para ahorro publicitario. Más agresiva que la
 * de facturación/contribución porque no depende de ejecución del funnel:
 * dejar de perder plata en pauta no rentable es una decisión, no un proceso
 * de conversión que hay que mejorar mes a mes.
 */
/**
 * Corrección de producto aprobada 2026-08-21 (veredicto sobre 2685999,
 * punto 1): el potencial NO llega a 100% en el mes 1. Consolidar el gasto
 * no rentable el primer día no significa que todo el mes corra bajo la
 * estructura nueva: una parte sigue bajo compromisos/estructura previa. Las
 * demás curvas (conservador, base) quedan sin cambios.
 */
export const RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO: Record<IdEscenario, RampaAdopcion> = {
  conservador: { mes1: 0.5, mes2: 0.75, mes3: 1 },
  base: { mes1: 0.75, mes2: 1, mes3: 1 },
  potencial: { mes1: 0.85, mes2: 1, mes3: 1 },
};

export type ConfigEscenarios90d = {
  rampa_escenario_conservador?: RampaAdopcion;
  rampa_escenario_base?: RampaAdopcion;
  rampa_escenario_potencial?: RampaAdopcion;
  rampa_ahorro_conservador?: RampaAdopcion;
  rampa_ahorro_base?: RampaAdopcion;
  rampa_ahorro_potencial?: RampaAdopcion;
  /**
   * Umbral del cociente potencial/conservador de contribución incremental
   * acumulada a 90 días (corrección aprobada 2026-08-21, punto 7). Por
   * encima de este umbral, el rango es demasiado ancho para comunicar una
   * cifra principal defendible: se muestra el rango, no un número.
   */
  umbral_dispersion?: number;
};

/** Política comercial, no evidencia observada: reconfigurable sin tocar código. */
export const UMBRAL_DISPERSION_90D_DEFECTO = 2.5;

export function umbralDispersionDe(cfg: ConfigEscenarios90d): number {
  return finito(cfg.umbral_dispersion) && (cfg.umbral_dispersion as number) > 0
    ? (cfg.umbral_dispersion as number)
    : UMBRAL_DISPERSION_90D_DEFECTO;
}

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function rampaValida(r: unknown): r is RampaAdopcion {
  if (!r || typeof r !== "object") return false;
  const { mes1, mes2, mes3 } = r as RampaAdopcion;
  return finito(mes1) && finito(mes2) && finito(mes3);
}

/** La configuración pisa al valor por defecto sólo si trae una rampa completa y numérica. */
export function rampaFacturacionContribucionDe(
  cfg: ConfigEscenarios90d,
  id: IdEscenario,
): RampaAdopcion {
  const desdeConfig =
    id === "conservador"
      ? cfg.rampa_escenario_conservador
      : id === "base"
        ? cfg.rampa_escenario_base
        : cfg.rampa_escenario_potencial;
  return rampaValida(desdeConfig) ? desdeConfig : RAMPAS_FACTURACION_CONTRIBUCION_90D_DEFECTO[id];
}

export function rampaAhorroPublicitarioDe(cfg: ConfigEscenarios90d, id: IdEscenario): RampaAdopcion {
  const desdeConfig =
    id === "conservador"
      ? cfg.rampa_ahorro_conservador
      : id === "base"
        ? cfg.rampa_ahorro_base
        : cfg.rampa_ahorro_potencial;
  return rampaValida(desdeConfig) ? desdeConfig : RAMPAS_AHORRO_PUBLICITARIO_90D_DEFECTO[id];
}

export type MesHabilitado = { mes: 1 | 2 | 3; habilitado: number };

/** Aplica una rampa a una base mensual. Pura: sin conocimiento de negocio. */
export function aplicarRampa(
  baseMensual: number,
  rampa: RampaAdopcion,
): { mensual: MesHabilitado[]; acumulado90d: number; ritmoMensualDia90: number } {
  const pasos: [1 | 2 | 3, number][] = [
    [1, rampa.mes1],
    [2, rampa.mes2],
    [3, rampa.mes3],
  ];
  const mensual = pasos.map(([mes, frac]) => ({
    mes,
    habilitado: redondear(baseMensual * frac, 0) ?? 0,
  }));
  const acumulado90d = redondear(sumarDecimal(...mensual.map((m) => m.habilitado)), 0) ?? 0;
  const ritmoMensualDia90 = mensual[2]!.habilitado;
  return { mensual, acumulado90d, ritmoMensualDia90 };
}

export type PalancaLinea = { id: string; nombre: string; montoMensualDia90: number };

export type LineaImpacto90d =
  | {
      calculable: true;
      motivo: null;
      mensual: MesHabilitado[];
      acumulado90d: number;
      ritmoMensualDia90: number;
      palancas: PalancaLinea[];
    }
  | {
      calculable: false;
      motivo: string;
      mensual: [];
      acumulado90d: null;
      ritmoMensualDia90: null;
      palancas: [];
    };

export type MesProyectado = { mes: 1 | 2 | 3; valor: number };

export type FacturacionProyectada =
  | { calculable: true; motivo: null; mensual: MesProyectado[] }
  | { calculable: false; motivo: string; mensual: [] };

export type EscenarioCalculado = {
  id: IdEscenario;
  facturacionIncremental: LineaImpacto90d;
  contribucionIncremental: LineaImpacto90d;
  ahorroPublicitario: LineaImpacto90d;
  facturacionProyectada: FacturacionProyectada;
};

function lineaRetenida(motivo: string): LineaImpacto90d {
  return { calculable: false, motivo, mensual: [], acumulado90d: null, ritmoMensualDia90: null, palancas: [] };
}

function palancasDeTipo(fugas: Fuga[], tipo: TipoImpactoClasificado, rampa: RampaAdopcion): PalancaLinea[] {
  const palancas: PalancaLinea[] = [];
  for (const f of fugas) {
    const impacto = impactosDeFuga(f).find((i) => i.tipo === tipo);
    if (!impacto || impacto.confianza === "retenida" || impacto.montoMensual === null) continue;
    palancas.push({
      id: f.id,
      nombre: f.etiqueta,
      montoMensualDia90: redondear(impacto.montoMensual * rampa.mes3, 0) ?? 0,
    });
  }
  return palancas;
}

function lineaDeAgregado(
  agregado: AgregadoImpacto,
  fugas: Fuga[],
  tipo: TipoImpactoClasificado,
  rampa: RampaAdopcion,
): LineaImpacto90d {
  if (!agregado.calculable) return lineaRetenida(agregado.motivo);
  const { mensual, acumulado90d, ritmoMensualDia90 } = aplicarRampa(agregado.montoMensual, rampa);
  return {
    calculable: true,
    motivo: null,
    mensual,
    acumulado90d,
    ritmoMensualDia90,
    palancas: palancasDeTipo(fugas, tipo, rampa),
  };
}

function lineaDeAhorro(
  fugas: Fuga[],
  inversionElegible: number | null,
  rampa: RampaAdopcion,
): LineaImpacto90d {
  const gastoNoRentable = fugas.find((f) => f.id === "gasto_no_rentable");
  const sobrefragmentacion = fugas.find((f) => f.id === "sobrefragmentacion");
  const impactoDe = (f: Fuga | undefined): number | null => {
    if (!f) return null;
    const impacto = impactosDeFuga(f).find((i) => i.tipo === "ahorro_publicitario");
    return impacto && impacto.confianza !== "retenida" ? (impacto.montoMensual as number) : null;
  };

  const consolidado = consolidarAhorroPublicitario({
    gastoNoRentable: impactoDe(gastoNoRentable),
    sobrefragmentacion: impactoDe(sobrefragmentacion),
    inversionElegible,
  });

  if (!consolidado.calculable) return lineaRetenida(consolidado.motivo);

  const { mensual, acumulado90d, ritmoMensualDia90 } = aplicarRampa(consolidado.montoMensual, rampa);
  const origen = consolidado.origen === "gasto_no_rentable" ? gastoNoRentable : sobrefragmentacion;
  const palancas: PalancaLinea[] = origen
    ? [
        {
          id: origen.id,
          nombre: origen.etiqueta,
          montoMensualDia90: redondear(consolidado.montoMensual * rampa.mes3, 0) ?? 0,
        },
      ]
    : [];

  return { calculable: true, motivo: null, mensual, acumulado90d, ritmoMensualDia90, palancas };
}

function facturacionProyectadaDe(
  facturacionActual: number | null,
  facturacionIncremental: LineaImpacto90d,
): FacturacionProyectada {
  if (facturacionActual === null) {
    return { calculable: false, motivo: "No se declaró la facturación mensual.", mensual: [] };
  }
  if (!facturacionIncremental.calculable) {
    return { calculable: false, motivo: facturacionIncremental.motivo, mensual: [] };
  }
  const mensual: MesProyectado[] = facturacionIncremental.mensual.map((m) => ({
    mes: m.mes,
    valor: redondear(facturacionActual + m.habilitado, 0) ?? facturacionActual,
  }));
  return { calculable: true, motivo: null, mensual };
}

const MOTIVO_CONTRADICCION_SIN_CONFIRMAR =
  "El margen calculado y el margen declarado no coinciden y la diferencia no fue validada: no se proyecta hasta confirmarla.";

/**
 * Una contradicción crítica CONFIRMADA ya queda reflejada en los impactos de
 * origen (`calcularDiagnostico` los retiene antes de que lleguen acá). Una
 * contradicción crítica o que requiere validación SIN CONFIRMAR todavía no
 * toca esos impactos (el diagnóstico puede seguir mostrando el hallazgo con
 * una salvedad), pero proyectar 90 días sobre un margen no validado sería
 * prometer más de lo que el dato respalda: se retiene acá, sólo para
 * contribución y ahorro (facturación incremental no depende de margen).
 */
function contradiccionSinConfirmarBloqueaProyeccion(resultado: ResultadoCalculo): boolean {
  if (resultado.margen_bloqueado) return false;
  const nivel = resultado.contradiccion_margen?.nivel;
  return nivel === "critica" || nivel === "validacion_requerida";
}

export function calcularEscenarios90d(
  datos: DatosDiagnostico,
  resultado: ResultadoCalculo,
  cfg: ConfigEscenarios90d = {},
): EscenarioCalculado[] {
  const ids: IdEscenario[] = ["conservador", "base", "potencial"];
  const fugas = resultado.fugas;
  const impactosPorFuga = fugas.map((f) => impactosDeFuga(f));
  const facturacionActual = finito(datos.facturacion_mensual) ? datos.facturacion_mensual : null;
  const inversionElegible = finito(resultado.derivados.inversion_publicitaria_total)
    ? resultado.derivados.inversion_publicitaria_total
    : null;

  const agregadoFacturacion = sumarImpactosPorTipo(impactosPorFuga, "facturacion_incremental");
  const agregadoContribucion = sumarImpactosPorTipo(impactosPorFuga, "contribucion_incremental");
  const margenSinConfirmarBloquea = contradiccionSinConfirmarBloqueaProyeccion(resultado);

  return ids.map((id) => {
    const rampaFC = rampaFacturacionContribucionDe(cfg, id);
    const rampaAhorro = rampaAhorroPublicitarioDe(cfg, id);

    const facturacionIncremental = lineaDeAgregado(
      agregadoFacturacion,
      fugas,
      "facturacion_incremental",
      rampaFC,
    );
    const contribucionIncremental = margenSinConfirmarBloquea
      ? lineaRetenida(MOTIVO_CONTRADICCION_SIN_CONFIRMAR)
      : lineaDeAgregado(agregadoContribucion, fugas, "contribucion_incremental", rampaFC);
    const ahorroPublicitario = margenSinConfirmarBloquea
      ? lineaRetenida(MOTIVO_CONTRADICCION_SIN_CONFIRMAR)
      : lineaDeAhorro(fugas, inversionElegible, rampaAhorro);
    const facturacionProyectada = facturacionProyectadaDe(facturacionActual, facturacionIncremental);

    return {
      id,
      facturacionIncremental,
      contribucionIncremental,
      ahorroPublicitario,
      facturacionProyectada,
    };
  });
}

export type DispersionContribucion =
  | { evaluable: true; ratio: number; umbral: number; alta: boolean }
  | { evaluable: false; umbral: number };

/**
 * Cociente entre la contribución incremental acumulada a 90 días del
 * escenario potencial y la del conservador (corrección aprobada
 * 2026-08-21, punto 7). No evaluable sin ambos escenarios calculables, o
 * con un conservador en cero (el cociente no significa nada dividiendo por
 * cero ni por un valor negativo).
 *
 * Con las curvas hoy aprobadas (25/50/75 conservador, 50/85/100 potencial,
 * ambas sobre la MISMA oportunidad mensual base) este cociente converge a
 * 235/150 ≈ 1,57 (el redondeo a peso entero de cada mes puede moverlo en
 * una fracción despreciable) — muy por debajo del umbral por defecto de
 * 2,5. La regla queda como red de seguridad ante una reconfiguración futura
 * de las rampas (`ConfigEscenarios90d` ya lo permite), no porque se espere
 * que dispare hoy.
 */
export function evaluarDispersionContribucion(
  escenarios: EscenarioCalculado[],
  cfg: ConfigEscenarios90d = {},
): DispersionContribucion {
  const umbral = umbralDispersionDe(cfg);
  const conservador = escenarios.find((e) => e.id === "conservador")?.contribucionIncremental;
  const potencial = escenarios.find((e) => e.id === "potencial")?.contribucionIncremental;

  if (!conservador?.calculable || !potencial?.calculable || conservador.acumulado90d <= 0) {
    return { evaluable: false, umbral };
  }

  const ratio = potencial.acumulado90d / conservador.acumulado90d;
  return { evaluable: true, ratio, umbral, alta: ratio > umbral };
}
