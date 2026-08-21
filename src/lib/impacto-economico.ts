/**
 * Modelo tipado de impactos económicos.
 *
 * Reemplaza el uso semántico de `fuga.monto` genérico: cada fuga puede tener
 * más de un impacto, y cada impacto declara explícitamente qué magnitud
 * económica representa. Ver `docs/decision-2026-08-21-impactos-economicos.md`
 * para la decisión completa.
 *
 * Reglas duras de esta capa:
 *  - facturación incremental, contribución incremental y ahorro publicitario
 *    nunca se suman entre sí: son la misma recuperación vista desde ángulos
 *    distintos (facturación/contribución) o una magnitud completamente
 *    distinta (ahorro), y mezclarlas produce una cifra que no significa
 *    nada;
 *  - "retenida" nunca es cero: un impacto retenido no tiene `montoMensual`
 *    numérico, tiene `motivoRetencion`;
 *  - un diagnóstico calculado antes de este modelo (sólo `fuga.monto`, sin
 *    `impactos`) no se reinterpreta: se marca `no_clasificado` y queda
 *    retenido hasta recalcularse.
 */

import { sumarDecimal, redondear } from "./dinero";

export type TipoImpacto =
  | "facturacion_incremental"
  | "contribucion_incremental"
  | "ahorro_publicitario"
  /** Monto legado sin tipo: nunca participa de una agregación por magnitud. */
  | "no_clasificado";

export type ConfianzaImpacto = "alta" | "media" | "retenida";

export type ImpactoEconomico = {
  tipo: TipoImpacto;
  /** null únicamente cuando `confianza` es "retenida". Nunca un cero inventado. */
  montoMensual: number | null;
  moneda: "ARS";
  periodo: "mensual";
  confianza: ConfianzaImpacto;
  /** Datos de los que depende este impacto (para trazabilidad, no para cálculo). */
  dependencias: string[];
  /** Presente únicamente cuando `confianza` es "retenida". */
  motivoRetencion?: string;
};

export type TipoImpactoClasificado = Exclude<TipoImpacto, "no_clasificado">;

function finito(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Un impacto con un monto real (incluido cero real). */
export function impactoCalculado(args: {
  tipo: TipoImpactoClasificado;
  montoMensual: number;
  confianza: Exclude<ConfianzaImpacto, "retenida">;
  dependencias?: string[];
}): ImpactoEconomico {
  return {
    tipo: args.tipo,
    montoMensual: args.montoMensual,
    moneda: "ARS",
    periodo: "mensual",
    confianza: args.confianza,
    dependencias: args.dependencias ?? [],
  };
}

/** Un impacto que no se puede publicar todavía: nunca lleva un número. */
export function impactoRetenido(args: {
  tipo: TipoImpacto;
  motivo: string;
  dependencias?: string[];
}): ImpactoEconomico {
  return {
    tipo: args.tipo,
    montoMensual: null,
    moneda: "ARS",
    periodo: "mensual",
    confianza: "retenida",
    dependencias: args.dependencias ?? [],
    motivoRetencion: args.motivo,
  };
}

/** Forma mínima de una fuga, con o sin el modelo tipado. */
export type FugaConImpactosOpcional = {
  monto: number | null;
  impactos?: ImpactoEconomico[];
};

export function tieneImpactosTipados(
  fuga: FugaConImpactosOpcional,
): fuga is FugaConImpactosOpcional & { impactos: ImpactoEconomico[] } {
  return Array.isArray(fuga.impactos);
}

function motivoLegado(monto: number | null): string {
  const montoTexto = finito(monto) ? String(monto) : "sin monto";
  return (
    "Diagnóstico calculado antes de separar facturación, contribución y ahorro: " +
    `el monto legado (${montoTexto}) no se reclasifica automáticamente.`
  );
}

/**
 * Adapta una fuga persistida antes de este modelo (sólo `monto`, sin
 * `impactos`) a un único impacto `no_clasificado`, retenido. Nunca infiere
 * de qué magnitud se trataba: eso requeriría recalcular con el motor nuevo.
 */
export function impactosDeFugaLegado(fuga: { monto: number | null }): ImpactoEconomico[] {
  return [impactoRetenido({ tipo: "no_clasificado", motivo: motivoLegado(fuga.monto) })];
}

/**
 * Punto único de lectura: usa los impactos tipados si la fuga ya los trae, y
 * cae al adaptador legado si no. Ninguna otra capa debe leer `fuga.impactos`
 * directamente sin pasar por acá.
 */
export function impactosDeFuga(fuga: FugaConImpactosOpcional): ImpactoEconomico[] {
  return tieneImpactosTipados(fuga) ? fuga.impactos : impactosDeFugaLegado(fuga);
}

export type AgregadoImpacto =
  | { calculable: true; montoMensual: number }
  | { calculable: false; motivo: string };

/**
 * Suma los impactos de un mismo tipo clasificado a través de varias fugas.
 * Válido únicamente cuando las fugas de origen son disjuntas entre sí (los
 * tres tramos del funnel lo son); nunca usar esto para consolidar ahorro
 * publicitario, que puede solaparse (ver `consolidarAhorroPublicitario` en
 * `ahorro-publicitario.ts`).
 *
 * Si ningún impacto del tipo pedido existe, se considera no calculable (no
 * hay oportunidad de esa magnitud detectada), nunca cero. Si alguno de los
 * impactos presentes está retenido, el agregado completo queda retenido: no
 * tiene sentido publicar una suma parcial de una magnitud que depende de un
 * dato bloqueado.
 */
export function sumarImpactosPorTipo(
  impactosPorFuga: ImpactoEconomico[][],
  tipo: TipoImpactoClasificado,
): AgregadoImpacto {
  const relevantes = impactosPorFuga.flatMap((lista) => lista.filter((i) => i.tipo === tipo));

  if (relevantes.length === 0) {
    return {
      calculable: false,
      motivo: "No hay oportunidad de esta magnitud detectada con los datos actuales.",
    };
  }

  const retenido = relevantes.find((i) => i.confianza === "retenida");
  if (retenido) {
    return { calculable: false, motivo: retenido.motivoRetencion ?? "Impacto retenido." };
  }

  const total = sumarDecimal(...relevantes.map((i) => i.montoMensual as number));
  return { calculable: true, montoMensual: redondear(total, 0) ?? 0 };
}
