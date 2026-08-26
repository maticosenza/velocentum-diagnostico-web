/**
 * D-5 (Bloque Visual 2.2) — tokens y reglas de dirección de arte,
 * compartidos por los dos renderers v2 (PDF y web). Ningún renderer define
 * un recurso decorativo propio fuera de este módulo (Q6): opacidad de
 * textura, geometría de degradado, escala de profundidad de tarjeta,
 * reglas de iconografía y personalidad por documento viven acá una sola
 * vez. Fuente: `Dropnkicks propuesta.pdf` (dirección de arte — paleta,
 * tarjetas redondeadas con profundidad leve, iconografía lineal en
 * círculos, numeración 01/02/03, motivo de línea + puntos bajo títulos,
 * fondos con geometría sutil) y `velocentum_design_system.txt` (tokens de
 * color/tipografía). Ningún contenido, copy ni cifra de la referencia se
 * usa acá — sólo dirección de arte, ver `docs/visual/contrato-composicion-v2.md`
 * sección 6.
 */
import type { DocumentKindV2 } from "../templates/velocentum-v2/types";

/** Opacidad máxima de textura/geometría de fondo, por perfil (contrato 6.1). */
export const TEXTURA_FONDO = {
  opacidadMaximaPantalla: 0.05,
  opacidadMaximaImpresion: 0.035,
  espaciadoLineaPt: 46,
} as const;

/** Geometría de degradado por perfil (contrato 6.2) — extiende, no reemplaza, R-05. */
export const DEGRADADO = {
  direccion: "diagonal-descendente" as const,
  extensionPantallaPct: 45,
  extensionImpresionPt: 200,
};

/** Escala de profundidad de tarjeta (sombra/glow) por perfil (contrato 6.3). */
export const PROFUNDIDAD_TARJETA = {
  pantalla: { offsetPt: 3, opacidad: 0.12 },
  impresion: { offsetPt: 2, opacidad: 0.08 },
} as const;

/** RGB del acento primario (`--velocentum-primary`, referencia de diseño), para componer rgba(). */
const PRIMARY_RGB = "59, 46, 245";

/** Color de sombra/glow de tarjeta, listo para `backgroundColor`/`box-shadow` (contrato 6.3). */
export function colorProfundidadTarjeta(perfil: "pantalla" | "impresion"): string {
  const t = PROFUNDIDAD_TARJETA[perfil];
  return `rgba(${PRIMARY_RGB}, ${t.opacidad})`;
}

/** Color de línea de textura de fondo, listo para usar en trazos SVG/CSS (contrato 6.1). */
export function colorTexturaLinea(perfil: "pantalla" | "impresion"): string {
  const opacidad = perfil === "pantalla" ? TEXTURA_FONDO.opacidadMaximaPantalla : TEXTURA_FONDO.opacidadMaximaImpresion;
  return `rgba(${PRIMARY_RGB}, ${opacidad})`;
}

/**
 * Regla de iconografía (contrato 6.4): sólo se usa para identificar
 * etapa/canal/acción — nunca por defecto en cada tarjeta. Superficies
 * habilitadas explícitamente.
 */
export const ICONOGRAFIA_SUPERFICIES = [
  "cover",
  "scenario-header",
  "channel-comparison",
] as const;

/**
 * Personalidad por documento (contrato 6.5): un glifo/tono distinto por
 * `DocumentKindV2`, aplicado únicamente al eyebrow — nunca cambia la
 * paleta base ni introduce contenido nuevo.
 */
export const PERSONALIDAD_POR_DOCUMENTO: Record<DocumentKindV2, { glifo: string; tono: string }> = {
  diagnostico: { glifo: "◆", tono: "neutral — lectura de estado actual" },
  proyeccion_90d: { glifo: "→", tono: "dinámico — proyección hacia adelante" },
  propuesta: { glifo: "●", tono: "comercial — llamado a decisión" },
};

/**
 * Límite duro de decoración (contrato 6.6): ninguna textura/degradado/
 * profundidad puede superponerse a estos tipos de contenido.
 */
export const LIMITE_DECORACION_SUPERFICIES_PROHIBIDAS = [
  "cifras (ValorTexto, cardValue, commercialSummaryNumber)",
  "badges de prioridad/alerta",
  "filas de tabla mensual",
] as const;

/** Motivo de línea + puntos bajo títulos (fiel a la referencia, ver contrato 6.1). */
export const REGLA_MOTIVO = "línea corta seguida de puntos, en color de acento, bajo eyebrow o subtítulo";
