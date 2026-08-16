import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/diagnosticos/nuevo")({
  head: () => ({
    meta: [
      { title: "Nuevo diagnóstico · Velocentum Cockpit" },
      {
        name: "description",
        content:
          "Cargá los datos del negocio del prospecto para generar un diagnóstico de performance.",
      },
      { property: "og:title", content: "Nuevo diagnóstico · Velocentum Cockpit" },
      {
        property: "og:description",
        content: "Cargá los datos del negocio del prospecto para generar un diagnóstico.",
      },
    ],
  }),
  component: NuevoDiagnostico,
});

function NuevoDiagnostico() {
  return (
    <>
      <PageHeader
        title="Nuevo diagnóstico"
        description="Cargá los datos del negocio mientras hablás con el prospecto."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/">Volver al listado</Link>
          </Button>
        }
      />
      <div className="px-6 py-6">
        <EmptyState
          title="Formulario en preparación"
          description="Acá va a ir la carga de datos del negocio. Por ahora es solo el esqueleto de la pantalla."
        />
      </div>
    </>
  );
}
