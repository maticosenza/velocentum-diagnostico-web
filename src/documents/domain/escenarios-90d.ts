/**
 * Adaptador documental del motor de escenarios a 90 días.
 *
 * No calcula: envuelve `calcularEscenarios90d` (aritmética pura, sin
 * conocimiento de políticas de publicación) en el contrato `Escenario90d`,
 * aplicando las mismas reglas de confianza y retención que el resto del
 * motor documental.
 *
 * Regla adicional a las del motor puro: si la política de envío no está
 * confirmada, los escenarios se retienen igual que el margen total del
 * diagnóstico (`envioBloqueaRentabilidad`, `build-context.ts`) — las fugas
 * que alimentan la oportunidad usan el mismo margen que esa política puede
 * bloquear, así que sería inconsistente proyectar sobre un margen que el
 * propio diagnóstico no publica.
 */

import {
  calcularEscenarios90d,
  type ConfigEscenarios90d,
  type EscenarioCalculado,
  type IdEscenario,
} from "../../lib/escenarios-90d";
import type { ResultadoCalculo } from "../../lib/calculo-diagnostico";
import type { DatosDiagnostico } from "../../lib/diagnostico-form";
import { envioBloqueaRentabilidad, valorCalculado, valorRetenido } from "./publishing-policy";
import type {
  ConfianzaDocumento,
  Escenario90d,
  PoliticaEnvio,
  SupuestoDocumento,
} from "./types";

const MOTIVO_ENVIO_NO_CONFIRMADO =
  "La política de envío no está confirmada: no se proyecta hasta confirmar si el vendedor absorbe el costo y cuál es el neto.";

const ETIQUETA_RAMPA: Record<IdEscenario, string> = {
  conservador:
    "Rampa conservadora: 25% / 50% / 75% de la oportunidad mensual en los meses 1, 2 y 3.",
  base: "Rampa base: 40% / 70% / 100% de la oportunidad mensual en los meses 1, 2 y 3.",
  potencial: "Rampa potencial: 50% / 85% / 100% de la oportunidad mensual en los meses 1, 2 y 3.",
};

function supuestoRampa(id: IdEscenario): SupuestoDocumento {
  return {
    id: `rampa_escenario_${id}`,
    etiqueta: "Curva de adopción (política comercial, no evidencia observada)",
    valor: ETIQUETA_RAMPA[id],
    origen: "configuracion",
    evidenciaId: null,
  };
}

function confianzaValorable(confianza: ConfianzaDocumento): Exclude<ConfianzaDocumento, "bloqueada"> {
  return confianza === "bloqueada" ? "baja" : confianza;
}

/** El escenario potencial sólo puede quedar visible con confianza alta (regla del contrato). */
function visiblePara(id: IdEscenario, confianza: ConfianzaDocumento): boolean {
  return id !== "potencial" || confianza === "alta";
}

function escenarioRetenidoDocumento(id: IdEscenario, motivo: string): Escenario90d {
  return {
    id,
    visible: visiblePara(id, "bloqueada"),
    confianza: "bloqueada",
    contribucionAcumulada90d: valorRetenido(motivo),
    ritmoMensualDia90: valorRetenido(motivo),
    palancas: [],
    mensual: [],
    supuestos: [supuestoRampa(id)],
    restriccionesAplicadas: [
      {
        id: `escenario_${id}_no_calculable`,
        etiqueta: `Escenario ${id} no calculable`,
        detalle: motivo,
        bloquea: ["escenario"],
      },
    ],
  };
}

function escenarioCalculadoADocumento(
  c: EscenarioCalculado,
  confianzaDocumento: ConfianzaDocumento,
): Escenario90d {
  const confianza = confianzaValorable(confianzaDocumento);
  const evidenciaFugas = c.palancas.map((p) => `fuga_${p.id}`);
  const supuestoRampaId = supuestoRampa(c.id).id;

  return {
    id: c.id,
    visible: visiblePara(c.id, confianzaDocumento),
    confianza: confianzaDocumento,
    contribucionAcumulada90d: valorCalculado({
      valor: c.acumulado90d as number,
      confianza,
      evidenciaIds: evidenciaFugas,
      supuestos: [supuestoRampaId],
    }),
    ritmoMensualDia90: valorCalculado({
      valor: c.ritmoMensualDia90 as number,
      confianza,
      evidenciaIds: evidenciaFugas,
      supuestos: [supuestoRampaId],
    }),
    palancas: c.palancas.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      contribucion: valorCalculado({
        valor: p.contribucionMensualDia90,
        confianza,
        evidenciaIds: [`fuga_${p.id}`],
      }),
    })),
    mensual: c.mensual.map((m) => ({
      mes: m.mes,
      facturacionProyectada: valorCalculado({
        valor: m.facturacionProyectada,
        confianza,
        evidenciaIds: ["facturacion_mensual", ...evidenciaFugas],
        supuestos: [supuestoRampaId],
      }),
      oportunidadHabilitada: valorCalculado({
        valor: m.oportunidadHabilitada,
        confianza,
        evidenciaIds: evidenciaFugas,
        supuestos: [supuestoRampaId],
      }),
    })),
    supuestos: [supuestoRampa(c.id)],
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
  if (envioBloqueaRentabilidad(envio)) {
    return (["conservador", "base", "potencial"] as const).map((id) =>
      escenarioRetenidoDocumento(id, MOTIVO_ENVIO_NO_CONFIRMADO),
    );
  }

  return calcularEscenarios90d(datos, resultado, cfg).map((c) =>
    c.calculable
      ? escenarioCalculadoADocumento(c, confianzaDocumento)
      : escenarioRetenidoDocumento(c.id, c.motivo ?? "No se pudo proyectar este escenario."),
  );
}
