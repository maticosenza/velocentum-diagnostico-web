/**
 * Texto de estado con motivo real (E-04/E-17, contrato-composicion-v2.md
 * sección 1.1). Copy D4 literal (`docs/visual/auditoria-visual-2026-08-23.md`,
 * sección "D4 · Estados", Eje 2 — Disponibilidad del cálculo), aplicado a
 * los 3 estados que ya existen en `ValorPublicable` hoy (decisión 1 del
 * registro de `docs/visual/contrato-estados.md` sección 6 sigue sin
 * resolverse: no se agrega un cuarto estado `evidencia_faltante`).
 *
 * Regla dura: ningún renderer v2 escribe "Sin datos" ni "Retenido" a secas
 * a mano — todo texto de estado sale de acá.
 */
import { formatearNumeroConSupuesto } from "./formato";
import type { ValorV2 } from "../templates/velocentum-v2/types";

export type TextoEstadoV2 = {
  /** Texto a mostrar en el lugar del número (estado no-calculado) o el número formateado (calculado). */
  texto: string;
  /** true cuando `texto` es un número real; false cuando es un texto de estado D4. */
  esNumero: boolean;
  /** Línea secundaria opcional (motivo de `no_aplica`, o tooltip de "calculado"). */
  detalle: string | null;
};

const COPY_DISPONIBLE = "Calculado con los datos disponibles";

export function textoEstadoV2(valor: ValorV2): TextoEstadoV2 {
  if (valor.estado === "calculado") {
    return {
      texto: formatearNumeroConSupuesto(valor.valor, valor.formato, valor.supuestos),
      esNumero: true,
      detalle: COPY_DISPONIBLE,
    };
  }
  if (valor.estado === "retenido") {
    const motivo = valor.motivos.join(" ");
    return {
      texto: `No se muestra hasta validar: ${motivo}`,
      esNumero: false,
      detalle: null,
    };
  }
  // no_aplica: D4 no trae corchete de motivo en el copy principal — el
  // motivo real va como detalle secundario, sin alterar el string D4.
  return {
    texto: "Este cálculo no corresponde a este caso",
    esNumero: false,
    detalle: valor.motivo,
  };
}

export function esSupuesto(valor: ValorV2): boolean {
  return valor.estado === "calculado" && valor.supuestos.length > 0;
}
