import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { EstadoPunto, ETIQUETA_ESTADO } from "@/components/estado-punto";
import { supabase } from "@/integrations/supabase/client";
import { formatARS, formatFecha, formatNumero, formatPorcentaje } from "@/lib/format";
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
import { normalizarPropuesta } from "@/lib/propuesta";
import type {
  Derivados,
  EstadoBloque,
  EstadosBloque,
  Fuga,
} from "@/lib/calculo-diagnostico";


export const Route = createFileRoute("/_authenticated/diagnosticos/$id")({
  head: () => ({
    meta: [
      { title: "Detalle del diagnóstico · Velocentum · Diagnóstico e-commerce" },
      {
        name: "description",
        content: "Resultado del diagnóstico de performance para la tienda del prospecto.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Detalle del diagnóstico · Velocentum · Diagnóstico e-commerce" },
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

  const acciones = (
    <div className="flex items-center gap-3">
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
      <PageHeader title={tienda} {...(subtitulo ? { description: subtitulo } : {})} actions={acciones} />

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

      <div className="space-y-10 px-8 py-10">
        <AvisoContradiccion contradiccion={contradiccion} />

        <NumeroPrincipal
          medicionRota={medicionRota}
          margenBloqueado={margenBloqueado}
          total={total}
          conservador={conservador}
        />

        <Semaforo estados={estados} derivados={d} datos={datos} />

        <SeccionNotas notas={data.notas} />

        <SeccionFugas fugas={fugas} />

        <SeccionCanales derivados={d} />

        <SeccionFunnel funnel={d.funnel} />

        <div className="grid gap-8 lg:grid-cols-2">
          <EconomiaDetalle derivados={d} datos={datos} />
          <Presupuesto derivados={d} datos={datos} />
        </div>

        <PropuestaSeccion
          diagnosticoId={data.id}
          propuestaGuardada={normalizarPropuesta(data.propuesta)}
          fugas={fugas}
        />
      </div>
    </>
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
        </div>
      </div>
    </section>
  );
}

function NumeroPrincipal({
  medicionRota,
  margenBloqueado,
  total,
  conservador,
}: {
  medicionRota: boolean;
  margenBloqueado: boolean;
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
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
      {tarjetas.map((t) => {
        const estado: EstadoBloque = estados[t.id] ?? "sin_datos";
        const sinDatos = estado === "sin_datos";
        // Sin inversión no hay MER para comparar, pero el breakeven sí es un dato útil.
        const respaldo =
          t.id === "economia" && typeof derivados.breakeven_roas === "number"
            ? `Breakeven ROAS ${numero(derivados.breakeven_roas)}`
            : null;
        const texto = sinDatos ? (respaldo ?? "Sin datos") : t.dato;
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
                sinDatos && !respaldo
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
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Fugas detectadas</h2>
      </header>

      {conMonto.length === 0 && riesgos.length === 0 && noCalculables.length === 0 && (
        <p className="px-7 py-8 text-[14px] text-muted-foreground">
          No se detectaron fugas con los datos cargados.
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
              No se pudo calcular. Faltan:{" "}
              {f.faltantes.map((c) => ETIQUETAS_CAMPO[c] ?? c).join(", ")}.
            </p>
            {f.confianza === "parcial" && <MarcaParcial />}
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

// ---------------------------------------------------------------- 5 · economía

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border px-7 py-4 last:border-b-0">
      <dt className="text-[14.5px] text-muted-foreground">{label}</dt>
      <dd className="text-[16px] font-medium tabular-nums text-foreground">{value}</dd>
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
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Economía de la tienda</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
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
        <Fila label="MER actual (combinado)" value={numero(derivados.mer_actual)} />
        <Fila label="MER tienda propia (Meta + Google)" value={numero(derivados.mer_tienda_propia)} />
        <Fila label="MER Mercado Libre (Product Ads)" value={numero(derivados.mer_marketplace)} />
        <Fila
          label="ROAS de Product Ads"
          value={
            typeof derivados.roas_product_ads === "number"
              ? numero(derivados.roas_product_ads)
              : "Sin datos"
          }
        />
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
    </section>
  );
}

// ---------------------------------------------------------------- 6 · presupuesto

function Presupuesto({ derivados, datos }: { derivados: Derivados; datos: DatosDiagnostico }) {

  const lectura = lecturaPresupuesto(derivados);
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-7 py-5">
        <h2 className="text-[17px] font-medium text-foreground">Presupuesto recomendado</h2>
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
        <Fila label="Compras semanales estimadas" value={numero(derivados.pedidos_semanales, 1)} />

      </dl>
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
          Visitas, agregados al carrito, checkouts iniciados y compras del mismo período y del
          mismo canal.
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
            <Fila label="Conversión global" value={pct(funnel.cr_global, 2)} />
          </dl>
          {!funnel.desglosado && funnel.estado === "combinado" && (
            <p className="border-t border-border px-7 py-6 text-[14px] leading-6 text-muted-foreground">
              Faltan etapas intermedias del embudo, así que la oportunidad se muestra combinada,
              sin repartir entre navegación, carrito y checkout.
            </p>
          )}
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- canales

const NOMBRE_CANAL: Record<string, string> = {
  tienda_propia: "Tienda propia",
  mercado_libre: "Mercado Libre",
};

/**
 * Un benchmark nunca se muestra como comisión verificada: sólo una liquidación
 * del cliente cuenta como evidencia.
 */
function origenLegible(origen: string | null, evidencia?: string) {
  if (origen === null) return "Sin comisión resuelta";
  if (evidencia === "liquidacion_cliente" || origen === "verificado_cliente")
    return "Verificada con la liquidación del cliente";
  return "Benchmark de configuración";
}

function evidenciaLegible(evidencia: string) {
  if (evidencia === "liquidacion_cliente") return "Liquidación del cliente";
  if (evidencia === "declarado_cliente") return "Cargo declarado por el cliente";
  return "Sin verificar";
}

/** Mix de canales: cada canal con su comisión, su margen y su breakeven. */
function SeccionCanales({ derivados }: { derivados: Derivados }) {
  const canales = derivados.canales ?? [];
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
        {cobertura < 100 && (
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
                    : c.estado === "no_aplica"
                      ? "No aplica"
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
                  <Fila label="Evidencia" value={evidenciaLegible(c.comision_evidencia)} />
                  {c.comision_vigencia && (
                    <Fila label="Vigencia de la regla" value={c.comision_vigencia} />
                  )}
                  <Fila label="MER del canal" value={numero(c.mer)} />
                  <Fila
                    label="Contribución antes de publicidad"
                    value={pesos(c.contribucion_antes_publicidad)}
                  />
                  <Fila label="Inversión publicitaria del canal" value={pesos(c.inversion_publicitaria)} />
                  <Fila
                    label="Resultado después de publicidad"
                    value={pesos(c.resultado_despues_publicidad)}
                  />
                  {c.id === "mercado_libre" && (
                    <Fila
                      label="ROAS de Product Ads"
                      value={typeof c.roas_pauta === "number" ? numero(c.roas_pauta) : "Sin datos"}
                    />
                  )}
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
