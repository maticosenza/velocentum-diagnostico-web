import type { DocumentTheme } from "./types";
import { VELOCENTUM_LIGHT_V1 } from "./velocentum-light-v1";
import { VELOCENTUM_WEB_V1 } from "./velocentum-web-v1";

/**
 * Interruptor del tema documental — Bloque Visual 4. Mismo patrón que
 * `src/documents/motor-activo.ts`, deliberadamente: un único lugar del
 * código decide, todo lo demás lee.
 *
 * F2b (2026-09-15) reemplaza `velocentum-crystal/v1`, retirado por DH-10,
 * por `velocentum-web/v1`. El interruptor sigue en `velocentum-light-v1`:
 * la interfaz adopta el tema nuevo por `src/styles.css`, y los documentos
 * lo adoptan recién en F3b. Hoy los renderers de PDF importan
 * `VELOCENTUM_LIGHT_V1` directo y nadie lee este interruptor.
 *
 * Para activar: cambiar el valor de `TEMA_DOCUMENTAL_ACTIVO` a
 * `"velocentum-web-v1"`. Para revertir: volver a `"velocentum-light-v1"`.
 */
export type TemaDocumental = "velocentum-light-v1" | "velocentum-web-v1";

export const TEMAS_DOCUMENTALES = {
  "velocentum-light-v1": VELOCENTUM_LIGHT_V1,
  "velocentum-web-v1": VELOCENTUM_WEB_V1,
} as const satisfies Record<TemaDocumental, DocumentTheme>;

export const TEMA_DOCUMENTAL_ACTIVO: TemaDocumental = "velocentum-light-v1";

/** El tema que corresponde al interruptor. Único punto de lectura. */
export function temaDocumentalActivo(): DocumentTheme {
  return TEMAS_DOCUMENTALES[TEMA_DOCUMENTAL_ACTIVO];
}
