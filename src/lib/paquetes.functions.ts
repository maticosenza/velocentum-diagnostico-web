import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { combinarContenidoGuardado, separarContenidoGuardado } from "./contenido-propuesta";
import type { EscaleraPaquetesConfirmada } from "./paquetes";

/**
 * Persiste la selección de paquetes confirmada manualmente (decisión 9,
 * `docs/decisiones-pendientes.md`, cerrada 2026-08-22). Reutiliza la
 * columna `diagnostico.propuesta` (JSONB, ya existente): lee el valor
 * actual primero para no pisar la propuesta redactada por el modelo que
 * pueda ya estar guardada ahí.
 */
export const confirmarPaquetes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { diagnosticoId: string; escalera: EscaleraPaquetesConfirmada }) => {
    if (!input || typeof input.diagnosticoId !== "string" || input.diagnosticoId.length < 10) {
      throw new Error("Falta el diagnóstico.");
    }
    if (
      !input.escalera ||
      input.escalera.confirmado !== true ||
      !Array.isArray(input.escalera.niveles)
    ) {
      throw new Error("La escalera de paquetes no está confirmada.");
    }
    return { diagnosticoId: input.diagnosticoId, escalera: input.escalera };
  })
  .handler(async ({ data, context }): Promise<{ paquetes: EscaleraPaquetesConfirmada }> => {
    const { supabase } = context;

    const { data: fila, error } = await supabase
      .from("diagnostico")
      .select("id, propuesta")
      .eq("id", data.diagnosticoId)
      .maybeSingle();
    if (error) throw new Error("No pudimos leer el diagnóstico.");
    if (!fila) throw new Error("No encontramos el diagnóstico.");

    const { propuestaCruda } = separarContenidoGuardado((fila as { propuesta?: unknown }).propuesta);
    const aGuardar = combinarContenidoGuardado({ propuestaCruda, paquetesCrudo: data.escalera });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: errorGuardar } = await supabaseAdmin
      .from("diagnostico")
      .update({ propuesta: aGuardar as unknown as never })
      .eq("id", data.diagnosticoId);
    if (errorGuardar) throw new Error("No pudimos guardar la selección de paquetes.");

    return { paquetes: data.escalera };
  });
