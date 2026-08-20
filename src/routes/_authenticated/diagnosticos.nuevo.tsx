import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Keyboard } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatARS, formatPorcentaje } from "@/lib/format";
import {
  CampoNumero,
  CampoPesos,
  CampoPorcentaje,
  CampoSelect,
  CampoSiNo,
  CampoTexto,
} from "@/components/campos-formulario";
import { CargaCsvMeta } from "@/components/carga-csv-meta";
import {
  BLOQUES,
  CAMPOS_EXCLUSIVOS,
  CANTIDAD_CAMPANAS,
  CLAVE_BORRADOR,
  ESTADOS_CAPI,
  ORIGEN_DATOS,

  DATOS_INICIALES,
  MODOS,
  PASARELAS,
  PLANES_POR_PLATAFORMA,
  PLATAFORMAS,
  VERTICALES,
  camposPorBloque,
  contarCompletos,
  type BloqueId,
  type DatosDiagnostico,
  type Modo,
  type NotasDiagnostico,
} from "@/lib/diagnostico-form";
import {
  calcularDiagnostico,
  envioNetoVendedor,
  faltaEnvioCobrado,
} from "@/lib/calculo-diagnostico";
import { cargarConfiguracion } from "@/lib/configuracion";

export const Route = createFileRoute("/_authenticated/diagnosticos/nuevo")({
  validateSearch: (search: Record<string, unknown>): { desde?: string } =>
    typeof search['desde'] === "string" ? { desde: search['desde'] as string } : {},
  head: () => ({
    meta: [
      { title: "Nuevo diagnóstico · Velocentum · Diagnóstico e-commerce" },
      {
        name: "description",
        content:
          "Cargá los datos del negocio del prospecto para generar un diagnóstico de performance.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Nuevo diagnóstico · Velocentum · Diagnóstico e-commerce" },
      {
        property: "og:description",
        content: "Cargá los datos del negocio del prospecto para generar un diagnóstico.",
      },
    ],
  }),
  component: NuevoDiagnostico,
});

type Borrador = { modo: Modo; datos: DatosDiagnostico; notas: NotasDiagnostico };

function leerBorrador(): Borrador | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_BORRADOR);
    if (!crudo) return null;
    const parsed = JSON.parse(crudo) as Partial<Borrador>;
    if (parsed.modo !== "A" && parsed.modo !== "B") return null;
    return {
      modo: parsed.modo,
      datos: { ...DATOS_INICIALES, ...(parsed.datos ?? {}) },
      notas: parsed.notas ?? {},
    };
  } catch {
    return null;
  }
}

type Origen = { id: string; oportunidad_id: string; version: number };

function NuevoDiagnostico() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const { desde } = Route.useSearch();

  const [modo, setModo] = useState<Modo | null>(null);
  const [datos, setDatos] = useState<DatosDiagnostico>(DATOS_INICIALES);
  const [notas, setNotas] = useState<NotasDiagnostico>({});
  const [bloque, setBloque] = useState<BloqueId>("identificacion");
  const [guardadoEn, setGuardadoEn] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origen, setOrigen] = useState<Origen | null>(null);
  const [cargandoOrigen, setCargandoOrigen] = useState(Boolean(desde));

  // Precarga desde un diagnóstico existente (editar y recalcular)
  useEffect(() => {
    if (!desde) return;
    let vivo = true;
    void (async () => {
      const { data, error: err } = await supabase
        .from("diagnostico")
        .select("id, oportunidad_id, modo, version, datos, notas")
        .eq("id", desde)
        .maybeSingle();
      if (!vivo) return;
      if (err || !data) {
        setError("No pudimos abrir el diagnóstico original.");
        setCargandoOrigen(false);
        return;
      }
      setOrigen({
        id: data.id,
        oportunidad_id: data.oportunidad_id,
        version: typeof data.version === "number" ? data.version : 1,
      });
      setModo(data.modo === "B" ? "B" : "A");
      setDatos({ ...DATOS_INICIALES, ...((data.datos ?? {}) as Partial<DatosDiagnostico>) });
      setNotas((data.notas ?? {}) as NotasDiagnostico);
      setCargandoOrigen(false);
    })();
    return () => {
      vivo = false;
    };
  }, [desde]);

  // Recuperar borrador
  useEffect(() => {
    if (desde) return;
    const b = leerBorrador();
    if (b) {
      setModo(b.modo);
      setDatos(b.datos);
      setNotas(b.notas);
    }
  }, [desde]);

  // Autoguardado del borrador cada 3 segundos
  useEffect(() => {
    if (!modo || desde) return;
    const t = setTimeout(() => {
      window.localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ modo, datos, notas }));
      setGuardadoEn(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
    }, 3000);
    return () => clearTimeout(t);
  }, [modo, datos, notas, desde]);

  const set = useCallback(<K extends keyof DatosDiagnostico>(k: K, v: DatosDiagnostico[K]) => {
    setDatos((prev) => ({ ...prev, [k]: v }));
  }, []);

  const bloquesVisibles = useMemo(
    () => BLOQUES.filter((b) => b.id !== "mercado_libre" || datos.vende_mercado_libre),
    [datos.vende_mercado_libre],
  );

  useEffect(() => {
    if (bloque === "mercado_libre" && !datos.vende_mercado_libre) setBloque("identificacion");
  }, [bloque, datos.vende_mercado_libre]);

  // Atajos: Alt+1..8 salta a una pestaña, Alt+←/→ se mueve de a una
  useEffect(() => {
    if (!modo) return;
    function onKey(e: KeyboardEvent) {
      if (!e.altKey) return;
      const idx = bloquesVisibles.findIndex((b) => b.id === bloque);
      if (/^[1-8]$/.test(e.key)) {
        const destino = bloquesVisibles[Number(e.key) - 1];
        if (destino) {
          e.preventDefault();
          setBloque(destino.id);
        }
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const paso = e.key === "ArrowRight" ? 1 : -1;
        const destino =
          bloquesVisibles[Math.min(bloquesVisibles.length - 1, Math.max(0, idx + paso))];
        if (destino) {
          e.preventDefault();
          setBloque(destino.id);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modo, bloque, bloquesVisibles]);

  /** Cambia de modo conservando todo lo compartido y limpiando lo exclusivo del modo viejo. */
  function cambiarModo(nuevo: Modo) {
    const anterior: Modo = nuevo === "A" ? "B" : "A";
    setDatos((prev) => {
      const copia = { ...prev };
      for (const campo of CAMPOS_EXCLUSIVOS[anterior]) {
        (copia as Record<string, unknown>)[campo] = DATOS_INICIALES[campo];
      }
      return copia;
    });
    setModo(nuevo);
  }

  const desvioMedicion = useMemo(() => {
    const real = datos.facturacion_mensual;
    const pixel = datos.facturacion_pixel;
    if (real === null || pixel === null || real === 0) return null;
    return ((pixel - real) / real) * 100;
  }, [datos.facturacion_mensual, datos.facturacion_pixel]);

  const planesFijos = PLANES_POR_PLATAFORMA[datos.plataforma];

  async function guardar() {
    if (!modo) return;
    setError(null);
    if (datos.nombre_tienda.trim() === "") {
      setBloque("identificacion");
      setError("Poné el nombre de la tienda antes de guardar.");
      return;
    }
    if (!user) {
      setError("No hay sesión activa. Volvé a ingresar.");
      return;
    }
    setGuardando(true);
    try {
      let oportunidadId = origen?.oportunidad_id ?? null;

      if (!oportunidadId) {
        const { data: oportunidad, error: errOp } = await supabase
          .from("oportunidad")
          .insert({
            creado_por: user.id,
            nombre_tienda: datos.nombre_tienda.trim(),
            vertical: (datos.vertical || null) as never,
            plataforma: (datos.plataforma || null) as never,
            plan_plataforma: datos.plan_plataforma || null,
          })
          .select("id")
          .single();
        if (errOp || !oportunidad) throw errOp ?? new Error("No se pudo crear la oportunidad.");
        oportunidadId = oportunidad.id;
      }

      const cfg = await cargarConfiguracion();
      const resultado = calcularDiagnostico(datos, cfg);

      const { data: diagnostico, error: errDiag } = await supabase
        .from("diagnostico")
        .insert({
          oportunidad_id: oportunidadId,
          creado_por: user.id,
          modo,
          version: origen ? origen.version + 1 : 1,
          origen_diagnostico_id: origen?.id ?? null,
          fecha: new Date().toISOString().slice(0, 10),
          datos: datos as never,
          notas: notas as never,
          derivados: resultado.derivados as never,
          estados_bloque: resultado.estados_bloque as never,
          fugas: resultado.fugas as never,
          oportunidad_total: resultado.oportunidad_total,
        })
        .select("id")
        .single();
      if (errDiag || !diagnostico) throw errDiag ?? new Error("No se pudo guardar el diagnóstico.");

      if (!origen) window.localStorage.removeItem(CLAVE_BORRADOR);
      void navigate({ to: "/diagnosticos/$id", params: { id: diagnostico.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
      setGuardando(false);
    }
  }

  if (cargandoOrigen) {
    return (
      <>
        <PageHeader title="Editar y recalcular" />
        <div className="px-8 py-8">
          <p className="text-[14px] text-muted-foreground">Cargando el diagnóstico original…</p>
        </div>
      </>
    );
  }

  if (!modo) {
    return (
      <>
        <PageHeader
          title="Nuevo diagnóstico"
          description="Elegí cómo va a ser la llamada. Podés cambiarlo después sin perder lo cargado."
          actions={
            <Button asChild size="sm" variant="outline">
              <Link to="/">Cancelar</Link>
            </Button>
          }
        />
        <div className="px-8 py-8">
          <div className="grid max-w-4xl gap-6 sm:grid-cols-2">
            {MODOS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setModo(m.value)}
                className="rounded-xl border border-border bg-card p-10 text-left transition-colors hover:border-violet"
              >
                <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
                  Modo {m.value}
                </p>
                <p className="mt-2 text-[22px] font-medium leading-7 text-foreground">{m.titulo}</p>
                <p className="mt-3 text-[14px] leading-6 text-muted-foreground">{m.detalle}</p>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  const otroModo: Modo = modo === "A" ? "B" : "A";
  const indiceBloque = bloquesVisibles.findIndex((b) => b.id === bloque);
  const bloqueAnterior = indiceBloque > 0 ? bloquesVisibles[indiceBloque - 1] : undefined;
  const bloqueSiguiente =
    indiceBloque >= 0 && indiceBloque < bloquesVisibles.length - 1
      ? bloquesVisibles[indiceBloque + 1]
      : undefined;
  const bloquesCompletos = bloquesVisibles.filter((b) => {
    const { completos, total } = contarCompletos(datos, modo, b.id);
    return total > 0 && completos === total;
  }).length;
  const bloquesConCampos = bloquesVisibles.filter(
    (b) => camposPorBloque(modo, b.id).length > 0,
  ).length;
  const avance = bloquesConCampos === 0 ? 0 : (bloquesCompletos / bloquesConCampos) * 100;

  const verticalLabel = VERTICALES.find((v) => v.value === datos.vertical)?.label ?? "";
  const subtitulo = [datos.nombre_tienda.trim(), verticalLabel].filter(Boolean).join(" · ");
  const bloqueActual = bloquesVisibles.find((b) => b.id === bloque);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-card px-8 py-5">
        <div className="min-w-0">
          <h1 className="text-[19px] font-medium leading-7 tracking-[-0.01em] text-foreground">
            {origen ? "Editar y recalcular" : "Nuevo diagnóstico"}
          </h1>
          <p className="mt-1 truncate text-[13px] leading-5 text-muted-foreground">
            {subtitulo ||
              (origen
                ? `Se va a crear la versión ${origen.version + 1} del mismo prospecto`
                : "Cargá los datos mientras hablás con el prospecto")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-violet-soft px-3.5 py-1.5 text-[13px] text-violet">
            Modo {modo} · {modo === "A" ? "pantalla compartida" : "solo conversado"}
            <button
              type="button"
              onClick={() => cambiarModo(otroModo)}
              className="font-medium underline underline-offset-2"
            >
              cambiar
            </button>
          </span>

          <span className="text-[12px] text-muted-foreground">
            {origen
              ? `Versión nueva a partir de la ${origen.version}`
              : guardadoEn
                ? `Borrador guardado ${guardadoEn}`
                : "Borrador sin guardar"}
          </span>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Atajos de teclado"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Keyboard className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[12px] leading-5">
                Alt + número: ir a un bloque
                <br />
                Alt + ← / →: bloque anterior o siguiente
                <br />
                Tab: pasar de campo en campo
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button asChild size="sm" variant="outline">
            <Link to="/">Cancelar</Link>
          </Button>
          <Button size="sm" onClick={() => void guardar()} disabled={guardando}>
            {guardando ? "Guardando…" : origen ? "Guardar versión nueva" : "Guardar diagnóstico"}
          </Button>
        </div>
      </header>

      <div className="border-b border-border bg-card px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-violet transition-[width] duration-300"
              style={{ width: `${avance}%` }}
            />
          </div>
          <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
            {bloquesCompletos} de {bloquesConCampos} bloques completos
          </span>
        </div>
      </div>

      <div className="flex flex-col min-[760px]:flex-row">
        <nav
          aria-label="Bloques del diagnóstico"
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-muted/40 p-2 min-[760px]:w-[236px] min-[760px]:flex-col min-[760px]:gap-0.5 min-[760px]:overflow-visible min-[760px]:border-b-0 min-[760px]:border-r min-[760px]:p-3"
        >
          {bloquesVisibles.map((b, i) => {
            const { completos, total } = contarCompletos(datos, modo, b.id);
            const activo = b.id === bloque;
            const tieneCampos = camposPorBloque(modo, b.id).length > 0;
            const completo = tieneCampos && completos === total;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBloque(b.id)}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2.5 text-left text-[14px] transition-colors min-[760px]:w-full",
                  activo
                    ? "bg-violet-soft font-medium text-violet"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "text-[12px] tabular-nums",
                    activo ? "text-violet/70" : "text-muted-foreground/70",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{b.label}</span>
                {tieneCampos &&
                  (completo ? (
                    <Check className="size-4 shrink-0 text-[var(--estado-verde)]" />
                  ) : (
                    <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
                      {completos}/{total}
                    </span>
                  ))}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 px-8 py-8">
          <div className="max-w-4xl rounded-lg border border-border bg-card p-8">
            <h2 className="text-[17px] font-medium leading-6 text-foreground">
              {bloqueActual?.label}
            </h2>
            <p className="mb-7 mt-1.5 text-[13px] leading-5 text-muted-foreground">
              {ORIGEN_DATOS[bloque]}
            </p>


          {bloque === "identificacion" && (
            <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
              <CampoTexto
                label="Nombre de la tienda"
                obligatorio
                value={datos.nombre_tienda}
                onChange={(v) => set("nombre_tienda", v)}
                placeholder="Ej. Tienda Aurora"
              />
              <CampoSelect
                label="¿Qué vende?"
                value={datos.vertical}
                onChange={(v) => set("vertical", v)}
                opciones={VERTICALES}
              />
              <CampoSelect
                label="Plataforma"
                value={datos.plataforma}
                onChange={(v) => setDatos((p) => ({ ...p, plataforma: v, plan_plataforma: "" }))}
                opciones={PLATAFORMAS}
              />
              {planesFijos ? (
                <CampoSelect
                  label="Plan de la plataforma"
                  value={datos.plan_plataforma}
                  onChange={(v) => set("plan_plataforma", v)}
                  opciones={planesFijos}
                />
              ) : (
                <CampoTexto
                  label="Plan de la plataforma"
                  value={datos.plan_plataforma}
                  onChange={(v) => set("plan_plataforma", v)}
                  placeholder="Escribilo tal como lo dice el cliente"
                />
              )}
              <CampoSiNo
                label="¿Vende en Mercado Libre?"
                value={datos.vende_mercado_libre}
                onChange={(v) => set("vende_mercado_libre", v === true)}
                ayuda="Si es que sí, se habilita la pestaña de Mercado Libre."
              />
            </div>
          )}

          {bloque === "medicion" && modo === "A" && (
            <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
              <CampoSiNo
                label="¿Tiene el Pixel instalado?"
                value={datos.tiene_pixel}
                onChange={(v) => set("tiene_pixel", v)}
              />
              <CampoPesos
                label="Facturación que reporta el Pixel"
                value={datos.facturacion_pixel}
                onChange={(v) => set("facturacion_pixel", v)}
              />
              <CampoSelect
                label="Estado de la CAPI"
                value={datos.capi_estado}
                onChange={(v) => set("capi_estado", v)}
                opciones={ESTADOS_CAPI}
              />
              <div className="rounded-md border border-border px-3 py-2.5">
                <p className="text-[12px] text-muted-foreground">
                  Desvío contra la facturación real
                </p>
                <p className="mt-0.5 text-[15px] tabular-nums text-foreground">
                  {desvioMedicion === null ? "—" : formatPorcentaje(desvioMedicion, 1)}
                </p>
              </div>
            </div>
          )}

          {bloque === "medicion" && modo === "B" && (
            <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
              <CampoSiNo
                label="¿Tiene el Pixel instalado?"
                value={datos.tiene_pixel}
                onChange={(v) => set("tiene_pixel", v)}
              />
              <CampoSiNo
                label="¿Tiene Google Analytics?"
                value={datos.tiene_analytics}
                onChange={(v) => set("tiene_analytics", v)}
              />
              <CampoSiNo
                label="¿Los números de Meta se parecen a sus ventas reales?"
                value={datos.numeros_meta_coinciden}
                onChange={(v) => set("numeros_meta_coinciden", v)}
              />
            </div>
          )}


          {bloque === "economia" && (
            <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
              <CampoPesos
                label="Facturación mensual"
                value={datos.facturacion_mensual}
                onChange={(v) => set("facturacion_mensual", v)}
              />
              <CampoPesos
                label="Ticket promedio"
                value={datos.ticket_promedio}
                onChange={(v) => set("ticket_promedio", v)}
              />
              <CampoSelect
                label="Base de los montos"
                value={datos.base_montos ?? "bruto"}
                onChange={(v) => set("base_montos", (v as "bruto" | "neto") || "bruto")}
                opciones={BASES_MONTOS}
                ayuda="Si tus números ya están netos de descuentos, elegí neto para que no se descuente dos veces."
              />

              <CampoPesos
                label="Envío neto del vendedor por pedido"
                value={datos.costo_envio_promedio}
                onChange={(v) => set("costo_envio_promedio", v)}
                ayuda="Lo que efectivamente pone el vendedor, neto de lo que le cobra al cliente. Se usa si no cargás bruto y cobrado."
              />
              <CampoPesos
                label="Envío bruto por pedido"
                value={datos.envio_bruto}
                onChange={(v) => set("envio_bruto", v)}
                ayuda="Costo total del envío por pedido, antes de lo que paga el comprador."
              />
              <CampoPesos
                label="Envío que paga el comprador"
                value={datos.envio_cobrado_comprador}
                onChange={(v) => set("envio_cobrado_comprador", v)}
                ayuda="Cuánto del envío se le cobra al comprador."
              />
              <div className="rounded-md border border-border px-3 py-2.5">
                <p className="text-[12px] text-muted-foreground">Envío neto del vendedor</p>
                <p className="mt-0.5 text-[15px] tabular-nums text-foreground">
                  {envioNetoVendedor(datos) === null
                    ? "—"
                    : formatARS(envioNetoVendedor(datos) as number)}
                </p>
              </div>
              {faltaEnvioCobrado(datos) && (
                <p className="text-[12px] text-destructive sm:col-span-2">
                  Cargaste el envío bruto pero falta cuánto paga el comprador. Ingresá ese importe
                  para poder calcular el margen: no se asume cero.
                </p>
              )}

              <CampoSelect
                label="Pasarela de cobro"
                value={datos.pasarela}
                onChange={(v) => set("pasarela", v)}
                opciones={PASARELAS}
              />
              <CampoPesos
                label="Inversión mensual en Meta"
                value={datos.inversion_meta}
                onChange={(v) => set("inversion_meta", v)}
              />
              <CampoPesos
                label="Inversión mensual en Google"
                value={datos.inversion_google}
                onChange={(v) => set("inversion_google", v)}
              />
            </div>
          )}

          {bloque === "productos" && (
            <div className="space-y-7">
              <p className="text-[12px] text-muted-foreground">
                {modo === "A"
                  ? "Los tres productos que más vende, con costo y precio de cada uno. De acá sale el margen."
                  : "Los tres que más vende. Costo y precio sólo del principal."}
              </p>
              {[1, 2, 3].map((n) => {
                const nombreKey = `producto_${n}_nombre` as keyof DatosDiagnostico;
                const costoKey = `producto_${n}_costo` as keyof DatosDiagnostico;
                const precioKey = `producto_${n}_precio` as keyof DatosDiagnostico;
                const pctKey = `producto_${n}_pct_facturacion` as keyof DatosDiagnostico;
                const conMontos = modo === "A" || n === 1;
                return (
                  <div key={n} className="grid gap-x-7 gap-y-6 sm:grid-cols-4">
                    <CampoTexto
                      label={`Producto ${n}${n === 1 ? " (principal)" : ""}`}
                      value={datos[nombreKey] as string}
                      onChange={(v) => set(nombreKey, v as never)}
                      placeholder="Nombre"
                    />
                    {conMontos && (
                      <>
                        <CampoPesos
                          label="Costo"
                          value={datos[costoKey] as number | null}
                          onChange={(v) => set(costoKey, v as never)}
                        />
                        <CampoPesos
                          label="Precio de venta"
                          value={datos[precioKey] as number | null}
                          onChange={(v) => set(precioKey, v as never)}
                        />
                      </>
                    )}
                    <CampoPorcentaje
                      label="% de la facturación"
                      value={datos[pctKey] as number | null}
                      onChange={(v) => set(pctKey, v as never)}
                    />
                  </div>
                );
              })}
              {(() => {
                const pcts = [
                  datos.producto_1_pct_facturacion,
                  datos.producto_2_pct_facturacion,
                  datos.producto_3_pct_facturacion,
                ].filter((v): v is number => typeof v === "number" && Number.isFinite(v));
                if (pcts.length === 0) return null;
                const suma = pcts.reduce((a, b) => a + b, 0);
                const excede = suma > 100;
                return (
                  <p className="text-[13px] tabular-nums">
                    <span className="text-muted-foreground">Suma de los tres: </span>
                    <span className={excede ? "text-[var(--estado-rojo)]" : "text-foreground"}>
                      {Math.round(suma * 10) / 10}%
                    </span>
                    {excede && (
                      <span className="ml-2 text-[var(--estado-rojo)]">La suma supera el 100%</span>
                    )}
                  </p>
                );
              })()}
              {modo === "A" && (
                <div>
                  <label
                    htmlFor="reparto-pauta"
                    className="text-[14px] font-medium text-foreground/85"
                  >
                    ¿Le pauta por igual a todos o hay alguno que empuja más?
                  </label>
                  <Textarea
                    id="reparto-pauta"
                    rows={2}
                    maxLength={1000}
                    className="mt-2 resize-y text-[14px]"
                    value={datos.reparto_pauta}
                    onChange={(e) => set("reparto_pauta", e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {bloque === "cuenta" && modo === "A" && (
            <div className="space-y-6">
              <CargaCsvMeta
                hayDatosCargados={
                  datos.conjuntos_activos !== null || datos.presupuesto_diario !== null
                }
                onAplicar={(r) =>
                  setDatos((p) => ({
                    ...p,
                    conjuntos_activos: r.conjuntos_activos,
                    presupuesto_diario: r.presupuesto_diario,
                    csv_gasto_total: r.gasto_total,
                    csv_frecuencia_promedio: r.frecuencia_promedio,
                    csv_ctr_global: r.ctr_global,
                    csv_conjuntos_bajo_gasto: r.conjuntos_bajo_gasto,
                    csv_dias_periodo: r.dias,
                  }))
                }
              />
              <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
                <CampoNumero
                  label="Conjuntos activos"
                  value={datos.conjuntos_activos}
                  onChange={(v) => set("conjuntos_activos", v)}
                />
                <CampoPesos
                  label="Presupuesto diario total"
                  value={datos.presupuesto_diario}
                  onChange={(v) => set("presupuesto_diario", v)}
                />
              </div>
            </div>
          )}


          {bloque === "cuenta" && modo === "B" && (
            <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
              <CampoPesos
                label="¿Cuánto gasta por día?"
                value={datos.gasto_diario}
                onChange={(v) => set("gasto_diario", v)}
              />
              <CampoSelect
                label="¿Tiene muchas campañas prendidas o pocas?"
                value={datos.cantidad_campanas}
                onChange={(v) => set("cantidad_campanas", v)}
                opciones={CANTIDAD_CAMPANAS}
              />
            </div>
          )}

          {bloque === "web" && (
            <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
              {modo === "A" && (
                <CampoNumero
                  label="Visitas mensuales"
                  value={datos.visitas_mensuales}
                  onChange={(v) => set("visitas_mensuales", v)}
                  ayuda="Con esto se calcula la conversión de la tienda."
                />
              )}
              <CampoNumero
                label="Carritos abandonados en el mes"
                value={datos.carritos_abandonados}
                onChange={(v) => set("carritos_abandonados", v)}
                ayuda="Tiendanube, sección Carritos abandonados."
              />

              <CampoSiNo
                label="¿Tiene recuperación de carrito?"
                value={datos.recuperacion_carrito}
                onChange={(v) => set("recuperacion_carrito", v)}
              />
              <CampoSiNo
                label="¿Hace retargeting a los que abandonaron?"
                value={datos.retargeting_abandono}
                onChange={(v) => set("retargeting_abandono", v)}
              />
            </div>
          )}

          {bloque === "contenido" && (
            <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
              <CampoTexto
                label="¿Cada cuánto sube creativos nuevos?"
                value={datos.frecuencia_creativos}
                onChange={(v) => set("frecuencia_creativos", v)}
              />
              <CampoTexto
                label="¿Qué formato usa?"
                value={datos.formato_creativos}
                onChange={(v) => set("formato_creativos", v)}
              />
              <CampoTexto
                label="¿Tiene identificado qué ángulo funciona mejor?"
                value={datos.angulo_que_funciona}
                onChange={(v) => set("angulo_que_funciona", v)}
              />
              <CampoTexto
                label="¿Sabe cuál es el dolor principal de su cliente?"
                value={datos.dolor_cliente}
                onChange={(v) => set("dolor_cliente", v)}
              />
              <CampoSiNo
                label="¿Le llegan consultas o ventas por contenido orgánico?"
                value={datos.consultas_por_organico}
                onChange={(v) => set("consultas_por_organico", v)}
              />
            </div>
          )}

          {bloque === "mercado_libre" && (
            <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
              <CampoPorcentaje
                label="Porcentaje de la facturación"
                value={datos.ml_pct_facturacion}
                onChange={(v) => set("ml_pct_facturacion", v)}
              />
              <CampoNumero
                label="Productos publicados"
                value={datos.ml_productos_publicados}
                onChange={(v) => set("ml_productos_publicados", v)}
              />
              <CampoSiNo
                label="¿Hace Product Ads?"
                value={datos.ml_product_ads}
                onChange={(v) => set("ml_product_ads", v)}
              />
              <CampoPesos
                label="Inversión mensual en Product Ads"
                value={datos.ml_inversion_product_ads}
                onChange={(v) => set("ml_inversion_product_ads", v)}
              />
            </div>
          )}

          <div className="mt-8 border-t border-border pt-6">
            <label
              htmlFor={`notas-${bloque}`}
              className="text-[14px] font-medium text-foreground/85"
            >
              Notas de esta pestaña
            </label>
            <Textarea
              id={`notas-${bloque}`}
              rows={3}
              maxLength={2000}
              placeholder="Anotá rápido lo que dice el cliente."
              className="mt-2 resize-y text-[14px]"
              value={notas[bloque] ?? ""}
              onChange={(e) => setNotas((prev) => ({ ...prev, [bloque]: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-6 flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 min-w-40 text-[15px]"
            disabled={!bloqueAnterior}
            onClick={() => bloqueAnterior && setBloque(bloqueAnterior.id)}
          >
            {bloqueAnterior ? `Anterior · ${bloqueAnterior.label}` : "Anterior"}
          </Button>

          {bloqueSiguiente ? (
            <Button
              type="button"
              size="lg"
              className="h-12 min-w-40 text-[15px]"
              onClick={() => setBloque(bloqueSiguiente.id)}
            >
              Siguiente · {bloqueSiguiente.label}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="h-12 min-w-40 text-[15px]"
              disabled={guardando}
              onClick={() => void guardar()}
            >
              {guardando
                ? "Guardando…"
                : origen
                  ? "Guardar versión nueva"
                  : "Guardar diagnóstico"}
            </Button>
          )}
        </div>

        {error && (
          <p className="mt-4 max-w-4xl text-[14px] text-destructive" role="alert">
            {error}
          </p>
        )}
        </div>
      </div>
    </>

  );
}
