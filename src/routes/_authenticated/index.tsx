import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatARS, formatFecha } from "@/lib/format";
import { VERTICALES } from "@/lib/diagnostico-form";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Diagnósticos · Velocentum Cockpit" },
      {
        name: "description",
        content: "Listado de diagnósticos de performance para tiendas e-commerce.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Diagnósticos · Velocentum Cockpit" },
      {
        property: "og:description",
        content: "Listado de diagnósticos de performance para tiendas e-commerce.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListadoDiagnosticos,
});

const ESTADOS: Record<string, string> = {
  en_curso: "En curso",
  propuesta_enviada: "Propuesta enviada",
  cerrado: "Cerrado",
  perdido: "Perdido",
  en_seguimiento: "En seguimiento",
};

type Fila = {
  id: string;
  fecha: string;
  oportunidad_total: number | null;
  oportunidad: {
    nombre_tienda: string;
    vertical: string | null;
    estado: string;
  } | null;
};

function ListadoDiagnosticos() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["diagnosticos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostico")
        .select(
          "id, fecha, oportunidad_total, oportunidad:oportunidad_id(nombre_tienda, vertical, estado)",
        )
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Fila[];
    },
  });

  return (
    <>
      <PageHeader
        title="Diagnósticos"
        description="Todos los diagnósticos cargados durante las llamadas con prospectos."
        actions={
          <Button asChild size="sm">
            <Link to="/diagnosticos/nuevo">Nuevo diagnóstico</Link>
          </Button>
        }
      />
      <div className="space-y-4 px-6 py-6">
        {isLoading && <p className="text-[13px] text-muted-foreground">Cargando diagnósticos…</p>}

        {error && (
          <p className="text-[13px] text-destructive">
            No pudimos traer los diagnósticos. Recargá la pantalla.
          </p>
        )}

        {!isLoading && !error && (data?.length ?? 0) === 0 && (
          <EmptyState
            title="Todavía no hay diagnósticos"
            description="Cuando cargues el primero, vas a encontrarlo listado en esta pantalla."
            action={
              <Button asChild size="sm" variant="outline">
                <Link to="/diagnosticos/nuevo">Crear el primero</Link>
              </Button>
            }
          />
        )}

        {!isLoading && !error && (data?.length ?? 0) > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Tienda</th>
                  <th className="px-4 py-2.5 font-medium">Vertical</th>
                  <th className="px-4 py-2.5 font-medium">Fecha</th>
                  <th className="px-4 py-2.5 text-right font-medium">Oportunidad</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data!.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-b-0 hover:bg-muted/60">
                    <td className="px-4 py-2.5">
                      <Link
                        to="/diagnosticos/$id"
                        params={{ id: f.id }}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {f.oportunidad?.nombre_tienda ?? "Tienda sin nombre"}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {VERTICALES.find((v) => v.value === f.oportunidad?.vertical)?.label ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {f.fecha ? formatFecha(f.fecha) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                      {typeof f.oportunidad_total === "number"
                        ? formatARS(f.oportunidad_total)
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {ESTADOS[f.oportunidad?.estado ?? ""] ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
