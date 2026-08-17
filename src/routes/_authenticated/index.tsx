import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatARS, formatFecha } from "@/lib/format";
import { VERTICALES } from "@/lib/diagnostico-form";


export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Diagnósticos · Velocentum · Diagnóstico e-commerce" },
      {
        name: "description",
        content: "Listado de diagnósticos de performance para tiendas e-commerce.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Diagnósticos · Velocentum · Diagnóstico e-commerce" },
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
  version: number | null;
  oportunidad_id: string;
  oportunidad_total: number | null;
  oportunidad: {
    nombre_tienda: string;
    vertical: string | null;
    estado: string;
  } | null;
};

function ListadoDiagnosticos() {
  const queryClient = useQueryClient();
  const [aEliminar, setAEliminar] = useState<Fila | null>(null);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["diagnosticos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostico")
        .select(
          "id, fecha, version, oportunidad_id, oportunidad_total, oportunidad:oportunidad_id(nombre_tienda, vertical, estado)",
        )
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Fila[];
    },
  });

  const eliminar = useMutation({
    mutationFn: async (fila: Fila) => {
      const { error: errDiag } = await supabase.from("diagnostico").delete().eq("id", fila.id);
      if (errDiag) throw errDiag;

      // Si la oportunidad se queda sin diagnósticos, la borramos también.
      const { data: restantes, error: errCount } = await supabase
        .from("diagnostico")
        .select("id")
        .eq("oportunidad_id", fila.oportunidad_id)
        .limit(1);
      if (errCount) throw errCount;
      if ((restantes ?? []).length === 0) {
        const { error: errOp } = await supabase
          .from("oportunidad")
          .delete()
          .eq("id", fila.oportunidad_id);
        if (errOp) throw errOp;
      }
    },
    onSuccess: () => {
      setAEliminar(null);
      setErrorBorrado(null);
      void queryClient.invalidateQueries({ queryKey: ["diagnosticos"] });
    },
    onError: () => setErrorBorrado("No pudimos eliminar el diagnóstico. Probá de nuevo."),
  });


  const conVarias = new Set(
    (data ?? [])
      .map((f) => f.oportunidad_id)
      .filter((id, _i, arr) => arr.filter((o) => o === id).length > 1),
  );

  return (
    <>
      <PageHeader
        title="Diagnósticos"
        description="Todos los diagnósticos cargados durante las llamadas con prospectos."
        actions={
          <Button asChild size="sm">
            <Link to="/diagnosticos/nuevo" search={{}}>Nuevo diagnóstico</Link>
          </Button>
        }
      />
      <div className="space-y-4 px-8 py-8">
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
                <Link to="/diagnosticos/nuevo" search={{}}>Crear el primero</Link>
              </Button>
            }
          />
        )}

        {!isLoading && !error && (data?.length ?? 0) > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-4 font-medium">Tienda</th>
                  <th className="px-5 py-4 font-medium">Vertical</th>
                  <th className="px-5 py-4 font-medium">Fecha</th>
                  <th className="px-5 py-4 text-right font-medium">Oportunidad</th>
                  <th className="px-5 py-4 font-medium">Estado</th>
                  <th className="px-5 py-4 text-right font-medium">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data!.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-b-0 hover:bg-muted/60">
                    <td className="px-5 py-4">
                      <Link
                        to="/diagnosticos/$id"
                        params={{ id: f.id }}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {f.oportunidad?.nombre_tienda ?? "Tienda sin nombre"}
                      </Link>
                      {conVarias.has(f.oportunidad_id) && (
                        <span className="ml-2 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          v{f.version ?? 1}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {VERTICALES.find((v) => v.value === f.oportunidad?.vertical)?.label ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {f.fecha ? formatFecha(f.fecha) : "—"}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-foreground">
                      {typeof f.oportunidad_total === "number"
                        ? formatARS(f.oportunidad_total)
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {ESTADOS[f.oportunidad?.estado ?? ""] ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorBorrado(null);
                          setAEliminar(f);
                        }}
                        className="text-[13px] text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={aEliminar !== null} onOpenChange={(o) => !o && setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este diagnóstico?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el diagnóstico de{" "}
              {aEliminar?.oportunidad?.nombre_tienda ?? "esta tienda"}. La acción no se puede
              deshacer. Si era el único de esa oportunidad, también se elimina la oportunidad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorBorrado && (
            <p className="text-[13px] text-destructive" role="alert">
              {errorBorrado}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={eliminar.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (aEliminar) eliminar.mutate(aEliminar);
              }}
            >
              {eliminar.isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

}
