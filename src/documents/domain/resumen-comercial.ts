/**
 * Resumen comercial de 90 días: la cifra dominante y su redacción.
 *
 * Corrección de producto aprobada 2026-08-21 (veredicto sobre 2685999).
 * Reglas duras de esta capa:
 *  - punto 2 — la cifra dominante es SIEMPRE contribución incremental,
 *    nunca facturación: un cliente puede facturar más y ganar menos, y
 *    encabezar con facturación optimiza para el número que peor representa
 *    su negocio;
 *  - punto 4 — la propuesta encabeza con una sola cifra: contribución
 *    incremental acumulada a 90 días del escenario CONSERVADOR;
 *  - punto 6 — el escenario que se comunica es siempre el conservador. Base
 *    y potencial son contexto (el límite superior del rango), nunca
 *    encabezado. Potencial sólo si el documento lo muestra con confianza
 *    alta (regla ya existente de `escenarioPuedeMostrarse`);
 *  - punto 7 — si el cociente potencial/conservador supera el umbral
 *    configurado, no se publica una cifra principal: sólo el rango:
 *  - punto 6 — la redacción de cualquier cifra proyectada usa la plantilla
 *    exacta aprobada, y nunca ninguna de las frases prohibidas.
 */

import { formatARS } from "../../lib/format";
import type { EscenarioCalculado } from "../../lib/escenarios-90d";
import { valorCalculado, valorRetenido } from "./publishing-policy";
import type { ConfianzaDocumento, Escenario90d, ResumenComercial90d, ValorPublicable } from "./types";

/**
 * Prohibido en cualquier render, sin excepción (punto 6): estas frases
 * prometen un resultado como si fuera un hecho, no una proyección
 * condicionada a supuestos. Comparación insensible a mayúsculas/acentos.
 */
export const FRASES_PROHIBIDAS = [
  "vas a facturar",
  "vas a ganar",
  "el retorno esperado es",
  "vas a recuperar",
] as const;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Usado por la prueba de guardarraíles de redacción: null si no encuentra ninguna coincidencia. */
export function fraseProhibidaEncontrada(texto: string): string | null {
  const normalizado = normalizar(texto);
  return FRASES_PROHIBIDAS.find((frase) => normalizado.includes(normalizar(frase))) ?? null;
}

/**
 * Plantilla exacta aprobada (punto 6). `x` es el límite inferior
 * (conservador), `y` el superior (base o potencial, lo que se comunique).
 */
export function redaccionRangoContribucion(x: number, y: number): string {
  return (
    "Con los datos disponibles y bajo estos supuestos, existe un rango de " +
    `contribución incremental potencial de ${formatARS(x)} a ${formatARS(y)} ` +
    "durante los próximos 90 días."
  );
}

const MOTIVO_SIN_CONSERVADOR = "El escenario conservador no es calculable con los datos actuales.";
const MOTIVO_DISPERSION_ALTA =
  "El rango entre el escenario conservador y el potencial es demasiado amplio para una cifra única: se muestra el rango, no un número.";
const MOTIVO_SIN_LIMITE_SUPERIOR =
  "No hay un escenario de contexto (base o potencial) calculable para armar el rango.";

function datosParaCerrarDispersion(alta: boolean): string[] {
  if (!alta) return [];
  return [
    "La brecha entre el límite inferior y el superior proviene de la curva de adopción " +
      "configurada (política comercial), no de datos faltantes del cliente: confirmar si la " +
      "configuración de rampas vigente sigue siendo la aprobada.",
  ];
}

/**
 * Extrae la contribución incremental acumulada a 90 días de un escenario ya
 * calculado (`EscenarioCalculado`, capa pura), como número o `null`.
 */
function contribucionCalculable(e: EscenarioCalculado | undefined): number | null {
  return e?.contribucionIncremental.calculable ? e.contribucionIncremental.acumulado90d : null;
}

export function construirResumenComercial(args: {
  /** Escenarios ya calculados (capa pura), sólo para evaluar la dispersión con los números reales. */
  escenariosCalculados: EscenarioCalculado[];
  /** Escenarios ya adaptados al contrato documental: de acá salen las cifras publicadas. */
  escenariosDocumento: Escenario90d[];
  umbralDispersion: number;
}): ResumenComercial90d {
  const { escenariosCalculados, escenariosDocumento, umbralDispersion } = args;

  const conservadorCalc = escenariosCalculados.find((e) => e.id === "conservador");
  const potencialCalc = escenariosCalculados.find((e) => e.id === "potencial");
  const conservadorInf = contribucionCalculable(conservadorCalc);
  const potencialInf = contribucionCalculable(potencialCalc);

  const dispersion: ResumenComercial90d["dispersion"] =
    conservadorInf !== null && potencialInf !== null && conservadorInf > 0
      ? {
          ratio: potencialInf / conservadorInf,
          umbral: umbralDispersion,
          alta: potencialInf / conservadorInf > umbralDispersion,
          datosParaCerrarla: datosParaCerrarDispersion(potencialInf / conservadorInf > umbralDispersion),
        }
      : { ratio: null, umbral: umbralDispersion, alta: false, datosParaCerrarla: [] };

  const conservadorDoc = escenariosDocumento.find((e) => e.id === "conservador");
  const potencialDoc = escenariosDocumento.find((e) => e.id === "potencial");
  const baseDoc = escenariosDocumento.find((e) => e.id === "base");

  const limiteInferior = conservadorDoc?.contribucionIncremental.acumulado90d ?? (
    valorRetenido(MOTIVO_SIN_CONSERVADOR)
  );

  // El límite superior de contexto es potencial cuando el documento lo
  // muestra (confianza alta); si no, cae a base. Nunca se comunica
  // "potencial" como número si el propio contrato lo mantiene oculto.
  const potencialVisible =
    potencialDoc?.visible === true && potencialDoc.contribucionIncremental.acumulado90d.estado === "calculado";
  const limiteSuperior: ValorPublicable<number> = potencialVisible
    ? potencialDoc!.contribucionIncremental.acumulado90d
    : (baseDoc?.contribucionIncremental.acumulado90d ?? valorRetenido(MOTIVO_SIN_LIMITE_SUPERIOR));
  const idEscenarioLimiteSuperior: "base" | "potencial" | null = potencialVisible
    ? "potencial"
    : baseDoc?.contribucionIncremental.acumulado90d.estado === "calculado"
      ? "base"
      : null;

  const ambosCalculados =
    limiteInferior.estado === "calculado" && limiteSuperior.estado === "calculado";
  const redaccion = ambosCalculados
    ? redaccionRangoContribucion(
        (limiteInferior as Extract<ValorPublicable<number>, { estado: "calculado" }>).valor,
        (limiteSuperior as Extract<ValorPublicable<number>, { estado: "calculado" }>).valor,
      )
    : null;

  const confianzaPrincipal: Exclude<ConfianzaDocumento, "bloqueada"> =
    conservadorDoc?.confianza === "bloqueada" ? "baja" : (conservadorDoc?.confianza ?? "baja");

  const cifraPrincipal: ValorPublicable<number> =
    limiteInferior.estado !== "calculado"
      ? limiteInferior
      : dispersion.alta
        ? valorRetenido(MOTIVO_DISPERSION_ALTA)
        : valorCalculado({
            valor: limiteInferior.valor,
            confianza: confianzaPrincipal,
            evidenciaIds: limiteInferior.evidenciaIds,
            supuestos: limiteInferior.supuestos,
          });

  return {
    escenarioComunicado: "conservador",
    cifraPrincipal,
    limiteInferior,
    limiteSuperior,
    idEscenarioLimiteSuperior,
    dispersion,
    redaccion,
  };
}
