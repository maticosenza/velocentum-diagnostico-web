/**
 * Texto de estado con motivo real (E-04/E-17, contrato-composicion-v2.md
 * sección 1.1). Copy D4 literal (prompt "BLOQUE 3 FUNCIONAL", sección 3.1),
 * cubre los 4 estados de `ValorV2`/Eje 2 (`textoEstadoV2`) y los 5 estados
 * de `Evidencia`/Eje 1 (`textoOrigenV2`) — ver
 * `docs/funcional/contrato-bloque-3.md`.
 *
 * Regla dura: ningún renderer v2 escribe "Sin datos" ni "Retenido" a secas
 * a mano — todo texto de estado sale de acá.
 */
import { formatearNumeroConSupuesto } from "./formato";
import type { ValorV2 } from "../templates/velocentum-v2/types";
import type { EstadoEvidencia } from "../domain";

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
  if (valor.estado === "evidencia_faltante") {
    // D4: "Falta [dato] para realizar este cálculo" — acá `motivos` es el
    // NOMBRE del dato ausente ("la facturación mensual"), nunca una
    // oración completa como en `retenido` (donde sí es una explicación).
    const dato = valor.motivos.join(" y ");
    return {
      texto: `Falta ${dato} para realizar este cálculo`,
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

const COPY_ORIGEN: Record<EstadoEvidencia, string> = {
  verificado: "Validado con evidencia del período",
  declarado: "Informado por el cliente; pendiente de validación documental",
  estimado_configuracion: "Referencia configurada; no validada con datos del cliente",
  no_disponible: "No contamos con este dato",
  no_aplica: "No corresponde a este negocio o canal",
};

/**
 * DA-1 (Bloque 3 Funcional): copy D4 literal del Eje 1 — origen de la
 * evidencia. Usado por el chip compacto de `metric-grid`/`coverage` (único
 * lugar donde este bloque autoriza mostrarlo en este bloque, ver
 * `docs/funcional/contrato-bloque-3.md`).
 */
export function textoOrigenV2(estado: EstadoEvidencia): string {
  return COPY_ORIGEN[estado];
}
