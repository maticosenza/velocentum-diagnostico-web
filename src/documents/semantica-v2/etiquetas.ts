/**
 * Traducciones centralizadas para los renderers v2 (E-15/E-17,
 * contrato-composicion-v2.md sección 1.3). Antes vivían duplicadas y
 * parcialmente distintas entre `renderers/pdf/document.tsx` y
 * `renderers/web/document-renderer.tsx`.
 */

export const LABELS_CAPA = {
  servicio: "Servicio",
  recomendacion: "Recomendación",
  contexto: "Contexto",
} as const;

export const LABELS_PRIORIDAD = {
  alta: "ALTA",
  media: "MEDIA",
  baja: "BAJA",
} as const;

/** Ícono textual (no depende de color — E-11/D4: nunca sólo un color). */
export const ICONOS_PRIORIDAD = {
  alta: "▲",
  media: "●",
  baja: "▽",
} as const;

/** Etiqueta de magnitud económica (corrección aprobada 2026-08-21, punto 3). */
export const LABELS_MAGNITUD = {
  facturacion_incremental: "Facturación incremental",
  contribucion_incremental: "Contribución incremental",
  ahorro_publicitario: "Ahorro publicitario",
} as const;

export const LABELS_CONFIANZA = {
  alta: "Confianza alta",
  media: "Confianza media",
  baja: "Confianza baja",
  bloqueada: "Cifra bloqueada",
} as const;

export const LABELS_UNIDAD_COMERCIAL = {
  campañas_activas: "campañas activas",
  campañas: "campañas",
  piezas_por_mes: "piezas por mes",
  alcance_descrito: "alcance descrito",
} as const;

export const LABELS_ESCENARIO = {
  conservador: "Conservador",
  base: "Base",
  potencial: "Potencial",
} as const;

export const LABELS_ORIGEN_SUPUESTO = {
  observado: "Observado",
  declarado: "Declarado",
  configuracion: "Configuración",
  derivado: "Derivado",
} as const;

/** Período explícito de una palanca (E-03): nunca un monto sin calificador. */
export const LABELS_PERIODO = {
  ritmo_mensual_dia_90: "ritmo mensual al día 90",
  acumulado_90d: "acumulado a 90 días",
} as const;

/** Tipo de documento explícito en la portada (C10, ronda 2.1). */
export const LABELS_TIPO_DOCUMENTO = {
  diagnostico: "Diagnóstico",
  proyeccion_90d: "Proyección a 90 días",
  propuesta: "Propuesta comercial",
} as const;

/**
 * D-4, ronda 2.2: título del bloque de supuestos que vincula
 * explícitamente la marca † con esta lista — antes el bloque se
 * titulaba sólo "Supuestos", sin ningún texto que conectara el símbolo
 * con su destino. Idéntico en PDF y web (paridad).
 */
export const TITULO_SUPUESTOS_CON_DAGA = "Supuestos — referencia de los valores marcados con †";
