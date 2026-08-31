import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { combinarContenidoGuardado, separarContenidoGuardado } from "./contenido-propuesta";
import {
  normalizarSobreComercialV2,
  paquetesConSobreV2,
  problemasDeSeleccionV2,
  type SobreComercialV2,
} from "./seleccion-comercial-v2";

/**
 * BV4 · F2a etapa 3 — persiste la selección comercial v2.
 *
 * Vive en la MISMA columna JSONB que todo lo demás, `diagnostico.propuesta`,
 * dentro de la clave `paquetes` (F-2, opción (a) aprobada por Matías el
 * 2026-08-31). **Cero migraciones de esquema**: es más JSON en una columna
 * que ya existe y que ya llevaba un sobre.
 *
 * La selección vive en base, no en estado de React: es condición del chequeo
 * SHA-256 entre el PDF descargado de la interfaz y el del pipeline. El
 * componente no es la fuente de verdad; esta función lo es.
 *
 * Tres cosas que esta función NO puede romper, por construcción:
 *
 *  - la propuesta redactada por el modelo, que vive en la clave hermana:
 *    se lee el valor actual y se recombina, nunca se sobrescribe la columna
 *    entera;
 *  - la escalera legada de la Fase 13: `paquetesConSobreV2` la lee del valor
 *    guardado y la preserva. El `legado` que mande el cliente se IGNORA a
 *    propósito — el cliente no puede pisar lo que alimenta la salida v1;
 *  - la forma del sobre: lo que llega se normaliza contra el catálogo antes
 *    de guardarse, así que lo persistido siempre tiene las diez líneas y
 *    valores válidos, venga de donde venga.
 */
export const confirmarSeleccionComercialV2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { diagnosticoId: string; sobre: unknown }) => {
    if (!input || typeof input.diagnosticoId !== "string" || input.diagnosticoId.length < 10) {
      throw new Error("Falta el diagnóstico.");
    }
    const sobre = normalizarSobreComercialV2(input.sobre);
    if (!sobre) {
      throw new Error("La selección comercial no tiene la forma esperada.");
    }
    const problemas = problemasDeSeleccionV2(sobre.seleccion);
    if (problemas.length > 0) {
      throw new Error(`La selección comercial es inconsistente: ${problemas.join("; ")}.`);
    }
    return { diagnosticoId: input.diagnosticoId, sobre };
  })
  .handler(async ({ data, context }): Promise<{ sobre: SobreComercialV2 }> => {
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

    // El `legado` sale SIEMPRE de lo guardado, nunca del cliente.
    const sobre = paquetesConSobreV2(paquetesCrudo, {
      moneda: data.sobre.moneda,
      fiscal: data.sobre.fiscal,
      seleccion: data.sobre.seleccion,
    });
    const aGuardar = combinarContenidoGuardado({ propuestaCruda, paquetesCrudo: sobre });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: errorGuardar } = await supabaseAdmin
      .from("diagnostico")
      .update({ propuesta: aGuardar as unknown as never })
      .eq("id", data.diagnosticoId);
    if (errorGuardar) throw new Error("No pudimos guardar la selección comercial.");

    return { sobre };
  });
