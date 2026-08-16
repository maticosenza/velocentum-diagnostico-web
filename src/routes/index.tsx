import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diagnósticos · Velocentum Cockpit" },
      {
        name: "description",
        content:
          "Listado de diagnósticos de performance para tiendas e-commerce, uso interno de Velocentum.",
      },
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
      <div className="px-6 py-6">
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
