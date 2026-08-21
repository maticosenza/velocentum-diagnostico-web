/**
 * Consolidación del ahorro publicitario para agregados (motor de escenarios).
 *
 * `gasto_no_rentable` y `sobrefragmentacion` comparten el mismo perímetro de
 * inversión (`inversion_publicitaria_total`: Meta + Google + Product Ads
 * combinados) y pueden solaparse: ambos son formas de decir "esta plata de
 * pauta se puede recuperar", no dos ahorros independientes. Para la v1, sin
 * evidencia estructurada de que son gastos disjuntos, se asume solapamiento
 * total y se usa el mayor de los dos, nunca la suma.
 *
 * Esta consolidación es exclusivamente para agregados (el motor de
 * escenarios). El diagnóstico sigue mostrando ambas fugas por separado como
 * hallazgos individuales: cada una es una explicación distinta y el cliente
 * se beneficia de ver las dos.
 */

export type OrigenAhorroConsolidado = "gasto_no_rentable" | "sobrefragmentacion" | "ninguno";

export type AhorroPublicitarioConsolidado =
  | { calculable: true; montoMensual: number; origen: Exclude<OrigenAhorroConsolidado, "ninguno"> }
  | { calculable: false; motivo: string };

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export type ArgsConsolidarAhorroPublicitario = {
  /** null cuando `gasto_no_rentable` no es calculable con los datos actuales. */
  gastoNoRentable: number | null;
  /** null cuando `sobrefragmentacion` no es calculable con los datos actuales. */
  sobrefragmentacion: number | null;
  /** Inversión publicitaria elegible del perímetro compartido. null si no hay inversión declarada. */
  inversionElegible: number | null;
};

/**
 * Máximo entre `gasto_no_rentable` y `sobrefragmentacion`, nunca la suma
 * (mismo perímetro, solapamiento asumido total en v1), y nunca por encima de
 * la inversión publicitaria elegible del mismo perímetro.
 */
export function consolidarAhorroPublicitario(
  args: ArgsConsolidarAhorroPublicitario,
): AhorroPublicitarioConsolidado {
  const { gastoNoRentable, sobrefragmentacion, inversionElegible } = args;

  if (!finito(inversionElegible) || inversionElegible <= 0) {
    return { calculable: false, motivo: "No hay inversión publicitaria declarada." };
  }

  const candidatos: { origen: Exclude<OrigenAhorroConsolidado, "ninguno">; monto: number }[] = [];
  if (finito(gastoNoRentable)) candidatos.push({ origen: "gasto_no_rentable", monto: gastoNoRentable });
  if (finito(sobrefragmentacion)) {
    candidatos.push({ origen: "sobrefragmentacion", monto: sobrefragmentacion });
  }

  if (candidatos.length === 0) {
    return {
      calculable: false,
      motivo: "No hay ahorro publicitario calculable con los datos actuales.",
    };
  }

  const mayor = candidatos.reduce((acc, c) => (c.monto > acc.monto ? c : acc));
  const montoMensual = Math.min(Math.max(0, mayor.monto), inversionElegible);
  return { calculable: true, montoMensual, origen: mayor.origen };
}
