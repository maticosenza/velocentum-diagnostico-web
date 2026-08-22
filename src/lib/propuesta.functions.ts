import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DatosDiagnostico, NotasDiagnostico } from "./diagnostico-form";
import type { Derivados, EstadosBloque, Fuga } from "./calculo-diagnostico";
import { combinarContenidoGuardado, separarContenidoGuardado } from "./contenido-propuesta";
import {
  armarInsumoPropuesta,
  parsearRespuestaModelo,
  PROMPT_PROPUESTA,
  type PropuestaGenerada,
} from "./propuesta";

const MODELO = "claude-sonnet-4-6";

export const generarPropuesta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { diagnosticoId: string; regenerar?: boolean }) => {
    if (!input || typeof input.diagnosticoId !== "string" || input.diagnosticoId.length < 10) {
      throw new Error("Falta el diagnóstico.");
    }
    return { diagnosticoId: input.diagnosticoId, regenerar: input.regenerar === true };
  })
  .handler(async ({ data, context }): Promise<{ propuesta: PropuestaGenerada }> => {
    const { supabase } = context;

    const { data: fila, error } = await supabase
      .from("diagnostico")
      .select(
        "id, datos, derivados, estados_bloque, fugas, notas, oportunidad_total, propuesta, oportunidad:oportunidad_id(nombre_tienda, vertical, plataforma)",
      )
      .eq("id", data.diagnosticoId)
      .maybeSingle();

    if (error) throw new Error("No pudimos leer el diagnóstico.");
    if (!fila) throw new Error("No encontramos el diagnóstico.");

    const { propuestaCruda, paquetesCrudo } = separarContenidoGuardado(
      (fila as { propuesta?: unknown }).propuesta,
    );
    if (!data.regenerar && propuestaCruda) {
      const previa = parsearRespuestaModelo(JSON.stringify(propuestaCruda));
      if (previa) return { propuesta: previa };
    }

    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      throw new Error(
        "Falta configurar la clave de la API de Anthropic en los secretos del proyecto.",
      );
    }

    const oportunidad = (fila as unknown as {
      oportunidad: { nombre_tienda: string; vertical: string | null; plataforma: string | null } | null;
    }).oportunidad;
    const datos = ((fila as unknown as { datos: DatosDiagnostico }).datos ?? {}) as DatosDiagnostico;

    const insumo = armarInsumoPropuesta({
      datos,
      derivados: ((fila as unknown as { derivados: Derivados }).derivados ?? {}) as Derivados,
      estados: ((fila as unknown as { estados_bloque: Partial<EstadosBloque> }).estados_bloque ??
        {}) as Partial<EstadosBloque>,
      fugas: Array.isArray((fila as unknown as { fugas: Fuga[] }).fugas)
        ? ((fila as unknown as { fugas: Fuga[] }).fugas as Fuga[])
        : [],
      notas: ((fila as unknown as { notas: NotasDiagnostico }).notas ?? {}) as NotasDiagnostico,
      oportunidad_total: Number((fila as unknown as { oportunidad_total: number }).oportunidad_total ?? 0),
      nombre_tienda: oportunidad?.nombre_tienda ?? datos.nombre_tienda ?? "",
      vertical: oportunidad?.vertical ?? datos.vertical ?? null,
      plataforma: oportunidad?.plataforma ?? datos.plataforma ?? null,
    });

    const respuesta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 4000,
        system: PROMPT_PROPUESTA,
        messages: [
          {
            role: "user",
            content: `Diagnóstico calculado:\n${JSON.stringify(insumo, null, 2)}`,
          },
        ],
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      console.error("[propuesta] Anthropic", respuesta.status, detalle.slice(0, 500));
      if (respuesta.status === 429) {
        throw new Error("El modelo está saturado en este momento. Probá de nuevo en un minuto.");
      }
      if (respuesta.status === 401 || respuesta.status === 403) {
        throw new Error("La clave de la API de Anthropic no es válida o no tiene permisos.");
      }
      throw new Error("No pudimos generar la propuesta. Probá de nuevo.");
    }

    const cuerpo = (await respuesta.json()) as {
      content?: { type: string; text?: string }[];
    };
    const textoModelo = (cuerpo.content ?? [])
      .filter((c) => c.type === "text" && typeof c.text === "string")
      .map((c) => c.text as string)
      .join("\n")
      .trim();

    const propuesta = parsearRespuestaModelo(textoModelo);
    if (!propuesta) {
      throw new Error("La propuesta llegó incompleta. Probá generarla de nuevo.");
    }

    // Se conserva la selección de paquetes ya confirmada (si la hay): esta
    // escritura sólo reemplaza la propuesta redactada por el modelo, nunca
    // la columna entera (misma columna JSON, dos claves independientes).
    const aGuardar = combinarContenidoGuardado({ propuestaCruda: propuesta, paquetesCrudo });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: errorGuardar } = await supabaseAdmin
      .from("diagnostico")
      .update({ propuesta: aGuardar as unknown as never })
      .eq("id", data.diagnosticoId);
    if (errorGuardar) console.error("[propuesta] no se pudo guardar", errorGuardar.message);

    return { propuesta };
  });
