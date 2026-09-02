import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { combinarContenidoGuardado, separarContenidoGuardado } from "./contenido-propuesta";
import type { EscaleraPaquetesConfirmada } from "./paquetes";
import { paquetesConEscaleraV1 } from "./seleccion-comercial-v2";

/**
 * Persiste la selección de paquetes confirmada manualmente (decisión 9,
 * `docs/decisiones-pendientes.md`, cerrada 2026-08-22). Reutiliza la
 * columna `diagnostico.propuesta` (JSONB, ya existente): lee el valor
 * actual primero para no pisar la propuesta redactada por el modelo que
 * pueda ya estar guardada ahí.
 *
 * BV4 F2a etapa 3: tampoco pisa un sobre comercial v2 que ya estuviera en la
 * clave `paquetes`. `paquetesConEscaleraV1` decide la forma a escribir — si
 * hay sobre v2, la escalera entra como su `legado`; si no, se escribe tal
 * cual, exactamente como antes de F2a. Los dos escritores conviven sin
 * destruirse.
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

    const { propuestaCruda, paquetesCrudo } = separarContenidoGuardado(
      (fila as { propuesta?: unknown }).propuesta,
    );
    const aGuardar = combinarContenidoGuardado({
      propuestaCruda,
      paquetesCrudo: paquetesConEscaleraV1(paquetesCrudo, data.escalera),
    });

    // La escritura va por el mismo cliente autenticado que la lectura: sujeto
    // a RLS, no service role. Ver `docs/bv4-f2a-gate-navegador.md`, 0-bis.
    const { error: errorGuardar } = await supabase
      .from("diagnostico")
      .update({ propuesta: aGuardar as unknown as never })
      .eq("id", data.diagnosticoId);
    if (errorGuardar) throw new Error("No pudimos guardar la selección de paquetes.");

    return { paquetes: data.escalera };
  });
