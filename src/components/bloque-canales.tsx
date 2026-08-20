import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CampoPesos,
  CampoPorcentaje,
  CampoSelect,
} from "@/components/campos-formulario";
import type { DatosDiagnostico } from "@/lib/diagnostico-form";
import { TIPOS_PUBLICACION_ML } from "@/lib/diagnostico-form";
import {
  CANALES,
  canalPrincipal,
  coberturaCanales,
  comisionEnEscalaSospechosa,
  estadoCanal,
  type CanalId,
} from "@/lib/canales";

type Set = <K extends keyof DatosDiagnostico>(k: K, v: DatosDiagnostico[K]) => void;

/** Nombres planos de los campos de cada canal, sin castear el modelo. */
const campos = {
  tienda_propia: {
    pct: "canal_tienda_pct",
    no_aplica: "canal_tienda_no_aplica",
    facturacion: "canal_tienda_facturacion",
    ticket: "canal_tienda_ticket",
    comision: "canal_tienda_comision_pct",
    envio: "canal_tienda_envio_neto",
    inversion: "canal_tienda_inversion",
  },
  mercado_libre: {
    pct: "canal_ml_pct",
    no_aplica: "canal_ml_no_aplica",
    facturacion: "canal_ml_facturacion",
    ticket: "canal_ml_ticket",
    comision: "canal_ml_comision_pct",
    envio: "canal_ml_envio_neto",
    inversion: "canal_ml_inversion",
  },
} as const satisfies Record<CanalId, Record<string, keyof DatosDiagnostico>>;

export function BloqueCanales({ datos, set }: { datos: DatosDiagnostico; set: Set }) {
  const cobertura = coberturaCanales(datos);
  const principal = canalPrincipal(datos);
  const supera = cobertura > 100;
  const incompleta = cobertura > 0 && cobertura < 100;
  const nombrePrincipal = CANALES.find((c) => c.id === principal)?.label ?? "Sin definir";

  return (
    <div className="space-y-7">
      {CANALES.map((canal) => {
        const c = campos[canal.id];
        const noAplica = datos[c.no_aplica] === true;
        const comision = datos[c.comision] as number | null | undefined;
        const escala = comisionEnEscalaSospechosa(comision ?? null);
        return (
          <section
            key={canal.id}
            className={cn(
              "rounded-lg border border-border p-6",
              noAplica && "bg-muted/40 opacity-70",
            )}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-[15px] font-medium text-foreground">{canal.label}</h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`no-aplica-${canal.id}`}
                  checked={noAplica}
                  onCheckedChange={(v) => set(c.no_aplica, v === true)}
                />
                <Label
                  htmlFor={`no-aplica-${canal.id}`}
                  className="text-[13px] font-normal text-muted-foreground"
                >
                  No vende en este canal
                </Label>
              </div>
            </div>

            {!noAplica && (
              <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
                <CampoPorcentaje
                  label="Porcentaje de la facturación total"
                  value={(datos[c.pct] as number | null) ?? null}
                  onChange={(v) => set(c.pct, v)}
                  maximo={100}
                  ayuda="Cuánto de todo lo que factura el negocio pasa por este canal."
                />
                <CampoPesos
                  label="Facturación del canal"
                  value={(datos[c.facturacion] as number | null) ?? null}
                  onChange={(v) => set(c.facturacion, v)}
                />
                <CampoPesos
                  label="Ticket promedio del canal"
                  value={(datos[c.ticket] as number | null) ?? null}
                  onChange={(v) => set(c.ticket, v)}
                  ayuda="Si queda vacío, se usa el ticket general del diagnóstico."
                />
                <div>
                  <CampoPorcentaje
                    label="Comisión verificada"
                    value={comision ?? null}
                    onChange={(v) => set(c.comision, v)}
                    maximo={100}
                    ayuda="En porcentaje, como figura en la liquidación: 16,94 y no 0,1694."
                  />
                  {escala && (
                    <p className="mt-1 text-[12px] text-[var(--estado-rojo)]">
                      El valor parece estar en tasa y no en porcentaje. Una comisión menor al 1% es
                      sospechosa: ¿quisiste escribir {String((comision as number) * 100).replace(".", ",")}?
                    </p>
                  )}
                </div>
                <CampoPesos
                  label="Envío neto del canal"
                  value={(datos[c.envio] as number | null) ?? null}
                  onChange={(v) => set(c.envio, v)}
                  ayuda="Lo que paga el vendedor por pedido, después de lo que cobra al comprador."
                />
                <CampoPesos
                  label="Inversión publicitaria del canal"
                  value={(datos[c.inversion] as number | null) ?? null}
                  onChange={(v) => set(c.inversion, v)}
                />
                {canal.id === "mercado_libre" && (
                  <CampoSelect
                    label="Tipo de publicación"
                    value={datos.canal_ml_tipo_publicacion ?? ""}
                    onChange={(v) => set("canal_ml_tipo_publicacion", v)}
                    opciones={TIPOS_PUBLICACION_ML}
                  />
                )}
              </div>
            )}
          </section>
        );
      })}

      <div className="rounded-lg border border-border bg-muted/30 p-5">
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <p className="text-[13px] text-muted-foreground">
            Cobertura declarada{" "}
            <span className="text-[15px] font-medium tabular-nums text-foreground">
              {String(cobertura).replace(".", ",")}%
            </span>
          </p>
          <p className="text-[13px] text-muted-foreground">
            Canal principal{" "}
            <span className="text-[15px] font-medium text-foreground">
              {principal ? nombrePrincipal : "sin definir"}
            </span>
          </p>
        </div>

        {supera && (
          <p className="mt-3 text-[13px] text-[var(--estado-rojo)]">
            Los porcentajes suman más de 100. Mientras siga así, no se calcula ningún margen.
          </p>
        )}
        {incompleta && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            La suma es menor a 100: el margen total va a quedar sin datos y solo se calcula el de la
            muestra declarada.
          </p>
        )}
        <p className="mt-3 text-[12px] text-muted-foreground">
          {CANALES.map((c) => `${c.label}: ${etiquetaEstado(estadoCanal(datos, c.id))}`).join(" · ")}
        </p>
      </div>
    </div>
  );
}

function etiquetaEstado(estado: ReturnType<typeof estadoCanal>) {
  if (estado === "declarado") return "declarado";
  if (estado === "no_aplica") return "no aplica";
  return "sin datos";
}
