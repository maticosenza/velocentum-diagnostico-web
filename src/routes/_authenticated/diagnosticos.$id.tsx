import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/diagnosticos/$id")({
  head: () => ({
    meta: [
      { title: "Detalle del diagnóstico · Velocentum Cockpit" },
      {
        name: "description",
        content: "Resultado del diagnóstico de performance para la tienda del prospecto.",
      },
      { property: "og:title", content: "Detalle del diagnóstico · Velocentum Cockpit" },
      {
        property: "og:description",
        content: "Resultado del diagnóstico de performance para la tienda del prospecto.",
      },
    ],
  }),
  component: DetalleDiagnostico,
});

function DetalleDiagnostico() {
  const { id } = Route.useParams();

  return (
    <>
      <PageHeader
        title="Detalle del diagnóstico"
        description={`Identificador: ${id}`}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/">Volver al listado</Link>
          </Button>
        }
      />
      <div className="px-6 py-6">
        <EmptyState
          title="Sin resultados todavía"
          description="Cuando esté lista la lógica de cálculo, acá vas a ver el diagnóstico completo."
        />
      </div>
    </>
  );
}
