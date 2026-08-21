/**
 * Motor determinístico de escenarios a 90 días.
 *
 * Reutiliza las fugas ya calculadas por `calcularDiagnostico` como única
 * fuente de oportunidad: ninguna palanca nueva se inventa acá, y el escenario
 * potencial no incorpora nada que el motor actual no haya detectado y
 * cuantificado. Lo único que cambia entre escenarios es el ritmo de adopción
 * (rampa) con el que esa oportunidad mensual se habilita a lo largo de tres
 * meses.
 *
 * Las curvas de rampa son política comercial aprobada por Matías el
 * 2026-08-21, no evidencia observada del negocio. Viven acá como constantes
 * documentadas y son reemplazables desde `ConfiguracionCalculo` sin tocar
 * código, igual que `MEJORAS_FUNNEL_DEFECTO` en `funnel.ts`.
 *
 * Reglas duras de esta capa:
 *  - la oportunidad mensual de cada escenario es la MISMA (la suma de fugas
 *    calculables); sólo cambia el porcentaje habilitado por mes;
 *  - "habilitado" es acumulativo por mes (nivel de saturación alcanzado), no
 *    incremental: el mes 2 no se suma al mes 1, reemplaza su nivel;
 *  - facturación proyectada = facturación actual + oportunidad habilitada;
 *  - el acumulado de 90 días (suma de los tres meses) y el ritmo mensual al
 *    día 90 (el nivel del mes 3) son cifras distintas, nunca la misma.
 */

import type { Fuga, ResultadoCalculo } from "./calculo-diagnostico";
import type { DatosDiagnostico } from "./diagnostico-form";
import { redondear } from "./dinero";

export type IdEscenario = "conservador" | "base" | "potencial";

export type RampaAdopcion = { mes1: number; mes2: number; mes3: number };

/**
 * % de la oportunidad mensual habilitado (acumulativo) en cada mes del
 * trimestre. Aprobado por Matías el 2026-08-21. Política comercial, no dato
 * observado: debe poder reconfigurarse sin tocar código.
 */
export const RAMPAS_ESCENARIO_90D_DEFECTO: Record<IdEscenario, RampaAdopcion> = {
  conservador: { mes1: 0.25, mes2: 0.5, mes3: 0.75 },
  base: { mes1: 0.4, mes2: 0.7, mes3: 1 },
  potencial: { mes1: 0.5, mes2: 0.85, mes3: 1 },
};

export type ConfigEscenarios90d = {
  rampa_escenario_conservador?: RampaAdopcion;
  rampa_escenario_base?: RampaAdopcion;
  rampa_escenario_potencial?: RampaAdopcion;
};

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function rampaValida(r: unknown): r is RampaAdopcion {
  if (!r || typeof r !== "object") return false;
  const { mes1, mes2, mes3 } = r as RampaAdopcion;
  return finito(mes1) && finito(mes2) && finito(mes3);
}

/** La configuración pisa al valor por defecto sólo si trae una rampa completa y numérica. */
export function rampaDe(cfg: ConfigEscenarios90d, id: IdEscenario): RampaAdopcion {
  const desdeConfig =
    id === "conservador"
      ? cfg.rampa_escenario_conservador
      : id === "base"
        ? cfg.rampa_escenario_base
        : cfg.rampa_escenario_potencial;
  return rampaValida(desdeConfig) ? desdeConfig : RAMPAS_ESCENARIO_90D_DEFECTO[id];
}

export type MesProyectado = {
  mes: 1 | 2 | 3;
  /** Oportunidad habilitada ESE mes (nivel de saturación, no incremental). */
  oportunidadHabilitada: number;
  facturacionProyectada: number;
};

export type PalancaCalculada = {
  id: string;
  nombre: string;
  /** Contribución de esta palanca al ritmo mensual alcanzado al día 90 (mes 3). */
  contribucionMensualDia90: number;
};

export type EscenarioCalculado = {
  id: IdEscenario;
  calculable: boolean;
  /** Motivo de retención, sólo presente cuando `calculable` es false. */
  motivo: string | null;
  mensual: MesProyectado[];
  acumulado90d: number | null;
  ritmoMensualDia90: number | null;
  palancas: PalancaCalculada[];
};

/** Fugas en pesos, ya calculadas y con monto real positivo: única fuente de oportunidad. */
function fugasCalculables(fugas: Fuga[]): Fuga[] {
  return fugas.filter(
    (f) => f.tipo === "monto" && f.calculable && finito(f.monto) && (f.monto as number) > 0,
  );
}

/**
 * true cuando el margen bloqueado o una contradicción abierta (confirmada o
 * no) invalida cualquier proyección que dependa de él.
 */
function margenNoUtilizable(resultado: ResultadoCalculo): boolean {
  if (resultado.margen_bloqueado) return true;
  const nivel = resultado.contradiccion_margen?.nivel;
  return nivel === "critica" || nivel === "validacion_requerida";
}

function motivoMargen(resultado: ResultadoCalculo): string {
  if (resultado.margen_bloqueado) {
    return "El margen calculado contradice al margen confirmado por el cliente: no se proyecta hasta resolver la diferencia.";
  }
  return "El margen calculado y el margen declarado no coinciden y la diferencia no fue validada: no se proyecta hasta confirmarla.";
}

function escenarioRetenido(id: IdEscenario, motivo: string): EscenarioCalculado {
  return {
    id,
    calculable: false,
    motivo,
    mensual: [],
    acumulado90d: null,
    ritmoMensualDia90: null,
    palancas: [],
  };
}

export function calcularEscenarios90d(
  datos: DatosDiagnostico,
  resultado: ResultadoCalculo,
  cfg: ConfigEscenarios90d = {},
): EscenarioCalculado[] {
  const ids: IdEscenario[] = ["conservador", "base", "potencial"];
  const bloqueadoPorMargen = margenNoUtilizable(resultado);
  const fugas = fugasCalculables(resultado.fugas);
  const facturacionActual = finito(datos.facturacion_mensual) ? datos.facturacion_mensual : null;

  return ids.map((id) => {
    if (bloqueadoPorMargen) return escenarioRetenido(id, motivoMargen(resultado));
    if (fugas.length === 0) {
      return escenarioRetenido(id, "No hay oportunidades calculables con los datos actuales.");
    }
    if (facturacionActual === null) {
      return escenarioRetenido(id, "No se declaró la facturación mensual.");
    }

    const oportunidadMensualBase = fugas.reduce((acc, f) => acc + (f.monto as number), 0);
    const rampa = rampaDe(cfg, id);
    const pasos: [1 | 2 | 3, number][] = [
      [1, rampa.mes1],
      [2, rampa.mes2],
      [3, rampa.mes3],
    ];

    const mensual: MesProyectado[] = pasos.map(([mes, frac]) => {
      const oportunidadHabilitada = redondear(oportunidadMensualBase * frac, 0) ?? 0;
      return {
        mes,
        oportunidadHabilitada,
        facturacionProyectada:
          redondear(facturacionActual + oportunidadHabilitada, 0) ?? facturacionActual,
      };
    });

    const acumulado90d =
      redondear(
        mensual.reduce((acc, m) => acc + m.oportunidadHabilitada, 0),
        0,
      ) ?? 0;
    const ritmoMensualDia90 = mensual[2]!.oportunidadHabilitada;

    const palancas: PalancaCalculada[] = fugas.map((f) => ({
      id: f.id,
      nombre: f.etiqueta,
      contribucionMensualDia90: redondear((f.monto as number) * rampa.mes3, 0) ?? 0,
    }));

    return {
      id,
      calculable: true,
      motivo: null,
      mensual,
      acumulado90d,
      ritmoMensualDia90,
      palancas,
    };
  });
}
