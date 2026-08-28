import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  armarDocumentoActivo,
  documentoActivoPorSlug,
  documentosDisponiblesActivos,
  type DocumentModelResuelto,
  type DocumentoSlug,
} from "@/documents/build-document";
import type { DiagnosticoAlmacenado } from "@/documents/domain/from-diagnostico";
import { DocumentWebRenderer } from "@/documents/renderers/web";
import { DocumentWebRendererV2 } from "@/documents/renderers/web-v2/document-renderer";
import type { PdfProfile } from "@/documents/renderers/pdf/document";

/**
 * Fase 14: `PdfProfile` (v1) y `PdfProfileV2` son el mismo literal
 * (`"pantalla" | "impresion"`) definido dos veces (aislamiento entre
 * renderers, ver `contrato-composicion-v2.md` sección 1) — un único
 * mapa de etiquetas sirve para los dos, sin importar cuál está activo.
 */
const ETIQUETA_PERFIL: Record<PdfProfile, string> = {
  pantalla: "Pantalla (16:9)",
  impresion: "Impresión (A4)",
};

export const Route = createFileRoute("/_authenticated/documentos/$id/$slug")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Vista previa del documento · Velocentum · Diagnóstico e-commerce" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: ({ params }) => {
    const documento = documentoActivoPorSlug(params.slug);
    if (!documento) throw notFound();
    return { documento };
  },
  component: VistaPreviaDocumento,
});

function volverAction(id: string) {
  return (
    <Button asChild size="sm" variant="outline">
      <Link to="/diagnosticos/$id" params={{ id }}>
        Volver al diagnóstico
      </Link>
    </Button>
  );
}

function VistaPreviaDocumento() {
  const { id, slug } = Route.useParams();
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["diagnostico-documento", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostico")
        .select(
          "id, fecha, version, datos, derivados, estados_bloque, fugas, oportunidad_total, propuesta",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DiagnosticoAlmacenado | null;
    },
  });

  const volver = volverAction(id);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Vista previa del documento" actions={volver} />
        <div className="px-8 py-10" role="status" aria-live="polite">
          <p className="text-[14px] text-muted-foreground">Cargando el diagnóstico…</p>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Vista previa del documento" actions={volver} />
        <div className="px-8 py-10" role="status" aria-live="polite">
          <EmptyState
            title="No encontramos este diagnóstico"
            description="Puede que se haya borrado o que el enlace esté mal. Volvé al diagnóstico y probá de nuevo."
            action={volver}
          />
        </div>
      </>
    );
  }

  let resuelto: DocumentModelResuelto;
  try {
    // `slug` ya se validó contra el catálogo activo en `beforeLoad`
    // (`documentoActivoPorSlug`, que lanza `notFound()` si no existe) —
    // acá siempre es uno de los slugs reales.
    resuelto = armarDocumentoActivo(data, slug as DocumentoSlug);
  } catch (buildError) {
    return (
      <>
        <PageHeader title="Vista previa del documento" actions={volver} />
        <div className="px-8 py-10" role="status" aria-live="polite">
          <EmptyState
            title="Este diagnóstico todavía no tiene lo necesario para armar el documento"
            description={
              buildError instanceof Error
                ? buildError.message
                : "Faltan datos del diagnóstico para generar la vista previa."
            }
            action={volver}
          />
        </div>
      </>
    );
  }

  const descargarPdf = async (profile: PdfProfile) => {
    setErrorDescarga(null);
    setDescargando(true);
    try {
      if (resuelto.engine === "v2") {
        const { downloadDocumentModelPdfV2 } = await import("@/documents/renderers/pdf-v2/export-client");
        await downloadDocumentModelPdfV2(resuelto.model, profile);
      } else {
        const { downloadDocumentModelPdf } = await import("@/documents/renderers/pdf/export-client");
        await downloadDocumentModelPdf(resuelto.model, profile);
      }
    } catch (downloadError) {
      setErrorDescarga(
        downloadError instanceof Error
          ? downloadError.message
          : "No se pudo generar el PDF. Probá de nuevo.",
      );
    } finally {
      setDescargando(false);
    }
  };

  const acciones = (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" disabled={descargando} aria-busy={descargando}>
            {descargando ? "Generando PDF…" : "Descargar PDF"}
            <ChevronDown className="ml-1.5 size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(ETIQUETA_PERFIL) as PdfProfile[]).map((profile) => (
            <DropdownMenuItem key={profile} onSelect={() => void descargarPdf(profile)}>
              {ETIQUETA_PERFIL[profile]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {volver}
    </div>
  );

  const { model } = resuelto;

  return (
    <>
      <PageHeader
        title={model.metadata.title}
        description={`${model.metadata.clientName} · Diagnóstico ${model.source.diagnosticId}, versión ${model.source.diagnosticVersion}`}
        actions={acciones}
      />

      <nav
        aria-label="Documentos disponibles"
        className="flex flex-wrap gap-2 border-b border-border bg-card px-8 py-4"
      >
        {documentosDisponiblesActivos().map((opcion) => (
          <TabDocumento
            key={opcion.slug}
            id={id}
            slug={opcion.slug}
            etiqueta={opcion.etiqueta}
            activo={opcion.slug === slug}
          />
        ))}
      </nav>

      {errorDescarga && (
        <div
          role="alert"
          className="border-b border-estado-rojo/40 bg-card px-8 py-3 text-[13px] text-estado-rojo"
        >
          {errorDescarga}
        </div>
      )}

      <div className="bg-muted/30 px-8 py-10">
        <div className="mx-auto max-w-[1100px]">
          {resuelto.engine === "v2" ? (
            <DocumentWebRendererV2 model={resuelto.model} />
          ) : (
            <DocumentWebRenderer model={resuelto.model} />
          )}
        </div>
      </div>
    </>
  );
}

function TabDocumento({
  id,
  slug,
  etiqueta,
  activo,
}: {
  id: string;
  slug: DocumentoSlug;
  etiqueta: string;
  activo: boolean;
}) {
  return (
    <Link
      to="/documentos/$id/$slug"
      params={{ id, slug }}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
        activo
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {etiqueta}
    </Link>
  );
}
