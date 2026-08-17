import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { EstadoPunto, ETIQUETA_ESTADO } from "@/components/estado-punto";
import { supabase } from "@/integrations/supabase/client";
import { formatARS, formatFecha, formatNumero, formatPorcentaje } from "@/lib/format";
import { PASARELAS, PLATAFORMAS, VERTICALES, type DatosDiagnostico } from "@/lib/diagnostico-form";
import { lecturaPresupuesto } from "@/lib/calculo-diagnostico";
import type {
  Derivados,
  EstadoBloque,
  EstadosBloque,
  Fuga,
} from "@/lib/calculo-diagnostico";


export const Route = createFileRoute("/_authenticated/diagnosticos/$id")({
  head: () => ({
    meta: [
      { title: "Detalle del diagnóstico · Velocentum Cockpit" },
      {
        name: "description",
        content: "Resultado del diagnóstico de performance para la tienda del prospecto.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Detalle del diagnóstico · Velocentum Cockpit" },
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

const GUION = "—";

function etiqueta(lista: readonly { value: string; label: string }[], value?: string | null) {
  if (!value) return null;
  return lista.find((o) => o.value === value)?.label ?? value;
}

function pesos(n: number | null | undefined) {
  return typeof n === "number" && Number.isFinite(n) ? formatARS(n) : GUION;
}

function numero(n: number | null | undefined, decimales = 2) {
  return typeof n === "number" && Number.isFinite(n) ? formatNumero(n, decimales) : GUION;
}

function pct(n: number | null | undefined, decimales = 1) {
  return typeof n === "number" && Number.isFinite(n) ? formatPorcentaje(n * 100, decimales) : GUION;
}

const ETIQUETAS_CAMPO: Record<string, string> = {
  visitas_mensuales: "visitas mensuales",
  cr_tienda: "tasa de conversión",
  ticket_promedio: "ticket promedio",
  margen_contribucion: "margen de contribución",
  inversion_meta: "inversión en Meta",
  inversion_google: "inversión en Google",
  facturacion_mensual: "facturación mensual",
  conjuntos_activos: "conjuntos activos",
  presupuesto_diario: "presupuesto diario",
  cpa_objetivo: "CPA objetivo",
  factor_fatiga: "parámetro de fatiga",
  "umbrales_funnel_web.cr_tienda": "umbral de conversión",
};

const EXPLICACION_FUGA: Record<string, string> = {
  conversion: "Sesiones que no convierten contra el piso sano de conversión, valorizadas al margen.",
  gasto_no_rentable: "Parte de la inversión en ads que hoy trabaja por debajo del breakeven.",
  fatiga_creativa: "Porción de la inversión en Meta que se pierde por frecuencia alta.",
  sobrefragmentacion: "Conjuntos por encima de los que el presupuesto puede sostener con señal.",
};

type FilaDiagnostico = {
  id: string;
  fecha: string;
  datos: DatosDiagnostico;
  derivados: Derivados;
  estados_bloque: Partial<EstadosBloque>;
  fugas: Fuga[];
  oportunidad_total: number;
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

  const { data, isLoading, error } = useQuery({
    queryKey: ["diagnostico", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostico")
        .select(
          "id, fecha, datos, derivados, estados_bloque, fugas, oportunidad_total, oportunidad:oportunidad_id(nombre_tienda, vertical, plataforma, estado)",
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
        <div className="px-6 py-6">
          <p className="text-[13px] text-muted-foreground">Cargando el diagnóstico…</p>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Diagnóstico" actions={volver} />
        <div className="px-6 py-6">
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

  const tienda = data.oportunidad?.nombre_tienda ?? datos.nombre_tienda ?? "Tienda sin nombre";
  const subtitulo = [
    etiqueta(VERTICALES, data.oportunidad?.vertical ?? datos.vertical),
    etiqueta(PLATAFORMAS, data.oportunidad?.plataforma ?? datos.plataforma),
    data.fecha ? formatFecha(data.fecha) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const total = data.oportunidad_total ?? 0;
  const conservador = Math.round(total * 0.6);

  return (
    <>
      <PageHeader title={tienda} {...(subtitulo ? { description: subtitulo } : {})} actions={volver} />

      <div className="space-y-6 px-6 py-6">
        <NumeroPrincipal medicionRota={medicionRota} total={total} conservador={conservador} />

        <Semaforo estados={estados} derivados={d} datos={datos} />

        <SeccionFugas fugas={fugas} />

        <div className="grid gap-6 lg:grid-cols-2">
          <EconomiaDetalle derivados={d} datos={datos} />
          <Presupuesto derivados={d} datos={datos} />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 2 · el número

function NumeroPrincipal({
  medicionRota,
  total,
  conservador,
}: {
  medicionRota: boolean;
  total: number;
  conservador: number;
}) {
  if (medicionRota) {
    return (
      <section className="rounded-lg border border-estado-rojo/40 bg-card px-8 py-10">
        <div className="flex items-start gap-3">
          <EstadoPunto estado="rojo" className="mt-2 size-3" />
          <div>
            <h2 className="text-[24px] font-medium leading-8 text-foreground">
              No podemos valorizar la oportunidad todavía
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-muted-foreground">
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

  return (
    <section className="rounded-lg border border-border bg-card px-8 py-10">
      <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        Oportunidad mensual estimada
      </p>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-foreground">
        <span className="text-[44px] font-medium leading-[1.1] tabular-nums sm:text-[56px]">
          {pesos(conservador)}
        </span>
        <span className="text-[22px] leading-[1.1] text-muted-foreground">a</span>
        <span className="text-[44px] font-medium leading-[1.1] tabular-nums sm:text-[56px]">
          {pesos(total)}
        </span>
      </p>
      <p className="mt-4 text-[13px] text-muted-foreground">
        Estimación mensual sobre los datos cargados en esta llamada.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------- 3 · semáforo

function Semaforo({
  estados,
  derivados,
  datos,
}: {
  estados: Partial<EstadosBloque>;
  derivados: Derivados;
  datos: DatosDiagnostico;
}) {
  const tarjetas: { id: keyof EstadosBloque; titulo: string; dato: string }[] = [
    {
      id: "medicion",
      titulo: "Medición",
      dato: `Desvío Pixel vs. facturación real: ${pct(derivados.delta_medicion)}`,
    },
    {
      id: "economia",
      titulo: "Economía",
      dato: `MER ${numero(derivados.mer_actual)} contra breakeven ${numero(derivados.breakeven_roas)}`,
    },
    {
      id: "cuenta",
      titulo: "Cuenta",
      dato: `${numero(datos.conjuntos_activos, 0)} conjuntos activos · sostenibles ${numero(
        derivados.conjuntos_sostenibles,
        1,
      )}`,
    },
    {
      id: "funnel_web",
      titulo: "Funnel web",
      dato: `Conversión de la tienda: ${
        typeof derivados.cr_tienda === "number"
          ? formatPorcentaje(derivados.cr_tienda * 100, 2)
          : GUION
      }`,
    },
    {
      id: "creativos",
      titulo: "Contenido",
      dato: datos.frecuencia_creativos?.trim()
        ? `Creativos nuevos: ${datos.frecuencia_creativos}`
        : "Sin datos de contenido",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {tarjetas.map((t) => {
        const estado: EstadoBloque = estados[t.id] ?? "sin_datos";
        const sinDatos = estado === "sin_datos";
        return (
          <article
            key={t.id}
            className="rounded-lg border border-border bg-card px-4 py-4"
            aria-label={`${t.titulo}: ${ETIQUETA_ESTADO[estado]}`}
          >
            <div className="flex items-center gap-2">
              <EstadoPunto estado={estado} />
              <h3 className="text-[15px] font-medium text-foreground">{t.titulo}</h3>
            </div>
            <p
              className={
                sinDatos
                  ? "mt-2 text-[13px] leading-5 text-muted-foreground"
                  : "mt-2 text-[13px] leading-5 text-foreground"
              }
            >
              {sinDatos ? "Sin datos" : t.dato}
            </p>
          </article>
        );
      })}
    </section>
  );
}

// ---------------------------------------------------------------- 4 · fugas

function SeccionFugas({ fugas }: { fugas: Fuga[] }) {
  const [expandido, setExpandido] = useState(false);

  const conMonto = fugas
    .filter((f) => f.tipo === "monto" && typeof f.monto === "number")
    .sort((a, b) => (b.monto ?? 0) - (a.monto ?? 0));
  const riesgos = fugas.filter((f) => f.tipo === "riesgo");
  const noCalculables = fugas.filter((f) => f.calculable === false);

  const visibles = expandido ? conMonto : conMonto.slice(0, 3);
  const ocultas = conMonto.length - visibles.length;

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-medium text-foreground">Fugas detectadas</h2>
      </header>

      {conMonto.length === 0 && riesgos.length === 0 && noCalculables.length === 0 && (
        <p className="px-5 py-6 text-[13px] text-muted-foreground">
          No se detectaron fugas con los datos cargados.
        </p>
      )}

      <ul className="divide-y divide-border">
        {visibles.map((f) => (
          <li key={f.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-medium text-foreground">{f.etiqueta}</p>
              <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
                {f.detalle ?? EXPLICACION_FUGA[f.id] ?? ""}
              </p>
            </div>
            <p className="text-[20px] font-medium tabular-nums text-foreground">{pesos(f.monto)}</p>
          </li>
        ))}

        {riesgos.map((f) => (
          <li key={f.id} className="flex items-start gap-3 px-5 py-4">
            <EstadoPunto estado="rojo" className="mt-1.5" />
            <div>
              <p className="text-[16px] font-medium text-foreground">{f.etiqueta}</p>
              <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
                {f.detalle ?? "Hallazgo de riesgo: no se valoriza en pesos."}
              </p>
            </div>
          </li>
        ))}

        {noCalculables.map((f) => (
          <li key={`nc-${f.id}`} className="px-5 py-4 text-muted-foreground">
            <p className="text-[15px]">{f.etiqueta}</p>
            <p className="mt-0.5 text-[13px] leading-5">
              No se pudo calcular. Faltan:{" "}
              {f.faltantes.map((c) => ETIQUETAS_CAMPO[c] ?? c).join(", ")}.
            </p>
          </li>
        ))}
      </ul>

      {conMonto.length > 3 && (
        <div className="border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="text-[13px] font-medium text-primary underline-offset-4 hover:underline"
          >
            {expandido ? "Mostrar solo las tres principales" : `Ver las otras ${ocultas} fugas`}
          </button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- 5 · economía

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-2.5 last:border-b-0">
      <dt className="text-[14px] text-muted-foreground">{label}</dt>
      <dd className="text-[15px] font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function EconomiaDetalle({
  derivados,
  datos,
}: {
  derivados: Derivados;
  datos: DatosDiagnostico;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-medium text-foreground">Economía de la tienda</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Ticket {pesos(datos.ticket_promedio)} ·{" "}
          {etiqueta(PASARELAS, datos.pasarela) ?? "Pasarela sin definir"}
        </p>
      </header>
      <dl>
        <Fila label="Margen de contribución" value={pct(derivados.margen_contribucion)} />
        <Fila label="Breakeven ROAS" value={numero(derivados.breakeven_roas)} />
        <Fila label="CPA breakeven" value={pesos(derivados.cpa_breakeven)} />
        <Fila label="Reserva aplicada" value={pct(derivados.reserva, 0)} />
        <Fila label="CPA objetivo" value={pesos(derivados.cpa_objetivo)} />
        <Fila label="ROAS objetivo" value={numero(derivados.roas_objetivo)} />
        <Fila label="MER actual" value={numero(derivados.mer_actual)} />
        <Fila label="Pedidos mensuales estimados" value={numero(derivados.pedidos_mensuales, 0)} />
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------- 6 · presupuesto

function lecturaPresupuesto(d: Derivados): string | null {
  const piso = d.piso_mensual_un_conjunto;
  const actual = d.inversion_actual_mensual;
  if (typeof piso !== "number" || typeof actual !== "number") return null;

  if (actual < piso) {
    return "Subinversión estructural: el presupuesto está por debajo del piso que necesita un solo conjunto para aprender. Hay que consolidar conjuntos o subir el presupuesto.";
  }
  return "El presupuesto alcanza el piso que necesita un conjunto para aprender. El problema no es de plata, es de estructura de cuenta o de creativo.";
}

function Presupuesto({ derivados, datos }: { derivados: Derivados; datos: DatosDiagnostico }) {
  const lectura = lecturaPresupuesto(derivados);
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-medium text-foreground">Presupuesto recomendado</h2>
      </header>
      <dl>
        <Fila
          label="Piso mensual con un conjunto"
          value={pesos(derivados.piso_mensual_un_conjunto)}
        />
        <Fila label="Inversión actual mensual" value={pesos(derivados.inversion_actual_mensual)} />
        <Fila
          label="Conjuntos activos vs. sostenibles"
          value={`${numero(datos.conjuntos_activos, 0)} / ${numero(derivados.conjuntos_sostenibles, 1)}`}
        />
      </dl>
      <p className="border-t border-border px-5 py-4 text-[14px] leading-6 text-foreground">
        {lectura ?? "Faltan datos de presupuesto para dar una lectura."}
      </p>
    </section>
  );
}
