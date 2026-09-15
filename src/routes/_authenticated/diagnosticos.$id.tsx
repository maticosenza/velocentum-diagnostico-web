import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstadoPunto, ETIQUETA_ESTADO } from "@/components/estado-punto";
import { supabase } from "@/integrations/supabase/client";
import { formatFecha, formatPorcentaje } from "@/lib/format";
import {
  avisoMargenMuestra,
  bloquesSemaforo,
  etiqueta,
  etiquetaCampo,
  GUION,
  numero,
  pct,
  perimetroVista,
  pesos,
  vistaPresupuesto,
  type PerimetroVista,
} from "@/lib/vista-diagnostico";
import {
  notasVisibles,
  PASARELAS,
  PLATAFORMAS,
  VERTICALES,
  type DatosDiagnostico,
  type NotasDiagnostico,
} from "@/lib/diagnostico-form";
import { lecturaPresupuesto } from "@/lib/calculo-diagnostico";
import { cn } from "@/lib/utils";
import { PropuestaSeccion } from "@/components/propuesta-seccion";
import { ConfirmacionPaquetes } from "@/components/confirmacion-paquetes";
import { mapearHallazgos, normalizarPropuesta } from "@/lib/propuesta";
import { separarContenidoGuardado } from "@/lib/contenido-propuesta";
import { generarEscaleraPaquetes, type EscaleraPaquetesConfirmada } from "@/lib/paquetes";
import {
  escaleraConfirmadaDesdeColumna,
  normalizarSobreComercialV2,
  type ConfiguracionFiscalV2,
  type MonedaV2,
  type SeleccionComercialV2,
  type SobreComercialV2,
} from "@/lib/seleccion-comercial-v2";
import { lineasSugeridasV2 } from "@/lib/catalogo-v2";
import { PanelSeleccionComercial } from "@/components/panel-seleccion-comercial";
import { confirmarSeleccionComercialV2 } from "@/lib/seleccion-comercial-v2.functions";
import { confirmarPaquetes } from "@/lib/paquetes.functions";
import { DOCUMENTOS_DISPONIBLES } from "@/documents/build-document";
import type { Derivados, EstadoBloque, EstadosBloque, Fuga } from "@/lib/calculo-diagnostico";
import {
  ETIQUETA_PESTANA,
  NOMBRE_CANAL,
  PESTANA_POR_DEFECTO,
  PESTANAS,
  pestanaDesdeBusqueda,
  queFaltaDiagnostico,
  TITULO_BLOQUE,
  type Pestana,
} from "@/lib/pestanas-diagnostico";
import { Fila, ResumenMetricas, SeccionQueFalta } from "@/components/resumen-diagnostico";

export const Route = createFileRoute("/_authenticated/diagnosticos/$id")({
  // La pestaña activa vive en la URL para sobrevivir a una recarga.
  validateSearch: (search: Record<string, unknown>): { pestana?: Pestana } => {
    const pestana = pestanaDesdeBusqueda(search["pestana"]);
    return pestana === PESTANA_POR_DEFECTO ? {} : { pestana };
  },
  head: () => ({
    meta: [
      { title: "Detalle del diagnóstico · Velocentum · Diagnóstico e-commerce" },
      {
        name: "description",
        content: "Resultado del diagnóstico de performance para la tienda del prospecto.",
      },
      { name: "robots", content: "noindex, nofollow" },
      {
        property: "og:title",
        content: "Detalle del diagnóstico · Velocentum · Diagnóstico e-commerce",
      },
      {
        property: "og:description",
        content: "Resultado del diagnóstico de performance para la tienda del prospecto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DetalleDiagnostico,
});

// ---------------------------------------------------------------- helpers de vista

const EXPLICACION_FUGA: Record<string, string> = {
  conversion:
    "Sesiones que no convierten contra el piso sano de conversión, valorizadas al margen.",
  gasto_no_rentable: "Parte de la inversión en ads que hoy trabaja por debajo del breakeven.",
  fatiga_creativa: "Porción de la inversión en Meta que se pierde por frecuencia alta.",
  sobrefragmentacion: "Conjuntos por encima de los que el presupuesto puede sostener con señal.",
};

type FilaDiagnostico = {
  id: string;
  fecha: string;
  version: number | null;
  origen_diagnostico_id: string | null;
  datos: DatosDiagnostico;
  notas: NotasDiagnostico;
  derivados: Derivados;
  estados_bloque: Partial<EstadosBloque>;
  fugas: Fuga[];
  oportunidad_total: number;
  propuesta: unknown;
  oportunidad: {
    nombre_tienda: string;
    vertical: string | null;
    plataforma: string | null;
    estado: string;
  } | null;
};

// ---------------------------------------------------------------- pantalla

function DetalleDiagnostico() {
  const { id } = Route.useParams();
  const { pestana = PESTANA_POR_DEFECTO } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const cambiarPestana = (valor: string) => {
    const destino = pestanaDesdeBusqueda(valor);
    void navigate({
      search: destino === PESTANA_POR_DEFECTO ? {} : { pestana: destino },
      replace: true,
    });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["diagnostico", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostico")
        .select(
          "id, fecha, version, origen_diagnostico_id, datos, notas, derivados, estados_bloque, fugas, oportunidad_total, propuesta, oportunidad:oportunidad_id(nombre_tienda, vertical, plataforma, estado)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as FilaDiagnostico | null;
    },
  });

  const volver = (
    <Button asChild size="sm" variant="outline">
      <Link to="/">Volver al listado</Link>
    </Button>
  );

  if (isLoading) {
    return (
      <>
        <PageHeader title="Diagnóstico" actions={volver} />
        <div className="px-8 py-10">
          <p className="text-[14px] text-muted-foreground">Cargando el diagnóstico…</p>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Diagnóstico" actions={volver} />
        <div className="px-8 py-10">
          <EmptyState
            title="No encontramos este diagnóstico"
            description="Puede que se haya borrado o que el enlace esté mal. Volvé al listado y buscalo de nuevo."
            action={volver}
          />
        </div>
      </>
    );
  }

  const d = data.derivados ?? ({} as Derivados);
  const datos = data.datos ?? ({} as DatosDiagnostico);
  const estados = data.estados_bloque ?? {};
  const fugas = Array.isArray(data.fugas) ? data.fugas : [];
  const medicionRota = estados.medicion === "rojo";
  const perimetro = perimetroVista(datos, d);

  const version = typeof data.version === "number" ? data.version : 1;
  const tienda = data.oportunidad?.nombre_tienda ?? datos.nombre_tienda ?? "Tienda sin nombre";
  const subtitulo = [
    etiqueta(VERTICALES, data.oportunidad?.vertical ?? datos.vertical),
    etiqueta(PLATAFORMAS, data.oportunidad?.plataforma ?? datos.plataforma),
    data.fecha ? formatFecha(data.fecha) : null,
    version > 1 ? `Versión ${version}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const contradiccion = d.contradiccion_margen ?? null;
  const margenBloqueado = contradiccion?.bloquea === true;
  const total = margenBloqueado ? 0 : (data.oportunidad_total ?? 0);
  const conservador = Math.round(total * 0.6);
  // `oportunidad_total` sólo suma fugas con monto finito: si alguna quedó sin
  // calcular por datos faltantes, un total en 0 no es un cero real.
  const fugasSinCalcular = fugas.filter((f) => f.calculable === false);

  const acciones = (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            Ver documentos
            <ChevronDown className="ml-1.5 size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {DOCUMENTOS_DISPONIBLES.map((documento) => (
            <DropdownMenuItem key={documento.slug} asChild>
              <Link to="/documentos/$id/$slug" params={{ id: data.id, slug: documento.slug }}>
                Ver {documento.etiqueta.toLowerCase()}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button asChild size="sm">
        <Link to="/diagnosticos/nuevo" search={{ desde: data.id }}>
          Editar y recalcular
        </Link>
      </Button>
      {volver}
    </div>
  );

  return (
    <>
      <PageHeader
        title={tienda}
        {...(subtitulo ? { description: subtitulo } : {})}
        actions={acciones}
      />

      {version > 1 && data.origen_diagnostico_id && (
        <div className="border-b border-border bg-card px-6 py-2 text-[12px] text-muted-foreground">
          Esta es la versión {version}.{" "}
          <Link
            to="/diagnosticos/$id"
            params={{ id: data.origen_diagnostico_id }}
            className="text-primary underline-offset-2 hover:underline"
          >
            Ver la versión anterior
          </Link>
        </div>
      )}

      {/* Todas las pestañas quedan montadas (forceMount) y las inactivas se
          ocultan: cambiar de pestaña no descarta una propuesta recién
          generada ni una selección comercial recién guardada. */}
      <Tabs value={pestana} onValueChange={cambiarPestana}>
        <div className="border-b border-border bg-card px-8 py-3">
          <TabsList>
            {PESTANAS.map((p) => (
              <TabsTrigger key={p} value={p}>
                {ETIQUETA_PESTANA[p]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="resumen" forceMount className={CLASE_PESTANA}>
          <AvisoContradiccion contradiccion={contradiccion} />

          <NumeroPrincipal
            medicionRota={medicionRota}
            margenBloqueado={margenBloqueado}
            fugasSinCalcular={fugasSinCalcular}
            total={total}
            conservador={conservador}
          />

          <ResumenMetricas derivados={d} perimetro={perimetro} />

          <SeccionFugasConMonto fugas={fugas} />

          <SeccionQueFalta falta={queFaltaDiagnostico(fugas, estados, perimetro)} />
        </TabsContent>

        <TabsContent value="detalle" forceMount className={CLASE_PESTANA}>
          <Semaforo estados={estados} derivados={d} datos={datos} perimetro={perimetro} />

          <SeccionNotas notas={data.notas} />

          <SeccionFugasSinMonto fugas={fugas} />

          <SeccionCanales derivados={d} perimetro={perimetro} />

          {perimetro.funnelWeb && <SeccionFunnel funnel={d.funnel} />}

          <div className="grid gap-8 lg:grid-cols-2">
            <EconomiaDetalle derivados={d} datos={datos} />
            <Presupuesto derivados={d} />
          </div>
        </TabsContent>

        {(() => {
          const { propuestaCruda, paquetesCrudo } = separarContenidoGuardado(data.propuesta);
          return (
            <>
              <TabsContent value="propuesta" forceMount className={CLASE_PESTANA}>
                <PropuestaSeccion
                  diagnosticoId={data.id}
                  propuestaGuardada={normalizarPropuesta(propuestaCruda)}
                  fugas={fugas}
                />
              </TabsContent>

              <TabsContent value="proyeccion" forceMount className={CLASE_PESTANA}>
                <SeccionProyeccion diagnosticoId={data.id} />
              </TabsContent>

              <TabsContent value="comercial" forceMount className={CLASE_PESTANA}>
                <SeccionSeleccionComercial
                  diagnosticoId={data.id}
                  datos={datos}
                  derivados={d}
                  estados={estados}
                  fugas={fugas}
                  sobreGuardado={normalizarSobreComercialV2(paquetesCrudo)}
                />

                <SeccionPaquetes
                  diagnosticoId={data.id}
                  datos={datos}
                  derivados={d}
                  estados={estados}
                  fugas={fugas}
                  paquetesGuardados={escaleraConfirmadaDesdeColumna(paquetesCrudo)}
                />
              </TabsContent>
            </>
          );
        })()}
      </Tabs>
    </>
  );
}

const CLASE_PESTANA = "mt-0 space-y-10 px-8 py-10 data-[state=inactive]:hidden";

/**
 * La pantalla no tiene proyección propia: la línea de base y los escenarios a
 * 90 días se arman sólo como documento. La pestaña lo dice en vez de quedar
 * en blanco, y lleva al documento.
 */
function SeccionProyeccion({ diagnosticoId }: { diagnosticoId: string }) {
  const documento = DOCUMENTOS_DISPONIBLES.find((doc) => doc.tipoDocumento === "proyeccion_90d");
  return (
    <EmptyState
      title="Esta pantalla todavía no muestra proyección"
      description={
        documento
          ? `La proyección a 90 días se arma como documento: ${documento.descripcion.charAt(0).toLowerCase()}${documento.descripcion.slice(1)}`
          : "La proyección a 90 días todavía no está disponible."
      }
      {...(documento
        ? {
            action: (
              <Button asChild size="sm" variant="outline">
                <Link
                  to="/documentos/$id/$slug"
                  params={{ id: diagnosticoId, slug: documento.slug }}
                >
                  Ver {documento.etiqueta.toLowerCase()}
                </Link>
              </Button>
            ),
          }
        : {})}
    />
  );
}

/**
 * BV4 F2a etapa 4 — selección comercial v2: las diez líneas facturables,
 * moneda, configuración fiscal y los dos grupos de totales en vivo. Persiste
 * en la misma columna JSON, dentro de la clave `paquetes`, junto a la
 * escalera legada que la sección de abajo sigue alimentando.
 */
function SeccionSeleccionComercial({
  diagnosticoId,
  datos,
  derivados,
  estados,
  fugas,
  sobreGuardado,
}: {
  diagnosticoId: string;
  datos: DatosDiagnostico;
  derivados: Derivados;
  estados: Partial<EstadosBloque>;
  fugas: Fuga[];
  sobreGuardado: SobreComercialV2 | null;
}) {
  const [guardado, setGuardado] = useState<SobreComercialV2 | null>(sobreGuardado);
  const confirmar = useServerFn(confirmarSeleccionComercialV2);
  const mutacion = useMutation({
    mutationFn: async (sobre: {
      moneda: MonedaV2;
      fiscal: ConfiguracionFiscalV2;
      seleccion: SeleccionComercialV2;
    }) =>
      confirmar({
        data: { diagnosticoId, sobre: { version: 2, ...sobre, legado: null } },
      }),
    onSuccess: (r) => setGuardado(r.sobre),
  });

  const sugeridas = lineasSugeridasV2(mapearHallazgos(datos, derivados, estados, fugas));

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Selección comercial</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Las diez líneas facturables, siempre visibles. Las sugeridas por el diagnóstico llegan
          marcadas; el precio se carga a mano y los totales se calculan solos, separados en
          inversión mensual e inversión inicial.
        </p>
      </header>

      <div className="px-7 py-7">
        {mutacion.isError && (
          <p className="mb-4 text-[13px] text-destructive">{(mutacion.error as Error).message}</p>
        )}
        {guardado && !mutacion.isPending && (
          <p className="mb-4 text-[13px] text-muted-foreground" role="status">
            Selección guardada en {guardado.moneda}
            {guardado.fiscal.confirmado
              ? ", con configuración fiscal confirmada."
              : ". Falta confirmar la configuración fiscal para poder exportar."}
          </p>
        )}
        <PanelSeleccionComercial
          key={guardado ? "guardada" : "inicial"}
          sugeridas={sugeridas}
          sobreGuardado={guardado}
          guardando={mutacion.isPending}
          onConfirmar={(sobre) => mutacion.mutate(sobre)}
        />
      </div>
    </section>
  );
}

/**
 * Fase 13 (paquetes y precios, decisión comercial 7, 2026-08-22): genera
 * la escalera a partir de los hallazgos ya mapeados y pide confirmación
 * manual explícita antes de dar por generada la propuesta comercial. La
 * confirmación se persiste en la misma columna JSON que ya guardaba la
 * propuesta redactada por el modelo (decisión 9, cerrada 2026-08-22: no
 * hizo falta ninguna migración — ver `src/lib/contenido-propuesta.ts`).
 */
function SeccionPaquetes({
  diagnosticoId,
  datos,
  derivados,
  estados,
  fugas,
  paquetesGuardados,
}: {
  diagnosticoId: string;
  datos: DatosDiagnostico;
  derivados: Derivados;
  estados: Partial<EstadosBloque>;
  fugas: Fuga[];
  paquetesGuardados: EscaleraPaquetesConfirmada | null;
}) {
  const [confirmada, setConfirmada] = useState<EscaleraPaquetesConfirmada | null>(
    paquetesGuardados,
  );
  const [editando, setEditando] = useState(!paquetesGuardados);
  const confirmar = useServerFn(confirmarPaquetes);
  const mutacion = useMutation({
    mutationFn: async (escalera: EscaleraPaquetesConfirmada) =>
      confirmar({ data: { diagnosticoId, escalera } }),
    onSuccess: (r) => {
      setConfirmada(r.paquetes);
      setEditando(false);
    },
  });

  const hallazgos = mapearHallazgos(datos, derivados, estados, fugas);
  const escaleraGenerada = generarEscaleraPaquetes(hallazgos);
  const escaleraParaEditar: typeof escaleraGenerada =
    editando && confirmada ? { niveles: confirmada.niveles, confirmado: false } : escaleraGenerada;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">
          Paquetes propuestos (escalera v1)
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Escalera de hasta tres niveles, cada servicio ligado a un hallazgo concreto. Los precios
          quedan vacíos hasta que los cargues acá. Alimenta los documentos del motor v1 y se
          conserva como ancla de reversión: es independiente de la selección comercial de arriba y
          ninguna de las dos pisa a la otra.
        </p>
      </header>

      <div className="px-7 py-7">
        {mutacion.isError && (
          <p className="mb-4 text-[13px] text-destructive">{(mutacion.error as Error).message}</p>
        )}
        {!editando && confirmada ? (
          <div className="space-y-3">
            <p className="text-[14px] text-foreground">
              Propuesta confirmada con {confirmada.niveles.length} nivel
              {confirmada.niveles.length === 1 ? "" : "es"}.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditando(true)}>
              Editar de nuevo
            </Button>
          </div>
        ) : (
          <ConfirmacionPaquetes
            key={editando && confirmada ? "editar-confirmada" : "generada"}
            escalera={escaleraParaEditar}
            onConfirmar={(e) => mutacion.mutate(e)}
          />
        )}
      </div>
    </section>
  );
}

function SeccionNotas({ notas }: { notas: NotasDiagnostico | null | undefined }) {
  const visibles = notasVisibles(notas);
  if (visibles.length === 0) return null;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Notas de la llamada</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Contexto declarado por el cliente. Estas notas no modifican los cálculos.
        </p>
      </header>
      <div className="grid gap-4 p-7 md:grid-cols-2">
        {visibles.map((nota) => (
          <article key={nota.bloque} className="rounded-md border border-border px-4 py-3">
            <h3 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {nota.etiqueta}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-foreground">
              {nota.texto}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- 2 · el número

/** Alerta de contradicción entre el margen calculado y el que declara el cliente. */
function AvisoContradiccion({
  contradiccion,
}: {
  contradiccion: Derivados["contradiccion_margen"];
}) {
  if (!contradiccion || contradiccion.nivel === "sin_alerta") return null;
  const critica = contradiccion.nivel === "critica";
  const rango =
    contradiccion.declarado_min === contradiccion.declarado_max
      ? pct(contradiccion.declarado_min)
      : `${pct(contradiccion.declarado_min)} a ${pct(contradiccion.declarado_max)}`;

  return (
    <section
      className={cn(
        "rounded-lg border bg-card px-7 py-5",
        critica ? "border-estado-rojo/40" : "border-estado-amarillo/50",
      )}
    >
      <div className="flex items-start gap-3">
        <EstadoPunto estado={critica ? "rojo" : "amarillo"} className="mt-1.5 size-3" />
        <div>
          <h2 className="text-[15px] font-medium text-foreground">
            {critica
              ? "Contradicción crítica con el margen declarado"
              : "El margen declarado necesita validación"}
          </h2>
          <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">
            El margen calculado es {pct(contradiccion.calculado)} y el cliente declara {rango}.
            {contradiccion.cambio_de_signo
              ? " El signo no coincide: uno de los dos números está mal."
              : ` La diferencia contra el límite más cercano es de ${pct(contradiccion.diferencia)}.`}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {contradiccion.bloquea
              ? "El dato está confirmado por el cliente: no se muestra la oportunidad estimada ni se valorizan las fugas que usan margen hasta resolver la diferencia. El resto del diagnóstico sigue siendo válido."
              : "El dato no está confirmado por el cliente: se registra como alerta informativa y no bloquea el cálculo."}
          </p>
          {contradiccion.origen_margen === "muestra" && (
            <p className="mt-2 text-[13px] text-muted-foreground">
              Esta comparación se hizo contra el margen de la muestra (
              {numero(contradiccion.cobertura_productos, 0)}% del catálogo analizado), no contra un
              margen total: el catálogo relevado todavía no cubre el 100% de la facturación
              declarada como participación de producto.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function NumeroPrincipal({
  medicionRota,
  margenBloqueado,
  fugasSinCalcular,
  total,
  conservador,
}: {
  medicionRota: boolean;
  margenBloqueado: boolean;
  fugasSinCalcular: Fuga[];
  total: number;
  conservador: number;
}) {
  if (margenBloqueado) {
    return (
      <section className="rounded-lg border border-estado-rojo/40 bg-card px-10 py-14">
        <h2 className="text-[30px] font-medium leading-9 text-foreground">
          No valorizamos la oportunidad con este margen
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted-foreground">
          El margen que confirmó el cliente contradice al que sale de los números cargados.
          Cualquier monto sería una cuenta sobre un margen que no sabemos cuál es. El resto del
          diagnóstico (medición, estructura de cuenta, funnel, canales y contenido) sigue en pie.
        </p>
      </section>
    );
  }

  if (medicionRota) {
    return (
      <section className="rounded-lg border border-estado-rojo/40 bg-card px-10 py-14">
        <div className="flex items-start gap-3">
          <EstadoPunto estado="rojo" className="mt-3 size-3.5" />
          <div>
            <h2 className="text-[30px] font-medium leading-9 text-foreground">
              No podemos valorizar la oportunidad todavía
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted-foreground">
              El desvío entre lo que mide la cuenta de anuncios y lo que factura realmente la tienda
              es demasiado grande. Con esa diferencia, cualquier monto que pongamos acá sería falso.
              Arreglar la medición es el primer problema a resolver: sin eso, no hay diagnóstico
              económico confiable.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Un total en 0 con fugas sin calcular no es "la oportunidad es cero", es
  // "todavía no sabemos cuánto es". Mismo criterio de estado que la cadena v2
  // (`evidencia_faltante` en src/documents/semantica-v2/estado.ts): no se
  // publica número, se nombra el dato que falta. Si el 0 sale de fugas todas
  // calculables, es un cero real y se muestra como tal.
  if (total === 0 && fugasSinCalcular.length > 0) {
    const faltantes = [...new Set(fugasSinCalcular.flatMap((f) => f.faltantes))].map(etiquetaCampo);
    const lista =
      faltantes.length > 1
        ? `${faltantes.slice(0, -1).join(", ")} y ${faltantes[faltantes.length - 1]}`
        : faltantes[0];

    return (
      <section className="rounded-lg border border-border bg-card px-10 py-14">
        <div className="flex items-start gap-3">
          <EstadoPunto estado="sin_datos" className="mt-3 size-3.5" />
          <div>
            <h2 className="text-[30px] font-medium leading-9 text-foreground">
              Faltan datos para valorizar la oportunidad
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted-foreground">
              {lista
                ? `Falta ${lista} para realizar este cálculo.`
                : "Faltan datos para realizar este cálculo."}{" "}
              Sin eso, las fugas detectadas no se pueden valorizar: el rango está pendiente, no en
              cero. El resto del diagnóstico sigue en pie.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card px-10 py-14">
      <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Oportunidad mensual estimada
      </p>
      <p className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-foreground">
        <span className="text-[56px] font-medium leading-[1.05] tabular-nums sm:text-[72px]">
          {pesos(conservador)}
        </span>
        <span className="text-[26px] leading-[1.1] text-muted-foreground">a</span>
        <span className="text-[56px] font-medium leading-[1.05] tabular-nums sm:text-[72px]">
          {pesos(total)}
        </span>
      </p>
      <p className="mt-6 text-[14px] text-muted-foreground">
        Estimación mensual sobre los datos cargados en esta llamada.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------- 3 · semáforo

/** Columnas en pantalla ancha según cuántas píldoras aplican al perímetro. */
const COLUMNAS_SEMAFORO: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
};

function Semaforo({
  estados,
  derivados,
  datos,
  perimetro,
}: {
  estados: Partial<EstadosBloque>;
  derivados: Derivados;
  datos: DatosDiagnostico;
  perimetro: PerimetroVista;
}) {
  const aplican = bloquesSemaforo(perimetro);
  const esNumero = (n: unknown) => typeof n === "number" && Number.isFinite(n);
  // `parcial`: el número que explica el estado vive sólo en la píldora (no se
  // repite en Economía ni en Presupuesto), así que sin estado igual se muestra
  // lo que se sepa en vez de "Sin datos".
  const todas: { id: keyof EstadosBloque; titulo: string; dato: string; parcial?: boolean }[] = [
    {
      id: "medicion",
      titulo: TITULO_BLOQUE.medicion,
      dato: `Desvío Pixel vs. facturación real: ${pct(derivados.delta_medicion)}`,
    },
    {
      id: "economia",
      titulo: TITULO_BLOQUE.economia,
      dato: `MER ${numero(derivados.mer_actual)} contra breakeven ${numero(derivados.breakeven_roas)}`,
      parcial: esNumero(derivados.mer_actual) || esNumero(derivados.breakeven_roas),
    },
    {
      id: "cuenta",
      titulo: TITULO_BLOQUE.cuenta,
      dato: `${numero(datos.conjuntos_activos, 0)} conjuntos activos · sostenibles ${numero(
        derivados.conjuntos_sostenibles,
        1,
      )}`,
      parcial: esNumero(datos.conjuntos_activos) || esNumero(derivados.conjuntos_sostenibles),
    },
    {
      id: "funnel_web",
      titulo: TITULO_BLOQUE.funnel_web,
      dato: `Conversión de la tienda: ${
        typeof derivados.cr_tienda === "number"
          ? formatPorcentaje(derivados.cr_tienda * 100, 2)
          : GUION
      }`,
    },
    {
      id: "creativos",
      titulo: TITULO_BLOQUE.creativos,
      dato: datos.frecuencia_creativos?.trim()
        ? `Creativos nuevos: ${datos.frecuencia_creativos}`
        : "Sin datos de contenido",
    },
  ];
  // Lo que no aplica al perímetro no se muestra, ni como "Sin datos".
  const tarjetas = todas.filter((t) => aplican.includes(t.id));

  return (
    <section className={cn("grid gap-5 sm:grid-cols-2", COLUMNAS_SEMAFORO[tarjetas.length])}>
      {tarjetas.map((t) => {
        const estado: EstadoBloque = estados[t.id] ?? "sin_datos";
        const sinDatos = estado === "sin_datos";
        const vacio = sinDatos && !t.parcial;
        const texto = vacio ? "Sin datos" : t.dato;
        return (
          <article
            key={t.id}
            className="rounded-lg border border-border bg-card px-6 py-6"
            aria-label={`${t.titulo}: ${ETIQUETA_ESTADO[estado]}`}
          >
            <div className="flex items-center gap-2">
              <EstadoPunto estado={estado} />
              <h3 className="text-[16px] font-medium text-foreground">{t.titulo}</h3>
            </div>
            <p
              className={
                vacio
                  ? "mt-3 text-[14px] leading-5 text-muted-foreground"
                  : "mt-3 text-[14px] leading-5 text-foreground"
              }
            >
              {texto}
            </p>
          </article>
        );
      })}
    </section>
  );
}

// ---------------------------------------------------------------- 4 · fugas

/** Marca visible para estimaciones sin desglose por falta de etapas intermedias. */
function MarcaParcial() {
  return (
    <p className="mt-3 inline-block rounded-full border border-violet/40 px-3 py-1 text-[12.5px] text-violet">
      Estimación parcial: faltan etapas intermedias del funnel
    </p>
  );
}

function fugasConMonto(fugas: Fuga[]): Fuga[] {
  return fugas
    .filter((f) => f.tipo === "monto" && typeof f.monto === "number")
    .sort((a, b) => (b.monto ?? 0) - (a.monto ?? 0));
}

/** Resumen: las fugas valorizadas, de mayor a menor. */
function SeccionFugasConMonto({ fugas }: { fugas: Fuga[] }) {
  const [expandido, setExpandido] = useState(false);

  const conMonto = fugasConMonto(fugas);
  const hayOtras = fugas.some((f) => f.tipo === "riesgo" || f.calculable === false);

  const visibles = expandido ? conMonto : conMonto.slice(0, 3);
  const ocultas = conMonto.length - visibles.length;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Fugas detectadas</h2>
      </header>

      {conMonto.length === 0 && (
        <p className="px-7 py-8 text-[14px] text-muted-foreground">
          {hayOtras
            ? "Ninguna fuga tiene monto con los datos cargados. Los riesgos y las fugas que no se pudieron calcular están en Detalle."
            : "No se detectaron fugas con los datos cargados."}
        </p>
      )}

      <ul className="divide-y divide-border">
        {visibles.map((f) => (
          <li key={f.id} className="flex flex-wrap items-baseline gap-x-8 gap-y-2 px-7 py-7">
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-medium text-foreground">{f.etiqueta}</p>
              <p className="mt-1.5 text-[14px] leading-5 text-muted-foreground">
                {f.detalle ?? EXPLICACION_FUGA[f.id] ?? ""}
              </p>
              {f.confianza === "parcial" && <MarcaParcial />}
            </div>
            <p className="text-[24px] font-medium tabular-nums text-foreground">{pesos(f.monto)}</p>
          </li>
        ))}
      </ul>

      {conMonto.length > 3 && (
        <div className="border-t border-border px-7 py-5">
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="text-[14px] font-medium text-violet underline-offset-4 hover:underline"
          >
            {expandido ? "Mostrar solo las tres principales" : `Ver las otras ${ocultas} fugas`}
          </button>
        </div>
      )}
    </section>
  );
}

/** Detalle: lo que no se valoriza en pesos (riesgos) y lo que no se pudo calcular. */
function SeccionFugasSinMonto({ fugas }: { fugas: Fuga[] }) {
  const riesgos = fugas.filter((f) => f.tipo === "riesgo");
  const noCalculables = fugas.filter((f) => f.calculable === false);
  if (riesgos.length === 0 && noCalculables.length === 0) return null;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Riesgos y fugas sin calcular</h2>
      </header>

      <ul className="divide-y divide-border">
        {riesgos.map((f) => (
          <li key={f.id} className="flex items-start gap-3 px-7 py-7">
            <EstadoPunto estado="rojo" className="mt-1.5" />
            <div>
              <p className="text-[17px] font-medium text-foreground">{f.etiqueta}</p>
              <p className="mt-1.5 text-[14px] leading-5 text-muted-foreground">
                {f.detalle ?? "Hallazgo de riesgo: no se valoriza en pesos."}
              </p>
            </div>
          </li>
        ))}

        {noCalculables.map((f) => (
          <li key={`nc-${f.id}`} className="px-7 py-6 text-muted-foreground">
            <p className="text-[15px]">{f.etiqueta}</p>
            <p className="mt-0.5 text-[13px] leading-5">
              No se pudo calcular. Faltan: {f.faltantes.map(etiquetaCampo).join(", ")}.
            </p>
            {f.confianza === "parcial" && <MarcaParcial />}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- 5 · economía

/**
 * Lo del negocio completo que no está en Resumen. Margen total y breakeven
 * viven en Resumen; MER combinado en la píldora de economía; el MER y el ROAS
 * de cada canal, en la tarjeta del canal de Resumen.
 */
function EconomiaDetalle({ derivados, datos }: { derivados: Derivados; datos: DatosDiagnostico }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Economía de la tienda</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Ticket {pesos(datos.ticket_promedio)} ·{" "}
          {etiqueta(PASARELAS, datos.pasarela) ?? "Pasarela sin definir"}
        </p>
      </header>
      <dl>
        <Fila
          label="Margen de la muestra (productos y canal analizados)"
          value={pct(derivados.margen_muestra)}
        />
        <Fila
          label="Cobertura del catálogo analizado"
          value={
            typeof derivados.cobertura_productos === "number"
              ? `${numero(derivados.cobertura_productos, 0)}%`
              : GUION
          }
        />
        <Fila label="CPA breakeven" value={pesos(derivados.cpa_breakeven)} />
        <Fila label="Reserva aplicada" value={pct(derivados.reserva, 0)} />
        <Fila label="CPA objetivo" value={pesos(derivados.cpa_objetivo)} />
        <Fila label="ROAS objetivo" value={numero(derivados.roas_objetivo)} />
        <Fila
          label="Inversión publicitaria total"
          value={
            derivados.hay_inversion_publicitaria === null
              ? "Sin datos"
              : pesos(derivados.inversion_publicitaria_total)
          }
        />
        <Fila label="Pedidos mensuales estimados" value={numero(derivados.pedidos_mensuales, 0)} />
      </dl>
      {derivados.cobertura_productos < 100 &&
        (derivados.pesos_producto ?? []).filter((p) => p !== null).length > 1 && (
          <p className="border-t border-border px-7 py-6 text-[13px] leading-6 text-muted-foreground">
            El catálogo relevado cubre el {numero(derivados.cobertura_productos, 0)}% de la
            facturación declarada como participación de producto: el margen de arriba pondera sólo
            esa muestra, sin reescalarla al 100% del catálogo.
          </p>
        )}
    </section>
  );
}

// ---------------------------------------------------------------- 6 · presupuesto

/**
 * Conjuntos activos y sostenibles viven en la píldora de cuenta; las compras
 * semanales, en la nota de referencia (son los pedidos mensuales de Economía
 * ÷ 4,3, así que no llevan fila propia).
 */
function Presupuesto({ derivados }: { derivados: Derivados }) {
  const lectura = lecturaPresupuesto(derivados);
  // H-56: un diagnóstico guardado antes de la fase 6 (2026-08-21) no trae
  // `presupuesto_arranque` en `derivados`, aunque el tipo lo declare.
  const pa: Partial<Derivados["presupuesto_arranque"]> = derivados.presupuesto_arranque ?? {};
  const supuestos = pa.supuestos ?? [];
  // Sin volumen para un conjunto optimizado por compra, manda el arranque por
  // evento intermedio y el piso por compra baja a referencia.
  const { sinVolumen, notaReferencia } = vistaPresupuesto(derivados);
  const arranque = pa.arranque_evento_intermedio
    ? `${pesos(pa.arranque_evento_intermedio.bajo)} – ${pesos(pa.arranque_evento_intermedio.alto)}`
    : "Sin datos";
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Presupuesto recomendado</h2>
      </header>
      <dl>
        {sinVolumen ? (
          <Fila
            label="Presupuesto de arranque recomendado (optimizando por evento intermedio)"
            value={arranque}
          />
        ) : (
          <>
            <Fila
              label="Piso teórico mensual (optimizando por compra, un conjunto)"
              value={pesos(pa.piso_teorico_compra)}
            />
            <Fila
              label="Presupuesto de arranque (optimizando por evento intermedio)"
              value={arranque}
            />
          </>
        )}
        <Fila label="Inversión actual mensual" value={pesos(derivados.inversion_actual_mensual)} />
      </dl>
      {sinVolumen && (
        <div className="border-t border-border">
          <p className="px-7 pt-6 text-[13px] font-medium text-foreground">
            Referencia: optimizando por compra
          </p>
          <dl>
            <Fila
              label="Piso teórico mensual (un conjunto, sólo referencia)"
              value={pesos(pa.piso_teorico_compra)}
            />
          </dl>
          <p className="px-7 pb-6 text-[13px] leading-5 text-muted-foreground">{notaReferencia}</p>
        </div>
      )}
      {supuestos.length > 0 && (
        <div className="border-t border-border px-7 py-6">
          <p className="text-[13px] font-medium text-foreground">
            Supuestos usados (confianza: {pa.confianza ?? GUION})
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-5 text-muted-foreground">
            {supuestos.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="border-t border-border px-7 py-6 text-[15px] leading-6 text-foreground">
        {lectura ?? "Faltan datos de presupuesto para dar una lectura."}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------- funnel web

/**
 * Cascada del funnel: tres tramos que no se solapan. Reemplaza a la vieja
 * lectura de conversión más carritos abandonados, que contaba dos veces a la
 * misma gente.
 */
function SeccionFunnel({ funnel }: { funnel: Derivados["funnel"] }) {
  if (!funnel || funnel.estado === "no_aplica") return null;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Funnel web de la tienda</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Visitas, agregados al carrito, checkouts iniciados y compras del mismo período y del mismo
          canal.
        </p>
      </header>

      {funnel.estado === "error" ? (
        <p className="px-7 py-6 text-[15px] leading-6 text-destructive">{funnel.error}</p>
      ) : (
        <>
          <dl>
            <Fila label="Visitas" value={numero(funnel.visitas, 0)} />
            <Fila label="Agregados al carrito" value={numero(funnel.agregados_carrito, 0)} />
            <Fila label="Checkouts iniciados" value={numero(funnel.checkouts_iniciados, 0)} />
            <Fila label="Compras estimadas" value={numero(funnel.compras, 0)} />
            <Fila label="Visita a carrito" value={pct(funnel.p_carrito_dado_visita, 2)} />
            <Fila label="Carrito a checkout" value={pct(funnel.p_checkout_dado_carrito, 2)} />
            <Fila label="Checkout a compra" value={pct(funnel.p_compra_dado_checkout, 2)} />
            {/* La conversión global es la de la tienda: vive en la píldora y en Resumen. */}
          </dl>
          {!funnel.desglosado && funnel.estado === "combinado" && (
            <p className="border-t border-border px-7 py-6 text-[14px] leading-6 text-muted-foreground">
              Faltan etapas intermedias del embudo, así que la oportunidad se muestra combinada, sin
              repartir entre navegación, carrito y checkout.
            </p>
          )}
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- canales

/**
 * Origen y evidencia de la comisión en una sola fila. Un benchmark nunca se
 * muestra como comisión verificada: sólo una liquidación real (del cliente o
 * cargada en configuración) cuenta como evidencia.
 */
function origenLegible(origen: string | null, evidencia?: string) {
  if (origen === null) return "Sin comisión resuelta";
  if (evidencia === "liquidacion_cliente" || origen === "verificado_cliente")
    return "Verificada con la liquidación del cliente";
  if (evidencia === "liquidacion_verificada") return "Liquidación real cargada en configuración";
  if (evidencia === "declarado_cliente")
    return "Benchmark de configuración, con cargo fijo declarado por el cliente";
  return "Benchmark de configuración";
}

/**
 * Mix de canales: cada canal con su comisión, su margen y su breakeven. El MER
 * y el ROAS de Product Ads del canal viven en su tarjeta de Resumen.
 */
function SeccionCanales({
  derivados,
  perimetro,
}: {
  derivados: Derivados;
  perimetro: PerimetroVista;
}) {
  // Un canal en "no aplica" no se pinta: el cliente no vende ahí.
  const canales = (derivados.canales ?? []).filter(
    (c) =>
      c.estado !== "no_aplica" &&
      (c.id !== "tienda_propia" || perimetro.tiendaPropia) &&
      (c.id !== "mercado_libre" || perimetro.mercadoLibre),
  );
  if (canales.length === 0) return null;
  const cobertura = derivados.cobertura_canales ?? 0;
  const principal = derivados.canal_principal;

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-8 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Canales de venta</h2>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-8 gap-y-1 text-[13px] text-muted-foreground">
          <span>
            Cobertura declarada{" "}
            <span className="text-[15px] font-medium tabular-nums text-foreground">
              {String(cobertura).replace(".", ",")}%
            </span>
          </span>
          <span>
            Canal principal{" "}
            <span className="text-[15px] font-medium text-foreground">
              {principal ? NOMBRE_CANAL[principal] : "sin definir"}
            </span>
          </span>
        </div>
        {avisoMargenMuestra(derivados) && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            El mix declarado no llega al 100%: el margen que se muestra es el de la muestra
            declarada, no el del negocio completo.
          </p>
        )}
      </div>

      <div className="grid gap-6 p-8 sm:grid-cols-2">
        {canales.map((c) => {
          const inactivo = c.estado !== "declarado";
          return (
            <div
              key={c.id}
              className={cn(
                "rounded-lg border border-border p-6",
                inactivo && "bg-muted/40 text-muted-foreground",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3
                  className={cn(
                    "text-[15px] font-medium",
                    inactivo ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {NOMBRE_CANAL[c.id] ?? c.id}
                </h3>
                <span className="text-[14px] tabular-nums">
                  {c.estado === "declarado"
                    ? pct(typeof c.pct === "number" ? c.pct / 100 : null, 1)
                    : "Sin datos"}
                </span>
              </div>

              {c.estado === "declarado" && (
                <dl className="mt-4 space-y-2.5">
                  <Fila label="Margen del canal" value={pct(c.margen)} />
                  <Fila label="Comisión efectiva" value={pct(c.comision_efectiva, 2)} />
                  <Fila
                    label="Origen de la comisión"
                    value={origenLegible(c.comision_origen, c.comision_evidencia)}
                  />
                  {c.comision_vigencia && (
                    <Fila label="Vigencia de la regla" value={c.comision_vigencia} />
                  )}
                  <Fila
                    label="Contribución antes de publicidad"
                    value={pesos(c.contribucion_antes_publicidad)}
                  />
                  <Fila
                    label="Inversión publicitaria del canal"
                    value={pesos(c.inversion_publicitaria)}
                  />
                  <Fila
                    label="Resultado después de publicidad"
                    value={pesos(c.resultado_despues_publicidad)}
                  />
                  <Fila label="Breakeven del canal" value={numero(c.breakeven_roas)} />
                  {c.comision_provisional && (
                    <p className="rounded-md bg-violet-soft px-3 py-2 text-[12.5px] text-violet">
                      Comisión provisional: es un benchmark pendiente de verificar contra la
                      liquidación real.
                    </p>
                  )}
                  {c.cargo_fijo_disponible && !c.cargo_fijo_disponible.verificado && (
                    <p className="text-[12.5px] text-muted-foreground">
                      Hay un cargo fijo conocido de {pesos(c.cargo_fijo_disponible.valor)} sin
                      verificar: no está incluido en la comisión efectiva.
                    </p>
                  )}
                </dl>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
