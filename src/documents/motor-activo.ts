/**
 * Fase 14 (integración controlada de v2) — el interruptor completo, en un
 * único lugar. Ver `docs/fase-14/plan-reversion.md` para el plan de
 * reversión probado.
 *
 * P2 (prompt Fase 14, sección 2): el reemplazo se implementa completo pero
 * queda INACTIVO por defecto. Activarlo es un acto humano posterior,
 * después de que Matías genere los casos reales por el flujo real y los
 * apruebe — nunca automático, nunca por código.
 *
 * Para activar v2: cambiar el valor de acá a `"v2"`. Para revertir: volver
 * a `"v1"`. Es el ÚNICO lugar del código que decide qué motor documental
 * usa la interfaz — todo lo demás (`build-document.ts`,
 * `documentos.$id.$slug.tsx`, `renderers/pdf/export-client.ts`) LEE este
 * valor, ninguno decide por su cuenta.
 */
export type MotorDocumental = "v1" | "v2";

export const MOTOR_DOCUMENTAL_ACTIVO: MotorDocumental = "v1";
