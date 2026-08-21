/**
 * Adaptador documental del motor de escenarios a 90 días.
 *
 * No calcula: envuelve `calcularEscenarios90d` (aritmética pura, sin
 * conocimiento de políticas de publicación) en el contrato `Escenario90d`,
 * aplicando las mismas reglas de confianza y retención que el resto del
 * motor documental.
 *
 * Regla adicional a las del motor puro: si la política de envío no está
 * confirmada, se retienen contribución incremental y ahorro publicitario
 * (ambas dependen del margen que esa política puede afectar), pero NUNCA
 * facturación incremental — unidades × ticket no depende de margen, y
 * retenerla igual que las otras dos sería prometer menos de lo que el dato
 * respalda (regla aprobada 2026-08-21, sección 6).
 */

import {
  calcularEscenarios90d,
  type ConfigEscenarios90d,
  type EscenarioCalculado,
  type IdEscenario,
  type LineaImpacto90d as LineaImpacto90dCalculada,
  type PalancaLinea,
} from "../../lib/escenarios-90d";
import type { ResultadoCalculo } from "../../lib/calculo-diagnostico";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { envioBloqueaRentabilidad, valorCalculado, valorRetenido } from "./publishing-policy";
import type {
  ConfianzaDocumento,
  Escenario90d,
  LineaImpacto90d,
  MesEscenario90d,
  PoliticaEnvio,
  SupuestoDocumento,
  ValorPublicable,
} from "./types";

const MOTIVO_ENVIO_NO_CONFIRMADO =
  "La política de envío no está confirmada: no se proyecta hasta confirmar si el vendedor absorbe el costo y cuál es el neto.";

const ETIQUETA_RAMPA_FACTURACION_CONTRIBUCION: Record<IdEscenario, string> = {
  conservador:
    "Rampa conservadora (facturación/contribución): 25% / 50% / 75% de la oportunidad mensual en los meses 1, 2 y 3.",
  base: "Rampa base (facturación/contribución): 40% / 70% / 100% de la oportunidad mensual en los meses 1, 2 y 3.",
  potencial:
    "Rampa potencial (facturación/contribución): 50% / 85% / 100% de la oportunidad mensual en los meses 1, 2 y 3.",
};

const ETIQUETA_RAMPA_AHORRO: Record<IdEscenario, string> = {
  conservador: "Rampa conservadora (ahorro publicitario): 50% / 75% / 100% en los meses 1, 2 y 3.",
  base: "Rampa base (ahorro publicitario): 75% / 100% / 100% en los meses 1, 2 y 3.",
  potencial: "Rampa potencial (ahorro publicitario): 100% / 100% / 100% en los meses 1, 2 y 3.",
};

function supuestosRampa(id: IdEscenario): SupuestoDocumento[] {
  return [
    {
      id: `rampa_escenario_${id}`,
      etiqueta: "Curva de adopción de facturación/contribución (política comercial, no evidencia observada)",
      valor: ETIQUETA_RAMPA_FACTURACION_CONTRIBUCION[id],
      origen: "configuracion",
      evidenciaId: null,
    },
    {
      id: `rampa_ahorro_${id}`,
      etiqueta: "Curva de adopción de ahorro publicitario (política comercial, no evidencia observada)",
      valor: ETIQUETA_RAMPA_AHORRO[id],
      origen: "configuracion",
      evidenciaId: null,
    },
  ];
}

function confianzaValorable(confianza: ConfianzaDocumento): Exclude<ConfianzaDocumento, "bloqueada"> {
  return confianza === "bloqueada" ? "baja" : confianza;
}

/** El escenario potencial sólo puede quedar visible con confianza alta (regla del contrato). */
function visiblePara(id: IdEscenario, confianza: ConfianzaDocumento): boolean {
  return id !== "potencial" || confianza === "alta";
}

/** Línea totalmente retenida: nunca lleva un número, sólo el motivo. */
function lineaRetenidaDocumento(motivo: string): LineaImpacto90d {
  return {
    acumulado90d: valorRetenido(motivo),
    ritmoMensualDia90: valorRetenido(motivo),
    palancas: [],
  };
}

function lineaDocumento(
  linea: LineaImpacto90dCalculada,
  confianzaDocumento: ConfianzaDocumento,
  overrideMotivo: string | null,
): LineaImpacto90d {
  if (overrideMotivo !== null) return lineaRetenidaDocumento(overrideMotivo);
  if (!linea.calculable) return lineaRetenidaDocumento(linea.motivo);

  const confianza = confianzaValorable(confianzaDocumento);
  const evidenciaIds = linea.palancas.map((p: PalancaLinea) => `fuga_${p.id}`);
  return {
    acumulado90d: valorCalculado({ valor: linea.acumulado90d, confianza, evidenciaIds }),
    ritmoMensualDia90: valorCalculado({ valor: linea.ritmoMensualDia90, confianza, evidenciaIds }),
    palancas: linea.palancas.map((p: PalancaLinea) => ({
      id: p.id,
      nombre: p.nombre,
      monto: valorCalculado({ valor: p.montoMensualDia90, confianza, evidenciaIds: [`fuga_${p.id}`] }),
    })),
  };
}

function celdaMes(
  linea: LineaImpacto90dCalculada,
  overrideMotivo: string | null,
  mes: 1 | 2 | 3,
  confianza: Exclude<ConfianzaDocumento, "bloqueada">,
): ValorPublicable<number> {
  if (overrideMotivo !== null) return valorRetenido(overrideMotivo);
  if (!linea.calculable) return valorRetenido(linea.motivo);
  const habilitado = linea.mensual.find((m) => m.mes === mes)!.habilitado;
  return valorCalculado({ valor: habilitado, confianza, evidenciaIds: [] });
}

function mensualDocumento(
  c: EscenarioCalculado,
  confianzaDocumento: ConfianzaDocumento,
  overrideMargenEnvio: string | null,
): MesEscenario90d[] {
  const todoRetenido =
    !c.facturacionProyectada.calculable &&
    !c.facturacionIncremental.calculable &&
    (overrideMargenEnvio !== null || !c.contribucionIncremental.calculable) &&
    (overrideMargenEnvio !== null || !c.ahorroPublicitario.calculable);
  if (todoRetenido) return [];

  const confianza = confianzaValorable(confianzaDocumento);
  const meses: (1 | 2 | 3)[] = [1, 2, 3];
  return meses.map((mes) => ({
    mes,
    facturacionProyectada: !c.facturacionProyectada.calculable
      ? valorRetenido(c.facturacionProyectada.motivo)
      : valorCalculado({
          valor: c.facturacionProyectada.mensual.find((m) => m.mes === mes)!.valor,
          confianza,
          evidenciaIds: ["facturacion_mensual"],
        }),
    facturacionIncrementalHabilitada: celdaMes(c.facturacionIncremental, null, mes, confianza),
    contribucionIncrementalHabilitada: celdaMes(
      c.contribucionIncremental,
      overrideMargenEnvio,
      mes,
      confianza,
    ),
    ahorroPublicitarioHabilitado: celdaMes(c.ahorroPublicitario, overrideMargenEnvio, mes, confianza),
  }));
}

function escenarioCalculadoADocumento(
  c: EscenarioCalculado,
  confianzaDocumento: ConfianzaDocumento,
  /** Motivo de retención adicional de la capa documental (envío no confirmado), sólo para contribución y ahorro. */
  overrideMargenEnvio: string | null,
): Escenario90d {
  return {
    id: c.id,
    visible: visiblePara(c.id, confianzaDocumento),
    confianza: confianzaDocumento,
    facturacionIncremental: lineaDocumento(c.facturacionIncremental, confianzaDocumento, null),
    contribucionIncremental: lineaDocumento(
      c.contribucionIncremental,
      confianzaDocumento,
      overrideMargenEnvio,
    ),
    ahorroPublicitario: lineaDocumento(c.ahorroPublicitario, confianzaDocumento, overrideMargenEnvio),
    mensual: mensualDocumento(c, confianzaDocumento, overrideMargenEnvio),
    supuestos: supuestosRampa(c.id),
    restriccionesAplicadas: [],
  };
}

export function escenariosDocumento(
  datos: DatosDiagnostico,
  resultado: ResultadoCalculo,
  confianzaDocumento: ConfianzaDocumento,
  envio: PoliticaEnvio,
  cfg: ConfigEscenarios90d = {},
): Escenario90d[] {
  const overrideMargenEnvio = envioBloqueaRentabilidad(envio) ? MOTIVO_ENVIO_NO_CONFIRMADO : null;
  return calcularEscenarios90d(datos, resultado, cfg).map((c) =>
    escenarioCalculadoADocumento(c, confianzaDocumento, overrideMargenEnvio),
  );
}
