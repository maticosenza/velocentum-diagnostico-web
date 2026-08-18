import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { formatARS } from "@/lib/format";
import { generarPropuesta } from "@/lib/propuesta.functions";
import type { PropuestaGenerada } from "@/lib/propuesta";
import type { Fuga } from "@/lib/calculo-diagnostico";

/** Palabras que asocian un hallazgo redactado con la fuga real del diagnóstico. */
const CLAVES_FUGA: Record<string, string[]> = {
  conversion: ["conversión", "conversion", "tasa de conversión"],
  gasto_no_rentable: ["mer", "breakeven", "gasto no rentable", "rentab"],
  sobrefragmentacion: ["fragment", "conjuntos", "estructura de cuenta"],
  carritos_abandonados: ["carrito"],
};

/**
 * Monto real del diagnóstico asociado a un hallazgo.
 * Nunca se muestran cifras salidas del texto del modelo.
 */
function montoDeHallazgo(titulo: string, fugas: Fuga[]): Fuga | null {
  const t = titulo.toLowerCase();
  for (const f of fugas) {
    if (f.tipo !== "monto" || typeof f.monto !== "number") continue;
    const claves = CLAVES_FUGA[f.id] ?? [f.etiqueta.toLowerCase()];
    if (claves.some((c) => t.includes(c))) return f;
  }
  return null;
}

export function PropuestaSeccion({
  diagnosticoId,
  propuestaGuardada,
  fugas,
}: {
  diagnosticoId: string;
  propuestaGuardada: PropuestaGenerada | null;
  fugas: Fuga[];
}) {
  const [propuesta, setPropuesta] = useState<PropuestaGenerada | null>(propuestaGuardada);
  const generar = useServerFn(generarPropuesta);

  const mutacion = useMutation({
    mutationFn: async (regenerar: boolean) =>
      generar({ data: { diagnosticoId, regenerar } }),
    onSuccess: (r) => setPropuesta(r.propuesta),
  });

  const cargando = mutacion.isPending;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-7 py-5">
        <div>
          <h2 className="text-[17px] font-medium text-foreground">Propuesta</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Redacción del diagnóstico para compartir con el prospecto.
          </p>
        </div>
        <Button
          size="sm"
          variant={propuesta ? "outline" : "default"}
          disabled={cargando}
          onClick={() => mutacion.mutate(propuesta !== null)}
        >
          {cargando
            ? "Generando…"
            : propuesta
              ? "Regenerar propuesta"
              : "Generar propuesta"}
        </Button>
      </header>

      {cargando && (
        <p className="px-7 py-8 text-[14px] text-muted-foreground">
          Estamos redactando la propuesta con los datos del diagnóstico. Puede tardar hasta un
          minuto.
        </p>
      )}

      {!cargando && mutacion.isError && (
        <div className="px-7 py-8">
          <p className="text-[14px] text-estado-rojo">
            {mutacion.error instanceof Error && mutacion.error.message
              ? mutacion.error.message
              : "No pudimos generar la propuesta."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => mutacion.mutate(true)}
          >
            Reintentar
          </Button>
        </div>
      )}

      {!cargando && !mutacion.isError && !propuesta && (
        <p className="px-7 py-8 text-[14px] text-muted-foreground">
          Todavía no generaste la propuesta de este diagnóstico.
        </p>
      )}

      {!cargando && propuesta && (
        <div className="space-y-10 px-7 py-8">
          <p className="max-w-4xl text-[19px] leading-8 text-foreground">{propuesta.resumen}</p>

          <div className="space-y-5">
            {propuesta.hallazgos.map((h, i) => {
              const fuga = montoDeHallazgo(h.titulo, fugas);
              return (
                <article key={`${h.titulo}-${i}`} className="rounded-lg border border-border px-6 py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                    <h3 className="text-[17px] font-medium text-foreground">{h.titulo}</h3>
                    {fuga && typeof fuga.monto === "number" && (
                      <p className="text-[20px] font-medium tabular-nums text-foreground">
                        {formatARS(fuga.monto)}
                        {fuga.sospechosa && (
                          <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                            orden de magnitud
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 space-y-2 text-[15px] leading-7 text-muted-foreground">
                    {h.que_encontramos && <p>{h.que_encontramos}</p>}
                    {h.que_significa && <p>{h.que_significa}</p>}
                    {h.que_hacemos && <p>{h.que_hacemos}</p>}
                  </div>
                  {h.capa === "servicio" && h.servicio && (
                    <p className="mt-4 border-t border-border pt-4 text-[14px] font-medium text-violet">
                      Lo resuelve: {h.servicio}
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {propuesta.plan_90_dias.length > 0 && (
            <div>
              <h3 className="text-[16px] font-medium text-foreground">Plan de 90 días</h3>
              <div className="mt-4 grid gap-5 lg:grid-cols-3">
                {propuesta.plan_90_dias.map((e, i) => (
                  <div key={`${e.etapa}-${i}`} className="rounded-lg border border-border px-6 py-5">
                    <p className="text-[14px] font-medium text-foreground">{e.etapa}</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-6 text-muted-foreground">
                      {e.acciones.map((a, j) => (
                        <li key={j}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {propuesta.servicios_recomendados.length > 0 && (
            <div>
              <h3 className="text-[16px] font-medium text-foreground">Servicios recomendados</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {propuesta.servicios_recomendados.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-violet/40 px-3 py-1 text-[13px] text-violet"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {propuesta.proximos_pasos && (
            <div>
              <h3 className="text-[16px] font-medium text-foreground">Próximos pasos</h3>
              <p className="mt-2 max-w-3xl text-[15.5px] leading-7 text-muted-foreground">
                {propuesta.proximos_pasos}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
