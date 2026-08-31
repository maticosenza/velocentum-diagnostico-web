/**
 * Forma persistida de la columna `diagnostico.propuesta` (JSONB). Decisión
 * 9 de `docs/decisiones-pendientes.md` (cerrada 2026-08-22): la selección
 * de paquetes confirmada vive en la MISMA columna JSON que ya existía para
 * la propuesta redactada por el modelo — mismo criterio que todos los
 * campos nuevos de las fases 3 a 13, que vivieron en columnas JSON
 * existentes (`datos`, `derivados`, `configuracion.valor`) sin ninguna
 * migración. No hay razón técnica real que lo impida: el volumen es
 * mínimo, no hace falta ninguna consulta cruzada ni integridad
 * referencial sobre estos datos, y la concurrencia se resuelve leyendo el
 * valor actual antes de escribir (ver `separarContenidoGuardado`), no con
 * una columna separada.
 *
 * Antes de este bloque, la columna guardaba la propuesta generada
 * directamente (sin sobre). Para no perder los diagnósticos ya guardados,
 * `separarContenidoGuardado` reconoce las dos formas: la nueva (con claves
 * `propuesta`/`paquetes`) y la vieja (el objeto ES la propuesta).
 */
import type { PropuestaGenerada } from "./propuesta";
import type { EscaleraPaquetesConfirmada } from "./paquetes";
import type { SobreComercialV2 } from "./seleccion-comercial-v2";

/**
 * BV4 F2a etapa 3: la clave `paquetes` admite dos formas. La legada
 * (`EscaleraPaquetesConfirmada`, Fase 13) y el sobre comercial v2, que se
 * distinguen por `version === 2`. Quien lee no elige: usa
 * `escaleraConfirmadaDesdeColumna` o `normalizarSobreComercialV2`, según qué
 * necesite. La raíz de la columna NO cambia: sigue siendo
 * `{ propuesta, paquetes }`.
 */
export type PaquetesGuardado = EscaleraPaquetesConfirmada | SobreComercialV2;

export type ContenidoPropuestaGuardado = {
  propuesta: PropuestaGenerada | null;
  paquetes: PaquetesGuardado | null;
};

/**
 * Separa el valor crudo de la columna en sus dos partes, sin validar el
 * contenido de cada una (eso lo hacen `parsearRespuestaModelo` y
 * `normalizarEscaleraConfirmada` respectivamente). Nunca pisa una parte al
 * leer la otra: quien escribe siempre pasa por acá primero para conservar
 * lo que ya había.
 */
export function separarContenidoGuardado(valor: unknown): {
  propuestaCruda: unknown;
  paquetesCrudo: unknown;
} {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { propuestaCruda: null, paquetesCrudo: null };
  }
  const v = valor as Record<string, unknown>;
  if ("propuesta" in v || "paquetes" in v) {
    return { propuestaCruda: v["propuesta"] ?? null, paquetesCrudo: v["paquetes"] ?? null };
  }
  // Forma vieja (anterior a este bloque): el objeto guardado ES la
  // propuesta generada, directamente, sin sobre.
  return { propuestaCruda: v, paquetesCrudo: null };
}

/** Arma el valor a escribir en la columna, conservando ambas partes. */
export function combinarContenidoGuardado(args: {
  propuestaCruda: unknown;
  paquetesCrudo: unknown;
}): ContenidoPropuestaGuardado {
  return {
    propuesta: (args.propuestaCruda as PropuestaGenerada | null) ?? null,
    paquetes: (args.paquetesCrudo as PaquetesGuardado | null) ?? null,
  };
}
