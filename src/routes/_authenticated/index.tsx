import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

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
    ],
  }),
  component: ListadoDiagnosticos,
});

function ListadoDiagnosticos() {
  const { user } = Route.useRouteContext();

  return (
    <>
      <PageHeader
        title="Diagnósticos"
        description="Acá vas a ver todos los diagnósticos cargados durante las llamadas con prospectos."
        actions={
          <Button asChild size="sm">
            <Link to="/diagnosticos/nuevo">Nuevo diagnóstico</Link>
          </Button>
        }
      />
      <div className="space-y-4 px-6 py-6">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[12px] text-muted-foreground">
            Sesión activa como{" "}
            <span className="font-medium text-foreground">{user?.email ?? "—"}</span>
          </p>
        </div>

        <EmptyState
          title="Todavía no hay diagnósticos"
          description="Cuando cargues el primero, vas a encontrarlo listado en esta pantalla."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/diagnosticos/nuevo">Crear el primero</Link>
            </Button>
          }
        />
      </div>
    </>
  );
}
