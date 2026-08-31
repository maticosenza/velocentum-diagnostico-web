import type { DocumentTheme } from "./types";
import { VELOCENTUM_LIGHT_V1 } from "./velocentum-light-v1";
import { VELOCENTUM_CRYSTAL_V1 } from "./velocentum-crystal-v1";

/**
 * Interruptor del tema documental — Bloque Visual 4, fase F1 (2026-08-31).
 * Mismo patrón que `src/documents/motor-activo.ts`, deliberadamente: un
 * único lugar del código decide, todo lo demás lee.
 *
 * El tema nuevo (`velocentum-crystal/v1`) se implementa completo pero queda
 * INACTIVO por defecto. Activarlo es un acto humano posterior, después del
 * veredicto de Matías sobre el isotipo y la muestra visual — nunca
 * automático, nunca por código. Ningún commit de F1 deja `crystal` activo.
 *
 * Para activar: cambiar el valor de `TEMA_DOCUMENTAL_ACTIVO` a
 * `"velocentum-crystal-v1"`. Para revertir: volver a `"velocentum-light-v1"`.
 *
 * F1 crea el interruptor y no lo cablea a ninguna superficie: migrar
 * documentos o UI al tema nuevo es alcance de F2/F3. Hoy nadie lo consume,
 * y eso es correcto.
 */
export type TemaDocumental = "velocentum-light-v1" | "velocentum-crystal-v1";

export const TEMAS_DOCUMENTALES = {
  "velocentum-light-v1": VELOCENTUM_LIGHT_V1,
  "velocentum-crystal-v1": VELOCENTUM_CRYSTAL_V1,
} as const satisfies Record<TemaDocumental, DocumentTheme>;

export const TEMA_DOCUMENTAL_ACTIVO: TemaDocumental = "velocentum-light-v1";

/** El tema que corresponde al interruptor. Único punto de lectura. */
export function temaDocumentalActivo(): DocumentTheme {
  return TEMAS_DOCUMENTALES[TEMA_DOCUMENTAL_ACTIVO];
}
