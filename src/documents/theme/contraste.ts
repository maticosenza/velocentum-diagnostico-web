/**
 * Contraste WCAG 2.1, para verificar los pares del tema de marca (BV4 F1,
 * etapa 2). Implementación directa de la definición normativa —
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance y
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio — sin dependencias:
 * el cálculo tiene que poder correr dentro de la suite sin sumar paquetes.
 *
 * Umbrales de `docs/bv4-contrato-maestro.md`: AA 4,5:1 para texto normal y
 * 3:1 para texto grande o elemento gráfico.
 */

/** AA, texto normal. */
export const UMBRAL_AA_TEXTO = 4.5;
/** AA, texto grande (≥18pt, o ≥14pt en negrita) y elementos gráficos. */
export const UMBRAL_AA_GRANDE = 3;

function canalLineal(valor: number): number {
  const v = valor / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Luminancia relativa de un hex `#RRGGBB`. */
export function luminanciaRelativa(hex: string): number {
  const limpio = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) {
    throw new Error(`Color no soportado: "${hex}". Se espera #RRGGBB.`);
  }
  const n = Number.parseInt(limpio, 16);
  return (
    0.2126 * canalLineal((n >> 16) & 255) +
    0.7152 * canalLineal((n >> 8) & 255) +
    0.0722 * canalLineal(n & 255)
  );
}

/** Relación de contraste entre dos hexes. Simétrica: el orden no cambia el número. */
export function relacionDeContraste(a: string, b: string): number {
  const la = luminanciaRelativa(a);
  const lb = luminanciaRelativa(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Redondeo a dos decimales, para reportes legibles. */
export function contrasteRedondeado(a: string, b: string): number {
  return Math.round(relacionDeContraste(a, b) * 100) / 100;
}
