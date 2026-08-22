/**
 * Fase 13 (paquetes y precios, decisión comercial 7, 2026-08-22):
 * confirmación manual obligatoria antes de generar la propuesta. Pantalla
 * donde se ven los tres niveles con servicios, alcances y precios; se
 * pueden ajustar cantidades, agregar o sacar servicios y cargar precios.
 * Sin tocar "Confirmar propuesta", `onConfirmar` nunca se llama: ningún
 * documento se genera a partir de esta pantalla sin esa acción explícita.
 *
 * Sólo estado local en memoria: la persistencia de la selección confirmada
 * (para que sobreviva un recargue de página y alimente el armado real del
 * PDF) requiere una columna/tabla nueva en la base — fuera de alcance de
 * este bloque (restricción permanente: no tocar la base ni migraciones).
 * Ver `docs/decisiones-pendientes.md` para el detalle.
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AlcanceServicioNivel,
  EscaleraPaquetes,
  EscaleraPaquetesConfirmada,
  NivelPaquete,
} from "@/lib/paquetes";

const ETIQUETA_UNIDAD: Record<AlcanceServicioNivel["unidad"], string> = {
  campañas_activas: "campañas activas",
  campañas: "campañas",
  piezas_por_mes: "piezas por mes",
  alcance_descrito: "alcance descrito",
};

function clonarNiveles(niveles: NivelPaquete[]): NivelPaquete[] {
  return niveles.map((n) => ({ ...n, servicios: n.servicios.map((s) => ({ ...s })) }));
}

export function ConfirmacionPaquetes({
  escalera,
  onConfirmar,
}: {
  escalera: EscaleraPaquetes;
  onConfirmar: (escaleraConfirmada: EscaleraPaquetesConfirmada) => void;
}) {
  const [niveles, setNiveles] = useState<NivelPaquete[]>(() => clonarNiveles(escalera.niveles));

  // El universo de servicios que SÍ tienen un hallazgo que los justifica:
  // el nivel más alto ya trae la unión acumulada completa (construcción
  // acumulativa del generador). Agregar un servicio en un nivel más bajo
  // sólo puede tomarlo de acá — nunca un servicio sin hallazgo detrás.
  const serviciosJustificados = useMemo(() => {
    const ultimo = escalera.niveles.at(-1);
    return ultimo ? ultimo.servicios : [];
  }, [escalera.niveles]);

  if (niveles.length === 0) {
    return (
      <EmptyState
        title="No hay hallazgos que justifiquen un paquete todavía"
        description="Ningún hallazgo de este diagnóstico quedó mapeado a un servicio. Sin un hallazgo concreto detrás, no se propone ningún nivel."
      />
    );
  }

  function actualizarServicio(
    indiceNivel: number,
    indiceServicio: number,
    cambios: Partial<AlcanceServicioNivel>,
  ) {
    setNiveles((prev) =>
      prev.map((nivel, i) =>
        i !== indiceNivel
          ? nivel
          : {
              ...nivel,
              servicios: nivel.servicios.map((s, j) =>
                j !== indiceServicio ? s : { ...s, ...cambios },
              ),
            },
      ),
    );
  }

  function quitarServicio(indiceNivel: number, indiceServicio: number) {
    setNiveles((prev) =>
      prev.map((nivel, i) =>
        i !== indiceNivel
          ? nivel
          : { ...nivel, servicios: nivel.servicios.filter((_, j) => j !== indiceServicio) },
      ),
    );
  }

  function agregarServicio(indiceNivel: number, nombreServicio: string) {
    const desdeJustificados = serviciosJustificados.find((s) => s.servicio === nombreServicio);
    if (!desdeJustificados) return;
    setNiveles((prev) =>
      prev.map((nivel, i) =>
        i !== indiceNivel || nivel.servicios.some((s) => s.servicio === nombreServicio)
          ? nivel
          : { ...nivel, servicios: [...nivel.servicios, { ...desdeJustificados }] },
      ),
    );
  }

  function actualizarPrecio(indiceNivel: number, precio: number | null) {
    setNiveles((prev) => prev.map((nivel, i) => (i !== indiceNivel ? nivel : { ...nivel, precio })));
  }

  return (
    <section className="space-y-6">
      {niveles.map((nivel, indiceNivel) => {
        const disponiblesParaAgregar = serviciosJustificados.filter(
          (s) => !nivel.servicios.some((existente) => existente.servicio === s.servicio),
        );
        return (
          <div key={nivel.id} className="rounded-lg border border-border bg-card p-6">
            <header className="flex items-center justify-between gap-4">
              <h3 className="text-[15px] font-medium text-foreground">{nivel.nombre}</h3>
              <span className="text-[12px] text-muted-foreground">Propuesta del sistema, editable</span>
            </header>

            <div className="mt-4 space-y-3">
              {nivel.servicios.map((servicio, indiceServicio) => (
                <div
                  key={servicio.servicio}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border/70 px-4 py-3"
                >
                  <span className="min-w-40 text-[14px] font-medium text-foreground">
                    {servicio.servicio}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {ETIQUETA_UNIDAD[servicio.unidad]}
                  </span>
                  {servicio.unidad === "alcance_descrito" ? (
                    <Input
                      className="h-9 flex-1 text-[13px]"
                      value={servicio.descripcion ?? ""}
                      onChange={(e) =>
                        actualizarServicio(indiceNivel, indiceServicio, {
                          descripcion: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      className="h-9 w-24 text-[13px]"
                      value={servicio.cantidad ?? 0}
                      onChange={(e) =>
                        actualizarServicio(indiceNivel, indiceServicio, {
                          cantidad: Number(e.target.value) || 0,
                        })
                      }
                    />
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    justificado por: {servicio.hallazgoIds.join(", ")}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => quitarServicio(indiceNivel, indiceServicio)}
                  >
                    Quitar
                  </Button>
                </div>
              ))}
            </div>

            {disponiblesParaAgregar.length > 0 && (
              <div className="mt-3">
                <Select onValueChange={(v) => agregarServicio(indiceNivel, v)}>
                  <SelectTrigger className="h-9 w-64 text-[13px]">
                    <SelectValue placeholder="Agregar servicio ya justificado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {disponiblesParaAgregar.map((s) => (
                      <SelectItem key={s.servicio} value={s.servicio}>
                        {s.servicio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
              <label className="text-[13px] text-muted-foreground" htmlFor={`precio-${nivel.id}`}>
                Precio del nivel
              </label>
              <Input
                id={`precio-${nivel.id}`}
                type="number"
                min={0}
                placeholder="Sin cargar"
                className="h-9 w-40 text-[13px]"
                value={nivel.precio ?? ""}
                onChange={(e) =>
                  actualizarPrecio(indiceNivel, e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        size="lg"
        className="h-11"
        onClick={() => onConfirmar({ niveles, confirmado: true })}
      >
        Confirmar propuesta
      </Button>
    </section>
  );
}
