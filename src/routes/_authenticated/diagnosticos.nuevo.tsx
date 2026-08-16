import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatPorcentaje } from "@/lib/format";
import {
  CampoNumero,
  CampoPesos,
  CampoPorcentaje,
  CampoSelect,
  CampoSiNo,
  CampoTexto,
} from "@/components/campos-formulario";
import {
  BLOQUES,
  CLAVE_BORRADOR,
  DATOS_INICIALES,
  PASARELAS,
  PLANES_POR_PLATAFORMA,
  PLATAFORMAS,
  VERTICALES,
  contarCompletos,
  type BloqueId,
  type DatosDiagnostico,
  type NotasDiagnostico,
} from "@/lib/diagnostico-form";

export const Route = createFileRoute("/_authenticated/diagnosticos/nuevo")({
  head: () => ({
    meta: [
      { title: "Nuevo diagnóstico · Velocentum Cockpit" },
      {
        name: "description",
        content:
          "Cargá los datos del negocio del prospecto para generar un diagnóstico de performance.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Nuevo diagnóstico · Velocentum Cockpit" },
      {
        property: "og:description",
        content: "Cargá los datos del negocio del prospecto para generar un diagnóstico.",
      },
    ],
  }),
  component: NuevoDiagnostico,
});

type Borrador = { datos: DatosDiagnostico; notas: NotasDiagnostico };

function leerBorrador(): Borrador | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_BORRADOR);
    if (!crudo) return null;
    const parsed = JSON.parse(crudo) as Borrador;
    return { datos: { ...DATOS_INICIALES, ...parsed.datos }, notas: parsed.notas ?? {} };
  } catch {
    return null;
  }
}

function NuevoDiagnostico() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();

  const [datos, setDatos] = useState<DatosDiagnostico>(DATOS_INICIALES);
  const [notas, setNotas] = useState<NotasDiagnostico>({});
  const [bloque, setBloque] = useState<BloqueId>("identificacion");
  const [guardadoEn, setGuardadoEn] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [costosPorVertical, setCostosPorVertical] = useState<Record<string, number>>({});
  const verticalPrecargada = useRef<string>("");

  // Recuperar borrador
  useEffect(() => {
    const b = leerBorrador();
    if (b) {
      setDatos(b.datos);
      setNotas(b.notas);
      verticalPrecargada.current = b.datos.vertical;
    }
  }, []);

  // Parámetros del sistema: costo de producto por vertical
  useEffect(() => {
    let vivo = true;
    void supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "costo_producto_por_vertical")
      .maybeSingle()
      .then(({ data }) => {
        if (vivo && data?.valor && typeof data.valor === "object") {
          setCostosPorVertical(data.valor as Record<string, number>);
        }
      });
    return () => {
      vivo = false;
    };
  }, []);

  // Autoguardado del borrador cada 3 segundos
  useEffect(() => {
    const t = setTimeout(() => {
      window.localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ datos, notas }));
      setGuardadoEn(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
    }, 3000);
    return () => clearTimeout(t);
  }, [datos, notas]);

  const set = useCallback(<K extends keyof DatosDiagnostico>(k: K, v: DatosDiagnostico[K]) => {
    setDatos((prev) => ({ ...prev, [k]: v }));
  }, []);

  const bloquesVisibles = useMemo(
    () => BLOQUES.filter((b) => b.id !== "mercado_libre" || datos.vende_mercado_libre),
    [datos.vende_mercado_libre],
  );

  // Si se apaga Mercado Libre estando parado en esa pestaña, volvemos a la primera
  useEffect(() => {
    if (bloque === "mercado_libre" && !datos.vende_mercado_libre) setBloque("identificacion");
  }, [bloque, datos.vende_mercado_libre]);

  // Atajos: Alt+1..6 salta a una pestaña, Alt+←/→ se mueve de a una
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey) return;
      const idx = bloquesVisibles.findIndex((b) => b.id === bloque);
      if (/^[1-6]$/.test(e.key)) {
        const destino = bloquesVisibles[Number(e.key) - 1];
        if (destino) {
          e.preventDefault();
          setBloque(destino.id);
        }
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const paso = e.key === "ArrowRight" ? 1 : -1;
        const destino = bloquesVisibles[Math.min(bloquesVisibles.length - 1, Math.max(0, idx + paso))];
        if (destino) {
          e.preventDefault();
          setBloque(destino.id);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bloque, bloquesVisibles]);

  function cambiarVertical(v: string) {
    setDatos((prev) => {
      const precarga = costosPorVertical[v];
      const debePrecargar =
        precarga !== undefined &&
        (prev.costo_producto_pct === null || prev.vertical !== verticalPrecargada.current);
      verticalPrecargada.current = v;
      return {
        ...prev,
        vertical: v,
        costo_producto_pct: debePrecargar
          ? Math.round(precarga * 1000) / 10
          : prev.costo_producto_pct,
      };
    });
  }

  function cambiarPlataforma(v: string) {
    setDatos((prev) => ({ ...prev, plataforma: v, plan_plataforma: "" }));
  }

  const desvioMedicion = useMemo(() => {
    const real = datos.ventas_backoffice;
    const pixel = datos.facturacion_pixel;
    if (real === null || pixel === null || real === 0) return null;
    return ((pixel - real) / real) * 100;
  }, [datos.ventas_backoffice, datos.facturacion_pixel]);

  const planesFijos = PLANES_POR_PLATAFORMA[datos.plataforma];

  async function guardar() {
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

      const { data: diagnostico, error: errDiag } = await supabase
        .from("diagnostico")
        .insert({
          oportunidad_id: oportunidad.id,
          creado_por: user.id,
          fecha: new Date().toISOString().slice(0, 10),
          datos: datos as never,
          notas: notas as never,
        })
        .select("id")
        .single();
      if (errDiag || !diagnostico) throw errDiag ?? new Error("No se pudo guardar el diagnóstico.");

      window.localStorage.removeItem(CLAVE_BORRADOR);
      void navigate({ to: "/diagnosticos/$id", params: { id: diagnostico.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Nuevo diagnóstico"
        description="Cargá los datos mientras hablás con el prospecto. Atajos: Alt + número, Alt + ← / →."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-muted-foreground">
              {guardadoEn ? `Borrador guardado ${guardadoEn}` : "Borrador sin guardar"}
            </span>
            <Button asChild size="sm" variant="outline">
              <Link to="/">Cancelar</Link>
            </Button>
            <Button size="sm" onClick={() => void guardar()} disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar diagnóstico"}
            </Button>
          </div>
        }
      />

      <nav className="flex items-stretch gap-0 overflow-x-auto border-b border-border bg-card px-6">
        {bloquesVisibles.map((b, i) => {
          const { completos, total } = contarCompletos(datos, b.id);
          const activo = b.id === bloque;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setBloque(b.id)}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] transition-colors",
                activo
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="text-[11px] tabular-nums text-muted-foreground/70">{i + 1}</span>
              <span>{b.label}</span>
              <span
                className={cn(
                  "rounded border border-border px-1 text-[11px] tabular-nums",
                  completos === total ? "text-primary" : "text-muted-foreground",
                )}
              >
                {completos}/{total}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-6">
        <div className="max-w-4xl rounded-lg border border-border bg-card p-5">
          {bloque === "identificacion" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTexto
                label="Nombre de la tienda"
                obligatorio
                value={datos.nombre_tienda}
                onChange={(v) => set("nombre_tienda", v)}
                placeholder="Ej. Tienda Aurora"
              />
              <CampoSelect
                label="Vertical"
                value={datos.vertical}
                onChange={cambiarVertical}
                opciones={VERTICALES}
              />
              <CampoSelect
                label="Plataforma"
                value={datos.plataforma}
                onChange={cambiarPlataforma}
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
                onChange={(v) => set("vende_mercado_libre", v)}
                ayuda="Si es que sí, se habilita la pestaña de Mercado Libre."
              />
            </div>
          )}

          {bloque === "medicion" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoPesos
                label="Ventas reales del último mes (backoffice)"
                value={datos.ventas_backoffice}
                onChange={(v) => set("ventas_backoffice", v)}
              />
              <CampoPesos
                label="Facturación registrada por el Pixel de Meta"
                value={datos.facturacion_pixel}
                onChange={(v) => set("facturacion_pixel", v)}
              />
              <div className="sm:col-span-2 rounded-md border border-border px-3 py-2.5">
                <p className="text-[12px] text-muted-foreground">Desvío entre ambos números</p>
                <p className="mt-0.5 text-[15px] tabular-nums text-foreground">
                  {desvioMedicion === null ? "—" : formatPorcentaje(desvioMedicion, 1)}
                </p>
              </div>
            </div>
          )}

          {bloque === "economia" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoPesos
                label="Facturación mensual bruta"
                value={datos.facturacion_mensual}
                onChange={(v) => set("facturacion_mensual", v)}
              />
              <CampoPesos
                label="Ticket promedio"
                value={datos.ticket_promedio}
                onChange={(v) => set("ticket_promedio", v)}
              />
              <CampoPorcentaje
                label="Costo de producto sobre el precio"
                value={datos.costo_producto_pct}
                onChange={(v) => set("costo_producto_pct", v)}
                ayuda="Precargado por vertical. Validalo con el cliente."
              />
              <CampoPesos
                label="Costo de envío promedio por pedido"
                value={datos.costo_envio_promedio}
                onChange={(v) => set("costo_envio_promedio", v)}
                ayuda="Neto de lo que le cobra al cliente."
              />
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

          {bloque === "cuenta" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoNumero
                label="Conjuntos de anuncios activos"
                value={datos.conjuntos_activos}
                onChange={(v) => set("conjuntos_activos", v)}
              />
              <CampoPesos
                label="Presupuesto diario total"
                value={datos.presupuesto_diario}
                onChange={(v) => set("presupuesto_diario", v)}
              />
              <CampoNumero
                label="Frecuencia promedio (últimos 30 días)"
                decimales={1}
                value={datos.frecuencia_30d}
                onChange={(v) => set("frecuencia_30d", v)}
              />
            </div>
          )}

          {bloque === "web_creativos" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoNumero
                label="Sesiones mensuales"
                value={datos.sesiones_mensuales}
                onChange={(v) => set("sesiones_mensuales", v)}
              />
              <CampoPorcentaje
                label="Tasa de conversión de la tienda"
                value={datos.cr_tienda}
                onChange={(v) => set("cr_tienda", v)}
                ayuda="Con dos decimales. Ej. 1,25"
              />
              <CampoNumero
                label="Creativos nuevos por mes"
                value={datos.creativos_nuevos_mes}
                onChange={(v) => set("creativos_nuevos_mes", v)}
              />
              <CampoPesos
                label="Techo de facturación mensual de la operación"
                value={datos.techo_operativo}
                onChange={(v) => set("techo_operativo", v)}
                ayuda="Cuánto podría despachar y atender sin romperse."
              />
            </div>
          )}

          {bloque === "mercado_libre" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoPorcentaje
                label="Porcentaje de la facturación total que viene de Mercado Libre"
                value={datos.ml_pct_facturacion}
                onChange={(v) => set("ml_pct_facturacion", v)}
              />
            </div>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <label
              htmlFor={`notas-${bloque}`}
              className="text-[13px] font-normal text-muted-foreground"
            >
              Notas de esta pestaña
            </label>
            <Textarea
              id={`notas-${bloque}`}
              rows={3}
              maxLength={2000}
              placeholder="Anotá rápido lo que dice el cliente."
              className="mt-1.5 resize-y text-[13px]"
              value={notas[bloque] ?? ""}
              onChange={(e) => setNotas((prev) => ({ ...prev, [bloque]: e.target.value }))}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 max-w-4xl text-[13px] text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
