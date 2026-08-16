import type { EstadoBloque } from "@/lib/calculo-diagnostico";
import { cn } from "@/lib/utils";

const COLOR: Record<EstadoBloque, string> = {
  verde: "bg-estado-verde",
  amarillo: "bg-estado-amarillo",
  rojo: "bg-estado-rojo",
  sin_datos: "bg-estado-sin-datos",
};

export const ETIQUETA_ESTADO: Record<EstadoBloque, string> = {
  verde: "En orden",
  amarillo: "A revisar",
  rojo: "Crítico",
  sin_datos: "Sin datos",
};

export function EstadoPunto({ estado, className }: { estado: EstadoBloque; className?: string }) {
  return (
    <span
      aria-label={ETIQUETA_ESTADO[estado]}
      className={cn("inline-block size-2.5 shrink-0 rounded-full", COLOR[estado], className)}
    />
  );
}
